import * as store from "../../database.js";
import { state } from "../state.js";
import { $, esc, shell, toast } from "../ui.js";
import {
  readWrittenAnswer,
  editWrittenAnswer,
  canCompleteReview,
} from "../written-answer.js";

export function mountWritten(context, course, index, live) {
  const { task, key } = context;
  let draft = readWrittenAnswer(state.records[key]?.draft, task.rubric.length);
  let saving = Promise.resolve();
  const save = (completed = false) => {
    const snapshot = JSON.stringify(draft);
    saving = saving
      .catch(() => {})
      .then(async () => {
        await store.saveLesson(key, snapshot, completed);
        state.records = store.progress();
      });
    return saving;
  };
  context.saveState = () => save();
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
  shell(`<div class="lab-heading"><div><div class="eyebrow">LINUX / WRITTEN INTERVIEW PRACTICE</div>
    <h1>${esc(task.title)}</h1><p class="sub">Question ${index + 1} of ${course.lessons.length} · Self-reviewed · No Docker required</p></div>
    <a class="secondary" href="#labs">← All labs</a></div>
    <div class="lab-grid"><section class="instructions">
      <h2>The scenario</h2><p class="mission-story">${esc(task.mission)}</p>
      <h2>Your question</h2><p class="mission-goal">${esc(task.goal)}</p>
      <p>Explain your reasoning in your own words. Include commands if they help, but no commands are executed here.</p>
      <button class="secondary" id="written-hint">Get a hint</button><p id="written-hint-text"></p>
      <div class="hint">Submit your answer to reveal reference key points. Compare your reasoning and mark the points you covered. This is self-review, not automatic grading.</div>
      <div id="written-completion">${state.records[key]?.completed ? '<div class="complete-banner">✓ Previously self-reviewed</div>' : ""}</div>
    </section><section class="workspace written-workspace" aria-label="Written answer workspace">
      <label for="written-answer"><strong>Your answer</strong></label>
      <textarea id="written-answer" class="written-answer" rows="16" maxlength="16000" placeholder="Explain what happens, what you would investigate, and why…">${esc(draft.answer)}</textarea>
      <p class="muted">Answers autosave in this browser. Maximum 16,000 characters.</p>
      <div class="workspace-actions"><button class="secondary" id="written-save">Save answer</button><button class="secondary" id="written-reset">Reset answer</button><button class="primary" id="written-submit">Submit for self-review →</button></div>
      <p id="written-status" role="status" aria-live="polite"></p>
      <section id="written-review" aria-label="Reference answer and self-review"></section>
    </section></div>
    <nav class="task-nav" aria-label="Interview questions"><a class="secondary" href="${index ? `#lab/${course.id}/${index - 1}` : "#labs"}">← Previous</a>
    <a class="secondary" href="${index + 1 < course.lessons.length ? `#lab/${course.id}/${index + 1}` : "#progress"}">${index + 1 < course.lessons.length ? "Next question →" : "View progress →"}</a></nav>`);
  const status = (message) => {
    if (live()) $("#written-status").textContent = message;
  };
  const renderReview = () => {
    $("#written-submit").disabled = !draft.answer.trim();
    $("#written-review").innerHTML = draft.reviewing
      ? `<h2>Reference answer · key points</h2>
      <p>Equivalent correct explanations are welcome. Tick each point only if your answer covers it; revise your answer if something is missing.</p>
      ${task.rubric.map((point, i) => `<label class="review-point"><input type="checkbox" data-point="${i}" ${draft.checked[i] ? "checked" : ""}><span>${esc(point)}</span></label>`).join("")}
      <button class="primary" id="written-complete" ${canCompleteReview(draft) ? "" : "disabled"}>Mark self-reviewed</button>`
      : "";
    if (draft.reviewing)
      $("#written-complete").onclick = async () => {
        if (!canCompleteReview(draft)) return;
        $("#written-complete").disabled = true;
        try {
          await save(true);
          if (live()) {
            $("#written-completion").innerHTML =
              '<div class="complete-banner">✓ Self-reviewed · Progress saved</div>';
            status(
              "Your self-review is saved. This answer was not automatically graded.",
            );
          }
        } catch {
          status("Review could not be saved. Please try again.");
        } finally {
          if (live())
            $("#written-complete").disabled = !canCompleteReview(draft);
        }
      };
  };
  $("#written-answer").oninput = (event) => {
    draft = editWrittenAnswer(draft, event.target.value);
    renderReview();
    status("Draft changed. Submit again when you are ready to review.");
    scheduleSave();
  };
  $("#written-submit").onclick = () => {
    if (!draft.answer.trim()) return;
    draft.reviewing = true;
    renderReview();
    status("Compare your answer with the key points below.");
    scheduleSave();
  };
  $("#written-review").onchange = (event) => {
    const i = Number(event.target.dataset.point);
    if (
      !draft.reviewing ||
      !Number.isInteger(i) ||
      i < 0 ||
      i >= task.rubric.length
    )
      return;
    draft.checked[i] = event.target.checked;
    $("#written-complete").disabled = !canCompleteReview(draft);
    scheduleSave();
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
    renderReview();
    status("Answer cleared. Previously recorded completion is retained.");
    scheduleSave();
  };
  $("#written-hint").onclick = () => {
    $("#written-hint-text").textContent = task.hint;
  };
  renderReview();
}
