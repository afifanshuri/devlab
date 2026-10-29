# DevLab — local Docker labs

A lightweight browser UI with a real local execution runner. No multiple-choice questions. Write code in the editor or with shell redirection, execute commands, inspect failures, and run task tests.

## Start on this computer

1. Start Docker Desktop in **Linux containers** mode.
2. Open a terminal in `D:\Programming\nextjs\devlab`.
3. Run:

```sh
npm ci
npm run setup:labs
npm start
```

Open **http://127.0.0.1:5173**. Open an exercise; its container starts or reconnects automatically. Image setup downloads/builds the official Eclipse Temurin JDK image and the official PostgreSQL image. Subsequent starts reuse them.

## Learning workflow

- Edit your answer. **Check answer** saves it automatically, compiles/runs it, and validates the internal test cases. You can also enter shell commands.
- Java: use `javac Main.java`. Task methods are checked with a separate verifier; to run your own executable entry point add `public static void main(String[] args)` and use `java Main`.
- Linux: use the interactive Bash terminal directly. Edit files with `vim filename` (`i` to edit; `Esc` then `:wq` to save and exit; `:q!` to discard changes). **Check answer** verifies the files and state you created, without replaying a general answer script. Scripting missions also exercise your saved script with their specified input cases. Save and close Vim before checking.
- PostgreSQL: save `solution.sql`; run `psql -f solution.sql` or `psql -c 'SELECT * FROM employees;'`.
- Click **Check answer** to validate real output, Java assertions, SQL results, or filesystem state. It does not automatically solve Linux tasks.
- Drafts are saved when checking an answer or navigating. Reconnecting restores the existing answer file if you have not edited the draft. **Reset lab** restores the starter answer in the editor and existing container without recreating the container.

Linux uses a real Docker PTY, with Bash history, Ctrl+C, Tab completion, Vim and terminal resizing. Its prompt shows `afif@devlab` and the current directory; `~` means `/workspace`. New Java/Linux images contain a non-root account named afif with UID/GID 1000. Reopening an exercise reattaches to its existing shell while the runner stays open. A runner restart replaces the old shell but preserves saved files in the existing container. Unsaved Vim buffers do not survive container deletion or a runner restart. Terminal output replay is bounded, and unattended output does not extend the one-hour inactivity timeout.

Java and database exercises retain the file editor and noninteractive command terminal: Enter runs, Shift+Enter adds an indented line. Commands have a ten-second limit (Spring checks: 45 seconds). The editor preserves indentation and supports Tab/Shift+Tab on selections. Interactive database prompts are not supported there; use `psql -c` or `psql -f`.

The curriculum contains **142 coding tasks across 30 labs**, including 9 real Spring/Spring Boot exercises. See [roadmap coverage](CURRICULUM.md) for the SQL/Linux progression and its environment boundaries. There are no new basic SQL syntax or standalone DDL chapters. Existing advanced administration/function exercises still use SQL object definitions where their actual topic requires them.

After pulling these changes, stop the local Node runner, run `npm run setup:labs`, then `npm start` and reload the app. Spring dependencies are resolved once from Maven Central during the Docker image build; exercise containers remain offline. The runtime includes Spring Boot 3.5.16, Spring MVC, Validation, Data JPA, JDBC, Security, Spring Test and H2, using Spring's dependency management. Maven and its download cache stay in the build stage, not the final image. The browser has no Spring download or new production npm dependency.

Spring sources use package `lab`. Check answer compiles all editable sources plus the supplied application fixture against `/opt/spring/lib/*`, then runs framework-based verification. For manual compilation, use `javac -parameters -d . *.java`; the image supplies the library classpath. Spring checks allow 45 seconds; ordinary terminal commands remain capped at 10 seconds. The lab database is H2 for fast, isolated persistence/transaction tests; the SQL track uses real PostgreSQL.

## Where it runs

