# 👨‍💻 دليل المطور - Developer Guide

## 📋 جدول المحتويات

1. [معايير الكود](#معايير-الكود)
2. [البنية المعمارية](#البنية-المعمارية)
3. [إضافة ميزة جديدة](#إضافة-ميزة-جديدة)
4. [كتابة الاختبارات](#كتابة-الاختبارات)
5. [Git Workflow](#git-workflow)
6. [Best Practices](#best-practices)
7. [الأدوات المساعدة](#الأدوات-المساعدة)

---

## 📏 معايير الكود

### **Naming Conventions**

#### **JavaScript/TypeScript**

```javascript
// Variables & Functions: camelCase
const userName = 'أحمد';
function getUserData() { }

// Classes & Components: PascalCase
class UserService { }
const UserProfile = () => { };

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 16777216;
const API_BASE_URL = 'http://localhost:3000';

// Private properties: _camelCase
class User {
  _privateMethod() { }
}

// Files: kebab-case
// user-service.js
// auth-middleware.js
```

#### **Database**

```javascript
// Collections/Tables: PascalCase (singular)
User, Organization, Project

// Fields: camelCase
firstName, lastName, createdAt

// Indexes: descriptive
organization_sessionName_unique
email_unique
```

---

### **Code Style**

#### **ESLint Configuration**

```json
{
  "extends": ["eslint:recommended"],
  "env": {
    "node": true,
    "es2021": true
  },
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-unused-vars": "warn",
    "no-console": "off"
  }
}
```

#### **Prettier Configuration**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

---

### **التعليقات**

```javascript
// ✅ جيد: تعليق واضح ومفيد
// تحقق من صلاحية المستخدم قبل السماح بالوصول
if (!user.permissions.includes('admin')) {
  throw new AppError('غير مصرح', 403);
}

// ❌ سيء: تعليق واضح من الكود نفسه
// زيادة العداد بواحد
counter++;

// ✅ جيد: JSDoc للدوال المهمة
/**
 * إرسال رسالة WhatsApp
 * @param {string} sessionId - معرف الجلسة
 * @param {string} to - رقم المستقبل
 * @param {string} text - نص الرسالة
 * @returns {Promise<Object>} نتيجة الإرسال
 */
async function sendMessage(sessionId, to, text) {
  // ...
}
```

---

## 🏛️ البنية المعمارية

### **MVC Pattern**

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│   Routes    │ ← تحديد المسارات
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middleware  │ ← Auth, Validation, etc.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │ ← معالجة HTTP
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │ ← منطق الأعمال
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Model     │ ← قاعدة البيانات
└─────────────┘
```

---

### **Folder Structure**

```
backend/
├── src/
│   ├── config/           # إعدادات النظام
│   │   ├── app.js        # Express app configuration
│   │   ├── database.js   # Database connections
│   │   └── logger.js     # Winston logger
│   │
│   ├── models/           # Mongoose/Sequelize models
│   │   ├── User.js
│   │   └── Organization.js
│   │
│   ├── controllers/      # HTTP handlers
│   │   ├── authController.js
│   │   └── userController.js
│   │
│   ├── services/         # Business logic
│   │   ├── authService.js
│   │   └── whatsappService.js
│   │
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   └── users.js
│   │
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # Authentication
│   │   ├── authorize.js  # Authorization
│   │   └── validate.js   # Validation
│   │
│   ├── utils/            # Helper functions
│   │   ├── appError.js
│   │   ├── catchAsync.js
│   │   └── responseFormatter.js
│   │
│   └── server.js         # Entry point
│
├── tests/                # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/              # Utility scripts
├── logs/                 # Log files
└── uploads/              # Uploaded files
```

---

## ➕ إضافة ميزة جديدة

### **مثال: إضافة نظام الإشعارات**

#### **1. إنشاء Model**

```javascript
// src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  link: String,
  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
```

---

#### **2. إنشاء Service**

```javascript
// src/services/notificationService.js
import Notification from '../models/Notification.js';
import AppError from '../utils/appError.js';

class NotificationService {
  /**
   * إنشاء إشعار جديد
   */
  async create(data) {
    const notification = await Notification.create(data);
    
    // إرسال عبر WebSocket (اختياري)
    // this.sendViaWebSocket(notification);
    
    return notification;
  }

  /**
   * الحصول على إشعارات المستخدم
   */
  async getUserNotifications(userId, options = {}) {
    const { page = 1, limit = 20, isRead } = options;
    
    const query = { user: userId };
    if (isRead !== undefined) {
      query.isRead = isRead;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(query);
    
    return {
      notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    };
  }

  /**
   * وضع علامة مقروء
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });
    
    if (!notification) {
      throw new AppError('الإشعار غير موجود', 404);
    }
    
    notification.isRead = true;
    await notification.save();
    
    return notification;
  }

  /**
   * وضع علامة مقروء على الكل
   */
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * حذف إشعار
   */
  async delete(notificationId, userId) {
    const result = await Notification.deleteOne({
      _id: notificationId,
      user: userId,
    });
    
    if (result.deletedCount === 0) {
      throw new AppError('الإشعار غير موجود', 404);
    }
  }
}

export default new NotificationService();
```

---

#### **3. إنشاء Controller**

```javascript
// src/controllers/notificationController.js
import notificationService from '../services/notificationService.js';
import catchAsync from '../utils/catchAsync.js';
import { successResponse } from '../utils/responseFormatter.js';

export const getMyNotifications = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page, limit, isRead } = req.query;
  
  const result = await notificationService.getUserNotifications(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
    isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
  });
  
  res.json(successResponse(result, 'تم الحصول على الإشعارات بنجاح'));
});

export const markAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  const notification = await notificationService.markAsRead(id, userId);
  
  res.json(successResponse(notification, 'تم وضع علامة مقروء'));
});

export const markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  await notificationService.markAllAsRead(userId);
  
  res.json(successResponse(null, 'تم وضع علامة مقروء على جميع الإشعارات'));
});

