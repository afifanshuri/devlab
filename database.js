let db, SQL, storage;
export let durable = true;
export async function initialize() {
  SQL = await window.initSqlJs({
    locateFile: (f) => new URL(`vendor/${f}`, import.meta.url).href,
  });
  let saved;
  try {
    storage = await new Promise((resolve, reject) => {
      const r = indexedDB.open("devlab", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    saved = await new Promise((resolve, reject) => {
      const r = storage
        .transaction("files")
        .objectStore("files")
        .get("progress");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  } catch {
    durable = false;
  }
  db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database();
  db.run(
    "CREATE TABLE IF NOT EXISTS progress (lesson_id TEXT PRIMARY KEY, completed INTEGER NOT NULL DEFAULT 0, draft TEXT, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);",
  );
  return db;
}
export function progress() {
  const results = db.exec(
    "SELECT lesson_id, completed, draft, updated_at FROM progress",
  );
  return Object.fromEntries(
    (results[0]?.values || []).map(([id, completed, draft, updated]) => [
      id,
      { completed: !!completed, draft, updated },
    ]),
  );
}
let queue = Promise.resolve();
export function persist() {
  if (!storage) return Promise.resolve();
  const bytes = db.export();
  queue = queue
    .catch(() => {})
    .then(
      () =>
        new Promise((resolve, reject) => {
          const t = storage.transaction("files", "readwrite");
          t.objectStore("files").put(bytes, "progress");
          t.oncomplete = () => resolve();
          t.onerror = () => {
            durable = false;
            reject(t.error);
          };
        }),
    );
  return queue;
}
export async function saveLesson(id, draft, completed = false) {
  db.run(
    "INSERT INTO progress (lesson_id,completed,draft,updated_at) VALUES (?,?,?,?) ON CONFLICT(lesson_id) DO UPDATE SET completed=MAX(progress.completed,excluded.completed), draft=excluded.draft, updated_at=excluded.updated_at",
    [id, completed ? 1 : 0, draft, new Date().toISOString()],
  );
  await persist();
}
export function setting(key, value) {
  if (value !== undefined) {
    db.run(
      "INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [key, value],
    );
    return persist();
  }
  return db.exec("SELECT value FROM settings WHERE key=$key", { $key: key })[0]
    ?.values[0]?.[0];
}
export function exportDatabase() {
  return db.export();
}
export async function importDatabase(bytes, validIds) {
  const candidate = new SQL.Database(bytes);
  try {
    candidate.run("PRAGMA query_only = ON");
    const table = candidate.exec(
      "SELECT type, sql FROM sqlite_master WHERE name = 'progress'",
    )[0]?.values[0];
    if (!table || table[0] !== "table" || /virtual/i.test(table[1]))
      throw Error("Not a DevLab progress backup.");
    const info = candidate.exec("PRAGMA integrity_check");
    if (info[0]?.values[0]?.[0] !== "ok")
      throw Error("Invalid SQLite database.");
    const rows =
      candidate.exec(
        "SELECT lesson_id,completed,draft,updated_at FROM progress LIMIT 1000",
      )[0]?.values || [];
    if (
      rows.some(
        ([id, c, d, t]) =>
          typeof id !== "string" ||
          ![0, 1].includes(c) ||
          (d !== null && typeof d !== "string") ||
          typeof t !== "string",
      )
    )
      throw Error("This backup contains invalid DevLab records.");
    // Import data only. Never adopt schema, views or triggers from an uploaded file.
    db.run("BEGIN");
    try {
      db.run("DELETE FROM progress");
      for (const row of rows.filter((row) => validIds.includes(row[0])))
        db.run("INSERT INTO progress VALUES (?,?,?,?)", row);
      db.run("COMMIT");
    } catch (e) {
      db.run("ROLLBACK");
      throw e;
    }
    await persist();
  } finally {
    candidate.close();
  }
}
