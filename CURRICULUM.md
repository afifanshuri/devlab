# Curriculum progression

The missions use original scenarios and explicit outcomes. These roadmaps organize topic selection; individual exercises combine related concepts rather than repeating every diagram box as a separate drill.

## SQL

Based on [roadmap.sh/sql](https://roadmap.sh/sql). Basic SQL syntax and standalone DDL lessons are excluded. Existing tables, keys and sample data are supplied automatically. New query exercises accept a single SELECT/WITH query; the runner wraps it for verification, so learners do not have to create result views.

| Stage | Practice |
| --- | --- |
| Relational problem solving | Inclusive joins, aggregation/HAVING, NULL handling, correlated subqueries, self joins, set difference, strings |
| Analytics | Explicit window frames, running totals, LAG, ranking/ties, recursive CTEs, conditional pivot and lateral unpivot, dates/rounding, full joins |
| Database programming | Allow-listed dynamic identifiers, injection rejection, UPDATE RETURNING, explicit error contracts |
| Existing application labs | PL/pgSQL branches/cursors, atomic transfers, duplicate-request safety, reporting, constraints, indexes/query plans, roles and permissions, backup/restore |
| Optional Oracle | Real Oracle PL/SQL branches and loops; requires a separate Oracle image |

The new problems reuse customer/order/staff schemas. Quiet customers must survive later reports; paid/cancelled distinctions carry into windows and analytics. Hierarchy and dynamic-sort tests include deeper rows and hostile input. Validation rolls back its database changes. Transactions and administrative exercises remain available because they teach application correctness and operations, rather than introductory CREATE/ALTER/DROP syntax. PostgreSQL is the main executable dialect; Oracle-only syntax is not presented as portable PostgreSQL.

## Linux

Based on [roadmap.sh/linux](https://roadmap.sh/linux).

| Stage | Practice |
| --- | --- |
| Existing foundations | Navigation, files/paths, links, permissions, grep/find, sorting, archives, conditions and repeatable scripts |
| Shell tools and automation | Environment/defaults, PATH-independent scripts, stdout/stderr and exit codes, comm/join/awk pipelines, targeted signals, live process/memory/disk evidence |
| Existing operations | umask/setgid, process management, log correlation, permissions, integrity checks and backups |
| Administration and diagnosis | systemd service files, account audit, resolver/route evidence, APT plans, fstab, inode exhaustion, SSH policy, cron, cgroup OOMs, longest-prefix routing, boot/LVM evidence and Docker limits |

Live tasks run normal Linux commands in disposable restricted containers. Administrative configuration tasks write **reviewable workspace files**. They do not install packages, change real users, mount/partition disks, operate the host's systemd, edit its bootloader, change host networking or run nested Docker. The mission explicitly identifies fixture-based diagnosis. Full boot, partition/LVM creation, firewall/DHCP deployment and live SSH administration require an appropriate VM; these tasks practise the relevant reasoning/configuration without claiming to execute those privileged operations. The workspace is mounted noexec; run authored shell scripts with `bash`, even when their executable mode bits are set.

Linux missions now use interactive Bash and Vim through xterm.js. Create and inspect the mission's files directly, then submit their resulting state. Scripting missions may also run your saved script against their defined cases; the runner does not replay a general answer script before every check.

## Spring and Spring Boot

Continue after OOP, collections, SOLID and design patterns. Uses the real libraries described in the [Spring Boot documentation](https://docs.spring.io/spring-boot/3.5/index.html), not annotation-shaped substitutes.

1. Constructor injection and explicit bean configuration; substitute a fake payment gateway.
2. Singleton/prototype scopes; prevent customer draft state from being shared.
3. Boot configuration properties; bind different deployments without hard-coding.
4. Profiles; select demo/production adapters safely.
5. MVC request mapping/path variables/JSON/status codes; verify with MockMvc.
6. Jakarta validation and controller advice; predictable client errors.
7. Boot auto-configuration, generated JPA identities and derived repository finders.
8. Proxied declarative transactions; roll back partial transfers and error paths.
9. Method security; enforce authorization after context changes and for anonymous callers.

Only required public contracts and TODOs are supplied. Application bootstrap is infrastructure, supplied as `LabApplication.java` for persistence tasks and inspectable in the terminal. Reference solutions remain behind the existing explicit action. MockMvc runs HTTP behavior without opening a public server. Persistence tests use local H2; production database behavior remains a separate PostgreSQL topic.

## Advanced concept pairs

The appended Java, PostgreSQL and Linux stages add two questions per named advanced concept group. Original exercises and IDs remain available. Challenge 1 focuses on a production boundary; challenge 2 composes it into a batch, recovery or reporting scenario. Exact signatures, failure policies and input/output contracts are shown in each mission. The advanced topic selector avoids stepping through unrelated pairs.
