import test from "node:test";
import assert from "node:assert/strict";
import { javaStrings } from "../java-strings.js";
import { allLessons } from "../curriculum.js?v=collections-complete-1";
import { groupForLesson } from "../src/learning-groups.js";

test("24 string coding exercises form 12 progressive pairs without replacing earlier work", () => {
  const lessons = allLessons.filter(
    (lesson) => lesson.course === "hands-java-strings",
  );
  assert.equal(lessons.length, 24);
  assert.equal(
    allLessons.filter(
      (lesson) =>
        lesson.course !== "hands-java-strings" &&
        !lesson.healthCheck &&
        !lesson.collectionPractice,
    ).length,
    450,
  );
  const pairs = new Map();
  for (const [i, lesson] of lessons.entries()) {
    assert.equal(lesson.type, "workspace");
    assert.equal(lesson.engine, "java");
    assert.equal(groupForLesson.get(lesson.id).id, "java-oop");
    assert.equal(lesson.section, "Strings & text processing");
    assert.ok(lesson.verify.includes("Expected IllegalArgumentException"));
    assert.ok(
      lesson.mission && lesson.goal && lesson.example && lesson.learn.length,
    );
    assert.match(lesson.starter, /\/\* TODO \*\//);
    assert.doesNotMatch(lesson.starter, /UnsupportedOperationException/);
    assert.notEqual(lesson.starter, lesson.solution);
    if (i)
      assert.deepEqual(lesson.prerequisites, [`hands-java-strings:${i - 1}`]);
    const pair = pairs.get(lesson.topic) || [];
    pair.push(lesson.questionNumber);
    pairs.set(lesson.topic, pair);
  }
  assert.equal(pairs.size, 12);
  for (const pair of pairs.values()) assert.deepEqual(pair, [1, 2]);
  assert.equal(javaStrings.lessons.length, lessons.length);
});
