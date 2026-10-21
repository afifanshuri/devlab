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
        for (const [name, body] of Object.entries(lesson.solutionFiles || {}))
          await labs.write(s, name, body);
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
  "reuse, reset, pass cleanup, navigation and one-hour expiry",
  { timeout: 60000 },
  async () => {
    const labs = new LabSessions();
    try {
      const lesson = allLessons.find((l) => l.id === "hands-java-dsa:0");
      const first = await labs.create(lesson.id);
      await labs.command(labs.get(first.id), "touch /workspace/keep");
      labs.sessions.get(first.id).lastUsed = Date.now() - 59 * 60 * 1000;
      const second = await labs.create(lesson.id);
      assert.equal(second.id, first.id);
      await labs.write(labs.get(first.id), lesson.filename, lesson.solution);
      await labs.resetAnswer(lesson.id);
      assert.equal(
        (await labs.command(labs.get(first.id), "test -f /workspace/keep"))
          .code,
        0,
      );
      assert.equal((await labs.checkAnswer(first.id)).passed, false);
      assert.ok(labs.sessions.has(first.id));
      const other = await labs.create("hands-linux-basics:0");
      assert.ok(labs.sessions.has(first.id));
      await labs.write(labs.get(first.id), lesson.filename, lesson.solution);
      assert.equal((await labs.checkAnswer(first.id)).passed, true);
      assert.equal(labs.sessions.has(first.id), false);
      const shell = labs.sessions.get(other.id);
      shell.lastUsed = Date.now() - 59 * 60 * 1000;
      await labs.expire();
      assert.ok(labs.sessions.has(other.id));
      shell.lastUsed = Date.now() - 61 * 60 * 1000;
      await labs.expire();
      assert.equal(labs.sessions.has(other.id), false);
      const empty = await labs.resetAnswer(lesson.id);
      assert.equal(empty.id, null);
      assert.equal(labs.sessions.size, 0);
    } finally {
      await labs.clear();
    }
  },
);

test(
  "multi-file reset restores every source while preserving the reused container",
  { timeout: 60000 },
  async () => {
    const labs = new LabSessions();
    try {
      const lesson = allLessons.find(
        (l) => l.id === "hands-java-architecture:0",
      );
      const first = await labs.create(lesson.id),
        session = labs.get(first.id);
      const sources = {
        [lesson.filename]: lesson.solution,
        ...lesson.solutionFiles,
      };
      for (const [name, body] of Object.entries(sources))
        await labs.write(session, name, body);
      assert.equal((await labs.check(session)).passed, true);
      await labs.command(session, "echo keep > /workspace/personal-notes.txt");
      assert.equal((await labs.create(lesson.id)).id, first.id);
      await labs.resetAnswer(lesson.id);
      for (const [name, body] of Object.entries({
        [lesson.filename]: lesson.starter,
        ...lesson.editableFiles,
      }))
        assert.equal(
          (await labs.command(session, "cat /workspace/" + name)).output,
          body,
        );
      assert.equal(
        (
          await labs.command(session, "cat /workspace/personal-notes.txt")
        ).output.trim(),
        "keep",
      );
      assert.equal(
        (await labs.check(session)).passed,
        false,
        "Old compiled classes cannot satisfy reset sources",
      );
      for (const [name, body] of Object.entries(sources))
        await labs.write(session, name, body);
      assert.equal((await labs.checkAnswer(first.id)).passed, true);
      assert.equal(labs.sessions.has(first.id), false);
    } finally {
      await labs.clear();
    }
  },
);

test(
  "reset SQL answer cannot reuse an old correct database definition",
  { timeout: 30000 },
  async () => {
    const labs = new LabSessions();
    try {
      const lesson = allLessons.find((l) => l.id === "hands-sql-postgres:0");
      const info = await labs.create(lesson.id);
      const session = labs.get(info.id);
      await labs.write(session, lesson.filename, lesson.solution);
      await labs.command(session, "psql -U postgres -d lab -f solution.sql");
      await labs.resetAnswer(lesson.id);
      assert.equal((await labs.checkAnswer(info.id)).passed, false);
      assert.ok(labs.sessions.has(info.id));
    } finally {
      await labs.clear();
    }
  },
);
