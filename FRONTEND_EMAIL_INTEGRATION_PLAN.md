# 📧 KẾ HOẠCH TÍCH HỢP EMAIL VÀO FRONTEND

**Dự án:** PAW LOVERS Pet Care Management System  
**Module:** Frontend Email Integration  
**Nguyên tắc:** Chậm mà chắc - Đảm bảo 0 lỗi  
**Ngày:** 12/01/2026  

---

## 📋 MỤC LỤC

1. [Phân Tích Tổng Quan](#1-phân-tích-tổng-quan)
2. [Mapping Email Types với UI Flows](#2-mapping-email-types-với-ui-flows)
3. [Kiến Trúc Frontend Integration](#3-kiến-trúc-frontend-integration)
4. [Implementation Phases](#4-implementation-phases)
5. [Chi Tiết Từng Phase](#5-chi-tiết-từng-phase)
6. [Testing Strategy](#6-testing-strategy)
7. [Error Handling](#7-error-handling)
8. [Best Practices](#8-best-practices)

---

## 1. PHÂN TÍCH TỔNG QUAN

### 1.1. Email Types và Trạng Thái Backend

| # | Email Type | Backend Status | Frontend Trigger | User Role |
|---|------------|----------------|------------------|-----------|
| 1 | Password Reset | ✅ Working | Login/Profile Page | All |
| 2 | Registration | ✅ Working | Register Page | Pet Owner |
| 3 | Appointment Reminder | ✅ Scheduled | Auto (Cron) | Pet Owner |
| 4 | Appointment Update | ✅ Ready | Appointment Management | All |
| 5 | Payment Confirmation | ✅ Ready | Payment Page | Pet Owner |
| 6 | Payment Failed | ✅ Ready | Payment Callback | Pet Owner |
| 7 | Medical Record | ✅ Ready | Medical Record Form | Vet → Owner |

### 1.2. Frontend Framework

**Tech Stack Hiện Tại:**
- Framework: Next.js 14 (App Router)
- UI Library: React + Tailwind CSS
- State Management: React Context/Hooks
- HTTP Client: fetch/axios
- Form Handling: React Hook Form (nếu có)

**Workspace Structure:**
```
do-an-thu-cung/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   └── dashboard/
│       ├── owner/
│       ├── receptionist/
│       ├── vet/
│       └── manager/
├── components/
│   ├── forms/
│   ├── modals/
│   └── ui/
└── lib/
    ├── api/
    └── utils/
```

### 1.3. Integration Points Cần Có

1. **API Service Layer** - Centralized API calls
2. **Toast/Notification System** - User feedback
3. **Loading States** - UX during API calls
4. **Error Handling** - Graceful error messages
5. **Form Validation** - Client-side validation
6. **Success Confirmation** - Visual feedback

---

## 2. MAPPING EMAIL TYPES VỚI UI FLOWS

### 2.1. Password Reset Email ✅

**UI Flow:**
```
Login Page
    ↓
[Quên mật khẩu?] Link
    ↓
Forgot Password Modal/Page
    ↓
Nhập Email + Submit
    ↓
API: POST /api/auth/forgot-password
    ↓
Success Toast: "Email đặt lại mật khẩu đã được gửi!"
    ↓
Redirect về Login với message
```

**Frontend Components Cần:**
- `ForgotPasswordForm.jsx` (hoặc page)
- `EmailInput.jsx` component
- Toast notification
- Success message display

**API Integration:**
```javascript
// lib/api/auth.js
export async function requestPasswordReset(email) {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (!response.ok) throw new Error('Failed to send reset email');
  return response.json();
}
```

---

### 2.2. Registration Confirmation Email ✅

**UI Flow:**
```
Landing Page
    ↓
[Đăng ký] Button
    ↓
Registration Form
    ↓
Fill: Email, Password, Họ tên, SĐT, Địa chỉ
    ↓
API: POST /api/pet-owners/register
    ↓
Success: "Đăng ký thành công! Kiểm tra email để xác nhận."
    ↓
Redirect to Login với success message
```

**Frontend Components Cần:**
- `RegisterForm.jsx`
- Multi-step form (optional)
- Email verification notice
- Success modal/toast

**API Integration:**
```javascript
// lib/api/auth.js
export async function registerPetOwner(userData) {
  const response = await fetch('/api/pet-owners/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  return response.json();
}
```

---

### 2.3. Appointment Status Update Email

**UI Flow (Receptionist/Manager):**
```
Dashboard → Appointments List
    ↓
Select Appointment
    ↓
[Xác nhận] / [Hoàn thành] / [Hủy] Button
    ↓
Confirmation Modal
    ↓
API: PUT /api/appointments/:id/confirm
    ↓
Success: "Lịch hẹn đã được cập nhật. Email thông báo đã gửi!"
    ↓
Refresh appointment list
```

**UI Flow (Pet Owner):**
```
Dashboard → My Appointments
    ↓
View appointment details
    ↓
See status updates (auto-refresh or WebSocket)
    ↓
Bell icon notification: "Lịch hẹn của bạn đã được xác nhận"
```

**Frontend Components Cần:**
- `AppointmentStatusButton.jsx`
- `ConfirmationModal.jsx`
- `AppointmentCard.jsx` (with status badge)
- Notification bell component

**API Integration:**
```javascript
// lib/api/appointments.js
export async function updateAppointmentStatus(appointmentId, status) {
  const response = await fetch(`/api/appointments/${appointmentId}/${status}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to update appointment');
  return response.json();
}
```

---

### 2.4. Payment Confirmation Email

**UI Flow:**
```
Invoice/Bill Page
    ↓
[Thanh toán] Button
    ↓
Payment Method Selection Modal
    ↓
Option 1: Cash Payment (Staff)
    ↓
    Confirm cash received
    ↓
    API: POST /api/payments
    ↓
    Success: "Thanh toán thành công! Email xác nhận đã gửi."

Option 2: VNPay (Owner)
    ↓
    Redirect to VNPay
    ↓
    Payment Processing
    ↓
    Return URL callback
    ↓
    API: GET /api/payments/vnpay/callback
    ↓
    Success page: "Thanh toán thành công! Kiểm tra email."
```

**Frontend Components Cần:**
- `PaymentModal.jsx`
- `PaymentMethodSelector.jsx`
- `VNPayRedirect.jsx`
- `PaymentSuccessPage.jsx`
- `InvoiceDetails.jsx`

**API Integration:**
```javascript
// lib/api/payments.js
export async function processPayment(paymentData) {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(paymentData)
  });
  
  if (!response.ok) throw new Error('Payment failed');
  return response.json();
}

export async function initiateVNPayPayment(invoiceId) {
  const response = await fetch('/api/payments/online/initiate', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ invoiceId })
  });
  
  const data = await response.json();
  window.location.href = data.data.paymentUrl; // Redirect to VNPay
}
```

---

### 2.5. Medical Record Notification Email

**UI Flow (Veterinarian):**
```
Dashboard → Pet Medical Records
    ↓
Select Pet
    ↓
[Tạo hồ sơ y tế mới] Button
    ↓
Medical Record Form
    ↓
Fill: Chẩn đoán, Điều trị, Đơn thuốc, Lịch tái khám
    ↓
API: POST /api/medical-records
    ↓
Success: "Hồ sơ y tế đã tạo. Email thông báo gửi chủ thú cưng!"
    ↓
Redirect to medical records list
```

**UI Flow (Pet Owner):**
```
Dashboard → My Pets
    ↓
Select Pet → Medical History Tab
    ↓
See new medical record (with "New" badge)
    ↓
Bell notification: "Hồ sơ y tế mới cho Buddy"
```

**Frontend Components Cần:**
- `MedicalRecordForm.jsx`
- `PetMedicalHistory.jsx`
- `MedicalRecordCard.jsx`
- Notification badge

**API Integration:**
```javascript
// lib/api/medical-records.js
export async function createMedicalRecord(recordData) {
  const response = await fetch('/api/medical-records', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(recordData)
  });
  
  if (!response.ok) throw new Error('Failed to create medical record');
  return response.json();
}
```

---

## 3. KIẾN TRÚC FRONTEND INTEGRATION

### 3.1. API Service Layer

**Cấu trúc thư mục:**
```
lib/
├── api/
│   ├── index.js              # Base API client
│   ├── auth.js               # Authentication APIs
│   ├── appointments.js       # Appointment APIs
│   ├── payments.js           # Payment APIs
│   ├── medical-records.js    # Medical record APIs
│   └── pet-owners.js         # Pet owner APIs
├── contexts/
│   ├── AuthContext.jsx       # Auth state
│   └── NotificationContext.jsx # Toast notifications
└── utils/
    ├── api-client.js         # HTTP client wrapper
    └── error-handler.js      # Centralized error handling
```

### 3.2. Base API Client

```javascript
// lib/utils/api-client.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new APIError(error.message, response.status, error);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const apiClient = new APIClient();
```

### 3.3. Notification Context

```javascript
// lib/contexts/NotificationContext.jsx
'use client';

import { createContext, useContext, useState } from 'react';
import Toast from '@/components/ui/Toast';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const success = (message) => addNotification(message, 'success');
  const error = (message) => addNotification(message, 'error');
  const info = (message) => addNotification(message, 'info');
  const warning = (message) => addNotification(message, 'warning');

  return (
    <NotificationContext.Provider value={{ success, error, info, warning }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notif => (
          <Toast key={notif.id} {...notif} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
```

---

## 4. IMPLEMENTATION PHASES

### Phase 1: Foundation Setup (Week 1) 🏗️

**Objective:** Chuẩn bị infrastructure cơ bản

**Tasks:**
1. ✅ Setup API client layer
2. ✅ Create notification context
3. ✅ Create base UI components (Toast, Modal, Button)
4. ✅ Setup error handling utilities
5. ✅ Configure environment variables
6. ✅ Create API service files structure

**Deliverables:**
- `lib/utils/api-client.js`
- `lib/contexts/NotificationContext.jsx`
- `components/ui/Toast.jsx`
- `components/ui/Modal.jsx`
- `.env.local` configured

**Testing:**
- API client connects to backend
- Toast notifications display correctly
- Error handling works

---

### Phase 2: Authentication Flow (Week 2) 🔐

**Objective:** Tích hợp Password Reset và Registration emails

**Tasks:**

#### 2.1. Password Reset
1. Create `app/(auth)/forgot-password/page.jsx`
2. Create `components/forms/ForgotPasswordForm.jsx`
3. Implement API call `lib/api/auth.js`
4. Add validation and error handling
5. Add success state and redirect
6. Test với email thật

#### 2.2. Registration Enhancement
1. Update `app/(auth)/register/page.jsx`
2. Enhance `RegisterForm.jsx` với email notice
3. Add post-registration success message
4. Show "Check your email" notification
5. Test registration flow hoàn chỉnh

**Deliverables:**
- Forgot password page functional
- Registration với email confirmation notice
- Both flows tested với real emails

**Testing Checklist:**
- [ ] Enter invalid email → Show error
- [ ] Enter valid email → Success message
- [ ] Check Gmail inbox → Email received
- [ ] Click reset link → Reset password page works
- [ ] Register new user → Email received
- [ ] All error cases handled gracefully

---

### Phase 3: Appointment Management (Week 3-4) 📅

**Objective:** Tích hợp Appointment Status Update emails

**Tasks:**

#### 3.1. Receptionist/Manager View
1. Update `dashboard/receptionist/appointments/page.jsx`
2. Create `components/appointments/AppointmentCard.jsx`
3. Add status update buttons (Confirm, Complete, Cancel)
4. Create confirmation modal
5. Implement API calls for status updates
6. Add loading states and success feedback

#### 3.2. Pet Owner View
1. Update `dashboard/owner/appointments/page.jsx`
2. Show appointment status with color badges
3. Add notification bell icon
4. Implement status change notifications
5. Add auto-refresh or polling for updates

**Deliverables:**
- Appointment management UI complete
- Status update triggers emails
- Pet owners see real-time updates
- Email notifications working

**Testing Checklist:**
- [ ] Receptionist can confirm appointment → Email sent
- [ ] Vet can complete appointment → Email sent
- [ ] User can cancel appointment → Email sent
- [ ] Pet owner sees updated status
- [ ] All emails received correctly

---

### Phase 4: Payment Integration (Week 5-6) 💰

**Objective:** Tích hợp Payment Confirmation emails

**Tasks:**

#### 4.1. Cash Payment (Staff)
1. Create `components/payments/PaymentModal.jsx`
2. Add cash payment recording
3. Implement API call to create payment
4. Show success message with email notice
5. Update invoice status in UI

#### 4.2. VNPay Integration (Pet Owner)
1. Create VNPay payment initiation flow
2. Handle redirect to VNPay
3. Create callback handler page
4. Handle success/failure scenarios
5. Show appropriate messages and emails

**Deliverables:**
- Cash payment flow complete
- VNPay integration functional
- Payment confirmation emails sent
- Payment failed emails triggered correctly

**Testing Checklist:**
- [ ] Staff records cash payment → Email sent
- [ ] Pet owner initiates VNPay → Redirected
- [ ] VNPay success → Email sent
- [ ] VNPay failure → Email sent
- [ ] Invoice status updated correctly

---

### Phase 5: Medical Records (Week 7) 🏥

**Objective:** Tích hợp Medical Record Notification emails

**Tasks:**

#### 5.1. Veterinarian View
1. Create `dashboard/vet/medical-records/page.jsx`
2. Create `components/medical/MedicalRecordForm.jsx`
3. Implement create medical record API
4. Add success notification
5. Show email confirmation message

#### 5.2. Pet Owner View
1. Update `dashboard/owner/pets/[id]/medical-history`
2. Show medical records list
3. Add "New" badge for recent records
4. Display notification for new records

**Deliverables:**
- Vet can create medical records
- Pet owners receive email notifications
- Medical history visible to owners
- All flows tested

**Testing Checklist:**
- [ ] Vet creates medical record → Email sent
- [ ] Pet owner receives email
- [ ] Pet owner sees record in dashboard
- [ ] Record details displayed correctly

---

### Phase 6: Polish & Optimization (Week 8) ✨

**Objective:** Hoàn thiện UX và performance

**Tasks:**
1. Add loading skeletons
2. Optimize API calls (caching, debouncing)
3. Add retry logic for failed requests
4. Improve error messages (Vietnamese)
5. Add accessibility features
6. Mobile responsive testing
7. Performance audit
8. Security review

**Deliverables:**
- Smooth UX với loading states
- Fast and responsive UI
- Graceful error handling
- Mobile-friendly
- Production-ready

---

## 5. CHI TIẾT TỪNG PHASE

### Phase 2 Detail: Password Reset Implementation

#### Step 1: Create Forgot Password Page

```jsx
// app/(auth)/forgot-password/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';
import { useNotification } from '@/lib/contexts/NotificationContext';
import { requestPasswordReset } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { success, error } = useNotification();
  const router = useRouter();

  const handleSubmit = async (email) => {
    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
      success('Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.');
      
      // Redirect sau 3 giây
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      error(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-green-500 mb-4">
            <svg className="w-16 h-16 mx-auto" /* Check icon *//>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Email Đã Được Gửi!
          </h2>
          <p className="text-gray-600 mb-4">
            Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
          </p>
          <p className="text-sm text-gray-500">
            Đang chuyển về trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Quên Mật Khẩu?
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>
        <ForgotPasswordForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
```

#### Step 2: Create Form Component

```jsx
// components/forms/ForgotPasswordForm.jsx
'use client';

import { useState } from 'react';
import { z } from 'zod';

const emailSchema = z.string().email('Email không hợp lệ');

export default function ForgotPasswordForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    try {
      emailSchema.parse(email);
    } catch (err) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={loading}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" /* Spinner icon *//>
            Đang gửi...
          </span>
        ) : (
          'Gửi Email Đặt Lại Mật Khẩu'
        )}
      </button>

      <div className="text-center">
        <a href="/login" className="text-sm text-blue-600 hover:text-blue-700">
          Quay lại đăng nhập
        </a>
      </div>
    </form>
  );
}
```

#### Step 3: API Service

```javascript
// lib/api/auth.js
import { apiClient } from '@/lib/utils/api-client';

export async function requestPasswordReset(email) {
  return await apiClient.post('/api/auth/forgot-password', { email });
}

export async function resetPassword(token, newPassword) {
  return await apiClient.post('/api/auth/reset-password', {
    token,
    newPassword
  });
}

export async function login(email, password) {
  const response = await apiClient.post('/api/auth/login', {
    email,
    password
  });
  
  // Save token
  if (response.data?.accessToken) {
    localStorage.setItem('accessToken', response.data.accessToken);
  }
  
  return response;
}

export async function logout() {
  localStorage.removeItem('accessToken');
  await apiClient.post('/api/auth/logout');
}
```

---

## 6. TESTING STRATEGY

### 6.1. Unit Testing

**Tools:** Jest + React Testing Library

```javascript
// __tests__/components/ForgotPasswordForm.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
  it('shows validation error for invalid email', async () => {
    const onSubmit = jest.fn();
    render(<ForgotPasswordForm onSubmit={onSubmit} />);
    
    const input = screen.getByLabelText('Email');
    const button = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/email không hợp lệ/i)).toBeInTheDocument();
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid email', async () => {
    const onSubmit = jest.fn().mockResolvedValue({});
    render(<ForgotPasswordForm onSubmit={onSubmit} />);
    
    const input = screen.getByLabelText('Email');
    const button = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('test@example.com');
    });
  });
});
```

### 6.2. Integration Testing

**Manual Test Cases:**

**Test Case 1: Password Reset Flow**
```
Pre-conditions:
- Backend running
- Email service configured
- User với email trggg2004@gmail.com tồn tại

