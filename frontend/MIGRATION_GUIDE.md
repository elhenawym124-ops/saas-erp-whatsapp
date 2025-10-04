# 🔄 Migration Guide - تحديث الملفات القديمة

## 📋 الملفات التي تحتاج تحديث

تم تحديث الملفات التالية بالفعل ✅:
- ✅ `src/app/login/page.tsx`
- ✅ `src/app/dashboard/whatsapp/messages/page.tsx`
- ✅ `src/lib/api.ts` (جديد)
- ✅ `src/lib/whatsappHelpers.ts`

الملفات التي تحتاج تحديث ⏳:
- ⏳ `src/app/dashboard/analytics/page.tsx`
- ⏳ `src/app/dashboard/customers/page.tsx`
- ⏳ `src/app/dashboard/deals/page.tsx`
- ⏳ `src/app/dashboard/expenses/page.tsx`
- ⏳ `src/app/dashboard/invoices/page.tsx`
- ⏳ `src/app/dashboard/projects/page.tsx`
- ⏳ `src/app/dashboard/tasks/page.tsx`
- ⏳ `src/app/dashboard/whatsapp/page.tsx`
- ⏳ `src/app/super-admin/analytics/page.tsx`
- ⏳ `src/app/super-admin/organizations/page.tsx`
- ⏳ `src/app/super-admin/page.tsx`
- ⏳ `src/app/super-admin/payments/page.tsx`
- ⏳ `src/app/super-admin/subscriptions/page.tsx`

---

## 🔧 خطوات التحديث لكل ملف

### **الخطوة 1: تحديث الـ imports**

**قبل:**
```typescript
import axios from 'axios';
```

**بعد:**
```typescript
import { apiClient, API_ENDPOINTS } from '@/lib/api';
```

---

### **الخطوة 2: استبدال الـ API calls**

#### **مثال 1: GET request بسيط**

**قبل:**
```typescript
const response = await axios.get('http://localhost:3000/api/v1/customers', {
  headers: { Authorization: `Bearer ${token}` },
  withCredentials: true
});
```

**بعد:**
```typescript
const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.LIST);
```

---

#### **مثال 2: GET request مع query parameters**

