import test from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";
import { LabSessions } from "../runner/sessions.js";
import { createApp } from "../runner/server.js";

const until = async (predicate, message) => {
  const deadline = Date.now() + 20000;
  while (!predicate()) {
    if (Date.now() > deadline) throw Error(message);
    await new Promise((r) => setTimeout(r, 30));
  }
};
async function denied(url, origin) {
  const socket = new WebSocket(url, { origin });
  await new Promise((resolve, reject) => {
    socket.on("open", () => {
      socket.close();
      reject(Error("Unauthorized connection accepted"));
    });
    socket.on("unexpected-response", (req, res) => {
      assert.equal(res.statusCode, 403);
      res.resume();
      socket.terminate();
      resolve();
    });
    socket.on("error", () => {});
  });
}
test(
  "real authenticated PTY supports Vim, reconnect, resize and state-only submission",
  { timeout: 90000 },
  async () => {
    const labs = new LabSessions(),
      app = createApp(labs);
    let socket;
    await new Promise((r) => app.listen(0, "127.0.0.1", r));
    const base = "http://127.0.0.1:" + app.address().port,
      wsBase = base.replace("http:", "ws:");
    const auth = await fetch(base + "/api/session", {
      headers: { "Sec-Fetch-Site": "same-origin" },
    }).then((r) => r.json());
    const call = async (op, data) => {
      const r = await fetch(base + "/api/" + op, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Devlab-Token": auth.token,
        },
        body: JSON.stringify(data),
      });
      return { status: r.status, ...(await r.json()) };
    };
    const messages = [];
    const connect = async (id) => {
      const ticket = await call("terminal-ticket", { id });
      assert.equal(ticket.status, 200);
      const url = wsBase + "/api/terminal?ticket=" + ticket.ticket;
      await denied(url, "https://evil.example");
      const connection = new WebSocket(url, { origin: base });
      socket = connection;
      connection.on("message", (raw) =>
        messages.push(JSON.parse(raw.toString())),
      );
      await new Promise((r, j) => {
        connection.once("open", r);
        connection.once("error", j);
      });
      await denied(url, base);
      return connection;
    };
    const send = (data) => socket.send(JSON.stringify({ type: "input", data }));
    try {
      await denied(wsBase + "/api/terminal?ticket=invalid", base);
      const started = await call("start", { lessonId: "hands-linux-basics:0" });
      assert.equal(started.status, 200);
      const s = labs.get(started.id);
      socket = await connect(started.id);
      await until(
        () => messages.some((m) => m.type === "ready"),
        "PTY never attached",
      );
      await until(
        () =>
          messages.some((m) => m.type === "state" && m.atPrompt) ||
          messages.some((m) => m.type === "ready" && m.atPrompt),
        "Shell prompt missing",
      );
      socket.send(JSON.stringify({ type: "resize", cols: 100, rows: 30 }));
      send("mkdir -p projects; cd projects; printf 'PTY_OK\\n'\r");
      await until(
        () =>
          messages.some(
            (m) => m.type === "output" && m.data.includes("PTY_OK\r\n"),
          ),
        "Shell command did not run",
      );
      await until(
        () => app.terminals.shells.get(started.id)?.atPrompt,
        "Prompt did not return",
      );
      assert.equal(await labs.directory(s), "/workspace/projects");
      const shell = app.terminals.shells.get(started.id);
      socket.close();
      await new Promise((r) => socket.once("close", r));
      messages.length = 0;
      socket = await connect(started.id);
      await until(
        () => messages.some((m) => m.type === "ready"),
        "Reconnect failed",
      );
      assert.equal(
        app.terminals.shells.get(started.id),
        shell,
        "Reconnect created a second shell",
      );
      send("vim -u NONE -i NONE Main.java\r");
      await until(() => !shell.atPrompt, "Vim did not open in the PTY");
      assert.equal(
        (await call("check", { id: started.id })).status,
        400,
        "Checking while editing must be blocked",
      );
      send("iclass Main {}");
      await until(
        () =>
          messages.some(
            (m) => m.type === "output" && m.data.includes("class Main"),
          ),
        "Vim did not accept text",
      );
      socket.close();
      await new Promise((r) => socket.once("close", r));
      messages.length = 0;
      socket = await connect(started.id);
      await until(
        () => messages.some((m) => m.type === "ready"),
        "Reconnect while editing failed",
      );
      assert.equal(app.terminals.shells.get(started.id), shell);
      assert.equal(
        shell.atPrompt,
        false,
        "Reconnect must preserve the open editor",
      );
      await shell.resize(120, 36);
      send(
        "\x1b:call writefile([string(&columns), string(&lines)], '/workspace/vim-size')\r:wq\r",
      );
      await until(() => shell.atPrompt, "Vim did not save and close");
      assert.equal(
        (
          await labs.command(s, "cat /workspace/projects/Main.java")
        ).output.trim(),
        "class Main {}",
      );
      assert.equal(
        (await labs.command(s, "cat /workspace/vim-size")).output.trim(),
        "120\n36",
      );
      // If Check answer replays notes.sh, this would fail and corrupt the answer.
      await labs.write(
        s,
        "notes.sh",
        "echo REPLAYED > /workspace/projects/Main.java; exit 91\n",
      );
      const checked = await call("check", { id: started.id });
      assert.equal(checked.status, 200);
      assert.equal(checked.passed, true, checked.output);
      assert.equal(labs.sessions.has(started.id), false);
    } finally {
      socket?.terminate();
      app.terminals.dispose();
      await labs.clear();
      await new Promise((r) => app.close(r));
    }
  },
);
