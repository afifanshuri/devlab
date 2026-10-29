import { make } from "./exercise-factories.js";
import { javaTopics } from "./advanced-java.js?v=focused-missions-1";
import { sqlTopics } from "./advanced-sql.js";
import { linuxTopics } from "./advanced-linux.js";
import {
  focusedWorkspace,
  supportDescription,
} from "./advanced-java-workspace.js";
import { plainOutcome } from "./advanced-java-outcomes.js";
const marker = 'System.out.println("DEVLAB_TESTS_PASSED");';
function javaPair(base, topic) {
  const source = (specs) =>
    `import java.util.*; import java.util.function.*; import java.util.concurrent.*; import java.util.concurrent.atomic.*; ${base.framework === "spring" ? "import lab.*;" : ""}\npublic class Challenge {\n${specs.map((s) => `  ${s.signature} { ${s.body} }`).join("\n")}\n}\n`;
  return topic.questions.map((question, i) => {
    const { helpers, files } = focusedWorkspace(base, topic, i);
    const specs = [...helpers, question];
    const tests = specs.map((s) => `{ ${s.tests} }`).join("\n");
    return {
      ...base,
      title: `${topic.name} ${i + 1}/2 · ${question.title}`,
      mission: `${question.mission} ${plainOutcome(topic.name, i)}`,
      goal: question.goal,
      task: question.goal,
      requirements: [question.goal],
      workspaceGuide:
        `Write your answer in Challenge.java. ${supportDescription(files, helpers)}`.trim(),
      concept: `${topic.name}: solve the stated problem using only its supplied inputs and relevant helpers.`,
      filename: "Challenge.java",
      starter: source([...helpers, { ...question, body: "/* TODO */" }]),
      solution: source(specs),
      editableFiles: files,
      solutionFiles: files,
      files: {},
      verify: `import java.util.*; import java.util.function.*; import java.util.concurrent.*; import java.util.concurrent.atomic.*;
${base.framework === "spring" ? "import lab.*;" : ""}
public class Verify {
  public static void main(String[] args) throws Exception {
    ${tests}
    ${marker}
  }
  static void expect(boolean value) { if (!value) throw new AssertionError("Task contract failed"); }
  static void rejects(Runnable action) { try { action.run(); } catch (IllegalArgumentException expected) { return; } throw new AssertionError("Expected IllegalArgumentException"); }
}
`,
      example: question.example,
      hint:
        question.hint ||
        "Use the sample and acceptance criteria to check ordering, invalid inputs and changes to caller-owned state.",
      advancedTopic: topic.name,
      challengeNumber: i + 1,
      learn: [topic.name, "Boundary cases", "Composition and failure handling"],
      prerequisites: [i ? `hands-java-advanced:${topic.offset}` : topic.base],
      reuseNote: helpers.length
        ? "Reuse the completed helper supplied in Challenge.java."
        : undefined,
    };
  });
}
export function advancedCourses(existing) {
  const byId = new Map(
    existing.flatMap((c) => c.lessons.map((l, i) => [`${c.id}:${i}`, l])),
  );
  let offset = 0;
  const javaLessons = javaTopics.flatMap((topic) => {
    topic.offset = offset;
    const pair = javaPair(byId.get(topic.base), topic);
    offset += 2;
    return pair;
  });
  const result = [
    make(
      "java-advanced",
      "java",
      "Advanced Java · two challenges per concept",
      "Focused scenarios with supplied supporting components and one new method per challenge.",
      ["Advanced", "SOLID", "Design patterns", "Spring"],
      javaLessons,
    ),
  ];
  for (const [track, topics] of [
    ["sql", sqlTopics],
    ["linux", linuxTopics],
  ]) {
    if (!topics.length) continue;
    const lessons = topics.flatMap((topic) =>
      topic.questions.map((lesson, i) => ({
        ...lesson,
        advancedTopic: topic.name,
        challengeNumber: i + 1,
        title: `${topic.name} ${i + 1}/2 · ${lesson.title}`,
        learn: [topic.name, "Edge cases", "Repeatable results"],
        prerequisites: [
          i
            ? `hands-${track}-advanced:${topics.indexOf(topic) * 2}`
            : topic.base,
        ],
        reuseNote: i
          ? "Reuse the techniques from the first challenge and handle the additional failure cases."
          : "Build on the prerequisite rather than repeating its basic drill.",
      })),
    );
    result.push(
      make(
        `${track}-advanced`,
        track,
        `Advanced ${track === "sql" ? "SQL" : "Linux"} · two challenges per concept`,
        "Paired operational scenarios with explicit contracts and internal test cases.",
        ["Advanced", "Applied practice"],
        lessons,
      ),
    );
  }
  for (const course of result) {
    course.level = "Advanced";
    course.minutes = course.lessons.length * 25;
  }
  return result;
}
