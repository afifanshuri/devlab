import { linux, pg, make } from "./exercise-factories.js";

const imports = `import java.util.*;\nimport java.util.function.*;\nimport java.util.concurrent.*;\nimport java.util.concurrent.atomic.*;\nimport java.util.stream.*;\n`;
const steps = [
  [
    "Normalize an external identifier",
    "Canonicalize input before using it as a key. Fail early instead of spreading null handling across business logic.",
    "Implement normalize(String value): trim and uppercase with Locale.ROOT. Reject null or blank input with IllegalArgumentException.",
    "public static String normalize(String value)",
    `if(value==null || value.isBlank())throw new IllegalArgumentException("identifier required"); return value.trim().toUpperCase(Locale.ROOT);`,
    `expect(Main.normalize("  abc-1 ").equals("ABC-1")); expect(Main.normalize("i").equals("I")); boolean bad=false;try{Main.normalize("  ");}catch(IllegalArgumentException e){bad=true;}expect(bad);bad=false;try{Main.normalize(null);}catch(IllegalArgumentException e){bad=true;}expect(bad);`,
    "Use isBlank, trim, and toUpperCase(Locale.ROOT).",
    ["Input contracts", "Null and blank handling", "Locale-independent keys"],
  ],
  [
    "Parse an incident record",
    "Reuse normalization inside a parser. An explicit delimiter and strict validation make malformed input fail predictably.",
    "Implement parseRecord(String raw) for ID|quantity. Return Map.Entry<String,Integer>. Normalize ID using normalize. Quantity must be a nonnegative int. Reject missing/extra fields and invalid quantities with IllegalArgumentException.",
    "public static Map.Entry<String,Integer> parseRecord(String raw)",
    `if(raw==null)throw new IllegalArgumentException("record required"); String[] parts=raw.split(java.util.regex.Pattern.quote("|"),-1); if(parts.length!=2)throw new IllegalArgumentException("two fields required"); int n=Integer.parseInt(parts[1].trim());if(n<0)throw new IllegalArgumentException("negative quantity");return Map.entry(normalize(parts[0]),n);`,
    `expect(Main.parseRecord(" a | 2 ").equals(Map.entry("A",2)));expect(Main.parseRecord("b|0").getValue()==0);for(String input:new String[]{"a","a|1|2","a|-1","a|x","a|2147483648","|2"}){boolean bad=false;try{Main.parseRecord(input);}catch(IllegalArgumentException e){bad=true;}expect(bad);}`,
    "Split using \\| with limit -1; Integer.parseInt already throws an IllegalArgumentException subtype.",
    ["Reuse normalize", "Delimiter parsing", "Invalid input tests"],
  ],
  [
    "Aggregate records without silent overflow",
    "Compose parsing with a single-pass map reduction. Math.addExact rejects overflow rather than wrapping a counter.",
    "Implement aggregate(String[] records). Sum quantities by normalized ID, reusing parseRecord. Reject a null array. Propagate malformed-record errors and ArithmeticException on overflow. Do not modify the array.",
    "public static Map<String,Integer> aggregate(String[] records)",
    `if(records==null)throw new IllegalArgumentException("records required");Map<String,Integer> totals=new HashMap<>();for(String line:records){var entry=parseRecord(line);totals.merge(entry.getKey(),entry.getValue(),Math::addExact);}return totals;`,
    `expect(Main.aggregate(new String[]{"a|2"," A |3","b|1"}).equals(Map.of("A",5,"B",1)));expect(Main.aggregate(new String[]{}).isEmpty());boolean overflow=false;try{Main.aggregate(new String[]{"a|2147483647","a|1"});}catch(ArithmeticException e){overflow=true;}expect(overflow);`,
    "Use Map.merge with Math::addExact. Keep the parser as the only input-format boundary.",
    ["Reuse parseRecord", "HashMap reduction", "Overflow safety"],
  ],
  [
    "Expose an immutable snapshot",
    "A mutable implementation detail should not leak through a service boundary. Return a defensive immutable result.",
    "Implement snapshot(String[] records), reusing aggregate. Its result must reject caller mutation and remain independent of later changes to the input array.",
    "public static Map<String,Integer> snapshot(String[] records)",
    `return Map.copyOf(aggregate(records));`,
    `String[] input={"a|2"};Map<String,Integer> view=Main.snapshot(input);input[0]="a|9";expect(view.get("A")==2);boolean blocked=false;try{view.put("B",1);}catch(UnsupportedOperationException e){blocked=true;}expect(blocked);`,
    "Map.copyOf returns an unmodifiable snapshot rather than a mutable alias.",
    ["Reuse aggregation", "Defensive copies", "Regression checks"],
  ],
  [
    "Deduplicate while preserving order",
    "Combine normalization with an insertion-ordered set. HashSet alone does not promise first-seen order.",
    "Implement uniqueIds(String[] values). Normalize each ID, remove duplicates, and return first-seen order. Reject a null array; reuse normalize for invalid entries.",
    "public static List<String> uniqueIds(String[] values)",
    `if(values==null)throw new IllegalArgumentException();Set<String> unique=new LinkedHashSet<>();for(String value:values)unique.add(normalize(value));return new ArrayList<>(unique);`,
    `expect(Main.uniqueIds(new String[]{" b ","a","B","c","A"}).equals(List.of("B","A","C")));expect(Main.uniqueIds(new String[]{}).isEmpty());`,
    "A LinkedHashSet preserves insertion order while deduplicating.",
    ["Normalization", "Stable deduplication", "Collection choice"],
  ],
  [
    "Rank the busiest incident IDs",
    "A deterministic tie-breaker makes rankings reproducible. Reuse aggregate instead of rebuilding its parsing and counting logic.",
    "Implement topIds(String[] records,int k). Return up to k IDs ordered by total quantity descending, then ID ascending for ties. Reject negative k; k=0 returns an empty list.",
    "public static List<String> topIds(String[] records, int k)",
    `if(k<0)throw new IllegalArgumentException("negative limit");return aggregate(records).entrySet().stream().sorted(Map.Entry.<String,Integer>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey())).limit(k).map(Map.Entry::getKey).toList();`,
    `String[] rows={"b|2","a|2","c|1","b|1"};expect(Main.topIds(rows,2).equals(List.of("B","A")));expect(Main.topIds(new String[]{"b|2","a|2"},9).equals(List.of("A","B")));expect(Main.topIds(rows,0).isEmpty());`,
    "Sort entries by descending value, then ascending key. State the O(n + d log d) cost.",
    ["Reuse aggregate", "Comparators", "Deterministic results"],
  ],
  [
    "Compute a sliding-window total",
    "Moving an overlapping window should update the sum rather than recompute every element. A long accumulator avoids int overflow.",
    "Implement movingTotals(int[] values,int width). Return one long sum per complete consecutive window. Reject null input, width<1 or width>length. Aim for O(n) time.",
    "public static long[] movingTotals(int[] values, int width)",
    `if(values==null || width<1 || width>values.length)throw new IllegalArgumentException();long[] result=new long[values.length-width+1];long sum=0;for(int i=0;i<values.length;i++){sum+=values[i];if(i>=width)sum-=values[i-width];if(i>=width-1)result[i-width+1]=sum;}return result;`,
    `expect(Arrays.equals(Main.movingTotals(new int[]{1,2,3,4},2),new long[]{3,5,7}));expect(Arrays.equals(Main.movingTotals(new int[]{-2,5,-1},3),new long[]{2}));expect(Main.movingTotals(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE},2)[0]==4294967294L);boolean bad=false;try{Main.movingTotals(new int[]{1},0);}catch(IllegalArgumentException e){bad=true;}expect(bad);`,
    "Add the entering item and subtract the item leaving the window.",
    ["Complexity reasoning", "Sliding windows", "Long arithmetic"],
  ],
  [
    "Build a deterministic incident summary",
    "Compose tested helpers instead of duplicating them. Separating aggregation, ranking and formatting makes failures easier to locate.",
    'Implement summary(String[] records,int k). Reuse snapshot and topIds. Format selected IDs as ID=quantity joined by commas, followed by "; total=N" for all quantities. Empty input gives "; total=0".',
    "public static String summary(String[] records, int k)",
    `Map<String,Integer> totals=snapshot(records);List<String> selected=topIds(records,k);String body=selected.stream().map(id->id+"="+totals.get(id)).collect(Collectors.joining(","));long total=totals.values().stream().mapToLong(Integer::longValue).sum();return body+"; total="+total;`,
    `expect(Main.summary(new String[]{"b|2","a|3","b|2"},1).equals("B=4; total=7"));expect(Main.summary(new String[]{},2).equals("; total=0"));expect(Main.summary(new String[]{"b|2","a|2"},2).equals("A=2,B=2; total=4"));`,
    "Formatting should consume the existing helper outputs, not re-parse raw records.",
    ["Reuse ranking and snapshots", "Pure composition", "First capstone"],
  ],
  [
    "Retry only a bounded number of times",
    "A retry policy needs a hard attempt limit and should preserve the last failure. Retries are safe only when the operation is retryable.",
    "Implement retry(Supplier<T> action,int attempts). Reject null action or attempts<1. Return the first successful result. Retry RuntimeException up to attempts times, then rethrow the last failure. Do not sleep.",
    "public static <T> T retry(Supplier<T> action, int attempts)",
    `if(action==null || attempts<1)throw new IllegalArgumentException();for(int i=1;;i++){try{return action.get();}catch(RuntimeException failure){if(i==attempts)throw failure;}}`,
    `AtomicInteger attempts=new AtomicInteger();expect(Main.retry(()->{if(attempts.incrementAndGet()<3)throw new IllegalStateException("temporary");return "ok";},3).equals("ok"));expect(attempts.get()==3);attempts.set(0);boolean failed=false;try{Main.retry(()->{attempts.incrementAndGet();throw new IllegalStateException("last");},2);}catch(IllegalStateException e){failed=e.getMessage().equals("last");}expect(failed&&attempts.get()==2);`,
    "Keep the retry policy separate from the operation. Production code would also classify failures and use a backoff budget.",
    ["Failure policies", "Supplier strategy", "Bounded retry"],
  ],
  [
    "Make a request idempotent",
    "Retries can duplicate side effects. An idempotency key must be checked atomically before invoking an operation.",
    "Implement executeOnce(Map<String,String> cache,String requestId,Supplier<String> action). Normalize the ID. Synchronize on cache, return a cached result when present, and invoke action only on the first successful call. Do not cache failures or null results.",
    "public static String executeOnce(Map<String,String> cache, String requestId, Supplier<String> action)",
    `if(cache==null||action==null)throw new IllegalArgumentException();String key=normalize(requestId);synchronized(cache){if(cache.containsKey(key))return cache.get(key);String result=Objects.requireNonNull(action.get());cache.put(key,result);return result;}`,
    `Map<String,String> cache=new HashMap<>();AtomicInteger calls=new AtomicInteger();expect(Main.executeOnce(cache," req ",()->"v"+calls.incrementAndGet()).equals("v1"));expect(Main.executeOnce(cache,"REQ",()->"wrong").equals("v1"));expect(calls.get()==1);boolean failed=false;try{Main.executeOnce(cache,"other",()->{throw new IllegalStateException();});}catch(IllegalStateException e){failed=true;}expect(failed&&!cache.containsKey("OTHER"));`,
    "The key check and result insertion must be in the same critical section. This is an in-memory exercise, not a distributed guarantee.",
    ["Reuse normalization", "Idempotency", "Atomic check and write"],
  ],
  [
    "Claim a message under contention",
    "A contains-then-add sequence on a shared set races. Make the compound operation atomic.",
    "Implement claim(Set<String> seen,String messageId). Normalize the key and return true only for the first claim. It must work when many threads share a plain HashSet. Reject null seen.",
    "public static boolean claim(Set<String> seen, String messageId)",
    `if(seen==null)throw new IllegalArgumentException();String key=normalize(messageId);synchronized(seen){return seen.add(key);}`,
    `Set<String> seen=new HashSet<>();AtomicInteger winners=new AtomicInteger();IntStream.range(0,200).parallel().forEach(i->{if(Main.claim(seen," msg "))winners.incrementAndGet();});expect(winners.get()==1);expect(seen.equals(Set.of("MSG")));expect(!Main.claim(seen,"MSG"));`,
    "Synchronize on the shared set, not on a newly created lock for each invocation.",
    ["Shared mutable state", "Contention tests", "Single winner"],
  ],
  [
    "Count completed work safely",
    "Atomic counters and bounded executors solve different problems: one protects state, the other bounds worker resources. Wait for completion before returning.",
    "Implement parallelCount(int jobs). Submit jobs increments to a four-thread ExecutorService, use an AtomicInteger, await every Future and shut down the executor. Return completed count; reject negative jobs.",
    "public static int parallelCount(int jobs)",
    `if(jobs<0)throw new IllegalArgumentException();AtomicInteger done=new AtomicInteger();try(ExecutorService pool=Executors.newFixedThreadPool(4)){List<Future<?>> work=new ArrayList<>();for(int i=0;i<jobs;i++)work.add(pool.submit(()->done.incrementAndGet()));for(Future<?> f:work){try{f.get();}catch(Exception e){throw new IllegalStateException(e);}}}return done.get();`,
    `expect(Main.parallelCount(0)==0);expect(Main.parallelCount(150)==150);expect(Main.parallelCount(23)==23);boolean bad=false;try{Main.parallelCount(-1);}catch(IllegalArgumentException e){bad=true;}expect(bad);`,
    "Track Futures, await them, and close the executor. A counter read before tasks finish is not the final result.",
    ["Executor lifecycle", "AtomicInteger", "Completion boundaries"],
  ],
  [
    "Authorize by explicit permission",
    "Authentication is not authorization. Missing users or permissions must fail closed. Normalize the request without granting defaults.",
    "Implement allowed(Map<String,Set<String>> grants,String user,String permission). Stored keys and permission names are canonical uppercase. Return false for missing/null/blank inputs. Normalize user and permission; require an explicit matching grant.",
    "public static boolean allowed(Map<String,Set<String>> grants, String user, String permission)",
    `if(grants==null||user==null||permission==null||user.isBlank()||permission.isBlank())return false;Set<String> permissions=grants.get(normalize(user));return permissions!=null&&permissions.contains(normalize(permission));`,
    `Map<String,Set<String>> grants=Map.of("ALICE",Set.of("PROCESS"));expect(Main.allowed(grants," alice ","process"));expect(!Main.allowed(grants,"BOB","PROCESS"));expect(!Main.allowed(grants,"ALICE","ADMIN"));expect(!Main.allowed(grants,null,"PROCESS"));`,
    "Never treat a missing grant as permission. This task models policy evaluation, not token verification. Multi-tenant services must additionally scope cached data and resource ownership.",
    ["Fail-closed rules", "Authorization boundaries", "Negative tests"],
  ],
  [
    "Validate workflow transitions",
    "Model allowed transitions as a small state machine. Invalid transitions should be rejected, not silently accepted.",
    "Implement transition(state,event). NEW+PAY → PAID; PAID+SHIP → SHIPPED; NEW+CANCEL → CANCELLED. Normalize inputs. Throw IllegalStateException for every other pair.",
    "public static String transition(String state, String event)",
    `String s=normalize(state),e=normalize(event);if(s.equals("NEW")&&e.equals("PAY"))return "PAID";if(s.equals("PAID")&&e.equals("SHIP"))return "SHIPPED";if(s.equals("NEW")&&e.equals("CANCEL"))return "CANCELLED";throw new IllegalStateException("transition not allowed");`,
    `expect(Main.transition("new","pay").equals("PAID"));expect(Main.transition("paid","ship").equals("SHIPPED"));expect(Main.transition("NEW","CANCEL").equals("CANCELLED"));for(String[] pair:new String[][]{{"SHIPPED","PAY"},{"PAID","CANCEL"},{"NEW","SHIP"}}){boolean denied=false;try{Main.transition(pair[0],pair[1]);}catch(IllegalStateException e){denied=true;}expect(denied);}`,
    "List the allowed edges explicitly. A status string alone is not a valid workflow operation.",
    ["State machines", "Domain invariants", "Invalid operation checks"],
  ],
  [
    "Redact diagnostic secrets",
    "Operational logs need useful context without credentials. Redact secret values while retaining field names for diagnosis.",
    "Implement safeMessage(String message). Return an empty string for null. Replace nonempty token= and password= values, case-insensitively, with [REDACTED]. A value ends at whitespace or &. Preserve other text.",
    "public static String safeMessage(String message)",
    String.raw`if(message==null)return "";return message.replaceAll("(?i)(token|password)=([^\\s&]+)","$1=[REDACTED]");`,
    `expect(Main.safeMessage("trace=t1 token=abc&x=1 password=def").equals("trace=t1 token=[REDACTED]&x=1 password=[REDACTED]"));expect(Main.safeMessage("TOKEN=xyz ok").equals("TOKEN=[REDACTED] ok"));expect(Main.safeMessage(null).isEmpty());`,
    "Use case-insensitive groups and preserve the matched field name with $1. Real log policies should cover additional secret formats.",
    ["Safe diagnostics", "Regular expressions", "Sensitive output boundaries"],
  ],
  [
    "Deliver an authorized idempotent summary",
    "Compose authorization, idempotency and tested business rules. Check permission before reading even a cached result.",
    "Implement handle(grants,cache,user,requestId,records,k). Require PROCESS permission or throw SecurityException. Use executeOnce to cache summary(records,k). Repeated request IDs return the first successful summary. Unauthorized callers must not read cached results.",
    "public static String handle(Map<String,Set<String>> grants, Map<String,String> cache, String user, String requestId, String[] records, int k)",
    `if(!allowed(grants,user,"PROCESS"))throw new SecurityException("permission required");return executeOnce(cache,requestId,()->summary(records,k));`,
    `Map<String,Set<String>> grants=Map.of("ALICE",Set.of("PROCESS"));Map<String,String> cache=new HashMap<>();expect(Main.handle(grants,cache,"alice","r1",new String[]{"a|3","b|1"},1).equals("A=3; total=4"));expect(Main.handle(grants,cache,"ALICE","R1",new String[]{"c|9"},1).equals("A=3; total=4"));boolean denied=false;try{Main.handle(grants,cache,"bob","r1",new String[]{},1);}catch(SecurityException e){denied=true;}expect(denied);`,
    "Compose allowed → executeOnce → summary. Keep the authorization check outside and before the cache lookup.",
    [
      "Reuse the whole pipeline",
      "Authorization before cache",
      "Service capstone",
    ],
  ],
];

