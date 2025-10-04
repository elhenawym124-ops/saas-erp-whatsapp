# 🚀 دليل البدء السريع - SaaS ERP System

## 📋 المتطلبات

- ✅ Node.js 18+ مثبت
- ✅ MongoDB مثبت ويعمل
- ✅ Redis مثبت (اختياري)
- ✅ Git مثبت

## 🔧 خطوات التشغيل

### 1. إعداد Backend

```bash
# الانتقال لمجلد Backend
cd backend

# تثبيت الحزم (إذا لم تكن مثبتة)
npm install

# إنشاء ملف .env
cp .env.example .env
```

### 2. تعديل ملف .env

افتح `backend/.env` وعدل الإعدادات:

```env
# Server
NODE_ENV=development
PORT=5000
HOST=localhost
APP_NAME=SaaS ERP System

# Database
MONGODB_URI=mongodb://localhost:27017/saas-erp
MONGODB_TEST_URI=mongodb://localhost:27017/saas-erp-test

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Redis (اختياري)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. تشغيل MongoDB

تأكد من أن MongoDB يعمل:

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 4. تشغيل Backend

```bash
# في مجلد backend
npm run dev
```

يجب أن ترى:

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 SaaS ERP System                                     ║
║                                                           ║
║   📡 Server running on: http://localhost:5000            ║
║   🌍 Environment: development                            ║
║   📅 Started at: ...                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## 🧪 اختبار API

### 1. Health Check

```bash
curl http://localhost:5000/health
```

يجب أن ترى:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "...",
  "environment": "development"
}
```

### 2. تسجيل مستخدم جديد

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@1234",
    "phone": "+201234567890",
    "organizationData": {
      "name": "شركتي",
      "domain": "my-company",
      "industry": "technology",
      "size": "10-50",
      "contactInfo": {
        "email": "info@mycompany.com",
        "phone": "+201234567890"
      }
    },
    "personalInfo": {
      "firstName": "أحمد",
      "lastName": "محمد"
    },
    "workInfo": {
      "employeeId": "EMP001",
      "department": "IT",
      "position": "مدير"
    }
  }'
```

### 3. تسجيل الدخول

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@1234"
  }'
```

احفظ الـ `accessToken` من الاستجابة!

### 4. الحصول على بيانات المستخدم

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. إنشاء جلسة WhatsApp

```bash
curl -X POST http://localhost:5000/api/v1/whatsapp/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionName": "default"
  }'
```

### 6. الحصول على QR Code

```bash
curl http://localhost:5000/api/v1/whatsapp/sessions/default/qr \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

ستحصل على QR Code كـ Data URL - افتحه في المتصفح لمسحه بـ WhatsApp!

### 7. إرسال رسالة WhatsApp

```bash
curl -X POST http://localhost:5000/api/v1/whatsapp/messages/send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "201234567890",
    "text": "مرحباً من نظام ERP!",
    "sessionName": "default"
  }'
```

## 📱 استخدام Postman

### 1. استيراد Collection

يمكنك إنشاء Postman Collection مع هذه الـ Endpoints:

**Base URL**: `http://localhost:5000/api/v1`

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer {{accessToken}}` (للمسارات المحمية)

### 2. Environment Variables

أنشئ Environment في Postman:
- `baseUrl`: `http://localhost:5000/api/v1`
- `accessToken`: (سيتم ملؤه بعد Login)

### 3. Endpoints الرئيسية

#### Auth
- `POST /auth/register` - تسجيل مستخدم جديد
- `POST /auth/login` - تسجيل الدخول
- `POST /auth/logout` - تسجيل الخروج
- `GET /auth/me` - بيانات المستخدم الحالي
- `POST /auth/refresh` - تحديث Access Token
- `POST /auth/forgot-password` - نسيت كلمة المرور
- `POST /auth/reset-password/:token` - إعادة تعيين كلمة المرور
- `POST /auth/change-password` - تغيير كلمة المرور

#### WhatsApp
- `POST /whatsapp/sessions` - إنشاء جلسة
- `GET /whatsapp/sessions` - جميع الجلسات
- `GET /whatsapp/sessions/:name/qr` - QR Code
- `GET /whatsapp/sessions/:name/status` - حالة الجلسة
- `DELETE /whatsapp/sessions/:name` - قطع الاتصال
- `POST /whatsapp/messages/send` - إرسال رسالة
- `GET /whatsapp/messages` - الرسائل
- `GET /whatsapp/contacts` - جهات الاتصال
- `GET /whatsapp/stats` - الإحصائيات

## 🐛 استكشاف الأخطاء

### MongoDB لا يعمل

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
sudo systemctl status mongod
```

### Port 5000 مستخدم

غير `PORT` في ملف `.env`:
```env
PORT=5001
```

### خطأ في الاتصال بقاعدة البيانات

تأكد من:
1. MongoDB يعمل
2. `MONGODB_URI` صحيح في `.env`
3. لا يوجد firewall يمنع الاتصال

### خطأ في WhatsApp

تأكد من:
1. مسح QR Code خلال 60 ثانية
2. الهاتف متصل بالإنترنت
3. WhatsApp مثبت على الهاتف

## 📊 الاختبارات

### تشغيل جميع الاختبارات

```bash
npm test
```

### اختبارات Models فقط

```bash
npm test -- tests/unit/models.test.js
```

### اختبارات Auth فقط

```bash
npm test -- tests/integration/auth.test.js
```

## 🔒 الأمان

### في الإنتاج:

1. **غير JWT Secrets**:
```env
JWT_SECRET=use-a-very-long-random-string-here
JWT_REFRESH_SECRET=use-another-very-long-random-string
```

2. **استخدم HTTPS**:
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

3. **فعّل Redis للـ Caching**:
```env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

## 📚 الوثائق

- [API Documentation](./API_DOCUMENTATION.md) - قريباً
- [Database Schema](./DATABASE_SCHEMA.md) - قريباً
- [WhatsApp Integration](./WHATSAPP_GUIDE.md) - قريباً

## 🆘 الدعم

إذا واجهت أي مشاكل:
1. تحقق من الـ logs في `backend/logs/`
2. تأكد من جميع المتطلبات مثبتة
3. راجع ملف `.env`

## ✅ الخطوات التالية

بعد تشغيل Backend بنجاح:

1. ✅ جرب جميع Auth Endpoints
2. ✅ أنشئ جلسة WhatsApp وامسح QR Code
3. ✅ جرب إرسال رسالة WhatsApp
4. ✅ ابدأ بتطوير Frontend (Next.js)
5. ✅ أضف المزيد من الـ Modules (Attendance, Projects, etc.)

---

**تم إنشاؤه بواسطة**: Augment Agent
**التاريخ**: 2025-09-30
**الإصدار**: 1.0.0

