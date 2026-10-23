import { make } from "./exercise-factories.js";

const banks = { linux: [], postgres: [], oracle: [] };
const question = (
  goal,
  answer,
  explanation,
  answerFormat = "number",
  answerUnit,
) => ({
  goal,
  answers: [String(answer)],
  explanation,
  answerFormat,
  answerUnit,
});
function pair(
  bank,
  learningGroup,
  topic,
  outputSource,
  sampleOutput,
  first,
  second,
) {
  banks[bank].push({
    learningGroup,
    topic,
    outputSource,
    sampleOutput,
    questions: [first, second],
  });
}

pair(
  "linux",
  "linux-recovery",
  "Filesystem capacity · df -h",
  "Linux: df -h (illustrative snapshot)",
  `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       100G   92G    8G  92% /
/dev/sdb1       200G   80G  120G  40% /var
/dev/sdc1       500G  475G   25G  95% /archive`,
  question(
    "What is the reported Use% of the filesystem mounted on '/'? Enter the number, optionally followed by %.",
    92,
    "Read the '/' row's Use% column: 92%. Do not substitute its Size, Used or Avail field.",
    "number",
    "percent",
  ),
  question(
    "Which listed mount point has the highest reported Use%? Enter only its absolute mount path.",
    "/archive",
    "The /archive row has the highest reported value, 95%.",
    "path",
  ),
);
pair(
  "linux",
  "linux-recovery",
  "Directory usage · du",
  "Linux: du -h --max-depth=1 /var (illustrative snapshot; G uses powers of 1024)",
  `14G   /var/log
3.0G  /var/cache
1.0G  /var/tmp
18G   /var`,
  question(
    "Among the three immediate subdirectories shown, which uses the most disk space? Enter its absolute directory path, excluding the /var total row.",
    "/var/log",
    "The immediate subdirectory /var/log is 14G. /var is the parent total and is not another child directory.",
    "path",
  ),
  question(
    "How many GiB does the /var total row report? Enter only the number; do not add the child rows to their parent total.",
    18,
    "The final row already reports the total, 18G. Adding it to its child rows would double-count their usage.",
  ),
);
pair(
  "linux",
  "linux-processes",
  "CPU and processes · top",
  "Linux: top (illustrative excerpt; process %CPU uses the per-core convention)",
  `%Cpu(s): 70.0 us, 10.0 sy, 0.0 ni, 12.5 id, 7.5 wa, 0.0 hi, 0.0 si, 0.0 st
  PID USER   S  %CPU %MEM COMMAND
   42 app    R 185.0 20.0 java
  143 app    R  92.0  5.0 python
  223 db     S   3.0 10.0 postgres`,
  question(
    "What CPU idle percentage does this summary report in the 'id' field? Enter the number, optionally followed by %.",
    12.5,
    "The id field is 12.5%. This is the CPU summary, not one process's %CPU.",
    "number",
    "percent",
  ),
  question(
    "Which PID has the highest process %CPU in this excerpt? Enter the PID only.",
    42,
    "PID 42 reports 185.0, the highest listed process %CPU. With the stated convention, a multithreaded process may exceed 100%.",
  ),
);
pair(
  "linux",
  "linux-processes",
  "Memory and swap · free",
  "Linux: free -m (illustrative snapshot; values are MiB)",
  `               total   used   free  shared  buff/cache  available
Mem:            8192   4096    512     256        3584       3072
Swap:           2048   1024   1024`,
  question(
    "How much available memory is reported for applications, in MiB? Enter the number only; use the available column rather than free.",
    3072,
    "The available column reports 3072 MiB. The free column is a different value, 512 MiB.",
  ),
  question(
    "How much swap is currently used in this snapshot, in MiB? Enter only the number.",
    1024,
    "The Swap row's used column is 1024 MiB. Existing swap usage alone does not establish current swapping activity.",
  ),
);
pair(
  "linux",
  "linux-processes",
  "Load average · uptime",
  "Linux: uptime followed by nproc (illustrative snapshot)",
  `10:30:00 up 12 days, 3:10, 2 users, load average: 8.00, 6.00, 5.00
$ nproc
4`,
  question(
    "What is the one-minute load average shown here? Enter only its numeric value.",
    8,
    "The first load value is the one-minute average, 8.00; the later values are five- and fifteen-minute averages.",
  ),
  question(
    "Divide the one-minute load average by the reported CPU count. What is that ratio? Enter only the number, not a percentage. This ratio is not CPU utilization.",
    2,
    "8.00 divided by 4 is 2. Linux load also includes uninterruptible tasks, so the ratio is not a CPU utilization percentage.",
  ),
);
pair(
  "linux",
  "linux-processes",
  "Run queues and swapping · vmstat",
  "Linux: vmstat 1 (one subsequent interval row, not the since-boot first report; si/so are KiB/s)",
  `procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff   cache   si   so    bi    bo   in   cs us sy id wa st
 5  2 524288 262144  65536 1048576  128  256   800  1200 1000 2000 40 10 30 20  0`,
  question(
    "What swap-out rate is reported in the 'so' column, in KiB per second? Enter the number only.",
    256,
    "The so field reports 256 KiB/s; si is the separate swap-in field.",
  ),
  question(
    "How many processes are reported in uninterruptible sleep in the 'b' column? Enter the number only.",
    2,
    "The b column is 2. The r column, 5, refers to runnable processes instead.",
  ),
);
pair(
  "linux",
  "linux-processes",
  "Device latency · iostat",
  "Linux: iostat -x 1 (illustrative subsequent-interval excerpt; await fields are milliseconds)",
  `Device  r/s   w/s  r_await w_await aqu-sz %util
sda     40.0  60.0     2.0     4.0   0.32  40.0
sdb     80.0 120.0    30.0    60.0  12.00  98.0`,
  question(
    "Which listed device has the higher average write-request wait time, w_await? Enter only the device name, without /dev/.",
    "sdb",
    "sdb reports w_await of 60.0 ms versus 4.0 ms for sda.",
    "value",
  ),
  question(
    "What %util is reported for sdb? Enter the number, optionally followed by %. Report the field rather than inferring a failure.",
    98,
    "The reported %util for sdb is 98.0. This snapshot alone does not prove a particular hardware fault or bottleneck.",
    "number",
    "percent",
  ),
);
pair(
  "linux",
  "linux-recovery",
  "Inode capacity · df -i",
  "Linux: df -i (illustrative snapshot)",
  `Filesystem     Inodes   IUsed   IFree IUse% Mounted on
/dev/sda2     1000000  200000  800000   20% /
/dev/sdb1      500000  500000       0  100% /var`,
  question(
    "Which mount point has no free inodes in this snapshot? Enter its absolute mount path only.",
    "/var",
    "The /var row has IFree=0 and IUse%=100%, regardless of any remaining data-block capacity.",
    "path",
  ),
  question(
    "How many free inodes remain on the root filesystem '/'? Enter the integer without thousands separators.",
    800000,
    "Read the root row's IFree value, 800000, rather than its total Inodes value.",
  ),
);
pair(
  "linux",
  "linux-network",
  "Listening sockets · ss",
  "Linux: ss -lntp (illustrative excerpt)",
  `State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0      128    127.0.0.1:5432     0.0.0.0:*        users:(("postgres",pid=223,fd=6))
LISTEN 0      128    0.0.0.0:8080       0.0.0.0:*        users:(("java",pid=42,fd=9))`,
  question(
    "Which TCP port is used by the displayed postgres listener? Enter only its port number.",
    5432,
    "The postgres local address is 127.0.0.1:5432, so its port is 5432.",
  ),
  question(
    "With no proxy or forwarding, can that specific postgres listener directly accept a connection to the server's external IPv4 address? Enter yes or no.",
    "no",
    "That listener is bound to the loopback address 127.0.0.1 rather than the external IPv4 address.",
    "value",
  ),
);
pair(
  "linux",
  "linux-services",
  "Service health · systemctl",
  "Linux: systemctl show shop.service -p LoadState -p ActiveState -p SubState -p Result (illustrative snapshot)",
  `LoadState=loaded
ActiveState=failed
SubState=failed
Result=exit-code`,
  question(
    "What is the unit's ActiveState in this captured output? Enter only the exact state name.",
    "failed",
    "The loaded unit is in ActiveState=failed. LoadState=loaded does not mean the service is running.",
    "value",
  ),
  question(
    "What Result value identifies the recorded service failure category? Enter only the value after Result=.",
    "exit-code",
    "The reported failure category is exit-code. This does not identify the application's underlying bug by itself.",
    "value",
  ),
);

