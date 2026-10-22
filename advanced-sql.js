import { oracleTopic } from "./advanced-oracle.js";
import { pg } from "./exercise-factories.js";
const seed = `CREATE TABLE customers(id int PRIMARY KEY,name text,city text);
CREATE TABLE orders(id int PRIMARY KEY,customer_id int,amount int,status text,placed_on date);
CREATE TABLE staff(id int PRIMARY KEY,name text,manager_id int,salary int);
INSERT INTO customers VALUES(1,'Aina','KL'),(2,'Ben','JB'),(3,'Chen',NULL),(4,'Dina','KL');
INSERT INTO orders VALUES(1,1,100,'paid','2026-01-01'),(2,1,200,'paid','2026-01-02'),(3,2,300,'paid','2026-01-02'),(4,2,50,'cancelled','2026-01-03'),(5,4,300,'paid','2026-02-01'),(6,NULL,40,'paid','2026-02-03');
INSERT INTO staff VALUES(1,'Aina',NULL,9000),(2,'Ben',1,6000),(3,'Chen',1,6000),(4,'Dina',2,4000);`;
const variation = `INSERT INTO customers VALUES(9,' New ','KL'),(10,'Empty','JB'); INSERT INTO orders VALUES(90,9,450,'paid','2026-03-02'),(91,1,0,'paid','2026-03-02'),(92,9,20,'cancelled','2026-03-03'); INSERT INTO staff VALUES(9,'New',2,6000);`;
function query(title, goal, solution) {
  const assert = `DO $verify$ DECLARE actual jsonb; expected jsonb; BEGIN SELECT COALESCE(jsonb_agg(to_jsonb(a)),'[]') INTO actual FROM answer a; SELECT COALESCE(jsonb_agg(to_jsonb(e)),'[]') INTO expected FROM (${solution.replace(/;\s*$/, "")}) e; IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Result columns, values, multiplicity or ordering failed'; END IF; END $verify$;`;
  return {
    title,
    engine: "postgres",
    type: "workspace",
    filename: "solution.sql",
    starter: "-- Write one SELECT or WITH query.\n",
    solution: solution + ";",
    seed,
    queryResult: true,
    mission: `The workshop's reporting team needs a reliable answer to this problem: ${title.toLowerCase()}. Their reports must still work after new customers and orders arrive.`,
    goal,
    task:
      goal +
      " Schema: customers(id,name,city); orders(id,customer_id,amount in cents,status,placed_on); staff(id,name,manager_id,salary). Tables are provided; do not create answer views or tables.",
    concept:
      "Produce a data-dependent result instead of hard-coded rows. Handle missing matches, duplicate values, deterministic ordering and future rows.",
    example:
      "The checker validates the seeded dataset, then inserts new customers, orders and staff and validates again.",
    hint: "Inspect the supplied rows. Work out the result's grain before joining; define tie-breaking and NULL behavior explicitly.",
    check:
      assert +
      "\n" +
      variation +
      "\n" +
      assert +
      "\nSELECT 'DEVLAB_TESTS_PASSED';",
  };
}
export const sqlTopics = [];
const pair = (base, name, a, b) =>
  sqlTopics.push({ base, name, questions: [query(...a), query(...b)] });
