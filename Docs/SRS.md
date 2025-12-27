**Software Requirements Specification**

**PAW LOVERS Pet Care Service Management System**

Version 2.0

Prepared by: SE100 Development Team

Organization: [Your University/Department]

Date Created: October 27, 2025  
Last Updated: December 27, 2025
# **Revision History**

|**Name**|**Date**|**Changes**|
| :-: | :-: | :-: |
|Development Team|October 27, 2025|Initial document creation|
|Development Team|November 16, 2025|Added payment gateway integration scope and requirements|
|Chinh|December 26, 2025|Updated scope to include Cage & Boarding, added vaccination due date logic, and refined schedule requirements|
|SE100 Team|December 27, 2025|Updated to reflect actual implementation: NestJS backend, Next.js frontend, 21-entity database schema, 50+ API endpoints, comprehensive testing suite|

---

# **Implementation Status**

This SRS document has been **fully implemented** and reflects the production-ready system deployed as of December 2025.

**Implemented Components:**

 **Backend:** NestJS 11 with TypeScript, 14 modules, 50+ endpoints  
 **Frontend:** Next.js 14 with React 18, 50+ components  
 **Database:** PostgreSQL 15 with 21 TypeORM entities  
 **Authentication:** JWT-based with role-based access control  
 **Payment Gateway:** VNPay integration with sandbox testing  
 **Testing:** Unit tests (Jest), integration tests, E2E test suite  
 **CI/CD:** GitHub Actions workflow with automated testing  
 **Documentation:** Comprehensive docs in `/docs` folder (see below)

**Comprehensive Documentation:**

For detailed technical documentation beyond this SRS, refer to:

- **[Project Index](../../docs/index.md)** - Master navigation for all documentation
- **[Project Overview](../../docs/project-overview.md)** - Executive summary with quick start
- **[Backend Architecture](../../docs/architecture-pet_be.md)** - NestJS architecture, DDD patterns, module structure
- **[Frontend Architecture](../../docs/architecture-do_an_thu_cung.md)** - Next.js architecture, component patterns
- **[API Contracts](../../docs/api-contracts-pet_be.md)** - Complete endpoint specifications (50+ endpoints)
- **[Data Models](../../docs/data-models-pet_be.md)** - All 21 entity specifications and relationships
- **[Component Inventory](../../docs/component-inventory-do_an_thu_cung.md)** - Frontend component catalog (50+ components)
- **[Development Guide](../../docs/development-guide.md)** - Setup, build, test instructions
- **[Deployment Guide](../../docs/deployment-guide.md)** - Production deployment procedures
- **[Technology Stack](../../docs/technology-stack.md)** - Complete tech stack analysis

---
# **1. Introduction**
## **1.1 Document Purpose**
This Software Requirements Specification (SRS) document provides a comprehensive description of the functional and non-functional requirements for the PAW LOVERS Pet Care Service Management System, version 1.0. This document serves as the contractual foundation for system design, development, testing, and project management.

**Intended Audience:**

- **Project Managers:** To plan resources, track milestones, and manage project scope
- **Developers:** To understand system requirements and implement features correctly
- **QA/Testers:** To create test cases and validate system functionality
- **Stakeholders:** Including PAW LOVERS Center management to ensure business needs are met
- **System Architects:** To design appropriate technical solutions
## **1.2 Document Conventions**
This document follows IEEE Standard 830-1998 for Software Requirements Specifications. The following conventions are used throughout:

- **Requirement IDs:** Formatted as FR-XXX for functional requirements and NFR-XXX for non-functional requirements
- **Priority Levels:** Must-have (critical), Should-have (important), Could-have (nice to have)
- **Technical Terms:** Defined in the Glossary section (Section 8)
## **1.3 Project Scope**
The PAW LOVERS Pet Care Service Management System is a web-based application designed to digitize and streamline core business operations at PAW LOVERS Center, a pet care facility providing veterinary examination, grooming, spa, and vaccination services.

**In Scope:**

