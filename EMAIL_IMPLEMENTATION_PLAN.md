# Email System Implementation Plan
## Pet Care Service Management System

**Version:** 1.0  
**Date Created:** January 12, 2026  
**Author:** System Architect  
**Status:** Planning

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current System Analysis](#current-system-analysis)
3. [Email System Requirements](#email-system-requirements)
4. [Technical Architecture](#technical-architecture)
5. [Implementation Phases](#implementation-phases)
6. [Detailed Technical Specifications](#detailed-technical-specifications)
7. [Email Templates Design](#email-templates-design)
8. [Integration Points](#integration-points)
9. [Testing Strategy](#testing-strategy)
10. [Deployment & Configuration](#deployment--configuration)
11. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Executive Summary

### Overview
This document outlines a comprehensive plan to implement an email notification system for the Pet Care Service Management System. The system will support multiple business operations including appointment reminders, password reset, registration confirmation, payment notifications, invoices, and other critical communications.

### Goals
- ✅ Enhance user experience with timely notifications
- ✅ Automate business communications
- ✅ Improve appointment attendance rate
- ✅ Provide professional invoice delivery
- ✅ Support secure password recovery
- ✅ Maintain compliance with data protection regulations

### Key Features
1. **Appointment Reminders** - 24h before appointment
2. **Password Reset** - Secure token-based recovery
3. **Registration Confirmation** - Welcome emails for new users
4. **Payment Notifications** - Payment success/failure alerts
5. **Invoice Delivery** - Professional PDF invoices
6. **Appointment Status Updates** - Confirmed, completed, cancelled notifications
7. **Medical Record Notifications** - New medical record alerts for pet owners

---

## Current System Analysis

### Existing Architecture
Based on analysis of the Pet_BE codebase:

#### Technology Stack
- **Framework:** NestJS v11
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with @nestjs/jwt
- **Payment Gateway:** VNPay (nestjs-vnpay)
- **I18n:** nestjs-i18n (Vietnamese language support)

#### Current Modules
```
✓ AccountModule - User account management
✓ AuthModule - Authentication & authorization
✓ AppointmentModule - Appointment scheduling
✓ PaymentModule - Payment processing
✓ InvoiceModule - Invoice generation
✓ MedicalRecordModule - Medical records
✓ PetOwnerModule - Pet owner management
✓ EmployeeModule - Employee management
```

#### Identified Entities
```typescript
// Core entities related to email notifications
- Account (email field available)
- PetOwner (linked to Account)
- Employee (linked to Account)
- Appointment (with status tracking)
- Invoice (with status tracking)
- Payment (with transaction status)
- MedicalRecord (with pet and owner relations)
```

### Gaps Identified
❌ **No email module exists**  
❌ **No email templates**  
❌ **No SMTP configuration**  
❌ **No email queue system**  
❌ **No email logs/audit trail**

---

## Email System Requirements

### Functional Requirements

#### FR-EMAIL-001: Password Reset Email
**Priority:** MUST HAVE (Already referenced in SRS.md FR-002)
- Trigger: User requests password reset
- Content: Secure reset link with time-limited token
- Expiry: 1 hour
- Language: Vietnamese

#### FR-EMAIL-002: Registration Confirmation
**Priority:** MUST HAVE
- Trigger: New pet owner registers
- Content: Welcome message, account details, next steps
- Language: Vietnamese

#### FR-EMAIL-003: Appointment Reminder
**Priority:** MUST HAVE
- Trigger: 24 hours before appointment
- Content: Date, time, service, pet info, veterinarian/staff name
- Language: Vietnamese

#### FR-EMAIL-004: Appointment Status Update
**Priority:** SHOULD HAVE
- Trigger: Appointment status changes (CONFIRMED, CANCELLED, COMPLETED)
- Content: Status, appointment details, reason (if cancelled)
- Language: Vietnamese

#### FR-EMAIL-005: Payment Confirmation
**Priority:** MUST HAVE
- Trigger: Payment successful via VNPay
- Content: Payment amount, transaction ID, invoice link
- Language: Vietnamese

#### FR-EMAIL-006: Invoice Delivery
**Priority:** MUST HAVE
- Trigger: Invoice generated and marked as PAID
- Content: PDF attachment, payment summary
- Language: Vietnamese

#### FR-EMAIL-007: Medical Record Notification
**Priority:** SHOULD HAVE
- Trigger: New medical record created
- Content: Pet name, diagnosis summary, veterinarian notes
- Language: Vietnamese

#### FR-EMAIL-008: Payment Failed Notification
**Priority:** SHOULD HAVE
- Trigger: Payment fails or rejected
- Content: Failure reason, retry instructions
- Language: Vietnamese

### Non-Functional Requirements

#### NFR-EMAIL-001: Deliverability
- **Target:** 99% delivery rate
- **Bounce handling:** Automatic retry (3 attempts)
- **Error logging:** All failures logged with details

#### NFR-EMAIL-002: Performance
- **Queue processing:** Maximum 5 seconds per email
- **Batch sending:** Support up to 100 emails/minute
- **Background processing:** Non-blocking async operations

#### NFR-EMAIL-003: Security
- **SMTP over TLS/SSL:** Encrypted connection
- **Token security:** Cryptographically secure tokens
- **PII protection:** No sensitive data in subject lines
- **Email verification:** SPF, DKIM support

#### NFR-EMAIL-004: Scalability
- **Queue system:** Bull with Redis backend
- **Retry mechanism:** Exponential backoff
- **Rate limiting:** Configurable per provider

---

## Technical Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     Email System Architecture                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Business Logic  │────────>│   Email Service  │
│   (Services)     │ Trigger │   (Facade)       │
└──────────────────┘         └────────┬─────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
          ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
          │ Template Engine │ │Email Queue  │ │ Email Logger │
          │   (Handlebars)  │ │   (Bull)    │ │   (TypeORM)  │
          └─────────────────┘ └──────┬──────┘ └──────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  SMTP Provider  │
                            │  (Nodemailer)   │
                            └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  Email Server   │
                            │ (Gmail/SendGrid)│
                            └─────────────────┘
```

### Component Breakdown

#### 1. Email Module (`email.module.ts`)
- Central module for email functionality
- Imports: ConfigModule, BullModule, TypeORM
- Exports: EmailService

#### 2. Email Service (`email.service.ts`)
- Main facade for sending emails
- Methods:
  - `sendPasswordReset(email, token)`
  - `sendRegistrationConfirmation(account, petOwner)`
  - `sendAppointmentReminder(appointment)`
  - `sendAppointmentStatusUpdate(appointment, oldStatus)`
  - `sendPaymentConfirmation(payment, invoice)`
  - `sendInvoice(invoice, pdfBuffer)`
  - `sendMedicalRecordNotification(medicalRecord)`

#### 3. Template Service (`email-template.service.ts`)
- Handles template rendering with Handlebars
- Template loading and caching
- Variable substitution
- Multi-language support

#### 4. Queue Processor (`email.processor.ts`)
- Background job processing with Bull
- Retry logic with exponential backoff
- Error handling and logging

#### 5. Email Logger (`email-log.entity.ts`)
- Audit trail for all emails
- Fields: recipient, subject, status, sentAt, error, metadata

#### 6. Configuration (`email.config.ts`)
- SMTP settings
- Queue configuration
- Rate limiting
- Retry policies

---

## Implementation Phases

### Phase 1: Foundation (Week 1) 🏗️

**Goal:** Setup email infrastructure

**Tasks:**
1. Install dependencies
2. Create email module structure
3. Configure SMTP connection
4. Implement basic email sending
5. Setup email logging

**Deliverables:**
- ✅ Email module created
- ✅ SMTP configured and tested
- ✅ Basic send functionality working

---

### Phase 2: Queue & Reliability (Week 2) ⚙️

**Goal:** Implement async processing and reliability

**Tasks:**
1. Setup Bull queue with Redis
2. Create email processor
3. Implement retry logic
4. Add error handling
5. Setup monitoring

**Deliverables:**
- ✅ Queue system operational
- ✅ Retry mechanism tested
- ✅ Error logging in place

---

### Phase 3: Templates & Localization (Week 2-3) 🎨

**Goal:** Professional email templates

**Tasks:**
1. Design HTML email templates
2. Implement template engine (Handlebars)
3. Create template service
4. Vietnamese language support
5. Responsive design

**Deliverables:**
- ✅ 8+ email templates created
- ✅ Template rendering service
- ✅ Mobile-responsive designs

---

### Phase 4: Business Integration (Week 3-4) 🔗

**Goal:** Integrate with existing services

**Tasks:**
1. Password reset integration
2. Registration confirmation
3. Appointment reminders
4. Payment notifications
5. Invoice delivery

**Deliverables:**
- ✅ All use cases implemented
- ✅ Services updated
- ✅ Events properly triggered

---

### Phase 5: Testing & Optimization (Week 4) 🧪

**Goal:** Ensure quality and performance

**Tasks:**
1. Unit tests for email service
2. Integration tests
3. Load testing
4. Template testing
5. Security audit

**Deliverables:**
- ✅ 90%+ test coverage
- ✅ Performance benchmarks met
- ✅ Security review completed

---

## Detailed Technical Specifications

### Dependencies to Install

```json
{
  "dependencies": {
    "@nestjs-modules/mailer": "^1.11.2",
    "nodemailer": "^6.9.8",
    "handlebars": "^4.7.8",
    "@nestjs/bull": "^10.1.0",
    "bull": "^4.12.2",
    "ioredis": "^5.3.2"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.14",
    "@types/bull": "^4.10.0"
  }
}
```

### File Structure

```
src/
├── modules/
│   └── email.module.ts              # Main email module
├── services/
│   ├── email.service.ts             # Email facade service
│   ├── email-template.service.ts    # Template rendering
│   └── email-queue.processor.ts     # Queue processor
├── entities/
│   └── email-log.entity.ts          # Email audit log
├── config/
│   └── email.config.ts              # Email configuration
├── templates/                        # Email templates
│   ├── password-reset.hbs
│   ├── registration-confirmation.hbs
│   ├── appointment-reminder.hbs
│   ├── appointment-confirmed.hbs
│   ├── appointment-cancelled.hbs
│   ├── payment-success.hbs
│   ├── payment-failed.hbs
│   ├── invoice.hbs
│   └── medical-record-notification.hbs
├── dto/
│   └── email/
│       ├── send-email.dto.ts
│       └── email-options.dto.ts
└── utils/
    └── email.util.ts                # Helper functions
```

### Configuration Schema

```typescript
// .env additions
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=PAW LOVERS Pet Care
SMTP_FROM_EMAIL=noreply@pawlovers.com

# Redis for queue
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email settings
EMAIL_QUEUE_NAME=email-queue
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=5000
```

---

## Email Templates Design

### Template Structure

Each template follows this structure:

```handlebars
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        /* Inline CSS for email client compatibility */
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #4CAF50; color: white; padding: 20px; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { 
            background: #4CAF50; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px;
            display: inline-block;
        }
        .footer { 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐾 PAW LOVERS Pet Care</h1>
        </div>
        <div class="content">
            {{> body}}
        </div>
        <div class="footer">
            <p>© 2026 PAW LOVERS Pet Care Center</p>
            <p>Địa chỉ: [Your Address] | Hotline: [Your Phone]</p>
        </div>
    </div>
</body>
</html>
```

### Template Examples

#### 1. Password Reset (`password-reset.hbs`)

```handlebars
<h2>Đặt lại mật khẩu</h2>
<p>Xin chào {{userName}},</p>
<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
<p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
<p style="text-align: center; margin: 30px 0;">
    <a href="{{resetLink}}" class="button">Đặt lại mật khẩu</a>
</p>
<p>Link này sẽ hết hạn sau <strong>1 giờ</strong>.</p>
<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
<p style="color: #666; font-size: 12px; margin-top: 30px;">
    Hoặc copy link sau vào trình duyệt:<br>
    {{resetLink}}
</p>
```

**Variables:** `userName`, `resetLink`

#### 2. Appointment Reminder (`appointment-reminder.hbs`)

```handlebars
<h2>Nhắc nhở lịch hẹn</h2>
<p>Xin chào {{ownerName}},</p>
<p>Đây là lời nhắc về lịch hẹn sắp tới cho thú cưng của bạn:</p>

<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <table style="width: 100%;">
        <tr>
            <td><strong>🐕 Thú cưng:</strong></td>
            <td>{{petName}}</td>
        </tr>
        <tr>
            <td><strong>📅 Ngày:</strong></td>
            <td>{{appointmentDate}}</td>
        </tr>
        <tr>
            <td><strong>⏰ Giờ:</strong></td>
            <td>{{startTime}} - {{endTime}}</td>
        </tr>
        <tr>
            <td><strong>🏥 Dịch vụ:</strong></td>
            <td>{{serviceName}}</td>
        </tr>
        <tr>
            <td><strong>👨‍⚕️ Nhân viên:</strong></td>
            <td>{{staffName}}</td>
        </tr>
    </table>
</div>

<p>Vui lòng đến đúng giờ để đảm bảo thú cưng của bạn được chăm sóc tốt nhất.</p>
<p><strong>Lưu ý:</strong> Nếu bạn cần hủy hoặc đổi lịch, vui lòng liên hệ trước ít nhất 2 giờ.</p>
```

**Variables:** `ownerName`, `petName`, `appointmentDate`, `startTime`, `endTime`, `serviceName`, `staffName`

#### 3. Payment Confirmation (`payment-success.hbs`)

```handlebars
<h2>Xác nhận thanh toán thành công</h2>
<p>Xin chào {{customerName}},</p>
<p>Cảm ơn bạn đã thanh toán! Giao dịch của bạn đã được xử lý thành công.</p>

<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Chi tiết thanh toán</h3>
    <table style="width: 100%;">
        <tr>
            <td><strong>Mã giao dịch:</strong></td>
            <td>{{transactionId}}</td>
        </tr>
        <tr>
            <td><strong>Số tiền:</strong></td>
            <td style="color: #4CAF50; font-size: 18px; font-weight: bold;">
                {{amount}} VNĐ
            </td>
        </tr>
        <tr>
            <td><strong>Phương thức:</strong></td>
            <td>{{paymentMethod}}</td>
        </tr>
        <tr>
            <td><strong>Thời gian:</strong></td>
            <td>{{paymentTime}}</td>
        </tr>
        <tr>
            <td><strong>Trạng thái:</strong></td>
            <td style="color: #4CAF50;">✓ Thành công</td>
        </tr>
    </table>
</div>

<p style="text-align: center; margin: 30px 0;">
    <a href="{{invoiceLink}}" class="button">Xem hóa đơn</a>
</p>

<p>Hóa đơn chi tiết đã được gửi kèm email này.</p>
```

**Variables:** `customerName`, `transactionId`, `amount`, `paymentMethod`, `paymentTime`, `invoiceLink`

#### 4. Invoice Delivery (`invoice.hbs`)

```handlebars
<h2>Hóa đơn dịch vụ</h2>
<p>Xin chào {{customerName}},</p>
<p>Vui lòng xem hóa đơn chi tiết cho dịch vụ của bạn tại PAW LOVERS.</p>

<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Thông tin hóa đơn</h3>
    <table style="width: 100%;">
        <tr>
            <td><strong>Số hóa đơn:</strong></td>
            <td>{{invoiceNumber}}</td>
        </tr>
        <tr>
            <td><strong>Ngày phát hành:</strong></td>
            <td>{{issueDate}}</td>
        </tr>
        <tr>
            <td><strong>Tổng tiền:</strong></td>
            <td style="color: #4CAF50; font-size: 18px; font-weight: bold;">
                {{totalAmount}} VNĐ
            </td>
        </tr>
        <tr>
            <td><strong>Trạng thái:</strong></td>
            <td style="color: #4CAF50;">✓ Đã thanh toán</td>
        </tr>
    </table>
</div>

<p>Hóa đơn PDF đính kèm email này.</p>
<p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
```

**Variables:** `customerName`, `invoiceNumber`, `issueDate`, `totalAmount`  
**Attachments:** Invoice PDF

---

## Integration Points

### 1. Password Reset Integration

**File:** `src/services/auth.service.ts`

**Current State:** DTO exists (`ResetPasswordDto`) but no email sending

**Integration Plan:**

```typescript
// In AuthService
async requestPasswordReset(email: string): Promise<void> {
  const account = await this.accountRepository.findOne({ where: { email } });
  if (!account) {
    // Don't reveal if email exists (security best practice)
    return;
  }

  // Generate secure token
  const resetToken = this.generateResetToken();
  const hashedToken = await bcrypt.hash(resetToken, 10);
  
  // Store token with expiry (1 hour)
  await this.storeResetToken(account.accountId, hashedToken, 3600);

  // Send email
  await this.emailService.sendPasswordReset(
    account.email,
    resetToken,
    account.petOwner?.fullName || account.employee?.fullName
  );
}
```

### 2. Registration Confirmation

**File:** `src/services/account.service.ts`

**Integration Plan:**

```typescript
// In AccountService.createPetOwnerAccount()
async createPetOwnerAccount(dto: CreatePetOwnerDto): Promise<AccountResponseDto> {
  // ... existing account creation logic ...
  
  const account = await this.accountRepository.save(accountEntity);
  const petOwner = await this.petOwnerRepository.save(petOwnerEntity);

  // NEW: Send welcome email
  await this.emailService.sendRegistrationConfirmation(account, petOwner);

  return AccountMapper.toResponse(account, petOwner);
}
```

### 3. Appointment Reminders

**File:** `src/services/appointment.service.ts`

**Integration Plan:**

```typescript
// Create a scheduled task (cron job)
@Cron('0 */6 * * *') // Every 6 hours
async sendAppointmentReminders(): Promise<void> {
  // Find appointments in next 24 hours
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const appointments = await this.appointmentRepository.find({
    where: {
      appointmentDate: tomorrow,
      status: AppointmentStatus.CONFIRMED,
    },
    relations: ['pet', 'pet.owner', 'pet.owner.account', 'employee', 'service'],
  });

  // Send reminders
  for (const appointment of appointments) {
    await this.emailService.sendAppointmentReminder(appointment);
  }
}
```

### 4. Appointment Status Updates

**File:** `src/services/appointment.service.ts`

**Integration Plan:**

```typescript
// In updateAppointmentStatus()
async updateAppointmentStatus(
  appointmentId: number,
  status: AppointmentStatus,
  reason?: string
): Promise<AppointmentResponseDto> {
  const appointment = await this.findAppointmentWithRelations(appointmentId);
  const oldStatus = appointment.status;
  
  appointment.status = status;
  if (reason) appointment.cancellationReason = reason;
  
  await this.appointmentRepository.save(appointment);

  // NEW: Send status update email
  if (oldStatus !== status) {
    await this.emailService.sendAppointmentStatusUpdate(
      appointment,
      oldStatus,
      status
    );
  }

  return AppointmentMapper.toResponse(appointment);
}
```

### 5. Payment Confirmation

**File:** `src/services/payment.service.ts`

**Integration Plan:**

```typescript
// In handleVNPayCallback()
async handleVNPayCallback(callbackData: any): Promise<void> {
  // ... existing payment processing ...
  
  const payment = await this.paymentRepository.save(paymentEntity);
  const invoice = await this.invoiceRepository.findOne({
    where: { invoiceId: payment.invoiceId },
    relations: ['appointment', 'appointment.pet', 'appointment.pet.owner', 'appointment.pet.owner.account'],
  });

  if (payment.paymentStatus === PaymentStatus.COMPLETED) {
    // NEW: Send payment confirmation
    await this.emailService.sendPaymentConfirmation(payment, invoice);
  } else if (payment.paymentStatus === PaymentStatus.FAILED) {
    // NEW: Send payment failed notification
    await this.emailService.sendPaymentFailed(payment, invoice);
  }
}
```

### 6. Invoice Delivery

**File:** `src/services/invoice.service.ts`

**Integration Plan:**

```typescript
// In generateInvoice() or when invoice is paid
async sendInvoiceByEmail(invoiceId: number): Promise<void> {
  const invoice = await this.invoiceRepository.findOne({
    where: { invoiceId },
    relations: [
      'appointment',
      'appointment.pet',
      'appointment.pet.owner',
      'appointment.pet.owner.account',
      'items',
    ],
  });

  if (!invoice) {
    throw new NotFoundException('Invoice not found');
  }

  // Generate PDF (you may need a PDF library like pdfkit or puppeteer)
  const pdfBuffer = await this.generateInvoicePDF(invoice);

  // Send email with PDF attachment
  await this.emailService.sendInvoice(invoice, pdfBuffer);
}
```

### 7. Medical Record Notification

**File:** `src/services/medical-record.service.ts`

**Integration Plan:**

```typescript
// In createMedicalRecord()
async createMedicalRecord(dto: CreateMedicalRecordDto): Promise<MedicalRecordResponseDto> {
  // ... existing medical record creation ...
  
  const medicalRecord = await this.medicalRecordRepository.save(entity);
  
  // Load relations for email
  const fullRecord = await this.medicalRecordRepository.findOne({
    where: { medicalRecordId: medicalRecord.medicalRecordId },
    relations: ['appointment', 'appointment.pet', 'appointment.pet.owner', 'appointment.pet.owner.account'],
  });

  // NEW: Notify pet owner
  await this.emailService.sendMedicalRecordNotification(fullRecord);

  return MedicalRecordMapper.toResponse(medicalRecord);
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// email.service.spec.ts
describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email with correct data', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';
      const userName = 'Test User';

      await service.sendPasswordReset(email, token, userName);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('Đặt lại mật khẩu'),
          template: 'password-reset',
          context: expect.objectContaining({
            userName,
            resetLink: expect.stringContaining(token),
          }),
        })
      );
    });
  });

  // More tests...
});
```

### Integration Tests

```typescript
// email.integration.spec.ts
describe('Email Integration', () => {
  let app: INestApplication;
  let emailService: EmailService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    emailService = app.get<EmailService>(EmailService);
  });

  it('should send email to real SMTP server (sandbox)', async () => {
    const testEmail = 'test@ethereal.email'; // Use Ethereal for testing
    
    const result = await emailService.sendPasswordReset(
      testEmail,
      'test-token',
      'Test User'
    );

    expect(result.messageId).toBeDefined();
    expect(result.accepted).toContain(testEmail);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### E2E Tests

```typescript
// auth.e2e-spec.ts (add email testing)
it('/auth/forgot-password (POST) should send reset email', async () => {
  const response = await request(app.getHttpServer())
    .post('/auth/forgot-password')
    .send({ email: 'existing@example.com' })
    .expect(200);

  // Check email was queued
  const emailLogs = await emailLogRepository.find({
    where: { recipient: 'existing@example.com' },
    order: { createdAt: 'DESC' },
    take: 1,
  });

  expect(emailLogs).toHaveLength(1);
  expect(emailLogs[0].subject).toContain('Đặt lại mật khẩu');
  expect(emailLogs[0].status).toBe('SENT');
});
```

---

## Deployment & Configuration

### Environment Variables

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_NAME=PAW LOVERS Pet Care
SMTP_FROM_EMAIL=noreply@pawlovers.com

# Redis Configuration (for queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Queue Settings
EMAIL_QUEUE_NAME=email-queue
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=5000
EMAIL_RATE_LIMIT=100

# Frontend URL (for links in emails)
FRONTEND_URL=https://pawlovers.com
```

### Docker Compose Addition

```yaml
# Add to docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    container_name: pet-care-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

### Production Checklist

- [ ] SMTP credentials configured
- [ ] Redis instance running
- [ ] Email templates tested
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Email logs retention policy
- [ ] Backup strategy for email queue
- [ ] SPF/DKIM records configured
- [ ] Bounce handling configured
- [ ] Unsubscribe mechanism (if needed)

---

## Monitoring & Maintenance

### Metrics to Track

```typescript
// Key Performance Indicators
1. Email Delivery Rate: (Sent / Total) * 100%
2. Bounce Rate: (Bounced / Sent) * 100%
3. Average Processing Time: Sum(ProcessTime) / Total
4. Queue Length: Current jobs in queue
5. Failure Rate: (Failed / Total) * 100%
```

### Logging

```typescript
// Email log structure
interface EmailLog {
  id: number;
  recipient: string;
  subject: string;
  template: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
  sentAt: Date;
  error: string | null;
  metadata: any; // JSON field for additional data
  retryCount: number;
}
```

### Alerts

Configure alerts for:
- Email delivery failures > 5% in 1 hour
- Queue length > 1000 jobs
- Redis connection failures
- SMTP authentication errors

### Maintenance Tasks

**Daily:**
- Monitor email logs for failures
- Check queue health
- Review bounce rates

**Weekly:**
- Clean up old email logs (retention: 30 days)
- Review and optimize templates
- Update template content if needed

**Monthly:**
- Analyze email metrics
- Review SMTP provider costs
- Audit security settings

---

## Appendix A: Code Samples

### Email Module

```typescript
// src/modules/email.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { EmailService } from '../services/email.service';
import { EmailTemplateService } from '../services/email-template.service';
import { EmailQueueProcessor } from '../services/email-queue.processor';
import { EmailLog } from '../entities/email-log.entity';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST'),
          port: config.get('SMTP_PORT'),
          secure: config.get('SMTP_SECURE') === 'true',
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: `"${config.get('SMTP_FROM_NAME')}" <${config.get('SMTP_FROM_EMAIL')}>`,
        },
        template: {
          dir: join(__dirname, '..', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    BullModule.registerQueueAsync({
      name: 'email-queue',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),
    TypeOrmModule.forFeature([EmailLog]),
  ],
  providers: [
    EmailService,
    EmailTemplateService,
    EmailQueueProcessor,
  ],
  exports: [EmailService],
})
export class EmailModule {}
```

### Email Service

```typescript
// src/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { EmailLog } from '../entities/email-log.entity';
import { Appointment } from '../entities/appointment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { MedicalRecord } from '../entities/medical-record.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
    private configService: ConfigService,
  ) {}

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    email: string,
    token: string,
    userName: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.queueEmail({
      to: email,
      subject: 'Đặt lại mật khẩu - PAW LOVERS',
      template: 'password-reset',
      context: {
        userName,
        resetLink,
      },
    });
  }

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(
    account: any,
    petOwner: any,
  ): Promise<void> {
    await this.queueEmail({
      to: account.email,
      subject: 'Chào mừng đến với PAW LOVERS',
      template: 'registration-confirmation',
      context: {
        userName: petOwner.fullName,
        email: account.email,
        loginLink: `${this.configService.get('FRONTEND_URL')}/login`,
      },
    });
  }

  /**
   * Send appointment reminder (24h before)
   */
  async sendAppointmentReminder(appointment: Appointment): Promise<void> {
    const owner = appointment.pet.owner;
    const account = owner.account;

    await this.queueEmail({
      to: account.email,
      subject: `Nhắc nhở: Lịch hẹn cho ${appointment.pet.name}`,
      template: 'appointment-reminder',
      context: {
        ownerName: owner.fullName,
        petName: appointment.pet.name,
        appointmentDate: this.formatDate(appointment.appointmentDate),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        serviceName: appointment.service.serviceName,
        staffName: appointment.employee.fullName,
      },
    });
  }

  /**
   * Send appointment status update
   */
  async sendAppointmentStatusUpdate(
    appointment: Appointment,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    const owner = appointment.pet.owner;
    const account = owner.account;

    let template = 'appointment-status-update';
    let subject = 'Cập nhật lịch hẹn';

    if (newStatus === 'CONFIRMED') {
      template = 'appointment-confirmed';
      subject = 'Lịch hẹn đã được xác nhận';
    } else if (newStatus === 'CANCELLED') {
      template = 'appointment-cancelled';
      subject = 'Lịch hẹn đã bị hủy';
    }

    await this.queueEmail({
      to: account.email,
      subject,
      template,
      context: {
        ownerName: owner.fullName,
        petName: appointment.pet.name,
        appointmentDate: this.formatDate(appointment.appointmentDate),
        startTime: appointment.startTime,
        serviceName: appointment.service.serviceName,
        oldStatus: this.translateStatus(oldStatus),
        newStatus: this.translateStatus(newStatus),
        cancellationReason: appointment.cancellationReason,
      },
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    payment: Payment,
    invoice: Invoice,
  ): Promise<void> {
    const owner = invoice.appointment.pet.owner;
    const account = owner.account;

    await this.queueEmail({
      to: account.email,
      subject: 'Xác nhận thanh toán thành công',
      template: 'payment-success',
      context: {
        customerName: owner.fullName,
        transactionId: payment.transactionId,
        amount: this.formatCurrency(payment.amount),
        paymentMethod: this.translatePaymentMethod(payment.paymentMethod),
        paymentTime: this.formatDateTime(payment.paidAt),
        invoiceLink: `${this.configService.get('FRONTEND_URL')}/invoices/${invoice.invoiceId}`,
      },
    });
  }

  /**
   * Send invoice with PDF attachment
   */
  async sendInvoice(invoice: Invoice, pdfBuffer: Buffer): Promise<void> {
    const owner = invoice.appointment.pet.owner;
    const account = owner.account;

    await this.queueEmail({
      to: account.email,
      subject: `Hóa đơn ${invoice.invoiceNumber}`,
      template: 'invoice',
      context: {
        customerName: owner.fullName,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: this.formatDate(invoice.issueDate),
        totalAmount: this.formatCurrency(invoice.totalAmount),
      },
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Send medical record notification
   */
  async sendMedicalRecordNotification(
    medicalRecord: MedicalRecord,
  ): Promise<void> {
    const owner = medicalRecord.appointment.pet.owner;
    const account = owner.account;

    await this.queueEmail({
      to: account.email,
      subject: `Hồ sơ y tế mới cho ${medicalRecord.appointment.pet.name}`,
      template: 'medical-record-notification',
      context: {
        ownerName: owner.fullName,
        petName: medicalRecord.appointment.pet.name,
        diagnosis: medicalRecord.diagnosis,
        treatment: medicalRecord.treatment,
        veterinarianName: medicalRecord.appointment.employee.fullName,
        recordDate: this.formatDate(medicalRecord.recordDate),
      },
    });
  }

  /**
   * Queue email for async processing
   */
  private async queueEmail(emailOptions: any): Promise<void> {
    try {
      // Log email to database
      const log = this.emailLogRepository.create({
        recipient: emailOptions.to,
        subject: emailOptions.subject,
        template: emailOptions.template,
        status: 'PENDING',
        metadata: emailOptions.context,
      });
      await this.emailLogRepository.save(log);

      // Add to queue
      await this.emailQueue.add('send-email', {
        ...emailOptions,
        logId: log.id,
      });

      this.logger.log(`Email queued: ${emailOptions.subject} to ${emailOptions.to}`);
    } catch (error) {
      this.logger.error(`Failed to queue email: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('vi-VN');
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  private translateStatus(status: string): string {
    const translations = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      IN_PROGRESS: 'Đang thực hiện',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return translations[status] || status;
  }

  private translatePaymentMethod(method: string): string {
    const translations = {
      CASH: 'Tiền mặt',
      VNPAY: 'VNPay',
      CREDIT_CARD: 'Thẻ tín dụng',
    };
    return translations[method] || method;
  }
}
```

### Email Queue Processor

```typescript
// src/services/email-queue.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EmailLog } from '../entities/email-log.entity';

@Processor('email-queue')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job): Promise<void> {
    const { to, subject, template, context, attachments, logId } = job.data;

    try {
      this.logger.log(`Sending email: ${subject} to ${to}`);

      // Send email
      const result = await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
        attachments,
      });

      // Update log
      await this.emailLogRepository.update(logId, {
        status: 'SENT',
        sentAt: new Date(),
        metadata: { ...context, messageId: result.messageId },
      });

      this.logger.log(`Email sent successfully: ${result.messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error.message}`,
        error.stack,
      );

      // Update log
      await this.emailLogRepository.update(logId, {
        status: 'FAILED',
        error: error.message,
        retryCount: () => 'retryCount + 1',
      });

      // Retry logic (Bull will handle this automatically based on config)
      throw error;
    }
  }
}
```

### Email Log Entity

```typescript
// src/entities/email-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_logs')
@Index(['recipient', 'createdAt'])
@Index(['status'])
export class EmailLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 255 })
  recipient: string;

  @Column({ length: 500 })
  subject: string;

  @Column({ length: 100 })
  template: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'SENT', 'FAILED', 'BOUNCED'],
    default: 'PENDING',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'int', default: 0 })
  retryCount: number;
}
```

---

## Appendix B: Migration Script

```typescript
// src/database/migrations/1234567890123-CreateEmailLogTable.ts
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateEmailLogTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_logs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'recipient',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'template',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'SENT', 'FAILED', 'BOUNCED'],
            default: "'PENDING'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'retryCount',
            type: 'int',
            default: 0,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'email_logs',
      new Index({
        columnNames: ['recipient', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'email_logs',
      new Index({
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_logs');
  }
}
```

---

## Summary

Kế hoạch triển khai này cung cấp:

✅ **Phân tích chi tiết** về hệ thống hiện tại  
✅ **Kiến trúc rõ ràng** với các component được thiết kế tốt  
✅ **8+ use cases** cho email notifications  
✅ **Templates chuyên nghiệp** bằng tiếng Việt  
✅ **Integration points** cụ thể với các service hiện có  
✅ **Testing strategy** đầy đủ  
✅ **Production-ready** configuration  
✅ **Code samples** chi tiết và sẵn sàng sử dụng  

### Next Steps

1. **Review và approval** - Xem xét kế hoạch với team
2. **Setup environment** - Cài đặt Redis, SMTP credentials
3. **Phase 1 implementation** - Bắt đầu với foundation
4. **Iterative development** - Theo từng phase đã định nghĩa
5. **Testing** - Đảm bảo quality trước khi deploy
6. **Production deployment** - Triển khai từng bước có monitoring

---

**Document Status:** ✅ Ready for Implementation  
**Estimated Timeline:** 4 weeks  
**Risk Level:** Low (well-defined plan with existing codebase analysis)
