import { renderExerciseBrief } from "./exercise-brief.js";
import {
  groupPicker,
  groupNavigation,
  bindGroupPicker,
} from "./group-navigation.js";
import * as store from "../../database.js";
import { state } from "../state.js";
import { $, esc, shell, toast } from "../ui.js";
import {
  readWrittenAnswer,
  editWrittenAnswer,
  checkWrittenAnswer,
} from "../written-answer.js";

export function mountWritten(context, course, index, live) {
  const { task, key } = context;
  let draft = readWrittenAnswer(state.records[key]?.draft);
  if (draft.submittedAnswer !== null)
    draft.passed = checkWrittenAnswer(task, draft.answer);
  let saving = Promise.resolve(),
    busy = false;
  const save = () => {
    const snapshot = JSON.stringify(draft),
      passed = draft.passed;
    saving = saving
      .catch(() => {})
      .then(async () => {
        await store.saveLesson(key, snapshot, passed);
        state.records = store.progress();
      });
    return saving;
  };
  context.saveState = save;
  const scheduleSave = () => {
    clearTimeout(context.saveTimer);
    context.saveTimer = setTimeout(
      () =>
        save().catch(() => {
          if (live())
            toast(
              "Answer could not be saved. Keep this tab open and try Save answer.",
            );
        }),
      350,
    );
  };
  shell(`<div class="lab-heading"><div><div class="eyebrow">${esc(course.track.toUpperCase())} / INTERVIEW PRACTICE</div>
    <h1>${esc(task.title)}</h1><p class="sub">Short answer · Automatically checked · No Docker required</p></div>
    <a class="secondary" href="#labs">← All groups</a></div>
    ${groupPicker(key)}
    <div class="lab-grid ${task.healthCheck ? "health-workspace" : ""}"><section class="instructions">
      ${renderExerciseBrief(task, key)}
    </section><section class="workspace written-workspace" aria-label="Answer workspace">
      <label for="written-answer"><strong>Your answer</strong></label>
      <textarea id="written-answer" class="written-answer" rows="4" maxlength="512" spellcheck="false" placeholder="Enter only the requested answer">${esc(draft.answer)}</textarea>
      <p class="muted">Answers autosave in this browser. Follow the question's format; maximum 512 characters.</p>
      <button class="secondary" id="written-hint">Get a hint</button><p id="written-hint-text"></p>
      <div id="written-completion"></div>
      <div class="workspace-actions"><button class="secondary" id="written-save">Save answer</button><button class="secondary" id="written-reset">Reset answer</button><button class="primary" id="written-submit">Check answer →</button></div>
      <p id="written-status" role="status" aria-live="polite"></p>
      <section id="written-review" aria-label="Answer feedback"></section>
    </section></div>
    ${groupNavigation(key)}`);
  bindGroupPicker();
  const status = (message) => {
    if (live()) $("#written-status").textContent = message;
  };
  const renderResult = () => {
    $("#written-answer").readOnly = busy;
    $("#written-reset").disabled = busy;
    $("#written-save").disabled = busy;
    $("#written-submit").disabled =
      busy || !draft.answer.trim() || draft.answer.length > 512;
    $("#written-completion").innerHTML = draft.passed
      ? '<div class="complete-banner">✓ Correct answer</div>'
      : "";
    $("#written-review").innerHTML =
      draft.submittedAnswer === null
        ? ""
        : `
      <p class="console ${draft.passed ? "success" : "error"}">${draft.passed ? "✓ Correct." : "Incorrect. Check the requested format and try again."}</p>
      ${draft.passed || draft.revealed ? `<h2>Reference answer</h2><pre>${esc(task.answers[0])}</pre><p>${esc(task.explanation)}</p>` : '<button class="secondary" id="written-reference">Show answer</button>'}`;
    if (!draft.passed && draft.submittedAnswer !== null && !draft.revealed)
      $("#written-reference").onclick = () => {
        draft.revealed = true;
        renderResult();
        scheduleSave();
      };
  };
  $("#written-answer").oninput = (event) => {
    draft = editWrittenAnswer(draft, event.target.value);
    renderResult();
    status("Draft changed. Check your answer when ready.");
    scheduleSave();
  };
  $("#written-submit").onclick = async () => {
    if (busy || !draft.answer.trim() || draft.answer.length > 512) return;
    busy = true;
    draft.submittedAnswer = draft.answer;
    draft.passed = checkWrittenAnswer(task, draft.answer);
    clearTimeout(context.saveTimer);
    renderResult();
    try {
      await save();
      status(
        draft.passed
          ? "Correct answer and progress saved."
          : "Answer saved. Try again or show the reference answer.",
      );
    } catch {
      status(
        "Answer checked, but saving failed. Please use Save answer to retry.",
      );
    } finally {
      busy = false;
      if (live()) renderResult();
    }
  };
  $("#written-save").onclick = async () => {
    try {
      await save();
      status("Answer saved in this browser.");
    } catch {
      status("Save failed. Keep this tab open and try again.");
    }
  };
  $("#written-reset").onclick = () => {
    draft = editWrittenAnswer(draft, "");
    $("#written-answer").value = "";
    renderResult();
    status("Answer and current result cleared.");
    scheduleSave();
  };
  $("#written-hint").onclick = () => {
    $("#written-hint-text").textContent = task.hint;
  };
  renderResult();
}
