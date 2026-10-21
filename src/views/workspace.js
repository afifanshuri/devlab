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
  context.initialSource = state.records[key]?.draft ?? task.starter;
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
            The lab connects automatically. Write your answer, then select
            “Check answer” to compile, run, and validate it against internal
            test cases.
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
        <section class="workspace exercise-workspace">
          <section class="code-pane" aria-label="Code workspace">
            <div class="workspace-section-header">
              <strong>&lt;/&gt; CODE EDITOR</strong
              ><span>Write your answer here</span>
            </div>
            <div class="editor-bar">
              <span>${esc(task.filename)}</span
              ><span>${esc(task.engine.toUpperCase())}</span>
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
              <button class="secondary" id="reset">Reset lab</button
              ><button class="primary" id="check" disabled>
                Check answer →
              </button>
            </div>
            <div id="output" class="console" role="status" aria-live="polite">
              ${available
                ? "Starting your exercise environment…"
                : "Execution environment not available on this page."}
            </div>
          </section>
          <section class="terminal-pane" aria-label="Shell terminal">
            <div class="workspace-section-header">
              <strong>&gt;_ TERMINAL</strong
              ><span id="runner-state">CONNECTING…</span>
            </div>
            <div
              class="terminal-log"
              id="terminal"
              role="log"
              aria-label="Terminal output"
              style="min-height:140px;max-height:300px"
            >
              The workspace connects automatically. Commands run one at a time.
              Full-screen editors and interactive prompts are not supported.
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
          </section>
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
  const hasAnswer = () => {
    const source = $("#code").value.trim();
    return source.length > 0 && source !== task.starter.trim();
  };
  const updateCheckState = () => {
    if (live())
      $("#check").disabled = !available || context.busy || !hasAnswer();
  };
  const log = (text) => {
    if (live()) {
      $("#terminal").textContent += text;
      $("#terminal").scrollTop = $("#terminal").scrollHeight;
    }
  };
  const ensure = async () => {
    const result = await callRunner("start", { lessonId: key });
    if (!live()) {
      throw Error("Lab navigation changed.");
    }
    const changed = context.session !== result.id;
    context.session = result.id;
    if (changed) {
      context.lastSaved = task.starter;
      if (result.reused) {
        const file = await callRunner("read", {
          id: result.id,
          filename: task.filename,
        });
        if (!live()) throw Error("Lab navigation changed.");
        if (
          state.records[key]?.draft == null &&
          $("#code").value === context.initialSource
        )
          $("#code").value = file.output;
        context.lastSaved = file.output;
      }
    }
    $("#runner-state").textContent = "CONNECTED · " + task.engine.toUpperCase();
    if (changed) log(result.output);
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
        updateCheckState();
      }
    }
  };
  let lastActivity = 0;
  const noteActivity = () => {
    if (!available || Date.now() - lastActivity < 60000) return;
    lastActivity = Date.now();
    callRunner("touch", { lessonId: key }).catch(() => {});
  };
  $("#code").oninput = () => {
    updateCheckState();
    noteActivity();
  };
  $("#command").oninput = noteActivity;
  const run = async (command) => {
    await ensure();
    log("$ " + command + "\n");
    const r = await callRunner("command", { id: context.session, command });
    log(r.output + `\n[exit ${r.code}]\n`);
  };
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
      updateCheckState();
    }
  };
  $("#check").onclick = action(async () => {
    if (!hasAnswer()) return;
    await save();
    const r = await callRunner("check", { id: context.session });
    log(r.output);
    if (!live()) return;
    $("#output").textContent = r.passed
      ? "✓ All task tests passed."
      : "Tests failed. Read the terminal output, fix your solution and try again.";
    $("#output").className = "console " + (r.passed ? "success" : "error");
    if (r.passed) {
      context.session = null;
      context.lastSaved = null;
      $("#runner-state").textContent = "PASSED · CONTAINER DELETED";
      await store.saveLesson(key, $("#code").value, true);
      state.records = store.progress();
      $("#completion").innerHTML =
        '<div class="complete-banner">✓ Exercise complete. Progress saved.</div>';
      toast("Task passed with real runtime checks.");
    }
  });
  $("#reset").onclick = action(async () => {
    $("#code").value = task.starter;
    await store.saveLesson(key, task.starter);
    if (available) {
      const result = await callRunner("reset", { lessonId: key });
      context.session = result.id;
      context.lastSaved = result.id ? task.starter : null;
    }
    log("Answer reset. Other container files and state are unchanged.\n");
  });
  $("#hint").onclick = () =>
    ($("#help-content").innerHTML =
      `<div class="hint">${esc(task.hint)}</div>`);
  $("#solution").onclick = () =>
    ($("#help-content").innerHTML =
      `<div class="hint"><strong>Reference solution</strong><pre style="white-space:pre-wrap;font:11px/1.7 monospace">${esc(task.solution)}</pre></div>`);
  if (available) {
    return action(async () => {
      await ensure();
      if (live())
        $("#output").textContent =
          "Ready. Write your answer, then select Check answer.";
    })();
  } else {
    $("#runner-state").textContent = "LOCAL RUNNER REQUIRED";
  }
}
