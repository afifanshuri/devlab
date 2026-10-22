import { linux } from "./exercise-factories.js";
const quote = (value) => "'" + value.replaceAll("'", "'\"'\"'") + "'";
function script(title, goal, body, cases) {
  const checks = cases
    .map(
      ([input, expected, args = "/workspace/input.txt", status = 0]) =>
        `printf '%s' ${quote(input)} > /workspace/input.txt\nbefore=$(sha256sum /workspace/input.txt)\nset +e\nactual=$(bash /workspace/report.sh ${args}); status=$?\nset -e\ntest "$status" = ${status}\ntest "$actual" = ${quote(expected)}\ntest "$(sha256sum /workspace/input.txt)" = "$before"`,
    )
    .join("\n");
  return {
    ...linux(
      title,
      "Advanced, repeatable operational tooling",
      goal,
      `cat > /workspace/report.sh <<'REPORT'\n#!/usr/bin/env bash\n${body}\nREPORT\nchmod 600 /workspace/report.sh`,
      "test -f /workspace/report.sh\n" + checks,
      { "input.txt": cases[0][0] },
    ),
    mission: `You are the on-call engineer. ${title}. The next incident will contain different rows, so your tool must derive its answer rather than print the supplied example.`,
    goal:
      "Create /workspace/report.sh. Run it with bash; the workspace blocks direct execution. " +
      goal,
    task:
      "Create /workspace/report.sh. " +
      goal +
      " Do not change the supplied input file. Print only the requested result.",
    example:
      "Expected stdout for supplied input:\n" + (cases[0][1] || "(empty)"),
    hint: "Use quoted paths, explicit field boundaries and deterministic sorting. Test the alternate and empty-input cases before submitting.",
  };
}
export const linuxTopics = [];
const pair = (base, name, a, b) =>
  linuxTopics.push({ base, name, questions: [script(...a), script(...b)] });