Steps:
1. Navigate to /forgot-password
2. Enter email: trggg2004@gmail.com
3. Click "Gửi Email"
4. Verify success message displayed
5. Check Gmail inbox
6. Verify email received within 5 seconds
7. Click reset link in email
8. Verify redirected to reset password page
9. Enter new password
10. Verify password updated successfully

Expected Results:
- Success message shows immediately
- Email arrives within 5 seconds
- Reset link works correctly
- Password updated successfully
- Can login with new password

Actual Results:
[To be filled during testing]

Status: ☐ Pass ☐ Fail
```

### 6.3. E2E Testing

**Tools:** Playwright or Cypress

```javascript
// e2e/auth/forgot-password.spec.js
import { test, expect } from '@playwright/test';

test.describe('Forgot Password Flow', () => {
  test('should send reset email successfully', async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('/forgot-password');
    
    // Fill email
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Email Đã Được Gửi')).toBeVisible();
    
    // Should redirect to login after delay
    await page.waitForURL('/login', { timeout: 5000 });
  });
});
```

---

## 7. ERROR HANDLING

### 7.1. Error Categories

```javascript
// lib/utils/error-handler.js
export const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTH_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

export function handleError(error) {
  if (!navigator.onLine) {
    return {
      type: ErrorType.NETWORK,
      message: 'Không có kết nối internet. Vui lòng kiểm tra và thử lại.'
    };
  }

  if (error.status === 401) {
    return {
      type: ErrorType.AUTH,
      message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
    };
  }

  if (error.status === 400) {
    return {
      type: ErrorType.VALIDATION,
      message: error.data?.message || 'Dữ liệu không hợp lệ.'
    };
  }

  if (error.status >= 500) {
    return {
      type: ErrorType.SERVER,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
  };
}
```

### 7.2. User-Friendly Error Messages

```javascript
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Không thể kết nối đến server. Vui lòng kiểm tra internet.',
  
  // Auth errors
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  UNAUTHORIZED: 'Bạn không có quyền thực hiện thao tác này.',
  
  // Validation errors
  INVALID_EMAIL: 'Email không hợp lệ.',
  EMAIL_EXISTS: 'Email này đã được đăng ký.',
  REQUIRED_FIELD: 'Vui lòng điền đầy đủ thông tin.',
  
  // Email errors
  EMAIL_SEND_FAILED: 'Không thể gửi email. Vui lòng thử lại sau.',
  EMAIL_NOT_FOUND: 'Email không tồn tại trong hệ thống.',
  
  // Generic
  UNKNOWN_ERROR: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
};
```

---

## 8. BEST PRACTICES

### 8.1. Code Organization

```
✅ DO:
- Group related components together
- Use consistent naming conventions
- Create reusable UI components
- Separate business logic from UI
- Use TypeScript for type safety
- Write descriptive comments

