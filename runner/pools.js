import { randomUUID, randomBytes } from "node:crypto";
import { docker, must } from "./docker.js";
import { allLessons } from "../content.js";
export const ID =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export const IDLE_MS = 60 * 60 * 1000;
export const pooledLesson = (lesson) =>
  lesson.engine === "java" ||
  (lesson.engine === "postgres" && lesson.id !== "hands-sql-admin-workshop:2");

// One queue per shared runtime prevents simultaneous checks from exhausting it.
export class ContainerPools {
  constructor(owner) {
    this.owner = owner;
    this.items = new Map();
    this.queues = new Map();
    this.pending = new Map();
  }
  async run(engine, work) {
    this.pending.set(engine, (this.pending.get(engine) || 0) + 1);
    const previous = this.queues.get(engine) || Promise.resolve();
    const current = previous.catch(() => {}).then(work);
    this.queues.set(engine, current);
    try {
      return await current;
    } finally {
      this.pending.set(engine, this.pending.get(engine) - 1);
      if (this.queues.get(engine) === current) this.queues.delete(engine);
    }
  }
  touch(s) {
    const pool = this.items.get(s.pool);
    if (pool) pool.lastUsed = Date.now();
  }
  options(s) {
    if (!s.pool)
      return s.lesson.engine === "postgres"
        ? ["-e", "PGUSER=postgres", "-e", "PGDATABASE=lab"]
        : [];
    const options = ["--user", "1000:1000"];
    if (s.pool === "postgres")
      options.push(
        "-e",
        "PGUSER=" + s.role,
        "-e",
        "PGDATABASE=" + s.database,
        "-e",
        "PGPASSWORD=" + s.secret,
      );
    return options;
  }
  session(lesson, id, pool, secret) {
    const token = id.replaceAll("-", "");
    return {
      id,
      name: pool.name,
      lesson,
      pool: pool.engine,
      workspace: "/workspace/" + id,
      checks: "/checks/" + id,
      compiled: "/tmp/classes_" + token,
      ...(pool.engine === "postgres"
        ? { database: "lab_" + token, role: "learner_" + token, secret }
        : {}),
      lastUsed: Date.now(),
      busy: false,
    };
  }
  restorePool(row) {
    if (
      !["java", "postgres"].includes(row.engine) ||
      !ID.test(row.id) ||
      row.name !== `devlab-pool-${row.engine}-${row.id}` ||
      !Number.isFinite(row.lastUsed)
    )
      return;
    if (row.engine === "postgres" && !/^[a-f0-9]{64}$/.test(row.secret || ""))
      return;
    this.items.set(row.engine, {
      id: row.id,
      name: row.name,
      engine: row.engine,
      lastUsed: row.lastUsed,
      ...(row.engine === "postgres" ? { secret: row.secret } : {}),
    });
  }
  restoreSession(row) {
    const lesson = allLessons.find((l) => l.id === row.lessonId),
      pool = this.items.get(row.pool);
    if (
      !lesson ||
      !pooledLesson(lesson) ||
      lesson.engine !== row.pool ||
      !pool ||
      pool.name !== row.name ||
      !ID.test(row.id) ||
      !Number.isFinite(row.lastUsed)
    )
      return;
    if (row.pool === "postgres" && !/^[a-f0-9]{64}$/.test(row.secret || ""))
      return;
    const s = this.session(lesson, row.id, pool, row.secret);
    s.lastUsed = row.lastUsed;
    this.owner.sessions.set(s.id, s);
  }
  async admin(pool, sql) {
    return must(
      [
        "exec",
        "-i",
        "-e",
        "PGPASSWORD=" + pool.secret,
        pool.name,
        "psql",
        "-X",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        "postgres",
        "-d",
        "postgres",
      ],
      { input: sql },
    );
  }
  async ensure(engine) {
    let pool = this.items.get(engine);
    if (pool) {
      const running = await docker([
        "inspect",
        "--format",
        "{{.State.Running}}",
        pool.name,
      ]);
      if (
        running.code === 0 &&
        running.output.trim() === "true" &&
        Date.now() - pool.lastUsed <= IDLE_MS
      )
        return pool;
      await this.drop(engine);
    }
    const id = randomUUID();
    pool = {
      id,
      engine,
      name: `devlab-pool-${engine}-${id}`,
      lastUsed: Date.now(),
      ...(engine === "postgres"
        ? { secret: randomBytes(32).toString("hex") }
        : {}),
    };
    const args = [
      "run",
      "-d",
      "--rm",
      "--name",
      pool.name,
      "--label",
      "devlab.managed=true",
      "--label",
      "devlab.owner=" + this.owner.ownerId,
      "--label",
      "devlab.pool=" + engine,
      "--network",
      "none",
      "--cpus",
      "1",
      "--memory",
      engine === "postgres" ? "768m" : "384m",
      "--memory-swap",
      engine === "postgres" ? "768m" : "384m",
      "--pids-limit",
      "128",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--read-only",
      "--tmpfs",
      "/tmp:rw,nosuid,size=128m",
      "--tmpfs",
      "/checks:rw,nosuid,size=8m,mode=755",
      "--tmpfs",
      "/workspace:rw,nosuid,size=128m,uid=1000,gid=1000,mode=700",
    ];
    if (engine === "postgres")
      args.push(
        "--user",
        "postgres",
        "--tmpfs",
        "/var/lib/postgresql/data:rw,nosuid,size=512m,uid=999,gid=999,mode=700",
        "--tmpfs",
        "/var/run/postgresql:rw,nosuid,size=4m,uid=999,gid=999",
        "-e",
        "POSTGRES_PASSWORD=" + pool.secret,
        "-e",
        "POSTGRES_INITDB_ARGS=--auth-local=scram-sha-256 --auth-host=scram-sha-256",
        "postgres:17-bookworm",
      );
    else
      args.push(
        "--user",
        "1000:1000",
        "--workdir",
        "/workspace",
        "devlab-java:1",
      );
    try {
      await must(args, { timeout: 20000 });
      this.items.set(engine, pool);
      this.owner.persist();
      if (engine === "postgres") {
        let ready = false;
        for (let i = 0; i < 40; i++) {
          const r = await docker([
            "exec",
            pool.name,
            "pg_isready",
            "-h",
            "127.0.0.1",
            "-U",
            "postgres",
            "-d",
            "postgres",
          ]);
          if (r.code === 0) {
            ready = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 500));
        }
        if (!ready) throw Error("Shared PostgreSQL did not become ready.");
      }
      return pool;
    } catch (error) {
      await docker(["rm", "-f", pool.name]);
      this.items.delete(engine);
      this.owner.persist();
      throw error;
    }
  }
  async create(lesson) {
    return this.run(lesson.engine, async () => {
      const pool = await this.ensure(lesson.engine);
      const existing = [...this.owner.sessions.values()].find(
        (s) => s.lesson.id === lesson.id && s.name === pool.name,
      );
      if (existing && (await this.exists(existing))) {
        this.owner.get(existing.id);
        return this.owner.info(existing, true);
      }
      if (existing) await this.remove(existing);
      const s = this.session(
        lesson,
        randomUUID(),
        pool,
        lesson.engine === "postgres"
          ? randomBytes(32).toString("hex")
          : undefined,
      );
      try {
        await must([
          "exec",
          "--user",
          "1000:1000",
          pool.name,
          "mkdir",
          "-p",
          s.workspace,
        ]);
        await must([
          "exec",
          "--user",
          "0",
          "--workdir",
          "/",
          pool.name,
          "mkdir",
          "-p",
          s.checks,
        ]);
        if (lesson.engine === "postgres") {
          await this.admin(
            pool,
            `CREATE ROLE ${s.role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD '${s.secret}';\nCREATE DATABASE ${s.database} OWNER ${s.role};\nREVOKE ALL ON DATABASE ${s.database} FROM PUBLIC;\n`,
          );
        }
        this.owner.sessions.set(s.id, s);
        for (const [file, body] of Object.entries({
          [lesson.filename]: lesson.starter,
          ...lesson.editableFiles,
          ...lesson.files,
        }))
          await this.owner.write(s, file, body);
        if (lesson.verify)
          await must(
            [
              "exec",
              "--user",
              "0",
              "--workdir",
              "/",
              "-i",
              s.name,
              "sh",
              "-c",
              `cat > ${s.checks}/Verify.java; chmod 444 ${s.checks}/Verify.java`,
            ],
            { input: lesson.verify },
          );
        if (lesson.seed)
          await must(
            [
              "exec",
              "-i",
              ...this.options(s),
              s.name,
              "psql",
              "-X",
              "-v",
              "ON_ERROR_STOP=1",
            ],
            { input: lesson.seed },
          );
        await must(
          [
            "exec",
            "--user",
            "0",
            "--workdir",
            "/",
            "-i",
            s.name,
            "sh",
            "-c",
            `umask 077; cat > ${s.checks}/session.tmp && mv ${s.checks}/session.tmp ${s.checks}/session.json`,
          ],
          { input: JSON.stringify(this.owner.record(s)) },
        );
        this.touch(s);
        this.owner.persist();
        return this.owner.info(s, false);
      } catch (error) {
        await this.remove(s);
        throw error;
      }
    });
  }
  async exists(s) {
    const file = await docker([
      "exec",
      ...this.options(s),
      s.name,
      "test",
      "-d",
      s.workspace,
    ]);
    if (file.code !== 0) return false;
    if (s.pool === "postgres") {
      const pool = this.items.get(s.pool);
      return (
        await this.admin(
          pool,
          `SELECT datname FROM pg_database WHERE datname='${s.database}';`,
        )
      ).includes(s.database);
    }
    return true;
  }
  async remove(s) {
    const pool = this.items.get(s.pool);
    if (pool && s.pool === "postgres")
      await this.admin(
        pool,
        `DROP DATABASE IF EXISTS ${s.database} WITH (FORCE);\nDROP ROLE IF EXISTS ${s.role};\n`,
      );
    await must([
      "exec",
      ...this.options(s),
      s.name,
      "rm",
      "-rf",
      s.workspace,
      s.compiled,
    ]);
    await must([
      "exec",
      "--user",
      "0",
      "--workdir",
      "/",
      s.name,
      "rm",
      "-rf",
      s.checks,
    ]);
    this.owner.sessions.delete(s.id);
    this.touch(s);
    this.owner.persist();
  }
  async drop(engine) {
    const pool = this.items.get(engine);
    if (!pool) return;
    const result = await docker(["rm", "-f", pool.name]);
    if (result.code !== 0 && !/No such container/i.test(result.output))
      throw Error(result.output);
    for (const [id, s] of this.owner.sessions)
      if (s.pool === engine && s.name === pool.name)
        this.owner.sessions.delete(id);
    this.items.delete(engine);
    this.owner.persist();
  }
  async expire() {
    for (const [engine, pool] of this.items)
      if (
        !(this.pending.get(engine) > 0) &&
        Date.now() - pool.lastUsed > IDLE_MS
      )
        await this.run(engine, async () => {
          if (Date.now() - pool.lastUsed > IDLE_MS) await this.drop(engine);
        });
  }
  async adopt(name, labels) {
    const engine = labels["devlab.pool"];
    if (
      !["java", "postgres"].includes(engine) ||
      labels["devlab.owner"] !== this.owner.ownerId
    )
      return;
    const id = name.slice(("devlab-pool-" + engine + "-").length);
    if (!ID.test(id) || name !== `devlab-pool-${engine}-${id}`) return;
    const existing = this.items.get(engine);
    if (existing && existing.name !== name)
      throw Error(
        "Multiple shared " +
          engine +
          " containers found; keep one runner per project.",
      );
    const config = JSON.parse(await must(["inspect", name]))[0];
    const secret = config.Config.Env.find((v) =>
      v.startsWith("POSTGRES_PASSWORD="),
    )?.slice("POSTGRES_PASSWORD=".length);
    if (!existing)
      this.restorePool({ id, name, engine, lastUsed: Date.now(), secret });
    if (!this.items.has(engine)) return;
    const manifests = await must([
      "exec",
      "--user",
      "0",
      "--workdir",
      "/",
      name,
      "find",
      "/checks",
      "-mindepth",
      "2",
      "-maxdepth",
      "2",
      "-name",
      "session.json",
      "-type",
      "f",
    ]);
    for (const file of manifests.split("\n").filter(Boolean)) {
      if (!/^\/checks\/[a-f0-9-]{36}\/session\.json$/.test(file)) continue;
      const row = JSON.parse(
        await must([
          "exec",
          "--user",
          "0",
          "--workdir",
          "/",
          name,
          "cat",
          file,
        ]),
      );
      if (!this.owner.sessions.has(row.id)) this.restoreSession(row);
    }
    this.owner.persist();
  }
}
