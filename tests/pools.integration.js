import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { LabSessions } from "../runner/sessions.js";
import { must } from "../runner/docker.js";
import { IDLE_MS } from "../runner/pools.js";
async function solve(labs, s) {
  for (const [name, body] of Object.entries({
    [s.lesson.filename]: s.lesson.solution,
    ...s.lesson.solutionFiles,
  }))
    await labs.write(s, name, body);
}
async function running(name) {
  return (
    (await must(["inspect", "--format", "{{.State.Running}}", name])) === "true"
  );
}

test(
  "Java pool isolates files, reuses one container and expires only when the runtime is idle",
  { timeout: 90000 },
  async () => {
    const labs = new LabSessions();
    try {
      const [a, b, duplicate] = await Promise.all([
        labs.create("hands-java-dsa:0"),
        labs.create("hands-java-dsa:1"),
        labs.create("hands-java-dsa:0"),
      ]);
      assert.equal(a.id, duplicate.id);
      const first = labs.get(a.id),
        second = labs.get(b.id),
        pool = labs.pools.items.get("java");
      assert.equal(first.name, second.name);
      assert.notEqual(first.workspace, second.workspace);
      const names = await must([
        "ps",
        "--filter",
        "label=devlab.owner=" + labs.ownerId,
        "--format",
        "{{.Names}}",
      ]);
      assert.deepEqual(names.split("\n"), [pool.name]);
      await solve(labs, first);
      await solve(labs, second);
      await labs.command(second, "echo keep > personal.txt");
      assert.equal((await labs.checkAnswer(first.id)).passed, true);
      assert.equal(labs.sessions.has(first.id), false);
      assert.equal(await running(pool.name), true);
      assert.equal(
        (await labs.command(second, "test ! -e " + first.workspace)).code,
        0,
      );
      assert.equal(
        (await labs.command(second, "cat Main.java")).output,
        second.lesson.solution,
      );
      await labs.resetAnswer(second.lesson.id);
      assert.equal(
        (await labs.command(second, "cat personal.txt")).output.trim(),
        "keep",
      );
      assert.equal((await labs.check(second)).passed, false);
      second.lastUsed = Date.now() - IDLE_MS - 1000;
      pool.lastUsed = Date.now() - IDLE_MS + 1000;
      await labs.expire();
      assert.ok(labs.sessions.has(second.id));
      assert.equal((await labs.create(second.lesson.id)).id, second.id);
      let entered, release;
      const started = new Promise((r) => (entered = r)),
        gate = new Promise((r) => (release = r));
      const busy = labs.exclusive(second.id, async () => {
        entered();
        await gate;
      });
      await started;
      pool.lastUsed = Date.now() - IDLE_MS - 1000;
      await labs.expire();
      assert.ok(labs.pools.items.has("java"));
      release();
      await busy;
      pool.lastUsed = Date.now() - IDLE_MS - 1000;
      await labs.expire();
      assert.equal(labs.sessions.size, 0);
      assert.equal(labs.pools.items.size, 0);
    } finally {
      await labs.clear();
    }
  },
);

