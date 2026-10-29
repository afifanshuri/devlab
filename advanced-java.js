import { scenarioFor } from "./advanced-java-scenarios.js";
const q = (title, signature, body, tests, goal, mission, example) => ({
  title,
  signature,
  body,
  tests,
  goal,
  mission,
  example,
});
const topic = (base, name, ...questions) => ({ base, name, questions });
export const javaTopics = [
  topic(
    "hands-java-oop-basics:0",
    "Classes, objects and independent state",
    q(
      "Rename a batch atomically",
      "public static void renameAll(List<Customer> customers, List<String> names)",
      `if(customers==null||names==null||customers.size()!=names.size())throw new IllegalArgumentException();for(int i=0;i<names.size();i++)if(customers.get(i)==null||names.get(i)==null||names.get(i).isBlank())throw new IllegalArgumentException();for(int i=0;i<names.size();i++)customers.get(i).rename(names.get(i));`,
      `Customer a=new Customer("A"),b=new Customer("B");try{Challenge.renameAll(List.of(a,b),Arrays.asList("X"," "));throw new AssertionError();}catch(IllegalArgumentException e){}expect(a.name().equals("A")&&b.name().equals("B"));Challenge.renameAll(List.of(a,b),List.of(" X ","Y"));expect(a.name().equals("X")&&b.name().equals("Y"));`,
      "Implement renameAll: equal-sized nonnull lists, nonnull customers and nonblank names. Validate every item before renaming any customer; trim names. Reject invalid batches with IllegalArgumentException.",
      "A support agent fixes several customer records in one action. One bad row must not leave half the customers renamed.",
      "[A,B] + [X,blank] → reject; names remain A,B",
    ),
    q(
      "Detach a customer export",
      "public static List<Customer> detached(List<Customer> input)",
      `if(input==null||input.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<Customer> out=new ArrayList<>();for(Customer c:input)out.add(new Customer(c.name()));return List.copyOf(out);`,
      `Customer a=new Customer("A");List<Customer> out=Challenge.detached(List.of(a));a.rename("B");expect(out.get(0).name().equals("A"));out.get(0).rename("C");expect(a.name().equals("B"));expect(Challenge.detached(List.of()).isEmpty());`,
      "Implement detached: return an unmodifiable list of new Customer objects with the same names. Neither list structure nor customer objects may alias the input; null input/items are invalid.",
      "A reporting team needs its own customer snapshot. Corrections in reporting must never modify the live register.",
      "Rename an exported customer → live customer unchanged",
    ),
  ),
  topic(
    "hands-java-architecture:0",
    "Singleton",
    q(
      "Publish one registry under contention",
      "public static boolean shared(int calls)",
      `if(calls<1||calls>1000)throw new IllegalArgumentException();Set<ConfigRegistry> seen=ConcurrentHashMap.newKeySet();java.util.stream.IntStream.range(0,calls).parallel().forEach(i->seen.add(ConfigRegistry.getInstance()));return seen.size()==1;`,
      `expect(Challenge.shared(200));expect(Challenge.shared(1));rejects(()->Challenge.shared(0));`,
      "Implement shared(calls): obtain the registry from calls parallel stream operations, returning true only if every call observes one identity. Accept 1..1000 calls. Keep ConfigRegistry lazy and thread-safe.",
      "A service starts many workers together. Configuration must be safely published once, rather than creating a registry per worker.",
      "shared(200) → true",
    ),
    q(
      "Keep tenant configuration out of global state",
      "public static Map<String,String> environments(List<String> tenants, Function<String,String> load)",
      `if(tenants==null||load==null||tenants.stream().anyMatch(t->t==null||t.isBlank()))throw new IllegalArgumentException();Map<String,String> out=new LinkedHashMap<>();for(String t:tenants){String key=t.trim();if(!out.containsKey(key))out.put(key,Objects.requireNonNull(load.apply(key)));}return Collections.unmodifiableMap(out);`,
      `AtomicInteger n=new AtomicInteger();Map<String,String> a=Challenge.environments(List.of(" a ","b","a"),k->{n.incrementAndGet();return k+"-prod";});expect(n.get()==2&&a.get("a").equals("a-prod"));expect(Challenge.environments(List.of("a"),k->"demo").get("a").equals("demo"));`,
      "Implement environments: trim nonblank tenant IDs, load once per unique tenant in first-seen order, and return an unmodifiable map. Calls must not share tenant values. Reject null lists/loaders/items and blank IDs; null loader results throw NullPointerException.",
      "A shared service handles several tenants. Produce a separate deployment map for each request, loading each unique tenant once without leaking earlier values into a new request.",
      "[a,b,a] → loader invoked twice; a later call loads afresh",
    ),
  ),
  topic(
    "hands-java-architecture:1",
    "Strategy",
    q(
      "Pick the cheapest valid quote",
      "public static long cheapest(long items,int grams,List<ShippingPolicy> policies)",
      `if(items<0||grams<0||policies==null||policies.isEmpty()||policies.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();long best=Long.MAX_VALUE;for(ShippingPolicy p:policies){long cost=p.cost(grams);if(cost<0)throw new IllegalArgumentException();best=Math.min(best,Math.addExact(items,cost));}return best;`,
      `expect(Challenge.cheapest(1000,500,List.of(g->900,g->300))==1300);rejects(()->Challenge.cheapest(1,1,List.of(g->-1)));rejects(()->Challenge.cheapest(0,0,List.of()));`,
      "Implement cheapest: evaluate each policy exactly once, reject negative inputs/costs and empty/null policies, return the smallest items+cost using checked long arithmetic; propagate policy failures.",
      "Dispatch compares courier strategies for one basket. A broken quote must not silently turn into free shipping.",
      "items=1000, fees=[900,300] → 1300",
    ),
    q(
      "Allocate mixed baskets",
      "public static long basket(long[] cents,int[] grams,ShippingPolicy policy)",
      `if(cents==null||grams==null||policy==null||cents.length!=grams.length)throw new IllegalArgumentException();for(int i=0;i<cents.length;i++)if(cents[i]<0||grams[i]<0)throw new IllegalArgumentException();long total=0;for(int i=0;i<cents.length;i++)total=Math.addExact(total,cheapest(cents[i],grams[i],List.of(policy)));return total;`,
      `AtomicInteger n=new AtomicInteger();expect(Challenge.basket(new long[]{100,200},new int[]{1,2},g->{n.incrementAndGet();return g*10;})==330&&n.get()==2);rejects(()->Challenge.basket(new long[]{1,-1},new int[]{1,2},g->{throw new AssertionError();}));`,
      "Implement basket: validate the whole input before invoking the strategy; sum each parcel's item cost and strategy quote with overflow checks. Empty baskets total zero. Reuse cheapest and do not mutate arrays.",
      "A marketplace groups parcels into a dispatch batch. Invalid parcel data must be caught before contacting any courier strategy.",
      "items=[100,200], grams=[1,2], fee=g*10 → 330",
    ),
  ),
  topic(
    "hands-java-architecture:3",
    "Observer",
    q(
      "Subscribe only for one delivery",
      "public static void once(OrderEvents events,Consumer<String> receive,String event)",
      `if(events==null||receive==null||event==null||event.isBlank())throw new IllegalArgumentException();OrderListener l=receive::accept;events.subscribe(l);try{events.publish(event);}finally{events.unsubscribe(l);}`,
      `OrderEvents e=new OrderEvents();List<String> got=new ArrayList<>();Challenge.once(e,got::add,"first");e.publish("second");expect(got.equals(List.of("first")));`,
      "Implement once: subscribe a temporary listener, publish one valid event, then unsubscribe in finally. Reject null events/callbacks and blank event text; do not remove existing subscribers.",
      "An order confirmation needs a temporary observer. Leaving it subscribed would notify the same customer about future orders.",
      "once(first), then publish(second) → temporary listener receives first only",
    ),
    q(
      "Batch notifications without invalid partial delivery",
      "public static void publishBatch(OrderEvents events,List<String> batch)",
      `if(events==null||batch==null||batch.stream().anyMatch(e->e==null||e.isBlank()))throw new IllegalArgumentException();for(String e:List.copyOf(batch))events.publish(e);`,
      `OrderEvents e=new OrderEvents();List<String> got=new ArrayList<>();e.subscribe(got::add);rejects(()->Challenge.publishBatch(e,List.of("a"," ")));expect(got.isEmpty());Challenge.publishBatch(e,List.of("a","b"));expect(got.equals(List.of("a","b")));`,
      "Implement publishBatch: validate all messages before delivery, then publish a snapshot in input order. Preserve OrderEvents' subscriber failure isolation and membership semantics.",
      "A reconciliation job emits a set of order events. A malformed record must not cause half the batch to be published.",
      "[a,blank] → no notifications; [a,b] → ordered delivery",
    ),
  ),
  topic(
    "hands-java-architecture:2",
    "Factory",
    q(
      "Resolve an extensible provider registry",
      "public static ShippingPolicy resolve(String name,Map<String,Supplier<ShippingPolicy>> providers)",
      `if(name==null||name.isBlank()||providers==null)throw new IllegalArgumentException();Supplier<ShippingPolicy> p=providers.get(name.trim().toLowerCase(Locale.ROOT));if(p==null)throw new IllegalArgumentException();return Objects.requireNonNull(p.get());`,
      `AtomicInteger n=new AtomicInteger();Map<String,Supplier<ShippingPolicy>> p=Map.of("bike",()->{n.incrementAndGet();return g->42;});expect(Challenge.resolve(" BIKE ",p).cost(1)==42&&n.get()==1);rejects(()->Challenge.resolve("missing",p));`,
      "Implement resolve: normalize a provider name with Locale.ROOT, invoke only that registered supplier, reject missing/blank names or null registries, and reject null supplier results. New providers must not require editing resolve.",
      "A bike courier launches tomorrow. The factory should select a registered provider without adding another hard-coded branch.",
      "resolve(' BIKE ', registry) → bike policy",
    ),
    q(
      "Validate a deployment's providers before construction",
      "public static List<ShippingPolicy> deployment(List<String> names,Map<String,Supplier<ShippingPolicy>> providers)",
      `if(names==null||providers==null)throw new IllegalArgumentException();for(String n:names)if(n==null||n.isBlank()||providers.get(n.trim().toLowerCase(Locale.ROOT))==null)throw new IllegalArgumentException();List<ShippingPolicy> out=new ArrayList<>();for(String n:names)out.add(resolve(n,providers));return List.copyOf(out);`,
      `AtomicInteger n=new AtomicInteger();Map<String,Supplier<ShippingPolicy>> p=Map.of("bike",()->{n.incrementAndGet();return g->1;});rejects(()->Challenge.deployment(List.of("bike","bad"),p));expect(n.get()==0);expect(Challenge.deployment(List.of("bike","bike"),p).size()==2&&n.get()==2);`,
      "Implement deployment: validate every requested name before invoking any supplier; then build one policy per occurrence in order using resolve. Return an unmodifiable list; empty requests are allowed.",
      "A deployment lists several enabled couriers. A typo must be found before any provider starts opening expensive resources.",
      "[bike,bad] → reject with zero supplier invocations",
    ),
  ),
  topic(
    "hands-java-architecture:4",
    "Adapter",
    q(
      "Convert exact decimal requests",
      "public static String chargeDecimal(String amount,PaymentPort port)",
      `if(amount==null||port==null)throw new IllegalArgumentException();try{long cents=new java.math.BigDecimal(amount).movePointRight(2).longValueExact();if(cents<0)throw new IllegalArgumentException();return port.pay(cents);}catch(NumberFormatException|ArithmeticException e){throw new IllegalArgumentException();}`,
      `AtomicLong paid=new AtomicLong();expect(Challenge.chargeDecimal("1.20",c->{paid.set(c);return "ok";}).equals("ok")&&paid.get()==120);rejects(()->Challenge.chargeDecimal("1.001",c->{throw new AssertionError();}));rejects(()->Challenge.chargeDecimal("-1",c->"bad"));`,
      "Implement chargeDecimal: adapt a decimal string to exact nonnegative long cents; reject malformed, fractional-cent and overflowing values before calling PaymentPort. Invoke it once and propagate its failures.",
      "A legacy import sends money as decimal text. Floating-point rounding must never change what a customer is charged.",
      "1.20 → 120 cents; 1.001 → reject",
    ),
    q(
      "Bridge a complete settlement",
      "public static List<String> settle(List<String> amounts,PaymentPort port)",
      `if(amounts==null||port==null)throw new IllegalArgumentException();for(String a:amounts)chargeDecimal(a,c->"");List<String> result=new ArrayList<>();for(String a:amounts)result.add(chargeDecimal(a,port));return List.copyOf(result);`,
      `AtomicInteger n=new AtomicInteger();rejects(()->Challenge.settle(List.of("1.00","bad"),c->{n.incrementAndGet();return "x";}));expect(n.get()==0);expect(Challenge.settle(List.of("1.00","2.05"),c->"p"+c).equals(List.of("p100","p205")));`,
      "Implement settle: validate every decimal amount before making any payment, then adapt in order and return immutable receipt IDs. Payment failures propagate; prior successful external payments cannot be rolled back by this method.",
      "Finance imports a settlement file. Validate the entire file first, while being honest that external charges are not a local database transaction.",
      "[1.00,bad] → no charges",
    ),
  ),
  topic(
    "hands-java-architecture:5",
    "Decorator",
    q(
      "Retry a payment without retrying its audit",
      "public static PaymentPort retry(PaymentPort delegate,int attempts)",
      `if(delegate==null||attempts<1||attempts>10)throw new IllegalArgumentException();return cents->{for(int i=1;;i++){try{return delegate.pay(cents);}catch(IllegalStateException e){if(i==attempts)throw e;}}};`,
      `AtomicInteger tries=new AtomicInteger();PaymentPort p=Challenge.retry(c->{if(tries.incrementAndGet()<3)throw new IllegalStateException();return "ok";},3);expect(p.pay(1).equals("ok")&&tries.get()==3);rejects(()->Challenge.retry(c->"x",0));`,
      "Implement retry as a PaymentPort decorator: retry only IllegalStateException up to attempts total calls (1..10), propagate the last failure, and never retry other exception types. It creates no global attempt counter.",
      "The gateway can fail transiently. Wrap it with a bounded retry policy without changing the gateway implementation.",
      "two transient failures, attempts=3 → third result",
    ),
    q(
      "Compose auditing around retry",
      "public static PaymentPort auditedRetry(PaymentPort gateway,int attempts,Consumer<String> audit)",
      `if(audit==null)throw new IllegalArgumentException();return new AuditedPayment(retry(gateway,attempts),audit);`,
      `AtomicInteger n=new AtomicInteger();List<String> log=new ArrayList<>();PaymentPort p=Challenge.auditedRetry(c->{if(n.incrementAndGet()==1)throw new IllegalStateException();return "R";},2,log::add);expect(p.pay(1).equals("R")&&log.equals(List.of("paid:R")));`,
      "Implement auditedRetry by composing the retry and AuditedPayment decorators so successful operations emit one paid:receipt audit event, regardless of retry count; failed operations emit none.",
      "An auditor counts charges, not network attempts. Place decorators so a transient failure does not produce misleading audit entries.",
      "one retry + success → one audit event",
    ),
  ),
];

