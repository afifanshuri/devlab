import test from "node:test";
import assert from "node:assert/strict";
import { allLessons, courses } from "../curriculum.js?v=focused-missions-1";
import { checkWrittenAnswer } from "../src/written-answer.js";
import { groupForLesson } from "../src/learning-groups.js";

const health = allLessons.filter((lesson) => lesson.healthCheck);
const expected = {
  linux: [
    "92",
    "/archive",
    "/var/log",
    "18",
    "12.5",
    "42",
    "3072",
    "1024",
    "8",
    "2",
    "256",
    "2",
    "sdb",
    "98",
    "/var",
    "800000",
    "5432",
    "no",
    "failed",
    "exit-code",
  ],
  postgres: [
    "fast",
    "no",
    "192",
    "33.33",
    "3",
    "57",
    "501",
    "2",
    "orders",
    "33.33",
    "16",
    "standby_b",
  ],
  oracle: ["87.5", "APPDATA", "8192", "no", "512", "75", "2", "1", "77", "2"],
};
test("42 output questions add Linux, PostgreSQL and Oracle pairs without replacing existing work", () => {
  assert.equal(health.length, 42);
  assert.equal(
    allLessons.filter(
      (lesson) => !lesson.healthCheck && !lesson.collectionPractice,
    ).length,
    474,
  );
  const topics = new Map();
  for (const lesson of health) {
    assert.equal(lesson.type, "written");
    assert.equal(lesson.engine, "written");
    assert.ok(
      lesson.sampleOutput.length > 50 && lesson.outputSource.length > 20,
    );
    assert.ok(lesson.goal && lesson.explanation);
    assert.equal(groupForLesson.get(lesson.id).id, lesson.learningGroup);
    assert.equal(lesson.choices, undefined);
    assert.equal(lesson.rubric, undefined);
    const key = lesson.diagnosticSystem + ":" + lesson.topic;
    const pair = topics.get(key) || [];
    pair.push(lesson);
    topics.set(key, pair);
  }
  assert.equal(topics.size, 21);
  for (const pair of topics.values()) {
    assert.deepEqual(
      pair.map((lesson) => lesson.questionNumber),
      [1, 2],
    );
    assert.deepEqual(pair[1].prerequisites, [pair[0].id]);
    assert.equal(pair[0].sampleOutput, pair[1].sampleOutput);
  }
  for (const [system, answers] of Object.entries(expected)) {
    const questions = health.filter(
      (lesson) => lesson.diagnosticSystem === system,
    );
    assert.equal(questions.length, answers.length);
    assert.deepEqual(
      questions.map((lesson) => lesson.answers[0]),
      answers,
    );
  }
});
for (const lesson of health) {
  test("health answer checks: " + lesson.id, () => {
    assert.equal(checkWrittenAnswer(lesson, lesson.answers[0]), true);
    assert.equal(
      checkWrittenAnswer(lesson, " " + lesson.answers[0] + " "),
      true,
    );
    for (const wrong of [
      "",
      "unknown",
      "99999999",
      lesson.answers[0] + " extra",
      "<script>alert(1)</script>",
    ])
      assert.equal(checkWrittenAnswer(lesson, wrong), false, wrong);
    if (lesson.answerFormat === "number") {
      assert.equal(
        checkWrittenAnswer(lesson, Number(lesson.answers[0]).toFixed(4)),
        true,
      );
      assert.equal(
        checkWrittenAnswer(lesson, String(Number(lesson.answers[0]) + 1)),
        false,
      );
      for (const wrong of [
        "NaN",
        "Infinity",
        "0x10",
        "1e2",
        "92; echo yes",
        "92%%",
      ])
        assert.equal(checkWrittenAnswer(lesson, wrong), false);
      assert.equal(
        checkWrittenAnswer(lesson, lesson.answers[0] + "%"),
        lesson.answerUnit === "percent",
      );
    }
  });
}
test("numeric answers retain required units and calculations match the sample reports", () => {
  assert.equal(checkWrittenAnswer(health[0], "92.00 %"), true);
  assert.equal(checkWrittenAnswer(health[4], "12.50"), true);
  assert.equal(checkWrittenAnswer(health[6], "3072 MiB"), false);
  assert.equal(checkWrittenAnswer(health[1], "/ARCHIVE"), false);
  const postgres = health.filter(
    (lesson) => lesson.diagnosticSystem === "postgres",
  );
  assert.equal(
    checkWrittenAnswer(postgres[3], ((64 / 192) * 100).toFixed(2)),
    true,
  );
  assert.equal(checkWrittenAnswer(postgres[5], String(100 - 3 - 0 - 40)), true);
  assert.equal(
    checkWrittenAnswer(postgres[9], ((50000 / 150000) * 100).toFixed(2)),
    true,
  );
  assert.equal(
    checkWrittenAnswer(postgres[10], String(16777216 / 1048576)),
    true,
  );
  const oracle = health.filter(
    (lesson) => lesson.diagnosticSystem === "oracle",
  );
  assert.equal(
    checkWrittenAnswer(oracle[0], String((917504 / 1048576) * 100)),
    true,
  );
  assert.equal(checkWrittenAnswer(oracle[2], String(16384 - 8192)), true);
  assert.equal(
    checkWrittenAnswer(oracle[5], String((1536 / (1536 + 512)) * 100)),
    true,
  );
});

