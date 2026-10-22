import { make } from "./exercise-factories.js";
import { javaTopics } from "./advanced-java.js";
import { sqlTopics } from "./advanced-sql.js";
import { linuxTopics } from "./advanced-linux.js";
const marker = 'System.out.println("DEVLAB_TESTS_PASSED");';
function javaPair(base, topic) {
  const source = (specs) =>
    `import java.util.*; import java.util.function.*; import java.util.concurrent.*; import java.util.concurrent.atomic.*; ${base.framework === "spring" ? "import lab.*;" : ""}\npublic class Challenge {\n${specs.map((s) => `  ${s.signature} { ${s.body} }`).join("\n")}\n}\n`;
  return topic.questions.map((question, i) => {
    const specs = topic.questions.slice(0, i + 1);
    const tests = specs.map((s) => `{ ${s.tests} }`).join("\n");
    return {
      ...base,
      title: `${topic.name} ${i + 1}/2 · ${question.title}`,
      mission: question.mission,
      goal: question.goal,
      task: [
        "Keep the prerequisite exercise's public contracts working: " +
          (base.goal || base.task),
        ...specs.map((s) => s.goal),
      ].join(" "),
      requirements: [
        "Keep the prerequisite exercise's public contracts working: " +
          (base.goal || base.task),
        ...specs.map((s) => s.goal),
      ],
      concept: `${topic.name}: extend the earlier component under stricter production constraints. Reason about failures, state ownership and repeatability.`,
      filename: "Challenge.java",
      starter: source(specs.map((s) => ({ ...s, body: "/* TODO */" }))),
      solution: source(specs),
      editableFiles: { [base.filename]: base.starter, ...base.editableFiles },
      solutionFiles: { [base.filename]: base.solution, ...base.solutionFiles },
      verify: (() => {
        let verify = (
          "import java.util.*; import java.util.function.*; import java.util.concurrent.*; import java.util.concurrent.atomic.*;\n" +
          base.verify
        )
          .replace(
            /main\(String\[\] args\)\s*\{/,
            "main(String[] args) throws Exception {",
          )
          .replace(marker, "advancedTests(); " + marker);
        const end = verify.lastIndexOf("}");
        const rejects = /static\s+void\s+rejects\(/.test(verify)
          ? ""
          : 'static void rejects(Runnable r) { try { r.run(); } catch (IllegalArgumentException e) { return; } throw new AssertionError("Expected IllegalArgumentException"); }\n';
        return (
          verify.slice(0, end) +
          rejects +
          "static void advancedTests() throws Exception { " +
          tests +
          " }\n" +
          verify.slice(end)
        );
      })(),
      example: question.example,
      hint:
        question.hint ||
        "Reuse the prerequisite's contracts. Write a failing edge case before implementing the integration; keep failed operations from leaking partial state.",
      interview:
        "Explain your complexity, state ownership and failure ordering. Which guarantee would need a different design across multiple JVMs?",
      advancedTopic: topic.name,
      challengeNumber: i + 1,
      learn: [topic.name, "Boundary cases", "Composition and failure handling"],
      prerequisites: [i ? `hands-java-advanced:${topic.offset}` : topic.base],
      reuseNote: i
        ? "Keep your first Challenge method: this exercise tests both methods and the prerequisite contracts."
        : "Reimplement or bring forward your saved prerequisite answer; its contracts are still tested.",
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
      "Production constraints, design tradeoffs and cumulative contracts beyond the introductory labs.",
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