function add(base, name, a, b) {
  const convert = ([signature, body, tests, goal, title]) =>
    q(
      title,
      signature,
      body,
      tests,
      goal,
      scenarioFor(name),
      "Example assertion:\n" +
        tests.slice(0, tests.indexOf(");", tests.indexOf("expect(")) + 2),
    );
  javaTopics.push(topic(base, name, convert(a), convert(b)));
}
add(
  "hands-java-architecture:6",
  "Command",
  [
    "public static void reserveAll(Stock stock,int[] quantities)",
    `if(stock==null||quantities==null)throw new IllegalArgumentException();int total=0;for(int n:quantities){if(n<=0)throw new IllegalArgumentException();total=Math.addExact(total,n);}if(total>stock.available())throw new IllegalStateException();for(int n:quantities)new ReserveCommand(stock,n).execute();`,
    `Stock s=new Stock(10);try{Challenge.reserveAll(s,new int[]{4,8});throw new AssertionError();}catch(IllegalStateException e){}expect(s.available()==10);Challenge.reserveAll(s,new int[]{2,3});expect(s.available()==5);`,
    "Implement reserveAll: prevalidate positive quantities and checked total stock before executing reservation commands; insufficient stock must leave the stock unchanged.",
    "Reserve an all-or-nothing kit",
  ],
  [
    "public static void compensate(Stock stock,int[] quantities)",
    `if(stock==null||quantities==null)throw new IllegalArgumentException();for(int n:quantities)if(n<=0)throw new IllegalArgumentException();List<ReserveCommand> done=new ArrayList<>();try{for(int n:quantities){ReserveCommand c=new ReserveCommand(stock,n);c.execute();done.add(c);}}catch(RuntimeException e){for(int i=done.size()-1;i>=0;i--)done.get(i).undo();throw e;}`,
    `Stock s=new Stock(5);try{Challenge.compensate(s,new int[]{2,7});throw new AssertionError();}catch(IllegalStateException e){}expect(s.available()==5);Challenge.compensate(s,new int[]{1,2});expect(s.available()==2);`,
    "Implement compensate: execute commands sequentially, and undo successful commands in reverse order if a later reservation fails; rethrow the failure. Validate nulls and nonpositive quantities first.",
    "Roll back a failed command batch",
  ],
);
add(
  "hands-java-architecture:7",
  "Builder",
  [
    "public static ReportRequest combine(String service,List<String> tags)",
    `if(tags==null)throw new IllegalArgumentException();ReportRequest.Builder b=ReportRequest.builder().service(service).days(7);for(String t:tags)b.tag(t);return b.build();`,
    `List<String> in=new ArrayList<>(List.of(" urgent ","urgent","ops"));ReportRequest r=Challenge.combine(" api ",in);in.clear();expect(r.service().equals("api")&&r.tags().equals(List.of("urgent","ops"))&&r.days()==7);`,
    "Implement combine using the builder: a seven-day report, normalized/deduplicated tags in encounter order, and no mutable input aliases. Invalid service/tags must follow the builder contract.",
    "Build an immutable operations report",
  ],
  [
    "public static List<ReportRequest> schedules(String service,int[] days)",
    `if(days==null)throw new IllegalArgumentException();for(int d:days)if(d<1||d>30)throw new IllegalArgumentException();List<ReportRequest> out=new ArrayList<>();for(int d:days)out.add(ReportRequest.builder().service(service).days(d).tag("scheduled").build());return List.copyOf(out);`,
    `List<ReportRequest> r=Challenge.schedules("api",new int[]{1,7,30});expect(r.get(0).days()==1&&r.get(1).days()==7&&r.get(2).days()==30);rejects(()->Challenge.schedules("api",new int[]{0}));`,
    "Implement schedules: one independent immutable report per requested day count, each tagged scheduled. Validate every day is 1..30; preserve order and duplicates; return an unmodifiable list.",
    "Prevent reused-builder state leakage",
  ],
);
add(
  "hands-java-patterns-advanced:0",
  "Template Method",
  [
    "public static List<String> importAll(ImportJob job,List<String> rows)",
    `if(job==null||rows==null||rows.stream().anyMatch(v->v==null||v.isBlank()))throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(String r:rows)out.add(job.run(r));return List.copyOf(out);`,
    `expect(Challenge.importAll(new UpperImport(),List.of(" a ","b")).equals(List.of("imported:A","imported:B")));rejects(()->Challenge.importAll(new LowerImport(),List.of("ok"," ")));`,
    "Implement importAll: validate every row before invoking the template, then import a snapshot in order. Reject null/blank rows and return an unmodifiable result.",
    "Import a validated file through the template",
  ],
  [
    "public static Map<Integer,String> diagnose(ImportJob job,List<String> rows)",
    `if(job==null||rows==null)throw new IllegalArgumentException();Map<Integer,String> out=new LinkedHashMap<>();for(int i=0;i<rows.size();i++){try{out.put(i,job.run(rows.get(i)));}catch(IllegalArgumentException e){out.put(i,"rejected");}}return Collections.unmodifiableMap(out);`,
    `expect(Challenge.diagnose(new LowerImport(),Arrays.asList(" A ",null,"B")).equals(Map.of(0,"imported:a",1,"rejected",2,"imported:b")));`,
    "Implement diagnose: run the template independently per row, report rejected for IllegalArgumentException and continue; preserve zero-based indexes and propagate other failures.",
    "Produce a partial-success import report",
  ],
);
add(
  "hands-java-patterns-advanced:1",
  "Chain of Responsibility",
  [
    "public static List<String> validateOrders(Rule chain,int[][] orders)",
    `if(chain==null||orders==null)throw new IllegalArgumentException();for(int[] o:orders)if(o==null||o.length!=2)throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(int[] o:orders)out.add(chain.check(o[0],o[1]));return List.copyOf(out);`,
    `expect(Challenge.validateOrders(new QuantityRule(new StockRule(null)),new int[][]{{0,2},{3,2},{1,2}}).equals(List.of("invalid quantity","insufficient stock","ok")));`,
    "Implement validateOrders: validate the shape of every quantity/stock pair, then apply the supplied chain to each pair and return its first-rejection results in order.",
    "Explain each rejected order",
  ],
  [
    "public static Map<String,Integer> rejectionCounts(Rule chain,int[][] orders)",
    `Map<String,Integer> out=new TreeMap<>();for(String result:validateOrders(chain,orders))if(!result.equals("ok"))out.merge(result,1,Math::addExact);return Collections.unmodifiableMap(out);`,
    `Map<String,Integer> r=Challenge.rejectionCounts(new QuantityRule(new StockRule(null)),new int[][]{{0,1},{0,4},{5,2},{1,9}});expect(r.equals(Map.of("invalid quantity",2,"insufficient stock",1)));`,
    "Implement rejectionCounts by reusing validateOrders: count each non-ok reason, return keys in lexical order, and do not count valid orders.",
    "Aggregate the chain's failure reasons",
  ],
);
add(
  "hands-java-patterns-advanced:2",
  "Composite",
  [
    "public static long boundedBytes(List<SizedItem> items,long limit)",
    `if(items==null||limit<0||items.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();long n=new BundleFolder(items).bytes();if(n>limit)throw new IllegalStateException();return n;`,
    `expect(Challenge.boundedBytes(List.of(new FileItem(4),new BundleFolder(List.of(new FileItem(3)))),7)==7);try{Challenge.boundedBytes(List.of(new FileItem(8)),7);throw new AssertionError();}catch(IllegalStateException e){}`,
    "Implement boundedBytes: use the composite abstraction for mixed leaves/folders, check long overflow, and reject a total above the nonnegative limit with IllegalStateException.",
    "Enforce a nested upload quota",
  ],
  [
    "public static List<Long> cumulative(List<SizedItem> items)",
    `if(items==null||items.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<Long> out=new ArrayList<>();long total=0;for(SizedItem item:items){total=Math.addExact(total,item.bytes());out.add(total);}return List.copyOf(out);`,
    `expect(Challenge.cumulative(List.of(new FileItem(3),new BundleFolder(List.of(new FileItem(4),new FileItem(2))))).equals(List.of(3L,9L)));expect(Challenge.cumulative(List.of()).isEmpty());`,
    "Implement cumulative: return a checked running byte total across mixed composite items without changing their structure. Return an immutable list; reject nulls.",
    "Plan archive boundaries without flattening the tree",
  ],
);
add(
  "hands-java-patterns-advanced:3",
  "Protection and caching proxy",
  [
    "public static List<String> readProfiles(ProfileProxy proxy,String user,long[] ids)",
    `if(proxy==null||ids==null)throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(long id:ids)out.add(proxy.get(user,id));return Collections.unmodifiableList(out);`,
    `AtomicInteger n=new AtomicInteger();ProfileProxy p=new ProfileProxy((u,id)->u.equals("admin"),id->{n.incrementAndGet();return "p"+id;});expect(Challenge.readProfiles(p,"admin",new long[]{1,1}).equals(List.of("p1","p1"))&&n.get()==1);try{Challenge.readProfiles(p,"guest",new long[]{1});throw new AssertionError();}catch(SecurityException e){}`,
    "Implement readProfiles through the proxy, preserving order/duplicates. Every request, including cache hits, must still be authorized; never fetch directly from the store.",
    "Authorize a cached batch read",
  ],
  [
    "public static List<String> isolatedReads(ReadPolicy policy,ProfileStore store,String user,long[] ids)",
    `return readProfiles(new ProfileProxy(policy,store),user,ids);`,
    `AtomicInteger n=new AtomicInteger();ProfileStore s=id->{n.incrementAndGet();return "v"+n.get();};expect(Challenge.isolatedReads((u,id)->true,s,"a",new long[]{1,1}).equals(List.of("v1","v1")));expect(Challenge.isolatedReads((u,id)->true,s,"a",new long[]{1}).equals(List.of("v2")));`,
    "Implement isolatedReads: create one fresh proxy per request, reuse its cache within that request, and do not share cached values between requests. Reuse readProfiles.",
    "Bound a cache to one request",
  ],
);
add(
  "hands-java-patterns-advanced:4",
  "State pattern and enums",
  [
    "public static String applyEvents(OrderContext order,List<String> events)",
    `if(order==null||events==null)throw new IllegalArgumentException();for(String e:events)order.apply(e);return order.state();`,
    `OrderContext o=new OrderContext(new DraftState());expect(Challenge.applyEvents(o,List.of("pay","ship")).equals("shipped"));try{o.apply("pay");throw new AssertionError();}catch(IllegalArgumentException e){}expect(o.state().equals("shipped"));`,
    "Implement applyEvents using state objects, in order, stopping at the first invalid transition. Successful prior transitions remain applied; a failed transition must not corrupt the current state.",
    "Replay an order's transition log",
  ],
  [
    "public static String preview(List<String> events)",
    `return applyEvents(new OrderContext(new DraftState()),events);`,
    `expect(Challenge.preview(List.of("pay")).equals("paid"));expect(Challenge.preview(List.of()).equals("draft"));rejects(()->Challenge.preview(List.of("ship")));expect(Challenge.preview(List.of()).equals("draft"));`,
    "Implement preview: replay events on an independent draft order each call; return its final state, propagate invalid transitions and retain no shared state.",
    "Preview transitions without mutating a live order",
  ],
);
add(
  "hands-java-patterns-advanced:5",
  "Memento and defensive snapshots",
  [
    "public static Snapshot appendSnapshot(Snapshot original,List<String> additions)",
    `if(original==null||additions==null)throw new IllegalArgumentException();DraftPad p=new DraftPad();p.restore(original);for(String a:additions)p.add(a);return p.save();`,
    `Snapshot original=new Snapshot(List.of("a"));Snapshot next=Challenge.appendSnapshot(original,List.of(" b "));expect(original.notes().equals(List.of("a"))&&next.notes().equals(List.of("a","b")));`,
    "Implement appendSnapshot using DraftPad: restore an existing immutable memento, add normalized notes, return a new memento, and never modify the original snapshot.",
    "Branch a draft without aliasing history",
  ],
  [
    "public static List<Snapshot> timeline(List<String> notes)",
    `if(notes==null||notes.stream().anyMatch(v->v==null||v.isBlank()))throw new IllegalArgumentException();DraftPad p=new DraftPad();List<Snapshot> out=new ArrayList<>();out.add(p.save());for(String n:notes){p.add(n);out.add(p.save());}return List.copyOf(out);`,
    `List<Snapshot> h=Challenge.timeline(List.of("a","b"));expect(h.size()==3&&h.get(0).notes().isEmpty()&&h.get(1).notes().equals(List.of("a"))&&h.get(2).notes().equals(List.of("a","b")));`,
    "Implement timeline: validate all notes, return the empty snapshot followed by a snapshot after every addition. All snapshots and the outer list must remain independent and immutable.",
    "Create a complete undo timeline",
  ],
);
add(
  "hands-java-patterns-advanced:6",
  "Abstract Factory",
  [
    "public static List<String> notifyAll(NoticeFactory factory,List<String> messages)",
    `if(factory==null||messages==null||messages.stream().anyMatch(m->m==null||m.isBlank()))throw new IllegalArgumentException();NoticeService s=new NoticeService(factory);List<String> out=new ArrayList<>();for(String m:messages)out.add(s.notify(m));return List.copyOf(out);`,
    `expect(Challenge.notifyAll(new EmailFactory(),List.of(" a ","b")).equals(List.of("email-sent:email:a","email-sent:email:b")));`,
    "Implement notifyAll: validate every message first, then use one compatible product family through NoticeService. Return immutable receipts in order.",
    "Send a campaign using one product family",
  ],
  [
    "public static Map<String,List<String>> campaign(Map<String,NoticeFactory> channels,List<String> messages)",
    `if(channels==null||channels.values().stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();Map<String,List<String>> out=new TreeMap<>();for(var e:channels.entrySet())out.put(e.getKey(),notifyAll(e.getValue(),messages));return Collections.unmodifiableMap(out);`,
    `Map<String,List<String>> r=Challenge.campaign(Map.of("sms",new SmsFactory(),"email",new EmailFactory()),List.of("hi"));expect(r.get("sms").equals(List.of("sms-sent:sms:hi"))&&r.get("email").equals(List.of("email-sent:email:hi")));`,
    "Implement campaign: reuse notifyAll per registered channel; keep formatter/sender families together and return channel keys in lexical order. Reject null factories and propagate failures.",
    "Coordinate multiple compatible notification families",
  ],
);
add(
  "hands-java-solid-workshop:0",
  "Single responsibility (SRP)",
  [
    "public static List<String> receipts(int[][] lines,ReceiptCalculator calculator,ReceiptFormatter formatter)",
    `if(lines==null||calculator==null||formatter==null)throw new IllegalArgumentException();List<Long> amounts=new ArrayList<>();for(int[] line:lines){if(line==null||line.length!=2)throw new IllegalArgumentException();amounts.add(calculator.total(line[0],line[1]));}List<String> out=new ArrayList<>();for(long n:amounts)out.add(formatter.format(n));return List.copyOf(out);`,
    `expect(Challenge.receipts(new int[][]{{2,300},{1,50}},new ReceiptCalculator(),new ReceiptFormatter()).equals(List.of("Total: 600 cents","Total: 50 cents")));rejects(()->Challenge.receipts(new int[][]{{1,2},{-1,3}},new ReceiptCalculator(),new ReceiptFormatter()));`,
    "Implement receipts: keep calculation and presentation separate; validate/compute all line totals before formatting any. Each row is [quantity,unitCents]. Return immutable text results.",
    "Separate batch calculation from formatting",
  ],
  [
    "public static void deliver(List<String> receipts,Consumer<String> delivery)",
    `if(receipts==null||delivery==null||receipts.stream().anyMatch(r->r==null||r.isBlank()))throw new IllegalArgumentException();for(String r:List.copyOf(receipts))delivery.accept(r);`,
    `List<String> sent=new ArrayList<>();Challenge.deliver(List.of("A","B"),sent::add);expect(sent.equals(List.of("A","B")));rejects(()->Challenge.deliver(List.of("ok"," "),sent::add));expect(sent.size()==2);`,
    "Implement deliver: validate all receipt strings before delivering any; snapshot the list to tolerate callbacks mutating the caller's list. Delivery exceptions propagate; already delivered receipts remain delivered.",
    "Keep delivery failures outside pricing",
  ],
);
add(
  "hands-java-solid-workshop:1",
  "Open/closed principle (OCP)",
  [
    "public static DiscountPolicy capped(DiscountPolicy policy,long cap)",
    `if(policy==null||cap<0)throw new IllegalArgumentException();return subtotal->{long d=policy.discount(subtotal);if(d<0||d>subtotal)throw new IllegalArgumentException();return Math.min(cap,d);};`,
    `expect(new DiscountCheckout(Challenge.capped(new TenPercentOff(),30)).total(1000)==970);rejects(()->Challenge.capped(s->-1,3).discount(10));`,
    "Implement capped as a new DiscountPolicy wrapper; cap valid discounts without changing DiscountCheckout or the original policy. Reject negative caps and invalid underlying discounts.",
    "Add a campaign cap by extension",
  ],
  [
    "public static DiscountPolicy best(List<DiscountPolicy> policies)",
    `if(policies==null||policies.isEmpty()||policies.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<DiscountPolicy> copy=List.copyOf(policies);return subtotal->{if(subtotal<0)throw new IllegalArgumentException();long best=0;for(DiscountPolicy p:copy){long d=p.discount(subtotal);if(d<0||d>subtotal)throw new IllegalArgumentException();best=Math.max(best,d);}return best;};`,
    `expect(new DiscountCheckout(Challenge.best(List.of(s->5,s->20))).total(100)==80);rejects(()->Challenge.best(List.of()));`,
    "Implement best: an immutable composition of arbitrary discount policies, selecting the largest valid discount. Validate every quoted discount; unknown policy implementations must work without type checks.",
    "Compose competing campaigns without new branches",
  ],
);
add(
  "hands-java-solid-workshop:2",
  "Liskov substitution (LSP)",
  [
    "public static long combined(List<? extends BalanceView> accounts)",
    `if(accounts==null||accounts.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();long total=0;for(BalanceView a:accounts)total=Math.addExact(total,a.balance());return total;`,
    `expect(Challenge.combined(List.of(new SpendingAccount(30),new LockedBalance(70)))==100);expect(Challenge.combined(List.of()).isEmpty()==false);`.replace(
      "expect(Challenge.combined(List.of()).isEmpty()==false);",
      "expect(Challenge.combined(List.of())==0);",
    ),
    "Implement combined against BalanceView only, summing checked long balances across both locked and withdrawable implementations; never attempt withdrawal while reporting.",
    "Report balances without stronger subtype assumptions",
  ],
  [
    "public static long payAndRead(WithdrawableAccount account,long cents)",
    `if(account==null)throw new IllegalArgumentException();new PaymentService().pay(account,cents);return account.balance();`,
    `expect(Challenge.payAndRead(new SpendingAccount(100),40)==60);AtomicLong b=new AtomicLong(90);WithdrawableAccount custom=new WithdrawableAccount(){public long balance(){return b.get();}public void withdraw(long n){if(n<=0)throw new IllegalArgumentException();if(n>b.get())throw new IllegalStateException();b.addAndGet(-n);}};expect(Challenge.payAndRead(custom,20)==70);`,
    "Implement payAndRead through the WithdrawableAccount contract, supporting arbitrary conforming implementations; propagate rejection and return the post-payment balance.",
    "Accept a new account implementation without casting",
  ],
);
add(
  "hands-java-solid-workshop:3",
  "Interface segregation (ISP)",
  [
    "public static List<String> scanBatch(List<ScannerDevice> scanners)",
    `if(scanners==null||scanners.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(ScannerDevice scanner:scanners){String s=scanner.scan();if(s==null||s.isBlank())throw new IllegalArgumentException();out.add(s);}return List.copyOf(out);`,
    `expect(Challenge.scanBatch(List.of(()->"A",()->"B")).equals(List.of("A","B")));rejects(()->Challenge.scanBatch(List.of(()->" ")));`,
    "Implement scanBatch using only ScannerDevice: scan each exactly once and reject null/blank results; return immutable text in device order. Do not require printing capability.",
    "Build a scan-only ingestion workflow",
  ],
  [
    "public static void copyBatch(List<ScannerDevice> scanners,Printer printer)",
    `if(printer==null)throw new IllegalArgumentException();List<String> pages=scanBatch(scanners);for(String page:pages)printer.print(page);`,
    `List<String> out=new ArrayList<>();Challenge.copyBatch(List.of(()->"A",()->"B"),out::add);expect(out.equals(List.of("A","B")));rejects(()->Challenge.copyBatch(List.of(()->"ok",()->" "),out::add));expect(out.size()==2);`,
    "Implement copyBatch by composing segregated scanner and printer contracts. Finish validating all scanned pages before printing any; reuse scanBatch.",
    "Compose devices without a bloated all-in-one interface",
  ],
);
add(
  "hands-java-solid-workshop:4",
  "Dependency inversion (DIP)",
  [
    "public static List<String> profiles(String user,long[] ids,AccessPolicy access,CustomerRepository repo)",
    `if(ids==null||access==null||repo==null||user==null||user.isBlank())throw new IllegalArgumentException();for(long id:ids){if(id<=0)throw new IllegalArgumentException();if(!access.allowed(user.trim(),id))throw new SecurityException();}List<String> out=new ArrayList<>();for(long id:ids)out.add(repo.find(id));return Collections.unmodifiableList(out);`,
    `AtomicInteger calls=new AtomicInteger();try{Challenge.profiles("a",new long[]{1,2},(u,id)->id==1,id->{calls.incrementAndGet();return "x";});throw new AssertionError();}catch(SecurityException e){}expect(calls.get()==0);expect(Challenge.profiles("a",new long[]{1},(u,id)->true,id->"p"+id).equals(List.of("p1")));`,
    "Implement profiles with injected policy/repository abstractions: validate and authorize every ID before any repository read; keep input order and duplicates. Reject invalid input, fail closed and propagate repository failures.",
    "Authorize the whole batch before reading private data",
  ],
  [
    "public static CustomerRepository memoized(CustomerRepository repo)",
    `if(repo==null)throw new IllegalArgumentException();Map<Long,String> cache=new HashMap<>();return id->{if(id<=0)throw new IllegalArgumentException();if(cache.containsKey(id))return cache.get(id);String result=repo.find(id);cache.put(id,result);return result;};`,
    `AtomicInteger n=new AtomicInteger();CustomerRepository repo=Challenge.memoized(id->{n.incrementAndGet();if(id==2)throw new IllegalStateException();return "p"+id;});expect(repo.find(1).equals(repo.find(1))&&n.get()==1);for(int i=0;i<2;i++)try{repo.find(2);}catch(IllegalStateException e){}expect(n.get()==3);`,
    "Implement memoized as an injected CustomerRepository wrapper, caching successful results including null and never caching exceptions. Each wrapper owns an independent cache; authorization remains outside and must still run per request.",
    "Add caching without coupling the service to storage",
  ],
);

