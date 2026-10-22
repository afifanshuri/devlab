let libraries;
function script(src) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = src;
    tag.onload = resolve;
    tag.onerror = () =>
      reject(Error("Terminal assets failed to load. Reload the app."));
    document.head.append(tag);
  });
}
function load() {
  return (libraries ??= (async () => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "vendor/terminal/xterm.css";
    document.head.append(css);
    await script("vendor/terminal/xterm.js");
    await script("vendor/terminal/addon-fit.js");
  })().catch((error) => {
    libraries = null;
    throw error;
  }));
}
export async function createTerminalDisplay(
  element,
  { readOnly = false, observeResize = true } = {},
) {
  await load();
  if (!element.isConnected) throw Error("Exercise navigation changed.");
  const term = new window.Terminal({
    cursorBlink: !readOnly,
    disableStdin: readOnly,
    scrollback: 1500,
    fontSize: 13,
    fontFamily: "Consolas, monospace",
    screenReaderMode: true,
    theme: { background: "#0f1712", foreground: "#d1e5c7", cursor: "#c5f578" },
    allowProposedApi: false,
  });
  const fit = new window.FitAddon.FitAddon();
  term.loadAddon(fit);
  element.textContent = "";
  term.open(element);
  fit.fit();
  const resize = () => {
    if (!element.isConnected) return;
    fit.fit();
    term.resize(
      Math.max(10, Math.min(300, term.cols)),
      Math.max(4, Math.min(100, term.rows)),
    );
  };
  const observer = new ResizeObserver(resize);
  if (observeResize) observer.observe(element);
  return {
    term,
    resize,
    write: (text) => term.write(text.replace(/\r?\n/g, "\r\n")),
    dispose() {
      observer.disconnect();
      term.dispose();
    },
  };
}
