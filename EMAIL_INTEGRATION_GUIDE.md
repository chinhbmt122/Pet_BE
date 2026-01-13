# Email Integration Guide - Phase 2

## Tích hợp Email với các Services khác

Sau khi hoàn thành Phase 1 (Basic Email System), đây là hướng dẫn tích hợp email vào các services hiện có.

---

## 1. AccountService - Registration Success Email

### File: `src/services/account.service.ts`

Thêm EmailService vào constructor:

```typescript
import { EmailService } from './email.service';

@Injectable()
export class AccountService {
  constructor(
    // ... existing dependencies
    private readonly emailService: EmailService,
  ) {}
}
```

### Cập nhật method `createAccount()`:

```typescript
async createAccount(createDto: RegisterDto): Promise<Account> {
  // ... existing code to create account ...

  const newAccount = await this.accountRepository.save(account);

  // Send registration success email
  try {
    await this.emailService.sendRegistrationSuccessEmail(
      newAccount.email,
      profile.fullName,
      newAccount.userType
    );
  } catch (error) {
    // Log error but don't fail the registration
    console.error('Failed to send registration email:', error);
  }

  return newAccount;
}
```

---

## 2. AppointmentService - Appointment Notifications

### File: `src/services/appointment.service.ts`

### 2.1. Appointment Confirmation (khi tạo mới)

```typescript
async createAppointment(createDto: CreateAppointmentDto): Promise<Appointment> {
  // ... existing code ...

  const appointment = await this.appointmentRepository.save(newAppointment);

  // Get pet owner email
  const pet = await this.petRepository.findOne({
    where: { petId: createDto.petId },
    relations: ['owner']
  });

  if (pet?.owner?.account) {
    const service = await this.serviceRepository.findOne({
      where: { serviceId: createDto.serviceId }
    });

    const employee = await this.employeeRepository.findOne({
      where: { employeeId: createDto.employeeId }
    });

    try {
      await this.emailService.sendAppointmentStatusUpdateEmail(
        pet.owner.account.email,
        {
          ownerName: pet.owner.fullName,
          petName: pet.petName,
          serviceName: service.serviceName,
          appointmentDate: appointment.appointmentDate.toLocaleDateString('vi-VN'),
          appointmentTime: appointment.startTime,
          status: 'CONFIRMED',
          statusMessage: 'Lịch hẹn của bạn đã được xác nhận'
        }
      );
    } catch (error) {
      console.error('Failed to send appointment confirmation email:', error);
    }
  }

  return appointment;
}
```

### 2.2. Appointment Status Update

```typescript
async updateAppointmentStatus(
  appointmentId: number,
  status: AppointmentStatus
): Promise<Appointment> {
  // ... existing code ...

  appointment.status = status;
  const updatedAppointment = await this.appointmentRepository.save(appointment);

  // Send status update email
  const pet = await this.petRepository.findOne({
    where: { petId: appointment.petId },
    relations: ['owner', 'owner.account']
  });

  const service = await this.serviceRepository.findOne({
    where: { serviceId: appointment.serviceId }
  });

  if (pet?.owner?.account) {
    const statusMessages = {
      CONFIRMED: 'Lịch hẹn đã được xác nhận',
      IN_PROGRESS: 'Đang thực hiện dịch vụ',
      COMPLETED: 'Hoàn thành dịch vụ',
      CANCELLED: 'Lịch hẹn đã bị hủy'
    };

    try {
      await this.emailService.sendAppointmentStatusUpdateEmail(
        pet.owner.account.email,
        {
          ownerName: pet.owner.fullName,
          petName: pet.petName,
          serviceName: service.serviceName,
          appointmentDate: appointment.appointmentDate.toLocaleDateString('vi-VN'),
          appointmentTime: appointment.startTime,
          status: status,
          statusMessage: statusMessages[status]
        }
      );
    } catch (error) {
      console.error('Failed to send status update email:', error);
    }
  }

  return updatedAppointment;
}
```

---

## 3. PaymentService - Payment Notifications

### File: `src/services/payment.service.ts`

### 3.1. Payment Success

