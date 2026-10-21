import { make } from "./exercise-factories.js";
function pattern(title, concept, task, interview, sources, tests, hint) {
  const [filename, [starter, solution]] = Object.entries(sources)[0];
  return {
    title,
    concept,
    task,
    interview,
    hint,
    engine: "java",
    type: "workspace",
    filename,
    starter,
    solution,
    editableFiles: Object.fromEntries(
      Object.entries(sources)
        .slice(1)
        .map(([name, pair]) => [name, pair[0]]),
    ),
    solutionFiles: Object.fromEntries(
      Object.entries(sources)
        .slice(1)
        .map(([name, pair]) => [name, pair[1]]),
    ),
    learn: [
      title,
      "Separate contracts from implementations",
      "Behavioural and edge-case tests",
    ],
    verify: `import java.util.*; import java.util.concurrent.*; import java.util.concurrent.atomic.*;
public class Verify {
 static void expect(boolean ok) { if (!ok) throw new AssertionError("Pattern contract failed"); }
 static void rejects(Runnable r) { try { r.run(); } catch (IllegalArgumentException e) { return; } throw new AssertionError("Expected IllegalArgumentException"); }
 public static void main(String[] args) throws Exception { ${tests} System.out.println("DEVLAB_TESTS_PASSED"); }
}`,
  };
}
const fixed = (source) => {
  const stubs = {
    StandardShipping:
      'public class StandardShipping implements ShippingPolicy {\n  public long cost(int grams) {\n    throw new UnsupportedOperationException("TODO");\n  }\n}\n',
    ExpressShipping:
      'public class ExpressShipping implements ShippingPolicy {\n  public long cost(int grams) {\n    throw new UnsupportedOperationException("TODO");\n  }\n}\n',
    ReportClient:
      'public class ReportClient {\n  public ReportRequest weekly(String service) {\n    throw new UnsupportedOperationException("TODO");\n  }\n}\n',
  };
  const name = source.match(/public class (\w+)/)?.[1];
  return [stubs[name] || source, source];
};
export const patternCourses = [
  make(
    "java-architecture",
    "java",
    "Design patterns in production",
    "Build multi-file components, test their contracts, and explain interview tradeoffs.",
    [
      "Singleton",
      "Observer",
      "Strategy",
      "Factory",
      "Adapter",
      "Decorator",
      "Command",
      "Builder",
    ],
    [
      pattern(
        "Singleton: one configuration registry",
        "A holder-class singleton initializes lazily with JVM class-initialization safety. Global mutable state complicates tests; dependency injection is usually easier to substitute. A singleton is one instance per class loader, not a distributed lock.",
        "Implement ConfigRegistry.getInstance() and environment(). The instance must be lazy, identical for every caller, safe during concurrent first access, and environment() returns production. Keep construction private. Do not expose mutable global settings. RegistryClient.environment() delegates to the registry. Use both files.",
        "Explain holder initialization versus double-checked locking (volatile), enum singletons, class loaders, and why singleton state can harm test isolation. Could an injected immutable configuration object be simpler?",
        {
          "ConfigRegistry.java": [
            'public final class ConfigRegistry {\n  private ConfigRegistry() {\n  }\n  public static ConfigRegistry getInstance() {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public String environment() {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            'public final class ConfigRegistry {\n  private ConfigRegistry() {\n  }\n  private static class Holder {\n    static final ConfigRegistry INSTANCE = new ConfigRegistry();\n  }\n  public static ConfigRegistry getInstance() {\n    return Holder.INSTANCE;\n  }\n  public String environment() {\n    return "production";\n  }\n}\n',
          ],
          "RegistryClient.java": [
            'public class RegistryClient {\n  public String environment() {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            "public class RegistryClient {\n  public String environment() {\n    return ConfigRegistry.getInstance().environment();\n  }\n}\n",
          ],
        },
        `ExecutorService pool=Executors.newFixedThreadPool(8); try { List<Future<ConfigRegistry>> tasks=new ArrayList<>(); for(int i=0;i<40;i++) tasks.add(pool.submit(ConfigRegistry::getInstance)); ConfigRegistry first=tasks.get(0).get(); expect(first!=null); for(var f:tasks) expect(first==f.get()); } finally { pool.shutdownNow(); } expect(new RegistryClient().environment().equals("production")); for(var c:ConfigRegistry.class.getDeclaredConstructors()) expect(java.lang.reflect.Modifier.isPrivate(c.getModifiers()));`,
        "Use a private static holder class; initialization is managed by the JVM.",
      ),
      pattern(
        "Strategy: replace shipping policies",
        "Strategy moves a varying algorithm behind a contract. The checkout depends on ShippingPolicy, so a new policy does not require editing the checkout. Avoid forcing every simple calculation into a class.",
        "ShippingPolicy.cost(int grams) returns long cents. StandardShipping charges 500 + 100 per started 1000 grams; ExpressShipping charges twice that amount. Zero grams costs 500 or 1000 respectively; negative weights throw IllegalArgumentException. Checkout.total adds nonnegative item cents and policy cost, rejecting null policy. Avoid int overflow for large weights.",
        "Contrast Strategy with a switch and Template Method. How would constructor injection make policies testable, and where should validation live?",
        {
          "Checkout.java": [
            'public class Checkout {\n  public long total(long items, int grams, ShippingPolicy policy) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            "public class Checkout {\n  public long total(long items, int grams, ShippingPolicy policy) {\n    if(items<0 || policy==null) throw new IllegalArgumentException();\n    return Math.addExact(items,policy.cost(grams));\n  }\n}\n",
          ],
          "ShippingPolicy.java": fixed(
            "public interface ShippingPolicy {\n  long cost(int grams);\n}\n",
          ),
          "StandardShipping.java": [
            'public class StandardShipping implements ShippingPolicy {\n  public long cost(int grams) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            "public class StandardShipping implements ShippingPolicy {\n  public long cost(int grams) {\n    if(grams<0) throw new IllegalArgumentException();\n    return 500+100*((grams+999L)/1000);\n  }\n}\n",
          ],
          "ExpressShipping.java": [
            'public class ExpressShipping implements ShippingPolicy {\n  public long cost(int grams) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            "public class ExpressShipping implements ShippingPolicy {\n  public long cost(int grams) {\n    return 2*new StandardShipping().cost(grams);\n  }\n}\n",
          ],
        },
        "Checkout c=new Checkout(); expect(c.total(100,0,new StandardShipping())==600); expect(c.total(100,1001,new StandardShipping())==800); expect(c.total(100,1001,new ExpressShipping())==1500); expect(c.total(0,Integer.MAX_VALUE,new StandardShipping())==214748900L); expect(c.total(50,1,g->7)==57); rejects(()->c.total(-1,1,new StandardShipping())); rejects(()->c.total(1,-1,new ExpressShipping())); rejects(()->c.total(1,1,null));",
        "Compute ceiling division with long arithmetic. Test checkout with a lambda policy.",
      ),
      pattern(
        "Factory: select a policy at the boundary",
        "A factory centralizes construction and keeps configuration parsing away from business logic. This exercise reuses the previous shipping contract through method stubs; reuse your own earlier implementations. A simple factory differs from the GoF Factory Method, where subclasses override creation.",
        "Implement ShippingFactory.create(String name). Trim whitespace, accept standard or express case-insensitively using Locale.ROOT, return the appropriate ShippingPolicy, and reject null, blank or unknown names with IllegalArgumentException. Do not silently use a cheaper policy for invalid configuration.",
        "Explain Simple Factory, Factory Method and Abstract Factory. When would a provider registry or dependency injection container be preferable?",
        {
          "ShippingFactory.java": [
            'public class ShippingFactory {\n  public static ShippingPolicy create(String name) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            'public class ShippingFactory {\n  public static ShippingPolicy create(String name) {\n    if(name==null) throw new IllegalArgumentException();\n    return switch(name.trim().toLowerCase(java.util.Locale.ROOT)) {\n      case "standard" -> new StandardShipping();\n      case "express" -> new ExpressShipping();\n      default -> throw new IllegalArgumentException();\n    }\n    ;\n  }\n}\n',
          ],
          "ShippingPolicy.java": fixed(
            "public interface ShippingPolicy {\n  long cost(int grams);\n}\n",
          ),
          "StandardShipping.java": fixed(
            "public class StandardShipping implements ShippingPolicy {\n  public long cost(int grams) {\n    if(grams<0) throw new IllegalArgumentException();\n    return 500+100*((grams+999L)/1000);\n  }\n}\n",
          ),
          "ExpressShipping.java": fixed(
            "public class ExpressShipping implements ShippingPolicy {\n  public long cost(int grams) {\n    return 2*new StandardShipping().cost(grams);\n  }\n}\n",
          ),
        },
        'java.util.Locale old=java.util.Locale.getDefault(); try { java.util.Locale.setDefault(java.util.Locale.forLanguageTag("tr-TR")); expect(ShippingFactory.create(" STANDARD ").cost(1001)==700); expect(ShippingFactory.create("ExPrEsS").cost(1)==1200); } finally { java.util.Locale.setDefault(old); } rejects(()->ShippingFactory.create(null)); rejects(()->ShippingFactory.create("")); rejects(()->ShippingFactory.create("overnight"));',
        "Reuse your own shipping policies from the previous exercise; keep parsing in the factory.",
      ),
      pattern(
        "Observer: reliable in-process notifications",
        "Observer decouples an event publisher from listeners. Iterate over a snapshot so listeners can unsubscribe during notification. Local delivery is not durable messaging; a crash can lose events. This contract is single-threaded and isolates subscriber RuntimeExceptions.",
        "Implement OrderEvents.subscribe, unsubscribe and publish. Reject null listeners and null/blank events; prevent duplicate subscriptions by equality, retain insertion order, and notify a snapshot of listeners exactly once per publish. A listener may unsubscribe itself; its failure must not prevent other listeners running. Unsubscribing an absent listener is harmless. No external queue is needed.",
        "Discuss Observer versus pub/sub, memory leaks from forgotten subscriptions, thread safety, backpressure, error reporting and when an outbox plus message broker is needed. This lab swallows subscriber RuntimeExceptions only; production should record them.",
        {
          "OrderEvents.java": [
            'public class OrderEvents {\n  public void subscribe(OrderListener l) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public void unsubscribe(OrderListener l) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public void publish(String event) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            "public class OrderEvents {\n  private final java.util.Set<OrderListener> listeners=new java.util.LinkedHashSet<>();\n  public void subscribe(OrderListener l) {\n    if(l==null) throw new IllegalArgumentException();\n    listeners.add(l);\n  }\n  public void unsubscribe(OrderListener l) {\n    listeners.remove(l);\n  }\n  public void publish(String event) {\n    if(event==null || event.isBlank()) throw new IllegalArgumentException();\n    for(OrderListener l:new java.util.ArrayList<>(listeners)) {\n      try {\n        l.onEvent(event);\n      }\n      catch(RuntimeException e) {\n        /* Isolate subscriber failure per exercise contract. */\n      }\n    }\n  }\n}\n",
          ],
          "OrderListener.java": fixed(
            "public interface OrderListener {\n  void onEvent(String event);\n}\n",
          ),
        },
        'OrderEvents bus=new OrderEvents(); List<String> seen=new ArrayList<>(); OrderListener a=e->seen.add("a:"+e); bus.subscribe(a); bus.subscribe(a); bus.subscribe(e->{throw new IllegalStateException();}); OrderListener[] self=new OrderListener[1]; self[0]=e->{seen.add("self");bus.unsubscribe(self[0]);}; bus.subscribe(self[0]); bus.subscribe(e->seen.add("b:"+e)); bus.publish("paid"); expect(seen.equals(List.of("a:paid","self","b:paid"))); seen.clear(); bus.publish("sent"); expect(seen.equals(List.of("a:sent","b:sent"))); bus.unsubscribe(a); bus.unsubscribe(a); rejects(()->bus.subscribe(null)); rejects(()->bus.publish(" ")); rejects(()->bus.publish(null));',
        "Use LinkedHashSet for duplicate prevention and a copied list for delivery.",
      ),
      pattern(
        "Adapter: bridge a legacy payment gateway",
        "Adapter translates an existing API into the contract your application needs. Use integer minor units and exact decimal conversion; never convert money through double. Inject the gateway so tests can observe the translated request.",
        "PaymentPort.pay(long cents) returns a receipt string. Implement LegacyPaymentAdapter(LegacyGateway gateway): reject null gateway and negative cents, convert cents to an exact two-decimal String without grouping or locale-specific separators, and return gateway.charge result unchanged. The gateway accepts decimal currency strings. Test zero and large values.",
        "How does Adapter differ from Facade and Decorator? Where should retries, idempotency and currency validation live when adapting a real payment API?",
        {
          "LegacyPaymentAdapter.java": [
            'public class LegacyPaymentAdapter implements PaymentPort {\n  public LegacyPaymentAdapter(LegacyGateway gateway) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public String pay(long cents) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            "public class LegacyPaymentAdapter implements PaymentPort {\n  private final LegacyGateway gateway;\n  public LegacyPaymentAdapter(LegacyGateway gateway) {\n    if(gateway==null) throw new IllegalArgumentException();\n    this.gateway=gateway;\n  }\n  public String pay(long cents) {\n    if(cents<0) throw new IllegalArgumentException();\n    return gateway.charge(java.math.BigDecimal.valueOf(cents,2).toPlainString());\n  }\n}\n",
          ],
          "PaymentPort.java": fixed(
            "public interface PaymentPort {\n  String pay(long cents);\n}\n",
          ),
          "LegacyGateway.java": fixed(
            "public interface LegacyGateway {\n  String charge(String decimalAmount);\n}\n",
          ),
        },
        'List<String> charged=new ArrayList<>(); PaymentPort p=new LegacyPaymentAdapter(v->{charged.add(v);return "receipt:"+v;}); expect(p.pay(105).equals("receipt:1.05")); p.pay(0); p.pay(Long.MAX_VALUE); expect(charged.equals(List.of("1.05","0.00","92233720368547758.07"))); rejects(()->p.pay(-1)); rejects(()->new LegacyPaymentAdapter(null));',
        "BigDecimal.valueOf(cents, 2).toPlainString() preserves exact minor units.",
      ),
      pattern(
        "Decorator: add payment auditing",
        "Decorator preserves a contract while adding behavior around an injected delegate. Reuse PaymentPort. Record success only after payment succeeds, and propagate failures unchanged. Audit failures can create an ambiguous paid-but-not-recorded result; production needs a durable transaction/outbox design.",
        "Implement AuditedPayment(PaymentPort delegate, java.util.function.Consumer<String> audit). Reject null dependencies. pay(cents) delegates once, emits paid:<receipt> once after success, then returns the receipt. On delegate failure propagate the same exception and emit nothing. The decorator should compose with another AuditedPayment.",
        "Compare Decorator with inheritance, proxies and interceptors. What happens if audit storage fails after an external charge? Why is a retry unsafe without idempotency?",
        {
          "AuditedPayment.java": [
            'public class AuditedPayment implements PaymentPort {\n  public AuditedPayment(PaymentPort delegate, java.util.function.Consumer<String> audit) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public String pay(long cents) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            'public class AuditedPayment implements PaymentPort {\n  private final PaymentPort delegate;\n  private final java.util.function.Consumer<String> audit;\n  public AuditedPayment(PaymentPort delegate, java.util.function.Consumer<String> audit) {\n    if(delegate==null || audit==null) throw new IllegalArgumentException();\n    this.delegate=delegate;\n    this.audit=audit;\n  }\n  public String pay(long cents) {\n    String receipt=delegate.pay(cents);\n    audit.accept("paid:"+receipt);\n    return receipt;\n  }\n}\n',
          ],
          "PaymentPort.java": fixed(
            "public interface PaymentPort {\n  String pay(long cents);\n}\n",
          ),
        },
        'AtomicInteger calls=new AtomicInteger(); List<String> log=new ArrayList<>(); PaymentPort p=new AuditedPayment(new AuditedPayment(c->{calls.incrementAndGet();return "R1";},log::add),log::add); expect(p.pay(50).equals("R1")); expect(calls.get()==1 && log.equals(List.of("paid:R1","paid:R1"))); RuntimeException boom=new IllegalStateException("declined"); log.clear(); try { new AuditedPayment(c->{throw boom;},log::add).pay(5); throw new AssertionError(); } catch(RuntimeException e) { expect(e==boom); } expect(log.isEmpty()); rejects(()->new AuditedPayment(null,log::add)); rejects(()->new AuditedPayment(c->"x",null));',
        "Store the interface delegate and wrap its call; do not reimplement the gateway.",
      ),
      pattern(
        "Command: reversible stock reservation",
        "Command encapsulates an operation and its state. Undo must apply only after a successful execution. This single-threaded in-memory example models UI undo, not durable business compensation across services.",
        "Implement Stock(int initial), available(), reserve(int quantity), release(int quantity), and ReserveCommand(Stock,int). Reject negative initial stock and nonpositive quantities. reserve throws IllegalStateException for insufficient stock without mutation; release uses Math.addExact. Command execute reserves once and rejects repeated execute while active. undo releases once and rejects undo before success or a second undo. After undo, execute is allowed again. Reject null stock. A failed execute must not make undo legal.",
        "Contrast undo with compensating transactions and event sourcing. Why does restoring a snapshot risk overwriting concurrent changes? How would you persist command identity and make retries safe?",
        {
          "ReserveCommand.java": [
            'public class ReserveCommand {\n  public ReserveCommand(Stock stock,int quantity) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public void execute() {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public void undo() {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            "public class ReserveCommand {\n  private final Stock stock;\n  private final int quantity;\n  private boolean active;\n  public ReserveCommand(Stock stock,int quantity) {\n    if(stock==null || quantity<=0) throw new IllegalArgumentException();\n    this.stock=stock;\n    this.quantity=quantity;\n  }\n  public void execute() {\n    if(active) throw new IllegalStateException();\n    stock.reserve(quantity);\n    active=true;\n  }\n  public void undo() {\n    if(!active) throw new IllegalStateException();\n    stock.release(quantity);\n    active=false;\n  }\n}\n",
          ],
          "Stock.java": [
            'public class Stock {\n  public Stock(int initial) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public int available() {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public void reserve(int quantity) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public void release(int quantity) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
            "public class Stock {\n  private int available;\n  public Stock(int initial) {\n    if(initial<0) throw new IllegalArgumentException();\n    available=initial;\n  }\n  public int available() {\n    return available;\n  }\n  public void reserve(int quantity) {\n    if(quantity<=0) throw new IllegalArgumentException();\n    if(quantity>available) throw new IllegalStateException();\n    available-=quantity;\n  }\n  public void release(int quantity) {\n    if(quantity<=0) throw new IllegalArgumentException();\n    available=Math.addExact(available,quantity);\n  }\n}\n",
          ],
        },
        "Stock s=new Stock(5);ReserveCommand c=new ReserveCommand(s,3);try{c.undo();throw new AssertionError();}catch(IllegalStateException e){} c.execute();expect(s.available()==2);try{c.execute();throw new AssertionError();}catch(IllegalStateException e){}expect(s.available()==2);c.undo();expect(s.available()==5);try{c.undo();throw new AssertionError();}catch(IllegalStateException e){}c.execute();expect(s.available()==2);ReserveCommand bad=new ReserveCommand(s,9);try{bad.execute();throw new AssertionError();}catch(IllegalStateException e){}try{bad.undo();throw new AssertionError();}catch(IllegalStateException e){}expect(s.available()==2);rejects(()->new Stock(-1));rejects(()->new ReserveCommand(s,0));rejects(()->new ReserveCommand(null,1));rejects(()->s.release(0));",
        "Only change command state after the stock mutation succeeds.",
      ),
      pattern(
        "Builder: immutable report requests",
        "Builder makes validated construction readable when a type has several optional values. Copy mutable collections on build; a built request must not change when a caller edits the builder. A simple record constructor is preferable for small types.",
        "Implement ReportRequest.builder(), nested Builder.service(String), days(int), tag(String), build(), plus request service(), days(), tags(). Default days is 7. service must be nonblank and trimmed; days must be 1..30; tags must be nonblank, trimmed, unique and in insertion order. Invalid values throw IllegalArgumentException by build time (earlier is allowed). Built requests and their tag lists are immutable snapshots; reusing the builder must not alter previous requests.",
        "Compare Builder with telescoping constructors, records, named factories and staged builders. Which invariants belong at construction, and when does a builder add unnecessary complexity?",
        {
          "ReportRequest.java": [
            'public final class ReportRequest {\n  public static Builder builder() {\n    return new Builder();\n  }\n  public String service() {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public int days() {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public java.util.List<String> tags() {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public static class Builder {\n    public Builder service(String value) {\n      throw new UnsupportedOperationException("Implement this task");\n    }\n    public Builder days(int value) {\n      throw new UnsupportedOperationException("Implement this task");\n    }\n    public Builder tag(String value) {\n      throw new UnsupportedOperationException("Implement this task");\n    }\n    public ReportRequest build() {\n      throw new UnsupportedOperationException("Implement this task");\n    }\n  }\n}\n',
            "public final class ReportRequest {\n  private final String service;\n  private final int days;\n  private final java.util.List<String> tags;\n  private ReportRequest(Builder b) {\n    service=b.service;\n    days=b.days;\n    tags=java.util.List.copyOf(b.tags);\n  }\n  public static Builder builder() {\n    return new Builder();\n  }\n  public String service() {\n    return service;\n  }\n  public int days() {\n    return days;\n  }\n  public java.util.List<String> tags() {\n    return tags;\n  }\n  public static class Builder {\n    private String service;\n    private int days=7;\n    private final java.util.Set<String> tags=new java.util.LinkedHashSet<>();\n    private String valid(String value) {\n      if(value==null || value.isBlank())throw new IllegalArgumentException();\n      return value.trim();\n    }\n    public Builder service(String value) {\n      service=valid(value);\n      return this;\n    }\n    public Builder days(int value) {\n      if(value<1 || value>30)throw new IllegalArgumentException();\n      days=value;\n      return this;\n    }\n    public Builder tag(String value) {\n      tags.add(valid(value));\n      return this;\n    }\n    public ReportRequest build() {\n      if(service==null)throw new IllegalArgumentException();\n      return new ReportRequest(this);\n    }\n  }\n}\n",
          ],
          "ReportClient.java": fixed(
            'public class ReportClient {\n  public ReportRequest weekly(String service) {\n    return ReportRequest.builder().service(service).tag("operations").build();\n  }\n}\n',
          ),
        },
        'var b=ReportRequest.builder().service(" api ").tag(" urgent ").tag("urgent");var first=b.build();expect(first.service().equals("api")&&first.days()==7&&first.tags().equals(List.of("urgent")));b.tag("audit").days(30);expect(first.days()==7&&first.tags().size()==1);expect(b.build().tags().equals(List.of("urgent","audit")));try{first.tags().add("x");throw new AssertionError();}catch(UnsupportedOperationException e){}expect(new ReportClient().weekly("worker").tags().equals(List.of("operations")));rejects(()->ReportRequest.builder().build());rejects(()->ReportRequest.builder().service(" ").build());rejects(()->ReportRequest.builder().service("x").days(0).build());rejects(()->ReportRequest.builder().service("x").days(31).build());rejects(()->ReportRequest.builder().service("x").tag(null).build());',
        "Validate construction, use final request fields, and List.copyOf when building.",
      ),
    ],
  ),
];
// Compose earlier contracts in a realistic application boundary.
const lessons = patternCourses[0].lessons;
const byTitle = (prefix) => lessons.find((l) => l.title.startsWith(prefix));
const workingFiles = (lesson) =>
  Object.fromEntries(
    Object.entries({
      [lesson.filename]: lesson.solution,
      ...lesson.solutionFiles,
    }).map(([name, solution]) => [
      name,
      [
        name === lesson.filename ? lesson.starter : lesson.editableFiles[name],
        solution,
      ],
    ]),
  );
