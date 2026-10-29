import { renderExerciseBrief } from "./exercise-brief.js?v=mission-roles-1";
import {
  groupPicker,
  groupNavigation,
  bindGroupPicker,
} from "./group-navigation.js";
import { courses } from "../../curriculum.js?v=mission-roles-1";
import * as store from "../../database.js";
import { state } from "../state.js";
import { $, esc, shell, toast } from "../ui.js";
import { callRunner, localRunner } from "../services/runner.js";
import { openCodeEditor } from "../services/code-editor.js";
import { editKey } from "../editor-input.js";
import { createTerminalDisplay } from "../services/terminal-display.js";
import { linuxPane, mountLinux } from "./linux-workspace.js?v=mission-roles-1";
import { mountWritten } from "./written-workspace.js?v=mission-roles-1";
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
  clearTimeout(old.stateTimer);
  await old.saveState?.().catch(() => {});
  old.terminal?.dispose();
  old.editor?.dispose();
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
  store.setting("lastExercise", key).catch(() => {});
  if (task.type === "written") {
    store.setting("lastLab", course.id).catch(() => {});
    return mountWritten(context, course, index, () => active === context);
  }
  context.initialSource = writeDraft(task, context.files);
  store.setting("lastLab", course.id).catch(() => {});
  const available = localRunner();
  const interactive = task.engine === "linux";
  shell(
    /* HTML */ `<div class="lab-heading">
        <div>
          <div class="eyebrow">${esc(course.track)} / REAL PRACTICE</div>
          <h1>${esc(task.title)}</h1>
          <p class="sub">
            Code or terminal exercise · ${esc(task.engine.toUpperCase())}
          </p>
        </div>
        <a class="secondary" href="#labs">← All groups</a>
      </div>
      ${groupPicker(key)}
      <div class="lab-grid">
        <section class="instructions">
          ${renderExerciseBrief(task, key)}
        </section>
        <section
          class="workspace exercise-workspace ${interactive
            ? "linux-workspace"
            : ""}"
        >
          ${interactive
            ? linuxPane(available)
            : `<section class="code-pane" aria-label="Code workspace">
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
              <button class="secondary" id="save-state">Save state</button>
              <button class="secondary" id="reset">Reset lab</button
              ><button class="primary" id="check" disabled>
                Check answer →
              </button>
            </div>
            <div id="output" class="console" role="status" aria-live="polite">
              ${
                available
                  ? "Starting your exercise environment…"
                  : "Execution environment not available on this page."
              }
            </div>
          </section>
          <section class="terminal-pane" aria-label="Output terminal">
            <div class="workspace-section-header">
              <strong>&gt;_ OUTPUT TERMINAL</strong
              ><span id="runner-state">CONNECTING…</span>
            </div>
            <div
              class="output-terminal"
              id="terminal"
              role="log"
              aria-label="Terminal output"
            >
              Compile errors, query output and test results appear here.
              Write and submit your answer in the code editor above.
            </div>
          </section>`}
          <div class="workspace-help">
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
                ? interactive
                  ? "Interactive Linux container · vim included · no host folders mounted · network disabled · expires after one idle hour."
                  : "Local exercise runtime · no host folders mounted · network disabled · commands have a 10-second limit (Spring checks: 45 seconds)."
                : "To execute this lab: start Docker Desktop, run npm run setup:labs and npm start in the project folder, then open http://127.0.0.1:5173. GitHub Pages hosts the catalog; it cannot execute processes."}
            </div>
          </div>
        </section>
      </div>
      ${groupNavigation(key)}`,
  );
  bindGroupPicker();
  const live = () => active === context;
  const help = () => {
    $("#hint").onclick = () =>
      ($("#help-content").innerHTML =
        `<div class="hint">${esc(task.hint)}</div>`);
    $("#solution").onclick = () =>
      ($("#help-content").innerHTML =
        `<div class="hint"><strong>Reference solution</strong><pre>${esc(
          Object.entries(solutionFiles(task))
            .map(([name, body]) => `// ${name}\n${body}`)
            .join("\n\n"),
        )}</pre></div>`);
  };
  if (interactive) {
    help();
    return mountLinux(context, available, live);
  }
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
    context.editor?.showFile(context.filename, context.files[context.filename]);
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
  const terminalElement = $("#terminal");
  let output =
    "Compile errors, query output and test results appear here.\nWrite your answer in the code editor above.\n\n";
  // Plain text remains usable if the optional terminal assets cannot load.
  terminalElement.textContent = output;
  const log = (text) => {
    if (!live()) return;
    if (context.terminal) context.terminal.write(text);
    else {
      output = (output + text).slice(-128000);
      terminalElement.textContent = output;
      terminalElement.scrollTop = terminalElement.scrollHeight;
    }
  };
  if (terminalElement.isConnected) {
    createTerminalDisplay(terminalElement, { readOnly: true })
      .then((display) => {
        if (!live()) {
          display.dispose();
          return;
        }
        context.terminal = display;
        display.write(output);
        output = "";
      })
      .catch(() => {
        if (live()) terminalElement.textContent = output;
      });
  }
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
          context.editor?.showFile(context.filename, remote[context.filename]);
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
    context.editor?.setReadOnly(true);
    const buttons = [...document.querySelectorAll(".workspace button")];
    buttons.forEach((b) => (b.disabled = true));
    try {
      await work();
    } catch (error) {
      if (live()) {
        log(error.message + "\n");
        $("#output").textContent = error.message;
        $("#output").className = "console error";
      }
    } finally {
      context.busy = false;
      if (live()) {
        $("#code").readOnly = false;
        context.editor?.setReadOnly(false);
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
  $("#save-state").onclick = async () => {
    try {
      await store.saveLesson(key, draft());
      state.records = store.progress();
      toast("Answer files saved in this browser.");
    } catch {
      toast("Save failed. Keep this tab open and try again.");
    }
  };
  $("#code").onkeydown = (e) => editKey(e, () => $("#code").oninput());
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
      $("#runner-state").textContent = r.runtimeRetained
        ? "PASSED · RUNTIME READY"
        : "PASSED · CONTAINER DELETED";
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
    context.editor?.showFile(context.filename, context.files[context.filename]);
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
  const source = $("#code");
  if (source.isConnected) {
    openCodeEditor(
      source,
      context.filename,
      task.engine === "java" ? "java" : "sql",
    )
      .then((editor) => {
        if (!live()) {
          editor.dispose();
          return;
        }
        context.editor = editor;
        editor.showFile(context.filename, context.files[context.filename]);
        editor.setReadOnly(context.busy);
      })
      .catch(() => {
        if (live())
          toast(
            "Enhanced editor could not load. The plain editor is still available.",
          );
      });
  }
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
