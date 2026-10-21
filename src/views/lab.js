import { checkStructure, matchesRows } from "../services/checks.js";
import { courses } from "../../content.js";
import * as store from "../../database.js";
import { state } from "../state.js";
import { $, esc, icon, toast, shell } from "../ui.js";
import { LinuxSandbox } from "../../linux.js";
import { executeSql, formatResults } from "../services/sql.js";
let draftTimer, sandbox, chosen;
async function flushDraft() {
  clearTimeout(draftTimer);
  if (state.current && $("#code")) {
    await store.saveLesson(state.current.id, $("#code").value);
    state.records = store.progress();
  }
}
function lesson(courseId, idx) {
  const c = courses.find((x) => x.id === courseId);
  const index = Number(idx);
  if (!c || !Number.isInteger(index) || !c.lessons[index]) {
    shell(
      '<h1>Lab not found</h1><a class="primary" href="#labs">Explore labs</a>',
    );
    return;
  }
  const l = { ...c.lessons[index], id: `${c.id}:${index}`, index };
  state.current = l;
  chosen = null;
  sandbox = new LinuxSandbox();
  store.setting("lastLab", c.id).catch(() => toast("Could not save last lab."));
  const saved = state.records[l.id];
  const note =
    l.type === "sql"
      ? "Real SQLite execution · sample data resets on every run."
      : l.type === "terminal"
        ? "Simulated Linux · only the listed commands are supported."
        : l.type === "code"
          ? "Guided structural check · code is not compiled or executed. Complete the checks, then verify your understanding in a real runtime."
          : "Concept check · choose an answer and check your reasoning.";
  shell(
    /* HTML */ `<div class="lab-heading">
        <div>
          <div class="eyebrow">${c.track} / ${esc(c.title)}</div>
          <h1>${esc(l.title)}</h1>
          <p class="sub">
            Exercise ${index + 1} of ${c.lessons.length}
            <span style="padding:0 8px">·</span> ${saved?.completed
              ? "✓ Completed"
              : "In progress"}
          </p>
        </div>
        <a class="secondary" href="#labs">← All labs</a>
      </div>
      <div class="lab-grid">
        <section class="instructions">
          <div class="lesson-counter">
            YOUR MISSION / ${String(index + 1).padStart(2, "0")}
          </div>
          <div class="step-list">
            ${c.lessons
              .map(
                (_, i) =>
                  /* HTML */ `<a
                    class="step-dot ${state.records[`${c.id}:${i}`]?.completed
                      ? "done"
                      : ""}"
                    href="#lab/${c.id}/${i}"
                    aria-label="Exercise ${i + 1}"
                    ${i === index ? 'aria-current="step"' : ""}
                  ></a>`,
              )
              .join("")}
          </div>
          <h2>Understand the idea</h2>
          <p>${esc(l.concept)}</p>
          <h2>Your task</h2>
          <p>${esc(l.task || l.prompt)}</p>
          ${l.type === "sql"
            ? '<div class="hint">Schema: employees(id, name, department_id, salary)<br>departments(id, name)<br><br>Alex · Engineering · 85,000<br>Maya · Engineering · 95,000<br>Sam · Operations · 60,000<br>Noor · Operations · 72,000</div>'
            : ""}
          <div style="display:flex;gap:12px;margin-top:25px">
            <button class="secondary" id="hint">◇ Get a hint</button
            ><button class="text-link" id="solution">Reference answer</button>
          </div>
          <div id="help-content"></div>
          <div id="completion">
            ${saved?.completed
              ? '<div class="complete-banner">✓ You completed this exercise. Revisit it any time.</div>'
              : ""}
          </div>
        </section>
        <section class="workspace" aria-label="Interactive workspace">
          <div class="editor-bar">
            <span
              >${l.type === "terminal"
                ? "learner@devlab: ~"
                : l.type === "sql"
                  ? "query.sql"
                  : l.type === "code"
                    ? c.track === "java"
                      ? "Practice.java"
                      : "practice.sql"
                    : "THINK IT THROUGH"}</span
            ><span
              >${l.type === "sql"
                ? "SQLITE"
                : l.type === "terminal"
                  ? "SIMULATOR"
                  : l.type === "code"
                    ? "GUIDED CHECK"
                    : "CONCEPT CHECK"}</span
            >
          </div>
          ${l.type === "terminal"
            ? '<div class="terminal-log" id="terminal" role="log" aria-label="Terminal output">DevLab Linux sandbox\nType help for supported commands.\n\n</div><form id="terminal-form" class="terminal-form"><label for="command" id="prompt">~ $</label><input id="command" autocomplete="off" spellcheck="false" aria-label="Terminal command"><button type="submit" class="secondary">Enter ↵</button></form>'
            : l.type === "quiz"
              ? /* HTML */ `<div class="quiz-panel">
                  <div class="eyebrow">TEST YOUR UNDERSTANDING</div>
                  <h3>${esc(l.prompt)}</h3>
                  <div class="quiz-choices">
                    ${l.choices
                      .map(
                        (s, i) =>
                          /* HTML */ `<button
                            data-choice="${i}"
                            aria-pressed="false"
                          >
                            <span style="color:#718169;margin-right:12px"
                              >${String.fromCharCode(65 + i)}</span
                            >${esc(s)}
                          </button>`,
                      )
                      .join("")}
                  </div>
                </div>`
              : /* HTML */ `<textarea
                  class="editor"
                  id="code"
                  aria-label="${l.type === "sql" ? "SQL query" : "Code editor"}"
                  spellcheck="false"
                >
${esc(saved?.draft ?? l.starter)}</textarea
                >`}
          <div class="workspace-actions">
            <button class="secondary" id="reset">↻ Reset exercise</button
            ><button class="primary" id="check">
              ${l.type === "sql" ? "Run & check query" : "Check answer"}
              ${icon("arrow")}
            </button>
          </div>
          <div id="output" class="console" role="status" aria-live="polite">
            ${l.type === "sql"
              ? "Ready. Run your query to see results."
              : l.type === "terminal"
                ? "Complete the task, then check your work."
                : "Your feedback will appear here."}
          </div>
          <div class="mode-note">${note}</div>
        </section>
      </div>
      <div class="task-nav">
        <a
          class="secondary"
          href="${index > 0 ? `#lab/${c.id}/${index - 1}` : "#labs"}"
          >← ${index ? "Previous exercise" : "Lab library"}</a
        ><a
          class="secondary"
          href="${index < c.lessons.length - 1
            ? `#lab/${c.id}/${index + 1}`
            : "#progress"}"
          >${index < c.lessons.length - 1
            ? "Next exercise →"
            : "View progress →"}</a
        >
      </div>`,
  );
  $("#hint").onclick = () => {
    $("#help-content").innerHTML = /* HTML */ `<div class="hint">
      ${esc(l.hint)}
    </div>`;
  };
  $("#solution").onclick = () => {
    $("#help-content").innerHTML = /* HTML */ `<div class="hint">
      <strong>Reference answer</strong>
      <pre style="white-space:pre-wrap;font:11px/1.8 monospace">
