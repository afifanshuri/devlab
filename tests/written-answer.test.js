import test from "node:test";
import assert from "node:assert/strict";
import { allLessons, courses } from "../curriculum.js";
import { LabSessions } from "../runner/sessions.js";
import {
  readWrittenAnswer,
  editWrittenAnswer,
  checkWrittenAnswer,
  savedCompletion,
} from "../src/written-answer.js";

const questions = allLessons.filter(
  (l) => l.course === "hands-linux-interview",
);
const shortAnswers = questions.filter((l) => l.type === "written");
const byIndex = (i) => questions.find((q) => q.index === i);

test("Linux interview keeps 13 terminal tasks and gives 19 questions definite answers", async () => {
  assert.equal(questions.length, 32);
  assert.equal(
    allLessons.filter(
      (l) => l.type === "workspace" && l.course !== "hands-linux-interview",
    ).length,
    338,
  );
  assert.equal(shortAnswers.length, 19);
  assert.equal(questions.filter((q) => q.engine === "linux").length, 13);
  const topics = new Map();
  for (const q of questions) {
    assert.equal(q.track, "linux");
    assert.equal(q.engine, q.type === "written" ? "written" : "linux");
    assert.ok(q.mission && q.goal);
    assert.equal(q.choices, undefined);
    assert.equal(q.rubric, undefined);
    const pair = topics.get(q.topic) || [];
    pair.push(q.questionNumber);
    topics.set(q.topic, pair);
  }
  assert.equal(topics.size, 16);
  for (const pair of topics.values()) assert.deepEqual(pair, [1, 2]);
  await assert.rejects(
    new LabSessions().create(shortAnswers[0].id),
    /checked in the browser/,
  );
});

for (const task of shortAnswers) {
  test("definite answer: " + task.id, () => {
    assert.ok(task.answers.length && task.explanation);
    for (const answer of task.answers) {
      assert.equal(checkWrittenAnswer(task, answer), true, answer);
      assert.equal(checkWrittenAnswer(task, "  " + answer + "  "), true);
      assert.equal(checkWrittenAnswer(task, answer + " extra"), false);
    }
    for (const answer of [
      "",
      "   ",
      "I would investigate",
      "anything",
      "x".repeat(513),
    ])
      assert.equal(checkWrittenAnswer(task, answer), false);
  });
}

test("commands accept specified equivalents but reject wrong flags, targets, and shell syntax", () => {
  const graceful = byIndex(2);
  for (const input of [
    "kill -9 4312",
    "kill -TERM 4313",
    "kill -term 4312",
    "kill -TERM 4312; echo done",
    "kill -TERM 4312\necho done",
    "kill -TERM $(echo 4312)",
    "sudo kill -TERM 4312",
    "kill '-TERM'4312",
  ])
    assert.equal(checkWrittenAnswer(graceful, input), false, input);
  assert.equal(checkWrittenAnswer(graceful, ' kill\t-TERM   "4312" '), true);
  const sockets = byIndex(16);
  for (const input of ["ss -lntp", "ss -tnlp", "ss -t -n -p -l", "ss -ln -tp"])
    assert.equal(checkWrittenAnswer(sockets, input), true, input);
  for (const input of [
    "ss -lnt",
    "ss -lnup",
    "ss -lnTP",
    "ss -lntpp",
    "ss -lntp 8080",
    "ss -lntp | grep 8080",
  ])
    assert.equal(checkWrittenAnswer(sockets, input), false, input);
  assert.equal(checkWrittenAnswer(byIndex(1), "/proc/4312/status"), false);
  assert.equal(checkWrittenAnswer(byIndex(11), "MemFree"), false);
  assert.equal(checkWrittenAnswer(byIndex(12), "5"), false);
  assert.equal(checkWrittenAnswer(byIndex(17), "yes"), false);
  assert.equal(checkWrittenAnswer(byIndex(7), "chmod 2770 team"), false);
  assert.equal(
    checkWrittenAnswer(byIndex(27), "Firmware, Bootloader, Kernel, Systemd"),
    true,
  );
  assert.equal(
    checkWrittenAnswer(byIndex(27), "firmware,kernel,bootloader,systemd"),
    false,
  );
});

