import test from "node:test";
import assert from "node:assert/strict";
import { javaInterview } from "../java-interview.js";
import { allLessons } from "../curriculum.js?v=java-theory-1";
import { groupForLesson } from "../src/learning-groups.js";
import { checkWrittenAnswer } from "../src/written-answer.js";

test("80 Java theory questions form 40 checked pairs and preserve earlier exercises", () => {
  assert.equal(javaInterview.lessons.length, 80);
  assert.equal(
    allLessons.filter((lesson) => lesson.course !== "hands-java-interview")
      .length,
    370,
  );
  const questions = allLessons.filter(
    (lesson) => lesson.course === "hands-java-interview",
  );
  const topics = new Map();
  for (const question of questions) {
    assert.equal(question.track, "java");
    assert.equal(question.type, "written");
    assert.equal(question.engine, "written");
    assert.equal(groupForLesson.get(question.id).id, question.learningGroup);
    assert.ok(
      groupForLesson
        .get(question.id)
        .sections.find((section) =>
          section.lessons.some((lesson) => lesson.id === question.id),
        ),
    );
    assert.equal(question.choices, undefined);
    assert.equal(question.rubric, undefined);
    assert.ok(question.answers.length && question.explanation && question.goal);
    const pair = topics.get(question.topic) || [];
    pair.push(question);
    topics.set(question.topic, pair);
  }
  assert.equal(topics.size, 40);
  for (const pair of topics.values()) {
    assert.deepEqual(
      pair.map((question) => question.questionNumber),
      [1, 2],
    );
    assert.deepEqual(pair[1].prerequisites, [pair[0].id]);
    assert.notEqual(pair[0].mission, pair[1].mission);
  }
  assert.equal(
    new Set(questions.map((question) => question.learningGroup)).size,
    6,
  );
});
for (const [i, question] of javaInterview.lessons.entries()) {
  test("Java theory accepts only defined answers: " + i, () => {
    for (const answer of question.answers) {
      assert.equal(checkWrittenAnswer(question, answer), true);
      assert.equal(checkWrittenAnswer(question, "  " + answer + "  "), true);
      assert.equal(checkWrittenAnswer(question, answer + " because"), false);
    }
    for (const answer of [
      "",
      " ",
      "not sure",
      "any answer",
      "<script>alert(1)</script>",
    ])
      assert.equal(checkWrittenAnswer(question, answer), false);
    if (
      question.answers.length === 1 &&
      ["yes", "no"].includes(question.answers[0])
    )
      assert.equal(
        checkWrittenAnswer(
          question,
          question.answers[0] === "yes" ? "no" : "yes",
        ),
        false,
      );
    if (question.code) {
      assert.ok(question.probe.includes("public static void main"));
      assert.equal(question.answerFormat, "output");
      assert.equal(
        checkWrittenAnswer(question, question.answers[0] + ";"),
        false,
      );
    }
  });
}
test("code output remains case sensitive while annotations accept defined aliases", () => {
  const output = javaInterview.lessons.find(
    (question) => question.answers[0] === "Fx",
  );
  assert.equal(checkWrittenAnswer(output, "fx"), false);
  const annotation = javaInterview.lessons.find((question) =>
    question.answers.includes("@Qualifier"),
  );
  assert.equal(checkWrittenAnswer(annotation, "@Qualifier"), true);
  assert.equal(checkWrittenAnswer(annotation, "Qualifier"), true);
  assert.equal(checkWrittenAnswer(annotation, "@Primary"), false);
});