- **Local URL:** complete app with Docker execution.
- **GitHub Pages:** catalog, lesson instructions, editor drafts, progress and the SQLite playground. It cannot run Docker processes. The hosted page explains how to start the local environment; it does not reach into localhost automatically.
- **Progress:** SQLite bytes saved to IndexedDB in the current browser origin. GitHub Pages and localhost have separate progress. Export/import a SQLite backup under Settings to transfer practical exercise records. Legacy quiz records are retained in the database but do not count toward the new tasks.

## Isolation and access

The Node runner binds to 127.0.0.1. Its API requires a per-process token obtained through a same-origin browser request, rejects cross-origin requests and unexpected Host headers, accepts bounded JSON bodies, and does not enable CORS. It is a personal development service; do not expose the port publicly.

Docker is invoked using Node argument arrays, never a host shell. Shell text executes only in a disposable container. Standard Java/Linux/PostgreSQL containers have no host bind mounts, no network, dropped capabilities, no-new-privileges, CPU/memory/PID limits and a read-only root filesystem with bounded writable tmpfs directories. The Java verifier is written outside the learner-writable workspace. Containers do not receive host environment variables or Git credentials.

Java exercises share one runtime with separate workspace and compiled-output directories. PostgreSQL exercises share one runtime with separate databases, restricted logins and passwords; cross-database access is revoked. The cluster-role management exercise keeps its own container because roles are cluster-wide. Linux and Oracle also retain dedicated containers. Passing removes only the exercise files and database from a shared runtime, while dedicated containers are deleted. Shared runtimes expire after one hour without activity in any of their exercises; dedicated containers expire after one idle hour. These are personal workspaces, not isolation boundaries between mutually untrusted users. Resetting an answer preserves other files and database state. Ctrl+C stops the runner without deleting active containers. A local registry reconnects them after restart. Idle cleanup runs once per minute while the runner is running and resumes on restart. Docker is isolation for personal practice, not a hardened multi-tenant hostile-code platform. Keep Docker and its VM updated.

## Oracle (optional)

The standard image setup does **not** download Oracle. If your Docker VM has at least 3 GB of spare memory and several GB of disk, obtain Oracle's official Database Free image after reviewing its requirements:

```sh
docker pull container-registry.oracle.com/database/free:latest
```

Then start an Oracle lab in DevLab. Initial database setup can take several minutes. The runner uses SQL\*Plus and FREEPDB1. Oracle needs a writable container filesystem and a higher memory limit than the standard labs. It still has no network or host-folder mounts. Registry authentication or license acceptance, if requested by Oracle, must be completed directly by you. This optional environment has not been validated on this computer; Java/Linux/PostgreSQL have dedicated integration tests.

## Checks

```sh
npm test
npm run test:docker
```

The unit suite checks task data, storage/backup behavior, rendered screen paths and API access boundaries. The Docker suite executes every standard starter and reference solution: starters must fail, reference solutions must pass. It also checks isolation settings, verifier write protection and answer reset and idle cleanup. `npm run test:docker` requires Docker and setup images. GitHub CI builds these images and runs both suites.

## Modules

- `curriculum.js`: tasks, seeded data and verification requirements.
- `content.js`: curriculum export contract.
- `runner/docker.js`: bounded Docker process execution.
- `runner/sessions.js`: container lifecycle, files, command execution and task checks.
- `runner/http.js`: local API security and dispatch.
- `runner/server.js`: static files and loopback server.
- `src/services/runner.js`: browser API client.
- `src/views/workspace.js`: shared missions and Java/database editor UI.
- `src/views/linux-workspace.js`: terminal-first Linux submissions.
- `src/services/interactive-terminal.js`: lazily loaded xterm.js connection and resizing.
- `runner/terminals.js`: authenticated WebSocket sessions and bounded terminal replay.
- `runner/terminal-engine.js`: local Docker PTY transport.
- `database.js`: browser SQLite persistence and validated backup import.

