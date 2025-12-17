# Pet Care System - OOSDM Architecture Defense

**Course:** Object-Oriented Software Development Methodology  
**Date:** 2024-12-14  
**Project:** Pet Care System - Rich Domain Model Implementation

---

## 1. Executive Summary

This document defends the architectural decisions made in the Pet Care System, demonstrating alignment with Object-Oriented Analysis and Design (OOAD) principles as taught in major textbooks and industry best practices.

---

## 2. Applied Architecture Pattern: BCE (Boundary-Control-Entity)

### 2.1 What We Applied

Our system follows the **Boundary-Control-Entity (BCE)** pattern, originated by Ivar Jacobson in OOSE (Object-Oriented Software Engineering).

```
┌─────────────────────────────────────────────────────────────────┐
│                       BCE ARCHITECTURE                          │
│                                                                 │
│   Actor ──► Boundary ──► Control ──► Entity (with behavior)     │
│     │          │            │              │                    │
│   User     Controller    Service      Domain Model              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer Mapping

| BCE Layer | Our Implementation | Responsibility |
|-----------|-------------------|----------------|
| **Actor** | PetOwner, Receptionist, Veterinarian | External users |
| **Boundary** | Controllers (`AppointmentController`) | Interface to system |
| **Control** | Services (`AppointmentService`) | Use case orchestration |
| **Entity** | Domain Models (`AppointmentDomainModel`) | Data + Business Logic |

### 2.3 Academic References

> **Hassan Gomaa** - *Software Modeling and Design: UML, Use Cases, Patterns, and Software Architectures* (Cambridge, 2011):
> 
> *"The BCE pattern categorizes classes into Boundary (interface), Control (application logic), and Entity (persistent domain objects). Entity objects hold business knowledge and data."*

> **Ivar Jacobson** - OOSE Method:
> 
> *"Use case realization describes how boundary, control, and entity objects collaborate to fulfill use case functionality."*

---

## 3. Rich Domain Model vs Anemic Domain Model

### 3.1 What We Applied

We implemented **Rich Domain Models** where entities contain both **data and behavior**.

```typescript
// RICH DOMAIN MODEL (What we implemented)
class AppointmentDomainModel {
  // Private State
  private _status: AppointmentStatus;
  
  // BEHAVIOR - Business logic encapsulated in the entity
  confirm(): void {
    if (!this.canConfirm()) throw new Error('Cannot confirm');
    this._status = AppointmentStatus.CONFIRMED;
  }
  
  cancel(reason: string): void { ... }
  complete(): void { ... }
  
  // GUARD METHODS - Self-validation
  canConfirm(): boolean { return this._status === 'PENDING'; }
}
```

### 3.2 Why Not Anemic?

```typescript
// ANEMIC MODEL (What we avoided)
class AppointmentEntity {
  status: string;  // Just data, no behavior
}

// Service has ALL logic - violates OO principles
class AppointmentService {
  confirm(id: number) {
    const entity = await repo.findOne(id);
    if (entity.status !== 'PENDING') throw new Error(...);
    entity.status = 'CONFIRMED';  // Direct mutation
  }
}
```

### 3.3 Academic References

> **Martin Fowler** - *Patterns of Enterprise Application Architecture*:
> 
> *"The Anemic Domain Model is an anti-pattern. Objects should have both data and behavior. If entities are just data containers with getters/setters, you're doing procedural programming with classes."*

> **Grady Booch** - *Object-Oriented Analysis and Design with Applications* (Addison-Wesley, 2007):
> 
> *"At the core of OO are objects encapsulating both data (attributes) and behavior (methods). A class serves as a blueprint defining common structure and behavior."*

> **Eric Evans** - *Domain-Driven Design* (2003):
> 
> *"Entities have unique identity and encapsulate both data and domain logic. They define 'what the object can do' and enforce business invariants."*

---

## 4. Design Patterns Applied

### 4.1 Factory Pattern

**Where Applied:** `AppointmentFactory`, `AccountFactory`

```typescript
// Factory encapsulates complex creation logic
class AppointmentFactory {
  static createBooking(props: {...}): AppointmentDomainModel {
    // Validation, defaults, complex assembly
    return AppointmentDomainModel.create({...});
  }
}
```

**Reference:**
> **Alexander Shvets** - *Dive Into Design Patterns* (2019):
> *"Factory Method defines an interface for creating objects, letting subclasses decide which class to instantiate."*

### 4.2 State Pattern

**Where Applied:** `AppointmentDomainModel`, `InvoiceDomainModel`, `PaymentDomainModel`, `CageDomainModel`

```typescript
// State transitions with guard methods
class AppointmentDomainModel {
  private _status: AppointmentStatus;
  
