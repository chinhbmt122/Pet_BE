# FINAL OOAD REVIEW QUESTIONS - ANSWERS

---

## Section 1: Fundamentals & Core Concepts (Q1-10)

---

### 1. Why does object-oriented programming not conflict with structured programming?

**Answer:**  
OOP does not conflict with structured programming because OOP **builds upon** structured programming principles rather than replacing them.

- **Structured programming** focuses on: control flow (sequence, selection, iteration), modular functions, and avoiding "goto" statements. 
- **OOP** adds: encapsulation, inheritance, and polymorphism on top of these foundations.

Inside methods/functions of an OOP class, we still use structured programming constructs (loops, conditionals, procedural logic). OOP simply provides a higher-level organization mechanism for grouping related data and behavior into objects.

---

### 2. Distinguish between Object and Class. When should a concept be modeled as an Object?

**Answer:**

| **Class** | **Object** |
|-----------|-----------|
| Blueprint/template | Instance of a class |
| Defines attributes and methods | Has specific values for attributes |
| Exists at design-time | Exists at runtime |
| Abstract concept | Concrete instance |

**When to model as Object:**
- When you need **multiple instances** with their own state
- When the concept has **behavior** tied to its data
- When instances need to maintain **identity** throughout their lifecycle

**Examples:**
```typescript
// Class definition (from Pet_BE domain layer)
class PetOwnerDomainModel {
  private _fullName: string;
  private _phoneNumber: string;
  // ... business logic methods
}

// Objects (instances at runtime)
const owner1 = PetOwnerDomainModel.create({ accountId: 1, fullName: 'John' });
const owner2 = PetOwnerDomainModel.create({ accountId: 2, fullName: 'Jane' });
// Each object has its own state (different fullName, accountId)
```

---

### 3. Compare procedural programming and OOP in terms of code organization and extensibility.

**Answer:**

| Aspect | Procedural | OOP |
|--------|-----------|-----|
| **Organization** | Functions + global data structures | Classes encapsulate data + behavior |
| **Data Access** | Data is often exposed globally | Data is hidden (encapsulation) |
| **Extensibility** | Add new functions; modify existing code | Extend via inheritance/composition without modifying existing code |
| **Reuse** | Copy-paste or function libraries | Inheritance, composition, polymorphism |
| **Maintenance** | Changes cascade through codebase | Changes are localized to classes |

**Extensibility Example:**
- Procedural: Adding a new payment type requires modifying existing switch statements
- OOP: Create a new `PaymentMethod` subclass without touching existing code (Open-Closed Principle)

**⚠️ Trade-offs (When OOP may NOT be best):**

| Scenario | Better Alternative |
|----------|-------------------|
| Simple scripts, linear algorithms | Procedural |
| Heavy data transformation, concurrency | Functional Programming |
| Performance-critical, low-level code | Procedural/C |
| Small utilities, one-off tasks | Don't over-engineer with classes |

> **Functional Programming Note:** FP emphasizes immutability and pure functions. For concurrent systems, FP's lack of shared mutable state avoids race conditions. Modern languages (TypeScript, Java, C#) support multi-paradigm—use FP for data pipelines, OOP for stateful entities.

---

### 4. How do Interface and Implementation differ? Why separate them?

**Answer:**

| **Interface** | **Implementation** |
|--------------|-------------------|
| WHAT an object does | HOW it does it |
| Public contract | Private details |
| Stable, rarely changes | Can change freely |
| Known to clients | Hidden from clients |

**Why separate:**
1. **Flexibility**: Change implementation without affecting clients
2. **Testability**: Mock interfaces for unit testing
3. **Decoupling**: Clients depend on abstractions, not concretions
4. **Multiple implementations**: One interface, many implementations

```typescript
// Interface (WHAT)
interface PaymentProcessor {
  processPayment(amount: number): boolean;
}

// Implementation (HOW)
class StripeProcessor implements PaymentProcessor {
  processPayment(amount: number): boolean {
    // Stripe-specific implementation
  }
}
```

---

### 5. What is a minimal public interface? Why should it be as small as possible?

**Answer:**

A **minimal public interface** exposes only the essential methods needed by clients—nothing more.

**Why small interfaces:**
1. **Easier to understand**: Less cognitive load for users
2. **Easier to maintain**: Fewer public contracts to preserve
3. **Better encapsulation**: More implementation freedom
4. **Reduced coupling**: Clients depend on less

> **SOLID Principle:** The **Interface Segregation Principle (ISP)** states: "Clients should not be forced to depend on methods they do not use." Many small, specific interfaces are better than one large, general-purpose interface.

**Example:**
```typescript
// ❌ Bloated interface
class User {
  public name: string;
  public email: string;
  public passwordHash: string;     // Exposed internal detail!
  public validatePassword(): void; // Internal detail!
  public hashPassword(): void;     // Internal detail!
}

// ✅ Minimal interface
class User {
  public getName(): string;
  public getEmail(): string;
  public authenticate(password: string): boolean;  // Only what clients need
}
```

---

### 6. What is the role of a constructor? When use multiple constructors?

**Answer:**

**Constructor Role:**
- Initialize object state with valid values
- Establish class invariants (ensure object is always in valid state)
- Acquire necessary resources
- Prevent creation of invalid objects

**When to use multiple constructors:**
1. **Different initialization scenarios**: Create with ID vs. create new
2. **Optional parameters**: Provide convenient defaults
3. **Factory patterns**: `create()` vs. `reconstitute()`

**Project Example (PetOwnerDomainModel):**
```typescript
// Private constructor ensures controlled creation
private constructor(props: {...}) { }

// Factory for NEW objects
static create(props) { return new PetOwnerDomainModel({...}); }

// Factory for EXISTING objects from database
static reconstitute(props) { return new PetOwnerDomainModel(props); }
```

---

### 7. Distinguish between local, object, and class (static) attributes.

**Answer:**

| Type | Scope | Lifetime | Shared? |
|------|-------|----------|---------|
| **Local** | Within method | Method execution | No |
| **Object (Instance)** | Within object | Object lifetime | Per object |
| **Class (Static)** | Within class | Program lifetime | All instances |

```typescript
class Example {
  static count: number = 0;        // Class attribute - shared
  private name: string;            // Object attribute - per instance

  doSomething(): void {
    let temp = 0;                  // Local attribute - within method only
    Example.count++;               // Access class attribute
    this.name = "test";            // Access object attribute
  }
}
```

**Pet_BE Example (PetOwnerDomainModel):**
```typescript
class PetOwnerDomainModel {
  // Object (instance) attributes - unique per owner
  private _fullName: string;
  private _phoneNumber: string;
  private readonly _registrationDate: Date;

  // Static factory method (class-level behavior)
  static create(props) { return new PetOwnerDomainModel(props); }

  updateProfile(props) {
    let validated = true;  // Local - exists only during method
    if (validated) this._fullName = props.fullName;  // Instance access
  }
}
```

---

### 8. At which level should error handling be placed—method, class, or system?

**Answer:**

Error handling should be placed at **the level that has sufficient context to handle it meaningfully**.

| Level | When to Handle |
|-------|---------------|
| **Method** | Recoverable errors within method scope |
| **Class** | Errors affecting object state/invariants |
| **System** | Cross-cutting concerns, logging, user notification |

**Principle:** Handle errors at the **lowest level** that can recover, **propagate up** if cannot handle.

**Example:**
```typescript
// Method level: Validation
validateEmail(email: string) {
  if (!email.includes('@')) throw new ValidationError('Invalid email');
}

// Class level: State management
class Account {
  withdraw(amount: number) {
    if (amount > this.balance) throw new InsufficientFundsError();
  }
}

// System level: Global error handler
app.useGlobalFilters(new HttpExceptionFilter()); // NestJS
```

---

### 9. What components and characteristics define a "well-designed" class?

**Answer:**

**Components:**
1. **Clear responsibility**: Single, well-defined purpose (SRP)
2. **Minimal public interface**: Only necessary methods exposed
3. **Private implementation**: Internal details hidden
4. **Valid state guarantee**: Constructors ensure invariants
5. **Meaningful name**: Reflects its purpose

**Characteristics:**
- **High cohesion**: All members relate to class purpose
- **Low coupling**: Minimal dependencies on other classes
- **Testable**: Can be tested in isolation
- **Extensible**: Can be extended without modification
- **Documented**: Clear contracts and expectations

