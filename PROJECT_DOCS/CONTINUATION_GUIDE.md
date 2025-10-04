# 🚀 دليل المتابعة - WhatsApp Messages Page Development

**الغرض من هذا الملف:** تمكينك من مواصلة العمل على المشروع من أي جهاز جديد بسهولة.

---

## 📋 Context Summary

### ما هو المشروع؟
نظام SaaS ERP متكامل يحتوي على:
- إدارة العملاء والمشاريع والمهام
- نظام WhatsApp Business API Integration
- صفحة دردشة WhatsApp احترافية (محور التطوير الحالي)

### الهدف من التطوير الحالي:
تحويل صفحة الدردشة من نظام بسيط إلى نظام احترافي كامل يتضمن:
1. **User Tracking:** تتبع من رد على كل رسالة
2. **Conversation Management:** إدارة المحادثات (تعيين، حالة، ملاحظات)
3. **Professional UI/UX:** واجهة احترافية مع avatars وتحسينات
4. **Advanced Features:** بحث، قوالب، تحليلات

### التقنيات المستخدمة:
- **Backend:** Node.js 22.14.0 + Express.js + MySQL 8.0 + Sequelize ORM
- **Frontend:** Next.js 14.2.33 (App Router) + React 18.3.1 + TypeScript + Tailwind CSS
- **Real-time:** Socket.io
- **WhatsApp:** Baileys library
- **Database:** Hostinger MySQL

---

## 🎯 Current State

### ✅ ما يعمل بنجاح:

#### Backend (Port 8000):
- ✅ MySQL database متصل بنجاح
- ✅ 15+ Sequelize models مُهيأة
- ✅ Authentication system (JWT + Refresh Tokens)
- ✅ WhatsApp integration (2 sessions نشطة)
- ✅ WebSocket service يعمل
- ✅ 3 migrations مطبقة بنجاح:
  - User tracking في messages
  - WhatsApp conversations table
  - Conversation notes table
- ✅ 8 conversation management endpoints جديدة
- ✅ User info يُحفظ مع كل رسالة صادرة

#### Frontend (Port 8001):
- ✅ Next.js app يعمل بنجاح
- ✅ صفحة الدردشة محسّنة:
  - User avatars تظهر
  - أسماء المستخدمين تظهر
  - Contact info panel على اليمين
  - Timestamps محسّنة
  - Status indicators واضحة
- ✅ WebSocket متصل بـ Backend
- ✅ API integration يعمل

#### Database:
- ✅ جميع الجداول موجودة وتعمل
- ✅ Foreign keys صحيحة
- ✅ Indexes محسّنة (تم حل مشكلة الـ 64 index)

### ⏳ ما لا يعمل بعد (المهام المتبقية):

#### Phase 2 المتبقية:
1. ❌ Message Search & Filters
2. ❌ Quick Replies & Templates
3. ❌ File Upload في Message Input
4. ❌ Conversation Assignment UI
5. ❌ Notes Section UI

#### Phase 3 & 4:
- لم يتم البدء بها بعد

---

## 🔧 Technical Details

### Database Connection:
```javascript
{
  host: 'srv1812.hstgr.io',
  user: 'u339372869_newtask',
  password: '0165676135Aa@A',
  database: 'u339372869_newtask',
  port: 3306,
  dialect: 'mysql'
}
```

### Ports:
- **Backend:** 8000
- **Frontend:** 8001
- **MySQL:** 3306 (remote)
- **WebSocket:** 8000 (same as backend)

### Environment Variables:

**Backend (.env):**
```env
PORT=8000
NODE_ENV=development

# Database
DB_HOST=srv1812.hstgr.io
DB_USER=u339372869_newtask
DB_PASSWORD=0165676135Aa@A
DB_NAME=u339372869_newtask
DB_PORT=3306

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-2024
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Dependencies المثبتة:

**Backend:**
```json
{
  "express": "^4.18.2",
  "sequelize": "^6.35.2",
  "mysql2": "^3.7.0",
  "socket.io": "^4.6.1",
  "@whiskeysockets/baileys": "^6.5.0",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "winston": "^3.11.0",
  "dotenv": "^16.3.1"
}
```

**Frontend:**
```json
{
  "next": "14.2.33",
  "react": "18.3.1",
  "typescript": "^5",
  "tailwindcss": "^3.4.1",
  "axios": "^1.6.5",
  "socket.io-client": "^4.6.1"
}
```

---

## ⚠️ Important Notes

### 1. Database Indexes Problem (تم حله):
**المشكلة:**
- كان هناك 64 index على جدول `organizations` (الحد الأقصى)
- جميعها على نفس الـ `domain` column

**الحل المطبق:**
- حذف جميع الـ indexes الزائدة
- تعطيل `sequelize.sync({ alter: true })` في `backend/src/models/index.js`
- استخدام migrations فقط للتغييرات

**⚠️ تحذير مهم:**
```javascript
// في backend/src/models/index.js
// لا تفعّل هذا السطر أبداً:
// await sequelize.sync({ force: false, alter: true }); // ❌