pair(
  "postgres",
  "sql-administration",
  "PostgreSQL tablespace size",
  "PostgreSQL 17: SELECT spcname, pg_tablespace_size(oid) AS used_bytes FROM pg_tablespace WHERE spcname IN ('pg_default','fast');",
  `spcname     | used_bytes
------------+------------
pg_default  | 10737418240
fast        | 21474836480`,
  question(
    "Which displayed tablespace occupies more bytes according to pg_tablespace_size? Enter its tablespace name only.",
    "fast",
    "fast reports 21474836480 bytes, greater than pg_default's 10737418240.",
    "value",
  ),
  question(
    "Can the free capacity of the filesystem containing fast be calculated from these used_bytes values alone? Enter yes or no.",
    "no",
    "pg_tablespace_size reports tablespace disk usage, not the filesystem's total or available capacity. Obtain filesystem metrics separately.",
    "value",
  ),
);
pair(
  "postgres",
  "sql-administration",
  "PostgreSQL table and index sizes",
  "PostgreSQL 17: table-size report using pg_table_size, pg_indexes_size and pg_total_relation_size, divided by 1048576; displayed values are exact MiB for this example.",
  `relation      | table_mib | indexes_mib | total_mib
--------------+-----------+-------------+----------
public.orders |       128 |          64 |       192
public.audit  |       256 |          16 |       272`,
  question(
    "What total size, including indexes, is reported for public.orders in MiB? Enter the number only.",
    192,
    "The total_mib value is 192: table storage 128 plus index storage 64.",
  ),
  question(
    "What percentage of public.orders total_mib comes from indexes_mib? Calculate 64 / 192 × 100 and round to two decimal places. Enter the number, optionally followed by %.",
    33.33,
    "The index share of this size report is 33.33% after rounding. This is not a measure of index efficiency or bloat.",
    "number",
    "percent",
  ),
);
pair(
  "postgres",
  "sql-administration",
  "PostgreSQL connection headroom",
  "PostgreSQL 17: captured settings plus pg_stat_activity summary filtered to backend_type='client backend'. Assume no other reserved slots or connection limits.",
  `max_connections = 100
superuser_reserved_connections = 3
reserved_connections = 0

state               | client_backends
--------------------+----------------
active              | 12
idle                | 25
idle in transaction | 3
TOTAL               | 40`,
  question(
    "How many client sessions are idle in transaction in this snapshot? Enter only the number.",
    3,
    "The idle in transaction row reports 3. Ordinary idle sessions are listed separately.",
  ),
  question(
    "Using only these assumptions, how many additional ordinary client slots remain before reaching the superuser-reserved boundary? Calculate 100 − 3 − 0 − 40 and enter one integer.",
    57,
    "The simplified ordinary-slot headroom is 57. Other role, database or provider limits have explicitly been excluded from this exercise.",
  ),
);
pair(
  "postgres",
  "sql-administration",
  "PostgreSQL blocking sessions",
  "PostgreSQL 17: activity excerpt with pg_blocking_pids(pid) AS blockers. The braces denote PostgreSQL arrays; {} means no reported blockers.",
  `pid | state               | xact_age_seconds | blockers
----+---------------------+------------------+---------
501 | idle in transaction | 1800             | {}
502 | active              | 120              | {501}
503 | active              | 60               | {501}
504 | active              | 10               | {}`,
  question(
    "Which PID is directly blocking PID 502 according to its blockers array? Enter the blocker PID only.",
    501,
    "The blockers array for PID 502 contains 501.",
  ),
  question(
    "How many of the displayed sessions list PID 501 as a blocker? Enter only the count, not a termination command.",
    2,
    "PIDs 502 and 503 list 501. This identifies the listed waits; it does not authorize terminating a session.",
  ),
);
pair(
  "postgres",
  "sql-administration",
  "PostgreSQL vacuum statistics",
  "PostgreSQL 17: SELECT schemaname, relname, n_live_tup, n_dead_tup FROM pg_stat_user_tables; these tuple counts are estimates.",
  `schemaname | relname | n_live_tup | n_dead_tup
-----------+---------+------------+-----------
public     | orders  |     100000 |      50000
public     | audit   |     500000 |       1000`,
  question(
    "Which displayed table has the larger estimated dead-tuple count? Enter only its unqualified table name.",
    "orders",
    "orders has an estimated 50000 dead tuples versus audit's 1000. These are statistics estimates, not an exact physical bloat measurement.",
    "value",
  ),
  question(
    "For orders, calculate estimated dead tuples / (live + dead tuples) × 100. Round to two decimal places and enter the number, optionally followed by %.",
    33.33,
    "50000 / 150000 × 100 rounds to 33.33%. This calculation uses estimated tuple counts.",
    "number",
    "percent",
  ),
);
pair(
  "postgres",
  "sql-administration",
  "PostgreSQL replication progress",
  "PostgreSQL 17 primary: pg_stat_replication with pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes. Values are captured at one observation.",
  `application_name | state     | sync_state | replay_lag_bytes
-----------------+-----------+------------+-----------------
standby_a        | streaming | async      | 16777216
standby_b        | streaming | async      | 0`,
  question(
    "How many MiB behind the sampled primary WAL position is standby_a's replay position? Use 1 MiB = 1048576 bytes and enter the number only.",
    16,
    "16777216 / 1048576 equals 16 MiB. This position difference is bytes, not seconds.",
  ),
  question(
    "Which displayed standby has replayed through the sampled primary WAL position, according to replay_lag_bytes=0? Enter its application_name only.",
    "standby_b",
    "standby_b has zero reported byte difference at this observation. That does not guarantee future lag remains zero.",
    "value",
  ),
);

