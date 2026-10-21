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
- Linux: write commands in `notes.sh`. **Check answer** runs that script and checks the resulting state.
- PostgreSQL: save `solution.sql`; run `psql -U postgres -d lab -f solution.sql` or `psql -U postgres -d lab -c 'SELECT * FROM employees;'`.
- Click **Check answer** to validate real output, Java assertions, SQL results, or filesystem state. It does not automatically solve Linux tasks.
- Drafts are saved when checking an answer or navigating. Reconnecting restores the existing answer file if you have not edited the draft. **Reset lab** restores the starter answer in the editor and existing container without recreating the container.

The terminal runs noninteractive commands one at a time, with a ten-second limit. It is not a full PTY: vim/nano, interactive prompts and interactive psql are not supported. Use the file editor, heredocs, or command flags. `cd` persists between commands within a session.

The curriculum contains 99 coding tasks across twenty-three labs: Java DSA, SOLID, strategy/observer patterns; Linux navigation, text filtering, permissions and backups; PostgreSQL views, windows, PL/pgSQL branches and cursors; and two optional Oracle PL/SQL tasks.

## Where it runs

- **Local URL:** complete app with Docker execution.
- **GitHub Pages:** catalog, lesson instructions, editor drafts, progress and the SQLite playground. It cannot run Docker processes. The hosted page explains how to start the local environment; it does not reach into localhost automatically.
- **Progress:** SQLite bytes saved to IndexedDB in the current browser origin. GitHub Pages and localhost have separate progress. Export/import a SQLite backup under Settings to transfer practical exercise records. Legacy quiz records are retained in the database but do not count toward the new tasks.

## Isolation and access

The Node runner binds to 127.0.0.1. Its API requires a per-process token obtained through a same-origin browser request, rejects cross-origin requests and unexpected Host headers, accepts bounded JSON bodies, and does not enable CORS. It is a personal development service; do not expose the port publicly.

Docker is invoked using Node argument arrays, never a host shell. Shell text executes only in a disposable container. Standard Java/Linux/PostgreSQL containers have no host bind mounts, no network, dropped capabilities, no-new-privileges, CPU/memory/PID limits and a read-only root filesystem with bounded writable tmpfs directories. The Java verifier is written outside the learner-writable workspace. Containers do not receive host environment variables or Git credentials.

Each exercise reuses its own container across checks and navigation. A passing answer deletes its container. Otherwise containers expire after one hour without runner activity. Resetting an answer preserves other files and database state. Ctrl+C stops the runner without deleting active containers. A local registry reconnects them after restart. Idle cleanup runs once per minute while the runner is running and resumes on restart. Docker is isolation for personal practice, not a hardened multi-tenant hostile-code platform. Keep Docker and its VM updated.

## Oracle (optional)

The standard image setup does **not** download Oracle. If your Docker VM has at least 3 GB of spare memory and several GB of disk, obtain Oracle's official Database Free image after reviewing its requirements:

```sh
docker pull container-registry.oracle.com/database/free:latest
```

Then start an Oracle lab in DevLab. Initial database setup can take several minutes. The runner uses SQL*Plus and FREEPDB1. Oracle needs a writable container filesystem and a higher memory limit than the standard labs. It still has no network or host-folder mounts. Registry authentication or license acceptance, if requested by Oracle, must be completed directly by you. This optional environment has not been validated on this computer; Java/Linux/PostgreSQL have dedicated integration tests.

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
- `src/views/workspace.js`: editor and command-terminal UI.
- `database.js`: browser SQLite persistence and validated backup import.

The Node runner has no production npm dependencies. Browser SQLite uses the required vendored sql.js JavaScript/WASM files and their license. The pinned sql.js npm package is used only by tests; Prettier and fake-indexeddb are also development-only tools. No API keys or cloud service accounts are needed.

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

| Chapter | Exercises | Coverage |
| --- | --- | --- |
| Open the repair shop | 5 | Classes, objects, attributes, methods, access, static, final, nested classes, packages |
| Grow the workshop | 8 | Inheritance, abstraction, interfaces, overloading, overriding, binding, chaining, enums, records, object lifecycle, initializer blocks, encapsulation, pass-by-value |
| Run the busy counter | 7 | Array vs ArrayList, Set, Map, Queue, Deque/Stack, Iterator, generic collections |

All new tasks use minimal signatures/TODOs and real JDK verification. Runtime checks verify observable behavior and selected reflection-visible structure. Instructions also request implementation techniques such as Iterator.remove; behavioral tests alone do not prove every internal technique. The package exercise uses flat source files with package declarations; javac -d creates the package directories in the disposable compilation output.

### More SOLID, design patterns and operations practice

Five SOLID labs cover SRP, OCP, LSP, ISP and DIP through multi-file contracts, injected test doubles, rejection paths and observable side effects. Seven further pattern labs cover Template Method, Chain of Responsibility, Composite, protection/caching Proxy, State, Memento and Abstract Factory.

Twelve Linux labs add paths with spaces, hard/symbolic links, CSV pipelines, environment defaults, shell conditions, find, umask, setgid, process signals, log rotation, archive restore and disk reports. Six PostgreSQL labs add metadata inspection, data constraints, limited reporting roles, atomic stock reservations, composite indexes and bounded retention. The PostgreSQL labs use real PostgreSQL-specific commands; the optional Oracle exercises remain a separate environment.

Each exercise includes a concrete example result as well as its scenario, goal and exact acceptance criteria. Fresh Linux fixtures are prepared once per new container; reconnecting does not rerun preparation. Privileges remain limited to the disposable container. SQL DDL checks use per-task answer cleanup inside a transaction that rolls back, including failed validation; Reset lab still resets only the answer.
