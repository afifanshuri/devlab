import { courses, allLessons } from "../curriculum.js?v=mission-brief-1";

const definitions = [
  [
    "java-oop",
    "java",
    "OOP & Java language",
    "Objects, strings, inheritance, interfaces, encapsulation, validation and Java language contracts.",
  ],
  [
    "java-collections",
    "java",
    "Collections & algorithms",
    "Lists, sets, maps, queues, generics, searching and incident-data algorithms.",
  ],
  [
    "java-solid",
    "java",
    "SOLID & clean architecture",
    "Apply all five SOLID principles and separate business rules from infrastructure.",
  ],
  [
    "java-patterns",
    "java",
    "Design patterns",
    "Creational, structural and behavioral patterns, from focused components to checkout architecture.",
  ],
  [
    "java-reliability",
    "java",
    "Reliability, concurrency & security",
    "Validation, immutable contracts, retries, idempotency, synchronization and secure workflows.",
  ],
  [
    "java-spring",
    "java",
    "Spring & Spring Boot",
    "Dependency injection, configuration, APIs, persistence, transactions and authorization.",
  ],
  [
    "linux-files",
    "linux",
    "Files, paths & permissions",
    "Filesystem layout, directories, links, ownership and access control.",
  ],
  [
    "linux-shell",
    "linux",
    "Shell, text processing & automation",
    "Quoting, streams, grep, awk, reconciliation, scripts and scheduled jobs.",
  ],
  [
    "linux-processes",
    "linux",
    "Processes, memory & performance",
    "Signals, worker lifecycles, CPU load, memory pressure and container limits.",
  ],
  [
    "linux-services",
    "linux",
    "Services, accounts & security",
    "Service configuration, users, sudo, SSH and mandatory access control.",
  ],
  [
    "linux-network",
    "linux",
    "Networking & packages",
    "DNS, listeners, routing, package ownership and safe package maintenance.",
  ],
  [
    "linux-recovery",
    "linux",
    "Storage, backups & incident recovery",
    "Disk diagnosis, rotation, backups, boot recovery and verifiable incident evidence.",
  ],
  [
    "sql-relational",
    "sql",
    "Relational queries & reporting",
    "Joins, subqueries, aggregation, NULL handling, set operations and views.",
  ],
  [
    "sql-analytics",
    "sql",
    "Analytics & advanced queries",
    "Window functions, rankings, recursive queries, pivots and date-based reporting.",
  ],
  [
    "sql-procedural",
    "sql",
    "PostgreSQL programming",
    "Functions, branching, loops, cursors and safe dynamic SQL.",
  ],
  [
    "sql-administration",
    "sql",
    "Transactions & database administration",
    "Atomic mutations, integrity, permissions, indexes and bounded maintenance.",
  ],
  [
    "sql-oracle",
    "sql",
    "Oracle PL/SQL & administration",
    "Oracle coding labs and tablespace, undo and session health reports. Coding requires the optional Oracle runtime; output questions work without it.",
  ],
];

const courseGroups = {
  "java-oop-basics": "java-oop",
  "java-oop-more": "java-oop",
  "java-collections": "java-collections",
  "java-dsa": "java-collections",
  "java-analysis": "java-collections",
  "java-solid": "java-solid",
  "java-solid-workshop": "java-solid",
  "java-patterns": "java-patterns",
  "java-architecture": "java-patterns",
  "java-patterns-advanced": "java-patterns",
  "java-contracts": "java-oop",
  "java-reliability": "java-reliability",
  "java-capstone": "java-reliability",
  "java-spring-core": "java-spring",
  "java-spring-web": "java-spring",
  "linux-operations": "linux-recovery",
  "sql-relational": "sql-relational",
  "sql-analytics": "sql-analytics",
  "sql-programming-roadmap": "sql-procedural",
  "sql-postgres": "sql-procedural",
  "sql-integrity": "sql-administration",
  "sql-admin-workshop": "sql-administration",
  "sql-oracle": "sql-oracle",
};

