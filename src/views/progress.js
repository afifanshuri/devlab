import { courses, allLessons } from "../../curriculum.js?v=progression-1";
import { state } from "../state.js";
import { esc, shell } from "../ui.js";
import { completed, count, route } from "../catalog-data.js?v=progression-1";
function progressPage() {
  const done = completed();
  shell(
    /* HTML */ `<div class="eyebrow">MAKE YOUR PRACTICE COUNT</div>
      <h1>Your progress<span>.</span></h1>
      <p class="sub">
        ${done} of ${allLessons.length} exercises complete. Every small step
        adds up.
      </p>
      <div class="panel">
        ${courses
          .map(
            (c) =>
              /* HTML */ `<div class="progress-item">
                <div class="row">
                  <a href="${route(c)}">${esc(c.title)}</a
                  ><span class="muted"
                    >${count(c)} / ${c.lessons.length} complete</span
                  >
                </div>
                <div class="progress-line">
                  <div
                    style="width:${(count(c) / c.lessons.length) * 100}%"
                  ></div>
                </div>
              </div>`,
          )
          .join("")}
      </div>
      <div class="panel">
        <h2>Completed exercises</h2>
        ${allLessons
          .filter((l) => state.records[l.id]?.completed)
          .map(
            (l) =>
              /* HTML */ `<div class="progress-item row">
                <a href="#lab/${l.course}/${l.index}">✓ ${esc(l.title)}</a
                ><span class="muted"
                  >${esc(
                    new Date(state.records[l.id].updated).toLocaleDateString(),
                  )}</span
                >
              </div>`,
          )
          .join("") ||
        '<p class="muted">Your first completed exercise will appear here.</p><a class="primary" href="#labs">Find your first lab →</a>'}
      </div>`,
  );
}

function paths() {
  const tracks = [
    [
      "java",
      "Build reliable backend services",
      "Contracts → algorithms → reliability → secure workflows. Earlier helper methods are included in later starters, and cumulative regression tests protect what you already built.",
    ],
    [
      "linux",
      "Investigate incidents systematically",
      "Files and permissions → service-level evidence → correlation IDs → repeatable reports → verified support bundles.",
    ],
    [
      "sql",
      "Protect data and diagnose queries",
      "Queries → procedural functions → atomic transfers → idempotent requests → reconciliation and index investigation. Oracle remains an optional separate environment.",
    ],
  ];
  shell(`<div class="eyebrow">LEARN IT. REUSE IT. BUILD ON IT.</div>
    <h1>Your progressive learning paths<span>.</span></h1>
    <p class="sub">Follow the recommended order. Each step introduces a focused idea, then later tasks reuse it in a larger problem. You can revisit or skip ahead at any time.</p>
    <div class="panel learning-plan-intro"><h2>From implementing a feature to owning its behavior</h2><p class="muted">Practise defensive contracts, failure-path testing, concurrency, idempotency, database integrity, and repeatable operational diagnosis. Passing requires actual runtime checks. The Java service sequence also reruns earlier tests as the code grows.</p></div>
    ${tracks
      .map(([track, title, description]) => {
        const stages = courses
          .filter((c) => c.track === track)
          .sort(
            (a, b) =>
              Number(a.lessons[0].engine === "oracle") -
              Number(b.lessons[0].engine === "oracle"),
          );
        const ordered = stages.flatMap((c) =>
          c.lessons.map((l, index) => ({
            ...l,
            index,
            course: c.id,
            id: c.id + ":" + index,
          })),
        );
        const next = ordered.find(
          (l) => l.engine !== "oracle" && !state.records[l.id]?.completed,
        );
        let number = 0;
        return `<section class="panel"><div class="row"><div><div class="eyebrow">${track}</div><h2>${title}</h2></div><span class="muted">${ordered.filter((l) => state.records[l.id]?.completed).length} / ${ordered.length} complete</span></div><p class="muted">${description}</p>
        ${next ? `<a class="primary path-continue" href="#lab/${next.course}/${next.index}">Recommended next: ${esc(next.title)} →</a>` : '<div class="complete-banner">Core path complete. Revisit a challenge to reinforce your skills.</div>'}
        <div class="path-stages">${stages
          .map(
            (c) =>
              `<details class="path-stage" ${c.lessons.some((_, i) => next?.id === c.id + ":" + i) ? "open" : ""}><summary><span><small>${c.lessons[0].engine === "oracle" ? "OPTIONAL" : c.stage ? "STAGE " + c.stage : "FOUNDATIONS"}</small>${esc(c.title)}</span><span class="muted">${count(c)} / ${c.lessons.length}</span></summary><p class="muted">${esc(c.description)}</p><div class="path-exercises">${c.lessons
                .map((l, i) => {
                  const id = c.id + ":" + i;
                  number++;
                  return `<a href="#lab/${c.id}/${i}" class="path-exercise ${next?.id === id ? "is-next" : ""}"><span class="path-number">${String(number).padStart(2, "0")}</span><span>${esc(l.title)}<small>${l.reuseNote ? "Reuses earlier building blocks" : l.prerequisites?.length ? "Builds on the previous exercise" : "Start here"}</small></span><span class="path-status">${state.records[id]?.completed ? "✓ Complete" : next?.id === id ? "Up next →" : "Practise →"}</span></a>`;
                })
                .join("")}</div></details>`,
          )
          .join("")}</div></section>`;
      })
      .join("")}`);
}
export { progressPage, paths };
