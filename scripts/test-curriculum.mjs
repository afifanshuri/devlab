import { spawnSync } from "node:child_process";
const patterns = {
  legacy:
    "^(?!.*hands-(?:(java|sql|linux)-advanced|java-collection-methods|java-algorithm-practice):)",
  "java-a": "hands-java-advanced:([0-5]?[0-9])$",
  "java-b": "hands-java-advanced:([6-9][0-9]|1[0-9]{2})$",
  ops: "hands-(sql|linux)-advanced:",
  collections: "hands-java-(collection-methods|algorithm-practice):",
  all: ".",
};
const suite = process.argv[2] || "all";
if (!patterns[suite]) throw Error("Unknown curriculum suite");
const result = spawnSync(
  process.execPath,
  [
    "--test",
    "--test-name-pattern=" + patterns[suite],
    "tests/docker.integration.js",
  ],
  { stdio: "inherit", windowsHide: true },
);
process.exit(result.status ?? 1);
