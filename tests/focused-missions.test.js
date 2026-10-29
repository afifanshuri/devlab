import test from "node:test";
import assert from "node:assert/strict";
import { allLessons } from "../curriculum.js";
import { exerciseBrief } from "../src/views/exercise-brief.js";
import { readDraft, writeDraft } from "../src/workspace-files.js";
const advanced = allLessons.filter(
  (lesson) => lesson.course === "hands-java-advanced",
);
const find = (index) => advanced.find((lesson) => lesson.index === index);

test("all 116 advanced Java challenges focus on one new method and explain supplied files", () => {
  assert.equal(advanced.length, 116);
  for (const lesson of advanced) {
    assert.equal(
      (lesson.starter.match(/\/\* TODO \*\//g) || []).length,
      1,
      lesson.id,
    );
    assert.doesNotMatch(lesson.task, /Keep the prerequisite exercise/);
    assert.doesNotMatch(
      lesson.mission,
      /workshop is shipping a production change/,
    );
    const mission = exerciseBrief(lesson, lesson.id).mission;
    assert.match(mission, /Write your answer in Challenge.java/);
    assert.doesNotMatch(
      mission,
      /Implement|IllegalArgumentException|polymorphically|instanceof|public static/,
    );
    for (const [file, code] of Object.entries(lesson.editableFiles)) {
      assert.doesNotMatch(code, /\/\* TODO \*\//, file);
      assert.ok(lesson.workspaceGuide.includes(file), lesson.id + ": " + file);
    }
  }
});

test("batching and interleaving do not carry DayPlan or each other's work", () => {
  const batches = find(46),
    interleave = find(47);
  for (const lesson of [batches, interleave]) {
    assert.deepEqual(lesson.editableFiles, {});
    assert.doesNotMatch(
      lesson.verify + lesson.starter + lesson.task,
      /DayPlan|append\(/,
    );
  }
  assert.doesNotMatch(interleave.starter + interleave.verify, /batches\(/);
  const mission = exerciseBrief(batches, batches.id).mission;
  assert.match(mission, /maximum number of orders/);
  assert.match(mission, /capacity 2/);
  assert.match(mission, /not fixed at 2/);
  assert.doesNotMatch(mission, /Implement|IllegalArgumentException/);
});

test("a genuinely reused method is provided rather than becoming a second TODO", () => {
  const lesson = find(61);
  assert.match(lesson.starter, /lowerBound/);
  assert.match(
    lesson.workspaceGuide,
    /earlier step needed by this question is already completed/,
  );
  assert.doesNotMatch(find(63).starter, /topK/);
  assert.match(find(97).starter, /Handover merge\(/);
});

test("old multi-file answer envelopes preserve current answers and omit unrelated tabs", () => {
  const lesson = find(46);
  const answer = "public class Challenge { /* my saved answer */ }";
  const files = readDraft(
    lesson,
    JSON.stringify({
      version: 1,
      files: { "Challenge.java": answer, "DayPlan.java": "old saved helper" },
    }),
  );
  assert.deepEqual(files, { "Challenge.java": answer });
  assert.deepEqual(readDraft(lesson, writeDraft(lesson, files)), files);
});

test("missions show plain outcomes and the file guide without copying Java contracts", () => {
  const lesson = {
    ...find(46),
    goal: "Reject invalid capacity before creating a batch.",
    workspaceGuide: "Complete batches in Challenge.java.",
  };
  const brief = exerciseBrief(lesson, lesson.id);
  assert.ok(!brief.mission.includes(lesson.goal));
  assert.ok(brief.mission.includes(lesson.workspaceGuide));
});

test("plain SQL missions retain actual numeric boundaries and report inputs", () => {
  const brief = (id) => {
    const task = allLessons.find((lesson) => lesson.id === id);
    return exerciseBrief(task, id);
  };
  const salary = brief("hands-sql-postgres:0").mission;
  assert.match(salary, /90000.*high.*70000.*mid/);
  assert.doesNotMatch(salary, /LANGUAGE|RETURNS|Create or replace/);
  assert.match(brief("hands-sql-oracle:0").mission, /at least 50 pass/);
  assert.match(brief("hands-sql-advanced:29").mission, /minimum salary/);
  assert.match(brief("hands-sql-advanced:29").mission, /ID or salary/);
  assert.match(
    brief("hands-sql-advanced:33").mission,
    /missing or negative amount/,
  );
});
