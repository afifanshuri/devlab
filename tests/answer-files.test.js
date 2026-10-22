import test from "node:test";
import assert from "node:assert/strict";
import { validateAnswerFiles } from "../runner/answer-files.js";
const file = (path, data = "YQ==") => ({ path, data, mode: "644", type: "f" });
test("saved answers reject traversal, links as parents, oversized files and runner metadata", () => {
  for (const path of [
    "../escape",
    "/tmp/escape",
    "a/../b",
    ".devlab-bashrc",
    ".terminal.pid",
    "a\nfile",
  ])
    assert.throws(() =>
      validateAnswerFiles({ version: 1, entries: [file(path)] }),
    );
  assert.throws(() =>
    validateAnswerFiles({
      version: 1,
      entries: [file("a", Buffer.alloc(64001).toString("base64"))],
    }),
  );
  assert.throws(() =>
    validateAnswerFiles({
      version: 1,
      entries: [
        { type: "l", mode: "777", path: "a", target: "b" },
        file("a/x"),
      ],
    }),
  );
  assert.throws(() =>
    validateAnswerFiles({
      version: 1,
      entries: [{ type: "h", mode: "644", path: "a", target: "missing" }],
    }),
  );
  assert.doesNotThrow(() =>
    validateAnswerFiles({
      version: 1,
      entries: [
        { type: "d", path: "shared", mode: "2775" },
        file("shared/answer"),
      ],
    }),
  );
});

test("saved symbolic links preserve relative targets and cannot leave the workspace", () => {
  const snapshot = (target) => ({
    version: 1,
    entries: [{ type: "l", mode: "777", path: "dir/link", target }],
  });
  assert.doesNotThrow(() => validateAnswerFiles(snapshot("../answer")));
  assert.throws(() => validateAnswerFiles(snapshot("../../escape")));
  assert.throws(() => validateAnswerFiles(snapshot("/etc/passwd")));
});
