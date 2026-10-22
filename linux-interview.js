import { make } from "./exercise-factories.js";
import { interviewLabs } from "./linux-interview-labs.js";
import { interviewAnswers } from "./linux-interview-answers.js";

const topics = [
  [
    "Filesystem structure",
    [
      [
        "Put service files in the right place",
        "Your team stores configuration, logs, a PID file and temporary exports together under /home/admin. A reboot removes some files and nobody knows which files to back up.",
      ],
      [
        "Read the virtual filesystems",
        "A colleague wants to delete large-looking files under /proc to recover disk space. Meanwhile, an application started from /opt/shop cannot find ./config.yml when launched from another directory.",
      ],
    ],
  ],
  [
    "Processes and signals",
    [
      [
        "Stop a worker without losing work",
        "A payment worker is processing queued jobs. Someone suggests immediately sending kill -9 because deployments are taking too long.",
      ],
      [
        "A zombie that will not die",
        "ps shows a worker in state Z. Sending SIGKILL does not remove it, and its parent process remains running.",
      ],
    ],
  ],
  [
    "File descriptors and redirection",
    [
      [
        "Where did the error message go?",
        "Two deployment scripts use command >deploy.log 2>&1 and command 2>&1 >deploy.log. Their operators expect identical results, but errors appear in different places.",
      ],
      [
        "Too many open files",
        "A server stops accepting connections with 'Too many open files'. Restarting temporarily helps, but the problem returns after several hours.",
      ],
    ],
  ],
  [
    "Permissions, special bits and ACLs",
    [
      [
        "Readable file, inaccessible directory",
        "An analyst can read a report according to its file mode but still receives Permission denied. The report is inside several restricted directories.",
      ],
      [
        "Design a safe shared work area",
        "Support staff need a shared directory where new files inherit the support group. They should not casually delete each other's files. An old troubleshooting binary also has SUID set.",
      ],
    ],
  ],
  [
    "Links and inodes",
    [
      [
        "Choose a link for a deployment",
        "A release manager proposes a hard link named current pointing to a release directory on another filesystem. They also need to know what happens when a linked target is renamed.",
      ],
      [
        "Deleted logs still occupy the disk",
        "A 12 GB log is deleted, but df still reports a full filesystem. du no longer finds the log and the application is still writing.",
      ],
    ],
  ],
  [
    "CPU and load average",
    [
      [
        "High load, mostly idle CPU",
        "An eight-core host has a load average of 20 but low CPU utilization. A colleague concludes the monitoring is broken.",
      ],
      [
        "One thread is melting the CPU",
        "A Java service has poor response times and one thread consumes a full CPU core, while the host still has idle cores.",
      ],
    ],
  ],
  [
    "Memory and swap",
    [
      [
        "Almost no free memory",
        "Monitoring shows little free RAM, substantial filesystem cache and no user-visible slowdown. Someone asks you to clear the cache every minute.",
      ],
      [
        "Killed despite free host RAM",
        "A containerized worker exits with code 137. The host has spare memory, but the container has a 512 MB limit.",
      ],
    ],
  ],
  [
    "Disk troubleshooting",
    [
      [
        "No space left with free gigabytes",
        "A job cannot create a tiny file. df -h shows 40% capacity free, but df -i shows 100% inode usage on its target filesystem.",
      ],
      [
        "A storage bottleneck or a CPU problem?",
        "Requests slow down during backups. CPU is not saturated, processes block intermittently and disk latency rises.",
      ],
    ],
  ],
  [
    "Networking fundamentals",
    [
      [
        "Refused or timed out?",
        "One client immediately gets Connection refused from an API; another times out. Both can resolve its hostname.",
      ],
      [
        "Works on localhost only",
        "An API responds on the server at 127.0.0.1:8080 but remote clients cannot reach it. A DNS record points to the correct server.",
      ],
    ],
  ],
  [
    "Service management and logs",
    [
      [
        "Started today, missing after reboot",
        "An operator started a service successfully, but it was absent after reboot. Another service was enabled but never started immediately.",
      ],
      [
        "Runs manually, fails as a service",
        "An application starts from an administrator's shell but fails in its systemd unit with a missing configuration or permission error.",
      ],
    ],
  ],
  [
    "Users and privilege management",
    [
      [
        "Give support one administrative action",
        "Support engineers need to restart one service, but a proposed sudo rule gives them unrestricted command execution.",
      ],
      [
        "A service account can log in",
        "An audit finds a daemon account with a normal shell and a password hash. A new employee's username also shares a UID with another account.",
      ],
    ],
  ],
  [
    "Shell behavior",
    [
      [
        "A filename becomes several arguments",
        "A script uses cp $source $destination. It works with report.csv but fails with names containing spaces or wildcard characters.",
      ],
      [
        "Why did the parent shell not change?",
        "A developer runs ./set-env.sh to export a variable and cd into a folder, then finds their original terminal unchanged. They also lose a variable set inside parentheses.",
      ],
    ],
  ],
  [
    "Reliable shell scripting",
    [
      [
        "A failed backup reports success",
        "A backup script pipes a failing export into gzip, reports success and removes its staging directory. Its compressed output is incomplete.",
      ],
      [
        "Two scheduled jobs collide",
        "A report job takes 15 minutes but is scheduled every five minutes. Concurrent instances overwrite each other's output and leave stale PID files after crashes.",
      ],
    ],
  ],
  [
    "Boot and recovery",
    [
      [
        "A host enters emergency mode",
        "After a storage change, a host enters emergency mode. Its root filesystem is healthy, but a removed data disk is still listed in /etc/fstab.",
      ],
      [
        "A release breaks the next boot",
        "A kernel update is followed by a boot failure. The previous kernel is still installed and console access is available.",
      ],
    ],
  ],
  [
    "Security fundamentals",
    [
      [
        "Mode 777 still does not fix access",
        "An application cannot read a file despite permissive Unix modes. The host uses SELinux or AppArmor, and someone proposes disabling it permanently.",
      ],
      [
        "Harden SSH without locking yourself out",
        "A remote server should accept key-based administrative access and restrict incoming traffic. You have only one active SSH session.",
      ],
    ],
  ],
  [
    "Packages and scheduled jobs",
    [
      [
        "Who installed this configuration file?",
        "A package update changes application behavior. An engineer wants to overwrite its installed files manually and remove a dependency to force a downgrade.",
      ],
      [
        "Works manually, fails every night",
        "A script succeeds in an interactive shell but fails from cron. The team is considering a systemd timer because they also want visibility of missed runs.",
      ],
    ],
  ],
];

export const linuxInterview = {
  ...make(
    "linux-interview",
    "linux",
    "Linux administration · interview practice",
    "Two challenges per topic: practical terminal tasks and short-answer questions checked against definite answers.",
    ["Terminal tasks", "Command questions", "Interview preparation"],
    topics.flatMap(([topic, questions], topicIndex) =>
      questions.map(([title, mission], i) => {
        const key = topicIndex + ":" + i;
        const practice = interviewLabs[key] || interviewAnswers[key];
        return {
          type: "written",
          engine: "written",
          topic,
          questionNumber: i + 1,
          mission,
          concept:
            "Use the exact output format requested. Command questions compare accepted command forms without executing them.",
          hint: "Pay attention to the requested tool, options, target and answer format.",
          learn: [topic, "Precise answers", "Interview preparation"],
          prerequisites:
            topicIndex || i
              ? ["hands-linux-interview:" + (topicIndex * 2 + i - 1)]
              : [],
          ...practice,
          task: practice.task || practice.goal,
          requirements: practice.requirements || [practice.goal],
          title: topic + " " + (i + 1) + "/2 · " + title,
        };
      }),
    ),
  ),
  level: "Intermediate interview practice",
  minutes: 180,
};
