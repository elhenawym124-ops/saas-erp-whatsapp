# 🔧 API Configuration Guide

## 📋 نظرة عامة

تم إنشاء نظام مركزي لإدارة جميع الـ API URLs والإعدادات في المشروع.
هذا النظام يضمن أنك لن تحتاج أبداً لتعديل الكود عند تغيير البورتات أو الـ URLs.

---

## 🎯 الملفات الرئيسية

### 1. **`src/lib/api.ts`** - الملف المركزي
هذا هو الملف الوحيد الذي يحتوي على جميع إعدادات الـ API.

**المميزات:**
- ✅ Axios instance مع interceptors تلقائية
- ✅ إضافة JWT Token تلقائياً لكل request
- ✅ معالجة أخطاء المصادقة تلقائياً
- ✅ جميع الـ endpoints في مكان واحد
- ✅ دعم WebSocket URLs
- ✅ يعمل على أي بورت بدون تعديل الكود

### 2. **`.env.local`** - متغيرات البيئة
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:8000

# Application
NEXT_PUBLIC_APP_NAME=SaaS ERP System
```

---

## 🚀 كيفية الاستخدام

### **الطريقة الصحيحة ✅**

```typescript
import { apiClient, API_ENDPOINTS } from '@/lib/api';

// GET request
const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.LIST);

// POST request
const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
  email: 'user@example.com',
  password: 'password123'
});

// PUT request with ID
const response = await apiClient.put(
  API_ENDPOINTS.CUSTOMERS.BY_ID('123'),
  { name: 'New Name' }
);

// DELETE request
await apiClient.delete(API_ENDPOINTS.CUSTOMERS.BY_ID('123'));
```

### **الطريقة الخاطئة ❌**

```typescript
// ❌ لا تفعل هذا!
import axios from 'axios';
const response = await axios.get('http://localhost:3000/api/v1/customers');

// ❌ لا تفعل هذا أيضاً!
const response = await axios.get(
  `${process.env.NEXT_PUBLIC_API_URL}/customers`
);
```

---

## 📚 API Endpoints المتاحة

### **Authentication**
```typescript
API_ENDPOINTS.AUTH.LOGIN          // /auth/login
API_ENDPOINTS.AUTH.REGISTER       // /auth/register
API_ENDPOINTS.AUTH.LOGOUT         // /auth/logout
API_ENDPOINTS.AUTH.REFRESH        // /auth/refresh
API_ENDPOINTS.AUTH.ME             // /auth/me
```

### **WhatsApp**
```typescript
API_ENDPOINTS.WHATSAPP.SESSIONS                    // /whatsapp/sessions
API_ENDPOINTS.WHATSAPP.CONTACTS                    // /whatsapp/contacts
API_ENDPOINTS.WHATSAPP.MESSAGES                    // /whatsapp/messages
API_ENDPOINTS.WHATSAPP.SEND_MESSAGE                // /whatsapp/messages/send
API_ENDPOINTS.WHATSAPP.SEND_IMAGE                  // /whatsapp/messages/send-image
API_ENDPOINTS.WHATSAPP.QR('session-name')          // /whatsapp/sessions/{name}/qr
API_ENDPOINTS.WHATSAPP.DELETE_SESSION('session')   // /whatsapp/sessions/{name}
```

### **Customers**
```typescript
API_ENDPOINTS.CUSTOMERS.LIST                // /customers
API_ENDPOINTS.CUSTOMERS.STATISTICS          // /customers/statistics
API_ENDPOINTS.CUSTOMERS.BY_ID('123')        // /customers/123
```

### **Projects**
```typescript
API_ENDPOINTS.PROJECTS.LIST                 // /projects
API_ENDPOINTS.PROJECTS.STATISTICS           // /projects/statistics
API_ENDPOINTS.PROJECTS.BY_ID('123')         // /projects/123
```

### **Tasks**
```typescript
API_ENDPOINTS.TASKS.LIST                    // /tasks
API_ENDPOINTS.TASKS.STATISTICS              // /tasks/statistics
API_ENDPOINTS.TASKS.BY_ID('123')            // /tasks/123
API_ENDPOINTS.TASKS.UPDATE_STATUS('123')    // /tasks/123/status
```

### **Invoices**
```typescript
API_ENDPOINTS.INVOICES.LIST                 // /invoices
API_ENDPOINTS.INVOICES.STATISTICS           // /invoices/statistics
API_ENDPOINTS.INVOICES.BY_ID('123')         // /invoices/123
API_ENDPOINTS.INVOICES.UPDATE_STATUS('123') // /invoices/123/status
```

### **Expenses**
```typescript
API_ENDPOINTS.EXPENSES.LIST                 // /expenses
API_ENDPOINTS.EXPENSES.STATISTICS           // /expenses/statistics
API_ENDPOINTS.EXPENSES.BY_ID('123')         // /expenses/123
API_ENDPOINTS.EXPENSES.UPDATE_STATUS('123') // /expenses/123/status
```

### **Deals**
```typescript
API_ENDPOINTS.DEALS.LIST                    // /deals
API_ENDPOINTS.DEALS.STATISTICS              // /deals/statistics
API_ENDPOINTS.DEALS.BY_ID('123')            // /deals/123
API_ENDPOINTS.DEALS.UPDATE_STAGE('123')     // /deals/123/stage
```

### **Reports**
```typescript
API_ENDPOINTS.REPORTS.ANALYTICS             // /reports/analytics
API_ENDPOINTS.REPORTS.FINANCIAL             // /reports/financial
```

### **Super Admin**
```typescript
API_ENDPOINTS.SUPER_ADMIN.ANALYTICS                           // /super-admin/analytics
API_ENDPOINTS.SUPER_ADMIN.ORGANIZATIONS                       // /super-admin/organizations
API_ENDPOINTS.SUPER_ADMIN.TOGGLE_ORG_STATUS('org-id')         // /super-admin/organizations/{id}/toggle-status
API_ENDPOINTS.SUPER_ADMIN.PAYMENTS                            // /super-admin/payments
API_ENDPOINTS.SUPER_ADMIN.MARK_PAID('payment-id')             // /super-admin/payments/{id}/mark-paid
API_ENDPOINTS.SUPER_ADMIN.SUBSCRIPTIONS                       // /super-admin/subscriptions
API_ENDPOINTS.SUPER_ADMIN.SUSPEND_SUBSCRIPTION('org-id')      // /super-admin/subscriptions/{id}/suspend
API_ENDPOINTS.SUPER_ADMIN.REACTIVATE_SUBSCRIPTION('org-id')   // /super-admin/subscriptions/{id}/reactivate
```

---

## 🔌 WebSocket Configuration

```typescript
import { getWebSocketUrl } from '@/lib/api';
import { io } from 'socket.io-client';