pair(
  "hands-linux-basics:1",
  "grep and exact log filtering",
  [
    "Filter only real error records",
    "Accept one log path. Print original lines containing a complete whitespace-delimited level=ERROR field; ignore level=ERRORISH and text=ERROR. Preserve order; no matches is success with empty stdout.",
    `awk '{for(i=1;i<=NF;i++)if($i=="level=ERROR"){print;break}}' "$1"`,
    [
      [
        "level=ERROR msg=bad\nlevel=ERRORISH msg=no\nlevel=INFO text=ERROR\n",
        "level=ERROR msg=bad",
      ],
      ["x=1 level=ERROR msg=later\nlevel=INFO\n", "x=1 level=ERROR msg=later"],
      ["", ""],
    ],
  ],
  [
    "Follow an exact trace across log levels",
    "Accept a log path and trace ID. Print original lines containing a complete trace=ID field, across all levels; reject missing/empty trace ID with exit 2 and no stdout. IDs use letters, digits and hyphens. No matches is success.",
    `[[ $# = 2 && -n $2 && $2 =~ ^[A-Za-z0-9-]+$ ]] || exit 2
awk -v wanted="trace=$2" '{for(i=1;i<=NF;i++)if($i==wanted){print;break}}' "$1"`,
    [
      [
        "level=INFO trace=t1\nlevel=ERROR trace=t10\nlevel=ERROR trace=t1\n",
        "level=INFO trace=t1\nlevel=ERROR trace=t1",
        "/workspace/input.txt t1",
      ],
      [
        "trace=new-2 x=y\ntrace=new-20\n",
        "trace=new-2 x=y",
        "/workspace/input.txt new-2",
      ],
      ["", "", "/workspace/input.txt ''", 2],
    ],
  ],
);
pair(
  "hands-linux-foundations:2",
  "awk and grouped text reports",
  [
    "Aggregate valid service error counts",
    "Input CSV has no header: service,status,count. Only ERROR rows with nonempty service and a nonnegative integer count contribute. Ignore malformed rows. Print service,total sorted lexically by service, omitting services with no valid ERROR rows.",
    `awk -F, 'NF==3&&$1!=""&&$2=="ERROR"&&$3~/^[0-9]+$/{sum[$1]+=$3;seen[$1]=1}END{for(s in seen)print s "," sum[s]}' "$1" | LC_ALL=C sort`,
    [
      [
        "api,ERROR,2\nworker,ERROR,3\napi,ERROR,4\napi,INFO,99\nbad,ERROR,no\n",
        "api,6\nworker,3",
      ],
      ["z,ERROR,0\na,ERROR,5\na,ERROR,1\n", "a,6\nz,0"],
      ["", ""],
    ],
  ],
  [
    "Rank error volume with deterministic ties",
    "Same CSV validation as the previous challenge. Print at most two service,total rows, descending total and then ascending service for ties. Empty input prints nothing.",
    `awk -F, 'NF==3&&$1!=""&&$2=="ERROR"&&$3~/^[0-9]+$/{sum[$1]+=$3;seen[$1]=1}END{for(s in seen)print s "," sum[s]}' "$1" | LC_ALL=C sort -t, -k2,2nr -k1,1 | head -n 2`,
    [
      ["b,ERROR,3\na,ERROR,3\nc,ERROR,8\n", "c,8\na,3"],
      ["z,ERROR,1\n", "z,1"],
      ["", ""],
    ],
  ],
);
pair(
  "hands-linux-shell-roadmap:2",
  "sort, uniq, comm and reconciliation",
  [
    "Report inventory drift in both directions",
    "Input lines are +ID for current inventory and -ID for expected inventory. IDs are nonempty, without spaces. Deduplicate; output missing:ID for expected-only IDs, then extra:ID for current-only IDs, each group sorted lexically. Ignore other lines.",
    `dir=$(mktemp -d); trap 'rm -rf "$dir"' EXIT
awk '/^\\+[^[:space:]]+$/{print substr($0,2)}' "$1" | LC_ALL=C sort -u > "$dir/current"
awk '/^-[^[:space:]]+$/{print substr($0,2)}' "$1" | LC_ALL=C sort -u > "$dir/expected"
LC_ALL=C comm -23 "$dir/expected" "$dir/current" | sed 's/^/missing:/'
LC_ALL=C comm -13 "$dir/expected" "$dir/current" | sed 's/^/extra:/'`,
    [
      ["+A\n+B\n+B\n-A\n-C\n", "missing:C\nextra:B"],
      ["-Z\n-Y\n+X\n", "missing:Y\nmissing:Z\nextra:X"],
      ["", ""],
    ],
  ],
  [
    "Keep counts when duplicates matter",
    "Input lines are nonempty IDs without whitespace. Ignore blank/whitespace-containing lines. Output ID,count sorted by descending count then ID ascending. Do not collapse multiplicity before counting.",
    `awk 'NF==1&&$0!~/[[:space:]]/{n[$0]++}END{for(k in n)print k "," n[k]}' "$1" | LC_ALL=C sort -t, -k2,2nr -k1,1`,
    [
      ["b\na\nb\na\nc\n\n", "a,2\nb,2\nc,1"],
      ["z\nz\nx\n", "z,2\nx,1"],
      ["", ""],
    ],
  ],
);
pair(
  "hands-linux-foundations:5",
  "find and safe path handling",
  [
    "Inventory paths containing spaces",
    "Input is a newline-separated list of relative filenames to create under a private temporary directory. Ignore empty lines; reject absolute paths, dot/dotdot components and duplicate separators with exit 2. Print only filenames ending .log (case-sensitive), sorted lexically, preserving spaces. Do not create anything outside the temporary directory.",
    `dir=$(mktemp -d); trap 'rm -rf "$dir"' EXIT
while IFS= read -r line || [[ -n $line ]]; do
 [[ -n $line ]] || continue
 case "$line" in /*|.|..|*/../*|../*|*/..|*/./*|./*|*/.|*//*) exit 2;; esac
 mkdir -p -- "$dir/$(dirname -- "$line")"; : > "$dir/$line"
done < "$1"
find "$dir" -type f -name '*.log' -printf '%P\n' | LC_ALL=C sort`,
    [
      ["a space/error.log\nother.txt\nz.log\n", "a space/error.log\nz.log"],
      ["deep/a.log\ndeep/b.LOG\n", "deep/a.log"],
      ["../escape\n", "", "/workspace/input.txt", 2],
    ],
  ],
  [
    "Count direct and nested log paths separately",
    "Input uses the same safe-path rules as the first challenge. Deduplicate filenames and count .log paths with no slash as direct and with one or more slashes as nested. Print direct=N then nested=N, even for empty input.",
    `awk 'BEGIN{direct=0;nested=0;bad=0} /^$/{next} {if($0~/^\\//||$0~/(^|\\/)\\.\\.?($|\\/)/||$0~/\\/\\//){bad=1;exit} if(!seen[$0]++ && $0~/\\.log$/){if(index($0,"/"))nested++;else direct++}} END{if(bad)exit 2;print "direct="direct;print "nested="nested}' "$1"`,
    [
      ["a.log\na.log\ndir/a.log\nx.txt\n", "direct=1\nnested=1"],
      ["", "direct=0\nnested=0"],
      ["/escape.log\n", "", "/workspace/input.txt", 2],
    ],
  ],
);
pair(
  "hands-linux-shell-roadmap:0",
  "Shell environment, PATH and exit contracts",
  [
    "Validate an environment-dependent worker",
    "Input file is ignored but must remain unchanged. REGION defaults to unknown when unset/empty. LIMIT defaults to 10, must be an integer 1..100; invalid values exit 2 with no stdout. Print region=VALUE then limit=N with decimal normalization. Accept no command-line dependencies outside normal system tools.",
    `region=\${REGION:-unknown}; limit=\${LIMIT:-10}
[[ $limit =~ ^[0-9]+$ && \${#limit} -le 3 ]] || exit 2
n=$((10#$limit)); ((n>=1&&n<=100)) || exit 2
printf 'region=%s\nlimit=%s\n' "$region" "$n"`.replaceAll("\\${", "${"),
    [["", "region=apac\nlimit=7", "/workspace/input.txt", 0]],
  ],
  [
    "Handle file absence without masking real failures",
    "Accept one path. Missing file exits 3 with no stdout; an existing non-regular file exits 2; a regular file prints its line count as lines=N, counting a final unterminated line. Do not write or change the input.",
    `[[ $# = 1 ]] || exit 2
[[ -e $1 ]] || exit 3
[[ -f $1 ]] || exit 2
awk 'END{print "lines=" NR}' "$1"`,
    [
      ["a\nb\n", "lines=2"],
      ["last", "lines=1"],
      ["", "lines=0"],
      ["", "", "/workspace/missing-input", 3],
      ["", "", "/workspace", 2],
    ],
  ],
);
// Environment fixtures are explicit to avoid inheriting the host shell's values.
linuxTopics.at(-1).questions[0].check =
  linuxTopics
    .at(-1)
    .questions[0].check.replace(
      "bash /workspace/report.sh /workspace/input.txt",
      "REGION=apac LIMIT=007 bash /workspace/report.sh /workspace/input.txt",
    ) +
  `\ntest "$(env -u REGION -u LIMIT bash /workspace/report.sh)" = "$(printf 'region=unknown\\nlimit=10')"\nset +e\nLIMIT=0 bash /workspace/report.sh > /workspace/invalid.out; code=$?\nset -e\ntest "$code" = 2\ntest ! -s /workspace/invalid.out`;
