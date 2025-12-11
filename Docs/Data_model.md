
||<p>University of Information Technology</p><p>**The Faculty of Software Engineering**</p><p></p>|
| :- | -: |
**Object-Oriented Software Development Project**






**Data Model**\
**PAW LOVERS Pet Care Service Management System**

Version 3.0







Students:

23520406 – Đặng Ngọc Trường Giang

23520444 – Đặng Trần Anh Hào

23520187 - Lê Hùng Chính

23520421 - Trần Đức Hải


|PAW LOVERS Pet Care Service Management System|Version: 3.0|
| :- | :- |
|Database Schema and Data Model Documentation|Date: 17/11/2025|


**Document change record sheet**

|**Date**|**Version**|**Description**|**Authors**|
| :-: | :-: | :-: | :-: |
|16/11/2025|1.0|Initial database schema design with TypeORM entities|Group 9|
|17/11/2025|2.0|Architectural improvements: removed denormalization, added generated columns, optimized indexes|Winston (Architect)|
|17/11/2025|3.0|Complete redesign following OOAD principles (SRP, DRY, Referential Integrity, Law of Demeter)|Winston + Khổ Qua|
|||||

**Table of contents**

[1. OOAD Principles Applied	3](#_ooad_principles)

[2. Logic Diagram	4](#_toc176928159)

[3. Entity Specifications	5](#_toc176928160)

[3.1. Identity & Access Entities	5](#_identity_entities)

[3.2. Core Business Entities	8](#_business_entities)

[3.3. Transaction Entities	12](#_transaction_entities)

[3.4. Supporting Tables	16](#_supporting_tables)

[4. OOAD Design Decisions	17](#_ooad_decisions)

[5. Database Views and Functions	18](#_views_procedures)


# <a name="_ooad_principles"></a>**1. OOAD Principles Applied to Database Design**

This data model strictly adheres to Object-Oriented Analysis & Design (OOAD) principles:

## **1.1 Single Responsibility Principle (SRP)**
**Applied:** Each table has ONE reason to change
- `Account`: Authentication and basic user data only
- `PetOwner`: Customer-specific data only (separated from Account)
- `Employee`: Staff-specific data only (separated from Account)
- `Pet`: Pet demographics only (medical data in separate MedicalRecord table)
- `MedicalRecord`: Medical examination data only
- `Vaccination`: Vaccination data only (not embedded in MedicalRecord)
- `WorkSchedule`: Employee availability only
- `Appointment`: Booking transactions only
- `Invoice`: Billing data only
- `Payment`: Payment transactions only

## **1.2 Referential Integrity**
**Applied:** All relationships enforced via Foreign Keys
- Every FK has corresponding index for performance
- ON DELETE policies match business rules:
  - CASCADE: When parent deletion should remove children (Account → PetOwner)
  - RESTRICT: When children must be handled first (Pet → Appointment)
  - SET NULL: When historical reference is optional (Employee → Payment.receivedBy)

## **1.3 Don't Repeat Yourself (DRY)**
**Applied:** Single source of truth for all data
- **Removed**: Denormalized counters (totalPets)
- **Removed**: Duplicate employee references (scheduleId removed from Appointment)
- **Added**: Computed/generated columns for derived data (Pet.age)
- **Strategy**: Use aggregate queries with proper indexes instead of cached counts

## **1.4 Law of Demeter (Principle of Least Knowledge)**
**Applied:** Entities only reference immediate neighbors
- Appointment → Employee (direct, not through Schedule)
- Appointment → Pet → Owner (indirect via Pet, not direct owner reference)
- Medical Record → Pet → Owner (indirect, follows relationship chain)

## **1.5 Open/Closed Principle**
**Applied:** Extensible without modification
- JSONB fields for variable data (medical_summary, attachments, gatewayResponse)
- Enum-like VARCHAR fields for extensible value sets (species, service category)
- Abstract payment interface supports multiple gateways

## **1.6 Separation of Concerns**
**Applied:** Different aspects separated into different structures
- **Authentication**: Account table
- **Authorization**: userType discriminator + application-layer RBAC
- **Business Logic**: Core entity tables
- **Audit Trail**: Separate AuditLog table
- **Archival**: PaymentGatewayArchive table

## **1.7 Interface Segregation Principle (ISP)**
**Applied:** Views provide role-specific interfaces
- v_owner_dashboard: Pet owners see only their data
- v_vet_schedule: Veterinarians see medical-relevant data
- v_receptionist_appointments: Receptionists see booking data
- Each role gets minimal necessary data, not bloated universal view

## **1.8 Entity Integrity**
**Applied:** Every entity has unique identifier
- All tables have SERIAL PRIMARY KEY
- Natural keys (email, microchipId) have UNIQUE constraints
- Composite unique constraints prevent duplicate bookings

## **1.9 Encapsulation**
**Applied:** Internal complexity hidden via database objects
- **Views**: Hide complex JOINs from application
- **Functions**: Encapsulate business logic (check_schedule_conflict)
- **Triggers**: Enforce invariants (updatedAt auto-update, invoice calculation)

## **1.10 Composition Over Inheritance**
**Applied:** Favor HAS-A over IS-A
- Appointment HAS-A Pet, Service, Employee (composition via FKs)
- Limited use of inheritance: Account hierarchy using Single Table Inheritance (STI)
  - STI justified: Performance critical (login queries), TypeORM native support

---

# <a name="_toc176928159"></a>**2. Logic Diagram**

The PAW LOVERS system uses **PostgreSQL 14+** with a clean separation of concerns.

## **Entity Relationship Overview**

### **Identity & Access (SRP: Authentication separated from business logic)**
```
Account (base)
├── PetOwner (is-a Account) - Customer role
└── Employee (is-a Account) - Staff roles
```

### **Core Business Domain (SRP: Each entity has single responsibility)**
```
Owner → Pet → MedicalRecord (1:N:N)
Owner → Pet → Vaccination (1:N:N)
```

### **Operations & Scheduling (Law of Demeter: Direct relationships only)**
```
Employee → WorkSchedule (1:N) - Availability blocks
Employee ← Appointment (N:1) - Bookings reference employee directly
Pet ← Appointment (N:1)
Service ← Appointment (N:1)
```

### **Financial Transactions (Separation of Concerns)**
```
Appointment (1) → Invoice (1) - One invoice per appointment
Invoice (1) → Payment (N) - Supports partial payments
```

## **Foreign Key Relationships (Referential Integrity)**

```
Account (1) ────── (1) PetOwner [CASCADE]
Account (1) ────── (1) Employee [CASCADE]

PetOwner (1) ────< (*) Pet [CASCADE]

Pet (1) ─────────< (*) MedicalRecord [CASCADE]
Pet (1) ─────────< (*) Vaccination [CASCADE]
Pet (1) ─────────< (*) Appointment [RESTRICT]

Employee (1) ────< (*) WorkSchedule [CASCADE]
Employee (1) ────< (*) Appointment [RESTRICT]
Employee (1) ────< (*) MedicalRecord [RESTRICT - veterinarian]
Employee (0..1) ──< (*) Vaccination [SET NULL - administrator]
Employee (0..1) ──< (*) Payment [SET NULL - receiver]

Service (1) ─────< (*) Appointment [RESTRICT]
ServiceCategory (1) ──< (*) Service [RESTRICT]

Appointment (1) ── (1) Invoice [CASCADE]
Invoice (1) ─────< (1..*) Payment [RESTRICT]
```

**Cardinality Legend:**
- `(1)` = Exactly one (mandatory)
- `(*)` = Zero or more
- `(0..1)` = Optional
- `(1..*)` = One or more required
- `[CASCADE/RESTRICT/SET NULL]` = ON DELETE policy

## **Key Design Decisions (OOAD Compliance)**

1. **Removed scheduleId from Appointment** (DRY + Law of Demeter)
   - Employee reference is sufficient
   - WorkSchedule serves only availability checking
   - Simpler model, fewer JOINs

2. **Separated Medical concerns** (SRP)
   - MedicalRecord: Examination data
   - Vaccination: Immunization data
   - Not combined despite relationship

3. **Single Table Inheritance for Account** (Performance trade-off)
   - Violates "no sparse columns" but gains login query speed
   - Justified: Authentication is critical path

4. **JSONB for extensible data** (Open/Closed Principle)
   - medical_summary: Varying formats (text, images, lab results)
   - gatewayResponse: Different gateway structures
   - Extensible without schema changes

---

# <a name="_toc176928160"></a>**3. Entity Specifications**

## <a name="_identity_entities"></a>**3.1 Identity & Access Entities**

### **3.1.1 Account Table**

**OOAD Principle:** Single Responsibility - Authentication only
**Pattern:** Single Table Inheritance (STI) with userType discriminator

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|accountId|SERIAL|PK|Entity Integrity|
|2|email|VARCHAR(255)|NOT NULL, UNIQUE|Entity Integrity (natural key)|
|3|passwordHash|VARCHAR(255)|NOT NULL|Encapsulation (hashed, never plain)|
|4|userType|VARCHAR(50)|NOT NULL, CHECK|STI discriminator|
|5|fullName|VARCHAR(255)|NOT NULL|Common to all user types|
|6|phoneNumber|VARCHAR(20)|NOT NULL|Common to all user types|
|7|address|TEXT|NULL|Common to all user types|
|8|isActive|BOOLEAN|DEFAULT TRUE|Soft delete (SoC)|
|9|createdAt|TIMESTAMP|DEFAULT NOW()|Audit metadata|
|10|updatedAt|TIMESTAMP|DEFAULT NOW()|Audit metadata (trigger-updated)|

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_account_email ON Account(email);
CREATE INDEX idx_account_type ON Account(userType);
CREATE INDEX idx_account_active ON Account(isActive) WHERE isActive = TRUE; -- Partial index (DRY)
```

**CHECK Constraints:**
```sql
CHECK (userType IN ('PetOwner', 'Manager', 'Veterinarian', 'CareStaff', 'Receptionist'))
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')  -- Email format validation
```

---

### **3.1.2 PetOwner Table**

**OOAD Principle:** SRP - Customer-specific data separated from Account
**Relationship:** One-to-one with Account (extends via FK)

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|petOwnerId|SERIAL|PK|Entity Integrity|
|2|accountId|INTEGER|FK → Account, UNIQUE, NOT NULL|Referential Integrity (1:1)|
|3|preferredContactMethod|VARCHAR(50)|DEFAULT 'Email'|Business preference|
|4|emergencyContact|VARCHAR(255)|NULL|Customer-specific data|
|5|loyaltyPoints|INTEGER|DEFAULT 0|Business logic (future loyalty program)|
|6|registrationDate|TIMESTAMP|DEFAULT NOW()|Audit trail|

**Foreign Keys:**
```sql
CONSTRAINT fk_petowner_account 
    FOREIGN KEY (accountId) REFERENCES Account(accountId) 
    ON DELETE CASCADE  -- Delete owner when account deleted
    ON UPDATE CASCADE
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_petowner_account ON PetOwner(accountId);
```

**OOAD Decision:** Removed `totalPets` counter (DRY violation)
- Use: `SELECT COUNT(*) FROM Pet WHERE ownerId = ? AND isActive = TRUE`
- With `idx_pet_owner`, this is O(log n) - fast enough

---

### **3.1.3 Employee Table**

**OOAD Principle:** SRP - Staff-specific data separated from Account
**Relationship:** One-to-one with Account (extends via FK)
**DRY Applied:** employeeType removed (use Account.userType instead)

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|employeeId|SERIAL|PK|Entity Integrity|
|2|accountId|INTEGER|FK → Account, UNIQUE, NOT NULL|Referential Integrity (1:1)|
|3|specialization|VARCHAR(255)|NULL|Vet-specific (nullable for others)|
|4|licenseNumber|VARCHAR(100)|NULL|Vet-specific (nullable for others)|
|5|hireDate|DATE|NOT NULL|HR data|
|6|salary|DECIMAL(10,2)|NOT NULL|**Monthly salary in VND (must be positive)**|
|7|isAvailable|BOOLEAN|DEFAULT TRUE|Operational status|

**Foreign Keys:**
```sql
CONSTRAINT fk_employee_account 
    FOREIGN KEY (accountId) REFERENCES Account(accountId) 
    ON DELETE CASCADE
    ON UPDATE CASCADE
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_employee_account ON Employee(accountId);
CREATE INDEX idx_employee_available ON Employee(isAvailable) WHERE isAvailable = TRUE;
```

**CHECK Constraints:**
```sql
CHECK (salary > 0)  -- All employees must have positive salary
```

**Query Pattern - Get Employee Type (DRY: Single source of truth):**
```sql
-- Get employee with type:
SELECT e.*, a.userType as employeeType
FROM Employee e
JOIN Account a ON e.accountId = a.accountId
WHERE e.employeeId = 123;

-- Find all veterinarians:
SELECT e.*
FROM Employee e
JOIN Account a ON e.accountId = a.accountId
WHERE a.userType = 'Veterinarian';
```

**Business Rule (application-enforced):** Veterinarians MUST have specialization and licenseNumber

---

## <a name="_business_entities"></a>**3.2 Core Business Entities**

### **3.2.1 Pet Table**

**OOAD Principle:** SRP - Pet demographics only (medical data separated)
**Pattern:** Generated column for age (DRY + Data Integrity)

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|petId|SERIAL|PK|Entity Integrity|
|2|ownerId|INTEGER|FK → PetOwner, NOT NULL|Referential Integrity|
|3|name|VARCHAR(100)|NOT NULL|Basic data|
|4|species|VARCHAR(50)|NOT NULL|Basic data|
|5|breed|VARCHAR(100)|NULL|Optional detail|
|6|gender|VARCHAR(10)|NOT NULL, CHECK|Basic data|
|7|**age**|INTEGER|NOT NULL|**Simple stored value (YAGNI)**|
|8|weight|DECIMAL(5,2)|NULL|Vital sign|
|9|color|VARCHAR(100)|NULL|Identification|
|10|initialHealthStatus|TEXT|NULL|From SRS requirements|
|11|specialNotes|TEXT|NULL|Care instructions|
|12|isActive|BOOLEAN|DEFAULT TRUE|Soft delete (Separation of Concerns)|
|13|createdAt|TIMESTAMP|DEFAULT NOW()|Audit|
|14|updatedAt|TIMESTAMP|DEFAULT NOW()|Audit (trigger-updated)|

**Foreign Keys:**
```sql
CONSTRAINT fk_pet_owner 
    FOREIGN KEY (ownerId) REFERENCES PetOwner(petOwnerId) 
    ON DELETE CASCADE  -- Delete pet when owner deleted
```

**Indexes:**
```sql
CREATE INDEX idx_pet_owner ON Pet(ownerId);
CREATE INDEX idx_pet_species ON Pet(species);
CREATE INDEX idx_pet_active ON Pet(isActive) WHERE isActive = TRUE;
```

**CHECK Constraints:**
```sql
CHECK (gender IN ('Male', 'Female', 'Unknown'))
CHECK (weight IS NULL OR (weight > 0 AND weight < 1000))
CHECK (age >= 0)
```

---

### **3.2.2 MedicalRecord Table**

**OOAD Principle:** SRP - Medical examination data only (separated from Pet)
**Pattern:** JSONB for extensible data (Open/Closed Principle)

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|recordId|SERIAL|PK|Entity Integrity|
|2|petId|INTEGER|FK → Pet, NOT NULL|Referential Integrity|
|3|veterinarianId|INTEGER|FK → Employee, NOT NULL|Referential Integrity|
|4|appointmentId|INTEGER|FK → Appointment, NOT NULL|Referential Integrity (walk-ins get appointment created)|
|5|examinationDate|DATE|NOT NULL|Temporal data|
|6|diagnosis|TEXT|NOT NULL|Core medical data|
|7|treatment|TEXT|NOT NULL|Core medical data|
|8|medicalSummary|JSONB|NULL|**Open/Closed: Extensible format (YAGNI)**|
|9|followUpDate|DATE|NULL|Operational data|
|10|notes|TEXT|NULL|Additional observations|
|11|createdAt|TIMESTAMP|DEFAULT NOW()|Audit (immutable)|
|12|updatedAt|TIMESTAMP|DEFAULT NOW()|Audit (24h edit window)|

**JSONB Schema Examples (Open/Closed Principle):**
```json
// medicalSummary - extensible format for varying needs:
{
  "vitalSigns": {"temperature": 38.5, "heartRate": 120, "weight": 5.2},
  "prescription": "Amoxicillin 250mg, 2x daily for 7 days",
  "attachments": [
    {"type": "xray", "url": "s3://...", "notes": "..."}
  ],
  "observations": "Patient responsive and alert"
}
```

**Foreign Keys:**
```sql
CONSTRAINT fk_medical_pet FOREIGN KEY (petId) REFERENCES Pet(petId) ON DELETE CASCADE
CONSTRAINT fk_medical_vet FOREIGN KEY (veterinarianId) REFERENCES Employee(employeeId) ON DELETE RESTRICT
CONSTRAINT fk_medical_appointment FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE SET NULL
```

**Indexes:**
```sql
CREATE INDEX idx_medical_pet_date ON MedicalRecord(petId, examinationDate DESC);
CREATE INDEX idx_medical_vet ON MedicalRecord(veterinarianId);
CREATE INDEX idx_medical_followup ON MedicalRecord(followUpDate) WHERE followUpDate >= CURRENT_DATE;
CREATE INDEX idx_medical_summary ON MedicalRecord USING GIN(medicalSummary);  -- JSONB index
```

---

### **3.2.3 VaccineType Table**

**OOAD Principle:** SRP - Central vaccine catalog management
**Reason:** DRY - vaccine metadata stored once, referenced by history records

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|vaccineTypeId|SERIAL|PK|Entity Integrity|
|2|vaccineName|VARCHAR(100)|NOT NULL, UNIQUE|Core data (e.g., "Rabies", "DHPP")|
|3|category|VARCHAR(50)|NOT NULL|Category (e.g., "Core", "Non-core", "Optional")|
|4|targetSpecies|VARCHAR(50)|NOT NULL|Species applicability (Dog, Cat, Bird, etc.)|
|5|manufacturer|VARCHAR(100)|NULL|Default manufacturer|
|6|description|TEXT|NULL|Vaccine information|
|7|recommendedAgeMonths|INTEGER|NULL|When to first administer|
|8|boosterIntervalMonths|INTEGER|NULL|Revaccination schedule|
|9|isActive|BOOLEAN|DEFAULT TRUE|Soft delete|
|10|createdAt|TIMESTAMP|DEFAULT NOW()|Audit|
|11|updatedAt|TIMESTAMP|DEFAULT NOW()|Audit|

**CHECK Constraints:**
```sql
CHECK (vaccineType IN ('Core', 'Non-core', 'Optional', 'Lifestyle'))
CHECK (targetSpecies IN ('Dog', 'Cat', 'Bird', 'Rabbit', 'All'))
CHECK (recommendedAgeMonths IS NULL OR recommendedAgeMonths > 0)
CHECK (boosterIntervalMonths IS NULL OR boosterIntervalMonths > 0)
```

**Indexes:**
```sql
CREATE INDEX idx_vaccine_species ON VaccineType(targetSpecies, isActive);
CREATE INDEX idx_vaccine_active ON VaccineType(isActive) WHERE isActive = TRUE;
```

---

### **3.2.4 VaccinationHistory Table**

**OOAD Principle:** SRP - Pet vaccination records only (separated from vaccine catalog)
**Reason:** Different lifecycle - catalog is reference data, history is transactional

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|vaccinationId|SERIAL|PK|Entity Integrity|
|2|petId|INTEGER|FK → Pet, NOT NULL|Referential Integrity|
|3|vaccineTypeId|INTEGER|FK → VaccineType, NOT NULL|Referential Integrity (DRY)|
|4|medicalRecordId|INTEGER|FK → MedicalRecord, NULL|Optional link|
|5|batchNumber|VARCHAR(50)|NULL|**Recall tracking (SRP)**|
|6|administeredBy|INTEGER|FK → Employee, NULL|Who gave vaccine|
|7|site|VARCHAR(50)|NULL|Injection location (e.g., "Left shoulder")|
|8|reactions|TEXT|NULL|Adverse events|
|9|administrationDate|DATE|NOT NULL|Temporal|
|10|nextDueDate|DATE|NULL|Reminder system|
|11|notes|TEXT|NULL|Additional observations|
|12|createdAt|TIMESTAMP|DEFAULT NOW()|Audit|

**Foreign Keys:**
```sql
CONSTRAINT fk_vacc_pet FOREIGN KEY (petId) REFERENCES Pet(petId) ON DELETE CASCADE
CONSTRAINT fk_vacc_type FOREIGN KEY (vaccineTypeId) REFERENCES VaccineType(vaccineTypeId) ON DELETE RESTRICT
CONSTRAINT fk_vacc_medical FOREIGN KEY (medicalRecordId) REFERENCES MedicalRecord(recordId) ON DELETE SET NULL
CONSTRAINT fk_vacc_admin FOREIGN KEY (administeredBy) REFERENCES Employee(employeeId) ON DELETE SET NULL
```

**Indexes:**
```sql
CREATE INDEX idx_vacc_pet_date ON VaccinationHistory(petId, administrationDate DESC);
CREATE INDEX idx_vacc_due ON VaccinationHistory(nextDueDate) WHERE nextDueDate >= CURRENT_DATE;
CREATE INDEX idx_vacc_batch ON VaccinationHistory(batchNumber);  -- Recall tracking
CREATE INDEX idx_vacc_type ON VaccinationHistory(vaccineTypeId);
```

**Common Query Pattern:**
```sql
-- Get complete vaccination history for a pet
SELECT vh.*, vt.vaccineName, vt.vaccineType, vt.manufacturer
FROM VaccinationHistory vh
JOIN VaccineType vt ON vh.vaccineTypeId = vt.vaccineTypeId
WHERE vh.petId = ?
ORDER BY vh.administrationDate DESC;
```

---

### **3.2.5 ServiceCategory Table**

**OOAD Principle:** SRP - Service category catalog management
**Reason:** DRY - category metadata stored once, referenced by service records
**Justification:** Enables admin management of categories without schema changes

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|categoryId|SERIAL|PK|Entity Integrity|
|2|categoryName|VARCHAR(50)|NOT NULL, UNIQUE|Core data (e.g., "Grooming", "Medical")|
|3|description|TEXT|NULL|Category information|
|4|isActive|BOOLEAN|DEFAULT TRUE|Soft delete|
|5|createdAt|TIMESTAMP|DEFAULT NOW()|Audit|
|6|updatedAt|TIMESTAMP|DEFAULT NOW()|Audit|

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_service_category_name ON ServiceCategory(categoryName);
CREATE INDEX idx_service_category_active ON ServiceCategory(isActive) WHERE isActive = TRUE;
```

---

### **3.2.6 Service Table**

**OOAD Principle:** SRP - Service details only (category management separated)
**Pattern:** References ServiceCategory via FK (DRY principle)

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|serviceId|SERIAL|PK|Entity Integrity|
|2|serviceName|VARCHAR(100)|NOT NULL, UNIQUE|Natural key|
|3|categoryId|INTEGER|FK → ServiceCategory, NOT NULL|Referential Integrity (DRY)|
|4|description|TEXT|NULL|Detail|
|5|basePrice|DECIMAL(10,2)|NOT NULL|Pricing|
|6|estimatedDuration|INTEGER|NOT NULL|In minutes (scheduling)|
|7|requiredStaffType|VARCHAR(50)|NOT NULL|Business rule|
|8|isAvailable|BOOLEAN|DEFAULT TRUE|Soft disable|
|9|createdAt|TIMESTAMP|DEFAULT NOW()|Audit|
|10|updatedAt|TIMESTAMP|DEFAULT NOW()|Audit|

**Foreign Keys:**
```sql
CONSTRAINT fk_service_category FOREIGN KEY (serviceCategoryId) REFERENCES ServiceCategory(serviceCategoryId) ON DELETE RESTRICT
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_service_name ON Service(serviceName);
CREATE INDEX idx_service_category ON Service(categoryId);
CREATE INDEX idx_service_available ON Service(isAvailable) WHERE isAvailable = TRUE;
```

**CHECK Constraints:**
```sql
CHECK (requiredStaffType IN ('Veterinarian', 'CareStaff', 'Any'))
CHECK (basePrice >= 0)
CHECK (estimatedDuration > 0 AND estimatedDuration <= 480)
```

---

## <a name="_transaction_entities"></a>**3.3 Transaction Entities**

### **3.3.1 WorkSchedule Table**

**OOAD Principle:** SRP - Employee availability ONLY (not linked to appointments)
**Purpose:** Availability checking, not appointment container

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|scheduleId|SERIAL|PK|Entity Integrity|
|2|employeeId|INTEGER|FK → Employee, NOT NULL|Referential Integrity|
|3|workDate|DATE|NOT NULL|Temporal|
|4|startTime|TIME|NOT NULL|Shift start|
|5|endTime|TIME|NOT NULL|Shift end|
|6|breakStart|TIME|NULL|Break period|
|7|breakEnd|TIME|NULL|Break period|
|8|isAvailable|BOOLEAN|DEFAULT TRUE|Manual override|
|9|notes|TEXT|NULL|Reason for unavailability|
|10|createdAt|TIMESTAMP|DEFAULT NOW()|Audit|

**Foreign Keys:**
```sql
CONSTRAINT fk_schedule_employee FOREIGN KEY (employeeId) REFERENCES Employee(employeeId) ON DELETE CASCADE
```

**Indexes:**
```sql
CREATE INDEX idx_schedule_emp_date ON WorkSchedule(employeeId, workDate);
CREATE INDEX idx_schedule_date ON WorkSchedule(workDate);
CREATE UNIQUE INDEX idx_schedule_no_overlap ON WorkSchedule(employeeId, workDate, startTime);
```

**CHECK Constraints:**
```sql
CHECK (endTime > startTime)
CHECK (breakEnd IS NULL OR breakStart IS NULL OR (
    breakEnd > breakStart AND 
    breakStart >= startTime AND 
    breakEnd <= endTime
))
```

**OOAD Decision (DRY + Law of Demeter):**
- WorkSchedule does NOT contain appointments
- Appointments reference Employee directly
- WorkSchedule only for availability queries

---

### **3.3.2 Appointment Table**

**OOAD Principle:** Law of Demeter - References immediate neighbors only
**Key Decision:** NO scheduleId (DRY), only employeeId

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|appointmentId|SERIAL|PK|Entity Integrity|
|2|petId|INTEGER|FK → Pet, NOT NULL|Referential Integrity|
|3|serviceId|INTEGER|FK → Service, NOT NULL|Referential Integrity|
|4|employeeId|INTEGER|FK → Employee, NOT NULL|**Direct reference (no scheduleId)**|
|5|appointmentDate|DATE|NOT NULL|Temporal|
|6|startTime|TIME|NOT NULL|Time slot|
|7|endTime|TIME|NOT NULL|Computed: start + service.duration|
|8|status|VARCHAR(50)|DEFAULT 'Pending'|State machine|
|9|estimatedCost|DECIMAL(10,2)|NOT NULL|From service.basePrice|
|10|actualCost|DECIMAL(10,2)|NULL|After completion|
|11|notes|TEXT|NULL|Special requests|
|12|cancellationReason|TEXT|NULL|Required if cancelled|
|13|cancelledAt|TIMESTAMP|NULL|Cancellation timestamp|
|14|createdAt|TIMESTAMP|DEFAULT NOW()|Audit|
|15|updatedAt|TIMESTAMP|DEFAULT NOW()|Audit|

**Foreign Keys:**
```sql
CONSTRAINT fk_appt_pet FOREIGN KEY (petId) REFERENCES Pet(petId) ON DELETE RESTRICT
CONSTRAINT fk_appt_service FOREIGN KEY (serviceId) REFERENCES Service(serviceId) ON DELETE RESTRICT
CONSTRAINT fk_appt_employee FOREIGN KEY (employeeId) REFERENCES Employee(employeeId) ON DELETE RESTRICT
```

**Indexes:**
```sql
CREATE INDEX idx_appt_pet ON Appointment(petId);
CREATE INDEX idx_appt_employee_date ON Appointment(employeeId, appointmentDate);
CREATE INDEX idx_appt_date ON Appointment(appointmentDate);
CREATE INDEX idx_appt_status_date ON Appointment(status, appointmentDate DESC);
CREATE INDEX idx_appt_active ON Appointment(petId, status) WHERE status NOT IN ('Cancelled', 'Completed');
```

**CHECK Constraints:**
```sql
CHECK (status IN ('Pending', 'Confirmed', 'In-Progress', 'Completed', 'Cancelled'))
CHECK (endTime > startTime)
CHECK (estimatedCost >= 0)
CHECK (actualCost IS NULL OR actualCost >= 0)
```

**Unique Constraint (Prevent double-booking):**
```sql
CREATE UNIQUE INDEX idx_appt_no_conflict ON Appointment(employeeId, appointmentDate, startTime)
WHERE status NOT IN ('Cancelled', 'Completed');
```

---

### **3.3.3 Invoice Table**

**OOAD Principle:** SRP - Billing data only
**Relationship:** One-to-one with Appointment

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|invoiceId|SERIAL|PK|Entity Integrity|
|2|appointmentId|INTEGER|FK → Appointment, UNIQUE|1:1 relationship|
|3|invoiceNumber|VARCHAR(50)|UNIQUE, NOT NULL|Business identifier|
|4|issueDate|DATE|NOT NULL|Temporal|
|5|dueDate|DATE|NULL|Payment term|
|6|subtotal|DECIMAL(10,2)|NOT NULL|Before discount/tax|
|7|discount|DECIMAL(10,2)|DEFAULT 0|Promotional|
|8|tax|DECIMAL(10,2)|DEFAULT 0|VAT 10%|
|9|totalAmount|DECIMAL(10,2)|NOT NULL|Final amount|
|10|status|VARCHAR(50)|DEFAULT 'Pending Payment'|Payment state|
|11|notes|TEXT|NULL|Terms|
|12|createdAt|TIMESTAMP|DEFAULT NOW()|Audit|
|13|paidAt|TIMESTAMP|NULL|Full payment timestamp|

**Foreign Keys:**
```sql
CONSTRAINT fk_invoice_appt FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE CASCADE
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_invoice_number ON Invoice(invoiceNumber);
CREATE UNIQUE INDEX idx_invoice_appt ON Invoice(appointmentId);
CREATE INDEX idx_invoice_status_date ON Invoice(status, issueDate DESC);
CREATE INDEX idx_invoice_unpaid ON Invoice(status) WHERE status IN ('Pending Payment', 'Processing Online Payment');
```

**CHECK Constraints:**
```sql
CHECK (status IN ('Pending Payment', 'Processing Online Payment', 'Paid', 'Payment Failed', 'Cancelled'))
CHECK (subtotal >= 0 AND discount >= 0 AND tax >= 0)
CHECK (dueDate IS NULL OR dueDate >= issueDate)
```

**Trigger for Invoice Calculation Validation:**
```sql
CREATE TRIGGER validate_invoice_total BEFORE INSERT OR UPDATE ON Invoice
FOR EACH ROW EXECUTE FUNCTION check_invoice_calculation();
-- Allows ±0.01 VND tolerance for floating-point rounding
```

---


### **3.3.4 Payment Table**

**OOAD Principle:** Open/Closed - Supports multiple payment methods via abstraction
**Pattern:** JSONB for gateway responses (different structures)

|No.|Attribute|Type|Constraints|OOAD Principle|
|:-:|:--------|:---|:----------|:-------------|
|1|paymentId|SERIAL|PK|Entity Integrity|
|2|invoiceId|INTEGER|FK → Invoice, NOT NULL|Referential Integrity|
|3|paymentMethod|VARCHAR(50)|NOT NULL|Abstract interface (CASH, BANK_TRANSFER, VNPAY, MOMO, ZALOPAY)|
|4|amount|DECIMAL(10,2)|NOT NULL|Payment amount|
|5|transactionId|VARCHAR(100)|UNIQUE, NULL|External reference (nullable for cash)|
|6|idempotencyKey|VARCHAR(100)|NULL|Optional idempotency key for retries (unique when present)|
|7|paymentStatus|VARCHAR(50)|DEFAULT 'PENDING'|State (PENDING, PROCESSING, SUCCESS, FAILED, REFUNDED)|
|8|paidAt|TIMESTAMP|NULL|Completion timestamp (set when payment succeeds)|
|9|receivedBy|INTEGER|FK → Employee, NULL|For cash/transfer (optional)|
|10|gatewayResponse|JSONB|NULL|**Open/Closed: Different gateway structures**|
|11|refundAmount|DECIMAL(10,2)|DEFAULT 0|Partial refund support|
|12|refundDate|TIMESTAMP|NULL|Refund timestamp|
|13|refundReason|TEXT|NULL|Required if refunded|
|14|notes|TEXT|NULL|Additional| 
|15|createdAt|TIMESTAMP|DEFAULT NOW()|Audit|

**Foreign Keys:**
```sql
CONSTRAINT fk_payment_invoice FOREIGN KEY (invoiceId) REFERENCES Invoice(invoiceId) ON DELETE RESTRICT
CONSTRAINT fk_payment_receiver FOREIGN KEY (receivedBy) REFERENCES Employee(employeeId) ON DELETE SET NULL
```

**Indexes:**
```sql
CREATE INDEX idx_payment_invoice ON Payment(invoiceId);
CREATE UNIQUE INDEX idx_payment_txn ON Payment(transactionId) WHERE transactionId IS NOT NULL;
CREATE UNIQUE INDEX idx_payment_idem ON Payment(idempotencyKey) WHERE idempotencyKey IS NOT NULL;
CREATE INDEX idx_payment_paid_at ON Payment(paidAt DESC);
CREATE INDEX idx_payment_status ON Payment(paymentStatus);
CREATE INDEX idx_payment_gateway ON Payment USING GIN(gatewayResponse);  -- JSONB index
```

**CHECK Constraints:**
```sql
CHECK (paymentMethod IN ('CASH', 'BANK_TRANSFER', 'VNPAY', 'MOMO', 'ZALOPAY'))
CHECK (paymentStatus IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED'))
CHECK (amount > 0)
CHECK (refundAmount >= 0 AND refundAmount <= amount)
CHECK (receivedBy IS NULL OR paymentMethod IN ('CASH', 'BANK_TRANSFER'))
```

**JSONB Gateway Response Examples:**
```json
// VNPay response:
{
  "vnp_TxnRef": "INV-2025-000123",
  "vnp_ResponseCode": "00",
  "vnp_TransactionNo": "14234567",
  "vnp_BankCode": "NCB",
  "vnp_Amount": "50000000",  // In VND cents
  "vnp_PayDate": "20251117103045"
}

// Future: Momo/ZaloPay can have different structures
```

---

## <a name="_supporting_tables"></a>**3.4 Supporting Tables**

### **3.4.1 AuditLog Table**

**OOAD Principle:** Separation of Concerns - Audit trail separated from business data
**Purpose:** Track all data changes for compliance, security, and debugging

|No.|Attribute|Type|Constraints|Description|
|:-:|:--------|:---|:----------|:----------|
|1|auditId|SERIAL|PK|Unique identifier for audit entry|
|2|tableName|VARCHAR(50)|NOT NULL|Name of modified table (e.g., 'appointments', 'medical_records')|
|3|recordId|INTEGER|NOT NULL|Primary key of the modified record|
|4|operation|VARCHAR(10)|NOT NULL, CHECK|Type of operation: 'INSERT', 'UPDATE', or 'DELETE'|
|5|changes|JSONB|NULL|Detailed change data with before/after values|
|6|actorAccountId|INTEGER|FK → Account, NULL|Account ID of user who made the change (NULL for system)|
|7|actorType|VARCHAR(50)|NULL|Type of actor: 'EMPLOYEE', 'PET_OWNER', 'SYSTEM', 'WEBHOOK'|
|8|requestId|UUID|NULL|Unique ID for distributed tracing across operations|
|9|ipAddress|VARCHAR(45)|NULL|Client IP address (IPv4/IPv6) for security tracking|
|10|userAgent|TEXT|NULL|Browser/client user agent for client identification|
|11|changedAt|TIMESTAMP|DEFAULT NOW()|Timestamp when the change occurred|

**Indexes:**
```sql
CREATE INDEX idx_audit_table_record ON AuditLog(tableName, recordId);
CREATE INDEX idx_audit_changed_at ON AuditLog(changedAt DESC);
CREATE INDEX idx_audit_actor_account ON AuditLog(actorType, actorAccountId);
```

**Foreign Keys:**
```sql
CONSTRAINT fk_audit_actor 
    FOREIGN KEY (actorAccountId) REFERENCES Account(accountId) 
    ON DELETE SET NULL  -- Retain audit trail even if account deleted
```

**CHECK Constraints:**
```sql
CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
```

**JSONB Structure Example (changes field):**
```json
{
  "before": {"status": "Pending", "estimatedCost": 500000},
  "after": {"status": "Confirmed", "estimatedCost": 550000},
  "changedFields": ["status", "estimatedCost"]
}
```

**Trigger Example:**
```sql
CREATE TRIGGER audit_medical_changes
AFTER INSERT OR UPDATE OR DELETE ON MedicalRecord
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
```

---

### **3.4.2 PaymentGatewayArchive Table**

**OOAD Principle:** Data Retention Policy - Archive old gateway responses
**Purpose:** Reduce Payment table size while maintaining compliance and debugging capability

|No.|Attribute|Type|Constraints|Description|
|:-:|:--------|:---|:----------|:----------|
|1|archiveId|SERIAL|PK|Unique identifier for archive entry|
|2|paymentId|INTEGER|FK → Payment, NOT NULL|Reference to original payment record|
|3|gatewayName|VARCHAR(50)|NOT NULL|Payment gateway name (VNPAY, MOMO, ZALOPAY, etc.)|
|4|gatewayResponse|JSONB|NOT NULL|Raw response from payment gateway (archived data)|
|5|transactionTimestamp|TIMESTAMP|NOT NULL|When the original transaction occurred|
|6|archivedAt|TIMESTAMP|DEFAULT NOW()|When this record was archived|

**Foreign Keys:**
```sql
CONSTRAINT fk_archive_payment 
    FOREIGN KEY (paymentId) REFERENCES Payment(paymentId) 
    ON DELETE CASCADE  -- Delete archive when payment deleted
```

**Indexes:**
```sql
CREATE INDEX idx_archive_payment ON PaymentGatewayArchive(paymentId);
CREATE INDEX idx_archive_date ON PaymentGatewayArchive(archivedAt DESC);
CREATE INDEX idx_archive_gateway ON PaymentGatewayArchive(gatewayName);
CREATE INDEX idx_archive_transaction_date ON PaymentGatewayArchive(transactionTimestamp);
```

**Archival Policy:**
- Move gateway responses older than 90 days from Payment table
- Retain archived data for 7 years (compliance requirement)
- Self-contained: includes gateway name and transaction timestamp

**Archival Procedure:**
```sql
-- Monthly job: Archive old gateway responses
CREATE PROCEDURE archive_old_gateway_data() AS $$
BEGIN
    INSERT INTO PaymentGatewayArchive (paymentId, gatewayName, gatewayResponse, transactionTimestamp)
    SELECT 
        p.paymentId, 
        p.paymentMethod as gatewayName,
        p.gatewayResponse,
        p.paidAt as transactionTimestamp
    FROM Payment p
    WHERE p.gatewayResponse IS NOT NULL 
      AND p.paidAt < CURRENT_DATE - INTERVAL '90 days';
    
    UPDATE Payment SET gatewayResponse = NULL
    WHERE paidAt < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

---

# <a name="_ooad_decisions"></a>**4. OOAD Design Decisions**

## **4.1 Single Responsibility Principle (SRP) Applications**

| **Decision** | **Rationale** |
|--------------|---------------|
| Separated Account/PetOwner/Employee | Authentication concerns isolated from business logic |
| Separated MedicalRecord/Vaccination | Different lifecycle, access patterns, retention policies |
| WorkSchedule independent of Appointment | Availability checking vs booking transactions are different concerns |
| Removed scheduleId from Appointment | Employee reference sufficient, simpler (DRY + Law of Demeter) |

## **4.2 DRY (Don't Repeat Yourself) Applications**

| **Violation Removed** | **Solution** |
|-----------------------|--------------|
| totalPets counter | Aggregate query: `SELECT COUNT(*) FROM Pet WHERE ownerId = ?` |
| Pet age stored field | Generated column from birthDate |
| scheduleId in Appointment | Direct employeeId reference only |
| employeeType in Employee table | Use Account.userType (single source of truth, JOIN when needed) |

## **4.3 Referential Integrity Policies**

| **Relationship** | **ON DELETE** | **Rationale** |
|------------------|---------------|---------------|
| Account → PetOwner/Employee | CASCADE | Delete dependent when parent deleted |
| PetOwner → Pet | CASCADE | Pets belong to owner |
| Pet → Appointment | RESTRICT | Must handle appointments before deleting pet |
| Employee → Payment.receivedBy | SET NULL | Historical reference, optional |
| Appointment → Invoice | CASCADE | Invoice meaningless without appointment |

## **4.4 Open/Closed Principle Applications**

| **Extensible Field** | **Purpose** | **Example** |
|----------------------|-------------|-------------|
| MedicalRecord.medicalSummary (JSONB) | Varying formats (text, images, lab results) | Can add new attachment types without schema change |
| MedicalRecord.vitalSigns (JSONB) | Structured vital signs | Can add new measurements without ALTER TABLE |
| Payment.gatewayResponse (JSONB) | Different gateway structures | Support VNPay, Momo, ZaloPay with same schema |

## **4.5 Law of Demeter Applications**

| **Relationship** | **Follows Demeter?** | **Explanation** |
|------------------|----------------------|-----------------|
| Appointment → Employee | ✅ Yes | Direct reference to assigned staff |
| Appointment → Pet → Owner | ✅ Yes | Indirect through Pet (no direct owner FK) |
| MedicalRecord → Pet → Owner | ✅ Yes | Indirect through Pet |
| Appointment → Schedule → Employee | ❌ Removed | scheduleId removed for simplicity (DRY) |

## **4.6 Performance vs Principle Trade-offs**

| **Trade-off** | **Principle Violated** | **Justification** |
|---------------|------------------------|-------------------|
| Single Table Inheritance (STI) | No sparse columns | Login query performance critical, TypeORM native support |
| Generated column for age | Write penalty (~0.1ms) | Always accurate, zero maintenance, worth the cost |
| 40+ indexes | Write overhead (~10%) | Read-heavy workload, acceptable trade-off |
| JSONB for flexible data | Query complexity | Prevents ALTER TABLE migrations, worth it for extensibility |

---

# <a name="_views_procedures"></a>**5. Database Views and Functions**

## **5.1 Role-Based Views (Interface Segregation Principle)**

### **v_owner_dashboard** (For Pet Owners)
```sql
CREATE OR REPLACE VIEW v_owner_dashboard AS
SELECT 
    po.petOwnerId,
    a.email,
    a.fullName,
    a.phoneNumber,
    po.loyaltyPoints,
    COUNT(DISTINCT p.petId) FILTER (WHERE p.isActive = TRUE) as activePets,
    COUNT(DISTINCT ap.appointmentId) FILTER (WHERE ap.status = 'Pending') as pendingAppointments,
    SUM(i.totalAmount) FILTER (WHERE i.status = 'Pending Payment') as unpaidAmount
FROM PetOwner po
JOIN Account a ON po.accountId = a.accountId
LEFT JOIN Pet p ON p.ownerId = po.petOwnerId
LEFT JOIN Appointment ap ON ap.petId = p.petId
LEFT JOIN Invoice i ON i.appointmentId = ap.appointmentId
WHERE a.isActive = TRUE
GROUP BY po.petOwnerId, a.accountId;
```

### **v_vet_schedule** (For Veterinarians)
```sql
CREATE OR REPLACE VIEW v_vet_schedule AS
SELECT 
    e.employeeId,
    acc.fullName as vetName,
    ap.appointmentDate,
    ap.startTime,
    ap.endTime,
    p.name as petName,
    p.species,
    p.allergies,
    s.serviceName,
    ap.status,
    ap.notes
FROM Employee e
JOIN Account acc ON e.accountId = acc.accountId
JOIN Appointment ap ON ap.employeeId = e.employeeId
JOIN Pet p ON ap.petId = p.petId
JOIN Service s ON ap.serviceId = s.serviceId
WHERE e.employeeType = 'Veterinarian'
  AND ap.status NOT IN ('Cancelled', 'Completed');
```

### **v_receptionist_appointments** (For Front Desk)
```sql
CREATE OR REPLACE VIEW v_receptionist_appointments AS
SELECT 
    ap.appointmentId,
    ap.appointmentDate,
    ap.startTime,
    ap.status,
    p.name as petName,
    p.species,
    owner_acc.fullName as ownerName,
    owner_acc.phoneNumber as ownerPhone,
    emp_acc.fullName as staffName,
    s.serviceName,
    s.category,
    ap.estimatedCost,
    i.status as invoiceStatus
FROM Appointment ap
JOIN Pet p ON ap.petId = p.petId
JOIN PetOwner po ON p.ownerId = po.petOwnerId
JOIN Account owner_acc ON po.accountId = owner_acc.accountId
JOIN Employee e ON ap.employeeId = e.employeeId
JOIN Account emp_acc ON e.accountId = emp_acc.accountId
JOIN Service s ON ap.serviceId = s.serviceId
LEFT JOIN Invoice i ON i.appointmentId = ap.appointmentId;
```

## **5.2 Business Logic Functions (Encapsulation)**

### **check_schedule_conflict** (Prevents double-booking)
```sql
CREATE OR REPLACE FUNCTION check_schedule_conflict(
    p_employeeId INTEGER,
    p_appointmentDate DATE,
    p_startTime TIME,
    p_endTime TIME,
    p_excludeAppointmentId INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check if employee has work schedule
    IF NOT EXISTS (
        SELECT 1 FROM WorkSchedule
        WHERE employeeId = p_employeeId
          AND workDate = p_appointmentDate
          AND p_startTime >= startTime
          AND p_endTime <= endTime
          AND isAvailable = TRUE
    ) THEN
        RAISE EXCEPTION 'Employee not scheduled or unavailable on %', p_appointmentDate;
    END IF;
    
    -- Check for overlapping appointments
    SELECT COUNT(*) INTO conflict_count
    FROM Appointment
    WHERE employeeId = p_employeeId
      AND appointmentDate = p_appointmentDate
      AND status NOT IN ('Cancelled', 'Completed')
      AND (appointmentId != p_excludeAppointmentId OR p_excludeAppointmentId IS NULL)
      AND (
          (p_startTime, p_endTime) OVERLAPS (startTime, endTime)
      );
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
```

### **calculate_invoice_total** (Encapsulates business logic)
```sql
CREATE OR REPLACE FUNCTION calculate_invoice_total(
    p_subtotal DECIMAL,
    p_discount DECIMAL,
    p_taxRate DECIMAL DEFAULT 0.10  -- VAT 10%
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND((p_subtotal - p_discount) * (1 + p_taxRate), 2);
END;
$$ LANGUAGE plpgsql;
```

### **auto_update_timestamp** (Trigger function for updatedAt)
```sql
CREATE OR REPLACE FUNCTION auto_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updatedAt:
CREATE TRIGGER trg_account_update BEFORE UPDATE ON Account
    FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trg_pet_update BEFORE UPDATE ON Pet
    FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
-- ... (repeat for other tables)
```

---

## **Summary Statistics**

**Total Tables:** 10 core + 2 supporting (AuditLog, PaymentGatewayArchive)

**OOAD Compliance:**
- ✅ Single Responsibility: Each table has one reason to change
- ✅ DRY: No denormalized counters, generated columns for derived data
- ✅ Referential Integrity: All relationships enforced via FK
- ✅ Law of Demeter: Direct relationships only (scheduleId removed)
- ✅ Open/Closed: JSONB for extensible data
- ✅ Separation of Concerns: Audit/archive tables separate
- ✅ Interface Segregation: Role-based views
- ✅ Encapsulation: Functions hide complexity

**Performance Characteristics:**
- Total Indexes: ~40 (balance between read speed and write overhead)
- Read-heavy workload: Optimized for queries
- Normalization: Strict 3NF with strategic JSONB for variable data

**Database Size Estimates (5 years, 50 appointments/day):**
- Appointments: ~91K rows
- Medical Records: ~20K rows
- Total: ~150MB (excluding JSONB attachments)

---

**End of OOAD-Compliant Data Model Documentation v3.0**

*This design prioritizes maintainability, data integrity, and adherence to object-oriented principles over premature optimization.*


