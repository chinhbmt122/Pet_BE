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
// Class definition
class Pet {
  name: string;
  species: string;
}

// Objects (instances)
const dog1 = new Pet();  // Object 1
const cat1 = new Pet();  // Object 2
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

---

### 13. What is an Object Wrapper? Describe its role.

**Answer:**

An **Object Wrapper** encapsulates non-OO code, legacy systems, or external resources in an OO interface.

**Roles:**
1. **Abstraction**: Hide complex/non-OO implementation details
2. **Isolation**: Protect system from external changes
3. **Unified interface**: Provide consistent API regardless of underlying technology

**Project Example (Pet_BE):**
```typescript
// TypeORM Repository wraps database access
@Injectable()
export class PetOwnerService {
  constructor(
    @InjectRepository(PetOwner)
    private petOwnerRepository: Repository<PetOwner>, // Wrapper around SQL
  ) {}
}
```

---

### 14. Compare wrapping structured code, non-portable code, and existing classes.

**Answer:**

| Wrapper Type | Purpose | Example |
|--------------|---------|---------|
| **Structured Code** | Convert procedural code to OO | Wrap C library in C++ class |
| **Non-Portable Code** | Isolate platform-specific logic | Wrap Windows API for cross-platform |
| **Existing Classes** | Adapt interface to needs | Adapter pattern around third-party library |

**Common Goal:** Create a stable, consistent interface that shields clients from:
- Implementation complexity
- Platform differences
- Third-party API changes

---

### 15. Analyze the Is-a and Has-a relationships. Provide an example of incorrect design.

**Answer:**

| Relationship | Meaning | Implementation |
|--------------|---------|----------------|
| **Is-a** | Subtype/inheritance | `Dog IS-A Animal` → `Dog extends Animal` |
| **Has-a** | Composition/containment | `Car HAS-A Engine` → `Car` contains `Engine` |

**Common Incorrect Design:**
```typescript
// ❌ WRONG: Stack is NOT a type of ArrayList
class Stack extends ArrayList {
  push(item): void { this.add(item); }
  pop(): T { return this.remove(this.size() - 1); }
}
// Problem: Stack inherits ALL ArrayList methods (get, insert, etc.)

// ✅ CORRECT: Stack HAS-A list for storage
class Stack {
  private items: ArrayList = new ArrayList();
  push(item): void { this.items.add(item); }
  pop(): T { return this.items.remove(this.items.size() - 1); }
}
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
2. Parent changes break subclass (fragile base class problem)
3. Subclass must expose inherited methods it shouldn't have

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

| Relationship | Lifecycle | Dependency | Example |
|--------------|-----------|------------|---------|
| **Association** | Independent | Weak | `Doctor` treats `Patient` |
| **Aggregation** | Independent | Medium | `Team` has `Players` (players exist without team) |
| **Composition** | Dependent | Strong | `House` has `Rooms` (rooms don't exist without house) |

**Project Example (Pet_BE):**
```typescript
// Composition: Pet cannot exist without PetOwner
@Entity('pets')
class Pet {
  @ManyToOne(() => PetOwner, { onDelete: 'CASCADE' })
  owner: PetOwner;  // Pet's lifecycle tied to PetOwner
}

