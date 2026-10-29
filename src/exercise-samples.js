// Explicit examples replace test-harness excerpts. They describe observable
// inputs/results without exposing setup code or truncated assertions.
const advanced = [
  [
    "Stock: 10; requested quantities: [4, 8]",
    "Reject the reservation; stock remains 10.",
  ],
  [
    "Stock: 5; command quantities: [2, 7]",
    "The batch fails; undo the earlier reservation so stock returns to 5.",
  ],
  [
    'Service: " api "; tags: [" urgent ", "urgent", "ops"]',
    'Report: service="api", days=7, tags=["urgent", "ops"]. Clearing the original tag list does not change this report.',
  ],
  [
    'Service: "api"; schedule days: [1, 7, 30]',
    "Three independent reports with days 1, 7 and 30.",
  ],
  ['Importer: uppercase; rows: [" a ", "b"]', '["imported:A", "imported:B"]'],
  [
    'Importer: lowercase; rows: [" A ", null, "B"]',
    '{0: "imported:a", 1: "rejected", 2: "imported:b"}',
  ],
  [
    "Orders (quantity, stock): [(0,2), (3,2), (1,2)]",
    '["invalid quantity", "insufficient stock", "ok"]',
  ],
  [
    "Orders (quantity, stock): [(0,1), (0,4), (5,2), (1,9)]",
    '{"invalid quantity": 2, "insufficient stock": 1}',
  ],
  [
    "Items: file(4 bytes), folder[file(3 bytes)]; quota: 7",
    "7 bytes; the bundle fits the quota.",
  ],
  [
    "Top-level items: file(3 bytes), folder[file(4 bytes), file(2 bytes)]",
    "Cumulative totals: [3, 9] bytes.",
  ],
  [
    'Authorized user: "admin"; profile IDs: [1, 1]; store returns "p" + ID',
    '["p1", "p1"]; the store is called once.',
  ],
  [
    'Authorized request for IDs [1, 1]; first store load returns "v1"',
    '["v1", "v1"]; caching belongs to this request, not future requests.',
  ],
  ['Initial state: draft; events: ["pay", "ship"]', 'Final state: "shipped".'],
  [
    'Preview events: ["pay"]',
    'Preview result: "paid"; no live order is changed.',
  ],
  [
    'Original notes: ["a"]; append: [" b "]',
    'New notes: ["a", "b"]; original notes remain ["a"].',
  ],
  ['Edits: ["a", "b"]', 'History: [[], ["a"], ["a", "b"]].'],
  [
    'Factory: email; messages: [" a ", "b"]',
    '["email-sent:email:a", "email-sent:email:b"]',
  ],
  [
    'Factories: email and SMS; message: "hi"',
    '{email: ["email-sent:email:hi"], sms: ["sms-sent:sms:hi"]}',
  ],
  [
    "Receipt rows (quantity, unit cents): [(2,300), (1,50)]",
    '["Total: 600 cents", "Total: 50 cents"]',
  ],
  [
    'Messages: ["A", "B"]; delivery succeeds',
    'Delivered messages: ["A", "B"], in that order.',
  ],
  [
    "Subtotal: 1000 cents; policy: 10% off; maximum discount: 30 cents",
    "Checkout total: 970 cents.",
  ],
  [
    "Subtotal: 100 cents; candidate discounts: 5 and 20 cents",
    "Checkout total: 80 cents.",
  ],
  [
    "Accounts: spending balance 30, locked balance 70",
    "Combined balance: 100.",
  ],
  ["Spending account balance: 100; payment: 40", "Remaining balance: 60."],
  ['Scan-only devices return "A" and "B"', '["A", "B"]'],
  [
    'Scanners return "A" and "B"; printer collects output',
    'Printed output: ["A", "B"].',
  ],
  [
    "Requested profile IDs: [1, 2]; user is authorized only for ID 1",
    "Reject the entire batch before loading any profiles; repository calls: 0.",
  ],
  [
    "Two lookups of profile ID 1 through the same memoized repository",
    "Both return the same loaded profile; the underlying repository is called once.",
  ],
  [
    "Repairs priced at 4000, 6000 and a custom 123 cents",
    "Combined quote: 10123 cents.",
  ],
  ["Custom repair price: 10; surcharge: 5", "Wrapped repair price: 15."],
  [
    'Courier returns "NEW:" + parcel; parcels: [" a ", "b"]',
    '["NEW:a", "NEW:b"]',
  ],
  [
    'Parcel: "A"; courier returns "X:" + parcel; receipt prefix: "audit:"',
    '"audit:X:A"; the outgoing parcel remains "A".',
  ],
  [
    'Orders: ["a", "b", "c"]; batch capacity: 2',
    '[["a", "b"], ["c"]]. Changing the original array later does not change these batches.',
  ],
  ['Work lanes: [["a", "b"], ["c"], []]', '["a", "c", "b"]'],
  ['First audience: [" b ", "a", "B", "c"]; second: ["A", "B"]', '["B", "A"]'],
  ['First audience: ["b", "a", "b"]; second: ["a", "c"]', '["B", "C"]'],
  [
    'Customer/city rows: [("A","KL"), ("B","KL"), ("A","KL"), ("C","JB")]',
    '{"KL": ["A", "B"], "JB": ["C"]}',
  ],
  [
    'Existing: {A:"old", B:"keep"}; patch: {A:null, C:"new"}',
    '{B:"keep", C:"new"}; the original map remains unchanged.',
  ],
  ['Queue: ["a", "b"]; capacity: 1', 'Served: ["a"]; remaining queue: ["b"].'],
  [
    'Queues: ["a1", "a2"] and ["b1"]',
    'Served: ["a1", "b1", "a2"]; both queues become empty.',
  ],
  [
    'History: ["a", "b"]; undo count: 1',
    'Undone: ["b"]; oldest remaining note: "a".',
  ],
  ['Text: "a{b[c](d)}"', "true; delimiters are correctly nested."],
  [
    'Jobs: ["A", "B", "A", "C"]; allowed IDs: {"A"}',
    'Removed count: 2; remaining jobs: ["A", "A"].',
  ],
  [
    'Jobs: ["a", "b", "c", "d", "e"]',
    'Drained: ["a", "c", "e"]; remaining: ["b", "d"].',
  ],
  [
    "Tray: [1, 2]; projection: convert each item to text",
    'Result: ["1", "2"]; original tray remains [1, 2].',
  ],
  [
    "Source tray: [1, 2]; destination: []; transfer limit: 1",
    "Transferred: [1]; source becomes [2]; destination becomes [1].",
  ],
  [
    "Sorted values: [1, 2, 2, 4]; target: 2",
    "First insertion boundary: index 1.",
  ],
  ["Sorted values: [1, 2, 2, 2, 5]; target: 2", "Occurrence count: 3."],
  [
    "Incident codes: [3, 1, 3, 2, 1, 4]; top count: 2",
    "[1, 3]; equal frequencies are ordered by code.",
  ],
  ["Payment values: [1, 1, 1, 1]; target sum: 2", "6 distinct index pairs."],
  [
    'Amounts: [1, 2]; injected gateway returns "r" + amount',
    'Receipts: ["r1", "r2"]; gateway calls: 2.',
  ],
  [
    "Payment amount: 19; use the configured Spring application context",
    'Receipt: "paid:19".',
  ],
  [
    'Customer draft values: ["a", "b", "c"]',
    '["a", "b", "c"], with a separate draft instance per customer.',
  ],
  [
    "Requested count in a new application context: 7",
    "7; the count does not leak from an earlier context.",
  ],
  [
    'Defaults: name="base", daily limit=10; override: name="override"',
    'Resolved name="override", daily limit=10.',
  ],
  [
    'Defaults: name="base", daily limit=2; deployment names: "a", "b"',
    'Independent settings: ("a",2) and ("b",2).',
  ],
  ['Active profile: "production"', 'Selected delivery adapter: "email".'],
  [
    'Profiles: ["production", "demo", "production"]',
    '{"production":"email", "demo":"console"}',
  ],
  ["Booking status request with ID 99", "HTTP status: 200."],
  [
    "Booking IDs to probe: [1, 0, 1, -5]",
    "Status report: {1:200, 0:400, -5:400}.",
  ],
  ['Booking request: name="A", quantity=1', "Validation violations: 0."],
  [
    'Requests: (name="a", quantity=1), (name="", quantity=0)',
    "Violation counts: [0, 2].",
  ],
  [
    'Stored tickets: ID 1 for "A", ID 2 for "B"; requested customer: " A "',
    "Matching ticket IDs: [1].",
  ],
  [
    'Stored tickets: ID 1 for "A"; requested customers: ["A", "Nobody", " A "]',
    '{"A":[1], "Nobody":[]}; duplicate normalized customer requests share one result.',
  ],
  [
    "Valid transfer: account 1 to account 2, amount 3",
    "Call the injected transfer service exactly once, with failure injection disabled.",
  ],
  [
    "Balances: account 1=100, account 2=20; successful transfer 10, then simulated failing transfer 20",
    "After failure: account 1=90, account 2=30. The second transfer is rolled back.",
  ],
  [
    "An ADMIN identity calls the secured purge through the managed service",
    'Result: "purged"; restore the prior security context afterward.',
  ],
  ["Purge identities: USER, ADMIN, USER", '["denied", "purged", "denied"]'],
  [
    "Wallet balances: 100 and 20; transfer: 30 from the first to the second",
    "Balances: 70 and 50.",
  ],
  [
    "Wallet balance: 3; take a balance snapshot, then deposit 2",
    "Snapshot remains [3]; live wallet balance becomes 5.",
  ],
  [
    "Issued ticket count before call: N; request 3 tickets",
    "IDs: N+1, N+2, N+3; issued count becomes N+3.",
  ],
  [
    "Existing ticket IDs: 8 and 9; read their labels",
    '["JOB-8", "JOB-9"]; reading labels does not issue more tickets.',
  ],
  [
    'Contact values: [" 123 ", "456"]',
    'Bookings contain independent contacts with phone values "123" and "456".',
  ],
  ['Contact values: [" 123 ", "123", "456"]', '{"123":2, "456":1}'],
  ["Ticket IDs: [3, 1, 3]", '["JOB-3", "JOB-1", "JOB-3"]'],
  ["Ticket IDs: [8, 2, 8]", '{2:"JOB-2", 8:"JOB-8"}'],
  ['Formatter: FancyFormatter; value passed through Object: "x"', '"fancy"'],
  [
    'Formatter: FancyFormatter; strings: ["a", "b"]',
    '["fancy|text", "fancy|text"]',
  ],
  ["Estimate parts: 20 and 30; maximum total: 50", "Estimate total: 50."],
  [
    "Estimate rows: [(10,20), (5,7)]; maximum total: 40",
    "Independent totals: [30, 12].",
  ],
  [
    "Initial status: RECEIVED; requested statuses: REPAIRING, READY",
    "Final status: READY.",
  ],
  [
    "Current repair status: REPAIRING",
    "Remaining statuses: [READY, COLLECTED].",
  ],
  [
    'Receipts for ticket "T": checks ["a", "b"] and ["b", "c"]',
    'Merged receipt: ticket="T", checks=["a", "b", "c"].',
  ],
  ['Receipts: B:["x"], A:["a"], A:["b"]', '{"A":["a", "b"], "B":["x"]}'],
  [
    "Create 2 workstation instances after class initialization",
    'Instance/constructor event suffix: "ICIC".',
  ],
  [
    "Batch sizes: [1, -1]",
    "Reject before constructing any workstation; lifecycle log remains unchanged.",
  ],
  [
    'Original address: "KL"; modify the exported copy to "JB"',
    'Live address remains "KL".',
  ],
  [
    'Original address: "KL"; simulate relocation',
    'Returned cities: ["Penang"].',
  ],
  [
    '100 concurrent calls share normalized key "REQ"; supplier generates sequential receipt IDs',
    'Every caller receives "R1"; supplier runs once.',
  ],
  [
    'Request keys: ["a", " A ", "b"]; supplier returns the normalized key',
    '["A", "A", "B"]; supplier runs twice.',
  ],
  [
    '100 repetitions of [" a ", "b"] compete to claim IDs',
    "Exactly 2 winning claims.",
  ],
  [
    'Tenant a IDs: ["X", "x"]; tenant b IDs: ["X"]',
    '{"a":1, "b":1}; tenants have independent claim state.',
  ],
  ["Values: [-5, -2, -8]; window width: 2", "Largest window total: -7."],
  [
    "Values: [1, 2, 3, 4]; width: 2; threshold: 5",
    "First qualifying window starts at index 1.",
  ],
  [
    'IDs: [" incident ", "i"]; server default locale: Turkish',
    '["INCIDENT", "I"]',
  ],
  ['IDs: [" a ", "B", "A", "b", "c"]', '{"A":[0,2], "B":[1,3]}'],
  [
    'Records: ["a|2", "bad", null, "b|-1", "c|0"]',
    '{1:"invalid", 2:"invalid", 3:"invalid"}',
  ],
  [
    'Records: [" a|2147483647", "A|2", "bad", "b|0"]',
    '{"A":2147483649, "B":0}',
  ],
  [
    "Operation fails once with IllegalStateException, then returns ok; attempts=3",
    'Return "ok" after 2 invocations.',
  ],
  [
    'First job returns "a"; second fails once transiently then returns "b"; attempts per job=2',
    '["a", "b"]; first job runs once and second runs twice.',
  ],
  [
    'Diagnostic: "token=abc user=a PASSWORD=xyz"',
    '"token=[REDACTED] user=a PASSWORD=[REDACTED]"',
  ],
  [
    'Diagnostics: ["token=verylongsecret text", "ok"]; maximum output length: 5',
    '["token", "ok"]; redact before truncating.',
  ],
];
export const advancedSamples = Object.fromEntries(
  advanced.map(([input, output], i) => [
    "hands-java-advanced:" + (i + 14),
    { input, output },
  ]),
);

export const missionOverrides = {
  "hands-java-advanced:46":
    "A café sends its orders to the kitchen in batches. You receive a list of order IDs and a capacity: the maximum number of orders the kitchen can prepare in one batch. For example, orders A, B, C with capacity 2 must become [A, B] and [C]. Keep the original sequence; the last batch may be smaller. Each batch must be a separate saved copy that cannot be edited. Later changes to the original orders must not change what the kitchen received. Capacity is supplied for each call, not fixed at 2.",
  "hands-java-advanced:47":
    "A café has several order lanes, and one busy lane must not keep the others waiting. You receive a list of order lanes. Take one order from each nonempty lane, visiting lanes in their supplied order, then repeat until every lane is exhausted. For example, lanes [A, B] and [C] must produce [A, C, B]. Preserve the order within each lane and leave the original lanes unchanged.",
};