The Node runner uses one production npm dependency: the official `ws` WebSocket library, pinned to 8.22.0. Browser terminal assets come from official `@xterm/xterm` 6.0.0 and its first-party `@xterm/addon-fit` 0.11.0; they are vendored with their licenses and loaded only for Linux exercises. Regenerate them with `npm run vendor:terminal` after an intentional version update. No CDN resources are used. Browser SQLite uses vendored sql.js JavaScript/WASM. xterm packages, sql.js, Prettier and fake-indexeddb are development dependencies; no API keys or cloud accounts are needed.

The interactive terminal reaches only its assigned Linux container as UID 1000. The browser never receives the Docker socket. The runner uses Docker's official Exec API through a local Unix socket or Windows named pipe; remote TCP/SSH Docker contexts are unsupported. WebSocket upgrades require an exact localhost Host/Origin match and an authenticated, single-use ticket expiring after 30 seconds. Input, replay and socket buffers are bounded, compression is disabled, and checking rejects an active foreground command/editor. Idle cleanup and pass deletion retain the existing container lifecycle. Reset restores only notes.sh, not unrelated files or the shell history.

## Progressive paths

The Learning paths screen recommends the next unfinished exercise without locking other exercises. Each exercise shows prerequisites and the skills it introduces. Existing exercise IDs and progress remain valid.

New Java stages develop one incident-processing service: validated inputs → parsing → overflow-safe aggregation → immutable snapshots → deterministic algorithms → bounded retries → idempotency → concurrency → authorization → workflow rules → redaction → service capstone. Later starters include only signatures for previous helpers; reuse your own earlier implementations, and internal verifiers rerun earlier requirements. Learners reuse those helpers and extend their code; this is scaffold reuse rather than automatic copying of previous personal submissions.

Linux advances from basic files and permissions to service error aggregation, trace correlation, idempotent report scripts and verified incident bundles. Intermediate fixture files contain reference outputs from earlier tasks. PostgreSQL advances from functions to row-locked transfers, idempotent request records, atomic failure behavior, reconciliation and index inspection. Earlier reference functions are preinstalled in the next fixture.

The curriculum emphasizes production-oriented backend and support skills. No CV, personal information or source career documents are stored in the repository.

### Multi-file design pattern labs

The Design patterns in production stage adds nine exercises: Singleton, Strategy, Simple Factory, Observer, Adapter, Decorator, Command, Builder and an integrated checkout capstone. Each includes real-world constraints, failure cases and interview discussion prompts. File tabs edit separate Java sources; Check answer saves and compiles every exercise source together. Reset restores all answer files and keeps the container. Drafts persist as one versioned multi-file record; existing single-file drafts still load. Interfaces and method stubs are editable and verified through their callers. These labs teach tradeoffs as well as implementations; local observers and command undo do not pretend to provide distributed delivery or transactions.

### Scenario missions and Java roadmap

Missions introduce a concrete problem, then an explicit Your goal statement names the code, query or shell result to deliver. Separate acceptance criteria define the exact rules. Concept notes are optional, examples are shown where useful, and direct shell drills stay concise. Existing IDs and saved answers are preserved.