const javaGroups = [
  [
    "java-contracts",
    "Java correctness & contracts",
    "Build a validated, immutable incident-data pipeline.",
    ["Validation", "Testing", "Immutability"],
  ],
  [
    "java-analysis",
    "Algorithms for incident data",
    "Reuse the pipeline to deduplicate, rank and summarize operational data.",
    ["DSA", "Complexity", "Composition"],
  ],
  [
    "java-reliability",
    "Reliable & concurrent services",
    "Add bounded retries, atomic deduplication and safe concurrent work.",
    ["Concurrency", "Idempotency", "Retries"],
  ],
  [
    "java-capstone",
    "Secure workflow capstone",
    "Compose domain rules, access checks and safe diagnostics into a service.",
    ["Security", "Workflow", "Capstone"],
  ],
];
let methods = [],
  signatures = [],
  regressions = [],
  previous = "hands-java-patterns:1";
const javaCourses = javaGroups.map(([id, title, description, tags], group) => {
  const lessons = steps
    .slice(group * 4, group * 4 + 4)
    .map(
      ([title, concept, task, signature, body, tests, hint, learn], offset) => {
        const complete = `  ${signature} {\n    ${body}\n  }\n`;
        const stub = `  ${signature} {\n    /* TODO */\n  }\n`;
        const lesson = {
          title,
          concept,
          task,
          engine: "java",
          type: "workspace",
          filename: "Main.java",
          starter:
            (/\b(Map|List|Set)\b/.test(signatures.join("") + signature)
              ? "import java.util.*;\n"
              : "") +
            (signatures.join("").includes("Supplier") ||
            signature.includes("Supplier")
              ? "import java.util.function.Supplier;\n"
              : "") +
            "\npublic class Main {\n" +
            signatures.join("\n") +
            stub +
            "}\n",
          solution:
            imports +
            "\npublic class Main {\n" +
            methods.join("\n") +
            complete +
            "}\n",
          hint,
          learn,
          prerequisites: [previous],
          reuseNote: methods.length
            ? "Only method signatures are provided. Bring your own implementations from earlier exercises; cumulative tests still verify their behavior."
            : "This step builds on collection and design-pattern practice. Later steps will reuse this method.",
          verify:
            imports +
            "\npublic class Verify {\n public static void main(String[] args) {\n" +
            [...regressions, tests].map((t) => "{\n" + t + "\n}").join("\n") +
            '\nSystem.out.println("DEVLAB_TESTS_PASSED");\n }\n static void expect(boolean ok) { if(!ok)throw new AssertionError("A current or earlier requirement failed"); }\n}\n',
        };
        methods.push(complete);
        signatures.push(stub);
        regressions.push(tests);
        previous = `hands-${id}:${offset}`;
        return lesson;
      },
    );
  return {
    ...make(id, "java", title, description, tags, lessons),
    level: group < 2 ? "Intermediate" : "Advanced",
    minutes: 60,
  };
});

