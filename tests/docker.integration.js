import test from "node:test";
import assert from "node:assert/strict";
import { allLessons } from "../content.js";
import { LabSessions } from "../runner/sessions.js";
import { must } from "../runner/docker.js";
for (const lesson of allLessons.filter((l) => l.engine !== "oracle")) {
  test(
    "real container rejects starter and accepts reference: " + lesson.id,
    { timeout: 60000 },
    async () => {
      const labs = new LabSessions();
      try {
        const info = await labs.create(lesson.id);
        const s = labs.get(info.id);
        const before = await labs.check(s);
        assert.equal(before.passed, false, before.output);
        await labs.write(s, lesson.filename, lesson.solution);
        if (lesson.engine === "linux") {
          const run = await labs.command(s, "bash notes.sh");
          assert.equal(run.code, 0, run.output);
        }
        const after = await labs.check(s);
        assert.equal(after.passed, true, after.output);
        if (lesson === allLessons[0]) {
          const config = JSON.parse(await must(["inspect", s.name]))[0];
          assert.equal(config.HostConfig.NetworkMode, "none");
          assert.equal(config.HostConfig.ReadonlyRootfs, true);
          assert.deepEqual(config.HostConfig.CapDrop, ["ALL"]);
          assert.ok(!config.Mounts.some((m) => m.Type === "bind"));
          const denied = await labs.command(
            s,
            "echo altered > /checks/Verify.java",
          );
          assert.notEqual(denied.code, 0);
          await assert.rejects(
            () => labs.write(s, "../outside", "x"),
            /Invalid/,
          );
        }
      } finally {
        await labs.clear();
      }
    },
  );
}
test(
  "reset discards filesystem changes and starts a fresh task",
  { timeout: 30000 },
  async () => {
    const labs = new LabSessions();
    try {
      const id = "hands-linux-basics:0";
      const first = await labs.create(id);
      await labs.command(labs.get(first.id), "touch /workspace/temporary");
      const second = await labs.create(id);
      assert.notEqual(first.id, second.id);
      assert.equal(
        (
          await labs.command(
            labs.get(second.id),
            "test -f /workspace/temporary",
          )
        ).code,
        1,
      );
    } finally {
      await labs.clear();
    }
  },
);