---

### 10. Why is naming considered important in OOAD?

**Answer:**

**Importance:**
1. **Communication**: Names convey design intent to developers
2. **Self-documenting code**: Good names reduce need for comments
3. **Domain alignment**: Names should match business terminology
4. **Discoverability**: Developers find what they need faster
5. **Maintenance**: Easier to understand and modify later

> **DDD Concept:** Eric Evans' **Ubiquitous Language** emphasizes that domain experts, developers, and code should all use the same terminology. Names in code should reflect the language of the business domain.

**Guidelines:**
- **Classes**: Nouns (e.g., `PetOwner`, `Appointment`)
- **Methods**: Verbs (e.g., `updateProfile`, `authenticate`)
- **Booleans**: Questions (e.g., `isActive`, `hasPermission`)

**Bad vs Good:**
```typescript
// ❌ Bad naming
class Mgr { doStuff(): void; }

// ✅ Good naming
class AppointmentScheduler { scheduleAppointment(): void; }
```

---

## Section 2: OOAD Process & Design Principles (Q11-20)

---

### 11. Present the main steps of the OOAD process from requirements analysis to system design.

**Answer:**

| Step | Input | Output |
|------|-------|--------|
| **1. Requirements Analysis** | User stories, stakeholder interviews | Use cases, feature list |
| **2. Domain Modeling** | Use cases | Domain model, glossary |
| **3. System Analysis** | Domain model | Class diagrams, sequence diagrams |
| **4. System Design** | Analysis artifacts | Architecture, detailed design |
| **5. Implementation** | Design documents | Working code |

**Project Example (Pet_BE):**
- Requirements → User needs pet management, appointments, medical records
- Domain Model → `Pet`, `PetOwner`, `Appointment`, `MedicalRecord` entities
- Design → Layered architecture: Controllers → Services → Domain → Entities

**Pet_BE Architecture Layers:**
```
Controllers     → Handle HTTP, validate input (pet-owner.controller.ts)
Services        → Orchestrate operations (pet-owner.service.ts)
Domain Models   → Business rules (PetOwnerDomainModel, AppointmentDomainModel)
Mappers         → Domain ↔ Persistence (PetOwnerMapper.toDomain/toPersistence)
Entities        → Pure TypeORM persistence (pet-owner.entity.ts)
```

---

### 12. Why is it necessary to identify class responsibilities before writing code?

**Answer:**

1. **Prevents "God classes"**: Avoids putting all logic in one place
2. **Enables collaboration**: Team can work on different classes
3. **Improves cohesion**: Each class has a clear purpose
4. **Facilitates testing**: Smaller, focused classes are easier to test
5. **Reduces refactoring**: Less rework when responsibilities are clear upfront

**CRC Cards technique:** Class-Responsibility-Collaboration cards help identify:
- What the class KNOWS (attributes)
- What the class DOES (methods)
- Who it WORKS WITH (collaborators)

> **Source:** CRC Cards were introduced by **Ward Cunningham & Kent Beck** at OOPSLA 1989 as a teaching tool to help programmers develop object-oriented thinking.

---

### 13. What is an Object Wrapper? Describe its role.

**Answer:**

An **Object Wrapper** is a **translator/adapter** that sits between your clean OO code and something that doesn't speak the same "language" (databases, C libraries, external APIs, legacy systems).

**The Core Problem:**
```
Your OO Code ←→ ??? ←→ Non-OO Thing (database, C library, external API)
```
Without a wrapper, your code must understand messy external details. With a wrapper, you get a clean interface.

**Roles:**
1. **Abstraction**: Hide complex/non-OO implementation details
2. **Isolation**: Protect system from external changes (if API changes, fix 1 place, not 50)
3. **Unified interface**: Provide consistent API regardless of underlying technology
4. **Testability**: Easy to mock the wrapper for testing

**Concrete Examples:**

```typescript
// Example 1: Wrapping a Database (Pet_BE uses this)
// WITHOUT wrapper - service talks directly to SQL
findOwner(id: number) {
  const result = mysql.query(`SELECT * FROM pet_owners WHERE id = ${id}`);
  return { petOwnerId: result[0][0], ... };  // Ugly, fragile!
}

// WITH wrapper (Repository) - clean OO interface
findOwner(id: number) {
  return this.repo.findOne({ where: { petOwnerId: id } });  // Clean!
}
// Repository is the WRAPPER - hides SQL complexity
```

```typescript
// Example 2: Wrapping an External API
// External API returns: { "txn_stat": "OK", "amt_processed": 5000 }

class PaymentGateway {  // WRAPPER
  async processPayment(amount: number): Promise<PaymentResult> {
    const response = await this.externalApi.call({ amount });
    return {
      success: response.txn_stat === 'OK',  // Translate to domain language
      amountProcessed: response.amt_processed / 100,
    };
  }
}
// Your code never sees "txn_stat" - only clean domain objects
```

**Key Benefits:**

| Without Wrapper | With Wrapper |
|-----------------|--------------|
| External details leak everywhere | Details contained in one place |
| If API changes, fix 50 places | If API changes, fix 1 place |
| Hard to test (real DB/API needed) | Easy to test (mock the wrapper) |
| External naming pollutes your code | Your domain language stays clean |

> **DDD Concept: Anti-Corruption Layer (ACL)** — Eric Evans describes this as a **strategic wrapper** when integrating with large legacy systems. The ACL translates between your domain language and the external system's language, preventing foreign concepts from "corrupting" your clean domain model.

---

### 14. Compare wrapping structured code, non-portable code, and existing classes.

**Answer:**

**Comparison Table:**

| Criteria | Structured Code Wrapper | Non-Portable Code Wrapper | Existing Class Wrapper |
|----------|------------------------|---------------------------|------------------------|
| **What you wrap** | Procedural/C functions | Platform-specific code | Third-party OO classes |
| **Why wrap** | Convert to OO style | Achieve cross-platform | Adapt interface to your needs |
| **Pattern used** | Facade | Abstraction Layer | Adapter |
| **Example source** | C library, COBOL | Windows API, iOS API | Stripe SDK, AWS SDK |

---

**1. Wrapping Structured (Procedural) Code:**
```typescript
// Problem: Old C functions, not object-oriented
// C: int image_resize(char* path, int w, int h);

// Solution: WRAPPER makes it OO
class ImageProcessor {
  constructor(private path: string) {}
  resize(w: number, h: number) { return nativeLib.image_resize(this.path, w, h); }
}
// Now: new ImageProcessor("photo.jpg").resize(100, 100)
```

**2. Wrapping Non-Portable Code:**
```typescript
// Problem: Different code for Windows vs Mac
// Solution: WRAPPER hides platform differences
class FileSystem {
  delete(path: string): void {
    if (process.platform === 'win32') exec(`del /f ${path}`);
    else exec(`rm -f ${path}`);
  }
}
// Now: fs.delete("file.txt") works everywhere!
```

**3. Wrapping Existing Classes (Adapter):**
```typescript
// Problem: Third-party library has "wrong" interface
// Stripe uses cents, your app uses dollars

class StripeAdapter implements PaymentProcessor {
  processPayment(amountDollars: number): PaymentResult {
    return this.stripe.createCharge(amountDollars * 100);  // Adapt!
  }
}
// Now: Stripe matches YOUR interface
```

---

**Key Differences:**

| Aspect | Structured | Non-Portable | Existing Classes |
|--------|------------|--------------|------------------|
| **Source is OO?** | ❌ No (procedural) | ✅ Yes | ✅ Yes |
| **Can modify source?** | ❌ No | ❌ No | ❌ No |
| **Main goal** | Add OO structure | Hide platform details | Match your interface |
| **Design pattern** | Facade | Strategy/Bridge | Adapter |

**Common Purpose:** All three create a **stable boundary** that protects your code from external complexity, changes, or incompatibility.

### 15. Analyze the Is-a and Has-a relationships. Provide an example of incorrect design.

**Answer:**

| Relationship | Meaning | Implementation |
|--------------|---------|----------------|
| **Is-a** | Subtype/inheritance | `Dog IS-A Animal` → `Dog extends Animal` |
| **Has-a** | Composition/containment | `Car HAS-A Engine` → `Car` contains `Engine` |