add(
  "hands-java-oop-more:0",
  "Inheritance, abstraction and dynamic binding",
  [
    "public static long quoteAll(List<? extends Repair> repairs)",
    `if(repairs==null||repairs.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();long total=0;for(Repair r:repairs)total=Math.addExact(total,new PriceDesk().quote(r));return total;`,
    `expect(Challenge.quoteAll(List.of(new PhoneRepair(),new LaptopRepair(),new Repair(){public long price(){return 123;}}))==10123);expect(Challenge.quoteAll(List.of())==0);`,
    "Implement quoteAll polymorphically, supporting unknown Repair subclasses without instanceof/switch dispatch. Sum using checked long arithmetic and reject nulls.",
    "Price an open-ended repair fleet",
  ],
  [
    "public static Repair surcharge(Repair original,long extra)",
    `if(original==null||extra<0)throw new IllegalArgumentException();return new Repair(){public long price(){return Math.addExact(original.price(),extra);}};`,
    `Repair custom=new Repair(){public long price(){return 10;}};expect(Challenge.surcharge(custom,5).price()==15);rejects(()->Challenge.surcharge(custom,-1));expect(Challenge.quoteAll(List.of(Challenge.surcharge(custom,1),custom))==21);`,
    "Implement surcharge: return a Repair subtype that adds a nonnegative surcharge each time price is queried. Do not cache the original's price or mutate it; preserve checked overflow behavior.",
    "Extend pricing while preserving substitutability",
  ],
);
add(
  "hands-java-oop-more:1",
  "Interfaces and delegation",
  [
    "public static List<String> dispatchAll(Courier courier,List<String> parcels)",
    `if(courier==null||parcels==null||parcels.stream().anyMatch(p->p==null||p.isBlank()))throw new IllegalArgumentException();List<String> out=new ArrayList<>();Dispatch d=new Dispatch();for(String p:parcels)out.add(d.ship(courier,p));return List.copyOf(out);`,
    `expect(Challenge.dispatchAll(p->"NEW:"+p,List.of(" a ","b")).equals(List.of("NEW:a","NEW:b")));AtomicInteger n=new AtomicInteger();rejects(()->Challenge.dispatchAll(p->{n.incrementAndGet();return p;},List.of("ok"," ")));expect(n.get()==0);`,
    "Implement dispatchAll: prevalidate the whole parcel list, then delegate through Dispatch/Courier, preserving order. New courier implementations must work without edits.",
    "Delegate an all-valid dispatch batch",
  ],
  [
    "public static Courier prefixed(Courier delegate,String prefix)",
    `if(delegate==null||prefix==null)throw new IllegalArgumentException();return p->prefix+delegate.send(p);`,
    `expect(Challenge.prefixed(p->"X:"+p,"audit:").send("A").equals("audit:X:A"));expect(Challenge.dispatchAll(Challenge.prefixed(new BikeCourier(),"ok:"),List.of(" A ")).equals(List.of("ok:BIKE:A")));`,
    "Implement prefixed as a Courier implementation that delegates exactly once and prefixes its returned receipt. Do not alter the outgoing parcel or catch delegate failures.",
    "Extend a courier through composition",
  ],
);
add(
  "hands-java-collections:0",
  "Arrays and ArrayList",
  [
    "public static List<List<String>> batches(String[] jobs,int capacity)",
    `if(jobs==null||capacity<1)throw new IllegalArgumentException();for(String j:jobs)if(j==null||j.isBlank())throw new IllegalArgumentException();List<List<String>> out=new ArrayList<>();for(int i=0;i<jobs.length;i+=capacity)out.add(List.copyOf(Arrays.asList(Arrays.copyOfRange(jobs,i,Math.min(jobs.length,i+capacity)))));return List.copyOf(out);`,
    `String[] a={"a","b","c"};var r=Challenge.batches(a,2);a[0]="x";expect(r.equals(List.of(List.of("a","b"),List.of("c"))));rejects(()->Challenge.batches(a,0));`,
    "Implement batches: split an input array into immutable independent batches of at most capacity, preserving order and leaving the array unchanged. Reject null/blank elements and nonpositive capacity.",
    "Partition an import without array aliasing",
  ],
  [
    "public static List<String> interleave(List<List<String>> lanes)",
    `if(lanes==null||lanes.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();for(List<String> lane:lanes)if(lane.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(int i=0;;i++){boolean found=false;for(List<String> lane:lanes)if(i<lane.size()){out.add(lane.get(i));found=true;}if(!found)break;}return List.copyOf(out);`,
    `expect(Challenge.interleave(List.of(List.of("a","b"),List.of("c"),List.of())).equals(List.of("a","c","b")));expect(Challenge.interleave(List.of()).isEmpty());`,
    "Implement interleave: take one item from each nonempty lane per round until exhausted; preserve each lane's internal order and never mutate inputs. Return an immutable result.",
    "Merge uneven work lanes fairly",
  ],
);
add(
  "hands-java-collections:1",
  "Set and stable deduplication",
  [
    "public static List<String> overlap(String[] first,String[] second)",
    `Set<String> b=new Reminders().unique(second);List<String> out=new ArrayList<>();for(String x:new Reminders().unique(first))if(b.contains(x))out.add(x);return List.copyOf(out);`,
    `expect(Challenge.overlap(new String[]{" b ","a","B","c"},new String[]{"A","B"}).equals(List.of("B","A")));`,
    "Implement overlap: normalize IDs using Reminders.unique, return their intersection in the first input's encounter order, without duplicates or input mutation.",
    "Reconcile overlapping reminder audiences",
  ],
  [
    "public static List<String> exclusive(String[] first,String[] second)",
    `Set<String> a=new Reminders().unique(first),b=new Reminders().unique(second);List<String> out=new ArrayList<>();for(String x:a)if(!b.contains(x))out.add(x);for(String x:b)if(!a.contains(x))out.add(x);return List.copyOf(out);`,
    `expect(Challenge.exclusive(new String[]{"b","a","b"},new String[]{"a","c"}).equals(List.of("B","C")));`,
    "Implement exclusive: normalized symmetric difference, first-only IDs followed by second-only IDs in their respective encounter orders. Normalize with the supplied Reminders.unique: trim IDs, uppercase using Locale.ROOT, reject null/blank IDs and keep first-seen order.",
    "Find audience drift in both directions",
  ],
);
add(
  "hands-java-collections:2",
  "Map and indexing",
  [
    "public static Map<String,List<String>> byCity(String[][] rows)",
    `if(rows==null)throw new IllegalArgumentException();Map<String,List<String>> out=new TreeMap<>();for(String[] r:rows){if(r==null||r.length!=2||r[0]==null||r[1]==null||r[0].isBlank()||r[1].isBlank())throw new IllegalArgumentException();String city=r[1].trim(),id=r[0].trim();List<String> list=out.computeIfAbsent(city,k->new ArrayList<>());if(!list.contains(id))list.add(id);}out.replaceAll((k,v)->List.copyOf(v));return Collections.unmodifiableMap(out);`,
    `expect(Challenge.byCity(new String[][]{{"A","KL"},{"B","KL"},{"A","KL"},{"C","JB"}}).get("KL").equals(List.of("A","B")));`,
    "Implement byCity for [customerId,city] rows: trim values, group into lexically ordered city keys, deduplicate IDs per city in encounter order, and return a deeply unmodifiable map.",
    "Build a multi-value customer index",
  ],
  [
    "public static Map<String,String> reconcile(Map<String,String> old,Map<String,String> patch)",
    `if(old==null||patch==null||old.keySet().stream().anyMatch(Objects::isNull)||patch.keySet().stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();Map<String,String> out=new TreeMap<>(old);for(var e:patch.entrySet())if(e.getValue()==null)out.remove(e.getKey());else out.put(e.getKey(),e.getValue());return Collections.unmodifiableMap(out);`,
    `Map<String,String> patch=new HashMap<>();patch.put("A",null);patch.put("C","new");Map<String,String> old=Map.of("A","old","B","keep");expect(Challenge.reconcile(old,patch).equals(Map.of("B","keep","C","new")));expect(old.size()==2);`,
    "Implement reconcile: a null patch value deletes a key, other values replace/add it; preserve input maps and return a lexical, unmodifiable result. Reject null maps or null keys.",
    "Apply a deletion-aware index patch",
  ],
);
add(
  "hands-java-collections:3",
  "Queue and scheduling",
  [
    "public static List<String> drain(WaitingLine line,int limit)",
    `if(line==null||limit<0)throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(int i=0;i<limit;i++){String n=line.next();if(n==null)break;out.add(n);}return List.copyOf(out);`,
    `WaitingLine q=new WaitingLine();q.join("a");q.join("b");expect(Challenge.drain(q,1).equals(List.of("a"))&&q.size()==1);expect(Challenge.drain(q,9).equals(List.of("b")));`,
    "Implement drain: remove at most limit queued IDs in FIFO order; zero is a no-op and an empty queue is valid. Return immutable results, rejecting null queues and negative limits.",
    "Drain only the current worker capacity",
  ],
  [
    "public static List<String> roundRobin(List<WaitingLine> lanes)",
    `if(lanes==null||lanes.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<String> out=new ArrayList<>();boolean found;do{found=false;for(WaitingLine q:lanes){String s=q.next();if(s!=null){out.add(s);found=true;}}}while(found);return List.copyOf(out);`,
    `WaitingLine a=new WaitingLine(),b=new WaitingLine();a.join("a1");a.join("a2");b.join("b1");expect(Challenge.roundRobin(List.of(a,b)).equals(List.of("a1","b1","a2"))&&a.size()==0);`,
    "Implement roundRobin: drain one ID per lane per round, skip empty lanes, continue until all are empty, and preserve FIFO order within each lane.",
    "Keep busy tenants from starving others",
  ],
);
add(
  "hands-java-collections:4",
  "Deque and stack",
  [
    "public static List<String> undoMany(NoteHistory history,int count)",
    `if(history==null||count<0)throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(int i=0;i<count;i++){String note=history.undo();if(note==null)break;out.add(note);}return List.copyOf(out);`,
    `NoteHistory h=new NoteHistory();h.add("a");h.add("b");expect(Challenge.undoMany(h,1).equals(List.of("b"))&&h.oldest().equals("a"));expect(Challenge.undoMany(h,9).equals(List.of("a")));`,
    "Implement undoMany: pop up to count entries in LIFO order; zero leaves history untouched, and exhaustion ends normally. Reject negative count/null history.",
    "Undo a bounded group of edits",
  ],
  [
    "public static boolean balanced(String text)",
    `if(text==null)throw new IllegalArgumentException();Deque<Character> stack=new ArrayDeque<>();for(char c:text.toCharArray()){if(c=='('||c=='['||c=='{')stack.push(c);else if(c==')'||c==']'||c=='}'){if(stack.isEmpty())return false;char x=stack.pop();if(c==')'&&x!='('||c==']'&&x!='['||c=='}'&&x!='{')return false;}}return stack.isEmpty();`,
    `expect(Challenge.balanced("a{b[c](d)}"));expect(!Challenge.balanced("([)]"));expect(!Challenge.balanced("("));expect(Challenge.balanced(""));`,
    "Implement balanced with a stack: validate matching (), [] and {} while ignoring all other characters; detect wrong nesting, premature closes and leftover opens.",
    "Validate nested configuration delimiters",
  ],
);
add(
  "hands-java-collections:5",
  "Iterator and safe mutation",
  [
    "public static int retain(List<String> jobs,Set<String> permitted)",
    `if(jobs==null||permitted==null||jobs.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();int n=0;for(Iterator<String> it=jobs.iterator();it.hasNext();)if(!permitted.contains(it.next())){it.remove();n++;}return n;`,
    `List<String> a=new LinkedList<>(List.of("A","B","A","C"));expect(Challenge.retain(a,Set.of("A"))==2&&a.equals(List.of("A","A")));`,
    "Implement retain using Iterator.remove: mutate the supplied list in place, keep only permitted IDs, preserve duplicates/order and return the removal count. Validate null entries before mutation.",
    "Prune jobs without invalidating iteration",
  ],
  [
    "public static List<String> drainAlternating(List<String> jobs)",
    `if(jobs==null||jobs.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<String> out=new ArrayList<>();boolean take=true;for(Iterator<String> it=jobs.iterator();it.hasNext();){String s=it.next();if(take){out.add(s);it.remove();}take=!take;}return List.copyOf(out);`,
    `List<String> a=new LinkedList<>(List.of("a","b","c","d","e"));expect(Challenge.drainAlternating(a).equals(List.of("a","c","e"))&&a.equals(List.of("b","d")));`,
    "Implement drainAlternating using one iterator: remove original indexes 0,2,4,... into an immutable result and retain indexes 1,3,5,... in the original list. Support LinkedList without index-based traversal.",
    "Split a queue while walking it once",
  ],
);
add(
  "hands-java-collections:6",
  "Generic collections",
  [
    "public static <T,R> List<R> mapTray(Tray<T> tray,Function<? super T,? extends R> convert)",
    `if(tray==null||convert==null)throw new IllegalArgumentException();List<R> out=new ArrayList<>();for(T item:tray.snapshot())out.add(Objects.requireNonNull(convert.apply(item)));return List.copyOf(out);`,
    `Tray<Integer> t=new Tray<>();t.add(1);t.add(2);expect(Challenge.mapTray(t,Object::toString).equals(List.of("1","2"))&&t.snapshot().equals(List.of(1,2)));`,
    "Implement mapTray with variance-friendly generic types: map a snapshot without consuming or mutating the tray, return immutable results and reject null conversions.",
    "Project typed work without consuming it",
  ],
  [
    "public static <T> List<T> transfer(Tray<? extends T> from,Tray<? super T> to,int limit)",
    `if(from==null||to==null||from==to||limit<0)throw new IllegalArgumentException();List<T> moved=new ArrayList<>();for(int i=0;i<limit;i++){T item=from.take();if(item==null)break;to.add(item);moved.add(item);}return List.copyOf(moved);`,
    `Tray<Integer> a=new Tray<>();Tray<Number> b=new Tray<>();a.add(1);a.add(2);expect(Challenge.transfer(a,b,1).equals(List.of(1))&&a.snapshot().equals(List.of(2))&&b.snapshot().equals(List.of(1)));`,
    "Implement transfer with producer-extends/consumer-super generics: move at most limit items FIFO, return moved items immutably, reject aliasing trays/nulls/negative limits.",
    "Move specialized work into a general-purpose tray",
  ],
);
add(
  "hands-java-dsa:1",
  "Binary search and boundary algorithms",
  [
    "public static int lowerBound(int[] sorted,int key)",
    `if(sorted==null)throw new IllegalArgumentException();int l=0,r=sorted.length;while(l<r){int m=l+(r-l)/2;if(sorted[m]<key)l=m+1;else r=m;}return l;`,
    `expect(Challenge.lowerBound(new int[]{1,2,2,4},2)==1);expect(Challenge.lowerBound(new int[]{1,2},9)==2);expect(Challenge.lowerBound(new int[]{},0)==0);for(int k=-2;k<8;k++){int[] a={0,1,1,3,6};int n=0;while(n<a.length&&a[n]<k)n++;expect(Challenge.lowerBound(a,k)==n);}`,
    "Implement lowerBound in O(log n): first index whose value is >= key, or length if absent. Input is sorted ascending; duplicates and empty arrays are valid; do not mutate it.",
    "Find insertion boundaries in duplicate-heavy indexes",
  ],
  [
    "public static int occurrences(int[] sorted,int key)",
    `int first=lowerBound(sorted,key);if(first==sorted.length||sorted[first]!=key)return 0;int l=first,r=sorted.length;while(l<r){int m=l+(r-l)/2;if(sorted[m]<=key)l=m+1;else r=m;}return l-first;`,
    `expect(Challenge.occurrences(new int[]{1,2,2,2,5},2)==3);expect(Challenge.occurrences(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE},Integer.MAX_VALUE)==2);expect(Challenge.occurrences(new int[]{},2)==0);`,
    "Implement occurrences in O(log n) using lower and upper boundaries, including Integer.MAX_VALUE without key+1 overflow. Reuse lowerBound and leave the array unchanged.",
    "Count duplicate keys without scanning the matching range",
  ],
);
add(
  "hands-java-dsa:0",
  "Hash maps and frequency algorithms",
  [
    "public static List<Integer> topK(int[] values,int k)",
    `if(values==null||k<0)throw new IllegalArgumentException();Map<Integer,Integer> counts=new HashMap<>();for(int v:values)counts.merge(v,1,Integer::sum);List<Integer> out=new ArrayList<>(counts.keySet());out.sort(Comparator.<Integer>comparingInt(counts::get).reversed().thenComparingInt(Integer::intValue));return List.copyOf(out.subList(0,Math.min(k,out.size())));`,
    `expect(Challenge.topK(new int[]{3,1,3,2,1,4},2).equals(List.of(1,3)));expect(Challenge.topK(new int[]{},5).isEmpty());rejects(()->Challenge.topK(new int[]{1},-1));`,
    "Implement topK: descending frequency, then ascending numeric value for ties. Return at most k distinct values immutably; accept empty arrays/k=0 and reject null input or negative k.",
    "Rank recurring incident codes deterministically",
  ],
  [
    "public static long pairs(int[] values,int target)",
    `if(values==null)throw new IllegalArgumentException();Map<Integer,Long> seen=new HashMap<>();long n=0;for(int v:values){long need=(long)target-v;if(need>=Integer.MIN_VALUE&&need<=Integer.MAX_VALUE)n=Math.addExact(n,seen.getOrDefault((int)need,0L));seen.merge(v,1L,Math::addExact);}return n;`,
    `expect(Challenge.pairs(new int[]{1,1,1,1},2)==6);expect(Challenge.pairs(new int[]{Integer.MAX_VALUE,1},Integer.MIN_VALUE)==0);expect(Challenge.pairs(new int[]{2,3,2,3},5)==4);`,
    "Implement pairs in expected O(n): count index pairs i<j whose mathematical sum equals target. Preserve duplicate multiplicity and avoid int overflow in complement calculations; return long.",
    "Count matching payments without quadratic loops",
  ],
);

