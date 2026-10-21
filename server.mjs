import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    try {
      const requested = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const filename = path.resolve(
        root,
        "." + (requested === "/" ? "/index.html" : requested),
      );
      const relative = path.relative(root, filename);
      if (
        relative.startsWith("..") ||
        path.isAbsolute(relative) ||
        relative
          .split(path.sep)
          .some((part) => part.startsWith(".") || part === "node_modules")
      ) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      const data = await readFile(filename);
      res
        .writeHead(200, {
          "Content-Type":
            types[path.extname(filename)] || "application/octet-stream",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-cache",
        })
        .end(data);
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(5173, "127.0.0.1", () =>
    console.log("DevLab preview: http://127.0.0.1:5173"),
  );
