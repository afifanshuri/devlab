import test from "node:test";
import assert from "node:assert/strict";
import { localSocket } from "../runner/terminal-engine.js";
import { InteractiveTerminals } from "../runner/terminals.js";
test("Docker terminal accepts only local transports", () => {
  assert.equal(
    localSocket("unix:///var/run/docker.sock"),
    "/var/run/docker.sock",
  );
  assert.equal(
    localSocket("npipe:////./pipe/dockerDesktopLinuxEngine"),
    "\\\\.\\pipe\\dockerDesktopLinuxEngine",
  );
  assert.throws(() => localSocket("tcp://example.org:2375"), /local Docker/);
});
test("terminal tickets are bounded, expire, and accept only Linux workspaces", () => {
  const terminals = new InteractiveTerminals(
    {
      get: (id) => ({
        id,
        lesson: { engine: id === "linux" ? "linux" : "java" },
      }),
    },
    Promise.resolve(),
  );
  try {
    assert.throws(() => terminals.ticket("java"), /Linux/);
    const first = terminals.ticket("linux").ticket;
    assert.match(first, /^[a-f0-9]{64}$/);
    terminals.tickets.get(first).expires = Date.now() - 1;
    terminals.ticket("linux");
    assert.equal(terminals.tickets.has(first), false);
    for (let i = 1; i < 64; i++) terminals.ticket("linux");
    assert.throws(() => terminals.ticket("linux"), /Too many/);
    terminals.shells.set("linux", { atPrompt: false });
    assert.throws(() => terminals.assertReady("linux"), /save and close vim/);
    terminals.shells.get("linux").atPrompt = true;
    terminals.assertReady("linux");
    terminals.shells.clear();
  } finally {
    terminals.dispose();
  }
});
