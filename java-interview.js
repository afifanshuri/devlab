import { make } from "./exercise-factories.js";

const topics = [];
const q = (
  mission,
  goal,
  answers,
  explanation,
  code = "",
  definitions = "",
) => ({
  mission,
  goal,
  answers: Array.isArray(answers) ? answers : [answers],
  explanation,
  code: definitions ? definitions + "\n\n" + code : code,
  answerFormat: code ? "output" : "value",
  // Output questions carry an independently runnable Java probe for verification.
  ...(code
    ? {
        probe: `import java.util.*; import java.util.concurrent.*; import java.util.concurrent.atomic.*; public class InterviewProbe { ${definitions} public static void main(String[] args) throws Exception { ${code} } }`,
      }
    : {}),
});
const pair = (learningGroup, topic, prerequisite, first, second) =>
  topics.push({
    learningGroup,
    topic,
    prerequisite,
    questions: [first, second],
  });

pair(
  "java-oop",
  "Pass by value and mutable references",
  "hands-java-oop-more:7",
  q(
    "A helper reassigns its array parameter while processing a customer's score.",
    "Enter the exact value printed by this code.",
    "1",
    "The parameter receives a copy of the reference. Assigning a new array to that local parameter does not replace the caller's reference.",
    "int[] a = {1}; replace(a); System.out.print(a[0]);",
    "static void replace(int[] a) { a = new int[]{9}; }",
  ),
  q(
    "Another helper updates an element through its copied array reference.",
    "Enter the exact value printed by this code.",
    "9",
    "Both references initially point at the same array, so changing an element is visible to the caller.",
    "int[] a = {1}; change(a); System.out.print(a[0]);",
    "static void change(int[] a) { a[0] = 9; }",
  ),
);
pair(
  "java-oop",
  "Overloading, overriding and binding",
  "hands-java-oop-more:2",
  q(
    "A variable has a broad declared type but holds a more specific object. Two overloads are available.",
    "Enter the exact text printed. The declarations shown belong inside the enclosing class.",
    "object",
    "Overload selection uses the argument's compile-time type, Object, so pick(Object) is selected.",
    'Object x = "hello"; System.out.print(pick(x));',
    'static String pick(Object x) { return "object"; } static String pick(String x) { return "string"; }',
  ),
  q(
    "A service refers to a child object through its parent type and calls an overridden instance method.",
    "Enter the exact text printed. Parent and Child are nested classes in this example.",
    "child",
    "Instance-method overriding dispatches to the runtime object's implementation.",
    "Parent p = new Child(); System.out.print(p.name());",
    'static class Parent { String name() { return "parent"; } } static class Child extends Parent { @Override String name() { return "child"; } }',
  ),
);
pair(
  "java-oop",
  "Equality & hashing",
  "hands-java-contracts:0",
  q(
    "Two distinct String objects hold the same customer name.",
    "Enter the exact printed line, including the comma and without spaces.",
    "false,true",
    "Reference equality is false for the two new objects; String.equals compares their text.",
    'String a = new String("Afif"); String b = new String("Afif"); System.out.print((a == b) + "," + a.equals(b));',
  ),
  q(
    "A key class overrides equals so two different instances can be equal, but still inherits Object's hashCode.",
    "Which method must be overridden consistently with equals? Enter only its method name, without parentheses.",
    "hashCode",
    "Equal objects must have equal hash codes. The reverse is not required: unequal objects may share a hash code.",
  ),
);
pair(
  "java-oop",
  "Records and value equality",
  "hands-java-oop-more:5",
  q(
    "A final variable points to a mutable list. The variable is never reassigned.",
    "Enter the exact value printed, assuming the required imports are present.",
    "1",
    "final prevents reassignment of the reference; it does not make the referenced ArrayList immutable.",
    'final List<String> names = new ArrayList<>(); names.add("A"); System.out.print(names.size());',
  ),
  q(
    "A record stores a list directly rather than making a defensive copy.",
    "Enter only the exact value printed by this Java code. Box is a nested record.",
    "1",
    "Records do not automatically deep-copy their components. This record and the caller still share the mutable list.",
    'List<String> names = new ArrayList<>(); Box box = new Box(names); names.add("A"); System.out.print(box.names().size());',
    "record Box(List<String> names) {}",
  ),
);
pair(
  "java-collections",
  "Generic collections",
  "hands-java-collections:6",
  q(
    "A method reads numeric values from List<? extends Number>. It must be valid for an actual List<Integer> or List<Double>.",
    "Can the method safely add Integer.valueOf(1) to that list through this parameter? Enter yes or no. Ignore null.",
    "no",
    "The unknown subtype could be Double, so adding an Integer is not type-safe. extends is useful for reading values as Number.",
  ),
  q(
    "A destination is declared List<? super Integer> and may refer to a List<Number> or List<Object>.",
    "What is the most specific non-null reference type guaranteed by get(0) without a cast? Enter the simple class name.",
    ["Object", "java.lang.Object"],
    "A super-bounded list can accept Integer values, but reading guarantees only Object because the actual element type may be a supertype.",
  ),
);
pair(
  "java-oop",
  "Exceptions & resource management",
  "hands-java-contracts:1",
  q(
    "A method declares throws IOException, and its caller neither catches nor declares that exception.",
    "Is IOException a checked or unchecked exception? Enter checked or unchecked.",
    "checked",
    "IOException is a checked exception, so a caller must handle it or declare an appropriate throws clause.",
  ),
  q(
    "A try-with-resources block throws an exception, and closing its resource throws a second exception.",
    "Which Throwable method retrieves the close-time exceptions attached to the primary exception? Enter only the method name, without parentheses.",
    "getSuppressed",
    "Try-with-resources normally preserves the body exception and attaches close-time failures as suppressed exceptions.",
  ),
);
pair(
  "java-oop",
  "Object lifecycle and initializer blocks",
  "hands-java-oop-more:6",
  q(
    "Constructing two instances triggers a class initializer, an instance initializer and a constructor.",
    "Enter the exact printed text, without spaces. Item is a nested class not initialized before this code.",
    "SICIC",
    "The static initializer runs once; each new instance runs its instance initializer and then its constructor.",
    "new Item(); new Item();",
    'static class Item { static { System.out.print("S"); } { System.out.print("I"); } Item() { System.out.print("C"); } }',
  ),
  q(
    "An uninitialized int instance field is read immediately after constructing its object.",
    "Enter only the exact value printed by this Java code. Counter has no explicit constructor or field initializer.",
    "0",
    "Instance fields receive default values; int defaults to zero. An uninitialized local variable follows different rules.",
    "System.out.print(new Counter().count);",
    "static class Counter { int count; }",
  ),
);