❌ DON'T:
- Put all code in one file
- Mix API calls with UI code
- Hardcode strings (use i18n)
- Ignore error cases
- Skip input validation
```

### 8.2. Performance Optimization

```javascript
// Use React.memo for expensive components
const MedicalRecordCard = React.memo(({ record }) => {
  return <div>{/* ... */}</div>;
});

// Debounce search inputs
const debouncedSearch = useDebouncedCallback((value) => {
  searchAppointments(value);
}, 500);

// Lazy load heavy components
const PaymentModal = lazy(() => import('./PaymentModal'));
```

### 8.3. Accessibility

```jsx
// Always include labels
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-required="true" />

// Use semantic HTML
<button type="submit">Submit</button> // Not <div onClick>

// Add ARIA labels
<button aria-label="Close modal">×</button>

// Handle keyboard navigation
<div role="dialog" aria-modal="true">
```

### 8.4. Security

```javascript
// Sanitize user input
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);

// Validate on both client and server
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Don't expose sensitive data
// ❌ console.log(user.password)
// ✅ console.log({ userId: user.id })

// Use HTTPS only
const API_URL = process.env.NEXT_PUBLIC_API_URL; // https://...
```

---

## 9. TIMELINE & MILESTONES

### Tổng Thời Gian: 8 Weeks

| Phase | Duration | Status | Deliverables |
|-------|----------|--------|--------------|
| Phase 1: Foundation | Week 1 | 🟡 Planned | API client, Notification system |
| Phase 2: Authentication | Week 2 | 🟡 Planned | Password reset, Registration |
| Phase 3: Appointments | Week 3-4 | 🟡 Planned | Appointment management |
| Phase 4: Payments | Week 5-6 | 🟡 Planned | Payment flows |
| Phase 5: Medical Records | Week 7 | 🟡 Planned | Medical record creation |
| Phase 6: Polish | Week 8 | 🟡 Planned | Final optimization |

### Weekly Checkpoints

**Week 1 End:**
- ✅ API client working
- ✅ Toast notifications implemented
- ✅ Base components created

**Week 2 End:**
- ✅ Forgot password working
- ✅ Registration sending emails
- ✅ Both tested with real emails

**Week 3-4 End:**
- ✅ Appointment status updates working
- ✅ Emails sent on status change
- ✅ UI shows real-time updates

**Week 5-6 End:**
- ✅ Cash payment flow complete
- ✅ VNPay integration working
- ✅ Payment emails sending

**Week 7 End:**
- ✅ Medical record creation working
- ✅ Pet owners receive notifications
- ✅ All email types tested

**Week 8 End:**
- ✅ All features polished
- ✅ Performance optimized
- ✅ Production ready

---

## 10. SUCCESS CRITERIA

### Definition of Done

Mỗi feature được coi là hoàn thành khi:

✅ **Code Complete:**
- Component implementation finished
- API integration working
- Error handling implemented
- Loading states added

✅ **Testing Complete:**
- Unit tests passing (if applicable)
- Manual testing done
- Edge cases covered
- Email delivery verified

✅ **UX Complete:**
- Loading indicators present
- Success/error messages show
- Responsive on mobile
- Accessible (keyboard navigation)

✅ **Documentation Complete:**
- Code comments added
- Component usage documented
- API integration documented

### Acceptance Criteria

**Password Reset:**
- [ ] User can request password reset
- [ ] Email received within 5 seconds
- [ ] Reset link works correctly
- [ ] Success message shows
- [ ] Errors handled gracefully

**Registration:**
- [ ] User can register successfully
- [ ] Welcome email received
- [ ] Email notice displayed
- [ ] Validation works
- [ ] Redirect to login works

**Appointments:**
- [ ] Staff can update status
- [ ] Pet owner receives email
- [ ] Status shows in UI
- [ ] All status types work
- [ ] Confirmation modals work

**Payments:**
- [ ] Cash payment records correctly
- [ ] VNPay redirect works
- [ ] Payment emails sent
- [ ] Invoice updates
- [ ] Both success/fail handled

**Medical Records:**
- [ ] Vet can create records
- [ ] Pet owner receives email
- [ ] Records display correctly
- [ ] All fields save properly
- [ ] Validation works

---

## 11. RISK MANAGEMENT

### Potential Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Backend API changes | Medium | High | Version API endpoints, use contracts |
| Email delivery failures | Low | Medium | Implement retry logic, show fallback |
| Network timeout | Medium | Medium | Add timeout handling, retry button |
| Browser compatibility | Low | Low | Test on major browsers, use polyfills |
| Performance issues | Medium | High | Code splitting, lazy loading, caching |

### Contingency Plans

**If Backend API Changes:**
- Use API versioning (/api/v1/)
- Create adapter layer
- Maintain backwards compatibility

**If Email Delivery Slow:**
- Show immediate UI feedback
- Don't block on email send
- Add "Email sending..." indicator

**If Network Issues:**
- Cache API responses
- Implement offline support (if needed)
- Show retry button

---

## 12. RESOURCES NEEDED

### Development Tools
- ✅ VS Code
- ✅ Node.js v18+
- ✅ Git
- ✅ Chrome DevTools

### Libraries to Install
```bash
npm install axios                    # HTTP client (alternative to fetch)
npm install zod                      # Schema validation
npm install react-hook-form          # Form management (optional)
npm install @headlessui/react        # Accessible UI components
npm install react-hot-toast          # Toast notifications (alternative)
npm install clsx tailwind-merge      # Utility for conditional classes
```

### Testing Tools
```bash
npm install -D jest @testing-library/react
npm install -D @playwright/test     # E2E testing
npm install -D cypress              # Alternative E2E testing
```

### Documentation
- Backend API documentation (Swagger)
- Email templates preview
- Design mockups (if available)
- User flow diagrams

---

## 13. COMMUNICATION PLAN

### Daily Standup
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

### Weekly Review
- Demo completed features
- Review code quality
- Discuss challenges
- Plan next week

### Issue Tracking
- Use GitHub Issues or Jira
- Tag: `email-integration`
- Priority: High/Medium/Low
- Assign to developers

---

## 14. FINAL CHECKLIST

### Before Starting Development

- [ ] Backend API fully functional and tested
- [ ] API documentation available
- [ ] Design mockups reviewed
- [ ] Development environment setup
- [ ] Git repository initialized
- [ ] Project dependencies installed
- [ ] Environment variables configured
- [ ] Team alignment on approach

### During Development

- [ ] Follow git workflow (feature branches)
- [ ] Write clean, documented code
- [ ] Test each feature thoroughly
- [ ] Handle all error cases
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] Performance optimized
- [ ] Code reviewed by team

### Before Production Deployment

- [ ] All features tested end-to-end
- [ ] No console errors
- [ ] Mobile tested on real devices
- [ ] Cross-browser tested
- [ ] Performance audit passed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Backup plan ready

---

## 📚 APPENDIX

### A. Example API Responses

**Success Response:**
```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2026-01-12T12:00:00.000Z",
  "path": "/api/auth/forgot-password"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Validation error",
  "data": null,
  "timestamp": "2026-01-12T12:00:00.000Z",
  "path": "/api/auth/forgot-password"
}
```

### B. Component Template

```jsx
// components/template/ComponentTemplate.jsx
'use client';

