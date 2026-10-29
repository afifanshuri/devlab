// Describe exercise-owned types, not Java/Spring library classes.
const roles = {
  AccessPolicy: "decides whether a user may read a customer's profile",
  Address: "stores one customer's city and allows that city to be changed",
  AddressDemo:
    "demonstrates changing an address versus replacing only a helper's local reference",
  AdminReports:
    "offers the report-clearing action that only administrators may use",
  ApiErrors: "turns rejected booking input into the agreed error response",
  AuditedPayment: "adds one audit message after a successful payment",
  BalanceView:
    "lets a caller read an account balance without granting withdrawal access",
  BikeCourier: "sends a parcel using the bicycle delivery option",
  BindingDemo:
    "compares the formatting choices made for the same value through different declared types",
  Booking: "holds a collection booking and its customer's contact details",
  BookingController: "answers requests for a booking's ID and status",
  Builder: "collects choices before creating a completed report request",
  BundleFolder:
    "groups files and other folders so their sizes can be added together",
  Capability: "lists the device features that can be enabled or missing",
  Challenge: "holds the operation you need to complete for the current problem",
  Checkout: "adds the chosen shipping charge to an order's item price",
  ConfigRegistry: "provides one shared copy of the shop's environment settings",
  Contact: "holds the validated phone number attached to a booking",
  CopyDesk: "scans a page, checks it and sends that page to a printer",
  Courier:
    "defines how any delivery partner accepts a parcel and returns a tracking result",
  CreateController: "accepts a new booking request and returns its result",
  CreateRequest: "carries a customer's name and requested booking quantity",
  Customer: "stores one customer's name independently of other customers",
  CustomerRepository:
    "provides customer profiles from the selected data source",
  DayPlan:
    "creates a new appointment list by adding a walk-in after the booked customers",
  DiscountCheckout:
    "subtracts a valid discount supplied by the chosen discount rule",
  DiscountPolicy:
    "defines how a promotion calculates the amount to subtract from a price",
  Dispatch: "checks a parcel and hands it to the supplied courier",
  DraftPad: "holds editable notes and can save or restore a draft version",
  DraftState: "represents an unpaid order that can move to paid",
  EmailFactory: "supplies matching email wording and email delivery components",
  Estimate:
    "keeps labour and parts prices and calculates their combined repair cost",
  ExpressShipping:
    "calculates express delivery at twice the standard delivery charge",
  FancyFormatter:
    "changes the general-value formatting result while retaining the text-formatting choice",
  FileItem: "represents one file with a known size in bytes",
  Formatter: "provides separate formatting choices for general values and text",
  Handover: "keeps a ticket ID and a saved list of completed repair checks",
  Holder: "creates the shared configuration only when it is first needed",
  ImportJob:
    "runs the shared checking and completion steps around a partner's text conversion",
  JobStatus: "lists the repair stages and decides which next stage is allowed",
  JobTicket:
    "assigns each new repair ticket its own permanent number from the shared sequence",
  LabApplication:
    "starts the supplied lab application and connects its supporting services",
  LabelRules:
    "keeps the workshop's label-prefix rule hidden from outside callers",
  LaptopRepair: "provides the fixed price for a laptop repair",
  LegacyGateway:
    "represents the older payment provider that accepts decimal money text",
  LegacyPaymentAdapter:
    "converts a price in cents into the decimal text expected by the older payment provider",
  LifecycleDemo: "creates workstations and returns their recorded setup events",
  LifecycleLog:
    "stores the ordered record of shared setup and object-construction events",
  LockedBalance:
    "represents an account whose balance may be read but not spent",
  LowerImport:
    "converts valid partner text to lowercase during the import workflow",
  Main: "holds the operations used to solve this exercise",
  Node: "holds one value and a link to the next item in a chain",
  NoteHistory:
    "stores notes so the newest can be undone and the oldest can be inspected",
  NoticeFactory:
    "supplies a matching pair of notice wording and delivery components",
  NoticeFormatter: "prepares a message's wording for its notification channel",
  NoticeSender: "delivers an already formatted notice and returns its receipt",
  NoticeService:
    "uses the selected channel's formatter and sender to deliver a notice",
  OrderContext:
    "holds an order's current stage and applies actions through that stage's rules",
  OrderEvents:
    "keeps the recipient list and sends order updates to those recipients",
  OrderListener: "defines how a recipient receives an order update",
  OrderService:
    "coordinates pricing, payment and notification while preventing duplicate successful orders",
  OrderState: "defines an order stage's name and its permitted next actions",
  PaidState: "represents an order that has been paid and may be shipped",
  PaymentGateway:
    "represents the selected payment provider and returns its payment receipt",
  PaymentPort:
    "gives checkout one payment interface regardless of the provider behind it",
  PaymentService: "asks an account that supports spending to make a payment",
  PhoneRepair: "provides the fixed price for a phone repair",
  PriceDesk:
    "asks a repair for its price without needing to know its specific repair type",
  PrintDesk: "checks receipt text and sends it to the supplied printer",
  Printer:
    "defines the ability to print text without requiring scanning features",
  ProfileConfig:
    "selects console or email delivery according to the active environment",
  ProfileProxy:
    "checks access before returning a remembered or newly fetched customer profile",
  ProfileService:
    "checks permission and then reads the requested profile through its supplied source",
  ProfileStore: "fetches the original profile data when a lookup is needed",
  QuantityRule:
    "rejects an order with a nonpositive quantity before later checks run",
  ReadPolicy: "decides whether a user may read the requested profile",
  ReceiptCalculator: "calculates the total price from quantity and unit price",
  ReceiptFormatter: "turns a total in cents into the required receipt wording",
  ReceiptService:
    "coordinates calculating, formatting and delivering a receipt",
  RegistryClient:
    "reads environment settings from the shared configuration registry",
  Reminders:
    "cleans customer IDs and keeps one reminder entry per customer in first-seen order",
  Repair: "defines the shared pricing behavior of every repair type",
  RepairIndex: "builds a ticket-ID lookup for repair descriptions",
  ReportClient:
    "uses the report-building process to create the requested report",
  ReportRequest:
    "keeps the chosen service, day count and tags for a completed report",
  ReserveCommand:
    "remembers one stock reservation so it can be performed and undone safely",
  Rule: "defines one order check that can pass work to another check",
  ScannerDevice:
    "defines the ability to scan a page without requiring printing features",
  ScopeConfig:
    "provides the shared service counter and a separate empty draft for each request",
  SecurityConfig: "turns on access checks for the protected service operations",
  SettingsConfig:
    "makes the shop's externally supplied settings available to the application",
  ShelfCleanup: "removes cancelled repair entries from the live shelf list",
  ShippedState:
    "represents a dispatched order with no further permitted actions in this exercise",
  ShippingFactory:
    "matches a delivery-option name to the appropriate shipping service",
  ShippingPolicy:
    "defines how a delivery option calculates its charge from parcel weight",
  ShopConfig: "chooses the payment provider and connects it to checkout",
  ShopSettings:
    "holds the shop name and daily booking limit supplied by configuration",
  SizedItem: "lets a file or folder report its total size in bytes",
  SmsFactory: "supplies matching SMS wording and SMS delivery components",
  Snapshot: "keeps a saved draft version that later edits cannot change",
  SpendingAccount: "stores a balance and allows valid withdrawals",
  StandardShipping:
    "calculates the standard delivery charge from parcel weight",
  Status: "carries a booking's ID and status in the response",
  Stock: "tracks available parts and handles valid reservations and releases",
  StockRule:
    "rejects a quantity above the available stock before later checks run",
  TenPercentOff:
    "calculates a ten-percent discount rounded down to whole cents",
  Ticket: "represents one customer's ticket stored in the database",
  TicketLabel:
    "provides the public way to obtain a formatted repair-ticket label",
  TicketRepository:
    "saves tickets and finds one customer's tickets in ID order",
  TransferService:
    "moves money between account records and undoes incomplete transfers",
  Tray: "holds typed work in arrival order and can return a saved list of its contents",
  TreeNode: "holds a value and links to its left and right children in a tree",
  UpperImport:
    "converts valid partner text to uppercase during the import workflow",
  WaitingLine:
    "keeps customers in arrival order and serves the oldest waiting customer",
  Wallet: "keeps a balance and permits only valid deposits and spending",
  WithdrawableAccount:
    "defines an account that allows spending as well as balance checks",
  Workstation:
    "records its shared setup, individual setup and construction events",
};