- Pet and owner information management with comprehensive medical records
- Online appointment booking system with real-time availability
- Service management with categorization (bathing, spa, check-up, vaccination, boarding)
- Staff scheduling and task assignment (Veterinarians, Care Staff, Managers)
- Payment processing with multiple methods (Cash, Bank Transfer, VNPay)
- VNPay payment gateway integration with transaction tracking
- Business reporting and analytics (revenue, appointments, service utilization)
- Cage management and boarding facility tracking
- Medical record management with vaccination tracking
- Employee management with role-based access control
- RESTful API backend (NestJS) with 50+ endpoints
- Modern web frontend (Next.js) with responsive design
- Comprehensive testing suite (unit, integration, E2E)
- CI/CD pipeline with automated testing

**Out of Scope:**

- Advanced accounting features (payroll, tax reporting)
- Comprehensive inventory management for medical supplies
- Automated waiting list management
- Deposit and penalty fee systems
- Real-time notifications (WebSocket) - planned for future
- Mobile native applications - planned for future
## **1.4 References**
- IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications
- PAW LOVERS Pet Care Service Management System - Project Description Document
# **2. Overall Description**
## **2.1 Product Perspective**
This is a full-stack web application built with modern technologies for PAW LOVERS Center. The system architecture consists of:

**Backend:**
- Framework: NestJS 11.0.1 with TypeScript 5.7.3
- Database: PostgreSQL 15 with TypeORM 0.3.28
- Authentication: JWT-based with Passport.js
- Architecture: Domain-Driven Design (DDD) with domain/persistence separation
- API: RESTful with 50+ endpoints, Swagger/OpenAPI documentation
- Testing: Jest with unit, integration, and E2E test suites

**Frontend:**
- Framework: Next.js 14.0.0 with React 18.2.0
- Styling: Tailwind CSS 3.4.1
- API Client: Axios 1.13.2 with interceptors
- Components: 50+ React components (UI primitives, modals, forms)
- Routing: App Router with file-based routing

**Integration:**
- Communication: REST API over HTTPS with JSON payloads
- Payment Gateway: VNPay for online transactions
- Deployment: Docker containerization, GitHub Actions CI/CD

The system replaces manual processes including paper-based record keeping, spreadsheet tracking, and phone-based appointment scheduling.
## **2.2 User Classes and Characteristics**
The system supports five distinct user classes, each with specific needs and access privileges:

|**User Class**|**Primary Responsibilities**|**Technical Level**|
| :-: | :-: | :-: |
|**Center Manager**|System administration, service configuration, staff management, and strategic reporting|Medium-High|
|**Veterinarian**|Medical examinations, diagnosis recording, treatment documentation, and medical record updates|Basic-Medium|
|**Care Staff**|Non-medical services including bathing, spa, grooming, and service status updates|Basic|
|**Receptionist**|Customer service, in-person appointment booking, payment processing, and invoice printing|Basic-Medium|
|**Pet Owner**|Online appointment booking, pet information management, invoice viewing, and service tracking|Varies (Low-High)|
## **2.3 Operating Environment**
**Platform:** Web-based application accessible via modern web browsers

**Client Requirements:**

- Desktop computers with minimum 1024x768 screen resolution
- Modern web browsers: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- Stable internet connection (minimum 1 Mbps)
- JavaScript enabled

**Development:**
- Node.js 18.x or higher
- PostgreSQL 15 (Docker containerized)
- npm 9.x or higher

**Production:**
- Backend: Cloud platform (AWS EC2, Heroku, Railway) or self-hosted
- Frontend: Vercel (recommended), Netlify, or self-hosted
- Database: Managed PostgreSQL (AWS RDS, Heroku Postgres) or self-hosted
- Process Manager: PM2 (for self-hosted deployments)
- Reverse Proxy: Nginx (for self-hosted deployments)
- SSL/TLS: Let's Encrypt or cloud provider certificates
- Frontend: Vercel (recommended), Netlify, or self-hosted
- Database: Managed PostgreSQL (AWS RDS, Heroku Postgres) or self-hosted
- Process Manager: PM2 (for self-hosted deployments)
- Reverse Proxy: Nginx (for self-hosted deployments)
- SSL/TLS: Let's Encrypt or cloud provider certificates
## **2.4 Design and Implementation Constraints**
- **Language:** User interface must be entirely in Vietnamese
- **Security:** Compliance with Vietnamese regulations on personal data protection and medical record confidentiality
- **Password Security:** All passwords must be hashed using industry-standard algorithms (bcrypt or similar)
- **Usability:** Interface must be intuitive for users with varying computer literacy levels
## **2.5 Assumptions and Dependencies**
**Assumptions:**

