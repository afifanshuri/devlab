import {
  java,
  linux,
  pg,
  oracle,
  make,
} from "./exercise-factories.js?v=roadmap-1";
import { advancedCourses } from "./progression.js";
import { patternCourses } from "./patterns.js";
import { roadmapCourses } from "./roadmap.js?v=roadmap-1";
import { applyMissions } from "./missions.js?v=ops-missions-1";
import {
  solidPractice,
  advancedPatterns,
} from "./design-practice.js?v=design-1";
import {
  linuxBasicsPractice,
  linuxAdminPractice,
  sqlAdminPractice,
} from "./ops-practice.js?v=ops-1";
export const courses = [
  make(
    "java-dsa",
    "java",
    "Data structures & algorithms",
    "Implement real Java methods and test edge cases with a JDK.",
    ["HashMap", "Binary search", "Real JDK"],
    [
      java(
        "Count frequencies",
        "A frequency map counts each distinct value in expected O(n) time.",
        "Implement counts(int[] nums). Return an empty map for an empty array; count negative values too. Check answer compiles your code and runs additional tests.",
        "public static Map<Integer,Integer> counts(int[] nums)",
        "Map<Integer,Integer> result = new HashMap<>();\n    for(int n : nums) result.merge(n,1,Integer::sum);\n    return result;",
        "expect(Main.counts(new int[]{}).isEmpty());\nexpect(Main.counts(new int[]{2,2,-1,3,-1}).equals(Map.of(2,2,-1,2,3,1)));",
        "Use getOrDefault or merge while visiting each input once.",
      ),
      java(
        "Implement binary search",
        "Binary search halves a sorted interval on each iteration, using O(log n) comparisons.",
        "Implement indexOf on a sorted array. Return the matching index, or -1 when absent. Handle empty input and both boundaries.",
        "public static int indexOf(int[] nums, int target)",
        "int lo=0, hi=nums.length-1;\n    while(lo<=hi){int mid=lo+(hi-lo)/2; if(nums[mid]==target)return mid; if(nums[mid]<target)lo=mid+1;else hi=mid-1;}\n    return -1;",
        "expect(Main.indexOf(new int[]{},2)==-1);\nexpect(Main.indexOf(new int[]{2,5,8,12,16,23,38},23)==5);\nexpect(Main.indexOf(new int[]{2,5},2)==0);\nexpect(Main.indexOf(new int[]{2,5},5)==1);\nexpect(Main.indexOf(new int[]{2,5},4)==-1);",
        "Use lo <= hi and mid = lo + (hi - lo) / 2.",
      ),
    ],
  ),
  make(
    "java-solid",
    "java",
    "SOLID & clean architecture",
    "Practise dependency inversion and separate calculation from infrastructure.",
    ["SOLID", "Dependency injection"],
    [
      java(
        "Depend on an abstraction",
        "A business operation can depend on a small interface supplied by its caller.",
        "Implement load(LongFunction<String> repository, long id). Delegate to the supplied repository. Reject a null repository with IllegalArgumentException. No database dependency belongs in this method.",
        "public static String load(LongFunction<String> repository, long id)",
        'if(repository==null) throw new IllegalArgumentException("repository required");\n    return repository.apply(id);',
        'expect(Main.load(id -> "user:"+id,7).equals("user:7"));\nexpect(Main.load(id -> "fake",999).equals("fake"));\nboolean rejected=false; try{Main.load(null,1);}catch(IllegalArgumentException e){rejected=true;} expect(rejected);',
        "Test with a lambda. The use case needs a function, not a concrete database adapter.",
      ),
      java(
        "Isolate a business rule",
        "A calculation with no I/O can be tested independently from email, files and storage.",
        "Implement total(quantity, unitPrice) in integer cents. Reject negative inputs. Use Math.multiplyExact so overflow throws ArithmeticException. Keep this method free of I/O.",
        "public static int total(int quantity, int unitPrice)",
        'if(quantity<0 || unitPrice<0)throw new IllegalArgumentException("negative input");\n    return Math.multiplyExact(quantity,unitPrice);',
        "expect(Main.total(3,125)==375);expect(Main.total(0,900)==0);\nboolean bad=false;try{Main.total(-1,10);}catch(IllegalArgumentException e){bad=true;}expect(bad);\nboolean overflow=false;try{Main.total(Integer.MAX_VALUE,2);}catch(ArithmeticException e){overflow=true;}expect(overflow);",
        "Keep validation and calculation together. Delivery and persistence belong elsewhere.",
      ),
    ],
  ),
  make(
    "java-patterns",
    "java",
    "Design patterns in practice",
    "Implement interchangeable strategies and publish events to subscribers.",
    ["Strategy", "Observer"],
    [
      java(
        "Compose a pricing strategy",
        "Strategy encapsulates interchangeable algorithms. A Java functional interface can express a small strategy.",
        "Implement checkout(int amount, IntUnaryOperator strategy). Reject a negative amount or null strategy; return the strategy result. Do not hardcode discounts.",
        "public static int checkout(int amount, IntUnaryOperator strategy)",
        "if(amount<0 || strategy==null)throw new IllegalArgumentException();\n    return strategy.applyAsInt(amount);",
        "expect(Main.checkout(100,n->n-10)==90);expect(Main.checkout(100,n->n/2)==50);expect(Main.checkout(100,n->n)==100);\nboolean bad=false;try{Main.checkout(1,null);}catch(IllegalArgumentException e){bad=true;}expect(bad);",
        "Delegate with applyAsInt. The caller chooses the algorithm.",
      ),
      java(
        "Notify subscribers",
        "Observer decouples an event publisher from its listeners. This task uses synchronous delivery in registration order.",
        "Implement publish(List<Consumer<String>> listeners, String event). Notify each listener exactly once in list order. An empty list should do nothing.",
        "public static void publish(List<Consumer<String>> listeners, String event)",
        "for(Consumer<String> listener:listeners)listener.accept(event);",
        'List<String> seen=new ArrayList<>();\nMain.publish(List.of(e->seen.add("a:"+e),e->seen.add("b:"+e)),"saved");\nexpect(seen.equals(List.of("a:saved","b:saved")));Main.publish(List.of(),"ignored");expect(seen.size()==2);',
        "Iterate over listeners and call accept(event).",
      ),
    ],
  ),
  make(
    "linux-basics",
    "linux",
    "Linux command line essentials",
    "Create files and search logs in a real disposable Linux filesystem.",
    ["Shell", "Files", "grep"],
    [
      linux(
        "Build a project directory",
        "mkdir creates directories; redirection writes files. cd changes the current directory.",
        "Create /workspace/projects. Inside it create Main.java containing exactly: class Main {}. Inspect the result with cat.",
        "mkdir -p /workspace/projects\nprintf 'class Main {}\\n' > /workspace/projects/Main.java\ncat /workspace/projects/Main.java",
        'test -d /workspace/projects\ntest "$(cat /workspace/projects/Main.java)" = "class Main {}"',
      ),
      linux(
        "Extract errors from a log",
        "grep filters matching lines. > writes the result to a file, replacing existing content.",
        "Find all ERROR lines from /workspace/app.log and save them, in original order, to /workspace/errors.log. Do not change app.log.",
        "grep ERROR /workspace/app.log > /workspace/errors.log\ncat /workspace/errors.log",
        "printf 'ERROR connection refused\\nERROR request timeout\\n' > /tmp/expected\ncmp /workspace/errors.log /tmp/expected\ntest \"$(wc -l < /workspace/app.log)\" -eq 4",
        {
          "app.log":
            "INFO boot\nERROR connection refused\nINFO retry\nERROR request timeout\n",
        },
      ),
    ],
  ),
  make(
    "linux-admin",
    "linux",
    "Linux administration essentials",
    "Set access permissions, inspect processes, and create verified backups.",
    ["Permissions", "Processes", "Backups"],
    [
      linux(
        "Secure a configuration file",
        "Mode 600 grants read/write only to a file owner. Excessive access is unnecessary for a private configuration.",
        "Set /workspace/app.conf to mode 600. Save a long listing of it to /workspace/permissions.txt.",
        "chmod 600 /workspace/app.conf\nls -l /workspace/app.conf > /workspace/permissions.txt",
        'test "$(stat -c %a /workspace/app.conf)" = 600\ngrep -q app.conf /workspace/permissions.txt',
        { "app.conf": "PORT=8080\nENV=training\n" },
      ),
      linux(
        "Inspect and back up a service config",
        "ps and df provide process and disk snapshots. tar creates a reproducible archive of a directory tree.",
        "Save ps aux to processes.txt and df -h to disk.txt in /workspace. Create /workspace/config-backup.tar.gz containing app.conf, without changing app.conf.",
        "ps aux > /workspace/processes.txt\ndf -h > /workspace/disk.txt\ntar -czf /workspace/config-backup.tar.gz -C /workspace app.conf",
        "grep -q PID /workspace/processes.txt\ngrep -q Filesystem /workspace/disk.txt\ntar -xzf /workspace/config-backup.tar.gz -C /tmp\ncmp /tmp/app.conf /workspace/app.conf",
        { "app.conf": "PORT=8080\nENV=training\n" },
      ),
    ],
  ),
  make(
    "sql-queries",
    "sql",
    "SQL queries & analysis",
    "Write and execute real PostgreSQL against a seeded employee database.",
    ["PostgreSQL", "Grouping", "Windows"],
    [
      pg(
        "Build a filtered view",
        "Views package reusable query logic. employees has id, name, department and salary.",
        "Create or replace a view high_earners returning name and salary for employees earning at least 70000. There should be three rows.",
        "CREATE OR REPLACE VIEW high_earners AS SELECT name,salary FROM employees WHERE salary >= 70000;",
        "(SELECT count(*)=3 AND min(salary)=72000 AND max(salary)=95000 FROM high_earners)",
        "Use CREATE OR REPLACE VIEW high_earners AS SELECT ... WHERE ...",
      ),
      pg(
        "Rank salaries within departments",
        "ROW_NUMBER partitions data into independent groups before numbering rows.",
        "Create or replace salary_ranks with columns name, department, rank. Rank salaries descending within each department using ROW_NUMBER.",
        "CREATE OR REPLACE VIEW salary_ranks AS SELECT name,department,ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rank FROM employees;",
        "(SELECT count(*)=4 FROM salary_ranks) AND (SELECT rank=1 FROM salary_ranks WHERE name='Maya') AND (SELECT rank=2 FROM salary_ranks WHERE name='Sam')",
        "Use ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC).",
      ),
    ],
  ),
  make(
    "sql-postgres",
    "sql",
    "PostgreSQL procedural SQL",
    "Write PL/pgSQL functions with branching, loops and a cursor.",
    ["PL/pgSQL", "IF ELSE", "Cursor"],
    [
      pg(
        "Write a salary-band function",
        "PL/pgSQL uses IF, ELSIF, ELSE and END IF. A function returns a value with RETURN.",
        "Create or replace salary_band(amount int) returning text: high for >=90000, mid for >=70000, otherwise base. Use LANGUAGE plpgsql.",
        "CREATE OR REPLACE FUNCTION salary_band(amount int) RETURNS text LANGUAGE plpgsql AS $$ BEGIN IF amount>=90000 THEN RETURN 'high'; ELSIF amount>=70000 THEN RETURN 'mid'; ELSE RETURN 'base'; END IF; END $$;",
        "salary_band(95000)='high' AND salary_band(90000)='high' AND salary_band(70000)='mid' AND salary_band(60000)='base'",
        "Use IF amount >= 90000 THEN ... ELSIF amount >= 70000 THEN ...",
      ),
      pg(
        "Sum payroll with a cursor",
        "A declared cursor can be opened, fetched until NOT FOUND, and closed. Prefer set-based SQL in production unless procedural work is needed.",
        "Create or replace total_payroll() returning bigint. Practise an explicit cursor over employees.salary, a loop and an accumulator. Expected total: 312000.",
        "CREATE OR REPLACE FUNCTION total_payroll() RETURNS bigint LANGUAGE plpgsql AS $$ DECLARE c CURSOR FOR SELECT salary FROM employees; value int; total bigint:=0; BEGIN OPEN c; LOOP FETCH c INTO value; EXIT WHEN NOT FOUND; total:=total+value; END LOOP; CLOSE c; RETURN total; END $$;",
        "total_payroll()=312000",
        "Declare a CURSOR, OPEN it, then FETCH and EXIT WHEN NOT FOUND inside LOOP.",
      ),
    ],
  ),
  make(
    "sql-oracle",
    "sql",
    "Oracle PL/SQL practice",
    "Write Oracle-specific blocks. Requires the optional Oracle environment.",
    ["Oracle setup required", "PL/SQL"],
    [
      oracle(
        "Branch and print",
        "Oracle PL/SQL uses DBMS_OUTPUT.PUT_LINE for diagnostic output.",
        "Declare score NUMBER := 80. Print Pass when score >= 50; otherwise print Retry. Run this with SQL*Plus after enabling the optional Oracle environment.",
        "SET SERVEROUTPUT ON\nDECLARE score NUMBER:=80; BEGIN IF score>=50 THEN DBMS_OUTPUT.PUT_LINE('Pass'); ELSE DBMS_OUTPUT.PUT_LINE('Retry'); END IF; END;\n/",
        ["Pass"],
      ),
      oracle(
        "Loop over integers",
        "A numeric FOR loop includes both bounds. Oracle requires END LOOP; to close it.",
        "Write a PL/SQL block printing the integers 1 through 5 with a numeric FOR loop.",
        "SET SERVEROUTPUT ON\nBEGIN FOR i IN 1..5 LOOP DBMS_OUTPUT.PUT_LINE(i); END LOOP; END;\n/",
        ["1", "2", "3", "4", "5"],
      ),
    ],
  ),
];
courses.push(...advancedCourses, ...patternCourses);
courses.unshift(...roadmapCourses);
courses.splice(
  courses.findIndex((c) => c.id === "hands-java-solid") + 1,
  0,
  solidPractice,
);
courses.push(advancedPatterns, sqlAdminPractice);
courses.splice(
  courses.findIndex((c) => c.id === "hands-linux-basics") + 1,
  0,
  linuxBasicsPractice,
);
courses.splice(
  courses.findIndex((c) => c.id === "hands-linux-admin") + 1,
  0,
  linuxAdminPractice,
);
courses
  .filter((c) => c.track === "java")
  .forEach((c, i) => {
    c.stage = i + 1;
  });
applyMissions(courses);

// Prerequisites guide the learning order without locking users out of practice.
for (const track of ["java", "linux", "sql"]) {
  let previous;
  const ordered = courses
    .filter((c) => c.track === track)
    .sort(
      (a, b) =>
        Number(a.lessons[0].engine === "oracle") -
        Number(b.lessons[0].engine === "oracle"),
    );
  for (const course of ordered)
    for (const [index, lesson] of course.lessons.entries()) {
      lesson.prerequisites ??= previous ? [previous] : [];
      lesson.learn ??= course.tags;
      previous = course.id + ":" + index;
    }
}
export const allLessons = courses.flatMap((c) =>
  c.lessons.map((l, index) => ({
    ...l,
    id: `${c.id}:${index}`,
    course: c.id,
    track: c.track,
    index,
  })),
);
