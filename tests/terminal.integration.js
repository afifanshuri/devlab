import test from "node:test";
import assert from "node:assert/strict";
import { LabSessions } from "../runner/sessions.js";
test(
  "terminal reports directory changes, failed cd and reconnection accurately",
  { timeout: 30000 },
  async () => {
    const labs = new LabSessions();
    try {
      const info = await labs.create("hands-linux-basics:0"),
        s = labs.get(info.id);
      assert.equal(info.cwd, "/workspace");
      assert.equal(info.workspace, "/workspace");
      let result = await labs.command(
        s,
        "mkdir -p 'notes folder'; cd 'notes folder'",
      );
      assert.equal(result.code, 0);
      assert.equal(result.cwd, "/workspace/notes folder");
      assert.equal((await labs.create(s.lesson.id)).cwd, result.cwd);
      result = await labs.command(s, "cd /tmp");
      assert.equal(result.cwd, "/tmp");
      result = await labs.command(s, "cd /does-not-exist");
      assert.notEqual(result.code, 0);
      assert.equal(result.cwd, "/tmp");
      result = await labs.command(s, "pwd");
      assert.equal(result.output.trim(), "/tmp");
      assert.equal(result.cwd, "/tmp");
    } finally {
      await labs.clear();
    }
  },
);
