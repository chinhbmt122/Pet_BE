**Software Requirements Specification**

**PAW LOVERS Pet Care Service Management System**

Version 1.0

Prepared by: [Your Name/Team Name]

Organization: [Your University/Department]

Date Created: October 27, 2025
# **Revision History**

|**Name**|**Date**|**Changes**|
| :-: | :-: | :-: |
|[Your Name]|October 27, 2025|Initial document creation|
|[Your Name]|November 16, 2025|Added payment gateway integration scope and requirements|
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

- Pet and owner information management with basic medical records
- Online appointment booking system for pet owners
- Service management (bathing, spa, check-up, vaccination)
- Staff scheduling and task assignment
- Payment processing and invoice generation
- Online payment gateway integration (VNPay with free sandbox)
- Basic statistical reports for management

**Out of Scope:**

- Advanced accounting features (payroll, tax reporting)
- Comprehensive inventory management for medical supplies
- Automated waiting list management
- Deposit and penalty fee systems
- Violation tracking for customer behavior
- Kennel/boarding facility management
## **1.4 References**
- IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications
- PAW LOVERS Pet Care Service Management System - Project Description Document
# **2. Overall Description**
## **2.1 Product Perspective**
This is a standalone, greenfield software system developed specifically for PAW LOVERS Center. The system will replace existing manual processes including paper-based record keeping, spreadsheet tracking, and phone-based appointment scheduling. It is designed as a centralized web application accessible by all stakeholders through modern web browsers.
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

**Server Infrastructure:**

- Centralized deployment on cloud platform or on-premise server
- Database server for persistent data storage
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
|FR-009|Staff shall have search capability to quickly locate pet owner or pet records by name, phone, or ID with results returned within 2 seconds|Must|
|FR-010|The system shall store detailed pet information including: unique ID, name, species, breed, gender, age, weight, color, and initial health status|Must|
|FR-011|Each pet record shall maintain a basic medical history section for storing examination notes, diagnoses, and brief treatment summaries|Must|
|FR-012|Veterinarians shall be able to create new medical records and update existing records after each examination|Must|
## **3.3 Staff Schedule Management**
**Description:** Enables managers to create and maintain staff work schedules, while allowing staff and customers to view availability.

**Priority:** Must-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-013|Managers shall be able to create and update staff work schedules on a weekly or monthly basis|Must|
|FR-014|Staff (Veterinarians, Care Staff) shall be able to view their assigned work schedules|Must|
|FR-015|Pet owners shall be able to view staff availability when booking appointments|Must|
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
|FR-023a|Receptionists shall be able to update appointment status: Confirmed, Pending, Canceled|Must|
## **3.5 Service Execution and Care Activities**
**Description:** Supports daily operations by allowing staff to track and update service execution status and record service details.

**Priority:** Must-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-024|Veterinarians and Care Staff shall be able to view their assigned tasks and appointments for the day or week|Must|
|FR-025|Staff shall be able to update service execution status (Not Started, In Progress, Completed) during service delivery|Must|
|FR-026|Veterinarians shall be able to record brief diagnosis, treatment notes, and start/end times during examinations|Must|
|FR-027|Care Staff shall be able to record pet condition before and after service completion (short text description)|Must|
## **3.6 Payment and Invoicing**
**Description:** Handles payment processing and invoice generation after service completion, supporting cash, bank transfer, and online payment via VNPay gateway.

**Priority:** Must-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-028|The system shall automatically generate an invoice when a service is marked as Completed|Must|
|FR-029|Each invoice shall include: unique invoice number, issue date, service list with unit prices, and total amount|Must|
|FR-030|Receptionists shall be able to record payment confirmation using cash or bank transfer payment methods|Must|
|FR-031|Pet owners shall be able to view their service history and electronic invoices through their account|Must|
|FR-032|Pet owners shall be able to pay invoices online using VNPay payment gateway (credit/debit card, domestic ATM card, QR code)|Must|
|FR-033|The system shall redirect users to the payment gateway for secure payment processing and handle return callbacks|Must|
|FR-034|The system shall update invoice payment status automatically upon receiving payment confirmation from the gateway|Must|
|FR-035|The system shall handle payment failures gracefully and allow users to retry payment|Should|
|FR-036|The system shall store payment transaction details including transaction ID, payment method, and timestamp|Must|
## **3.7 Reports and Statistics**
**Description:** Provides management with basic statistical reports to support operational decision-making.

