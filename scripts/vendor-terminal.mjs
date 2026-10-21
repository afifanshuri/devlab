import { copyFile, mkdir } from "node:fs/promises";
const root = new URL("../", import.meta.url),
  dir = new URL("vendor/terminal/", root);
await mkdir(dir, { recursive: true });
for (const [source, target] of [
  ["@xterm/xterm/lib/xterm.js", "xterm.js"],
  ["@xterm/xterm/css/xterm.css", "xterm.css"],
  ["@xterm/xterm/LICENSE", "LICENSE-xterm"],
  ["@xterm/addon-fit/lib/addon-fit.js", "addon-fit.js"],
  ["@xterm/addon-fit/LICENSE", "LICENSE-addon-fit"],
])
  await copyFile(new URL("node_modules/" + source, root), new URL(target, dir));
console.log("Copied pinned official xterm.js assets and licenses.");
