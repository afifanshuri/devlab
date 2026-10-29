const advanced = [
  "A billing service charges a fee on an amount supplied in cents. The first 1000 cents are free; charge 10% on the next 4000 and 20% on anything above 5000. Round each part down to whole cents and reject missing or negative amounts.",
  "Finance sends a list of amounts in cents. Add their fees using the same policy: first 1000 free, next 4000 at 10%, remainder at 20%, rounding each part down. An empty list totals zero; reject a missing list or missing or negative amount.",
  "Payroll is processed in pages. Given the last staff ID already handled and the maximum number of employees to take, add the salaries of the next employees in ascending ID order. An empty page totals zero.",
  "Payroll has a spending limit. Starting with the lowest staff ID, count how many consecutive employees can be paid without exceeding that limit. Stop at the first employee who cannot be paid, even if a later employee would be cheaper.",
  "A staff report lets its caller choose either ID or salary as the sorting field. Return staff IDs and salaries in ascending order of that choice, breaking salary ties by ID. Reject any other sorting choice.",
  "A staff report receives a minimum salary and a sorting choice of ID or salary. Return staff at or above that salary, sorted by the chosen field and then ID. Reject missing or negative salary limits and unsupported sorting choices; treat inputs as data, not extra database commands.",
  "A customer transfers money between accounts. Check and protect both account records, subtract from one and add to the other together. A missing account, invalid amount or insufficient balance must leave both balances unchanged.",
  "Several workers may reserve the same stock at once. For a valid item and positive quantity, reserve only when enough remains and report success or failure. Failed reservations must not reduce the available stock.",
  "An engineer needs to know which columns in public application tables allow missing values. Return their table and column names, ordered by table name and then by each column's position in its table.",
  "An order import must never store a missing or negative amount. Add and validate that rule against the existing orders without deleting or rebuilding the table.",
  "Support repeatedly looks up a customer's paid orders by date. Prepare the database for that lookup without changing the orders or indexing unrelated cancelled orders.",
  "Customers search for customer names without caring about outside spaces or capitalization. Prepare a lookup that uses the same cleaned name as the search, without rewriting stored names.",
  "Old cancelled orders may be removed after a supplied cutoff. Delete no more than the supplied batch limit, oldest first, and report how many were deleted. Keep paid orders and rows on or after the cutoff.",
  "Before removing old cancelled orders, operations wants a preview. Return only the oldest eligible rows up to the supplied limit, in date and ID order, and leave every order unchanged.",
  "A reporting user needs paid-order IDs, customer IDs and amounts, but must not read or change the original order table. Provide a read-only report exposing only those paid-order fields.",
  "A reporting user may read customer IDs and names, but not cities. Give only that limited read access, with no permission to insert, update or delete customer records.",
];

export function applyPlainSqlMissions(courses) {
  for (const course of courses) {
    if (course.track !== "sql") continue;
    for (const [index, lesson] of course.lessons.entries()) {
      if (lesson.type === "written" || lesson.queryResult) continue;
      lesson.plainMission = lesson.mission;
      if (course.id === "hands-sql-advanced" && index >= 24 && index < 40)
        lesson.plainMission = advanced[index - 24];
      if (course.id === "hands-sql-postgres" && index === 0)
        lesson.plainMission =
          "Payroll needs a label for each supplied salary. Salaries of at least 90000 are high, at least 70000 are mid, and lower salaries are base. Return the label for the supplied salary, including values exactly on a boundary.";
      if (course.id === "hands-sql-oracle" && index === 0)
        lesson.plainMission =
          "A training coordinator needs a result for a score of 80. Scores of at least 50 pass; lower scores need another attempt. Display Pass or Retry for the score.";
      if (course.id === "hands-sql-advanced" && index === 40)
        lesson.plainMission =
          "An Oracle billing service receives an amount in whole cents. The first 1000 cents are free; charge 10% on the next 4000 and 20% on the remainder, rounding each part down. Return the fee and reject missing, negative or fractional-cent amounts.";
      if (course.id === "hands-sql-advanced" && index === 41)
        lesson.plainMission =
          "Finance sends several charges in whole cents. Add their fees using the same policy: first 1000 free, next 4000 at 10%, remainder at 20%, rounding each part down. Count repeated charges separately; an empty collection totals zero. Reject missing collections and invalid amounts. The fee calculation from the previous question is needed here because the total uses it for each charge.";
    }
  }
}