export const deleteNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  await notificationService.delete(id, userId);
  
  res.json(successResponse(null, 'تم حذف الإشعار'));
});
```

---

#### **4. إنشاء Routes**

```javascript
// src/routes/notifications.js
import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// جميع المسارات تتطلب مصادقة
router.use(protect);

router.get('/', getMyNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
```

---

#### **5. تسجيل Routes في App**

```javascript
// src/config/app.js
import notificationRoutes from '../routes/notifications.js';

// ...
app.use('/api/v1/notifications', notificationRoutes);
```

---

## 🧪 كتابة الاختبارات

### **Unit Test Example**

```javascript
// tests/unit/services/notificationService.test.js
import notificationService from '../../../src/services/notificationService.js';
import Notification from '../../../src/models/Notification.js';

jest.mock('../../../src/models/Notification.js');

describe('NotificationService', () => {
  describe('create', () => {
    it('should create a notification', async () => {
      const mockData = {
        organization: 'org_id',
        user: 'user_id',
        type: 'info',
        title: 'إشعار جديد',
        message: 'رسالة الإشعار',
      };
      
      const mockNotification = { _id: 'notif_id', ...mockData };
      Notification.create.mockResolvedValue(mockNotification);
      
      const result = await notificationService.create(mockData);
      
      expect(result).toEqual(mockNotification);
      expect(Notification.create).toHaveBeenCalledWith(mockData);
    });
  });
});
```

---

### **Integration Test Example**

```javascript
// tests/integration/notifications.test.js
import request from 'supertest';
import app from '../../src/config/app.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('Notifications API', () => {
  let token;
  let userId = 'test_user_id';
  
  beforeAll(() => {
    token = generateToken({ _id: userId });
  });
  
  describe('GET /api/v1/notifications', () => {
    it('should return user notifications', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('notifications');
      expect(res.body.data).toHaveProperty('pagination');
    });
  });
});
```

---

## 🔀 Git Workflow

### **Branch Naming**

```bash
# Features
feature/notification-system
feature/whatsapp-auto-reply

# Bug Fixes
fix/login-error
fix/whatsapp-disconnect

# Hotfixes
hotfix/security-patch

# Releases
release/v1.2.0
```

---

### **Commit Messages**

```bash
# Format: <type>(<scope>): <subject>

# Types:
# feat: ميزة جديدة
# fix: إصلاح خطأ
# docs: توثيق
# style: تنسيق الكود
# refactor: إعادة هيكلة
# test: اختبارات
# chore: مهام صيانة

# Examples:
git commit -m "feat(notifications): add notification system"
git commit -m "fix(whatsapp): resolve session disconnect issue"
git commit -m "docs(api): update WhatsApp API documentation"
git commit -m "test(auth): add login integration tests"
```

---

### **Pull Request Template**

```markdown
## Description
وصف مختصر للتغييرات

## Type of Change
- [ ] ميزة جديدة (feature)
- [ ] إصلاح خطأ (bug fix)
- [ ] تحسين (enhancement)
- [ ] توثيق (documentation)

## Testing
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] Manual Testing

## Checklist
- [ ] الكود يتبع معايير المشروع
- [ ] تم إضافة/تحديث التوثيق
- [ ] تم إضافة/تحديث الاختبارات
- [ ] جميع الاختبارات تعمل بنجاح
- [ ] لا توجد تحذيرات ESLint
```

---

## ✨ Best Practices

### **1. Error Handling**

```javascript
// ✅ جيد: استخدام catchAsync
export const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('المستخدم غير موجود', 404);
  }
  
  res.json(successResponse(user));
});

// ❌ سيء: try-catch يدوي
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

### **2. Validation**

```javascript
// ✅ جيد: استخدام Joi
import Joi from 'joi';

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

export const validateCreateUser = (req, res, next) => {
  const { error } = createUserSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }
  next();
};
```

---

### **3. Database Queries**

```javascript
// ✅ جيد: استخدام lean() و select()
const users = await User.find({ organization: orgId })
  .select('firstName lastName email')
  .lean();

// ❌ سيء: جلب كل الحقول
const users = await User.find({ organization: orgId });
```

---

### **4. Security**

```javascript
// ✅ جيد: تشفير كلمات المرور
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 12);

// ✅ جيد: تنظيف المدخلات
import validator from 'validator';

const email = validator.normalizeEmail(req.body.email);
const sanitizedText = validator.escape(req.body.text);
```

---

## 🛠️ الأدوات المساعدة

### **VS Code Extensions**

- ESLint
- Prettier
- MongoDB for VS Code
- REST Client
- GitLens
- Thunder Client

### **Chrome Extensions**

- React Developer Tools
- Redux DevTools
- JSON Viewer

---

**تم بحمد الله ✨**