const appLog =
  "10:00 INFO orders trace=t1 received\n10:01 ERROR orders trace=t1 timeout\n10:02 INFO inventory trace=t1 retry\n10:03 ERROR inventory trace=t1 failed\n10:04 ERROR orders trace=t2 rejected\n10:05 INFO orders trace=t2 done\n";
const incident =
  appLog
    .split("\n")
    .filter((s) => s.includes("trace=t1"))
    .join("\n") + "\n";
const linuxCourse = make(
  "linux-operations",
  "linux",
  "Progressive incident investigation",
  "Turn raw logs into a trace, a repeatable report and a verified evidence bundle.",
  ["awk", "Idempotent scripts", "Diagnostics"],
  [
    linux(
      "Aggregate errors by service",
      "Count by service before following individual requests. Deterministic sorting makes the report diff-friendly.",
      "From app.log, produce errors-by-service.txt with service and ERROR count, sorted by service. Expected: inventory 1 and orders 2, one per line.",
      "awk '$2==\"ERROR\"{n[$3]++}END{for(s in n)print s,n[s]}' /workspace/app.log | sort > /workspace/errors-by-service.txt",
      "printf 'inventory 1\\norders 2\\n' > /tmp/expected; cmp /tmp/expected /workspace/errors-by-service.txt",
      { "app.log": appLog },
      "Filter ERROR records, count field 3, then sort.",
    ),
    linux(
      "Follow a distributed trace",
      "An incident spans more than one service. Correlation IDs preserve context that an ERROR-only search would omit.",
      "Produce incident.log containing every trace=t1 line from app.log in original order, including INFO entries. Use errors-by-service.txt from the previous step as triage context.",
      "grep 'trace=t1' /workspace/app.log > /workspace/incident.log",
      `cat > /tmp/expected <<'EXPECTED'\n${incident}EXPECTED\ncmp /tmp/expected /workspace/incident.log`,
      { "app.log": appLog, "errors-by-service.txt": "inventory 1\norders 2\n" },
      "Filter by correlation ID instead of by severity.",
    ),
    linux(
      "Write an idempotent incident report",
      "A support script may be rerun during an incident. Replace a report atomically instead of appending duplicates, and restrict its permissions.",
      "Use incident.log to write report.txt containing errors=2 then services=2. Use a temporary file and mv, set mode 600, and make repeated runs produce the same report.",
      'set -eu\ncd /workspace\ntmp=$(mktemp /workspace/report.XXXXXX)\ntrap \'rm -f "$tmp"\' EXIT\nprintf \'errors=%s\\nservices=%s\\n\' "$(grep -c ERROR incident.log)" "$(awk \'{print $3}\' incident.log | sort -u | wc -l | tr -d \' \')" > "$tmp"\nchmod 600 "$tmp"\nmv "$tmp" report.txt',
      "bash /workspace/notes.sh\nprintf 'errors=2\\nservices=2\\n' > /tmp/expected\ncmp /tmp/expected /workspace/report.txt\ntest \"$(stat -c %a /workspace/report.txt)\" = 600",
      { "incident.log": incident },
      "Use mktemp, a cleanup trap, chmod 600 and mv. Do not append to an existing report.",
    ),
    linux(
      "Package verifiable incident evidence",
      "A support bundle should contain the intended evidence only, plus a checksum that detects transfer corruption.",
      "Create evidence.tar.gz containing app.log, incident.log and report.txt. Write its SHA-256 checksum to evidence.sha256 and set the archive mode to 600. Verify it with sha256sum -c.",
      "cd /workspace\ntar -czf evidence.tar.gz app.log incident.log report.txt\nchmod 600 evidence.tar.gz\nsha256sum evidence.tar.gz > evidence.sha256\nsha256sum -c evidence.sha256",
      'cd /workspace\nsha256sum -c evidence.sha256\ntest "$(stat -c %a evidence.tar.gz)" = 600\nprintf \'app.log\\nincident.log\\nreport.txt\\n\' > /tmp/expected-files\ntar -tzf evidence.tar.gz | sort > /tmp/actual-files\ncmp /tmp/expected-files /tmp/actual-files\nmkdir -p /tmp/evidence\ntar -xzf evidence.tar.gz -C /tmp/evidence\nfor file in app.log incident.log report.txt; do cmp "/workspace/$file" "/tmp/evidence/$file"; done',
      {
        "app.log": appLog,
        "incident.log": incident,
        "report.txt": "errors=2\nservices=2\n",
      },
      "Build the archive from an explicit file list, then generate and verify its checksum.",
    ),
  ],
);
linuxCourse.stage = 2;
linuxCourse.minutes = 60;
linuxCourse.lessons.forEach((l, i) => {
  l.prerequisites = [
    i ? `hands-linux-operations:${i - 1}` : "hands-linux-admin:1",
  ];
  l.reuseNote = i
    ? "A reference output from the earlier step is supplied as a fixture, so you can concentrate on the next operation."
    : "Build on grep, permissions and backup fundamentals.";
  l.learn = [
    "Inspect before modifying",
    "Repeatable operational output",
    "Validate the result, not just the exit code",
  ];
});