pair(
  "java-collections",
  "Map and indexing",
  "hands-java-collections:2",
  q(
    "An in-memory index is a plain HashMap, with no external synchronization or wrapper.",
    "Does HashMap guarantee iteration in insertion order? Enter yes or no.",
    "no",
    "HashMap does not guarantee iteration order. LinkedHashMap can preserve insertion order.",
  ),
  q(
    "An index receives two writes for the same key followed by a read.",
    "Enter only the exact value printed by this Java code.",
    "2",
    "The second put replaces the mapping's value; it does not add another entry with the same key.",
    'Map<String,Integer> m = new HashMap<>(); m.put("A",1); m.put("A",2); System.out.print(m.get("A"));',
  ),
);
pair(
  "java-collections",
  "Set and stable deduplication",
  "hands-java-collections:1",
  q(
    "A reminder audience must discard duplicates while retaining first-insertion order.",
    "Name the standard java.util Set implementation designed for this requirement. Enter its simple class name.",
    ["LinkedHashSet", "java.util.LinkedHashSet"],
    "LinkedHashSet combines set uniqueness with a predictable insertion-based encounter order.",
  ),
  q(
    "Two separately allocated Strings with equal text are inserted into a HashSet.",
    "Enter only the exact set size printed by this Java code.",
    "1",
    "HashSet uses equality and hashing rather than reference identity to determine duplicate String values.",
    'Set<String> s = new HashSet<>(); s.add(new String("A")); s.add(new String("A")); System.out.print(s.size());',
  ),
);
pair(
  "java-collections",
  "Deque and stack",
  "hands-java-collections:4",
  q(
    "An ArrayDeque is used as a stack through push and pop.",
    "Enter only the exact value printed by this Java code.",
    "2",
    "push inserts at the front and pop removes from the front, so the most recently pushed value is removed first.",
    "Deque<Integer> d = new ArrayDeque<>(); d.push(1); d.push(2); System.out.print(d.pop());",
  ),
  q(
    "An ArrayDeque is used as a FIFO queue through offer and poll.",
    "Enter only the exact value printed by this Java code.",
    "1",
    "offer appends to the tail and poll removes the head in queue usage.",
    "Deque<Integer> d = new ArrayDeque<>(); d.offer(1); d.offer(2); System.out.print(d.poll());",
  ),
);
pair(
  "java-collections",
  "Arrays and ArrayList",
  "hands-java-collections:0",
  q(
    "A list backed by Arrays.asList is asked to grow by one element.",
    "Enter the exact exception simple class name printed by the catch block.",
    "UnsupportedOperationException",
    "Arrays.asList returns a fixed-size view; adding an element is unsupported.",
    'try { Arrays.asList("A","B").add("C"); } catch (RuntimeException e) { System.out.print(e.getClass().getSimpleName()); }',
  ),
  q(
    "A list created with List.of is asked to replace an element.",
    "Enter the exact exception simple class name printed by the catch block.",
    "UnsupportedOperationException",
    "List.of creates an unmodifiable list; set is unsupported as well as add/remove.",
    'try { List.of("A","B").set(0,"C"); } catch (RuntimeException e) { System.out.print(e.getClass().getSimpleName()); }',
  ),
);
pair(
  "java-collections",
  "Iterator and safe mutation",
  "hands-java-collections:5",
  q(
    "An Iterator over an ArrayList must remove the element it most recently returned. No other mutation is happening.",
    "Which Iterator method performs this removal? Enter only the method name, without parentheses.",
    "remove",
    "Iterator.remove removes the last element returned by that iterator when the implementation supports removal.",
  ),
  q(
    "An ArrayList iterator is asked to remove before its first next call.",
    "Enter the exact exception simple class name printed.",
    "IllegalStateException",
    "remove requires a successful next call and cannot be repeated for the same returned element.",
    'Iterator<String> it = new ArrayList<>(List.of("A")).iterator(); try { it.remove(); } catch (RuntimeException e) { System.out.print(e.getClass().getSimpleName()); }',
  ),
);
pair(
  "java-collections",
  "Streams & Optional",
  "hands-java-analysis:0",
  q(
    "A sequential Stream uses peek for a side effect but has no terminal operation.",
    "Enter the exact printed value; do not add any hypothetical terminal operation.",
    "0",
    "Creating this lazy pipeline does not traverse its elements. The peek action has not run.",
    "AtomicInteger seen = new AtomicInteger(); List.of(1,2,3).stream().peek(x -> seen.incrementAndGet()); System.out.print(seen.get());",
  ),
  q(
    "An Optional already contains a value, but orElse receives a function call as its argument.",
    "Enter the exact printed text, without spaces. fallback is a static helper.",
    "Fx",
    "The orElse argument is evaluated eagerly, so fallback prints F before orElse returns the existing x. orElseGet can defer fallback computation.",
    'System.out.print(Optional.of("x").orElse(fallback()));',
    'static String fallback() { System.out.print("F"); return "y"; }',
  ),
);

