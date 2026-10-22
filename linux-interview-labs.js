import { linux } from "./exercise-factories.js";

const lab = (goal, solution, checks, files = {}, setup) => ({
  ...linux(
    "",
    "Practical Linux interview task",
    goal,
    solution,
    checks.join("\n"),
    files,
  ),
  goal,
  requirements: [goal],
  example:
    "Check answer verifies the resulting files and additional script cases, where applicable.",
  setup,
});
const script = (name, body) =>
  `cat > ${name} <<'SCRIPT'\n#!/usr/bin/env bash\n${body}\nSCRIPT`;

// Configuration exercises edit fixtures inside the workspace, never the host.
export const interviewLabs = {
  "0:0": lab(
    "Inside /workspace/host (a simulated host tree), copy app.conf to etc/shop/app.conf and app.log to var/log/shop/app.log. Create run/shop and tmp/shop as empty runtime/temporary directories. Preserve the source files. Create backup.txt containing exactly etc/shop/app.conf on one line. Do not modify the real /etc, /var or /run.",
    "mkdir -p host/{etc/shop,var/log/shop,run/shop,tmp/shop}\ncp app.conf host/etc/shop/app.conf\ncp app.log host/var/log/shop/app.log\nprintf '%s\\n' etc/shop/app.conf > backup.txt",
    [
      "cmp app.conf host/etc/shop/app.conf",
      "cmp app.log host/var/log/shop/app.log",
      "test -d host/run/shop && test -d host/tmp/shop",
      'test -z "$(ls -A host/run/shop)" && test -z "$(ls -A host/tmp/shop)"',
      'test "$(cat backup.txt)" = etc/shop/app.conf',
      'test "$(cat app.conf)" = port=8080',
      'test "$(cat app.log)" = started',
    ],
    { "app.conf": "port=8080\n", "app.log": "started\n" },
  ),
  "2:0": lab(
    "Create capture.sh accepting one log path. Run bash emitter.sh so stdout and stderr both go to that log, replacing its previous contents. Preserve the emitter's exit status and print nothing to the caller. Checks replace emitter.sh with different messages and a failing exit code; do not modify the emitter yourself.",
    script("capture.sh", 'bash emitter.sh >"$1" 2>&1'),
    [
      "test -f capture.sh",
      "for status in 0 7; do",
      'printf \'printf "out-%s\\n"; printf "err-%s\\n" >&2; exit %s\n\' "$status" "$status" "$status" > emitter.sh',
      "printf stale > 'combined log.txt'",
      "set +e",
      "output=$(bash capture.sh 'combined log.txt' 2>&1); actual=$?",
      "set -e",
      'test "$actual" = "$status" && test -z "$output"',
      'printf \'out-%s\nerr-%s\n\' "$status" "$status" > expected.txt',
      "cmp expected.txt 'combined log.txt'",
      "done",
    ],
    { "emitter.sh": "printf 'started\\n'\nprintf 'warning\\n' >&2\n" },
  ),
  "3:0": lab(
    "The fixture private/reports/daily.txt is blocked by missing directory traversal permission. Set private and private/reports to mode 700 and daily.txt to 600. Preserve its contents, grant no group/other access and copy it to verified.txt to demonstrate you can read it. Change only these paths.",
    "chmod 700 private private/reports\nchmod 600 private/reports/daily.txt\ncat private/reports/daily.txt > verified.txt",
    [
      'test "$(stat -c %a private)" = 700',
      'test "$(stat -c %a private/reports)" = 700',
      'test "$(stat -c %a private/reports/daily.txt)" = 600',
      'test "$(cat verified.txt)" = revenue=42',
      "cmp verified.txt private/reports/daily.txt",
    ],
    {},
    "mkdir -p private/reports\nprintf 'revenue=42\\n' > private/reports/daily.txt\nchmod 600 private/reports/daily.txt\nchmod 600 private/reports",
  ),
  "4:0": lab(
    "Create current as a relative symbolic link to releases/v2, containing the supplied version.txt. Create receipt-copy.txt as a hard link to receipt.txt. Preserve both original files. The release link must still resolve if the whole workspace tree is moved.",
    "ln -s releases/v2 current\nln receipt.txt receipt-copy.txt",
    [
      "test -L current",
      'test "$(readlink current)" = releases/v2',
      'test "$(cat current/version.txt)" = version=2',
      "test ! -L receipt-copy.txt",
      'test "$(stat -c %i receipt.txt)" = "$(stat -c %i receipt-copy.txt)"',
      'test "$(cat receipt.txt)" = paid',
    ],
    { "receipt.txt": "paid\n" },
    "mkdir -p releases/v2\nprintf 'version=2\\n' > releases/v2/version.txt",
  ),
  "9:1": lab(
    "Repair shop.service inside the workspace, not the running OS. Keep ExecStart=/usr/bin/java -jar /opt/shop/app.jar. In [Service], set User=shop, Group=shop, WorkingDirectory=/opt/shop, Environment=APP_CONFIG=/etc/shop/app.conf and Restart=on-failure. Include exactly these six service directives and preserve [Install] with WantedBy=multi-user.target. Runtime startup is outside this configuration lab.",
    "cat > shop.service <<'UNIT'\n[Unit]\nDescription=Shop\n[Service]\nUser=shop\nGroup=shop\nWorkingDirectory=/opt/shop\nEnvironment=APP_CONFIG=/etc/shop/app.conf\nExecStart=/usr/bin/java -jar /opt/shop/app.jar\nRestart=on-failure\n[Install]\nWantedBy=multi-user.target\nUNIT",
    [
      'awk \'BEGIN {s=""} /^\\[/ {s=$0} s=="[Service]" && /^[A-Za-z]+=/ {print}\' shop.service > actual-service.txt',
      'for entry in User=shop Group=shop WorkingDirectory=/opt/shop Environment=APP_CONFIG=/etc/shop/app.conf Restart=on-failure; do test "$(grep -Fxc "$entry" actual-service.txt)" = 1; done',
      "test \"$(grep -Fxc 'ExecStart=/usr/bin/java -jar /opt/shop/app.jar' actual-service.txt)\" = 1",
      "grep -qx '\\[Install\\]' shop.service && grep -qx 'WantedBy=multi-user.target' shop.service",
      'test "$(wc -l < actual-service.txt)" = 6',
    ],
    {
      "shop.service":
        "[Unit]\nDescription=Shop\n[Service]\nUser=root\nExecStart=/usr/bin/java -jar /opt/shop/app.jar\n[Install]\nWantedBy=multi-user.target\n",
    },
  ),
  "10:0": lab(
    "Replace support.sudoers with exactly one non-comment rule: %support ALL=(root) /usr/bin/systemctl restart shop.service. Set its mode to 440. Do not install it in /etc. This fixture checks scope only; real deployment also requires visudo validation and confirming support cannot modify the unit or executable.",
    "printf '%s\\n' '%support ALL=(root) /usr/bin/systemctl restart shop.service' > support.sudoers\nchmod 440 support.sudoers",
    [
      'test "$(stat -c %a support.sudoers)" = 440',
      "test \"$(sed '/^[[:space:]]*#/d;/^[[:space:]]*$/d' support.sudoers)\" = '%support ALL=(root) /usr/bin/systemctl restart shop.service'",
    ],
    { "support.sudoers": "%support ALL=(ALL) NOPASSWD: ALL\n" },
  ),
  "11:0": lab(
    "Create copy-one.sh accepting exactly two path arguments. Copy the single source file to the destination, safely handling spaces, wildcard characters and leading hyphens. Invalid argument counts must exit 2; a missing source must fail. Do not change the source or expand its name as a pattern.",
    script("copy-one.sh", '[ "$#" -eq 2 ] || exit 2\ncp -- "$1" "$2"'),
    [
      "test -f copy-one.sh",
      "for name in 'a b.txt' '*literal*.txt' '-source'; do",
      "printf 'original\\n' > \"$name\"",
      "bash copy-one.sh \"$name\" '-destination'",
      "cmp -- \"$name\" '-destination'",
      'test "$(cat -- "$name")" = original',
      "done",
      "set +e",
      "bash copy-one.sh >/dev/null 2>&1; status=$?",
      "set -e",
      'test "$status" = 2',
      "if bash copy-one.sh missing-input output.txt >/dev/null 2>&1; then exit 1; fi",
    ],
  ),
  "11:1": lab(
    "Create env.sh, intended to be sourced, which exports APP_ENV=training and changes to LAB_HOME. If LAB_HOME is unset, blank or not an existing directory, return 2 without changing APP_ENV or the caller's directory. Do not exit the caller shell. Checks verify paths with spaces, invalid paths and sourced versus child-process behavior.",
    script(
      "env.sh",
      'if [ -z "${LAB_HOME:-}" ] || [ ! -d "$LAB_HOME" ]; then return 2 2>/dev/null || exit 2; fi\ncd -- "$LAB_HOME" || return 2\nexport APP_ENV=training',
    ),
    [
      "test -f env.sh",
      "mkdir -p 'team home'",
      'bash -c \'set -e; export LAB_HOME="$PWD/team home"; before=$PWD; APP_ENV=old; bash env.sh; test "$PWD" = "$before"; test "$APP_ENV" = old; source env.sh; test "$PWD" = "$LAB_HOME"; test "$APP_ENV" = training; printenv APP_ENV | grep -qx training\'',
      'bash -c \'APP_ENV=old; unset LAB_HOME; before=$PWD; source env.sh; status=$?; test "$status" = 2 && test "$APP_ENV" = old && test "$PWD" = "$before"\'',
      'bash -c \'APP_ENV=old; LAB_HOME=/does-not-exist; before=$PWD; source env.sh; status=$?; test "$status" = 2 && test "$APP_ENV" = old && test "$PWD" = "$before"\'',
    ],
  ),
  "12:0": lab(
    "Create backup.sh taking SOURCE and DESTINATION. Run bash export.sh SOURCE through gzip and publish DESTINATION only if both stages succeed. Export failure must return nonzero and preserve the previous destination. Use a temporary file beside the destination and clean it on success/failure. Support paths with spaces. Checks replace export.sh with a partial export that fails.",
    script(
      "backup.sh",
      'set -euo pipefail\n[ "$#" -eq 2 ] || exit 2\ntmp=$(mktemp -- "$2.tmp.XXXXXX")\ntrap \'rm -f -- "$tmp"\' EXIT\nbash export.sh "$1" | gzip > "$tmp"\nmv -- "$tmp" "$2"',
    ),
    [
      "test -f backup.sh",
      "printf 'cat -- \"$1\"\n' > export.sh",
      "printf 'fresh data\\n' > 'source file'",
      "bash backup.sh 'source file' 'backup file.gz'",
      "gzip -dc 'backup file.gz' > restored.txt",
      "cmp 'source file' restored.txt",
      "before=$(sha256sum 'backup file.gz')",
      "printf 'printf partial; exit 7\n' > export.sh",
      "if bash backup.sh 'source file' 'backup file.gz'; then exit 1; fi",
      'test "$(sha256sum \'backup file.gz\')" = "$before"',
      "test -z \"$(find . -name 'backup file.gz.tmp.*' -print)\"",
    ],
    { "export.sh": 'cat -- "$1"\n' },
  ),
  "12:1": lab(
    "Create report.sh taking INPUT, OUTPUT and LOCK. Hold an exclusive nonblocking flock on LOCK until completion; if busy, exit 75 without changing OUTPUT. Copy INPUT through a temporary file beside OUTPUT, rename only on success and clean temporary files. Reject wrong argument counts with exit 2. Support spaces. Missing input must preserve an earlier report.",
    script(
      "report.sh",
      'set -euo pipefail\n[ "$#" -eq 3 ] || exit 2\nexec 9>"$3"\nflock -n 9 || exit 75\ntmp=$(mktemp -- "$2.tmp.XXXXXX")\ntrap \'rm -f -- "$tmp"\' EXIT\ncat -- "$1" > "$tmp"\nmv -- "$tmp" "$2"',
    ),
    [
      "test -f report.sh",
      "printf new > 'job input'; printf old > 'job output'",
      "exec 8>'job lock'; flock -n 8",
      "set +e",
      "bash report.sh 'job input' 'job output' 'job lock'; status=$?",
      "set -e",
      'test "$status" = 75 && test "$(cat \'job output\')" = old',
      "flock -u 8; exec 8>&-",
      "bash report.sh 'job input' 'job output' 'job lock'",
      "cmp 'job input' 'job output'",
      "if bash report.sh missing 'job output' 'job lock'; then exit 1; fi",
      "test \"$(cat 'job output')\" = new",
      "test -z \"$(find . -name 'job output.tmp.*' -print)\"",
    ],
  ),
  "13:0": lab(
    "Repair only the supplied fstab fixture. Leave the root entry unchanged. For UUID=archive at /archive, retain ext4, defaults and pass number 2 but add nofail because the business confirmed it is optional. Keep one entry per mount. This checks configuration only: do not mount, format or modify host devices.",
    "cat > fstab <<'FSTAB'\nUUID=root / ext4 defaults 0 1\nUUID=archive /archive ext4 defaults,nofail 0 2\nFSTAB",
    [
      "test \"$(grep -Fxc 'UUID=root / ext4 defaults 0 1' fstab)\" = 1",
      'awk \'$1=="UUID=archive" && $2=="/archive" && $3=="ext4" && $5==0 && $6==2 {n++; k=split($4,a,","); for(i=1;i<=k;i++){if(a[i]=="nofail")f++;if(a[i]=="defaults")d++}} END {exit !(n==1 && f==1 && d==1)}\' fstab',
      "test \"$(grep -vc '^#\\|^[[:space:]]*$' fstab)\" = 2",
    ],
    {
      fstab:
        "UUID=root / ext4 defaults 0 1\nUUID=archive /archive ext4 defaults 0 2\n",
    },
  ),
  "14:1": lab(
    "Replace sshd-policy.conf with exactly five global settings: PubkeyAuthentication yes, PasswordAuthentication no, KbdInteractiveAuthentication no, PermitRootLogin no and AllowUsers afif. No Match/Include blocks or other directives. This isolated fixture does not change SSH; real deployment requires verified key access, config validation and a rollback session.",
    "cat > sshd-policy.conf <<'SSH'\nPubkeyAuthentication yes\nPasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin no\nAllowUsers afif\nSSH",
    [
      "sed '/^[[:space:]]*#/d;/^[[:space:]]*$/d' sshd-policy.conf | awk '{$1=$1;print}' | LC_ALL=C sort > actual-policy",
      "printf '%s\\n' 'PubkeyAuthentication yes' 'PasswordAuthentication no' 'KbdInteractiveAuthentication no' 'PermitRootLogin no' 'AllowUsers afif' | LC_ALL=C sort > expected-policy",
      "cmp actual-policy expected-policy",
    ],
    { "sshd-policy.conf": "PasswordAuthentication yes\nPermitRootLogin yes\n" },
  ),
  "15:1": lab(
    "Repair the user-crontab fixture backup.cron. Set SHELL=/bin/bash and PATH=/usr/bin:/bin. Schedule exactly one job at 02:15 daily: /bin/bash /opt/shop/backup.sh >>/var/log/shop/backup.log 2>&1. Preserve no other jobs. A user crontab has no username field. This checks schedule/environment, not a live cron daemon.",
    "cat > backup.cron <<'CRON'\nSHELL=/bin/bash\nPATH=/usr/bin:/bin\n15 2 * * * /bin/bash /opt/shop/backup.sh >>/var/log/shop/backup.log 2>&1\nCRON",
    [
      "test \"$(grep -Fxc 'SHELL=/bin/bash' backup.cron)\" = 1",
      "test \"$(grep -Fxc 'PATH=/usr/bin:/bin' backup.cron)\" = 1",
      "test \"$(grep -Fxc '15 2 * * * /bin/bash /opt/shop/backup.sh >>/var/log/shop/backup.log 2>&1' backup.cron)\" = 1",
      "test \"$(grep -vc '^#\\|^[[:space:]]*$' backup.cron)\" = 3",
    ],
    { "backup.cron": "15 2 * * * backup.sh\n" },
  ),
};