add(
  "hands-java-spring-core:0",
  "Spring IoC and constructor injection",
  [
    "public static List<String> payBatch(Checkout checkout,int[] amounts)",
    `if(checkout==null||amounts==null)throw new IllegalArgumentException();for(int n:amounts)if(n<=0)throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(int n:amounts)out.add(checkout.pay(n));return List.copyOf(out);`,
    `AtomicInteger advCalls=new AtomicInteger();expect(Challenge.payBatch(new Checkout(n->{advCalls.incrementAndGet();return "r"+n;}),new int[]{1,2}).equals(List.of("r1","r2"))&&advCalls.get()==2);rejects(()->Challenge.payBatch(new Checkout(n->{throw new AssertionError();}),new int[]{1,0}));`,
    "Implement payBatch using an injected Checkout: validate all positive amounts before gateway calls, return immutable receipts in order, and never construct a payment implementation inside the method.",
    "Keep a batch service independent of its gateway",
  ],
  [
    "public static String configuredPayment(int amount)",
    `try(var context=new org.springframework.context.annotation.AnnotationConfigApplicationContext(ShopConfig.class)){return context.getBean(Checkout.class).pay(amount);}`,
    `expect(Challenge.configuredPayment(19).equals("paid:19"));rejects(()->Challenge.configuredPayment(0));`,
    "Implement configuredPayment: create a real Spring context from ShopConfig, resolve Checkout by type, execute the payment and always close the context. Propagate invalid payment failures.",
    "Exercise the actual dependency graph",
  ],
);
add(
  "hands-java-spring-core:1",
  "Spring bean scopes and lifecycle",
  [
    "public static List<String> drafts(List<String> values)",
    `if(values==null||values.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();try(var c=new org.springframework.context.annotation.AnnotationConfigApplicationContext(ScopeConfig.class)){List<String> out=new ArrayList<>();for(String s:values){StringBuilder b=c.getBean("draft",StringBuilder.class);b.append(s);out.add(b.toString());}return List.copyOf(out);}`,
    `expect(Challenge.drafts(List.of("a","b","c")).equals(List.of("a","b","c")));`,
    "Implement drafts: resolve a fresh prototype StringBuilder from Spring per value, append only that value, and return independent strings. Always close the context.",
    "Prevent prototype state leaking across customers",
  ],
  [
    "public static int scopedCount(int calls)",
    `if(calls<0)throw new IllegalArgumentException();try(var c=new org.springframework.context.annotation.AnnotationConfigApplicationContext(ScopeConfig.class)){for(int i=0;i<calls;i++)c.getBean("counter",AtomicInteger.class).incrementAndGet();return c.getBean("counter",AtomicInteger.class).get();}`,
    `expect(Challenge.scopedCount(7)==7);expect(Challenge.scopedCount(2)==2);expect(Challenge.scopedCount(0)==0);`,
    "Implement scopedCount: resolve and increment the singleton counter once per call inside one new context. Separate invocations must use independent contexts and counts; reject negative calls.",
    "Bound singleton lifetime to its application context",
  ],
);
add(
  "hands-java-spring-core:2",
  "Spring Boot configuration properties",
  [
    "public static ShopSettings bind(Map<String,Object> defaults,Map<String,Object> overrides)",
    `if(defaults==null||overrides==null)throw new IllegalArgumentException();try(var c=new org.springframework.context.annotation.AnnotationConfigApplicationContext()){c.getEnvironment().getPropertySources().addLast(new org.springframework.core.env.MapPropertySource("defaults",defaults));c.getEnvironment().getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource("overrides",overrides));c.register(SettingsConfig.class);c.refresh();ShopSettings s=c.getBean(ShopSettings.class);if(s.name()==null||s.name().isBlank()||s.dailyLimit()<1)throw new IllegalArgumentException();return s;}`,
    `ShopSettings adv=Challenge.bind(Map.of("shop.name","base","shop.daily-limit",10),Map.of("shop.name","override"));expect(adv.name().equals("override")&&adv.dailyLimit()==10);rejects(()->Challenge.bind(Map.of("shop.name","a","shop.daily-limit",0),Map.of()));`,
    "Implement bind with actual Spring property sources: overrides win over defaults, bind ShopSettings, require a nonblank name and positive dailyLimit, and close the context. Do not mutate either map.",
    "Resolve safe deployment overrides",
  ],
  [
    "public static List<ShopSettings> deployments(Map<String,Object> defaults,List<Map<String,Object>> overrides)",
    `if(overrides==null)throw new IllegalArgumentException();List<ShopSettings> out=new ArrayList<>();for(Map<String,Object> map:overrides)out.add(bind(defaults,map));return List.copyOf(out);`,
    `var adv=Challenge.deployments(Map.of("shop.name","base","shop.daily-limit",2),List.of(Map.of("shop.name","a"),Map.of("shop.name","b")));expect(adv.get(0).name().equals("a")&&adv.get(1).name().equals("b"));`,
    "Implement deployments by reusing bind in isolated contexts; return immutable settings in deployment order, with no override leakage between environments.",
    "Build isolated environment configurations",
  ],
);
add(
  "hands-java-spring-core:3",
  "Spring profiles and bean selection",
  [
    "public static String delivery(String profile)",
    `if(!Set.of("demo","production").contains(profile))throw new IllegalArgumentException();try(var c=new org.springframework.context.annotation.AnnotationConfigApplicationContext()){c.getEnvironment().setActiveProfiles(profile);c.register(ProfileConfig.class);c.refresh();return c.getBean("delivery",String.class);}`,
    `expect(Challenge.delivery("production").equals("email"));expect(Challenge.delivery("demo").equals("console"));rejects(()->Challenge.delivery("unknown"));`,
    "Implement delivery: permit only demo or production, activate that profile before refresh, resolve the delivery bean and always close the context. Reject unknown profiles before starting a context.",
    "Select exactly one deployment adapter",
  ],
  [
    "public static Map<String,String> rollout(List<String> profiles)",
    `if(profiles==null||profiles.stream().anyMatch(p->p==null||!Set.of("demo","production").contains(p)))throw new IllegalArgumentException();Map<String,String> out=new LinkedHashMap<>();for(String p:profiles)if(!out.containsKey(p))out.put(p,delivery(p));return Collections.unmodifiableMap(out);`,
    `expect(Challenge.rollout(List.of("production","demo","production")).equals(Map.of("production","email","demo","console")));`,
    "Implement rollout: validate the whole profile list, resolve each unique profile once using delivery, and preserve first-seen key order in an unmodifiable map.",
    "Verify a multi-environment rollout without profile leakage",
  ],
);
add(
  "hands-java-spring-web:0",
  "Spring MVC and HTTP contracts",
  [
    "public static int status(long id) throws Exception",
    `var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new BookingController()).build();return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/bookings/"+id)).andReturn().getResponse().getStatus();`,
    `expect(Challenge.status(99)==200);expect(Challenge.status(0)==400);expect(Challenge.status(-1)==400);`,
    "Implement status with real MockMvc requests against BookingController, returning the HTTP status for the supplied ID. Do not call the controller method directly or infer status from the ID.",
    "Verify transport behavior at the MVC boundary",
  ],
  [
    "public static Map<Long,Integer> probe(long[] ids) throws Exception",
    `if(ids==null)throw new IllegalArgumentException();Map<Long,Integer> out=new LinkedHashMap<>();for(long id:ids)if(!out.containsKey(id))out.put(id,status(id));return Collections.unmodifiableMap(out);`,
    `expect(Challenge.probe(new long[]{1,0,1,-5}).equals(Map.of(1L,200,0L,400,-5L,400)));`,
    "Implement probe: reuse status for each unique ID, preserving first-seen key order and returning an unmodifiable HTTP-status report. Duplicate probes must not create duplicate entries.",
    "Report mixed healthy and invalid API requests",
  ],
);
add(
  "hands-java-spring-web:1",
  "Bean Validation and exception advice",
  [
    "public static int violations(String name,int quantity)",
    `try(var validator=new org.springframework.validation.beanvalidation.LocalValidatorFactoryBean()){validator.afterPropertiesSet();return validator.validate(new CreateController.CreateRequest(name,quantity)).size();}`,
    `expect(Challenge.violations("A",1)==0);expect(Challenge.violations(" ",0)==2);expect(Challenge.violations(null,3)==1);`,
    "Implement violations with the real Bean Validation provider and CreateRequest constraints; return the violation count and close the validator factory.",
    "Validate domain input without hard-coded duplicate rules",
  ],
  [
    "public static List<Integer> classify(List<CreateController.CreateRequest> requests)",
    `if(requests==null||requests.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<Integer> out=new ArrayList<>();for(var r:requests)out.add(violations(r.name(),r.quantity()));return List.copyOf(out);`,
    `expect(Challenge.classify(List.of(new CreateController.CreateRequest("a",1),new CreateController.CreateRequest("",0))).equals(List.of(0,2)));`,
    "Implement classify: validate nonnull request objects with violations, preserve ordering and return immutable counts. Use the provided CreateRequest constraints; changing HTTP exception advice is not part of this task.",
    "Preflight a bulk request import consistently",
  ],
);
add(
  "hands-java-spring-web:2",
  "Spring Data JPA and repository contracts",
  [
    "public static List<Long> customerIds(TicketRepository repository,String customer)",
    `if(repository==null||customer==null||customer.isBlank())throw new IllegalArgumentException();return repository.findByCustomerOrderByIdAsc(customer.trim()).stream().map(Ticket::getId).toList();`,
    `try(var advc=new org.springframework.boot.builder.SpringApplicationBuilder(LabApplication.class).web(org.springframework.boot.WebApplicationType.NONE).properties("spring.main.banner-mode=off","logging.level.root=ERROR","spring.datasource.url=jdbc:h2:mem:advancedjpa;DB_CLOSE_DELAY=-1","spring.jpa.hibernate.ddl-auto=create-drop").run()){var advr=advc.getBean(TicketRepository.class);var advt=advr.saveAndFlush(new Ticket("A"));advr.saveAndFlush(new Ticket("B"));expect(Challenge.customerIds(advr," A ").equals(List.of(advt.getId())));}`,
    "Implement customerIds against the injected repository's derived query, trimming a required customer name. Return immutable IDs in ascending order; do not load all tickets and filter in memory.",
    "Query an isolated customer through the repository",
  ],
  [
    "public static Map<String,List<Long>> customerReport(TicketRepository repository,List<String> customers)",
    `if(repository==null||customers==null||customers.stream().anyMatch(c->c==null||c.isBlank()))throw new IllegalArgumentException();Map<String,List<Long>> out=new TreeMap<>();for(String c:customers){String key=c.trim();if(!out.containsKey(key))out.put(key,customerIds(repository,key));}return Collections.unmodifiableMap(out);`,
    `try(var advc=new org.springframework.boot.builder.SpringApplicationBuilder(LabApplication.class).web(org.springframework.boot.WebApplicationType.NONE).properties("spring.main.banner-mode=off","logging.level.root=ERROR","spring.datasource.url=jdbc:h2:mem:advancedreport;DB_CLOSE_DELAY=-1","spring.jpa.hibernate.ddl-auto=create-drop").run()){var advr=advc.getBean(TicketRepository.class);advr.saveAndFlush(new Ticket("A"));var adv=Challenge.customerReport(advr,List.of("A","Nobody"," A "));expect(adv.size()==2&&adv.get("A").size()==1&&adv.get("Nobody").isEmpty());}`,
    "Implement customerReport: validate all names, normalize/deduplicate them, reuse customerIds and include customers with no tickets. Return lexical keys and immutable nested results.",
    "Build a missing-customer-safe repository report",
  ],
);
add(
  "hands-java-spring-web:3",
  "Spring transactions and proxy boundaries",
  [
    "public static void guardedTransfer(TransferService service,long from,long to,int amount)",
    `if(service==null||from==to||from<=0||to<=0||amount<=0)throw new IllegalArgumentException();service.transfer(from,to,amount,false);`,
    `AtomicInteger advCalls=new AtomicInteger();TransferService advFake=new TransferService(new org.springframework.jdbc.core.JdbcTemplate()){public void transfer(long f,long t,int amount,boolean fail){expect(f==1&&t==2&&amount==3&&!fail);advCalls.incrementAndGet();}};Challenge.guardedTransfer(advFake,1,2,3);expect(advCalls.get()==1);rejects(()->Challenge.guardedTransfer(new TransferService(null),1,1,10));rejects(()->Challenge.guardedTransfer(new TransferService(null),1,2,0));`,
    "Implement guardedTransfer: reject self-transfers, invalid IDs and nonpositive amounts before invoking the injected Spring-proxied TransferService. Delegate valid operations once; transaction rollback remains the service's responsibility.",
    "Guard a transaction before entering the proxy",
  ],
  [
    "public static void simulateFailure(TransferService service,long from,long to,int amount)",
    `if(service==null||from==to||from<=0||to<=0||amount<=0)throw new IllegalArgumentException();service.transfer(from,to,amount,true);`,
    `try(var advc=new org.springframework.boot.builder.SpringApplicationBuilder(LabApplication.class).web(org.springframework.boot.WebApplicationType.NONE).properties("spring.main.banner-mode=off","logging.level.root=ERROR","spring.datasource.url=jdbc:h2:mem:advancedtx;DB_CLOSE_DELAY=-1").run()){var advdb=advc.getBean(org.springframework.jdbc.core.JdbcTemplate.class);advdb.execute("CREATE TABLE accounts(id BIGINT PRIMARY KEY,balance INT NOT NULL)");advdb.update("INSERT INTO accounts VALUES(1,100),(2,20)");var advs=advc.getBean(TransferService.class);Challenge.guardedTransfer(advs,1,2,10);rejects(()->Challenge.simulateFailure(advs,1,2,20));expect(advdb.queryForObject("SELECT balance FROM accounts WHERE id=1",Integer.class)==90&&advdb.queryForObject("SELECT balance FROM accounts WHERE id=2",Integer.class)==30);}`,
    "Implement simulateFailure with the same boundary guards, but invoke the proxied transfer with failure injection enabled. Let its exception propagate; the debit must roll back in the real database.",
    "Prove rollback after a debit has already happened",
  ],
);
add(
  "hands-java-spring-web:4",
  "Spring Security method authorization",
  [
    "public static String authorizedPurge(AdminReports reports,org.springframework.security.core.Authentication authentication)",
    `if(reports==null||authentication==null)throw new IllegalArgumentException();var previous=org.springframework.security.core.context.SecurityContextHolder.getContext();var local=org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();local.setAuthentication(authentication);org.springframework.security.core.context.SecurityContextHolder.setContext(local);try{return reports.purge();}finally{org.springframework.security.core.context.SecurityContextHolder.setContext(previous);}`,
    `try(var advc=new org.springframework.context.annotation.AnnotationConfigApplicationContext(SecurityConfig.class,AdminReports.class)){var adva=new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("a","x",List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN")));expect(Challenge.authorizedPurge(advc.getBean(AdminReports.class),adva).equals("purged"));expect(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()==null);}`,
    "Implement authorizedPurge: temporarily install the supplied authentication in a fresh SecurityContext, call the proxied AdminReports, and restore the caller's exact prior context in finally, including denied calls. Never bypass the proxy.",
    "Avoid leaking administrative credentials between requests",
  ],
  [
    "public static List<String> purgeFor(AdminReports reports,List<org.springframework.security.core.Authentication> users)",
    `if(users==null||users.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(var user:users){try{out.add(authorizedPurge(reports,user));}catch(org.springframework.security.access.AccessDeniedException e){out.add("denied");}}return List.copyOf(out);`,
    `try(var advc=new org.springframework.context.annotation.AnnotationConfigApplicationContext(SecurityConfig.class,AdminReports.class)){var advu=new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("u","x",List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")));var adva=new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("a","x",List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN")));expect(Challenge.purgeFor(advc.getBean(AdminReports.class),List.of(advu,adva,advu)).equals(List.of("denied","purged","denied")));}`,
    "Implement purgeFor using authorizedPurge: report denied for AccessDeniedException per user, continue in order, and preserve context restoration. Propagate unrelated failures.",
    "Process mixed-role work without privilege carryover",
  ],
);