- All staff members have basic computer literacy
- Center has reliable internet infrastructure
- Pet owners are willing to use online self-service features

**Dependencies:**

- System availability depends on hosting service reliability
- Online payment features depend on VNPay payment gateway API
- VNPay free sandbox environment available for development and testing
# **3. System Features**
This section defines the functional requirements organized by system features. Each feature includes a description, priority level, and detailed functional requirements.
## **3.1 Account Management and Authorization**
**Description:** Provides secure authentication and role-based access control for all system users. Manages user accounts, login sessions, and permissions.

**Priority:** Must-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-001|The system shall provide secure login functionality using email and password for all user classes|Must|
|FR-002|The system shall provide password reset functionality via registered email address|Should|
|FR-003|Pet owners shall be able to self-register new accounts through the system|Must|
|FR-004|Managers shall be able to create, view, update, and disable staff accounts (Veterinarians, Care Staff, Receptionists)|Must|
|FR-005|The system shall enforce Role-Based Access Control (RBAC) ensuring each role can only access their authorized functions and data|Must|
|FR-005a|All logged-in users shall be able to log out to securely end their session and clear authentication tokens|Must|
## **3.2 Pet and Owner Information Management**
**Description:** Maintains comprehensive database of pet owners and their pets, including basic medical history and health records.

**Priority:** Must-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-006|Pet owners shall be able to add one or more pets to their account with complete information|Must|
|FR-007|Pet owners shall be able to view and edit their personal information and pet details|Must|
|FR-008|Staff (Receptionists, Veterinarians) shall be able to create new owner and pet records for first-time customers|Must|
|FR-008a|Managers shall be able to delete pet and owner records from the system (soft delete to preserve historical data integrity)|Should|
|FR-009|Staff shall have search capability to quickly locate pet owner or pet records by name, phone, or ID |Must|
|FR-010|The system shall store detailed pet information including: unique ID, name, species, breed, gender, age, weight, color, and initial health status|Must|
|FR-011|Each pet record shall maintain a basic medical history section for storing examination notes, diagnoses, and brief treatment summaries|Must|
|FR-012|Veterinarians shall be able to create new medical records and update existing records after each examination|Must|
|FR-012a|The system shall automatically calculate the next vaccination due date based on the vaccine type's booster interval|Must|
## **3.3 Staff Schedule Management**
**Description:** Enables managers to create and maintain staff work schedules, while allowing staff and customers to view availability.

**Priority:** Must-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-013|Managers shall be able to create and update staff work schedules on a weekly or monthly basis, including start/end times and break periods|Must|
|FR-014|Staff (Veterinarians, Care Staff) shall be able to view their assigned work schedules|Must|
|FR-015|Pet owners shall be able to view staff availability when booking appointments, with the system automatically excluding break times|Must|
|FR-016|The system shall display schedules showing both available and booked time slots|Must|
## **3.4 Service and Appointment Management**
**Description:** Manages service catalog and appointment booking process for both online and in-person bookings.

**Priority:** Must-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-017|Managers shall be able to add new services, edit existing services, update prices, and temporarily suspend services|Must|
|FR-018|Pet owners shall be able to view the complete service catalog with descriptions and current pricing|Must|
|FR-019|Pet owners shall be able to book appointments online by selecting service, pet, date, and available time slot|Must|
|FR-020|Receptionists shall be able to create appointments on behalf of customers at the front desk|Must|
|FR-021|The system shall display real-time schedule availability showing open and booked time slots|Must|
|FR-022|Pet owners shall be able to cancel their appointments through the system|Should|
|FR-023|The system shall display detailed booking information including appointment confirmation details|Must|
|FR-023a|Receptionists shall be able to update appointment status: PENDING, CONFIRMED, CANCELLED|Must|
## **3.5 Service Execution and Care Activities**
**Description:** Supports daily operations by allowing staff to track and update service execution status and record service details.