pair(
  "hands-linux-shell-roadmap:1",
  "Streams, redirection and pipeline failures",
  [
    "Separate accepted data from rejected data",
    "Input has one signed integer per line. Print valid integer lines unchanged to stdout; print invalid:LINE to stderr for all other lines, including blanks. Process all lines; exit 4 if any rejection, otherwise 0. The checker exercises stdout; your script must still produce the required stderr diagnostics.",
    `bad=0
while IFS= read -r line || [[ -n $line ]]; do
 if [[ $line =~ ^-?[0-9]+$ ]]; then printf '%s\n' "$line"; else printf 'invalid:%s\n' "$line" >&2; bad=1; fi
done < "$1"
((bad==0)) || exit 4`,
    [
      ["1\n-2\n", "1\n-2"],
      ["1\nwrong\n2\n", "1\n2", "/workspace/input.txt", 4],
      ["", ""],
    ],
  ],
  [
    "Do not hide an upstream pipeline error",
    "Accept one path. Missing files exit 3 without stdout. For an existing regular file, print the number of lines containing a literal ERROR substring as errors=N. No matches succeeds with zero; reject non-regular input with exit 2.",
    `[[ -e $1 ]] || exit 3
[[ -f $1 ]] || exit 2
awk 'index($0,"ERROR"){n++}END{print "errors=" n+0}' "$1"`,
    [
      ["ERROR x\nINFO\nERROR y\n", "errors=2"],
      ["INFO\n", "errors=0"],
      ["", "", "/workspace/not-there", 3],
    ],
  ],
);
pair(
  "hands-linux-admin-workshop:0",
  "Permissions, umask and setgid",
  [
    "Provision a private answer directory",
    "Input contains the text to store. Create /workspace/private/answer with identical bytes; directory mode 700 and file mode 600 regardless of caller umask or old permissions. Print ready. Repeated execution replaces content, never appends.",
    `mkdir -p /workspace/private; chmod 700 /workspace/private
cat "$1" > /workspace/private/answer; chmod 600 /workspace/private/answer
printf 'ready\n'`,
    [
      ["secret\n", "ready"],
      ["replacement\n", "ready"],
    ],
  ],
  [
    "Provision a group-inheriting work area",
    "Create /workspace/team with mode 2770 and write the input bytes to /workspace/team/answer with mode 660. Existing files must be replaced, not appended. Print ready. Preserve the setgid bit even when rerun.",
    `mkdir -p /workspace/team; chmod 2770 /workspace/team
cat "$1" > /workspace/team/answer; chmod 660 /workspace/team/answer
printf 'ready\n'`,
    [
      ["shared\n", "ready"],
      ["new\n", "ready"],
    ],
  ],
);
linuxTopics.at(-1).questions[0].check +=
  `\ntest "$(stat -c %a /workspace/private)" = 700\ntest "$(stat -c %a /workspace/private/answer)" = 600\ncmp /workspace/input.txt /workspace/private/answer`;
