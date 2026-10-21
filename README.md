# DevLab

A lightweight, static learning workspace for Java, Linux, and SQL. Vanilla JavaScript ES modules and CSS, with SQLite compiled to WebAssembly by sql.js. No account, cloud backend, telemetry, or runtime CDN dependency is required.

## Run

Requires Node.js 20 or newer for development tools only.

```sh
npm ci
npm start
# http://127.0.0.1:5173
npm test
```

The application is static and has no build step. Commit the bundled vendor files so GitHub Pages can serve them without installing packages. Do not open index.html through file://: WebAssembly, modules and workers need HTTP.

## Learning modes

- **Java:** DSA, complexity, SOLID, architecture and design-pattern concept questions; guided code structure checks. No JVM, compilation, or Java execution is included. Structure checks are scaffolding and do not prove correctness for arbitrary code.
- **Linux:** virtual filesystem, supported shell commands, simulated service administration and resource snapshots. Does not access the host machine. Type `help` in a lab for supported commands.
- **SQL:** real SQLite queries with joins, grouping and windows. Each run starts a fresh worker with seeded employees/departments tables. Multiple statements in one run share that database; runs do not share state.
- **Oracle PL/SQL / PostgreSQL PL/pgSQL:** dialect-specific concept questions and guided syntax exercises. SQLite cannot execute these procedural languages.

Eight labs contain 32 exercises. These are focused practice introductions rather than exhaustive courses.

## Architecture

The router composes views and small services. UI code has no direct SQL storage queries. SQLite persistence and exercise SQL execution use separate databases: learner SQL cannot read or modify progress. Java code is never evaluated as JavaScript. Linux simulation has no OS bridge. Shared HTML helpers escape user text before insertion.

Database export/import supports transferring exercise progress between browsers. SQLite bytes are saved to IndexedDB after each update. Clearing site data or using private browsing can remove progress; use Settings → Export SQLite backup regularly. Import validates a DevLab progress table and copies records into the application's own schema rather than adopting untrusted database schema. Import replaces exercise records and preserves the current profile and playground draft.

No credentials belong in this repository. The app has no Supabase integration. SQLite runs locally, so there is no server-side database or cross-device sync. SQL workers are terminated after three seconds; displayed results are capped at 100 rows per statement. This is resource isolation for a personal practice tool, not a hosted multi-tenant execution service.

## GitHub Pages

Repository: https://github.com/afifanshuri/devlab

In repository Settings → Pages, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then Save. The `.nojekyll` file ensures plain static hosting. Hash routing and relative asset paths support the repository subpath without a custom 404 page. Expected site URL: https://afifanshuri.github.io/devlab/ (verify after Pages finishes publishing).

The CI workflow runs meaningful engine/curriculum checks on push and pull requests. The app itself does not need npm in production. Runtime assets are pinned at sql.js 1.14.1 with the upstream license under `vendor/SQLJS-LICENSE.txt`.

## Verification

Run `npm test` for simulator goals, negative cases, curriculum solutions, real SQLite query outputs, and backup data round trips. Browser checks should cover filters, a wrong and right answer, draft persistence, page reload, SQL execution, backup export/import, and narrow viewport navigation. After publishing repeat the core checks on the actual GitHub Pages URL; a passing local test is not a deployment verification.

### Source map

- `app.js`: startup and hash routing.
- `content.js`: curriculum data, independent of UI and persistence.
- `database.js`: SQLite persistence facade and validated backups.
- `linux.js`: deterministic virtual Linux environment.
- `sql-worker.js`: disposable SQLite execution environment.
- `src/services`: pure checking rules and bounded worker client.
- `src/ui.js`: escaped text, shared layout, icons and notifications.
- `src/views`: focused catalog, lab, progress, settings and playground views.
- `tests`: engine, curriculum, storage and security regression checks.

The modules favor composition and small contracts over unnecessary class hierarchies. Adding lesson data does not require editing storage or the router. A new execution engine can implement the SQL service contract independently of the views.