// Split broad legacy courses by their actual exercise topics, without moving
// their source arrays or changing any answer/progress/runner identity.
const splitCourses = {
  "linux-basics": ["files", "shell"],
  "linux-foundations": ["files", "files", "shell", "shell", "shell", "files"],
  "linux-shell-roadmap": [
    "shell",
    "shell",
    "shell",
    "shell",
    "processes",
    "recovery",
  ],
  "linux-admin": ["files", "recovery"],
  "linux-admin-workshop": [
    "files",
    "files",
    "processes",
    "recovery",
    "recovery",
    "recovery",
  ],
  "linux-admin-roadmap": [
    "services",
    "services",
    "network",
    "network",
    "recovery",
    "recovery",
    "services",
    "shell",
    "processes",
    "network",
    "recovery",
    "processes",
  ],
  "sql-queries": ["relational", "analytics"],
};
const topicGroups = {
  "linux-files": [
    "Permissions, umask and setgid",
    "Hard links and symbolic links",
    "Filesystem structure",
    "Permissions, special bits and ACLs",
    "Links and inodes",
    "find and safe path handling",
  ],
  "linux-shell": [
    "grep and exact log filtering",
    "awk and grouped text reports",
    "sort, uniq, comm and reconciliation",
    "Shell environment, PATH and exit contracts",
    "Streams, redirection and pipeline failures",
    "Cron, scheduling and idempotent jobs",
    "File descriptors and redirection",
    "Shell behavior",
    "Reliable shell scripting",
  ],
  "linux-processes": [
    "cgroups, memory and resource limits",
    "Processes, PID files and signals",
    "Processes and signals",
    "CPU and load average",
    "Memory and swap",
  ],
  "linux-services": [
    "systemd units and service hardening",
    "Users, groups and account audits",
    "SSH configuration and authentication policy",
    "Service management and logs",
    "Users and privilege management",
    "Security fundamentals",
  ],
  "linux-network": [
    "TCP/IP, subnets and routing",
    "APT packages and version comparisons",
    "Networking fundamentals",
  ],
  "linux-recovery": [
    "Log rotation and compression",
    "Backups, checksums and recovery",
    "Filesystems, inodes and boot storage diagnosis",
    "Disk troubleshooting",
    "Boot and recovery",
  ],
  "sql-relational": [
    "Joins and missing matches",
    "Correlated subqueries and anti-joins",
    "Aggregation, HAVING and report grain",
    "NULL, CASE and string functions",
    "UNION, INTERSECT and EXCEPT",
  ],
  "sql-analytics": [
    "CTEs and window frames",
    "LAG and LEAD",
    "RANK, DENSE_RANK and ROW_NUMBER",
    "Recursive CTEs and hierarchy traversal",
    "Conditional aggregation and pivot",
    "LATERAL and unpivot",
    "Date arithmetic and numeric reporting",
  ],
  "sql-procedural": [
    "PL/pgSQL branching and loops",
    "Cursors and procedural aggregation",
    "Safe dynamic SQL",
  ],
  "sql-administration": [
    "Transactions and atomic mutations",
    "Schema metadata and constraints",
    "Indexes and query access paths",
    "Bounded retention and maintenance",
    "Grants and least-privilege reporting",
  ],
  "sql-oracle": ["Oracle PL/SQL functions, exceptions and cursors"],
};
const byTopic = new Map(
  Object.entries(topicGroups).flatMap(([group, topics]) =>
    topics.map((topic) => [topic, group]),
  ),
);
const byId = new Map(allLessons.map((lesson) => [lesson.id, lesson]));
const assigned = new Map();
function groupId(lesson) {
  if (assigned.has(lesson.id)) return assigned.get(lesson.id);
  const source = lesson.course.replace(/^hands-/, "");
  let id =
    lesson.learningGroup ||
    courseGroups[source] ||
    byTopic.get(lesson.advancedTopic || lesson.topic);
  if (splitCourses[source])
    id = lesson.track + "-" + splitCourses[source][lesson.index];
  if (lesson.topic === "Packages and scheduled jobs")
    id = lesson.questionNumber === 1 ? "linux-network" : "linux-shell";
  // Advanced Java challenges explicitly identify the earlier component they
  // extend. Follow that relation instead of duplicating a second topic map.
  if (!id && source === "java-advanced") {
    const base = byId.get(lesson.prerequisites[0]);
    if (base) id = groupId(base);
  }
  if (!id || !definitions.some(([key]) => key === id))
    throw Error("Exercise has no learning group: " + lesson.id);
  assigned.set(lesson.id, id);
  return id;
}