const earlierOperations = {
  "Idempotency and concurrent publication":
    "cleans request IDs and remembers successful results so repeated requests do not run the action again",
  "Atomic claims and synchronization":
    "cleans incident IDs and allows only the first worker to claim each incident",
  "Sliding windows and long arithmetic":
    "calculates totals for consecutive windows of the supplied measurements",
  "Input normalization and locale contracts":
    "removes outside spaces from IDs and converts them to uppercase consistently",
  "Parsing and failure isolation":
    "reads an ID and quantity from each record and rejects malformed records",
};

export function exerciseRoles(task) {
  if (task.engine !== "java" || task.type !== "workspace") return [];
  const result = [];
  for (const [file, source] of Object.entries({
    [task.filename]: task.starter,
    ...task.editableFiles,
    ...task.files,
  })) {
    const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    for (const match of code.matchAll(
      /\b(class|interface|record|enum)\s+([A-Z]\w*)/g,
    )) {
      const [, kind, name] = match;
      let purpose = roles[name];
      if (!purpose) throw Error("Missing class purpose: " + name);
      if (name === "Checkout" && task.framework === "spring")
        purpose =
          "uses the supplied payment provider to charge an amount and return its receipt";
      if (name === "Status" && kind === "enum")
        purpose = "lists the job statuses used in the shift-count report";
      if (name === "Main" && file !== task.filename)
        purpose = earlierOperations[task.advancedTopic] || purpose;
      const completed =
        file === task.filename
          ? task.solution
          : (task.solutionFiles?.[file] ?? task.files?.[file]);
      const provided =
        (typeof completed === "string" && source.trim() === completed.trim()) ||
        (!!task.collectionPractice && name !== "Main");
      result.push({ name, file, purpose, provided });
    }
  }
  return result;
}
