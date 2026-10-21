function executeSql(sql) {
  if (sql.length > 20000)
    return Promise.reject(Error("Keep queries below 20,000 characters."));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../../sql-worker.js", import.meta.url));
    const finish = () => {
      clearTimeout(timeout);
      worker.terminate();
    };
    const timeout = setTimeout(() => {
      finish();
      reject(
        Error("Query exceeded the 3-second limit. Simplify it and try again."),
      );
    }, 3000);
    worker.onmessage = (e) => {
      finish();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      finish();
      reject(Error(e.message || "SQLite worker failed."));
    };
    worker.postMessage({ sql });
  });
}
function formatResults(data) {
  if (!data.results.length) return "Query executed. No rows returned.";
  return data.results
    .map((r) =>
      [
        r.columns.join("  |  "),
        r.columns.map(() => "────────").join("──┼──"),
        ...r.values.map((row) =>
          row.map((v) => (v === null ? "NULL" : String(v))).join("  |  "),
        ),
        `(${r.values.length} rows${data.truncated ? ", capped at 100" : ""})`,
      ].join("\n"),
    )
    .join("\n\n");
}

export { executeSql, formatResults };