add(
  "hands-java-oop-basics:1",
  "Encapsulation and access control",
  [
    "public static void transfer(Wallet from,Wallet to,long cents)",
    `if(from==null||to==null||from==to||cents<=0)throw new IllegalArgumentException();if(from.balance()<cents)throw new IllegalStateException();Math.addExact(to.balance(),cents);from.spend(cents);to.deposit(cents);`,
    `Wallet a=new Wallet(100),b=new Wallet(20);Challenge.transfer(a,b,30);expect(a.balance()==70&&b.balance()==50);try{Challenge.transfer(a,new Wallet(Long.MAX_VALUE),1);throw new AssertionError();}catch(ArithmeticException e){}expect(a.balance()==70);`,
    "Implement transfer through Wallet's public methods. Reject aliases/nulls/nonpositive amounts; check insufficient funds and destination overflow before changing either wallet. This is single-threaded domain logic, not a distributed transaction.",
    "Transfer between encapsulated balances atomically",
  ],
  [
    "public static List<Long> projectedBalances(List<Wallet> wallets)",
    `if(wallets==null||wallets.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();return wallets.stream().map(Wallet::balance).toList();`,
    `Wallet a=new Wallet(3);List<Long> balances=Challenge.projectedBalances(List.of(a));a.deposit(2);expect(balances.equals(List.of(3L))&&a.balance()==5);`,
    "Implement projectedBalances without exposing wallet objects or fields: return immutable balance values in input order. Later wallet mutations must not change the report.",
    "Expose a safe read model instead of mutable internals",
  ],
);
add(
  "hands-java-oop-basics:2",
  "Static and final members",
  [
    "public static List<JobTicket> issueTickets(int count)",
    `if(count<0||count>1000)throw new IllegalArgumentException();List<JobTicket> out=new ArrayList<>();for(int i=0;i<count;i++)out.add(new JobTicket());return List.copyOf(out);`,
    `int before=JobTicket.issued();List<JobTicket> out=Challenge.issueTickets(3);expect(out.size()==3&&out.get(0).id()==before+1&&out.get(2).id()==before+3&&JobTicket.issued()==before+3);rejects(()->Challenge.issueTickets(-1));`,
    "Implement issueTickets: produce 0..1000 independent tickets using the one shared sequence; preserve each final ID and return an immutable list. Invalid counts must issue nothing.",
    "Allocate a bounded batch from a shared sequence",
  ],
  [
    "public static List<String> labels(List<JobTicket> tickets)",
    `if(tickets==null||tickets.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();return tickets.stream().map(t->JobTicket.PREFIX+"-"+t.id()).toList();`,
    `List<JobTicket> t=Challenge.issueTickets(2);int before=JobTicket.issued();List<String> labels=Challenge.labels(t);expect(labels.get(0).equals("JOB-"+t.get(0).id())&&JobTicket.issued()==before);`,
    "Implement labels: use the static final prefix and each existing ticket's final ID. Reading labels must not issue new tickets or advance the static counter.",
    "Read stable IDs without consuming the sequence",
  ],
);
add(
  "hands-java-oop-basics:3",
  "Static nested classes",
  [
    "public static List<Booking> bookings(List<String> phones)",
    `if(phones==null||phones.stream().anyMatch(p->p==null||p.isBlank()))throw new IllegalArgumentException();List<Booking> out=new ArrayList<>();for(String p:phones)out.add(new Booking(new Booking.Contact(p)));return List.copyOf(out);`,
    `var b=Challenge.bookings(List.of(" 123 ","456"));expect(b.get(0).contact().phone().equals("123")&&b.get(0).contact()!=b.get(1).contact());`,
    "Implement bookings using Booking.Contact nested value objects: validate all phones first, trim them through the Contact contract, allocate independent bookings and return an immutable list.",
    "Construct nested contact values without outer-object aliases",
  ],
  [
    "public static Map<String,Integer> contacts(List<Booking> bookings)",
    `if(bookings==null||bookings.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();Map<String,Integer> out=new TreeMap<>();for(Booking b:bookings)out.merge(b.contact().phone(),1,Integer::sum);return Collections.unmodifiableMap(out);`,
    `expect(Challenge.contacts(Challenge.bookings(List.of(" 123 ","123","456"))).equals(Map.of("123",2,"456",1)));`,
    "Implement contacts: group bookings by their nested contact's normalized phone, count duplicates and return lexical keys in an unmodifiable map. Reuse bookings to build test fixtures.",
    "Index nested values across multiple bookings",
  ],
);
add(
  "hands-java-oop-basics:4",
  "Packages and public API boundaries",
  [
    "public static List<String> ticketLabels(int[] ids)",
    `if(ids==null)throw new IllegalArgumentException();for(int id:ids)if(id<=0)throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(int id:ids)out.add(workshop.TicketLabel.format(id));return List.copyOf(out);`,
    `expect(Challenge.ticketLabels(new int[]{3,1,3}).equals(List.of("JOB-3","JOB-1","JOB-3")));rejects(()->Challenge.ticketLabels(new int[]{1,0}));`,
    "Implement ticketLabels outside the workshop package using only public TicketLabel.format. Preserve order/duplicates, validate IDs and do not make internal LabelRules public.",
    "Consume a package through its supported facade",
  ],
  [
    "public static Map<Integer,String> indexedLabels(int[] ids)",
    `Map<Integer,String> out=new TreeMap<>();List<String> labels=ticketLabels(ids);for(int i=0;i<ids.length;i++)out.putIfAbsent(ids[i],labels.get(i));return Collections.unmodifiableMap(out);`,
    `expect(Challenge.indexedLabels(new int[]{8,2,8}).equals(Map.of(2,"JOB-2",8,"JOB-8")));`,
    "Implement indexedLabels by reusing ticketLabels: deduplicate IDs into an ascending, unmodifiable map while retaining the original package's visibility restrictions.",
    "Build an external index without breaking encapsulation",
  ],
);
add(
  "hands-java-oop-more:2",
  "Overloading, overriding and binding",
  [
    "public static String throughObject(Formatter formatter,Object value)",
    `if(formatter==null)throw new IllegalArgumentException();return formatter.format(value);`,
    `expect(Challenge.throughObject(new FancyFormatter(),"x").equals("fancy"));expect(Challenge.throughObject(new Formatter(),"x").equals("object"));`,
    "Implement throughObject: invoke the overload selected by the declared Object parameter type while preserving dynamic dispatch for overrides. Do not select an overload with instanceof.",
    "Preserve static overload choice with dynamic overrides",
  ],
  [
    "public static List<String> mixedBinding(Formatter formatter,List<String> values)",
    `if(formatter==null||values==null)throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(String v:values)out.add(throughObject(formatter,v)+"|"+formatter.format(v));return List.copyOf(out);`,
    `expect(Challenge.mixedBinding(new FancyFormatter(),List.of("a","b")).equals(List.of("fancy|text","fancy|text")));`,
    "Implement mixedBinding: for each String produce object-typed dispatch result, a pipe, then String-typed overload result, using the same formatter. Return immutable results in order.",
    "Expose two binding decisions in one integration",
  ],
);
add(
  "hands-java-oop-more:3",
  "Method chaining and fluent APIs",
  [
    "public static Estimate estimate(long labour,long parts,long cap)",
    `if(labour<0||parts<0||cap<0)throw new IllegalArgumentException();Estimate e=new Estimate().labour(labour).parts(parts);if(e.total()>cap)throw new IllegalArgumentException();return e;`,
    `expect(Challenge.estimate(20,30,50).total()==50);rejects(()->Challenge.estimate(20,31,50));`,
    "Implement estimate with the fluent API: reject negative inputs and totals above cap, use checked total arithmetic and return a new independent estimate.",
    "Build and validate one fluent estimate",
  ],
  [
    "public static List<Long> estimates(long[][] rows,long cap)",
    `if(rows==null)throw new IllegalArgumentException();List<Long> out=new ArrayList<>();for(long[] r:rows){if(r==null||r.length!=2)throw new IllegalArgumentException();out.add(estimate(r[0],r[1],cap).total());}return List.copyOf(out);`,
    `expect(Challenge.estimates(new long[][]{{10,20},{5,7}},40).equals(List.of(30L,12L)));`,
    "Implement estimates: each [labour,parts] row must get a fresh fluent estimate using the same cap. Reject malformed rows; preserve order and return immutable totals.",
    "Avoid reusing a mutable fluent builder between customers",
  ],
);
add(
  "hands-java-oop-more:4",
  "Enums and finite transition rules",
  [
    "public static JobStatus advance(JobStatus start,List<JobStatus> path)",
    `if(start==null||path==null)throw new IllegalArgumentException();JobStatus current=start;for(JobStatus next:path){if(!current.canMoveTo(next))throw new IllegalArgumentException();current=next;}return current;`,
    `expect(Challenge.advance(JobStatus.RECEIVED,List.of(JobStatus.REPAIRING,JobStatus.READY))==JobStatus.READY);rejects(()->Challenge.advance(JobStatus.RECEIVED,List.of(JobStatus.READY)));`,
    "Implement advance using canMoveTo: accept only legal consecutive states, reject nulls/invalid jumps and return the final enum. The starting enum itself is never mutable.",
    "Validate a complete enum transition history",
  ],
  [
    "public static List<JobStatus> remaining(JobStatus current)",
    `if(current==null)throw new IllegalArgumentException();List<JobStatus> out=new ArrayList<>();for(JobStatus s:JobStatus.values())if(s.ordinal()>current.ordinal())out.add(s);return List.copyOf(out);`,
    `expect(Challenge.remaining(JobStatus.REPAIRING).equals(List.of(JobStatus.READY,JobStatus.COLLECTED)));expect(Challenge.remaining(JobStatus.COLLECTED).isEmpty());`,
    "Implement remaining: return the future statuses after current in declaration order, excluding current, as an immutable list. A terminal state has no remaining steps.",
    "Plan the remaining work from a finite state",
  ],
);
add(
  "hands-java-oop-more:5",
  "Records and value equality",
  [
    "public static Handover merge(Handover first,Handover second)",
    `if(first==null||second==null||!first.ticketId().equals(second.ticketId()))throw new IllegalArgumentException();Set<String> checks=new LinkedHashSet<>(first.checks());checks.addAll(second.checks());return new Handover(first.ticketId(),new ArrayList<>(checks));`,
    `Handover a=new Handover("T",List.of("a","b")),b=new Handover("T",List.of("b","c"));expect(Challenge.merge(a,b).equals(new Handover("T",List.of("a","b","c"))));expect(a.checks().size()==2);`,
    "Implement merge: require matching ticket IDs, combine checks in stable first-seen order without duplicates, and return a fresh immutable record. Do not mutate either input.",
    "Merge two independent immutable handover receipts",
  ],
  [
    "public static Map<String,Handover> mergeAll(List<Handover> receipts)",
    `if(receipts==null||receipts.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();Map<String,Handover> out=new TreeMap<>();for(Handover r:receipts)out.merge(r.ticketId(),r,Challenge::merge);return Collections.unmodifiableMap(out);`,
    `var r=Challenge.mergeAll(List.of(new Handover("B",List.of("x")),new Handover("A",List.of("a")),new Handover("A",List.of("b"))));expect(r.get("A").checks().equals(List.of("a","b"))&&r.size()==2);`,
    "Implement mergeAll: group receipts by normalized ticket ID and combine each group through merge. Return an unmodifiable map with lexical keys and no mutable aliases.",
    "Consolidate record values across a batch",
  ],
);
add(
  "hands-java-oop-more:6",
  "Object lifecycle and initializer blocks",
  [
    "public static String createWorkstations(int count)",
    `if(count<0||count>100)throw new IllegalArgumentException();int before=LifecycleLog.events.length();for(int i=0;i<count;i++)new Workstation();return LifecycleLog.events.substring(before);`,
    `Class.forName("Workstation");expect(Challenge.createWorkstations(2).equals("ICIC"));expect(Challenge.createWorkstations(0).isEmpty());rejects(()->Challenge.createWorkstations(-1));`,
    "Implement createWorkstations: after the checker has loaded the provided Workstation class, create count additional objects and return only the newly appended lifecycle events. Never clear the shared log or rerun static initialization. Accept 0..100.",
    "Observe initialization without erasing earlier evidence",
  ],
  [
    "public static List<String> lifecycleBatches(int[] counts)",
    `if(counts==null)throw new IllegalArgumentException();for(int n:counts)if(n<0||n>100)throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(int n:counts)out.add(createWorkstations(n));return List.copyOf(out);`,
    `Class.forName("Workstation");int before=LifecycleLog.events.length();rejects(()->Challenge.lifecycleBatches(new int[]{1,-1}));expect(LifecycleLog.events.length()==before);expect(Challenge.lifecycleBatches(new int[]{1,0,2}).equals(List.of("IC","","ICIC")));`,
    "Implement lifecycleBatches: prevalidate every count before constructing anything, then return one event suffix per batch using createWorkstations. Invalid batches must leave the log unchanged.",
    "Keep constructor side effects out of rejected batches",
  ],
);
add(
  "hands-java-oop-more:7",
  "Pass by value and mutable references",
  [
    "public static List<Address> copiedAddresses(List<Address> input)",
    `if(input==null||input.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();return input.stream().map(a->new Address(a.city())).toList();`,
    `Address a=new Address("KL");var out=Challenge.copiedAddresses(List.of(a));out.get(0).setCity("JB");expect(a.city().equals("KL"));`,
    "Implement copiedAddresses: copy each mutable address object, not only the list, and return an immutable outer list. Reject null input/items.",
    "Detach a mutable object graph at the boundary",
  ],
  [
    "public static List<String> simulateRelocation(List<Address> input)",
    `List<Address> copy=copiedAddresses(input);AddressDemo demo=new AddressDemo();for(Address a:copy){demo.reassign(a);demo.mutate(a);}return copy.stream().map(Address::city).toList();`,
    `Address a=new Address("KL");expect(Challenge.simulateRelocation(List.of(a)).equals(List.of("Penang")));expect(a.city().equals("KL"));`,
    "Implement simulateRelocation: work only on copiedAddresses; call reassign then mutate on each copy through AddressDemo. Return resulting cities while original addresses remain unchanged.",
    "Distinguish local reassignment from object mutation",
  ],
);
add(
  "hands-java-reliability:1",
  "Idempotency and concurrent publication",
  [
    "public static String keyed(Map<String,String> cache,String id,Supplier<String> action)",
    `return Main.executeOnce(cache,id,action);`,
    `Map<String,String> advCache=new HashMap<>();AtomicInteger advN=new AtomicInteger();Set<String> advResults=ConcurrentHashMap.newKeySet();java.util.stream.IntStream.range(0,100).parallel().forEach(i->advResults.add(Challenge.keyed(advCache," req ",()->"R"+advN.incrementAndGet())));expect(advResults.equals(Set.of("R1"))&&advN.get()==1);`,
    "Implement keyed by delegating to the provided Main.executeOnce; IDs are trimmed and uppercased with Locale.ROOT, and null/blank IDs are rejected. Concurrent normalized duplicate IDs must execute the supplier once and all return the same result; failed suppliers must remain retryable.",
    "Publish one result to concurrent duplicate requests",
  ],
  [
    "public static List<String> keyedBatch(Map<String,String> cache,List<String> ids,Function<String,String> action)",
    `if(cache==null||ids==null||action==null)throw new IllegalArgumentException();for(String id:ids)Main.normalize(id);List<String> out=new ArrayList<>();for(String id:ids){String key=Main.normalize(id);out.add(keyed(cache,key,()->action.apply(key)));}return List.copyOf(out);`,
    `AtomicInteger advN=new AtomicInteger();expect(Challenge.keyedBatch(new HashMap<>(),List.of("a"," A ","b"),k->{advN.incrementAndGet();return k;}).equals(List.of("A","A","B"))&&advN.get()==2);`,
    "Implement keyedBatch: validate all IDs before side effects, then use keyed and normalized keys to preserve input order while deduplicating supplier execution. Return immutable results.",
    "Combine normalization with idempotent batch processing",
  ],
);
add(
  "hands-java-reliability:2",
  "Atomic claims and synchronization",
  [
    "public static int winners(Set<String> seen,List<String> ids)",
    `if(seen==null||ids==null)throw new IllegalArgumentException();for(String id:ids)Main.normalize(id);AtomicInteger n=new AtomicInteger();ids.parallelStream().forEach(id->{if(Main.claim(seen,id))n.incrementAndGet();});return n.get();`,
    `Set<String> advSeen=new HashSet<>();List<String> advIds=new ArrayList<>();for(int i=0;i<100;i++){advIds.add(" a ");advIds.add("b");}expect(Challenge.winners(advSeen,advIds)==2);expect(Challenge.winners(advSeen,advIds)==0);`,
    "Implement winners: validate IDs first, claim them in parallel through Main.claim and count successful unique claims safely. Existing claimed IDs must not win again.",
    "Count only the winning consumers under contention",
  ],
  [
    "public static Map<String,Integer> uniquePerTenant(Map<String,List<String>> tenants)",
    `if(tenants==null||tenants.keySet().stream().anyMatch(Objects::isNull)||tenants.values().stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();Map<String,Integer> out=new TreeMap<>();for(var e:tenants.entrySet())out.put(e.getKey(),winners(new HashSet<>(),e.getValue()));return Collections.unmodifiableMap(out);`,
    `expect(Challenge.uniquePerTenant(Map.of("a",List.of("X","x"),"b",List.of("X"))).equals(Map.of("a",1,"b",1)));`,
    "Implement uniquePerTenant: use a separate claim set for each tenant and reuse winners. The same message ID in different tenants must not collide. Return lexical keys immutably.",
    "Separate deduplication state across tenants",
  ],
);
add(
  "hands-java-analysis:2",
  "Sliding windows and long arithmetic",
  [
    "public static long maxWindow(int[] values,int width)",
    `long[] sums=Main.movingTotals(values,width);long best=Long.MIN_VALUE;for(long s:sums)best=Math.max(best,s);return best;`,
    `expect(Challenge.maxWindow(new int[]{-5,-2,-8},2)==-7);expect(Challenge.maxWindow(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE},2)==4294967294L);`,
    "Implement maxWindow by reusing movingTotals, returning the largest fixed-width sum as long. Preserve negative-only data and propagate invalid widths rather than defaulting to zero.",
    "Find a peak window without overflow or zero bias",
  ],
  [
    "public static int firstThreshold(int[] values,int width,long threshold)",
    `long[] sums=Main.movingTotals(values,width);for(int i=0;i<sums.length;i++)if(sums[i]>=threshold)return i;return -1;`,
    `expect(Challenge.firstThreshold(new int[]{1,2,3,4},2,5)==1);expect(Challenge.firstThreshold(new int[]{1,1},1,5)==-1);`,
    "Implement firstThreshold: return the zero-based start of the first fixed-width window meeting threshold, or -1. Reuse movingTotals and do not mutate input.",
    "Locate the first sustained incident burst",
  ],
);

