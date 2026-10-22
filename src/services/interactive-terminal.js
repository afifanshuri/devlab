import { callRunner } from "./runner.js";
import { createTerminalDisplay } from "./terminal-display.js";
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
  const display = await createTerminalDisplay(element, {
    observeResize: false,
  });
  const { term } = display;
  let ticket;
  try {
    ticket = await callRunner("terminal-ticket", { id });
  } catch (error) {
    display.dispose();
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
    display.resize();
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
      display.dispose();
    },
  };
}
