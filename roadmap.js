import { make, javaProject } from "./exercise-factories.js?v=interactive-linux-1";
const todo = 'throw new UnsupportedOperationException("TODO");';
const same = (source) => [source, source];
function lab(title, topics, mission, requirements, sources, tests, concept) {
  return {
    ...javaProject(
      title,
      concept,
      requirements,
      "Explain your design choices, the failure cases you tested, and how this component could change as the system grows.",
      sources,
      tests,
      "Start with the public contract and one happy-path example. Then test the boundaries before moving on.",
    ),
    mission,
    roadmapTopics: topics,
    learn: topics,
  };
}
const basics = [
  lab(
    "Meet your first customer",
    ["Classes and Objects", "Attributes and Methods"],
    "A neighbourhood repair shop is replacing its customer-name sticky notes with a simple customer register. Let staff add a customer, view their name and correct it later, while leaving every other customer’s name unchanged.",
    "Customer(String name) stores a trimmed, nonblank name. name() returns it; rename(String name) changes it. Null or blank names throw IllegalArgumentException without changing the existing name. Two customers must have independent state.",
    {
      "Customer.java": [
        `public class Customer {\n  public Customer(String name) { ${todo} }\n  public String name() { ${todo} }\n  public void rename(String name) { ${todo} }\n}\n`,
        `public class Customer {
  private String name;
  public Customer(String name) { rename(name); }
  public String name() { return name; }
  public void rename(String value) {
    if (value == null || value.isBlank()) throw new IllegalArgumentException();
    name = value.trim();
  }
}\n`,
      ],
    },
    'Customer a=new Customer(" Maya "), b=new Customer("Noor");expect(a.name().equals("Maya"));a.rename(" Alex ");expect(a.name().equals("Alex")&&b.name().equals("Noor"));rejects(()->a.rename(" "));rejects(()->new Customer(null));expect(a.name().equals("Alex"));',
    "A class defines the state and behavior of its objects. Constructors establish valid initial state; instance methods act on one object.",
  ),
  lab(
    "Keep the café till honest",
    ["Access Specifiers", "Encapsulation"],
    "The shop’s café keeps a balance in its till. Let the cashier add money and record spending, but refuse a payment that would leave too little money or an invalid amount that would corrupt the balance.",
    "Wallet(long initialCents), balance(), deposit(long cents), spend(long cents). Keep all instance fields private. Reject negative initial balance and nonpositive transactions with IllegalArgumentException. Spending above the balance throws IllegalStateException with no mutation. Deposits use overflow-safe addition; overflow throws ArithmeticException without mutation.",
    {
      "Wallet.java": [
        `public class Wallet {\n  public Wallet(long initialCents) { ${todo} }\n  public long balance() { ${todo} }\n  public void deposit(long cents) { ${todo} }\n  public void spend(long cents) { ${todo} }\n}\n`,
        `public class Wallet {
  private long balance;
  public Wallet(long initialCents) { if(initialCents<0) throw new IllegalArgumentException(); balance=initialCents; }
  public long balance() { return balance; }
  public void deposit(long cents) { if(cents<=0) throw new IllegalArgumentException(); balance=Math.addExact(balance,cents); }
  public void spend(long cents) { if(cents<=0) throw new IllegalArgumentException(); if(cents>balance) throw new IllegalStateException(); balance-=cents; }
}\n`,
      ],
    },
    "Wallet w=new Wallet(100);w.deposit(50);w.spend(75);expect(w.balance()==75);try{w.spend(76);throw new AssertionError();}catch(IllegalStateException e){}expect(w.balance()==75);rejects(()->w.deposit(0));rejects(()->w.spend(-1));rejects(()->new Wallet(-1));Wallet max=new Wallet(Long.MAX_VALUE);try{max.deposit(1);throw new AssertionError();}catch(ArithmeticException e){}expect(max.balance()==Long.MAX_VALUE);for(var f:Wallet.class.getDeclaredFields())if(!java.lang.reflect.Modifier.isStatic(f.getModifiers()))expect(java.lang.reflect.Modifier.isPrivate(f.getModifiers()));",
    "Private fields prevent callers from bypassing invariants. Public methods expose allowed operations rather than arbitrary setters.",
  ),
  lab(
    "Number the repair tickets",
    ["Static Keyword", "Final Keyword"],
    "Two counters issue repair tickets at the same shop. Give every new ticket the next number in one shared sequence, and make sure a ticket keeps that number for its entire life.",
    'JobTicket(): each new ticket gets the next ID, starting at 1. id() returns its permanent int ID; issued() returns the total across all tickets. Provide public static final String PREFIX="JOB". Use an instance final field for the ID and a static counter. Calls in this exercise are single-threaded.',
    {
      "JobTicket.java": [
        `public class JobTicket {\n  public JobTicket() { ${todo} }\n  public int id() { ${todo} }\n  public static int issued() { ${todo} }\n}\n`,
        `public class JobTicket {
  public static final String PREFIX="JOB";
  private static int count;
  private final int id;
  public JobTicket() { id=++count; }
  public int id() { return id; }
  public static int issued() { return count; }
}\n`,
      ],
    },
    'JobTicket a=new JobTicket(),b=new JobTicket();expect(a.id()==1&&b.id()==2&&a.id()==1&&JobTicket.issued()==2);expect(JobTicket.PREFIX.equals("JOB"));var prefix=JobTicket.class.getField("PREFIX");expect(java.lang.reflect.Modifier.isFinal(prefix.getModifiers())&&java.lang.reflect.Modifier.isStatic(prefix.getModifiers()));boolean instanceFinal=false;for(var f:JobTicket.class.getDeclaredFields())if(!java.lang.reflect.Modifier.isStatic(f.getModifiers())&&java.lang.reflect.Modifier.isFinal(f.getModifiers()))instanceFinal=true;expect(instanceFinal);',
    "Static state belongs to the class; instance state belongs to each object. Final prevents reassignment, but does not by itself make referenced objects immutable.",
  ),
  lab(
    "Pack a booking’s contact details",
    ["Nested Classes"],
    "A customer leaves a phone number when booking a collection. Let staff prepare those contact details before assigning them to a booking, and refuse a booking that has no contact details.",
    "Booking has a public static nested class Contact(String phone) with phone(). Trim and validate a nonblank phone. Booking(Contact contact) rejects null and contact() returns the supplied contact. Contact must be final with private final state. No phone-format validation beyond nonblank is required.",
    {
      "Booking.java": [
        `public class Booking {\n  public Booking(Contact contact) { ${todo} }\n  public Contact contact() { ${todo} }\n  public static final class Contact {\n    public Contact(String phone) { ${todo} }\n    public String phone() { ${todo} }\n  }\n}\n`,
        `public class Booking {
  private final Contact contact;
  public Booking(Contact contact) { if(contact==null) throw new IllegalArgumentException(); this.contact=contact; }
  public Contact contact() { return contact; }
  public static final class Contact {
    private final String phone;
    public Contact(String phone) { if(phone==null||phone.isBlank()) throw new IllegalArgumentException();this.phone=phone.trim(); }
    public String phone() { return phone; }
  }
}\n`,
      ],
    },
    'var c=new Booking.Contact(" 0123 ");expect(c.phone().equals("0123")&&new Booking(c).contact()==c);rejects(()->new Booking(null));rejects(()->new Booking.Contact(" "));rejects(()->new Booking.Contact(null));expect(java.lang.reflect.Modifier.isStatic(Booking.Contact.class.getModifiers()));expect(java.lang.reflect.Modifier.isFinal(Booking.Contact.class.getModifiers()));',
    "A static nested class has no implicit enclosing object. A non-static inner class does; choose deliberately rather than nesting everything.",
  ),
  lab(
    "Separate the counter from the workshop",
    ["Packages", "Access Specifiers"],
    "The counter needs to print a repair ticket’s label, while the workshop maintains the naming rules. Let the counter request a finished label without exposing the workshop’s internal formatting rules.",
    "Both source files declare package workshop. TicketLabel.format(int id) is public static: positive IDs become JOB-<id>; nonpositive IDs throw IllegalArgumentException. It delegates to package-private LabelRules.prefix(), which returns JOB. LabelRules itself must be package-private. The runner uses javac -d to create the package output folders; edit the supplied files directly.",
    {
      "TicketLabel.java": [
        `package workshop;\npublic class TicketLabel {\n  public static String format(int id) { ${todo} }\n}\n`,
        `package workshop;
public class TicketLabel {
  public static String format(int id) { if(id<=0)throw new IllegalArgumentException();return LabelRules.prefix()+"-"+id; }
}\n`,
      ],
      "LabelRules.java": [
        `package workshop;\nclass LabelRules {\n  static String prefix() { ${todo} }\n}\n`,
        `package workshop;
class LabelRules { static String prefix() { return "JOB"; } }
`,
      ],
    },
    'expect(workshop.TicketLabel.format(12).equals("JOB-12"));rejects(()->workshop.TicketLabel.format(0));Class<?> rules=Class.forName("workshop.LabelRules");expect(!java.lang.reflect.Modifier.isPublic(rules.getModifiers()));expect(workshop.TicketLabel.class.getPackageName().equals("workshop"));',
    "Packages group related types and define a visibility boundary. Public members can cross it; package-private types and methods cannot.",
  ),
];
const more = [
  lab(
    "Give different repairs one price contract",
    [
      "Inheritance",
      "Abstraction",
      "Method Overloading / Overriding",
      "Static vs Dynamic Binding",
    ],
    "The shop repairs both phones and laptops, each with a different fixed price. Let the till ask for a repair’s price in the same way regardless of the device, and receive the price for that particular repair.",
    "Abstract Repair has public abstract long price(). PhoneRepair and LaptopRepair extend Repair and return 3000 and 7000 cents. PriceDesk.quote(Repair) delegates to price(), rejecting null with IllegalArgumentException. Objects must dispatch correctly when held in a Repair reference.",
    {
      "PriceDesk.java": [
        `public class PriceDesk {\n  public long quote(Repair repair) { ${todo} }\n}\n`,
        `public class PriceDesk { public long quote(Repair repair) { if(repair==null)throw new IllegalArgumentException();return repair.price(); } }\n`,
      ],
      "Repair.java": same(
        "public abstract class Repair { public abstract long price(); }\n",
      ),
      "PhoneRepair.java": [
        `public class PhoneRepair extends Repair {\n  public long price() { ${todo} }\n}\n`,
        "public class PhoneRepair extends Repair { public long price() { return 3000; } }\n",
      ],
      "LaptopRepair.java": [
        `public class LaptopRepair extends Repair {\n  public long price() { ${todo} }\n}\n`,
        "public class LaptopRepair extends Repair { public long price() { return 7000; } }\n",
      ],
    },
    "PriceDesk d=new PriceDesk();Repair a=new PhoneRepair(),b=new LaptopRepair();expect(d.quote(a)==3000&&d.quote(b)==7000);expect(d.quote(new Repair(){public long price(){return 123;}})==123);rejects(()->d.quote(null));expect(java.lang.reflect.Modifier.isAbstract(Repair.class.getModifiers()));",
    "An abstract class cannot be instantiated directly. Overridden instance methods are selected using the runtime object, even through a base-type reference.",
  ),
  lab(
    "Let a new courier join without rewriting dispatch",
    ["Interfaces"],
    "The shop wants to use a bicycle courier alongside its other delivery partners. Let dispatch hand a parcel to whichever courier is chosen and return that courier’s tracking code, without favouring one partner.",
    "Courier.send(String parcel) returns a tracking code. Dispatch.ship(Courier,String) rejects null courier and null/blank parcel, trims the parcel and returns send’s result unchanged. BikeCourier returns BIKE:<parcel>. Dispatch must work with any injected Courier, not just BikeCourier.",
    {
      "Dispatch.java": [
        `public class Dispatch {\n  public String ship(Courier courier,String parcel) { ${todo} }\n}\n`,
        "public class Dispatch { public String ship(Courier courier,String parcel) { if(courier==null||parcel==null||parcel.isBlank())throw new IllegalArgumentException();return courier.send(parcel.trim()); } }\n",
      ],
      "Courier.java": same(
        "public interface Courier { String send(String parcel); }\n",
      ),
      "BikeCourier.java": [
        `public class BikeCourier implements Courier {\n  public String send(String parcel) { ${todo} }\n}\n`,
        'public class BikeCourier implements Courier { public String send(String parcel) { return "BIKE:"+parcel; } }\n',
      ],
    },
    'Dispatch d=new Dispatch();expect(d.ship(new BikeCourier()," box ").equals("BIKE:box"));expect(d.ship(p->"TEST:"+p,"unit").equals("TEST:unit"));rejects(()->d.ship(null,"x"));rejects(()->d.ship(new BikeCourier()," "));',
    "Interfaces describe capabilities without choosing storage or infrastructure. Callers depend on the contract, which makes implementations replaceable.",
  ),
  lab(
    "Predict which receipt method Java chooses",
    ["Method Overloading / Overriding", "Static vs Dynamic Binding"],
    "A receipt displays different wording depending on how a value is presented to the formatter. Reproduce the expected object, text and fancy results so the team can distinguish choosing a format from changing an existing formatter’s behaviour.",
    'Formatter.format(Object) returns object; format(String) returns text. FancyFormatter extends Formatter and overrides format(Object) to return fancy. BindingDemo.run() creates Formatter base=new FancyFormatter(), Object value="receipt", then returns base.format(value)+"|"+base.format("receipt"). Expected fancy|text. Implement both format overloads and the override; do not hardcode run’s result.',
    {
      "BindingDemo.java": [
        `public class BindingDemo {\n  public String run() { ${todo} }\n}\n`,
        'public class BindingDemo { public String run(){ Formatter base=new FancyFormatter();Object value="receipt";return base.format(value)+"|"+base.format("receipt"); } }\n',
      ],
      "Formatter.java": [
        `public class Formatter {\n  public String format(Object value) { ${todo} }\n  public String format(String value) { ${todo} }\n}\n`,
        'public class Formatter { public String format(Object value){return "object";}public String format(String value){return "text";} }\n',
      ],
      "FancyFormatter.java": [
        `public class FancyFormatter extends Formatter {\n  public String format(Object value) { ${todo} }\n}\n`,
        'public class FancyFormatter extends Formatter { public String format(Object value){return "fancy";} }\n',
      ],
    },
    'expect(new BindingDemo().run().equals("fancy|text"));Formatter f=new FancyFormatter();Object v="x";expect(f.format(v).equals("fancy"));expect(f.format("x").equals("text"));expect(new Formatter().format(new Object()).equals("object"));',
    "Overload resolution uses declared parameter types at compile time. After that selection, an overridden instance method uses runtime dispatch. Static methods are hidden rather than overridden.",
  ),
  lab(
    "Build a repair estimate in a fluent conversation",
    ["Method Chaining"],
    "A counter operator enters labour and parts prices before quoting a repair. Let them revise either amount and read the latest combined estimate, without losing valid values when an invalid price is entered.",
    "Estimate starts with zero labour and parts. labour(long) and parts(long) set their respective nonnegative cents and return the same Estimate instance. Negative values throw IllegalArgumentException without mutation. total() uses overflow-safe addition. Repeated setters replace the earlier value.",
    {
      "Estimate.java": [
        `public class Estimate {\n  public Estimate labour(long cents) { ${todo} }\n  public Estimate parts(long cents) { ${todo} }\n  public long total() { ${todo} }\n}\n`,
        `public class Estimate {
  private long labour,parts;
  public Estimate labour(long cents){if(cents<0)throw new IllegalArgumentException();labour=cents;return this;}
  public Estimate parts(long cents){if(cents<0)throw new IllegalArgumentException();parts=cents;return this;}
  public long total(){return Math.addExact(labour,parts);}
}\n`,
      ],
    },
    "Estimate e=new Estimate();expect(e.total()==0);expect(e.labour(300)==e&&e.parts(200)==e&&e.total()==500);e.parts(50);expect(e.total()==350);rejects(()->e.labour(-1));expect(e.total()==350);try{new Estimate().labour(Long.MAX_VALUE).parts(1).total();throw new AssertionError();}catch(ArithmeticException x){}",
    "Fluent methods return this for continued configuration. Chaining is a readability choice; it does not make mutable objects thread-safe.",
  ),
  lab(
    "Put repair status behind a finite set of names",
    ["Enums"],
    "A repair should move from received to repairing, then ready, then collected. Allow only the next step in that sequence so nobody skips unfinished work or moves a collected repair back into progress.",
    "JobStatus has RECEIVED, REPAIRING, READY, COLLECTED. canMoveTo(JobStatus next) returns true only for the next status in that sequence, false for every other case including null and the same status. COLLECTED has no next status.",
    {
      "JobStatus.java": [
        `public enum JobStatus {\n  RECEIVED, REPAIRING, READY, COLLECTED;\n  public boolean canMoveTo(JobStatus next) { ${todo} }\n}\n`,
        "public enum JobStatus { RECEIVED,REPAIRING,READY,COLLECTED;public boolean canMoveTo(JobStatus next){return next!=null&&ordinal()+1==next.ordinal();} }\n",
      ],
    },
    "for(JobStatus a:JobStatus.values())for(JobStatus b:JobStatus.values())expect(a.canMoveTo(b)==(a.ordinal()+1==b.ordinal()));expect(!JobStatus.READY.canMoveTo(null));expect(!JobStatus.COLLECTED.canMoveTo(JobStatus.RECEIVED));",
    "Enums model a closed set of values and can own behavior. Avoid persisting ordinal numbers as business identifiers because reordering constants changes them.",
  ),
  lab(
    "Freeze the handover receipt",
    ["Record", "Encapsulation"],
    "A customer receives a handover receipt listing the checks completed on their repair. Keep that issued receipt unchanged even if a staff member later edits the checklist they used to prepare it.",
    "Create public record Handover(String ticketId, java.util.List<String> checks). Its compact constructor trims the nonblank ID and stores an immutable defensive copy of the nonnull checks list. Reject null/blank IDs and null list with IllegalArgumentException. Lists containing null elements are rejected by List.copyOf. Use record-provided accessors and value equality.",
    {
      "Handover.java": [
        `public record Handover(String ticketId, java.util.List<String> checks) {\n  public Handover { ${todo} }\n}\n`,
        `public record Handover(String ticketId, java.util.List<String> checks) {
  public Handover {
    if(ticketId==null||ticketId.isBlank()||checks==null)throw new IllegalArgumentException();
    ticketId=ticketId.trim();checks=java.util.List.copyOf(checks);
  }
}\n`,
      ],
    },
    'List<String> original=new ArrayList<>(List.of("screen"));Handover a=new Handover(" J1 ",original);original.add("battery");expect(a.ticketId().equals("J1")&&a.checks().equals(List.of("screen")));expect(a.equals(new Handover("J1",List.of("screen"))));expect(Handover.class.isRecord());try{a.checks().add("x");throw new AssertionError();}catch(UnsupportedOperationException e){}rejects(()->new Handover(" ",List.of()));rejects(()->new Handover("x",null));',
    "Records provide accessors, equals, hashCode and toString for their components. Their final references do not make mutable component objects deeply immutable; defensive copying still matters.",
  ),
  lab(
    "Watch a workstation come to life",
    ["Object Lifecycle", "Initializer Block"],
    "A workshop performs shared setup the first time its workstations are used, then prepares each workstation separately. Record the setup and construction events in their actual order when two workstations are created.",
    "LifecycleLog.events is a public static final StringBuilder. Workstation uses a static initializer appending S, an instance initializer appending I, and its constructor appending C. LifecycleDemo.run() creates two Workstations and returns the log. A fresh JVM must produce SICIC. Implement actual initializer blocks; Workstation must remain constructible. Do not call run multiple times in one fresh-log expectation.",
    {
      "Workstation.java": [
        `public class Workstation {\n  static { /* TODO */ }\n  { /* TODO */ }\n  public Workstation() { ${todo} }\n}\n`,
        `public class Workstation {
  static { LifecycleLog.events.append("S"); }
  { LifecycleLog.events.append("I"); }
  public Workstation() { LifecycleLog.events.append("C"); }
}\n`,
      ],
      "LifecycleLog.java": same(
        "public class LifecycleLog { public static final StringBuilder events=new StringBuilder(); }\n",
      ),
      "LifecycleDemo.java": [
        `public class LifecycleDemo {\n  public String run() { ${todo} }\n}\n`,
        "public class LifecycleDemo { public String run(){new Workstation();new Workstation();return LifecycleLog.events.toString();} }\n",
      ],
    },
    'expect(new LifecycleDemo().run().equals("SICIC"));new Workstation();expect(LifecycleLog.events.toString().equals("SICICIC"));',
    "Class initialization happens once per class loader. Instance initialization runs for each object before its constructor body. Garbage collection timing is nondeterministic; finalizers are not reliable cleanup hooks.",
  ),
  lab(
    "Why did the customer’s address still change?",
    ["Pass by Value / Pass by Reference"],
    "Two helpers handle the same customer address: one edits its city, while the other replaces the address only for its own use. Make the first change visible to the caller and leave the caller’s address unchanged by the second.",
    'Address(String city) has city() and setCity(String). Validate and trim nonblank cities. AddressDemo.mutate(Address) changes its city to Penang. reassign(Address) assigns a new Address("Ipoh") only to its local parameter and does not mutate the caller’s object. Both reject null with IllegalArgumentException. Implement both effects; Java passes all arguments by value, including copied reference values.',
    {
      "AddressDemo.java": [
        `public class AddressDemo {\n  public void mutate(Address address) { ${todo} }\n  public void reassign(Address address) { ${todo} }\n}\n`,
        'public class AddressDemo { public void mutate(Address address){if(address==null)throw new IllegalArgumentException();address.setCity("Penang");}public void reassign(Address address){if(address==null)throw new IllegalArgumentException();address=new Address("Ipoh");} }\n',
      ],
      "Address.java": [
        `public class Address {\n  public Address(String city) { ${todo} }\n  public String city() { ${todo} }\n  public void setCity(String city) { ${todo} }\n}\n`,
        "public class Address { private String city;public Address(String city){setCity(city);}public String city(){return city;}public void setCity(String city){if(city==null||city.isBlank())throw new IllegalArgumentException();this.city=city.trim();} }\n",
      ],
    },
    'Address a=new Address("KL"),alias=a;AddressDemo d=new AddressDemo();d.reassign(a);expect(a==alias&&a.city().equals("KL"));d.mutate(a);expect(alias.city().equals("Penang"));rejects(()->d.mutate(null));rejects(()->d.reassign(null));rejects(()->new Address(" "));',
    "Java is always pass-by-value. A copied reference can reach and mutate the same object, but assigning that local reference cannot replace the caller’s variable.",
  ),
];
const collections = [
  lab(
    "Expand today’s repair list",
    ["Array vs ArrayList"],
    "The morning appointment list is full when a walk-in customer arrives. Produce a new working list with that customer at the end, let staff add more appointments, and keep the original morning list unchanged.",
    "DayPlan.append(String[] booked,String walkIn) returns a new mutable ArrayList<String> containing the original entries then walkIn. Reject null array, null/blank entries and null/blank walkIn with IllegalArgumentException. Preserve text and order; do not change or retain an array-backed view of the original array.",
    {
      "DayPlan.java": [
        `public class DayPlan {\n  public java.util.ArrayList<String> append(String[] booked,String walkIn) { ${todo} }\n}\n`,
        "public class DayPlan { public java.util.ArrayList<String> append(String[] booked,String walkIn){if(booked==null||walkIn==null||walkIn.isBlank())throw new IllegalArgumentException();java.util.ArrayList<String> out=new java.util.ArrayList<>();for(String item:booked){if(item==null||item.isBlank())throw new IllegalArgumentException();out.add(item);}out.add(walkIn);return out;} }\n",
      ],
    },
    'String[] input={"J1","J2"};var out=new DayPlan().append(input,"J3");expect(out.equals(List.of("J1","J2","J3")));out.add("J4");input[0]="changed";expect(out.get(0).equals("J1"));expect(new DayPlan().append(new String[]{},"x").equals(List.of("x")));rejects(()->new DayPlan().append(null,"x"));rejects(()->new DayPlan().append(new String[]{null},"x"));',
    "Arrays have fixed length. ArrayList grows dynamically; Arrays.asList is a fixed-size view backed by its array, not a freely growable list.",
  ),
  lab(
    "One reminder per customer",
    ["Set"],
    "A customer may have several repairs ready for collection but should receive only one reminder. Prepare a reminder list with each customer appearing once, in the order they first appeared in the repair list.",
    "Reminders.unique(String[] customers) returns a LinkedHashSet<String>. Trim and uppercase IDs with Locale.ROOT, deduplicate, preserve first-seen order. Reject null array or null/blank entries with IllegalArgumentException. Empty input returns an empty set.",
    {
      "Reminders.java": [
        `public class Reminders {\n  public java.util.LinkedHashSet<String> unique(String[] customers) { ${todo} }\n}\n`,
        "public class Reminders { public java.util.LinkedHashSet<String> unique(String[] customers){if(customers==null)throw new IllegalArgumentException();var out=new java.util.LinkedHashSet<String>();for(String id:customers){if(id==null||id.isBlank())throw new IllegalArgumentException();out.add(id.trim().toUpperCase(java.util.Locale.ROOT));}return out;} }\n",
      ],
    },
    'expect(new ArrayList<>(new Reminders().unique(new String[]{" b ","a","B"})).equals(List.of("B","A")));expect(new Reminders().unique(new String[]{}).isEmpty());rejects(()->new Reminders().unique(new String[]{" "}));rejects(()->new Reminders().unique(null));',
    "A Set models uniqueness. LinkedHashSet preserves insertion order; HashSet does not promise it. Mutable equality keys can break membership expectations.",
  ),
  lab(
    "Find a repair without scanning the shelf",
    ["Map"],
    "The counter needs to look up a repair description from its ticket ID. Build that lookup from the supplied rows, and reject duplicate ticket IDs rather than silently replacing one customer’s repair with another.",
    "RepairIndex.build(String[][] rows) returns Map<String,String>, each row exactly [id,description]. Trim both fields; reject null arrays, malformed rows, null/blank fields and duplicate trimmed IDs with IllegalArgumentException. IDs are case-sensitive. Return an independent map; empty input gives an empty map.",
    {
      "RepairIndex.java": [
        `public class RepairIndex {\n  public java.util.Map<String,String> build(String[][] rows) { ${todo} }\n}\n`,
        "public class RepairIndex { public java.util.Map<String,String> build(String[][] rows){if(rows==null)throw new IllegalArgumentException();var out=new java.util.HashMap<String,String>();for(String[] row:rows){if(row==null||row.length!=2||row[0]==null||row[1]==null||row[0].isBlank()||row[1].isBlank())throw new IllegalArgumentException();String id=row[0].trim();if(out.putIfAbsent(id,row[1].trim())!=null)throw new IllegalArgumentException();}return out;} }\n",
      ],
    },
    'String[][] rows={{" J1 "," phone "},{"J2","laptop"}};var index=new RepairIndex().build(rows);rows[0][1]="changed";expect(index.equals(Map.of("J1","phone","J2","laptop")));rejects(()->new RepairIndex().build(new String[][]{{"J1","x"},{" J1 ","y"}}));rejects(()->new RepairIndex().build(new String[][]{{"x"}}));rejects(()->new RepairIndex().build(null));expect(new RepairIndex().build(new String[][]{}).isEmpty());',
    "A Map associates unique keys with values. Choose and document duplicate-key behavior; a plain put silently replaces the old value.",
  ),
  lab(
    "Serve the next customer fairly",
    ["Queue"],
    "Customers join the collection queue throughout the day. Serve them in arrival order, show how many are still waiting, and report that nobody is next when the queue is empty.",
    "WaitingLine.join(String id) rejects null/blank IDs and stores trimmed IDs. next() returns and removes the oldest ID or null when empty. size() returns waiting count. Use a Queue<String> implementation such as ArrayDeque; duplicate IDs are permitted in this exercise.",
    {
      "WaitingLine.java": [
        `public class WaitingLine {\n  public void join(String id) { ${todo} }\n  public String next() { ${todo} }\n  public int size() { ${todo} }\n}\n`,
        "public class WaitingLine { private final java.util.Queue<String> queue=new java.util.ArrayDeque<>();public void join(String id){if(id==null||id.isBlank())throw new IllegalArgumentException();queue.offer(id.trim());}public String next(){return queue.poll();}public int size(){return queue.size();} }\n",
      ],
    },
    'WaitingLine q=new WaitingLine();expect(q.next()==null);q.join(" A ");q.join("B");q.join("A");expect(q.size()==3&&q.next().equals("A")&&q.next().equals("B")&&q.next().equals("A")&&q.next()==null);rejects(()->q.join(" "));rejects(()->q.join(null));',
    "FIFO queues remove the earliest inserted item. poll returns null on an empty queue; remove throws. PriorityQueue instead orders by priority, not arrival.",
  ),
  lab(
    "Undo the last counter note",
    ["Dequeue", "Stack"],
    "A cashier needs to undo the most recent note without removing earlier notes. Keep notes in order, return the newest one when undone, and let the cashier inspect the oldest remaining note without removing it.",
    "NoteHistory.add(String) validates and trims nonblank text; undo() removes and returns the most recently added note, or null if empty; oldest() returns the earliest remaining note without removal. Use Deque<String>/ArrayDeque. Independent history instances must not share state.",
    {
      "NoteHistory.java": [
        `public class NoteHistory {\n  public void add(String note) { ${todo} }\n  public String undo() { ${todo} }\n  public String oldest() { ${todo} }\n}\n`,
        "public class NoteHistory { private final java.util.Deque<String> notes=new java.util.ArrayDeque<>();public void add(String note){if(note==null||note.isBlank())throw new IllegalArgumentException();notes.push(note.trim());}public String undo(){return notes.pollFirst();}public String oldest(){return notes.peekLast();} }\n",
      ],
    },
    'NoteHistory h=new NoteHistory();expect(h.undo()==null&&h.oldest()==null);h.add(" first ");h.add("second");h.add("third");expect(h.oldest().equals("first")&&h.undo().equals("third")&&h.undo().equals("second")&&h.oldest().equals("first"));expect(new NoteHistory().undo()==null);rejects(()->h.add(" "));',
    "A deque supports both ends and can implement FIFO queues or LIFO stacks. The roadmap labels it Dequeue; the Java interface is Deque. Prefer Deque to legacy Stack for this use.",
  ),
  lab(
    "Clear cancelled jobs during a shelf walk",
    ["Iterator"],
    "The workshop’s shelf list still includes cancelled repairs, sometimes next to one another. Remove every cancelled entry, keep the remaining labels in their original order, and report how many were removed.",
    "ShelfCleanup.removeCancelled(List<String> jobs) mutates the supplied list, removing entries starting CANCELLED:, and returns the removed count. Reject null list or null entries with IllegalArgumentException before any mutation. Use Iterator.remove rather than indexed removal or removeIf for this drill. Preserve other entries and their order. Input is a mutable ArrayList.",
    {
      "ShelfCleanup.java": [
        `public class ShelfCleanup {\n  public int removeCancelled(java.util.List<String> jobs) { ${todo} }\n}\n`,
        'public class ShelfCleanup { public int removeCancelled(java.util.List<String> jobs){if(jobs==null||jobs.stream().anyMatch(java.util.Objects::isNull))throw new IllegalArgumentException();int n=0;var it=jobs.iterator();while(it.hasNext()){if(it.next().startsWith("CANCELLED:")){it.remove();n++;}}return n;} }\n',
      ],
    },
    'List<String> jobs=new ArrayList<>(List.of("J1","CANCELLED:a","CANCELLED:b","J2"));expect(new ShelfCleanup().removeCancelled(jobs)==2&&jobs.equals(List.of("J1","J2")));expect(new ShelfCleanup().removeCancelled(new ArrayList<>())==0);List<String> bad=new ArrayList<>(Arrays.asList("CANCELLED:a",null));rejects(()->new ShelfCleanup().removeCancelled(bad));expect(bad.size()==2);',
    "Iterator.remove updates traversal state safely after next. External structural mutation during traversal can trigger ConcurrentModificationException; it is a bug detector, not a synchronization guarantee.",
  ),
  lab(
    "Reuse one tray for different kinds of work",
    ["Generic Collections"],
    "The workshop uses trays for both ticket numbers and customer names. Give both trays the same arrival-order behaviour while keeping their contents separate, and let staff save a list of contents that later tray changes cannot alter.",
    "Tray<T> has add(T), take() and snapshot(). Reject null additions with IllegalArgumentException. take removes the oldest value or returns null when empty. snapshot returns an immutable, independent List<T> in arrival order. Do not use raw types, Object casts or static shared storage. The class must declare one generic type parameter.",
    {
      "Tray.java": [
        `public class Tray<T> {\n  public void add(T item) { ${todo} }\n  public T take() { ${todo} }\n  public java.util.List<T> snapshot() { ${todo} }\n}\n`,
        "public class Tray<T> { private final java.util.Deque<T> values=new java.util.ArrayDeque<>();public void add(T item){if(item==null)throw new IllegalArgumentException();values.addLast(item);}public T take(){return values.pollFirst();}public java.util.List<T> snapshot(){return java.util.List.copyOf(values);} }\n",
      ],
    },
    'Tray<Integer> ids=new Tray<>();Tray<String> names=new Tray<>();ids.add(1);ids.add(2);names.add("Maya");List<Integer> saved=ids.snapshot();expect(ids.take()==1&&ids.take()==2&&ids.take()==null);expect(saved.equals(List.of(1,2))&&names.take().equals("Maya"));try{saved.add(3);throw new AssertionError();}catch(UnsupportedOperationException e){}rejects(()->ids.add(null));expect(Tray.class.getTypeParameters().length==1);',
    "Generics preserve compile-time type information and avoid raw casts. A typed collection is not automatically immutable or thread-safe; those are separate design decisions.",
  ),
];
export const roadmapCourses = [
  make(
    "java-oop-basics",
    "java",
    "Basics of OOP: open the repair shop",
    "Start with one customer, then protect state and organise the growing shop.",
    ["Classes", "Access", "Static", "Final", "Nested classes", "Packages"],
    basics,
  ),
  make(
    "java-oop-more",
    "java",
    "More about OOP: grow the workshop",
    "Make the workshop extensible and learn what Java does during construction and dispatch.",
    ["Inheritance", "Interfaces", "Binding", "Enums", "Records", "Lifecycle"],
    more,
  ),
  make(
    "java-collections",
    "java",
    "Collections: run the busy counter",
    "Choose containers by the behaviour the shop needs: growth, uniqueness, lookup, order and safe traversal.",
    ["List", "Set", "Map", "Queue", "Deque", "Iterator", "Generics"],
    collections,
  ),
];
for (const course of roadmapCourses) {
  course.level = "Foundation to intermediate";
  course.minutes = course.lessons.length * 20;
}
