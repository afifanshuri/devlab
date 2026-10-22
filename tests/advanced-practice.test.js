import test from "node:test";
import assert from "node:assert/strict";
import { allLessons } from "../curriculum.js";
test("advanced concepts have exactly two executable challenges and keep legacy IDs intact", () => {
  const groups = new Map();
  for (const lesson of allLessons.filter((l) => l.advancedTopic)) {
    const key = lesson.track + ":" + lesson.advancedTopic;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(lesson);
    assert.ok(lesson.goal && lesson.mission && lesson.example);
    assert.ok(
      lesson.engine === "java"
        ? lesson.verify
        : lesson.check || lesson.oracleCheck,
    );
    assert.ok(lesson.prerequisites.length);
    assert.notEqual(lesson.starter, lesson.solution);
    if (lesson.engine === "java")
      assert.doesNotMatch(
        lesson.starter,
        /throw new UnsupportedOperationException/,
      );
  }
  assert.equal(
    allLessons.filter(
      (l) =>
        l.type === "workspace" &&
        !l.advancedTopic &&
        l.course !== "hands-linux-interview",
    ).length,
    142,
  );
  assert.equal(groups.size, 98);
  for (const [topic, pair] of groups) {
    assert.deepEqual(
      pair.map((l) => l.challengeNumber),
      [1, 2],
      topic,
    );
    assert.ok(pair[1].prerequisites.includes(pair[0].id), topic);
    assert.notEqual(pair[0].solution, pair[1].solution, topic);
  }
});