**Priority:** Should-have

**Functional Requirements:**

|**ID**|**Requirement Description**|**Priority**|
| :-: | :-: | :-: |
|FR-037|Managers shall be able to generate monthly service reports showing the number of each service type performed|Should|
|FR-038|Managers shall be able to generate monthly revenue reports showing total income by month and payment method breakdown|Should|
|FR-039|The system shall allow exporting all reports to PDF or CSV/Excel formats for further analysis|Should|
# **4. Data Requirements**
## **4.1 Logical Data Model**
The system manages the following primary data entities and their relationships:

**Core Entities:**

- **Pet Owner:** Customer information including contact details and account credentials
- **Pet:** Pet information including species, breed, age, health status
- **Staff:** Employee information including role, specialization, and work schedule
- **Service:** Available services with descriptions and pricing
- **Appointment:** Booking information linking owners, pets, services, and staff with status (Pending, Confirmed, Canceled)
- **Service Execution:** Tracks actual service delivery with status (Not Started, In Progress, Completed)
- **Medical Record:** Examination notes, diagnoses, and treatment history
- **Invoice:** Payment records with service details and transaction amounts

**Key Relationships:**

- One Pet Owner can own multiple Pets (1:N)
- One Pet belongs to one Pet Owner (N:1)
- One Pet can have multiple Medical Records and Appointments (1:N)
- One Appointment is for one Pet, one Service, and assigned to one Staff member (N:1)
- One Invoice is generated from one or more completed Services (1:N)

**Note:** A detailed Entity-Relationship Diagram (ERD) will be included in Section 9: Analysis Models.
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

**Design Principles:**

- **Layout:** Clean, structured interface with clear navigation suitable for 1024x768+ resolution
- **Consistency:** Uniform layout, colors, and components throughout the application
- **Language:** All interface elements in Vietnamese
- **Usability:** Intuitive design accessible to users with varying computer skill levels
- **Feedback:** Clear success/error messages after each significant action
## **5.2 Software Interfaces**
**Payment Gateway API:**

The system shall integrate with VNPay payment gateway:

- **VNPay API:** Vietnamese payment gateway supporting:
  - Domestic ATM cards (Napas)
  - International credit/debit cards (Visa, Mastercard, JCB)
  - QR code payments (VNPay QR)
  - Mobile banking

**Integration Requirements:**

- RESTful API communication using HTTPS
- IPN (Instant Payment Notification) endpoint to receive payment status callbacks
- Secure credential management (TMN Code, Hash Secret)
- Free sandbox environment for development and testing
- Production environment for live transactions
- HMAC SHA512 signature verification for security
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
# **7. Other Requirements**
**Legal Compliance:**

- System must comply with Vietnamese regulations on personal data protection and customer privacy

**Installation and Configuration:**

- System shall be designed for straightforward server installation with key configuration parameters (database connection, SMTP settings) adjustable through configuration files without code modification
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
# **9. Analysis Models**
This section will include visual models to clarify system requirements and design. These models will be developed during the design phase and stored separately or attached as appendices.

**Expected Models:**

- **Use Case Diagrams:** Illustrating interactions between actors and system functions
- **Entity-Relationship Diagram (ERD):** Showing database logical structure and relationships
- **Activity Diagrams:** Modeling complex business processes like appointment booking
- **Sequence Diagrams:** Showing object interactions and message flow for specific use cases
- **Class Diagrams:** Describing static system structure including classes, attributes, and relationships

*--- End of Document ---*
