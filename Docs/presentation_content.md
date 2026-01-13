# SE100 Pet Care - Presentation Content

## 1. Overview & Problem Statement

**System Name:** PAW LOVERS Pet Care Service Management System  
**Version:** 2.0 | **Team:** Group 9 (SE100)

### Problem
Pet clinics struggle with:
- Manual paper-based record keeping
- Phone-based appointment scheduling  
- Cash-only payments
- Spreadsheet tracking for schedules

### Solution
Full-stack web application for pet care center digitization.

**Target Users:** Pet Owner, Manager, Veterinarian, Care Staff, Receptionist

### In Scope 

**Account & Access**
- User registration & authentication (JWT)
- Role-based access control (5 roles)
- Password reset via email

**Pet & Owner Management**
- Pet profiles (species, breed, weight, health status)
- Owner profiles with multiple pets
- Search & filter capabilities

**Appointment & Booking**
- Online appointment booking by pet owners
- Counter booking by receptionists
- Status lifecycle (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED)
- Appointment cancellation

**Service Catalog**
- Categories: Medical, Grooming, Spa, Boarding
- Service pricing & duration
- Multi-service appointments

**Staff Management**
- Work schedule management
- Task assignment & tracking
- Availability checking

**Medical Records**
- Examination records (diagnosis, treatment)
- Vaccination history with auto-calculated due dates
- Follow-up tracking

**Payment & Invoicing**
- Invoice generation from completed appointments
- Multiple payment methods (Cash, Bank Transfer, VNPay)
- Online payment with VNPay gateway
- Payment history & receipts

**Cage & Boarding**
- Cage inventory management
- Pet check-in/check-out
- Cage status tracking (Available, Occupied, Cleaning, Maintenance)

**Reports & Analytics**
- Financial reports (revenue, trends)
- Appointment statistics
- Service performance metrics
- Employee workload analysis
- Customer retention reports

### Out of Scope 
- Mobile native applications
- Advanced accounting (payroll, tax)
- Inventory management
- Real-time notifications (WebSocket)
- Multi-clinic support

---

## 2. Tech Stack

### Backend (Pet_BE)
| Layer | Technology |
|-------|------------|
| Framework | NestJS 11 + TypeScript 5.7 |
| Database | PostgreSQL 15 + TypeORM 0.3.28 |
| Auth | JWT + Passport.js (24h expiry) |
| Testing | Jest + Supertest |
| Payments | VNPay (sandbox + production) |
| i18n | nestjs-i18n (Vietnamese UI) |
| Docs | Swagger/OpenAPI |

### Frontend (do-an-thu-cung)
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) + React 18 |
| Styling | TailwindCSS 3.4 |
| API Client | Axios with interceptors |
| Components | 47 React components |

---

## 3. Architecture Overview

### 3.1 Deployment View (Physical Tiers)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   CLIENT     │    │  APPLICATION │    │    DATA      │
│   Browser    │───▶│   NestJS     │───▶│  PostgreSQL  │
│              │    │   (Render)   │    │   (Render)   │
└──────────────┘    └──────────────┘    └──────────────┘
       ↑                   ↑
┌──────────────┐           │
│  Next.js FE  │───────────┘
│  (Vercel)    │  REST API (JWT)
└──────────────┘
```

### 3.2 Backend Layers (NestJS)

```
┌─────────────────────────────────────────────────────────┐
│  Controller Layer (14 controllers, 137 endpoints)       │
│  - Route handling, request validation, JWT guards       │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│  Service Layer (17 services)                             │
│  - Business logic, transactions, orchestration          │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│  Domain Layer (14 domain models + 14 mappers)           │
│  - Encapsulated business rules, state transitions       │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│  Repository Layer (TypeORM, 22 entities)                │
│  - Data access, queries, persistence                    │
└─────────────────────────────────────────────────────────┘
```

### 3.3 External Integrations

| Service | Purpose |
|---------|---------|
| VNPay Gateway | Online payment processing |
| SMTP (Email) | Password reset, notifications |

---

## 4. Patterns & Principles Applied

### 4.1 Design Patterns

| Pattern | Implementation |
|---------|----------------|
| **Domain Model** | 14 domain models (`src/domain/`) encapsulating business rules |
| **Data Mapper** | 14 mappers (`src/mappers/`) - Entity ↔ Domain conversion |
| **Factory** | 4 factories for complex object creation (Account, Employee, Appointment) |
| **Repository** | TypeORM `Repository<T>` with `@InjectRepository()` |
| **Single Table Inheritance** | Employee hierarchy: Vet, CareStaff, Manager, Receptionist |
| **Guard** | `AuthGuard` (JWT), `RolesGuard` (RBAC) |
| **Strategy** | `IPaymentGatewayService` - swap VNPay/Momo/ZaloPay |
| **Interceptor** | Response standardization, request logging |

### 4.2 SOLID Principles

| Principle | Evidence |
|-----------|----------|
| **S** - SRP | 17 separate services (PaymentService ≠ InvoiceService) |
| **O** - OCP | Add payment gateways via `IPaymentGatewayService` interface |
| **L** - LSP | Employee subtypes (Vet, CareStaff) are substitutable |
| **I** - ISP | Separate DTOs for each endpoint |
| **D** - DIP | Services depend on `Repository<T>` abstraction |

### 4.3 OOP Principles

| Principle | Evidence |
|-----------|----------|
| **Encapsulation** | Domain models: private `_status`, public `confirm()`, `cancel()` |
| **Inheritance** | Employee → Veterinarian, CareStaff, Manager, Receptionist |
| **Polymorphism** | `IPaymentGatewayService` - different gateway implementations |
| **Abstraction** | Interfaces hide implementation (`Repository<T>`, DTOs) |

### 4.4 Other Principles

| Principle | Implementation |
|-----------|----------------|
| **DRY** | `OwnershipValidationHelper` shared across 4 services |
| **Separation of Concerns** | Controller → Service → Repository |

---

## 5. Key Metrics

| Metric | Value |
|--------|-------|
| Use Cases | 36 |
| Entities | 22 |
| Domain Models | 14 |
| API Endpoints | 137 |
| Controllers | 14 |
| Services | 17 |
| Components (FE) | 47 |
| Unit Tests | 331 |

---

## 6. Lessons Learned

**What went well:**
- DDD structure scales well with 22 entities
- TypeORM Single Table Inheritance simplified Employee hierarchy
- NestJS DI makes unit testing straightforward

**Future improvements:**
- Redis caching for frequently accessed data
- WebSocket for real-time notifications
- API rate limiting for production