const socket = io(getWebSocketUrl(), {
  withCredentials: true,
  transports: ['websocket', 'polling']
});
```

---

## 🔐 Authentication

الـ JWT Token يُضاف تلقائياً لكل request! لا حاجة لإضافته يدوياً.

```typescript
// ✅ الـ Token يُضاف تلقائياً
const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.LIST);

// ❌ لا حاجة لهذا
const token = getToken();
const response = await axios.get('/customers', {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## 🔄 تغيير البورتات

### **الطريقة الصحيحة:**

1. افتح ملف `.env.local`
2. غيّر البورت:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:5000
```
3. أعد تشغيل الخادم
4. **انتهى!** ✅ لا حاجة لتعديل أي كود!

### **الطريقة الخاطئة:**
- ❌ البحث عن `localhost:3000` في جميع الملفات
- ❌ تعديل كل ملف يدوياً
- ❌ نسيان ملف واحد وحدوث أخطاء

---

## 📝 أمثلة عملية

### **مثال 1: تسجيل الدخول**
```typescript
import { apiClient, API_ENDPOINTS } from '@/lib/api';

const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password
    });
    
    // الـ Token محفوظ تلقائياً في cookies
    return response.data;
  } catch (error) {
    // الأخطاء تُعالج تلقائياً
    console.error('Login failed:', error);
    throw error;
  }
};
```

### **مثال 2: جلب العملاء**
```typescript
import { apiClient, API_ENDPOINTS } from '@/lib/api';

const fetchCustomers = async () => {
  const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.LIST);
  return response.data.data.customers;
};
```

### **مثال 3: تحديث عميل**
```typescript
import { apiClient, API_ENDPOINTS } from '@/lib/api';

const updateCustomer = async (id: string, data: any) => {
  const response = await apiClient.put(
    API_ENDPOINTS.CUSTOMERS.BY_ID(id),
    data
  );
  return response.data;
};
```

---

## ⚠️ ملاحظات مهمة

1. **لا تستخدم `axios` مباشرة** - استخدم `apiClient` دائماً
2. **لا تكتب URLs يدوياً** - استخدم `API_ENDPOINTS` دائماً
3. **لا تضيف Token يدوياً** - يُضاف تلقائياً
4. **لا تعالج أخطاء 401 يدوياً** - تُعالج تلقائياً

---

## 🐛 استكشاف الأخطاء

### **المشكلة: CORS Error**
**الحل:** تأكد من أن البورت في `.env.local` يطابق البورت في `backend/.env`

### **المشكلة: 401 Unauthorized**
**الحل:** الـ Token منتهي الصلاحية. سيتم إعادة التوجيه لصفحة تسجيل الدخول تلقائياً.

### **المشكلة: Connection Refused**
**الحل:** تأكد من أن الـ Backend يعمل على البورت الصحيح.

---

## 📞 الدعم

إذا واجهت أي مشكلة، تحقق من:
1. ✅ الـ Backend يعمل على البورت الصحيح
2. ✅ `.env.local` يحتوي على البورت الصحيح
3. ✅ أعدت تشغيل الخادم بعد تغيير `.env.local`
4. ✅ تستخدم `apiClient` و `API_ENDPOINTS` بدلاً من `axios` مباشرة

---

**تم إنشاء هذا النظام لضمان عدم حدوث مشاكل عند تغيير البورتات في المستقبل! 🚀**

