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
  "sql-roadmap.js",
  "linux-roadmap.js",
  "spring-practice.js",
  "src/views/workspace.js",
  "src/editor-input.js",
  "src/terminal-prompt.js",
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
      ])
        assert.ok(body.includes(module), "Missing curriculum module " + module);
    if (file === "src/views/workspace.js")
      assert.ok(body.includes("editKey"), "Editor update not deployed");
  }
  console.log("PASS", file);
}
console.log(
  "Pages HTTP assets verified. This does not replace an interactive browser test.",
);
