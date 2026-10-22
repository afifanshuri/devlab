import { make } from "./exercise-factories.js";
import { interviewLabs } from "./linux-interview-labs.js";

// Written practice is deliberately separate from executable labs. Review is
// performed by the learner against a rubric, never by keyword-based grading.
const topics = [
  [
    "Filesystem structure",
    [
      [
        "Put service files in the right place",
        "Your team stores configuration, logs, a PID file and temporary exports together under /home/admin. A reboot removes some files and nobody knows which files to back up.",
        "Propose suitable locations for system-wide configuration, persistent logs, runtime PID/socket files and disposable temporary files. Explain the lifecycle of each and what should be backed up.",
        [
          "Use /etc for configuration and /var/log for persistent logs; retain logs according to policy.",
          "Use /run for runtime state that must be recreated after boot; /tmp is temporary and must not be treated as durable storage.",
          "Back up required configuration and durable application data; do not restore stale PID files or assume temporary exports survive.",
        ],
      ],
      [
        "Read the virtual filesystems",
        "A colleague wants to delete large-looking files under /proc to recover disk space. Meanwhile, an application started from /opt/shop cannot find ./config.yml when launched from another directory.",
        "Explain what /proc and /sys represent, why deleting their entries is not a disk cleanup strategy, and how to make the configuration path independent of the working directory. Contrast /usr with /var.",
        [
          "/proc exposes process/kernel information and /sys exposes kernel device/object information; these are virtual interfaces, not ordinary stored files to clean up.",
          "A relative path is resolved from the process working directory; use an explicit absolute configuration path or a deliberately configured working directory.",
          "/usr contains installed programs and shareable resources; /var contains variable data such as logs and application state.",
        ],
      ],
    ],
  ],
  [
    "Processes and signals",
    [
      [
        "Stop a worker without losing work",
        "A payment worker is processing queued jobs. Someone suggests immediately sending kill -9 because deployments are taking too long.",
        "Describe a safe shutdown sequence, including how you identify the correct process, allow cleanup, decide when escalation is justified and confirm it stopped.",
        [
          "Verify PID, owner, command and service identity; prefer the service manager when it owns the worker.",
          "Request graceful shutdown with SIGTERM, allow a bounded wait, and explain that the application must handle cleanup and in-flight work.",
          "Use SIGKILL only after the grace period if necessary; it cannot be caught. Verify termination and account for interrupted work.",
        ],
      ],
      [
        "A zombie that will not die",
        "ps shows a worker in state Z. Sending SIGKILL does not remove it, and its parent process remains running.",
        "Explain what has already happened to this process, why killing it again does not help, and how you would resolve the parent-side problem. Distinguish a zombie from an orphan.",
        [
          "A zombie has exited; its exit status remains until its parent reaps it with wait or equivalent handling.",
          "Inspect the parent and its child-reaping behavior; fix the parent or arrange a controlled parent restart, considering service impact.",
          "An orphan loses its parent and is adopted by a subreaper or init; it may still be running and is not synonymous with a zombie.",
        ],
      ],
    ],
  ],
  [
    "File descriptors and redirection",
    [
      [
        "Where did the error message go?",
        "Two deployment scripts use command >deploy.log 2>&1 and command 2>&1 >deploy.log. Their operators expect identical results, but errors appear in different places.",
        "Explain descriptors 0, 1 and 2, trace both redirections in order, and state which form sends both output streams to the log. Explain what a pipe normally carries.",
        [
          "0 is standard input, 1 standard output and 2 standard error; descriptors refer to open streams.",
          "Redirections apply left to right: >deploy.log 2>&1 sends both to the file; 2>&1 >deploy.log leaves stderr pointing at the original stdout destination.",
          "A normal pipe connects the left command's stdout to the right command's stdin; stderr is separate unless explicitly redirected.",
        ],
      ],
      [
        "Too many open files",
        "A server stops accepting connections with 'Too many open files'. Restarting temporarily helps, but the problem returns after several hours.",
        "Give an investigation and remediation plan that distinguishes a descriptor leak from a legitimately low limit. Include evidence and verification after the fix.",
        [
          "Inspect the affected process's /proc/PID/fd or lsof output, descriptor growth and /proc/PID/limits; distinguish its limit from system-wide exhaustion.",
          "Look for leaked sockets/files and missing close operations; raising a limit alone does not fix a leak.",
          "Size justified service limits through its actual launch configuration, then load-test and verify stable descriptor usage and successful requests.",
        ],
      ],
    ],
  ],
  [
    "Permissions, special bits and ACLs",
    [
      [
        "Readable file, inaccessible directory",
        "An analyst can read a report according to its file mode but still receives Permission denied. The report is inside several restricted directories.",
        "Explain the directory permissions required to reach and read a known file, how you would locate the blocking path component, and a minimal-access fix.",
        [
          "Directory execute permits traversal; directory read lists names. Reading a known file requires traversal on all parents plus appropriate file read permission.",
          "Inspect every path component, identity/group membership and ACLs, for example with namei -l and getfacl.",
          "Grant only necessary traversal/read access using a suitable group or ACL; consider the ACL mask and avoid chmod 777.",
        ],
      ],
      [
        "Design a safe shared work area",
        "Support staff need a shared directory where new files inherit the support group. They should not casually delete each other's files. An old troubleshooting binary also has SUID set.",
        "Explain how setgid and the sticky bit affect the directory, how umask/default ACLs affect new files, and why the SUID binary deserves a separate security review.",
        [
          "Directory setgid inherits the directory's group for new entries; write access still depends on permissions and ACLs.",
          "The sticky bit restricts deletion/rename to the file owner, directory owner or privileged users; umask/default ACLs govern new-file access, not existing files retroactively.",
          "SUID executes a binary with its owner's effective UID and can grant privilege; verify necessity, ownership and provenance rather than copying this setting broadly.",
        ],
      ],
    ],
  ],
  [
    "Links and inodes",
    [
      [
        "Choose a link for a deployment",
        "A release manager proposes a hard link named current pointing to a release directory on another filesystem. They also need to know what happens when a linked target is renamed.",
        "Choose an appropriate link and explain inode identity, filesystem boundaries, directory restrictions and behavior when the target path changes.",
        [
          "Hard links are names for the same inode, normally cannot target directories and cannot cross filesystem boundaries.",
          "A symbolic link stores a target path, can point to directories or across filesystems, and can become dangling after a target move/removal.",
          "Choose a symbolic link for current; explain relative targets resolve from the link's directory and verify the deployed target after switching.",
        ],
      ],
      [
        "Deleted logs still occupy the disk",
        "A 12 GB log is deleted, but df still reports a full filesystem. du no longer finds the log and the application is still writing.",
        "Explain the discrepancy and propose a safe way to release the space without disrupting unrelated processes. State what you would change to prevent recurrence.",
        [
          "Unlinking removes a name; an open descriptor keeps the inode/data allocated until the final reference is released.",
          "Use tools such as lsof +L1 or /proc/PID/fd to identify the exact owner, then use supported log reopen/rotation or a controlled restart.",
          "Verify filesystem free space afterwards and configure rotation/reopen behavior; avoid blindly deleting or truncating arbitrary descriptors.",
        ],
      ],
    ],
  ],
  [
    "CPU and load average",
    [
      [
        "High load, mostly idle CPU",
        "An eight-core host has a load average of 20 but low CPU utilization. A colleague concludes the monitoring is broken.",
        "Explain why both readings can be valid and describe how you would distinguish CPU contention from tasks blocked on I/O.",
        [
          "Linux load includes runnable tasks and tasks in uninterruptible sleep; compare sustained load with CPU capacity and do not read it as a CPU percentage.",
          "Inspect process states and CPU usage using ps/top and tools such as vmstat or pidstat; look for blocked tasks and correlate with I/O evidence.",
          "Use time series and workload context before choosing a fix; high load alone does not prove CPU saturation or disk failure.",
        ],
      ],
      [
        "One thread is melting the CPU",
        "A Java service has poor response times and one thread consumes a full CPU core, while the host still has idle cores.",
        "Explain why spare host CPU does not rule out a CPU bottleneck. Describe evidence you would collect to identify the hot thread and verify an improvement.",
        [
          "A single runnable thread can saturate one core; a serial bottleneck may not use other available cores.",
          "Find the process and hot OS thread with top -H or pidstat -t, then correlate its thread ID with a JVM thread dump or profiler evidence.",
          "Compare repeated samples and request latency/throughput before and after a targeted fix; do not assume adding threads resolves contention or serial work.",
        ],
      ],
    ],
  ],
  [
    "Memory and swap",
    [
      [
        "Almost no free memory",
        "Monitoring shows little free RAM, substantial filesystem cache and no user-visible slowdown. Someone asks you to clear the cache every minute.",
        "Explain free versus available memory and cache reclaim. State which additional signs would justify investigating memory pressure and why routine cache clearing is a poor fix.",
        [
          "Cached pages can often be reclaimed; MemAvailable estimates memory available for new work better than MemFree alone.",
          "Check swap-in/out activity, reclaim/pressure indicators, latency and process memory trends rather than treating any swap usage as an incident.",
          "Cache improves I/O performance; repeatedly clearing it discards useful work and does not repair an application's memory leak.",
        ],
      ],
      [
        "Killed despite free host RAM",
        "A containerized worker exits with code 137. The host has spare memory, but the container has a 512 MB limit.",
        "Explain what exit 137 does and does not prove, how to confirm a cgroup OOM kill, and how to decide between fixing usage and changing the limit.",
        [
          "137 commonly means termination by SIGKILL, but is not by itself proof of OOM; an operator or timeout may also kill a process.",
          "Inspect container OOM state, cgroup memory.events/limits and relevant kernel/runtime logs; host free memory does not override a cgroup limit.",
          "Measure peak/steady usage and workload, investigate leaks or sizing, then retest under a justified limit and verify no further OOM events.",
        ],
      ],
    ],
  ],
  [
    "Disk troubleshooting",
    [
      [
        "No space left with free gigabytes",
        "A job cannot create a tiny file. df -h shows 40% capacity free, but df -i shows 100% inode usage on its target filesystem.",
        "Explain the failure, outline a safe investigation for the source of the tiny files, and propose immediate recovery and prevention.",
        [
          "Files require inodes as well as data blocks; inode exhaustion can prevent file creation despite free bytes.",
          "Confirm the target mount and inspect directories with large file counts, ownership, age and application purpose before deleting anything.",
          "Remove/archive only approved disposable files and verify inode recovery; fix retention/file-generation behavior or plan storage with appropriate inode capacity.",
        ],
      ],
      [
        "A storage bottleneck or a CPU problem?",
        "Requests slow down during backups. CPU is not saturated, processes block intermittently and disk latency rises.",
        "Describe the measurements you would compare, how you would distinguish latency from simple data volume, and a safe way to test whether the backup is responsible.",
        [
          "Correlate request latency with per-device latency/queue/throughput and per-process I/O using tools such as iostat -xz, pidstat -d and vmstat.",
          "Interpret metrics in device/workload context; high utilization or I/O wait alone is not conclusive for every storage type.",
          "Run a controlled comparison or throttle/reschedule the backup, then verify improvement without disabling durability or deleting data.",
        ],
      ],
    ],
  ],
  [
    "Networking fundamentals",
    [
      [
        "Refused or timed out?",
        "One client immediately gets Connection refused from an API; another times out. Both can resolve its hostname.",
        "Explain likely differences and give an ordered investigation from name resolution through routing, listening sockets and filtering. Avoid treating either error as proof of one cause.",
        [
          "Refusal often indicates no listener or an explicit rejection; a timeout can reflect dropped traffic, routing issues or an unresponsive endpoint.",
          "Confirm the resolved address/port and route; inspect listener binding with ss and test from appropriate client/server locations.",
          "Check firewall/security rules and packet evidence as needed; successful DNS resolution does not establish TCP connectivity.",
        ],
      ],
      [
        "Works on localhost only",
        "An API responds on the server at 127.0.0.1:8080 but remote clients cannot reach it. A DNS record points to the correct server.",
        "Explain loopback binding, how to verify the listener address, and how to expose only the intended access path. Contrast TCP and UDP when choosing a connectivity test.",
        [
          "A listener bound to 127.0.0.1 accepts local loopback connections, not remote connections to the host's external address.",
          "Inspect ss -lntp and intended architecture; expose an approved interface or a reverse proxy, then check routing and restrictive firewall rules.",
          "TCP is a connection-oriented byte stream; UDP uses datagrams without a TCP handshake. A successful TCP probe says nothing about a separate UDP service.",
        ],
      ],
    ],
  ],
  [
    "Service management and logs",
    [
      [
        "Started today, missing after reboot",
        "An operator started a service successfully, but it was absent after reboot. Another service was enabled but never started immediately.",
        "Explain start versus enable, describe how to inspect boot activation and failures, and distinguish ordering dependencies from readiness.",
        [
          "Starting activates a unit now; enabling configures activation links for future targets/boot and does not inherently start it unless combined with --now.",
          "Inspect is-enabled, status and current/previous boot journal as applicable; verify the unit's target relationships and actual runtime state.",
          "After expresses ordering, not a requirement to start the other unit or proof its application is ready; use appropriate dependency/readiness design.",
        ],
      ],
      [
        "Runs manually, fails as a service",
        "An application starts from an administrator's shell but fails in its systemd unit with a missing configuration or permission error.",
        "List the execution-context differences you would inspect, the logs you need, and how you would verify a durable fix without running the service as root.",
        [
          "Compare User/Group, WorkingDirectory, environment, absolute paths, file permissions and sandbox restrictions with the successful manual launch.",
          "Read systemctl status and journalctl for the unit to identify the actual error; inspect the effective unit/drop-ins rather than guessing.",
          "Correct the narrow cause, reload unit definitions when changed, restart and verify health under the intended service account and after activation.",
        ],
      ],
    ],
  ],
  [
    "Users and privilege management",
    [
      [
        "Give support one administrative action",
        "Support engineers need to restart one service, but a proposed sudo rule gives them unrestricted command execution.",
        "Describe a least-privilege alternative and the checks required to avoid turning the permitted action into a route to root access.",
        [
          "Use a scoped sudoers rule for the intended command/service and arguments, validate it with visudo, and test both allowed and denied actions.",
          "Ensure callers cannot modify the service unit, executable, privileged configuration or writable helper paths to execute arbitrary code as root.",
          "Use named identities/groups and audit logs; avoid broad wildcards, unrestricted shells or a blanket NOPASSWD: ALL rule.",
        ],
      ],
      [
        "A service account can log in",
        "An audit finds a daemon account with a normal shell and a password hash. A new employee's username also shares a UID with another account.",
        "Explain how Linux identifies accounts, why duplicate UIDs matter, and how you would secure the daemon account without assuming password locking disables every login method.",
        [
          "Access ownership is based on numeric UID/GID, so duplicate UIDs share an identity for permission purposes even with different names.",
          "Inspect account/group records and policy; /etc/passwd holds account metadata while protected /etc/shadow stores password information.",
          "Use an appropriate non-login shell and authentication restrictions for service accounts; locking a password alone does not revoke SSH keys or every alternate authentication path.",
        ],
      ],
    ],
  ],
  [
    "Shell behavior",
    [
      [
        "A filename becomes several arguments",
        "A script uses cp $source $destination. It works with report.csv but fails with names containing spaces or wildcard characters.",
        "Explain expansion and quoting, show the safer command form, and explain why quoting a variable differs from deliberately expanding a glob.",
        [
          "Unquoted parameter expansion can undergo word splitting and pathname expansion in Bash, changing the argument count or contents.",
          'Use cp -- "$source" "$destination" for single path arguments; -- prevents option-like filenames being interpreted as options.',
          "Quoted variables remain one argument; an intentional unquoted glob such as *.log expands matching paths. Do not use eval to repair quoting.",
        ],
      ],
      [
        "Why did the parent shell not change?",
        "A developer runs ./set-env.sh to export a variable and cd into a folder, then finds their original terminal unchanged. They also lose a variable set inside parentheses.",
        "Explain process environment inheritance and subshell scope. Describe when sourcing changes the current shell and what risks or side effects that introduces.",
        [
          "A child inherits an exported environment from its parent; a child cannot normally change its parent's environment or working directory.",
          "Parentheses run commands in a subshell context, so variable assignments and cd there do not persist in the caller.",
          "source file or . file executes in the current shell, preserving changes but also applying options, exit commands and other side effects; source only trusted scripts.",
        ],
      ],
    ],
  ],
  [
    "Reliable shell scripting",
    [
      [
        "A failed backup reports success",
        "A backup script pipes a failing export into gzip, reports success and removes its staging directory. Its compressed output is incomplete.",
        "Describe how to preserve meaningful failure status, handle temporary files and publish a backup only after success. Explain the limits of relying only on set -e.",
        [
          "Without pipefail, a pipeline normally reports its final command's status; use Bash pipefail and explicit checks where appropriate to detect upstream failure.",
          "Use a private temporary path, quoted arguments and cleanup traps; validate output and rename into place on the same filesystem only after successful completion.",
          "set -e has context-dependent exceptions and is not a complete error-handling policy; preserve the original failure and avoid deleting the last good backup.",
        ],
      ],
      [
        "Two scheduled jobs collide",
        "A report job takes 15 minutes but is scheduled every five minutes. Concurrent instances overwrite each other's output and leave stale PID files after crashes.",
        "Propose a locking and publication strategy, including overlap policy, crash behavior, input validation and how operators discover failures.",
        [
          "Use a real lock such as flock held for the job's lifetime; choose whether overlaps wait or exit and record that outcome.",
          "Validate arguments and inputs, write a temporary report and publish atomically after success; a PID file alone is vulnerable to staleness and PID reuse.",
          "Use meaningful exit codes/logs and cleanup traps; distinguish automatic kernel lock release when descriptors close from deleting a lock pathname.",
        ],
      ],
    ],
  ],
  [
    "Boot and recovery",
    [
      [
        "A host enters emergency mode",
        "After a storage change, a host enters emergency mode. Its root filesystem is healthy, but a removed data disk is still listed in /etc/fstab.",
        "Describe the boot sequence at a useful interview level, how you would confirm the failed mount and how you would repair configuration without putting root storage at risk.",
        [
          "Explain firmware, bootloader, kernel/initramfs, root filesystem and init/systemd activation in order.",
          "Inspect boot journal and failed units, compare fstab UUIDs with actual devices, and identify the exact mount failure before editing.",
          "Back up and correct the entry; use nofail only where optional storage is genuinely optional, validate mounts safely and verify recovery. Do not format devices as a first response.",
        ],
      ],
      [
        "A release breaks the next boot",
        "A kernel update is followed by a boot failure. The previous kernel is still installed and console access is available.",
        "Explain a reversible recovery approach, what evidence you would preserve and why a bootloader problem differs from a later service failure.",
        [
          "Use console/recovery access and a known-good previous kernel where available rather than deleting kernels blindly.",
          "Locate the failure stage and collect boot/kernel/initramfs evidence; inspect storage drivers, root-device references and update history as relevant.",
          "Repair the identified cause using distribution-supported tooling, retain a fallback and validate a planned reboot; a userspace service failure occurs after kernel/init startup.",
        ],
      ],
    ],
  ],
  [
    "Security fundamentals",
    [
      [
        "Mode 777 still does not fix access",
        "An application cannot read a file despite permissive Unix modes. The host uses SELinux or AppArmor, and someone proposes disabling it permanently.",
        "Explain discretionary versus mandatory access control and how you would investigate and repair the policy or labeling issue without broadly disabling protection.",
        [
          "Unix owner/group/mode/ACL checks and mandatory policy can both restrict access; satisfying one layer does not bypass the other.",
          "Inspect relevant audit/denial logs and actual SELinux contexts or AppArmor profile; identify the denied operation and expected access.",
          "Apply the narrow supported labeling/profile correction and retest; do not assume chmod 777 or globally disabling enforcement is an appropriate fix.",
        ],
      ],
      [
        "Harden SSH without locking yourself out",
        "A remote server should accept key-based administrative access and restrict incoming traffic. You have only one active SSH session.",
        "Give a safe change-and-verification sequence covering keys, SSH policy, firewall access and a rollback path.",
        [
          "Verify the intended user's key authentication and scoped sudo first; retain the current session and have console/rollback access.",
          "Validate SSH configuration before reload and allow the required management path through the firewall before restricting other access.",
          "Test a second independent connection and required application access before closing the original; restrict root/password access according to policy only after verifying the replacement.",
        ],
      ],
    ],
  ],
  [
    "Packages and scheduled jobs",
    [
      [
        "Who installed this configuration file?",
        "A package update changes application behavior. An engineer wants to overwrite its installed files manually and remove a dependency to force a downgrade.",
        "Describe how to identify package ownership/version and dependencies, inspect the change and plan a reversible repair using the package manager.",
        [
          "Use the distribution's package tools, such as dpkg -S/-l or rpm -qf/-q, to identify ownership and installed version; inspect package/update history.",
          "Review dependency and configuration-file handling, repository provenance and available versions before a proposed downgrade/removal.",
          "Back up configuration, use supported package operations and test service health; avoid blind dependency deletion and retain a rollback route.",
        ],
      ],
      [
        "Works manually, fails every night",
        "A script succeeds in an interactive shell but fails from cron. The team is considering a systemd timer because they also want visibility of missed runs.",
        "Explain the environment differences to investigate, what to log and how cron differs from a systemd timer for this use case.",
        [
          "Cron has a limited environment and may use a different shell, PATH, directory and identity; use explicit paths/configuration and inspect permissions.",
          "Capture stdout/stderr and exit status, confirm schedule/timezone and prevent overlap; never assume interactive shell profiles are loaded.",
          "A systemd timer activates a service with journal/status integration; Persistent=true can catch missed calendar runs when appropriate. Explain the chosen timing and failure behavior rather than claiming every timer catches missed work automatically.",
        ],
      ],
    ],
  ],
];