linuxTopics.at(-1).questions[1].check +=
  `\ntest "$(stat -c %a /workspace/team)" = 2770\ntest "$(stat -c %a /workspace/team/answer)" = 660\ncmp /workspace/input.txt /workspace/team/answer`;
pair(
  "hands-linux-foundations:1",
  "Hard links and symbolic links",
  [
    "Build one inode with two names",
    "Store the input bytes in /workspace/source.txt and create /workspace/alias.txt as a hard link to it. Rerunning after input changes must still leave both paths on the same inode with the latest bytes. Print linked.",
    `rm -f /workspace/alias.txt
cat "$1" > /workspace/source.txt
ln /workspace/source.txt /workspace/alias.txt
printf 'linked\n'`,
    [
      ["one\n", "linked"],
      ["two\n", "linked"],
    ],
  ],
  [
    "Make a relocatable symbolic link",
    "Store input in /workspace/releases/current.txt. Create /workspace/releases/latest as a relative symbolic link whose literal target is current.txt. Rerunning must safely replace an existing link. Print linked; do not follow a pre-existing latest link when writing the target.",
    `mkdir -p /workspace/releases
cat "$1" > /workspace/releases/current.txt
rm -f /workspace/releases/latest
ln -s current.txt /workspace/releases/latest
printf 'linked\n'`,
    [
      ["release1\n", "linked"],
      ["release2\n", "linked"],
    ],
  ],
);
linuxTopics.at(-1).questions[0].check +=
  `\ntest /workspace/source.txt -ef /workspace/alias.txt\ncmp /workspace/source.txt /workspace/input.txt`;
linuxTopics.at(-1).questions[1].check +=
  `\ntest "$(readlink /workspace/releases/latest)" = current.txt\ncmp /workspace/releases/latest /workspace/input.txt`;
pair(
  "hands-linux-admin-workshop:3",
  "Log rotation and compression",
  [
    "Rotate without losing current bytes",
    "Copy the input to /workspace/service.log, replace /workspace/service.log.1.gz with a gzip archive of those exact bytes, and leave service.log empty. Print rotated. Repeated runs must not append gzip members or leave stale archives.",
    `cat "$1" > /workspace/service.log
gzip -c /workspace/service.log > /workspace/service.log.1.gz
: > /workspace/service.log
printf 'rotated\n'`,
    [
      ["line1\nline2\n", "rotated"],
      ["new\n", "rotated"],
    ],
  ],
  [
    "Restore a compressed evidence file",
    "Compress the input into /workspace/evidence.gz, verify its integrity using gzip -t, then restore exact bytes to /workspace/restored.log. Print restored. Use replacement writes so reruns do not duplicate content.",
    `gzip -c "$1" > /workspace/evidence.gz
gzip -t /workspace/evidence.gz
gzip -dc /workspace/evidence.gz > /workspace/restored.log
printf 'restored\n'`,
    [
      ["evidence\n", "restored"],
      ["fresh\n", "restored"],
    ],
  ],
);
linuxTopics.at(-1).questions[0].check +=
  `\ntest ! -s /workspace/service.log\ngzip -dc /workspace/service.log.1.gz | cmp - /workspace/input.txt`;
linuxTopics.at(-1).questions[1].check +=
  `\ncmp /workspace/restored.log /workspace/input.txt`;
pair(
  "hands-linux-operations:3",
  "Backups, checksums and recovery",
  [
    "Create a verifiable evidence bundle",
    "Create /workspace/payload.txt from input; archive only payload.txt as /workspace/backup.tar.gz, and create backup.sha256 using a relative archive filename. Print archived. Both archive content and checksum must validate after reruns.",
    `cat "$1" > /workspace/payload.txt
tar -czf /workspace/backup.tar.gz -C /workspace payload.txt
(cd /workspace && sha256sum backup.tar.gz > backup.sha256)
printf 'archived\n'`,
    [
      ["snapshot\n", "archived"],
      ["second\n", "archived"],
    ],
  ],
  [
    "Prove a backup can be recovered",
    "Create /workspace/payload.txt from input, archive only it into backup.tar.gz, recreate /workspace/recovery and extract there. Write recovery.sha256 for recovery/payload.txt using a relative filename and print recovered. The restored bytes must match input.",
    `cat "$1" > /workspace/payload.txt
tar -czf /workspace/backup.tar.gz -C /workspace payload.txt
mkdir -p /workspace/recovery
tar -xzf /workspace/backup.tar.gz -C /workspace/recovery
(cd /workspace && sha256sum recovery/payload.txt > recovery.sha256)
printf 'recovered\n'`,
    [
      ["snapshot\n", "recovered"],
      ["changed\n", "recovered"],
    ],
  ],
);
linuxTopics.at(-1).questions[0].check +=
  `\n(cd /workspace && sha256sum -c backup.sha256)\ntest "$(tar -tzf /workspace/backup.tar.gz)" = payload.txt\ntar -xOzf /workspace/backup.tar.gz payload.txt | cmp - /workspace/input.txt`;
