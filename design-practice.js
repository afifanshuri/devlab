import { make, javaProject } from "./exercise-factories.js?v=interactive-linux-1";
const contract = (source) => [source, source];
const type = (header, methods, fields = "") => [
  `${header} {\n${methods.map(([signature]) => `  ${signature} {\n    /* TODO */\n  }`).join("\n")}\n}\n`,
  `${header} {\n${fields}\n${methods.map(([signature, body]) => `  ${signature} {\n    ${body}\n  }`).join("\n")}\n}\n`,
];
function task(
  title,
  topic,
  mission,
  goal,
  requirements,
  sources,
  tests,
  concept,
  interview,
  example,
) {
  return {
    ...javaProject(
      title,
      concept,
      requirements,
      interview,
      sources,
      tests,
      "Start with the named public methods. Test the example, then the rejected and empty cases.",
    ),
    mission,
    goal,
    example,
    learn: [topic, "Contract-based tests", "Failure paths"],
    designTopic: topic,
  };
}
const solid = [
  task(
    "SRP: split a receipt into three jobs",
    "Single responsibility",
    "A customer buys two cables at 150 cents each and needs a receipt showing a total of 300 cents. Calculate the total, prepare the receipt text and deliver it once, keeping those jobs separate so changing the wording does not change the arithmetic.",
    "Implement ReceiptCalculator, ReceiptFormatter and ReceiptService so calculation, formatting and delivery have separate responsibilities.",
    "ReceiptCalculator.total(int quantity,long unitCents) rejects negatives with IllegalArgumentException and uses overflow-safe multiplication. ReceiptFormatter.format(long cents) rejects negatives and returns exactly Total: <cents> cents. ReceiptService(ReceiptCalculator,ReceiptFormatter,java.util.function.Consumer<String>) rejects null dependencies. issue(int,long) calculates, formats, delivers once and returns the text. Failed validation or overflow must deliver nothing. Use the injected components.",
    {
      "ReceiptService.java": type(
        "public class ReceiptService",
        [
          [
            "public ReceiptService(ReceiptCalculator calculator,ReceiptFormatter formatter,java.util.function.Consumer<String> delivery)",
            "if(calculator==null||formatter==null||delivery==null)throw new IllegalArgumentException();this.calculator=calculator;this.formatter=formatter;this.delivery=delivery;",
          ],
          [
            "public String issue(int quantity,long unitCents)",
            "String text=formatter.format(calculator.total(quantity,unitCents));delivery.accept(text);return text;",
          ],
        ],
        "  private final ReceiptCalculator calculator;\n  private final ReceiptFormatter formatter;\n  private final java.util.function.Consumer<String> delivery;",
      ),
      "ReceiptCalculator.java": type("public class ReceiptCalculator", [
        [
          "public long total(int quantity,long unitCents)",
          "if(quantity<0||unitCents<0)throw new IllegalArgumentException();return Math.multiplyExact((long)quantity,unitCents);",
        ],
      ]),
      "ReceiptFormatter.java": type("public class ReceiptFormatter", [
        [
          "public String format(long cents)",
          'if(cents<0)throw new IllegalArgumentException();return "Total: "+cents+" cents";',
        ],
      ]),
    },
    'List<String> sent=new ArrayList<>();ReceiptService s=new ReceiptService(new ReceiptCalculator(),new ReceiptFormatter(),sent::add);expect(s.issue(2,150).equals("Total: 300 cents"));expect(sent.equals(List.of("Total: 300 cents")));rejects(()->s.issue(-1,5));try{s.issue(2,Long.MAX_VALUE);throw new AssertionError();}catch(ArithmeticException e){}expect(sent.size()==1);ReceiptService injected=new ReceiptService(new ReceiptCalculator(){public long total(int q,long p){return 7;}},new ReceiptFormatter(){public String format(long c){return "custom:"+c;}},sent::add);expect(injected.issue(1,1).equals("custom:7"));rejects(()->new ReceiptService(null,new ReceiptFormatter(),sent::add));',
    "SRP separates reasons to change, not just methods into tiny classes. The service orchestrates; collaborators own calculation, representation and delivery.",
    "Which team or business change would affect each component? When would separating more classes add unnecessary ceremony?",
    'issue(2, 150) → "Total: 300 cents"; delivery receives that text once',
  ),
  task(
    "OCP: add a discount without editing checkout",
    "Open/closed",
    "The shop offers a ten-percent discount today and may accept a partner’s promotion tomorrow. Let checkout use whichever discount it is given, while refusing a discount that would increase the price or make the total negative.",
    "Implement DiscountCheckout and TenPercentOff against DiscountPolicy, so new policies work without changing checkout.",
    "DiscountPolicy.discount(long subtotal) returns the amount to subtract. DiscountCheckout(DiscountPolicy) rejects null. total(long subtotal) rejects negative subtotals, calls the policy once and subtracts its discount. Reject a policy result below zero or above subtotal with IllegalArgumentException. TenPercentOff returns subtotal/10 using integer division and rejects negative input. No policy-name branching in checkout.",
    {
      "DiscountCheckout.java": type(
        "public class DiscountCheckout",
        [
          [
            "public DiscountCheckout(DiscountPolicy policy)",
            "if(policy==null)throw new IllegalArgumentException();this.policy=policy;",
          ],
          [
            "public long total(long subtotal)",
            "if(subtotal<0)throw new IllegalArgumentException();long d=policy.discount(subtotal);if(d<0||d>subtotal)throw new IllegalArgumentException();return subtotal-d;",
          ],
        ],
        "  private final DiscountPolicy policy;",
      ),
      "DiscountPolicy.java": contract(
        "public interface DiscountPolicy { long discount(long subtotal); }\n",
      ),
      "TenPercentOff.java": type(
        "public class TenPercentOff implements DiscountPolicy",
        [
          [
            "public long discount(long subtotal)",
            "if(subtotal<0)throw new IllegalArgumentException();return subtotal/10;",
          ],
        ],
      ),
    },
    "expect(new DiscountCheckout(new TenPercentOff()).total(999)==900);AtomicInteger n=new AtomicInteger();expect(new DiscountCheckout(s->{n.incrementAndGet();return 37;}).total(100)==63&&n.get()==1);expect(new DiscountCheckout(s->s).total(100)==0);rejects(()->new DiscountCheckout(s->101).total(100));rejects(()->new DiscountCheckout(s->-1).total(100));rejects(()->new DiscountCheckout(null));rejects(()->new DiscountCheckout(new TenPercentOff()).total(-1));",
    "OCP uses a stable extension point for expected variation. It does not mean existing code can never change.",
    "Why is a policy-name switch less extensible here? When is a simple conditional still the clearer choice?",
    "TenPercentOff: subtotal 999 → discount 99 → total 900",
  ),
  task(
    "LSP: do not promise withdrawals you cannot honour",
    "Liskov substitution",
    "Customers can inspect both spending and locked savings balances, but only a spending account permits withdrawals. Let the payment service use an account that genuinely supports payment, without asking locked savings to pretend it can withdraw money.",
    "Implement separate BalanceView and WithdrawableAccount contracts, then make PaymentService depend only on withdrawal capability.",
    "BalanceView.balance() returns long cents. WithdrawableAccount extends BalanceView and declares withdraw(long). SpendingAccount(long) implements WithdrawableAccount: reject negative initial balance and nonpositive withdrawals with IllegalArgumentException; insufficient funds throw IllegalStateException without mutation. LockedBalance(long) implements BalanceView only and rejects negative initial balance. PaymentService.pay(WithdrawableAccount,long) rejects null and delegates exactly once. LockedBalance must not implement WithdrawableAccount.",
    {
      "PaymentService.java": type("public class PaymentService", [
        [
          "public void pay(WithdrawableAccount account,long cents)",
          "if(account==null)throw new IllegalArgumentException();account.withdraw(cents);",
        ],
      ]),
      "BalanceView.java": contract(
        "public interface BalanceView { long balance(); }\n",
      ),
      "WithdrawableAccount.java": contract(
        "public interface WithdrawableAccount extends BalanceView { void withdraw(long cents); }\n",
      ),
      "SpendingAccount.java": type(
        "public class SpendingAccount implements WithdrawableAccount",
        [
          [
            "public SpendingAccount(long initial)",
            "if(initial<0)throw new IllegalArgumentException();balance=initial;",
          ],
          ["public long balance()", "return balance;"],
          [
            "public void withdraw(long cents)",
            "if(cents<=0)throw new IllegalArgumentException();if(cents>balance)throw new IllegalStateException();balance-=cents;",
          ],
        ],
        "  private long balance;",
      ),
      "LockedBalance.java": type(
        "public class LockedBalance implements BalanceView",
        [
          [
            "public LockedBalance(long initial)",
            "if(initial<0)throw new IllegalArgumentException();balance=initial;",
          ],
          ["public long balance()", "return balance;"],
        ],
        "  private final long balance;",
      ),
    },
    "SpendingAccount a=new SpendingAccount(100);PaymentService p=new PaymentService();p.pay(a,40);expect(a.balance()==60);try{p.pay(a,61);throw new AssertionError();}catch(IllegalStateException e){}expect(a.balance()==60);BalanceView locked=new LockedBalance(80);expect(locked.balance()==80&&!WithdrawableAccount.class.isInstance(locked));AtomicLong paid=new AtomicLong();p.pay(new WithdrawableAccount(){public long balance(){return 1000;}public void withdraw(long c){paid.addAndGet(c);}},17);expect(paid.get()==17);rejects(()->p.pay(null,1));rejects(()->a.withdraw(0));rejects(()->new LockedBalance(-1));",
    "LSP requires implementations to honour the promises of their abstraction. Separate capabilities when a type cannot meet a behavioural contract; inheritance alone is not reuse.",
    "How can stronger preconditions or unsupported operations break substitution? Is splitting the interface a better model than catching an exception?",
    "SpendingAccount(100), pay 40 → balance 60; LockedBalance exposes balance only",
  ),
  task(
    "ISP: a printer should not pretend to scan",
    "Interface segregation",
    "The counter has a basic printer and the workshop has a scanner. Let a receipt job use just the printer, and let a copy job scan one page then print that result, without requiring either device to offer a capability it does not have.",
    "Implement narrow Printer and ScannerDevice interfaces and workflows that request only the capabilities they use.",
    "Printer.print(String) returns void; ScannerDevice.scan() returns String. PrintDesk.receipt(Printer,String) rejects null printer and null/blank text before printing once. CopyDesk.copy(ScannerDevice,Printer) rejects null dependencies, scans once, rejects null/blank scanned text with IllegalArgumentException, then prints it once unchanged. Do not add scan to Printer or print to ScannerDevice.",
    {
      "PrintDesk.java": type("public class PrintDesk", [
        [
          "public void receipt(Printer printer,String text)",
          "if(printer==null||text==null||text.isBlank())throw new IllegalArgumentException();printer.print(text);",
        ],
      ]),
      "Printer.java": contract(
        "public interface Printer { void print(String text); }\n",
      ),
      "ScannerDevice.java": contract(
        "public interface ScannerDevice { String scan(); }\n",
      ),
      "CopyDesk.java": type("public class CopyDesk", [
        [
          "public void copy(ScannerDevice scanner,Printer printer)",
          "if(scanner==null||printer==null)throw new IllegalArgumentException();String text=scanner.scan();if(text==null||text.isBlank())throw new IllegalArgumentException();printer.print(text);",
        ],
      ]),
    },
    'List<String> pages=new ArrayList<>();Printer p=pages::add;new PrintDesk().receipt(p,"receipt");AtomicInteger scans=new AtomicInteger();new CopyDesk().copy(()->{scans.incrementAndGet();return "copy";},p);expect(pages.equals(List.of("receipt","copy"))&&scans.get()==1);rejects(()->new CopyDesk().copy(()->" ",p));expect(pages.size()==2);rejects(()->new PrintDesk().receipt(p,""));expect(Printer.class.getDeclaredMethods().length==1&&ScannerDevice.class.getDeclaredMethods().length==1);',
    "ISP designs contracts around clients, so a client does not depend on methods it never uses. It is not a rule to create one interface for every method.",
    "Which dependencies would a giant multifunction-device interface force onto a print-only caller?",
    "receipt prints once; copy scans once and prints once; a blank scan prints nothing",
  ),
  task(
    "DIP: fetch a customer only after authorization",
    "Dependency inversion",
    "A customer asks the support portal for their profile. Check whether that user is allowed to see it before looking it up, and return the fetched profile only when access is allowed; denied requests must not touch storage.",
    "Implement ProfileService using injected AccessPolicy and CustomerRepository contracts, with authorization before lookup.",
    "AccessPolicy.allowed(String user,long id) returns boolean; CustomerRepository.find(long id) returns String. ProfileService(AccessPolicy,CustomerRepository) rejects null dependencies. load(String user,long id) rejects null/blank user and id<=0 with IllegalArgumentException; trim user before authorization. Denied access throws SecurityException and must not call the repository. Allowed access calls find once and returns its result unchanged. Propagate repository exceptions without retry.",
    {
      "ProfileService.java": type(
        "public class ProfileService",
        [
          [
            "public ProfileService(AccessPolicy policy,CustomerRepository repository)",
            "if(policy==null||repository==null)throw new IllegalArgumentException();this.policy=policy;this.repository=repository;",
          ],
          [
            "public String load(String user,long id)",
            "if(user==null||user.isBlank()||id<=0)throw new IllegalArgumentException();if(!policy.allowed(user.trim(),id))throw new SecurityException();return repository.find(id);",
          ],
        ],
        "  private final AccessPolicy policy;\n  private final CustomerRepository repository;",
      ),
      "AccessPolicy.java": contract(
        "public interface AccessPolicy { boolean allowed(String user,long id); }\n",
      ),
      "CustomerRepository.java": contract(
        "public interface CustomerRepository { String find(long id); }\n",
      ),
    },
    'List<String> order=new ArrayList<>();ProfileService s=new ProfileService((u,id)->{order.add("auth:"+u);return id==7;},id->{order.add("find:"+id);return "customer:"+id;});expect(s.load(" Maya ",7).equals("customer:7"));expect(order.equals(List.of("auth:Maya","find:7")));order.clear();try{s.load("Maya",8);throw new AssertionError();}catch(SecurityException e){}expect(order.equals(List.of("auth:Maya")));rejects(()->s.load(" ",7));rejects(()->s.load("x",0));RuntimeException failure=new IllegalStateException();try{new ProfileService((u,id)->true,id->{throw failure;}).load("x",1);throw new AssertionError();}catch(RuntimeException e){expect(e==failure);}',
    "DIP keeps business policy dependent on abstractions rather than concrete infrastructure. Constructor injection is one technique for providing implementations.",
    "How does dependency inversion differ from simply moving a database call into another class? Where should transaction boundaries live?",
    'load(" Maya ", 7): authorize "Maya", then find 7; denied request: no find call',
  ),
];
const patterns = [
  task(
    "Template Method: fix the import workflow",
    "Template Method",
    "Two partners send repair-ticket imports with different text conventions. Give both imports the same validation and completion steps, while letting each partner change how valid text is transformed; invalid input must never reach that transformation.",
    "Implement a final ImportJob.run template and two subclasses that customize only transformation.",
    "ImportJob is abstract. public final String run(String raw) rejects null/blank input, trims it, calls protected abstract String transform(String value) once, and returns imported:<result>. UpperImport transforms using Locale.ROOT uppercase; LowerImport uses Locale.ROOT lowercase. Subclasses extend ImportJob. Invalid input must not reach transform.",
    {
      "ImportJob.java": [
        `public abstract class ImportJob {\n  public final String run(String raw) { /* TODO */ }\n  protected abstract String transform(String value);\n}\n`,
        'public abstract class ImportJob { public final String run(String raw){if(raw==null||raw.isBlank())throw new IllegalArgumentException();return "imported:"+transform(raw.trim());}protected abstract String transform(String value); }\n',
      ],
      "UpperImport.java": type("public class UpperImport extends ImportJob", [
        [
          "protected String transform(String value)",
          "return value.toUpperCase(java.util.Locale.ROOT);",
        ],
      ]),
      "LowerImport.java": type("public class LowerImport extends ImportJob", [
        [
          "protected String transform(String value)",
          "return value.toLowerCase(java.util.Locale.ROOT);",
        ],
      ]),
    },
    'expect(new UpperImport().run(" abc ").equals("imported:ABC"));expect(new LowerImport().run(" AbC ").equals("imported:abc"));AtomicInteger n=new AtomicInteger();ImportJob custom=new ImportJob(){protected String transform(String s){n.incrementAndGet();return "["+s+"]";}};rejects(()->custom.run(" "));expect(n.get()==0);expect(custom.run(" x ").equals("imported:[x]")&&n.get()==1);expect(java.lang.reflect.Modifier.isFinal(ImportJob.class.getMethod("run",String.class).getModifiers()));',
    "Template Method fixes an algorithm’s order in a base class and exposes selected steps. Strategy instead delegates variation to another object.",
    "Why make run final? When would composition avoid an awkward inheritance hierarchy?",
    'UpperImport.run(" abc ") → "imported:ABC"',
  ),
  task(
    "Chain of Responsibility: explain the first rejection",
    "Chain of Responsibility",
    "A parts order must request a positive quantity and stay within the available stock. Check those rules in order, return the first rejection reason, and do not run later checks after an order has already been rejected.",
    "Implement linked Rule objects that stop at the first failure and forward valid requests to the next rule.",
    "Rule.check(int quantity,int stock) returns a String. QuantityRule(Rule next) returns invalid quantity for quantity<=0; otherwise delegates, or returns ok with null next. StockRule(Rule next) returns insufficient stock when quantity>stock, otherwise delegates or returns ok. Implement both against Rule. The chain in this exercise is QuantityRule followed by StockRule. Later rules must not be invoked after rejection; chain construction is acyclic.",
    {
      "QuantityRule.java": type(
        "public class QuantityRule implements Rule",
        [
          ["public QuantityRule(Rule next)", "this.next=next;"],
          [
            "public String check(int quantity,int stock)",
            'if(quantity<=0)return "invalid quantity";return next==null?"ok":next.check(quantity,stock);',
          ],
        ],
        "  private final Rule next;",
      ),
      "Rule.java": contract(
        "public interface Rule { String check(int quantity,int stock); }\n",
      ),
      "StockRule.java": type(
        "public class StockRule implements Rule",
        [
          ["public StockRule(Rule next)", "this.next=next;"],
          [
            "public String check(int quantity,int stock)",
            'if(quantity>stock)return "insufficient stock";return next==null?"ok":next.check(quantity,stock);',
          ],
        ],
        "  private final Rule next;",
      ),
    },
    'Rule chain=new QuantityRule(new StockRule(null));expect(chain.check(0,0).equals("invalid quantity"));expect(chain.check(6,5).equals("insufficient stock"));expect(chain.check(5,5).equals("ok"));AtomicInteger tail=new AtomicInteger();Rule r=new QuantityRule(new StockRule((q,s)->{tail.incrementAndGet();return "tail";}));expect(r.check(-1,5).equals("invalid quantity")&&tail.get()==0);expect(r.check(6,5).equals("insufficient stock")&&tail.get()==0);expect(r.check(1,5).equals("tail")&&tail.get()==1);',
    "A chain gives each handler the chance to reject, handle or forward. Order is part of its business contract and should be tested explicitly.",
    "How does a chain differ from broadcasting events to all observers? What if a handler accidentally forwards twice?",
    "quantity 0 → invalid quantity; quantity 6 with stock 5 → insufficient stock",
  ),
  task(
    "Composite: count a nested evidence bundle",
    "Composite",
    "An incident evidence bundle contains files and folders inside other folders. Report the total size of the whole bundle, including every nested file, while allowing an empty folder to contribute zero.",
    "Implement FileItem and BundleFolder through SizedItem so a client can total nested bundles uniformly.",
    "SizedItem.bytes() returns long. FileItem(long bytes) rejects negative values. BundleFolder(List<SizedItem> children) rejects null list or null entries with IllegalArgumentException and takes an independent copy. bytes() sums child bytes recursively using overflow-safe addition. An empty folder is zero. Supplied trees are acyclic; no names or real filesystem access are required.",
    {
      "BundleFolder.java": type(
        "public class BundleFolder implements SizedItem",
        [
          [
            "public BundleFolder(java.util.List<SizedItem> children)",
            "if(children==null||children.stream().anyMatch(java.util.Objects::isNull))throw new IllegalArgumentException();this.children=java.util.List.copyOf(children);",
          ],
          [
            "public long bytes()",
            "long total=0;for(SizedItem child:children)total=Math.addExact(total,child.bytes());return total;",
          ],
        ],
        "  private final java.util.List<SizedItem> children;",
      ),
      "SizedItem.java": contract(
        "public interface SizedItem { long bytes(); }\n",
      ),
      "FileItem.java": type(
        "public class FileItem implements SizedItem",
        [
          [
            "public FileItem(long bytes)",
            "if(bytes<0)throw new IllegalArgumentException();this.bytes=bytes;",
          ],
          ["public long bytes()", "return bytes;"],
        ],
        "  private final long bytes;",
      ),
    },
    "List<SizedItem> source=new ArrayList<>(List.of(new FileItem(5),new BundleFolder(List.of(new FileItem(7),new FileItem(3)))));SizedItem folder=new BundleFolder(source);source.clear();expect(folder.bytes()==15&&new BundleFolder(List.of()).bytes()==0);rejects(()->new FileItem(-1));rejects(()->new BundleFolder(null));rejects(()->new BundleFolder(Arrays.asList((SizedItem)null)));try{new BundleFolder(List.of(new FileItem(Long.MAX_VALUE),new FileItem(1))).bytes();throw new AssertionError();}catch(ArithmeticException e){}",
    "Composite gives leaves and containers one contract. Containers delegate recursively, allowing clients to treat a whole tree as one component.",
    "When would a tree model be unsuitable? How would you detect cycles if the structure were mutable?",
    "Folder(File(5), Folder(File(7), File(3))) → 15 bytes",
  ),
  task(
    "Proxy: protect access even when data is cached",
    "Protection and caching proxy",
    "A profile lookup is expensive, so the portal remembers successful results. Check permission every time a user asks, including when a result is already remembered, and let a later request retry a lookup that previously failed.",
    "Implement ProfileProxy so it authorizes every read and caches only successful repository results.",
    "ReadPolicy.allowed(String user,long id) returns boolean; ProfileStore.fetch(long id) returns String. ProfileProxy(ReadPolicy,ProfileStore) rejects null dependencies. get(String user,long id) validates nonblank user and positive id, trims user, then authorizes on every call before checking a cache keyed by id. Denial throws SecurityException without fetching or returning cached data. Authorized repeated IDs reuse successful results, including null. Exceptions must propagate and not be cached. Single-threaded; no eviction required.",
    {
      "ProfileProxy.java": type(
        "public class ProfileProxy",
        [
          [
            "public ProfileProxy(ReadPolicy policy,ProfileStore store)",
            "if(policy==null||store==null)throw new IllegalArgumentException();this.policy=policy;this.store=store;",
          ],
          [
            "public String get(String user,long id)",
            "if(user==null||user.isBlank()||id<=0)throw new IllegalArgumentException();if(!policy.allowed(user.trim(),id))throw new SecurityException();if(cache.containsKey(id))return cache.get(id);String value=store.fetch(id);cache.put(id,value);return value;",
          ],
        ],
        "  private final ReadPolicy policy;\n  private final ProfileStore store;\n  private final java.util.Map<Long,String> cache=new java.util.HashMap<>();",
      ),
      "ReadPolicy.java": contract(
        "public interface ReadPolicy { boolean allowed(String user,long id); }\n",
      ),
      "ProfileStore.java": contract(
        "public interface ProfileStore { String fetch(long id); }\n",
      ),
    },
    'AtomicInteger auth=new AtomicInteger(),reads=new AtomicInteger();ProfileProxy p=new ProfileProxy((u,id)->{auth.incrementAndGet();return u.equals("owner");},id->{reads.incrementAndGet();return id==2?null:"P"+id;});expect(p.get(" owner ",1).equals("P1")&&p.get("owner",1).equals("P1"));try{p.get("stranger",1);throw new AssertionError();}catch(SecurityException e){}expect(reads.get()==1&&auth.get()==3);expect(p.get("owner",2)==null&&p.get("owner",2)==null&&reads.get()==2);AtomicInteger retry=new AtomicInteger();ProfileProxy unstable=new ProfileProxy((u,id)->true,id->{if(retry.incrementAndGet()==1)throw new IllegalStateException();return "ok";});try{unstable.get("u",1);throw new AssertionError();}catch(IllegalStateException e){}expect(unstable.get("u",1).equals("ok")&&retry.get()==2);rejects(()->p.get(" ",1));',
    "A proxy controls access to another object through a similar interface. Authorization must precede cache reads; caching does not remove access-control obligations.",
    "Compare Proxy, Adapter and Decorator. What changes with concurrent reads, per-user data, TTLs or stale permissions?",
    "owner reads ID 1 twice → one fetch; stranger reads cached ID 1 → denied",
  ),
  task(
    "State: an order that changes what it accepts",
    "State",
    "An order begins as a draft, becomes paid after payment, then becomes shipped after dispatch. Let each stage accept only its permitted next action, and leave the order unchanged when someone repeats payment or tries to ship too early.",
    "Implement OrderContext and concrete OrderState classes so each state owns its legal next event.",
    'OrderState has name() and next(String event). DraftState.name() returns draft; next("pay") returns PaidState. PaidState.name() returns paid; next("ship") returns ShippedState. ShippedState.name() returns shipped and accepts no event. All other events, including null, throw IllegalArgumentException. OrderContext(OrderState) rejects null; state() returns the current name; apply(String) replaces state only after next succeeds. No enum or event switch in OrderContext; delegate to the state.',
    {
      "OrderContext.java": type(
        "public class OrderContext",
        [
          [
            "public OrderContext(OrderState state)",
            "if(state==null)throw new IllegalArgumentException();this.state=state;",
          ],
          ["public String state()", "return state.name();"],
          ["public void apply(String event)", "state=state.next(event);"],
        ],
        "  private OrderState state;",
      ),
      "OrderState.java": contract(
        "public interface OrderState { String name(); OrderState next(String event); }\n",
      ),
      "DraftState.java": type("public class DraftState implements OrderState", [
        ["public String name()", 'return "draft";'],
        [
          "public OrderState next(String event)",
          'if(!"pay".equals(event))throw new IllegalArgumentException();return new PaidState();',
        ],
      ]),
      "PaidState.java": type("public class PaidState implements OrderState", [
        ["public String name()", 'return "paid";'],
        [
          "public OrderState next(String event)",
          'if(!"ship".equals(event))throw new IllegalArgumentException();return new ShippedState();',
        ],
      ]),
      "ShippedState.java": type(
        "public class ShippedState implements OrderState",
        [
          ["public String name()", 'return "shipped";'],
          [
            "public OrderState next(String event)",
            "throw new IllegalArgumentException();",
          ],
        ],
      ),
    },
    'OrderContext c=new OrderContext(new DraftState());rejects(()->c.apply("ship"));expect(c.state().equals("draft"));c.apply("pay");expect(c.state().equals("paid"));rejects(()->c.apply("pay"));expect(c.state().equals("paid"));c.apply("ship");expect(c.state().equals("shipped"));rejects(()->c.apply(null));rejects(()->c.apply("pay"));expect(c.state().equals("shipped"));OrderContext custom=new OrderContext(new OrderState(){public String name(){return "custom";}public OrderState next(String e){return new PaidState();}});custom.apply("go");expect(custom.state().equals("paid"));rejects(()->new OrderContext(null));',
    "State moves state-dependent behavior into objects. The context delegates rather than growing a large conditional; compare the simpler enum approach from the OOP chapter.",
    "When are enum transitions clearer than separate state classes? Which operations must remain atomic in a concurrent service?",
    "draft → pay → paid → ship → shipped; invalid events leave the current state unchanged",
  ),
  task(
    "Memento: restore yesterday’s draft without aliasing",
    "Memento",
    "A support engineer saves a draft before adding a mistaken note. Let them restore the saved version, and keep that saved copy unchanged by any further editing in this or another draft.",
    "Implement DraftPad with immutable Snapshot mementos and independent restore behaviour.",
    "DraftPad.add(String) trims and rejects null/blank notes. notes() returns an immutable independent List<String>. save() returns Snapshot(List<String> notes), a public record with a defensive immutable copy. Snapshot rejects null lists with IllegalArgumentException; null elements may throw NullPointerException. restore(Snapshot) rejects null and replaces editor content with an independent mutable copy of the snapshot. Different pads can restore the same snapshot without sharing future edits.",
    {
      "DraftPad.java": type(
        "public class DraftPad",
        [
          [
            "public void add(String note)",
            "if(note==null||note.isBlank())throw new IllegalArgumentException();notes.add(note.trim());",
          ],
          [
            "public java.util.List<String> notes()",
            "return java.util.List.copyOf(notes);",
          ],
          ["public Snapshot save()", "return new Snapshot(notes);"],
          [
            "public void restore(Snapshot snapshot)",
            "if(snapshot==null)throw new IllegalArgumentException();notes=new java.util.ArrayList<>(snapshot.notes());",
          ],
        ],
        "  private java.util.List<String> notes=new java.util.ArrayList<>();",
      ),
      "Snapshot.java": [
        'public record Snapshot(java.util.List<String> notes) {\n  public Snapshot { /* TODO */ }\n}\n',
        "public record Snapshot(java.util.List<String> notes) { public Snapshot { if(notes==null)throw new IllegalArgumentException();notes=java.util.List.copyOf(notes); } }\n",
      ],
    },
    'DraftPad p=new DraftPad();p.add(" first ");Snapshot saved=p.save();p.add("mistake");p.restore(saved);expect(p.notes().equals(List.of("first")));p.add("second");expect(saved.notes().equals(List.of("first")));DraftPad other=new DraftPad();other.restore(saved);other.add("other");expect(p.notes().equals(List.of("first","second")));try{saved.notes().add("x");throw new AssertionError();}catch(UnsupportedOperationException e){}List<String> original=new ArrayList<>(List.of("a"));Snapshot s=new Snapshot(original);original.clear();expect(s.notes().equals(List.of("a")));rejects(()->p.restore(null));rejects(()->p.add(" "));',
    "Memento captures state for later restoration without giving callers mutable access to the originator’s internals. Snapshots cost memory; persistent undo may need a different representation.",
    "Compare snapshot restoration with the earlier Command undo exercise. What breaks if snapshots retain aliases to mutable lists?",
    "save [first], add mistake, restore → [first]; later edits do not change the saved snapshot",
  ),
  task(
    "Abstract Factory: keep notification parts compatible",
    "Abstract Factory",
    "The shop sends collection notices by email or SMS, and each channel needs matching wording and delivery. Select both parts together so an email notice stays on the email path, while allowing another channel to be added later.",
    "Implement channel factories and NoticeService so it formats and sends using components from the same NoticeFactory.",
    "NoticeFormatter.format(String) returns String; NoticeSender.send(String) returns String; NoticeFactory.formatter() and sender() supply those contracts. EmailFactory supplies formatting email:<body> and sending email-sent:<formatted>. SmsFactory uses sms: and sms-sent: respectively. NoticeService(NoticeFactory) rejects null factory; notify(String) rejects null/blank body, trims it, formats once then sends once, returning the send result. It must also work with a custom factory without testing concrete factory types.",
    {
      "NoticeService.java": type(
        "public class NoticeService",
        [
          [
            "public NoticeService(NoticeFactory factory)",
            "if(factory==null)throw new IllegalArgumentException();this.factory=factory;",
          ],
          [
            "public String notify(String body)",
            "if(body==null||body.isBlank())throw new IllegalArgumentException();String formatted=factory.formatter().format(body.trim());return factory.sender().send(formatted);",
          ],
        ],
        "  private final NoticeFactory factory;",
      ),
      "NoticeFormatter.java": contract(
        "public interface NoticeFormatter { String format(String body); }\n",
      ),
      "NoticeSender.java": contract(
        "public interface NoticeSender { String send(String formatted); }\n",
      ),
      "NoticeFactory.java": contract(
        "public interface NoticeFactory { NoticeFormatter formatter(); NoticeSender sender(); }\n",
      ),
      "EmailFactory.java": type(
        "public class EmailFactory implements NoticeFactory",
        [
          ["public NoticeFormatter formatter()", 'return body->"email:"+body;'],
          ["public NoticeSender sender()", 'return text->"email-sent:"+text;'],
        ],
      ),
      "SmsFactory.java": type(
        "public class SmsFactory implements NoticeFactory",
        [
          ["public NoticeFormatter formatter()", 'return body->"sms:"+body;'],
          ["public NoticeSender sender()", 'return text->"sms-sent:"+text;'],
        ],
      ),
    },
    'expect(new NoticeService(new EmailFactory()).notify(" ready ").equals("email-sent:email:ready"));expect(new NoticeService(new SmsFactory()).notify("ready").equals("sms-sent:sms:ready"));List<String> order=new ArrayList<>();NoticeFactory custom=new NoticeFactory(){public NoticeFormatter formatter(){return body->{order.add("format");return "["+body+"]";};}public NoticeSender sender(){return text->{order.add("send");return text;};}};NoticeService s=new NoticeService(custom);expect(s.notify(" x ").equals("[x]")&&order.equals(List.of("format","send")));order.clear();rejects(()->s.notify(" "));expect(order.isEmpty());rejects(()->new NoticeService(null));',
    "Abstract Factory supplies a family of related products. A Simple Factory chooses one product; Factory Method allows a subclass to customize creation. Keep those distinctions clear.",
    "When is a factory family useful, and when would injecting a formatter and sender directly be simpler?",
    "EmailFactory + ready → email-sent:email:ready; SmsFactory + ready → sms-sent:sms:ready",
  ),
];
export const solidPractice = make(
  "java-solid-workshop",
  "java",
  "SOLID: refactor the service desk",
  "Separate changing responsibilities, extend through contracts, and test substitutability and dependency boundaries.",
  ["SRP", "OCP", "LSP", "ISP", "DIP"],
  solid,
);
export const advancedPatterns = make(
  "java-patterns-advanced",
  "java",
  "Design patterns: grow the architecture",
  "Add workflows, validation chains, trees, proxies, state objects, snapshots and compatible product families.",
  [
    "Template Method",
    "Chain",
    "Composite",
    "Proxy",
    "State",
    "Memento",
    "Abstract Factory",
  ],
  patterns,
);
solidPractice.minutes = 100;
advancedPatterns.minutes = 140;
advancedPatterns.lessons.forEach((l, i) => {
  l.reuseNote =
    i === 0
      ? "Build on the earlier Strategy and inheritance exercises; compare delegated variation with an inheritance-based template."
      : "Reuse the OOP, collection and contract-testing techniques from earlier chapters. Starters contain signatures only.";
});
