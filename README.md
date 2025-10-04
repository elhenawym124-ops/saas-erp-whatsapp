# 🚀 SaaS ERP System - نظام إدارة المؤسسات الشامل

نظام إدارة مؤسسات متكامل (ERP) مع تكامل WhatsApp باستخدام Baileys

## المميزات الرئيسية

### 🚀 الوحدات الأساسية
- ✅ **نظام الحضور والانصراف**: تسجيل متعدد الطرق مع تحديد الموقع والصور
- ✅ **إدارة المشاريع والمهام**: تتبع شامل للمشاريع مع تقدير الوقت والتكلفة
- ✅ **إدارة الفريق**: ملفات الموظفين وتقييم الأداء
- ✅ **CRM**: إدارة العملاء وخط المبيعات
- ✅ **المحاسبة**: الفواتير والمصروفات والرواتب
- ✅ **المخزون**: تتبع المنتجات والحركات

### 📱 تكامل WhatsApp
- إرسال واستقبال الرسائل (نصوص، صور، مستندات)
- أزرار تفاعلية وقوائم
- إشعارات ذكية مجدولة
- إدارة جلسات متعددة (Multi-tenant)
- معالجة الأخطاء وإعادة الاتصال التلقائي

## التقنيات المستخدمة

- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Cache**: Redis
- **WhatsApp**: Baileys
- **Authentication**: JWT
- **Validation**: Joi + Express Validator
- **Security**: Helmet, bcrypt, rate limiting
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier + Husky

## متطلبات التشغيل

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 7.0 (اختياري للـ caching)

## التثبيت

```bash
# 1. استنساخ المشروع
git clone <repository-url>
cd saas-erp-whatsapp

# 2. تثبيت التبعيات
npm install

# 3. إعداد ملف البيئة
cp .env.example .env
# قم بتعديل .env بالإعدادات المناسبة

# 4. تشغيل المشروع في وضع التطوير
npm run dev

# 5. تشغيل المشروع في وضع الإنتاج
npm start
```

## الأوامر المتاحة

```bash
npm run dev          # تشغيل في وضع التطوير مع nodemon
npm start            # تشغيل في وضع الإنتاج
npm test             # تشغيل جميع الاختبارات
npm run test:watch   # تشغيل الاختبارات في وضع المراقبة
npm run test:unit    # تشغيل اختبارات الوحدة فقط
npm run lint         # فحص الكود
npm run lint:fix     # إصلاح مشاكل الكود تلقائياً
npm run format       # تنسيق الكود
```

## هيكل المشروع

```
src/
├── config/          # إعدادات التطبيق
├── models/          # نماذج قاعدة البيانات
├── controllers/     # معالجات الطلبات
├── services/        # منطق الأعمال
├── routes/          # مسارات API
├── middleware/      # Middleware functions
├── utils/           # دوال مساعدة
└── tests/           # الاختبارات
    ├── unit/        # اختبارات الوحدة
    ├── integration/ # اختبارات التكامل
    └── e2e/         # اختبارات شاملة
```

## الأمان

- 🔐 تشفير كلمات المرور باستخدام bcrypt
- 🔑 مصادقة JWT مع Refresh Tokens
- 🛡️ حماية من الهجمات الشائعة (XSS, SQL Injection)
- ⚡ Rate Limiting لمنع الهجمات
- 🔒 Helmet لحماية HTTP Headers
- 📝 تسجيل جميع العمليات الحساسة

## المساهمة

نرحب بجميع المساهمات! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للفرع (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## الترخيص

MIT License - راجع ملف [LICENSE](LICENSE) للتفاصيل

## الدعم

للدعم والاستفسارات، يرجى فتح Issue في المشروع.