pair(
  "java-solid",
  "Single responsibility (SRP)",
  "hands-java-solid-workshop:0",
  q(
    "InvoiceService calculates tax, formats PDFs and sends email. Each of those policies changes for a different business reason.",
    "Which SOLID principle directly addresses these separate reasons to change? Enter its three-letter acronym.",
    "SRP",
    "The Single Responsibility Principle separates responsibilities that change for different actors or reasons.",
  ),
  q(
    "A team splits pricing, receipt rendering and delivery into independent components so that changing email delivery does not require editing pricing.",
    "Which SOLID principle is this separation primarily demonstrating? Enter its three-letter acronym.",
    "SRP",
    "Separating unrelated change reasons is the central SRP concern.",
  ),
);
pair(
  "java-solid",
  "Open/closed principle (OCP)",
  "hands-java-solid-workshop:1",
  q(
    "Adding every discount requires editing an existing checkout switch. A team replaces it with extensible discount implementations while leaving checkout unchanged.",
    "Which SOLID principle describes being open to extension and closed to modification? Enter its three-letter acronym.",
    "OCP",
    "The Open/Closed Principle lets supported variation be extended without repeatedly modifying stable consuming code.",
  ),
  q(
    "Checkout accepts a Discount interface. A new implementation is registered without changing the existing checkout calculation.",
    "Did the new discount require modifying the checkout calculation in this stated design? Enter yes or no.",
    "no",
    "The scenario explicitly extends the policy through a new implementation rather than editing the stable calculation.",
  ),
);
pair(
  "java-solid",
  "Liskov substitution (LSP)",
  "hands-java-solid-workshop:2",
  q(
    "A subtype replaces a parent in existing client code but starts rejecting inputs that the parent's documented contract accepts.",
    "Which SOLID principle forbids strengthening those preconditions? Enter its three-letter acronym.",
    "LSP",
    "Liskov substitution requires subtypes to preserve the parent contract expected by clients, including accepted inputs.",
  ),
  q(
    "The Account.withdraw contract accepts any positive amount up to the balance. PremiumAccount additionally requires an amount of at least 100.",
    "Can PremiumAccount honor the stated parent contract for every valid parent input? Enter yes or no.",
    "no",
    "An amount such as 50 can satisfy the parent contract and fail the subtype's stronger requirement.",
  ),
);
pair(
  "java-solid",
  "Interface segregation (ISP)",
  "hands-java-solid-workshop:3",
  q(
    "A print-only device must implement scan and fax methods solely because they appear in one large interface.",
    "Which SOLID principle calls for smaller client-specific interfaces here? Enter its three-letter acronym.",
    "ISP",
    "The Interface Segregation Principle avoids forcing clients or implementations to depend on capabilities they do not need.",
  ),
  q(
    "A report component only sends print jobs. The available contracts are Printer, Scanner and Fax, each exposing only its named capability.",
    "Which one interface should this report component require? Enter exactly its name.",
    "Printer",
    "The report component needs only the printing contract; depending on Scanner or Fax would add unrelated capabilities.",
  ),
);
pair(
  "java-solid",
  "Dependency inversion (DIP)",
  "hands-java-solid-workshop:4",
  q(
    "A business service directly constructs SqlCustomerRepository. The refactor makes both the service and SQL adapter depend on a CustomerRepository abstraction.",
    "Which SOLID principle is primarily about this dependency direction? Enter its three-letter acronym.",
    "DIP",
    "Dependency inversion moves the high-level policy's dependency toward an abstraction rather than a concrete infrastructure class.",
  ),
  q(
    "A service constructor accepts CustomerRepository, but the service body still calls new SqlCustomerRepository and uses that new object instead.",
    "Has this service removed its direct dependency on the concrete SQL repository? Enter yes or no.",
    "no",
    "Merely accepting an interface parameter does not remove a concrete dependency that the implementation continues to construct and use.",
  ),
);

