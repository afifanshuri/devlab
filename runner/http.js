import { readAnswerFiles, restoreAnswerFiles } from "./answer-files.js";
import { randomBytes, timingSafeEqual } from "node:crypto";
export function runnerApi(sessions, terminals) {
  const token = randomBytes(32).toString("hex");
  let starting = false;
  return async (req, res) => {
    const reply = (status, data) =>
      res
        .writeHead(status, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        })
        .end(JSON.stringify(data));
    const host = req.headers.host || "";
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host))
      return reply(403, { error: "Localhost access only." });
    if (req.headers.origin && req.headers.origin !== `http://${host}`)
      return reply(403, { error: "Cross-origin requests are not allowed." });
    if (req.url === "/api/session" && req.method === "GET") {
      if (req.headers["sec-fetch-site"] !== "same-origin")
        return reply(403, { error: "Open DevLab locally to connect." });
      return reply(200, { token });
    }
    const supplied = Buffer.from(req.headers["x-devlab-token"] || ""),
      expected = Buffer.from(token);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    )
      return reply(403, {
        error: "Runner authentication required. Reload the local app.",
      });
    if (
      req.method !== "POST" ||
      !req.headers["content-type"]?.startsWith("application/json")
    )
      return reply(405, { error: "Use a JSON POST request." });
    let bytes = 0,
      body = "";
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > (req.url === "/api/answer-files" ? 1000000 : 80000))
          throw Error("Request is too large.");
        body += chunk;
      }
      const data = JSON.parse(body || "{}");
      if (req.url === "/api/terminal-ticket")
        return reply(200, terminals.ticket(data.id));
      if (req.url === "/api/touch") {
        const existing = [...sessions.sessions.values()].find(
          (s) => s.lesson.id === data.lessonId,
        );
        if (existing) sessions.get(existing.id);
        return reply(200, { ok: true });
      }
      if (req.url === "/api/start") {
        if (starting)
          return reply(409, {
            error: "A workspace is already starting. Please wait.",
          });
        starting = true;
        try {
          return reply(200, await sessions.create(data.lessonId));
        } finally {
          starting = false;
        }
      }
      if (req.url === "/api/stop") {
        await sessions.remove(data.id);
        return reply(200, { ok: true });
      }
      if (req.url === "/api/reset")
        return reply(200, await sessions.resetAnswer(data.lessonId));
      if (req.url === "/api/check") {
        terminals?.assertReady(data.id);
        return reply(200, await sessions.checkAnswer(data.id));
      }
      if (req.url === "/api/answer-files") terminals?.assertReady(data.id);
      const result = await sessions.exclusive(data.id, async (s) => {
        if (req.url === "/api/answer-files") {
          if (s.lesson.engine !== "linux")
            throw Error("Answer file snapshots are for Linux exercises.");
          if (data.snapshot !== undefined) {
            await restoreAnswerFiles(s, data.snapshot);
            return { restored: true };
          }
          return { snapshot: await readAnswerFiles(s) };
        }
        if (req.url === "/api/write") {
          await sessions.write(s, data.filename, data.source);
          return { output: `Saved ${data.filename}\n` };
        }
        if (req.url === "/api/read") {
          if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(data.filename || ""))
            throw Error("Invalid filename");
          const r = await sessions.command(
            s,
            "cat " + (s.workspace || "/workspace") + "/" + data.filename,
          );
          if (r.code) throw Error(r.output);
          return r;
        }
        if (req.url === "/api/command")
          return sessions.command(s, data.command);
        throw Error("Unknown runner operation.");
      });
      reply(200, result);
    } catch (error) {
      reply(400, { error: error.message });
    }
  };
}
