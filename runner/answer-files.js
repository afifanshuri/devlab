import { must } from "./docker.js";
const MAX_BYTES = 512000;
const reserved =
  /^(?:\.devlab[^/]*|\.terminal\.pid|\.bash_history|\.cwd)(?:\/|$)/;
const quote = (value) => "'" + value.replaceAll("'", "'\"'\"'") + "'";
const safePath = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 240 &&
  !value.startsWith("/") &&
  !value.split("/").some((p) => !p || p === "." || p === "..") &&
  !/[\x00-\x1f\x7f]/.test(value) &&
  !reserved.test(value);
function safeLink(path, target) {
  if (
    typeof target !== "string" ||
    !target ||
    target.length > 240 ||
    /[\x00-\x1f\x7f]/.test(target)
  )
    return false;
  if (target.startsWith("/"))
    return target.startsWith("/workspace/") && safePath(target.slice(11));
  const parts = path.split("/").slice(0, -1);
  for (const part of target.split("/")) {
    if (part === "..") {
      if (!parts.length) return false;
      parts.pop();
    } else if (part && part !== ".") parts.push(part);
  }
  return safePath(parts.join("/"));
}
export function validateAnswerFiles(snapshot) {
  if (
    snapshot?.version !== 1 ||
    !Array.isArray(snapshot.entries) ||
    snapshot.entries.length > 200
  )
    throw Error("Invalid saved answer files.");
  const paths = new Set();
  let bytes = 0;
  for (const item of snapshot.entries) {
    if (
      !safePath(item.path) ||
      paths.has(item.path) ||
      !["f", "d", "l", "h"].includes(item.type) ||
      !/^[0-7]{3,4}$/.test(item.mode) ||
      parseInt(item.mode, 8) > 0o7777
    )
      throw Error("Invalid answer file path or permissions.");
    paths.add(item.path);
    if (item.type === "f") {
      if (
        typeof item.data !== "string" ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          item.data,
        )
      )
        throw Error("Invalid answer file contents.");
      const size = Buffer.from(item.data, "base64").length;
      bytes += size;
      if (size > 64000 || bytes > MAX_BYTES)
        throw Error(
          "Answer files exceed the save limit (64 KB per file, 512 KB total).",
        );
    } else if (["l", "h"].includes(item.type)) {
      // Links may only reference another path within this exercise workspace.
      if (
        !(item.type === "l"
          ? safeLink(item.path, item.target)
          : safePath(item.target))
      )
        throw Error("Saved links must stay inside the exercise workspace.");
    }
  }
  for (const item of snapshot.entries) {
    const parts = item.path.split("/");
    while ((parts.pop(), parts.length)) {
      const parent = snapshot.entries.find((e) => e.path === parts.join("/"));
      if (parent && parent.type !== "d")
        throw Error("Saved files cannot have a link as a parent.");
    }
    if (
      item.type === "h" &&
      !snapshot.entries.some((e) => e.path === item.target && e.type === "f")
    )
      throw Error("Invalid saved hard link.");
  }
  return snapshot;
}
export async function readAnswerFiles(session) {
  const script = `set -e
cd /workspace
find . -mindepth 1 \\( -path './.devlab*' -o -path './.terminal.pid' -o -path './.bash_history' -o -path './.cwd' \\) -prune -o \\( -type d -o -type f -o -type l \\) -print0 | while IFS= read -r -d '' file; do
  type=f; [ ! -d "$file" ] || type=d; [ ! -L "$file" ] || type=l
  size=$(stat -c %s -- "$file")
  [ "$type" != f ] || [ "$size" -le 64000 ] || { echo 'An answer file exceeds the 64 KB save limit.'; exit 1; }
  printf '%s\t%s\t%s\t%s\t' "$type" "$(stat -c %a -- "$file")" "$(stat -c %i -- "$file")" "$(printf '%s' "\${file#./}" | base64 -w0)"
  if [ "$type" = f ]; then base64 -w0 -- "$file"; elif [ "$type" = l ]; then readlink -n -- "$file" | base64 -w0; fi
  printf '\n'
done`;
  const raw = await must(["exec", "-i", session.name, "bash"], {
    input: script,
    limit: 900000,
  });
  const inodes = new Map();
  const entries = raw
    ? raw.split("\n").map((line) => {
        const [type, rawMode, inode, name, data = ""] = line.split("\t");
        const mode = rawMode?.padStart(3, "0");
        const path = Buffer.from(name || "", "base64").toString("utf8");
        if (type === "l")
          return {
            type,
            mode,
            path,
            target: Buffer.from(data, "base64").toString("utf8"),
          };
        if (type === "f" && inodes.has(inode))
          return { type: "h", mode, path, target: inodes.get(inode) };
        if (type === "f") inodes.set(inode, path);
        return { type, mode, path, ...(type === "f" ? { data } : {}) };
      })
    : [];
  return validateAnswerFiles({ version: 1, entries });
}
export async function restoreAnswerFiles(session, snapshot) {
  validateAnswerFiles(snapshot);
  const entries = [...snapshot.entries].sort(
    (a, b) => a.path.split("/").length - b.path.split("/").length,
  );
  const commands = ["set -eu", "cd /workspace"];
  const parents = (path) => {
    const parts = path.split("/").slice(0, -1);
    for (let i = 1; i <= parts.length; i++)
      commands.push(`test ! -L ${quote(parts.slice(0, i).join("/"))}`);
    if (parts.length) commands.push(`mkdir -p -- ${quote(parts.join("/"))}`);
  };
  for (const item of entries.filter((e) => e.type === "d" || e.type === "f")) {
    parents(item.path);
    const name = quote(item.path);
    commands.push(`test ! -L ${name}`);
    if (item.type === "d") commands.push(`mkdir -p -- ${name}`);
    else
      commands.push(
        `printf '%s' ${quote(item.data)} | base64 -d > ${name}`,
        `chmod ${item.mode} -- ${name}`,
      );
  }
  for (const item of entries.filter((e) => e.type === "l" || e.type === "h")) {
    parents(item.path);
    const name = quote(item.path);
    commands.push(`test ! -d ${name}`, `rm -f -- ${name}`);
    if (item.type === "h") {
      parents(item.target);
      commands.push(
        `test ! -L ${quote(item.target)}`,
        `ln -- ${quote(item.target)} ${name}`,
      );
    } else commands.push(`ln -s -- ${quote(item.target)} ${name}`);
  }
  for (const item of entries.filter((e) => e.type === "d").reverse())
    commands.push(`chmod ${item.mode} -- ${quote(item.path)}`);
  await must(["exec", "-i", session.name, "bash"], {
    input: commands.join("\n"),
    limit: 2000,
  });
}