```typescript
async processVNPayReturn(queryParams: any): Promise<Payment> {
  // ... existing code to process payment ...

  if (payment.paymentStatus === PaymentStatus.PAID) {
    // Get invoice and pet owner info
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceId: payment.invoiceId },
      relations: ['appointment', 'appointment.pet', 'appointment.pet.owner', 'appointment.pet.owner.account']
    });

    if (invoice?.appointment?.pet?.owner?.account) {
      try {
        await this.emailService.sendPaymentConfirmationEmail(
          invoice.appointment.pet.owner.account.email,
          {
            ownerName: invoice.appointment.pet.owner.fullName,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalAmount.toLocaleString('vi-VN') + ' VNĐ',
            paymentMethod: 'VNPay',
            transactionId: payment.transactionId,
            paymentDate: payment.paidAt.toLocaleDateString('vi-VN')
          }
        );
      } catch (error) {
        console.error('Failed to send payment confirmation email:', error);
      }
    }
  }

  return payment;
}
```

### 3.2. Payment Failed

```typescript
async handlePaymentFailure(invoiceId: number, reason: string): Promise<void> {
  const invoice = await this.invoiceRepository.findOne({
    where: { invoiceId },
    relations: ['appointment', 'appointment.pet', 'appointment.pet.owner', 'appointment.pet.owner.account']
  });

  if (invoice?.appointment?.pet?.owner?.account) {
    const retryUrl = `${process.env.FRONTEND_URL}/payments/retry/${invoice.invoiceNumber}`;

    try {
      await this.emailService.sendPaymentFailedEmail(
        invoice.appointment.pet.owner.account.email,
        {
          ownerName: invoice.appointment.pet.owner.fullName,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount.toLocaleString('vi-VN') + ' VNĐ',
          failureReason: reason,
          retryUrl: retryUrl
        }
      );
    } catch (error) {
      console.error('Failed to send payment failure email:', error);
    }
  }
}
```

---

## 4. InvoiceService - Invoice Delivery

### File: `src/services/invoice.service.ts`

```typescript
async sendInvoiceEmail(invoiceId: number): Promise<void> {
  const invoice = await this.invoiceRepository.findOne({
    where: { invoiceId },
    relations: [
      'appointment',
      'appointment.pet',
      'appointment.pet.owner',
      'appointment.pet.owner.account',
      'invoiceItems',
      'invoiceItems.service'
    ]
  });

  if (!invoice?.appointment?.pet?.owner?.account) {
    throw new Error('Invoice owner not found');
  }

  const items = invoice.invoiceItems.map(item => ({
    name: item.service.serviceName,
    quantity: item.quantity,
    price: item.unitPrice.toLocaleString('vi-VN') + ' VNĐ'
  }));

  const invoiceUrl = `${process.env.FRONTEND_URL}/invoices/${invoice.invoiceNumber}`;

  await this.emailService.sendInvoiceEmail(
    invoice.appointment.pet.owner.account.email,
    {
      ownerName: invoice.appointment.pet.owner.fullName,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate.toLocaleDateString('vi-VN'),
      totalAmount: invoice.totalAmount.toLocaleString('vi-VN') + ' VNĐ',
      items: items,
      invoiceUrl: invoiceUrl
    }
  );
}

// Auto-send after invoice creation
async createInvoice(createDto: CreateInvoiceDto): Promise<Invoice> {
  // ... existing code ...

  const invoice = await this.invoiceRepository.save(newInvoice);

  // Send invoice email
  try {
    await this.sendInvoiceEmail(invoice.invoiceId);
  } catch (error) {
    console.error('Failed to send invoice email:', error);
  }

  return invoice;
}
```

---

## 5. MedicalRecordService - Medical Notifications

### File: `src/services/medical-record.service.ts`

```typescript
async createMedicalRecord(createDto: CreateMedicalRecordDto): Promise<MedicalRecord> {
  // ... existing code ...

  const medicalRecord = await this.medicalRecordRepository.save(newRecord);

  // Get pet owner info
  const appointment = await this.appointmentRepository.findOne({
    where: { appointmentId: createDto.appointmentId },
    relations: ['pet', 'pet.owner', 'pet.owner.account', 'employee']
  });

  if (appointment?.pet?.owner?.account) {
    try {
      await this.emailService.sendMedicalRecordNotificationEmail(
        appointment.pet.owner.account.email,
        {
          ownerName: appointment.pet.owner.fullName,
          petName: appointment.pet.petName,
          diagnosis: medicalRecord.diagnosis,
          treatment: medicalRecord.treatment,
          veterinarianName: appointment.employee.fullName,
          recordDate: medicalRecord.examinationDate.toLocaleDateString('vi-VN')
        }
      );
    } catch (error) {
      console.error('Failed to send medical record email:', error);
    }
  }

  return medicalRecord;
}
```

