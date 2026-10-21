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
  assert.equal(courses.length, 18);
  assert.equal(allLessons.length, 69);
  assert.equal(new Set(allLessons.map((l) => l.id)).size, 69);
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
    assert.match(nodes.get("#app").innerHTML, /69 exercises/);
    assert.equal(
      (nodes.get("#cards").innerHTML.match(/<article/g) || []).length,
      18,
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

test("opening an exercise auto-connects and Check answer saves and validates", async () => {
  const nodes = new Map();
  const calls = [];
  let remoteSources = {};
  let reused = false;
  const previousFetch = globalThis.fetch;
  globalThis.document = {
    querySelector(s) {
      if (!nodes.has(s))
        nodes.set(s, { innerHTML: "", value: "", style: {}, textContent: "" });
      return nodes.get(s);
    },
    querySelectorAll() {
      return [];
    },
  };
  globalThis.location = {
    hash: "#lab/" + allLessons[0].course + "/0",
    hostname: "127.0.0.1",
  };
  globalThis.fetch = async (url, options) => {
    const op = url.split("/").pop();
    calls.push({ op, data: options ? JSON.parse(options.body) : null });
    return {
      ok: true,
      json: async () =>
        op === "session"
          ? { token: "unit-token" }
          : op === "start"
            ? { id: "reused-session", output: "Connected", reused }
            : op === "check"
              ? { passed: false, output: "Internal test failed" }
              : op === "read"
                ? {
                    output:
                      remoteSources[JSON.parse(options.body).filename] ??
                      "Saved",
                  }
                : { output: "Saved" },
    };
  };
  try {
    const { lesson } = await import("../src/views/workspace.js");
    const code = document.querySelector("#code");
    code.value = allLessons[0].starter;
    await lesson(allLessons[0].course, 0);
    assert.equal(
      nodes.get("#check").disabled,
      true,
      "Untouched starter cannot be submitted",
    );
    assert.ok(calls.some((c) => c.op === "start"));
    const markup = nodes.get("#app").innerHTML;
    for (const id of ["start", "save", "read", "run"])
      assert.ok(!markup.includes('id="' + id + '"'));
    code.value = "public class Main {}";
    code.oninput();
    assert.equal(nodes.get("#check").disabled, false);
    await nodes.get("#check").onclick();
    assert.ok(
      calls.some((c) => c.op === "write" && c.data.source === code.value),
    );
    assert.equal(calls.at(-1).op, "check");
    assert.match(nodes.get("#output").textContent, /Tests failed/);
    reused = true;
    await lesson(allLessons[0].course, 0);
    assert.ok(calls.some((c) => c.op === "read"));
    assert.equal(
      code.value,
      "public class Main {}",
      "Reopening preserves the saved draft instead of overwriting it with the container file",
    );
    code.value = "   \n";
    code.oninput();
    assert.equal(
      nodes.get("#check").disabled,
      true,
      "Clearing the answer disables submission",
    );
    const count = calls.filter((c) => c.op === "check").length;
    await nodes.get("#check").onclick();
    assert.equal(calls.filter((c) => c.op === "check").length, count);

    const multi = allLessons.find(
      (l) => l.course === "hands-java-architecture",
    );
    const names = [multi.filename, ...Object.keys(multi.editableFiles)];
    code.value = multi.starter;
    reused = true;
    remoteSources = { [multi.filename]: multi.starter, ...multi.editableFiles };
    await lesson(multi.course, multi.index);
    assert.match(nodes.get("#file-tabs").innerHTML, /RegistryClient.java/);
    code.value = multi.solution;
    code.oninput();
    const switchTo = (name) =>
      nodes
        .get("#file-tabs")
        .onclick({ target: { closest: () => ({ dataset: { file: name } }) } });
    switchTo(names[1]);
    assert.equal(code.value, multi.editableFiles[names[1]]);
    code.value = multi.solutionFiles[names[1]];
    code.oninput();
    switchTo(names[0]);
    assert.equal(code.value, multi.solution, "Tab switching retains edits");
    await nodes.get("#check").onclick();
    for (const name of names)
      assert.ok(
        calls.some((c) => c.op === "write" && c.data.filename === name),
      );
    const saved = JSON.parse(store.progress()[multi.id].draft);
    assert.equal(saved.files[names[1]], multi.solutionFiles[names[1]]);
    await lesson(multi.course, multi.index);
    // The browser initializes the textarea from the rendered saved draft.
    assert.ok(
      nodes
        .get("#app")
        .innerHTML.includes((await import("../src/ui.js")).esc(multi.solution)),
    );
    switchTo(names[1]);
    assert.equal(code.value, multi.solutionFiles[names[1]]);
    await nodes.get("#reset").onclick();
    assert.equal(code.value, multi.editableFiles[names[1]]);
    assert.equal(nodes.get("#check").disabled, true);
    assert.equal(
      JSON.parse(store.progress()[multi.id].draft).files[names[0]],
      multi.starter,
    );
  } finally {
    globalThis.fetch = previousFetch;
    delete globalThis.document;
    delete globalThis.location;
  }
});

test("progression prerequisites are valid and acyclic; Java stages retain previous helpers", () => {
  const byId = new Map(allLessons.map((l) => [l.id, l]));
  const visit = (id, path = new Set()) => {
    assert.ok(!path.has(id), "Prerequisite cycle: " + id);
    const next = new Set(path).add(id);
    for (const p of byId.get(id).prerequisites || []) {
      assert.ok(byId.has(p), "Unknown prerequisite: " + p);
      visit(p, next);
    }
  };
  for (const l of allLessons) visit(l.id);
  const pipeline = allLessons.filter(
    (l) =>
      l.track === "java" && l.reuseNote?.includes("Only method signatures"),
  );
  assert.equal(pipeline.length, 15);
  for (const l of pipeline) {
    assert.ok(l.starter.includes("normalize(String value)"));
    assert.ok(l.verify.includes("Main.normalize("));
    assert.ok(l.prerequisites.length);
  }
  const capstone = byId.get("hands-java-capstone:3");
  assert.ok(capstone.starter.includes("executeOnce("));
  assert.ok(capstone.starter.includes("summary("));
  assert.ok(capstone.verify.includes("SecurityException"));
});

test("multi-file drafts preserve allowed sources and ignore injected filenames", async () => {
  const { readDraft, writeDraft, starterFiles, hasChanges } =
    await import("../src/workspace-files.js");
  const task = allLessons.find((l) => l.course === "hands-java-architecture");
  const files = starterFiles(task);
  assert.equal(hasChanges(task, files), false);
  files[task.filename] = task.solution;
  assert.equal(hasChanges(task, files), true);
  const saved = writeDraft(task, files);
  await store.saveLesson(task.id, saved);
  await store.initialize();
  assert.deepEqual(readDraft(task, store.progress()[task.id].draft), files);
  const bad = JSON.parse(saved);
  bad.files["../escape.java"] = "bad";
  bad.files["__proto__"] = "bad";
  assert.deepEqual(readDraft(task, JSON.stringify(bad)), files);
  assert.deepEqual(readDraft(task, "corrupted"), starterFiles(task));
  assert.equal(
    readDraft(
      allLessons.find((l) => l.id === "hands-java-dsa:0"),
      "legacy draft",
    )["Main.java"],
    "legacy draft",
  );
});

test("progressive starters contain contracts instead of earlier reference implementations", () => {
  for (const task of allLessons.filter((l) =>
    l.reuseNote?.includes("Only method signatures"),
  )) {
    assert.ok(!task.starter.includes("return Map.copyOf"));
    assert.ok(!task.starter.includes("totals.merge"));
    assert.ok(task.starter.includes("throw new UnsupportedOperationException"));
  }
  for (const task of allLessons.filter(
    (l) => l.course === "hands-java-architecture",
  )) {
    for (const [name, source] of Object.entries({
      [task.filename]: task.starter,
      ...task.editableFiles,
    })) {
      if (!source.includes("interface "))
        assert.ok(
          source.includes("throw new UnsupportedOperationException"),
          name,
        );
    }
  }
});

test("roadmap sections are covered and missions keep story separate from requirements", () => {
  const required = [
    "Classes and Objects",
    "Attributes and Methods",
    "Access Specifiers",
    "Static Keyword",
    "Final Keyword",
    "Nested Classes",
    "Packages",
    "Object Lifecycle",
    "Inheritance",
    "Abstraction",
    "Method Chaining",
    "Encapsulation",
    "Interfaces",
    "Enums",
    "Record",
    "Method Overloading / Overriding",
    "Initializer Block",
    "Static vs Dynamic Binding",
    "Pass by Value / Pass by Reference",
    "Array vs ArrayList",
    "Set",
    "Map",
    "Queue",
    "Dequeue",
    "Stack",
    "Iterator",
    "Generic Collections",
  ];
  const topics = new Set(allLessons.flatMap((l) => l.roadmapTopics || []));
  for (const topic of required)
    assert.ok(topics.has(topic), "Missing roadmap topic: " + topic);
  assert.deepEqual(
    courses.slice(0, 3).map((c) => c.id),
    ["hands-java-oop-basics", "hands-java-oop-more", "hands-java-collections"],
  );
  for (const l of allLessons) {
    assert.ok(l.mission?.length > 50, "Missing meaningful mission: " + l.id);
    assert.ok(l.requirements.length > 0);
    assert.equal(l.requirements.join(" "), l.task);
    assert.ok(
      l.starter.length < 6500,
      "Starter should contain contracts, not solutions",
    );
  }
});