**قبل:**
```typescript
const response = await axios.get(
  `http://localhost:3000/api/v1/whatsapp/messages?contact=${phoneNumber}`,
  getAxiosConfig()
);
```

**بعد:**
```typescript
const response = await apiClient.get(
  `${API_ENDPOINTS.WHATSAPP.MESSAGES}?contact=${phoneNumber}`
);
```

---

#### **مثال 3: POST request**

**قبل:**
```typescript
const response = await axios.post(
  'http://localhost:3000/api/v1/customers',
  payload,
  {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true
  }
);
```

**بعد:**
```typescript
const response = await apiClient.post(API_ENDPOINTS.CUSTOMERS.LIST, payload);
```

---

#### **مثال 4: PUT request مع ID**

**قبل:**
```typescript
const response = await axios.put(
  `http://localhost:3000/api/v1/customers/${editingCustomer._id}`,
  payload,
  {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true
  }
);
```

**بعد:**
```typescript
const response = await apiClient.put(
  API_ENDPOINTS.CUSTOMERS.BY_ID(editingCustomer._id),
  payload
);
```

---

#### **مثال 5: DELETE request**

**قبل:**
```typescript
await axios.delete(
  `http://localhost:3000/api/v1/customers/${id}`,
  {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true
  }
);
```

**بعد:**
```typescript
await apiClient.delete(API_ENDPOINTS.CUSTOMERS.BY_ID(id));
```

---

#### **مثال 6: PATCH request لتحديث الحالة**

**قبل:**
```typescript
await axios.patch(
  `http://localhost:3000/api/v1/tasks/${id}/status`,
  { status: newStatus },
  {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true
  }
);
```

**بعد:**
```typescript
await apiClient.patch(
  API_ENDPOINTS.TASKS.UPDATE_STATUS(id),
  { status: newStatus }
);
```

---

#### **مثال 7: POST مع FormData (رفع ملفات)**

**قبل:**
```typescript
const token = getToken();
await axios.post(
  'http://localhost:3000/api/v1/whatsapp/messages/send-image',
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    withCredentials: true,
  }
);
```

**بعد:**
```typescript
await apiClient.post(
  API_ENDPOINTS.WHATSAPP.SEND_IMAGE,
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
);
```

---

#### **مثال 8: استخدام process.env.NEXT_PUBLIC_API_URL**

**قبل:**
```typescript
const response = await axios.get(
  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/whatsapp/sessions`,
  getAxiosConfig()
);
```

**بعد:**
```typescript
const response = await apiClient.get(API_ENDPOINTS.WHATSAPP.SESSIONS);
```

---

### **الخطوة 3: إزالة getAxiosConfig() و getToken()**

**قبل:**
```typescript
import { getToken, getAxiosConfig } from '@/lib/whatsappHelpers';

const token = getToken();
const response = await axios.get('/api/customers', getAxiosConfig());
```

**بعد:**
```typescript
import { apiClient, API_ENDPOINTS } from '@/lib/api';

// لا حاجة لـ getToken() أو getAxiosConfig()
const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.LIST);
```

---

### **الخطوة 4: إزالة معالجة أخطاء 401 اليدوية**

**قبل:**
```typescript
try {
  const response = await axios.get('/api/customers', getAxiosConfig());
  // ...
} catch (error: any) {
  if (error.response?.status === 401) {
    setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
    setTimeout(() => window.location.href = '/login', 2000);
  }
}
```

**بعد:**
```typescript
try {
  const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.LIST);
  // ...
} catch (error: any) {
  // أخطاء 401 تُعالج تلقائياً!
  // فقط اعرض رسالة خطأ عامة
  setError(error.response?.data?.message || 'حدث خطأ');
}
```

---

## 🔍 جدول التحويل السريع

| القديم | الجديد |
|--------|--------|
| `axios.get(...)` | `apiClient.get(...)` |
| `axios.post(...)` | `apiClient.post(...)` |
| `axios.put(...)` | `apiClient.put(...)` |
| `axios.patch(...)` | `apiClient.patch(...)` |
| `axios.delete(...)` | `apiClient.delete(...)` |
| `'http://localhost:3000/api/v1/customers'` | `API_ENDPOINTS.CUSTOMERS.LIST` |
| `'http://localhost:3000/api/v1/customers/${id}'` | `API_ENDPOINTS.CUSTOMERS.BY_ID(id)` |
| `getAxiosConfig()` | ❌ احذفه (غير مطلوب) |
| `getToken()` | ❌ احذفه (يُضاف تلقائياً) |
| `withCredentials: true` | ❌ احذفه (مضاف تلقائياً) |
| `headers: { Authorization: ... }` | ❌ احذفه (يُضاف تلقائياً) |

---

## 📝 مثال كامل: تحديث ملف Customers

### **قبل التحديث:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        'http://localhost:3000/api/v1/customers',
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      setCustomers(response.data.data.customers);
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  };
  
  const deleteCustomer = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(
        `http://localhost:3000/api/v1/customers/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };
  
  // ...
}
```

### **بعد التحديث:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  
  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.LIST);
      setCustomers(response.data.data.customers);
    } catch (error: any) {
      // أخطاء 401 تُعالج تلقائياً
      console.error('Error fetching customers:', error);
    }
  };
  
  const deleteCustomer = async (id: string) => {
    try {
      await apiClient.delete(API_ENDPOINTS.CUSTOMERS.BY_ID(id));
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };
  
  // ...
}
```

---

## ✅ Checklist للتحديث

لكل ملف، تأكد من:

- [ ] استبدال `import axios from 'axios'` بـ `import { apiClient, API_ENDPOINTS } from '@/lib/api'`
- [ ] استبدال جميع `axios.get/post/put/delete` بـ `apiClient.get/post/put/delete`
- [ ] استبدال جميع الـ hard-coded URLs بـ `API_ENDPOINTS`
- [ ] حذف `getToken()` و `getAxiosConfig()`
- [ ] حذف `withCredentials: true`
- [ ] حذف `headers: { Authorization: ... }`
- [ ] حذف معالجة أخطاء 401 اليدوية (اختياري)
- [ ] اختبار الملف للتأكد من عمله

---

## 🚀 الخطوات التالية

1. ✅ اختبر الملفات المحدثة (login و whatsapp/messages)
2. ⏳ حدّث باقي الملفات واحداً تلو الآخر
3. ⏳ اختبر كل ملف بعد تحديثه
4. ⏳ احذف الملفات القديمة غير المستخدمة

---

**ملاحظة:** يمكنك تحديث الملفات تدريجياً. الملفات القديمة ستستمر في العمل حتى تحديثها.

