import test from "node:test";
import assert from "node:assert/strict";
import initSqlJs from "sql.js";
import { indexedDB } from "fake-indexeddb";
import { courses, allLessons } from "../content.js";
import * as store from "../database.js";
import { createApp } from "../runner/server.js";
const SQL = await initSqlJs();
globalThis.indexedDB = indexedDB;
globalThis.window = { initSqlJs: () => Promise.resolve(SQL) };
await store.initialize();
test("every exercise is a coding task, with unique versioned IDs", () => {
  assert.equal(courses.length, 8);
  assert.equal(allLessons.length, 16);
  assert.equal(new Set(allLessons.map((l) => l.id)).size, 16);
  for (const l of allLessons) {
    assert.equal(l.type, "workspace");
    assert.ok(l.task && l.starter && l.solution && l.hint);
    assert.equal(l.choices, undefined);
    assert.ok(l.id.startsWith("hands-"));
  }
});
test("new task progress persists and survives a database reload", async () => {
  const id = allLessons[0].id;
  await store.saveLesson(id, "draft", true);
  await store.saveLesson(id, "updated", false);
  await store.setting("name", "Learner");
  const backup = store.exportDatabase();
  await store.initialize();
  assert.equal(store.progress()[id].completed, true);
  assert.equal(store.progress()[id].draft, "updated");
  await store.saveLesson(allLessons[1].id, "extra", true);
  await store.importDatabase(
    backup,
    allLessons.map((l) => l.id),
  );
  assert.equal(store.progress()[allLessons[1].id], undefined);
  const bad = new SQL.Database();
  bad.run("CREATE VIEW progress AS SELECT 1");
  await assert.rejects(
    () =>
      store.importDatabase(
        bad.export(),
        allLessons.map((l) => l.id),
      ),
    /Not a DevLab/,
  );
  bad.close();
  assert.equal(store.setting("name"), "Learner");
});
test("old quiz progress cannot count as completed practical work", async () => {
  const { state } = await import("../src/state.js");
  const { completed } = await import("../src/catalog-data.js");
  state.records = {
    "java-dsa:0": { completed: true },
    [allLessons[0].id]: { completed: true },
  };
  assert.equal(completed(), 1);
  state.records = {};
});
test("shared escaping handles code and profile markup", async () => {
  const { esc } = await import("../src/ui.js");
  assert.equal(esc('<script>"&'), "&lt;script&gt;&quot;&amp;");
});
test("all screens and practical tasks render without missing references", async () => {
  const nodes = new Map();
  globalThis.document = {
    querySelector(s) {
      if (!nodes.has(s)) nodes.set(s, { innerHTML: "", value: "", style: {} });
      return nodes.get(s);
    },
    querySelectorAll() {
      return [];
    },
  };
  globalThis.location = { hash: "#labs", hostname: "github.io" };
  try {
    const { catalog } = await import("../src/views/catalog.js");
    catalog();
    assert.match(nodes.get("#app").innerHTML, /16 exercises/);
    assert.equal(
      (nodes.get("#cards").innerHTML.match(/<article/g) || []).length,
      8,
    );
    for (const [file, names] of [
      ["progress", ["progressPage", "paths"]],
      ["playground", ["playground"]],
      ["settings", ["settings"]],
    ]) {
      const m = await import("../src/views/" + file + ".js");
      for (const n of names) m[n]();
    }
    const { lesson } = await import("../src/views/workspace.js");
    for (const l of allLessons) {
      lesson(l.course, l.index);
      assert.ok(nodes.get("#app").innerHTML.includes(l.title));
      assert.ok(!nodes.get("#app").innerHTML.includes("data-choice"));
    }
  } finally {
    delete globalThis.document;
    delete globalThis.location;
  }
});
test("runner API enforces origin, host, authentication and file boundaries", async () => {
  let calls = 0;
  const sessions = {
    async create() {
      calls++;
      return { id: "test-session" };
    },
    async remove() {},
    async exclusive(id, fn) {
      return fn({});
    },
    async write() {},
  };
  const server = createApp(sessions);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    assert.equal((await fetch(base + "/api/session")).status, 403);
    assert.equal(
      (
        await fetch(base + "/api/session", {
          headers: {
            "Sec-Fetch-Site": "same-origin",
            Origin: "https://evil.example",
          },
        })
      ).status,
      403,
    );
    const r = await fetch(base + "/api/session", {
      headers: { "Sec-Fetch-Site": "same-origin" },
    });
    const { token } = await r.json();
    assert.ok(token);
    assert.equal(
      (
        await fetch(base + "/api/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      403,
    );
    assert.equal(calls, 0);
    assert.equal(
      (
        await fetch(base + "/api/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Devlab-Token": token,
          },
          body: JSON.stringify({ lessonId: allLessons[0].id }),
        })
      ).status,
      200,
    );
    assert.equal(calls, 1);
    assert.equal((await fetch(base + "/runner/http.js")).status, 403);
    assert.equal((await fetch(base + "/.git/config")).status, 403);
    const invalid = await fetch(base + "/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Devlab-Token": token },
      body: JSON.stringify({ id: "test-session", filename: "../secret" }),
    });
    assert.equal(invalid.status, 400);
  } finally {
    await new Promise((r) => server.close(r));
  }
});

test("runner registry restores containers and idle timestamps after restart", async () => {
  const { LabSessions } = await import("../runner/sessions.js");
  const { mkdtemp, readFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const folder = await mkdtemp(path.join(tmpdir(), "devlab-registry-"));
  const file = path.join(folder, "sessions.json");
  try {
    const a = new LabSessions(file);
    const id = "11111111-1111-4111-8111-111111111111";
    a.sessions.set(id, {
      id,
      name: "devlab-" + id,
      lesson: allLessons[0],
      lastUsed: 12345,
      busy: false,
    });
    a.persist();
    const b = new LabSessions(file);
    assert.equal(b.sessions.get(id).lesson.id, allLessons[0].id);
    assert.equal(b.sessions.get(id).lastUsed, 12345);
    b.sessions.clear();
    b.persist();
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")), []);
  } finally {
    await rm(file, { force: true });
    await (await import("node:fs/promises")).rmdir(folder);
  }
});