export const linuxInterview = {
  ...make(
    "linux-interview",
    "linux",
    "Linux administration · interview practice",
    "Two challenges per topic: practical terminal tasks where results can be verified, plus written explanations and incident diagnosis.",
    ["Terminal tasks", "Written answers", "Interview preparation"],
    topics.flatMap(([topic, questions], topicIndex) =>
      questions.map(([title, mission, goal, rubric], i) => ({
        type: "written",
        engine: "written",
        topic,
        questionNumber: i + 1,
        mission,
        goal,
        task: goal,
        rubric,
        concept:
          "Explain the mechanism, use evidence to distinguish possible causes, and verify a safe fix. Equivalent technically correct answers are welcome.",
        requirements: [
          "Answer in your own words; command examples are welcome but not required.",
          "Explain why your approach works and how you would verify it.",
        ],
        hint: `Organize your answer around: ${topic}. State your reasoning, useful evidence and any safety or verification steps.`,
        learn: [
          topic,
          "Technical explanation",
          "Evidence-based troubleshooting",
        ],
        prerequisites:
          topicIndex || i
            ? [`hands-linux-interview:${topicIndex * 2 + i - 1}`]
            : [],
        ...(interviewLabs[`${topicIndex}:${i}`] || {}),
        title: `${topic} ${i + 1}/2 · ${title}`,
      })),
    ),
  ),
  level: "Intermediate interview practice",
  minutes: 240,
};