The Java path now begins with 20 exercises covering the Basics of OOP, More about OOP and Collections sections of [the Java roadmap](https://roadmap.sh/java) ([topic diagram](https://roadmap.sh/pdfs/roadmaps/java.pdf)).

| Chapter              | Exercises | Coverage                                                                                                                                                             |
| -------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open the repair shop | 5         | Classes, objects, attributes, methods, access, static, final, nested classes, packages                                                                               |
| Grow the workshop    | 8         | Inheritance, abstraction, interfaces, overloading, overriding, binding, chaining, enums, records, object lifecycle, initializer blocks, encapsulation, pass-by-value |
| Run the busy counter | 7         | Array vs ArrayList, Set, Map, Queue, Deque/Stack, Iterator, generic collections                                                                                      |

All new tasks use minimal signatures/TODOs and real JDK verification. Runtime checks verify observable behavior and selected reflection-visible structure. Instructions also request implementation techniques such as Iterator.remove; behavioral tests alone do not prove every internal technique. The package exercise uses flat source files with package declarations; javac -d creates the package directories in the disposable compilation output.

### More SOLID, design patterns and operations practice

Five SOLID labs cover SRP, OCP, LSP, ISP and DIP through multi-file contracts, injected test doubles, rejection paths and observable side effects. Seven further pattern labs cover Template Method, Chain of Responsibility, Composite, protection/caching Proxy, State, Memento and Abstract Factory.

Twelve Linux labs add paths with spaces, hard/symbolic links, CSV pipelines, environment defaults, shell conditions, find, umask, setgid, process signals, log rotation, archive restore and disk reports. Six PostgreSQL labs add metadata inspection, data constraints, limited reporting roles, atomic stock reservations, composite indexes and bounded retention. The PostgreSQL labs use real PostgreSQL-specific commands; the optional Oracle exercises remain a separate environment.

Each exercise includes a concrete example result as well as its scenario, goal and exact acceptance criteria. Fresh Linux fixtures are prepared once per new container; reconnecting does not rerun preparation. Privileges remain limited to the disposable container. SQL DDL checks use per-task answer cleanup inside a transaction that rolls back, including failed validation; Reset lab still resets only the answer.

The pool registry is versioned and written with owner-only permissions where supported by the host filesystem; Windows access follows its directory ACLs. PostgreSQL administrator credentials are never returned by the API or passed to learner commands. Protected in-container manifests support reconnection if the registry is lost. Existing dedicated workspaces from older releases are kept until they pass or expire, preserving unfinished work. A runner restart waits for recovery before accepting API operations.

### Browser code editor

Java, Spring and SQL exercises use Microsoft's MIT-licensed Monaco Editor with Java/SQL highlighting, two-space indentation, bracket matching, folding, find/replace and multiple cursors. File models retain their undo history while switching tabs. Draft persistence and Docker verification use the existing workflow; Linux keeps its interactive terminal. A plain textarea remains available if editor assets cannot load. Java semantic completion and inline compiler diagnostics require a separate language server and are not included.

The editor loads on demand from committed, self-hosted assets. Regenerate them with `npm run vendor:editor`; the build includes only the editor features and languages used here. Monaco's vendored DOMPurify is replaced at bundle time with the pinned patched npm dependency; licenses ship with the assets.

After updating to Vim, run `npm run setup:labs` to rebuild the local image. Existing exercise containers and answers are preserved; containers created with the older image may lack Vim and are not replaced automatically. New containers use Vim once the updated image is built.

### Saving exercise answers

Every exercise has a **Save state** button. Java and SQL source files also autosave while typing and restore when reopened. Linux answer files autosave after commands finish and before checking; save and leave Vim first. Reused containers keep their current files; a fresh container restores the saved Linux files from this browser. **Reset notes.sh** updates that saved file without erasing other saved Linux files.

Linux saves cover files and directories under `/workspace`, including permissions and links that stay within that workspace. The limits are 200 entries, 64 KB per file and 512 KB total; failures leave the previous saved answer intact and show an error. Runner metadata is excluded. Running processes, shell sessions, unsaved editor buffers, file ownership and database changes are not saved. Answers belong to the current browser origin and are included in the existing progress backup; clearing browser storage removes them unless backed up. Containers still expire after one idle hour.

### Advanced progression: two challenges per concept

The original 142 exercises keep their IDs, answers and completion records. Three additional advanced stages add **196 exercises in 98 concept groups**: 116 Java challenges, 40 PostgreSQL challenges, 2 optional Oracle challenges and 38 Linux challenges. Every group has exactly two questions with explicit prerequisites. Each Java challenge has one new method to complete. Only genuinely reused earlier helpers are included, already implemented; unrelated prerequisite files and tests are omitted. The workspace's topic selector jumps directly to a concept pair, and catalog search includes advanced concept names.

Java pairs cover object ownership and encapsulation, static/final/nested/package boundaries, inheritance, interfaces and binding, fluent APIs, enums/records/lifecycle/references, all five SOLID principles, fifteen individual design-pattern groups, collections/generics, binary-search/frequency/window algorithms, parsing, normalization, retry/idempotency/atomic claims, diagnostic redaction, and all nine existing Spring topics. SQL pairs cover joins through recursive/window analytics, safe dynamic SQL, procedural branching/cursors, atomic mutations, metadata, constraints, grants, indexes and retention. Linux pairs cover reliable shell/text/file tools and administrative diagnosis using the existing Docker configuration labs. The final SQL pair uses the optional Oracle image for stored PL/SQL functions, application exceptions and cursor aggregation; it is separate from the 40 PostgreSQL challenges.

Run `node scripts/test-curriculum.mjs java-a`, `java-b`, `ops`, or `collections` for the new Docker exercise suites; `legacy` runs the original cases. CI uses these independent suites to keep the expanded curriculum within bounded job times. Every executable exercise is checked by rejecting its starter and accepting its reference solution. Behavioral tests do not prove all implementation techniques or asymptotic complexity; these remain explicit acceptance/interview requirements.

## Linux interview practice

The **Linux administration · interview practice** course adds 32 challenges
across 16 topics. Thirteen are terminal tasks with executable checks; nineteen
are automatically checked short-answer questions about Linux commands and concepts.
Existing coding exercises retain their IDs and behavior.

Short-answer questions work on GitHub Pages without Docker. Each scenario asks
for one specific command, path, value or ordered sequence. **Check answer**
automatically accepts the defined correct forms and rejects incorrect answers.
Commands are compared as tokens and are never executed. Questions explicitly
state required tools/options; accepted signal aliases and independent ss flag
orders are supported. This is bounded answer matching, not a general shell
semantic evaluator.

Answers and results save in the browser and are included in progress backups.
Editing or resetting a short answer clears its current result. Previous
self-reviewed answer text remains available, but old self-reviews do not count
as automatically checked passes. Terminal lab completion behaves as before.

The terminal tasks require the local runner and Docker. They cover filesystem
layout, redirection, permissions, links, service and security configuration,
shell scope, safe copying, atomic backups and locking. Administrative
configuration tasks use workspace fixtures rather than changing the host.

Reference documentation: [Linux filesystem hierarchy](https://man7.org/linux/man-pages/man7/file-hierarchy.7.html),
[Bash manual](https://www.gnu.org/software/bash/manual/bash.html),
[systemd manuals](https://www.freedesktop.org/software/systemd/man/latest/),
and [OpenSSH server configuration](https://www.openssh.com/manual.html).

## Topic groups

The library organizes all 616 exercises into 17 groups: six Java, six Linux
and five SQL. Each group combines related initial practice, advanced challenge
pairs and relevant Linux short-answer questions. SOLID has one section per
principle; patterns have sections such as Singleton, Strategy and Observer.

Open a group to browse its sections. The exercise selector and Previous/Next
buttons follow that group's order, including exercises from different original
courses. Progress and resume links use the same group structure.

Grouping is a presentation layer. Original exercise IDs, URLs, runner contracts,
saved drafts and completion records remain unchanged. Oracle stays in an
explicitly optional group. Group membership and shared topic labels are defined
in `src/learning-groups.js`.

## Java interview theory

80 short-answer questions add two questions for each of 40 concepts across the
six Java groups: language and OOP, collections, SOLID, patterns, concurrency and
Spring. Each question has explicit accepted answers and automatic right/wrong
feedback. Output questions include their code; no Java runtime is needed to
submit an answer. Names and defined aliases are accepted; printed output remains
case-sensitive. Existing coding exercises are unchanged.

Run `npm run test:java-theory` to independently compile and execute the 20 output
examples using the local Java 21 Docker image. Unit tests cover every accepted
answer, rejection of incorrect input, grouping and stable earlier IDs.

## String coding exercises

24 Java coding exercises form 12 pairs inside **OOP & Java language → Strings &
text processing**. Topics cover whitespace and case, indexes, slicing, literal
and regex replacements, split/join, StringBuilder edits, formatting, comparison,
Unicode boundaries, lines/repeat and combined text-processing missions.

Each task contains minimal starter code, explicit requirements and Java 21
runtime checks. The final pair combines earlier techniques for canonical tags
and query-value redaction. Method usage is requested in the contract; runtime
tests verify behavior rather than proving which equivalent APIs were used.

Run `node --test --test-name-pattern=hands-java-strings: tests/docker.integration.js`
to check that each starter fails and each reference solution passes.

## Reading server and database health reports

42 automatically checked output questions add 20 Linux checks and 22 SQL checks
(12 PostgreSQL and 10 Oracle). Each shows clearly labelled illustrative command
or query output with definite questions about rows, units, thresholds or simple
calculations. No live machine, Docker or database access is required.

Linux topics cover df, du, top, free, uptime, vmstat, iostat, inodes, sockets and
service state. PostgreSQL covers tablespace/relation sizes, connections, blocking,
vacuum statistics and replication positions. Oracle covers tablespace usage,
autoextend, temporary space, undo and blocking sessions.

Questions are integrated into the relevant topic groups. Numeric answers accept
equivalent decimal forms; percentage questions also accept an optional % suffix.
Other units must follow the prompt. Existing answer formats and exercises remain
unchanged. These snapshots teach interpretation; they do not inspect the host or
claim a single metric proves a particular fault.

## Exercise brief

The instructions panel contains four sections only: Mission (scenario and goal
together), Sample input and output, What I’m learning, and Acceptance criteria.
Advanced Java examples describe concrete inputs/results rather than displaying
test assertions. The original runner contracts and progress IDs are unchanged.

Hints, reference solutions, completion and runtime information live beside the
workspace controls. Short-answer questions show the sample input and required
output format without revealing the correct answer before checking/reveal.

### Collections and algorithms method progression

An additional **100 Java coding exercises in 50 topic pairs** cover practical collection APIs and core/intermediate algorithms. These include ArrayList editing, value versus index removal, bulk filters, transformations, backed ranges, snapshots and capacity; sorted and concurrent collections; streams; sorting, searching, windows, backtracking, linked structures, trees, graphs, union-find, dynamic programming, greedy intervals, bits and matrices.

See [the method and algorithm coverage checklist](COLLECTIONS_ALGORITHMS.md) for every pair, when to use it and expected costs. The new exercises appear in Collections & algorithms and preserve all earlier exercise IDs. Run `node scripts/test-curriculum.mjs collections` to reject every new starter and accept every reference solution using the actual Docker runner. No additional runtime library is required. Restart a running local lab runner after updating so it loads the new exercise definitions.

### Clear mission briefs

Missions describe the situation, supplied inputs and expected result in plain language. Implementation rules remain in Acceptance criteria. Java missions and procedural SQL scenarios describe the result in everyday language rather than copying method signatures into the story. Advanced Java questions explicitly identify Challenge.java as the answer file. Relevant supporting classes and any reused earlier method are supplied complete; independent questions do not carry unrelated files such as DayPlan into batching.

Existing exercise IDs and saved answer records are retained. Legacy multi-file drafts show only files belonging to the current question. After updating, restart the local lab server and refresh the page. Reset lab loads the revised starter if you want to replace an older draft; your saved code is not automatically rewritten. Reused Java containers refresh their internal checks without deleting answer files or restarting the container.

### Mission review and class responsibilities

A further 95 mission descriptions clarify supplied capacities, range endpoints, return values and the expected business behavior, including all nine introductory Spring exercises. Missions distinguish a worked example from values supplied on each call. The Java mission panel also explains every custom class, interface, record and enum in the exercise files, including nested types. Roles reflect the current exercise: shipping Checkout and payment Checkout have different explanations. Relevant advanced supporting files remain ready to use, and unrelated files are not reintroduced.

This is a content and mission-display update; answer contracts, test cases and saved exercise IDs are unchanged.
