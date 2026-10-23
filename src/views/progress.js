import { allLessons } from "../../curriculum.js?v=java-theory-1";
import { learningGroups, lessonRoute } from "../learning-groups.js";
import { state } from "../state.js";
import { esc, shell } from "../ui.js";
import { completed, count } from "../catalog-data.js?v=java-theory-1";
import { groupSections } from "./learning-group.js?v=java-theory-1";

export function progressPage() {
  shell(`<div class="eyebrow">MAKE YOUR PRACTICE COUNT</div><h1>Your progress<span>.</span></h1>
    <p class="sub">${completed()} of ${allLessons.length} exercises complete across ${learningGroups.length} topic groups.</p>
    <div class="panel">${learningGroups.map((group) => `<div class="progress-item"><div class="row"><a href="#group/${group.id}">${esc(group.title)}</a><span class="muted">${count(group)} / ${group.lessons.length} complete</span></div><div class="progress-line"><div style="width:${(count(group) / group.lessons.length) * 100}%"></div></div></div>`).join("")}</div>
    <div class="panel"><h2>Completed exercises</h2>${
      allLessons
        .filter((lesson) => state.records[lesson.id]?.completed)
        .map(
          (lesson) =>
            `<div class="progress-item row"><a href="${lessonRoute(lesson)}">✓ ${esc(lesson.title)}</a><span class="muted">${lesson.type === "written" ? "Answer checked · " : ""}${esc(new Date(state.records[lesson.id].updated).toLocaleDateString())}</span></div>`,
        )
        .join("") ||
      '<p class="muted">Your first completed exercise will appear here.</p><a class="primary" href="#labs">Find your first group →</a>'
    }</div>`);
}

export function paths() {
  shell(`<div class="eyebrow">LEARN IT. REUSE IT. BUILD ON IT.</div><h1>Your learning paths<span>.</span></h1>
    <p class="sub">Choose a topic group, complete the focused practice, then extend it through advanced challenges. Short-answer Linux questions sit alongside the relevant terminal tasks. You can skip ahead at any time.</p>
    ${["java", "linux", "sql"]
      .map((track) => {
        const groups = learningGroups.filter((group) => group.track === track);
        const lessons = groups.flatMap((group) => group.lessons);
        const next = lessons.find(
          (lesson) =>
            lesson.engine !== "oracle" && !state.records[lesson.id]?.completed,
        );
        return `<section class="panel"><div class="row"><h2>${track === "java" ? "Java & Spring" : track === "linux" ? "Linux" : "SQL"}</h2><span class="muted">${lessons.filter((lesson) => state.records[lesson.id]?.completed).length} / ${lessons.length} complete</span></div>
        ${next ? `<a class="primary path-continue" href="${lessonRoute(next)}">Recommended next: ${esc(next.title)} →</a>` : "<p>Core path complete. Revisit a topic to reinforce your skills.</p>"}
        ${groups.map((group, i) => `<details class="path-stage" ${group.lessons.includes(next) ? "open" : ""}><summary><span><small>${group.id === "sql-oracle" ? "OPTIONAL" : "GROUP " + (i + 1)}</small>${esc(group.title)}</span><span class="muted">${count(group)} / ${group.lessons.length}</span></summary><p>${esc(group.description)}</p><a class="text-link" href="#group/${group.id}">Open group overview →</a><div class="path-stages">${groupSections(group, next)}</div></details>`).join("")}</section>`;
      })
      .join("")}`);
}
