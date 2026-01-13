# Email System - Hướng dẫn sử dụng

## Tổng quan

Hệ thống email đã được triển khai thành công với các tính năng:

✅ Email templates đẹp mắt, responsive
✅ Email logging và tracking
✅ Password reset với token hết hạn
✅ Hỗ trợ đa ngôn ngữ (tiếng Việt)
✅ Error handling và retry mechanism

## Cấu hình

### 1. Environment Variables

Cập nhật file `.env` với thông tin email của bạn:

```env
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password  # Sử dụng App Password nếu dùng Gmail
MAIL_FROM_ADDRESS=noreply@petcare.com
MAIL_FROM_NAME=PAW LOVERS
APP_NAME=PAW LOVERS

# Frontend URL
FRONTEND_URL=http://localhost:4200
```

### 2. Gmail Setup (Khuyến nghị cho testing)

Nếu sử dụng Gmail:

1. Bật 2-Step Verification trong Google Account
2. Tạo App Password:
   - Vào: https://myaccount.google.com/apppasswords
   - Chọn "Mail" và device của bạn
   - Copy password được tạo vào `MAIL_PASSWORD`

## Cấu trúc Code

### Entities

```
src/entities/
├── email-log.entity.ts              # Lưu trữ logs của emails
└── password-reset-token.entity.ts   # Lưu trữ tokens reset password
```

### Services

```
src/services/
└── email.service.ts                 # Service chính xử lý email
```

### Templates

```
src/templates/emails/
├── reset-password.hbs               # Reset password
├── registration-success.hbs         # Đăng ký thành công
├── appointment-reminder.hbs         # Nhắc lịch hẹn
├── payment-confirmation.hbs         # Xác nhận thanh toán
└── invoice.hbs                      # Hóa đơn
```

## API Endpoints

### Password Reset Flow

#### 1. Request Reset Token

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

#### 2. Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123xyz456...",
  "newPassword": "NewPassword123!"
}
```

**Response:**

```json
{
  "message": "Password has been reset successfully"
}
```

## Sử dụng Email Service

### Trong Service khác

```typescript
import { EmailService } from '../services/email.service';

@Injectable()
export class YourService {
  constructor(private readonly emailService: EmailService) {}

  async someMethod() {
    // Gửi email reset password
    await this.emailService.sendPasswordResetEmail(
      'user@example.com',
      'reset-token-123',
      'Nguyễn Văn A',
    );

    // Gửi email đăng ký thành công
    await this.emailService.sendRegistrationSuccessEmail(
      'user@example.com',
      'Nguyễn Văn A',
      'PET_OWNER',
    );

    // Gửi nhắc lịch hẹn
    await this.emailService.sendAppointmentReminderEmail('user@example.com', {
      ownerName: 'Nguyễn Văn A',
      petName: 'Milu',
      serviceName: 'Khám tổng quát',
      appointmentDate: '15/01/2026',
      appointmentTime: '10:00 AM',
      veterinarianName: 'BS. Trần Văn B',
    });
  }
}
```

## Email Types

### 1. Password Reset Email

- **Template:** `reset-password.hbs`
- **Use case:** User quên mật khẩu
- **Expiry:** 15 phút
- **Method:** `sendPasswordResetEmail()`

### 2. Registration Success Email

- **Template:** `registration-success.hbs`
- **Use case:** User đăng ký thành công
- **Method:** `sendRegistrationSuccessEmail()`

### 3. Appointment Reminder Email

- **Template:** `appointment-reminder.hbs`
- **Use case:** Nhắc nhở trước lịch hẹn 24h
- **Method:** `sendAppointmentReminderEmail()`

### 4. Appointment Status Update Email

- **Template:** `appointment-status-update.hbs`
- **Use case:** Cập nhật trạng thái lịch hẹn
- **Method:** `sendAppointmentStatusUpdateEmail()`

### 5. Payment Confirmation Email

- **Template:** `payment-confirmation.hbs`
- **Use case:** Xác nhận thanh toán thành công
- **Method:** `sendPaymentConfirmationEmail()`

### 6. Invoice Email

- **Template:** `invoice.hbs`
- **Use case:** Gửi hóa đơn chi tiết
- **Method:** `sendInvoiceEmail()`

### 7. Medical Record Notification Email

- **Template:** `medical-record-notification.hbs`
- **Use case:** Thông báo hồ sơ y tế mới
- **Method:** `sendMedicalRecordNotificationEmail()`

### 8. Payment Failed Email

- **Template:** `payment-failed.hbs`
- **Use case:** Thông báo thanh toán thất bại
- **Method:** `sendPaymentFailedEmail()`

## Database Migrations

Chạy migrations để tạo bảng:

```bash
# Nếu sử dụng synchronize: true trong TypeORM
npm run start:dev

