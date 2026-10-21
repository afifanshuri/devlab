const java = (title, concept, task, signature, body, tests, hint) => ({
  title,
  concept,
  task,
  engine: "java",
  type: "workspace",
  filename: "Main.java",
  starter: `import java.util.*;\nimport java.util.function.*;\n\npublic class Main {\n  ${signature} {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n`,
  solution: `import java.util.*;\nimport java.util.function.*;\n\npublic class Main {\n  ${signature} {\n    ${body}\n  }\n}\n`,
  verify: `import java.util.*;\nimport java.util.function.*;\npublic class Verify {\n public static void main(String[] args) {\n ${tests}\n System.out.println("DEVLAB_TESTS_PASSED");\n }\n static void expect(boolean ok) { if(!ok) throw new AssertionError("A task requirement failed"); }\n}\n`,
  hint,
});
const linux = (
  title,
  concept,
  task,
  solution,
  check,
  files = {},
  hint = "Use ls, cat and the supplied task paths to inspect the workspace.",
) => ({
  title,
  concept,
  task,
  engine: "linux",
  type: "workspace",
  filename: "notes.sh",
  starter: "# Write your commands here. Check answer runs this script.\n",
  solution,
  check: "set -eu\n" + check + "\necho DEVLAB_TESTS_PASSED",
  files,
  hint,
});
const seed = `CREATE TABLE employees(id int PRIMARY KEY, name text, department text, salary int); INSERT INTO employees VALUES(1,'Alex','Engineering',85000),(2,'Maya','Engineering',95000),(3,'Sam','Operations',60000),(4,'Noor','Operations',72000);`;
const pg = (title, concept, task, solution, assertion, hint) => ({
  title,
  concept,
  task,
  engine: "postgres",
  type: "workspace",
  filename: "solution.sql",
  starter:
    "-- Write your PostgreSQL solution here.\n-- Check answer runs this SQL and verifies its results.\n",
  solution,
  seed,
  check: `DO $$ BEGIN IF (${assertion}) IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Task result does not match requirements'; END IF; END $$;\nSELECT 'DEVLAB_TESTS_PASSED';`,
  hint,
});
const oracle = (title, concept, task, solution, expectedOutput) => ({
  title,
  concept,
  task,
  engine: "oracle",
  type: "workspace",
  filename: "solution.sql",
  starter: "SET SERVEROUTPUT ON\n-- Write your PL/SQL block here\n",
  solution,
  expectedOutput,
  hint: "Oracle PL/SQL needs Oracle Database, not PostgreSQL or SQLite. The optional Oracle environment is described in README.",
});
const make = (id, track, title, description, tags, lessons) => ({
  id: "hands-" + id,
  track,
  title,
  description,
  tags,
  lessons,
  level: track === "linux" ? "Beginner to intermediate" : "Intermediate",
  minutes: 30,
  symbol: track === "java" ? "{ }" : track === "linux" ? ">_" : "SQL",
});

export { java, linux, pg, oracle, make };

export function javaProject(
  title,
  concept,
  task,
  interview,
  sources,
  tests,
  hint,
) {
  const [filename, [starter, solution]] = Object.entries(sources)[0];
  return {
    title,
    concept,
    task,
    interview,
    hint,
    engine: "java",
    type: "workspace",
    filename,
    starter,
    solution,
    editableFiles: Object.fromEntries(
      Object.entries(sources)
        .slice(1)
        .map(([name, pair]) => [name, pair[0]]),
    ),
    solutionFiles: Object.fromEntries(
      Object.entries(sources)
        .slice(1)
        .map(([name, pair]) => [name, pair[1]]),
    ),
    learn: [
      title,
      "Separate contracts from implementations",
      "Behavioural and edge-case tests",
    ],
    verify: `import java.util.*; import java.util.concurrent.*; import java.util.concurrent.atomic.*;
public class Verify {
 static void expect(boolean ok) { if (!ok) throw new AssertionError("Pattern contract failed"); }
 static void rejects(Runnable r) { try { r.run(); } catch (IllegalArgumentException e) { return; } throw new AssertionError("Expected IllegalArgumentException"); }
 public static void main(String[] args) throws Exception { ${tests} System.out.println("DEVLAB_TESTS_PASSED"); }
}`,
  };
}