pair(
  "hands-sql-relational:0",
  "Joins and missing matches",
  [
    "Reconcile paid and orphaned orders",
    "Return id, paid_total, paid_orders for every customer, including zeros for customers with no paid orders. Ignore orders with missing customer IDs and cancelled orders. Sort by customer id.",
    `SELECT c.id,COALESCE(SUM(o.amount),0) AS paid_total,COUNT(o.id) AS paid_orders FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.status='paid' GROUP BY c.id ORDER BY c.id`,
  ],
  [
    "Explain orphan revenue",
    "Return bucket and total for all paid orders, classifying them as known when customer_id joins a customer or orphan otherwise. Include only buckets with rows; sort bucket alphabetically. Each order must be counted once.",
    `SELECT CASE WHEN c.id IS NULL THEN 'orphan' ELSE 'known' END AS bucket,SUM(o.amount) AS total FROM orders o LEFT JOIN customers c ON c.id=o.customer_id WHERE o.status='paid' GROUP BY 1 ORDER BY 1`,
  ],
);
pair(
  "hands-sql-relational:1",
  "Correlated subqueries and anti-joins",
  [
    "Find never-converted customers",
    "Return id for customers with no paid order strictly above 200 cents. Cancelled orders do not count. Include customers with no orders and sort id ascending.",
    `SELECT c.id FROM customers c WHERE NOT EXISTS(SELECT 1 FROM orders o WHERE o.customer_id=c.id AND o.status='paid' AND o.amount>200) ORDER BY c.id`,
  ],
  [
    "Find customers with repeat dates",
    "Return id for customers with paid orders on at least two distinct calendar dates; do not mistake two orders on one day for retention. Sort id.",
    `SELECT c.id FROM customers c WHERE (SELECT COUNT(DISTINCT o.placed_on) FROM orders o WHERE o.customer_id=c.id AND o.status='paid')>=2 ORDER BY c.id`,
  ],
);
pair(
  "hands-sql-relational:2",
  "Aggregation, HAVING and report grain",
  [
    "Locate strong customer-days",
    "Return customer_id, placed_on, total for paid customer-days totaling at least 200 cents, excluding orphan orders. Sort date ascending then customer_id.",
    `SELECT o.customer_id,o.placed_on,SUM(o.amount) AS total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='paid' GROUP BY o.customer_id,o.placed_on HAVING SUM(o.amount)>=200 ORDER BY o.placed_on,o.customer_id`,
  ],
  [
    "Compare city-level averages fairly",
    "Return city, customers, avg_total for each city, treating NULL city as unknown. Average each customer's total paid spending including quiet customers, rounded to two decimal places. Sort city lexically.",
    `WITH totals AS(SELECT c.id,COALESCE(c.city,'unknown') AS city,COALESCE(SUM(o.amount),0) AS total FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.status='paid' GROUP BY c.id,c.city) SELECT city,COUNT(*) AS customers,ROUND(AVG(total),2) AS avg_total FROM totals GROUP BY city ORDER BY city`,
  ],
);
pair(
  "hands-sql-relational:5",
  "NULL, CASE and string functions",
  [
    "Build canonical customer labels",
    "Return id,label for every customer: trimmed uppercase name, slash, and lowercase trimmed city; a NULL or blank city becomes unknown. Sort id.",
    `SELECT id,UPPER(TRIM(name))||'/'||COALESCE(NULLIF(LOWER(TRIM(city)),''),'unknown') AS label FROM customers ORDER BY id`,
  ],
  [
    "Classify customers without NULL traps",
    "Return id,band where lifetime paid totals >=400 mean gold, >=200 silver, otherwise base. Quiet customers are base and cancelled orders never count; sort id.",
    `SELECT c.id,CASE WHEN COALESCE(SUM(o.amount),0)>=400 THEN 'gold' WHEN COALESCE(SUM(o.amount),0)>=200 THEN 'silver' ELSE 'base' END AS band FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.status='paid' GROUP BY c.id ORDER BY c.id`,
  ],
);
pair(
  "hands-sql-relational:4",
  "UNION, INTERSECT and EXCEPT",
  [
    "Reconcile buyers across months",
    "Return customer_id for paid January buyers who are not paid February buyers. Exclude NULL and unknown customer IDs, deduplicate and sort ascending.",
    `SELECT customer_id FROM orders WHERE status='paid' AND placed_on>='2026-01-01' AND placed_on<'2026-02-01' AND customer_id IN(SELECT id FROM customers) EXCEPT SELECT customer_id FROM orders WHERE status='paid' AND placed_on>='2026-02-01' AND placed_on<'2026-03-01' ORDER BY customer_id`,
  ],
  [
    "Find paid and cancelled overlap",
    "Return customer_id appearing in both paid and cancelled orders, with valid matching customers only; deduplicate and sort ascending.",
    `SELECT customer_id FROM orders WHERE status='paid' AND customer_id IN(SELECT id FROM customers) INTERSECT SELECT customer_id FROM orders WHERE status='cancelled' AND customer_id IN(SELECT id FROM customers) ORDER BY customer_id`,
  ],
);
pair(
  "hands-sql-analytics:0",
  "CTEs and window frames",
  [
    "Build a deterministic running ledger",
    "Return id,customer_id,running_total for paid orders with known customers. Partition totals by customer and order by placed_on,id using a ROWS frame. Output customer_id,placed_on,id order.",
    `SELECT o.id,o.customer_id,SUM(o.amount) OVER(PARTITION BY o.customer_id ORDER BY o.placed_on,o.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='paid' ORDER BY o.customer_id,o.placed_on,o.id`,
  ],
  [
    "Measure the last two purchases",
    "Return id,customer_id,last_two_total for known-customer paid orders: current plus the preceding paid order in placed_on,id order, not preceding calendar day. Output customer_id,placed_on,id order.",
    `SELECT o.id,o.customer_id,SUM(o.amount) OVER(PARTITION BY o.customer_id ORDER BY o.placed_on,o.id ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) AS last_two_total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='paid' ORDER BY o.customer_id,o.placed_on,o.id`,
  ],
);
pair(
  "hands-sql-analytics:1",
  "LAG and LEAD",
  [
    "Compare successive paid purchases",
    "Return id,previous_amount,delta for known-customer paid orders, using placed_on,id order per customer. The first order's previous_amount and delta are NULL. Output customer_id,placed_on,id order.",
    `SELECT o.id,LAG(o.amount) OVER w AS previous_amount,o.amount-LAG(o.amount) OVER w AS delta FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='paid' WINDOW w AS(PARTITION BY o.customer_id ORDER BY o.placed_on,o.id) ORDER BY o.customer_id,o.placed_on,o.id`,
  ],
  [
    "Measure time until the next order",
    "Return id,days_until_next for known-customer paid orders; calendar-day distance to the next paid order, NULL at the end. Use deterministic placed_on,id order and output customer_id,placed_on,id order.",
    `SELECT o.id,LEAD(o.placed_on) OVER(PARTITION BY o.customer_id ORDER BY o.placed_on,o.id)-o.placed_on AS days_until_next FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='paid' ORDER BY o.customer_id,o.placed_on,o.id`,
  ],
);
pair(
  "hands-sql-analytics:2",
  "RANK, DENSE_RANK and ROW_NUMBER",
  [
    "Rank staff fairly within reporting groups",
    "Return id,pay_rank,pay_dense,position for all staff, partitioning by manager_id (including root group). Rank salary descending; position also breaks ties by id ascending. Output manager_id NULLS FIRST, salary descending, id.",
    `SELECT id,RANK() OVER(PARTITION BY manager_id ORDER BY salary DESC) AS pay_rank,DENSE_RANK() OVER(PARTITION BY manager_id ORDER BY salary DESC) AS pay_dense,ROW_NUMBER() OVER(PARTITION BY manager_id ORDER BY salary DESC,id) AS position FROM staff ORDER BY manager_id NULLS FIRST,salary DESC,id`,
  ],
  [
    "Select two distinct salary bands",
    "Return id,salary for staff in the top two distinct salary bands per manager_id, including all ties. Sort manager_id NULLS FIRST, salary descending, id.",
    `WITH ranked AS(SELECT *,DENSE_RANK() OVER(PARTITION BY manager_id ORDER BY salary DESC) AS r FROM staff) SELECT id,salary FROM ranked WHERE r<=2 ORDER BY manager_id NULLS FIRST,salary DESC,id`,
  ],
);
pair(
  "hands-sql-analytics:3",
  "Recursive CTEs and hierarchy traversal",
  [
    "Walk every reporting path",
    "Return id,depth,path for staff reachable from manager_id IS NULL roots. depth starts at 0; path is an integer array of IDs from root to employee. Prevent cycles using the path. Sort path.",
    `WITH RECURSIVE tree AS(SELECT id,0 AS depth,ARRAY[id] AS path FROM staff WHERE manager_id IS NULL UNION ALL SELECT s.id,t.depth+1,t.path||s.id FROM staff s JOIN tree t ON s.manager_id=t.id WHERE NOT s.id=ANY(t.path)) SELECT id,depth,path FROM tree ORDER BY path`,
  ],
  [
    "Roll up direct and indirect reports",
    "Return id,descendants for every staff member, excluding the member themself. Traverse arbitrary depth and avoid cycles; sort id.",
    `WITH RECURSIVE paths AS(SELECT id AS root,id,ARRAY[id] AS path FROM staff UNION ALL SELECT p.root,s.id,p.path||s.id FROM paths p JOIN staff s ON s.manager_id=p.id WHERE NOT s.id=ANY(p.path)) SELECT root AS id,COUNT(DISTINCT id)-1 AS descendants FROM paths GROUP BY root ORDER BY root`,
  ],
);
pair(
  "hands-sql-analytics:4",
  "Conditional aggregation and pivot",
  [
    "Build a zero-safe status dashboard",
    "Return id,paid,cancelled for every customer, with total amounts in each status and zeros when absent. Sort id; avoid fan-out by joining each order once.",
    `SELECT c.id,COALESCE(SUM(o.amount) FILTER(WHERE o.status='paid'),0) AS paid,COALESCE(SUM(o.amount) FILTER(WHERE o.status='cancelled'),0) AS cancelled FROM customers c LEFT JOIN orders o ON o.customer_id=c.id GROUP BY c.id ORDER BY c.id`,
  ],
  [
    "Pivot monthly customer totals",
    "Return id,jan,feb,other for each customer: paid order amounts in January 2026, February 2026 and all other dates. Include zeros/quiet customers and sort id.",
    `SELECT c.id,COALESCE(SUM(o.amount) FILTER(WHERE o.placed_on>='2026-01-01' AND o.placed_on<'2026-02-01'),0) AS jan,COALESCE(SUM(o.amount) FILTER(WHERE o.placed_on>='2026-02-01' AND o.placed_on<'2026-03-01'),0) AS feb,COALESCE(SUM(o.amount) FILTER(WHERE o.placed_on<'2026-01-01' OR o.placed_on>='2026-03-01'),0) AS other FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.status='paid' GROUP BY c.id ORDER BY c.id`,
  ],
);
pair(
  "hands-sql-analytics:5",
  "LATERAL and unpivot",
  [
    "Select a latest paid order per customer",
    "Return id,order_id,amount for every customer and their latest paid order by placed_on DESC,id DESC. Quiet customers retain NULL order fields. Sort customer id.",
    `SELECT c.id,o.id AS order_id,o.amount FROM customers c LEFT JOIN LATERAL(SELECT id,amount FROM orders WHERE customer_id=c.id AND status='paid' ORDER BY placed_on DESC,id DESC LIMIT 1)o ON true ORDER BY c.id`,
  ],
  [
    "Unpivot paid and cancelled totals",
    "Return id,status,total with exactly two rows per customer: paid and cancelled, including zero totals. Sort customer id then status alphabetically.",
    `WITH totals AS(SELECT c.id,COALESCE(SUM(o.amount) FILTER(WHERE o.status='paid'),0) AS paid,COALESCE(SUM(o.amount) FILTER(WHERE o.status='cancelled'),0) AS cancelled FROM customers c LEFT JOIN orders o ON o.customer_id=c.id GROUP BY c.id) SELECT t.id,v.status,v.total FROM totals t CROSS JOIN LATERAL(VALUES('paid',t.paid),('cancelled',t.cancelled))v(status,total) ORDER BY t.id,v.status`,
  ],
);
pair(
  "hands-sql-analytics:6",
  "Date arithmetic and numeric reporting",
  [
    "Fill empty months in a revenue series",
    "Return month,total for January through March 2026 as YYYY-MM text, with all paid revenue including orphan orders and zero for empty months. Sort month.",
    `SELECT TO_CHAR(m,'YYYY-MM') AS month,COALESCE(SUM(o.amount),0) AS total FROM generate_series(date '2026-01-01',date '2026-03-01',interval '1 month')m LEFT JOIN orders o ON o.placed_on>=m AND o.placed_on<m+interval '1 month' AND o.status='paid' GROUP BY m ORDER BY m`,
  ],
  [
    "Compute growth without dividing by zero",
    "Return month,total,growth_pct for January through March 2026; same revenue definition as the first challenge. growth_pct is percent change from the previous month's total rounded to two decimals; NULL for the first month or a zero previous total. Sort month.",
    `WITH monthly AS(SELECT m,COALESCE(SUM(o.amount),0) AS total FROM generate_series(date '2026-01-01',date '2026-03-01',interval '1 month')m LEFT JOIN orders o ON o.placed_on>=m AND o.placed_on<m+interval '1 month' AND o.status='paid' GROUP BY m), lagged AS(SELECT *,LAG(total) OVER(ORDER BY m) AS previous FROM monthly) SELECT TO_CHAR(m,'YYYY-MM') AS month,total,ROUND(100.0*(total-previous)/NULLIF(previous,0),2) AS growth_pct FROM lagged ORDER BY m`,
  ],
);
function program(title, goal, solution, assertion, fixtures = seed) {
  return {
    ...pg(
      title,
      "Advanced PostgreSQL programming",
      goal,
      solution,
      assertion,
      "Use an explicit failure policy, parameterized values and transaction-safe mutations.",
    ),
    seed: fixtures,
    mission: `Operations needs to ${title.toLowerCase()} without corrupting a live database.`,
    goal,
    example: goal,
  };
}
const proc = (base, name, a, b) =>
  sqlTopics.push({ base, name, questions: [program(...a), program(...b)] });