> **Important (Liskov Substitution Principle):** "Is-a" is NOT just about structure—it requires **behavioral substitutability**. A subclass must be usable anywhere the parent is used without breaking expected behavior. If substitution causes unexpected behavior, the inheritance is incorrect even if it "looks like" an is-a relationship.

**Common Incorrect Design:**
```typescript
// ❌ WRONG: Stack is NOT a type of ArrayList
class Stack extends ArrayList {
  push(item): void { this.add(item); }
  pop(): T { return this.remove(this.size() - 1); }
}
// Problem: Stack inherits ALL ArrayList methods (get, insert, etc.)
// This violates LSP: Stack cannot be substituted for ArrayList
// because Stack should NOT allow random access!

// ✅ CORRECT: Stack HAS-A list for storage
class Stack {
  private items: ArrayList = new ArrayList();
  push(item): void { this.items.add(item); }
  pop(): T { return this.items.remove(this.items.size() - 1); }
}
```

**Another Classic Example - Rectangle/Square:**
```typescript
// ❌ WRONG: Square IS-A Rectangle seems logical but breaks LSP
class Rectangle { width: number; height: number; }
class Square extends Rectangle {
  setWidth(w) { this.width = w; this.height = w; }  // Unexpected!
}
// A Square cannot be substituted for Rectangle because
// setting width also changes height, breaking expectations.
```

---

### 16. Compare Inheritance and Composition. When does inheritance weaken encapsulation?

**Answer:**

| Aspect | Inheritance | Composition |
|--------|-------------|-------------|
| **Relationship** | Is-a | Has-a |
| **Coupling** | Tight | Loose |
| **Flexibility** | Compile-time | Runtime |
| **Reuse** | Inherit all behavior | Select specific behavior |

**Inheritance weakens encapsulation when:**
1. Subclass depends on parent implementation details
2. Parent changes break subclass (**fragile base class problem**)
3. Subclass must expose inherited methods it shouldn't have

**Fragile Base Class Problem Example:**
```typescript
// Base class - seems innocent
class Counter {
  count = 0;
  add(n: number) { this.count += n; }
  addAll(nums: number[]) { 
    for (const n of nums) this.add(n);  // Calls add() internally
  }
}

// Subclass - overrides add()
class LoggingCounter extends Counter {
  add(n: number) {
    console.log(`Adding ${n}`);
    super.add(n);
  }
}

// PROBLEM: addAll([1,2,3]) logs 3 times because it calls add() internally!
// If base class changes addAll() to NOT call add(), subclass breaks.
// Subclass is FRAGILE because it depends on base class implementation.
```

**Project Example (Pet_BE):**
```typescript
// Composition over inheritance
class PetOwnerDomainModel {
  private _accountId: number;  // HAS-A relationship to Account
  // NOT: extends AccountDomainModel (would be incorrect Is-a)
}
```

---

### 17. Distinguish between Association, Aggregation, and Composition.

**Answer:**

| Relationship | Lifecycle | Ownership | UML Notation |
|--------------|-----------|-----------|---------------|
| **Association** | Independent | None | Solid line (optional arrow) |
| **Aggregation** | Independent | Weak (shared) | **Hollow diamond** ◇ on whole side |
| **Composition** | Dependent | Strong (exclusive) | **Filled diamond** ◆ on whole side |

**Key Distinction (from OMG UML spec):**
- **Aggregation (◇)**: Parts can exist independently, can be shared. If `Team` is deleted, `Players` still exist.
- **Composition (◆)**: Parts cannot exist without whole, exclusive ownership. If `House` is deleted, `Rooms` are deleted too.

**Project Example (Pet_BE):**
```typescript
// Composition (◆): Pet lifecycle depends on PetOwner
@Entity('pets')
class Pet {
  @ManyToOne(() => PetOwner, { onDelete: 'CASCADE' })
  owner: PetOwner;  // When PetOwner deleted, Pets are deleted
}

// Association: Appointment references Veterinarian
class Appointment {
  veterinarianId: number;  // Vet exists independently of appointments
}

// Aggregation (◇): Department has Employees (shared resource)
class Department {
  employees: Employee[];  // Employees can move to other departments
}
```

---

### 18. How does Dependency Injection reduce coupling?

**Answer:**

> **Origin:** The term "Dependency Injection" was coined by **Martin Fowler** in 2004. 
> **Key Insight:** "Don't create your dependencies, receive them."

**The Core Concept (Chef Analogy):**

| Without DI | With DI |
|------------|---------|
| Chef **builds his own knife** inside himself | Someone **gives Chef a knife** from outside |
| Chef is stuck with that specific knife | Chef can use any knife that cuts |
| Can't test Chef without real knife | Can test with fake knife |

---

**❌ Without DI (High Coupling) - Class CREATES its dependency:**
```typescript
class Chef {
  private knife = new CheapPlasticKnife();  // Hardcoded inside!
  cook() { this.knife.cut(); }
}
// Problem: Chef is FOREVER stuck with CheapPlasticKnife
// To change knife, you must modify Chef's code
```

**✅ With DI (Low Coupling) - Class RECEIVES its dependency:**
```typescript
interface Knife { cut(): void; }

class Chef {
  constructor(private knife: Knife) {}  // Given from outside!
  cook() { this.knife.cut(); }
}

// Now SOMEONE ELSE decides which knife:
const chef1 = new Chef(new ProfessionalKnife());  // Production
const chef2 = new Chef(new FakeKnife());          // Testing
```

---

**Visual Summary:**
```
WITHOUT DI:                     WITH DI:
┌──────────────┐                ┌──────────────┐
│    Chef      │                │    Chef      │
│ ┌──────────┐ │                │              │
│ │ Cheap    │ │                │ uses Knife ◄─┼── Knife injected
│ │ Knife    │ │                │ interface    │   from outside
│ └──────────┘ │                │              │
└──────────────┘                └──────────────┘
Chef CONTROLS knife             Someone ELSE controls knife
(high coupling)                 (low coupling)
```

---

**Benefits:**
1. **Testability**: Inject mock/fake for testing
2. **Flexibility**: Swap implementations without code changes
3. **Decoupling**: Class depends on interface, not implementation
4. **Configuration**: Dependencies configured externally

**Project Example (Pet_BE - NestJS):**
```typescript
@Injectable()
export class PetOwnerService {
  // NestJS INJECTS these - service doesn't create them
  constructor(
    @InjectRepository(PetOwner) private repo: Repository<PetOwner>,
    private accountService: AccountService,
  ) {}
}
// In production: real Postgres repository
// In testing: mock repository with fake data
```

---

### 19. What is the relationship between Interface, Abstract Class, and Framework?

**Answer:**

| Concept | What It Is | Who Creates | Who Implements |
|---------|------------|-------------|----------------|
| **Interface** | Pure contract (no code) | Framework | You implement |
| **Abstract Class** | Partial implementation (some shared code) | Framework | You extend |
| **Framework** | Skeleton application with extension points | Framework vendor | You plug in your code |

---

**How They Work Together (Flow):**

```
FRAMEWORK side:                    YOUR side:
┌─────────────────────┐           ┌─────────────────────┐
│ Framework defines   │           │ You implement/extend │
│ Interface OR        │    →      │ that interface or    │
│ Abstract Class      │           │ abstract class       │
│ (extension point)   │           │                      │
└─────────────────────┘           └─────────────────────┘
         ↓                                 ↓
┌─────────────────────┐           ┌─────────────────────┐
│ Framework CALLS     │    ←      │ Your code gets      │
│ your implementation │           │ called by framework │
└─────────────────────┘           └─────────────────────┘
```

> **Hollywood Principle:** "Don't call us, we'll call you."  
> Both interfaces AND abstract classes serve as **extension points** where framework calls YOUR code.  
> This is **Inversion of Control (IoC)** — the framework controls the flow, not you.

---

**Example (NestJS):**

```typescript
// INTERFACE extension point - you implement, NestJS calls
interface CanActivate {
  canActivate(context: ExecutionContext): boolean;
}

class AuthGuard implements CanActivate {
  canActivate(context) { 
    return checkAuth(context);  // ← NestJS CALLS this
  }
}

// ABSTRACT CLASS extension point - you extend, NestJS calls
abstract class BaseExceptionFilter {
  abstract catch(exception, host);        // ← You implement, NestJS calls
  protected handleUnknownError() { ... }  // ← Shared code you can use
}

class MyFilter extends BaseExceptionFilter {
  catch(exception, host) { 
    this.handleUnknownError();  // Use shared code
    // Your custom handling
  }
}
```

