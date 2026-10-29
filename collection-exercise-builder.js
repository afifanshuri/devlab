import { make } from "./exercise-factories.js";

export const J = String.raw;
export const exercise = (
  title,
  mission,
  goal,
  signature,
  body,
  tests,
  input,
  output,
  extras = {},
) => ({
  title,
  mission,
  goal,
  signature,
  body,
  tests,
  input,
  output,
  ...extras,
});
export const topic = (
  name,
  section,
  methods,
  usage,
  complexity,
  first,
  second,
) => ({
  name,
  section,
  methods,
  usage,
  complexity,
  questions: [first, second],
});
const imports =
  "import java.util.*;\nimport java.util.function.*;\nimport java.util.stream.*;\nimport java.util.concurrent.*;\nimport java.util.concurrent.atomic.*;\n";
export function buildPractice(id, title, topics) {
  return make(
    id,
    "java",
    title,
    "Two practical challenges per topic, covering method contracts, choosing a structure, boundaries and algorithm costs.",
    ["Collections", "Algorithms", "Java 21"],
    topics.flatMap((group, topicIndex) =>
      group.questions.map((question, i) => {
        const previousTopic = topics
          .slice(0, topicIndex)
          .findLastIndex((topic) => topic.section === group.section);
        const source = (solution) =>
          `${imports}\npublic class Main {\n${question.support || ""}\n  ${question.signature} {\n    ${solution ? question.body : "/* TODO */"}\n  }\n${solution ? (question.helpers || "") + "\n  private static void require(boolean valid) { if (!valid) throw new IllegalArgumentException(); }\n  private static void valid(Collection<?> values) { require(values != null && values.stream().noneMatch(Objects::isNull)); }\n" : ""}}\n`;
        return {
          type: "workspace",
          engine: "java",
          filename: "Main.java",
          collectionPractice: true,
          learningGroup: "java-collections",
          section: group.section,
          topic: group.name,
          questionNumber: i + 1,
          title: `${group.name} ${i + 1}/2 · ${question.title}`,
          mission: question.mission,
          goal: question.goal,
          task: question.goal,
          requirements: [question.goal],
          sample: { input: question.input, output: question.output },
          example: `Input: ${question.input} → Output: ${question.output}`,
          concept: group.usage,
          learn: [
            ...group.methods,
            "When to use it: " + group.usage,
            "Expected cost: " + group.complexity,
          ],
          methodCoverage: group.methods,
          usage: group.usage,
          complexity: group.complexity,
          hint:
            "Start with the sample, then test empty inputs, duplicates and boundary values. " +
            group.usage,
          prerequisites: [
            i
              ? `hands-${id}:${topicIndex * 2}`
              : previousTopic >= 0
                ? `hands-${id}:${previousTopic * 2 + 1}`
                : id === "java-algorithm-practice"
                  ? "hands-java-collection-methods:61"
                  : "hands-java-collections:6",
          ],
          starter: source(false),
          solution: source(true),
          verify: `${imports}\npublic class Verify {\n public static void main(String[] args) throws Exception {\n${question.tests}\n System.out.println("DEVLAB_TESTS_PASSED");\n }\n static void expect(boolean value) { if(!value) throw new AssertionError("Collection/algorithm contract failed"); }\n static void rejects(Runnable action) { try { action.run(); } catch(IllegalArgumentException expected) { return; } throw new AssertionError("Expected IllegalArgumentException"); }\n static void immutable(Runnable action) { try { action.run(); } catch(UnsupportedOperationException expected) { return; } throw new AssertionError("Expected an unmodifiable result"); }\n}\n`,
        };
      }),
    ),
  );
}
