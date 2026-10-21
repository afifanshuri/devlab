import { linux, make } from "./exercise-factories.js";
function exercise(
  title,
  topics,
  mission,
  goal,
  example,
  solution,
  check,
  files = {},
) {
  return {
    ...linux(title, topics.join(" · "), goal, solution, check, files),
    roadmapTopics: topics,
    mission,
    goal,
    example,
    hint: "Read the supplied files first. Write reproducible commands in notes.sh; all paths are inside /workspace.",
  };
}
export const linuxRoadmapCourses = [
  make(
    "linux-shell-roadmap",
    "linux",
    "Linux · Shell tools and automation",
    "Build reliable scripts using the command line, environment, streams and process controls.",
    ["Shell", "Streams", "Text tools", "Processes", "Troubleshooting"],
    [
      exercise(
        "Keep the environment in its lane",
        ["Environment variables", "PATH", "Shell scripts"],
        "A scheduled report works in your terminal but fails in automation. It depends on an environment value and on the working directory. Make a tiny report that behaves consistently from any directory.",
        "Create /workspace/report.sh with mode 700; run it using bash because the workspace mount blocks direct execution. When run from /tmp with REGION=apac it prints exactly region=apac; if REGION is unset or empty it prints region=unknown. Print one line and no other output.",
        "REGION=apac bash /workspace/report.sh → region=apac\nenv -u REGION bash /workspace/report.sh → region=unknown",
        'printf \'#!/bin/sh\nprintf "region=%%s\\n" "${REGION:-unknown}"\n\' > /workspace/report.sh\nchmod 700 /workspace/report.sh',
        'test "$(stat -c %a /workspace/report.sh)" = 700\ntest "$(cd /tmp && REGION=apac bash /workspace/report.sh)" = region=apac\ntest "$(env -u REGION bash /workspace/report.sh)" = region=unknown\ntest "$(REGION= bash /workspace/report.sh)" = region=unknown',
      ),
      exercise(
        "Split success from failure",
        ["Redirection", "File descriptors", "Exit status"],
        "An overnight job produces useful records and diagnostic warnings. Mixing them breaks the CSV importer, but suppressing warnings would hide an incident.",
        "Run bash /workspace/job.sh, save only stdout to /workspace/results.csv and only stderr to /workspace/warnings.log. Record its exit code in /workspace/status.txt, even when the job exits unsuccessfully. Do not edit job.sh.",
        "results.csv: id,total then 1,42\nwarnings.log: retry needed\nstatus.txt: 7",
        "bash /workspace/job.sh > /workspace/results.csv 2> /workspace/warnings.log\nprintf '%s\\n' \"$?\" > /workspace/status.txt",
        'test "$(cat /workspace/results.csv)" = "$(printf \'id,total\n1,42\')"\ntest "$(cat /workspace/warnings.log)" = \'retry needed\'\ntest "$(cat /workspace/status.txt)" = 7',
        {
          "job.sh":
            "printf 'id,total\\n1,42\\n'\nprintf 'retry needed\\n' >&2\nexit 7\n",
        },
      ),
      exercise(
        "Reconcile two inventories",
        ["sort", "uniq", "comm", "Pipelines"],
        "Two servers disagree about deployed packages. Before removing anything, operations wants a clean list of packages installed on the old server but absent from the new server.",
        "Read old.txt and new.txt; write unique package names found only in old.txt to /workspace/missing.txt in sorted order. Inputs may contain duplicate lines; do not modify them.",
        "missing.txt contains curl then nginx, one name per line.",
        "comm -23 <(sort -u /workspace/old.txt) <(sort -u /workspace/new.txt) > /workspace/missing.txt",
        'test "$(cat /workspace/missing.txt)" = "$(printf \'curl\nnginx\')"\ngrep -qx curl /workspace/old.txt',
        {
          "old.txt": "nginx\ncurl\nbash\ncurl\n",
          "new.txt": "bash\njava\nbash\n",
        },
      ),
      exercise(
        "Join incident details",
        ["cut", "join", "sort", "awk"],
        "An incident export contains service IDs while another file contains service names. The on-call engineer needs a readable error count without looking up each ID by hand.",
        "Join services.txt (id name) with counts.txt (id errors). Write /workspace/summary.txt as name errors, sorted alphabetically by name. Do not assume either input is sorted.",
        "summary.txt: inventory 2 then orders 5",
        "join <(sort -k1,1 /workspace/services.txt) <(sort -k1,1 /workspace/counts.txt) | awk '{print $2, $3}' | sort > /workspace/summary.txt",
        'test "$(cat /workspace/summary.txt)" = "$(printf \'inventory 2\norders 5\')"',
        {
          "services.txt": "2 inventory\n1 orders\n",
          "counts.txt": "1 5\n2 2\n",
        },
      ),
      exercise(
        "Stop a runaway worker safely",
        ["Processes", "Signals", "PID files"],
        "A support script should stop one background worker without using killall and risking unrelated work. It must also tolerate a worker that has already exited.",
        "Create /workspace/stop-worker.sh with mode 700 accepting a PID-file path; invoke it with bash because the workspace mount blocks direct execution. Send TERM to that PID if it is running and remove the PID file. A missing file or already-finished process must succeed. Do not signal any unrelated process.",
        "stop-worker.sh /workspace/worker.pid → targeted worker exits and worker.pid is removed; repeating succeeds.",
        'cat > /workspace/stop-worker.sh <<\'SCRIPT\'\n#!/bin/sh\n[ -f "$1" ] || exit 0\npid=$(cat "$1")\ncase "$pid" in \'\'|*[!0-9]*) exit 1;; esac\n[ "$pid" -gt 1 ] || exit 1\nkill -TERM "$pid" 2>/dev/null || true\nrm -f -- "$1"\nSCRIPT\nchmod 700 /workspace/stop-worker.sh',
        'test "$(stat -c %a /workspace/stop-worker.sh)" = 700\nsleep 90 & worker=$!\nsleep 90 & unrelated=$!\nprintf \'%s\n\' "$worker" > /workspace/worker.pid\nbash /workspace/stop-worker.sh /workspace/worker.pid\nsleep 0.2\n! kill -0 "$worker" 2>/dev/null\nkill -0 "$unrelated"\nkill "$unrelated"\ntest ! -e /workspace/worker.pid\nbash /workspace/stop-worker.sh /workspace/worker.pid\nprintf \'999999\n\' > /workspace/worker.pid\nbash /workspace/stop-worker.sh /workspace/worker.pid\ntest ! -e /workspace/worker.pid',
      ),
      exercise(
        "Build an incident snapshot",
        ["/proc", "Memory", "Disk usage", "ulimit", "Troubleshooting"],
        "The service is slow and an engineer needs evidence before restarting it. Capture live resource information, keeping separate files so the next engineer can inspect each source.",
        "Create /workspace/evidence with memory.txt from /proc/meminfo, disk.txt from df -P /workspace, limits.txt from ulimit -a, and load.txt from /proc/loadavg. Create snapshot.tar.gz containing those four files with relative names. Do not replace live data with sample numbers.",
        "tar -tzf snapshot.tar.gz lists memory.txt, disk.txt, limits.txt and load.txt; memory.txt includes MemTotal.",
        "mkdir -p /workspace/evidence\ncat /proc/meminfo > /workspace/evidence/memory.txt\ndf -P /workspace > /workspace/evidence/disk.txt\nulimit -a > /workspace/evidence/limits.txt\ncat /proc/loadavg > /workspace/evidence/load.txt\ntar -czf /workspace/snapshot.tar.gz -C /workspace/evidence memory.txt disk.txt limits.txt load.txt",
        "grep -q '^MemTotal:' /workspace/evidence/memory.txt\ngrep -q '^Filesystem' /workspace/evidence/disk.txt\ngrep -q 'open files' /workspace/evidence/limits.txt\nawk 'NF>=5 {ok=1} END{exit !ok}' /workspace/evidence/load.txt\nfor f in memory.txt disk.txt limits.txt load.txt; do tar -tzf /workspace/snapshot.tar.gz | grep -qx \"$f\"; done",
      ),
    ],
  ),
  make(
    "linux-admin-roadmap",
    "linux",
    "Linux · Administration and incident diagnosis",
    "Inspect realistic fixtures and write safe configurations. Privileged changes are reviewed as files, not applied to your host.",
    ["systemd", "Users", "Networking", "Packages", "Storage", "Boot"],
    [
      exercise(
        "Prepare a service for deployment",
        ["systemd", "Service units"],
        "The report worker runs manually but disappears after a crash. Prepare its service definition for an administrator to deploy, using a dedicated account rather than root. This container does not run systemd.",
        "Write /workspace/report-worker.service with [Unit], [Service], [Install]; Description=Report worker; After=network.target; User=reporter; WorkingDirectory=/opt/reporter; ExecStart=/usr/bin/java -jar /opt/reporter/app.jar; Restart=on-failure; NoNewPrivileges=true; WantedBy=multi-user.target. Do not run systemctl or change the host.",
        "The service runs as reporter, restarts after failures, and is installable under multi-user.target.",
        "cat > /workspace/report-worker.service <<'UNIT'\n[Unit]\nDescription=Report worker\nAfter=network.target\n[Service]\nUser=reporter\nWorkingDirectory=/opt/reporter\nExecStart=/usr/bin/java -jar /opt/reporter/app.jar\nRestart=on-failure\nNoNewPrivileges=true\n[Install]\nWantedBy=multi-user.target\nUNIT",
        "for line in '[Unit]' '[Service]' '[Install]' 'Description=Report worker' 'After=network.target' 'User=reporter' 'WorkingDirectory=/opt/reporter' 'ExecStart=/usr/bin/java -jar /opt/reporter/app.jar' 'Restart=on-failure' 'NoNewPrivileges=true' 'WantedBy=multi-user.target'; do grep -Fxq \"$line\" /workspace/report-worker.service; done",
      ),
      exercise(
        "Audit privileged accounts",
        ["Users and groups", "/etc/passwd", "Account security"],
        "A migrated server has an unexpected second administrator. Audit the supplied account snapshot before anybody changes access; a service account with a disabled shell is not automatically dangerous.",
        "Read passwd.snapshot and write names of all UID-0 accounts except root to /workspace/unexpected-admins.txt, sorted one per line. Use the UID field, not the username or shell, to decide.",
        "unexpected-admins.txt contains backup; reporter is excluded despite its login shell.",
        "awk -F: '$3==0 && $1!=\"root\" {print $1}' /workspace/passwd.snapshot | sort > /workspace/unexpected-admins.txt",
        'test "$(cat /workspace/unexpected-admins.txt)" = backup',
        {
          "passwd.snapshot":
            "root:x:0:0:root:/root:/bin/bash\nbackup:x:0:0:Backup:/srv/backup:/usr/sbin/nologin\nreporter:x:1002:1002:Reporter:/srv/reporter:/bin/bash\n",
        },
      ),
      exercise(
        "Diagnose the DNS incident",
        ["DNS", "Routes", "Network troubleshooting"],
        "The application can reach an external IP address but cannot resolve hostnames. The supplied incident bundle includes route, resolver and connectivity evidence. Recommend a focused repair instead of rebooting everything.",
        "Write /workspace/diagnosis.txt with three key=value lines: cause=resolver-unreachable, evidence=nameserver-192.0.2.53-timeout, action=configure-reachable-dns. Base the decision on the snapshots; do not modify real networking.",
        "The report identifies DNS resolution, while noting that the default route and IP connectivity already work.",
        "printf '%s\\n' 'cause=resolver-unreachable' 'evidence=nameserver-192.0.2.53-timeout' 'action=configure-reachable-dns' > /workspace/diagnosis.txt",
        "test \"$(sort /workspace/diagnosis.txt)\" = \"$(printf '%s\n' 'cause=resolver-unreachable' 'evidence=nameserver-192.0.2.53-timeout' 'action=configure-reachable-dns' | sort)\"",
        {
          "route.txt": "default via 10.0.0.1 dev eth0\n",
          "resolver.txt": "nameserver 192.0.2.53\n",
          "probe.txt":
            "ping 1.1.1.1: reachable\ndig @192.0.2.53 example.org: connection timed out\n",
        },
      ),
      exercise(
        "Plan a package repair",
        ["Package management", "Repositories", "APT"],
        "An Ubuntu worker is missing curl and still has an obsolete FTP client. Plan a reproducible package change for the administrator; this offline lab must not contact repositories.",
        "Write /workspace/package-plan.sh containing an apt-get update, a noninteractive install of curl with --no-install-recommends, removal of telnet, and apt cache cleanup with apt-get clean. It must pass bash -n. Do not execute the plan in this container.",
        "A reviewable script refreshes metadata, installs curl, removes telnet and clears cached package files.",
        "cat > /workspace/package-plan.sh <<'PLAN'\n#!/bin/sh\nset -eu\nexport DEBIAN_FRONTEND=noninteractive\napt-get update\napt-get install -y --no-install-recommends curl\napt-get remove -y telnet\napt-get clean\nPLAN",
        "bash -n /workspace/package-plan.sh\ngrep -q '^export DEBIAN_FRONTEND=noninteractive$' /workspace/package-plan.sh\ngrep -q '^apt-get update$' /workspace/package-plan.sh\ngrep -q '^apt-get install -y --no-install-recommends curl$' /workspace/package-plan.sh\ngrep -q '^apt-get remove -y telnet$' /workspace/package-plan.sh\ngrep -q '^apt-get clean$' /workspace/package-plan.sh",
      ),
      exercise(
        "Make a failed data disk nonfatal",
        ["Filesystems", "fstab", "Mount options", "Boot troubleshooting"],
        "A server stops booting when its optional archive disk is absent. Preserve its root filesystem settings and prepare a safer mount entry for the archive disk. This is a configuration exercise, not a live disk operation.",
        "Copy fstab.snapshot to /workspace/fstab.fixed, changing only the /archive entry options to defaults,nofail,nodev,nosuid. Keep its UUID, ext4 type and final 0 2 fields; preserve the root line exactly. Do not mount disks or edit /etc/fstab.",
        "Archive entry: UUID=archive-001 /archive ext4 defaults,nofail,nodev,nosuid 0 2",
        "sed 's|UUID=archive-001 /archive ext4 defaults 0 2|UUID=archive-001 /archive ext4 defaults,nofail,nodev,nosuid 0 2|' /workspace/fstab.snapshot > /workspace/fstab.fixed",
        "grep -Fxq 'UUID=root-001 / ext4 defaults 0 1' /workspace/fstab.fixed\ngrep -Fxq 'UUID=archive-001 /archive ext4 defaults,nofail,nodev,nosuid 0 2' /workspace/fstab.fixed\ntest \"$(wc -l < /workspace/fstab.fixed)\" -eq 2",
        {
          "fstab.snapshot":
            "UUID=root-001 / ext4 defaults 0 1\nUUID=archive-001 /archive ext4 defaults 0 2\n",
        },
      ),
      exercise(
        "Find why writes fail on a nearly empty disk",
        ["Inodes", "df", "Disk troubleshooting", "Log analysis"],
        "A service reports No space left on device even though df shows plenty of free bytes. Read both storage snapshots before suggesting a larger disk.",
        "Read df-bytes.txt and df-inodes.txt; write /workspace/storage-report.txt with cause=inodes-exhausted, mount=/var and action=remove-expired-small-files. Leave both evidence files unchanged. This diagnosis uses fixture output because Docker exposes the host VM's filesystem.",
        "The /var filesystem has free bytes but 100% inode use, so the report targets expired small files.",
        "printf '%s\\n' 'cause=inodes-exhausted' 'mount=/var' 'action=remove-expired-small-files' > /workspace/storage-report.txt",
        "test \"$(sort /workspace/storage-report.txt)\" = \"$(printf '%s\n' 'cause=inodes-exhausted' 'mount=/var' 'action=remove-expired-small-files' | sort)\"",
        {
          "df-bytes.txt":
            "Filesystem 1K-blocks Used Available Use% Mounted\n/dev/vda2 10000000 2000000 8000000 20% /var\n",
          "df-inodes.txt":
            "Filesystem Inodes IUsed IFree IUse% Mounted\n/dev/vda2 1000000 1000000 0 100% /var\n",
        },
      ),
    ],
  ),
];
linuxRoadmapCourses[1].lessons.push(
  exercise(
    "Prepare a safer SSH policy",
    ["SSH", "Authentication", "Remote administration"],
    "A new server should accept key-based logins for its deploy account while rejecting direct root and password logins. Prepare a small policy fragment for review; it will not change your machine's SSH service.",
    "Write /workspace/sshd-hardening.conf with PermitRootLogin no, PasswordAuthentication no, PubkeyAuthentication yes and AllowUsers deploy. Include each directive once and no Match blocks. Do not edit /etc/ssh or restart services.",
    "Only deploy may log in; root and password-based authentication are disabled in the proposed policy.",
    "printf '%s\\n' 'PermitRootLogin no' 'PasswordAuthentication no' 'PubkeyAuthentication yes' 'AllowUsers deploy' > /workspace/sshd-hardening.conf",
    "for line in 'PermitRootLogin no' 'PasswordAuthentication no' 'PubkeyAuthentication yes' 'AllowUsers deploy'; do grep -Fxq \"$line\" /workspace/sshd-hardening.conf; done\ntest \"$(grep -c . /workspace/sshd-hardening.conf)\" -eq 4",
  ),
  exercise(
    "Schedule a quiet nightly backup",
    ["Cron", "Scheduling", "Shell scripts"],
    "The backup command succeeds manually but its scheduled run loses its output. Prepare a system crontab entry with an explicit user and absolute paths so another administrator can review it.",
    "Write /workspace/backup.cron with one system-crontab entry: at 02:30 daily run /opt/backup/run.sh as user backup, append stdout and stderr to /var/log/backup.log. Use minute hour day month weekday user command format; do not install it.",
    "30 2 * * * backup /opt/backup/run.sh >> /var/log/backup.log 2>&1",
    "printf '%s\\n' '30 2 * * * backup /opt/backup/run.sh >> /var/log/backup.log 2>&1' > /workspace/backup.cron",
    "test \"$(cat /workspace/backup.cron)\" = '30 2 * * * backup /opt/backup/run.sh >> /var/log/backup.log 2>&1'",
  ),
  exercise(
    "Recognize a container memory kill",
    ["cgroups", "Containerization", "Memory troubleshooting"],
    "A Java worker disappears without a normal application exception. Its container memory-event snapshot gives a better clue than the machine-wide free-memory report.",
    "Read memory.max, memory.events and worker.log. Write /workspace/oom-report.txt with limit_mib=256, cause=cgroup-oom-kill and action=investigate-heap-and-container-limit. Use the recorded oom_kill counter and 268435456-byte limit; do not change real cgroup limits.",
    "The snapshot records one cgroup OOM kill even though the host may still have free RAM.",
    "printf '%s\\n' 'limit_mib=256' 'cause=cgroup-oom-kill' 'action=investigate-heap-and-container-limit' > /workspace/oom-report.txt",
    "test \"$(sort /workspace/oom-report.txt)\" = \"$(printf '%s\n' 'limit_mib=256' 'cause=cgroup-oom-kill' 'action=investigate-heap-and-container-limit' | sort)\"",
    {
      "memory.max": "268435456\n",
      "memory.events": "low 0\nhigh 0\nmax 32\noom 1\noom_kill 1\n",
      "worker.log": "worker exited with code 137\n",
    },
  ),
  exercise(
    "Choose the right subnet route",
    ["TCP/IP", "Subnets", "Routing"],
    "Two private interfaces look similar, but a database address belongs to only one subnet. Use the supplied route snapshot to identify the interface instead of changing the default route.",
    "Given destination 10.20.8.42 and routes.txt, write /workspace/route-report.txt with destination=10.20.8.42, network=10.20.8.0/24 and interface=eth1. Select the longest matching prefix; do not apply route commands.",
    "10.20.8.42 matches both 10.20.0.0/16 and 10.20.8.0/24; /24 is more specific and uses eth1.",
    "printf '%s\\n' 'destination=10.20.8.42' 'network=10.20.8.0/24' 'interface=eth1' > /workspace/route-report.txt",
    "test \"$(sort /workspace/route-report.txt)\" = \"$(printf '%s\n' 'destination=10.20.8.42' 'network=10.20.8.0/24' 'interface=eth1' | sort)\"",
    {
      "routes.txt":
        "default via 10.0.0.1 dev eth0\n10.20.0.0/16 dev eth0\n10.20.8.0/24 dev eth1\n",
    },
  ),
  exercise(
    "Trace an emergency-mode boot",
    ["Boot process", "Boot logs", "LVM", "Storage troubleshooting"],
    "After storage maintenance, a server drops into emergency mode. The boot log and volume snapshot show that the data volume is present; the configured filesystem UUID points elsewhere. Diagnose the mismatch without formatting anything.",
    "Read boot.log, volumes.txt and fstab.snapshot. Write /workspace/boot-report.txt with cause=stale-filesystem-uuid, configured_uuid=old-data, actual_uuid=new-data and action=correct-fstab-uuid-after-verification. This is diagnosis only: never run mkfs, pvcreate or bootloader commands.",
    "The LVM volume vg0-data exists with UUID new-data, while fstab waits for old-data.",
    "printf '%s\\n' 'cause=stale-filesystem-uuid' 'configured_uuid=old-data' 'actual_uuid=new-data' 'action=correct-fstab-uuid-after-verification' > /workspace/boot-report.txt",
    "test \"$(sort /workspace/boot-report.txt)\" = \"$(printf '%s\n' 'cause=stale-filesystem-uuid' 'configured_uuid=old-data' 'actual_uuid=new-data' 'action=correct-fstab-uuid-after-verification' | sort)\"",
    {
      "boot.log":
        "Timed out waiting for device /dev/disk/by-uuid/old-data\nDependency failed for /data\nEntering emergency mode\n",
      "volumes.txt": "/dev/mapper/vg0-data ext4 UUID=new-data ACTIVE\n",
      "fstab.snapshot": "UUID=old-data /data ext4 defaults 0 2\n",
    },
  ),
  exercise(
    "Specify an isolated container runtime",
    ["Docker", "Namespaces", "Resource limits"],
    "A teammate proposes running a helper with --privileged and mounting the whole host. Prepare a narrower command for an offline text-processing job that only needs a temporary workspace.",
    "Write /workspace/container-plan.sh containing docker run --rm with image eclipse-temurin:21-jdk-jammy and command java -version. Include --network none, --read-only, --cap-drop ALL, --security-opt no-new-privileges, --memory 256m, --cpus 1 and --pids-limit 64. Do not use host mounts, --privileged or expose ports; do not run Docker inside the lab.",
    "A reviewable command has no network or host directories and limits the helper's memory, CPU and process count.",
    "printf '%s\\n' 'docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges --memory 256m --cpus 1 --pids-limit 64 eclipse-temurin:21-jdk-jammy java -version' > /workspace/container-plan.sh",
    "bash -n /workspace/container-plan.sh\nfor flag in '--rm' '--network none' '--read-only' '--cap-drop ALL' '--security-opt no-new-privileges' '--memory 256m' '--cpus 1' '--pids-limit 64' 'eclipse-temurin:21-jdk-jammy java -version'; do grep -Fq -- \"$flag\" /workspace/container-plan.sh; done\n! grep -Eq -- '--privileged|--mount|--volume|(^| )-v |--publish|(^| )-p ' /workspace/container-plan.sh",
  ),
);
