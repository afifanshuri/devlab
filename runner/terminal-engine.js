import http from "node:http";
import { must } from "./docker.js";

// Only the runner can reach Docker's local socket. No daemon endpoint or
// arbitrary Engine request is exposed to the browser.
export function localSocket(endpoint) {
  if (endpoint.startsWith("unix:///")) return endpoint.slice(7);
  if (endpoint.startsWith("npipe:////./pipe/"))
    return "\\\\.\\pipe\\" + endpoint.slice("npipe:////./pipe/".length);
  throw Error(
    "Interactive labs require a local Docker unix socket or Windows named pipe.",
  );
}
export class TerminalEngine {
  async connection() {
    this.socket ??= must([
      "context",
      "inspect",
      "--format",
      "{{.Endpoints.docker.Host}}",
    ])
      .then((endpoint) => localSocket(process.env.DOCKER_HOST || endpoint))
      .catch((error) => {
        this.socket = null;
        throw error;
      });
    return this.socket;
  }
  async request(path, body, attach = false) {
    const socketPath = await this.connection();
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const request = http.request({
        socketPath,
        path: "/v1.47" + path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...(attach ? { Connection: "Upgrade", Upgrade: "tcp" } : {}),
        },
      });
      const timer = setTimeout(
        () => request.destroy(Error("Docker terminal connection timed out.")),
        15000,
      );
      request.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      request.on("upgrade", (response, stream, head) => {
        clearTimeout(timer);
        if (response.statusCode !== 101) {
          stream.destroy();
          reject(Error("Docker refused the interactive terminal."));
          return;
        }
        if (head.length) stream.unshift(head);
        resolve(stream);
      });
      request.on("response", (response) => {
        let output = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          output += chunk;
          if (output.length > 65536)
            request.destroy(Error("Docker response too large."));
        });
        response.on("end", () => {
          clearTimeout(timer);
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              Error(
                "Docker terminal request failed. Check that the exercise container is running.",
              ),
            );
            return;
          }
          if (attach) {
            reject(Error("Docker did not attach an interactive stream."));
            return;
          }
          try {
            resolve(output ? JSON.parse(output) : {});
          } catch {
            reject(Error("Invalid Docker terminal response."));
          }
        });
      });
      request.end(data);
    });
  }
  async open(s, owner) {
    const root = s.workspace || "/workspace";
    // A runner restart can leave the old shell alive. Retire only its recorded
    // PID in this exercise's dedicated container before starting its replacement.
    const rc = `old=$(cat ${root}/.terminal.pid 2>/dev/null)
case "$old" in
  ''|*[!0-9]*) ;;
  *) if [ "$old" -gt 1 ] && [ "$old" != "$$" ] && grep -Fq -- '${root}/.devlab-bashrc' "/proc/$old/cmdline" 2>/dev/null; then
       kill -HUP "$old" 2>/dev/null || true
     fi ;;
esac
echo $$ > ${root}/.terminal.pid
cd "$(cat ${root}/.cwd 2>/dev/null || printf ${root})" || cd ${root}
export HOME=${root}
export HISTFILE=${root}/.bash_history
export PS1='afif@devlab:\\w$ '
PS0=$'\\e]133;C\\a'
PROMPT_COMMAND='pwd > ${root}/.cwd; history -a; printf "\\033]133;A\\007"'
if ! command -v nano >/dev/null; then
  printf '\\nThis older container has no nano. Your files are preserved; newly started labs use the updated image.\\n'
fi
`;
    await must(
      [
        "exec",
        "-i",
        ...owner.pools.options(s),
        s.name,
        "sh",
        "-c",
        `cat > ${root}/.devlab-bashrc`,
      ],
      { input: rc },
    );
    const created = await this.request(`/containers/${s.name}/exec`, {
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      User: "1000:1000",
      WorkingDir: root,
      Env: ["TERM=xterm-256color", "LANG=C.UTF-8"],
      Cmd: ["bash", "--noprofile", "--rcfile", root + "/.devlab-bashrc", "-i"],
    });
    if (!/^[a-f0-9]{64}$/.test(created.Id || ""))
      throw Error("Invalid Docker exec identifier.");
    const stream = await this.request(
      `/exec/${created.Id}/start`,
      { Detach: false, Tty: true },
      true,
    );
    return {
      stream,
      resize: (cols, rows) =>
        this.request(`/exec/${created.Id}/resize?w=${cols}&h=${rows}`, {}),
    };
  }
}