**Priority:** Must-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-024|Veterinarians and Care Staff shall be able to view their assigned tasks and appointments for the day or week|Must|
|FR-025|Staff shall be able to update appointment status to IN_PROGRESS and COMPLETED during service delivery|Must|
|FR-026|Veterinarians shall be able to record brief diagnosis, treatment notes, and start/end times during examinations|Must|
|FR-027|Care Staff shall be able to record pet condition before and after service completion (short text description)|Must|
## **3.6 Payment and Invoicing**
**Description:** Handles payment processing and invoice generation after service completion, supporting cash, bank transfer, and online payment via VNPay gateway.

**Priority:** Must-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-028|The system shall automatically generate an invoice when an appointment is marked as COMPLETED|Must|
|FR-029|Each invoice shall include: unique invoice number, issue date, service list with unit prices, and total amount|Must|
|FR-030|Receptionists shall be able to record payment confirmation using cash or bank transfer payment methods|Must|
|FR-031|Pet owners shall be able to view their service history and electronic invoices through their account|Must|
|FR-032|Pet owners shall be able to pay invoices online using VNPay payment gateway|Must|
|FR-033|The system shall redirect users to the payment gateway for secure payment processing and handle return callbacks|Must|
|FR-034|The system shall update invoice status (PENDING, PROCESSING_ONLINE, PAID, FAILED) automatically upon receiving payment confirmation from the gateway|Must|
|FR-035|The system shall handle payment failures gracefully and allow users to retry payment|Should|
|FR-036|The system shall store payment transaction details including transaction ID, payment method, and timestamp|Must|
## **3.7 Reports and Statistics**
**Description:** Provides comprehensive analytical reports and dashboards for management decision-making, covering financial performance, service utilization, staff workload, and customer behavior.

**Priority:** Must-have (implemented)

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-037|Managers shall be able to generate comprehensive financial reports with revenue breakdowns by status, month, and payment method|Must|
|FR-038|Managers shall be able to view revenue analysis by period (monthly, quarterly, yearly) with trend data|Must|
|FR-039|Managers shall be able to generate appointment statistics showing total bookings, completion rates, and cancellation trends|Must|
|FR-040|Managers shall be able to view top N services ranked by booking count or revenue for specified periods|Must|
|FR-041|Managers shall be able to analyze service performance metrics including utilization rates and revenue per service|Must|
|FR-042|Managers shall be able to view employee workload reports showing task assignments and completion statistics|Must|
|FR-043|Managers shall be able to access customer retention metrics including repeat visit rates and customer lifetime value|Must|
|FR-044|Managers shall be able to view integrated dashboard with key performance indicators (KPIs) and summary metrics|Must|
|FR-045|The system shall support exporting reports to PDF, CSV, and Excel formats for offline analysis|Should|

**Implemented Report Endpoints (8 total):**
- **Financial Report:** Revenue, expenses, profit analysis with monthly breakdowns
- **Revenue by Period:** Month/quarter/year revenue trends
- **Appointment Statistics:** Booking counts, completion rates, status distribution
- **Top Services:** Ranking by popularity or revenue
- **Service Performance:** Utilization metrics, average revenue per service
- **Employee Workload:** Task distribution and productivity metrics
- **Customer Retention:** Repeat visit analysis, customer behavior patterns
- **Dashboard:** Real-time KPI overview with summary metrics
## **3.8 Cage and Boarding Management**
**Description:** Manages the availability and assignment of cages for pets requiring boarding or post-service recovery.

**Priority:** Should-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-046|Managers shall be able to define cage types (Small, Medium, Large) and manage the inventory of available cages|Must|
|FR-047|Staff shall be able to view real-time cage availability and status (Available, Occupied, Cleaning, Maintenance)|Must|
|FR-048|Receptionists shall be able to assign a pet to an available cage during boarding check-in|Must|
|FR-049|The system shall track boarding duration and automatically calculate boarding fees based on cage type and duration|Must|
|FR-050|Staff shall be able to update cage status to 'Cleaning' after a pet is checked out|Must|
# **4. Data Requirements**
## **4.1 Logical Data Model**
The system implements a **comprehensive relational database with 21 core entities** managed through TypeORM 0.3.28:

**Identity & Access Management (6 entities):**
- **Account:** User authentication and authorization (username, password hash, userType)
- **Employee:** Abstract base entity for all staff with Single Table Inheritance
- **Veterinarian:** Extends Employee with license number and expertise fields
- **CareStaff:** Extends Employee for non-medical service staff
- **Manager:** Extends Employee for administrative and management staff
- **Receptionist:** Extends Employee for front desk and customer service staff

