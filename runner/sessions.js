import { randomUUID } from "node:crypto";
import { docker, must } from "./docker.js";
import { allLessons } from "../content.js";
import { readFileSync, writeFileSync, renameSync } from "node:fs";

export class LabSessions {
  constructor(registry = null) {
    this.sessions = new Map();
    this.registry = registry;
    if (registry) {
      try {
        for (const row of JSON.parse(readFileSync(registry, "utf8"))) {
          const lesson =
            allLessons.find((l) => l.id === row.lessonId) ||
            (row.lessonId === null ? { id: null } : null);
          if (
            lesson &&
            /^[a-f0-9-]{36}$/.test(row.id) &&
            row.name === "devlab-" + row.id &&
            Number.isFinite(row.lastUsed)
          )
            this.sessions.set(row.id, { ...row, lesson, busy: false });
        }
      } catch (error) {
        if (error.code !== "ENOENT")
          console.error("Could not restore lab registry:", error.message);
      }
    }
  }
  persist() {
    if (!this.registry) return;
    const rows = [...this.sessions.values()].map((s) => ({
      id: s.id,
      name: s.name,
      lessonId: s.lesson.id,
      lastUsed: s.lastUsed,
    }));
    writeFileSync(this.registry + ".tmp", JSON.stringify(rows));
    renameSync(this.registry + ".tmp", this.registry);
  }
  async adoptUntracked() {
    const result = await docker([
      "ps",
      "--filter",
      "label=devlab.managed=true",
      "--format",
      "{{.Names}}",
    ]);
    if (result.code !== 0) return;
    for (const name of result.output.trim().split(/\r?\n/)) {
      if (!/^devlab-[a-f0-9-]{36}$/.test(name)) continue;
      const id = name.slice(7);
      if (this.sessions.has(id)) continue;
      const label = await docker([
        "inspect",
        "--format",
        '{{index .Config.Labels "devlab.lesson"}}',
        name,
      ]);
      const lesson = allLessons.find((l) => l.id === label.output.trim()) || {
        id: null,
      };
      this.sessions.set(id, {
        id,
        name,
        lesson,
        lastUsed: Date.now(),
        busy: false,
      });
    }
    this.persist();
  }
  async create(lessonId) {
    const lesson = allLessons.find((l) => l.id === lessonId);
    if (!lesson) throw Error("Unknown exercise.");
    const existing = [...this.sessions.values()].find(
      (s) => s.lesson.id === lessonId,
    );
    const running = existing
      ? await docker([
          "inspect",
          "--format",
          "{{.State.Running}}",
          existing.name,
        ])
      : null;
    if (
      existing &&
      running.code === 0 &&
      running.output.trim() === "true" &&
      Date.now() - existing.lastUsed <= 60 * 60 * 1000
    ) {
      existing.lastUsed = Date.now();
      this.persist();
      return {
        id: existing.id,
        engine: lesson.engine,
        filename: lesson.filename,
        reused: true,
        output: "Reconnected to the existing lab.\n",
      };
    }
    if (existing) await this.remove(existing.id);
    const oracle = lesson.engine === "oracle";
    if (oracle) {
      const image = await docker([
        "image",
        "inspect",
        "container-registry.oracle.com/database/free:latest",
      ]);
      if (image.code !== 0)
        throw Error(
          "Optional Oracle image is not installed. Run docker pull container-registry.oracle.com/database/free:latest, then retry. Oracle needs several GB of disk and at least 3 GB of available Docker memory.",
        );
    }
    const id = randomUUID(),
      name = "devlab-" + id;
    const postgres = lesson.engine === "postgres";
    const args = [
      "run",
      "-d",
      "--rm",
      "--name",
      name,
      "--label",
      "devlab.managed=true",
      "--label",
      `devlab.lesson=${lessonId}`,
      "--network",
      "none",
      "--cpus",
      "1",
      "--memory",
      postgres ? "512m" : "384m",
      "--memory-swap",
      postgres ? "512m" : "384m",
      "--pids-limit",
      "96",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--read-only",
      "--tmpfs",
      "/tmp:rw,nosuid,size=128m",
      "--tmpfs",
      "/checks:rw,nosuid,size=4m,mode=755",
      "--tmpfs",
      "/workspace:rw,nosuid,size=32m,uid=1000,gid=1000,mode=700",
    ];
    if (postgres) {
      args[
        args.indexOf("/workspace:rw,nosuid,size=32m,uid=1000,gid=1000,mode=700")
      ] = "/workspace:rw,nosuid,size=32m,uid=999,gid=999,mode=700";
      args.push(
        "--user",
        "postgres",
        "--tmpfs",
        "/var/lib/postgresql/data:rw,nosuid,size=192m,uid=999,gid=999,mode=700",
        "--tmpfs",
        "/var/run/postgresql:rw,nosuid,size=4m,uid=999,gid=999",
        "-e",
        "POSTGRES_HOST_AUTH_METHOD=trust",
        "-e",
        "POSTGRES_DB=lab",
        "postgres:17-bookworm",
      );
    } else if (oracle) {
      args.splice(args.indexOf("--read-only"), 1);
      args[args.indexOf("384m")] = "3g";
      args[args.indexOf("384m")] = "3g";
      args[args.indexOf("96")] = "256";
      args[
        args.indexOf("/workspace:rw,nosuid,size=32m,uid=1000,gid=1000,mode=700")
      ] = "/workspace:rw,nosuid,size=32m,uid=54321,gid=54321,mode=700";
      args.push(
        "--shm-size",
        "512m",
        "-e",
        "ORACLE_PWD=Lab_" + randomUUID().replaceAll("-", ""),
        "container-registry.oracle.com/database/free:latest",
      );
    } else
      args.push(
        "--user",
        "1000:1000",
        "--workdir",
        "/workspace",
        "devlab-java:1",
      );
    try {
      await must(args, { timeout: 20000 });
      if (postgres) {
        // The initialization server accepts sockets only; TCP signals the final server.
        let ready = false;
        for (let i = 0; i < 40; i++) {
          const r = await docker([
            "exec",
            name,
            "pg_isready",
            "-h",
            "127.0.0.1",
            "-U",
            "postgres",
            "-d",
            "lab",
          ]);
          if (r.code === 0) {
            ready = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 500));
        }
        if (!ready) throw Error("PostgreSQL did not become ready.");
      }
      if (oracle) {
        let ready = false;
        for (let i = 0; i < 120; i++) {
          const r = await docker(
            ["exec", "-i", name, "sqlplus", "-s", "/", "as", "sysdba"],
            {
              input:
                "WHENEVER SQLERROR EXIT FAILURE\nSELECT 1 FROM dual;\nEXIT\n",
            },
          );
          if (r.code === 0 && !/ORA-/.test(r.output)) {
            ready = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
        if (!ready)
          throw Error(
            "Oracle did not become ready within four minutes. Inspect Docker Desktop logs.",
          );
      }
      const session = {
        id,
        name,
        lesson,
        busy: false,
        lastUsed: Date.now(),
      };
      this.sessions.set(id, session);
      if (lesson.starter !== undefined)
        await this.write(session, lesson.filename, lesson.starter);
      for (const [file, body] of Object.entries(lesson.editableFiles || {}))
        await this.write(session, file, body);
      for (const [file, body] of Object.entries(lesson.files || {}))
        await this.write(session, file, body);
      if (lesson.setup) {
        const result = await this.command(session, lesson.setup);
        if (result.code !== 0)
          throw Error("Lab fixture setup failed: " + result.output);
      }
      if (lesson.verify)
        await must(
          [
            "exec",
            "-u",
            "0",
            "-i",
            name,
            "sh",
            "-c",
            "cat > /checks/Verify.java; chmod 444 /checks/Verify.java",
          ],
          { input: lesson.verify },
        );
      if (postgres && lesson.seed)
        await must(
          [
            "exec",
            "-i",
            name,
            "psql",
            "-X",
            "-v",
            "ON_ERROR_STOP=1",
            "-U",
            "postgres",
            "-d",
            "lab",
          ],
          { input: lesson.seed },
        );
      this.persist();
      return {
        id,
        engine: lesson.engine,
        filename: lesson.filename,
        output: `Workspace ready: ${lesson.title}\n${postgres ? "Use noninteractive psql commands with -c, or psql -U postgres -d lab -f solution.sql." : "Use the editor or shell redirection to write files. Commands run in a real Linux container."}\nFull-screen interactive programs are not supported; use noninteractive commands.\n`,
      };
    } catch (e) {
      await docker(["rm", "-f", name]);
      this.sessions.delete(id);
      throw e;
    }
  }
  get(id) {
    const s = this.sessions.get(id);
    if (!s) throw Error("Workspace expired. Start or reset this lab.");
    s.lastUsed = Date.now();
    this.persist();
    return s;
  }
  async exclusive(id, work) {
    const s = this.get(id);
    if (s.busy) throw Error("Wait for the current command to finish.");
    s.busy = true;
    try {
      return await work(s);
    } finally {
      s.busy = false;
      s.lastUsed = Date.now();
      this.persist();
    }
  }
  async write(s, filename, body) {
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(filename) ||
      typeof body !== "string" ||
      body.length > 64000
    )
      throw Error("Invalid filename or file too large.");
    await must(
      ["exec", "-i", s.name, "sh", "-c", `cat > /workspace/${filename}`],
      { input: body },
    );
  }
  async command(s, command) {
    if (typeof command !== "string" || command.length > 12000)
      throw Error("Command is missing or too long.");
    const script = `cd "$(cat /workspace/.cwd 2>/dev/null || printf /workspace)" || exit 1\n${command}\nstatus=$?\npwd > /workspace/.cwd\nexit $status`;
    return docker(
      [
        "exec",
        "-i",
        "--workdir",
        "/workspace",
        s.name,
        "timeout",
        "-s",
        "KILL",
        "10s",
        "bash",
        "--noprofile",
        "--norc",
      ],
      { input: script, timeout: 13000 },
    );
  }
  async check(s) {
    let command;
    if (s.lesson.engine === "java") {
      const files = [
        s.lesson.filename,
        ...Object.keys(s.lesson.editableFiles || {}),
      ];
      if (
        files.some(
          (name) => !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}\.java$/.test(name),
        )
      )
        throw Error("Invalid Java source filename.");
      command = `rm -rf /tmp/verify && mkdir -p /tmp/verify && javac -cp /tmp/verify -d /tmp/verify ${files.map((name) => "/workspace/" + name).join(" ")} /checks/Verify.java && java -Xmx128m -cp /tmp/verify Verify`;
    } else if (s.lesson.engine === "postgres") {
      const object = s.lesson.solution.match(
        /CREATE OR REPLACE (VIEW|FUNCTION) (\w+)(\([^)]*\))?/i,
      );
      const drop =
        s.lesson.resetSql ??
        (object &&
          `DROP ${object[1]} IF EXISTS ${object[2]}${object[1].toUpperCase() === "FUNCTION" ? object[3] : ""};`);
      if (typeof drop !== "string")
        throw Error("SQL exercise has no answer isolation rule.");
      // Validate the submitted SQL against fresh answer objects, without
      // clearing unrelated database work or retaining old passing definitions.
      command = `psql -X -v ON_ERROR_STOP=1 -U postgres -d lab <<'DEVLAB_CHECK'\nBEGIN;\n${drop}\n\\i /workspace/solution.sql\n${s.lesson.check}\nROLLBACK;\nDEVLAB_CHECK`;
    } else if (s.lesson.engine === "oracle") {
      const result = await docker(
        ["exec", "-i", s.name, "sqlplus", "-s", "/", "as", "sysdba"],
        {
          input:
            "WHENEVER SQLERROR EXIT FAILURE\nSET FEEDBACK OFF\nSET HEADING OFF\nSET PAGESIZE 0\nALTER SESSION SET CONTAINER=FREEPDB1;\n@/workspace/solution.sql\nEXIT\n",
          timeout: 15000,
        },
      );
      const lines = result.output
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        ...result,
        passed:
          result.code === 0 &&
          JSON.stringify(lines) === JSON.stringify(s.lesson.expectedOutput),
      };
    } else command = `bash /workspace/notes.sh && (\n${s.lesson.check}\n)`;
    const result = await this.command(s, command);
    return { ...result, passed: result.code === 0 };
  }
  async remove(id) {
    const s = this.sessions.get(id);
    if (s) {
      this.sessions.delete(id);
      await docker(["rm", "-f", s.name]);
      this.persist();
    }
  }
  async resetAnswer(lessonId) {
    const session = [...this.sessions.values()].find(
      (s) => s.lesson.id === lessonId,
    );
    if (!session) return { id: null };
    return this.exclusive(session.id, async (s) => {
      await this.write(s, s.lesson.filename, s.lesson.starter);
      for (const [file, body] of Object.entries(s.lesson.editableFiles || {}))
        await this.write(s, file, body);
      return { id: s.id };
    });
  }
  async checkAnswer(id) {
    return this.exclusive(id, async (session) => {
      const result = await this.check(session);
      if (result.passed) await this.remove(id);
      return result;
    });
  }
  async clear() {
    for (const id of this.sessions.keys()) await this.remove(id);
  }
  async expire() {
    for (const [id, s] of this.sessions)
      if (!s.busy && Date.now() - s.lastUsed > 60 * 60 * 1000)
        await this.remove(id);
  }
}