**Key Point:** Interface = pure contract, Abstract Class = contract + shared code.  
Both are called BY the framework (Hollywood Principle applies to both).

---

### 20. Analyze consequences of violating SOLID principles (choose one).

**Answer:**

> **Source:** SOLID principles were popularized by **Robert C. Martin** (2000-2002). These are the 5 most important design principles in OOP.

---

## S - Single Responsibility Principle (SRP)

**What it means:** A class should have **ONE reason to change** — responsible to **ONE actor**.

**Real-world analogy:** A chef should only cook. If chef also does accounting and cleaning, any change disrupts others.

```typescript
// ❌ VIOLATION: God class — 4 different teams request changes to this class
class UserManager {
  validateUser() { }      // Security team
  saveToDatabase() { }    // DBA team  
  sendWelcomeEmail() { }  // Marketing team
  generateReport() { }    // Management
}

// ✅ SOLUTION: Split by actor
class UserValidator { validate() { } }
class UserRepository { save() { } }
class EmailService { sendWelcome() { } }
class ReportGenerator { generate() { } }
```

**Consequences (Causal Chain):**
```
VIOLATION: UserManager has 4 responsibilities

� ROOT CAUSE: One class serves 4 DIFFERENT ACTORS 
   (Security team, DBA, Marketing, Management)
   
   ↓ Different actors request changes at different times
   ↓ Class changes frequently from all directions  
   ↓ Teams must coordinate on same file → merge conflicts
   ↓ Change for Actor A breaks Actor B's code → ripple effects
   ↓ Testing requires mocking all 4 dependencies → slow tests
   
� FINAL IMPACT: Development is slow, risky, and expensive
```

---

## O - Open-Closed Principle (OCP)

**What it means:** **Open for extension, CLOSED for modification**. Add features without changing existing code.

**Real-world analogy:** Power strip — open for new devices, closed for rewiring.

```typescript
// ❌ VIOLATION: Must modify function for each new type
function calculateShipping(order) {
  if (order.type === 'standard') return order.weight * 5;
  if (order.type === 'express') return order.weight * 10;
  // Adding overnight = MODIFY this function!
}

// ✅ SOLUTION: Use polymorphism
interface ShippingCalculator { calculate(order): number; }
class StandardShipping implements ShippingCalculator { calculate(o) { return o.weight * 5; } }
class ExpressShipping implements ShippingCalculator { calculate(o) { return o.weight * 10; } }
// Adding new type = ADD new class, don't modify existing!
```

**Consequences (Causal Chain):**
```
VIOLATION: calculateShipping() uses if-else for each type

� ROOT CAUSE: No abstraction for variation point
   (shipping types hardcoded as conditionals)
   
   ↓ Adding new type requires modifying existing function
   ↓ Touching working code risks introducing bugs
   ↓ All existing tests must be re-run
   ↓ Developers fear adding features → technical debt grows
   
💥 FINAL IMPACT: System becomes rigid and fragile over time
```

---

## L - Liskov Substitution Principle (LSP)

**What it means:** Subtypes must be **behaviorally substitutable** for base types.

**Real-world analogy:** If you order "vehicle" for transport, toy car fails — looks like vehicle but can't transport.

```typescript
// ❌ VIOLATION: Square breaks Rectangle's expected behavior
class Rectangle {
  setWidth(w) { this.width = w; }
  setHeight(h) { this.height = h; }
}
class Square extends Rectangle {
  setWidth(w) { this.width = w; this.height = w; }  // SURPRISE! Also changes height
}
// Code expects: rect.setWidth(5); rect.setHeight(10); area = 50
// Square gives: area = 100 because setHeight changed width too!

// ✅ SOLUTION: Don't inherit if behaviors differ
interface Shape { getArea(): number; }
class Rectangle implements Shape { /* width × height */ }
class Square implements Shape { /* side × side */ }
```

**Consequences (Causal Chain):**
```
VIOLATION: Square extends Rectangle but changes setWidth behavior

� ROOT CAUSE: Subtype violates parent's behavioral contract
   (setWidth should ONLY change width, but Square also changes height)
   
   ↓ Code written for Rectangle assumes independent width/height
   ↓ Passing Square breaks that assumption silently
   ↓ area = 50 expected, but 100 returned → bug!
   ↓ Must add instanceof checks everywhere → defeats polymorphism
   
💥 FINAL IMPACT: Inheritance becomes untrustworthy, polymorphism fails
```

---

## I - Interface Segregation Principle (ISP)

**What it means:** Clients should **NOT depend on methods they don't use**. Many small interfaces > one fat interface.

**Real-world analogy:** TV remote shouldn't force DVD buttons if you only have TV.

```typescript
// ❌ VIOLATION: Fat interface forces dummy implementations
interface Worker { work(); eat(); sleep(); }
class Robot implements Worker {
  work() { }
  eat() { throw new Error("Robots don't eat!"); }   // Forced!
  sleep() { throw new Error("Robots don't sleep!"); }
}

// ✅ SOLUTION: Split interfaces
interface Workable { work(); }
interface Eatable { eat(); }
class Human implements Workable, Eatable { /* both */ }
class Robot implements Workable { /* only work */ }
```

**Consequences (Causal Chain):**
```
VIOLATION: Robot must implement eat() and sleep()

🔑 ROOT CAUSE: Interface bundles unrelated capabilities
   (Workable + Eatable + Sleepable forced into one interface)
   
   ↓ Robot doesn't eat/sleep but MUST implement those methods
   ↓ Methods throw "not supported" → confusing API
   ↓ Changes to eat() signature force Robot to update
   ↓ Interface contract is unclear → what does Worker promise?
   
💥 FINAL IMPACT: Fake implementations, unclear contracts, unnecessary coupling
```

---

## D - Dependency Inversion Principle (DIP)

**What it means:** Depend on **abstractions**, NOT concretions. High-level shouldn't depend on low-level.

**Real-world analogy:** Lamp depends on "outlet interface", not specific power plant.

```typescript
// ❌ VIOLATION: Hardcoded dependencies
class OrderService {
  private database = new MySQLDatabase();  // Stuck with MySQL!
  private emailer = new GmailSender();     // Stuck with Gmail!
}

// ✅ SOLUTION: Inject abstractions
interface Database { save(data); }
interface Emailer { send(to, msg); }
class OrderService {
  constructor(private db: Database, private email: Emailer) {}
}
// Now inject MockDatabase for testing, PostgresDatabase for production
```

**Consequences (Causal Chain):**
```
VIOLATION: OrderService creates new MySQLDatabase() internally

🔑 ROOT CAUSE: High-level module depends on low-level implementation
   (OrderService knows about MySQL specifically, not "any database")
   
   ↓ OrderService can't exist without MySQL → tight coupling
   ↓ Testing requires real MySQL → slow, flaky tests
   ↓ MySQL upgrade/bug breaks OrderService
   ↓ Switching to PostgreSQL requires modifying OrderService code
   
💥 FINAL IMPACT: Untestable, locked-in, fragile to external changes
```

---

## Summary Table

| Principle | Violation | Consequence | Solution |
|-----------|-----------|-------------|----------|
| **S**RP | God class | Hard to maintain | Split by actor |
| **O**CP | Modify for extension | Breaks existing code | Use polymorphism |
| **L**SP | Broken subtype | Polymorphism fails | Don't inherit if behaviors differ |
| **I**SP | Fat interface | Dummy implementations | Split into small interfaces |
| **D**IP | Concrete dependencies | Can't test/swap | Depend on abstractions |

---

## Section 3: Encapsulation, Polymorphism & Abstraction (Q21-25)

### 21. Why is encapsulation considered the foundation of OOAD? What decisions break encapsulation?

**Answer:**

> **Historical Note:** The concept of **Information Hiding** was introduced by **David Parnas** (1972). Encapsulation is the mechanism to achieve information hiding by bundling data and methods together. Both are related but distinct:
> - **Information Hiding**: Design principle (WHAT to hide)
> - **Encapsulation**: Implementation mechanism (HOW to hide it)

**Why foundation:**
1. **Hides complexity**: Clients don't need to understand implementation
2. **Enables change**: Internal changes don't affect clients
3. **Protects invariants**: Object controls its own state
4. **Reduces coupling**: Dependencies on interfaces, not implementations