  confirm(): void {
    if (this._status !== AppointmentStatus.PENDING) {
      throw new Error('Invalid state transition');
    }
    this._status = AppointmentStatus.CONFIRMED;
  }
}
```

**State Diagram:**
```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
    ↓         ↓
CANCELLED ← ─ ┘
```

**Reference:**
> **GoF (Gang of Four)** - *Design Patterns* (1994):
> *"State Pattern allows an object to alter its behavior when its internal state changes."*

### 4.3 Data Mapper Pattern

**Where Applied:** All Mappers (`AppointmentMapper`, `PetMapper`, etc.)

```typescript
class AppointmentMapper {
  static toDomain(entity: Appointment): AppointmentDomainModel {
    return AppointmentDomainModel.reconstitute({...});
  }
  
  static toPersistence(domain: AppointmentDomainModel): Appointment {
    return { ...domain properties };
  }
}
```

**Reference:**
> **Martin Fowler** - *Patterns of Enterprise Application Architecture*:
> *"Data Mapper separates in-memory objects from the database, transferring data while keeping them independent."*

---

## 5. OO Principles Demonstrated

### 5.1 Encapsulation

```typescript
class AppointmentDomainModel {
  // PRIVATE state - cannot be modified directly
  private _status: AppointmentStatus;
  
  // PUBLIC methods control state changes
  confirm(): void { ... }  // Only way to change status
  
  // GETTER for read access
  get status(): AppointmentStatus { return this._status; }
}
```

**Reference:**
> **Stephen Schach** - *Object-Oriented and Classical Software Engineering* (McGraw Hill, 2010):
> *"Encapsulation hides internal state and requires all interaction through well-defined interfaces."*

### 5.2 Single Responsibility Principle (SRP)

| Component | Single Responsibility |
|-----------|----------------------|
| **Controller** | HTTP handling, routing |
| **Service** | Use case orchestration |
| **Domain Model** | Business logic + invariants |
| **Mapper** | Entity ↔ Domain conversion |
| **Repository** | Data persistence |

**Reference:**
> **Robert C. Martin** - *Clean Code* (2008):
> *"A class should have one, and only one, reason to change."*

### 5.3 Information Expert (GRASP)

Business logic is placed where the data lives:

```typescript
class InvoiceDomainModel {
  private _status: InvoiceStatus;
  private _paidAt: Date | null;
  
  // Invoice KNOWS how to pay itself
  payByCash(): void {
    this._status = InvoiceStatus.PAID;
    this._paidAt = new Date();
  }
}
```

**Reference:**
> **Craig Larman** - *Applying UML and Patterns* (2004):
> *"Assign responsibility to the class that has the information needed to fulfill it."*

---

## 6. Robustness Diagram Connection Rules

Our architecture follows Jacobson's robustness diagram rules:

| Source | Can Communicate With | Cannot Communicate With |
|--------|---------------------|------------------------|
| **Actor** | Boundary only | Control, Entity |
| **Boundary** | Actor, Control | Entity directly |
| **Control** | Boundary, Entity, Control | Actor |
| **Entity** | Control only | Actor, Boundary |

**Our Implementation:**
```
PetOwner (Actor)
    │
    ▼ HTTP Request
AppointmentController (Boundary)
    │
    ▼ Method call
AppointmentService (Control)
    │
    ▼ Method call
