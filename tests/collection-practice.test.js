import test from "node:test";
import assert from "node:assert/strict";
import { allLessons } from "../curriculum.js?v=mission-roles-1";
import { collectionTopics } from "../collection-methods.js";
import { algorithmTopics } from "../algorithm-practice.js";
import { groupForLesson } from "../src/learning-groups.js";

test("collections progression adds two executable challenges for each of 50 topics", () => {
  const practice = allLessons.filter((lesson) => lesson.collectionPractice);
  assert.equal(
    allLessons.filter((lesson) => !lesson.collectionPractice).length,
    516,
  );
  assert.equal(practice.length, 100);
  assert.equal(collectionTopics.length, 31);
  assert.equal(algorithmTopics.length, 19);
  for (const topic of [...collectionTopics, ...algorithmTopics]) {
    const pair = practice.filter((lesson) => lesson.topic === topic.name);
    assert.deepEqual(
      pair.map((lesson) => lesson.questionNumber),
      [1, 2],
      topic.name,
    );
    assert.equal(pair[1].prerequisites[0], pair[0].id);
    for (const lesson of pair) {
      assert.equal(groupForLesson.get(lesson.id).id, "java-collections");
      assert.equal(lesson.type, "workspace");
      assert.equal(lesson.engine, "java");
      assert.ok(lesson.sample.input && lesson.sample.output);
      assert.ok(
        lesson.usage && lesson.complexity && lesson.methodCoverage.length,
      );
      assert.match(lesson.starter, /\/\* TODO \*\//);
      assert.doesNotMatch(
        lesson.starter,
        /UnsupportedOperationException|private static void require/,
      );
      assert.match(lesson.verify, /DEVLAB_TESTS_PASSED/);
      assert.match(lesson.verify, /expect\(/);
      assert.notEqual(lesson.starter, lesson.solution);
    }
  }
});

test("practical ArrayList method families have explicit exercises and ownership contracts", () => {
  const topics = collectionTopics.filter((topic) =>
    topic.name.startsWith("ArrayList"),
  );
  assert.equal(topics.length, 5);
  const covered = topics.flatMap((topic) => topic.methods).join(" ");
  for (const method of [
    "add(int,E)",
    "addAll",
    "set",
    "remove(int)",
    "remove(Object)",
    "removeIf",
    "removeAll",
    "retainAll",
    "replaceAll",
    "sort",
    "subList",
    "clear",
    "ensureCapacity",
    "trimToSize",
    "toArray",
  ])
    assert.ok(covered.includes(method), method);
  for (const topic of topics) {
    assert.ok(topic.usage.length > 40);
    assert.ok(topic.complexity.length > 30);
  }
});
