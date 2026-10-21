importScripts("vendor/sql-wasm.js");
const ready = initSqlJs({ locateFile: (f) => "vendor/" + f });
self.onmessage = async ({ data }) => {
  let db;
  try {
    const SQL = await ready;
    db = new SQL.Database();
    db.run(`CREATE TABLE departments(id INTEGER PRIMARY KEY, name TEXT);
      INSERT INTO departments VALUES (1,'Engineering'),(2,'Operations');
      CREATE TABLE employees(id INTEGER PRIMARY KEY, name TEXT, department_id INTEGER, salary INTEGER);
      INSERT INTO employees VALUES (1,'Alex',1,85000),(2,'Maya',1,95000),(3,'Sam',2,60000),(4,'Noor',2,72000);`);
    const results = db.exec(data.sql);
    self.postMessage({
      results: results.map((r) => ({ ...r, values: r.values.slice(0, 100) })),
      truncated: results.some((r) => r.values.length > 100),
    });
  } catch (e) {
    self.postMessage({ error: e.message });
  } finally {
    db?.close();
  }
};