> **Uniform Access Principle (Bertrand Meyer, 1988):**
> 
> **Simple idea:** "Don't make the client care whether data is stored or calculated."
> 
> **Analogy:** When you ask "What's the temperature?", you don't care if the person memorized it (stored) or checked a thermometer (computed). You just want the answer.
> 
> ```typescript
> // GOOD: Client uses person.age - doesn't know if stored or calculated
> class Person {
>   get age(): number { return 2024 - this.birthYear; }  // Computed
> }
> 
> // BAD: Client must know to call getAge() vs reading .age
> // If implementation changes, client code breaks!
> ```
> 
> This is why **excessive getters** can violate encapsulation - they expose that something is stored rather than computed.

**Design decisions that BREAK encapsulation:**
1. **Public attributes**: Direct access to internal state
2. **Getter/Setter for everything**: Exposes internal structure ("Anemic Domain Model" anti-pattern)
3. **Returning mutable internal collections**: Allows external modification
4. **Inheritance exposing protected implementation details**
5. **Tell, Don't Ask violation**: Asking for data instead of asking object to do work

**Project Example (Pet_BE):**
```typescript
// ✅ Good encapsulation in PetOwnerDomainModel
private readonly _accountId: number;  // Private field
get accountId(): number { return this._accountId; }  // Read-only access

// Controlled mutation through domain methods
updateProfile(props) { /* validates and updates */ }
```

---

### 22. How does polymorphism improve extensibility compared to if-else/switch?

**Answer:**
  
**Problem with conditionals:**
```typescript
// ❌ Every new payment type requires modifying this function
function processPayment(type: string, amount: number) {
  if (type === 'credit') { /* credit logic */ }
  else if (type === 'debit') { /* debit logic */ }
  else if (type === 'crypto') { /* crypto logic */ }  // Added later
  // Violates Open-Closed Principle
}
```

**Solution with polymorphism:**
```typescript
// ✅ Add new payment types without modifying existing code
interface PaymentProcessor {
  process(amount: number): void;
}

class CreditProcessor implements PaymentProcessor { process(amount) {} }
class DebitProcessor implements PaymentProcessor { process(amount) {} }
class CryptoProcessor implements PaymentProcessor { process(amount) {} }  // Just add new class

function processPayment(processor: PaymentProcessor, amount: number) {
  processor.process(amount);  // Works with any implementation
}
```

**Benefits:**
- **Open-Closed Principle**: Open for extension, closed for modification
- **Eliminates scattered conditionals**
- **Each type handles its own logic**

> **Design Pattern:** This is the **Strategy Pattern** from GoF—encapsulating algorithms in classes allows swapping them at runtime without modifying client code.

**Pet_BE Example (True Polymorphism):**
```typescript
// 1. Interface defines the contract
interface IPaymentGatewayService {
  generatePaymentUrl(params): Promise<PaymentUrlResponse>;
  verifyCallback(data): Promise<CallbackVerificationResult>;
  initiateRefund(request): Promise<RefundResponse>;
}

// 2. Different gateways implement the SAME interface
class VNPayService implements IPaymentGatewayService {
  generatePaymentUrl(params) { /* VNPay-specific logic */ }
  verifyCallback(data) { /* VNPay signature verification */ }
}

class MomoService implements IPaymentGatewayService {
  generatePaymentUrl(params) { /* Momo-specific logic */ }
  verifyCallback(data) { /* Momo signature verification */ }
}

// 3. PaymentService uses polymorphism - NO switch/if-else!
class PaymentService {
  getGateway(method: PaymentMethod): IPaymentGatewayService {
    // Returns VNPayService OR MomoService - both work the same way
  }
  
  async processPayment(dto) {
    const gateway = this.getGateway(dto.paymentMethod);
    return gateway.generatePaymentUrl(dto);  // Polymorphism!
    // Don't care if it's VNPay or Momo - interface is the same
  }
}
```

**Why this is polymorphism:** PaymentService doesn't know which gateway it's using. It just calls `gateway.generatePaymentUrl()` and the correct implementation runs. Adding ZaloPay = add new class, no changes to PaymentService!

---

### 23. When to use Abstract Class vs Interface?

**Answer:**

| Use **Interface** when: | Use **Abstract Class** when: |
|------------------------|------------------------------|
| Defining a pure contract | Providing shared implementation |
| Multiple inheritance needed | Sharing state between subclasses |
| Unrelated classes share behavior | Classes have is-a relationship |
| Maximum flexibility required | Some methods have default behavior |

**Examples:**
```typescript
// Interface: Multiple implementations, no shared code
interface Printable {
  print(): void;
}

// Abstract class: Shared behavior + some customization
abstract class Animal {
  protected name: string;
  
  move(): void { console.log('Moving...'); }  // Shared
  abstract makeSound(): void;  // Subclass-specific
}

class Dog extends Animal {
  makeSound(): void { console.log('Bark!'); }
}
```

> **Modern Languages Note:** Java 8+, C# 8+, and TypeScript now support **default methods** in interfaces. The key remaining differences: abstract classes can have **state** (instance fields) and enforce **single inheritance**.

**Decision Guide:**
- Need **shared state** (fields)? → Abstract Class
- Need **multiple inheritance**? → Interface
- Just **defining a contract**? → Interface (prefer for flexibility)

---

### 24. What is a Design Pattern? Why are they design solutions, not code templates?

**Answer:**

> **Source:** The definitive reference is "Design Patterns: Elements of Reusable Object-Oriented Software" (1994) by **Gamma, Helm, Johnson, and Vlissides** (the "Gang of Four" or GoF). They introduced 23 patterns in three categories: Creational, Structural, and Behavioral.

**Definition:** A Design Pattern is a **reusable solution to a commonly occurring problem** in software design. Per GoF: patterns are "descriptions or templates for how to solve a problem that can be applied in various situations."

**Why design solutions, not code templates:**
1. **Context-dependent**: Must be adapted to specific situation
2. **Language-agnostic**: Same pattern, different implementations
3. **Trade-offs**: Each pattern has pros/cons to evaluate
4. **Intent matters**: Understanding WHY is more important than HOW

**Example - Singleton Pattern:**
```typescript
// Concept: Ensure only one instance exists
// Implementation varies by language/framework

// TypeScript/NestJS: @Injectable with default scope
@Injectable()
export class ConfigService { }  // NestJS handles singleton

// Pure TypeScript
class Singleton {
  private static instance: Singleton;
  static getInstance() {
    if (!Singleton.instance) Singleton.instance = new Singleton();
    return Singleton.instance;
  }
}
```

---

### 25. How does OOAD support long-term reuse and maintainability?

**Answer:**

| OOAD Principle | Reuse Benefit | Maintainability Benefit |
|----------------|---------------|-------------------------|
| **Encapsulation** | Black-box reuse | Change internals safely |
| **Abstraction** | Interface reuse | Replace implementations |
| **Inheritance** | Extend existing code | Centralized changes |
| **Polymorphism** | Plug-compatible components | Add features without modification |
| **Low Coupling** | Independent modules | Isolated changes |

**Project Example (Pet_BE):**
- **Domain/Entity separation**: Change database without affecting business logic
- **Service layer**: Reuse business logic across controllers
- **Mapper pattern**: Change DTO structure without affecting domain

```typescript
// Reuse: Same domain model used by multiple controllers
class PetOwnerDomainModel {
  updateProfile(props) { /* business logic */ }  // Reusable
}

// Maintainability: Change persistence without touching domain
class PetOwnerMapper {
  static toDomain(entity: PetOwner): PetOwnerDomainModel { }
  static toPersistence(domain: PetOwnerDomainModel): PetOwner { }
}
// If database schema changes, only Mapper changes - domain is stable
```

---

## Section 4: OOAD in Modern Development Practices (Q26-35)

---

### 26. What role does OOAD play in Agile environments with frequently changing requirements?

**Answer:**

| Agile Challenge | OOAD Solution |
|-----------------|---------------|
| Frequent changes | Encapsulation localizes impact |
| Evolving requirements | Interfaces allow new implementations |
| Iterative development | Small, cohesive classes are easier to refactor |
| Team collaboration | Clear responsibilities enable parallel work |

**Key practices:**
- Design for change, not for perfection
- Use interfaces at boundaries
- Keep classes small and focused
- Refactor continuously

---

