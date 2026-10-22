import { randomBytes } from "node:crypto";
import { WebSocketServer } from "ws";
import { TerminalEngine } from "./terminal-engine.js";

export class InteractiveTerminals {
  constructor(sessions, ready) {
    this.sessions = sessions;
    this.ready = ready;
    this.tickets = new Map();
    this.shells = new Map();
    this.starting = new Map();
    this.engine = new TerminalEngine();
    this.ws = new WebSocketServer({
      noServer: true,
      maxPayload: 65536,
      perMessageDeflate: false,
    });
  }
  ticket(id) {
    const s = this.sessions.get(id);
    if (s.lesson.engine !== "linux")
      throw Error("Interactive terminals are available for Linux exercises.");
    for (const [key, value] of this.tickets)
      if (value.expires < Date.now()) this.tickets.delete(key);
    if (this.tickets.size >= 64)
      throw Error("Too many pending terminal connections.");
    const ticket = randomBytes(32).toString("hex");
    this.tickets.set(ticket, { id, expires: Date.now() + 30000 });
    return { ticket };
  }
  assertReady(id) {
    const shell = this.shells.get(id);
    if (shell && !shell.atPrompt)
      throw Error(
        "Finish the command, or save and close vim, before checking your answer.",
      );
  }
  bind(server) {
    server.on("upgrade", (request, socket, head) =>
      this.upgrade(request, socket, head).catch(() => socket.destroy()),
    );
    server.on("close", () => this.dispose());
  }
  async upgrade(request, socket, head) {
    const host = request.headers.host || "";
    const url = new URL(request.url, "http://localhost");
    const key = url.searchParams.get("ticket"),
      ticket = this.tickets.get(key);
    if (
      url.pathname !== "/api/terminal" ||
      !/^(127\.0\.0\.1|localhost):\d+$/.test(host) ||
      request.headers.origin !== "http://" + host ||
      !ticket ||
      ticket.expires < Date.now()
    ) {
      socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      return;
    }
    this.tickets.delete(key);
    await this.ready;
    const s = this.sessions.get(ticket.id);
    if (s.lesson.engine !== "linux")
      throw Error("Unsupported terminal engine.");
    this.ws.handleUpgrade(request, socket, head, (client) => {
      client.on("error", () => {});
      this.connect(s, client).catch((error) => {
        this.send(client, { type: "error", message: error.message });
        client.close(1011);
      });
    });
  }
  send(client, message) {
    if (client?.readyState !== 1) return;
    if (client.bufferedAmount > 262144) {
      client.close(1008, "Terminal output is too slow; reconnect.");
      return;
    }
    client.send(JSON.stringify(message));
  }
  async shell(s) {
    if (this.shells.has(s.id)) return this.shells.get(s.id);
    if (!this.starting.has(s.id)) {
      const pending = this.engine
        .open(s, this.sessions)
        .then((engine) => {
          if (this.disposed) {
            engine.stream.destroy();
            throw Error("Runner is shutting down.");
          }
          const shell = {
            ...engine,
            output: "",
            changed: false,
            client: null,
            atPrompt: false,
            tail: "",
          };
          this.shells.set(s.id, shell);
          engine.stream.setEncoding("utf8");
          engine.stream.on("data", (data) => {
            const scan = shell.tail + data;
            const prompt = scan.lastIndexOf("\x1b]133;A\x07"),
              command = scan.lastIndexOf("\x1b]133;C\x07");
            shell.tail = scan.slice(-12);
            if (prompt >= 0 || command >= 0) {
              shell.atPrompt = prompt > command;
              this.send(shell.client, {
                type: "state",
                atPrompt: shell.atPrompt,
              });
            }
            shell.output = (shell.output + data).slice(-131072);
            this.send(shell.client, { type: "output", data });
          });
          const ended = () => {
            if (this.shells.get(s.id) === shell) this.shells.delete(s.id);
            this.send(shell.client, { type: "exit" });
            shell.client?.close();
          };
          engine.stream.on("error", () => {});
          engine.stream.once("close", ended);
          return shell;
        })
        .finally(() => this.starting.delete(s.id));
      this.starting.set(s.id, pending);
    }
    return this.starting.get(s.id);
  }
  async connect(s, client) {
    const shell = await this.shell(s);
    if (client.readyState !== 1) return;
    shell.client?.close(1000, "Exercise opened in another tab.");
    shell.client = client;
    this.send(client, { type: "output", data: shell.output });
    this.send(client, {
      type: "ready",
      changed: shell.changed,
      atPrompt: shell.atPrompt,
    });
    client.on("close", () => {
      if (shell.client === client) shell.client = null;
    });
    client.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (!this.sessions.sessions.has(s.id))
          throw Error("Workspace expired.");
        if (s.busy) throw Error("Wait for answer verification to finish.");
        if (
          message.type === "input" &&
          typeof message.data === "string" &&
          message.data.length <= 16000
        ) {
          this.sessions.get(s.id);
          if (!shell.changed && /[^\s\x00-\x1f\x7f]/.test(message.data)) {
            shell.changed = true;
            this.send(client, { type: "activity" });
          }
          if (shell.stream.writableLength > 65536)
            throw Error("Terminal input is too fast.");
          shell.stream.write(message.data);
        } else if (
          message.type === "resize" &&
          Number.isInteger(message.cols) &&
          Number.isInteger(message.rows) &&
          message.cols >= 10 &&
          message.cols <= 300 &&
          message.rows >= 4 &&
          message.rows <= 100
        ) {
          shell.resize(message.cols, message.rows).catch(() => {});
        } else throw Error("Invalid terminal message.");
      } catch (error) {
        this.send(client, { type: "error", message: error.message });
      }
    });
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const client of this.ws.clients) client.terminate();
    for (const shell of this.shells.values()) {
      shell.client?.terminate();
      shell.stream.destroy();
    }
    this.shells.clear();
    this.tickets.clear();
    this.ws.close();
  }
}
