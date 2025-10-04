# Backend - SaaS ERP System

نظام إدارة المؤسسات الخلفي (Backend) مبني على Node.js + Express + MongoDB

## 🚀 البدء السريع

### المتطلبات
- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 7.0 (اختياري)

### التثبيت

```bash
# 1. الانتقال لمجلد Backend
cd backend

# 2. تثبيت التبعيات
npm install

# 3. إعداد ملف البيئة
cp .env.example .env
# قم بتعديل .env بالإعدادات المناسبة

# 4. تشغيل في وضع التطوير
npm run dev

# 5. تشغيل في وضع الإنتاج
npm start
```

## 📁 هيكل المشروع

```
backend/
├── src/
│   ├── config/          # إعدادات التطبيق
│   ├── models/          # نماذج قاعدة البيانات
│   ├── controllers/     # معالجات الطلبات
│   ├── services/        # منطق الأعمال
│   ├── routes/          # مسارات API
│   ├── middleware/      # Middleware functions
│   ├── utils/           # دوال مساعدة
│   ├── app.js           # تطبيق Express
│   └── server.js        # نقطة البداية
├── tests/
│   ├── unit/            # اختبارات الوحدة
│   ├── integration/     # اختبارات التكامل
│   └── e2e/             # اختبارات شاملة
├── logs/                # ملفات السجلات
├── uploads/             # الملفات المرفوعة
├── sessions/            # جلسات WhatsApp
└── package.json
```

## 🔧 الأوامر المتاحة

```bash
npm start              # تشغيل في وضع الإنتاج
npm run dev            # تشغيل في وضع التطوير
npm test               # تشغيل جميع الاختبارات
npm run test:unit      # اختبارات الوحدة
npm run test:watch     # اختبارات مع المراقبة
npm run lint           # فحص الكود
npm run lint:fix       # إصلاح مشاكل الكود
npm run format         # تنسيق الكود
```

## 🔐 الأمان

- JWT Authentication
- bcrypt لتشفير كلمات المرور
- Helmet لحماية HTTP headers
- Rate Limiting
- MongoDB Sanitization
- CORS محدد

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - تسجيل مستخدم جديد
- `POST /api/v1/auth/login` - تسجيل الدخول
- `POST /api/v1/auth/refresh` - تحديث Token
- `POST /api/v1/auth/logout` - تسجيل الخروج

### Users
- `GET /api/v1/users` - قائمة المستخدمين
- `GET /api/v1/users/:id` - تفاصيل مستخدم
- `PUT /api/v1/users/:id` - تحديث مستخدم
- `DELETE /api/v1/users/:id` - حذف مستخدم

### Attendance
- `POST /api/v1/attendance/check-in` - تسجيل حضور
- `POST /api/v1/attendance/check-out` - تسجيل انصراف
- `GET /api/v1/attendance` - سجل الحضور

### Projects
- `GET /api/v1/projects` - قائمة المشاريع
- `POST /api/v1/projects` - إنشاء مشروع
- `GET /api/v1/projects/:id` - تفاصيل مشروع
- `PUT /api/v1/projects/:id` - تحديث مشروع

### WhatsApp
- `POST /api/v1/whatsapp/connect` - الاتصال بـ WhatsApp
- `POST /api/v1/whatsapp/send` - إرسال رسالة
- `GET /api/v1/whatsapp/qr` - الحصول على QR Code

## 🧪 الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# اختبارات الوحدة فقط
npm run test:unit

# اختبارات التكامل فقط
npm run test:integration

# مع تغطية الكود
npm test -- --coverage
```

## 📝 المتغيرات البيئية

راجع ملف `.env.example` لجميع المتغيرات المطلوبة.

## 🤝 المساهمة

راجع ملف CONTRIBUTING.md في الجذر الرئيسي للمشروع.

## 📄 الترخيص

MIT License