// Put the initial exercise and the pair that extends it in the same section.
const primaryTopics = new Map();
for (const lesson of allLessons.filter(
  (item) => item.advancedTopic && item.challengeNumber === 1,
)) {
  const base = byId.get(lesson.prerequisites[0]);
  if (base && groupId(base) === groupId(lesson) && !primaryTopics.has(base.id))
    primaryTopics.set(base.id, lesson.advancedTopic);
}
const aliases = {
  "Sliding windows and long arithmetic": "Incident data algorithms",
  "Security boundaries and safe diagnostics": "Secure workflow",
  "Permissions, umask and setgid": "Permissions & access control",
  "Permissions, special bits and ACLs": "Permissions & access control",
  "Hard links and symbolic links": "Links & inodes",
  "Links and inodes": "Links & inodes",
  "Streams, redirection and pipeline failures": "Streams & redirection",
  "File descriptors and redirection": "Streams & redirection",
  "Shell environment, PATH and exit contracts": "Shell environment & scope",
  "Shell behavior": "Shell environment & scope",
  "Cron, scheduling and idempotent jobs": "Scheduling",
  "Packages and scheduled jobs": "Packages",
  "Processes, PID files and signals": "Processes & signals",
  "Processes and signals": "Processes & signals",
  "systemd units and service hardening": "Service management",
  "Service management and logs": "Service management",
  "Users, groups and account audits": "Accounts & privileges",
  "Users and privilege management": "Accounts & privileges",
  "TCP/IP, subnets and routing": "Networking",
  "Networking fundamentals": "Networking",
  "APT packages and version comparisons": "Packages",
  "Filesystems, inodes and boot storage diagnosis": "Storage & boot diagnosis",
  "Disk troubleshooting": "Storage & boot diagnosis",
  "Boot and recovery": "Storage & boot diagnosis",
  "Single responsibility": "Single responsibility (SRP)",
  "Open/closed": "Open/closed principle (OCP)",
  "Liskov substitution": "Liskov substitution (LSP)",
  "Interface segregation": "Interface segregation (ISP)",
  "Dependency inversion": "Dependency inversion (DIP)",
};
const sectionOverrides = {
  "hands-java-patterns:0": "Strategy",
  "hands-java-patterns:1": "Observer",
  "hands-java-solid:0": "Dependency inversion (DIP)",
  "hands-java-solid:1": "Single responsibility (SRP)",
  "hands-java-architecture:8": "Order checkout capstone",
  "hands-linux-interview:30": "Packages",
  "hands-linux-interview:31": "Scheduling",
  ...Object.fromEntries(
    [0, 1, 2, 3].map((index) => [
      "hands-java-analysis:" + index,
      "Incident data algorithms",
    ]),
  ),
  ...Object.fromEntries(
    [0, 1, 2, 3].map((index) => [
      "hands-java-capstone:" + index,
      "Secure workflow",
    ]),
  ),
};
function sectionLabel(lesson) {
  const topic =
    sectionOverrides[lesson.id] ||
    lesson.section ||
    lesson.advancedTopic ||
    lesson.topic ||
    primaryTopics.get(lesson.id) ||
    lesson.designTopic ||
    courses.find((course) => course.id === lesson.course).title;
  return aliases[topic] || topic;
}

export const learningGroups = definitions.map(
  ([id, track, title, description]) => {
    const lessons = allLessons.filter((lesson) => groupId(lesson) === id);
    const sections = new Map();
    for (const lesson of lessons) {
      const label = sectionLabel(lesson);
      if (!sections.has(label))
        sections.set(label, { title: label, lessons: [] });
      sections.get(label).lessons.push(lesson);
    }
    const ordered = [...sections.values()];
    return {
      id,
      track,
      title,
      description,
      sections: ordered,
      lessons: ordered.flatMap((section) => section.lessons),
      tags: [
        track === "sql" && id === "sql-oracle"
          ? "Optional Oracle"
          : "Progressive practice",
        "Grouped by topic",
      ],
      level: "Practice & advanced challenges",
      symbol: track === "java" ? "{ }" : track === "linux" ? ">_" : "SQL",
    };
  },
);
export const groupForLesson = new Map(
  learningGroups.flatMap((group) =>
    group.lessons.map((lesson) => [lesson.id, group]),
  ),
);
export const lessonRoute = (lesson) => `#lab/${lesson.course}/${lesson.index}`;
export const exerciseMode = (lesson) =>
  lesson.type === "written"
    ? "Short answer"
    : lesson.engine === "linux"
      ? "Terminal"
      : "Code";
export function groupedNavigation(key) {
  const group = groupForLesson.get(key),
    index = group.lessons.findIndex((lesson) => lesson.id === key);
  return {
    group,
    index,
    previous: group.lessons[index - 1],
    next: group.lessons[index + 1],
  };
}
