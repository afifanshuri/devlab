import { oracle } from "./exercise-factories.js";
const fee = `CREATE OR REPLACE FUNCTION progressive_fee(amount NUMBER) RETURN NUMBER IS
BEGIN
 IF amount IS NULL OR amount<0 OR amount<>TRUNC(amount) THEN RAISE_APPLICATION_ERROR(-20001,'Whole nonnegative cents required'); END IF;
 RETURN TRUNC(LEAST(GREATEST(amount-1000,0),4000)/10)+TRUNC(GREATEST(amount-5000,0)/5);
END;
/\n`;
const feeStarter = `CREATE OR REPLACE FUNCTION progressive_fee(amount NUMBER) RETURN NUMBER IS
BEGIN
 /* TODO */
 NULL;
END;
/\n`;
const feeTests = `DECLARE n NUMBER; BEGIN
 IF NVL(progressive_fee(0),-1)<>0 OR NVL(progressive_fee(1000),-1)<>0 OR NVL(progressive_fee(1500),-1)<>50 OR NVL(progressive_fee(6000),-1)<>600 THEN RAISE_APPLICATION_ERROR(-20002,'Fee boundary failed'); END IF;
 BEGIN n:=progressive_fee(-1); RAISE_APPLICATION_ERROR(-20002,'Negative accepted'); EXCEPTION WHEN OTHERS THEN IF SQLCODE<>-20001 THEN RAISE; END IF; END;
 BEGIN n:=progressive_fee(NULL); RAISE_APPLICATION_ERROR(-20002,'Null accepted'); EXCEPTION WHEN OTHERS THEN IF SQLCODE<>-20001 THEN RAISE; END IF; END;
 BEGIN n:=progressive_fee(1.5); RAISE_APPLICATION_ERROR(-20002,'Fraction accepted'); EXCEPTION WHEN OTHERS THEN IF SQLCODE<>-20001 THEN RAISE; END IF; END;
END;
/\n`;
const make = (title, mission, goal, starter, solution, checks, example) => ({
  ...oracle(
    title,
    "Advanced Oracle PL/SQL: boundaries, cursor iteration and application errors",
    goal,
    "SET SERVEROUTPUT ON\n" + solution,
    ["DEVLAB_TESTS_PASSED"],
  ),
  starter: "SET SERVEROUTPUT ON\n" + starter,
  mission,
  goal,
  example,
  oracleCheck:
    checks + "\nBEGIN DBMS_OUTPUT.PUT_LINE('DEVLAB_TESTS_PASSED'); END;\n/\n",
});
export const oracleTopic = {
  base: "hands-sql-oracle:0",
  name: "Oracle PL/SQL functions, exceptions and cursors",
  questions: [
    make(
      "Calculate an exact progressive service fee",
      "An Oracle billing system must price large imports consistently. Boundary errors or fractional-cent input must never silently change a customer's charge.",
      "Implement progressive_fee(amount NUMBER) RETURN NUMBER. Input is whole nonnegative cents; NULL, negative or fractional cents raise application error -20001. First 1000 cents are free; the next 4000 are charged 10%, and the remainder 20%. Truncate each band's fee to whole cents. Submit a stored function terminated with slash; do not print test output yourself.",
      feeStarter,
      fee,
      feeTests,
      "progressive_fee(1500) → 50; progressive_fee(6000) → 600; 1.5 → error -20001",
    ),
    make(
      "Aggregate a cursor-driven billing file",
      "Finance now sends a SQL collection of charges. Reuse the fee policy from the first question and walk the collection without losing duplicate rows or swallowing invalid amounts.",
      "Keep progressive_fee from question 1 and implement fee_total(amounts SYS.ODCINUMBERLIST) RETURN NUMBER using an explicit cursor over TABLE(amounts). Sum the per-element fees; empty collections return zero. Atomically null collections and any invalid element raise -20001. Duplicate amounts count separately. Submit both stored functions; no manual test output.",
      feeStarter +
        "CREATE OR REPLACE FUNCTION fee_total(amounts SYS.ODCINUMBERLIST) RETURN NUMBER IS\nBEGIN\n /* TODO */\n NULL;\nEND;\n/\n",
      fee +
        `CREATE OR REPLACE FUNCTION fee_total(amounts SYS.ODCINUMBERLIST) RETURN NUMBER IS
 CURSOR charges IS SELECT column_value AS cents FROM TABLE(amounts);
 total NUMBER:=0;
 count_items PLS_INTEGER;
BEGIN
 BEGIN count_items:=amounts.COUNT; EXCEPTION WHEN COLLECTION_IS_NULL THEN RAISE_APPLICATION_ERROR(-20001,'Collection required'); END;
 FOR charge IN charges LOOP total:=total+progressive_fee(charge.cents); END LOOP;
 RETURN total;
END;
/\n`,
      feeTests +
        `DECLARE n NUMBER; missing SYS.ODCINUMBERLIST; BEGIN
 IF NVL(fee_total(SYS.ODCINUMBERLIST(1500,6000,1500)),-1)<>700 OR NVL(fee_total(SYS.ODCINUMBERLIST()),-1)<>0 THEN RAISE_APPLICATION_ERROR(-20002,'Cursor total failed'); END IF;
 BEGIN n:=fee_total(SYS.ODCINUMBERLIST(1500,-1)); RAISE_APPLICATION_ERROR(-20002,'Invalid row accepted'); EXCEPTION WHEN OTHERS THEN IF SQLCODE<>-20001 THEN RAISE; END IF; END;
 BEGIN n:=fee_total(missing); RAISE_APPLICATION_ERROR(-20002,'Null collection accepted'); EXCEPTION WHEN OTHERS THEN IF SQLCODE<>-20001 THEN RAISE; END IF; END;
END;
/\n`,
      "fee_total([1500,6000,1500]) → 700; [] → 0; [1500,-1] → error -20001",
    ),
  ],
};
