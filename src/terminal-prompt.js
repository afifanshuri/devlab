export function terminalPrompt(cwd = "/workspace", home = "/workspace") {
  const directory =
    cwd === home
      ? "~"
      : cwd.startsWith(home + "/")
        ? "~" + cwd.slice(home.length)
        : cwd;
  return `afif@devlab:${directory}$`;
}