**Pet Ownership (2 entities):**
- **PetOwner:** Customer profiles with contact details and one-to-one Account linkage
- **Pet:** Pet profiles with species, breed, date of birth, weight, color, health status

**Medical Services (3 entities):**
- **MedicalRecord:** Health examination records with diagnosis and treatment notes
- **VaccinationHistory:** Vaccine administration tracking with date and veterinarian
- **VaccineType:** Reference data for vaccine types with administration intervals

**Service Catalog & Appointments (3 entities):**
- **ServiceCategory:** Service classification (Bathing, Spa, Medical, Vaccination, Boarding)
- **Service:** Service catalog with descriptions, pricing, duration, and category linkage
- **Appointment:** Booking records with date, time, pet, customer, assigned employees, and status

**Workforce Management (1 entity):**
- **WorkSchedule:** Employee shift management with start/end times, break periods, and assigned employee

**Facility Management (2 entities):**
- **Cage:** Boarding facility inventory with type (Small, Medium, Large) and status (Available, Occupied, Cleaning, Maintenance)
- **CageAssignment:** Pet-to-cage assignments with check-in/out timestamps (replaces CageHistory)

**Financial Transactions (3 entities):**
- **Invoice:** Billing records with line items, totals, issue date, and status (PENDING, PROCESSING_ONLINE, PAID, FAILED)
- **Payment:** Transaction records with amount, payment method, transaction ID, and timestamp
- **PaymentGatewayArchive:** Archive of payment gateway transactions (VNPay callbacks and requests)

**System Audit (1 entity):**
- **AuditLog:** System activity tracking for compliance and debugging

**Database Architecture:**
- **ORM:** TypeORM with repository pattern
- **Inheritance:** Single Table Inheritance for Employee hierarchy (Veterinarian, CareStaff, Manager, Receptionist)
- **Pattern:** Domain-Driven Design with domain/persistence separation
- **Migrations:** Version-controlled schema migrations
- **Validation:** Class-validator decorators for data integrity

**Key Relationships:**
- One Account can link to one PetOwner OR one Employee (composition pattern)
- One PetOwner can own multiple Pets (1:N)
- One Pet has multiple MedicalRecords, VaccinationHistory, and Appointments (1:N)
- One Appointment links one Pet, one PetOwner, and multiple Employees (many-to-many via appointmentEmployees)
- One Appointment links one Service (N:1)
- One Invoice can include multiple Payments (partial payment support) (1:N)
- One Cage has many CageAssignments (audit trail) (1:N)

**Implementation Reference:** See `docs/data-models-pet_be.md` for detailed entity specifications, relationships, and TypeORM implementations.
## **4.2 Data Dictionary**
The following table defines key data fields used throughout the system:

|**Field Name**|**Data Type**|**Length**|**Description**|**Example**|
| :-: | :-: | :-: | :-: | :-: |
|pet\_id|String|10|Unique identifier for each pet|PET0000001|
|owner\_id|String|10|Unique identifier for pet owner|OWN0000001|
|staff\_id|String|10|Unique identifier for staff member|STF0000001|
|species|Enum|-|Pet species category|Dog, Cat, Rabbit|
|breed|String|50|Specific breed of pet|British Shorthair|
|email|String|100|Email address (validated format)|user@email.com|
|phone|String|10-11|Vietnamese mobile number|0901234567|
|health\_status|Text|500|Current pet health description|Healthy, active|
|medical\_record|Text|2000|Detailed medical examination notes|Diagnosis: Dermatitis...|
## **4.3 Reports**
Detailed report requirements are specified in Section 3.7 (Reports and Statistics). All reports shall be exportable to PDF and CSV/Excel formats.
## **4.4 Data Acquisition, Integrity, Retention, and Disposal**
**Data Integrity:**

- System shall validate all input data (email format, phone number format, required fields)
- Required fields must be completed before data submission

**Data Backup:**

- System data shall be backed up daily to enable disaster recovery

**Data Retention:**

- Pet medical records and invoice information must be retained for minimum 1 year

**Data Disposal:**