add(
  "hands-java-contracts:0",
  "Input normalization and locale contracts",
  [
    "public static List<String> normalizeAll(List<String> ids)",
    `if(ids==null)throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(String id:ids)out.add(Main.normalize(id));return List.copyOf(out);`,
    `Locale advOld=Locale.getDefault();try{Locale.setDefault(Locale.forLanguageTag("tr-TR"));expect(Challenge.normalizeAll(List.of(" incident ","i")).equals(List.of("INCIDENT","I")));}finally{Locale.setDefault(advOld);}rejects(()->Challenge.normalizeAll(Arrays.asList("a",null)));`,
    "Implement normalizeAll by calling the provided Main.normalize: trim outer whitespace and uppercase using Locale.ROOT. Return immutable normalized IDs preserving order and multiplicity; reject null lists/items and blanks.",
    "Normalize imported IDs regardless of host locale",
  ],
  [
    "public static Map<String,List<Integer>> collisions(List<String> ids)",
    `List<String> normalized=normalizeAll(ids);Map<String,List<Integer>> out=new TreeMap<>();for(int i=0;i<normalized.size();i++)out.computeIfAbsent(normalized.get(i),k->new ArrayList<>()).add(i);out.entrySet().removeIf(e->e.getValue().size()<2);out.replaceAll((k,v)->List.copyOf(v));return Collections.unmodifiableMap(out);`,
    `expect(Challenge.collisions(List.of(" a ","B","A","b","c")).equals(Map.of("A",List.of(0,2),"B",List.of(1,3))));`,
    "Implement collisions: normalize first, then report only duplicate canonical IDs mapped to their zero-based input positions. Return lexical keys and deeply immutable results.",
    "Explain normalization collisions instead of losing records",
  ],
);
add(
  "hands-java-contracts:1",
  "Parsing and failure isolation",
  [
    "public static Map<Integer,String> invalidRecords(List<String> rows)",
    `if(rows==null)throw new IllegalArgumentException();Map<Integer,String> out=new LinkedHashMap<>();for(int i=0;i<rows.size();i++)try{Main.parseRecord(rows.get(i));}catch(IllegalArgumentException e){out.put(i,"invalid");}return Collections.unmodifiableMap(out);`,
    `expect(Challenge.invalidRecords(Arrays.asList("a|2","bad",null,"b|-1","c|0")).equals(Map.of(1,"invalid",2,"invalid",3,"invalid")));`,
    "Implement invalidRecords: parse each row with parseRecord, report index→invalid for IllegalArgumentException and continue. Preserve input order in an unmodifiable map; null row is invalid, null list is rejected.",
    "Quarantine malformed imports without aborting the whole file",
  ],
  [
    "public static Map<String,Long> acceptedTotals(List<String> rows)",
    `if(rows==null)throw new IllegalArgumentException();Map<String,Long> out=new TreeMap<>();for(String row:rows){Map.Entry<String,Integer> parsed;try{parsed=Main.parseRecord(row);}catch(IllegalArgumentException e){continue;}out.merge(parsed.getKey(),parsed.getValue().longValue(),Math::addExact);}return Collections.unmodifiableMap(out);`,
    `expect(Challenge.acceptedTotals(List.of(" a|2147483647","A|2","bad","b|0")).equals(Map.of("A",2147483649L,"B",0L)));`,
    "Implement acceptedTotals: skip malformed rows using the same parse contract, aggregate valid values in long with checked overflow, retain zero-valued IDs and return lexical immutable totals.",
    "Aggregate accepted rows without int overflow",
  ],
);
add(
  "hands-java-reliability:0",
  "Bounded retries and failure policies",
  [
    "public static <T> T retryTransient(Supplier<T> action,int attempts)",
    `if(action==null||attempts<1||attempts>10)throw new IllegalArgumentException();for(int i=1;;i++)try{return action.get();}catch(IllegalStateException e){if(i==attempts)throw e;}`,
    `AtomicInteger advN=new AtomicInteger();expect(Challenge.retryTransient(()->{if(advN.incrementAndGet()<2)throw new IllegalStateException();return "ok";},3).equals("ok")&&advN.get()==2);AtomicInteger advBad=new AtomicInteger();rejects(()->Challenge.retryTransient(()->{advBad.incrementAndGet();throw new IllegalArgumentException();},5));expect(advBad.get()==1);`,
    "Implement retryTransient: retry only IllegalStateException, at most attempts total invocations (1..10); return successful null values as successes and propagate other failures immediately.",
    "Retry transient failures without hiding invalid input",
  ],
  [
    "public static <T> List<T> resilientBatch(List<Supplier<T>> actions,int attempts)",
    `if(actions==null||actions.stream().anyMatch(Objects::isNull)||attempts<1||attempts>10)throw new IllegalArgumentException();List<T> out=new ArrayList<>();for(Supplier<T> action:List.copyOf(actions))out.add(retryTransient(action,attempts));return Collections.unmodifiableList(out);`,
    `AtomicInteger advN=new AtomicInteger();expect(Challenge.resilientBatch(List.<Supplier<String>>of(()->"a",()->{if(advN.incrementAndGet()==1)throw new IllegalStateException();return "b";}),2).equals(List.of("a","b"))&&advN.get()==2);`,
    "Implement resilientBatch: snapshot/validate suppliers before invoking any, then reuse retryTransient independently per action in order. Return immutable results (including null), stop on an exhausted failure and do not rerun earlier successes.",
    "Give each job its own retry budget",
  ],
);
add(
  "hands-java-capstone:2",
  "Security boundaries and safe diagnostics",
  [
    "public static String redactTokens(String text)",
    `if(text==null)throw new IllegalArgumentException();return text.replaceAll("(?i)(token|password|secret)=[^\\\\s]+","$1=[REDACTED]");`,
    `expect(Challenge.redactTokens("token=abc user=a PASSWORD=xyz").equals("token=[REDACTED] user=a PASSWORD=[REDACTED]"));expect(Challenge.redactTokens("safe").equals("safe"));`,
    "Implement redactTokens: case-insensitively redact non-whitespace values following token=, password= or secret= while preserving the original key casing and all unrelated text. Reject null.",
    "Keep credentials out of incident diagnostics",
  ],
  [
    "public static List<String> safeDiagnostics(List<String> lines,int maxLength)",
    `if(lines==null||maxLength<0||lines.stream().anyMatch(Objects::isNull))throw new IllegalArgumentException();List<String> out=new ArrayList<>();for(String line:lines){String safe=redactTokens(line);out.add(safe.substring(0,Math.min(safe.length(),maxLength)));}return List.copyOf(out);`,
    `expect(Challenge.safeDiagnostics(List.of("token=verylongsecret text", "ok"),5).equals(List.of("token","ok")));expect(Challenge.safeDiagnostics(List.of("secret=abc"),0).equals(List.of("")));`,
    "Implement safeDiagnostics: redact before truncating each line to at most maxLength UTF-16 characters. Preserve line order, reject nulls/negative length and return immutable strings; truncation must never expose part of a credential.",
    "Apply output limits after removing sensitive values",
  ],
);
