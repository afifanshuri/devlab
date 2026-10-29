import test from "node:test";
import assert from "node:assert/strict";
import { allLessons } from "../curriculum.js";
import {
  exerciseBrief,
  renderExerciseBrief,
} from "../src/views/exercise-brief.js";
import { advancedSamples } from "../src/exercise-samples.js";

const headings = [
  "Mission",
  "Sample input and output",
  "What I’m learning",
  "Acceptance criteria",
];
test("every exercise brief has exactly the four requested sections and safe samples", () => {
  for (const task of allLessons) {
    const brief = exerciseBrief(task, task.id);
    assert.ok(
      brief.mission && brief.sample.input && brief.sample.output,
      task.id,
    );
    assert.ok(brief.learn.length && brief.requirements.length, task.id);
    const html = renderExerciseBrief(task, task.id);
    assert.deepEqual(
      [...html.matchAll(/<h2>(.*?)<\/h2>/g)].map((match) => match[1]),
      headings,
      task.id,
    );
    assert.doesNotMatch(
      html,
      /Your goal|Interview discussion|Explore the concept|Builds on|Get a hint|Reference solution|Example assertion:|expect\(/,
      task.id,
    );
    assert.deepEqual(
      brief.requirements,
      task.requirements,
      "Keep the actual acceptance contract: " + task.id,
    );
  }
});
test("advanced test-harness excerpts become explicit input/output examples", () => {
  const oldAssertions = allLessons.filter((task) =>
    task.example?.includes("Example assertion:"),
  );
  assert.equal(oldAssertions.length, 102);
  assert.equal(Object.keys(advancedSamples).length, 102);
  for (const task of oldAssertions) {
    assert.ok(advancedSamples[task.id], task.id);
    assert.doesNotMatch(
      JSON.stringify(exerciseBrief(task, task.id).sample),
      /Challenge\.|expect\(|throw new|Example assertion/,
    );
  }
});
test("the shown batching mission combines a cafe scenario with a concrete outcome", () => {
  const task = allLessons.find(
    (lesson) => lesson.id === "hands-java-advanced:46",
  );
  const brief = exerciseBrief(task, task.id);
  assert.match(brief.mission, /café/);
  assert.match(brief.mission, /original sequence/);
  assert.match(brief.mission, /independent, unmodifiable/);
  assert.match(brief.sample.input, /capacity: 2/);
  assert.match(brief.sample.output, /\[\["a", "b"\], \["c"\]\]/);
  assert.ok(
    brief.requirements.some((item) => item.includes("Implement batches")),
  );
});
test("theory samples describe the output format without revealing the answer", () => {
  const task = allLessons.find(
    (lesson) => lesson.id === "hands-linux-health:0",
  );
  const brief = exerciseBrief(task, task.id);
  assert.equal(brief.sample.input, task.sampleOutput);
  assert.equal(
    brief.sample.output,
    "One number in the stated units and rounding format.",
  );
  assert.ok(!brief.sample.output.includes(task.answers[0]));
});
test("brief rendering escapes scenario, learning points, samples and criteria", () => {
  const task = {
    mission: '<img src=x onerror="alert(1)">',
    goal: "Describe this value.",
    learn: ["<script>bad</script>"],
    requirements: ["<b>rule</b>"],
    sample: { input: "<input>", output: "<output>" },
  };
  const html = renderExerciseBrief(task, "test");
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;input&gt;/);
  assert.doesNotMatch(html, /<img|<script>|<input>|<b>rule/);
});