test(
  "PostgreSQL pool isolates databases and passwords, cleans one lab and keeps another usable",
  { timeout: 90000 },
  async () => {
    const labs = new LabSessions();
    try {
      const a = await labs.create("hands-sql-queries:0"),
        b = await labs.create("hands-sql-queries:1");
      const first = labs.get(a.id),
        second = labs.get(b.id);
      assert.equal(first.name, second.name);
      assert.notEqual(first.database, second.database);
      assert.notEqual(first.role, second.role);
      let result = await labs.command(
        first,
        "psql -X -v ON_ERROR_STOP=1 -c \"CREATE TABLE marker(value text); INSERT INTO marker VALUES('private');\"",
      );
      assert.equal(result.code, 0, result.output);
      result = await labs.command(
        second,
        "psql -X -At -c \"SELECT to_regclass('public.marker') IS NULL\"",
      );
      assert.equal(result.output.trim(), "t");
      result = await labs.command(
        second,
        `PGDATABASE=${first.database} psql -X -c 'SELECT 1'`,
      );
      assert.notEqual(result.code, 0);
      assert.match(result.output, /permission denied/i);
      result = await labs.command(
        second,
        "psql -X -U postgres -d postgres -c 'SELECT 1'",
      );
      assert.notEqual(result.code, 0);
      assert.match(result.output, /authentication failed/i);
      assert.notEqual(
        (await labs.command(second, "cat /proc/1/environ > /dev/null")).code,
        0,
      );
      assert.notEqual(
        (await labs.command(second, `cat ${second.checks}/session.json`)).code,
        0,
      );
      await solve(labs, first);
      assert.equal((await labs.checkAnswer(first.id)).passed, true);
      result = await labs.command(
        second,
        `psql -X -At -c "SELECT count(*) FROM pg_database WHERE datname='${first.database}'"`,
      );
      assert.equal(result.output.trim(), "0");
      result = await labs.command(
        second,
        `psql -X -At -c "SELECT count(*) FROM pg_roles WHERE rolname='${first.role}'"`,
      );
      assert.equal(result.output.trim(), "0");
      await solve(labs, second);
      assert.equal((await labs.check(second)).passed, true);
      const admin = await labs.create("hands-sql-admin-workshop:2"),
        isolated = labs.get(admin.id);
      assert.notEqual(isolated.name, second.name);
      assert.equal(isolated.pool, undefined);
      await solve(labs, isolated);
      assert.equal((await labs.checkAnswer(isolated.id)).passed, true);
      assert.equal(await running(second.name), true);
      result = await labs.command(
        second,
        "psql -X -At -c \"SELECT count(*) FROM pg_roles WHERE rolname='report_reader'\"",
      );
      assert.equal(result.output.trim(), "0");
    } finally {
      await labs.clear();
    }
  },
);

test(
  "pooled workspaces reconnect after restart and recover from protected container manifests",
  { timeout: 90000 },
  async () => {
    const folder = await mkdtemp(path.join(tmpdir(), "devlab-pools-")),
      file = path.join(folder, "sessions.json");
    let active = new LabSessions(file);
    const initial = active;
    try {
      const a = await active.create("hands-java-dsa:0"),
        b = await active.create("hands-sql-queries:0");
      const old = active.get(a.id);
      await active.write(old, "Main.java", "// unfinished answer\n");
      const javaName = old.name,
        sqlName = active.get(b.id).name;
      active = new LabSessions(file);
      assert.equal((await active.create("hands-java-dsa:0")).id, a.id);
      assert.equal((await active.create("hands-sql-queries:0")).id, b.id);
      assert.equal(
        (await active.command(active.get(a.id), "cat Main.java")).output,
        "// unfinished answer\n",
      );
      assert.equal(active.get(a.id).name, javaName);
      assert.equal(active.get(b.id).name, sqlName);
      await rm(file);
      active = new LabSessions(file);
      await active.adoptUntracked();
      assert.ok(active.sessions.has(a.id) && active.sessions.has(b.id));
      assert.equal((await active.create("hands-java-dsa:0")).id, a.id);
      assert.equal(
        (await active.command(active.get(a.id), "cat Main.java")).output,
        "// unfinished answer\n",
      );
      const registry = JSON.parse(await readFile(file, "utf8"));
      assert.equal(registry.version, 2);
      assert.equal(registry.pools.length, 2);
    } finally {
      await active.clear();
      await initial.clear();
      await rm(file, { force: true });
      await rm(file + ".tmp", { force: true });
      await (await import("node:fs/promises")).rmdir(folder);
    }
  },
);

test(
  "legacy per-exercise containers reconnect without discarding an unfinished answer",
  { timeout: 60000 },
  async () => {
    const folder = await mkdtemp(path.join(tmpdir(), "devlab-legacy-")),
      file = path.join(folder, "sessions.json");
    let active = new LabSessions(file);
    try {
      const original = await active.create("hands-linux-basics:0");
      const s = active.get(original.id);
      await active.write(s, "Main.java", "// legacy answer\n");
      await writeFile(
        file,
        JSON.stringify([
          {
            id: s.id,
            name: s.name,
            lessonId: "hands-java-dsa:0",
            lastUsed: Date.now(),
          },
        ]),
      );
      active = new LabSessions(file);
      const resumed = await active.create("hands-java-dsa:0");
      assert.equal(resumed.id, original.id);
      assert.equal(resumed.reused, true);
      assert.equal(
        (await active.command(active.get(resumed.id), "cat Main.java")).output,
        "// legacy answer\n",
      );
      const another = await active.create("hands-java-dsa:1");
      assert.notEqual(active.get(another.id).name, s.name);
    } finally {
      await active.clear();
      await rm(file, { force: true });
      await rm(file + ".tmp", { force: true });
      await (await import("node:fs/promises")).rmdir(folder);
    }
  },
);
