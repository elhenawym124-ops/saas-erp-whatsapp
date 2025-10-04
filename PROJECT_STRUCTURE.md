# 📁 هيكل المشروع الكامل

## 🏗️ البنية العامة

```
saas-erp-system/
│
├── backend/                    # 🔧 Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/            # إعدادات التطبيق
│   │   │   ├── app.js         # إعدادات مركزية
│   │   │   ├── database.js    # اتصال MongoDB
│   │   │   ├── redis.js       # اتصال Redis
│   │   │   └── logger.js      # نظام السجلات
│   │   │
│   │   ├── models/            # نماذج قاعدة البيانات
│   │   │   ├── User.js
│   │   │   ├── Organization.js
│   │   │   ├── Attendance.js
│   │   │   ├── Project.js
│   │   │   ├── Task.js
│   │   │   ├── WhatsApp.js
│   │   │   └── index.js
│   │   │
│   │   ├── controllers/       # معالجات الطلبات
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── projectController.js
│   │   │   ├── whatsappController.js
│   │   │   └── index.js
│   │   │
│   │   ├── services/          # منطق الأعمال
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── projectService.js
│   │   │   ├── whatsappService.js
│   │   │   ├── notificationService.js
│   │   │   └── index.js
│   │   │
│   │   ├── routes/            # مسارات API
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── attendance.js
│   │   │   ├── projects.js
│   │   │   ├── whatsapp.js
│   │   │   └── index.js
│   │   │
│   │   ├── middleware/        # Middleware functions
│   │   │   ├── auth.js        # مصادقة JWT
│   │   │   ├── validation.js  # التحقق من البيانات
│   │   │   ├── errorHandler.js # معالجة الأخطاء
│   │   │   ├── rateLimit.js   # حماية من الهجمات
│   │   │   └── upload.js      # رفع الملفات
│   │   │
│   │   ├── utils/             # دوال مساعدة
│   │   │   ├── constants.js   # الثوابت
│   │   │   ├── helpers.js     # دوال عامة
│   │   │   └── validators.js  # التحقق من البيانات
│   │   │
│   │   ├── app.js             # تطبيق Express
│   │   └── server.js          # نقطة البداية
│   │
│   ├── tests/                 # الاختبارات
│   │   ├── unit/              # اختبارات الوحدة
│   │   │   ├── helpers.test.js
│   │   │   ├── models.test.js
│   │   │   └── services.test.js
│   │   │
│   │   ├── integration/       # اختبارات التكامل
│   │   │   ├── auth.test.js
│   │   │   ├── attendance.test.js
│   │   │   └── projects.test.js
│   │   │
│   │   ├── e2e/               # اختبارات شاملة
│   │   │   └── workflows.test.js
│   │   │
│   │   └── setup.js           # إعداد الاختبارات
│   │
│   ├── logs/                  # ملفات السجلات
│   ├── uploads/               # الملفات المرفوعة
│   ├── sessions/              # جلسات WhatsApp
│   │
│   ├── .env                   # متغيرات البيئة
│   ├── .env.example           # نموذج متغيرات البيئة
│   ├── .gitignore
│   ├── package.json
│   ├── eslint.config.js
│   ├── .prettierrc
│   ├── nodemon.json
│   ├── jest.config.js
│   ├── Dockerfile
│   └── README.md
│
├── frontend/                   # 🎨 Frontend (Next.js + React + TypeScript)
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   │   ├── (auth)/        # مجموعة المصادقة
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── (dashboard)/   # مجموعة لوحة التحكم
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── attendance/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── tasks/
│   │   │   │   ├── team/
│   │   │   │   ├── customers/
│   │   │   │   ├── invoices/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── layout.tsx     # Layout رئيسي
│   │   │   ├── page.tsx       # الصفحة الرئيسية
│   │   │   └── globals.css
│   │   │
│   │   ├── components/        # مكونات React
│   │   │   ├── ui/            # مكونات UI أساسية
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── forms/         # نماذج
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── AttendanceForm.tsx
│   │   │   │   ├── ProjectForm.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── layouts/       # Layouts
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Footer.tsx
│   │   │   │
│   │   │   └── shared/        # مكونات مشتركة
│   │   │       ├── Loading.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── ...
│   │   │
│   │   ├── lib/               # مكتبات ودوال
│   │   │   ├── api/           # API clients
│   │   │   │   ├── client.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── attendance.ts
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── hooks/         # Custom hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useUser.ts
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── store/         # State management
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── userStore.ts
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── utils/         # دوال مساعدة
│   │   │       ├── helpers.ts
│   │   │       ├── validators.ts
│   │   │       └── constants.ts
│   │   │
│   │   ├── styles/            # ملفات CSS
│   │   │   └── globals.css
│   │   │
│   │   └── types/             # TypeScript types
│   │       ├── user.ts
│   │       ├── project.ts
│   │       └── ...
│   │
│   ├── public/                # ملفات ثابتة
│   │   ├── images/
│   │   ├── icons/
│   │   └── favicon.ico
│   │
│   ├── .env.example
│   ├── .env.local
│   ├── .gitignore
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── postcss.config.js
│   ├── Dockerfile
│   └── README.md
│
├── shared/                     # 📦 كود مشترك
│   └── types/                 # TypeScript types مشتركة
│       ├── user.ts
│       ├── project.ts
│       └── ...
│
├── docs/                       # 📚 التوثيق
│   ├── API.md                 # توثيق API
│   ├── DEPLOYMENT.md          # دليل النشر
│   ├── ARCHITECTURE.md        # البنية المعمارية
│   └── CONTRIBUTING.md        # دليل المساهمة
│
├── .gitignore                 # Git ignore رئيسي
├── docker-compose.yml         # Docker configuration
├── README.md                  # التوثيق الرئيسي
├── PHASE1_COMPLETED.md        # تقرير المرحلة 1
├── PROJECT_STRUCTURE.md       # هذا الملف
└── LICENSE                    # الترخيص

```