pair(
  "oracle",
  "sql-oracle",
  "Oracle tablespace usage",
  "Oracle: SELECT tablespace_name, used_space, tablespace_size, used_percent FROM dba_tablespace_usage_metrics; space columns are blocks, not bytes. USED_PERCENT uses the view's capacity definition, not necessarily current allocated datafile size.",
  `TABLESPACE_NAME USED_SPACE TABLESPACE_SIZE USED_PERCENT
--------------- ---------- --------------- ------------
USERS               917504         1048576        87.50
APPDATA            1966080         2097152        93.75
TEMP                131072         1048576        12.50`,
  question(
    "What USED_PERCENT does the USERS tablespace report? Enter the number, optionally followed by %.",
    87.5,
    "The USERS row reports 87.50%. Use the metric as reported rather than treating block counts as bytes.",
    "number",
    "percent",
  ),
  question(
    "An alert rule triggers when this view's USED_PERCENT is at least 90. Which one displayed tablespace triggers it? Enter the tablespace name only.",
    "APPDATA",
    "APPDATA reports 93.75%, meeting the stated threshold. USERS and TEMP do not.",
    "value",
  ),
);
pair(
  "oracle",
  "sql-oracle",
  "Oracle datafile autoextend",
  "Oracle: datafile report from DBA_DATA_FILES; allocated_mib=bytes/1048576 and max_mib=maxbytes/1048576. Underlying storage free space is not shown.",
  `FILE_NAME                 ALLOCATED_MIB MAX_MIB AUTOEXTENSIBLE
------------------------- ------------- ------- --------------
/u02/oradata/app01.dbf              8192   16384 YES
/u02/oradata/app02.dbf              4096       0 NO`,
  question(
    "For app01.dbf, what additional size is permitted by the configured MAX_MIB above its current allocation? Calculate max minus allocated, in MiB. Enter only the number; this is not a claim about available physical storage.",
    8192,
    "16384 − 8192 = 8192 MiB of configured growth allowance. Actual growth also depends on storage and other limits.",
  ),
  question(
    "According to the displayed AUTOEXTENSIBLE setting, will app02.dbf automatically extend without a configuration change? Enter yes or no.",
    "no",
    "app02.dbf reports AUTOEXTENSIBLE=NO.",
    "value",
  ),
);
pair(
  "oracle",
  "sql-oracle",
  "Oracle temporary space",
  "Oracle: V$TEMP_SPACE_HEADER grouped by TABLESPACE_NAME; used_mib=SUM(bytes_used)/1048576 and free_mib=SUM(bytes_free)/1048576. Read these header metrics; they are not a per-session active-sort report.",
  `TABLESPACE_NAME USED_MIB FREE_MIB
--------------- -------- --------
TEMP                1536      512`,
  question(
    "How much free space does this TEMP header report show in MiB? Enter the number only.",
    512,
    "The reported FREE_MIB is 512. It is separate from the 1536 USED_MIB value.",
  ),
  question(
    "What percentage of this reported used-plus-free space is used? Calculate 1536 / (1536 + 512) × 100. Enter the number, optionally followed by %.",
    75,
    "1536 / 2048 × 100 is 75%. This interpretation is limited to the supplied header metrics.",
    "number",
    "percent",
  ),
);
pair(
  "oracle",
  "sql-oracle",
  "Oracle undo health",
  "Oracle: V$UNDOSTAT interval excerpt, ordered by BEGIN_TIME descending. SSOLDERRCNT counts ORA-01555 occurrences; NOSPACEERRCNT counts undo-space requests with no free space.",
  `BEGIN_TIME END_TIME TUNED_UNDORETENTION SSOLDERRCNT NOSPACEERRCNT
---------- -------- ------------------- ----------- -------------
10:10      10:20                   1800           2             1
10:00      10:10                    900           0             0`,
  question(
    "How many ORA-01555 occurrences are reported in the latest displayed interval, beginning at 10:10? Enter only the count.",
    2,
    "The latest displayed interval has SSOLDERRCNT=2. These are interval statistics, not a count over all database history.",
  ),
  question(
    "How many undo-space requests found no free space in that same 10:10 interval? Enter the NOSPACEERRCNT number only.",
    1,
    "NOSPACEERRCNT is 1 for the interval beginning at 10:10.",
  ),
);
pair(
  "oracle",
  "sql-oracle",
  "Oracle blocking sessions",
  "Oracle: V$SESSION excerpt showing SID, STATUS and NVL(TO_CHAR(blocking_session),'none') AS blocker_sid. Only the three listed sessions are included.",
  `SID STATUS   BLOCKER_SID
--- -------- -----------
77  INACTIVE none
101 ACTIVE   77
102 ACTIVE   77`,
  question(
    "Which session SID is reported as blocking SID 101? Enter only the blocker SID.",
    77,
    "SID 101 reports BLOCKER_SID=77. An inactive session can still hold locks from an uncommitted transaction.",
  ),
  question(
    "How many of these displayed sessions identify SID 77 as their blocker? Enter only the count.",
    2,
    "The two displayed sessions 101 and 102 identify 77 as their blocker. The excerpt does not establish a database-wide total.",
  ),
);