linuxTopics.at(-1).questions[1].check +=
  `\n(cd /workspace && sha256sum -c recovery.sha256)\ncmp /workspace/input.txt /workspace/recovery/payload.txt`;

pair(
  "hands-linux-admin-roadmap:0",
  "systemd units and service hardening",
  [
    "Generate a bounded restart policy",
    "Input is one nonempty service executable path (absolute, with letters/digits/slashes/dots/underscores/hyphens only). Print a unit with [Service], ExecStart=PATH, Restart=on-failure, RestartSec=5, NoNewPrivileges=yes and PrivateTmp=yes, in that order. Invalid/multiline input exits 2. This is a configuration exercise; do not run systemctl.",
    `path=$(cat "$1")
[[ $path =~ ^/[A-Za-z0-9/._-]+$ && $path != *$'\n'* ]] || exit 2
printf '[Service]\nExecStart=%s\nRestart=on-failure\nRestartSec=5\nNoNewPrivileges=yes\nPrivateTmp=yes\n' "$path"`,
    [
      [
        "/opt/workshop/server\n",
        "[Service]\nExecStart=/opt/workshop/server\nRestart=on-failure\nRestartSec=5\nNoNewPrivileges=yes\nPrivateTmp=yes",
      ],
      ["bad path\n", "", "/workspace/input.txt", 2],
    ],
  ],
  [
    "Audit the effective service policy",
    "Input is a single [Service] unit block with simple key=value lines and # comments. Last assignment wins. Print violated key names lexically for Restart!=on-failure, NoNewPrivileges!=yes or PrivateTmp!=yes; missing keys also violate. No findings is success with empty stdout.",
    `awk -F= '!/^#/&&NF==2{v[$1]=$2}END{if(v["NoNewPrivileges"]!="yes")print "NoNewPrivileges";if(v["PrivateTmp"]!="yes")print "PrivateTmp";if(v["Restart"]!="on-failure")print "Restart"}' "$1"`,
    [
      [
        "[Service]\nRestart=always\nNoNewPrivileges=yes\nPrivateTmp=no\n",
        "PrivateTmp\nRestart",
      ],
      [
        "Restart=always\nRestart=on-failure\nNoNewPrivileges=yes\nPrivateTmp=yes\n",
        "",
      ],
      ["", "NoNewPrivileges\nPrivateTmp\nRestart"],
    ],
  ],
);
pair(
  "hands-linux-admin-roadmap:1",
  "Users, groups and account audits",
  [
    "Detect unexpected superusers",
    "Input has passwd-format rows. Print sorted unique usernames with numeric UID 0 except root. Ignore malformed rows (not exactly seven fields, empty username or nonnumeric UID). Never inspect or change host account files.",
    `awk -F: 'NF==7&&$1!=""&&$3~/^[0-9]+$/&&$3==0&&$1!="root"{print $1}' "$1" | LC_ALL=C sort -u`,
    [
      [
        "root:x:0:0:root:/root:/bin/bash\nops:x:0:0:ops:/home/ops:/bin/bash\napp:x:1000:1000:a:/a:/bin/false\n",
        "ops",
      ],
      ["z:x:0:0:z:/z:/bin/sh\na:x:0:0:a:/a:/bin/sh\n", "a\nz"],
      ["", ""],
    ],
  ],
  [
    "Find interactive service accounts",
    "Input is an audit export with username:passwordHash:uid:shell (four fields). Print sorted unique usernames with numeric UID 1..999, an unlocked nonempty hash (not starting ! or *), and shell /bin/bash or /bin/sh. Root, human accounts and nologin shells are excluded.",
    `awk -F: 'NF==4&&$1!=""&&$2!=""&&$2!~/^[!*]/&&$3~/^[0-9]+$/&&$3>0&&$3<1000&&($4=="/bin/bash"||$4=="/bin/sh"){print $1}' "$1" | LC_ALL=C sort -u`,
    [
      [
        "daemon:hash:20:/bin/bash\nlocked:!hash:30:/bin/sh\nhuman:hash:1000:/bin/bash\n",
        "daemon",
      ],
      ["worker:hash:90:/bin/false\nsvc:hash:99:/bin/sh\n", "svc"],
      ["", ""],
    ],
  ],
);
pair(
  "hands-linux-admin-roadmap:9",
  "TCP/IP, subnets and routing",
  [
    "Choose the longest matching route",
    "Input rows are IPv4Network/prefix gateway with prefix 0..32; all addresses/rows are valid. The second argument is a valid IPv4 destination. Print gateway for the longest matching prefix; preserve first route on equal-prefix ties. Print unreachable and exit 3 when no route matches.",
    `awk -v dest="$2" 'function ip(s,a){split(s,a,".");return ((a[1]*256+a[2])*256+a[3])*256+a[4]} BEGIN{d=ip(dest);best=-1} {split($1,n,"/");p=n[2]+0;block=2^(32-p);if(int(d/block)==int(ip(n[1])/block)&&p>best){best=p;gateway=$2}} END{if(best<0){print "unreachable";exit 3}print gateway}' "$1"`,
    [
      [
        "0.0.0.0/0 default\n10.0.0.0/8 broad\n10.2.0.0/16 local\n",
        "local",
        "/workspace/input.txt 10.2.3.4",
      ],
      [
        "10.0.0.0/8 internal\n",
        "unreachable",
        "/workspace/input.txt 192.0.2.1",
        3,
      ],
      [
        "0.0.0.0/0 first\n0.0.0.0/0 second\n",
        "first",
        "/workspace/input.txt 8.8.8.8",
      ],
    ],
  ],
  [
    "Diagnose a connection from ordered evidence",
    "Input contains key=value evidence, last assignment wins. Print dns if dns!=ok, otherwise route if route!=ok, otherwise listener if connect!=ok, otherwise healthy. Missing values count as failures. This is evidence analysis, not a live network probe.",
    `awk -F= 'NF==2{v[$1]=$2}END{if(v["dns"]!="ok")print "dns";else if(v["route"]!="ok")print "route";else if(v["connect"]!="ok")print "listener";else print "healthy"}' "$1"`,
    [
      ["dns=ok\nroute=ok\nconnect=refused\n", "listener"],
      ["dns=timeout\nroute=missing\n", "dns"],
      ["dns=ok\nroute=ok\nconnect=ok\n", "healthy"],
    ],
  ],
);
pair(
  "hands-linux-admin-roadmap:3",
  "APT packages and version comparisons",
  [
    "Plan version-aware upgrades",
    "Input rows are package installed candidate, all valid Debian versions and whitespace-free names. Print package:candidate only when candidate is newer according to dpkg --compare-versions. Sort lexically; do not install packages or contact repositories.",
    `while read -r pkg installed candidate; do
 [[ -n $pkg ]] || continue
 if dpkg --compare-versions "$candidate" gt "$installed"; then printf '%s:%s\n' "$pkg" "$candidate"; fi
done < "$1" | LC_ALL=C sort`,
    [
      ["api 1.9 1.10\nworker 2.0 1.9\nfixed 3.0 3.0\n", "api:1.10"],
      ["x 1:1.0 2:0.1\ny 1.0-1 1.0-2\n", "x:2:0.1\ny:1.0-2"],
      ["", ""],
    ],
  ],
  [
    "Reject repositories without signed-by",
    "Input has simplified one-line deb entries: deb [options] URL suite component. Ignore # comments and blanks; print original deb lines lacking a nonempty signed-by= option inside brackets. This is a configuration audit; do not modify APT sources.",
    `awk '/^[[:space:]]*#/||/^[[:space:]]*$/{next} /^deb /{if($0!~/\\[[^]]*signed-by=[^] ]+[^]]*\\]/)print}' "$1"`,
    [
      [
        "deb [signed-by=/keys/a.gpg] https://repo/a stable main\ndeb https://repo/b stable main\n",
        "deb https://repo/b stable main",
      ],
      [
        "# comment\ndeb [arch=amd64] https://repo/c stable main\n",
        "deb [arch=amd64] https://repo/c stable main",
      ],
    ],
  ],
);
pair(
  "hands-linux-admin-roadmap:5",
  "Filesystems, inodes and boot storage diagnosis",
  [
    "Distinguish inode exhaustion from byte exhaustion",
    "Input contains bytes_pct=N and inodes_pct=N (integers 0..100), last values win. Missing/noninteger/out-of-range values exit 2 with no stdout. Print both if both >=95, inodes if only inodes >=95, bytes if only bytes >=95, otherwise healthy.",
    `awk -F= 'NF==2{v[$1]=$2}END{a=v["bytes_pct"];b=v["inodes_pct"];if(a!~/^[0-9]+$/||b!~/^[0-9]+$/||a>100||b>100)exit 2;if(a>=95&&b>=95)print "both";else if(b>=95)print "inodes";else if(a>=95)print "bytes";else print "healthy"}' "$1"`,
    [
      ["bytes_pct=30\ninodes_pct=99\n", "inodes"],
      ["bytes_pct=95\ninodes_pct=95\n", "both"],
      ["bytes_pct=3\n", "", "/workspace/input.txt", 2],
    ],
  ],
  [
    "Audit non-root fstab resilience",
    "Input is fstab-format text with six whitespace-separated fields; ignore comments/blanks and root mount /. For other rows, print mountpoints that lack nofail or have pass number other than 0 or 2. Sort mountpoints uniquely. Do not mount, partition or edit disks.",
    `awk '!/^#/&&NF==6&&$2!="/"{safe=0;n=split($4,opts,",");for(i=1;i<=n;i++)if(opts[i]=="nofail")safe=1;if(!safe||($6!="0"&&$6!="2"))print $2}' "$1" | LC_ALL=C sort -u`,
    [
      [
        "UUID=a / ext4 defaults 0 1\nUUID=b /data ext4 defaults 0 2\nUUID=c /backup ext4 defaults,nofail 0 2\n",
        "/data",
      ],
      ["UUID=x /logs ext4 defaults,nofail 0 1\n", "/logs"],
      ["", ""],
    ],
  ],
);
pair(
  "hands-linux-admin-roadmap:6",
  "SSH configuration and authentication policy",
  [
    "Audit first-value-wins SSH settings",
    "Input is a global sshd config without Match/Include blocks. Ignore comments/blanks; key matching is case-insensitive. First occurrence wins, as with sshd. Print PasswordAuthentication if its effective value is not no, then PermitRootLogin if not no. Missing keys violate policy.",
    `awk '!/^#/&&NF>=2{k=tolower($1);if(!(k in v))v[k]=tolower($2)}END{if(v["passwordauthentication"]!="no")print "PasswordAuthentication";if(v["permitrootlogin"]!="no")print "PermitRootLogin"}' "$1"`,
    [
      [
        "PasswordAuthentication yes\nPasswordAuthentication no\nPermitRootLogin no\n",
        "PasswordAuthentication",
      ],
      ["PermitRootLogin no\nPasswordAuthentication no\n", ""],
      ["", "PasswordAuthentication\nPermitRootLogin"],
    ],
  ],
  [
    "Generate an allowlisted SSH drop-in",
    "Input has one username per line. Accept only [a-z_][a-z0-9_-]*, ignore blanks, deduplicate and sort. Reject any invalid username with exit 2 and no stdout. Reject an empty resulting list. Print PasswordAuthentication no, PermitRootLogin no, then AllowUsers followed by space-separated sorted users.",
    `awk 'NF==0{next} !/^[a-z_][a-z0-9_-]*$/{bad=1;next}{users[$0]=1;n=1}END{if(bad||!n)exit 2;for(u in users)print u}' "$1" > /workspace/ssh-users.tmp || exit 2
printf 'PasswordAuthentication no\nPermitRootLogin no\nAllowUsers'
while IFS= read -r u; do printf ' %s' "$u"; done < <(LC_ALL=C sort /workspace/ssh-users.tmp)
printf '\n'`,
    [
      [
        "ops\nadmin\nops\n",
        "PasswordAuthentication no\nPermitRootLogin no\nAllowUsers admin ops",
      ],
      ["bad user\n", "", "/workspace/input.txt", 2],
      ["", "", "/workspace/input.txt", 2],
    ],
  ],
);
pair(
  "hands-linux-admin-roadmap:7",
  "Cron, scheduling and idempotent jobs",
  [
    "Generate a validated backup schedule",
    "Input is exactly one row minute hour, both nonnegative decimal integers. Validate minute 0..59 and hour 0..23; reject malformed/multiple rows with exit 2 and no stdout. Print normalized cron expression M H * * * /usr/local/bin/workshop-backup.",
    `awk 'NF{rows++;if(NF!=2||$1!~/^[0-9]+$/||$2!~/^[0-9]+$/||$1>59||$2>23)bad=1;m=$1+0;h=$2+0}END{if(bad||rows!=1)exit 2;print m " " h " * * * /usr/local/bin/workshop-backup"}' "$1"`,
    [
      ["05 02\n", "5 2 * * * /usr/local/bin/workshop-backup"],
      ["60 2\n", "", "/workspace/input.txt", 2],
      ["1 2\n3 4\n", "", "/workspace/input.txt", 2],
    ],
  ],
  [
    "Replace a report atomically on success",
    "Input is a nonempty text report. Reject empty input with exit 2 before changing /workspace/current-report.txt. For valid input, write a temporary file in /workspace, set mode 600 and rename it atomically to current-report.txt; print committed. Reruns replace rather than append.",
    `[[ -s $1 ]] || exit 2
tmp=$(mktemp /workspace/report.XXXXXX); trap 'rm -f "$tmp"' EXIT
cat "$1" > "$tmp"; chmod 600 "$tmp"; mv -f -- "$tmp" /workspace/current-report.txt
printf 'committed\n'`,
    [
      ["first\n", "committed"],
      ["second\n", "committed"],
      ["", "", "/workspace/input.txt", 2],
    ],
  ],
);
linuxTopics.at(-1).questions[1].check +=
  `\ntest "$(cat /workspace/current-report.txt)" = second\ntest "$(stat -c %a /workspace/current-report.txt)" = 600`;
