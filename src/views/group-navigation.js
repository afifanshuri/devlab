import { $, esc } from "../ui.js";
import {
  groupedNavigation,
  lessonRoute,
  exerciseMode,
} from "../learning-groups.js";

export function groupPicker(key) {
  const { group, index } = groupedNavigation(key);
  return `<div class="exercise-group-picker"><a class="text-link" href="#group/${group.id}">← ${esc(group.title)}</a>
    <label>Exercise ${index + 1} of ${group.lessons.length}<select id="exercise-jump" aria-label="Exercises in this group">${group.sections.map((section) => `<optgroup label="${esc(section.title)}">${section.lessons.map((lesson) => `<option value="${lessonRoute(lesson)}" ${lesson.id === key ? "selected" : ""}>${esc(lesson.title)} · ${exerciseMode(lesson)}</option>`).join("")}</optgroup>`).join("")}</select></label></div>`;
}
export function bindGroupPicker() {
  $("#exercise-jump").onchange = (event) => {
    location.hash = event.target.value;
  };
}
export function groupNavigation(key) {
  const { group, previous, next } = groupedNavigation(key);
  return `<nav class="task-nav" aria-label="Group exercises"><a class="secondary" href="${previous ? lessonRoute(previous) : `#group/${group.id}`}">← ${previous ? "Previous exercise" : "Group overview"}</a>
    <a class="secondary" href="${next ? lessonRoute(next) : `#group/${group.id}`}">${next ? "Next exercise →" : "Group overview →"}</a></nav>`;
}
