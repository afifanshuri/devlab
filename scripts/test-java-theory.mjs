import { spawnSync } from "node:child_process";
import { javaInterview } from "../java-interview.js";

const probes = javaInterview.lessons
  .map((question, index) => ({ ...question, index }))
  .filter((question) => question.probe);
const quote = (value) => "'" + value.replaceAll("'", "'\"'\"'") + "'";
const script = [
  "set -euo pipefail",
  ...probes.map(
    (question) =>
      `cat > Probe${question.index}.java <<'JAVA_${question.index}'\n${question.probe.replaceAll("InterviewProbe", "Probe" + question.index)}\nJAVA_${question.index}`,
  ),
  "javac Probe*.java",
  ...probes.map(
    (question) =>
      `actual=$(java Probe${question.index})\nif [ "$actual" != ${quote(question.answers[0])} ]; then printf 'FAIL theory ${question.index}: %s\\n' "$actual"; exit 1; fi\nprintf 'PASS Java 21 theory output ${question.index}\\n'`,
  ),
].join("\n");
const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "-i",
    "--network",
    "none",
    "--read-only",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--memory",
    "512m",
    "--cpus",
    "2",
    "--pids-limit",
    "128",
    "--user",
    "1000:1000",
    "--tmpfs",
    "/workspace:rw,nosuid,size=32m,uid=1000,gid=1000,mode=700",
    "devlab-java:1",
    "bash",
    "-s",
  ],
  {
    input: script,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
  },
);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log(
  `${probes.length} code-output answers independently verified using Java 21.`,
);