- Upon account deletion request, personal information shall be anonymized while medical records are retained for statistical purposes
# **5. External Interface Requirements**
## **5.1 User Interfaces**
**Platform:** Web-based application optimized for desktop browsers

**Frontend Technology Stack:**
- **Framework:** Next.js 14.0.0 with React 18.2.0 and App Router
- **Styling:** Tailwind CSS 3.4.1 with custom component library
- **State Management:** React hooks (useState, useContext) with Axios 1.13.2 API client
- **Component Count:** 47 React components organized into 7 functional modules

**Component Architecture (47 total components):**
- **UI Primitives (11 components):** Button, Input, Dialog, Table, Card, Badge, Select, Label, Tabs, Textarea, Avatar
- **Forms (3 components):** LoginForm, RegistrationForm, ResetPasswordForm
- **Modals (25 components):** 
  - Pet Management: AddPetModal, EditPetModal
  - Service Management: AddServiceModal, EditServiceModal, ServiceNoteModal
  - Staff Management: AddStaffModal, EditStaffModal
  - Appointment Management: BookAppointmentModal, AppointmentDetailModal, EditAppointmentModal, UpdateAppointmentModal, ConfirmAppointmentModal, CancelAppointmentModal, CancelAppointmentOwnerModal
  - Medical Records: VetRecordModal, VetRecordFormModal, VetRecordDetailModal, VetPatientDetailModal, VetScheduleDetailModal, CareNoteModal
  - Cage/Boarding: AddRoomModal, CageFormModal, CageDetailModal
  - Financial: InvoiceDetailModal, PaymentDetailModal
- **Data Tables (2 components):** ServiceTable, StaffTable (with sorting/pagination)
- **Dashboard Widgets (3 components):** StatsCard, QuickActions, RecentActivity
- **Charts (1 component):** RevenueChart
- **Layout (2 components):** Sidebar, DashboardHeader

**Key User Flows:**
- **Customer Journey:** Browse services → Book appointment → Track status → Make payment → View history
- **Staff Workflow:** View assigned schedule → Execute services → Update medical records → Process payments
- **Manager Operations:** Monitor operations dashboard → Generate reports → Manage resources → Review analytics

**Design Principles:**
- **Responsive Layout:** Optimized for 1024x768+ desktop resolution
- **Consistency:** Unified design system with reusable components
- **Language:** All interface elements in Vietnamese
- **Accessibility:** Intuitive navigation for users with varying technical skills
- **Feedback:** Real-time success/error messages with toast notifications

**Implementation Reference:** See `docs/component-inventory-do_an_thu_cung.md` for complete component catalog
## **5.2 Software Interfaces**
**Backend API Architecture:**
The system exposes **137 RESTful API endpoints** organized across 14 feature modules, plus 1 health check endpoint:

**Technology Stack:**
- **Framework:** NestJS 11.0.1 with TypeScript 5.7.3
- **API Documentation:** Swagger/OpenAPI available at `/api` endpoint
- **Authentication:** JWT Bearer tokens with 24-hour expiration (Passport.js)
- **Response Format:** JSON with standardized error handling and HTTP status codes
- **Validation:** class-validator with DTO (Data Transfer Object) pattern
- **Architecture:** Domain-Driven Design (DDD) with modular structure

**Module Breakdown (138 total endpoints):**

|**Module**|**Base Path**|**Endpoints**|**Key Operations**|
| :-: | :-: | :-: | :-: |
|Health Check|`/`|1|Application health status endpoint|
|Account|`/account`|8|Login, logout, get profile (me), get account by ID, full profile, change password, activate, deactivate|
|Employee|`/employee`|10|CRUD, filter by role (veterinarians, care-staff, by-role), available employees, update availability status|
|Pet Owner|`/pet-owner`|8|Register, search, get by account, update profile/preferences, view appointments, view invoices|
|Pet|`/pet`|14|CRUD, search, restore soft-deleted, by owner, by species, transfer ownership, medical history, appointments|
|Service Category|`/service-category`|6|CRUD, toggle active status, soft delete|
|Service|`/service`|12|CRUD, search, filter by category/price-range/boarding/staff-type, update availability, calculate price|
|Appointment|`/appointment`|13|CRUD, filter by date-range/status/pet/employee, status transitions (confirm, start, complete, cancel)|
|Schedule (WorkSchedule)|`/schedule`|12|CRUD, by employee/date, check availability, available employees, update break/unavailable/available|
|Medical Record & Vaccination|`/medical-record`|9|CRUD medical records, by pet, overdue follow-ups, CRUD vaccinations, upcoming/overdue vaccinations|
|Invoice|`/invoice`|12|CRUD, overdue, by status/number/appointment, mark paid/failed/processing|
|Payment|`/payment`|12|Generate invoices (legacy), get invoices, record payments, online payment initiation, VNPay callback, payment history, refund, receipt, verify|
|Cage|`/cage`|15|CRUD, available cages, maintenance status, reserve/cancel reservation, assign pet, checkout, view assignments (by cage/current/active)|
|Reports|`/reports`|8|Financial, revenue by period, appointments, top services, service performance, employee workload, customer retention, dashboard|

