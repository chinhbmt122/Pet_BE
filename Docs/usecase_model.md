# 

**UNIVERSITY OF INFORMATION TECHNOLOGY**  
**FACULTY OF SOFTWARE ENGINEERING**

# **Object-Oriented Software Development Project**

# 

# 

# 

# **Usecase Model Pet Care Service Management System** 

Version 1.0

# 

Students:  
23520406 – Đặng Ngọc Trường Giang  
23520444 – Đặng Trần Anh Hào  
23520187 \- Lê Hùng Chính  
23520421 \- Trần Đức Hải

**Document Change Log**

| Date | Version | Description | Author |
| ----- | ----- | ----- | ----- |
| 7/10/2025 | 1.0 | Initial version | Group 9 |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

# 

# **Table of Contents**

1\. Use-case Diagrams	3

2\. List of Actor	3

[3\. List of Use-cases](#heading=h.un22oeefnlsu)	3

4\. [Use-case Specification](#heading=h.q3bzobqn6ci1)	3

[4.1	Use-case Specification  “Name Use-case”](https://docs.google.com/document/d/18FFFh7ArbpML1M2XKUiQsY5bH7SEWhJJ/edit#heading=h.y5nmbogmbxim)	3

# **1\. Use-case Diagram**

This section presents the visual UML Use-Case diagrams for the PAW LOVERS system. The diagrams are organized into two levels of detail: a high-level Level 0 diagram to show the overall system context, and a series of detailed Level 1 diagrams, one for each major feature.  
**1.1 Level 0: System Context Diagram**  
**![][image1]**

**Description:** The Level 0 diagram provides the highest-level view of the system. It shows the entire **PAW LOVERS Pet Care Service Management System** as a single entity. The purpose is to define the system's boundary and identify all the external actors who interact with it.

* **System:** PAW LOVERS Pet Care Service Management System.  
* **Actors:** All five actors are shown outside the system boundary, interacting with the system as a whole:   
  * Manager  
  * Pet Owner  
  * Veterinarian  
  * Care Staff  
  * Receptionist

**1.2 Level 1: Feature-Level Diagrams**  
These diagrams break down the system into its core features, as defined in the SRS. Each diagram models the specific use cases and actor interactions for one feature.  
**1.2.1 Feature: Account Management and Authorization**  
![A diagram of a pet care service systemAI-generated content may be incorrect.][image2]  
**Description:** This diagram models how users gain access to the system.

* **Actors:** Manager, Pet Owner, Veterinarian, Care Staff, Receptionist.  
* **Use Cases:** Register Account, Manage Staff Account, Log In, Reset Password.  
* **Interactions:**   
  * Pet Owner is associated with Register Account.  
  * Manager is associated with Manage Staff Account.  
  * All actors are associated with Log In.  
  * Reset Password has an \<\<extend\>\> relationship with Log In.

**1.2.2 Feature: Pet and Owner Record Management**  
![A diagram of a petAI-generated content may be incorrect.][image3]  
**Description:** This diagram illustrates how pet and owner information is managed.

* **Actors:** Pet Owner, Receptionist, Veterinarian.  
* **Use Cases:** Manage Pet & Owner Records, Manage Medical Notes.  
* **Interactions:**   
  * All three actors are associated with Manage Pet & Owner Records.  
  * Veterinarian is associated with Manage Medical Notes.  
  * Manage Medical Notes has an \<\<include\>\> relationship with Manage Pet & Owner Records, as a record must be accessed before notes can be managed.

**1.2.3 Feature: Staff Schedule Management**  
![A diagram of a petAI-generated content may be incorrect.][image3]  
**Description:** This diagram shows how staff schedules are created and viewed.

* **Actors:** Manager, Veterinarian, Care Staff, Pet Owner.  
* **Use Cases:** Manage Work Schedules, View Own Schedule, View Staff Availability.  
* **Interactions:**   
  * Manager is associated with Manage Work Schedules.  
  * Veterinarian and Care Staff are associated with View Own Schedule.  
  * Pet Owner is associated with View Staff Availability.

**1.2.4 Feature: Service and Appointment Management**  
![A diagram of a serviceAI-generated content may be incorrect.][image4]  
**Description:** This diagram models the entire appointment booking and service definition process.

* **Actors:** Manager, Pet Owner, Receptionist.  
* **Use Cases:** Manage Services, View Service List, Book Appointment Online, Create Appointment at Counter, Cancel Appointment.  
* **Interactions:**   
  * Manager is associated with Manage Services.  
  * Pet Owner is associated with View Service List, Book Appointment Online, and Cancel Appointment.  
  * Receptionist is associated with Create Appointment at Counter.  
  * Book Appointment Online \<\<include\>\>s View Service List and View Staff Availability.  
  * Create Appointment at Counter also \<\<include\>\>s the booking and record management flows.

**1.2.5 Feature: Care Activities Management**  
![A diagram of a pet care serviceAI-generated content may be incorrect.][image5]  
**Description:** This diagram shows how staff execute and track their daily tasks.

* **Actors:** Veterinarian, Care Staff.  
* **Use Cases:** View Assigned Tasks, Update Service Status, Record Examination Details, Update Pet Status.  
* **Interactions:**   
  * Both actors are associated with View Assigned Tasks.  
  * Record Examination Details (by Veterinarian) and Update Pet Status (by Care Staff) are specializations of the general Update Service Status use case, shown with a generalization relationship.

**1.2.6 Feature: Payment and Invoicing Management**  
![A diagram of a paymentAI-generated content may be incorrect.][image6]  
**Description:** This diagram models the payment and billing process.

* **Actors:** Receptionist, Pet Owner.  
* **Use Cases:** Record Payment, View Invoice.  
* **Interactions:**   
  * Receptionist is associated with Record Payment.  
  * Pet Owner is associated with View Invoice.

**1.2.7 Feature: Reports and Statistics**  
![A diagram of a pet care serviceAI-generated content may be incorrect.][image7]  
**Description:** This diagram shows how business reports are generated.

* **Actors:** Manager.  
* **Use Cases:** Generate Reports.  
* **Interactions:**   
  * Manager is associated with Generate Reports.  
  * An implied "Export Report" function can be modeled as an \<\<extend\>\> relationship from the main reporting use case.

# **2\. List of Actors**

| STT | Actor Name | Meaning/Notes |
| :---: | ----- | ----- |
| 1 | Manager | Responsible for overall system management, including staff, services, schedules, and reports. |
| 2 | Pet Owner | A customer of the pet care center who uses the online portal to manage their pets and appointments. |
| 3 | Veterinarian | A professional staff member responsible for medical examinations and updating pet medical records. |
| 4 | Care Staff | A staff member responsible for non-medical services like grooming and spa treatments. |
| 5 | Receptionist | A staff member who manages the front desk, including appointments and payments. |

#  

# 

# **3\. List of Use-cases**

| STT | Use-case name | Meaning/Notes |
| :---- | :---- | :---- |
| **System Setup & Configuration** |  |  |
| 1 | Manage Staff Account | (Manager) Creates and manages staff accounts. |
| 2 | Register Account | (Pet Owner) Creates a customer account. |
| 3 | Manage Services | (Manager) Defines the services offered by the center. |
| 4 | Manage Work Schedules | (Manager) Creates and updates staff work schedules. |
| **Access & Daily Use** |  |  |
| 5 | Log In | (All Actors) Authenticate to access the system. |
| 6 | Log Out | (All Actors) End the current session and exit the system. |
| 7 | Reset Password | (All Actors) Recover a forgotten password. |
| 8 | View Own Schedule | (Staff) Staff check their assigned work shifts. |
| 9 | Search Pet & Owner Records | (All Actors) Search for pet or owner by name, phone, or ID. |
| 10 | Manage Pet & Owner Records | (All Actors) Create, search for, and update pet/owner info. |
| 11 | Manage Medical Notes | (Veterinarian) Add or update a pet's medical history. |
| 12 | View Service List | (Pet Owner) Browse available services and prices. |
| 13 | View Staff Availability | (Pet Owner) Check available times for booking. |
| 14 | Book Appointment Online | (Pet Owner) Self-service appointment booking. |
| 15 | Create Appointment at Counter | (Receptionist) Books an appointment for a customer. |
| 16 | Cancel Appointment | (Pet Owner) Cancels a previously booked appointment. |
| **Service Execution** |  |  |
| 17 | View Assigned Tasks | (Staff) See the list of tasks for the day. |
| 18 | Update Service Status | (Staff) General action to update a task's progress. |
| 19 | Record Examination Details | (Veterinarian) A specific status update for medical services. |
| 20 | Update Pet Status | (Care Staff) A specific status update for non-medical services. |
| **Post-Service & Reporting** |  |  |
| 21 | Record Payment | (Receptionist) Marks an invoice as paid. |
| 22 | View Invoice | (Pet Owner) Views their billing history. |
| 23 | Generate Reports | (Manager) Generates business performance reports. |
| 24 | Update Appointment Status | (Receptionist) Updates appointment status to Confirmed, Pending, or Canceled. |
| 25 | Pay Invoice Online | (Pet Owner) Pays invoice via VNPay payment gateway. |

# 

# **4\. Use-case Specification**

**4.1 Use-case Specification “Manage Staff Account”**

| Use Case ID: | UC-01 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Manage Staff Account |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Manager |
| ----: | :---- |
| Description: | Allows the Manager to create, view, update, and disable accounts for staff members (Veterinarians, Care Staff, Receptionists). |
| Preconditions: | The Manager must be logged into the system. |
| Postconditions: | A staff account is created, modified, or disabled in the system. |
| Priority: | Must-have |
| Frequency of Use: | Low |
| Normal Course of Events: | 1\. The Manager navigates to the "Staff Management" section.  2\. The system displays a list of existing staff accounts.  3\. The Manager selects "Create New Staff Account".  4\. The system presents a form for staff details. 5\. The Manager fills in the details and submits.  6\. The system creates the account and confirms success. |
| Alternative Courses: | \- **A1:** The Manager selects an existing staff member to update their details.  \- **A2:** The Manager selects an existing staff member to disable their account. |
| Exceptions: | \- **E1:** If the email for a new account already exists, the system displays an error. |
| Includes: | None |
| Extends | None |
| Special Requirements: | Manager must assign a specific role to each staff account. |
| Assumptions: | The Manager has the necessary personal information for the staff member. |
| Notes and Issues: | None |

**4.2 Use-case Specification “Register Account”**

| Use Case ID: | UC-02 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Register Account |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Pet Owner |
| ----: | :---- |
| Description: | Allows a new Pet Owner to create a personal account on the system. |
| Preconditions: | The actor must not be logged in and must not already have an account. |
| Postconditions: | A new Pet Owner account is created. The Pet Owner is automatically logged in. |
| Priority: | Must-have |
| Frequency of Use: | Low (once per customer) |
| Normal Course of Events: | 1\. The Pet Owner selects the "Register" option.  2\. The system presents a registration form.  3\. The Pet Owner fills out the form and submits it.  4\. The system validates the information and creates the account.  5\. The system logs the user in and redirects them to their dashboard. |
| Alternative Courses: | None |
| Exceptions: | \- **E1:** If the email address already exists, an error message is displayed.  \- **E2:** If the password fields do not match, an error message is displayed. |
| Includes: | None |
| Extends | None |
| Special Requirements: | The system must validate the email format. Passwords must meet complexity requirements. |
| Assumptions: | Pet owners are willing to use the online portal. |
| Notes and Issues: | None |

4.3 Use-case Specification “Manage Services”

| Use Case ID: | UC-03 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Manage Services |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Manager |
| ----: | :---- |
| Description: | Allows the Manager to add, edit, update prices, and suspend services. |
| Preconditions: | The Manager is logged in. |
| Postconditions: | The list of services available for booking is updated. |
| Priority: | Must-have |
| Frequency of Use: | Low |
| Normal Course of Events: | 1\. The Manager navigates to the "Service Management" section.  2\. The Manager selects "Add New Service".  3\. The system displays a form for service details.  4\. The Manager fills in the details and saves the new service.  5\. The system confirms the service has been added. |
| Alternative Courses: | \- **A1:** The Manager edits an existing service.  \- **A2:** The Manager suspends an existing service. |
| Exceptions: | None |
| Includes: | None |
| Extends | None |
| Special Requirements: | Price changes should not affect already booked appointments. |
| Assumptions: | None |
| Notes and Issues: | None |

4.4 Use-case Specification “Manage Work Schedules”

| Use Case ID: | UC-04 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Manage Work Schedules |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Manager |
| ----: | :---- |
| Description: | Allows the Manager to create and update staff work schedules (shifts) on a weekly or monthly basis. |
| Preconditions: | The Manager is logged in. Staff accounts have been created. |
| Postconditions: | The staff work schedule is updated in the system, affecting staff availability for appointments. |
| Priority: | Must-have |
| Frequency of Use: | Medium (e.g., weekly) |
| Normal Course of Events: | 1\. The Manager navigates to the "Schedule Management" section. 2\. The Manager selects a staff member and a date range.  3\. The Manager defines the working shifts (e.g., 9 AM \- 5 PM) for the selected period.  4\. The Manager saves the schedule.  5\. The system confirms the update. |
| Alternative Courses: | \- **A1:** The Manager modifies an existing schedule to handle changes or time off. |
| Exceptions: | None |
| Includes: | None |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | All center staff have been added to the system. |
| Notes and Issues: | None |

4.5 Use-case Specification “Log In”

| Use Case ID: | UC-05 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Log In |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Manager, Veterinarian, Care Staff, Receptionist, Pet Owner |
| ----: | :---- |
| Description: | Allows an actor to securely authenticate and gain access to the system's functions based on their role. |
| Preconditions: | The actor must have a pre-existing account in the system. |
| Postconditions: | The actor is successfully authenticated and is redirected to their role-specific dashboard. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The actor navigates to the login page.  2\. The actor enters their username (email) and password.  3\. The actor submits the credentials.  4\. The system validates the credentials.  5\. The system grants access and establishes a session. |
| Alternative Courses: | None |
| Exceptions: | \- **E1:** If credentials are invalid, the system displays an error message. |
| Includes: | None |
| Extends | None |
| Special Requirements: | All communication must be over HTTPS. |
| Assumptions: | The user remembers their credentials. |
| Notes and Issues: | None |

4.6 Use-case Specification “Reset Password”

| Use Case ID: | UC-06 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Reset Password |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Manager, Veterinarian, Care Staff, Receptionist, Pet Owner |
| ----: | :---- |
| Description: | Allows any user who has forgotten their password to reset it securely via their registered email address. |
| Preconditions: | The user is unable to log in. |
| Postconditions: | The user's account password is updated. |
| Priority: | Should-have |
| Frequency of Use: | Low |
| Normal Course of Events: | 1\. The user clicks the "Forgot Password" link.  2\. The system prompts for the user's registered email address.  3\. The user submits their email.  4\. The system sends a password reset link to that address.  5\. The user clicks the link and is taken to a secure page to enter a new password. 6\. The user submits the new password, and the system confirms the update. |
| Alternative Courses: | None |
| Exceptions: | \- **E1:** If the email does not exist, a generic message is displayed. |
| Includes: | None |
| Extends | "Log In" (UC-05) |
| Special Requirements: | The password reset link must be single-use and expire after a short period. |
| Assumptions: | The user has access to their registered email account. |
| Notes and Issues: | None |

4.7 Use-case Specification "Log Out"

| Use Case ID: | UC-24 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Log Out |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 11/16/2025 | Date Last Updated: | 11/16/2025 |

| Actor: | Manager, Veterinarian, Care Staff, Receptionist, Pet Owner |
| ----: | :---- |
| Description: | Allows any logged-in user to securely end their session and exit the system. |
| Preconditions: | The user is currently logged in with an active session. |
| Postconditions: | The user's session is terminated. The user is redirected to the login page or public homepage. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The user clicks the "Log Out" button or menu option.  2\. The system terminates the user's session.  3\. The system clears any session data and authentication tokens.  4\. The system redirects the user to the login page or public homepage.  5\. The system displays a confirmation message (optional). |
| Alternative Courses: | None |
| Exceptions: | \- **E1:** If the session has already expired, the system redirects the user to the login page without additional action. |
| Includes: | None |
| Extends | None |
| Special Requirements: | Session data must be properly cleared to prevent unauthorized access. All authentication tokens must be invalidated. |
| Assumptions: | The user has an active internet connection. |
| Notes and Issues: | This is a security-critical feature to prevent unauthorized access to user accounts. |

4.8 Use-case Specification "View Own Schedule"

| Use Case ID: | UC-07 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | View Own Schedule |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Veterinarian, Care Staff |
| ----: | :---- |
| Description: | Allows staff members to view their assigned work schedules, including shifts and appointments. |
| Preconditions: | The actor is logged in as a staff member. A schedule has been created by the Manager. |
| Postconditions: | The staff member is aware of their upcoming work commitments. |
| Priority: | Must-have |
| Frequency of Use: | High (e.g., daily) |
| Normal Course of Events: | 1\. The staff member logs into the system.  2\. The staff member navigates to the "My Schedule" section.  3\. The system displays their assigned shifts and appointments. |
| Alternative Courses: | \- **A1:** The user can navigate to different dates to view past or future schedules. |
| Exceptions: | None |
| Includes: | None |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | The Manager keeps the schedule up-to-date. |
| Notes and Issues: | None |

4.8 Use-case Specification “Manage Pet & Owner Records”

| Use Case ID: | UC-08 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Manage Pet & Owner Records |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Receptionist, Veterinarian, Pet Owner |
| ----: | :---- |
| Description: | Allows actors to create, search for, and update information about pets and their owners. |
| Preconditions: | The actor is logged in. |
| Postconditions: | The pet and owner database is updated. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The actor searches for a pet or owner record.  2\. The system displays the matching record.  3\. The actor selects the record and chooses to edit the information. 4\. The actor modifies fields and saves the changes.  5\. The system confirms the update. |
| Alternative Courses: | \- **A1 (Staff):** If no record is found, the staff member can create a new record.  \- **A2 (Pet Owner):** A Pet Owner can add a new pet to their own account.  \- **A3 (Manager):** The Manager can delete a pet or owner record (soft delete). |
| Exceptions: | \- **E1:** If the search returns no results, the system informs the user.  \- **E2:** If a Manager attempts to delete a record with active appointments, the system displays a warning and requires confirmation. |
| Includes: | None |
| Extends | None |
| Special Requirements: | The system must store detailed pet information (ID, name, species, etc.). |
| Assumptions: | The information provided is accurate. |
| Notes and Issues: | None |

4.9 Use-case Specification "Search Pet & Owner Records"

| Use Case ID: | UC-25 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Search Pet & Owner Records |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 11/16/2025 | Date Last Updated: | 11/16/2025 |

| Actor: | Receptionist, Veterinarian, Pet Owner |
| ----: | :---- |
| Description: | Allows actors to search for pet or owner records using various search criteria (name, phone number, or ID). |
| Preconditions: | The actor is logged in. |
| Postconditions: | Matching records are displayed. The actor can select a record for viewing or editing. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The actor navigates to the search function.  2\. The actor enters search criteria (pet name, owner name, phone number, pet ID, or owner ID).  3\. The actor submits the search query.  4\. The system searches the database and displays matching results.  5\. The actor can select a record from the results to view or edit. |
| Alternative Courses: | \- **A1:** The actor can use advanced search filters (e.g., species, breed, registration date).  \- **A2:** The actor can sort or filter the search results. |
| Exceptions: | \- **E1:** If no records match the search criteria, the system displays a "No results found" message.  \- **E2:** If the search query is invalid or empty, the system prompts the user to enter valid criteria. |
| Includes: | None |
| Extends | None |
| Special Requirements: | Search results should be returned within 2 seconds (NFR-004). The search function should support partial matches (e.g., searching "John" finds "Johnson"). |
| Assumptions: | The database contains existing pet and owner records. |
| Notes and Issues: | This use case is typically performed before managing or updating records. |

4.10 Use-case Specification "Manage Medical Notes"

| Use Case ID: | UC-09 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Manage Medical Notes |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Veterinarian |
| ----: | :---- |
| Description: | Allows a Veterinarian to add or update medical notes in a pet's record after an examination. |
| Preconditions: | The Veterinarian is logged in. The pet's record has been located. |
| Postconditions: | The pet's medical history is updated. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The Veterinarian searches for and opens a pet's record. 2\. The Veterinarian navigates to the "Medical Notes" section.  3\. The Veterinarian selects "Add New Note". 4\. The system provides a field to enter the diagnosis and treatment notes.  5\. The Veterinarian enters the information and saves the note.  6\. The system adds the note to the pet's history with a timestamp. |
| Alternative Courses: | \- **A1:** The Veterinarian can edit a recent note to make corrections. |
| Exceptions: | None |
| Includes: | "Manage Pet & Owner Records" (UC-08) |
| Extends | None |
| Special Requirements: | Notes should be timestamped and linked to the Veterinarian who wrote them. |
| Assumptions: | The examination has already taken place. |
| Notes and Issues: | None |

4.10 Use-case Specification “View Service List”

| Use Case ID: | UC-10 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | View Service List |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Pet Owner |
| ----: | :---- |
| Description: | Allows Pet Owners to view the list of available services with detailed descriptions and pricing. |
| Preconditions: | The actor is on the center's online portal. |
| Postconditions: | The Pet Owner is informed about the services and prices offered. |
| Priority: | Must-have |
| Frequency of Use: | Medium |
| Normal Course of Events: | 1\. The Pet Owner navigates to the "Services" section.2\. The system displays a list of all active services, showing their name, description, and price. |
| Alternative Courses: | None |
| Exceptions: | None |
| Includes: | None |
| Extends | None |
| Special Requirements: | The service list must be up-to-date. |
| Assumptions: | The Manager has already set up the services. |
| Notes and Issues: | None |

4.11 Use-case Specification “View Staff Availability”

| Use Case ID: | UC-11 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | View Staff Availability |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Pet Owner |
| ----: | :---- |
| Description: | Allows a Pet Owner to view the available time slots for staff when booking an appointment. |
| Preconditions: | The Pet Owner is in the process of booking an appointment. |
| Postconditions: | The Pet Owner is aware of the available dates and times for a service. |
| Priority: | Must-have |
| Frequency of Use: | Medium |
| Normal Course of Events: | 1\. During appointment booking, the system displays a calendar.2\. The Pet Owner selects a date.3\. The system shows the work schedule for the relevant staff, highlighting available time slots. |
| Alternative Courses: | None |
| Exceptions: | \- **E1:** If no staff are available, the system displays a message. |
| Includes: | None |
| Extends | None |
| Special Requirements: | The schedule must be displayed in a clear, easy-to-understand format. |
| Assumptions: | The Manager has set up staff schedules. |
| Notes and Issues: | None |

4.12 Use-case Specification “Book Appointment Online”

| Use Case ID: | UC-12 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Book Appointment Online |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Pet Owner |
| ----: | :---- |
| Description: | Allows a logged-in Pet Owner to book an appointment for a specific service. |
| Preconditions: | The Pet Owner is logged in and has at least one pet registered. |
| Postconditions: | An appointment is created, and the time slot is marked as booked. |
| Priority: | Must-have |
| Frequency of Use: | Medium |
| Normal Course of Events: | 1\. The Pet Owner selects "Book Appointment".2\. The Pet Owner chooses a pet and a service.3\. The Pet Owner views staff availability and selects a date and time.4\. The Pet Owner confirms the booking.5\. The system creates the appointment and displays a confirmation. |
| Alternative Courses: | None |
| Exceptions: | \- **E1:** If the time slot becomes unavailable, the system prompts the user to choose another. |
| Includes: | "View Service List" (UC-10), "View Staff Availability" (UC-11) |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | None |
| Notes and Issues: | None |

4.13 Use-case Specification “Create Appointment at Counter”

| Use Case ID: | UC-13 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Create Appointment at Counter |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Receptionist |
| ----: | :---- |
| Description: | Allows the Receptionist to create an appointment for a customer. |
| Preconditions: | The Receptionist is logged in. |
| Postconditions: | An appointment is created in the system. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The Receptionist searches for the Pet Owner's record.2\. The Receptionist follows the same steps as in "Book Appointment Online" (UC-12) on behalf of the customer.3\. The system creates the appointment. |
| Alternative Courses: | \- **A1:** If the customer is new, the Receptionist first performs "Manage Pet & Owner Records" (UC-08) to create an account. |
| Exceptions: | None |
| Includes: | "Manage Pet & Owner Records" (UC-08), "Book Appointment Online" (UC-12) |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | None |
| Notes and Issues: | None |

4.14 Use-case Specification “Cancel Appointment”

| Use Case ID: | UC-14 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Cancel Appointment |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Pet Owner |
| ----: | :---- |
| Description: | Allows a Pet Owner to cancel an upcoming appointment. |
| Preconditions: | The Pet Owner is logged in and has a future appointment scheduled. |
| Postconditions: | The appointment is removed, and the time slot is made available. |
| Priority: | Should-have |
| Frequency of Use: | Low |
| Normal Course of Events: | 1\. The Pet Owner navigates to their "My Appointments" section.2\. The Pet Owner selects the appointment to cancel.3\. The system asks for confirmation.4\. The Pet Owner confirms.5\. The system removes the appointment and displays a confirmation message. |
| Alternative Courses: | None |
| Exceptions: | None |
| Includes: | None |
| Extends | None |
| Special Requirements: | The system may have a rule preventing cancellation within a certain time frame (e.g., 24 hours) of the appointment. |
| Assumptions: | None |
| Notes and Issues: | None |

4.15 Use-case Specification “View Assigned Tasks”

| Use Case ID: | UC-15 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | View Assigned Tasks |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Veterinarian, Care Staff |
| ----: | :---- |
| Description: | Allows staff to view the list of appointments and tasks assigned to them for the day or week. |
| Preconditions: | The actor is logged in as a staff member. |
| Postconditions: | The staff member is aware of their work for the day. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The staff member logs in.  2\. The system displays a dashboard or "Today's Tasks" list.  3\. The list shows all appointments assigned to the staff member. |
| Alternative Courses: | None |
| Exceptions: | None |
| Includes: | None |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | None |
| Notes and Issues: | None |

4.16 Use-case Specification “Update Service Status”

| Use Case ID: | UC-16 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Update Service Status |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Veterinarian, Care Staff |
| ----: | :---- |
| Description: | A general use case allowing staff to update the status of a service being performed (e.g., Not Started, In Progress, Completed). |
| Preconditions: | The staff member has an assigned task. |
| Postconditions: | The status of the appointment is updated in the system. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The staff member selects a task from their list.  2\. The staff member changes the status (e.g., clicks "Start Service"). 3\. The system saves the new status. |
| Alternative Courses: | None |
| Exceptions: | None |
| Includes: | "View Assigned Tasks" (UC-15) |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | None |
| Notes and Issues: | This is a parent use case for UC-17 and UC-18. |

4.17 Use-case Specification “Record Examination Details”

| Use Case ID: | UC-17 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Record Examination Details |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Veterinarian |
| ----: | :---- |
| Description: | A specific type of status update where a veterinarian records a brief diagnosis during an examination. |
| Preconditions: | The veterinarian has started an examination appointment. |
| Postconditions: | The pet's medical record is updated. The service is marked as "Completed". |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. During an appointment, the veterinarian opens the pet's record.  2\. The veterinarian updates the service status to "In Progress".  3\. The veterinarian records notes using "Manage Medical Notes" (UC-09).  4\. The veterinarian updates the service status to "Completed". |
| Alternative Courses: | None |
| Exceptions: | None |
| Includes: | "Manage Medical Notes" (UC-09) |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | None |
| Notes and Issues: | This is a specialization of "Update Service Status" (UC-16). |

4.18 Use-case Specification “Update Pet Status”

| Use Case ID: | UC-18 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Update Pet Status |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Care Staff |
| ----: | :---- |
| Description: | A specific type of status update where care staff add a short text description about the pet before and after a service. |
| Preconditions: | The care staff member has started a service appointment. |
| Postconditions: | The appointment record is updated with notes about the pet's condition. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The care staff member starts a task.  2\. The system provides a text box for "pre-service notes".  3\. The staff member enters notes and updates the status to "In Progress".  4\. After the service, the staff member adds "post-service notes" and updates the status to "Completed". |
| Alternative Courses: | None |
| Exceptions: | None |
| Includes: | "Update Service Status" (UC-16) |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | None |
| Notes and Issues: | This is a specialization of "Update Service Status" (UC-16). |

4.19 Use-case Specification “Record Payment”

| Use Case ID: | UC-19 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Record Payment |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Receptionist |
| ----: | :---- |
| Description: | Allows the Receptionist to confirm and record a payment for an invoice. |
| Preconditions: | The Receptionist is logged in. A service has been marked "Completed", and an invoice has been generated. |
| Postconditions: | The invoice is marked as "Paid". |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The Receptionist finds the relevant invoice.  2\. The system displays the invoice with the total amount due.  3\. The Receptionist receives payment from the customer.  4\. The Receptionist selects the payment method and marks the invoice as "Paid".  5\. The system records the transaction. |
| Alternative Courses: | None |
| Exceptions: | None |
| Includes: | None |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | An invoice is generated automatically by the system. |
| Notes and Issues: | None |

	

4.20 Use-case Specification “View Invoice”

| Use Case ID: | UC-20 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | View Invoice |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Pet Owner |
| ----: | :---- |
| Description: | Allows a logged-in Pet Owner to view their electronic invoices and transaction history. |
| Preconditions: | The Pet Owner is logged in and has completed at least one service. |
| Postconditions: | The Pet Owner is aware of their past service costs and payment status. |
| Priority: | Must-have |
| Frequency of Use: | Medium |
| Normal Course of Events: | 1\. The Pet Owner logs in and navigates to the "Billing" section.  2\. The system displays a list of all their past invoices.  3\. The Pet Owner can select an invoice to view its details. |
| Alternative Courses: | None |
| Exceptions: | None |
| Includes: | None |
| Extends | None |
| Special Requirements: | None |
| Assumptions: | None |
| Notes and Issues: | None |

**4.21 Use-case Specification “Generate Reports”**

| Use Case ID: | UC-21 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Generate Reports |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 10/07/2025 | Date Last Updated: | 10/07/2025 |

| Actor: | Manager |
| ----: | :---- |
| Description: | Allows the Manager to generate monthly service and revenue reports. |
| Preconditions: | The Manager is logged in. There is transactional data in the system. |
| Postconditions: | The Manager can view a summary of service volume and revenue. |
| Priority: | Should-have |
| Frequency of Use: | Low (e.g., monthly) |
| Normal Course of Events: | 1\. The Manager navigates to the "Reports" section.  2\. The Manager selects the report type (Service or Revenue) and the time period.  3\. The Manager clicks "Generate Report".  4\. The system processes the data and displays the report. |
| Alternative Courses: | \- **A1:** The Manager chooses to export the report to a file (PDF/CSV). |
| Exceptions: | None |
| Includes: | None |
| Extends | None |
| Special Requirements: | Reports should be exportable to PDF or CSV/Excel. |
| Assumptions: | The system has been in use long enough to have data to report on. |
| Notes and Issues: | None |

**4.22 Use-case Specification "Update Appointment Status"**

| Use Case ID: | UC-22 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Update Appointment Status |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 11/16/2025 | Date Last Updated: | 11/16/2025 |

| Actor: | Receptionist |
| ----: | :---- |
| Description: | Allows the Receptionist to update the booking status of an appointment (Pending, Confirmed, Canceled). |
| Preconditions: | The Receptionist is logged in. An appointment exists in the system. |
| Postconditions: | The appointment's booking status is updated in the system. |
| Priority: | Must-have |
| Frequency of Use: | High |
| Normal Course of Events: | 1\. The Receptionist searches for and selects an appointment.  2\. The system displays the current appointment details and status.  3\. The Receptionist selects a new status from the available options (Pending, Confirmed, Canceled).  4\. The Receptionist confirms the status change.  5\. The system updates the appointment status and displays a confirmation message. |
| Alternative Courses: | \- **A1:** The Receptionist can add notes explaining the status change (e.g., reason for cancellation). |
| Exceptions: | \- **E1:** If the appointment has already been completed, the system prevents status changes and displays a warning. |
| Includes: | None |
| Extends | None |
| Special Requirements: | Status changes should be logged with timestamp and the staff member who made the change. |
| Assumptions: | The appointment was previously created either online or at the counter. |
| Notes and Issues: | This manages appointment booking status, which is separate from service execution status (UC-16). |

**4.23 Use-case Specification "Pay Invoice Online"**

| Use Case ID: | UC-23 |  |  |
| ----: | :---- | ----: | :---- |
| Use Case Name: | Pay Invoice Online |  |  |
| Created By: | Group 9 | Last Updated By: | Group 9 |
| Date Created: | 11/16/2025 | Date Last Updated: | 11/16/2025 |

| Actor: | Pet Owner |
| ----: | :---- |
| Description: | Allows a Pet Owner to pay an unpaid invoice online using the VNPay payment gateway. |
| Preconditions: | The Pet Owner is logged in. An unpaid invoice exists for a completed service. |
| Postconditions: | The invoice is marked as "Paid" and payment transaction details are recorded in the system. |
| Priority: | Must-have |
| Frequency of Use: | Medium |
| Normal Course of Events: | 1\. The Pet Owner navigates to the "Billing" or "Invoices" section.  2\. The system displays a list of invoices, highlighting unpaid ones.  3\. The Pet Owner selects an unpaid invoice to view details.  4\. The Pet Owner clicks "Pay Online".  5\. The system redirects the Pet Owner to the VNPay payment gateway with invoice details.  6\. The Pet Owner selects a payment method (ATM card, credit card, QR code, mobile banking) and completes payment.  7\. VNPay processes the payment and redirects the Pet Owner back to the system.  8\. The system receives payment confirmation from VNPay via callback (IPN).  9\. The system updates the invoice status to "Paid" and stores transaction details (transaction ID, payment method, timestamp).  10\. The system displays a payment success confirmation to the Pet Owner. |
| Alternative Courses: | \- **A1:** If the Pet Owner cancels the payment on the gateway, they are redirected back to the invoice page with the invoice still marked as unpaid. |
| Exceptions: | \- **E1:** If payment fails (insufficient funds, technical error), VNPay notifies the system, and the Pet Owner is shown an error message with an option to retry payment.  \- **E2:** If the payment callback is not received within a timeout period, the system marks the transaction as "Pending Verification" and notifies staff. |
| Includes: | "View Invoice" (UC-20) |
| Extends | None |
| Special Requirements: | All payment transactions must use HTTPS. Payment gateway credentials must be securely stored. All transactions must include HMAC SHA512 signature verification. |
| Assumptions: | VNPay payment gateway API is available and functional. The Pet Owner has a valid payment method. |
| Notes and Issues: | VNPay free sandbox environment will be used for development and testing. Production environment will be used for live transactions. |