### 27. How can encapsulation and low coupling be applied in microservice architecture?

**Answer:**

| OOAD Principle | Microservice Application |
|----------------|--------------------------|
| **Encapsulation** | Each service hides internal data/logic, exposes only API |
| **Low Coupling** | Services communicate via contracts (REST/gRPC), not shared databases |
| **High Cohesion** | Each service owns one bounded context |

**Example:**
```
Pet Service API (encapsulated):
  POST /pets
  GET /pets/{id}
  
Internal implementation hidden:
  - Database schema
  - Caching strategy
  - Validation logic
```

---

### 28. Compare Class Diagrams and Component Diagrams for microservices.

**Answer:**

| Diagram | Level | Shows | Use Case |
|---------|-------|-------|----------|
| **Class Diagram** | Internal | Classes, attributes, methods, relationships | Design within a service |
| **Component Diagram** | External | Services, APIs, dependencies | Design between services |

**For Microservices:**
- **Component Diagram**: Shows service boundaries, API contracts, message flows
- **Class Diagram**: Shows internal structure of each service

---

### 29. How does OOAD support CI/CD pipeline construction?

**Answer:**

| OOAD Principle | CI/CD Benefit |
|----------------|---------------|
| **Encapsulation** | Services can be deployed independently |
| **Interface contracts** | Contract testing between services |
| **Low coupling** | Changes don't cascade across system |
| **Testable design** | Automated unit/integration tests |

**Pipeline Integration:**
1. **Build**: Compile each module independently
2. **Test**: Run unit tests (possible due to DI and interfaces)
3. **Deploy**: Deploy services independently (low coupling)

---

### 30. How are OOAD concepts expressed in MVC, MVP, and MVVM?

**Answer:**

> **Historical Context:** MVC was invented by **Trygve Reenskaug** in 1979 for Smalltalk. MVP emerged in the 1990s for better testability. MVVM was introduced by **Microsoft** in 2005 for WPF's data binding capabilities.

#### The Core Problem All Three Solve

All three patterns solve the same **OOAD problem**: **Separation of Concerns (SRP)** — separating UI presentation from business logic from data.

```
Before patterns:                  After patterns:
┌─────────────────────┐          ┌─────────┐ ┌─────────┐ ┌─────────┐
│  UI + Logic + Data  │    →     │  View   │ │ Logic   │ │  Model  │
│  (God Object)       │          │  (UI)   │ │ (C/P/VM)│ │ (Data)  │
└─────────────────────┘          └─────────┘ └─────────┘ └─────────┘
```

---

#### MVC (Model-View-Controller) — The Original (1979)

**Data Flow:**
```
        User Action
             │
             ▼
      ┌──────────────┐
      │  Controller  │ ─── Updates ───▶ ┌─────────┐
      └──────────────┘                   │  Model  │
             │                           └─────────┘
             │                                │
        Selects View                     Notifies (Observer)
             │                                │
             ▼                                ▼
      ┌──────────────┐ ◀──── Reads data ─────┘
      │     View     │
      └──────────────┘
```

| Component | Responsibility | OOAD Principle Applied |
|-----------|----------------|------------------------|
| **Model** | Data + Business Logic + State | **Encapsulation** - hides data implementation |
| **View** | Renders UI, observes Model changes | **Low Coupling** - doesn't know Controller |
| **Controller** | Handles input, updates Model, selects View | **SRP** - only handles user input |

**Key Insight:** View directly reads from Model → creates some coupling between UI and data structure.

---

#### MVP (Model-View-Presenter) — Testability Focus

**Data Flow:**
```
        User Action
             │
             ▼
      ┌──────────────┐                   ┌─────────┐
      │     View     │ ◀── Interface ──▶ │Presenter│
      │  (Passive)   │                   └────┬────┘
      └──────────────┘                        │
                                         Updates/Reads
                                              │
                                              ▼
                                        ┌─────────┐
                                        │  Model  │
                                        └─────────┘
```

**Key Difference from MVC:**
- View is **"dumb"** (Passive View) — only renders what Presenter tells it
- View communicates with Presenter through **interface** (decoupled)
- Presenter has **direct reference** to View interface

**Why This Enables Testing (OOAD in Action):**
```typescript
// View only implements an interface - maximum abstraction (ISP)
interface ILoginView {
  setUsername(name: string): void;
  showError(message: string): void;
  navigateToHome(): void;
}

// Presenter controls everything - can be unit tested with mock view!
class LoginPresenter {
  constructor(private view: ILoginView, private authService: AuthService) {}
  
  async onLoginClicked(username: string, password: string) {
    try {
      await this.authService.login(username, password);
      this.view.navigateToHome();  // Tell view what to do
    } catch (e) {
      this.view.showError("Login failed");
    }
  }
}

// TEST: Mock the view interface (DIP - depend on abstraction)
const mockView: ILoginView = { 
  setUsername: jest.fn(), 
  showError: jest.fn(), 
  navigateToHome: jest.fn() 
};
const presenter = new LoginPresenter(mockView, mockAuthService);
await presenter.onLoginClicked("user", "pass");
expect(mockView.navigateToHome).toHaveBeenCalled();  // ✅ Testable!
```

| OOAD Principle | How MVP Applies It |
|----------------|-------------------|
| **Interface Segregation** | View implements focused interface |
| **Dependency Inversion** | Presenter depends on IView abstraction |
| **Testability** | Mock the view interface in unit tests |

---

#### MVVM (Model-View-ViewModel) — Data Binding (2005)

**Data Flow:**
```
      ┌──────────────┐         Data Binding         ┌───────────┐
      │     View     │ ◀═══════════════════════════▶│ ViewModel │
      │   (XAML/UI)  │      (Two-way automatic)     └─────┬─────┘
      └──────────────┘                                    │
                                                     Commands/Data
                                                          │
                                                          ▼
                                                    ┌─────────┐
                                                    │  Model  │
                                                    └─────────┘
```

**Key Difference:**
- **No direct reference** between View and ViewModel
- **Data Binding** framework automatically syncs them (Observer pattern internally)
- ViewModel exposes **observable properties** and **commands**

```typescript
// ViewModel - exposes observable state (Encapsulation of UI state)
class LoginViewModel {
  @observable username: string = "";
  @observable password: string = "";
  @observable errorMessage: string = "";
  
  @action
  async login() {
    try {
      await this.authService.login(this.username, this.password);
    } catch (e) {
      this.errorMessage = "Login failed";  // UI auto-updates!
    }
  }
}
```

```xml
<!-- View - binds to ViewModel properties (Low Coupling via binding) -->
<TextInput value="{binding username}" />
<TextInput value="{binding password}" />
<Button onClick="{binding login}" />
<Text text="{binding errorMessage}" />
```

| OOAD Principle | How MVVM Applies It |
|----------------|---------------------|
| **Encapsulation** | ViewModel hides Model complexity from View |
| **Low Coupling** | View doesn't know ViewModel type (only binding keys) |
| **High Cohesion** | ViewModel groups all UI state and logic together |
| **Observer Pattern** | Data binding implements publish-subscribe internally |

---

#### Summary Comparison

| Aspect | MVC | MVP | MVVM |
|--------|-----|-----|------|
| **View knows about** | Model (reads directly) | Presenter (via interface) | Nothing (bindings only) |
| **Logic location** | Controller + Model | Presenter | ViewModel |
| **Testability** | Medium | High (mock IView) | High (test ViewModel) |
| **Coupling** | Medium | Low | Very Low |
| **Best for** | Server-side web | Legacy UI, Android | Reactive UIs, SPA |
| **Frameworks** | Rails, Express, ASP.NET MVC | Android (old), WinForms | WPF, Angular, Vue, React |

---

#### Pet_BE Architecture vs These Patterns

Pet_BE uses **Controller-Service-Repository**, which is a **backend adaptation** of MVC for APIs:

```
Classic MVC (Web):               Pet_BE (API Backend):
┌────────────┐                   ┌────────────┐
│ Controller │                   │ Controller │ ← HTTP handling only
└─────┬──────┘                   └─────┬──────┘
      │                                │
      ▼                                ▼
┌────────────┐                   ┌────────────┐
│   Model    │        →          │  Service   │ ← Business logic (extracted)
│ (data+logic)│                  └─────┬──────┘
└────────────┘                         │
                                       ▼
                                 ┌────────────┐
                                 │ Repository │ ← Data access (extracted)
                                 └─────┬──────┘
                                       │
                                       ▼
                                 ┌────────────┐
                                 │Entity/Domain│ ← Data model
                                 └────────────┘
```

