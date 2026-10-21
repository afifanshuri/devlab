import { courses, allLessons } from "../../curriculum.js?v=missions-2";
import * as store from "../../database.js";
import { state } from "../state.js";
import { $, esc, shell, toast } from "../ui.js";
import { callRunner, localRunner } from "../services/runner.js";
import {
  starterFiles,
  readDraft,
  writeDraft,
  solutionFiles,
  hasChanges,
} from "../workspace-files.js";
let active;
export async function flushDraft() {
  const old = active;
  active = null;
  if (!old) return;
  clearTimeout(old.saveTimer);
  if ($("#code")) {
    old.files[old.filename] = $("#code").value;
    await store.saveLesson(old.key, writeDraft(old.task, old.files));
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
    context = {
      key,
      task,
      filename: task.filename,
      files: readDraft(task, state.records[key]?.draft),
      session: null,
      lastSaved: {},
      busy: false,
    };
  active = context;
  context.initialSource = writeDraft(task, context.files);
  state.current = { id: key };
  store.setting("lastLab", course.id).catch(() => {});
  const available = localRunner();
  const prerequisites = (task.prerequisites || [])
    .map((id) => allLessons.find((l) => l.id === id))
    .filter(Boolean);
  const nextStep = allLessons.find(
    (l) =>
      l.prerequisites?.includes(key) &&
      l.track === course.track &&
      l.engine !== "oracle",
  );
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
          <p class="mission-story">${esc(task.mission || task.task)}</p>
          <h2>Your goal</h2>
          <p class="mission-goal">${esc(task.goal || task.task)}</p>
          ${task.example
            ? `<div class="mission-example"><strong>For example</strong><pre>${esc(task.example)}</pre></div>`
            : ""}
          <h2>Acceptance criteria</h2>
          <ul class="mission-criteria">
            ${(task.requirements || [task.task])
              .map((item) => `<li>${esc(item)}</li>`)
              .join("")}
          </ul>
          ${task.interview
            ? `<h2>Interview discussion</h2><p>${esc(task.interview)}</p>`
            : ""}
          <details class="concept-note">
            <summary>Explore the concept</summary>
            <p>${esc(task.concept)}</p>
          </details>
          <div class="learning-scaffold">
            <h3>What you’ll practise</h3>
            <ul>
              ${(task.learn || [])
                .map((item) => `<li>${esc(item)}</li>`)
                .join("")}
            </ul>
            ${prerequisites.length
              ? `<h3>Builds on</h3>${prerequisites.map((l) => `<a class="text-link" href="#lab/${l.course}/${l.index}">${state.records[l.id]?.completed ? "✓ " : ""}${esc(l.title)}</a>`).join("<br>")}`
              : "<p>Your starting point in this track.</p>"}
            ${task.reuseNote ? `<p>${esc(task.reuseNote)}</p>` : ""}
          </div>
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
            <div
              id="file-tabs"
              class="file-tabs"
              role="tablist"
              aria-label="Exercise files"
            ></div>
            <div class="editor-bar">
              <span id="active-filename">${esc(task.filename)}</span
              ><span>${esc(task.engine.toUpperCase())}</span>
            </div>
            <div id="source-panel" role="tabpanel" aria-label="Source code">
              <textarea
                id="code"
                class="editor"
                spellcheck="false"
                aria-label="Code editor"
                style="min-height:220px"
              >
${esc(context.files[context.filename])}</textarea
              >
            </div>
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
                  ? "javac *.java"
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
            : nextStep
              ? `#lab/${nextStep.course}/${nextStep.index}`
              : "#progress"}"
          >${index + 1 < course.lessons.length
            ? "Next exercise →"
            : nextStep
              ? "Next stage →"
              : "View progress →"}</a
        >
      </div>`,
  );
  const live = () => active === context;
  const capture = () => {
    context.files[context.filename] = $("#code").value;
  };
  const draft = () => {
    capture();
    return writeDraft(task, context.files);
  };
  const hasAnswer = () => {
    capture();
    return hasChanges(task, context.files);
  };
  const renderTabs = () => {
    $("#file-tabs").innerHTML = Object.keys(context.files)
      .map(
        (name) =>
          `<button type="button" role="tab" aria-controls="source-panel" tabindex="${name === context.filename ? 0 : -1}" aria-selected="${name === context.filename}" data-file="${esc(name)}">${esc(name)}</button>`,
      )
      .join("");
    $("#active-filename").textContent = context.filename;
    $("#code").setAttribute?.("aria-label", "Code editor: " + context.filename);
  };
  $("#file-tabs").onclick = (event) => {
    const name = event.target.closest("[data-file]")?.dataset.file;
    if (context.busy || !Object.hasOwn(context.files, name)) return;
    capture();
    context.filename = name;
    $("#code").value = context.files[name];
    renderTabs();
    updateCheckState();
  };
  $("#file-tabs").onkeydown = (event) => {
    if (
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) ||
      context.busy
    )
      return;
    event.preventDefault();
    const names = Object.keys(context.files),
      current = names.indexOf(context.filename);
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? names.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + names.length) %
            names.length;
    capture();
    context.filename = names[index];
    $("#code").value = context.files[context.filename];
    renderTabs();
    updateCheckState();
    document.querySelector('#file-tabs [aria-selected="true"]').focus();
  };
  renderTabs();
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
      context.lastSaved = starterFiles(task);
      if (result.reused) {
        const unchanged = draft() === context.initialSource;
        const remote = {};
        for (const filename of Object.keys(context.files)) {
          const file = await callRunner("read", { id: result.id, filename });
          if (!live()) throw Error("Lab navigation changed.");
          remote[filename] = file.output;
        }
        if (state.records[key]?.draft == null && unchanged) {
          context.files = remote;
          $("#code").value = remote[context.filename];
        }
        context.lastSaved = { ...remote };
      }
    }
    $("#runner-state").textContent = "CONNECTED · " + task.engine.toUpperCase();
    if (changed) log(result.output);
  };
  const save = async () => {
    await ensure();
    capture();
    for (const [filename, source] of Object.entries(context.files)) {
      if (source !== context.lastSaved[filename]) {
        await callRunner("write", { id: context.session, filename, source });
        context.lastSaved[filename] = source;
      }
    }
    await store.saveLesson(key, draft());
    state.records = store.progress();
  };
  const action = (work) => async (e) => {
    e?.preventDefault();
    if (context.busy) return;
    context.busy = true;
    clearTimeout(context.saveTimer);
    $("#code").readOnly = true;
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
        $("#code").readOnly = false;
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
    clearTimeout(context.saveTimer);
    context.saveTimer = setTimeout(async () => {
      if (!live()) return;
      try {
        await store.saveLesson(key, draft());
        state.records = store.progress();
      } catch {
        toast("Draft could not be saved locally. Keep this tab open.");
      }
    }, 350);
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
      $("#code").oninput();
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
      context.lastSaved = {};
      $("#runner-state").textContent = "PASSED · CONTAINER DELETED";
      await store.saveLesson(key, draft(), true);
      state.records = store.progress();
      $("#completion").innerHTML =
        '<div class="complete-banner">✓ Exercise complete. Progress saved.</div>';
      toast("Task passed with real runtime checks.");
    }
  });
  $("#reset").onclick = action(async () => {
    context.files = starterFiles(task);
    $("#code").value = context.files[context.filename];
    await store.saveLesson(key, draft());
    if (available) {
      const result = await callRunner("reset", { lessonId: key });
      context.session = result.id;
      context.lastSaved = result.id ? starterFiles(task) : {};
    }
    log("Answer reset. Other container files and state are unchanged.\n");
  });
  $("#hint").onclick = () =>
    ($("#help-content").innerHTML =
      `<div class="hint">${esc(task.hint)}</div>`);
  $("#solution").onclick = () =>
    ($("#help-content").innerHTML =
      `<div class="hint"><strong>Reference solution</strong><pre style="white-space:pre-wrap;font:11px/1.7 monospace">${esc(
        Object.entries(solutionFiles(task))
          .map(([name, body]) => `// ${name}\n${body}`)
          .join("\n\n"),
      )}</pre></div>`);
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