proc(
  "hands-sql-postgres:0",
  "PL/pgSQL branching and loops",
  [
    "Apply a bounded progressive fee",
    "Create fee(cents bigint) RETURNS bigint IMMUTABLE: reject NULL/negative with SQLSTATE 22023; first 1000 cents have no fee, next 4000 cost 10% and excess costs 20%, with integer truncation per band. Do not use floating point.",
    `CREATE OR REPLACE FUNCTION fee(cents bigint) RETURNS bigint LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN IF cents IS NULL OR cents<0 THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;RETURN LEAST(GREATEST(cents-1000,0),4000)/10+GREATEST(cents-5000,0)/5;END $$;`,
    `fee(0)=0 AND fee(1000)=0 AND fee(1500)=50 AND fee(6000)=600`,
  ],
  [
    "Accumulate a validated fee batch",
    "Create fees(amounts bigint[]) RETURNS bigint using fee logic from the first challenge: NULL arrays or NULL/negative elements raise 22023, empty arrays return 0. Loop and sum using bigint overflow checks supplied by PostgreSQL. Include fee(cents) in your answer.",
    `CREATE OR REPLACE FUNCTION fee(cents bigint) RETURNS bigint LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN IF cents IS NULL OR cents<0 THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;RETURN LEAST(GREATEST(cents-1000,0),4000)/10+GREATEST(cents-5000,0)/5;END $$; CREATE OR REPLACE FUNCTION fees(amounts bigint[]) RETURNS bigint LANGUAGE plpgsql AS $$ DECLARE x bigint; total bigint:=0; BEGIN IF amounts IS NULL THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;FOREACH x IN ARRAY amounts LOOP total:=total+fee(x);END LOOP;RETURN total;END $$;`,
    `fees(ARRAY[0,1500,6000]::bigint[])=650 AND fees(ARRAY[]::bigint[])=0`,
  ],
);
proc(
  "hands-sql-postgres:1",
  "Cursors and procedural aggregation",
  [
    "Cursor-scan a paginated payroll range",
    "Create payroll_after(after_id int, take int) RETURNS bigint. Reject NULL inputs or negative take with 22023. Using a cursor, sum salaries of at most take staff rows with id>after_id in ascending id order. Empty selections return zero.",
    `CREATE OR REPLACE FUNCTION payroll_after(after_id int,take int) RETURNS bigint LANGUAGE plpgsql AS $$ DECLARE row record; total bigint:=0; n int:=0; cur CURSOR FOR SELECT salary FROM staff WHERE id>after_id ORDER BY id; BEGIN IF after_id IS NULL OR take IS NULL OR take<0 THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;OPEN cur;LOOP EXIT WHEN n>=take;FETCH cur INTO row;EXIT WHEN NOT FOUND;total:=total+row.salary;n:=n+1;END LOOP;CLOSE cur;RETURN total;END $$;`,
    `payroll_after(1,2)=12000 AND payroll_after(99,3)=0 AND payroll_after(0,0)=0`,
  ],
  [
    "Reconcile a cursor ledger",
    "Create payroll_until(limit_cents bigint) RETURNS int: scan staff by id using an explicit cursor; count the longest prefix whose cumulative salaries stay <= the nonnegative limit. Stop at the first unaffordable row, even if later rows would fit. NULL/negative limits raise 22023.",
    `CREATE OR REPLACE FUNCTION payroll_until(limit_cents bigint) RETURNS int LANGUAGE plpgsql AS $$ DECLARE row record; total bigint:=0; n int:=0; cur CURSOR FOR SELECT salary FROM staff ORDER BY id;BEGIN IF limit_cents IS NULL OR limit_cents<0 THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;OPEN cur;LOOP FETCH cur INTO row;EXIT WHEN NOT FOUND;EXIT WHEN total+row.salary>limit_cents;total:=total+row.salary;n:=n+1;END LOOP;CLOSE cur;RETURN n;END $$;`,
    `payroll_until(8000)=0 AND payroll_until(15000)=2 AND payroll_until(999999)=4`,
  ],
);
proc(
  "hands-sql-programming-roadmap:0",
  "Safe dynamic SQL",
  [
    "Expose an allowlisted staff sorter",
    "Create sorted_staff(sort_key text) RETURNS TABLE(id int,salary int). Only id or salary are allowed, with ascending order and id as tie-breaker; all other inputs raise 22023. Use identifier-safe dynamic SQL; never concatenate unchecked SQL.",
    `CREATE OR REPLACE FUNCTION sorted_staff(sort_key text) RETURNS TABLE(id int,salary int) LANGUAGE plpgsql AS $$ BEGIN IF sort_key IS NULL OR sort_key NOT IN('id','salary') THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;RETURN QUERY EXECUTE format('SELECT id,salary FROM staff ORDER BY %I,id',sort_key);END $$;`,
    `(SELECT array_agg(s.id) FROM sorted_staff('salary')s)=ARRAY[4,2,3,1]`,
  ],
  [
    "Bind a dynamic query's values",
    "Create staff_above(sort_key text,min_salary int) RETURNS TABLE(id int,salary int). Same sort allowlist; require nonnegative nonnull min_salary, filter salary>=min_salary using EXECUTE ... USING, and order by selected column then id.",
    `CREATE OR REPLACE FUNCTION staff_above(sort_key text,min_salary int) RETURNS TABLE(id int,salary int) LANGUAGE plpgsql AS $$ BEGIN IF sort_key IS NULL OR sort_key NOT IN('id','salary') OR min_salary IS NULL OR min_salary<0 THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;RETURN QUERY EXECUTE format('SELECT id,salary FROM staff WHERE salary >= $1 ORDER BY %I,id',sort_key) USING min_salary;END $$;`,
    `(SELECT array_agg(s.id) FROM staff_above('salary',6000)s)=ARRAY[2,3,1] AND NOT EXISTS(SELECT 1 FROM staff_above('id',99999))`,
  ],
);
proc(
  "hands-sql-integrity:1",
  "Transactions and atomic mutations",
  [
    "Transfer using locked rows",
    "Create move_funds(src int,dst int,cents int) RETURNS void. Require positive amount, distinct existing accounts, sufficient funds. Lock the two account rows in ascending id order before updating; invalid operations raise 22023 and change neither balance.",
    `CREATE OR REPLACE FUNCTION move_funds(src int,dst int,cents int) RETURNS void LANGUAGE plpgsql AS $$ DECLARE available int;BEGIN IF src IS NULL OR dst IS NULL OR cents IS NULL OR src=dst OR cents<=0 THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;PERFORM 1 FROM accounts WHERE id IN(src,dst) ORDER BY id FOR UPDATE;IF (SELECT COUNT(*) FROM accounts WHERE id IN(src,dst))<>2 THEN RAISE EXCEPTION 'missing' USING ERRCODE='22023';END IF;SELECT balance INTO available FROM accounts WHERE id=src;IF available<cents THEN RAISE EXCEPTION 'insufficient' USING ERRCODE='22023';END IF;UPDATE accounts SET balance=balance-cents WHERE id=src;UPDATE accounts SET balance=balance+cents WHERE id=dst;END $$; DO $$BEGIN PERFORM move_funds(1,2,30);END $$;`,
    `(SELECT balance FROM accounts WHERE id=1)=70 AND (SELECT balance FROM accounts WHERE id=2)=50`,
    `CREATE TABLE accounts(id int PRIMARY KEY,balance int NOT NULL CHECK(balance>=0)); INSERT INTO accounts VALUES(1,100),(2,20);`,
  ],
  [
    "Reserve stock with one atomic statement",
    "Create reserve(sku text,quantity int) RETURNS boolean. NULL/blank SKU or nonpositive quantity raises 22023. Atomically subtract only if stock is sufficient; unknown/insufficient returns false and changes nothing. Do not read stock then update without a guard.",
    `CREATE OR REPLACE FUNCTION reserve(sku text,quantity int) RETURNS boolean LANGUAGE plpgsql AS $$ DECLARE touched int;BEGIN IF sku IS NULL OR btrim(sku)='' OR quantity IS NULL OR quantity<=0 THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;UPDATE inventory SET available=available-quantity WHERE code=sku AND available>=quantity;GET DIAGNOSTICS touched=ROW_COUNT;RETURN touched=1;END $$;`,
    `reserve('A',3) AND NOT reserve('A',3) AND (SELECT available FROM inventory WHERE code='A')=2 AND NOT reserve('missing',1)`,
    `CREATE TABLE inventory(code text PRIMARY KEY,available int NOT NULL CHECK(available>=0)); INSERT INTO inventory VALUES('A',5);`,
  ],
);

