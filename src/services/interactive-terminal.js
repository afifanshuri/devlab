import { callRunner } from "./runner.js";
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
export async function openInteractiveTerminal(
  element,
  id,
  {
    onReady = () => {},
    onActivity = () => {},
    onError = () => {},
    onExit = () => {},
    onState = () => {},
  } = {},
) {
  await load();
  if (!element.isConnected) throw Error("Exercise navigation changed.");
  const term = new window.Terminal({
    cursorBlink: true,
    scrollback: 1500,
    fontSize: 13,
    fontFamily: "Consolas, monospace",
    screenReaderMode: true,
    theme: { background: "#0f1712", foreground: "#d1e5c7", cursor: "#c5f578" },
    allowProposedApi: false,
  });
  const fit = new window.FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(element);
  fit.fit();
  let ticket;
  try {
    ticket = await callRunner("terminal-ticket", { id });
  } catch (error) {
    term.dispose();
    throw error;
  }
  const url = new URL("/api/terminal", location.href);
  url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket.ticket);
  const socket = new WebSocket(url);
  let disposed = false,
    connected = false;
  const send = (message) => {
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify(message));
  };
  const resize = () => {
    if (disposed || !element.isConnected) return;
    fit.fit();
    term.resize(
      Math.max(10, Math.min(300, term.cols)),
      Math.max(4, Math.min(100, term.rows)),
    );
    send({ type: "resize", cols: term.cols, rows: term.rows });
  };
  const observer = new ResizeObserver(resize);
  observer.observe(element);
  const input = term.onData((data) => {
    if (!connected) return;
    for (let i = 0; i < data.length; i += 8000)
      send({ type: "input", data: data.slice(i, i + 8000) });
  });
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "output") term.write(message.data);
    else if (message.type === "ready") {
      connected = true;
      resize();
      term.focus();
      onReady(message.changed, message.atPrompt);
    } else if (message.type === "state") onState(message.atPrompt);
    else if (message.type === "activity") onActivity();
    else if (message.type === "error") onError(message.message);
    else if (message.type === "exit") {
      term.writeln("\r\n[Shell closed]");
      onExit();
    }
  };
  socket.onerror = () => {
    if (!disposed)
      onError(
        "Terminal connection failed. Restart the updated local runner and reopen this exercise.",
      );
  };
  socket.onclose = () => {
    if (!disposed) {
      onExit();
      if (!connected)
        onError(
          "Terminal could not connect. Restart the updated local runner and reopen this exercise.",
        );
    }
  };
  return {
    write: (text) => term.write(text.replace(/\r?\n/g, "\r\n")),
    setReadOnly: (value) => {
      term.options.disableStdin = value;
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      input.dispose();
      socket.close();
      term.dispose();
    },
  };
}