**Key Insight:** Backend architectures split MVC's "Model" into **Service** (business logic) + **Repository** (data access) + **Entity** (data structure) for even finer SRP compliance. This is why Pet_BE is more maintainable than a monolithic MVC Model.

**Modern Architecture Patterns (Beyond MVC):**

| Pattern | Author | Core Idea |
|---------|--------|-----------|
| **Hexagonal (Ports & Adapters)** | Alistair Cockburn (2005) | Core logic isolated via Ports; external systems connect via Adapters |
| **Clean Architecture** | Robert Martin (2012) | Concentric rings; dependencies point inward toward business rules |
| **Onion Architecture** | Jeffrey Palermo (2008) | Domain at center; infrastructure at outer layers |

> **Dependency Rule (Clean Architecture):** Source code dependencies must always point **inward** toward higher-level policies. Business rules never depend on UI, database, or frameworks.

---

### 31. Why are MVC/MVP/MVVM natural extensions of OOAD thinking?

**Answer:**

These architectures apply OOAD principles:

1. **Separation of Concerns (SRP)**: Each layer has one responsibility
2. **Encapsulation**: Each layer hides its implementation
3. **Low Coupling**: Layers communicate through interfaces
4. **High Cohesion**: Related code grouped together

**Evolution:**
```
OOP Class → Layers (MVC) → Services → Microservices
     └─────────────── Same principles at different scales
```

---

### 32. How much OOAD design is enough in Agile to avoid "over-design"?

**Answer:**

> **Source:** The **Agile Manifesto** (2001) values "Working software over comprehensive documentation" and "Responding to change over following a plan." The principle is to avoid Big Design Up Front (BDUF) while still doing enough design.

**Balance:**
- Design enough to start coding confidently
- Don't predict all future requirements
- Refactor as understanding grows

**Guidelines:**
| Do | Don't |
|----|-------|
| Design current iteration features | Build frameworks for hypothetical needs |
| Create interfaces at integration points | Abstract everything "just in case" |
| Follow SOLID for current code | Gold-plate with unnecessary patterns |

**Project Example:** Design `PetOwner` domain model for Epic 1 needs, add fields for Epic 2 when that work begins.

---

### 33. How does OOAD reduce risk and refactoring costs in CI/CD projects?

**Answer:**

| OOAD Practice | Risk Reduction |
|---------------|----------------|
| **Encapsulation** | Changes contained within class boundaries |
| **Interfaces** | Swap implementations without breaking clients |
| **Low coupling** | Deployments are independent |
| **High cohesion** | Related bugs are localized |

**CI/CD Benefits:**
- **Faster feedback**: Isolated tests run quickly
- **Safer deployments**: Changes don't cascade
- **Easy rollback**: Services can revert independently

---

### 34. Relationship between Domain Model in OOAD and Domain-Driven Design (DDD).

**Answer:**

> **Source:** Eric Evans' "Domain-Driven Design" (2003) defines key concepts adopted in modern OOAD:
> - **Domain Model**: "A system of abstractions that describes selected aspects of a domain"
> - **Bounded Context**: "A boundary within which a particular model is defined and applicable"
> - **Aggregate**: "A cluster of associated objects treated as a unit for data changes"

| Concept | OOAD Domain Model | DDD |
|---------|-------------------|-----|
| **Focus** | Classes representing business concepts | Strategic + tactical design |
| **Scope** | Single application | Bounded contexts, microservices |
| **Patterns** | Entities, Value Objects | Aggregates, Domain Events, Repositories |

**Relationship:**
- DDD **extends** OOAD domain modeling
- OOAD domain model is the **tactical** part of DDD
- DDD adds **strategic** concepts (Bounded Contexts, Ubiquitous Language)

**Project Example:**
```typescript
// OOAD Domain Model in Pet_BE
class PetOwnerDomainModel { }  // Entity with business logic
class Pet { }                   // Associated entity
// In DDD terms: PetOwner is an Aggregate Root
```

**Advanced DDD Concepts (Beyond Basic OOAD):**

| Pattern | Purpose |
|---------|---------|
| **Domain Events** | Immutable facts about what happened (e.g., `AppointmentConfirmed`) |
| **CQRS** | Separate read models from write models for scalability |
| **Event Sourcing** | Store events instead of current state; rebuild state by replaying |

> **Domain Events:** Not in Evans' original book but now essential. Events communicate side effects across aggregates without tight coupling. Example: `AppointmentCompletedEvent` triggers invoice generation in a different bounded context.

---

### 35. In microservices, should inheritance or composition be applied?

**Answer:**

**Recommendation: Composition over Inheritance**

| Approach | Microservice Suitability |
|----------|-------------------------|
| **Inheritance** | ❌ Creates tight coupling between services |
| **Composition** | ✅ Services compose via APIs, not code sharing |

**Reasons:**
1. Services should be independently deployable
2. Shared code libraries create coupling
3. API contracts replace inheritance hierarchies

**Project Application:**
```
Services communicate via REST API (composition)
NOT: PetService extends BaseService (inheritance across boundaries)
```

> **Shared-Nothing Architecture:** Microservices should share nothing—no code, no database, no state. Each service is autonomous. Composition via APIs respects this; inheritance across services violates it.

---

## Section 5: OOAD & Testing (Q36-40)

---

### 36. Why does a well-designed OOAD system make testing easier and more effective?

**Answer:**

> **Source:** Michael Feathers ("Working Effectively with Legacy Code") defines **legacy code as "code without tests"**. He emphasizes test doubles for isolating units under test.

| OOAD Principle | Testing Benefit |
|----------------|-----------------|
| **Encapsulation** | Test classes in isolation |
| **Low Coupling** | Fewer dependencies to mock |
| **High Cohesion** | Clear what to test |
| **Dependency Injection** | Easy to inject test doubles |
| **Interfaces** | Mock implementations easily |

**Test Doubles Taxonomy:**
| Type | Purpose |
|------|---------|  
| **Stub** | Returns canned answers |
| **Mock** | Verifies interactions |
| **Fake** | Lightweight working implementation |
| **Dummy** | Fills parameter lists |
| **Spy** | Stub that records calls |

**Project Example (Pet_BE):**
```typescript
// Easy to test due to DI
class PetOwnerService {
  constructor(private repo: Repository<PetOwner>) {}
}

// In test: inject mock repository
const mockRepo = { findOne: jest.fn() };
const service = new PetOwnerService(mockRepo);
```

**Test Pyramid (Mike Cohn, 2009):**
```
        /\
       /  \  E2E (~10%) - Slow, expensive, test critical flows only
      /----\
     /      \ Integration (~20%) - Test component interactions
    /--------\
   /          \ Unit (~70%) - Fast, isolated, test business logic
  --------------
```

> **Recommended Ratio:** 70% Unit / 20% Integration / 10% E2E. Unit tests are fastest and cheapest to maintain. More tests at the base = faster feedback and lower cost.

---

### 37. What is the relationship between Interface/Implementation in OOAD and Unit Testing?

**Answer:**

**Relationship:**
1. **Interfaces** define contracts (what to test)
2. **Implementations** are swappable (mock in tests)
3. **Unit tests** verify behavior against interface contract

**Testing Flow:**
```
Production: Service → Real Repository → Database
Testing:    Service → Mock Repository → In-memory data
                       └── Same interface, different implementation
```

**Example:**
```typescript
// Interface defines contract
interface IUserRepository {
  findById(id: number): User;
}

// Production implementation
class UserRepository implements IUserRepository { /* real DB */ }

// Test implementation
class MockUserRepository implements IUserRepository {
  findById(id: number) { return { id, name: 'Test User' }; }
}
```

---

### 38. How should classes be designed to support Unit Testing and avoid external dependencies?

**Answer:**

**Design Principles for Testability:**