proc(
  "hands-sql-admin-workshop:0",
  "Schema metadata and constraints",
  [
    "Inspect nullable application columns",
    "Create nullable_columns() RETURNS TABLE(table_name text,column_name text), listing nullable columns of public tables only using information_schema. Sort by table then ordinal_position; do not hard-code schema names other than public or column lists.",
    `CREATE OR REPLACE FUNCTION nullable_columns() RETURNS TABLE(table_name text,column_name text) LANGUAGE sql AS $$ SELECT c.table_name::text,c.column_name::text FROM information_schema.columns c WHERE c.table_schema='public' AND c.is_nullable='YES' ORDER BY c.table_name,c.ordinal_position $$;`,
    `EXISTS(SELECT 1 FROM nullable_columns() WHERE table_name='customers' AND column_name='city') AND NOT EXISTS(SELECT 1 FROM nullable_columns() WHERE table_name='customers' AND column_name='id')`,
  ],
  [
    "Install a validated amount constraint",
    "Add a constraint named orders_amount_nonnegative to orders, requiring amount IS NOT NULL AND amount>=0. Use NOT VALID initially if needed, then validate it. Preserve existing orders and prove the named constraint is validated; do not drop/recreate the table.",
    `ALTER TABLE orders ADD CONSTRAINT orders_amount_nonnegative CHECK(amount IS NOT NULL AND amount>=0) NOT VALID; ALTER TABLE orders VALIDATE CONSTRAINT orders_amount_nonnegative;`,
    `EXISTS(SELECT 1 FROM pg_constraint WHERE conname='orders_amount_nonnegative' AND convalidated) AND (SELECT COUNT(*) FROM orders)=6`,
  ],
);
proc(
  "hands-sql-admin-workshop:4",
  "Indexes and query access paths",
  [
    "Index a paid customer timeline",
    "Create index paid_customer_timeline on orders(customer_id,placed_on DESC,id DESC) WHERE status='paid'. It must be a partial btree index with this key order, supporting latest paid order per customer. Preserve table rows.",
    `CREATE INDEX paid_customer_timeline ON orders(customer_id,placed_on DESC,id DESC) WHERE status='paid';`,
    `EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='paid_customer_timeline' AND indexdef LIKE '%customer_id, placed_on DESC, id DESC%' AND indexdef LIKE '%WHERE%paid%')`,
  ],
  [
    "Make normalized name lookup indexable",
    "Create index customer_name_normalized on customers(lower(btrim(name))). Also create find_customer(search text) RETURNS TABLE(id int) that performs the same normalized comparison, rejects NULL/blank search with 22023 and returns ids ascending.",
    `CREATE INDEX customer_name_normalized ON customers(lower(btrim(name))); CREATE OR REPLACE FUNCTION find_customer(search text) RETURNS TABLE(id int) LANGUAGE plpgsql AS $$ BEGIN IF search IS NULL OR btrim(search)='' THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;RETURN QUERY SELECT c.id FROM customers c WHERE lower(btrim(c.name))=lower(btrim(search)) ORDER BY c.id;END $$;`,
    `EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='customer_name_normalized' AND indexdef LIKE '%lower(btrim(name))%') AND (SELECT array_agg(id) FROM find_customer(' aina '))=ARRAY[1]`,
  ],
);
proc(
  "hands-sql-admin-workshop:5",
  "Bounded retention and maintenance",
  [
    "Delete the oldest eligible rows in a bounded batch",
    "Create purge_orders(before_date date,batch_size int) RETURNS int. Delete at most batch_size cancelled orders strictly before before_date, oldest placed_on then id first. Reject NULL inputs or batch_size outside 1..100 with 22023. Paid orders must never be removed.",
    `CREATE OR REPLACE FUNCTION purge_orders(before_date date,batch_size int) RETURNS int LANGUAGE plpgsql AS $$ DECLARE n int;BEGIN IF before_date IS NULL OR batch_size IS NULL OR batch_size<1 OR batch_size>100 THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;WITH doomed AS(SELECT id FROM orders WHERE status='cancelled' AND placed_on<before_date ORDER BY placed_on,id LIMIT batch_size),gone AS(DELETE FROM orders o USING doomed d WHERE o.id=d.id RETURNING o.id)SELECT COUNT(*) INTO n FROM gone;RETURN n;END $$;`,
    `purge_orders('2026-02-01',1)=1 AND NOT EXISTS(SELECT 1 FROM orders WHERE id=4) AND (SELECT COUNT(*) FROM orders WHERE status='paid')=5`,
  ],
  [
    "Preview retention before deleting anything",
    "Create retention_preview(before_date date,batch_size int) RETURNS TABLE(id int,placed_on date), using the exact eligibility/order/limits from the first challenge without modifying any data. Reject NULL/invalid arguments with 22023.",
    `CREATE OR REPLACE FUNCTION retention_preview(before_date date,batch_size int) RETURNS TABLE(id int,placed_on date) LANGUAGE plpgsql AS $$ BEGIN IF before_date IS NULL OR batch_size IS NULL OR batch_size<1 OR batch_size>100 THEN RAISE EXCEPTION 'invalid' USING ERRCODE='22023';END IF;RETURN QUERY SELECT o.id,o.placed_on FROM orders o WHERE o.status='cancelled' AND o.placed_on<before_date ORDER BY o.placed_on,o.id LIMIT batch_size;END $$;`,
    `(SELECT array_agg(id) FROM retention_preview('2026-02-01',2))=ARRAY[4] AND (SELECT COUNT(*) FROM orders)=6`,
  ],
);
// Exercise explicit invalid-argument paths, not just the seeded happy-path values.
const invalid = new Map([
  ["Apply a bounded progressive fee", ["fee(NULL)", "fee(-1)"]],
  [
    "Accumulate a validated fee batch",
    ["fees(NULL)", "fees(ARRAY[1,-1]::bigint[])"],
  ],
  [
    "Cursor-scan a paginated payroll range",
    ["payroll_after(NULL,1)", "payroll_after(0,-1)"],
  ],
  ["Reconcile a cursor ledger", ["payroll_until(-1)", "payroll_until(NULL)"]],
  [
    "Expose an allowlisted staff sorter",
    ["sorted_staff('salary; DROP TABLE staff')", "sorted_staff(NULL)"],
  ],
  [
    "Bind a dynamic query's values",
    ["staff_above('bad',0)", "staff_above('id',-1)"],
  ],
  [
    "Transfer using locked rows",
    ["move_funds(1,1,1)", "move_funds(1,99,1)", "move_funds(1,2,999)"],
  ],
  [
    "Reserve stock with one atomic statement",
    ["reserve(NULL,1)", "reserve('A',0)"],
  ],
  ["Make normalized name lookup indexable", ["find_customer(' ')"]],
  [
    "Delete the oldest eligible rows in a bounded batch",
    ["purge_orders(NULL,1)", "purge_orders('2026-01-01',0)"],
  ],
  [
    "Preview retention before deleting anything",
    ["retention_preview(NULL,1)", "retention_preview('2026-01-01',101)"],
  ],
]);
for (const topic of sqlTopics)
  for (const question of topic.questions)
    for (const call of invalid.get(question.title) || [])
      question.check += `\nDO $bad$ BEGIN BEGIN PERFORM ${call}; RAISE EXCEPTION 'Invalid input unexpectedly accepted'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END; END $bad$;`;

