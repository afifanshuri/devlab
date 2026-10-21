import { javaProject, make } from "./exercise-factories.js";
const todo = 'throw new UnsupportedOperationException("Implement this task");';
function spring(
  title,
  topic,
  mission,
  goal,
  example,
  sources,
  tests,
  fixture = {},
) {
  const lesson = javaProject(
    title,
    topic,
    goal,
    "Explain where Spring supplies infrastructure and where your own domain rules belong. How would you test failures without starting a production server?",
    sources,
    tests,
    "Use the real Spring APIs available in /opt/spring/lib. Keep constructor dependencies explicit and put business rules outside controllers.",
  );
  lesson.verify = lesson.verify.replace(
    "import java.util.*;",
    "import lab.*; import java.util.*;",
  );
  return {
    ...lesson,
    framework: "spring",
    mission,
    goal,
    example,
    files: fixture,
    roadmapTopics: [topic],
    learn: [topic, "Real framework tests", "Failure cases"],
  };
}
const boot = (imports, annotations = "") => `package lab;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
@SpringBootConfiguration @EnableAutoConfiguration @Import({${imports}}) ${annotations}
public class LabApplication { }
`;
const context = `new org.springframework.boot.builder.SpringApplicationBuilder(LabApplication.class).web(org.springframework.boot.WebApplicationType.NONE).properties("spring.main.banner-mode=off","logging.level.root=ERROR","spring.datasource.url=jdbc:h2:mem:lab;DB_CLOSE_DELAY=-1","spring.jpa.hibernate.ddl-auto=create-drop").run()`;
export const springCourses = [
  make(
    "java-spring-core",
    "java",
    "Spring · Dependencies and configuration",
    "Apply SOLID using actual Spring containers, bean scopes, configuration properties and profiles.",
    ["IoC", "Constructor injection", "Bean scopes", "Spring Boot", "Profiles"],
    [
      spring(
        "Wire the checkout, not the implementation",
        "IoC and constructor injection",
        "A repair shop has two payment providers. Checkout must accept whichever provider is configured, while tests can replace it with a fake. Let Spring assemble the objects instead of hiding a new provider inside checkout.",
        "Implement Checkout with constructor injection of PaymentGateway and pay(int cents). Reject nonpositive amounts with IllegalArgumentException and otherwise return gateway.charge(cents). Implement ShopConfig as a Spring @Configuration with gateway() and checkout(PaymentGateway) @Bean methods; the default gateway returns paid:<cents>.",
        "pay(250) → paid:250; a test gateway returning fake:250 must be used unchanged; pay(0) is rejected.",
        {
          "Checkout.java": [
            `package lab;\npublic class Checkout {\n  public Checkout(PaymentGateway gateway) { ${todo} }\n  public String pay(int cents) { ${todo} }\n}\n`,
            `package lab;\npublic class Checkout { private final PaymentGateway gateway; public Checkout(PaymentGateway gateway){this.gateway=gateway;} public String pay(int cents){if(cents<=0)throw new IllegalArgumentException();return gateway.charge(cents);} }`,
          ],
          "PaymentGateway.java": [
            "package lab;\npublic interface PaymentGateway { String charge(int cents); }",
            "package lab;\npublic interface PaymentGateway { String charge(int cents); }",
          ],
          "ShopConfig.java": [
            `package lab;\nimport org.springframework.context.annotation.*;\npublic class ShopConfig {\n public PaymentGateway gateway(){ ${todo} }\n public Checkout checkout(PaymentGateway gateway){ ${todo} }\n}`,
            `package lab; import org.springframework.context.annotation.*; @Configuration public class ShopConfig { @Bean public PaymentGateway gateway(){return cents->"paid:"+cents;} @Bean public Checkout checkout(PaymentGateway gateway){return new Checkout(gateway);} }`,
          ],
        },
        `try(var c=new org.springframework.context.annotation.AnnotationConfigApplicationContext(ShopConfig.class)){expect(c.getBean(Checkout.class).pay(250).equals("paid:250"));expect(c.getBean(Checkout.class)==c.getBean(Checkout.class));} Checkout fake=new Checkout(n->"fake:"+n); expect(fake.pay(75).equals("fake:75")); rejects(()->fake.pay(0)); rejects(()->fake.pay(-1));`,
      ),
      spring(
        "Separate shared configuration from request state",
        "Bean scopes",
        "A shared counter helps operations track the service, but each draft booking needs fresh state. Accidentally sharing the draft lets one customer's changes affect another customer.",
        "Annotate ScopeConfig as configuration. Register counter() as a singleton AtomicInteger starting at zero, and draft() as a prototype StringBuilder starting empty. Use bean names counter and draft; repeated counter lookups share changes while draft lookups are independent.",
        "Increment one counter → next lookup sees 1; append to one draft → another draft remains empty.",
        {
          "ScopeConfig.java": [
            `package lab;\nimport org.springframework.context.annotation.*;\nimport java.util.concurrent.atomic.AtomicInteger;\npublic class ScopeConfig {\n public AtomicInteger counter(){ ${todo} }\n public StringBuilder draft(){ ${todo} }\n}`,
            `package lab; import org.springframework.context.annotation.*; import java.util.concurrent.atomic.AtomicInteger; @Configuration public class ScopeConfig { @Bean public AtomicInteger counter(){return new AtomicInteger();} @Bean @Scope("prototype") public StringBuilder draft(){return new StringBuilder();} }`,
          ],
        },
        `try(var c=new org.springframework.context.annotation.AnnotationConfigApplicationContext(ScopeConfig.class)){var a=c.getBean("counter",AtomicInteger.class);a.incrementAndGet();expect(c.getBean("counter")==a);expect(c.getBean("counter",AtomicInteger.class).get()==1);var d=c.getBean("draft",StringBuilder.class);d.append("A");expect(c.getBean("draft")!=d);expect(c.getBean("draft",StringBuilder.class).isEmpty());}`,
      ),
      spring(
        "Move deployment settings out of code",
        "Spring Boot configuration properties",
        "The same booking service runs in a demo shop and a live shop. Operations needs to change the shop name and booking limit without editing Java or recompiling the application.",
        "Turn ShopSettings into a @ConfigurationProperties record with prefix shop, fields name and dailyLimit. Implement SettingsConfig to enable that record. Spring must bind shop.name and shop.daily-limit from the environment; do not hard-code their values.",
        "shop.name=North and shop.daily-limit=12 → ShopSettings(name=North, dailyLimit=12); another context can bind South and 3.",
        {
          "ShopSettings.java": [
            "package lab;\npublic record ShopSettings(String name, int dailyLimit) { }",
            'package lab; import org.springframework.boot.context.properties.ConfigurationProperties; @ConfigurationProperties(prefix="shop") public record ShopSettings(String name,int dailyLimit){}',
          ],
          "SettingsConfig.java": [
            "package lab;\npublic class SettingsConfig { /* Enable ShopSettings binding. */ }",
            "package lab; import org.springframework.context.annotation.Configuration; import org.springframework.boot.context.properties.EnableConfigurationProperties; @Configuration @EnableConfigurationProperties(ShopSettings.class) public class SettingsConfig{}",
          ],
        },
        `for(String[] pair:new String[][]{{"North","12"},{"South","3"}}){try(var c=new org.springframework.context.annotation.AnnotationConfigApplicationContext()){c.getEnvironment().getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource("test",Map.of("shop.name",pair[0],"shop.daily-limit",pair[1])));c.register(SettingsConfig.class);c.refresh();var s=c.getBean(ShopSettings.class);expect(s.name().equals(pair[0]));expect(s.dailyLimit()==Integer.parseInt(pair[1]));}}`,
      ),
      spring(
        "Choose the right notification adapter",
        "Profiles and bean selection",
        "Demo bookings must never send a live notification. Production needs a different adapter, selected by deployment configuration rather than an if statement scattered through the business code.",
        "Implement ProfileConfig with one String bean named delivery under profile demo returning console, and one under profile production returning email. With either profile active, Spring must expose exactly one String bean; with neither active, none.",
        "demo → console; production → email; no profile → no delivery bean.",
        {
          "ProfileConfig.java": [
            "package lab;\npublic class ProfileConfig { /* Configure profile-specific delivery beans. */ }",
            'package lab; import org.springframework.context.annotation.*; @Configuration public class ProfileConfig { @Bean(name="delivery") @Profile("demo") public String demo(){return "console";} @Bean(name="delivery") @Profile("production") public String production(){return "email";} }',
          ],
        },
        `for(String p:new String[]{"demo","production","none"}){try(var c=new org.springframework.context.annotation.AnnotationConfigApplicationContext()){if(!p.equals("none"))c.getEnvironment().setActiveProfiles(p);c.register(ProfileConfig.class);c.refresh();var beans=c.getBeansOfType(String.class);expect(beans.size()==(p.equals("none")?0:1));if(!p.equals("none"))expect(c.getBean("delivery").equals(p.equals("demo")?"console":"email"));}}`,
      ),
    ],
  ),
  make(
    "java-spring-web",
    "java",
    "Spring Boot · APIs, persistence and security",
    "Build and test an HTTP boundary, validate input, persist data and protect business operations.",
    [
      "REST",
      "Validation",
      "Exception handling",
      "JPA",
      "Transactions",
      "Security",
      "Testing",
    ],
    [
      spring(
        "Expose a booking status API",
        "Spring MVC and MockMvc testing",
        "The customer app wants a small status endpoint before the booking service is fully built. The URL's booking ID must appear in the JSON response, so support can trace the right request.",
        "Implement a @RestController BookingController with GET /bookings/{id}. For positive long IDs return JSON with id equal to the path ID and status booked. For zero or negative IDs return HTTP 400. Implement Status as a nested public record with fields long id and String status.",
        'GET /bookings/7 → 200 with {"id":7,"status":"booked"}; /bookings/0 → 400; unknown routes → 404.',
        {
          "BookingController.java": [
            `package lab;\nimport org.springframework.web.bind.annotation.*;\npublic class BookingController {\n public record Status(long id,String status){}\n public Status get(long id){ ${todo} }\n}`,
            `package lab; import org.springframework.web.bind.annotation.*; import org.springframework.web.server.ResponseStatusException; import org.springframework.http.HttpStatus; @RestController public class BookingController {public record Status(long id,String status){} @GetMapping("/bookings/{id}") public Status get(@PathVariable long id){if(id<=0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST);return new Status(id,"booked");}}`,
          ],
        },
        `var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new BookingController()).build(); var mapper=new com.fasterxml.jackson.databind.ObjectMapper();for(long id:new long[]{1,7,92}){var r=mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/bookings/"+id)).andReturn().getResponse();expect(r.getStatus()==200);var json=mapper.readTree(r.getContentAsString());expect(json.get("id").asLong()==id);expect(json.get("status").asText().equals("booked"));}for(String path:new String[]{"/bookings/0","/bookings/-2"})expect(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path)).andReturn().getResponse().getStatus()==400); expect(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/unknown")).andReturn().getResponse().getStatus()==404);`,
      ),
      spring(
        "Reject bad requests consistently",
        "Bean Validation and exception advice",
        "An API client occasionally sends empty customer names or zero quantities. The booking API should reject these with a predictable response instead of creating bad records or exposing a stack trace.",
        "Implement POST /bookings in CreateController. Accept JSON CreateRequest(name, quantity): name must be nonblank and quantity at least 1 using Jakarta Bean Validation with @Valid. Valid requests return HTTP 201 and JSON name and quantity. Implement ApiErrors as @RestControllerAdvice handling MethodArgumentNotValidException with HTTP 400 and JSON error=invalid_request.",
        '{"name":"Aina","quantity":2} → 201; blank name or quantity 0 → 400 {"error":"invalid_request"}.',
        {
          "CreateController.java": [
            `package lab;\nimport org.springframework.http.ResponseEntity;\npublic class CreateController {\n public record CreateRequest(String name,int quantity){}\n public ResponseEntity<CreateRequest> create(CreateRequest request){ ${todo} }\n}`,
            `package lab; import org.springframework.web.bind.annotation.*; import org.springframework.http.ResponseEntity; import jakarta.validation.Valid; import jakarta.validation.constraints.*; @RestController public class CreateController {public record CreateRequest(@NotBlank String name,@Min(1) int quantity){} @PostMapping("/bookings") public ResponseEntity<CreateRequest> create(@Valid @RequestBody CreateRequest request){return ResponseEntity.status(201).body(request);}}`,
          ],
          "ApiErrors.java": [
            "package lab;\npublic class ApiErrors { /* Return the required validation error response. */ }",
            `package lab; import org.springframework.web.bind.annotation.*; import org.springframework.web.bind.MethodArgumentNotValidException; import org.springframework.http.ResponseEntity; import java.util.Map; @RestControllerAdvice public class ApiErrors { @ExceptionHandler(MethodArgumentNotValidException.class) public ResponseEntity<Map<String,String>> invalid(MethodArgumentNotValidException e){return ResponseEntity.badRequest().body(Map.of("error","invalid_request"));}}`,
          ],
        },
        `try(var validator=new org.springframework.validation.beanvalidation.LocalValidatorFactoryBean()){validator.afterPropertiesSet();var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new CreateController()).setControllerAdvice(new ApiErrors()).setValidator(validator).build();var mapper=new com.fasterxml.jackson.databind.ObjectMapper();for(Map<String,Object> payload:List.<Map<String,Object>>of(Map.of("name","Aina","quantity",2),Map.of("name","   ","quantity",1),Map.of("name","Ben","quantity",0),Map.of("quantity",2))){var r=mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/bookings").contentType("application/json").content(mapper.writeValueAsString(payload))).andReturn().getResponse();boolean ok="Aina".equals(payload.get("name"));expect(r.getStatus()==(ok?201:400));var j=mapper.readTree(r.getContentAsString());if(ok){expect(j.get("name").asText().equals("Aina"));expect(j.get("quantity").asInt()==2);}else expect(j.get("error").asText().equals("invalid_request"));}}`,
      ),
      spring(
        "Persist bookings through a repository",
        "Spring Data JPA and Boot auto-configuration",
        "The shop loses its booking list whenever the service restarts. Introduce a persistence boundary and let Spring Data provide the repository implementation. The lab uses an isolated H2 database; production would configure its own database.",
        "Implement lab.Ticket as a JPA entity with generated Long id, non-null String customer, a protected no-arg constructor, public Ticket(String customer), getId() and getCustomer(). Implement TicketRepository extending JpaRepository<Ticket,Long> with List<Ticket> findByCustomerOrderByIdAsc(String customer). Keep the supplied LabApplication fixture unchanged.",
        "Save Aina, Ben, Aina → three generated IDs; findByCustomerOrderByIdAsc(Aina) returns only Aina's two tickets in ID order.",
        {
          "Ticket.java": [
            `package lab;\npublic class Ticket {\n protected Ticket(){}\n public Ticket(String customer){ ${todo} }\n public Long getId(){ ${todo} }\n public String getCustomer(){ ${todo} }\n}`,
            `package lab; import jakarta.persistence.*; @Entity public class Ticket { @Id @GeneratedValue private Long id; @Column(nullable=false) private String customer; protected Ticket(){} public Ticket(String customer){this.customer=customer;} public Long getId(){return id;} public String getCustomer(){return customer;} }`,
          ],
          "TicketRepository.java": [
            "package lab;\npublic interface TicketRepository { /* Add the Spring Data repository contract and finder. */ }",
            "package lab; import org.springframework.data.jpa.repository.JpaRepository; import java.util.List; public interface TicketRepository extends JpaRepository<Ticket,Long>{List<Ticket> findByCustomerOrderByIdAsc(String customer);}",
          ],
        },
        `try(var c=${context}){var r=c.getBean(TicketRepository.class);var a=r.saveAndFlush(new Ticket("Aina"));r.saveAndFlush(new Ticket("Ben"));var b=r.saveAndFlush(new Ticket("Aina"));expect(a.getId()!=null&&b.getId()>a.getId());var found=r.findByCustomerOrderByIdAsc("Aina");expect(found.size()==2);expect(found.get(0).getId().equals(a.getId()));expect(found.get(1).getId().equals(b.getId()));expect(r.findByCustomerOrderByIdAsc("Nobody").isEmpty());}`,
        {
          "LabApplication.java": boot(
            "",
            '@org.springframework.boot.autoconfigure.domain.EntityScan("lab") @org.springframework.data.jpa.repository.config.EnableJpaRepositories("lab")',
          ),
        },
      ),
      spring(
        "Roll back an incomplete transfer",
        "Declarative transactions and proxies",
        "A wallet transfer updates two balances. An error after the debit must never leave money missing. Let Spring's transaction boundary coordinate both database writes.",
        "Implement TransferService as a Spring @Service with constructor JdbcTemplate. Its public @Transactional transfer(long from,long to,int amount,boolean failAfterDebit) rejects nonpositive amounts; subtracts amount from accounts.balance only if sufficient funds; adds it to the existing destination; throws IllegalArgumentException for missing/insufficient accounts or when failAfterDebit is true. Any failure must roll back both writes. The fixture provides accounts(id,balance) and transaction infrastructure.",
        "Balances 100 and 20: transfer 30 → 70 and 50; forced failure, missing recipient or insufficient funds leave both balances unchanged.",
        {
          "TransferService.java": [
            `package lab;\nimport org.springframework.jdbc.core.JdbcTemplate;\npublic class TransferService {\n public TransferService(JdbcTemplate jdbc){ ${todo} }\n public void transfer(long from,long to,int amount,boolean failAfterDebit){ ${todo} }\n}`,
            `package lab; import org.springframework.jdbc.core.JdbcTemplate; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; @Service public class TransferService {private final JdbcTemplate jdbc; public TransferService(JdbcTemplate jdbc){this.jdbc=jdbc;} @Transactional public void transfer(long from,long to,int amount,boolean failAfterDebit){if(amount<=0)throw new IllegalArgumentException();if(jdbc.update("UPDATE accounts SET balance=balance-? WHERE id=? AND balance>=?",amount,from,amount)!=1)throw new IllegalArgumentException();if(failAfterDebit)throw new IllegalArgumentException();if(jdbc.update("UPDATE accounts SET balance=balance+? WHERE id=?",amount,to)!=1)throw new IllegalArgumentException();}}`,
          ],
        },
        `try(var c=${context}){var db=c.getBean(org.springframework.jdbc.core.JdbcTemplate.class);db.execute("CREATE TABLE accounts(id BIGINT PRIMARY KEY,balance INT NOT NULL)");db.update("INSERT INTO accounts VALUES(1,100),(2,20)");var s=c.getBean(TransferService.class);expect(org.springframework.aop.support.AopUtils.isAopProxy(s));s.transfer(1,2,30,false);expect(db.queryForObject("SELECT balance FROM accounts WHERE id=1",Integer.class)==70);for(Runnable f:List.<Runnable>of(()->s.transfer(1,2,10,true),()->s.transfer(1,99,10,false),()->s.transfer(1,2,999,false),()->s.transfer(1,2,0,false))){rejects(f);expect(db.queryForObject("SELECT balance FROM accounts WHERE id=1",Integer.class)==70);expect(db.queryForObject("SELECT balance FROM accounts WHERE id=2",Integer.class)==50);}}`,
        { "LabApplication.java": boot("TransferService.class") },
      ),
      spring(
        "Protect an administrative operation",
        "Spring Security method authorization",
        "Customer support may read operational summaries, but only an administrator may purge old reports. Protect the service itself so an alternate controller cannot accidentally bypass the rule.",
        "Implement SecurityConfig with @Configuration and @EnableMethodSecurity. Implement AdminReports as a Spring-managed bean with public String purge() protected by @PreAuthorize(\"hasRole('ADMIN')\") and returning purged. Anonymous callers and USER role must be denied; ADMIN must succeed. The fixture registers AdminReports using @Import.",
        "ROLE_USER → denied; ROLE_ADMIN → purged; no authentication → denied. The same bean remains protected after the security context changes.",
        {
          "SecurityConfig.java": [
            "package lab;\npublic class SecurityConfig { /* Enable method security. */ }",
            "package lab; import org.springframework.context.annotation.Configuration; import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity; @Configuration @EnableMethodSecurity public class SecurityConfig{}",
          ],
          "AdminReports.java": [
            `package lab;\npublic class AdminReports {\n public String purge(){ ${todo} }\n}`,
            `package lab; import org.springframework.security.access.prepost.PreAuthorize; public class AdminReports { @PreAuthorize("hasRole('ADMIN')") public String purge(){return "purged";} }`,
          ],
        },
        `try(var c=new org.springframework.context.annotation.AnnotationConfigApplicationContext(SecurityConfig.class,AdminReports.class)){var service=c.getBean(AdminReports.class);for(String role:new String[]{"USER","ADMIN","USER"}){var auth=new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("tester","unused",List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_"+role)));org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);if(role.equals("ADMIN"))expect(service.purge().equals("purged"));else{boolean denied=false;try{service.purge();}catch(org.springframework.security.access.AccessDeniedException e){denied=true;}expect(denied);}}org.springframework.security.core.context.SecurityContextHolder.clearContext();boolean denied=false;try{service.purge();}catch(org.springframework.security.core.AuthenticationException|org.springframework.security.access.AccessDeniedException e){denied=true;}expect(denied);}finally{org.springframework.security.core.context.SecurityContextHolder.clearContext();}`,
      ),
    ],
  ),
];
const discussions = [
  "Why does constructor injection make required dependencies visible? When would @Qualifier or @Primary be needed with two PaymentGateway beans?",
  "Why is a stateful singleton risky under concurrent requests? What happens when a singleton directly injects a prototype bean instead of using a provider?",
  "How do configuration properties differ from scattered @Value fields? Where should validation and secret provisioning happen?",
  "How do profiles differ from feature flags? What should happen if demo and production are both enabled, and how would you prevent that deployment mistake?",
  "Why does a controller delegate business rules to a service? What does standalone MockMvc verify, and which Boot wiring does it leave untested?",
  "Why validate at the API boundary and keep stable error responses? How would you handle malformed JSON and avoid exposing internal exception details?",
  "How do derived repository queries work? Explain persistence context, lazy loading and the N+1 query problem before using entities in HTTP responses.",
  "Why must this call go through Spring's proxy? Explain self-invocation, rollback for checked exceptions, isolation and why a transaction alone does not make a repeated request idempotent.",
  "What is the difference between authentication and authorization? Why protect both HTTP routes and sensitive service methods, and when are CSRF protections needed?",
];
springCourses
  .flatMap((course) => course.lessons)
  .forEach((lesson, index) => {
    lesson.interview = discussions[index];
  });