pair(
  "java-patterns",
  "Singleton",
  "hands-java-architecture:0",
  q(
    "A component controls its construction and provides one shared instance through an access point within one class-loader scope.",
    "Name the classic design pattern described. Enter its pattern name only.",
    "Singleton",
    "Singleton controls instance creation and access. Its scope is not automatically a whole distributed deployment.",
  ),
  q(
    "A singleton class is loaded separately by two independent class loaders, each creating its own static instance.",
    "Does its static instance field alone guarantee one shared object across both class loaders? Enter yes or no.",
    "no",
    "Each loaded class has its own static state; a JVM-wide or distributed uniqueness requirement needs more than this field.",
  ),
);
pair(
  "java-patterns",
  "Strategy",
  "hands-java-architecture:1",
  q(
    "Checkout delegates shipping cost to a supplied policy object and can swap that algorithm without changing checkout.",
    "Name the behavioral pattern focused on interchangeable algorithms.",
    "Strategy",
    "Strategy encapsulates a family of algorithms behind a common contract.",
  ),
  q(
    "ShippingPolicy is a functional interface with exactly one abstract method. Checkout accepts a ShippingPolicy.",
    "Can a matching lambda provide this policy without a named implementing class? Enter yes or no.",
    "yes",
    "A lambda can implement the matching functional-interface contract used as the strategy.",
  ),
);
pair(
  "java-patterns",
  "Observer",
  "hands-java-architecture:3",
  q(
    "An order publisher maintains subscribers and sends an order-paid event to all registered listeners when its state changes.",
    "Name the classic one-to-many notification pattern.",
    "Observer",
    "Observer connects a publisher to registered observers so a notification can reach multiple listeners.",
  ),
  q(
    "A synchronous publisher iterates a snapshot containing listeners A then B. Both return normally, and each is invoked exactly once.",
    "Enter the listener invocation order as two comma-separated letters with no spaces.",
    "A,B",
    "The specified iteration order is A followed by B. The assumptions exclude failure and concurrent-list mutation.",
  ),
);
pair(
  "java-patterns",
  "Factory",
  "hands-java-architecture:2",
  q(
    "A Creator defines a creation method, while subclasses override that method to choose which concrete Product is constructed.",
    "Name this classic creational pattern using its two-word name.",
    ["Factory Method", "FactoryMethod"],
    "Factory Method delegates the concrete product choice through an overridable creation method.",
  ),
  q(
    "A single static method selects a product through a switch, with no creator subclass overriding a creation method.",
    "Is this specifically the subclass-based Factory Method structure described in the previous question? Enter yes or no.",
    "no",
    "This may be a simple factory, but it lacks the subclass-overridden creation method specified by Factory Method.",
  ),
);
pair(
  "java-patterns",
  "Adapter",
  "hands-java-architecture:4",
  q(
    "The application expects charge(int cents). A wrapper translates it to a legacy pay(String decimalAmount) operation.",
    "Name the structural pattern that reconciles these incompatible interfaces.",
    "Adapter",
    "Adapter translates one interface into the interface its client expects.",
  ),
  q(
    "A payment adapter receives 105 integer cents and must pass a decimal amount string with exactly two fractional digits to the legacy gateway.",
    "Enter only the required string contents, without quotation marks or a currency symbol.",
    "1.05",
    "105 cents is exactly 1.05 currency units; integer/decimal conversion should preserve that amount.",
  ),
);
pair(
  "java-patterns",
  "Decorator",
  "hands-java-architecture:5",
  q(
    "A payment wrapper implements the same Payment interface as its delegate and adds auditing around the delegated call.",
    "Name the structural pattern that adds behavior through a same-interface wrapper.",
    "Decorator",
    "Decorator preserves the component contract while adding responsibilities around the wrapped component.",
  ),
  q(
    "The wrapper's charge method performs audit-before, delegate-charge, then audit-after. All calls return normally.",
    "Enter the execution order as before,delegate,after with commas and no spaces.",
    "before,delegate,after",
    "The question fixes the order of the wrapper's three operations; no failure path interrupts the sequence.",
  ),
);
pair(
  "java-patterns",
  "Command",
  "hands-java-architecture:6",
  q(
    "An invoker queues objects representing stock reservations. Each object captures its arguments and exposes execute and undo operations.",
    "Name the behavioral pattern that represents requests as objects.",
    "Command",
    "Command encapsulates a request so it can be queued, recorded or paired with an undo operation.",
  ),
  q(
    "Stock starts at 10. A reservation command executes once for 3 units and then undoes that exact reservation once. No other command runs.",
    "What is the final stock quantity? Enter one integer.",
    "10",
    "Execution subtracts 3 and its single undo restores those same 3 units.",
  ),
);
pair(
  "java-patterns",
  "Builder",
  "hands-java-architecture:7",
  q(
    "An immutable report request has many optional fields. A separate construction object gathers them step by step before producing the validated request.",
    "Name the creational pattern described.",
    "Builder",
    "Builder separates stepwise construction from the resulting object's representation.",
  ),
  q(
    "A report constructor stores its builder's mutable tag list directly, and the builder adds another tag after build returns.",
    "Does a final field holding that list alone prevent the built report's tags from changing? Enter yes or no.",
    "no",
    "final prevents field reassignment, not mutation through the builder's alias. An immutable result needs an appropriate defensive copy.",
  ),
);
pair(
  "java-patterns",
  "Composite",
  "hands-java-patterns-advanced:2",
  q(
    "Files and folders expose the same totalSize operation. A folder recursively sums its children, which can be either files or more folders.",
    "Name the structural pattern supporting this uniform tree treatment.",
    "Composite",
    "Composite represents part-whole trees through a shared component interface.",
  ),
  q(
    "A root contains a file of size 2 and a subfolder containing files of sizes 3 and 5. Folder metadata contributes zero and no child is counted twice.",
    "What totalSize should the root return? Enter one integer.",
    "10",
    "The composite total is the sum of leaf sizes: 2 + 3 + 5.",
  ),
);