for (const topic of sqlTopics)
  for (const question of topic.questions) {
    if (question.title === "Reserve stock with one atomic statement")
      question.check = question.check.replace(
        /DO \$\$ BEGIN IF[\s\S]*?END \$\$;/,
        () =>
          `DO $$ BEGIN IF reserve('A',3) IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'First reserve failed';END IF; IF reserve('A',3) IS DISTINCT FROM FALSE THEN RAISE EXCEPTION 'Insufficient reserve changed state';END IF; IF (SELECT available FROM inventory WHERE code='A')<>2 THEN RAISE EXCEPTION 'Wrong remaining stock';END IF;IF reserve('missing',1) IS DISTINCT FROM FALSE THEN RAISE EXCEPTION 'Unknown SKU accepted';END IF;END $$;`,
      );
    if (question.title === "Delete the oldest eligible rows in a bounded batch")
      question.check = question.check.replace(
        /DO \$\$ BEGIN IF[\s\S]*?END \$\$;/,
        () =>
          `DO $$ DECLARE n int;BEGIN n:=purge_orders('2026-02-01',1);IF n<>1 OR EXISTS(SELECT 1 FROM orders WHERE id=4) OR (SELECT COUNT(*) FROM orders WHERE status='paid')<>5 THEN RAISE EXCEPTION 'Retention changed wrong rows';END IF;END $$;`,
      );
  }
