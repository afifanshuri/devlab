// Missions supply context; the original task remains the exact runtime contract.
const stories = {
  "hands-java-dsa": [
    [
      "A support desk receives the same incident codes many times during a shift. Count how often each code appears so the team can see which problems are recurring.",
      "[2, 2, -1] → {2=2, -1=1}",
    ],
    [
      "A warehouse keeps its shelf IDs in sorted order. Find the position of a requested shelf quickly, or clearly report that the shelf is absent.",
      "[2, 5, 8], target 5 → 1; target 4 → -1",
    ],
  ],
  "hands-java-solid": [
    [
      "A customer asks to view their profile, but the shop may change where profiles are stored. Return the profile from the source supplied for that request, without making the lookup depend on one particular storage system.",
    ],
    [
      "A customer orders several replacement cables at the same unit price. Return the correct total, and refuse negative quantities, negative prices or a total too large to represent correctly.",
      "3 cables × 125 cents → 375 cents",
    ],
  ],
  "hands-java-patterns": [
    [
      "The shop runs a student discount today and a clearance sale tomorrow. Let checkout apply the pricing rule selected for the sale instead of always using one fixed discount.",
    ],
    [
      "A repair is marked ready and both the dashboard and notification service need the update. Deliver the same update to each registered recipient once, in the order they registered.",
    ],
  ],
  "hands-java-contracts": [
    [
      "Partners refer to the same incident as “ abc-1 ” and “ABC-1”. Treat those as one incident identity, and reject an entry that contains no meaningful identifier.",
      '"  abc-1 " → "ABC-1"; blank input is rejected',
    ],
    [
      "A partner sends incident entries containing an identifier and a quantity. Turn a valid entry into one clearly identified incident and a nonnegative quantity, and reject incomplete, extra or invalid information.",
      '" a | 2 " → entry("A", 2)',
    ],
    [
      "Monday’s incident file contains repeated identifiers from several partners. Produce one combined quantity per incident, treating equivalent identifiers alike and refusing malformed entries or totals that cannot be represented correctly.",
    ],
    [
      "A manager opens an incident-total report while new work continues at the desk. Give them a saved result that they cannot edit and that later changes to the source input cannot rewrite.",
    ],
  ],
  "hands-java-analysis": [
    [
      "The callback queue lists some customers several times under slightly different spellings of the same ID. Prepare one entry per customer, preserving the order in which they first arrived.",
    ],
    [
      "The incident review has time to discuss only the busiest incidents. Return the requested number of leading incident IDs by total quantity, using alphabetical ID order when totals tie.",
    ],
    [
      "Single-minute activity spikes make the incident dashboard noisy. Show totals across consecutive windows of minutes, with one result for every complete window in the history.",
      "[1, 2, 3, 4], width 2 → [3, 5, 7]",
    ],
    [
      "The on-call engineer needs a short briefing showing the leading incident IDs, their quantities and the overall total. Produce one consistently formatted summary so the same incident data always gives the same briefing.",
    ],
  ],
  "hands-java-reliability": [
    [
      "A partner service sometimes fails before returning a result. Retry the request only up to the agreed attempt limit, returning the first success or the final failure if every attempt fails.",
    ],
    [
      "A customer double-clicks Submit because the first response is slow. Treat repeated requests with the same identity as one successful action, and return the original result instead of performing it again.",
    ],
    [
      "Two workers may try to pick up the same incident at the same moment. Allow exactly one worker to claim that incident, and tell every other worker that it is already claimed.",
    ],
    [
      "The desk has a backlog of independent jobs to finish. Run the jobs with a limited number of workers, then return a count that includes every finished job exactly once.",
    ],
  ],
  "hands-java-capstone": [
    [
      "The support desk has several teams with different permissions. Allow a user’s requested action only when their recorded permissions explicitly include it, and deny access when the relevant information is missing.",
    ],
    [
      "An incident should become paid after payment, shipped after dispatch, or cancelled while still new. Accept only those allowed changes, and reject any action that does not fit the incident’s current stage.",
    ],
    [
      "An engineer needs to share a diagnostic message in a support ticket. Remove any password or token values from the message while keeping the surrounding text useful for investigation.",
    ],
    [
      "A user requests an incident summary and may retry the same request after a slow response. Allow only users with processing permission, produce the summary once for a successful request, and never expose a saved result to an unauthorized user.",
    ],
  ],
  "hands-java-architecture": [
    [
      "The counter, workshop and delivery desk all need the shop’s configuration registry. Give every part of the application the same registry, even when several parts request it at the same moment.",
    ],
    [
      "A customer chooses either standard or express delivery for their order. Calculate the appropriate shipping charge and add it to the item total, while allowing checkout to accept another delivery option later.",
      "1001 grams → 700 cents standard, 1400 cents express",
    ],
    [
      "A customer selects a delivery option by name. Match that choice to the correct shipping service, accepting harmless differences in spaces or capitalization but refusing an unknown option.",
    ],
    [
      "A repair payment should update the dashboard, email service and collection desk. Notify each registered recipient once, and keep one failed or departing recipient from preventing the others from receiving the news.",
    ],
    [
      "The checkout records prices in cents, but the old payment provider expects a decimal currency amount. Send the exact equivalent amount to that provider and return its receipt without changing it.",
      '105 cents → "1.05" at the legacy gateway',
    ],
    [
      "Finance needs an audit message for every successful payment. Add that message after a payment succeeds, and produce no success message if the payment fails.",
    ],
    [
      "A staff member reserves three parts for the wrong repair and needs to undo that reservation. Deduct the parts once, allow one matching undo, and reject repeated actions that would create or lose stock.",
    ],
    [
      "The operations lead chooses a service, reporting period and tags for a report. Let them assemble a valid request, then keep that completed request unchanged while they prepare another report.",
    ],
    [
      "A customer selects shipping, pays for an order and then retries after losing the response. Charge and notify only once for the same successful order, reject a changed order using the same request identity, and allow a failed payment to be tried again.",
    ],
  ],
  "hands-linux-basics": [
    [
      "The workshop needs a directory for its first Java source file. Create the requested folder and file with the exact supplied contents, then inspect the file to confirm it is ready.",
    ],
    [
      "A service log mixes normal activity with errors. Save only its error lines in their original order so the investigator can review them without changing the source log.",
    ],
  ],
  "hands-linux-admin": [
    [
      "A service configuration contains settings that should be private to its owner. Restrict access to that owner and save a listing that shows the resulting permissions.",
    ],
    [
      "The team is preparing a service for maintenance. Save the current process and disk information, and make a configuration backup that can reproduce the original file unchanged.",
    ],
  ],
  "hands-linux-operations": [
    [
      "Checkout is failing and the shared log contains messages from several services. Produce an alphabetically ordered error count per service so the team can identify where failures are concentrated.",
    ],
    [
      "One customer request travelled through several services before failing. Collect every log entry for its correlation ID in the original order, including normal activity that helps explain the journey.",
    ],
    [
      "The on-call engineer regenerates an incident report several times during a shift. Produce the same two-line error and service totals each time, keep the report private, and avoid publishing an incomplete or duplicated result.",
    ],
    [
      "Another support team is taking over the incident. Package the agreed logs and report, keep the archive private, and provide a checksum they can use to confirm it arrived unchanged.",
    ],
  ],
  "hands-sql-queries": [
    [
      "A payroll analyst regularly needs the names and salaries of employees earning at least 70000. Provide that reusable result while leaving employees below the threshold out.",
    ],
    [
      "Each department wants to compare its own employees’ salaries. Rank employees from highest to lowest salary within their department, rather than ranking everyone together.",
    ],
  ],
  "hands-sql-postgres": [
    [
      "Payroll reports need consistent salary labels. Classify every supplied salary as high, mid or base using the agreed boundaries, including salaries exactly on a boundary.",
    ],
    [
      "You are maintaining an older payroll routine that reads one employee at a time. Add up every employee’s salary and return the total without missing or counting anyone twice.",
    ],
  ],
  "hands-sql-integrity": [
    [
      "A customer opens their account screen to check their balance. Return the current balance for an existing account and no balance for an account that cannot be found.",
    ],
    [
      "A customer moves money from one account to another. Debit and credit together, and leave both accounts unchanged if either account is missing, the amount is invalid or there is not enough money.",
    ],
    [
      "A customer’s transfer succeeds but their browser loses the response and submits it again. Recognize the repeated payment and avoid another transfer, while rejecting a different payment that reuses the same request identity.",
    ],
    [
      "Finance needs a close-of-business view of money entering and leaving every account. Include accounts with no activity, show their balances correctly, and prepare the requested lookups for investigating payments.",
    ],
  ],
  "hands-sql-oracle": [
    [
      "A training coordinator needs to label a score as Pass or Retry. Display the correct result for the supplied score using the agreed pass mark.",
    ],
    [
      "A coordinator needs five numbered lines for a training report. Print the numbers 1 through 5 in order, with each number on its own line.",
    ],
  ],
};
export function applyMissions(courses) {
  for (const course of courses)
    for (const [index, lesson] of course.lessons.entries()) {
      const story = stories[course.id]?.[index];
      if (story) [lesson.mission, lesson.example] = story;
      lesson.goal ??= goals[course.id]?.[index];
      lesson.example ??= examples[course.id]?.[index];
      lesson.requirements = lesson.task.split(/(?<=[.!?])\s+(?=[A-Z])/);
    }
}
const goals = {
  "hands-java-oop-basics": [
    "Implement Customer so each customer object can store, return and safely change its own name.",
    "Implement Wallet so money can only change through validated deposit and spend operations.",
    "Implement JobTicket with one shared ticket sequence and an unchangeable ID for each ticket.",
    "Implement Booking and its static nested Contact class so bookings can hold validated contact details.",
    "Implement the workshop package: expose ticket formatting through TicketLabel while keeping LabelRules internal.",
  ],
  "hands-java-oop-more": [
    "Implement Repair, PhoneRepair, LaptopRepair and PriceDesk so the till can price different repair types through one shared abstraction.",
    "Implement Dispatch and BikeCourier so dispatch can send parcels through any Courier implementation.",
    "Implement the Formatter overloads, FancyFormatter override and BindingDemo to demonstrate which method Java selects.",
    "Implement Estimate with chainable setters that update one object and produce a validated total.",
    "Implement JobStatus.canMoveTo so only the next valid repair status is allowed.",
    "Implement Handover as a record that validates its ID and freezes an independent copy of the completed checks.",
    "Implement Workstation initializer blocks and the lifecycle demo to show class setup once and object setup for every construction.",
    "Implement Address and AddressDemo to demonstrate the difference between mutating an object and reassigning a copied reference.",
  ],
  "hands-java-collections": [
    "Implement DayPlan.append to create a growable, independent appointment list with the walk-in added at the end.",
    "Implement Reminders.unique to return normalized customer IDs once each, in first-seen order.",
    "Implement RepairIndex.build to map each ticket ID to its description and reject duplicate or malformed rows.",
    "Implement WaitingLine with FIFO queue behaviour: join, serve the oldest customer, and report the waiting count.",
    "Implement NoteHistory with a deque so the latest note can be undone while the oldest remaining note can be inspected.",
    "Implement ShelfCleanup.removeCancelled using an iterator to remove cancelled jobs safely from the supplied list.",
    "Implement a generic Tray<T> that stores typed values, removes them in arrival order and returns immutable snapshots.",
  ],
  "hands-java-dsa": [
    "Implement counts to return the frequency of every integer in the input array.",
    "Implement indexOf to find a target in a sorted array using binary search.",
  ],
  "hands-java-solid": [
    "Implement load by delegating customer lookup to the repository supplied by the caller.",
    "Implement total as a pure, validated quantity-times-unit-price calculation.",
  ],
  "hands-java-patterns": [
    "Implement checkout by applying the caller’s pricing strategy.",
    "Implement publish to notify every registered listener once, in order.",
  ],
  "hands-java-contracts": [
    "Implement normalize to give valid external IDs one consistent representation.",
    "Implement parseRecord to validate an incident line and return its normalized ID and quantity.",
    "Implement aggregate to total quantities by ID using your earlier parser.",
    "Implement snapshot to expose incident totals as an independent, immutable map.",
  ],
  "hands-java-analysis": [
    "Implement uniqueIds to normalize and deduplicate IDs while preserving arrival order.",
    "Implement topIds to rank incident IDs by quantity with deterministic tie-breaking.",
    "Implement movingTotals to calculate consecutive window sums in linear time.",
    "Implement summary by composing your earlier aggregation, ranking and snapshot helpers.",
  ],
  "hands-java-reliability": [
    "Implement retry to rerun a failing operation up to a fixed attempt limit.",
    "Implement executeOnce so repeated request IDs reuse the first successful result.",
    "Implement claim so concurrent workers cannot both claim the same message.",
    "Implement parallelCount to finish all submitted jobs and return an accurate shared count.",
  ],
  "hands-java-capstone": [
    "Implement allowed to check a user’s explicit permissions and deny missing access.",
    "Implement transition to enforce the permitted workflow state changes.",
    "Implement safeMessage to redact sensitive credentials while preserving diagnostic context.",
    "Implement handle by combining authorization, idempotency and incident-summary helpers.",
  ],
  "hands-java-architecture": [
    "Implement a lazy, thread-safe ConfigRegistry singleton and make RegistryClient use it.",
    "Implement interchangeable shipping policies and a checkout that depends on their shared contract.",
    "Implement ShippingFactory to turn a validated delivery name into the correct shipping policy.",
    "Implement OrderEvents to manage subscriptions and deliver notifications without one listener disrupting the others.",
    "Implement LegacyPaymentAdapter to translate integer cents into the gateway’s exact decimal format.",
    "Implement AuditedPayment to decorate a payment provider with success-only audit messages.",
    "Implement Stock and ReserveCommand so reservations can be executed and undone safely.",
    "Implement ReportRequest and its builder to create validated, immutable request snapshots.",
    "Implement OrderService by composing shipping, payment and event components with safe duplicate-request handling.",
  ],
  "hands-linux-basics": [
    "Create the requested project directory and Java source file, then inspect its contents.",
    "Extract the requested error lines from the supplied log into the output file.",
  ],
  "hands-linux-admin": [
    "Set the configuration file to owner-only access and save evidence of its permissions.",
    "Capture process and disk information, then create and verify the configuration backup.",
  ],
  "hands-linux-operations": [
    "Produce an error-count breakdown by service from the supplied log.",
    "Extract the full request journey for the specified correlation ID.",
    "Generate the requested incident report safely and make repeated runs produce the same result.",
    "Create the evidence archive and generate a checksum that verifies its integrity.",
  ],
  "hands-sql-queries": [
    "Create the high_earners view with the required salary filter and columns.",
    "Create the salary_ranks view to rank employees independently within each department.",
  ],
  "hands-sql-postgres": [
    "Create salary_band to classify a salary using the stated boundaries.",
    "Create total_payroll using an explicit cursor and return the employee salary total.",
  ],
  "hands-sql-integrity": [
    "Create balance_of to look up an account balance through one reusable function.",
    "Create move_money so a transfer updates both accounts atomically and rejects invalid requests.",
    "Create post_payment so repeated request keys cannot cause duplicate transfers.",
    "Create account_activity to reconcile every account and add the two required payment indexes.",
  ],
  "hands-sql-oracle": [
    "Write a PL/SQL block that prints the correct pass-or-retry result.",
    "Write a PL/SQL numeric FOR loop that prints the integers 1 through 5.",
  ],
};
const examples = {
  "hands-java-oop-basics": [
    'Customer(" Maya ").name() → "Maya"; renaming Maya must not change another customer.',
    "Wallet(100): deposit 50, spend 75 → balance 75; spending 76 then fails without changing it.",
    "First two JobTickets → IDs 1 and 2; issued() → 2.",
    'Booking.Contact(" 0123 ").phone() → "0123"; Booking(contact).contact() returns that contact.',
    'TicketLabel.format(12) → "JOB-12"; callers outside workshop cannot use LabelRules directly.',
  ],
  "hands-java-oop-more": [
    "PriceDesk.quote(new PhoneRepair()) → 3000; a LaptopRepair through the same Repair contract → 7000.",
    'Dispatch.ship(new BikeCourier(), " box ") → "BIKE:box"; a custom Courier must also work.',
    'Formatter base = new FancyFormatter(); Object value = "receipt"; format(value) → "fancy", format("receipt") → "text".',
    "new Estimate().labour(300).parts(200).total() → 500; replacing parts with 50 → 350.",
    "RECEIVED → REPAIRING is allowed; RECEIVED → READY and READY → READY are rejected.",
    "Receipt checks [screen] remain [screen] after the caller adds battery to the original list.",
    "Two Workstations in a fresh JVM → SICIC: static setup once, instance setup then constructor twice.",
    "reassign(address) leaves the caller’s city KL; mutate(address) changes that same object’s city to Penang.",
  ],
  "hands-java-collections": [
    "Booked [J1, J2] plus J3 → mutable [J1, J2, J3]; changing the original array leaves the result unchanged.",
    'IDs [" b ", "a", "B"] → [B, A] in that order.',
    'Rows [[" J1 ", " phone "], ["J2", "laptop"]] → {J1=phone, J2=laptop}; a second J1 is rejected.',
    "Join A, B, A → next returns A, then B, then A, then null.",
    "Add first, second, third → undo returns third; oldest still returns first.",
    "[J1, CANCELLED:a, CANCELLED:b, J2] → [J1, J2], with removed count 2.",
    "Tray<Integer> with 1, 2 → take returns 1; a saved [1, 2] snapshot stays unchanged.",
  ],
  "hands-java-dsa": [
    "[2, 2, -1] → {2=2, -1=1}",
    "[2, 5, 8], target 5 → index 1; target 4 → -1",
  ],
  "hands-java-solid": [
    'Repository id → "user:" + id; load(repository, 7) → "user:7".',
    "3 items × 125 cents → 375 cents; a negative quantity is rejected.",
  ],
  "hands-java-patterns": [
    "checkout(100, amount → amount / 2) → 50; another supplied policy may return 90.",
    "Listeners A then B receiving saved → A:saved followed by B:saved, once each.",
  ],
  "hands-java-contracts": [
    '"  abc-1 " → "ABC-1"; blank input is rejected.',
    '" a | 2 " → entry("A", 2); "a|-1" is rejected.',
    '["a|2", " A |3", "b|1"] → {A=5, B=1}',
    'Snapshot of ["a|2"] → {A=2}; put("B", 1) on that result is rejected.',
  ],
  "hands-java-analysis": [
    '[" b ", "a", "B"] → [B, A]',
    '["b|2", "a|3", "b|2"], top 1 → [B]',
    "[1, 2, 3, 4], width 2 → [3, 5, 7]",
    '["b|2", "a|3", "b|2"], top 1 → "B=4; total=7"',
  ],
  "hands-java-reliability": [
    "An operation failing once then succeeding returns its success within two attempts; it never exceeds the configured limit.",
    "The same request key submitted twice returns the same successful result; its action runs only once.",
    "Two concurrent claims for one message ID → exactly one true result.",
    "parallelCount(20) → 20 after all jobs finish; repeated calls must not share an old count.",
  ],
  "hands-java-capstone": [
    "A missing user or missing permission → false; explicit matching permission → true.",
    "A permitted event returns the required next state; an invalid event throws without inventing a new state.",
    "A message containing token or password values keeps its useful context while redacting those values.",
    "An authorized repeated request returns the cached summary; an unauthorized user cannot read that cached result.",
  ],
  "hands-java-architecture": [
    'Concurrent ConfigRegistry.getInstance() calls → the same instance; environment() → "production".',
    "1001 grams → 700 cents standard or 1400 cents express, before item cost.",
    'ShippingFactory.create(" EXPRESS ").cost(1) → 1200; unknown names are rejected.',
    "Subscribers A and B each receive paid once; if A throws, B must still receive it.",
    '105 cents → gateway string "1.05"; the gateway receipt is returned unchanged.',
    "Delegate returns R1 → audit receives paid:R1; delegate failure → no success audit.",
    "Stock 5: reserve 3 → 2; undo → 5; a second undo is rejected.",
    "Build a weekly request, then add a builder tag → the earlier request’s tag list stays unchanged.",
    "Same normalized request ID and same order → one charge and one notification; changed payload → rejected.",
  ],
  "hands-linux-basics": [
    "Expected file: /workspace/projects/Main.java; contents: class Main {}",
    "errors.log contains only the original ERROR lines, in their original order; app.log stays unchanged.",
  ],
  "hands-linux-admin": [
    "app.conf mode → 600; permissions.txt contains a long listing of app.conf.",
    "processes.txt and disk.txt contain snapshots; extracting config-backup.tar.gz reproduces the unchanged app.conf.",
  ],
  "hands-linux-operations": [
    "errors-by-service.txt contains inventory 1 followed by orders 2, one per line.",
    "incident.log contains every trace=t1 line in original order, including INFO entries.",
    "report.txt contains errors=2 then services=2, with mode 600; running again does not duplicate lines.",
    "evidence.tar.gz contains app.log, incident.log and report.txt; sha256sum -c evidence.sha256 succeeds.",
  ],
  "hands-sql-queries": [
    "high_earners contains three rows from the seeded employees table, all salaries at least 70000.",
    "Maya has Engineering rank 1; Sam has Operations rank 2.",
  ],
  "hands-sql-postgres": [
    "salary_band(90000) → high; salary_band(70000) → mid; salary_band(60000) → base.",
    "total_payroll() → 312000 for the supplied employee rows.",
  ],
  "hands-sql-integrity": [
    "balance_of(1) → 1000 initially; a missing account → NULL.",
    "Transfer 300 from account 1 to 2 → balances 700 and 550; a failed transfer changes neither.",
    "First successful key r1 → true; same key and payload again → false, with no second debit.",
    "Quiet account 3 remains in the report with paid_out=0 and paid_in=0.",
  ],
  "hands-sql-oracle": [
    "score 80 → output Pass",
    "Output five lines: 1, 2, 3, 4, 5",
  ],
};