test("legacy answers survive but self-review cannot count as a graded pass", () => {
  const old = JSON.stringify({
    kind: "written-answer",
    answer: "old explanation",
    reviewing: true,
    checked: [true, true, true],
  });
  const draft = readWrittenAnswer(old);
  assert.equal(draft.answer, "old explanation");
  assert.equal(draft.submittedAnswer, null);
  assert.equal(draft.passed, false);
  assert.equal(savedCompletion(true, old), false);
  assert.equal(savedCompletion(true, "public class Main {}"), true);
  const passed = {
    ...draft,
    answer: "kill 4312",
    submittedAnswer: "kill 4312",
    passed: true,
  };
  assert.equal(savedCompletion(true, JSON.stringify(passed)), true);
  const changed = editWrittenAnswer(passed, "kill -9 4312");
  assert.equal(changed.passed, false);
  assert.equal(changed.submittedAnswer, null);
  assert.equal(savedCompletion(true, JSON.stringify(changed)), false);
  assert.equal(readWrittenAnswer("broken JSON").answer, "");
});

test("automatic checking, reference reveal, persistence and reset work without a runner", async () => {
  const { default: initSqlJs } = await import("sql.js");
  const { indexedDB } = await import("fake-indexeddb");
  const store = await import("../database.js");
  const { state } = await import("../src/state.js");
  const { mountWritten } = await import("../src/views/written-workspace.js");
  const SQL = await initSqlJs();
  globalThis.indexedDB = indexedDB;
  globalThis.window = { initSqlJs: () => Promise.resolve(SQL) };
  globalThis.location = { hash: "#lab/hands-linux-interview/2" };
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
  const context = { key: course.id + ":2", task: course.lessons[2] };
  try {
    await store.initialize();
    // A previously completed self-review does not transfer to the new check.
    await store.saveLesson(
      context.key,
      JSON.stringify({
        kind: "written-answer",
        answer: "old explanation",
        reviewing: true,
      }),
      true,
    );
    state.records = store.progress();
    assert.equal(state.records[context.key].completed, false);
    mountWritten(context, course, 2, () => true);
    assert.equal(node("#written-review").innerHTML, "");
    node("#written-answer").oninput({ target: { value: "kill -9 4312" } });
    await node("#written-submit").onclick();
    assert.match(node("#written-review").innerHTML, /Incorrect/);
    assert.doesNotMatch(node("#written-review").innerHTML, /kill -TERM/);
    assert.equal(store.progress()[context.key].completed, false);
    node("#written-reference").onclick();
    assert.match(node("#written-review").innerHTML, /kill -TERM 4312/);
    assert.equal(store.progress()[context.key].completed, false);
    node("#written-answer").oninput({ target: { value: "kill -15 4312" } });
    assert.equal(node("#written-review").innerHTML, "");
    await node("#written-submit").onclick();
    assert.match(node("#written-review").innerHTML, /✓ Correct/);
    assert.equal(store.progress()[context.key].completed, true);
    await context.saveState();
    clearTimeout(context.saveTimer);
    mountWritten(context, course, 2, () => true);
    assert.match(node("#app").innerHTML, /kill -15 4312/);
    assert.match(node("#written-completion").innerHTML, /Correct answer/);
    node("#written-answer").oninput({
      target: { value: '<script>alert("x")</script>' },
    });
    await context.saveState();
    clearTimeout(context.saveTimer);
    mountWritten(context, course, 2, () => true);
    assert.match(node("#app").innerHTML, /&lt;script&gt;/);
    assert.equal(store.progress()[context.key].completed, false);
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