proc(
  "hands-sql-admin-workshop:2",
  "Grants and least-privilege reporting",
  [
    "Expose a safe reporting view",
    "Revoke every PUBLIC privilege on orders, then create view order_summary exposing only id,customer_id,amount for paid orders. Grant PUBLIC SELECT on the view only; do not grant access to the base table or change existing rows.",
    `REVOKE ALL ON orders FROM PUBLIC; CREATE OR REPLACE VIEW order_summary AS SELECT id,customer_id,amount FROM orders WHERE status='paid'; GRANT SELECT ON order_summary TO PUBLIC;`,
    `NOT EXISTS(SELECT 1 FROM information_schema.role_table_grants WHERE grantee='PUBLIC' AND table_name='orders') AND EXISTS(SELECT 1 FROM information_schema.role_table_grants WHERE grantee='PUBLIC' AND table_name='order_summary' AND privilege_type='SELECT') AND (SELECT COUNT(*) FROM order_summary)=5`,
    seed + " GRANT SELECT,UPDATE ON orders TO PUBLIC;",
  ],
  [
    "Grant read access to selected columns only",
    "Revoke all PUBLIC table and column privileges on customers, then grant PUBLIC SELECT(id,name) only. city must remain unreadable through PUBLIC; never grant INSERT,UPDATE,DELETE or table-wide SELECT. This lab audits ACLs without creating global roles.",
    `REVOKE ALL ON customers FROM PUBLIC; REVOKE ALL(id,name,city) ON customers FROM PUBLIC; GRANT SELECT(id,name) ON customers TO PUBLIC;`,
    `(SELECT COUNT(*) FROM information_schema.column_privileges WHERE grantee='PUBLIC' AND table_name='customers' AND privilege_type='SELECT')=2 AND NOT EXISTS(SELECT 1 FROM information_schema.column_privileges WHERE grantee='PUBLIC' AND table_name='customers' AND column_name='city') AND NOT EXISTS(SELECT 1 FROM information_schema.role_table_grants WHERE grantee='PUBLIC' AND table_name='customers')`,
    seed + " GRANT SELECT,UPDATE ON customers TO PUBLIC;",
  ],
);

