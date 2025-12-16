# Tech-Spec: Service Layer Implementation Overview

**Created:** 2024-12-14  
**Status:** Ready for Development  
**Scope:** All 7 Epics - Service, Controller, and Infrastructure Layers

---

## Overview

### Problem Statement
The application has a complete domain layer (entities, domain models, mappers) but the service layer uses an **anemic pattern** with placeholder implementations. Services directly access repositories and return entities instead of leveraging the rich domain models.

### Solution
Refactor existing services to follow **DDD pattern**:
```
Controller → DTO → Service → Domain Model → Mapper → Repository → Entity
```

Key changes:
1. Services use **domain models** for business logic
2. Services use **mappers** for entity-domain conversion
3. Services use **factories** for complex object creation
4. Controllers use **DTOs** for request/response validation
5. Add **infrastructure** (VNPay, audit interceptor)

### Scope

**In Scope:**
- Refactor 8 existing services to use domain models
- Implement placeholder methods with actual logic
- Create missing DTOs for all domains
- Add VNPay payment integration
- Add audit logging interceptor

**Out of Scope:**
- UI/Frontend changes
- Mobile app integration
- Email/SMS notifications (future epic)

---

## Context for Development

### Codebase Patterns

**Domain Model Pattern (already established):**
```typescript
// Domain model with business logic
const appointment = AppointmentDomainModel.create({...});
appointment.confirm();  // State transition
appointment.reschedule(newDate);

// Mapper for conversion
const entity = AppointmentMapper.toPersistence(appointment);
await repository.save(entity);
```

**Service Pattern (target):**
```typescript
@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async confirmAppointment(appointmentId: number): Promise<AppointmentResponseDto> {
    // 1. Fetch entity
    const entity = await this.appointmentRepository.findOne({...});
    
    // 2. Convert to domain
    const domain = AppointmentMapper.toDomain(entity);
    
    // 3. Business logic via domain model
    domain.confirm();
    
    // 4. Persist changes
    const updatedEntity = AppointmentMapper.toPersistence(domain);
    await this.appointmentRepository.save(updatedEntity);
    
    // 5. Return DTO
    return AppointmentResponseDto.fromDomain(domain);
  }
}
```

### Files to Reference

| Type | Location | Example |
|------|----------|---------|
| Domain Models | `src/domain/` | `appointment.domain.ts` |
| Mappers | `src/mappers/` | `appointment.mapper.ts` |
| Factories | `src/factories/` | `appointment.factory.ts` |
| Entities | `src/entities/` | `appointment.entity.ts` |
| Services | `src/services/` | `appointment.service.ts` |
| Controllers | `src/controllers/` | `appointment.controller.ts` |
| DTOs | `src/dto/` | `account/` (existing pattern) |

### Technical Decisions

1. **DTOs in separate files** per domain folder (e.g., `dto/appointment/`)
2. **Response DTOs** have static `fromDomain()` factory method
3. **Validation** via `class-validator` decorators on DTOs
4. **Error handling** via NestJS exception filters
5. **Transactions** for multi-entity operations

---

## Implementation Plan by Epic

### Epic 1: User & Authentication
**Priority:** High (foundation)

| Task | Description | Complexity |
|------|-------------|------------|
| 1.1 | Create account DTOs (register, login, update) | Medium |
| 1.2 | Refactor AccountService to use AccountDomainModel | Medium |
| 1.3 | Implement JWT authentication flow | High |
| 1.4 | Add password hashing with bcrypt | Low |
| 1.5 | Implement role-based guards | Medium |

---

### Epic 2: Pet & Medical Domain
**Priority:** High (core functionality)

| Task | Description | Complexity |
|------|-------------|------------|
| 2.1 | Create pet DTOs | Low |
| 2.2 | Refactor PetService to use PetDomainModel | Medium |
| 2.3 | Implement soft delete with restore | Low (already done) |
| 2.4 | Create medical-record DTOs | Low |
| 2.5 | Refactor MedicalRecordService to use domain model | Medium |
| 2.6 | Implement vaccination history endpoints | Medium |

---

### Epic 3: Service & Schedule Domain
**Priority:** Medium

| Task | Description | Complexity |
|------|-------------|------------|
| 3.1 | Create service DTOs | Low |
| 3.2 | Refactor ServiceService to use ServiceDomainModel | Medium |
| 3.3 | Create work-schedule DTOs | Low |
| 3.4 | Refactor ScheduleService to use WorkScheduleDomainModel | Medium |
| 3.5 | Implement availability checking | Medium |

