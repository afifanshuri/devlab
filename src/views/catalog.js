import {
  learningGroups as courses,
  groupForLesson,
} from "../learning-groups.js";
import { allLessons } from "../../curriculum.js?v=collections-complete-1";
import * as store from "../../database.js";
import { $, esc, icon, shell } from "../ui.js";
import { completed, count, route } from "../catalog-data.js?v=collections-complete-1";
let filter = "all",
  query = "";
function catalog() {
  const last = store.setting("lastExercise");
  const legacy = allLessons.find(
    (lesson) => lesson.course === store.setting("lastLab"),
  );
  const c = groupForLesson.get(last || legacy?.id) || courses[0];
  const done = completed();
  shell(
    /* HTML */ `<section class="hero">
        <div>
          <div class="eyebrow">YOUR HANDS-ON LEARNING SPACE</div>
          <h1>Build skills. <span>One lab at a time.</span></h1>
          <p class="sub">
            Go beyond the tutorial. Get your hands on Java, Linux, and SQL<br
              class="desktop-break"
            />
            with focused, interactive challenges.
          </p>
        </div>
        <div class="hero-aside">
          YOUR NEXT COMMIT<strong>To getting better.</strong>Local Docker labs.
          Real practice.
        </div>
      </section>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">EXERCISES COMPLETED ${icon("chart")}</div>
          <div class="stat-value">
            ${String(done).padStart(2, "0")}<small
              >/ ${allLessons.length} exercises</small
            >
          </div>
        </div>
        <div class="stat">
          <div class="stat-label">GROUPS COMPLETED ${icon("grid")}</div>
          <div class="stat-value">
            ${String(
              courses.filter((c) => count(c) === c.lessons.length).length,
            ).padStart(2, "0")}<small>/ ${courses.length} groups</small>
          </div>
        </div>
        <div class="stat">
          <div class="stat-label">LEARNING TRACKS ${icon("book")}</div>
          <div class="stat-value">03<small>built for practice</small></div>
        </div>
        <div class="stat">
          <div class="stat-label">OVERALL PROGRESS ${icon("code")}</div>
          <div class="stat-value">
            ${Math.round((done / allLessons.length) * 100)}%<small
              >keep moving forward</small
            >
          </div>
        </div>
      </div>
      <div class="resume">
        <div class="resume-icon">${esc(c.symbol)}</div>
        <div class="resume-text">
          <div class="tiny">
            ${last ? "PICK UP WHERE YOU LEFT OFF" : "A GOOD PLACE TO START"}
          </div>
          <h3>${esc(c.title)}</h3>
          <p>
            ${c.lessons.length} exercises
            <span style="padding:0 8px">·</span>${c.sections.length} sections
            <span style="padding:0 8px">·</span> ${count(c)} completed
          </p>
        </div>
        <a class="primary" href="${route(c)}"
          >${last ? "Continue learning" : "Start your first group"}
          ${icon("arrow")}</a
        >
      </div>
      <div class="section-title">
        <h2>Explore topic groups</h2>
        <span
          ><a class="text-link" href="#paths"
            >Follow a progressive path →</a
          ></span
        >
      </div>
      <div class="filters">
        <div class="tabs" role="group" aria-label="Filter labs">
          ${[
            ["all", "All groups"],
            ["java", "Java"],
            ["linux", "Linux"],
            ["sql", "SQL"],
          ]
            .map(
              ([id, label]) =>
                /* HTML */ `<button
                  data-filter="${id}"
                  class="${filter === id ? "selected" : ""}"
                  aria-pressed="${filter === id}"
                >
                  ${label}<b
                    >${id === "all"
                      ? courses.length
                      : courses.filter((c) => c.track === id).length}</b
                  >
                </button>`,
            )
            .join("")}
        </div>
        <label class="search"
          ><span>⌕</span
          ><input
            type="search"
            id="search"
            aria-label="Search groups"
            placeholder="Search a skill, topic, or exercise…"
            value="${esc(query)}"
        /></label>
      </div>
      <div class="cards" id="cards"></div>
      <div class="footer-note">
        <span>Made for the way developers actually learn.</span
        ><span
          >Practice locally <span style="margin:0 7px">·</span> Your progress
          stays with you</span
        >
      </div>`,
  );
  drawCards();
  document.querySelectorAll("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        filter = b.dataset.filter;
        catalog();
      }),
  );
  $("#search").oninput = (e) => {
    query = e.target.value;
    drawCards();
  };
}
function drawCards() {
  const list = courses.filter(
    (c) =>
      (filter === "all" || filter === c.track) &&
      [
        c.title,
        c.description,
        ...c.tags,
        ...c.lessons.flatMap((l) => [
          l.advancedTopic || l.topic || "",
          l.title,
          l.section || "",
          l.diagnosticSystem || "",
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  $("#cards").innerHTML = list.length
    ? list
        .map((c, i) => {
          const d = count(c);
          return /* HTML */ `${i === 0 || list[i - 1].track !== c.track
              ? `<h2 class="track-heading">${c.track === "java" ? "Java & Spring" : c.track === "linux" ? "Linux" : "SQL"} <small>${list.filter((group) => group.track === c.track).length} groups</small></h2>`
              : ""}
            <article class="card ${c.track}">
              <a
                href="#group/${c.id}"
                class="card-visual ${c.track}"
                aria-label="Open ${esc(c.title)}"
                ><span class="visual-tag"
                  >${c.track.toUpperCase()} / TOPIC GROUP</span
                ><span class="track-symbol">${esc(c.symbol)}</span
                ><span class="visual-number"
                  >GROUP
                  ${String(courses.indexOf(c) + 1).padStart(2, "0")}</span
                ></a
              >
              <div class="card-body">
                <div class="card-heading">
                  <i></i>${c.level.toUpperCase()}
                  <span style="color:#59676f;margin:0 3px">/</span>
                  ${c.track === "sql" && c.id !== "sql-queries"
                    ? "DIALECT PRACTICE"
                    : c.track.toUpperCase()}
                </div>
                <h3><a href="#group/${c.id}">${c.title}</a></h3>
                <p>${c.description}</p>
                <div class="chips">
                  ${c.tags
                    .map((x) => /* HTML */ `<span class="chip">${x}</span>`)
                    .join("")}
                </div>
                <div class="card-meta">
                  <span>◷ &nbsp; ${c.sections.length} sections</span
                  ><span>▤ &nbsp; ${c.lessons.length} exercises</span>
                </div>
                <div class="card-footer">
                  <span
                    >${d === c.lessons.length
                      ? "✓ Completed"
                      : d
                        ? `${d} of ${c.lessons.length} completed`
                        : "Ready when you are"}</span
                  ><a href="#group/${c.id}">View exercises →</a>
                </div>
                <div class="progress-line">
                  <div style="width:${(d / c.lessons.length) * 100}%"></div>
                </div>
              </div>
            </article>`;
        })
        .join("")
    : '<div class="empty">No groups match your search. Try a different topic.</div>';
}

export { catalog };