for (const topic of sqlTopics)
  for (const question of topic.questions) {
    if (question.queryResult) continue;
    const drops = [];
    for (const match of question.solution.matchAll(
      /CREATE OR REPLACE FUNCTION (\w+)(\([^)]*\))/gi,
    ))
      drops.push(`DROP FUNCTION IF EXISTS ${match[1]}${match[2]};`);
    for (const match of question.solution.matchAll(
      /CREATE OR REPLACE VIEW (\w+)/gi,
    ))
      drops.push(`DROP VIEW IF EXISTS ${match[1]};`);
    for (const match of question.solution.matchAll(/CREATE INDEX (\w+)/gi))
      drops.push(`DROP INDEX IF EXISTS ${match[1]};`);
    for (const match of question.solution.matchAll(
      /ALTER TABLE (\w+) ADD CONSTRAINT (\w+)/gi,
    ))
      drops.push(
        `ALTER TABLE ${match[1]} DROP CONSTRAINT IF EXISTS ${match[2]};`,
      );
    question.resetSql = drops.join("\n") || "SELECT 1;";
  }

for (const topic of sqlTopics)
  for (const question of topic.questions)
    if (question.title === "Install a validated amount constraint")
      question.check += `
DO $bounds$ BEGIN BEGIN INSERT INTO orders(id,amount)VALUES(991,-1);RAISE EXCEPTION 'Negative amount accepted';EXCEPTION WHEN check_violation THEN NULL;END;BEGIN INSERT INTO orders(id,amount)VALUES(992,NULL);RAISE EXCEPTION 'Null amount accepted';EXCEPTION WHEN check_violation THEN NULL;END;END $bounds$;`;

sqlTopics.push(oracleTopic);
