import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../runner/server.js";
test("API waits for workspace recovery while the static app stays available", async () => {
  let recover;
  const ready = new Promise((resolve) => {
    recover = resolve;
  });
  const server = createApp({}, ready);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    let settled = false;
    const pending = fetch(base + "/api/session", {
      headers: { "Sec-Fetch-Site": "same-origin" },
    }).then((r) => {
      settled = true;
      return r;
    });
    assert.equal((await fetch(base + "/")).status, 200);
    assert.equal(settled, false);
    recover();
    const response = await pending;
    assert.equal(response.status, 200);
    assert.ok((await response.json()).token);
  } finally {
    recover();
    await new Promise((resolve) => server.close(resolve));
  }
});
test("failed recovery returns a controlled error without exposing Docker credentials", async () => {
  const ready = Promise.reject(Error("private detail"));
  ready.catch(() => {});
  const server = createApp({}, ready);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api/session",
    );
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private detail/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