1. **Inject dependencies** (don't instantiate internally)
2. **Depend on interfaces** (not concrete classes)
3. **Avoid static methods** for stateful operations
4. **Keep classes small** (single responsibility)
5. **Avoid global state** (singletons with side effects)

**Project Example (Pet_BE):**
```typescript
// ✅ Testable: Dependencies injected
@Injectable()
export class PetOwnerService {
  constructor(
    @InjectRepository(PetOwner) private repo: Repository<PetOwner>,
  ) {}
  
  async findById(id: number) {
    return this.repo.findOne({ where: { petOwnerId: id } });
  }
}

// Test: Mock the repository
describe('PetOwnerService', () => {
  it('should find pet owner by id', async () => {
    const mockRepo = { findOne: jest.fn().mockResolvedValue({ petOwnerId: 1 }) };
    const service = new PetOwnerService(mockRepo as any);
    const result = await service.findById(1);
    expect(result.petOwnerId).toBe(1);
  });
});
```

---

### 39. Compare testing in poorly designed systems vs well-designed OOAD systems.

**Answer:**

| Aspect | Poor Design | Good OOAD Design |
|--------|-------------|------------------|
| **Setup** | Complex, many dependencies | Simple, inject mocks |
| **Speed** | Slow (DB, network calls) | Fast (in-memory) |
| **Coverage** | Hard to test edge cases | Easy to simulate scenarios |
| **Maintenance** | Tests break with unrelated changes | Tests isolated to class changes |
| **Reliability** | Flaky (external dependencies) | Deterministic |

**Example Comparison:**
```typescript
// ❌ Poor design: Hard to test
class OrderService {
  processOrder(orderId: number) {
    const db = new DatabaseConnection();  // Hardcoded
    const order = db.query(`SELECT * FROM orders WHERE id = ${orderId}`);
    const emailService = new EmailService();  // Hardcoded
    emailService.send(order.customerEmail, 'Order processed');
  }
}

// ✅ Good design: Easy to test
class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private emailService: IEmailService,
  ) {}
  
  processOrder(orderId: number) {
    const order = this.orderRepo.findById(orderId);
    this.emailService.send(order.customerEmail, 'Order processed');
  }
}
```

---

### 40. What is the role of Dependency Injection in OOAD with respect to Automated Testing (CI/CD)?

**Answer:**

**DI enables automated testing by:**

1. **Isolation**: Each class tested independently
2. **Speed**: No real DB/API calls in unit tests
3. **Reliability**: No external dependencies = no flaky tests
4. **Parallelization**: Independent tests run concurrently

**CI/CD Pipeline Integration:**
```
┌─────────────────────────────────────────────────────────────┐
│ CI/CD Pipeline                                               │
├─────────────────────────────────────────────────────────────┤
│ 1. Unit Tests    → Mock dependencies via DI (fast, isolated)│
│ 2. Integration   → Test with real components (some DI)      │
│ 3. E2E Tests     → Full system (production config)          │
└─────────────────────────────────────────────────────────────┘
```

**Project Example (Pet_BE - NestJS Testing):**
```typescript
// NestJS Test Module with overridden providers
const module = await Test.createTestingModule({
  providers: [
    PetOwnerService,
    {
      provide: getRepositoryToken(PetOwner),
      useValue: mockRepository,  // DI allows swapping to mock
    },
  ],
}).compile();
```

**Benefits in CI/CD:**
- ✅ Fast feedback (unit tests in seconds)
- ✅ Reliable builds (no external failures)
- ✅ Comprehensive coverage (easy to test edge cases)
- ✅ Parallel execution (independent test suites)

---

## Summary

This document provides comprehensive answers to 40 OOAD review questions, organized into 5 sections:

1. **Fundamentals & Core Concepts** (Q1-10): Basic OOP principles, class design, naming
2. **OOAD Process & Design Principles** (Q11-20): SOLID, wrappers, relationships, DI
3. **Encapsulation, Polymorphism & Abstraction** (Q21-25): Core OOP pillars, patterns
4. **OOAD in Modern Development Practices** (Q26-35): Agile, microservices, CI/CD, MVC
5. **OOAD & Testing** (Q36-40): Testability, unit testing, DI for testing

Each answer includes project-relevant examples from the Pet_BE codebase where applicable.

---

## 📋 QUICK REFERENCE (Exam Cheat Sheet)

### Key Definitions

| Term | Definition | Source |
|------|------------|--------|
| **Encapsulation** | Bundling data + methods, hiding implementation | - |
| **Information Hiding** | Design principle of what to hide | Parnas (1972) |
| **Polymorphism** | Same interface, different implementations | - |
| **Design Pattern** | Reusable solution to common problem | GoF (1994) |
| **Dependency Injection** | External provision of dependencies | Fowler (2004) |
| **Ubiquitous Language** | Shared vocabulary between code and domain | Evans (2003) |

---

### SOLID Principles (Robert Martin, 2000)

| Letter | Principle | One-Liner |
|--------|-----------|-----------|
| **S** | Single Responsibility | One class = one reason to change (one actor) |
| **O** | Open-Closed | Open for extension, closed for modification |
| **L** | Liskov Substitution | Subtypes must be behaviorally substitutable |
| **I** | Interface Segregation | Many small interfaces > one fat interface |
| **D** | Dependency Inversion | Depend on abstractions, not concretions |

---

### Relationships Cheat Sheet

| Relationship | Meaning | UML | Lifecycle |
|--------------|---------|-----|-----------|
| **Association** | Uses | Solid line | Independent |
| **Aggregation** | Has-a (shared) | ◇ Hollow diamond | Independent |
| **Composition** | Has-a (exclusive) | ◆ Filled diamond | Dependent |
| **Inheritance** | Is-a | Triangle arrow | - |

**⚠️ Is-a Trap:** Inheritance requires behavioral substitutability (LSP), not just structural similarity!

---

### Design Patterns (GoF Categories)

| Category | Purpose | Examples |
|----------|---------|----------|
| **Creational** | Object creation | Singleton, Factory, Builder |
| **Structural** | Object composition | Adapter, Decorator, Facade |
| **Behavioral** | Object interaction | Strategy, Observer, Command |

---

### Test Doubles (Feathers)

| Type | Purpose | Example |
|------|---------|---------|
| **Stub** | Returns canned answers | `findById() => hardcodedUser` |
| **Mock** | Verifies interactions | `verify(repo.save).calledOnce()` |
| **Fake** | Lightweight implementation | In-memory database |
| **Dummy** | Fills parameters | `null` or empty object |
| **Spy** | Stub + records calls | Stub that logs method calls |

---

### Common Exam "Gotchas"

| ❌ Wrong | ✅ Correct |
|----------|------------|
| Square IS-A Rectangle | Square violates LSP (setWidth changes height) |
| Stack extends ArrayList | Stack HAS-A ArrayList (composition) |
| Encapsulation = Information Hiding | Encapsulation implements information hiding |
| More getters = better encapsulation | Fewer getters = better encapsulation |
| Inheritance for code reuse | Prefer composition for code reuse |
| Design patterns are code templates | Design patterns are solution concepts |

---

### Key Principles to Remember

1. **Hollywood Principle**: "Don't call us, we'll call you" (IoC/Frameworks)
2. **Uniform Access Principle**: Access properties uniformly (Meyer)
3. **Tell, Don't Ask**: Tell objects to do work, don't ask for data
4. **Composition over Inheritance**: Prefer HAS-A over IS-A
5. **Program to Interface**: Depend on abstractions, not implementations

---

### Architecture Patterns

| Pattern | Components | Communication |
|---------|------------|---------------|
| **MVC** | Model, View, Controller | Controller mediates |
| **MVP** | Model, View, Presenter | Presenter controls View |
| **MVVM** | Model, View, ViewModel | Two-way data binding |

---

### Authoritative Sources Referenced

| Author | Work | Year | Key Contribution |
|--------|------|------|------------------|
| Gang of Four | Design Patterns | 1994 | 23 patterns |
| Robert Martin | SOLID/Clean Code/Clean Architecture | 2000-2012 | SOLID, Dependency Rule |
| Bertrand Meyer | OOSC | 1988 | OCP, DbC, UAP |
| Martin Fowler | Refactoring/DI | 2004 | DI term, patterns catalog |
| Eric Evans | DDD | 2003 | Bounded Context, Aggregates, ACL |
| Barbara Liskov | LSP Paper | 1994 | Behavioral subtyping |
| David Parnas | Information Hiding | 1972 | Module design |
| Michael Feathers | Legacy Code | 2004 | Test doubles, seams |
| Alistair Cockburn | Hexagonal Architecture | 2005 | Ports and Adapters |
| Mike Cohn | Succeeding with Agile | 2009 | Test Pyramid |

