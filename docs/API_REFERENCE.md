# 📡 API Reference - مرجع API الشامل

## 🎯 Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.newtask.com/api/v1
```

## 🔐 Authentication

جميع الـ endpoints (ماعدا `/auth/register` و `/auth/login`) تتطلب JWT Token في الـ header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📋 جدول المحتويات

1. [Authentication](#authentication)
2. [Users](#users)
3. [Organizations](#organizations)
4. [Attendance](#attendance)
5. [Projects](#projects)
6. [Tasks](#tasks)
7. [WhatsApp](#whatsapp)
8. [Customers](#customers)
9. [Deals](#deals)
10. [Invoices](#invoices)
11. [Expenses](#expenses)
12. [Payroll](#payroll)
13. [Reports](#reports)
14. [Super Admin](#super-admin)
15. [Health](#health)

---

## 🔑 Authentication

### **POST /auth/register**
تسجيل مؤسسة جديدة

**Body**:
```json
{
  "email": "admin@company.com",
  "password": "Admin@1234",
  "phone": "966500000000",
  "organizationData": {
    "name": "شركتي",
    "domain": "my-company",
    "industry": "technology",
    "size": "10-50",
    "contactInfo": {
      "email": "info@company.com",
      "phone": "966500000000"
    }
  },
  "personalInfo": {
    "firstName": "أحمد",
    "lastName": "محمد"
  },
  "workInfo": {
    "employeeId": "EMP001",
    "department": "IT",
    "position": "مدير تقني"
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "تم التسجيل بنجاح",
  "data": {
    "user": { ... },
    "organization": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

### **POST /auth/login**
تسجيل الدخول

**Body**:
```json
{
  "email": "admin@company.com",
  "password": "Admin@1234"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "user": {
      "_id": "...",
      "email": "admin@company.com",
      "personalInfo": { ... },
      "permissions": {
        "role": "admin",
        "modules": ["attendance", "projects", "whatsapp"]
      }
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

### **POST /auth/refresh-token**
تحديث Access Token

**Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

---

### **POST /auth/logout**
تسجيل الخروج

**Headers**: `Authorization: Bearer TOKEN`

---

### **GET /auth/me**
معلومات المستخدم الحالي

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

---

## 👥 Users

### **GET /users**
جميع المستخدمين في المؤسسة

**Query Parameters**:
- `role`: admin | manager | employee
- `status`: active | inactive
- `department`: String
- `page`: Number (default: 1)
- `limit`: Number (default: 10)

---

### **GET /users/:id**
تفاصيل مستخدم

---

### **POST /users**
إنشاء مستخدم جديد

**Permissions**: Admin only

**Body**:
```json
{
  "email": "user@company.com",
  "password": "User@1234",
  "personalInfo": {
    "firstName": "محمد",
    "lastName": "أحمد"
  },
  "workInfo": {
    "employeeId": "EMP002",
    "department": "Sales",
    "position": "مندوب مبيعات"
  },
  "permissions": {
    "role": "employee",
    "modules": ["attendance", "tasks"]
  }
}
```

---

### **PATCH /users/:id**
تحديث مستخدم

---

### **DELETE /users/:id**
حذف مستخدم

---

## 📅 Attendance

### **POST /attendance/check-in**
تسجيل حضور

**Body**:
```json
{
  "notes": "تسجيل حضور",
  "location": {
    "type": "Point",
    "coordinates": [24.7136, 46.6753]
  }
}
```

---

### **POST /attendance/check-out**
تسجيل انصراف

---

### **GET /attendance**
سجل الحضور

**Query Parameters**:
- `userId`: ObjectId
- `startDate`: Date
- `endDate`: Date
- `status`: present | absent | late
- `page`: Number
- `limit`: Number

---

### **GET /attendance/my-records**
سجل حضوري

---

### **GET /attendance/summary**
ملخص الحضور

---

## 📊 Projects

### **GET /projects**
جميع المشاريع

**Query Parameters**:
- `status`: planning | active | completed
- `priority`: low | medium | high | critical
- `manager`: ObjectId
- `page`: Number
- `limit`: Number

---

### **POST /projects**
إنشاء مشروع

**Body**:
```json
{
  "name": "مشروع جديد",
  "description": "وصف المشروع",
  "status": "planning",
  "priority": "high",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "budget": 100000,
  "manager": "user_id",
  "team": ["user_id_1", "user_id_2"]
}
```

---

### **GET /projects/:id**
تفاصيل مشروع

---

### **PATCH /projects/:id**
تحديث مشروع

---

### **DELETE /projects/:id**
حذف مشروع

---

## ✅ Tasks

### **GET /tasks**
جميع المهام

**Query Parameters**:
- `project`: ObjectId
- `assignedTo`: ObjectId
- `status`: todo | in_progress | done
- `priority`: low | medium | high | critical

---

### **POST /tasks**
إنشاء مهمة

**Body**:
```json
{
  "project": "project_id",
  "title": "مهمة جديدة",
  "description": "وصف المهمة",
  "status": "todo",
  "priority": "high",
  "assignedTo": "user_id",
  "dueDate": "2025-01-15",
  "estimatedHours": 8
}
```

---

### **GET /tasks/:id**
تفاصيل مهمة

---

### **PATCH /tasks/:id**
تحديث مهمة

---

### **DELETE /tasks/:id**
حذف مهمة

---

## 📱 WhatsApp

### **POST /whatsapp/sessions**
إنشاء جلسة WhatsApp

**Body**:
```json
{
  "sessionName": "sales"
}
```

---

### **GET /whatsapp/sessions**
جميع الجلسات

---

### **GET /whatsapp/sessions/:sessionName/qr**
الحصول على QR Code

---

### **GET /whatsapp/sessions/:sessionName/status**
حالة الجلسة

---

### **DELETE /whatsapp/sessions/:sessionName**
قطع اتصال الجلسة

---

### **POST /whatsapp/messages/send**
إرسال رسالة نصية

**Body**:
```json
{
  "to": "966500000000",
  "text": "مرحباً!",
  "sessionName": "sales"
}
```

---

### **POST /whatsapp/messages/send-image**
إرسال صورة

**Form Data**:
- `image`: File
- `to`: String
- `caption`: String (optional)
- `sessionName`: String (optional)

---

### **POST /whatsapp/messages/send-document**
إرسال ملف

**Form Data**:
- `document`: File
- `to`: String
- `sessionName`: String (optional)

---

### **POST /whatsapp/messages/send-video**
إرسال فيديو

---

### **POST /whatsapp/messages/send-audio**
إرسال رسالة صوتية

---

### **GET /whatsapp/messages**
جميع الرسائل

**Query Parameters**:
- `sessionName`: String
- `contact`: String (phone number)
- `direction`: incoming | outgoing
- `page`: Number
- `limit`: Number

---

### **GET /whatsapp/contacts**
جهات الاتصال

---

### **PUT /whatsapp/contacts/:id**
تحديث جهة اتصال

---

### **GET /whatsapp/stats**
إحصائيات WhatsApp

---

## 👥 Customers

### **GET /customers**
جميع العملاء

**Query Parameters**:
- `type`: individual | company
- `status`: active | inactive
- `search`: String
- `page`: Number
- `limit`: Number

---

### **POST /customers**
إنشاء عميل

**Body**:
```json
{
  "name": "أحمد محمد",
  "type": "individual",
  "contactInfo": {
    "email": "ahmed@example.com",
    "phone": "+966500000000"
  },
  "address": {
    "city": "الرياض",
    "country": "السعودية"
  },
  "status": "active",
  "tags": ["vip", "customer"]
}
```

---

### **GET /customers/:id**
تفاصيل عميل

---

### **PATCH /customers/:id**
تحديث عميل

---

### **DELETE /customers/:id**
حذف عميل

---

### **GET /customers/statistics**
إحصائيات العملاء

---

## 💼 Deals

### **GET /deals**
جميع الصفقات

**Query Parameters**:
- `customer`: ObjectId
- `stage`: lead | qualified | won | lost
- `assignedTo`: ObjectId

---

### **POST /deals**
إنشاء صفقة

**Body**:
```json
{
  "customer": "customer_id",
  "title": "صفقة جديدة",
  "description": "وصف الصفقة",
  "value": 50000,
  "currency": "SAR",
  "stage": "qualified",
  "probability": 70,
  "expectedCloseDate": "2025-02-01",
  "assignedTo": "user_id"
}
```

---

### **GET /deals/:id**
تفاصيل صفقة

---

### **PATCH /deals/:id**
تحديث صفقة

---

### **DELETE /deals/:id**
حذف صفقة

---

### **GET /deals/pipeline**
خط المبيعات

---

## 🧾 Invoices

### **GET /invoices**
جميع الفواتير

---

### **POST /invoices**
إنشاء فاتورة

**Body**:
```json
{
  "customer": "customer_id",
  "items": [
    {
      "description": "منتج 1",
      "quantity": 2,
      "unitPrice": 100,
      "total": 200
    }
  ],
  "subtotal": 200,
  "tax": 30,
  "discount": 0,
  "total": 230,
  "issueDate": "2025-01-01",
  "dueDate": "2025-01-31"
}
```

---

### **GET /invoices/:id**
تفاصيل فاتورة

---

### **PATCH /invoices/:id**
تحديث فاتورة

---

### **DELETE /invoices/:id**
حذف فاتورة

---

## 💰 Expenses

### **GET /expenses**
جميع المصروفات

---

### **POST /expenses**
إنشاء مصروف

---

### **GET /expenses/:id**
تفاصيل مصروف

---

### **PATCH /expenses/:id**
تحديث مصروف

---

### **DELETE /expenses/:id**
حذف مصروف

---

## 💵 Payroll

### **GET /payroll**
جميع الرواتب

---

### **POST /payroll**
إنشاء راتب

---

### **GET /payroll/:id**
تفاصيل راتب

---

### **PATCH /payroll/:id**
تحديث راتب

---

## 📊 Reports

### **GET /reports/attendance**
تقرير الحضور

**Query Parameters**:
- `startDate`: Date
- `endDate`: Date
- `userId`: ObjectId
- `department`: String

---

### **GET /reports/financial**
التقرير المالي

---

### **GET /reports/projects**
تقرير المشاريع

---

### **GET /reports/sales**
تقرير المبيعات

---

### **GET /reports/analytics**
تحليلات Dashboard

---

## 👑 Super Admin

### **GET /super-admin/analytics**
إحصائيات النظام الشاملة

**Permissions**: Super Admin only

**Response**:
```json
{
  "success": true,
  "data": {
    "organizations": {
      "total": 150,
      "active": 120,
      "inactive": 30
    },
    "users": {
      "total": 5000,
      "byRole": {
        "admin": 150,
        "manager": 500,
        "employee": 4350
      }
    },
    "subscriptions": {
      "total": 150,
      "byPlan": {
        "free": 50,
        "basic": 60,
        "pro": 30,
        "enterprise": 10
      }
    },
    "revenue": {
      "mrr": 45000,
      "arr": 540000
    }
  }
}
```

---

### **GET /super-admin/organizations**
جميع المؤسسات

---

### **GET /super-admin/organizations/:id**
تفاصيل مؤسسة

---

### **PATCH /super-admin/organizations/:id/toggle**
تفعيل/تعطيل مؤسسة

---

### **GET /super-admin/subscriptions**
جميع الاشتراكات

---

### **PATCH /super-admin/subscriptions/:organizationId/suspend**
تعليق اشتراك

---

### **PATCH /super-admin/subscriptions/:organizationId/reactivate**
إعادة تفعيل اشتراك

---

### **GET /super-admin/payments**
جميع المدفوعات

---

### **PATCH /super-admin/payments/:id/mark-paid**
وضع علامة مدفوع

---

### **GET /super-admin/users**
جميع المستخدمين في النظام

---

## 🏥 Health

### **GET /health**
فحص صحة النظام

**Response**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-01T10:30:00.000Z",
  "environment": "development"
}
```

---

### **GET /health/detailed**
فحص مفصل

---

### **GET /health/history**
سجل الفحوصات

---

### **GET /health/errors**
قائمة الأخطاء

---

### **GET /health/errors/statistics**
إحصائيات الأخطاء

---

## 📝 Response Format

### **Success Response**
```json
{
  "success": true,
  "message": "تمت العملية بنجاح",
  "data": { ... }
}
```

### **Error Response**
```json
{
  "success": false,
  "message": "رسالة الخطأ",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### **Paginated Response**
```json
{
  "success": true,
  "message": "تمت العملية بنجاح",
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10,
    "limit": 10
  }
}
```

---

## 🔒 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

**تم بحمد الله ✨**