pair(
  "hands-linux-admin-roadmap:8",
  "cgroups, memory and resource limits",
  [
    "Explain a container memory kill",
    "Input consists of oom_kill=N and exit_code=N. Print oom when oom_kill is a positive integer and exit_code=137, signal when exit_code=137 without positive oom evidence, otherwise other. Missing fields count as no evidence; do not infer OOM from exit 137 alone.",
    `awk -F= 'NF==2{v[$1]=$2}END{if(v["exit_code"]==137){if(v["oom_kill"]~/^[0-9]+$/&&v["oom_kill"]>0)print "oom";else print "signal"}else print "other"}' "$1"`,
    [
      ["oom_kill=1\nexit_code=137\n", "oom"],
      ["oom_kill=0\nexit_code=137\n", "signal"],
      ["exit_code=1\n", "other"],
    ],
  ],
  [
    "Audit a bounded container specification",
    "Input key=value values, last wins. Print violations lexically for memory missing/zero/unlimited, pids missing/zero/unlimited, network not none, readonly not true, and cap_drop not ALL. Valid memory/pids are positive decimal integers. This is a supplied-config audit; never invoke privileged Docker or change the host.",
    `awk -F= 'NF==2{v[$1]=$2}END{if(v["cap_drop"]!="ALL")print "cap_drop";if(v["memory"]!~/^[0-9]+$/||v["memory"]<=0)print "memory";if(v["network"]!="none")print "network";if(v["pids"]!~/^[0-9]+$/||v["pids"]<=0)print "pids";if(v["readonly"]!="true")print "readonly"}' "$1"`,
    [
      ["memory=256\npids=64\nnetwork=none\nreadonly=true\ncap_drop=ALL\n", ""],
      [
        "memory=0\npids=max\nnetwork=host\nreadonly=false\ncap_drop=ALL\n",
        "memory\nnetwork\npids\nreadonly",
      ],
      ["", "cap_drop\nmemory\nnetwork\npids\nreadonly"],
    ],
  ],
);

