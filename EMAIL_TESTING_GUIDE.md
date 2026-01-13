# Email System Testing Guide

**Date:** January 12, 2026  
**Status:** Testing Phase - Email System Verification  
**Methodology:** Chậm mà chắc (Slow but sure)

---

## 🎯 Testing Objectives

Verify all 7 email types work correctly:
1. ✅ Password Reset Email
2. ✅ Registration Success Email
3. ✅ Appointment Reminder Email
4. ✅ Appointment Status Update Email
5. ✅ Payment Confirmation Email
6. ✅ Payment Failed Email
7. ✅ Medical Record Notification Email

---

## 📋 Prerequisites

- ✅ Backend running: `http://localhost:3001`
- ✅ Redis running: `docker exec pet_care_redis redis-cli ping` → PONG
- ✅ SMTP configured: Ethereal Email (test account)
- ✅ Database running with migrations applied

### Ethereal Email Credentials
```
Email: violette32@ethereal.email
Password: VvDTyRBXWfDQx8jJnU
Preview URL: Will be logged when email is sent
```

---

## 🧪 Test 1: Password Reset Email

### Scenario
Test password reset email sending via `/api/auth/forgot-password` endpoint.

### Steps

**1. Open Postman or curl**
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "violette32@ethereal.email"
  }'
```

**2. Expected Response**
```json
{
  "success": true,
  "message": "Password reset email sent. Check your inbox."
}
```

**3. Verify Email Sent**
- ✓ Check backend logs for: `Email queued successfully for violette32@ethereal.email`
- ✓ Wait 2-3 seconds for queue processing
- ✓ Check logs for: `Email sent successfully via SMTP`
- ✓ Look for Ethereal preview URL in logs

**4. Check Email Log Database**
```sql
SELECT * FROM email_logs 
WHERE recipient = 'violette32@ethereal.email' 
ORDER BY created_at DESC 
LIMIT 1;
```

Expected result:
```
emailLogId | recipient | emailType | subject | status | created_at
1          | violette32@ethereal.email | password_reset | Đặt lại mật khẩu... | sent | 2026-01-12...
```

**5. View Email Preview**
- Open the Ethereal preview URL from logs
- Verify email content:
  - ✓ Subject: "Đặt lại mật khẩu - PAW LOVERS"
  - ✓ Contains reset link
  - ✓ Vietnamese content
  - ✓ Footer with company info

---

## 🧪 Test 2: Registration Success Email

### Scenario
Test registration confirmation email for new pet owner.

### Steps

**1. Create new pet owner account**
```bash
curl -X POST http://localhost:3001/api/pet-owners \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phoneNumber": "0912345678",
    "email": "violette32@ethereal.email",
    "password": "Test@1234",
    "address": "123 Test Street"
  }'
```

**2. Expected Response**
```json
{
  "message": "Pet owner created successfully",
  "data": { ... }
}
```

**3. Verify Email Sent**
- ✓ Check logs for: `Email queued successfully`
- ✓ Check logs for: `Email sent successfully via SMTP`
- ✓ Get Ethereal preview URL

**4. Verify Email Log**
```sql
SELECT * FROM email_logs 
WHERE email_type = 'registration_success' 
ORDER BY created_at DESC 
LIMIT 1;
```

**5. Check Email Content**
- ✓ Subject: "Chào mừng bạn đến với PAW LOVERS"
- ✓ Personalized greeting with user name
- ✓ Login instructions
- ✓ Service description

---

## 🧪 Test 3: Appointment Reminder Email

### Scenario
Test appointment reminder that runs every 6 hours (cron job).

### Manual Testing Approach

**1. Create appointment for tomorrow**
```bash
# First, get pet ID for test user
GET http://localhost:3001/api/pets/me

# Create appointment
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "petId": 1,
    "employeeId": 1,
    "serviceId": 1,
    "appointmentDate": "2026-01-13",
    "startTime": "10:00",
    "endTime": "11:00",
    "notes": "Test appointment"
  }'
