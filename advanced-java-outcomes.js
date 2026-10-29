// Business outcomes belong in the mission; Java contracts stay in acceptance criteria.
const outcomes = {
  "Classes, objects and independent state": [
    "You receive customer records and their replacement names. Rename every customer only after all names have been checked; one invalid name must leave everyone unchanged.",
    "Make a separate copy of the customer list and its customers. Changes to either group's names must never affect the other group.",
  ],
  Singleton: [
    "Ask for the shared configuration from several workers at once. Report whether every worker received the very same registry.",
    "Given tenant names and a way to load their settings, build a fresh settings report. Load each distinct tenant once per report and keep the order in which tenants first appeared.",
  ],
  Strategy: [
    "Given a basket's item price, parcel weight and several courier options, return the cheapest total price, including delivery. Ask each courier for one quote.",
    "Given each parcel's item price and weight, calculate the total charge for the whole basket using the supplied courier. Check every parcel before asking for any quotes.",
  ],
  Observer: [
    "Let one temporary recipient receive the supplied order update, then remove that recipient even if delivery fails. Existing recipients must stay subscribed.",
    "Send the supplied updates in order, but check every update before sending any. An invalid update must result in no deliveries.",
  ],
  Factory: [
    "Given a provider name and the available providers, create the matching courier option. Ignore surrounding spaces and differences in capitalization; reject an unknown provider.",
    "Given a list of provider names, create the requested courier options in order. Check every name before starting any provider, so a typo cannot start half a deployment.",
  ],
  Adapter: [
    "Convert a money amount such as 1.20 into exactly 120 cents and charge it once. Reject invalid amounts and fractions of a cent before contacting the payment service.",
    "Check all money amounts in the settlement file before charging any. Then charge them in order and return their receipt IDs; stop if a payment fails.",
  ],
  Decorator: [
    "Wrap the payment service so a temporary failure can be retried. The supplied attempt limit includes the first try; unrelated failures must stop immediately.",
    "Combine retries with payment auditing. Record one success entry after a payment succeeds, regardless of how many attempts it took; record no success for a failed payment.",
  ],
  Command: [
    "Given the quantities required for a kit, reserve all of them only if the complete kit is valid and in stock. Otherwise leave the stock unchanged.",
    "Try the reservations in order. If one fails, undo the earlier successful reservations in reverse order and report the failure.",
  ],
  Builder: [
    "Create a seven-day report for the supplied service and tags. Remove repeated tags after cleaning them, keep their first-seen order and protect the saved report from later input changes.",
    "Given a list of day counts, create one separate report per count, each tagged scheduled. Counts must be between 1 and 30; preserve their order and repeated counts.",
  ],
  "Template Method": [
    "Check every supplied row before importing any. Then import the rows in order and return their results without allowing later edits to rewrite the saved result.",
    "Try importing each row separately. Report rejected against the original position of a row that fails validation, continue with later rows and let unexpected failures stop the job.",
  ],
  "Chain of Responsibility": [
    "Given order quantities and available stock, check that every pair is well formed before applying the supplied checks. Return each order's first rejection reason, or ok, in order.",
    "Count orders by their rejection reason. Leave valid orders out of the count and list the rejection reasons alphabetically.",
  ],
  Composite: [
    "Add the sizes of the supplied files and folders, including nested contents. Return the total bytes, but reject a total above the supplied limit; leave the folder structure unchanged.",
    "Return the running byte total after each supplied file or folder. Include nested contents and leave the original structure unchanged.",
  ],
  "Protection and caching proxy": [
    "Read the requested profiles through the supplied protected access point. Keep request order and duplicates, and check permission for every request even when its profile is already cached.",
    "Give each request its own protected profile reader. Reuse cached profiles within that request, but never share its cached data with a different request.",
  ],
  "State pattern and enums": [
    "Apply the requested order actions in order and stop when an action is not allowed by the order's current stage.",
    "Preview the supplied actions on a new draft order and return the final status. Every preview starts fresh; reject an invalid action without retaining its state for the next preview.",
  ],
  "Memento and defensive snapshots": [
    "Open a saved note draft, add the supplied cleaned notes and return a new saved version. Keep the original saved version unchanged.",
    "Return a timeline starting with the empty draft, followed by a saved version after each note is added. Later additions must not change earlier versions.",
  ],
  "Abstract Factory": [
    "Check all messages before sending any, then send them through one matching set of notification components. Return receipts in message order.",
    "Send the messages through each registered notification channel. Keep matching formatters and senders together, and return results with channel names in alphabetical order.",
  ],
  "Single responsibility (SRP)": [
    "Each supplied row contains a quantity and a unit price in cents. Check and calculate every line total before formatting any receipt, then return the receipt texts in order.",
    "Check every supplied receipt text before delivering any. Deliver a saved copy of the list, so a recipient changing the original list cannot skip or repeat a delivery.",
  ],
  "Open/closed principle (OCP)": [
    "Wrap the supplied discount rule so its discount cannot exceed the supplied cap. Reject a negative cap or an invalid quoted discount without changing the original pricing service.",
    "Combine the supplied discount rules into one rule that offers the largest valid discount. Every offered discount must be checked, including offers from newly supplied rule types.",
  ],
  "Liskov substitution (LSP)": [
    "Return the combined balance of the supplied accounts, including locked accounts. Reporting balances must never attempt to withdraw money.",
    "Ask the supplied spendable account to make the payment and return its remaining balance. Respect its refusal if the payment is not allowed.",
  ],
  "Interface segregation (ISP)": [
    "Scan each supplied scanner once and return the pages in device order. Reject a missing or blank page; scanners do not need printing features.",
    "Scan all pages and check their contents before printing any. Then send the pages to the supplied printer in their original order.",
  ],
  "Dependency inversion (DIP)": [
    "Check permission for every requested customer before reading any profile. If all are allowed, return profiles in the original request order, including repeated customers.",
    "Wrap the supplied profile source with a private cache. Reuse successful results, including missing profiles, but let failed lookups be tried again.",
  ],
  "Inheritance, abstraction and dynamic binding": [
    "Given different repair jobs, return their combined price. New repair types must work through the same pricing process.",
    "Add the supplied surcharge to a repair's current price whenever it is requested. Leave the original repair unchanged and do not freeze its price in advance.",
  ],
  "Interfaces and delegation": [
    "Check every parcel before sending any, then ask the supplied courier to send them in order. Return the receipts in that same order.",
    "Wrap a courier so its returned receipt gets the supplied prefix. Send the original parcel unchanged, exactly once, and let delivery failures reach the caller.",
  ],
  "Arrays and ArrayList": [
    "You receive order IDs and the maximum number the kitchen can handle per batch. Split them in arrival order; for A, B, C and capacity 2, return [A, B] and [C]. Keep the original orders unchanged, and prevent later edits from changing the saved batches.",
    "You receive several order lanes. Take one order from each nonempty lane in the supplied lane order, then repeat until all are finished. Lanes [A, B] and [C] must produce [A, C, B]; leave the original lanes unchanged.",
  ],
  "Set and stable deduplication": [
    "Find customers who appear in both reminder audiences. Treat differently spaced or capitalized IDs as the same customer, remove repeats and keep the first audience's arrival order.",
    "Find customers who appear in only one audience. List first-audience-only customers before second-audience-only customers, preserving arrival order within each group.",
  ],
  "Map and indexing": [
    "Given customer-and-city rows, build a city directory. Sort cities alphabetically, list each customer once per city and keep the original rows unchanged.",
    "Apply the supplied changes to a separate copy of the directory. A missing value in a change means delete that entry; otherwise add or replace it. Return entries in alphabetical key order.",
  ],
  "Queue and scheduling": [
    "Serve up to the supplied worker limit from the front of the queue. Return the served jobs in order and leave the remaining jobs waiting; a limit of zero serves nobody.",
    "Take one job from each nonempty queue in turn until every queue is empty. Preserve the order of jobs within each queue.",
  ],
  "Deque and stack": [
    "Undo up to the requested number of edits, starting with the most recent. Return the undone entries in that order and leave older entries untouched.",
    "Check whether all round, square and curly brackets in the supplied text close in the correct order. Ignore other characters and report yes or no.",
  ],
  "Iterator and safe mutation": [
    "Remove jobs whose IDs are not permitted. Keep the remaining jobs in their original order, including duplicates, and return how many jobs were removed.",
    "Move the original first, third, fifth and later alternating entries into a new result. Leave the original second, fourth and later alternating entries in the queue.",
  ],
  "Generic collections": [
    "Apply the supplied conversion to each item in a tray and return the converted results in order. Leave the original tray and its items in place.",
    "Move up to the supplied limit from one tray to another, oldest first. Return the moved items in order and reject attempts to move a tray into itself.",
  ],
  "Binary search and boundary algorithms": [
    "Given a sorted list of keys, find the first position whose value is at least the requested key. If no value qualifies, return the length of the list.",
    "Count how many times the requested key appears in the sorted list. Find its boundaries without walking through every matching entry.",
  ],
  "Hash maps and frequency algorithms": [
    "Return up to the requested number of most frequent incident codes. Put higher counts first; if counts tie, put the smaller code first.",
    "Count pairs of entries whose amounts add up to the supplied target. Count separate occurrences separately, even when their values are equal.",
  ],
  "Spring IoC and constructor injection": [
    "Given a ready-to-use checkout and a list of amounts, check every amount before charging any. Return one receipt per amount in the same order.",
    "Start the supplied application configuration, obtain its checkout, make the requested payment and close the application afterward, including when payment fails.",
  ],
  "Spring bean scopes and lifecycle": [
    "Create a separate draft for each supplied value. Each returned draft must contain only its own value, without content left over from an earlier customer.",
    "Within one newly started application, increase its shared counter the requested number of times and return the result. A later call must start with its own fresh counter.",
  ],
  "Spring Boot configuration properties": [
    "Combine shared settings with the supplied deployment overrides. Overrides win; return valid settings and leave both input groups unchanged.",
    "Build settings for each deployment using the shared defaults. Return them in deployment order without letting one deployment's overrides affect the next.",
  ],
  "Spring profiles and bean selection": [
    "Given demo or production, start that environment and return its delivery choice: console for demo, email for production. Reject any other environment name.",
    "Given several environment names, report the delivery choice for each distinct environment in first-seen order. Check all names before starting any environment.",
  ],
  "Spring MVC and HTTP contracts": [
    "Send a real request to the supplied booking endpoint and return its response status for the given booking ID.",
    "Check each distinct booking ID and return its response status. Preserve the order in which IDs first appeared and report each ID only once.",
  ],
  "Bean Validation and exception advice": [
    "Check the supplied customer name and quantity against the API's existing input rules. Return the number of broken rules.",
    "Check each supplied booking request using those same rules. Return one count of broken rules per request in the original order.",
  ],
  "Spring Data JPA and repository contracts": [
    "Return the supplied customer's ticket IDs in ascending order. Ignore extra spaces around the customer name and use the existing ticket search.",
    "Build a ticket report for the supplied customer names. Include customers with no tickets, list customers alphabetically and keep each customer's ticket IDs in ascending order.",
  ],
  "Spring transactions and proxy boundaries": [
    "Reject invalid account IDs, transfers to the same account and nonpositive amounts before asking the supplied banking service to transfer once.",
    "Ask the banking service to fail after beginning the transfer. Let the failure be reported and rely on the service to undo the incomplete account changes.",
  ],
  "Spring Security method authorization": [
    "Run the protected report action as the supplied user, then restore the previous user's identity whether access succeeds or fails.",
    "Check the supplied user identities one at a time and return the requested access results without leaving any of those identities active afterward.",
  ],
  "Encapsulation and access control": [
    "Transfer the supplied amount between two different wallets. Check funds and the receiving wallet's limit first, so a rejected transfer leaves both balances unchanged.",
    "Return a saved list of the supplied wallets' balances in the same order. Changing a wallet later must not change this balance report.",
  ],
  "Static and final members": [
    "Create the requested tickets without restarting the shared number sequence. Every ticket must retain its own assigned number.",
    "Create a label for each existing ticket using the shared label prefix and that ticket's own number. Reading labels must not issue new tickets or advance the number sequence.",
  ],
  "Static nested classes": [
    "Check all supplied phone numbers before creating any bookings. Give each booking its own contact details, with outside spaces removed.",
    "Count bookings by their cleaned contact phone number. Combine repeated numbers and return phone numbers in alphabetical order.",
  ],
  "Packages and public API boundaries": [
    "Create the requested ticket labels through the workshop's public entry point. Keep its internal formatting rules hidden from outside callers.",
    "Create one label per distinct ticket ID, listing IDs in ascending order. Use the workshop's public label service without exposing its internal rules.",
  ],
  "Overloading, overriding and binding": [
    "Format the supplied value as a general object through the supplied formatter. Let the formatter's own overridden behavior determine the result rather than guessing its type.",
    "For each supplied text, produce its general-object formatting result, a vertical bar, then its text-specific formatting result. Use the same formatter and preserve input order.",
  ],
  "Method chaining and fluent APIs": [
    "Create one estimate from the supplied labour and parts costs. Refuse invalid costs or a total above the supplied cap.",
    "Create a fresh estimate for each pair of labour and parts costs. Return their totals in order without carrying one customer's values into the next estimate.",
  ],
  "Enums and finite transition rules": [
    "Starting from the supplied job status, follow the requested path and return the final status. Reject a path that skips or reverses an allowed step.",
    "List all later job statuses in their normal progression, excluding the current status. A completed job has no remaining steps.",
  ],
  "Records and value equality": [
    "Combine two handover receipts for the same ticket. Keep each completed check once, in the order first seen, and leave both original receipts unchanged.",
    "Combine all receipts for each ticket into one handover. List tickets alphabetically and keep each ticket's completed checks once in first-seen order.",
  ],
  "Object lifecycle and initializer blocks": [
    "The workstation class has already been loaded. Create the requested number of additional workstations and return only the new setup events they produce; do not clear the existing history.",
    "Check every requested count first, then create each batch of workstations and return its new setup events. An invalid count must leave the history unchanged.",
  ],
  "Pass by value and mutable references": [
    "Create a separate address for every customer in the supplied list. Editing a copied address must not change the original address.",
    "Run the supplied relocation steps on copied addresses only. Return the resulting cities and leave all original customer addresses unchanged.",
  ],
  "Idempotency and concurrent publication": [
    "Run the supplied action once for equivalent request IDs, even when several workers request it together. Return the same successful result to each worker; failed actions must remain retryable.",
    "Process the supplied request IDs in order. Equivalent IDs reuse one successful result, but each original entry still gets its corresponding result in the returned list.",
  ],
  "Atomic claims and synchronization": [
    "Let workers try to claim the supplied incident IDs and count the successful first claims. Repeated or differently formatted versions of an ID must not win twice.",
    "Count successful first claims separately for each tenant. The same message ID may be claimed once in each different tenant; list tenant names alphabetically.",
  ],
  "Sliding windows and long arithmetic": [
    "Find the largest total across any complete window of the supplied width. A history containing only negative amounts must still return its real largest total, not zero.",
    "Find the starting position of the first complete window whose total reaches the supplied threshold. Return -1 if no window qualifies and leave the history unchanged.",
  ],
  "Input normalization and locale contracts": [
    "Clean the supplied IDs by removing outside spaces and converting letters to uppercase. Keep their original order and duplicates, and reject empty or missing IDs.",
    "Find cleaned IDs that occur more than once. For each, report all original positions in order, listing the cleaned IDs alphabetically.",
  ],
  "Parsing and failure isolation": [
    "Check each supplied record and report invalid against the original position of every malformed record. Continue checking later rows, preserving the original order of the reported positions.",
    "Skip malformed records and combine the quantities of valid records by their cleaned IDs. Keep IDs with a zero total and return IDs alphabetically.",
  ],
  "Bounded retries and failure policies": [
    "Try the supplied action until it succeeds or uses the allowed number of attempts. Retry only temporary failures and stop immediately for other failures.",
    "Process the supplied actions in order, giving each its own attempt budget. Keep earlier successes, and stop if an action still fails after its permitted attempts.",
  ],
  "Security boundaries and safe diagnostics": [
    "Hide password and token values in the supplied diagnostic text while leaving unrelated text useful for investigation.",
    "Clean each diagnostic message before shortening it to the supplied maximum length. Return the messages in their original order without exposing a secret through truncation.",
  ],
};

export function plainOutcome(topic, index) {
  const outcome = outcomes[topic]?.[index];
  if (!outcome) throw new Error("Missing plain-language outcome: " + topic);
  return outcome;
}