**Payment Gateway Integration:**

The system integrates with **VNPay** Vietnamese payment gateway:

**VNPay API Features:**
- Domestic ATM cards (Napas network)
- International credit/debit cards (Visa, Mastercard, JCB)
- QR code payments (VNPay QR)

**Integration Specifications:**
- **Protocol:** RESTful API over HTTPS
- **Authentication:** HMAC SHA512 signature verification with TMN Code and Hash Secret
- **Endpoints:**
  - `POST /payment/create-payment-url` - Generate VNPay payment URL with order info
  - `GET /payment/vnpay-callback` - Handle IPN (Instant Payment Notification) callbacks
  - `POST /payment/query-transaction` - Query transaction status for reconciliation
  - `POST /payment/refund` - Process refund requests
- **Environment:** Free sandbox for development/testing, production credentials for live
- **Security:** Credential management via environment variables, signature validation on all callbacks

**API Standards:**
- **Error Handling:** Consistent error format with message, statusCode, timestamp
- **Pagination:** Limit/offset-based with metadata (total, page, pageSize)
- **Filtering:** Query parameters for common filters (date range, status, role)
- **Sorting:** Multi-field sorting via query parameters

**Implementation Reference:** See `docs/api-contracts-pet_be.md` for complete endpoint specifications, request/response schemas, and authentication flows
## **5.3 Hardware Interfaces**
**Printing Support:**

- System shall support browser-based printing for invoices and reports
## **5.4 Communications Interfaces**
**Protocol:** All client-server communication shall use HTTPS protocol for secure data transmission

**Email:** System shall send password reset emails using SMTP protocol
# **6. Quality Attributes**
## **6.1 Usability**

|**ID**|**Requirement**|
| :-: | :-: |
|NFR-001|A new receptionist shall be able to proficiently book appointments and process payments within 30 minutes of training|
|NFR-002|Pet owners shall be able to complete their first online appointment booking in under 3 minutes|
|NFR-003|Error messages shall be clear and actionable, enabling users to correct input mistakes without support|
## **6.2 Performance**

|**ID**|**Requirement**|
| :-: | :-: |
|NFR-004|Search queries (pet records, medical history) shall return results within 2 seconds under normal load|
|NFR-005|Page load times for main application pages shall not exceed 3 seconds|
|NFR-006|System shall support at least 50 concurrent users without performance degradation|
## **6.3 Security**

|**ID**|**Requirement**|
| :-: | :-: |
|NFR-007|All user passwords shall be hashed using bcrypt or equivalent industry-standard algorithm before database storage|
|NFR-008|System shall enforce Role-Based Access Control (RBAC) ensuring users can only access authorized functions and data|
|NFR-009|All communication between client and server shall use HTTPS protocol with TLS 1.2 or higher|
|NFR-012|Payment gateway API credentials shall be stored securely using environment variables or secure configuration management|
|NFR-013|All payment transactions shall include signature verification to prevent tampering|
|NFR-014|Payment webhook endpoints shall validate request authenticity before processing callbacks|
## **6.4 Reliability**

|**ID**|**Requirement**|
| :-: | :-: |
|NFR-010|System shall maintain 99% uptime during business hours (8:00 AM - 9:00 PM daily)|
|NFR-011|Backup mechanism shall enable data recovery to most recent state within 24 hours of system failure|

## **6.5 Testability**