// استخدم migrations بدلاً من ذلك
```

### 2. Migration Strategy:
- **لا تستخدم** `sequelize.sync()` أبداً
- **استخدم** migration files فقط
- **أداة التشغيل:** `backend/scripts/run-migration.js`

```bash
# تشغيل migration
cd backend
node scripts/run-migration.js <migration-file-name>.sql
```

### 3. WhatsApp Sessions:
- Sessions تُحفظ في database (جدول `whatsapp_sessions`)
- تُستعاد تلقائياً عند تشغيل Backend
- Session IDs الحالية: `123`, `01017854018`

### 4. Frontend API Configuration:
- جميع API endpoints في `frontend/src/lib/api.ts`
- Axios instance مع automatic JWT token injection
- WebSocket URL في نفس الملف

### 5. User Authentication:
- يجب تسجيل الدخول أولاً للوصول لصفحة الدردشة
- User credentials للاختبار:
  ```
  Email: admin@test.com
  Password: Admin@123456
  ```

---

## 🚀 Quick Start Commands

### 1. تشغيل المشروع من الصفر:

```bash
# 1. Clone/Pull المشروع
cd e:\newtask

# 2. تثبيت Dependencies (إذا لم تكن مثبتة)
cd backend && npm install
cd ../frontend && npm install

# 3. التأكد من Environment Variables
# تحقق من وجود:
# - backend/.env
# - frontend/.env.local

# 4. تشغيل Backend
cd backend
npm start
# يجب أن ترى: ✅ Server running on port 8000

# 5. تشغيل Frontend (في terminal آخر)
cd frontend
npm run dev
# يجب أن ترى: ✅ Ready on http://localhost:8001

# 6. فتح المتصفح
# http://localhost:8001/login
# سجل دخول ثم اذهب إلى:
# http://localhost:8001/dashboard/whatsapp/messages
```

### 2. التحقق من حالة Database:

```bash
cd backend

# التحقق من الاتصال
node -e "
import mysql from 'mysql2/promise';
const config = {
  host: 'srv1812.hstgr.io',
  user: 'u339372869_newtask',
  password: '0165676135Aa@A',
  database: 'u339372869_newtask',
  port: 3306
};
const conn = await mysql.createConnection(config);
console.log('✅ Connected to database');
await conn.end();
"

# عرض الجداول
node -e "
import mysql from 'mysql2/promise';
const config = { /* same as above */ };
const conn = await mysql.createConnection(config);
const [tables] = await conn.query('SHOW TABLES');
console.log('Tables:', tables);
await conn.end();
"
```

### 3. تشغيل Migration جديد:

```bash
cd backend

# إنشاء migration file
# أنشئ ملف في backend/migrations/ باسم:
# YYYYMMDD_description.sql

# تشغيل Migration
node scripts/run-migration.js <filename>.sql

# مثال:
node scripts/run-migration.js 20250103_add_new_field.sql
```

### 4. اختبار API Endpoints:

```bash
# تسجيل دخول
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@123456"}'

# الحصول على token من الـ response ثم:

# جلب الرسائل
curl -X GET "http://localhost:8000/api/v1/whatsapp/messages?sessionId=123" \
  -H "Authorization: Bearer <YOUR_TOKEN>"

# جلب المحادثات
curl -X GET "http://localhost:8000/api/v1/whatsapp/conversations" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 5. مراقبة Logs:

```bash
# Backend logs
cd backend
npm start
# سترى logs في console

# Frontend logs
cd frontend
npm run dev
# سترى logs في console

# Database queries (في Backend)
# تفعيل logging في backend/src/config/database.js:
# logging: console.log
```

---

## 📝 Next Steps (الخطوات التالية بالترتيب)

### المرحلة الحالية: Phase 2 - Task 6

#### Task 2.6: Message Search & Filters
**الهدف:** إضافة بحث في الرسائل وفلترة

**الملفات المطلوب تعديلها:**
1. `frontend/src/app/dashboard/whatsapp/messages/page.tsx`

