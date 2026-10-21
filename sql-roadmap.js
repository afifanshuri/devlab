import { make, pg } from "./exercise-factories.js";

// Schema and fixtures are supplied: learners write queries, not DDL drills.
const seed = `
CREATE TABLE customers(id int PRIMARY KEY, name text, city text);
CREATE TABLE orders(id int PRIMARY KEY, customer_id int REFERENCES customers, amount int, status text, placed_on date);
CREATE TABLE staff(id int PRIMARY KEY, name text, manager_id int, salary int);
INSERT INTO customers VALUES(1,'Aina','KL'),(2,'Ben','Ipoh'),(3,'Chen',NULL),(4,'Dina','KL');
INSERT INTO orders VALUES(1,1,100,'paid','2026-01-01'),(2,1,200,'paid','2026-01-02'),(3,2,300,'paid','2026-01-02'),(4,2,50,'cancelled','2026-01-03'),(5,4,300,'paid','2026-02-01');
INSERT INTO staff VALUES(1,'Aina',NULL,9000),(2,'Ben',1,6000),(3,'Chen',1,6000),(4,'Dina',2,4000);`;
function query(
  title,
  topic,
  mission,
  goal,
  columns,
  solution,
  expected,
  extra = "",
) {
  return {
    title,
    engine: "postgres",
    type: "workspace",
    filename: "solution.sql",
    starter:
      "-- Write one SELECT or WITH query. Tables are already provided.\n",
    seed,
    solution,
    queryResult: true,
    roadmapTopics: [topic],
    mission,
    goal,
    task: `${goal} Return columns ${columns}. Tables: customers(id, name, city); orders(id, customer_id, amount in cents, status, placed_on); staff(id, name, manager_id, salary). Order rows as specified; use the supplied data and support new matching rows.`,
    example:
      expected === "[]"
        ? "No matching rows in the supplied data. A new KL customer without a large paid order must appear."
        : expected,
    concept: `${topic}: solve the business question using a query over existing tables. The checker runs the query as a view inside a rolled-back transaction.`,
    hint: "Inspect the supplied tables with psql -c. Do not create tables or views; submit one result-producing query.",
    check: `DO $check$ BEGIN IF (SELECT COALESCE(jsonb_agg(to_jsonb(a)),'[]'::jsonb) FROM answer a) IS DISTINCT FROM '${expected.replaceAll("'", "''")}'::jsonb THEN RAISE EXCEPTION 'Returned rows, ordering or columns do not match the mission'; END IF; END $check$;\n${extra}\nSELECT 'DEVLAB_TESTS_PASSED';`,
  };
}
export const sqlRoadmapCourses = [
  make(
    "sql-relational",
    "sql",
    "SQL · Relational problem solving",
    "Start beyond syntax: join incomplete data, compare groups and explain missing rows.",
    ["Joins", "Subqueries", "Aggregation", "NULL", "Set operations"],
    [
      query(
        "Keep the quiet customers",
        "LEFT JOIN and GROUP BY",
        "A shop wants to invite every customer to a loyalty event. Customers who have never placed an order still belong on the list, with zero spending rather than a missing record.",
        "Return every customer's id and total paid spending as total; cancelled orders must not count and customers with no paid orders need zero. Order by id.",
        "id, total",
        "SELECT c.id, COALESCE(SUM(o.amount),0)::int AS total FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.status='paid' GROUP BY c.id ORDER BY c.id;",
        '[{"id":1,"total":300},{"id":2,"total":300},{"id":3,"total":0},{"id":4,"total":300}]',
        `INSERT INTO customers VALUES(5,'Eli','KL'); DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM answer WHERE id=5 AND total=0) THEN RAISE EXCEPTION 'Include new quiet customers'; END IF; END $$;`,
      ),
      query(
        "Find customers left behind",
        "Correlated subqueries and NOT EXISTS",
        "Support suspects the marketing report silently drops people without successful purchases. Find those customers without confusing a cancelled order with a paid one.",
        "Return id and name for customers with no paid orders, ordered by id. Use a correlated subquery so the rule also handles customers with only cancelled orders.",
        "id, name",
        "SELECT c.id,c.name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id=c.id AND o.status='paid') ORDER BY c.id;",
        '[{"id":3,"name":"Chen"}]',
        `INSERT INTO customers VALUES(5,'Eli','KL'); INSERT INTO orders VALUES(6,5,1,'cancelled','2026-02-02'); DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM answer WHERE id=5) THEN RAISE EXCEPTION 'Cancelled-only customer missing'; END IF; END $$;`,
      ),
      query(
        "Find the strong sales days",
        "HAVING and date functions",
        "The shop owner wants a short list of sales days worth investigating, without cancelled orders inflating the result. Two small orders on a day should add up just like one large order.",
        "Return placed_on as day and paid total as total for dates with at least 300 cents in paid orders; order by day.",
        "day, total",
        "SELECT placed_on AS day,SUM(amount)::int AS total FROM orders WHERE status='paid' GROUP BY placed_on HAVING SUM(amount)>=300 ORDER BY day;",
        '[{"day":"2026-01-02","total":500},{"day":"2026-02-01","total":300}]',
      ),
      query(
        "Compare colleagues fairly",
        "Self joins and scalar subqueries",
        "A salary review should identify employees earning less than their own manager, rather than comparing everyone with the company director.",
        "Return staff id and their manager's name as manager for staff earning less than their direct manager, ordered by staff id. Exclude the director with no manager.",
        "id, manager",
        "SELECT s.id,m.name AS manager FROM staff s JOIN staff m ON m.id=s.manager_id WHERE s.salary<m.salary ORDER BY s.id;",
        '[{"id":2,"manager":"Aina"},{"id":3,"manager":"Aina"},{"id":4,"manager":"Ben"}]',
      ),
      query(
        "Reconcile the guest lists",
        "UNION INTERSECT EXCEPT",
        "The event team has customers from KL and customers with a purchase worth at least 200 cents. They need the KL customers who do not appear on the large-purchase list.",
        "Return id for KL customers excluding anyone with a paid order of at least 200 cents, ordered by id. Build the result with EXCEPT rather than a list of hard-coded IDs.",
        "id",
        "SELECT id FROM customers WHERE city='KL' EXCEPT SELECT customer_id FROM orders WHERE status='paid' AND amount>=200 ORDER BY id;",
        "[]",
        `INSERT INTO customers VALUES(5,'Eli','KL'); DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM answer WHERE id=5) THEN RAISE EXCEPTION 'New eligible customer missing'; END IF; END $$;`,
      ),
      query(
        "Make a safe mailing label",
        "String functions CASE COALESCE",
        "A delivery partner rejects inconsistent customer labels. Some city fields are missing, and the export must remain useful without writing the word null into a label.",
        "Return id and label formatted as UPPER(name) || ' / ' || city; replace a missing city with 'UNKNOWN'. Order by id.",
        "id, label",
        "SELECT id,UPPER(name)||' / '||COALESCE(city,'UNKNOWN') AS label FROM customers ORDER BY id;",
        '[{"id":1,"label":"AINA / KL"},{"id":2,"label":"BEN / Ipoh"},{"id":3,"label":"CHEN / UNKNOWN"},{"id":4,"label":"DINA / KL"}]',
      ),
    ],
  ),
  make(
    "sql-analytics",
    "sql",
    "SQL · Analytics and advanced queries",
    "Reuse joins and aggregation in windows, recursive reports and safe dynamic SQL.",
    ["CTEs", "Window functions", "Recursive queries", "Pivot", "Dynamic SQL"],
    [
      query(
        "Build a running sales ledger",
        "Window frames and CTEs",
        "Finance needs to see how cash accumulates after each successful purchase. Two orders can arrive on the same day, so the ledger must have a predictable tie-breaker.",
        "Return paid order id and running_total across paid orders ordered by placed_on then id; use an explicit ROWS frame. Return rows ordered by id.",
        "id, running_total",
        "SELECT id,SUM(amount) OVER(ORDER BY placed_on,id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)::int AS running_total FROM orders WHERE status='paid' ORDER BY id;",
        '[{"id":1,"running_total":100},{"id":2,"running_total":300},{"id":3,"running_total":600},{"id":5,"running_total":900}]',
      ),
      query(
        "Compare each purchase with the previous one",
        "LAG LEAD",
        "Customer success wants to notice changes in basket size. The first purchase has no previous basket, and one customer's history must never leak into another customer's comparison.",
        "For paid orders return id and delta from that customer's previous paid amount using placed_on then id; first purchases need NULL delta. Order by id.",
        "id, delta",
        "SELECT id,amount-LAG(amount) OVER(PARTITION BY customer_id ORDER BY placed_on,id) AS delta FROM orders WHERE status='paid' ORDER BY id;",
        '[{"id":1,"delta":null},{"id":2,"delta":100},{"id":3,"delta":null},{"id":5,"delta":null}]',
      ),
      query(
        "Rank without punishing ties",
        "RANK DENSE_RANK ROW_NUMBER",
        "The salary dashboard should put equal salaries at the same level and leave no gaps between levels. A separate position still needs to identify each employee uniquely.",
        "Return staff id, salary_level from DENSE_RANK over salary descending, and position from ROW_NUMBER over salary descending then id. Order by id.",
        "id, salary_level, position",
        "SELECT id,DENSE_RANK() OVER(ORDER BY salary DESC)::int AS salary_level,ROW_NUMBER() OVER(ORDER BY salary DESC,id)::int AS position FROM staff ORDER BY id;",
        '[{"id":1,"salary_level":1,"position":1},{"id":2,"salary_level":2,"position":2},{"id":3,"salary_level":2,"position":3},{"id":4,"salary_level":3,"position":4}]',
      ),
      query(
        "Walk the reporting tree",
        "Recursive CTEs",
        "HR needs a reporting-depth list starting with the director. The hierarchy may grow beyond today's two levels, so a fixed chain of joins would soon stop working.",
        "Return id and depth for every staff member reachable from a root with manager_id NULL; root depth is zero. Traverse recursively and order by id. Staff data is an acyclic tree.",
        "id, depth",
        "WITH RECURSIVE tree AS (SELECT id,0 AS depth FROM staff WHERE manager_id IS NULL UNION ALL SELECT s.id,t.depth+1 FROM staff s JOIN tree t ON s.manager_id=t.id) SELECT id,depth FROM tree ORDER BY id;",
        '[{"id":1,"depth":0},{"id":2,"depth":1},{"id":3,"depth":1},{"id":4,"depth":2}]',
        `INSERT INTO staff VALUES(5,'Eli',4,3000); DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM answer WHERE id=5 AND depth=3) THEN RAISE EXCEPTION 'Traverse deeper levels'; END IF; END $$;`,
      ),
      query(
        "Turn statuses into dashboard columns",
        "Conditional aggregation and pivot",
        "Operations wants one row per customer with paid and cancelled totals side by side. Quiet customers must remain visible, so reuse the inclusive reporting rule from the first stage.",
        "Return customer id, paid and cancelled amounts; both totals default to zero. Order by id. Use conditional aggregation rather than PostgreSQL extensions.",
        "id, paid, cancelled",
        "SELECT c.id,COALESCE(SUM(o.amount) FILTER(WHERE status='paid'),0)::int AS paid,COALESCE(SUM(o.amount) FILTER(WHERE status='cancelled'),0)::int AS cancelled FROM customers c LEFT JOIN orders o ON o.customer_id=c.id GROUP BY c.id ORDER BY c.id;",
        '[{"id":1,"paid":300,"cancelled":0},{"id":2,"paid":300,"cancelled":50},{"id":3,"paid":0,"cancelled":0},{"id":4,"paid":300,"cancelled":0}]',
      ),
      query(
        "Unpivot the dashboard export",
        "Unpivot with lateral values",
        "The analytics importer expects rows labelled paid or cancelled, while operations exports two columns. Convert the wide totals back into a small, consistent event-style report.",
        "For customer 2, compute paid and cancelled totals then return kind and total as two rows. Sort by kind: cancelled then paid.",
        "kind, total",
        "WITH totals AS (SELECT COALESCE(SUM(amount) FILTER(WHERE status='paid'),0)::int AS paid,COALESCE(SUM(amount) FILTER(WHERE status='cancelled'),0)::int AS cancelled FROM orders WHERE customer_id=2) SELECT v.kind,v.total FROM totals CROSS JOIN LATERAL (VALUES ('paid',paid),('cancelled',cancelled)) v(kind,total) ORDER BY kind;",
        '[{"kind":"cancelled","total":50},{"kind":"paid","total":300}]',
      ),
    ],
  ),
];
sqlRoadmapCourses[1].lessons.push(
  query(
    "Report monthly growth safely",
    "Date functions numeric functions CASE",
    "Finance wants monthly revenue and an average paid basket size, rounded for display. Cancelled purchases should never enter these figures, and months must not be sorted alphabetically by their labels.",
    "Return month as YYYY-MM text, total as integer paid revenue and average as numeric average amount rounded to two decimals. Include only paid orders, group by calendar month and sort by month.",
    "month, total, average",
    "SELECT to_char(placed_on,'YYYY-MM') AS month,SUM(amount)::int AS total,ROUND(AVG(amount),2) AS average FROM orders WHERE status='paid' GROUP BY to_char(placed_on,'YYYY-MM') ORDER BY month;",
    '[{"month":"2026-01","total":600,"average":200.00},{"month":"2026-02","total":300,"average":300.00}]',
  ),
  query(
    "Reconcile mismatched imported IDs",
    "FULL OUTER JOIN",
    "A migration contains customers without purchases and a purchase whose customer record was lost. An inner join would hide both problems. Build the exception report before repairing the import.",
    "Using customers and a CTE imported(id) with values 1,2,99, return missing id and issue: customer_only when the customer has no imported ID, import_only when the import has no customer. Exclude matching IDs and order by id. Use a full outer join.",
    "id, issue",
    "WITH imported(id) AS(VALUES(1),(2),(99)) SELECT COALESCE(c.id,i.id) AS id,CASE WHEN c.id IS NULL THEN 'import_only' ELSE 'customer_only' END AS issue FROM customers c FULL OUTER JOIN imported i ON c.id=i.id WHERE c.id IS NULL OR i.id IS NULL ORDER BY id;",
    '[{"id":3,"issue":"customer_only"},{"id":4,"issue":"customer_only"},{"id":99,"issue":"import_only"}]',
  ),
);
function procedural(
  title,
  topic,
  mission,
  goal,
  example,
  solution,
  assertion,
  resetSql,
) {
  const declaration = solution.slice(0, solution.indexOf("AS $$") + 5);
  return {
    ...pg(
      title,
      topic,
      goal,
      solution,
      assertion,
      "Use PostgreSQL PL/pgSQL, validate inputs, and keep data values separate from SQL identifiers.",
    ),
    seed,
    mission,
    goal,
    example,
    resetSql,
    roadmapTopics: [topic],
    starter:
      declaration +
      "\nBEGIN\n  RAISE EXCEPTION 'Implement this task';\nEND $$;\n",
  };
}
sqlRoadmapCourses.push(
  make(
    "sql-programming-roadmap",
    "sql",
    "SQL · Safe database programming",
    "Reuse relational knowledge in parameterized dynamic queries and controlled updates. Function declarations are supplied task contracts, not DDL lessons.",
    ["Dynamic SQL", "Stored functions", "DML", "Transactions"],
    [
      procedural(
        "Let users choose a safe sort order",
        "Dynamic SQL and SQL injection prevention",
        "A reporting screen lets users select a staff sort field. Directly pasting that text into SQL would let an attacker turn a harmless report into another command. Restrict choices and quote the identifier correctly.",
        "Implement staff_names(sort_field text) RETURNS TABLE(name text). Accept only id, name or salary; reject every other value, including NULL, with SQLSTATE 22023. Return staff names ordered by that field ascending then id ascending. Use dynamic EXECUTE with format('%I',...) for the approved identifier; never execute arbitrary input.",
        "staff_names('salary') → Dina, Ben, Chen, Aina; staff_names('id; DROP TABLE staff') → SQLSTATE 22023 and staff remains intact.",
        `CREATE OR REPLACE FUNCTION staff_names(sort_field text) RETURNS TABLE(name text) LANGUAGE plpgsql AS $$ BEGIN IF sort_field IS NULL OR sort_field NOT IN ('id','name','salary') THEN RAISE EXCEPTION 'Unsupported sort' USING ERRCODE='22023'; END IF; RETURN QUERY EXECUTE format('SELECT s.name FROM staff s ORDER BY s.%I, s.id',sort_field); END $$;`,
        `(SELECT array_agg(name) FROM staff_names('salary'))=ARRAY['Dina','Ben','Chen','Aina'] AND (SELECT array_agg(name) FROM staff_names('id'))=ARRAY['Aina','Ben','Chen','Dina']`,
        "DROP FUNCTION IF EXISTS staff_names(text);",
      ),
      procedural(
        "Apply a guarded pay review",
        "UPDATE RETURNING and stored functions",
        "HR approves a fixed raise for one employee, then needs the updated salary for its audit trail. A typo in the employee ID or a negative raise must not silently change unrelated staff.",
        "Implement raise_salary(staff_id int, increase int) RETURNS int. Reject NULL or nonpositive increases with SQLSTATE 22023; update only the matching staff row and return the new salary using UPDATE RETURNING. Missing staff must raise SQLSTATE P0002. The checker rolls back all changes.",
        "raise_salary(4,500) → 4500; staff 1 stays at 9000; missing ID raises P0002; increase 0 raises 22023.",
        `CREATE OR REPLACE FUNCTION raise_salary(staff_id int,increase int) RETURNS int LANGUAGE plpgsql AS $$ DECLARE result int; BEGIN IF increase IS NULL OR increase<=0 THEN RAISE EXCEPTION 'Invalid increase' USING ERRCODE='22023'; END IF; UPDATE staff SET salary=salary+increase WHERE id=staff_id RETURNING salary INTO result; IF NOT FOUND THEN RAISE EXCEPTION 'Staff missing' USING ERRCODE='P0002'; END IF; RETURN result; END $$;`,
        `raise_salary(4,500)=4500 AND (SELECT salary FROM staff WHERE id=1)=9000`,
        "DROP FUNCTION IF EXISTS raise_salary(int,int);",
      ),
    ],
  ),
);
const dynamic = sqlRoadmapCourses[2].lessons[0];
dynamic.check = dynamic.check.replace(
  "SELECT 'DEVLAB_TESTS_PASSED';",
  () => `DO $$ BEGIN
  BEGIN PERFORM * FROM staff_names('id; DROP TABLE staff'); RAISE EXCEPTION 'Unsafe input accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM * FROM staff_names(NULL); RAISE EXCEPTION 'NULL accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  IF (SELECT count(*) FROM staff)<>4 THEN RAISE EXCEPTION 'Staff altered'; END IF;
END $$; SELECT 'DEVLAB_TESTS_PASSED';`,
);
const raise = sqlRoadmapCourses[2].lessons[1];
raise.check = raise.check.replace(
  "SELECT 'DEVLAB_TESTS_PASSED';",
  () => `DO $$ BEGIN
  BEGIN PERFORM raise_salary(4,0); RAISE EXCEPTION 'Zero accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM raise_salary(4,-5); RAISE EXCEPTION 'Negative increase accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM raise_salary(4,NULL); RAISE EXCEPTION 'NULL accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM raise_salary(999,1); RAISE EXCEPTION 'Missing staff accepted'; EXCEPTION WHEN no_data_found THEN NULL; END;
  IF (SELECT salary FROM staff WHERE id=4)<>4500 THEN RAISE EXCEPTION 'Invalid request changed salary'; END IF;
END $$; SELECT 'DEVLAB_TESTS_PASSED';`,
);