# Hoặc chạy migrations thủ công
npx typeorm migration:run -d src/config/database.config.ts
```

## Testing

### Test Email Service

```typescript
// test/integration/email.service.spec.ts
describe('EmailService', () => {
  it('should send password reset email', async () => {
    await emailService.sendPasswordResetEmail(
      'test@example.com',
      'test-token',
      'Test User',
    );

    // Verify email log
    const log = await emailLogRepository.findOne({
      where: { recipient: 'test@example.com' },
    });
    expect(log.status).toBe('sent');
  });
});
```

### Test với Mailtrap (Khuyến nghị cho development)

1. Tạo account tại: https://mailtrap.io
2. Lấy SMTP credentials
3. Cập nhật `.env`:

```env
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
```

## Monitoring

### Email Logs

Truy vấn email logs từ database:

```sql
-- Xem tất cả emails đã gửi
SELECT * FROM email_logs
ORDER BY sentAt DESC
LIMIT 100;

-- Xem emails thất bại
SELECT * FROM email_logs
WHERE status = 'failed'
ORDER BY sentAt DESC;

-- Thống kê theo loại email
SELECT emailType, status, COUNT(*) as count
FROM email_logs
GROUP BY emailType, status;
```

## Troubleshooting

### 1. Email không gửi được

**Kiểm tra:**

- ✅ SMTP credentials đúng
- ✅ Port và host đúng
- ✅ Gmail App Password (nếu dùng Gmail)
- ✅ Firewall không chặn port 587

**Xem logs:**

```bash
# Check console logs
npm run start:dev

# Check email_logs table
SELECT * FROM email_logs WHERE status = 'failed';
```

### 2. Template không hiển thị đúng

**Kiểm tra:**

- ✅ Template file exists trong `src/templates/emails/`
- ✅ Template syntax đúng (Handlebars)
- ✅ Context data đầy đủ

### 3. Token reset hết hạn

Token reset password có thời hạn **15 phút**. Điều chỉnh trong `AuthService`:

```typescript
expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Thay đổi số này
```

## Next Steps - Phase 2

### Async Email Queue (Bull + Redis)

Để xử lý emails không đồng bộ:

1. Cài đặt dependencies:

```bash
npm install @nestjs/bull bull redis
```

2. Tạo Email Queue
3. Process emails trong background
4. Retry failed emails

### Scheduled Appointment Reminders

Tự động gửi email nhắc lịch hẹn 24h trước:

1. Cài đặt `@nestjs/schedule`
2. Tạo cron job
3. Query appointments sắp tới
4. Gửi emails tự động

## Best Practices

1. **Không gửi email trong transaction**: Email có thể mất vài giây
2. **Sử dụng queue cho production**: Tránh block request
3. **Log mọi emails**: Để audit và debug
4. **Template reusable**: Dùng layout chung
5. **Error handling**: Always handle email failures gracefully

## Support

Nếu gặp vấn đề, kiểm tra:

1. Email logs trong database
2. Console logs của NestJS
3. SMTP provider status
4. Environment variables

---

**Triển khai thành công! 🎉**

Email system đã sẵn sàng cho production với đầy đủ tính năng cơ bản.