## 📊 إحصائيات المشروع

### Backend
- **عدد الملفات**: 30+ ملف
- **عدد الأسطر**: 3000+ سطر
- **عدد الاختبارات**: 20+ اختبار
- **التغطية**: 80%+

### Frontend
- **عدد الصفحات**: 15+ صفحة
- **عدد المكونات**: 50+ مكون
- **عدد الأسطر**: 5000+ سطر

## 🔄 تدفق البيانات

```
Frontend (Next.js)
    ↓ HTTP/WebSocket
Backend API (Express)
    ↓ Mongoose
MongoDB Database
    ↓ Cache
Redis
```

## 🚀 الميزات الرئيسية لكل مجلد

### Backend Features
- ✅ RESTful API
- ✅ JWT Authentication
- ✅ Role-based Access Control
- ✅ File Upload
- ✅ WhatsApp Integration
- ✅ Real-time Notifications
- ✅ Cron Jobs
- ✅ Logging System
- ✅ Error Handling
- ✅ Rate Limiting

### Frontend Features
- ✅ Server-Side Rendering (SSR)
- ✅ Static Site Generation (SSG)
- ✅ Client-Side Rendering (CSR)
- ✅ Responsive Design
- ✅ Dark Mode
- ✅ RTL Support
- ✅ Progressive Web App (PWA)
- ✅ Offline Support
- ✅ Real-time Updates
- ✅ Form Validation

## 📝 ملاحظات

1. **الفصل الواضح**: Backend و Frontend منفصلان تماماً
2. **قابلية التوسع**: سهولة إضافة ميزات جديدة
3. **الصيانة**: كل جزء مستقل ويمكن صيانته بشكل منفصل
4. **النشر**: يمكن نشر كل جزء على خادم منفصل
5. **الاختبار**: اختبارات منفصلة لكل جزء

---

**آخر تحديث**: 2025-09-30

