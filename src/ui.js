import * as store from "../database.js";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chart: '<path d="M4 20V10m8 10V4m8 16v-7M2 21h20"/>',
  book: '<path d="M12 6v15m0-15C8 3 4 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2Z"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
  save: '<path d="M4 3h13l4 4v14H3V3Zm3 0v6h10V3M7 21v-8h10v8"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
};
const icon = (n) =>
  /* HTML */ `<svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${icons[n] || icons.code}
  </svg>`;
const activePage = () => location.hash.slice(1).split("/")[0] || "labs";
function shell(body) {
  const page = activePage();
  const name = store.setting("name") || "Curious developer";
  $("#app").innerHTML = /* HTML */ `<div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#labs"
        ><span class="logo">&lt;/&gt;</span>DevLab<span style="color:#c5f578"
          >.</span
        ></a
      >
      <div class="tagline">LESS WATCHING. MORE DOING.</div>
      <div class="navlabel">WORKSPACE</div>
      <nav class="nav" aria-label="Main navigation">
        <a
          href="#labs"
          class="${["labs", "lab"].includes(page) ? "active" : ""}"
          >${icon("grid")}Explore labs</a
        ><a href="#progress" class="${page === "progress" ? "active" : ""}"
          >${icon("chart")}My progress</a
        ><a href="#paths" class="${page === "paths" ? "active" : ""}"
          >${icon("book")}Learning paths</a
        >
      </nav>
      <div class="navlabel">YOUR TOOLKIT</div>
      <nav class="nav secondary-nav">
        <a href="#playground" class="${page === "playground" ? "active" : ""}"
          >${icon("code")}SQL playground</a
        ><a href="#settings" class="${page === "settings" ? "active" : ""}"
          >${icon("save")}Settings & backups</a
        >
      </nav>
      <div class="sidebar-bottom">
        <div class="tip">
          <strong>Small steps. Real skills.</strong>A little practice every day
          goes further than another open tutorial tab.
        </div>
        <div class="profile">
          <span class="avatar">${esc(name.charAt(0).toUpperCase())}</span>
          <div>${esc(name)}<small>Personal workspace</small></div>
        </div>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <span
          >Workspace
          <span style="margin:0 10px;color:#465057">/</span> ${page === "lab"
            ? "Interactive lab"
            : {
                labs: "Explore labs",
                progress: "My progress",
                paths: "Learning paths",
                settings: "Settings & backups",
                playground: "SQL playground",
              }[page] || "Explore labs"}</span
        >
        <div class="top-actions">
          <span class="online"><i class="dot"></i>Browser SQLite</span
          ><a href="#settings" class="secondary"
            >${icon("save")}
            <span style="margin-left:5px">Back up progress</span></a
          >
        </div>
      </header>
      <div class="content">${body}</div>
    </main>
  </div>`;
  if (!store.durable)
    toast("Browser storage unavailable. Export a backup before closing.");
}
function download(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (element.style.display = "none"), 4000);
}
export { $, esc, icon, toast, shell, download };
