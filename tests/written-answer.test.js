import test from "node:test";
import assert from "node:assert/strict";
import { allLessons } from "../curriculum.js";
import { LabSessions } from "../runner/sessions.js";
import {
  readWrittenAnswer,
  editWrittenAnswer,
  canCompleteReview,
} from "../src/written-answer.js";

test("Linux interview adds two mixed challenges per topic without replacing coding labs", async () => {
  const questions = allLessons.filter(
    (l) => l.course === "hands-linux-interview",
  );
  assert.equal(questions.length, 32);
  assert.equal(
    allLessons.filter(
      (l) => l.type === "workspace" && l.course !== "hands-linux-interview",
    ).length,
    338,
  );
  const topics = new Map();
  for (const q of questions) {
    assert.equal(q.track, "linux");
    assert.equal(q.engine, q.type === "written" ? "written" : "linux");
    assert.ok(q.mission && q.goal && q.rubric.length >= 3);
    assert.equal(q.choices, undefined);
    const pair = topics.get(q.topic) || [];
    pair.push(q.questionNumber);
    topics.set(q.topic, pair);
  }
  assert.equal(topics.size, 16);
  assert.equal(questions.filter((q) => q.type === "written").length, 19);
  assert.equal(questions.filter((q) => q.engine === "linux").length, 13);
  for (const pair of topics.values()) assert.deepEqual(pair, [1, 2]);
  // Reject before any Docker interaction, including requests sent outside the UI.
  await assert.rejects(
    new LabSessions().create(questions.find((q) => q.type === "written").id),
    /self-review/,
  );
});

test("written submission, review, save/reopen and reset work without a runner", async () => {
  const { default: initSqlJs } = await import("sql.js");
  const { indexedDB } = await import("fake-indexeddb");
  const store = await import("../database.js");
  const { state } = await import("../src/state.js");
  const { mountWritten } = await import("../src/views/written-workspace.js");
  const { courses } = await import("../curriculum.js");
  const SQL = await initSqlJs();
  globalThis.indexedDB = indexedDB;
  globalThis.window = { initSqlJs: () => Promise.resolve(SQL) };
  globalThis.location = { hash: "#lab/hands-linux-interview/1" };
  const nodes = new Map();
  globalThis.document = {
    querySelector: (selector) => {
      if (!nodes.has(selector))
        nodes.set(selector, {
          innerHTML: "",
          value: "",
          textContent: "",
          disabled: false,
        });
      return nodes.get(selector);
    },
  };
  const node = (selector) => document.querySelector(selector);
  const course = courses.find((c) => c.id === "hands-linux-interview");
  const context = { key: course.id + ":1", task: course.lessons[1] };
  try {
    await store.initialize();
    state.records = {};
    mountWritten(context, course, 1, () => true);
    assert.equal(node("#written-submit").disabled, true);
    assert.equal(node("#written-review").innerHTML, "");
    node("#written-answer").oninput({
      target: { value: "My explanation <script>unsafe</script>" },
    });
    assert.equal(node("#written-submit").disabled, false);
    node("#written-submit").onclick();
    assert.match(node("#written-review").innerHTML, /Reference answer/);
    // The completion handler still guards against an incomplete checklist.
    await node("#written-complete").onclick();
    assert.equal(store.progress()[context.key]?.completed, undefined);
    for (let i = 0; i < 3; i++)
      node("#written-review").onchange({
        target: { dataset: { point: String(i) }, checked: true },
      });
    assert.equal(node("#written-complete").disabled, false);
    await node("#written-complete").onclick();
    assert.equal(store.progress()[context.key].completed, true);
    await context.saveState();
    clearTimeout(context.saveTimer);
    mountWritten(context, course, 1, () => true);
    assert.match(
      node("#app").innerHTML,
      /My explanation &lt;script&gt;unsafe&lt;\/script&gt;/,
    );
    assert.match(node("#app").innerHTML, /Previously self-reviewed/);
    assert.match(node("#written-review").innerHTML, /Reference answer/);
    node("#written-answer").oninput({
      target: { value: "Changed explanation" },
    });
    assert.equal(node("#written-review").innerHTML, "");
    node("#written-reset").onclick();
    assert.equal(node("#written-submit").disabled, true);
    await context.saveState();
    assert.equal(JSON.parse(store.progress()[context.key].draft).answer, "");
  } finally {
    clearTimeout(context.saveTimer);
    delete globalThis.document;
    delete globalThis.location;
    delete globalThis.window;
    delete globalThis.indexedDB;
  }
});

test("written drafts restore safely and editing invalidates the previous review", () => {
  let draft = readWrittenAnswer(null, 3);
  assert.equal(canCompleteReview(draft), false);
  draft = editWrittenAnswer(draft, "Reasoning with evidence");
  draft.reviewing = true;
  draft.checked = [true, false, true];
  assert.equal(canCompleteReview(draft), false);
  draft.checked[1] = true;
  assert.equal(canCompleteReview(draft), true);
  assert.deepEqual(readWrittenAnswer(JSON.stringify(draft), 3), draft);
  const edited = editWrittenAnswer(draft, "Revised answer");
  assert.equal(canCompleteReview(edited), false);
  assert.deepEqual(edited.checked, [false, false, false]);
  assert.equal(canCompleteReview(editWrittenAnswer(draft, "  \n")), false);
  assert.equal(readWrittenAnswer("broken JSON", 3).answer, "");
  assert.equal(
    readWrittenAnswer(
      JSON.stringify({ ...draft, answer: "x".repeat(17000) }),
      3,
    ).answer.length,
    16000,
  );
});
