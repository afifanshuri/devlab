export class LinuxSandbox {
  constructor() {
    this.reset();
  }
  reset() {
    this.cwd = "/home/learner";
    this.seen = new Set();
    this.history = [];
    this.fs = {
      "/": { dir: true },
      "/home": { dir: true },
      "/home/learner": { dir: true },
      "/home/learner/notes.txt": {
        text: "Welcome to DevLab.\nLearn by doing, one command at a time.\n",
        mode: "644",
      },
      "/var": { dir: true },
      "/var/log": { dir: true },
      "/var/log/app.log": {
        text: "INFO Application started\nERROR Database connection refused\nINFO Retrying connection\nERROR Request timeout\n",
        mode: "644",
      },
      "/etc": { dir: true },
      "/etc/app.conf": { text: "APP_ENV=production\nPORT=8080\n", mode: "644" },
    };
    this.services = { nginx: { active: false, enabled: false } };
  }
  path(raw = ".") {
    const p = raw.startsWith("/") ? raw : this.cwd + "/" + raw;
    const parts = [];
    for (const s of p.split("/")) {
      if (s === "..") parts.pop();
      else if (s && s !== ".") parts.push(s);
    }
    return "/" + parts.join("/");
  }
  run(input) {
    this.history.push(input);
    const tokens =
      input
        .match(/"[^"]*"|'[^']*'|\S+/g)
        ?.map((x) => x.replace(/^['"]|['"]$/g, "")) || [];
    const [cmd, ...args] = tokens;
    if (!cmd) return "";
    if (/[|;&><`]/.test(input) && cmd !== "echo")
      return "Pipes, redirects and compound commands are not supported in this focused simulator. Run one command at a time.";
    const name = args[0],
      p = this.path(name);
    const node = this.fs[p];
    switch (cmd) {
      case "help":
        return "Commands: pwd, ls [-l] [path], cd <dir>, mkdir <dir>, touch <file>, cat <file>, grep <pattern> <file>, chmod <octal> <file>, whoami, echo, clear, history, systemctl <status|start|stop|enable|disable> nginx, df -h, free -m, ps aux, journalctl -u nginx.\nThis is a simulated Linux environment; unsupported shell features do not execute.";
      case "pwd":
        this.seen.add("pwd");
        return this.cwd;
      case "whoami":
        return "learner (simulated admin)";
      case "ls": {
        this.seen.add("ls");
        const target = args.find((x) => !x.startsWith("-"));
        const path = this.path(target);
        const n = this.fs[path];
        if (!n) return "ls: no such file or directory";
        if (args.includes("-l")) {
          if (path === "/etc/app.conf") this.seen.add("inspect-config");
          const files = n.dir
            ? Object.keys(this.fs).filter(
                (x) => x !== "/" && x.slice(0, x.lastIndexOf("/")) === path,
              )
            : [path];
          return files
            .map((x) => {
              const f = this.fs[x],
                m = f.mode || "755";
              return (
                (f.dir ? "d" : "-") +
                m
                  .split("")
                  .map(
                    (c) =>
                      ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"][
                        +c
                      ],
                  )
                  .join("") +
                " learner learner " +
                (f.text?.length || 0) +
                " " +
                x.split("/").pop()
              );
            })
            .join("\n");
        }
        return n.dir
          ? Object.keys(this.fs)
              .filter(
                (x) =>
                  x !== "/" && (x.slice(0, x.lastIndexOf("/")) || "/") === path,
              )
              .map((x) => x.split("/").pop() + (this.fs[x].dir ? "/" : ""))
              .join("  ")
          : path.split("/").pop();
      }
      case "cd":
        if (!node?.dir) return "cd: no such directory";
        this.cwd = p;
        return "";
      case "mkdir":
        if (!name) return "mkdir: missing directory";
        if (node) return "mkdir: already exists";
        if (!this.fs[p.slice(0, p.lastIndexOf("/")) || "/"]?.dir)
          return "mkdir: parent directory does not exist";
        this.fs[p] = { dir: true };
        return "";
      case "touch":
        if (!name) return "touch: missing filename";
        if (!this.fs[p.slice(0, p.lastIndexOf("/")) || "/"]?.dir)
          return "touch: parent directory does not exist";
        if (!node) this.fs[p] = { text: "", mode: "644" };
        return "";
      case "cat":
        if (!node || node.dir) return "cat: no such file";
        if (p === "/home/learner/notes.txt") this.seen.add("read-notes");
        return node.text;
      case "grep": {
        const file = this.path(args[1] || "");
        if (!this.fs[file] || this.fs[file].dir) return "grep: no such file";
        const out = this.fs[file].text
          .split("\n")
          .filter((x) => x.includes(name));
        if (name === "ERROR" && file === "/var/log/app.log")
          this.seen.add("grep-errors");
        return out.join("\n");
      }
      case "chmod": {
        const file = this.path(args[1] || "");
        if (!/^[0-7]{3}$/.test(name))
          return "chmod: use a three-digit octal mode";
        if (!this.fs[file]) return "chmod: no such file";
        this.fs[file].mode = name;
        return "";
      }
      case "systemctl": {
        const s = this.services[args[1]];
        if (!s) return "systemctl: known service: nginx";
        if (name === "status") {
          this.seen.add("service-status");
          return `nginx.service — Web server\nActive: ${s.active ? "active (running)" : "inactive (dead)"}\nBoot: ${s.enabled ? "enabled" : "disabled"}`;
        }
        if (!["start", "stop", "enable", "disable"].includes(name))
          return "Unknown action";
        if (name === "start") s.active = true;
        if (name === "stop") s.active = false;
        if (name === "enable") s.enabled = true;
        if (name === "disable") s.enabled = false;
        return `${args[1]}: ${name} successful (simulated)`;
      }
      case "df":
        if (name !== "-h") return "Try df -h";
        this.seen.add("df");
        return "Filesystem      Size  Used  Avail  Use%  Mounted on\n/dev/sda1        40G   12G    28G   30%  /";
      case "free":
        if (name !== "-m") return "Try free -m";
        this.seen.add("free");
        return "              total   used   free   available\nMem:           4096   1536   2560       2560\nSwap:          2048      0   2048";
      case "ps":
        if (name !== "aux") return "Try ps aux";
        this.seen.add("ps");
        return "USER    PID  %CPU %MEM COMMAND\nroot      1   0.0  0.1 /sbin/init\nwww      42   0.2  1.3 nginx\nlearner 100   0.0  0.2 bash";
      case "journalctl":
        return name === "-u" && args[1] === "nginx"
          ? "nginx: configuration test successful\nnginx: ready for connections"
          : "Try journalctl -u nginx";
      case "echo":
        return args.join(" ");
      case "history":
        return this.history.map((s, i) => `${i + 1} ${s}`).join("\n");
      case "clear":
        return "\x00clear";
      default:
        return `${cmd}: command not supported. Type help for available commands.`;
    }
  }
  check(goal) {
    switch (goal) {
      case "read-notes":
        return ["pwd", "ls", "read-notes"].every((x) => this.seen.has(x));
      case "create-project":
        return (
          !!this.fs["/home/learner/projects"]?.dir &&
          !!this.fs["/home/learner/projects/Main.java"] &&
          this.cwd === "/home/learner/projects"
        );
      case "grep-errors":
        return this.seen.has("grep-errors");
      case "secure-config":
        return (
          this.fs["/etc/app.conf"].mode === "600" &&
          this.seen.has("inspect-config")
        );
      case "start-nginx":
        return (
          this.seen.has("service-status") &&
          this.services.nginx.active &&
          this.services.nginx.enabled
        );
      case "inspect-resources":
        return ["df", "free", "ps"].every((x) => this.seen.has(x));
      default:
        return false;
    }
  }
}
