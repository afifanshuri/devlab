import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../runner/server.js";
import { LabSessions } from "../runner/sessions.js";
import { allLessons } from "../content.js";
test(
  "real HTTP workflow starts, saves, checks and cleans PostgreSQL and Spring workspaces",
  { timeout: 90000 },
  async () => {
    const sessions = new LabSessions(),
      server = createApp(sessions);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = "http://127.0.0.1:" + server.address().port;
    const token = await fetch(base + "/api/session", {
      headers: { "Sec-Fetch-Site": "same-origin" },
    }).then((r) => r.json());
    const call = async (op, data) => {
      const r = await fetch(base + "/api/" + op, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Devlab-Token": token.token,
        },
        body: JSON.stringify(data),
      });
      const body = await r.json();
      assert.equal(r.status, 200, body.error);
      return body;
    };
    try {
      for (const id of ["hands-sql-relational:0", "hands-java-spring-core:2"]) {
        const task = allLessons.find((l) => l.id === id),
          start = await call("start", { lessonId: id });
        assert.equal((await call("start", { lessonId: id })).id, start.id);
        for (const [filename, source] of Object.entries({
          [task.filename]: task.solution,
          ...task.solutionFiles,
        }))
          await call("write", { id: start.id, filename, source });
        const checked = await call("check", { id: start.id });
        assert.equal(checked.passed, true, checked.output);
        assert.equal(checked.runtimeRetained, true);
        assert.equal(sessions.sessions.has(start.id), false);
      }
    } finally {
      await sessions.clear();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
