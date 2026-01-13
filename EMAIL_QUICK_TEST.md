# 📧 Email System - Quick Test Guide

**Status:** ✅ Backend Running | ✅ Redis Running | ✅ SMTP Configured  
**Date:** January 12, 2026  
**Methodology:** Chậm mà chắc (Slow but sure)

---

## 🚀 Quick Start - Test Password Reset Email (2 mins)

### Step 1: Open Swagger UI
- Navigate to: **http://localhost:3001/api/docs**
- Search for: `/api/auth/forgot-password`

### Step 2: Test the Endpoint

1. Click on **POST /api/auth/forgot-password**
2. Click **"Try it out"**
3. In the Request Body, replace with:
```json
{
  "email": "test@ethereal.email"
}
```

4. Click **"Execute"**

### Step 3: Expected Response

```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

### Step 4: Check Backend Logs

Look for logs similar to:
```
[EmailService] Email queued successfully for test@ethereal.email - Type: password_reset
[EmailQueueProcessor] Email sent successfully via SMTP
```

### Step 5: View Email

**Option 1: Via Backend Logs**
- Look for preview URL in logs:
```
Preview URL: https://ethereal.email/message/...
```
- Open the URL in browser to see email preview

**Option 2: Via Database**
```sql
SELECT * FROM email_logs 
WHERE recipient = 'test@ethereal.email' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 📋 Test All 7 Email Types

### Email Type 1: Password Reset ✅
**Endpoint:** `POST /api/auth/forgot-password`  
**Body:**
```json
{
  "email": "test@ethereal.email"
}
```

---

### Email Type 2: Registration Success
**Endpoint:** `POST /api/pet-owners/register`  
**Body:**
```json
{
  "fullName": "Test Owner",
  "phoneNumber": "0912345678",
  "email": "test@ethereal.email",
  "password": "Test@1234"
}
```

---

### Email Type 3: Appointment Reminder
**Endpoint:** Cron job (runs every 6 hours)  
**Manual trigger:** Create appointment for tomorrow with CONFIRMED status

**Steps:**
1. Create appointment for tomorrow
2. Wait for cron job or check logs for:
   ```
   [Nest] ... LOG [AppointmentService] Cron job executed: sendAppointmentReminders
   ```

---

### Email Type 4: Appointment Status Update
**Endpoint:** `PUT /api/appointments/{id}/confirm`  
**or:** `PUT /api/appointments/{id}/cancel`

**Confirmation:**
```bash
curl -X PUT http://localhost:3001/api/appointments/1/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Email Type 5: Payment Confirmation
**Trigger:** Complete VNPay payment successfully

**Check logs for:**
```
[PaymentService] Email queued successfully - Type: payment_confirmation
```

---

### Email Type 6: Payment Failed
**Trigger:** Failed VNPay payment

**Check logs for:**
```
[PaymentService] Email queued successfully - Type: payment_failed
```

---

### Email Type 7: Medical Record Notification
**Endpoint:** `POST /api/medical-records`  
**Body:**
```json
{
  "petId": 1,
  "appointmentId": 1,
  "veterinarianId": 1,
  "diagnosis": "Test diagnosis",
  "treatment": "Test treatment"
}
```

---

## 🔍 Verification Checklist

After each test:

- [ ] **Logs Show Queued:** 
  - Look for: `Email queued successfully`
  - Location: Backend terminal
  
- [ ] **Logs Show Sent:**
  - Look for: `Email sent successfully via SMTP`
  - Location: Backend terminal

- [ ] **Database Entry:**
  - Check `email_logs` table
  - Status should be `sent`

- [ ] **Email Content:**
  - Open Ethereal preview URL
  - Verify Vietnamese content
  - Check for correct variables

---

## 📊 Database Query Examples

### View All Emails
```sql
SELECT recipient, email_type, status, created_at 
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### View Sent Emails Only
```sql
SELECT recipient, email_type, subject, sent_at 
FROM email_logs 
WHERE status = 'sent' 
ORDER BY sent_at DESC;
```

### View Failed Emails
```sql
SELECT recipient, email_type, error_message, retry_count 
FROM email_logs 
WHERE status = 'failed';
```

### Count by Email Type
```sql
SELECT email_type, COUNT(*) as count, 
       COUNT(CASE WHEN status='sent' THEN 1 END) as sent,
       COUNT(CASE WHEN status='failed' THEN 1 END) as failed
FROM email_logs 
GROUP BY email_type;
```

---

## 🐛 Troubleshooting

### Problem: No email logs created

**Solution:**
1. Check Redis is running:
   ```bash
   docker exec pet_care_redis redis-cli ping
   ```
   Should return: `PONG`

2. Check backend logs for errors:
   - Look for: `ERROR`
   - Location: Backend terminal

3. Verify .env SMTP settings:
   ```
   MAIL_HOST=smtp.ethereal.email
   MAIL_USER=violette32@ethereal.email
   MAIL_PASSWORD=VvDTyRBXWfDQx8jJnU
   ```

### Problem: Email shows "failed" in database

**Solution:**
1. Check error message in database:
   ```sql
   SELECT error_message FROM email_logs WHERE status='failed' LIMIT 1;
   ```

2. Common errors:
   - `ECONNREFUSED` → Redis not running
   - `Invalid login` → Check SMTP credentials
   - `Template not found` → Check template files exist

3. Fix and retry:
   - Fix the issue
   - Restart backend: `npm run start:dev`
   - Test again

### Problem: Email preview URL doesn't work

**Solution:**
1. Ethereal URLs expire after 24 hours
2. Check database directly instead:
   ```sql
   SELECT metadata FROM email_logs 
   WHERE recipient='test@ethereal.email' 
   LIMIT 1;
   ```

3. Or manually check Ethereal inbox:
   - Visit: https://ethereal.email
   - Login with credentials
   - View inbox

---

## ✅ Success Criteria

All 7 emails pass if:

- ✅ Endpoint returns success response
- ✅ Logs show "Email queued successfully"
- ✅ Logs show "Email sent successfully"  
- ✅ Email log created in database with status: `sent`
- ✅ Email preview opens without errors
- ✅ Email content is in Vietnamese
- ✅ All variables populated correctly

---

## 📝 Test Results Template

Copy and fill this after running all tests:

```
Date: _______
Tester: _______

Test 1 - Password Reset: _____ ✅/❌
Test 2 - Registration: _____ ✅/❌
Test 3 - Appointment Reminder: _____ ✅/❌
Test 4 - Appointment Status: _____ ✅/❌
Test 5 - Payment Confirmation: _____ ✅/❌
Test 6 - Payment Failed: _____ ✅/❌
Test 7 - Medical Record: _____ ✅/❌

Overall: _____ ✅/❌

Issues Found:
- 
- 

Notes:
```

---

## 🎯 Next Steps

After testing:

1. **All Pass:** ✅ Email system ready for production!
2. **Some Fail:** Debug using troubleshooting section
3. **All Fail:** Check Redis + .env + backend logs

---

**Last Updated:** January 12, 2026  
**Methodology:** Chậm mà chắc ✅