---

### Epic 4: Appointment Booking
**Priority:** High (core workflow)

| Task | Description | Complexity |
|------|-------------|------------|
| 4.1 | Create appointment DTOs | Medium |
| 4.2 | Refactor AppointmentService to use AppointmentDomainModel | High |
| 4.3 | Use AppointmentFactory for booking | Medium |
| 4.4 | Implement state transitions (confirm, cancel, complete) | Medium |
| 4.5 | Implement schedule conflict detection | High |
| 4.6 | Implement reschedule with validation | Medium |

---

### Epic 5: Invoice & Payment
**Priority:** High (revenue)

| Task | Description | Complexity |
|------|-------------|------------|
| 5.1 | Create invoice DTOs | Medium |
| 5.2 | Refactor PaymentService to use domain models | High |
| 5.3 | Implement VNPay integration | High |
| 5.4 | Implement payment status callbacks | High |
| 5.5 | Archive gateway responses | Medium |

---

### Epic 6: Audit & Reports
**Priority:** Medium

| Task | Description | Complexity |
|------|-------------|------------|
| 6.1 | Create audit logging interceptor | High |
| 6.2 | Refactor ReportService to use AuditLogDomainModel | Medium |
| 6.3 | Implement audit trail queries | Medium |
| 6.4 | Implement revenue reports | Medium |

---

### Epic 7: Cage & Boarding
**Priority:** Low (new feature)

| Task | Description | Complexity |
|------|-------------|------------|
| 7.1 | Create cage DTOs | Low |
| 7.2 | Create CageService with CageDomainModel | Medium |
| 7.3 | Create cage-assignment DTOs | Low |
| 7.4 | Create CageAssignmentService | Medium |
| 7.5 | Integrate with appointment booking | Medium |
| 7.6 | Implement cage availability check | Medium |

---

## Cross-Cutting Concerns

### DTOs to Create

| Epic | DTOs Needed |
|------|-------------|
| 1 | RegisterDto, LoginDto, AccountResponseDto, UpdateProfileDto |
| 2 | CreatePetDto, UpdatePetDto, PetResponseDto, CreateMedicalRecordDto, MedicalRecordResponseDto |
| 3 | CreateServiceDto, UpdateServiceDto, ServiceResponseDto, CreateScheduleDto, ScheduleResponseDto |
| 4 | CreateAppointmentDto, RescheduleDto, AppointmentResponseDto, StatusUpdateDto |
| 5 | CreateInvoiceDto, InvoiceResponseDto, CreatePaymentDto, PaymentResponseDto, VNPayCallbackDto |
| 6 | AuditLogQueryDto, AuditLogResponseDto, ReportQueryDto |
| 7 | CreateCageDto, CageResponseDto, CreateAssignmentDto, AssignmentResponseDto |

### Suggested Implementation Order

```
Epic 1 (Auth) → Must be first for security
    ↓
Epic 2 (Pet) → Core entity
    ↓
Epic 3 (Service) → Required for appointments
    ↓
Epic 4 (Appointment) → Core workflow
    ↓
Epic 5 (Payment) → Revenue, VNPay
    ↓
Epic 6 (Audit) → Cross-cutting
    ↓
Epic 7 (Cage) → New feature, depends on 2+4
```

---

## Acceptance Criteria

**Per-Epic Success:**
- [ ] All placeholder methods implemented
- [ ] Services use domain models (not direct entity manipulation)
- [ ] DTOs created with validation
- [ ] Controller endpoints tested via Swagger
- [ ] Build passes

**Overall Success:**
- [ ] All 8 services refactored to DDD pattern
- [ ] VNPay integration working
- [ ] Audit logging capturing changes
- [ ] Authentication protecting endpoints

---

## Dependencies

- **External:** VNPay sandbox account, API credentials
- **Internal:** Domain models (✅ complete), Mappers (✅ complete)

## Testing Strategy

1. **Manual Testing:** Swagger UI for endpoint testing
2. **Integration Tests:** Per-epic as stretch goal
3. **VNPay Testing:** Sandbox environment

## Notes

- Existing placeholder code provides good method signatures
- Domain models already have state transition logic
- Focus on wiring up layers, not redesigning APIs
