<a name="_hlk213585765"></a><a name="_hlk213605477"></a>Pet Care Service Management System

**Architecture Design**





**Students:**

23520406 – Đặng Ngọc Trường Giang

23520444 – Đặng Trần Anh Hào

23520187 - Lê Hùng Chính

23520421 - Trần Đức Hải


# <a name="_toc213595804"></a>**Document Change Record Sheet**

|**Date**|**Version**|**Description**|**Authors**|
| :- | :- | :- | :- |
|**05/11/2025**|1\.0|Initial architecture design - Complete documentation|Group 9|
|**01/12/2025**|1\.1|Aligned with Data_model.md v3.0 OOAD principles: Updated entity list (12+2), repositories (12), added database views, Law of Demeter compliance|Winston (Architect)|
||||

**
# **Contents**
[Document Change Record Sheet	2](#_toc213595804)

[1. Architecture of the System	4](#_toc213595805)

[1.1. Overall Architecture	4](#_toc213595806)

[Three-Tier Architecture Overview:	4](#_toc213595807)

[Architecture Diagram:	6](#_toc213595808)

[1.2. Module and Component List	7](#_toc213595809)

[Complete Component Inventory:	7](#_toc213595810)

[1.3. Architectural Patterns and Design Decisions	10](#_toc213595811)

[WHY LAYERED ARCHITECTURE?	10](#_toc213595812)

[1.4. Design Patterns Applied	12](#_toc213595813)

[1.5. Component Dependencies	12](#_toc213595814)

[1.6. Technology Stack	12](#_toc213595815)

[1.7. Non-Functional Considerations	12](#_toc213595816)

[1.8. Deployment View	12](#_toc213595817)

[1.9. Future Extensibility	13](#_toc213595818)

[2. Detailed Description of Each Component	14](#_toc213595819)

[2.1. AccountManager Component	14](#_toc213595820)

[2.1.1. Purpose and Responsibilities	14](#_toc213595821)

[2.1.2. Class Diagram	14](#_toc213595822)

[2.1.3. Related Classes and Dependencies	15](#_toc213595823)

[2.1.4. Design Decisions and Patterns	16](#_toc213595824)

[2.2. AppointmentManager Component	16](#_toc213595825)

[2.2.1. Purpose and Responsibilities	16](#_toc213595826)

[2.2.2. Class Diagram	17](#_toc213595827)

[2.2.3. Related Classes and Dependencies	18](#_toc213595828)

[2.2.4. Design Decisions and Patterns	19](#_toc213595829)

[2.2.5. Appointment Status Flow	19](#_toc213595830)

[2.3. PetManager Component	20](#_toc213595831)

[2.3.1. Purpose and Responsibilities	20](#_toc213595832)

[2.3.2. Class Diagram	20](#_toc213595833)

[2.3.3. Related Classes and Dependencies	21](#_toc213595834)

[2.3.4. Design Decisions and Patterns	22](#_toc213595835)

[2.4. ScheduleManager Component	23](#_toc213595836)

[2.4.1. Purpose and Responsibilities	23](#_toc213595837)

[2.4.2. Class Diagram	23](#_toc213595838)

[2.4.3. Related Classes and Dependencies	25](#_toc213595839)

[2.4.4. Design Decisions and Patterns	25](#_toc213595840)

[2.5. ServiceManager Component	26](#_toc213595841)

[2.5.1. Purpose and Responsibilities	26](#_toc213595842)

[2.5.2. Class Diagram	26](#_toc213595843)

[2.5.3. Related Classes and Dependencies	28](#_toc213595844)

[2.5.4. Design Decisions and Patterns	28](#_toc213595845)

[2.5.5. Service Categories	29](#_toc213595846)

[2.6. PaymentManager Component	29](#_toc213595847)

[2.6.1. Purpose and Responsibilities	29](#_toc213595848)

[2.6.2. Class Diagram	30](#_toc213595849)

[2.6.3. Related Classes and Dependencies	31](#_toc213595850)

[2.6.4. Design Decisions and Patterns	31](#_toc213595851)

[2.7. MedicalRecordManager Component	32](#_toc213595852)

[2.7.1. Purpose and Responsibilities	32](#_toc213595853)

[2.7.2. Class Diagram	32](#_toc213595854)

[2.7.3. Related Classes and Dependencies	33](#_toc213595855)

[2.7.4. Design Decisions and Patterns	34](#_toc213595856)

[2.8. ReportManager Component	34](#_toc213595857)

[2.8.1. Purpose and Responsibilities	34](#_toc213595858)

[2.8.2. Class Diagram	35](#_toc213595859)

[2.8.3. Related Classes and Dependencies	36](#_toc213595860)

[2.8.4. Design Decisions and Patterns	36](#_toc213595861)

[2.8.5. Report Types and Metrics	37](#_toc213595862)

[2.9. DatabaseManager Component	37](#_toc213595863)

[2.9.1. Purpose and Responsibilities	37](#_toc213595864)

[2.9.2. Class Diagram	38](#_toc213595865)

[2.9.3. Related Classes and Dependencies	39](#_toc213595866)

[2.9.4. Design Decisions and Patterns	39](#_toc213595867)

[2.9.5. TypeORM Configuration	40](#_toc213595868)

[2.10. NotificationService Component	40](#_toc213595869)

[2.10.1. Purpose and Responsibilities	40](#_toc213595870)

[2.10.2. Class Diagram	40](#_toc213595871)

[2.10.3. Related Classes and Dependencies	42](#_toc213595872)

[2.10.4. Design Decisions and Patterns	42](#_toc213595873)

[2.10.5. Notification Types and Templates	43](#_toc213595874)

[2.11. SecurityManager Component	43](#_toc213595875)

[2.11.1. Purpose and Responsibilities	43](#_toc213595876)

[2.11.2. Class Diagram	44](#_toc213595877)

[2.11.3. Related Classes and Dependencies	45](#_toc213595878)

[2.11.4. Design Decisions and Patterns	45](#_toc213595879)

[2.11.5. Security Configuration and Policies	46](#_toc213595880)

[2.12. PetCareClient Component	47](#_toc213595881)

[2.12.1. Purpose and Responsibilities	47](#_toc213595882)

[2.12.2. Class Diagram	47](#_toc213595883)

[2.12.3. Related Classes and Dependencies	48](#_toc213595884)

[2.12.4. Design Decisions and Patterns	48](#_toc213595885)

[2.12.5. User Interface Forms (Boundary Classes)	49](#_toc213595886)

[2.13. PetCareWebService Component	50](#_toc213595887)

[2.13.1. Purpose and Responsibilities	50](#_toc213595888)

[2.13.2. Class Diagram	50](#_toc213595889)

[2.13.3. Related Classes and Dependencies	51](#_toc213595890)

[2.13.4. Design Decisions and Patterns	52](#_toc213595891)

[2.13.5. API Endpoints (Controller Classes)	52](#_toc213595892)




# <a name="_toc213595805"></a>**1. Architecture of the System**
## <a name="_toc213595806"></a>**1.1. Overall Architecture**
The Pet Care Service Management System is built using a **LAYERED ARCHITECTURE** pattern that separates concerns into distinct layers. This architecture demonstrates both **physical deployment** and **logical component organization**.
### <a name="_toc213595807"></a>**Three-Tier Architecture Overview:**
The system architecture separates the application into three distinct tiers:

**TIER 1: PRESENTATION TIER (Client Layer)**

Web Client (Browser) - PetCareClient (Web-based UI for all users)

- LoginForm (All users) 
- RegistrationForm (Pet Owners) 
- BookingForm (Pet Owners) 
- PetProfileForm (Pet Owners) 
- MedicalRecordForm (Veterinarian/Staff) 
- ScheduleManagementForm (Manager/Staff) 
- ServiceManagementForm (Manager) 
- PaymentForm (Receptionist) 
- ReportViewForm (Manager)

**TIER 2: BUSINESS LOGIC TIER (Application Layer)**

PetCareWebService (REST API Layer + 8 Controllers):  Authentication, Routing, Validation, Error Handling: 

- AccountController
- AppointmentController 
- PetController 
- ScheduleController 
- ServiceController 
- PaymentController 
- MedicalRecordController 
- ReportController



Business Logic Managers (8 Managers): 

- AccountManager
- AppointmentManager
- PetManager
- ScheduleManager
- ServiceManager
- PaymentManager
- MedicalRecordManager
- ReportManager

**TIER 3: DATA TIER (Data Layer)**

Repository Pattern (12 Repositories) 

- AccountRepository
- PetOwnerRepository
- EmployeeRepository
- PetRepository
- AppointmentRepository
- WorkScheduleRepository
- ServiceRepository
- MedicalRecordRepository
- VaccineTypeRepository
- VaccinationHistoryRepository
- InvoiceRepository
- PaymentRepository

Entity Classes (12 core entities + 2 supporting) 

**Identity & Access Entities:**
- Account (STI base with userType discriminator)
- PetOwner (extends Account via FK)
- Employee (extends Account via FK - Manager, Veterinarian, CareStaff, Receptionist)

**Core Business Entities:**
- Pet
- MedicalRecord
- VaccineType (catalog - DRY principle)
- VaccinationHistory (records - separated from VaccineType per SRP)
- Service

**Transaction Entities:**
- WorkSchedule (renamed from Schedule - employee availability only)
- Appointment (references Employee directly, no scheduleId - Law of Demeter)
- Invoice
- Payment (with JSONB gatewayResponse for extensibility)

**Supporting Tables:**
- AuditLog (separation of concerns - audit trail)
- PaymentGatewayArchive (data retention policy)

**Database Views (Interface Segregation Principle):**
- v_owner_dashboard (Pet Owners)
- v_vet_schedule (Veterinarians)
- v_receptionist_appointments (Receptionists)

**EXTERNAL SERVICES:**

• Email Service (SMTP) - Notifications & Confirmations

• SMS Gateway (Optional) - Appointment Reminders

• VNPay Payment Gateway - Online Payment Processing (UC-23)

### <a name="_toc213595808"></a>**Architecture Diagram:**
![](Aspose.Words.732b08cd-edae-4640-a1bb-e06d47b4e27f.001.png)

*Figure 1.1: Complete System Architecture - Physical and Logical Views*


## <a name="_toc213595809"></a>**1.2. Module and Component List**
### <a name="_toc213595810"></a>**Complete Component Inventory:**

|**Component**|**Description**|
| :- | :- |
|**PetCareClient**|Web-based user interface for all users (Pet Owners, Manager, Staff). Provides forms for login, registration, booking appointments, viewing medical records, managing schedules, and processing payments. Implements responsive design for cross-platform compatibility. Handles client-side validation and user feedback.|
|**PetCareWebService**|REST API layer that handles HTTP requests and responses. Routes requests to appropriate business logic managers. Implements endpoint security, request validation, and response formatting. Acts as a facade to the business logic layer, providing unified interface. Handles authentication tokens, session management, and error responses.|
|**AccountManager**|Manages user authentication, registration, and role-based access control (RBAC). Handles login sessions, password management (hashing and validation), password reset functionality, and account verification. Supports five user roles: Pet Owner, Manager, Veterinarian, Care Staff, and Receptionist. Coordinates with SecurityManager for token generation.|
|**PetManager**|Manages pet records including create, read, update, and delete (CRUD) operations. Handles pet information including name, species, breed, age, weight, and health condition. Supports multiple pets per owner account. Validates pet data against business rules. Maintains pet-owner relationships and ensures data integrity.|
|**AppointmentManager**|Handles appointment booking, cancellation, and status updates. Checks staff and time slot availability before confirming bookings. Validates booking requests against business rules (working hours, staff availability, service duration). Manages appointment lifecycle: Pending → Confirmed → Completed/Cancelled. Coordinates with ScheduleManager for availability and NotificationService for confirmations.|
|**ScheduleManager**|Manages staff work schedules and service assignments. Handles schedule creation, updates, deletion, and conflict checking. Provides staff availability information for appointment booking system. Supports schedule viewing by date and by staff member. Validates schedule conflicts and overlapping assignments. Implements schedule copying for recurring patterns.|
|**MedicalRecordManager**|Manages veterinary examination records. Handles creation and viewing of medical records by authorized veterinarians. Records diagnosis, treatment details, examination start/end times, prescriptions, and follow-up recommendations. Maintains complete medical history for each pet. Supports record updates by creating veterinarian only (within 24 hours). Ensures HIPAA-like privacy for pet medical data.|
|**ServiceManager**|Manages service catalog including add, remove, and update operations. Handles five service types: Bathing, Spa, Grooming, Check-up (Veterinary), and Vaccination. Updates service pricing and duration. Provides service information with pricing for appointment booking interface. Validates service availability and staff qualifications.|
|**PaymentManager**|Handles invoice generation from completed appointments. Records payment transactions (cash, bank transfer, and online via VNPay). Integrates with VNPay payment gateway for online credit/debit card and QR code payments (UC-23). Manages payment callbacks and transaction records. Manages receipt printing and electronic sending via email. Tracks payment billing history with transaction IDs and timestamps. Calculates totals including service fees and applicable discounts.|
|**ReportManager**|Generates statistical reports for management decision-making. Calculates number of services per month categorized by service type. Computes total monthly revenue. Aggregates data from appointments and invoices repositories. Supports date range filtering and custom report parameters. Exports reports in multiple formats (PDF, Excel). Provides data visualization support.|
|**DatabaseManager**|Manages TypeORM configuration and data source initialization. Configures connection pooling, entity registration, and migration settings. Provides TypeORM DataSource instance for dependency injection. Handles database connection lifecycle and error recovery. Supports PostgreSQL database with TypeORM query builder and entity manager.|
|<p></p><p>**SecurityManager**</p>|<p></p><p>Handles authentication token generation and validation (JWT). Implements authorization checks based on user roles and permissions. Manages session lifecycle, timeout, and concurrent session handling. Implements password encryption using bcrypt algorithm. Provides CSRF (Cross-Site Request Forgery) protection. Prevents SQL injection through parameterized queries. Enforces security policies: password complexity, account lockout after failed attempts, session timeout.</p>|
|**NotificationService**|Sends notifications via email (SMTP) channels. Handles appointment confirmation messages sent immediately after booking. Sends appointment reminder messages 24 hours before scheduled time. Sends electronic invoices and payment receipts. Manages notification templates for consistency and localization. Tracks delivery status and handles failures (retry logic). Integrates with external services: SendGrid/SMTP for email.|


## <a name="_toc213595811"></a>**1.3. Architectural Patterns and Design Decisions**
### <a name="_toc213595812"></a>**WHY LAYERED ARCHITECTURE?**
The Pet Care Service Management System employs **Layered Architecture** as the foundational architectural pattern. This decision is based on multiple factors that align with both the system requirements and best practices in software engineering.

**1. SEPARATION OF CONCERNS**

Each layer has a specific, well-defined responsibility:

- Presentation Layer: Handles all user interaction, input validation (client-side), and display logic
- API Layer: Routes requests, validates authentication tokens, and formats responses
- Business Logic Layer: Contains all business rules, workflows, and domain logic
- Data Access Layer: Manages database operations, queries, and transaction management
- This clear separation prevents mixing concerns, making code easier to understand and maintain.

**2. MAINTAINABILITY**

Changes in one layer have minimal impact on other layers:

- Can change UI framework (React to Angular) without touching business logic
- Can modify database schema without changing controllers
- Can add new business rules without modifying data access code
- Reduces regression bugs and makes updates safer
- Clear boundaries make it easier to locate and fix bugs

**3. TESTABILITY**

Each layer can be tested independently using different strategies:

- Business Logic: Unit tests with mock repositories (no database needed)
- Data Access: Integration tests with test database
- API Layer: API tests using tools like Postman or automated testing frameworks
- Presentation: UI tests with Selenium or similar tools
- Allows test-driven development (TDD) and ensures high code coverage




**4. SCALABILITY**

Each layer can scale independently based on specific needs:

- Can deploy multiple business logic servers behind a load balancer
- Can add database replicas (read replicas) without changing application code
- Can use CDN (Content Delivery Network) for presentation layer
- Stateless controllers enable horizontal scaling
- Connection pooling in data layer optimizes resource usage

**5. TEAM COLLABORATION**

Different teams can work on different layers simultaneously:

- Frontend team: Works on Presentation Layer (UI/UX)
- Backend team: Works on Business Logic and API layers
- Database team: Works on Data Access Layer and schema
- Clear interfaces between layers minimize integration issues
- Parallel development reduces project timeline
## <a name="_toc213595813"></a>**1.4. Design Patterns Applied**
**FACADE PATTERN – PetCareWebService**: Simplifies complex subsystem. Single entry point for clients. Hides 8+ managers behind simple API.

**REPOSITORY PATTERN - TypeORM**: TypeORM implements Repository and Active Record patterns. Abstracts database operations. Enables testing with mocks. Provides query builders and entity managers.

**MANAGER PATTERN - Business Logic**: Single responsibility per manager. Encapsulates business rules. Easy to locate and maintain logic.

**DEPENDENCY INJECTION - NestJS**: Built-in DI container manages component lifecycle. Constructor injection for loose coupling. Facilitates testing with mock providers.
## <a name="_toc213595814"></a>**1.5. Component Dependencies**
Dependency Flow: Client → WebService → Managers → DatabaseManager → Database

**Rule:** Upper layers call lower layers only. No circular dependencies.
## <a name="_toc213595815"></a>**1.6. Technology Stack**
Frontend: React/Angular + HTML5/CSS3

Backend: TypeScript/NestJS + TypeORM

Database: PostgreSQL

ORM: TypeORM (Active Record / Data Mapper patterns)

Security: JWT + bcrypt
## <a name="_toc213595816"></a>**1.7. Non-Functional Considerations**
PERFORMANCE: Connection pooling, caching, lazy loading

SECURITY: HTTPS, password hashing, RBAC, SQL injection prevention

RELIABILITY: Transaction management, error handling, backups

SCALABILITY: Stateless design, horizontal scaling, load balancing
## <a name="_toc213595817"></a>**1.8. Deployment View**
DEVELOPMENT: Single machine (all-in-one)

PRODUCTION: Three-tier (Client machines → Application server cluster → Database server)
## <a name="_toc213595818"></a>**1.9. Future Extensibility**
Easy to add: New services, new roles, new notifications, new reports

Easy to modify: Change UI, change database, add business rules

Migration path: Can evolve to microservices if needed

## **1.10. OOAD Compliance Summary (v3.0 Data Model Alignment)**

This architecture aligns with the OOAD principles documented in Data_model.md v3.0:

| **OOAD Principle** | **Architecture Implementation** |
|--------------------|---------------------------------|
| **Single Responsibility (SRP)** | Each Manager handles one concern; Entities separated (Account/PetOwner/Employee, VaccineType/VaccinationHistory) |
| **DRY** | No duplicate data; generated columns for derived data; VaccineType catalog prevents duplication |
| **Law of Demeter** | Appointment → Employee (direct); WorkSchedule for availability only (no scheduleId in Appointment) |
| **Open/Closed** | JSONB fields (medicalSummary, gatewayResponse) enable extension without schema changes |
| **Interface Segregation** | Database views (v_owner_dashboard, v_vet_schedule, v_receptionist_appointments) provide role-specific data |
| **Referential Integrity** | All FK relationships with CASCADE/RESTRICT/SET NULL policies per business rules |
| **Separation of Concerns** | Authentication (Account), Authorization (RBAC), Audit (AuditLog), Archive (PaymentGatewayArchive) |
| **Encapsulation** | DB functions (check_schedule_conflict), Views hide complex JOINs, Triggers enforce invariants |


# <a name="_toc213595819"></a>**2. Detailed Description of Each Component**
This section provides comprehensive class diagrams for all components in the Pet Care Service Management System. Each component includes detailed attributes, methods, relationships, and design rationale.
## <a name="_toc213595820"></a>**2.1. AccountManager Component**
The AccountManager component is responsible for managing all account-related operations including user authentication, registration, profile management, and role-based access control (RBAC).
### <a name="_toc213595821"></a>**2.1.1. Purpose and Responsibilities**
The AccountManager serves as the central authentication and authorization hub for the entire system. It manages:

- User authentication (login/logout)
- New user registration with validation
- User profile updates and password management
- Role-based access control enforcement
- Session management and security token generation
### <a name="_toc213595822"></a>**2.1.2. Class Diagram**

|**AccountManager**|
| :-: |
|**Attributes**|
|<p>- accountRepository: AccountRepository</p><p>*Data access layer for account persistence*</p><p>- securityManager: SecurityManager</p><p>*Handles encryption, hashing, and token generation*</p><p>- sessionManager: SessionManager</p><p>*Manages user sessions and active tokens*</p><p>- notificationService: NotificationService</p><p>*Sends confirmation emails and notifications*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ login(username: String, password: String): AuthToken</p><p>*Authenticates user credentials and returns session token*</p><p>*Throws: AuthenticationException if credentials invalid*</p><p>+ register(accountData: AccountDTO): Account</p><p>*Creates new user account with validation*</p><p>*Throws: ValidationException, DuplicateAccountException*</p><p>+ logout(token: AuthToken): Boolean</p><p>*Invalidates user session and clears authentication token*</p><p>+ updateProfile(accountId: Integer, updateData: AccountDTO): Account</p><p>*Updates user profile information*</p><p>*Throws: AccountNotFoundException, ValidationException*</p><p>+ changePassword(accountId: Integer, oldPass: String, newPass: String): Boolean</p><p>*Changes user password after validating old password*</p><p>*Throws: AuthenticationException, WeakPasswordException*</p><p>+ verifyRole(accountId: Integer, requiredRole: Role): Boolean</p><p>*Checks if user has required role for operation (RBAC)*</p><p>*Returns: true if authorized, false otherwise*</p><p>+ getAccountById(accountId: Integer): Account</p><p>*Retrieves account information by ID*</p><p>*Throws: AccountNotFoundException*</p><p>+ resetPassword(email: String): Boolean</p><p>*Initiates password reset process and sends reset link via email*</p><p>**Private Methods:**</p><p>- validateAccountData(accountData: AccountDTO): Boolean</p><p>*Validates account data format, email, phone number, etc.*</p><p>- hashPassword(password: String): String</p><p>*Hashes password using bcrypt algorithm with salt*</p><p>- generateAuthToken(account: Account): AuthToken</p><p>*Generates JWT token for authenticated session*</p>|
### <a name="_toc213595823"></a>**2.1.3. Related Classes and Dependencies**
The AccountManager component interacts with several other components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|Account (Entity)|Manages|Domain entity for user accounts|
|AccountRepository|Uses (Dependency)|Data persistence operations|
|SecurityManager|Uses (Dependency)|Encryption, hashing, token generation|
|NotificationService|Uses (Dependency)|Sends registration and password reset emails|
|PetOwner (Entity)|Associates with|Links accounts to pet owner profiles|
### <a name="_toc213595824"></a>**2.1.4. Design Decisions and Patterns**
**Manager Pattern:**

The AccountManager follows the Manager pattern (also known as Service Layer pattern), encapsulating all business logic related to account management. This centralizes authentication logic and makes it easier to maintain and test.

**Dependency Injection:**

Dependencies (AccountRepository, SecurityManager, NotificationService) are injected through the constructor, enabling loose coupling, easier testing with mock objects, and better flexibility for implementation changes.

**Security First:**

Password hashing uses bcrypt with salt for secure storage. JWT tokens are used for stateless authentication. All sensitive operations validate user identity and authorization before execution.

**Exception Handling:**

Custom exceptions (AuthenticationException, ValidationException, etc.) provide clear error messages and enable proper error handling at the API layer, improving debugging and user experience.

**Note:** *This component is critical for system security. All authentication and authorization flows pass through the AccountManager, making it essential for maintaining data confidentiality and system integrity.*

## <a name="_toc213595825"></a>**2.2. AppointmentManager Component**
The AppointmentManager component handles all appointment-related operations including booking, cancellation, rescheduling, and status management. It serves as the core business logic layer for the appointment workflow in the Pet Care Service Management System.
### <a name="_toc213595826"></a>**2.2.1. Purpose and Responsibilities**
The AppointmentManager orchestrates the complete appointment lifecycle and manages:

- Appointment booking with availability validation
- Appointment cancellation and rescheduling
- Status tracking (Pending, Confirmed, In-Progress, Completed, Cancelled)
- Appointment history and retrieval
- Notification triggering for appointment events
- Conflict detection and schedule validation
### <a name="_toc213595827"></a>**2.2.2. Class Diagram**

|**AppointmentManager**|
| :-: |
|**Attributes**|
|<p>- appointmentRepository: AppointmentRepository</p><p>*Data access layer for appointment persistence*</p><p>- scheduleManager: ScheduleManager</p><p>*Manages employee schedules and availability*</p><p>- petManager: PetManager</p><p>*Validates pet information and retrieves pet details*</p><p>- serviceManager: ServiceManager</p><p>*Manages service catalog and pricing information*</p><p>- notificationService: NotificationService</p><p>*Sends appointment confirmations and reminders*</p><p>- paymentManager: PaymentManager</p><p>*Handles payment processing for appointments*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ bookAppointment(appointmentData: AppointmentDTO): Appointment</p><p>*Creates new appointment with availability validation*</p><p>*Throws: ScheduleConflictException, InvalidServiceException, ValidationException*</p><p>+ cancelAppointment(appointmentId: Integer, reason: String): Boolean</p><p>*Cancels appointment and updates status to CANCELLED*</p><p>*Throws: AppointmentNotFoundException, InvalidStatusException*</p><p>+ rescheduleAppointment(appointmentId: Integer, newDateTime: DateTime): Appointment</p><p>*Reschedules appointment to new date/time with availability check*</p><p>*Throws: ScheduleConflictException, AppointmentNotFoundException*</p><p>+ confirmAppointment(appointmentId: Integer): Boolean</p><p>*Changes appointment status from PENDING to CONFIRMED*</p><p>*Throws: AppointmentNotFoundException, InvalidStatusException*</p><p>+ getAppointmentById(appointmentId: Integer): Appointment</p><p>*Retrieves appointment details by ID*</p><p>*Throws: AppointmentNotFoundException*</p><p>+ getAppointmentsByPetOwner(ownerId: Integer): List<Appointment></p><p>*Retrieves all appointments for a specific pet owner*</p><p>+ getAppointmentsByDate(date: Date): List<Appointment></p><p>*Retrieves all appointments scheduled for a specific date*</p><p>+ getAppointmentsByStatus(status: AppointmentStatus): List<Appointment></p><p>*Filters appointments by status (PENDING, CONFIRMED, etc.)*</p><p>+ updateAppointmentStatus(appointmentId: Integer, newStatus: AppointmentStatus): Boolean</p><p>*Updates appointment status with validation*</p><p>*Throws: InvalidStatusTransitionException*</p><p>+ getUpcomingAppointments(ownerId: Integer, days: Integer): List<Appointment></p><p>*Gets upcoming appointments within specified number of days*</p><p>**Private Methods:**</p><p>- validateAppointmentData(appointmentData: AppointmentDTO): Boolean</p><p>*Validates appointment data including date, time, pet, service*</p><p>- checkScheduleConflict(employeeId: Integer, dateTime: DateTime, duration: Integer): Boolean</p><p>*Checks for scheduling conflicts with existing appointments*</p><p>- calculateEstimatedCost(serviceId: Integer, petType: String): Decimal</p><p>*Calculates estimated cost based on service and pet type*</p><p>- sendAppointmentNotification(appointment: Appointment, notificationType: NotificationType): void</p><p>*Sends notifications for booking, confirmation, reminders, cancellation*</p><p>- validateStatusTransition(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): Boolean</p><p>*Validates state transitions (e.g., cannot go from CANCELLED to CONFIRMED)*</p>|
### <a name="_toc213595828"></a>**2.2.3. Related Classes and Dependencies**
The AppointmentManager component has extensive integration with other system components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|Appointment (Entity)|Manages|Domain entity for appointments|
|AppointmentRepository|Uses (Dependency)|Data persistence for appointments|
|ScheduleManager|Uses (Dependency)|Checks employee availability|
|PetManager|Uses (Dependency)|Validates pet information|
|ServiceManager|Uses (Dependency)|Retrieves service details and pricing|
|NotificationService|Uses (Dependency)|Sends confirmations and reminders|
|PaymentManager|Uses (Dependency)|Processes appointment payments|
### <a name="_toc213595829"></a>**2.2.4. Design Decisions and Patterns**
**Manager Pattern with Orchestration:**

The AppointmentManager acts as an orchestrator, coordinating multiple managers (ScheduleManager, PetManager, ServiceManager, PaymentManager) to complete complex workflows. This reduces coupling between components and centralizes appointment logic.

**State Machine Pattern:**

Appointment status follows a state machine with defined valid transitions (PENDING → CONFIRMED → IN\_PROGRESS → COMPLETED, with CANCELLED as a terminal state). The validateStatusTransition() method enforces business rules for state changes.

**Conflict Detection:**

The checkScheduleConflict() method prevents double-booking by verifying employee availability before confirming appointments. This ensures optimal resource utilization and prevents scheduling errors.

**Event-Driven Notifications:**

Notifications are triggered automatically for key events (booking, confirmation, reminders, cancellation) through the NotificationService. This keeps pet owners informed and reduces no-shows.
### <a name="_toc213595830"></a>**2.2.5. Appointment Status Flow**
The appointment follows this status lifecycle:

|**PENDING**|**→**|**CONFIRMED**|**→**|**IN\_PROGRESS**|**→**|**COMPLETED**|
| :-: | :- | :-: | :- | :-: | :- | :-: |

*Alternative path:*

|**Any Status**|**→**|**CANCELLED**|
| :-: | :- | :-: |

**Note:** *The AppointmentManager is the heart of the business logic layer, coordinating between multiple services to provide a seamless appointment experience. Its extensive validation and notification mechanisms ensure data integrity and user satisfaction.*

## <a name="_toc213595831"></a>**2.3. PetManager Component**
The PetManager component manages all pet-related information and operations within the system. It serves as the central repository for pet profiles, medical history references, and owner associations, ensuring comprehensive pet care tracking.
### <a name="_toc213595832"></a>**2.3.1. Purpose and Responsibilities**
The PetManager is responsible for comprehensive pet information management including:

- Pet profile creation and registration
- Pet information updates (breed, age, weight, health conditions)
- Owner-pet relationship management
- Pet medical history tracking and retrieval
- Pet search and filtering capabilities
- Validation of pet data for appointments and services
### <a name="_toc213595833"></a>**2.3.2. Class Diagram**

|**PetManager**|
| :-: |
|**Attributes**|
|<p>- petRepository: PetRepository</p><p>*Data access layer for pet persistence operations*</p><p>- petOwnerRepository: PetOwnerRepository</p><p>*Manages pet owner data for relationship validation*</p><p>- medicalRecordManager: MedicalRecordManager</p><p>*Accesses pet medical history and records*</p><p>- notificationService: NotificationService</p><p>*Sends notifications for pet-related updates*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ registerPet(petData: PetDTO, ownerId: Integer): Pet</p><p>*Registers new pet with owner association and validation*</p><p>*Throws: ValidationException, OwnerNotFoundException*</p><p>+ updatePetInfo(petId: Integer, updateData: PetDTO): Pet</p><p>*Updates pet information (name, breed, age, weight, health conditions)*</p><p>*Throws: PetNotFoundException, ValidationException*</p><p>+ getPetById(petId: Integer): Pet</p><p>*Retrieves complete pet profile by ID*</p><p>*Throws: PetNotFoundException*</p><p>+ getPetsByOwner(ownerId: Integer): List<Pet></p><p>*Retrieves all pets belonging to a specific owner*</p><p>+ deletePet(petId: Integer): Boolean</p><p>*Soft deletes pet record (marks as inactive)*</p><p>*Throws: PetNotFoundException, HasActiveAppointmentsException*</p><p>+ searchPets(searchCriteria: PetSearchDTO): List<Pet></p><p>*Searches pets by name, breed, species, or owner*</p><p>+ getPetMedicalHistory(petId: Integer): List<MedicalRecord></p><p>*Retrieves complete medical history for a pet*</p><p>+ transferPetOwnership(petId: Integer, newOwnerId: Integer): Boolean</p><p>*Transfers pet ownership to a different owner*</p><p>*Throws: PetNotFoundException, OwnerNotFoundException*</p><p>+ getPetsBySpecies(species: String): List<Pet></p><p>*Filters pets by species (Dog, Cat, Bird, etc.)*</p><p>+ updatePetWeight(petId: Integer, weight: Decimal, date: Date): Boolean</p><p>*Records new weight measurement with date tracking*</p><p>*Returns: true if updated successfully*</p><p>+ getPetAppointmentHistory(petId: Integer): List<Appointment></p><p>*Retrieves all past and upcoming appointments for a pet*</p><p>**Private Methods:**</p><p>- validatePetData(petData: PetDTO): Boolean</p><p>*Validates pet data format, species, breed, age range, weight*</p><p>- verifyOwnerExists(ownerId: Integer): Boolean</p><p>*Checks if owner exists before associating with pet*</p><p>- checkActiveAppointments(petId: Integer): Boolean</p><p>*Checks if pet has any pending or confirmed appointments*</p><p>- calculateAge(birthDate: Date): Integer</p><p>*Calculates pet's current age from birth date*</p>|
### <a name="_toc213595834"></a>**2.3.3. Related Classes and Dependencies**
The PetManager component collaborates with several other system components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|Pet (Entity)|Manages|Domain entity for pet information|
|PetRepository|Uses (Dependency)|Data persistence for pet records|
|PetOwner (Entity)|Associates with|Owner-pet relationship management|
|MedicalRecordManager|Uses (Dependency)|Retrieves medical history|
|AppointmentManager|Collaborates with|Provides pet data for appointments|
|NotificationService|Uses (Dependency)|Notifies owners of pet updates|
### <a name="_toc213595835"></a>**2.3.4. Design Decisions and Patterns**
**TypeORM Repository Pattern:**

The PetManager uses TypeORM's Repository pattern through dependency injection. TypeORM repositories are automatically generated from entity decorators, providing type-safe CRUD operations and query builders. This abstraction enables easy testing with mock repositories and keeps business logic independent of database implementation.

**Soft Delete Strategy:**

Pet deletion is implemented as a soft delete (marking inactive) rather than physical deletion. This preserves historical data for medical records and appointment history while preventing accidental data loss. Pets with active appointments cannot be deleted.

**Data Validation:**

Comprehensive validation ensures data integrity by checking species validity, age ranges, weight consistency, and owner existence before persisting pet information. This prevents orphaned records and maintains referential integrity.

**Historical Tracking:**

The component tracks weight changes over time and integrates with MedicalRecordManager to maintain complete health history. This temporal data supports trend analysis and informed veterinary decisions.

**Note:** *The PetManager serves as the authoritative source for all pet-related information in the system. Its integration with MedicalRecordManager and AppointmentManager ensures comprehensive pet care tracking throughout the pet's lifecycle with the service.*

<a name="_toc213595836"></a>
## **2.4. ScheduleManager Component**
The ScheduleManager component manages employee work schedules, availability tracking, and time slot allocation. It ensures optimal resource utilization by coordinating employee availability with appointment bookings and service requirements.
### <a name="_toc213595837"></a>**2.4.1. Purpose and Responsibilities**
The ScheduleManager handles all scheduling operations and workforce management:

- Employee work schedule creation and management
- Availability checking for appointment booking
- Time slot allocation and conflict detection
- Break time and time-off management
- Workload balancing across employees
- Schedule reporting and analytics
### <a name="_toc213595838"></a>**2.4.2. Class Diagram**

|**ScheduleManager**|
| :-: |
|**Attributes**|
|<p>- scheduleRepository: ScheduleRepository</p><p>*Data access layer for schedule persistence*</p><p>- employeeRepository: EmployeeRepository</p><p>*Retrieves employee information and roles*</p><p>- appointmentRepository: AppointmentRepository</p><p>*Checks existing appointments for conflict detection*</p><p>- notificationService: NotificationService</p><p>*Notifies employees of schedule changes*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ createSchedule(scheduleData: ScheduleDTO): Schedule</p><p>*Creates new work schedule for an employee with validation*</p><p>*Throws: ValidationException, ScheduleConflictException, EmployeeNotFoundException*</p><p>+ updateSchedule(scheduleId: Integer, updateData: ScheduleDTO): Schedule</p><p>*Updates existing schedule with conflict checking*</p><p>*Throws: ScheduleNotFoundException, ScheduleConflictException*</p><p>+ deleteSchedule(scheduleId: Integer): Boolean</p><p>*Removes schedule if no appointments are booked*</p><p>*Throws: ScheduleNotFoundException, HasActiveAppointmentsException*</p><p>+ checkAvailability(employeeId: Integer, dateTime: DateTime, duration: Integer): Boolean</p><p>*Checks if employee is available for specified time slot*</p><p>+ getAvailableTimeSlots(employeeId: Integer, date: Date, serviceDuration: Integer): List<TimeSlot></p><p>*Returns list of available time slots for a given date*</p><p>+ getScheduleByEmployee(employeeId: Integer, startDate: Date, endDate: Date): List<Schedule></p><p>*Retrieves employee schedule for date range*</p><p>+ getScheduleByDate(date: Date): List<Schedule></p><p>*Gets all employee schedules for a specific date*</p><p>+ assignBreakTime(scheduleId: Integer, breakStart: Time, breakEnd: Time): Boolean</p><p>*Assigns break time within work schedule*</p><p>+ requestTimeOff(employeeId: Integer, startDate: Date, endDate: Date, reason: String): TimeOffRequest</p><p>*Creates time-off request for employee*</p><p>+ getEmployeeWorkload(employeeId: Integer, startDate: Date, endDate: Date): WorkloadReport</p><p>*Calculates employee workload statistics for period*</p><p>+ findAvailableEmployee(serviceType: String, dateTime: DateTime, duration: Integer): List<Employee></p><p>*Finds employees available and qualified for service at specified time*</p><p>+ getScheduleById(scheduleId: Integer): Schedule</p><p>*Retrieves schedule by ID with full details*</p><p>**Private Methods:**</p><p>- validateScheduleData(scheduleData: ScheduleDTO): Boolean</p><p>*Validates schedule times, dates, and business rules*</p><p>- detectScheduleConflict(employeeId: Integer, startTime: DateTime, endTime: DateTime): Boolean</p><p>*Checks for overlapping schedules or appointments*</p><p>- calculateWorkHours(schedule: Schedule): Decimal</p><p>*Calculates total work hours excluding breaks*</p><p>- isWithinBusinessHours(startTime: Time, endTime: Time): Boolean</p><p>*Validates schedule times are within business operating hours*</p><p>- splitTimeSlots(schedule: Schedule, serviceDuration: Integer): List<TimeSlot></p><p>*Divides work schedule into bookable time slots based on service duration*</p>|
###

### <a name="_toc213595839"></a>**2.4.3. Related Classes and Dependencies**
The ScheduleManager integrates with multiple components for comprehensive schedule management:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|WorkSchedule (Entity)|Manages|Domain entity for work schedules (renamed from Schedule per v3.0)|
|WorkScheduleRepository|Uses (Dependency)|Data persistence for schedules|
|Employee (Entity)|Associates with|Links schedules to employees|
|AppointmentManager|Collaborates with|Provides availability for bookings|
|NotificationService|Uses (Dependency)|Notifies of schedule changes|

**OOAD Note (v3.0 Alignment - Law of Demeter):**
- WorkSchedule serves ONLY for availability checking
- Appointments reference Employee directly (no scheduleId in Appointment)
- This simplifies the model and reduces unnecessary JOINs
### <a name="_toc213595840"></a>**2.4.4. Design Decisions and Patterns**
**Time Slot Algorithm:**

The splitTimeSlots() method intelligently divides work schedules into bookable time slots based on service duration. It accounts for breaks, existing appointments, and minimum gap times between appointments, ensuring realistic scheduling.

**Conflict Detection Strategy:**

Multi-level conflict detection prevents double-booking by checking: overlapping work schedules, existing appointments, break times, and time-off requests. This ensures data integrity and prevents scheduling errors that would impact service quality.

**Resource Optimization:**

The findAvailableEmployee() method implements load balancing by considering both availability and current workload. This distributes appointments evenly across qualified employees, preventing burnout and improving service quality.

**Business Rules Enforcement:**

The component enforces business constraints such as maximum working hours, mandatory break times, and business operating hours. This ensures compliance with labor regulations and maintains employee wellbeing.

**Note:** *The ScheduleManager is critical for operational efficiency, balancing employee availability with customer demand. Its sophisticated conflict detection and time slot algorithms ensure optimal resource utilization while maintaining service quality and employee wellbeing.*

## <a name="_toc213595841"></a>**2.5. ServiceManager Component**
The ServiceManager component manages the service catalog, including service definitions, pricing, duration estimates, and service requirements. It acts as the central authority for all pet care services offered by the system.
### <a name="_toc213595842"></a>**2.5.1. Purpose and Responsibilities**
The ServiceManager provides comprehensive service catalog management:

- Service catalog creation and maintenance
- Pricing management and dynamic pricing rules
- Service duration and resource estimation
- Service categorization and filtering
- Service availability and qualification management
- Service package and bundle creation
### <a name="_toc213595843"></a>**2.5.2. Class Diagram**

|**ServiceManager**|
| :-: |
|**Attributes**|
|<p>- serviceRepository: ServiceRepository</p><p>*Data access layer for service catalog persistence*</p><p>- pricingEngine: PricingEngine</p><p>*Calculates dynamic pricing based on rules and conditions*</p><p>- notificationService: NotificationService</p><p>*Notifies of service catalog updates*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ createService(serviceData: ServiceDTO): Service</p><p>*Creates new service in catalog with validation*</p><p>*Throws: ValidationException, DuplicateServiceException*</p><p>+ updateService(serviceId: Integer, updateData: ServiceDTO): Service</p><p>*Updates service details, pricing, or duration*</p><p>*Throws: ServiceNotFoundException, ValidationException*</p><p>+ deleteService(serviceId: Integer): Boolean</p><p>*Soft deletes service (marks as unavailable)*</p><p>*Throws: ServiceNotFoundException, ServiceInUseException*</p><p>+ getServiceById(serviceId: Integer): Service</p><p>*Retrieves complete service details by ID*</p><p>*Throws: ServiceNotFoundException*</p><p>+ getAllServices(): List<Service></p><p>*Retrieves all available services in catalog*</p><p>+ getServicesByCategory(category: String): List<Service></p><p>*Filters services by category (Grooming, Medical, Boarding, etc.)*</p><p>+ calculateServicePrice(serviceId: Integer, petType: String, addOns: List<Integer>): Decimal</p><p>*Calculates total price with pet type modifiers and add-ons*</p><p>+ searchServices(searchCriteria: ServiceSearchDTO): List<Service></p><p>*Searches services by name, category, price range, or duration*</p><p>+ getServicesByPriceRange(minPrice: Decimal, maxPrice: Decimal): List<Service></p><p>*Filters services within specified price range*</p><p>+ updateServiceAvailability(serviceId: Integer, isAvailable: Boolean): Boolean</p><p>*Toggles service availability (e.g., seasonal services)*</p><p>+ getPopularServices(limit: Integer): List<Service></p><p>*Returns most frequently booked services*</p><p>+ createServicePackage(packageData: PackageDTO): ServicePackage</p><p>*Creates bundled service package with discount*</p><p>**Private Methods:**</p><p>- validateServiceData(serviceData: ServiceDTO): Boolean</p><p>*Validates service name, category, pricing, and duration*</p><p>- checkDuplicateService(serviceName: String, category: String): Boolean</p><p>*Prevents duplicate services in same category*</p><p>- applyPetTypeModifier(basePrice: Decimal, petType: String): Decimal</p><p>*Applies size/breed-based price adjustments*</p><p>- calculatePackageDiscount(services: List<Service>, discountRate: Decimal): Decimal</p><p>*Calculates bundled package pricing with discount*</p>|
###

### <a name="_toc213595844"></a>**2.5.3. Related Classes and Dependencies**
The ServiceManager interacts with several components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|Service (Entity)|Manages|Domain entity for services|
|ServiceRepository|Uses (Dependency)|Data persistence for services|
|PricingEngine|Uses (Dependency)|Dynamic pricing calculations|
|AppointmentManager|Provides data to|Service info for appointments|
|PaymentManager|Provides data to|Pricing info for invoices|
|NotificationService|Uses (Dependency)|Notifies of catalog updates|
### <a name="_toc213595845"></a>**2.5.4. Design Decisions and Patterns**
**Pricing Strategy Pattern:**

The PricingEngine encapsulates complex pricing logic using the Strategy pattern. This allows dynamic pricing based on pet type, service duration, seasonal factors, and promotional discounts. The pattern enables easy addition of new pricing strategies without modifying existing code.

**Catalog Pattern:**

Services are organized in a hierarchical catalog structure with categories and subcategories. This provides intuitive navigation for users and enables efficient filtering and search operations. The catalog maintains service metadata including descriptions, requirements, and qualifications.

**Service Package Composition:**

The createServicePackage() method implements the Composite pattern, allowing individual services to be bundled into packages with discounted pricing. This encourages customers to book multiple services and increases revenue per appointment.

**Soft Deletion:**

Service deletion is implemented as soft delete to preserve historical appointment and invoice data. Services marked as unavailable don't appear in customer-facing catalogs but remain accessible for reporting and historical reference.


### <a name="_toc213595846"></a>**2.5.5. Service Categories**
The system supports the following service categories:

|**Category**|**Example Services**|
| :-: | :-: |
|**Grooming**|Bath & Brush, Haircut, Nail Trimming, Teeth Cleaning, De-shedding Treatment|
|**Medical**|Vaccination, Health Checkup, Parasite Treatment, Dental Examination, Surgery|
|**Boarding**|Day Care, Overnight Boarding, Extended Stay, Luxury Suite, Group Play|
|**Training**|Basic Obedience, Behavioral Training, Puppy Training, Agility Training|
|**Wellness**|Massage Therapy, Hydrotherapy, Nutrition Consultation, Weight Management|
|**Special Care**|Senior Pet Care, Medication Administration, Post-Surgery Care, Special Diet|

**Note:** *The ServiceManager is the foundation of the business model, defining what services the pet care center offers. Its flexible pricing engine and package capabilities enable competitive pricing strategies while the categorization system provides intuitive service discovery for customers.*

## <a name="_toc213595847"></a>**2.6. PaymentManager Component**
The PaymentManager component handles all financial transactions, invoice generation, payment processing, and refund management. It ensures secure payment handling while maintaining comprehensive financial records for the pet care service system.
### <a name="_toc213595848"></a>**2.6.1. Purpose and Responsibilities**
The PaymentManager provides comprehensive financial transaction management:

- Invoice generation and management
- Payment processing (cash, bank transfer, online via VNPay gateway)
- Online payment gateway integration (VNPay for credit/debit cards, QR code)
- Payment status tracking and verification
- Payment callback handling from external gateways
- Refund and credit processing
- Payment history and receipt generation
- Transaction record management (transaction ID, timestamp, payment method)
- Financial reporting and reconciliation
### <a name="_toc213595849"></a>**2.6.2. Class Diagram**

|**PaymentManager**|
| :-: |
|**Attributes**|
|<p>- invoiceRepository: InvoiceRepository</p><p>*Data access layer for invoice and payment records*</p><p>- paymentGateway: PaymentGateway</p><p>*Integration with external payment processing services*</p><p>- vnpayGateway: VNPayGatewayInterface</p><p>*VNPay payment gateway for online payments (UC-23)*</p><p>- appointmentManager: AppointmentManager</p><p>*Retrieves appointment details for invoice generation*</p><p>- serviceManager: ServiceManager</p><p>*Retrieves service pricing information*</p><p>- notificationService: NotificationService</p><p>*Sends payment confirmations and receipts*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ generateInvoice(appointmentId: Integer): Invoice</p><p>*Creates invoice from appointment with itemized charges*</p><p>*Throws: AppointmentNotFoundException, InvoiceAlreadyExistsException*</p><p>+ processPayment(invoiceId: Integer, paymentData: PaymentDTO): Payment</p><p>*Processes cash/bank transfer payment and updates invoice status*</p><p>*Throws: PaymentProcessingException, InsufficientFundsException*</p><p>+ initiateOnlinePayment(invoiceId: Integer, amount: Decimal): PaymentURL</p><p>*Initiates VNPay online payment and returns payment URL (UC-23)*</p><p>*Throws: InvoiceNotFoundException, PaymentGatewayException*</p><p>+ handlePaymentCallback(transactionData: VNPayCallbackDTO): Boolean</p><p>*Processes VNPay payment callback and updates invoice status (UC-23)*</p><p>*Throws: InvalidCallbackException, InvoiceNotFoundException*</p><p>+ recordOnlinePayment(invoiceId: Integer, transactionId: String, timestamp: DateTime): Boolean</p><p>*Records online payment details including transaction ID and timestamp (UC-23)*</p><p>*Updates invoice status to 'Paid' and stores payment method as 'VNPay'*</p><p>+ processRefund(paymentId: Integer, amount: Decimal, reason: String): Refund</p><p>*Processes full or partial refund through payment gateway*</p><p>*Throws: PaymentNotFoundException, RefundException*</p><p>+ getInvoiceById(invoiceId: Integer): Invoice</p><p>*Retrieves complete invoice details including line items*</p><p>+ getInvoicesByStatus(status: String): List<Invoice></p><p>*Retrieves invoices by status (Pending Payment, Processing Online Payment, Paid, Payment Failed)*</p><p>+ getPaymentHistory(customerId: Integer, startDate: Date, endDate: Date): List<Payment></p><p>*Retrieves payment history for date range*</p><p>+ generateReceipt(paymentId: Integer): Receipt</p><p>*Generates payment receipt with transaction details*</p><p>+ verifyPayment(paymentId: Integer): PaymentVerification</p><p>*Verifies payment status with payment gateway*</p><p>**Private Methods:**</p><p>- validatePaymentData(paymentData: PaymentDTO): Boolean</p><p>*Validates payment method, amount, and information*</p><p>- calculateTotalAmount(lineItems: List<LineItem>, discount: Decimal): Decimal</p><p>*Calculates total with discounts and taxes*</p><p>- encryptPaymentInfo(paymentData: PaymentDTO): String</p><p>*Encrypts sensitive payment information*</p><p>- buildVNPayRequest(invoiceId: Integer, amount: Decimal): VNPayRequestDTO</p><p>*Builds VNPay payment request with required parameters*</p><p>- validateVNPayCallback(callbackData: VNPayCallbackDTO): Boolean</p><p>*Validates VNPay callback signature and parameters*</p>|
### <a name="_toc213595850"></a>**2.6.3. Related Classes and Dependencies**
The PaymentManager integrates with multiple components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|Invoice (Entity)|Manages|Domain entity for invoices|
|InvoiceRepository|Uses (Dependency)|Data persistence operations|
|PaymentGateway|Uses (Dependency)|External payment processing|
|VNPayGatewayInterface|Uses (Dependency)|VNPay online payment gateway integration (UC-23)|
|AppointmentManager|Uses (Dependency)|Retrieves appointment data|
|ServiceManager|Uses (Dependency)|Retrieves pricing information|
|NotificationService|Uses (Dependency)|Sends receipts and confirmations|
### <a name="_toc213595851"></a>**2.6.4. Design Decisions and Patterns**
**Payment Gateway Abstraction:**

The PaymentGateway interface abstracts external payment processors using the Adapter pattern. This allows switching between payment providers without modifying business logic and enables testing with mock gateways. VNPayGatewayInterface specifically handles VNPay integration for online payments.

**VNPay Integration (UC-23):**

The component integrates with VNPay payment gateway using their sandbox environment for testing. The initiateOnlinePayment() method creates payment requests and redirects users to VNPay portal. The handlePaymentCallback() method processes asynchronous payment notifications from VNPay and updates invoice status accordingly. All VNPay callbacks are validated using secure hash signatures.

**Payment Status State Machine:**

Invoice status follows a defined state machine: Generated → Pending Payment → Processing Online Payment (for VNPay) → Paid/Payment Failed. The recordOnlinePayment() method stores transaction ID, payment method, and timestamp for audit trail and reconciliation.

**Transaction Integrity:**

All financial operations use database transactions to ensure ACID properties. Invoice generation, payment processing, and refunds are atomic operations that either complete fully or rollback entirely.

**Security and Compliance:**

Sensitive payment information is encrypted before storage. Credit card details are never stored directly - VNPay handles all card processing securely. Only transaction IDs and payment status are stored locally, ensuring PCI DSS compliance.

**OOAD Note (v3.0 Alignment - Open/Closed Principle):**
- Payment entity uses JSONB `gatewayResponse` field for extensibility
- Different payment gateways (VNPay, future Momo/ZaloPay) can have different response structures
- No schema changes needed when adding new payment providers
- PaymentGatewayArchive table stores historical gateway responses (data retention policy)
## <a name="_toc213595852"></a>**2.7. MedicalRecordManager Component**
The MedicalRecordManager component manages comprehensive medical records for pets, including health history, diagnoses, treatments, vaccinations, and prescriptions. It ensures accurate medical documentation and enables tracking of pet health over time.
### <a name="_toc213595853"></a>**2.7.1. Purpose and Responsibilities**
The MedicalRecordManager provides comprehensive medical record management:

- Medical record creation and documentation
- Diagnosis and treatment tracking
- Vaccination history management
- Prescription and medication tracking
- Medical history retrieval and search
- Medical report generation
### <a name="_toc213595854"></a>**2.7.2. Class Diagram**

|**MedicalRecordManager**|
| :-: |
|**Attributes**|
|<p>- medicalRecordRepository: MedicalRecordRepository</p><p>*Data access layer for medical record persistence*</p><p>- petManager: PetManager</p><p>*Retrieves pet information and validates pet ownership*</p><p>- appointmentManager: AppointmentManager</p><p>*Links medical records to appointments*</p><p>- notificationService: NotificationService</p><p>*Sends vaccination reminders and health alerts*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ createMedicalRecord(recordData: MedicalRecordDTO): MedicalRecord</p><p>*Creates new medical record for pet with diagnosis and treatment*</p><p>*Throws: PetNotFoundException, ValidationException, AppointmentNotFoundException*</p><p>+ updateMedicalRecord(recordId: Integer, updateData: MedicalRecordDTO): MedicalRecord</p><p>*Updates existing medical record with new information*</p><p>*Throws: MedicalRecordNotFoundException, ValidationException*</p><p>+ getMedicalRecordById(recordId: Integer): MedicalRecord</p><p>*Retrieves complete medical record by ID*</p><p>*Throws: MedicalRecordNotFoundException*</p><p>+ getMedicalHistoryByPet(petId: Integer): List<MedicalRecord></p><p>*Retrieves complete medical history for a pet in chronological order*</p><p>+ addVaccination(petId: Integer, vaccinationData: VaccinationDTO): Vaccination</p><p>*Records vaccination with vaccine type, date, and next due date*</p><p>*Throws: PetNotFoundException, ValidationException*</p><p>+ getVaccinationHistory(petId: Integer): List<Vaccination></p><p>*Retrieves all vaccinations for a pet*</p><p>+ addPrescription(recordId: Integer, prescriptionData: PrescriptionDTO): Prescription</p><p>*Adds prescription to medical record with medication details and dosage*</p><p>*Throws: MedicalRecordNotFoundException, ValidationException*</p><p>+ searchMedicalRecords(searchCriteria: MedicalSearchDTO): List<MedicalRecord></p><p>*Searches records by diagnosis, treatment, date range, or pet*</p><p>+ getUpcomingVaccinations(petId: Integer, daysAhead: Integer): List<Vaccination></p><p>*Gets vaccinations due within specified days*</p><p>+ generateMedicalReport(petId: Integer, startDate: Date, endDate: Date): MedicalReport</p><p>*Generates comprehensive medical report for date range*</p><p>+ attachDocument(recordId: Integer, document: File, documentType: String): Document</p><p>*Attaches supporting documents (X-rays, lab results, etc.)*</p><p>**Private Methods:**</p><p>- validateMedicalData(recordData: MedicalRecordDTO): Boolean</p><p>*Validates medical record data format and required fields*</p><p>- checkVaccinationSchedule(petId: Integer, vaccineType: String): Date</p><p>*Calculates next vaccination due date based on vaccine schedule*</p><p>- sendVaccinationReminder(vaccination: Vaccination): void</p><p>*Sends reminder notification to pet owner for upcoming vaccination*</p>|
### <a name="_toc213595855"></a>**2.7.3. Related Classes and Dependencies**
The MedicalRecordManager integrates with multiple components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|MedicalRecord (Entity)|Manages|Domain entity for medical records|
|MedicalRecordRepository|Uses (Dependency)|Data persistence operations|
|VaccineType (Entity)|References|Vaccine catalog (DRY - metadata stored once)|
|VaccinationHistory (Entity)|Manages|Pet vaccination records (SRP - separated from catalog)|
|VaccineTypeRepository|Uses (Dependency)|Vaccine catalog lookups|
|VaccinationHistoryRepository|Uses (Dependency)|Vaccination record persistence|
|PetManager|Uses (Dependency)|Validates pet information|
|AppointmentManager|Collaborates with|Links records to appointments|
|NotificationService|Uses (Dependency)|Sends vaccination reminders|

**OOAD Note (v3.0 Alignment):** Vaccination management follows SRP by separating:
- `VaccineType`: Catalog data (name, manufacturer, schedule) - reference data
- `VaccinationHistory`: Pet records (date administered, batch number, reactions) - transactional data
### <a name="_toc213595856"></a>**2.7.4. Design Decisions and Patterns**
**Comprehensive Medical History:**

Medical records are maintained as immutable historical documents. Updates create new versions rather than modifying existing records, ensuring complete audit trail and preventing loss of historical medical data.

**Vaccination Tracking System:**

The component includes automated vaccination scheduling with reminder notifications. The checkVaccinationSchedule() method calculates next due dates based on vaccine type and pet species, ensuring timely preventive care.

**Note:** *The MedicalRecordManager is essential for providing quality veterinary care by maintaining comprehensive medical histories. Its integration with vaccination tracking, prescription management, and automated reminders ensures proactive pet health management.*
## <a name="_toc213595857"></a>**2.8. ReportManager Component**
The ReportManager component generates comprehensive business intelligence reports and analytics for the pet care service system. It aggregates data from multiple sources to provide insights on operations, finances, appointments, and customer trends.
### <a name="_toc213595858"></a>**2.8.1. Purpose and Responsibilities**
The ReportManager provides comprehensive reporting and analytics:

- Financial reports (revenue, expenses, profit margins)
- Appointment statistics and trends
- Service performance analysis
- Customer behavior and retention metrics
- Employee performance and workload reports
- Custom report generation and export

<a name="_toc213595859"></a>
### **2.8.2. Class Diagram**

|**ReportManager**|
| :-: |
|**Attributes**|
|<p>- appointmentRepository: AppointmentRepository</p><p>*Retrieves appointment data for analysis*</p><p>- invoiceRepository: InvoiceRepository</p><p>*Retrieves financial transaction data*</p><p>- serviceRepository: ServiceRepository</p><p>*Retrieves service usage statistics*</p><p>- scheduleRepository: ScheduleRepository</p><p>*Retrieves employee schedule and workload data*</p><p>- reportExporter: ReportExporter</p><p>*Exports reports in various formats (PDF, Excel, CSV)*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ generateFinancialReport(startDate: Date, endDate: Date): FinancialReport</p><p>*Generates comprehensive financial report with revenue, expenses, and profit*</p><p>+ getRevenueByPeriod(period: String, year: Integer): List<RevenueSummary></p><p>*Gets revenue breakdown by month, quarter, or year*</p><p>+ exportReport(report: Report, format: String): File</p><p>*Exports report in specified format (PDF, Excel, CSV)*</p><p>+ getTopServices(limit: Integer, startDate: Date, endDate: Date): List<ServiceStatistic></p><p>*Returns top N services by booking count or revenue*</p><p>**Private Methods:**</p><p>- aggregateFinancialData(startDate: Date, endDate: Date): FinancialData</p><p>*Aggregates revenue, expenses, and payment data*</p><p>- formatReportData(rawData: Object, reportType: String): Report</p><p>*Formats raw data into structured report with visualizations*</p>|
###
<a name="_toc213595860"></a>
### **2.8.3. Related Classes and Dependencies**
The ReportManager aggregates data from multiple components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|AppointmentRepository|Uses (Dependency)|Retrieves appointment data|
|InvoiceRepository|Uses (Dependency)|Retrieves financial data|
|ServiceRepository|Uses (Dependency)|Retrieves service statistics|
|ScheduleRepository|Uses (Dependency)|Retrieves employee workload|
|ReportExporter|Uses (Dependency)|Exports reports in various formats|
### <a name="_toc213595861"></a>**2.8.4. Design Decisions and Patterns**
**Data Aggregation Pattern:**

The ReportManager aggregates data from multiple repositories using efficient queries to minimize database load. It implements caching for frequently accessed metrics and uses batch processing for large datasets.

**Report Export Strategy:**

The ReportExporter implements the Strategy pattern, allowing different export formats (PDF, Excel, CSV) to be handled by specialized exporters. This makes it easy to add new export formats without modifying existing code.

**Note:** *The ReportManager provides critical business intelligence for data-driven decision making. Its comprehensive analytics help management optimize operations, improve customer satisfaction, and maximize profitability.*

<a name="_toc213595863"></a>
## **2.9. DatabaseManager Component**
The DatabaseManager component provides TypeORM configuration and initialization for the Pet Care Service Management System. It configures the TypeORM DataSource, manages entity registration, and handles database migrations. This component leverages TypeORM's built-in connection pooling, repository patterns, and query builders.
### <a name="_toc213595864"></a>**2.9.1. Purpose and Responsibilities**
The DatabaseManager provides TypeORM configuration and initialization:

- TypeORM DataSource configuration and initialization
- Entity registration and metadata management
- Database connection pool configuration (via TypeORM)
- Migration and synchronization settings
- Connection health monitoring and recovery
- Query logging and performance monitoring (via TypeORM)
### <a name="_toc213595865"></a>**2.9.2. Class Diagram**

|**DatabaseManager**|
| :-: |
|**Attributes**|
|<p>- dataSource: DataSource</p><p>*TypeORM DataSource instance for database operations*</p><p>- ormConfig: DataSourceOptions</p><p>*TypeORM configuration (entities, migrations, connection pool)*</p><p>- isInitialized: Boolean</p><p>*Flag indicating if DataSource is initialized*</p><p>- entities: Array<EntitySchema></p><p>*Registered entity classes for TypeORM*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ initialize(): Promise<DataSource></p><p>*Initializes TypeORM DataSource and establishes connection*</p><p>*Throws: DataSourceInitializationException*</p><p>+ getDataSource(): DataSource</p><p>*Returns initialized TypeORM DataSource instance*</p><p>*Throws: DataSourceNotInitializedException*</p><p>+ getRepository<T>(entity: EntityTarget<T>): Repository<T></p><p>*Returns TypeORM Repository instance for entity*</p><p>+ getEntityManager(): EntityManager</p><p>*Returns TypeORM EntityManager for complex queries*</p><p>+ runMigrations(): Promise<void></p><p>*Executes pending database migrations*</p><p>+ synchronize(dropBeforeSync: Boolean): Promise<void></p><p>*Synchronizes database schema with entities (dev only)*</p><p>+ testConnection(): Promise<Boolean></p><p>*Tests database connectivity and returns status*</p><p>+ destroy(): Promise<void></p><p>*Closes all database connections gracefully*</p><p>**Private Methods:**</p><p>- loadEntities(): Array<EntitySchema></p><p>*Loads and registers all entity classes*</p><p>- configureConnectionPool(): Object</p><p>*Configures TypeORM connection pool settings*</p><p>- setupLogging(): Object</p><p>*Configures TypeORM query logging options*</p>|
###
<a name="_toc213595866"></a>
### **2.9.3. Related Classes and Dependencies**
The DatabaseManager is used by all repository components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|All Manager Classes|Used by (Dependency)|Inject TypeORM repositories|
|TypeORM DataSource|Uses (Dependency)|Database connection and operations|
|Entity Classes|Manages|Registers entities with TypeORM|
|Migration Scripts|Uses|Executes database migrations|
|Repository Pattern (TypeORM)|Provides|Built-in repository implementation|
### <a name="_toc213595867"></a>**2.9.4. Design Decisions and Patterns**
**TypeORM Integration:**

TypeORM provides built-in Repository and Data Mapper patterns, eliminating the need for custom repository implementations. It handles entity mapping, query building, and transaction management automatically. This reduces boilerplate code and ensures best practices.

**Connection Pooling:**

TypeORM manages connection pooling automatically with configurable pool size, timeout, and retry logic. This significantly improves performance by reusing database connections and enables handling high concurrent load efficiently.

**Query Builder & Entity Manager:**

TypeORM provides both Repository pattern (simple CRUD) and QueryBuilder (complex queries). The EntityManager allows flexible transaction management and raw SQL execution when needed. All queries use parameterized statements to prevent SQL injection.

**Migration System:**

TypeORM migrations enable version-controlled database schema changes. Migrations run automatically on deployment, ensuring all environments have consistent database structure. This is safer than schema synchronization in production.

**Transaction Management:**

TypeORM supports ACID transactions with decorators (@Transaction) and EntityManager methods. Transactions can span multiple operations and automatically rollback on errors, ensuring data consistency for complex workflows like payment processing.
### <a name="_toc213595868"></a>**2.9.5. TypeORM Configuration**

**Connection Pool Settings:**

- **Max Connections:** 20 (concurrent database connections)
- **Connection Timeout:** 30 seconds
- **Idle Timeout:** 10 minutes
- **Acquire Timeout:** 60 seconds

**Entity Management:**

- **Entity Location:** `src/entities/**/*.entity.ts`
- **Synchronize:** `false` (production), `true` (development only)
- **Migrations:** `src/migrations/**/*.ts`
- **Migration Run:** Auto-run on application start

**Logging Configuration:**

- **Logging Level:** `error` (production), `all` (development)
- **Log Queries:** `true` (development), `false` (production)
- **Max Query Execution Time:** 1000ms (log slow queries)
## <a name="_toc213595869"></a>**2.10. NotificationService Component**
The NotificationService component handles all system notifications including email, SMS, and push notifications. It provides a unified interface for sending notifications across multiple channels and manages notification templates, queuing, and delivery tracking.

<a name="_toc213595870"></a>
### **2.10.1. Purpose and Responsibilities**
The NotificationService provides comprehensive notification management:

- Multi-channel notification delivery (Email, Push)
- Template-based message generation
- Notification queue management
- Delivery status tracking and retry logic
- User notification preferences
- Scheduled notifications and reminders
### <a name="_toc213595871"></a>**2.10.2. Class Diagram**

|**NotificationService**|
| :-: |
|**Attributes**|
|<p>- emailProvider: EmailProvider</p><p>*Integration with email service (SMTP, SendGrid, etc.)*</p><p>- smsProvider: SMSProvider</p><p>*Integration with SMS gateway (Twilio, etc.)*</p><p>- templateManager: TemplateManager</p><p>*Manages notification templates and content*</p><p>- notificationQueue: NotificationQueue</p><p>*Queue for async notification processing*</p><p>- notificationLogger: NotificationLogger</p><p>*Logs all notification attempts and delivery status*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ sendEmail(recipient: String, subject: String, body: String): Boolean</p><p>*Sends email notification to recipient*</p><p>*Throws: EmailSendException*</p><p>+ sendTemplatedEmail(recipient: String, templateId: String, data: Map<String, Object>): Boolean</p><p>*Sends email using template with dynamic data*</p><p>*Throws: TemplateNotFoundException, EmailSendException*</p><p>+ sendAppointmentConfirmation(appointment: Appointment): Boolean</p><p>*Sends appointment confirmation to pet owner*</p><p>+ sendAppointmentReminder(appointment: Appointment, hoursBefore: Integer): Boolean</p><p>*Sends reminder notification before appointment*</p><p>+ sendPaymentReceipt(payment: Payment, invoice: Invoice): Boolean</p><p>*Sends payment receipt via email*</p><p>+ sendVaccinationReminder(vaccination: Vaccination, pet: Pet): Boolean</p><p>*Sends vaccination due reminder to pet owner*</p><p>+ scheduleNotification(notification: Notification, scheduleTime: DateTime): Boolean</p><p>*Schedules notification for future delivery*</p><p>+ getNotificationStatus(notificationId: String): NotificationStatus</p><p>*Retrieves delivery status of notification*</p><p>+ updateUserPreferences(userId: Integer, preferences: NotificationPreferences): Boolean</p><p>*Updates user notification channel preferences*</p><p>**Private Methods:**</p><p>- renderTemplate(templateId: String, data: Map<String, Object>): String</p><p>*Renders template with dynamic data substitution*</p><p>- checkUserPreferences(userId: Integer, notificationType: String): Boolean</p><p>*Checks if user wants to receive this notification type*</p><p>- queueNotification(notification: Notification): void</p><p>*Adds notification to queue for async processing*</p><p>- retryFailedNotification(notificationId: String, attemptCount: Integer): Boolean</p><p>*Retries failed notification with exponential backoff*</p>|
### <a name="_toc213595872"></a>**2.10.3. Related Classes and Dependencies**
The NotificationService is used by multiple business logic components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|AccountManager|Used by|Registration confirmations|
|AppointmentManager|Used by|Appointment confirmations and reminders|
|PaymentManager|Used by|Payment receipts|
|MedicalRecordManager|Used by|Vaccination reminders|
|EmailProvider|Uses (Dependency)|Sends emails via SMTP|
|SMSProvider|Uses (Dependency)|Sends SMS messages|
|TemplateManager|Uses (Dependency)|Manages notification templates|
### <a name="_toc213595873"></a>**2.10.4. Design Decisions and Patterns**
**Strategy Pattern for Providers:**

EmailProvider and SMSProvider interfaces allow easy switching between notification providers (SendGrid, Twilio, etc.) without modifying the NotificationService. This enables testing with mock providers and flexibility in vendor selection.

**Template Pattern:**

The TemplateManager enables reusable, professional notification templates with dynamic content substitution. Templates ensure consistent branding and messaging while reducing code duplication for common notification types.

**Asynchronous Queue Processing:**

Notifications are queued for asynchronous processing to prevent blocking business operations. The queue enables batch processing, rate limiting, and automatic retry of failed notifications with exponential backoff.

**User Preference Management:**

The checkUserPreferences() method respects user notification preferences before sending. Users can opt-out of specific notification types (marketing, reminders, etc.) while still receiving critical notifications (appointment confirmations, receipts).
## <a name="_toc213595875"></a>**2.11. SecurityManager Component**
The SecurityManager component handles authentication, authorization, encryption, and security audit logging. It provides centralized security services to protect sensitive data and ensure only authorized users can access system resources.
### <a name="_toc213595876"></a>**2.11.1. Purpose and Responsibilities**
The SecurityManager provides comprehensive security services:

- User authentication and session management
- Role-based access control (RBAC)
- Password hashing and validation
- Data encryption and decryption
- Security token generation and validation (JWT)
- Security audit logging and threat detection

<a name="_toc213595877"></a>
### **2.11.2. Class Diagram**

|**SecurityManager**|
| :-: |
|**Attributes**|
|<p>- passwordEncoder: PasswordEncoder</p><p>*Handles password hashing using bcrypt algorithm*</p><p>- encryptionService: EncryptionService</p><p>*Encrypts/decrypts sensitive data using AES-256*</p><p>- tokenManager: TokenManager</p><p>*Generates and validates JWT tokens for authentication*</p><p>- sessionManager: SessionManager</p><p>*Manages user sessions and session timeout*</p><p>- auditLogger: AuditLogger</p><p>*Logs security events for compliance and monitoring*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ authenticate(username: String, password: String): AuthenticationResult</p><p>*Authenticates user credentials and returns token on success*</p><p>*Throws: AuthenticationException, AccountLockedException*</p><p>+ validateToken(token: String): TokenValidation</p><p>*Validates JWT token signature and expiration*</p><p>*Throws: InvalidTokenException, ExpiredTokenException*</p><p>+ hashPassword(plainPassword: String): String</p><p>*Hashes password using bcrypt with salt*</p><p>+ verifyPassword(plainPassword: String, hashedPassword: String): Boolean</p><p>*Verifies password against stored hash*</p><p>+ checkPermission(userId: Integer, resource: String, action: String): Boolean</p><p>*Checks if user has permission to perform action on resource*</p><p>+ assignRole(userId: Integer, role: String): Boolean</p><p>*Assigns role to user (ADMIN, STAFF, CUSTOMER)*</p><p>+ encryptData(plainData: String): String</p><p>*Encrypts sensitive data using AES-256 encryption*</p><p>+ decryptData(encryptedData: String): String</p><p>*Decrypts encrypted data*</p><p>*Throws: DecryptionException*</p><p>+ logout(userId: Integer): Boolean</p><p>*Invalidates user session and token*</p><p>+ logSecurityEvent(eventType: String, userId: Integer, details: String): void</p><p>*Logs security events for audit trail*</p><p>**Private Methods:**</p><p>- generateToken(userId: Integer, role: String): String</p><p>*Generates JWT token with user claims and expiration*</p><p>- checkPasswordStrength(password: String): Boolean</p><p>*Validates password meets security requirements*</p><p>- detectSuspiciousActivity(userId: Integer, ipAddress: String): Boolean</p><p>*Detects potential security threats based on login patterns*</p>|
### <a name="_toc213595878"></a>**2.11.3. Related Classes and Dependencies**
The SecurityManager is used throughout the application for security operations:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|AccountManager|Used by|Login, registration, password reset|
|All Manager Classes|Used by|Authorization checks|
|PasswordEncoder|Uses (Dependency)|Password hashing with bcrypt|
|EncryptionService|Uses (Dependency)|Data encryption with AES-256|
|TokenManager|Uses (Dependency)|JWT token generation and validation|
|SessionManager|Uses (Dependency)|Session lifecycle management|
|AuditLogger|Uses (Dependency)|Security event logging|
### <a name="_toc213595879"></a>**2.11.4. Design Decisions and Patterns**
**Bcrypt Password Hashing:**

Passwords are hashed using bcrypt with adaptive cost factor, making brute-force attacks computationally expensive. Each password gets a unique salt, preventing rainbow table attacks. Bcrypt's slow hashing speed is a security feature that thwarts high-speed password cracking attempts.

**JWT Token Authentication:**

JSON Web Tokens (JWT) provide stateless authentication, eliminating server-side session storage. Tokens contain user claims and are cryptographically signed to prevent tampering. Short expiration times (15 minutes) minimize risk if tokens are compromised.

**Role-Based Access Control (RBAC):**

The system implements RBAC with three roles: ADMIN (full system access), STAFF (operational access), and CUSTOMER (limited to own data). Permissions are checked at the business logic layer before any sensitive operation, preventing unauthorized access.

**Security Audit Logging:**

All authentication attempts, authorization failures, and sensitive operations are logged with timestamps, user IDs, and IP addresses. The detectSuspiciousActivity() method analyzes patterns to identify potential security threats like brute-force attacks or credential stuffing.
## <a name="_toc213595881"></a>**2.12. PetCareClient Component**
The PetCareClient component represents the presentation layer of the system, providing a web-based user interface for all users including Pet Owners, Managers, and Staff. It implements responsive design for cross-platform compatibility and handles all client-side interactions, form validations, and user feedback.
### <a name="_toc213595882"></a>**2.12.1. Purpose and Responsibilities**
The PetCareClient provides comprehensive user interface services:

- User interface rendering and navigation
- Form management and client-side validation
- Communication with PetCareWebService API
- State management and session handling
- User feedback and error messaging
- Responsive layout for desktop and mobile devices
### <a name="_toc213595883"></a>**2.12.2. Class Diagram**

|**PetCareClient**|
| :-: |
|**Attributes**|
|<p>- apiClient: APIClient</p><p>*HTTP client for communicating with PetCareWebService*</p><p>- stateManager: StateManager</p><p>*Manages application state and user session data*</p><p>- router: Router</p><p>*Handles navigation and routing between pages*</p><p>- validator: FormValidator</p><p>*Provides client-side form validation*</p><p>- notificationHandler: NotificationHandler</p><p>*Displays user notifications, alerts, and feedback messages*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ initialize(): void</p><p>*Initializes application, loads configuration, and sets up routes*</p><p>+ renderPage(pageName: String, data: Object): void</p><p>*Renders specified page with provided data*</p><p>+ navigateTo(route: String, params: Object): void</p><p>*Navigates to specified route with optional parameters*</p><p>+ submitForm(formId: String, formData: Object): Promise<Response></p><p>*Validates and submits form data to API endpoint*</p><p>+ showNotification(message: String, type: String): void</p><p>*Displays notification message (success, error, warning, info)*</p><p>+ validateForm(formId: String): ValidationResult</p><p>*Performs client-side validation on form inputs*</p><p>+ handleLogin(credentials: LoginDTO): Promise<void></p><p>*Authenticates user and stores session token*</p><p>+ handleLogout(): void</p><p>*Clears session and redirects to login page*</p><p>+ fetchData(endpoint: String, params: Object): Promise<Object></p><p>*Fetches data from API endpoint with query parameters*</p><p>+ updateUI(componentId: String, data: Object): void</p><p>*Updates specific UI component with new data*</p><p>**Private Methods:**</p><p>- setupEventListeners(): void</p><p>*Attaches event listeners to UI elements*</p><p>- handleAPIError(error: Error): void</p><p>*Handles API errors and displays user-friendly messages*</p><p>- sanitizeInput(input: String): String</p><p>*Sanitizes user input to prevent XSS attacks*</p>|
### <a name="_toc213595884"></a>**2.12.3. Related Classes and Dependencies**
The PetCareClient interacts with the following components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|PetCareWebService|Uses (Dependency)|Consumes REST API endpoints|
|APIClient|Uses (Dependency)|HTTP communication layer|
|StateManager|Uses (Dependency)|Manages application state|
|Router|Uses (Dependency)|Handles page navigation|
|FormValidator|Uses (Dependency)|Client-side validation|
### <a name="_toc213595885"></a>**2.12.4. Design Decisions and Patterns**
**Single Page Application (SPA) Architecture:**

The PetCareClient implements SPA architecture using client-side routing, eliminating full page reloads. This provides a seamless user experience with faster navigation and reduces server load. The Router component handles navigation without server requests, while the StateManager maintains application state across views.

**Model-View-Controller (MVC) Pattern:**

The client follows MVC pattern where forms represent Views, event handlers act as Controllers, and data fetched from API serves as Models. This separation of concerns makes the codebase maintainable and testable.

**Client-Side Validation:**

Form validation occurs on the client before API submission, providing immediate feedback to users. This improves user experience by catching errors early and reduces unnecessary API calls. Server-side validation still occurs as the authoritative check.
### <a name="_toc213595886"></a>**2.12.5. User Interface Forms (Boundary Classes)**
The PetCareClient provides the following user interface forms:

|**Form Name**|**User Role**|**Purpose**|
| :-: | :-: | :-: |
|LoginForm|All|User authentication with username and password|
|RegistrationForm|Pet Owner|New user account creation with personal details|
|BookingForm|Pet Owner|Appointment booking with service, date, time selection|
|PetProfileForm|Pet Owner|Pet information management (add/edit pet details)|
|MedicalRecordForm|Veterinarian|Medical record entry with diagnosis and treatment|
|ScheduleManagementForm|Manager/Staff|Staff schedule and availability management|
|PaymentForm|Receptionist|Payment processing and invoice generation|

**Note:** *The PetCareClient serves as the primary interface between users and the system. Its responsive design, intuitive forms, and seamless integration with PetCareWebService API ensure a positive user experience for pet owners, staff, and managers.*

## <a name="_toc213595887"></a>**2.13. PetCareWebService Component**
The PetCareWebService component represents the REST API layer that handles HTTP requests and responses between the PetCareClient and business logic managers. It implements endpoint security, request validation, response formatting, and serves as a facade providing a unified interface to the business logic layer.
### <a name="_toc213595888"></a>**2.13.1. Purpose and Responsibilities**
The PetCareWebService provides comprehensive API services:

- RESTful API endpoint management
- HTTP request routing to appropriate business logic managers
- Request validation and data transformation
- Authentication and authorization enforcement
- JSON response formatting and error handling
- CORS policy management and API versioning
### <a name="_toc213595889"></a>**2.13.2. Class Diagram**

|**PetCareWebService**|
| :-: |
|**Attributes**|
|<p>- accountController: AccountController</p><p>*Handles authentication and account management endpoints*</p><p>- appointmentController: AppointmentController</p><p>*Manages appointment booking and scheduling endpoints*</p><p>- petController: PetController</p><p>*Handles pet profile management endpoints*</p><p>- scheduleController: ScheduleController</p><p>*Manages staff schedule and availability endpoints*</p><p>- serviceController: ServiceController</p><p>*Manages service catalog endpoints*</p><p>- paymentController: PaymentController</p><p>*Manages payment processing and invoice endpoints*</p><p>- medicalRecordController: MedicalRecordController</p><p>*Handles medical record and vaccination endpoints*</p><p>- reportController: ReportController</p><p>*Manages report generation endpoints*</p><p>- authenticationMiddleware: AuthMiddleware</p><p>*Validates JWT tokens for protected endpoints*</p><p>- errorHandler: ErrorHandler</p><p>*Centralized error handling and response formatting*</p>|
|**Methods**|
|<p>**Public Methods:**</p><p>+ initialize(): void</p><p>*Initializes web service, registers routes, and starts server*</p><p>+ handleRequest(request: HttpRequest): HttpResponse</p><p>*Routes incoming HTTP request to appropriate controller*</p><p>+ validateRequest(request: HttpRequest): ValidationResult</p><p>*Validates request headers, parameters, and body*</p><p>+ formatResponse(data: Object, statusCode: Integer): HttpResponse</p><p>*Formats data into standard JSON response structure*</p><p>+ handleError(error: Exception): HttpResponse</p><p>*Handles exceptions and returns appropriate error response*</p><p>+ authenticateRequest(request: HttpRequest): AuthenticationResult</p><p>*Validates JWT token from Authorization header*</p><p>+ checkAuthorization(userId: Integer, resource: String, action: String): Boolean</p><p>*Verifies user has permission for requested action*</p><p>+ logRequest(request: HttpRequest, response: HttpResponse): void</p><p>*Logs API request and response for monitoring*</p><p>+ setCORSHeaders(response: HttpResponse): HttpResponse</p><p>*Sets CORS headers for cross-origin requests*</p><p>+ getAPIDocumentation(): APIDoc</p><p>*Returns OpenAPI/Swagger documentation*</p><p>**Private Methods:**</p><p>- routeToController(endpoint: String, method: String): Controller</p><p>*Determines appropriate controller for endpoint and HTTP method*</p><p>- parseRequestBody(request: HttpRequest): Object</p><p>*Parses JSON request body and validates format*</p><p>- sanitizeInput(data: Object): Object</p><p>*Sanitizes input data to prevent injection attacks*</p>|
###
<a name="_toc213595890"></a>
### **2.13.3. Related Classes and Dependencies**
The PetCareWebService coordinates with multiple components:

|**Component**|**Relationship**|**Purpose**|
| :-: | :-: | :-: |
|PetCareClient|Used by|Receives HTTP requests from client|
|AccountManager|Uses (Dependency)|User authentication and management|
|AppointmentManager|Uses (Dependency)|Appointment operations|
|PetManager|Uses (Dependency)|Pet profile operations|
|ScheduleManager|Uses (Dependency)|Staff schedule operations|
|ServiceManager|Uses (Dependency)|Service catalog operations|
|PaymentManager|Uses (Dependency)|Payment and invoice operations|
|MedicalRecordManager|Uses (Dependency)|Medical record operations|
|ReportManager|Uses (Dependency)|Report generation|
|SecurityManager|Uses (Dependency)|Token validation and authorization|
### <a name="_toc213595891"></a>**2.13.4. Design Decisions and Patterns**
**Facade Pattern:**

PetCareWebService acts as a facade to the complex business logic layer, providing a simplified, unified REST API interface. It shields clients from the complexity of multiple managers and their interactions, offering clean, resource-oriented endpoints.

**RESTful API Design:**

The API follows REST principles with resource-based URLs, standard HTTP methods (GET, POST, PUT, DELETE), and stateless communication. Each endpoint represents a resource (appointments, pets, payments) with predictable URL patterns and HTTP status codes.

**Middleware Chain Pattern:**

Requests pass through a chain of middleware (authentication, validation, logging, error handling) before reaching controllers. This modular approach allows adding/removing cross-cutting concerns without modifying controller logic.

**Centralized Error Handling:**

The ErrorHandler component provides consistent error responses across all endpoints. It translates business logic exceptions into appropriate HTTP status codes and user-friendly error messages, preventing sensitive information leakage.
### <a name="_toc213595892"></a>**2.13.5. API Endpoints (Controller Classes)**
The PetCareWebService exposes the following RESTful API endpoints:

|**Controller**|**Endpoint Examples**|**Purpose**|
| :-: | :-: | :-: |
|AccountController|POST /api/auth/login <br>POST /api/auth/register <br>POST /api/auth/logout|Authentication operations|
|AppointmentController|GET /api/appointments <br>POST /api/appointments <br>PUT /api/appointments/:id|Appointment management|
|PetController|GET /api/pets <br>POST /api/pets <br>PUT /api/pets/:id|Pet profile CRUD|
|ScheduleController|GET /api/schedules <br>POST /api/schedules <br>PUT /api/schedules/:id|Staff schedule management|
|ServiceController|GET /api/services <br>POST /api/services <br>PUT /api/services/:id|Service catalog management|
|PaymentController|GET /api/invoices/:id <br>POST /api/payments <br>GET /api/payments/history|Payment processing|
|MedicalRecordController|GET /api/medical-records <br>POST /api/medical-records <br>GET /api/vaccinations|Medical record access|
|ReportController|GET /api/reports/financial GET /api/reports/appointments GET /api/dashboard|Report generation|

**Note:** *The PetCareWebService serves as the critical middleware layer connecting the presentation layer to business logic. Its RESTful design, comprehensive security, and centralized error handling ensure reliable, scalable API services for the Pet Care Management System.*


