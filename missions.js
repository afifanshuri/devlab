// Missions supply context; the original task remains the exact runtime contract.
const stories = {
  "hands-java-dsa": [
    [
      "A busy support desk receives the same incident code many times. Before the morning stand-up, turn that stream into a count for each code so the team knows what is recurring.",
      "[2, 2, -1] → {2=2, -1=1}",
    ],
    [
      "A warehouse keeps its shelf IDs sorted. A picker needs to find one shelf quickly, even when the list grows to millions of entries. Build the lookup and make “not found” an ordinary result.",
      "[2, 5, 8], target 5 → 1; target 4 → -1",
    ],
  ],
  "hands-java-solid": [
    [
      "Imagine one customer asks to see their profile. Today it lives in memory; next month it may live in a database. Build the lookup boundary so the use case can work with either source without knowing how storage works.",
    ],
    [
      "A customer orders three replacement cables. The counter needs the total, while email and payment systems are somebody else’s job. Give the shop a small, reliable price calculation that can also reject impossible orders.",
      "3 cables × 125 cents → 375 cents",
    ],
  ],
  "hands-java-patterns": [
    [
      "The shop runs a student discount today and a clearance sale tomorrow. The checkout should accept either pricing rule without being rewritten for every promotion.",
    ],
    [
      "A repair is marked ready. The dashboard and notification service both want the news. Let the publisher notify registered listeners without learning what each listener does.",
    ],
  ],
  "hands-java-contracts": [
    [
      "You are opening a support desk. One customer types “ abc-1 ” while another types “ABC-1”; both mean the same incident. Establish one trustworthy identity before any reports or retries are built.",
      '"  abc-1 " → "ABC-1"; blank input is rejected',
    ],
    [
      "The desk starts receiving incident lines from partner systems. A good line contains an ID and quantity, but a broken integration sometimes sends junk. Turn valid lines into usable values without quietly accepting corrupt data.",
      '" a | 2 " → entry("A", 2)',
    ],
    [
      "Monday’s incident file contains repeated IDs from several partners. The team wants one total per incident. Reuse your parser so malformed records cannot sneak past a second, weaker validation path.",
    ],
    [
      "A manager opens your incident totals on a dashboard. Their screen must not be able to edit the service’s result, and later input changes must not rewrite the report already issued.",
    ],
  ],
  "hands-java-analysis": [
    [
      "The support queue is full of repeated customer IDs. Prepare a callback list with each customer appearing once, in the order they first arrived. Reuse your earlier normalisation rule.",
    ],
    [
      "You have ten minutes before the incident review. Rank the busiest IDs so the team tackles the biggest issue first, and make ties predictable so two dashboards never disagree.",
    ],
    [
      "An alert fires on every single-minute spike. The team wants a smoother view: totals for consecutive windows of activity. Build it so a longer history does not make every window expensive.",
      "[1, 2, 3, 4], width 2 → [3, 5, 7]",
    ],
    [
      "The morning briefing needs one compact summary instead of three separate tools. Bring your aggregation, ranking and snapshot work together into a report the on-call engineer can paste into an update.",
    ],
  ],
  "hands-java-reliability": [
    [
      "A partner service occasionally fails on the first call. Give it a fair chance to recover, but do not let one request retry forever and keep the customer waiting.",
    ],
    [
      "A customer double-clicks Submit after a slow response. The same request arrives twice. Make the second attempt return the first result instead of repeating the side effect.",
    ],
    [
      "Two workers pick up the same incident at almost the same moment. Only one should claim it. Protect the claim as one operation rather than a check followed by a separate write.",
    ],
    [
      "The incident backlog is growing. Split independent jobs across a small worker pool while keeping the final count correct and making sure the workers actually finish.",
    ],
  ],
  "hands-java-capstone": [
    [
      "The support desk now has several teams. A user may view one resource but not another. Build an access decision that stays closed when the permission information is missing.",
    ],
    [
      "An incident cannot jump from any status to any other status just because a client asks. Give the workflow its own rules before somebody accidentally reopens a finished job.",
    ],
    [
      "An engineer is about to paste a diagnostic log into a ticket. Useful context should survive, but passwords and tokens must not travel with it. Make a safer diagnostic message.",
    ],
    [
      "It is your first on-call shift owning the whole service. A user requests an incident summary, retries arrive, and permissions still apply. Connect the helpers you built into one trustworthy request flow.",
    ],
  ],
  "hands-java-architecture": [
    [
      "Imagine a repair shop with one configuration registry shared by the counter, workshop and delivery desk. Several threads may ask for it at startup. Make sure they all receive the same registry rather than competing copies.",
    ],
    [
      "A customer can choose standard or express delivery. Tomorrow a new delivery option may appear. Keep the checkout stable while each shipping policy owns its own calculation.",
      "1001 grams → 700 cents standard, 1400 cents express",
    ],
    [
      "The customer selects a delivery name on a form. Translate that outside-world choice into the right shipping policy at the application boundary. A typo must not silently choose a different service.",
    ],
    [
      "One repair has just been paid. The dashboard, email listener and collection desk all need to hear about it. A broken listener or one unsubscribing itself should not disrupt the others.",
    ],
    [
      "Your new checkout speaks integer cents, but the old payment provider wants decimal strings. Bridge those contracts so a customer paying 105 cents is charged exactly 1.05, without floating-point surprises.",
      '105 cents → "1.05" at the legacy gateway',
    ],
    [
      "Finance asks for an audit entry after every successful payment. Add that behaviour around the existing payment contract, so gateways do not each grow their own audit implementation. Failed charges must not look successful.",
    ],
    [
      "A staff member reserves three parts for a repair, then realises it was the wrong job. Turn reservation into an operation that can be undone exactly once without creating or losing stock.",
    ],
    [
      "The operations lead needs a weekly report with a service, date range and optional tags. Let callers assemble a readable request, then freeze it so later builder changes cannot rewrite a report already queued.",
    ],
    [
      "The shop is ready for a complete checkout. One customer selects shipping, pays through the legacy gateway and triggers notifications—then retries the same request after a network hiccup. Make the whole flow agree on what “already paid” means.",
    ],
  ],
  "hands-linux-basics": [
    [
      "Prepare a small project directory for the workshop’s first Java file. This is a short shell warm-up: create the directory, write the exact file and inspect it.",
    ],
    [
      "The on-call engineer only needs the error lines from a noisy service log. Extract that evidence into its own file so the next investigation starts with the useful lines.",
    ],
  ],
  "hands-linux-admin": [
    [
      "A service configuration contains private operational settings. Give its owner the required access while keeping other users out. Verify the resulting permissions instead of guessing from the command you typed.",
    ],
    [
      "Before the maintenance window, the team asks for a recoverable copy of the configuration. Build the requested backup and inspect what went into it.",
    ],
  ],
  "hands-linux-operations": [
    [
      "Checkout is failing, but the shared log mixes several services. Produce a small error breakdown so the team can see which service deserves attention first.",
    ],
    [
      "One customer’s request travelled through several services before failing. Follow its correlation ID through the log—including useful non-error lines—to reconstruct the journey.",
    ],
    [
      "The incident report will be generated several times during a shift. Make reruns safe: no duplicate sections, no half-written published report, and no unnecessarily broad file access.",
    ],
    [
      "The next support team is taking over. Package the agreed evidence files and a checksum, so they can confirm the bundle survived the handover intact.",
    ],
  ],
  "hands-sql-queries": [
    [
      "A payroll analyst wants a reusable view of employees above the agreed salary threshold. Give them a focused result rather than making every report repeat its own filter.",
    ],
    [
      "Each department wants to see its own salary ranking. An employee’s position should depend on colleagues in the same department, not the whole company.",
    ],
  ],
  "hands-sql-postgres": [
    [
      "Payroll wants a consistent label for each salary band. Put the classification in one function so two reports do not quietly use different boundaries.",
    ],
    [
      "You inherited a procedural payroll routine and need to understand cursor handling before maintaining it. Practise opening, fetching and closing a cursor on a small employee dataset.",
    ],
  ],
  "hands-sql-integrity": [
    [
      "A customer opens their account screen. The service needs a reliable balance lookup before it can offer transfers or reconciliation. Build that small database contract first.",
    ],
    [
      "A customer moves money between two accounts. A failed transfer must not debit one account without crediting the other, and concurrent transfers must lock accounts in a consistent order.",
    ],
    [
      "The customer’s transfer succeeded, but their browser did not receive the response. It sends the same payment again. Record the request identity so retrying does not move the money twice.",
    ],
    [
      "At close of business, finance asks which accounts moved money and whether the totals reconcile. Include quiet accounts too, then prepare indexes for the lookups this report depends on.",
    ],
  ],
  "hands-sql-oracle": [
    [
      "A training coordinator wants a simple pass-or-retry message from an Oracle PL/SQL block. This is a short branching drill before larger procedural work.",
    ],
    [
      "Warm up Oracle’s numeric FOR loop by printing a short numbered sequence. Keep this one direct: focus on the block syntax and output.",
    ],
  ],
};
export function applyMissions(courses) {
  for (const course of courses)
    for (const [index, lesson] of course.lessons.entries()) {
      const story = stories[course.id]?.[index];
      if (story) [lesson.mission, lesson.example] = story;
      lesson.goal = goals[course.id]?.[index];
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
