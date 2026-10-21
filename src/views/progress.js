import { courses, allLessons } from "../../curriculum.js";
import { state } from "../state.js";
import { esc, shell } from "../ui.js";
import { completed, count, route } from "../catalog-data.js?v=docker-1";
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
  shell(
    /* HTML */ `<div class="eyebrow">A LITTLE STRUCTURE GOES A LONG WAY</div>
      <h1>Choose your learning path<span>.</span></h1>
      <p class="sub">
        Follow a track in order or jump into the topic you need today.
      </p>
      ${[
        [
          "java",
          "Java engineer",
          "Master collections, complexity, clean architecture and reusable design.",
        ],
        [
          "linux",
          "Linux operator",
          "Start with navigation, then build confidence in system administration.",
        ],
        [
          "sql",
          "Database developer",
          "Run real queries, then explore PostgreSQL and Oracle procedural concepts.",
        ],
      ]
        .map(
          ([track, title, desc]) =>
            /* HTML */ `<section class="panel">
              <div class="row">
                <div>
                  <div class="eyebrow">${track}</div>
                  <h2>${title}</h2>
                  <p class="muted">${desc}</p>
                </div>
                <span class="muted"
                  >${courses
                    .filter((c) => c.track === track)
                    .reduce((s, c) => s + c.minutes, 0)}
                  min estimated</span
                >
              </div>
              <div class="practice-list">
                ${courses
                  .filter((c) => c.track === track)
                  .map(
                    (c, i) =>
                      /* HTML */ `<a href="${route(c)}"
                        ><span
                          ><span style="color:#8ba574;margin-right:15px"
                            >0${i + 1}</span
                          >${c.title}</span
                        ><span style="color:#9ba892"
                          >${count(c) === c.lessons.length
                            ? "✓ Complete"
                            : "Explore →"}</span
                        ></a
                      >`,
                  )
                  .join("")}
              </div>
            </section>`,
        )
        .join("")}`,
  );
}

export { progressPage, paths };