function course(bank, id, track, title) {
  return make(
    id,
    track,
    title,
    "Read illustrative health-check output and enter a definite, automatically checked answer. No live server or database required.",
    ["Health checks", "Output interpretation", "Short answers"],
    banks[bank].flatMap(
      (
        { learningGroup, topic, outputSource, sampleOutput, questions },
        topicIndex,
      ) =>
        questions.map((item, i) => ({
          ...item,
          type: "written",
          engine: "written",
          healthCheck: true,
          diagnosticSystem: bank,
          learningGroup,
          section: "Health checks · " + topic,
          topic,
          questionNumber: i + 1,
          title: `${topic} · Read output ${i + 1}/2`,
          mission: `You are reviewing a captured ${bank === "linux" ? "Linux server" : bank === "postgres" ? "PostgreSQL database" : "Oracle database"} health report. Use only the displayed snapshot and the assumptions in the question; this is illustrative data, not your live environment.`,
          sampleOutput,
          outputSource,
          task: item.goal,
          requirements: [item.goal],
          concept:
            "Identify the requested row, column, unit and time window. Distinguish reported observations from conclusions that need additional evidence.",
          hint: "Match the exact row and column in the question. Keep units and any stated calculation or threshold separate from other fields.",
          learn: [topic, "Reading diagnostic output", "Units and thresholds"],
          prerequisites:
            topicIndex || i ? [`hands-${id}:${topicIndex * 2 + i - 1}`] : [],
        })),
    ),
  );
}
export const healthCourses = [
  course(
    "linux",
    "linux-health",
    "linux",
    "Linux server health · read the output",
  ),
  course(
    "postgres",
    "postgres-health",
    "sql",
    "PostgreSQL health · read the output",
  ),
  course("oracle", "oracle-health", "sql", "Oracle health · read the output"),
];
