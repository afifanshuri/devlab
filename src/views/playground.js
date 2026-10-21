import { courses, allLessons } from "../../content.js";
import * as store from "../../database.js";
import { state } from "../state.js";
import { $, esc, icon, toast, shell, download } from "../ui.js";
import { completed, count, route } from "../catalog-data.js";
import { executeSql, formatResults } from "../services/sql.js";
function playground() {
  shell(
    `<div class="eyebrow">EXPERIMENT. BREAK THINGS. TRY AGAIN.</div><h1>Your SQL playground<span>.</span></h1><p class="sub">A real SQLite engine in your browser. No setup, no credentials, no shared database.</p><div class="panel" style="padding:0;overflow:hidden"><div class="editor-bar"><span>playground.sql</span><span>SQLITE · LIVE</span></div><textarea class="editor" id="play-code" aria-label="Playground SQL query" spellcheck="false" style="min-height:230px">${esc(store.setting("playground") || "SELECT e.name, d.name AS department, e.salary\nFROM employees e\nJOIN departments d ON d.id = e.department_id\nORDER BY e.salary DESC;")}</textarea><div class="workspace-actions"><span class="muted">employees(id, name, department_id, salary)<br>departments(id, name)</span><button class="primary" id="run-sql">Run query ${icon("arrow")}</button></div><div id="play-output" class="console" role="status">Query results will appear here.</div><div class="mode-note">Each run starts with fresh sample data. You can run multiple statements together. Output is capped at 100 rows per result; queries time out after 3 seconds. Oracle PL/SQL and PL/pgSQL are not supported by SQLite.</div></div>`,
  );
  $("#run-sql").onclick = async () => {
    const btn = $("#run-sql");
    btn.disabled = true;
    try {
      const sql = $("#play-code").value;
      await store.setting("playground", sql);
      const r = await executeSql(sql);
      if (!document.contains(btn)) return;
      $("#play-output").textContent = r.error
        ? "SQL error: " + r.error
        : formatResults(r);
      $("#play-output").className =
        "console " + (r.error ? "error" : "success");
    } catch (e) {
      if ($("#play-output")) $("#play-output").textContent = e.message;
    } finally {
      if (document.contains(btn)) btn.disabled = false;
    }
  };
}

export { playground };