const fixtures = {
  ...workingFiles(byTitle("Observer:")),
  ...workingFiles(byTitle("Adapter:")),
  ...workingFiles(byTitle("Strategy:")),
};
lessons.push(
  pattern(
    "Architecture capstone: idempotent order checkout",
    "Compose Strategy (shipping), Adapter (legacy payments) and Observer (order notifications) through small contracts. This process-local cache demonstrates idempotency but does not survive restart. Durable cross-service guarantees require database uniqueness, payment-provider idempotency and an outbox.",
    "Implement OrderService(PaymentPort, ShippingPolicy, OrderEvents) and place(String requestId, long itemCents, int grams). Reject null dependencies; reject null/blank IDs, negative items and negative weights before charging. Normalize IDs with trim and Locale.ROOT uppercase. Use Checkout.total to calculate the charge. On the first successful request, call PaymentPort once, cache its receipt with the original item/weight inputs, publish paid:<NORMALIZED_ID> once, and return the receipt. Repeating the same normalized ID and identical inputs returns the cached receipt without charging or notifying again. Reusing an ID with different inputs throws IllegalArgumentException. A payment failure is propagated and must not be cached or published; retry can succeed. Calls are single-threaded. Only signatures and interfaces are supplied in separate tabs; reuse your own earlier implementations.",
    "Identify the responsibilities and dependency directions. Why inject PaymentPort rather than instantiate LegacyPaymentAdapter inside the service? What if payment succeeds and the process crashes before caching? Explain persistent idempotency records, transactional outbox, concurrent duplicate requests and why a Singleton cannot solve distributed consistency.",
    {
      "OrderService.java": [
        'public class OrderService {\n  public OrderService(PaymentPort payment, ShippingPolicy shipping, OrderEvents events) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n  public String place(String requestId,long itemCents,int grams) {\n    throw new UnsupportedOperationException("Implement this task");\n  }\n}\n',
        'public class OrderService {\n  private final PaymentPort payment;\n  private final ShippingPolicy shipping;\n  private final OrderEvents events;\n  private record Result(long items,int grams,String receipt) {\n  }\n  private final java.util.Map<String,Result> completed=new java.util.HashMap<>();\n  public OrderService(PaymentPort payment,ShippingPolicy shipping,OrderEvents events) {\n    if(payment==null || shipping==null || events==null) throw new IllegalArgumentException();\n    this.payment=payment;\n    this.shipping=shipping;\n    this.events=events;\n  }\n  public String place(String requestId,long itemCents,int grams) {\n    if(requestId==null || requestId.isBlank() || itemCents<0 || grams<0) throw new IllegalArgumentException();\n    String id=requestId.trim().toUpperCase(java.util.Locale.ROOT);\n    Result old=completed.get(id);\n    if(old!=null) {\n      if(old.items()!=itemCents || old.grams()!=grams)throw new IllegalArgumentException();\n      return old.receipt();\n    }\n    long total=new Checkout().total(itemCents,grams,shipping);\n    String receipt=payment.pay(total);\n    completed.put(id,new Result(itemCents,grams,receipt));\n    events.publish("paid:"+id);\n    return receipt;\n  }\n}\n',
      ],
      ...fixtures,
    },
    'List<String> amounts=new ArrayList<>(), notifications=new ArrayList<>();OrderEvents bus=new OrderEvents();bus.subscribe(notifications::add);AtomicInteger calls=new AtomicInteger();PaymentPort payment=new LegacyPaymentAdapter(amount->{calls.incrementAndGet();amounts.add(amount);if(amount.equals("9.01") && calls.get()==2)throw new IllegalStateException("temporary");return "R"+calls.get();});OrderService service=new OrderService(payment,new StandardShipping(),bus);expect(service.place(" a ",100,1001).equals("R1"));expect(service.place("A",100,1001).equals("R1"));expect(amounts.equals(List.of("8.00")) && notifications.equals(List.of("paid:A")));rejects(()->service.place("a",101,1001));rejects(()->service.place("a",100,1000));try{service.place("retry",301,1);throw new AssertionError();}catch(IllegalStateException e){}expect(notifications.size()==1);expect(service.place("retry",301,1).equals("R3"));expect(service.place("RETRY",301,1).equals("R3"));expect(calls.get()==3 && notifications.equals(List.of("paid:A","paid:RETRY")));rejects(()->service.place(null,1,1));rejects(()->service.place(" ",1,1));rejects(()->service.place("bad",-1,1));rejects(()->service.place("bad",1,-1));rejects(()->new OrderService(null,new StandardShipping(),bus));expect(calls.get()==3);OrderService injected=new OrderService(c->{expect(c==12);return "injected";},g->2,new OrderEvents());expect(injected.place("x",10,0).equals("injected"));',
    "Validate first, look up the normalized request ID, then charge; cache only after success and publish after caching. Store the original request parameters to detect mismatched retries.",
  ),
);
lessons.at(-1).reuseNote =
  "Reuse your own shipping, payment adapter and observer implementations from earlier exercises. The starter tabs contain only their contracts and method stubs.";
patternCourses[0].stage = 6;
patternCourses[0].lessons[0].prerequisites = ["hands-java-capstone:3"];
for (let i = 1; i < patternCourses[0].lessons.length; i++)
  patternCourses[0].lessons[i].prerequisites = [
    "hands-java-architecture:" + (i - 1),
  ];
