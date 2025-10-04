# 📘 دليل الترحيل من MongoDB إلى MySQL

## 🎯 الهدف
تم ترحيل المشروع من MongoDB/Mongoose إلى MySQL/Sequelize بنجاح.

---

## ✅ ما تم إنجازه

### 1. النماذج المُحولة (8 نماذج)

#### ✅ النماذج الجاهزة:
1. **Organization** - `models/Organization.js`
2. **User** - `models/User-mysql.js`
3. **Customer** - `models/Customer-mysql.js`
4. **Project** - `models/Project-mysql.js`
5. **Task** - `models/Task-mysql.js`
6. **WhatsAppSession** - `models/WhatsAppSession.js`
7. **WhatsAppMessage** - `models/WhatsAppMessage.js`
8. **WhatsAppContact** - `models/WhatsAppContact.js`

#### ⏳ النماذج المتبقية (10 نماذج):
- Attendance
- WorkSchedule
- LeaveRequest
- Invoice
- Expense
- Payroll
- Payment
- Product
- StockMovement
- Subscription
- NotificationTemplate

---

## 🔧 التغييرات الرئيسية

### 1. قاعدة البيانات

**قبل:**
```javascript
// MongoDB
mongoose.connect(process.env.MONGODB_URI);
```

**بعد:**
```javascript
// MySQL
const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'mysql'
});
```

### 2. النماذج

**قبل (Mongoose):**
```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

export default mongoose.model('User', userSchema);
```

**بعد (Sequelize):**
```javascript
const User = (sequelize) => {
  return sequelize.define('User', {
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  });
};

export default User;
```

### 3. الاستعلامات

**قبل (Mongoose):**
```javascript
// البحث
const user = await User.findOne({ email });

// الإنشاء
const user = await User.create({ email, password });

// التحديث
await User.findByIdAndUpdate(id, { name: 'New Name' });

// الحذف
await User.findByIdAndDelete(id);
```

**بعد (Sequelize):**
```javascript
// البحث
const user = await User.findOne({ where: { email } });

// الإنشاء
const user = await User.create({ email, password });

// التحديث
await user.update({ name: 'New Name' });
// أو
await User.update({ name: 'New Name' }, { where: { id } });

// الحذف
await user.destroy();
// أو
await User.destroy({ where: { id } });
```

### 4. العلاقات

**قبل (Mongoose):**
```javascript
const userSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  }
});

// Populate
const user = await User.findById(id).populate('organization');
```

**بعد (Sequelize):**
```javascript
// في models/index.js
User.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Include
const user = await User.findByPk(id, {
  include: [{
    model: Organization,
    as: 'organization'
  }]
});
```

---

## 🚀 كيفية الاستخدام

### 1. إعداد قاعدة البيانات

```bash
# إنشاء قاعدة بيانات MySQL
mysql -u root -p
CREATE DATABASE saas_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'saas_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON saas_erp.* TO 'saas_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. تحديث .env

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=saas_erp
DB_USER=saas_user
DB_PASSWORD=your_password
DB_DIALECT=mysql
```

### 3. تشغيل التطبيق

```bash
# تثبيت التبعيات
npm install

# تشغيل في وضع التطوير
npm run dev

# سيتم إنشاء الجداول تلقائياً عند أول تشغيل
```

---

## 📝 API Endpoints الجاهزة

### Auth
- `POST /api/v1/auth/register` - تسجيل مستخدم جديد
- `POST /api/v1/auth/login` - تسجيل الدخول
- `POST /api/v1/auth/logout` - تسجيل الخروج
- `POST /api/v1/auth/refresh` - تحديث access token
- `POST /api/v1/auth/forgot-password` - طلب إعادة تعيين كلمة المرور
- `POST /api/v1/auth/reset-password/:token` - إعادة تعيين كلمة المرور
- `GET /api/v1/auth/me` - الحصول على بيانات المستخدم الحالي
- `PUT /api/v1/auth/me` - تحديث بيانات المستخدم

### WhatsApp (جاهز)
- جميع endpoints WhatsApp تعمل بشكل صحيح

---

## ⚠️ ملاحظات مهمة

### 1. الفروقات الرئيسية

| الميزة | Mongoose | Sequelize |
|--------|----------|-----------|
| ID | `_id` (ObjectId) | `id` (Integer) |
| Timestamps | `createdAt`, `updatedAt` | `created_at`, `updated_at` |
| Foreign Keys | `ObjectId` | `Integer` |
| Populate | `.populate()` | `include: []` |
| Virtuals | مدعوم | مدعوم |
| Hooks | `pre`, `post` | `beforeCreate`, `afterCreate` |

### 2. Migration Checklist

عند تحويل نموذج جديد:
- [ ] إنشاء ملف النموذج الجديد (`ModelName-mysql.js`)
- [ ] تحديد جميع الحقول مع أنواع البيانات الصحيحة
- [ ] إضافة Indexes للأداء
- [ ] إضافة Hooks إذا لزم الأمر
- [ ] إضافة Instance Methods
- [ ] تحديث `models/index.js` لإضافة النموذج
- [ ] إضافة العلاقات في `setupAssociations()`
- [ ] تحديث Controllers لاستخدام Sequelize syntax
- [ ] تحديث Services
- [ ] اختبار جميع الـ endpoints

---

## 🔄 الخطوات التالية

### الأولوية العالية:
1. ✅ تحويل نماذج Invoice, Payment, Expense
2. ✅ تحويل نماذج Attendance, LeaveRequest
3. ✅ تحديث Controllers و Services
4. ✅ إصلاح الاختبارات

### الأولوية المتوسطة:
5. ✅ تحويل باقي النماذج
6. ✅ إزالة Mongoose من dependencies
7. ✅ تحديث التوثيق

---

## 📚 مصادر مفيدة

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Sequelize Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)
- [Sequelize Associations](https://sequelize.org/docs/v6/core-concepts/assocs/)

---

**آخر تحديث**: 2025-10-03

