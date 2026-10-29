import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = "https://afifanshuri.github.io/devlab/";
const localIndex = await readFile(
  new URL("../index.html", import.meta.url),
  "utf8",
);
const entry = localIndex.match(/type="module" src="([^"]+)"/)[1];
const files = [
  "index.html",
  entry,
  "curriculum.js",
  "plain-sql-missions.js",
  "collection-exercise-builder.js",
  "collection-methods.js",
  "algorithm-practice.js",
  "advanced-practice.js",
  "advanced-java-workspace.js",
  "advanced-java-scenarios.js",
  "advanced-java-outcomes.js",
  "advanced-java.js",
  "advanced-linux.js",
  "advanced-sql.js",
  "advanced-oracle.js",
  "linux-interview.js",
  "java-interview.js",
  "java-strings.js",
  "health-checks.js",
  "linux-interview-answers.js",
  "linux-interview-labs.js",
  "src/written-answer.js",
  "src/learning-groups.js",
  "src/views/learning-group.js",
  "src/views/group-navigation.js",
  "src/views/written-workspace.js",
  "sql-roadmap.js",
  "linux-roadmap.js",
  "spring-practice.js",
  "src/views/workspace.js",
  "src/views/exercise-brief.js",
  "src/exercise-samples.js",
  "src/exercise-roles.js",
  "src/editor-input.js",
  "src/terminal-prompt.js",
  "src/views/linux-workspace.js",
  "src/services/interactive-terminal.js",
  "src/services/terminal-display.js",
  "src/services/code-editor.js",
  "vendor/editor/editor.js",
  "vendor/editor/editor.css",
  "vendor/editor/editor.worker.js",
  "vendor/terminal/xterm.js",
  "vendor/terminal/xterm.css",
  "vendor/terminal/addon-fit.js",
  "styles.css",
  "vendor/sql-wasm.wasm",
];
for (const file of files) {
  const url = new URL(file, base);
  url.searchParams.set("smoke", Date.now());
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, file + " is unavailable");
  if (file.endsWith(".wasm")) {
    const data = new Uint8Array(await response.arrayBuffer());
    assert.deepEqual([...data.slice(0, 4)], [0, 97, 115, 109]);
  } else {
    const body = await response.text();
    assert.ok(body.length > 50, file + " is empty");
    if (file === "index.html")
      assert.ok(
        body.includes(entry),
        "Pages has not deployed the current entry point yet",
      );
    if (file === "curriculum.js")
      for (const module of [
        "sql-roadmap.js",
        "linux-roadmap.js",
        "spring-practice.js",
        "collection-methods.js",
        "algorithm-practice.js",
      ])
        assert.ok(body.includes(module), "Missing curriculum module " + module);
    if (file === "src/views/workspace.js")
      assert.ok(
        body.includes('id="save-state"'),
        "Save state control not deployed",
      );
  }
  console.log("PASS", file);
}
console.log(
  "Pages HTTP assets verified. This does not replace an interactive browser test.",
);