import { useState } from 'react';
import { useNotification } from '@/lib/contexts/NotificationContext';

export default function ComponentTemplate({ prop1, prop2 }) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useNotification();

  const handleAction = async () => {
    setLoading(true);
    try {
      // API call here
      success('Action completed successfully!');
    } catch (err) {
      error(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="component-container">
      {/* Component content */}
      <button
        onClick={handleAction}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Loading...' : 'Action'}
      </button>
    </div>
  );
}
```

### C. Useful Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm run start               # Start production server

# Testing
npm test                    # Run unit tests
npm run test:e2e            # Run E2E tests
npm run test:coverage       # Generate coverage report

# Code Quality
npm run lint                # Run ESLint
npm run format              # Run Prettier
npm run type-check          # Run TypeScript check
```

---

## 🎯 KẾT LUẬN

Kế hoạch này cung cấp **roadmap chi tiết** để tích hợp email system vào frontend với nguyên tắc **"chậm mà chắc"**.

### Key Points:

✅ **8 phases** được chia nhỏ và có thể quản lý  
✅ **Từng bước** có deliverables rõ ràng  
✅ **Testing strategy** đầy đủ ở mỗi phase  
✅ **Error handling** được plan trước  
✅ **Best practices** được apply từ đầu  

### Next Steps:

1. **Review** plan này với team
2. **Setup** development environment (Phase 1)
3. **Start** với Authentication Flow (Phase 2)
4. **Test** thoroughly ở mỗi step
5. **Iterate** based on feedback

---

**Prepared by:** GitHub Copilot  
**Date:** January 12, 2026  
**Version:** 1.0  
**Status:** 📋 Ready for Implementation