test("Linux and SQL snapshots render, check, save and reopen without a live environment", async () => {
  const { default: initSqlJs } = await import("sql.js");
  const { indexedDB } = await import("fake-indexeddb");
  const store = await import("../database.js");
  const { state } = await import("../src/state.js");
  const { mountWritten } = await import("../src/views/written-workspace.js");
  const { esc } = await import("../src/ui.js");
  const SQL = await initSqlJs();
  const nodes = new Map();
  globalThis.indexedDB = indexedDB;
  globalThis.window = { initSqlJs: () => Promise.resolve(SQL) };
  globalThis.location = { hash: "#lab/hands-linux-health/0" };
  globalThis.document = {
    querySelector: (selector) => {
      if (!nodes.has(selector))
        nodes.set(selector, {
          innerHTML: "",
          textContent: "",
          value: "",
          disabled: false,
        });
      return nodes.get(selector);
    },
  };
  const node = (selector) => document.querySelector(selector);
  let context;
  try {
    await store.initialize();
    state.records = {};
    for (const system of ["linux", "postgres", "oracle"]) {
      const lesson = health.find((item) => item.diagnosticSystem === system);
      const course = courses.find((item) => item.id === lesson.course);
      context = { key: lesson.id, task: lesson };
      mountWritten(context, course, lesson.index, () => true);
      assert.match(node("#app").innerHTML, /Sample health-check output/);
      assert.ok(node("#app").innerHTML.includes(esc(lesson.sampleOutput)));
      assert.match(node("#app").innerHTML, /No Docker required/);
      node("#written-answer").oninput({ target: { value: "unknown" } });
      await node("#written-submit").onclick();
      assert.match(node("#written-review").innerHTML, /Incorrect/);
      assert.equal(store.progress()[lesson.id].completed, false);
      node("#written-answer").oninput({ target: { value: lesson.answers[0] } });
      await node("#written-submit").onclick();
      assert.equal(store.progress()[lesson.id].completed, true);
      mountWritten(context, course, lesson.index, () => true);
      assert.match(node("#written-completion").innerHTML, /Correct answer/);
      clearTimeout(context.saveTimer);
    }
    const lesson = health[0],
      course = courses.find((item) => item.id === lesson.course);
    context = {
      key: lesson.id,
      task: {
        ...lesson,
        sampleOutput: '<script>alert("not executable")</script>',
      },
    };
    mountWritten(context, course, lesson.index, () => true);
    assert.match(node("#app").innerHTML, /&lt;script&gt;/);
    assert.doesNotMatch(node("#app").innerHTML, /<script>/);
  } finally {
    clearTimeout(context?.saveTimer);
    delete globalThis.document;
    delete globalThis.location;
    delete globalThis.window;
    delete globalThis.indexedDB;
  }
});
