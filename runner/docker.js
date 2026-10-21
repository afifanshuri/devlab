import { spawn } from "node:child_process";

// All host execution is docker with an argument array. Learner shell text is
// passed only to bash inside a restricted container, never to a host shell.
export function docker(
  args,
  { input = "", timeout = 15000, limit = 128000 } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "",
      overflow = false;
    const append = (data) => {
      if (output.length < limit)
        output += data.toString().slice(0, limit - output.length);
      else overflow = true;
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    const timer = setTimeout(() => {
      child.kill();
      reject(
        Error("Docker command timed out. Reset the lab if it is unresponsive."),
      );
    }, timeout);
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        code,
        output: output + (overflow ? "\n[output truncated]" : ""),
      });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
export async function must(args, options) {
  const r = await docker(args, options);
  if (r.code !== 0) throw Error(r.output || "Docker command failed");
  return r.output.trim();
}
