import test from "node:test";
import assert from "node:assert/strict";
import { LabSessions } from "../runner/sessions.js";
import { createApp } from "../runner/server.js";
test(
  "saved Linux answer files restore after container deletion with directories, modes and links",
  { timeout: 60000 },
  async () => {
    const labs = new LabSessions(),
      app = createApp(labs);
    await new Promise((r) => app.listen(0, "127.0.0.1", r));
    const base = "http://127.0.0.1:" + app.address().port;
    const { token } = await fetch(base + "/api/session", {
      headers: { "Sec-Fetch-Site": "same-origin" },
    }).then((r) => r.json());
    const call = async (body) => {
      const response = await fetch(base + "/api/answer-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Devlab-Token": token,
        },
        body: JSON.stringify(body),
      });
      return { status: response.status, ...(await response.json()) };
    };
    try {
      const first = await labs.create("hands-linux-basics:0");
      await labs.command(
        labs.get(first.id),
        "mkdir -p 'projects/my files' empty; printf 'class Main {}' > projects/Main.java; printf 'saved' > 'projects/my files/answer'; chmod 750 projects/Main.java; ln projects/Main.java projects/hard; ln -s Main.java projects/link; printf 'private' > .devlab-private",
      );
      const saved = await call({ id: first.id });
      assert.equal(saved.status, 200, saved.error);
      assert.ok(
        saved.snapshot.entries.some(
          (e) => e.path === "projects/my files/answer",
        ),
      );
      assert.ok(
        !saved.snapshot.entries.some((e) => e.path.startsWith(".devlab")),
      );
      await labs.remove(first.id);
      const next = await labs.create("hands-linux-basics:0");
      assert.notEqual(next.id, first.id);
      const result = await call({ id: next.id, snapshot: saved.snapshot });
      assert.equal(result.status, 200, result.error);
      const restored = await labs.command(
        labs.get(next.id),
        "test -d empty && test -L projects/link && test $(readlink projects/link) = Main.java && test projects/hard -ef projects/Main.java && test $(stat -c %a projects/Main.java) = 750 && test \"$(cat 'projects/my files/answer')\" = saved && cat projects/link",
      );
      assert.equal(restored.code, 0, restored.output);
      assert.equal(restored.output, "class Main {}");
      const invalid = await call({
        id: next.id,
        snapshot: {
          version: 1,
          entries: [{ type: "f", path: "../bad", mode: "644", data: "" }],
        },
      });
      assert.equal(invalid.status, 400);
      const passed = await labs.checkAnswer(next.id);
      assert.equal(passed.passed, true, passed.output);
    } finally {
      app.terminals.dispose();
      await labs.clear();
      await new Promise((r) => app.close(r));
    }
  },
);