```

**2. Verify appointment created**
```json
Response should show:
{
  "appointmentId": 1,
  "status": "PENDING",
  ...
}
```

**3. Confirm appointment**
```bash
curl -X PUT http://localhost:3001/api/appointments/1/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**4. Check appointment reminder email**
- ✓ Cron job runs every 6 hours
- ✓ Or manually trigger via endpoint (if available)
- ✓ Check email log for appointment_reminder type
- ✓ Verify email contains:
  - Pet name
  - Appointment date & time
  - Service name
  - Veterinarian name

---

## 🧪 Test 4: Appointment Status Update Email

### Scenario
Test email sent when appointment status changes.

### Steps

**1. Confirm appointment (from Test 3)**
```bash
curl -X PUT http://localhost:3001/api/appointments/1/confirm \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**2. Verify email sent**
- ✓ Check logs for: `Email queued successfully`
- ✓ Email type should be: `appointment_status_update`
- ✓ Status should be: `sent`

**3. Check email content**
- ✓ Subject: "Cập nhật lịch hẹn - PAW LOVERS"
- ✓ Contains new status: "CONFIRMED"
- ✓ Appointment details

**4. Cancel appointment to test cancellation email**
```bash
curl -X PUT http://localhost:3001/api/appointments/1/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reason": "Pet owner cancelled"
  }'
```

**5. Verify cancellation email**
- ✓ New email log entry with status: `CANCELLED`
- ✓ Email contains cancellation reason
- ✓ Offers option to reschedule

---

## 🧪 Test 5: Payment Confirmation Email

### Scenario
Test payment confirmation email after successful VNPay payment.

### Steps

**1. Initiate VNPay payment**
```bash
curl -X POST http://localhost:3001/api/payments/online/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "invoiceId": 1,
    "paymentMethod": "VNPAY",
    "amount": 500000
  }'
```

**2. Simulate VNPay callback (in development)**
- Use VNPay sandbox credentials
- Complete payment flow
- Or simulate callback via test endpoint (if available)

**3. Verify payment confirmation email**
- ✓ Email type: `payment_confirmation`
- ✓ Status: `sent`
- ✓ Contains:
  - Transaction ID
  - Amount
  - Payment method
  - Payment date

**4. Check email log**
```sql
SELECT * FROM email_logs 
WHERE email_type = 'payment_confirmation' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🧪 Test 6: Medical Record Notification Email

### Scenario
Test email sent when veterinarian creates medical record.

### Steps

**1. Create medical record**
```bash
curl -X POST http://localhost:3001/api/medical-records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VET_TOKEN" \
  -d '{
    "petId": 1,
    "appointmentId": 1,
    "veterinarianId": 1,
    "diagnosis": "Tiêu chảy",
    "treatment": "Kháng sinh + chế độ ăn"
  }'
```

**2. Verify email sent**
- ✓ Email type: `medical_record_notification`
- ✓ Recipient: Pet owner email
- ✓ Status: `sent`

**3. Check email content**
- ✓ Subject: Contains pet name
- ✓ Contains diagnosis
- ✓ Contains treatment recommendations
- ✓ Veterinarian name

---

## 📊 Email Log Query Examples

### View all sent emails
```sql
SELECT recipient, email_type, subject, status, created_at 
FROM email_logs 
WHERE status = 'sent' 
ORDER BY created_at DESC 
LIMIT 10;
```