${esc(l.solution)}</pre
      >
      <span>Study the approach, then try it in the workspace.</span>
    </div>`;
  };
  $("#reset").onclick = async () => {
    if ($("#code")) {
      await store.saveLesson(l.id, l.starter);
      state.records = store.progress();
    }
    lesson(c.id, index);
  };
  if ($("#code")) {
    $("#code").oninput = () => {
      clearTimeout(draftTimer);
      const value = $("#code").value;
      draftTimer = setTimeout(() => {
        store
          .saveLesson(l.id, value)
          .then(() => (state.records = store.progress()))
          .catch(() => toast("Draft not saved. Export a backup."));
      }, 400);
    };
    $("#code").onkeydown = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const t = e.target,
          s = t.selectionStart;
        t.setRangeText("  ", s, t.selectionEnd, "end");
        t.dispatchEvent(new Event("input"));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        $("#check").click();
      }
    };
  }
  document.querySelectorAll("[data-choice]").forEach(
    (b) =>
      (b.onclick = () => {
        chosen = Number(b.dataset.choice);
        document.querySelectorAll("[data-choice]").forEach((x) => {
          x.classList.toggle("selected", x === b);
          x.setAttribute("aria-pressed", String(x === b));
        });
      }),
  );
  if (l.type === "terminal") {
    let historyIndex = 0;
    $("#terminal-form").onsubmit = (e) => {
      e.preventDefault();
      const input = $("#command").value.trim();
      if (!input) return;
      const result = sandbox.run(input);
      const log = $("#terminal");
      if (result === "\x00clear") log.textContent = "";
      else
        log.textContent += `${sandbox.cwd} $ ${input}\n${result}${result ? "\n" : ""}\n`;
      log.scrollTop = log.scrollHeight;
      $("#command").value = "";
      $("#prompt").textContent =
        sandbox.cwd.replace("/home/learner", "~") + " $";
      historyIndex = sandbox.history.length;
    };
    $("#command").onkeydown = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        historyIndex = Math.max(
          0,
          Math.min(
            sandbox.history.length,
            historyIndex + (e.key === "ArrowUp" ? -1 : 1),
          ),
        );
        e.target.value = sandbox.history[historyIndex] || "";
      }
    };
  }
  $("#check").onclick = async () => {
    const btn = $("#check");
    btn.disabled = true;
    try {
      let ok = false,
        message = "",
        draft = $("#code")?.value ?? "";
      if (l.type === "quiz") {
        ok = chosen === l.answer;
        message =
          chosen === null
            ? "Choose an answer first."
            : ok
              ? "✓ Correct. " + l.explanation
              : "Not quite. " + l.explanation;
        draft = chosen === null ? "" : String(chosen);
      }
      if (l.type === "terminal") {
        ok = sandbox.check(l.goal);
        message = ok
          ? "✓ Mission accomplished. The sandbox state matches every goal."
          : "The task is not complete yet. Check the requested commands, paths, and final state. Type help to see available commands.";
        draft = sandbox.history.join("\n");
      }
      if (l.type === "code") {
        const checks = checkStructure(draft, l.checks);
        ok = checks.every((x) => x.pass);
        message =
          checks.map((x) => `${x.pass ? "✓" : "○"} ${x.label}`).join("\n") +
          "\n\n" +
          (ok
            ? "All structural checks passed. This is a guided review, not a compiler or runtime test."
            : "Review the missing pieces and try again.");
      }
      if (l.type === "sql") {
        const result = await executeSql(draft);
        if (result.error) throw Error(result.error);
        const rows = result.results.at(-1)?.values || [];
        ok = matchesRows(rows, l.expected);
        message =
          formatResults(result) +
          (ok
            ? "\n\n✓ Correct result. Every row matches the expected output."
            : "\n\nYour result differs from the goal. Check column order, filters, and sorting.");
      }
      if (state.current?.id !== l.id) return;
      $("#output").textContent = message;
      $("#output").className = "console " + (ok ? "success" : "error");
      await store.saveLesson(l.id, draft, ok);
      state.records = store.progress();
      if (ok) {
        $("#completion").innerHTML =
          '<div class="complete-banner">✓ Exercise complete. Your progress is saved.</div>';
        document.querySelectorAll(".step-dot")[index]?.classList.add("done");
        toast("Exercise complete. Keep building.");
      }
    } catch (e) {
      if (state.current?.id === l.id) {
        $("#output").textContent = "Could not complete the check: " + e.message;
        $("#output").className = "console error";
      }
    } finally {
      if (document.contains(btn)) btn.disabled = false;
    }
  };
}

export { lesson, flushDraft };
