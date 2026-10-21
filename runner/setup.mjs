import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const args of [
  ["info", "--format", "{{.ServerVersion}}"],
  ["build", "-t", "devlab-java:1", "-f", "runner/Dockerfile", "."],
  ["pull", "postgres:17-bookworm"],
]) {
  const result = spawnSync("docker", args, {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.status !== 0) {
    console.error(
      "Start Docker Desktop with Linux containers, then retry npm run setup:labs.",
    );
    process.exit(1);
  }
}
console.log("Lab images ready. Run npm start, then open http://127.0.0.1:5173");
