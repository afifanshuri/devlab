import { courses, allLessons } from "../../content.js";
import * as store from "../../database.js";
import { state } from "../state.js";
import { $, esc, icon, toast, shell, download } from "../ui.js";
import { completed, count, route } from "../catalog-data.js";
function settings() {
  shell(
    `<div class="settings"><div class="eyebrow">YOUR PERSONAL WORKSPACE</div><h1>Make yourself at home<span>.</span></h1><p class="sub">Your learning data is stored in SQLite and saved to this browser with IndexedDB.</p><section class="panel"><h2>Profile</h2><form id="name-form"><label class="form-field">Display name<input id="name" value="${esc(store.setting("name") || "Curious developer")}" maxlength="40" required></label><button class="primary">Save profile</button></form></section><section class="panel"><h2>Keep your progress safe</h2><p class="muted">Browser data can be cleared or removed by private browsing. Export a .sqlite backup regularly. Import it on another device to continue learning. There is no account or cloud sync.</p><button class="primary" id="export">Export SQLite backup ↓</button><hr style="border:0;border-top:1px solid #303a40;margin:23px 0"><label class="form-field">Choose a DevLab backup<input id="import-file" type="file" accept=".sqlite,.db"></label><p class="muted">Import replaces your current exercise progress. Your profile and playground draft stay unchanged. Review and confirm before replacing.</p><button class="secondary" id="import" disabled>Import selected backup</button></section><section class="panel"><h2>How these labs work</h2><p class="muted"><strong>SQL:</strong> real SQLite queries run in a disposable worker with a time limit.<br><strong>Linux:</strong> a virtual filesystem and supported administrative commands are simulated.<br><strong>Java:</strong> conceptual questions and code structure checks; no JVM is included.<br><strong>Oracle & PostgreSQL:</strong> dialect-specific guided exercises; procedural code is not executed.</p><p class="muted">Built with <a class="text-link" href="https://sql.js.org/" target="_blank" rel="noreferrer">sql.js / SQLite</a>. No Supabase or external backend is used.</p></section></div>`,
  );
  $("#name-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await store.setting(
        "name",
        $("#name").value.trim() || "Curious developer",
      );
      settings();
      toast("Profile saved.");
    } catch {
      toast("Profile could not be saved.");
    }
  };
  $("#export").onclick = () => {
    download(
      store.exportDatabase(),
      "devlab-progress.sqlite",
      "application/vnd.sqlite3",
    );
    toast("SQLite backup exported.");
  };
  $("#import-file").onchange = () => {
    $("#import").disabled = !$("#import-file").files.length;
  };
  $("#import").onclick = () => {
    const f = $("#import-file").files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast("Backup must be smaller than 5 MB.");
      return;
    }
    showDialog(
      "Replace exercise progress?",
      `Importing ${f.name} will replace your existing exercise records. Export your current progress first if you want to keep it.`,
      async () => {
        try {
          await store.importDatabase(
            new Uint8Array(await f.arrayBuffer()),
            allLessons.map((l) => l.id),
          );
          state.records = store.progress();
          settings();
          toast("Progress restored from SQLite backup.");
        } catch (e) {
          toast("Import failed: " + e.message);
        }
      },
    );
  };
}
function showDialog(title, message, confirm) {
  document.querySelector("dialog")?.remove();
  const d = document.createElement("dialog");
  d.innerHTML = `<button class="close" aria-label="Close dialog">×</button><h2>${esc(title)}</h2><p class="muted">${esc(message)}</p><div style="display:flex;gap:10px;margin-top:20px"><button class="secondary" id="cancel-dialog">Cancel</button><button class="primary" id="confirm-dialog">Replace progress</button></div>`;
  document.body.append(d);
  d.showModal();
  d.querySelector(".close").onclick = () => d.close();
  d.querySelector("#cancel-dialog").onclick = () => d.close();
  d.querySelector("#confirm-dialog").onclick = () => {
    d.close();
    confirm();
  };
}

export { settings };
