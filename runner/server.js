import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LabSessions } from "./sessions.js";
import { runnerApi } from "./http.js";
import { InteractiveTerminals } from "./terminals.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".wasm": "application/wasm",
};
export function createApp(
  sessions = new LabSessions(),
  ready = Promise.resolve(),
) {
  const terminals = new InteractiveTerminals(sessions, ready);
  const api = runnerApi(sessions, terminals);
  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith("/api/")) {
      try {
        await ready;
      } catch {
        res.writeHead(503, { "Content-Type": "application/json" }).end(
          JSON.stringify({
            error:
              "Docker recovery failed. Check Docker Desktop and restart the runner.",
          }),
        );
        return;
      }
      return api(req, res);
    }
    try {
      const requested = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const filename = path.resolve(
        root,
        "." + (requested === "/" ? "/index.html" : requested),
      );
      const relative = path.relative(root, filename).split(path.sep).join("/");
      if (
        relative.startsWith("..") ||
        relative.split("/").some((p) => p.startsWith(".")) ||
        !types[path.extname(filename)] ||
        ["runner/", "tests/", "node_modules/"].some((p) =>
          relative.startsWith(p),
        )
      ) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      const data = await readFile(filename);
      res
        .writeHead(200, {
          "Content-Type": types[path.extname(filename)],
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Cross-Origin-Resource-Policy": "same-origin",
        })
        .end(data);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  terminals.bind(server);
  server.terminals = terminals;
  return server;
}
export function start() {
  const sessions = new LabSessions(path.join(root, ".devlab-sessions.json")),
    ready = sessions.adoptUntracked().then(() => sessions.expire()),
    app = createApp(sessions, ready);
  ready.catch(console.error);
  const cleanup = setInterval(
    () => ready.then(() => sessions.expire()).catch(console.error),
    60000,
  );
  cleanup.unref();
  app.listen(5173, "127.0.0.1", () =>
    console.log("DevLab Docker workspace: http://127.0.0.1:5173"),
  );
  const shutdown = async () => {
    clearInterval(cleanup);
    sessions.persist();
    app.terminals.dispose();
    app.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
