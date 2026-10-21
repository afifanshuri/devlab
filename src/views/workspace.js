import { courses } from "../../curriculum.js";
import * as store from "../../database.js";
import { state } from "../state.js";
import { $, esc, shell, toast } from "../ui.js";
import { callRunner, localRunner } from "../services/runner.js";
let active;
export async function flushDraft() {
  const old = active;
  active = null;
  if (!old) return;
  if ($("#code")) {
    await store.saveLesson(old.key, $("#code").value);
    state.records = store.progress();
  }
  if (old.session)
    await callRunner("stop", { id: old.session }).catch(() => {});
}
export function lesson(courseId, idx) {
  const course = courses.find((c) => c.id === courseId),
    index = Number(idx),
    task = course?.lessons[index];
  if (!task) {
    shell('<h1>Exercise not found</h1><a href="#labs">Back to labs</a>');
    return;
  }
  const key = `${course.id}:${index}`,
    context = { key, session: null, lastSaved: null, busy: false };
  active = context;
  state.current = { id: key };
  store.setting("lastLab", course.id).catch(() => {});
  const available = localRunner();
  shell(
    /* HTML */ `<div class="lab-heading">
        <div>
          <div class="eyebrow">${esc(course.track)} / REAL PRACTICE</div>
          <h1>${esc(task.title)}</h1>
          <p class="sub">
            Exercise ${index + 1} of ${course.lessons.length} ·
            ${esc(task.engine.toUpperCase())}
          </p>
        </div>
        <a class="secondary" href="#labs">← All labs</a>
      </div>
      <div class="lab-grid">
        <section class="instructions">
          <h2>Your mission</h2>
          <p>${esc(task.task)}</p>
          <h2>How it works</h2>
          <p>${esc(task.concept)}</p>
          <p>
            Start the lab, edit and save your file, then run shell commands.
            “Check task” validates actual program results or container state.
          </p>
          <button class="secondary" id="hint">Get a hint</button>
          <button class="text-link" id="solution">Reference solution</button>
          <div id="help-content"></div>
          <div id="completion">
            ${state.records[key]?.completed
              ? '<div class="complete-banner">✓ Completed</div>'
              : ""}
          </div>
          <div class="hint">
            ${available
              ? "Real disposable container · no host folders mounted · network disabled · commands have a 10-second limit."
              : "To execute this lab: start Docker Desktop, run npm run setup:labs and npm start in the project folder, then open http://127.0.0.1:5173. GitHub Pages hosts the catalog; it cannot execute processes."}
          </div>
        </section>
        <section class="workspace">
          <div class="editor-bar">
            <span>${esc(task.filename)}</span
            ><span id="runner-state">NOT STARTED</span>
          </div>
          <textarea
            id="code"
            class="editor"
            spellcheck="false"
            aria-label="Code editor"
            style="min-height:220px"
          >
${esc(state.records[key]?.draft ?? task.starter)}</textarea
          >
          <div class="workspace-actions">
            <button class="secondary" id="start" ${available ? "" : "disabled"}>
              Start lab</button
            ><button class="secondary" id="save">Save file</button
            ><button class="secondary" id="read">Reload file</button
            ><button class="secondary" id="run">
              ${task.engine === "java" ? "Compile" : "Run file"}
            </button>
          </div>
          <div
            class="terminal-log"
            id="terminal"
            role="log"
            aria-label="Terminal output"
            style="min-height:140px;max-height:300px"
          >
            Start a lab to connect to a real container. Commands run one at a
            time. Full-screen editors and interactive prompts are not supported.
          </div>
          <form id="terminal-form" class="terminal-form">
            <label for="command">$</label
            ><input
              id="command"
              autocomplete="off"
              spellcheck="false"
              aria-label="Terminal command"
              placeholder="${task.engine === "java"
                ? "javac Main.java"
                : task.engine === "postgres"
                  ? "psql -U postgres -d lab -c &quot;SELECT * FROM employees;&quot;"
                  : "ls -la"}"
            /><button class="secondary" type="submit">Run ↵</button>
          </form>
          <div class="workspace-actions">
            <button class="secondary" id="reset">Reset lab</button
            ><button class="primary" id="check">Check task →</button>
          </div>
          <div id="output" class="console" role="status" aria-live="polite">
            ${available
              ? "Ready to connect."
              : "Execution environment not available on this page."}
          </div>
        </section>
      </div>
      <div class="task-nav">
        <a
          class="secondary"
          href="${index ? `#lab/${course.id}/${index - 1}` : "#labs"}"
          >← Previous</a
        ><a
          class="secondary"
          href="${index + 1 < course.lessons.length
            ? `#lab/${course.id}/${index + 1}`
            : "#progress"}"
          >${index + 1 < course.lessons.length
            ? "Next exercise →"
            : "View progress →"}</a
        >
      </div>`,
  );
  const live = () => active === context;
  const log = (text) => {
    if (live()) {
      $("#terminal").textContent += text;
      $("#terminal").scrollTop = $("#terminal").scrollHeight;
    }
  };
  const ensure = async () => {
    if (context.session) return;
    const result = await callRunner("start", { lessonId: key });
    if (!live()) {
      await callRunner("stop", { id: result.id });
      throw Error("Lab navigation changed.");
    }
    context.session = result.id;
    context.lastSaved = task.starter;
    $("#runner-state").textContent = "CONNECTED · " + task.engine.toUpperCase();
    log(result.output);
  };
  const save = async () => {
    await ensure();
    const source = $("#code").value;
    if (source !== context.lastSaved) {
      await callRunner("write", {
        id: context.session,
        filename: task.filename,
        source,
      });
      context.lastSaved = source;
    }
    await store.saveLesson(key, source);
    state.records = store.progress();
  };
  const action = (work) => async (e) => {
    e?.preventDefault();
    if (context.busy) return;
    context.busy = true;
    const buttons = [...document.querySelectorAll(".workspace button")];
    buttons.forEach((b) => (b.disabled = true));
    try {
      await work();
    } catch (error) {
      if (live()) {
        $("#output").textContent = error.message;
        $("#output").className = "console error";
      }
    } finally {
      context.busy = false;
      if (live()) {
        buttons.forEach((b) => (b.disabled = false));
        $("#start").disabled = !available;
      }
    }
  };
  $("#start").onclick = action(ensure);
  $("#save").onclick = action(async () => {
    await save();
    log(`Saved ${task.filename}\n`);
  });
  $("#read").onclick = action(async () => {
    await ensure();
    const result = await callRunner("read", {
      id: context.session,
      filename: task.filename,
    });
    if (live()) {
      $("#code").value = result.output;
      context.lastSaved = result.output;
    }
  });
  const run = async (command) => {
    await ensure();
    log("$ " + command + "\n");
    const r = await callRunner("command", { id: context.session, command });
    log(r.output + `\n[exit ${r.code}]\n`);
  };
  $("#run").onclick = action(async () => {
    await save();
    await run(
      task.engine === "java"
        ? "javac Main.java"
        : task.engine === "postgres"
          ? "psql -X -v ON_ERROR_STOP=1 -U postgres -d lab -f /workspace/solution.sql"
          : task.engine === "oracle"
            ? "printf 'ALTER SESSION SET CONTAINER=FREEPDB1;\\n@/workspace/solution.sql\\nEXIT\\n' | sqlplus -s / as sysdba"
            : "bash /workspace/notes.sh",
    );
  });
  let history = [],
    cursor = 0;
  $("#terminal-form").onsubmit = action(async () => {
    const command = $("#command").value.trim();
    if (!command) return;
    history.push(command);
    cursor = history.length;
    $("#command").value = "";
    await run(command);
  });
  $("#command").onkeydown = (e) => {
    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      cursor = Math.max(
        0,
        Math.min(history.length, cursor + (e.key === "ArrowUp" ? -1 : 1)),
      );
      e.target.value = history[cursor] || "";
    }
  };
  $("#code").onkeydown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      e.target.setRangeText(
        "  ",
        e.target.selectionStart,
        e.target.selectionEnd,
        "end",
      );
    }
  };
  $("#check").onclick = action(async () => {
    await save();
    const r = await callRunner("check", { id: context.session });
    log(r.output);
    if (!live()) return;
    $("#output").textContent = r.passed
      ? "✓ All task tests passed."
      : "Tests failed. Read the terminal output, fix your solution and try again.";
    $("#output").className = "console " + (r.passed ? "success" : "error");
    if (r.passed) {
      await store.saveLesson(key, $("#code").value, true);
      state.records = store.progress();
      $("#completion").innerHTML =
        '<div class="complete-banner">✓ Exercise complete. Progress saved.</div>';
      toast("Task passed with real runtime checks.");
    }
  });
  $("#reset").onclick = action(async () => {
    if (context.session) await callRunner("stop", { id: context.session });
    context.session = null;
    context.lastSaved = null;
    $("#code").value = task.starter;
    $("#terminal").textContent = "";
    await store.saveLesson(key, task.starter);
    await ensure();
  });
  $("#hint").onclick = () =>
    ($("#help-content").innerHTML =
      `<div class="hint">${esc(task.hint)}</div>`);
  $("#solution").onclick = () =>
    ($("#help-content").innerHTML =
      `<div class="hint"><strong>Reference solution</strong><pre style="white-space:pre-wrap;font:11px/1.7 monospace">${esc(task.solution)}</pre></div>`);
}