// Association: Appointment references Veterinarian
class Appointment {
  veterinarianId: number;  // Vet exists independently
}
```

---

### 18. How does Dependency Injection reduce coupling?

**Answer:**

**Without DI (High Coupling):**
```typescript
class OrderService {
  private db = new MySQLDatabase();  // Hardcoded dependency
}
```

**With DI (Low Coupling):**
```typescript
class OrderService {
  constructor(private db: IDatabase) {}  // Injected dependency
}
```

**Benefits:**
1. **Testability**: Inject mock database for testing
2. **Flexibility**: Swap implementations without code changes
3. **Decoupling**: Class depends on interface, not implementation
4. **Configuration**: Dependencies configured externally

**Project Example (Pet_BE - NestJS):**
```typescript
@Injectable()
export class PetOwnerService {
  constructor(
    @InjectRepository(PetOwner) private repo: Repository<PetOwner>,
    private accountService: AccountService,  // DI by NestJS
  ) {}
}
```

---

### 19. What is the relationship between Interface, Abstract Class, and Framework?

**Answer:**

| Concept | Purpose | Contains |
|---------|---------|----------|
| **Interface** | Pure contract | Method signatures only |
| **Abstract Class** | Partial implementation | Some implementation + abstract methods |
| **Framework** | Skeleton application | Interfaces + abstract classes + concrete code |

**Relationship:**
- Frameworks define **interfaces** for extension points
- Frameworks provide **abstract classes** as convenient base implementations
- Developers **implement interfaces** or **extend abstract classes** to customize

```
Framework = Interfaces + Abstract Classes + Wiring
           └── Extensibility points for application code
```

---

### 20. Analyze consequences of violating a SOLID principle (choose one).

**Answer: Single Responsibility Principle (SRP)**

**Principle:** A class should have only one reason to change.

**Violation Example:**
```typescript
// ❌ God class with multiple responsibilities
class UserManager {
  validateUser(): void { }
  saveToDatabase(): void { }
  sendEmail(): void { }
  generateReport(): void { }
  hashPassword(): void { }
}
```

**Consequences:**
1. **Hard to test**: Must mock DB, email, and crypto for any test
2. **Frequent changes**: Any requirement change affects this class
3. **Merge conflicts**: Multiple developers touch same file
4. **Ripple effects**: Bug fix in email breaks password hashing

**Project Fix (Pet_BE):**
```typescript
// ✅ Separated responsibilities
class AuthService { authenticate(): void { } }
class AccountService { save(): void { } }
class EmailService { send(): void { } }
```

---

## Section 3: Encapsulation, Polymorphism & Abstraction (Q21-25)

---

### 21. Why is encapsulation considered the foundation of OOAD? What decisions break encapsulation?

**Answer:**

**Why foundation:**
1. **Hides complexity**: Clients don't need to understand implementation
2. **Enables change**: Internal changes don't affect clients
3. **Protects invariants**: Object controls its own state
4. **Reduces coupling**: Dependencies on interfaces, not implementations

**Design decisions that BREAK encapsulation:**
1. **Public attributes**: Direct access to internal state
2. **Getter/Setter for everything**: Exposes internal structure
3. **Returning mutable internal collections**
4. **Inheritance exposing protected implementation details**
5. **Friend classes / package-private abuse**

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

---

### 24. What is a Design Pattern? Why are they design solutions, not code templates?

**Answer:**

**Definition:** A Design Pattern is a **reusable solution to a commonly occurring problem** in software design.

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

| Architecture | Objects | Responsibilities | Collaboration |
|--------------|---------|------------------|---------------|
| **MVC** | Model, View, Controller | Data, UI, Logic | Controller mediates |
| **MVP** | Model, View, Presenter | Data, UI, Logic | Presenter controls View |
| **MVVM** | Model, View, ViewModel | Data, UI, Binding | Two-way data binding |

**Project Example (Pet_BE follows Controller-Service-Repository):**
```
Controller → Handles HTTP requests (like Controller in MVC)
Service → Business logic (like Model logic)
Entity/Domain → Data model (Model)
```

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

---

## Section 5: OOAD & Testing (Q36-40)

---

### 36. Why does a well-designed OOAD system make testing easier and more effective?

**Answer:**

| OOAD Principle | Testing Benefit |
|----------------|-----------------|
| **Encapsulation** | Test classes in isolation |
| **Low Coupling** | Fewer dependencies to mock |
| **High Cohesion** | Clear what to test |
| **Dependency Injection** | Easy to inject test doubles |
| **Interfaces** | Mock implementations easily |

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