---

## 6. Scheduled Appointment Reminders

### File: `src/services/appointment-reminder.service.ts` (NEW)

Tạo service mới để gửi email nhắc lịch hẹn tự động:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { EmailService } from './email.service';

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Runs every day at 9:00 AM
   * Sends reminders for appointments happening in the next 24 hours
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendAppointmentReminders() {
    this.logger.log('Starting appointment reminder job...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find appointments for tomorrow
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: Between(tomorrow, dayAfterTomorrow),
        status: AppointmentStatus.CONFIRMED,
      },
      relations: [
        'pet',
        'pet.owner',
        'pet.owner.account',
        'service',
        'employee',
      ],
    });

    this.logger.log(`Found ${appointments.length} appointments to remind`);

    for (const appointment of appointments) {
      if (appointment.pet?.owner?.account) {
        try {
          await this.emailService.sendAppointmentReminderEmail(
            appointment.pet.owner.account.email,
            {
              ownerName: appointment.pet.owner.fullName,
              petName: appointment.pet.petName,
              serviceName: appointment.service.serviceName,
              appointmentDate:
                appointment.appointmentDate.toLocaleDateString('vi-VN'),
              appointmentTime: appointment.startTime,
              veterinarianName: appointment.employee?.fullName,
            },
          );

          this.logger.log(
            `Reminder sent to ${appointment.pet.owner.account.email}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send reminder for appointment ${appointment.appointmentId}:`,
            error,
          );
        }
      }
    }

    this.logger.log('Appointment reminder job completed');
  }
}
```

### Thêm vào Module

Update `src/modules/appointment.module.ts`:

```typescript
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentReminderService } from '../services/appointment-reminder.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... other imports
  ],
  providers: [
    AppointmentService,
    AppointmentReminderService,
    // ... other providers
  ],
})
export class AppointmentModule {}
```

Cài đặt dependency:

```bash
npm install @nestjs/schedule
```

---

## 7. Module Updates

### Update các modules để import EmailModule:

#### `src/modules/account.module.ts`

```typescript
import { EmailModule } from './email.module';

@Module({
  imports: [
    // ... existing imports
    EmailModule,
  ],
  // ...
})
```

#### `src/modules/appointment.module.ts`

```typescript
import { EmailModule } from './email.module';

@Module({
  imports: [
    // ... existing imports
    EmailModule,
  ],
  // ...
})
```

#### `src/modules/payment.module.ts`

```typescript
import { EmailModule } from './email.module';

@Module({
  imports: [
    // ... existing imports
    EmailModule,
  ],
  // ...
})
```

---

## Testing Integration

### Test Registration Email

```typescript
// POST /api/auth/register
{
  "email": "test@example.com",
  "password": "Password123!",
  "fullName": "Test User",
  "phoneNumber": "0123456789",
  "userType": "PET_OWNER"
}
```

Kiểm tra email inbox hoặc Mailtrap.

### Test Appointment Reminder

```typescript
// Manually trigger for testing
await appointmentReminderService.sendAppointmentReminders();
```

### Test Payment Confirmation

Thực hiện thanh toán qua VNPay và kiểm tra email.

---

## Best Practices

1. **Always wrap email calls in try-catch**: Không để email failures làm fail business operations
2. **Log email operations**: Để debug và monitoring
3. **Use email queue for production**: Không block HTTP requests
4. **Test with real email provider**: Đảm bảo templates hiển thị đúng
5. **Handle missing data gracefully**: Check null/undefined trước khi gửi email

---

## Monitoring & Debugging

### Query email logs:

```sql
-- Recent emails
SELECT * FROM email_logs
ORDER BY sentAt DESC
LIMIT 100;

-- Failed emails with details
SELECT recipient, emailType, subject, errorMessage, sentAt
FROM email_logs
WHERE status = 'failed'
ORDER BY sentAt DESC;

-- Success rate by email type
SELECT
  emailType,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM email_logs
GROUP BY emailType;
```

---

**Happy Integration! 🚀**
