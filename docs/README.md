# 📚 SaaS ERP System - التوثيق الشامل

## 🎯 نظرة عامة

نظام ERP متكامل قائم على نموذج SaaS (Software as a Service) مع تكامل WhatsApp، مصمم لإدارة المؤسسات بشكل شامل.

---

## 📋 جدول المحتويات

1. [البنية التقنية](#البنية-التقنية)
2. [الميزات الرئيسية](#الميزات-الرئيسية)
3. [دليل التثبيت](#دليل-التثبيت)
4. [البنية المعمارية](#البنية-المعمارية)
5. [API Documentation](#api-documentation)
6. [نظام الاشتراكات](#نظام-الاشتراكات)
7. [نظام WhatsApp](#نظام-whatsapp)
8. [الأمان والصلاحيات](#الأمان-والصلاحيات)
9. [دليل المطور](#دليل-المطور)
10. [الاختبارات](#الاختبارات)

---

## 🏗️ البنية التقنية

### **Backend**
- **Framework**: Express.js 4.19.2
- **Runtime**: Node.js 22.14.0
- **Language**: JavaScript (ES6 Modules)
- **Databases**:
  - MongoDB 8.3.2 (Primary - NoSQL)
  - MySQL 2 (Secondary - Relational)
- **Authentication**: JWT (Access + Refresh Tokens)
- **File Upload**: Multer 1.4.5
- **WhatsApp**: @whiskeysockets/baileys
- **Validation**: Joi + express-validator
- **Security**: Helmet, bcryptjs, rate-limiting
- **Logging**: Winston with daily rotation
- **Documentation**: Swagger (OpenAPI 3.0)
- **Testing**: Jest + Supertest

### **Frontend**
- **Framework**: Next.js 14.2.3 (App Router)
- **Language**: TypeScript 5.4.5
- **Styling**: Tailwind CSS 3.4.3
- **HTTP Client**: Axios 1.7.2
- **Charts**: Recharts
- **Icons**: React Icons 5.2.1
- **UI**: Custom components with RTL support

---

## ✨ الميزات الرئيسية

### **1. إدارة المؤسسات (Organizations)**
- ✅ تسجيل مؤسسات جديدة
- ✅ إدارة معلومات المؤسسة
- ✅ نظام النطاقات (Domains)
- ✅ إعدادات مخصصة لكل مؤسسة

### **2. إدارة المستخدمين (Users)**
- ✅ 4 أدوار: Super Admin, Admin, Manager, Employee
- ✅ صلاحيات دقيقة (RBAC)
- ✅ معلومات شخصية ووظيفية
- ✅ إدارة الحسابات

### **3. الحضور والانصراف (Attendance)**
- ✅ تسجيل الحضور/الانصراف
- ✅ تتبع ساعات العمل
- ✅ طلبات الإجازات
- ✅ تقارير الحضور

### **4. إدارة المشاريع (Projects)**
- ✅ إنشاء وإدارة المشاريع
- ✅ تعيين أعضاء الفريق
- ✅ تتبع التقدم
- ✅ الميزانيات والمواعيد النهائية

### **5. إدارة المهام (Tasks)**
- ✅ إنشاء وتعيين المهام
- ✅ 4 أولويات: Low, Medium, High, Critical
- ✅ 5 حالات: Todo, In Progress, Review, Done, Cancelled
- ✅ تتبع الوقت

### **6. نظام WhatsApp**
- ✅ جلسات متعددة لكل مؤسسة
- ✅ إرسال رسائل (نص، صورة، فيديو، صوت، ملفات)
- ✅ استقبال رسائل
- ✅ إدارة جهات الاتصال
- ✅ واجهة محادثة احترافية
- ✅ إعادة اتصال تلقائي

### **7. CRM (إدارة علاقات العملاء)**
- ✅ إدارة العملاء (Customers)
- ✅ إدارة الصفقات (Deals)
- ✅ خط المبيعات (Sales Pipeline)
- ✅ تتبع التفاعلات

### **8. المحاسبة (Accounting)**
- ✅ الفواتير (Invoices)
- ✅ المصروفات (Expenses)
- ✅ الرواتب (Payroll)
- ✅ التقارير المالية

### **9. التقارير والتحليلات (Reports)**
- ✅ تقارير الحضور
- ✅ التقارير المالية
- ✅ تقارير المشاريع
- ✅ تقارير المبيعات
- ✅ Dashboard Analytics

### **10. نظام الاشتراكات SaaS**
- ✅ 4 خطط: Free, Basic, Pro, Enterprise
- ✅ إدارة الاشتراكات
- ✅ نظام المدفوعات
- ✅ حدود الاستخدام
- ✅ لوحة تحكم Super Admin

### **11. الصحة والمراقبة (Health & Monitoring)**
- ✅ فحص صحة النظام
- ✅ تتبع الأخطاء
- ✅ سجلات النظام
- ✅ تنبيهات تلقائية

---

## 🚀 دليل التثبيت

### **المتطلبات**
- Node.js >= 18.0.0
- MongoDB >= 6.0
- MySQL >= 8.0 (اختياري)
- npm >= 9.0.0

### **1. استنساخ المشروع**
```bash
git clone <repository-url>
cd newtask
```

### **2. تثبيت Backend**
```bash
cd backend
npm install
```

### **3. إعداد المتغيرات البيئية**
```bash
cp .env.example .env
```

**ملف `.env`**:
```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/saas_erp

# MySQL (Optional)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=saas_erp

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### **4. تشغيل Backend**
```bash
# Development
npm run dev

# Production
npm start
```

### **5. تثبيت Frontend**
```bash
cd ../frontend
npm install
```

### **6. إعداد Frontend Environment**
```bash
cp .env.example .env.local
```

**ملف `.env.local`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### **7. تشغيل Frontend**
```bash
npm run dev
```

### **8. إنشاء مستخدمين تجريبيين**
```bash
cd ../backend
node scripts/createTestUsers.js
```

---

## 🏛️ البنية المعمارية

### **Backend Structure**
```
backend/
├── src/
│   ├── config/          # إعدادات النظام
│   │   ├── app.js
│   │   ├── database.js
│   │   ├── logger.js
│   │   ├── redis.js
│   │   └── swagger.js
│   ├── models/          # نماذج قاعدة البيانات (21 model)
│   ├── controllers/     # معالجات HTTP
│   ├── services/        # منطق الأعمال
│   ├── routes/          # مسارات API
│   ├── middleware/      # Middleware functions
│   ├── utils/           # أدوات مساعدة
│   └── server.js        # نقطة الدخول
├── tests/               # الاختبارات
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/             # سكريبتات مساعدة
├── sessions/            # جلسات WhatsApp
├── uploads/             # الملفات المرفوعة
└── logs/                # سجلات النظام
```

### **Frontend Structure**
```
frontend/
├── src/
│   └── app/
│       ├── (auth)/              # صفحات المصادقة
│       │   ├── login/
│       │   └── register/
│       ├── dashboard/           # صفحات Dashboard
│       │   ├── attendance/
│       │   ├── projects/
│       │   ├── tasks/
│       │   ├── whatsapp/
│       │   │   └── messages/
│       │   ├── customers/
│       │   ├── deals/
│       │   ├── invoices/
│       │   ├── expenses/
│       │   └── reports/
│       └── super-admin/         # لوحة Super Admin
│           ├── organizations/
│           ├── subscriptions/
│           ├── payments/
│           └── analytics/
└── public/                      # ملفات ثابتة
```

---

## 📡 API Documentation

### **Base URL**
```
http://localhost:3000/api/v1
```

### **Swagger Documentation**
```
http://localhost:3000/api-docs
```

### **Authentication Endpoints**
```
POST   /auth/register          - تسجيل مؤسسة جديدة
POST   /auth/login             - تسجيل الدخول
POST   /auth/refresh-token     - تحديث Token
POST   /auth/logout            - تسجيل الخروج
GET    /auth/me                - معلومات المستخدم الحالي
```

### **WhatsApp Endpoints**
```
POST   /whatsapp/sessions                    - إنشاء جلسة
GET    /whatsapp/sessions                    - جميع الجلسات
GET    /whatsapp/sessions/:name/qr           - QR Code
GET    /whatsapp/sessions/:name/status       - حالة الجلسة
DELETE /whatsapp/sessions/:name              - قطع الاتصال

POST   /whatsapp/messages/send               - إرسال نص
POST   /whatsapp/messages/send-image         - إرسال صورة
POST   /whatsapp/messages/send-document      - إرسال ملف
POST   /whatsapp/messages/send-video         - إرسال فيديو
POST   /whatsapp/messages/send-audio         - إرسال صوت
GET    /whatsapp/messages                    - جميع الرسائل

GET    /whatsapp/contacts                    - جهات الاتصال
PUT    /whatsapp/contacts/:id                - تحديث جهة اتصال
GET    /whatsapp/stats                       - الإحصائيات
```

### **Super Admin Endpoints**
```
GET    /super-admin/analytics                - إحصائيات النظام
GET    /super-admin/organizations            - جميع المؤسسات
GET    /super-admin/organizations/:id        - تفاصيل مؤسسة
PATCH  /super-admin/organizations/:id/toggle - تفعيل/تعطيل

GET    /super-admin/subscriptions            - جميع الاشتراكات
PATCH  /super-admin/subscriptions/:id/suspend    - تعليق
PATCH  /super-admin/subscriptions/:id/reactivate - إعادة تفعيل

GET    /super-admin/payments                 - جميع المدفوعات
PATCH  /super-admin/payments/:id/mark-paid   - وضع علامة مدفوع

GET    /super-admin/users                    - جميع المستخدمين
```

---

## 💳 نظام الاشتراكات

### **الخطط المتاحة**

#### **Free Plan** (مجاني)
- 5 مستخدمين
- 3 مشاريع
- 1 GB تخزين
- 1 جلسة WhatsApp
- الميزات الأساسية

#### **Basic Plan** ($99/شهر)
- 25 مستخدم
- 20 مشروع
- 10 GB تخزين
- 3 جلسات WhatsApp
- تقارير مخصصة ✅
- API Access ✅

#### **Pro Plan** ($299/شهر)
- 100 مستخدم
- 100 مشروع
- 50 GB تخزين
- 10 جلسات WhatsApp
- دعم أولوية ✅
- نطاق مخصص ✅
- تكاملات متقدمة ✅

#### **Enterprise Plan** ($999/شهر)
- مستخدمين غير محدودين ∞
- مشاريع غير محدودة ∞
- 500 GB تخزين
- جلسات WhatsApp غير محدودة ∞
- دعم مخصص 24/7 ✅
- تكاملات مخصصة ✅
- SLA مضمون ✅

### **حالات الاشتراك**
- `active` - نشط
- `trial` - تجريبي (14 يوم)
- `expired` - منتهي
- `cancelled` - ملغي
- `suspended` - معلق

---

## 📱 نظام WhatsApp

### **الميزات الحالية**

#### **إدارة الجلسات**
- ✅ جلسات متعددة لكل مؤسسة
- ✅ QR Code للمصادقة
- ✅ إعادة اتصال تلقائي
- ✅ تتبع حالة الجلسة

#### **أنواع الرسائل المدعومة**
- ✅ Text (نص)
- ✅ Image (صورة) - حتى 16MB
- ✅ Video (فيديو) - حتى 16MB
- ✅ Audio (صوت/رسالة صوتية)
- ✅ Document (ملفات PDF, Word, Excel, etc.)

#### **إدارة جهات الاتصال**
- ✅ مزامنة تلقائية
- ✅ Tags (علامات)
- ✅ ملاحظات
- ✅ ربط بالعملاء

#### **واجهة المحادثات**
- ✅ تصميم شبيه بـ WhatsApp Web
- ✅ بحث في جهات الاتصال
- ✅ إرسال ملفات بالسحب والإفلات
- ✅ RTL Support كامل

### **الميزات المستقبلية** (لم يتم تنفيذها)
- ⏳ ردود تلقائية (Auto-Reply)
- ⏳ رسائل جماعية (Broadcast)
- ⏳ رسائل مجدولة
- ⏳ Chatbot ذكي مع AI
- ⏳ قوالب رسائل (Templates)
- ⏳ أزرار تفاعلية (Buttons)
- ⏳ قوائم (Lists)
- ⏳ WhatsApp Business API

---

## 🔐 الأمان والصلاحيات

### **الأدوار (Roles)**

#### **Super Admin** 👑
- إدارة كاملة للنظام
- إدارة جميع المؤسسات
- إدارة الاشتراكات والمدفوعات
- الوصول لجميع التقارير

#### **Admin** 🏢
- إدارة كاملة للمؤسسة
- إدارة المستخدمين
- إدارة المشاريع والمهام
- الوصول للتقارير المالية

#### **Manager** 👔
- إدارة المشاريع والمهام
- عرض تقارير الفريق
- إدارة الحضور
- لا يمكن إدارة المستخدمين

#### **Employee** 👤
- عرض المهام المعينة
- تسجيل الحضور/الانصراف
- عرض المشاريع
- لا يمكن إنشاء مشاريع

### **الأمان**
- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt - 12 rounds)
- ✅ Rate Limiting
- ✅ Input Validation & Sanitization
- ✅ Helmet Security Headers
- ✅ CORS Configuration
- ✅ SQL Injection Protection
- ✅ XSS Protection

---

## 👨‍💻 دليل المطور

راجع الملفات التالية:
- [API Reference](./API_REFERENCE.md) - مرجع شامل لجميع الـ API Endpoints
- [Database Schema](./DATABASE_SCHEMA.md) - مخطط قاعدة البيانات والعلاقات
- [WhatsApp Integration](./WHATSAPP_GUIDE.md) - دليل شامل لنظام WhatsApp
- [Setup Guide](./SETUP_GUIDE.md) - دليل التثبيت والإعداد
- [Developer Guide](./DEVELOPER_GUIDE.md) - معايير الكود وأفضل الممارسات

---

## 🧪 الاختبارات

### **تشغيل الاختبارات**
```bash
# جميع الاختبارات
npm test

# Unit Tests
npm run test:unit

# Integration Tests
npm run test:integration

# Coverage Report
npm run test:coverage
```

### **الاختبارات الحالية**
- ✅ Unit Tests (Models, Helpers)
- ✅ Integration Tests (Auth, Subscriptions)
- ⏳ E2E Tests (قيد التطوير)

---

## 📊 الإحصائيات

- **Backend**: 30,000+ سطر كود
- **Frontend**: 15,000+ سطر كود
- **API Endpoints**: 120+
- **Database Models**: 21
- **Frontend Pages**: 18
- **Tests**: 60+

---

## 📞 الدعم

للمساعدة والدعم:
- 📧 Email: support@newtask.com
- 📱 WhatsApp: +966500000000
- 🌐 Website: https://newtask.com

---

## 📄 الترخيص

هذا المشروع محمي بحقوق الملكية. جميع الحقوق محفوظة © 2025

---

**تم بحمد الله ✨**

