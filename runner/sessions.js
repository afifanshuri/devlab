import { randomUUID } from "node:crypto";
import { docker, must } from "./docker.js";
import { allLessons } from "../content.js";

export class LabSessions {
  constructor() {
    this.sessions = new Map();
  }
  async create(lessonId) {
    const lesson = allLessons.find((l) => l.id === lessonId);
    if (!lesson) throw Error("Unknown exercise.");
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
    await this.clear(); // One personal workspace at a time; no idle accumulation.
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
        let ready = false;
        for (let i = 0; i < 40; i++) {
          const r = await docker([
            "exec",
            name,
            "pg_isready",
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
        cwd: "/workspace",
        busy: false,
        lastUsed: Date.now(),
      };
      this.sessions.set(id, session);
      if (lesson.starter !== undefined)
        await this.write(session, lesson.filename, lesson.starter);
      for (const [file, body] of Object.entries(lesson.files || {}))
        await this.write(session, file, body);
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
    try {
      return await docker(
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
    } catch (e) {
      await this.remove(s.id);
      throw e;
    }
  }
  async check(s) {
    let command;
    if (s.lesson.engine === "java")
      command =
        "mkdir -p /tmp/verify && javac -d /tmp/verify /workspace/Main.java /checks/Verify.java && java -Xmx128m -cp /tmp/verify Verify";
    else if (s.lesson.engine === "postgres")
      command = `psql -X -v ON_ERROR_STOP=1 -U postgres -d lab -f /workspace/solution.sql && psql -X -v ON_ERROR_STOP=1 -U postgres -d lab <<'DEVLAB_CHECK'\n${s.lesson.check}\nDEVLAB_CHECK`;
    else if (s.lesson.engine === "oracle") {
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
    } else command = s.lesson.check;
    const result = await this.command(s, command);
    return { ...result, passed: result.code === 0 };
  }
  async remove(id) {
    const s = this.sessions.get(id);
    if (s) {
      this.sessions.delete(id);
      await docker(["rm", "-f", s.name]);
    }
  }
  async clear() {
    for (const id of this.sessions.keys()) await this.remove(id);
  }
  async expire() {
    for (const [id, s] of this.sessions)
      if (!s.busy && Date.now() - s.lastUsed > 30 * 60 * 1000)
        await this.remove(id);
  }
}