pair(
  "hands-linux-shell-roadmap:4",
  "Processes, PID files and signals",
  [
    "Stop only the verified worker",
    "Accept a PID-file path and expected argv[0] token. PID must be a positive integer >1; malformed inputs exit 2, missing processes exit 3, and a running process with a different first command-line argument exits 4. Only a matching process may receive TERM; print stopped on success. Never use killall or broad name matching.",
    `[[ $# = 2 && -n $2 && -f $1 ]] || exit 2
pid=$(cat "$1")
[[ $pid =~ ^[0-9]+$ && \${#pid} -le 8 ]] || exit 2
((10#$pid>1)) || exit 2
[[ -r /proc/$pid/cmdline ]] || exit 3
IFS= read -r -d '' first < /proc/$pid/cmdline || true
[[ $first = "$2" ]] || exit 4
kill -TERM "$pid" || exit 3
printf 'stopped\n'`.replaceAll("\\${", "${"),
    [["bad\n", "", "/workspace/input.txt worker", 2]],
  ],
  [
    "Find the largest resident workers deterministically",
    "Input rows: pid rss_kb command, with positive numeric PID and nonnegative numeric RSS; command is one whitespace-free token. Ignore malformed rows. Print pid,rss_kb for the top two rows by RSS descending, PID ascending on ties. This is a supplied ps snapshot, not host process inspection.",
    `awk 'NF==3&&$1~/^[0-9]+$/&&$1>0&&$2~/^[0-9]+$/{print $1 "," $2}' "$1" | sort -t, -k2,2nr -k1,1n | head -n 2`,
    [
      ["10 20 api\n2 20 worker\n7 30 db\nbad 90 no\n", "7,30\n2,20"],
      ["5 0 idle\n", "5,0"],
      ["", ""],
    ],
  ],
);
linuxTopics.at(-1).questions[0].check +=
  `\nset -e\nbash -c 'exec -a verified-worker sleep 45' & good=$!\nsleep 45 & other=$!\ntrap 'kill "$good" "$other" 2>/dev/null || true' EXIT\nprintf '%s' "$other" > /workspace/other.pid\nset +e\nbash /workspace/report.sh /workspace/other.pid verified-worker > /workspace/refused.out; status=$?\nset -e\ntest "$status" = 4\nkill -0 "$other"\nprintf '%s' "$good" > /workspace/good.pid\ntest "$(bash /workspace/report.sh /workspace/good.pid verified-worker)" = stopped\nwait "$good" || true\n! kill -0 "$good" 2>/dev/null\nkill "$other"\nwait "$other" || true\ntrap - EXIT`;
