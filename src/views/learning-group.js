import {
  learningGroups,
  lessonRoute,
  exerciseMode,
} from "../learning-groups.js";
import { state } from "../state.js";
import { esc, shell } from "../ui.js";
import { count, route } from "../catalog-data.js?v=grouped-lessons-1";

export function groupSections(group, next) {
  return group.sections
    .map(
      (
        section,
      ) => `<details class="path-stage" ${section.lessons.some((lesson) => lesson.id === next?.id) ? "open" : ""}>
    <summary><span>${esc(section.title)}</span><span class="muted">${section.lessons.filter((lesson) => state.records[lesson.id]?.completed).length} / ${section.lessons.length}</span></summary>
    <div class="path-exercises">${section.lessons.map((lesson) => `<a class="path-exercise ${lesson.id === next?.id ? "is-next" : ""}" href="${lessonRoute(lesson)}"><span class="path-number">${group.lessons.indexOf(lesson) + 1}</span><span>${esc(lesson.title)}<small>${exerciseMode(lesson)}${lesson.advancedTopic ? " · Advanced challenge" : ""}</small></span><span class="path-status">${state.records[lesson.id]?.completed ? "✓ Complete" : "Practise →"}</span></a>`).join("")}</div></details>`,
    )
    .join("");
}
export function learningGroup(id) {
  const group = learningGroups.find((item) => item.id === id);
  if (!group) {
    shell('<h1>Group not found</h1><a href="#labs">All groups</a>');
    return;
  }
  const next = group.lessons.find(
    (lesson) => !state.records[lesson.id]?.completed,
  );
  shell(`<div class="lab-heading"><div><div class="eyebrow">${esc(group.track)} / TOPIC GROUP</div><h1>${esc(group.title)}</h1><p class="sub">${esc(group.description)}</p></div><a class="secondary" href="#labs">← All groups</a></div>
    <div class="panel"><div class="row"><p>${count(group)} / ${group.lessons.length} exercises complete · ${group.sections.length} sections</p><a class="primary" href="${route(group)}">${next ? "Continue practice →" : "Practise again →"}</a></div>
    <p class="muted">Start with focused practice, then use the advanced challenges. Each exercise shows whether it uses code, a terminal or a short answer.</p><div class="path-stages">${groupSections(group, next)}</div></div>`);
}