pair(
  "java-reliability",
  "Visibility & happens-before",
  "hands-java-reliability:3",
  q(
    "A shared stop flag is declared volatile, and one thread writes it while another reads it.",
    "Name the Java keyword in this declaration that supplies the visibility guarantee. Enter the keyword only.",
    "volatile",
    "A volatile write happens-before a subsequent read of that variable, supporting visibility across threads.",
  ),
  q(
    "Two threads each run count++ on the same volatile int without a lock or an atomic update operation.",
    "Is the complete read-modify-write increment guaranteed atomic merely because count is volatile? Enter yes or no.",
    "no",
    "volatile does not turn the read, addition and write of ++ into one atomic operation.",
  ),
);
pair(
  "java-reliability",
  "Atomic claims and synchronization",
  "hands-java-reliability:2",
  q(
    "An AtomicInteger starts at 4 and getAndIncrement is called once.",
    "Enter the exact printed line, including the comma and no spaces.",
    "4,5",
    "getAndIncrement returns the prior value, then leaves the counter incremented by one.",
    'AtomicInteger n = new AtomicInteger(4); int previous = n.getAndIncrement(); System.out.print(previous + "," + n.get());',
  ),
  q(
    "A compare-and-set operation expects an old value that does not match the AtomicInteger's current value.",
    "Enter the exact printed line, including the comma and no spaces.",
    "false,4",
    "The failed comparison returns false and does not change the current value.",
    'AtomicInteger n = new AtomicInteger(4); boolean changed = n.compareAndSet(3,9); System.out.print(changed + "," + n.get());',
  ),
);
pair(
  "java-reliability",
  "Locking",
  "hands-java-reliability:3",
  q(
    "Two instance synchronized methods are invoked on the same object. Neither method explicitly locks another object.",
    "Do these methods acquire the same intrinsic monitor? Enter yes or no.",
    "yes",
    "An instance synchronized method acquires the monitor of its receiver object.",
  ),
  q(
    "Two different instances each have a synchronized instance method. Each thread calls a method on a different instance.",
    "Does instance synchronization alone force these calls to share one common monitor? Enter yes or no.",
    "no",
    "Distinct receiver objects have distinct intrinsic monitors; a shared lock would need to be chosen explicitly.",
  ),
);
pair(
  "java-reliability",
  "Executors & futures",
  "hands-java-reliability:3",
  q(
    "An ExecutorService has accepted tasks. The application calls shutdown(), with no shutdownNow call and no task failure assumed.",
    "Does shutdown() by itself wait until all previously submitted tasks have finished? Enter yes or no.",
    "no",
    "shutdown initiates an orderly shutdown. Awaiting termination or waiting for task futures is a separate operation.",
  ),
  q(
    "A Callable submitted to an executor throws IllegalStateException, and the caller observes the task using Future.get(). The future is neither cancelled nor interrupted.",
    "Which checked exception wraps the task failure at get()? Enter its simple class name.",
    ["ExecutionException", "java.util.concurrent.ExecutionException"],
    "Future.get reports a task's exceptional completion through ExecutionException, whose cause is the task failure.",
  ),
);
pair(
  "java-reliability",
  "Concurrent collections",
  "hands-java-reliability:1",
  q(
    "A ConcurrentHashMap is used for safely shared mappings. A developer proposes storing null as a value to mean pending.",
    "Does ConcurrentHashMap permit null values? Enter yes or no.",
    "no",
    "ConcurrentHashMap disallows null keys and values; pending state needs another representation.",
  ),
  q(
    "A shared ConcurrentHashMap uses if (!map.containsKey(k)) map.put(k,v), with other writers operating concurrently.",
    "Does thread safety of the individual calls make this entire two-call sequence atomic? Enter yes or no.",
    "no",
    "A check followed by a put is still a compound operation; use a suitable atomic map operation when the contract requires one.",
  ),
);
pair(
  "java-reliability",
  "Idempotency and concurrent publication",
  "hands-java-reliability:1",
  q(
    "A service has already committed the result for idempotency key K and payload P. Its contract returns that stored result for identical retries without rerunning the charge.",
    "After three identical retries, how many total successful charge executions occurred for K? Include the original execution and enter one integer.",
    "1",
    "The stated deduplication contract reuses the stored result, so retries do not perform another charge.",
  ),
  q(
    "An in-memory idempotency cache is held in one JVM. A second independent application instance has its own empty cache.",
    "Does the first JVM's local cache alone guarantee deduplication across both instances? Enter yes or no.",
    "no",
    "Independent caches do not provide shared coordination or a global uniqueness constraint.",
  ),
);

