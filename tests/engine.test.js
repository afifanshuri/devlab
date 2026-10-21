import test from "node:test";
import assert from "node:assert/strict";
import initSqlJs from "sql.js";
import { indexedDB } from "fake-indexeddb";
import { courses, allLessons } from "../content.js";
import { LinuxSandbox } from "../linux.js";
import { checkStructure, matchesRows } from "../src/services/checks.js";
import * as store from "../database.js";
const SQL = await initSqlJs();

test("curriculum IDs are unique and each lesson has useful feedback", () => {
  assert.equal(courses.length, 8);
  assert.equal(allLessons.length, 32);
  assert.equal(new Set(allLessons.map((l) => l.id)).size, 32);
  for (const l of allLessons) {
    assert.ok(l.concept && l.hint && l.solution);
    if (l.type === "quiz")
      assert.ok(l.answer >= 0 && l.answer < l.choices.length);
  }
});
for (const l of allLessons.filter((l) => l.type === "code")) {
  test(`guided code checks accept the reference and reject an empty/comment-only answer: ${l.id}`, () => {
    assert.ok(checkStructure(l.solution, l.checks).every((x) => x.pass));
    assert.ok(checkStructure("", l.checks).every((x) => !x.pass));
    assert.ok(
      checkStructure("/* " + l.solution + " */", l.checks).every(
        (x) => !x.pass,
      ),
    );
  });
}
for (const l of allLessons.filter((l) => l.type === "terminal")) {
  test(`Linux task checks actual state: ${l.id}`, () => {
    const s = new LinuxSandbox();
    assert.equal(s.check(l.goal), false);
    for (const command of l.solution.split("\n")) s.run(command);
    assert.equal(s.check(l.goal), true);
    s.reset();
    assert.equal(s.check(l.goal), false);
  });
}
test("Linux sandbox does not execute unsupported OS commands", () => {
  const s = new LinuxSandbox();
  assert.match(s.run("rm -rf /"), /not supported/);
  assert.ok(s.fs["/etc/app.conf"]);
  assert.match(s.run("cat notes.txt; whoami"), /not supported/);
  assert.match(s.run("touch /missing/file"), /parent directory/);
  assert.equal(s.path("../../../../etc/app.conf"), "/etc/app.conf");
  s.run("chmod 600 /etc/app.conf");
  assert.match(s.run("ls -l /etc/app.conf"), /^-rw-------/);
});
for (const l of allLessons.filter((l) => l.type === "sql")) {
  test(`SQLite produces the required rows: ${l.id}`, () => {
    const db = new SQL.Database();
    db.run(
      "CREATE TABLE departments(id INTEGER PRIMARY KEY,name TEXT); INSERT INTO departments VALUES(1,'Engineering'),(2,'Operations'); CREATE TABLE employees(id INTEGER PRIMARY KEY,name TEXT,department_id INTEGER,salary INTEGER); INSERT INTO employees VALUES(1,'Alex',1,85000),(2,'Maya',1,95000),(3,'Sam',2,60000),(4,'Noor',2,72000);",
    );
    assert.ok(matchesRows(db.exec(l.solution)[0].values, l.expected));
    assert.equal(matchesRows([], l.expected), false);
    db.close();
  });
}
test("SQLite progress persists, survives reload and round trips a validated backup", async () => {
  globalThis.indexedDB = indexedDB;
  globalThis.window = { initSqlJs: () => Promise.resolve(SQL) };
  await store.initialize();
  await store.saveLesson("java-dsa:0", "draft", true);
  await store.saveLesson("java-dsa:0", "updated draft", false);
  assert.equal(store.progress()["java-dsa:0"].completed, true);
  await store.setting("name", "<img src=x onerror=alert(1)>");
  const backup = store.exportDatabase();
  await store.initialize();
  assert.equal(store.progress()["java-dsa:0"].draft, "updated draft");
  await store.saveLesson("java-dsa:1", "extra", true);
  await store.importDatabase(
    backup,
    allLessons.map((l) => l.id),
  );
  assert.equal(store.progress()["java-dsa:1"], undefined);
  assert.equal(store.progress()["java-dsa:0"].completed, true);
  assert.equal(store.setting("name"), "<img src=x onerror=alert(1)>");
  await assert.rejects(() =>
    store.importDatabase(
      new Uint8Array([1, 2, 3]),
      allLessons.map((l) => l.id),
    ),
  );
  const invalid = new SQL.Database();
  invalid.run("CREATE VIEW progress AS SELECT 1 AS lesson_id;");
  await assert.rejects(
    () =>
      store.importDatabase(
        invalid.export(),
        allLessons.map((l) => l.id),
      ),
    /Not a DevLab/,
  );
  invalid.close();
  assert.equal(store.progress()["java-dsa:0"].completed, true);
});
