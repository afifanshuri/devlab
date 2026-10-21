import * as store from "./database.js";
import { state } from "./src/state.js";
import { $, esc } from "./src/ui.js";
import { catalog } from "./src/views/catalog.js";
import { lesson, flushDraft } from "./src/views/lab.js";
import { progressPage, paths } from "./src/views/progress.js";
import { settings } from "./src/views/settings.js";
import { playground } from "./src/views/playground.js";
async function render() {
  await flushDraft();
  state.current = null;
  const [page, id, index] = location.hash.slice(1).split("/");
  if (page === "lab") lesson(id, index ?? 0);
  else
    (
      ({ progress: progressPage, paths, settings, playground })[page] || catalog
    )();
  window.scrollTo(0, 0);
}
try {
  await store.initialize();
  state.records = store.progress();
  await render();
  window.addEventListener("hashchange", () => render().catch(showError));
} catch (error) {
  showError(error);
}
function showError(error) {
  $("#app").innerHTML =
    `<div style="padding:50px"><h1>Workspace could not start.</h1><p>${esc(error.message)}</p><p>Serve the app over HTTP and check that bundled SQLite assets can load.</p><button class="secondary" id="retry">Try again</button></div>`;
  $("#retry").onclick = () => location.reload();
}