AppointmentDomainModel.confirm() (Entity with behavior)
```

---

## 7. Summary: Why Our Architecture is OOSDM Compliant

| OOSDM Requirement | How We Fulfill It |
|-------------------|-------------------|
| Objects have data + behavior | ✅ Domain models have state transitions, guards, computed properties |
| Encapsulation | ✅ Private fields, public methods |
| Use Case Realization | ✅ BCE pattern: Boundary → Control → Entity |
| State Pattern for lifecycle | ✅ Appointment, Invoice, Payment, Cage |
| Factory Pattern for creation | ✅ AppointmentFactory, AccountFactory |
| Separation of Concerns | ✅ Controller, Service, Domain, Mapper, Repository |

---

## 8. Reference Bibliography

1. **Grady Booch, Robert A. Maksimchuk** - *Object-Oriented Analysis and Design with Applications*, Addison-Wesley, 2007

2. **Hassan Gomaa** - *Software Modeling and Design: UML, Use Cases, Patterns, and Software Architectures*, Cambridge University Press, 2011

3. **Raul Sidnei Wazlawick** - *Object-Oriented Analysis and Design for Information Systems*, Morgan Kaufmann, 2014

4. **Stephen Schach** - *Object-Oriented and Classical Software Engineering*, McGraw Hill, 2010

5. **Matt Weisfeld** - *The Object-Oriented Thought Process*, Addison-Wesley, 2019

6. **Ian Sommerville** - *Software Engineering (10th edition)*, Addison Wesley, 2021

7. **Alexander Shvets** - *Dive Into Design Patterns*, 2019

8. **Eric Evans** - *Domain-Driven Design: Tackling Complexity in the Heart of Software*, 2003

9. **Martin Fowler** - *Patterns of Enterprise Application Architecture*, 2002

10. **Ivar Jacobson** - *Object-Oriented Software Engineering: A Use Case Driven Approach*, 1992

---

## 9. Appendix: Domain Model Behavior Catalog

### Appointment Domain Model
| Method | Type | Description |
|--------|------|-------------|
| `confirm()` | State Transition | PENDING → CONFIRMED |
| `cancel(reason)` | State Transition | → CANCELLED |
| `startExecution()` | State Transition | CONFIRMED → IN_PROGRESS |
| `complete()` | State Transition | IN_PROGRESS → COMPLETED |
| `canConfirm()` | Guard | Returns boolean |
| `canCancel()` | Guard | Returns boolean |

### Invoice Domain Model
| Method | Type | Description |
|--------|------|-------------|
| `payByCash()` | State Transition | PENDING → PAID |
| `startOnlinePayment()` | State Transition | PENDING → PROCESSING_ONLINE |
| `markPaid()` | State Transition | PROCESSING_ONLINE → PAID |
| `markFailed()` | State Transition | PROCESSING_ONLINE → FAILED |
| `applyDiscount()` | Update | Apply discount amount |

### Payment Domain Model
| Method | Type | Description |
|--------|------|-------------|
| `processCash()` | State Transition | PENDING → SUCCESS |
| `startOnlinePayment()` | State Transition | PENDING → PROCESSING |
| `markSuccess()` | State Transition | PROCESSING → SUCCESS |
| `markFailed()` | State Transition | PROCESSING → FAILED |
| `refund()` | State Transition | SUCCESS → REFUNDED |

### Cage Domain Model
| Method | Type | Description |
|--------|------|-------------|
| `markOccupied()` | State Transition | AVAILABLE/RESERVED → OCCUPIED |
| `markAvailable()` | State Transition | OCCUPIED/RESERVED → AVAILABLE |
| `markMaintenance()` | State Transition | → MAINTENANCE |
| `reserve()` | State Transition | AVAILABLE → RESERVED |
| `canAssign()` | Guard | AVAILABLE or RESERVED |

### CageAssignment Domain Model
| Method | Type | Description |
|--------|------|-------------|
| `checkOut()` | State Transition | ACTIVE → COMPLETED |
| `cancel()` | State Transition | ACTIVE → CANCELLED |
| `extend(newDate)` | Update | Extend stay duration |
| `calculateTotalCost()` | Computed | Days × Rate |
| `getDaysRemaining()` | Computed | Until checkout |
