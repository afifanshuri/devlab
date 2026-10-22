import { allLessons } from "../../curriculum.js?v=linux-interview-1";
import * as store from "../../database.js";
import { state } from "../state.js";
import { $, esc, toast, shell, download } from "../ui.js";
function settings() {
  shell(
    /* HTML */ `<div class="settings">
      <div class="eyebrow">YOUR PERSONAL WORKSPACE</div>
      <h1>Make yourself at home<span>.</span></h1>
      <p class="sub">
        Your learning data is stored in SQLite and saved to this browser with
        IndexedDB.
      </p>
      <section class="panel">
        <h2>Profile</h2>
        <form id="name-form">
          <label class="form-field"
            >Display name<input
              id="name"
              value="${esc(store.setting("name") || "Curious developer")}"
              maxlength="40"
              required /></label
          ><button class="primary">Save profile</button>
        </form>
      </section>
      <section class="panel">
        <h2>Keep your progress safe</h2>
        <p class="muted">
          Browser data can be cleared or removed by private browsing. Export a
          .sqlite backup regularly. Import it on another device to continue
          learning. There is no account or cloud sync.
        </p>
        <button class="primary" id="export">Export SQLite backup ↓</button>
        <hr style="border:0;border-top:1px solid #303a40;margin:23px 0" />
        <label class="form-field"
          >Choose a DevLab backup<input
            id="import-file"
            type="file"
            accept=".sqlite,.db"
        /></label>
        <p class="muted">
          Import replaces your current exercise progress. Your profile and
          playground draft stay unchanged. Review and confirm before replacing.
        </p>
        <button class="secondary" id="import" disabled>
          Import selected backup
        </button>
      </section>
      <section class="panel">
        <h2>How these labs work</h2>
        <p class="muted">
          Java code is compiled and tested with a real JDK. Linux commands run
          in a disposable container. PostgreSQL labs execute against a real
          database. Oracle requires its optional image. Start the local runner
          with npm start; GitHub Pages only hosts the catalog.
        </p>
        <p class="muted">
          The SQL playground still runs SQLite in the browser. Linux has a real
          interactive Bash terminal with vim. Save and close vim before
          selecting Check answer; it verifies the files and state without
          replaying notes.sh. Java and database terminals run noninteractive
          commands. Java shares one runtime; PostgreSQL shares one runtime with
          a database and login per exercise. Passing removes that exercise's
          files/database. Shared runtimes expire after one hour without activity
          in any of their exercises. Linux, Oracle and cluster-role labs use
          dedicated containers deleted on pass or after one idle hour. Saved
          drafts and progress remain in this browser.
        </p>
        <p class="muted">
          Built with
          <a
            class="text-link"
            href="https://sql.js.org/"
            target="_blank"
            rel="noreferrer"
            >sql.js / SQLite</a
          >. No Supabase or external backend is used.
        </p>
      </section>
    </div>`,
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
  d.innerHTML = /* HTML */ `<button class="close" aria-label="Close dialog">
      ×
    </button>
    <h2>${esc(title)}</h2>
    <p class="muted">${esc(message)}</p>
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="secondary" id="cancel-dialog">Cancel</button
      ><button class="primary" id="confirm-dialog">Replace progress</button>
    </div>`;
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