**الخطوات:**
1. إضافة search input في header
2. إضافة filter buttons (الكل، واردة، صادرة)
3. إضافة date range picker
4. تحديث `fetchMessages()` لإرسال filters إلى API
5. تحديث Backend endpoint لدعم search query

**مثال على الكود:**
```typescript
// State
const [searchQuery, setSearchQuery] = useState('');
const [messageFilter, setMessageFilter] = useState<'all' | 'inbound' | 'outbound'>('all');

// Filter messages
const filteredMessages = messages.filter(msg => {
  const matchesSearch = searchQuery === '' || 
    (typeof msg.content === 'string' && msg.content.includes(searchQuery)) ||
    (typeof msg.content === 'object' && msg.content.text?.includes(searchQuery));
  
  const matchesFilter = messageFilter === 'all' || msg.direction === messageFilter;
  
  return matchesSearch && matchesFilter;
});
```

#### Task 2.7: Quick Replies & Templates
**الهدف:** إضافة قوالب رسائل جاهزة

**الملفات المطلوب إنشاؤها:**
1. `backend/migrations/20250104_create_message_templates.sql`
2. `backend/src/models/MessageTemplate.js`
3. `backend/src/services/templateService.js`
4. `backend/src/controllers/templateController.js`

**الملفات المطلوب تعديلها:**
1. `frontend/src/app/dashboard/whatsapp/messages/page.tsx`

**الخطوات:**
1. إنشاء جدول `message_templates` في database
2. إنشاء CRUD endpoints للقوالب
3. إضافة UI لعرض القوالب
4. إضافة زر لإدراج قالب في message input

#### Task 2.8: File Upload
**الهدف:** دعم رفع الملفات والصور

**الملفات المطلوب تعديلها:**
1. `frontend/src/app/dashboard/whatsapp/messages/page.tsx`
2. `backend/src/controllers/whatsappController.js`
3. `backend/src/services/whatsappService.js`

**الخطوات:**
1. إضافة file input في message area
2. إضافة preview للملفات المختارة
3. تحديث `sendMessage()` لدعم file upload
4. استخدام Baileys API لإرسال media messages

#### Task 2.9: Conversation Assignment UI
**الهدف:** واجهة لتعيين المحادثات

**الملفات المطلوب تعديلها:**
1. `frontend/src/app/dashboard/whatsapp/messages/page.tsx`

**الخطوات:**
1. إضافة dropdown في Contact Info Panel
2. جلب قائمة المستخدمين من API
3. إضافة زر "تعيين" مع modal
4. استدعاء API endpoint للتعيين
5. تحديث UI عند نجاح التعيين

#### Task 2.10: Notes Section
**الهدف:** إضافة ملاحظات داخلية

**الملفات المطلوب تعديلها:**
1. `frontend/src/app/dashboard/whatsapp/messages/page.tsx`

**الخطوات:**
1. إضافة notes section في Contact Info Panel
2. عرض الملاحظات الموجودة
3. إضافة textarea لإضافة ملاحظة جديدة
4. استدعاء API endpoints للملاحظات
5. تحديث UI real-time عبر WebSocket

---

## 🔍 Troubleshooting

### مشكلة: Backend لا يشتغل
```bash
# تحقق من الـ port
netstat -ano | findstr :8000

# إذا كان مستخدم، اقتل العملية
taskkill /PID <PID> /F

# أو غيّر الـ port في .env
PORT=5000
```

### مشكلة: Frontend لا يتصل بـ Backend
```bash
# تحقق من NEXT_PUBLIC_API_URL في .env.local
echo $NEXT_PUBLIC_API_URL

# يجب أن يكون:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### مشكلة: Database connection failed
```bash
# تحقق من credentials في backend/.env
# تحقق من الاتصال بالإنترنت (database على Hostinger)
ping srv1812.hstgr.io
```

### مشكلة: Sequelize sync errors
```bash
# تأكد من أن sync معطل في backend/src/models/index.js
# يجب أن يكون:
// await sequelize.sync({ force: false, alter: true }); // ❌ معطل
logger.info('✅ Skipping sync - using migrations instead');
```

---

## 📚 مصادر إضافية

- **PROGRESS_REPORT.md:** تقرير مفصل بكل ما تم إنجازه
- **DATABASE_STATE.md:** حالة قاعدة البيانات والـ schema
- **PHASE_2_REMAINING_TASKS.md:** تفاصيل المهام المتبقية
- **backend/RESTORATION_DOCS/:** وثائق النظام الأصلية

---

**آخر تحديث:** 2025-10-03  
**الحالة:** جاهز للمتابعة ✅  
**التواصل:** راجع ملفات التوثيق للمزيد من التفاصيل