### View failed emails
```sql
SELECT recipient, email_type, subject, error_message, retry_count 
FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

### View emails by type
```sql
SELECT COUNT(*) as count, email_type, status 
FROM email_logs 
GROUP BY email_type, status 
ORDER BY count DESC;
```

### View email stats for today
```sql
SELECT email_type, status, COUNT(*) 
FROM email_logs 
WHERE created_at::date = CURRENT_DATE 
GROUP BY email_type, status;
```

---

## 🔍 Debugging Guide

### Issue: Email not sending

**Check 1: Is Redis running?**
```bash
docker exec pet_care_redis redis-cli ping
# Should return: PONG
```

**Check 2: Is backend running?**
```bash
# Should see logs like:
# [Nest] 12345 - 01/12/2026, 4:25:37 PM LOG Application is running on: http://localhost:3001
```

**Check 3: Check email queue status**
```bash
# In backend logs, look for:
# EmailService: Email queued successfully for [email]
```

**Check 4: Check email processor logs**
```bash
# Look for:
# EmailQueueProcessor: Email sent successfully
# Or error message if failed
```

### Issue: Email sent but not visible in Ethereal

**Solution:** Ethereal URLs have limited lifetime
- The preview URL is logged in backend logs
- Each email gets a new preview URL
- Check logs immediately after sending
- Or check Ethereal inbox directly at: https://ethereal.email

### Issue: Template not rendering

**Check:** Template file exists
```bash
ls -la src/templates/emails/
# Should show all .hbs files
```

**Check:** Template variables match
- Review `context` in EmailService method
- Compare with variables used in `.hbs` file
- Verify spelling matches exactly

### Issue: SMTP authentication failed

**Check 1:** .env credentials
```bash
cat .env | grep MAIL_
# Verify values match Ethereal credentials
```

**Check 2:** Ethereal account active
- Visit: https://ethereal.email
- Login with credentials
- Verify account not expired

---

## ✅ Testing Checklist

### Phase 1: Basic Setup
- [ ] Backend running
- [ ] Redis running
- [ ] .env configured with Ethereal
- [ ] Database connected
- [ ] Email module loaded

### Phase 2: Password Reset
- [ ] Email queued successfully
- [ ] Email sent to queue processor
- [ ] Email log created in database
- [ ] Email preview URL generated
- [ ] Email content correct
- [ ] Reset link valid

### Phase 3: Registration
- [ ] New account created
- [ ] Email queued automatically
- [ ] Email contains welcome message
- [ ] Login link works

### Phase 4: Appointment
- [ ] Appointment created
- [ ] Status update email sent
- [ ] Cron job detected in logs
- [ ] Email contains all details
- [ ] Cancellation email sent

### Phase 5: Payment
- [ ] Payment initiated
- [ ] Callback received
- [ ] Confirmation email sent
- [ ] Email contains transaction details

### Phase 6: Medical Record
- [ ] Medical record created
- [ ] Pet owner notified
- [ ] Email contains diagnosis
- [ ] Email properly formatted

### Phase 7: Production Ready
- [ ] All 7 email types tested
- [ ] 0 errors in logs
- [ ] Email delivery rate 100%
- [ ] Response times acceptable
- [ ] Error handling working
- [ ] Retry mechanism verified

---

## 🚀 Next Steps After Testing

1. **Fix any failing tests** - Debug using guide above
2. **Optimize email templates** - Update styling/content if needed
3. **Setup production SMTP** - Replace Ethereal with SendGrid/Gmail
4. **Configure monitoring** - Setup alerts for failed emails
5. **Load testing** - Test with 100+ concurrent emails
6. **Documentation** - Update API docs with email details

---

## 📝 Test Results Log

Use this section to record your test results:

```
Date: __________
Tester: ________

Test 1 - Password Reset: _____ (PASS/FAIL)
Test 2 - Registration: _____ (PASS/FAIL)
Test 3 - Appointment Reminder: _____ (PASS/FAIL)
Test 4 - Appointment Status: _____ (PASS/FAIL)
Test 5 - Payment Confirmation: _____ (PASS/FAIL)
Test 6 - Medical Record: _____ (PASS/FAIL)

Overall Status: _____ (PASS/FAIL)
Issues Found: 
- 
- 

Notes:
```

---

**Last Updated:** January 12, 2026  
**Status:** Ready for Testing  
**Methodology:** Chậm mà chắc - Đảm bảo không có lỗi ✅