|**ID**|**Requirement**|
| :-: | :-: |
|NFR-015|System shall include automated unit tests for business logic modules with minimum 70% code coverage|
|NFR-016|System shall include integration tests for API endpoints validating request/response contracts|
|NFR-017|System shall include E2E tests for critical user flows (booking, payment, medical record management)|
# **7. Other Requirements**
**Legal Compliance:**

- System complies with Vietnamese regulations on personal data protection and customer privacy

**Installation and Configuration:**

- System is containerized with Docker for straightforward deployment
- Configuration managed via environment variables (.env files)
- Database migrations automated via TypeORM CLI
- Comprehensive setup documentation in `docs/development-guide.md`

**Deployment Options:**

- **Development:** Local Docker Compose setup with hot reload
- **Staging:** Cloud platforms (Heroku, Railway) with automated CI/CD
- **Production:** Enterprise deployment on AWS/Azure or self-hosted with Nginx reverse proxy

**Testing Infrastructure:**

- **Unit Tests:** Jest framework with 70%+ code coverage target
- **Integration Tests:** Supertest for API endpoint validation
- **E2E Tests:** Isolated test database with docker-compose.e2e.yml
- **CI/CD:** GitHub Actions workflow with automated test execution on pull requests
# **8. Glossary**

|**Term**|**Definition**|
| :-: | :-: |
|**HTTPS**|Hypertext Transfer Protocol Secure - Secure protocol for encrypted data transmission between client and server|
|**IPN**|Instant Payment Notification - Callback mechanism used by VNPay to notify transaction status|
|**Medical Record**|Detailed documentation of pet examination history, diagnoses, treatments, and vaccinations|
|**Payment Gateway**|Third-party service that processes online payments securely|
|**RBAC**|Role-Based Access Control - Authorization mechanism restricting system access based on user roles|
|**SRS**|Software Requirements Specification - Document describing detailed functional and non-functional requirements|
|**SMTP**|Simple Mail Transfer Protocol - Standard protocol for sending email messages|
|**TLS**|Transport Layer Security - Cryptographic protocol providing secure communications over networks|
|**VNPay**|Leading Vietnamese payment gateway supporting domestic ATM cards, credit/debit cards, QR payments, and mobile banking with free sandbox environment|
|**TypeORM**|Object-Relational Mapping library for TypeScript/JavaScript enabling database operations through entity classes|
|**NestJS**|Progressive Node.js framework for building efficient, scalable server-side applications with TypeScript|
|**JWT**|JSON Web Token - Compact, URL-safe means of representing claims for authentication|
|**DTO**|Data Transfer Object - Design pattern for data validation and transformation between layers|
|**DDD**|Domain-Driven Design - Software design approach focusing on modeling business domain logic|
# **9. Analysis Models**
This section references visual models that clarify system requirements and design. These models have been developed and are maintained in the `/docs` repository folder.

**Implemented Models:**

**Use Case Diagrams:** Located in `docs/usecase-diagrams/` - Illustrate interactions between actors (Customer, Staff, Manager) and system functions

**Entity-Relationship Diagram (ERD):** Located in `docs/diagrams/erd-paw-lovers.excalidraw` - Shows complete database structure with 21 entities and relationships

**Class Diagrams:** Located in `docs/class-diagrams/`
- `1.2-conceptual-model.puml` - High-level domain concepts
- `1.3-analysis-class-diagram.puml` - Detailed class structure with attributes and methods

**Sequence Diagrams:** Located in `docs/sequence-diagrams/`
- `3.1-book-appointment.puml` - Appointment booking flow
- `3.2-record-payment.puml` - Payment processing sequence
- `3.3-update-appointment-status.puml` - Status update workflow
- `3.4-pay-invoice-online.puml` - VNPay online payment flow
- `3.5-logout.puml` - Session termination
- `3.6-search-records.puml` - Record search operations

**State Diagrams:** Located in `docs/state-diagrams/` - Model state transitions for appointments, payments, cages

**Comprehensive Documentation:**

For complete technical documentation and architecture details, refer to:
- **[Backend Architecture](../../docs/architecture-pet_be.md)** - Full system architecture with DDD patterns
- **[Data Models](../../docs/data-models-pet_be.md)** - All 21 entity specifications
- **[API Contracts](../../docs/api-contracts-pet_be.md)** - Complete endpoint documentation

*--- End of Document ---*