const bankSeed = `CREATE TABLE accounts(id int PRIMARY KEY,balance int NOT NULL CHECK(balance>=0)); INSERT INTO accounts VALUES(1,1000),(2,250),(3,500); CREATE TABLE payments(request_id text PRIMARY KEY,from_id int REFERENCES accounts(id),to_id int REFERENCES accounts(id),amount int NOT NULL CHECK(amount>0));`;
const balance = `CREATE OR REPLACE FUNCTION balance_of(account_id int) RETURNS int LANGUAGE sql AS $$ SELECT balance FROM accounts WHERE id=account_id $$;`;
const move = `CREATE OR REPLACE FUNCTION move_money(source_id int,target_id int,cents int) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF cents IS NULL OR cents<=0 OR source_id=target_id OR source_id IS NULL OR target_id IS NULL THEN RAISE EXCEPTION 'invalid transfer'; END IF; PERFORM id FROM accounts WHERE id IN (source_id,target_id) ORDER BY id FOR UPDATE; IF balance_of(source_id) IS NULL OR balance_of(target_id) IS NULL OR balance_of(source_id)<cents THEN RAISE EXCEPTION 'insufficient funds or missing account'; END IF; UPDATE accounts SET balance=balance-cents WHERE id=source_id; UPDATE accounts SET balance=balance+cents WHERE id=target_id; END $$;`;
const post = `CREATE OR REPLACE FUNCTION post_payment(key text,source_id int,target_id int,cents int) RETURNS boolean LANGUAGE plpgsql AS $$ DECLARE previous payments%ROWTYPE; BEGIN IF key IS NULL OR btrim(key)='' THEN RAISE EXCEPTION 'key required'; END IF; INSERT INTO payments VALUES(key,source_id,target_id,cents) ON CONFLICT DO NOTHING; IF FOUND THEN PERFORM move_money(source_id,target_id,cents); RETURN true; END IF; SELECT * INTO previous FROM payments WHERE request_id=key; IF previous.from_id IS DISTINCT FROM source_id OR previous.to_id IS DISTINCT FROM target_id OR previous.amount IS DISTINCT FROM cents THEN RAISE EXCEPTION 'conflicting request'; END IF; RETURN false; END $$;`;
const report = `CREATE OR REPLACE FUNCTION account_activity() RETURNS TABLE(account_id int,paid_out bigint,paid_in bigint,balance int) LANGUAGE sql AS $$ SELECT a.id,coalesce((SELECT sum(p.amount) FROM payments p WHERE p.from_id=a.id),0),coalesce((SELECT sum(p.amount) FROM payments p WHERE p.to_id=a.id),0),a.balance FROM accounts a ORDER BY a.id $$; CREATE INDEX IF NOT EXISTS payments_from_account ON payments(from_id); CREATE INDEX IF NOT EXISTS payments_to_account ON payments(to_id);`;
const sqlDefinitions = [
  [
    "Read a balance through a function",
    "Start with a small query contract that later transactional operations can call.",
    "Create balance_of(account_id int) returning the current integer balance, or NULL when the account is missing.",
    balance,
    `DO $$ BEGIN IF balance_of(1)<>1000 OR balance_of(2)<>250 OR balance_of(999) IS NOT NULL THEN RAISE EXCEPTION 'balance contract failed'; END IF; END $$;`,
    "A SQL-language function can return the single selected balance.",
    [],
  ],
  [
    "Transfer funds atomically",
    "Enforce business invariants in one transaction. Lock account rows in a consistent order to reduce deadlock risk.",
    "Create move_money(source_id int,target_id int,cents int) returning void. Reject nonpositive amounts, missing accounts, identical accounts and insufficient funds. Lock both account rows before updating; debit and credit together. Reuse balance_of.",
    move,
    `SELECT move_money(1,2,300); DO $$ DECLARE rejected boolean:=false; BEGIN IF balance_of(1)<>700 OR balance_of(2)<>550 THEN RAISE EXCEPTION 'wrong balances'; END IF; BEGIN PERFORM move_money(1,2,9999); EXCEPTION WHEN OTHERS THEN rejected:=true; END; IF NOT rejected OR balance_of(1)<>700 OR balance_of(2)<>550 THEN RAISE EXCEPTION 'unsafe failure'; END IF; rejected:=false; BEGIN PERFORM move_money(1,999,1); EXCEPTION WHEN OTHERS THEN rejected:=true; END; IF NOT rejected OR balance_of(1)<>700 THEN RAISE EXCEPTION 'missing account changed funds'; END IF; END $$;`,
    "Validate input, PERFORM ordered SELECT ... FOR UPDATE, then update both rows.",
    [balance],
  ],
  [
    "Make payment retries idempotent",
    "A unique request key provides a database-backed concurrency boundary. Failed transfers must roll back the request record as well.",
    "Create post_payment(key text,source_id int,target_id int,cents int) returning boolean. The first successful request transfers funds and returns true. Repeating the same key and payload returns false without another debit. A conflicting payload or failed transfer must raise an error. Reuse move_money.",
    post,
    `DO $$ DECLARE rejected boolean:=false; BEGIN IF NOT post_payment('r1',1,2,100) OR post_payment('r1',1,2,100) THEN RAISE EXCEPTION 'retry contract failed'; END IF; IF balance_of(1)<>900 OR (SELECT count(*) FROM payments)<>1 THEN RAISE EXCEPTION 'duplicate debit'; END IF; BEGIN PERFORM post_payment('r1',1,2,101); EXCEPTION WHEN OTHERS THEN rejected:=true; END; IF NOT rejected THEN RAISE EXCEPTION 'conflicting payload accepted'; END IF; rejected:=false; BEGIN PERFORM post_payment('bad',1,2,9999); EXCEPTION WHEN OTHERS THEN rejected:=true; END; IF NOT rejected OR EXISTS(SELECT 1 FROM payments WHERE request_id='bad') OR balance_of(1)<>900 THEN RAISE EXCEPTION 'failed transfer was not atomic'; END IF; END $$;`,
    "INSERT ... ON CONFLICT DO NOTHING, inspect FOUND, compare existing payload, and invoke move_money only for a new request.",
    [balance, move],
  ],
  [
    "Reconcile account activity and inspect access paths",
    "Join-heavy reports can multiply amounts accidentally. Aggregate outgoing and incoming payments independently and include accounts with no payments.",
    "Create account_activity() returning account_id int, paid_out bigint, paid_in bigint, balance int, ordered by account_id. Include zero-activity accounts. Add btree indexes named payments_from_account on payments(from_id) and payments_to_account on payments(to_id). Inspect an EXPLAIN plan in the terminal; a tiny dataset may legitimately use a sequential scan.",
    report,
    `DO $$ BEGIN IF (SELECT count(*) FROM account_activity())<>3 OR NOT EXISTS(SELECT 1 FROM account_activity() WHERE account_id=1 AND paid_out=100 AND paid_in=0 AND balance=900) OR NOT EXISTS(SELECT 1 FROM account_activity() WHERE account_id=3 AND paid_out=0 AND paid_in=0 AND balance=500) THEN RAISE EXCEPTION 'report mismatch'; END IF; IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='payments_from_account' AND indexdef LIKE '%(from_id)%') OR NOT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='payments_to_account' AND indexdef LIKE '%(to_id)%') THEN RAISE EXCEPTION 'required access paths missing'; END IF; END $$;`,
    "Use separate aggregates or correlated sums and COALESCE. An index is an available access path, not a promise that the planner will use it.",
    [balance, move, post],
  ],
];
const sqlCourse = make(
  "sql-integrity",
  "sql",
  "Transactional service data",
  "Build from a query contract to atomic transfers, idempotent requests and reconciliation.",
  ["Transactions", "Row locks", "EXPLAIN"],
  sqlDefinitions.map(
    ([title, concept, task, solution, check, hint, helpers], i) => {
      const lesson = pg(title, concept, task, solution, "true", hint);
      lesson.seed =
        bankSeed +
        "\n" +
        helpers.join("\n") +
        (i === 3 ? "\nSELECT post_payment('seed',1,2,100);" : "");
      lesson.check = check + "\nSELECT 'DEVLAB_TESTS_PASSED';";
      lesson.prerequisites = [
        i ? `hands-sql-integrity:${i - 1}` : "hands-sql-postgres:1",
      ];
      lesson.reuseNote = i
        ? "Earlier functions are already installed in this fixture. Call them instead of copying their business rules."
        : "Build on PostgreSQL functions and procedural control flow.";
      lesson.learn = [
        "Explicit database contracts",
        "Failure-path assertions",
        "Inspect and verify state",
      ];
      return lesson;
    },
  ),
);
sqlCourse.stage = 2;
sqlCourse.minutes = 80;
export const advancedCourses = [...javaCourses, linuxCourse, sqlCourse];