pair(
  "java-spring",
  "Spring IoC and constructor injection",
  "hands-java-spring-core:0",
  q(
    "A Spring-managed component has exactly one constructor accepting a required repository dependency. Assume Spring Framework 6 and resolvable dependencies.",
    "Is @Autowired required on that sole constructor for constructor injection? Enter yes or no.",
    "no",
    "Spring can select a bean's sole constructor without an explicit @Autowired annotation.",
  ),
  q(
    "Spring-managed component A requires B in its constructor, and B requires A in its constructor. Neither dependency uses a lazy proxy or provider.",
    "Can Spring construct this direct constructor cycle successfully? Enter yes or no.",
    "no",
    "Neither constructor can finish before the other dependency exists; the direct constructor cycle cannot be resolved under the stated conditions.",
  ),
);
pair(
  "java-spring",
  "Spring bean scopes and lifecycle",
  "hands-java-spring-core:1",
  q(
    "The same singleton bean definition is requested twice from one Spring ApplicationContext.",
    "How many instances does that singleton definition normally provide within this context? Enter one integer.",
    "1",
    "Spring singleton scope is per bean definition per container, rather than a universal JVM-wide singleton.",
  ),
  q(
    "A singleton's constructor receives a prototype bean through ordinary eager injection, with no scoped proxy or provider.",
    "Will each later method call on the singleton automatically receive a newly created prototype object? Enter yes or no.",
    "no",
    "The dependency is resolved when the singleton is constructed. Request-time lookup needs an appropriate provider or proxy design.",
  ),
);
pair(
  "java-spring",
  "Spring profiles and bean selection",
  "hands-java-spring-core:3",
  q(
    "Two beans implement Notifier. The injection point must explicitly select the bean qualified as email.",
    "Enter only the Spring annotation name that narrows candidates by a qualifier, optionally with its @ prefix. Do not include arguments.",
    ["Qualifier", "@Qualifier"],
    "@Qualifier narrows candidate beans at the injection point.",
  ),
  q(
    "Two suitable Notifier beans exist for a single-valued injection point. One is marked as the preferred candidate, and no qualifier narrows the selection.",
    "Enter the Spring annotation name that expresses this preference, optionally with its @ prefix.",
    ["Primary", "@Primary"],
    "@Primary gives one candidate preference for a single-valued dependency when other selection constraints do not override it.",
  ),
);
pair(
  "java-spring",
  "Spring MVC and HTTP contracts",
  "hands-java-spring-web:0",
  q(
    "A Spring MVC controller's handler return values should be written to HTTP response bodies by default, rather than interpreted as view names.",
    "Which composed controller annotation combines @Controller and @ResponseBody? Enter its name, optionally with @.",
    ["RestController", "@RestController"],
    "@RestController combines controller discovery with response-body semantics.",
  ),
  q(
    "A Spring MVC endpoint is mapped as /bookings/{id}, and its argument must receive that URI template value.",
    "Which annotation binds this argument from the path variable? Enter only its name, optionally with @.",
    ["PathVariable", "@PathVariable"],
    "@PathVariable binds URI template variables; @RequestParam instead targets request parameters.",
  ),
);
pair(
  "java-spring",
  "Spring transactions and proxy boundaries",
  "hands-java-spring-web:3",
  q(
    "Under Spring's default proxy-based transaction mode, outer() calls this.inner() on the same object. Only inner() is @Transactional, and no transaction is active beforehand.",
    "Does this self-invocation alone activate inner's transactional advice? Enter yes or no.",
    "no",
    "The direct call bypasses the proxy, so that transaction advice is not entered.",
  ),
  q(
    "A correctly intercepted @Transactional method throws an unchecked RuntimeException. No custom rollback rules are configured.",
    "Does Spring's default exception-based rule mark this transaction for rollback? Enter yes or no.",
    "yes",
    "By default, unchecked exceptions and Errors trigger rollback; checked exceptions have different default handling.",
  ),
);
pair(
  "java-spring",
  "Spring Data JPA and repository contracts",
  "hands-java-spring-web:2",
  q(
    "A Spring Data CrudRepository<Customer,Long> is asked to find one customer by ID.",
    "For findById, what wrapper type represents the possibility of absence? Enter the simple type name, without generic parameters.",
    ["Optional", "java.util.Optional"],
    "findById returns Optional<T>, allowing an empty result when the entity is absent.",
  ),
  q(
    "An entity association is marked FetchType.LAZY. The code needs to decide whether this is an unconditional promise that the provider will never fetch eagerly.",
    "Is JPA LAZY fetching a provider hint rather than an unconditional guarantee? Enter yes or no.",
    "yes",
    "JPA defines LAZY as a hint. EAGER has a stronger requirement, so LAZY should not be treated as an absolute no-eager-fetch guarantee.",
  ),
);
pair(
  "java-spring",
  "Spring Security method authorization",
  "hands-java-spring-web:4",
  q(
    "A Spring Security application has enabled method security and must evaluate an authorization expression before invoking a protected method.",
    "Which annotation evaluates that expression before invocation? Enter its name, optionally with @.",
    ["PreAuthorize", "@PreAuthorize"],
    "@PreAuthorize performs expression-based authorization before the method invocation.",
  ),
  q(
    "With Spring Security's default role prefix unchanged, an expression checks hasRole('ADMIN').",
    "Which exact granted-authority string satisfies this role check? Enter the authority only.",
    "ROLE_ADMIN",
    "The default role prefix is ROLE_, so hasRole('ADMIN') checks for ROLE_ADMIN.",
  ),
);

let offset = 0;
export const javaInterview = make(
  "java-interview",
  "java",
  "Java interview theory",
  "Definite-answer interview checks integrated with the Java topic groups.",
  ["Theory", "Automatically checked"],
  topics.flatMap(({ learningGroup, topic, prerequisite, questions }) => {
    const start = offset;
    offset += questions.length;
    return questions.map((question, i) => ({
      ...question,
      type: "written",
      engine: "written",
      learningGroup,
      section: topic,
      topic,
      questionNumber: i + 1,
      title: `${topic} · Theory ${i + 1}/2`,
      task: question.goal,
      requirements: [question.goal],
      prerequisites: [i ? `hands-java-interview:${start}` : prerequisite],
      concept:
        "Assume Java 21 without preview features. For Spring questions, use the assumptions stated in the question. Only the requested answer is checked.",
      hint: "Identify the exact language rule, API contract or named concept. Follow the requested answer format.",
      learn: [topic, "Interview theory", "Precise answers"],
    }));
  }),
);
