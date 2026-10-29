const scenarios = {
  Command:
    "A warehouse reserves stock for a kit containing several items. A failed reservation must not leave the stock ledger describing a kit that was never completed.",
  Builder:
    "A customer configures delivery requests in several steps. Each completed request must keep its own settings even if the builder is reused for another customer.",
  "Template Method":
    "A document-import service handles several file formats through one processing workflow. Invalid documents must be rejected without running later processing steps.",
  "Chain of Responsibility":
    "A support desk passes requests through a sequence of handlers. Resolve each request through the supplied chain and keep later requests independent of earlier results.",
  Composite:
    "A shop groups individual products into nested bundles. Customers need totals that account for the complete bundle without changing its contents.",
  "Protection and caching proxy":
    "A customer portal accesses a protected backend. Apply the supplied access and caching rules without leaking results between unrelated callers.",
  "State pattern and enums":
    "A repair order moves through a controlled lifecycle. Process the requested transitions in order and reject actions that are not allowed in the current state.",
  "Memento and defensive snapshots":
    "A note editor keeps historical versions for undo and reporting. Editing a live note must not rewrite a version that has already been saved.",
  "Abstract Factory":
    "A deployment chooses a matching family of infrastructure adapters. Build the requested family without accidentally mixing adapters from different environments.",
  "Single responsibility (SRP)":
    "A checkout report combines financial calculations with customer-facing output. Keep the calculation separate from the work that formats or publishes it.",
  "Open/closed principle (OCP)":
    "A marketplace adds new pricing or delivery rules over time. Apply the supplied rules without changing the algorithm whenever another implementation is introduced.",
  "Liskov substitution (LSP)":
    "A worker accepts implementations through a shared contract. Its result must remain correct when a different valid implementation is supplied.",
  "Interface segregation (ISP)":
    "A reporting service should use only the operations it needs. Handle the supplied capabilities without requiring clients to implement unrelated actions.",
  "Dependency inversion (DIP)":
    "A customer portal reads private profiles through supplied access and storage services. Permission checks must happen before private data is read.",
  "Inheritance, abstraction and dynamic binding":
    "A repair counter prices different repair types, including new types introduced by partners. Calculate results through the shared repair abstraction.",
  "Interfaces and delegation":
    "A dispatch desk sends parcels through a courier supplied for the request. New courier implementations must work without changes to the desk's dispatch logic.",
  "Arrays and ArrayList":
    "A café receives ordered work that must be regrouped for its kitchen. Produce the requested order arrangement without changing the caller's original data.",
  "Set and stable deduplication":
    "Two teams maintain reminder audiences containing duplicate and inconsistently formatted customer IDs. Reconcile their audiences using the stated normalization and encounter-order rules.",
  "Map and indexing":
    "A repair shop combines customer records from multiple imports. Produce the requested index or updated snapshot while preserving the original records for auditing.",
  "Queue and scheduling":
    "A worker pool has queued jobs from several customers. Serve the requested work in the stated order, leaving unserved work available to later workers.",
  "Deque and stack":
    "An editor processes a sequence where the most recent item may need to be handled first. Use the required ordering to produce the result without losing the remaining state.",
  "Iterator and safe mutation":
    "A support queue needs to remove selected entries during a walk through its live list. Preserve the required order and avoid skipping entries or invalidating iteration.",
  "Generic collections":
    "A warehouse moves typed work between trays. Process the supplied items without losing type safety, changing unrelated trays or confusing a snapshot with live contents.",
  "Binary search and boundary algorithms":
    "A sorted incident index can contain repeated keys. Locate the requested boundary or count without scanning the entire index or changing its order.",
  "Hash maps and frequency algorithms":
    "A monitoring service receives repeated codes and amounts. Derive the requested frequency or matching-pair result from the actual input, including duplicate values.",
  "Spring IoC and constructor injection":
    "A payment service receives its gateway through Spring configuration. Process payments through the supplied dependency rather than creating a hard-coded gateway.",
  "Spring bean scopes and lifecycle":
    "A service handles several requests in a Spring application. Request-specific drafts must stay independent, while shared counters must have the intended application lifetime.",
  "Spring Boot configuration properties":
    "A service deploys to multiple environments with shared defaults and environment-specific overrides. Resolve each deployment's settings without leaking overrides into another deployment.",
  "Spring profiles and bean selection":
    "The same service uses console delivery in demo and email delivery in production. Select the adapter through the requested Spring profile and keep contexts independent.",
  "Spring MVC and HTTP contracts":
    "An API client needs to know how a booking endpoint responds to valid and invalid requests. Exercise the actual HTTP boundary instead of guessing from the supplied ID.",
  "Bean Validation and exception advice":
    "A booking API receives customer names and quantities in bulk. Use its supplied validation constraints to report which requests violate the API's input rules.",
  "Spring Data JPA and repository contracts":
    "A support agent needs a customer's tickets in a predictable order, including customers who have no tickets. Query through the supplied repository rather than filtering all records in memory.",
  "Spring transactions and proxy boundaries":
    "A banking service moves money between accounts. Validate the request before entering the transactional service, and preserve rollback behavior when a transfer fails.",
  "Spring Security method authorization":
    "An administrative report service is protected at its method boundary. Run the operation under the supplied identity without leaving that identity installed for the next caller.",
  "Encapsulation and access control":
    "A customer transfers money between wallets. Work through the wallets' public operations and ensure invalid transfers cannot leave only one wallet changed.",
  "Static and final members":
    "A repair shop issues tickets from a shared sequence. New objects must receive distinct, permanent identities without restarting or overwriting the sequence.",
  "Static nested classes":
    "A booking includes contact details owned by a nested value object. Build the requested bookings with independent, validated contact information.",
  "Packages and public API boundaries":
    "A workshop exposes ticket labels to other packages while keeping formatting rules internal. Use its public entry point without reaching into package-private implementation details.",
  "Overloading, overriding and binding":
    "A formatting service receives objects through different declared types. Produce the requested output using Java's overload and override rules rather than hard-coded type checks.",
  "Method chaining and fluent APIs":
    "A repair desk creates estimates from labour and parts costs. Each customer needs a fresh estimate with the requested cap and a total that cannot overflow silently.",
  "Enums and finite transition rules":
    "A repair job progresses from received work toward completion. Evaluate the supplied status or path using the allowed enum transitions.",
  "Records and value equality":
    "A handover desk receives value records from several workers. Combine them using their declared value identity while keeping saved collections independent of later edits.",
  "Object lifecycle and initializer blocks":
    "A workstation class records class setup and object construction events. The checker loads the class before your method runs; report only the new events caused by the requested additional objects.",
  "Pass by value and mutable references":
    "A relocation report must simulate changes to customer addresses without changing live customer records. Work on independent objects and distinguish reassignment from mutation.",
  "Idempotency and concurrent publication":
    "A client may submit the same request repeatedly, including from concurrent workers. Reuse a successful result for equivalent request IDs without hiding a failed attempt from a retry.",
  "Atomic claims and synchronization":
    "Several workers compete for the same incident IDs. Count or process only successful first claims, including IDs that become equal after normalization.",
  "Sliding windows and long arithmetic":
    "An operational dashboard aggregates consecutive measurements. Calculate the requested windows without changing the input or losing totals to integer overflow.",
  "Input normalization and locale contracts":
    "Partners send the same incident ID with different spacing and capitalization. Normalize the IDs consistently on every host and retain enough information for the requested report.",
  "Parsing and failure isolation":
    "A partner uploads records containing identifiers and quantities. Parse the supplied data according to the stated error policy without accepting malformed values or corrupting valid results.",
  "Bounded retries and failure policies":
    "A partner operation can fail temporarily. Retry only the allowed failures and respect the attempt budget, without repeating work that already succeeded.",
  "Security boundaries and safe diagnostics":
    "An engineer shares service diagnostics for investigation. Produce useful output while keeping secrets out of the result and applying the requested size limits.",
};

export function scenarioFor(topic) {
  if (!scenarios[topic]) throw new Error("Missing exercise scenario: " + topic);
  return scenarios[topic];
}
