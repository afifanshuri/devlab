import test from "node:test";
import assert from "node:assert/strict";
import { terminalPrompt } from "../src/terminal-prompt.js";
test("terminal prompt abbreviates the exercise home and preserves other paths", () => {
  assert.equal(terminalPrompt(), "afif@devlab:~$");
  assert.equal(
    terminalPrompt("/workspace/projects"),
    "afif@devlab:~/projects$",
  );
  assert.equal(terminalPrompt("/tmp"), "afif@devlab:/tmp$");
  assert.equal(
    terminalPrompt("/workspace/abc/notes folder", "/workspace/abc"),
    "afif@devlab:~/notes folder$",
  );
  assert.equal(
    terminalPrompt("/workspace-other"),
    "afif@devlab:/workspace-other$",
  );
});
