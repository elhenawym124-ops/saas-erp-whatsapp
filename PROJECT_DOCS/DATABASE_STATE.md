# 🗄️ حالة قاعدة البيانات - Database State Documentation

**آخر تحديث:** 2025-10-03  
**Database:** MySQL 8.0 (Hostinger)  
**Host:** srv1812.hstgr.io  
**Database Name:** u339372869_newtask

---

## 📊 Migrations المطبقة

### 1. Migration: Add User Tracking to Messages
**الملف:** `backend/migrations/20250103_add_user_tracking_to_messages.sql`  
**التاريخ:** 2025-01-03  
**الحالة:** ✅ مطبق بنجاح

**التغييرات:**
```sql
ALTER TABLE whatsapp_messages 
ADD COLUMN user_id INT NULL COMMENT 'User who sent/replied to this message',
ADD COLUMN replied_by_name VARCHAR(255) NULL COMMENT 'Name of user who replied',
ADD COLUMN replied_at TIMESTAMP NULL COMMENT 'When user replied';

-- Foreign Key
ALTER TABLE whatsapp_messages
ADD CONSTRAINT fk_messages_user 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
ALTER TABLE whatsapp_messages
ADD INDEX idx_messages_user (user_id),
ADD INDEX idx_messages_replied_at (replied_at);
```

**الغرض:**
- تتبع المستخدم الذي رد على كل رسالة
- حفظ اسم المستخدم ووقت الرد
- تحسين الأداء عند البحث بـ user_id أو replied_at

---

### 2. Migration: Create WhatsApp Conversations Table
**الملف:** `backend/migrations/20250103_create_whatsapp_conversations.sql`  
**التاريخ:** 2025-01-03  
**الحالة:** ✅ مطبق بنجاح (بعد تحسين الـ indexes)

**Schema:**
```sql
CREATE TABLE whatsapp_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL COMMENT 'Organization ID',
  contact_id INT NULL COMMENT 'WhatsApp contact ID',
  session_name VARCHAR(255) NOT NULL COMMENT 'WhatsApp session name',
  status ENUM('open', 'closed', 'pending') DEFAULT 'open' COMMENT 'Conversation status',
  assigned_to INT NULL COMMENT 'User assigned to this conversation',
  tags JSON NULL COMMENT 'Conversation tags',
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT 'Conversation priority',
  last_message_at TIMESTAMP NULL COMMENT 'Last message timestamp',
  closed_at TIMESTAMP NULL COMMENT 'When conversation was closed',
  closed_by INT NULL COMMENT 'User who closed the conversation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_conversations_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  CONSTRAINT fk_conversations_contact 
    FOREIGN KEY (contact_id) REFERENCES whatsapp_contacts(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  
  CONSTRAINT fk_conversations_assigned_to 
    FOREIGN KEY (assigned_to) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  
  CONSTRAINT fk_conversations_closed_by 
    FOREIGN KEY (closed_by) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes (محسّنة - 3 بدلاً من 8)
  INDEX idx_conversations_org_contact (organization_id, contact_id),
  INDEX idx_conversations_status_assigned (status, assigned_to),
  INDEX idx_conversations_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**الغرض:**
- إدارة المحادثات مع العملاء
- تعيين المحادثات للمستخدمين
- تتبع حالة المحادثة (مفتوحة، مغلقة، معلقة)
- إضافة tags وأولويات

**ملاحظة مهمة:**
- تم تقليل عدد الـ indexes من 8 إلى 3 لتجنب مشكلة الحد الأقصى (64 index)
- الـ indexes المدمجة توفر نفس الأداء مع عدد أقل

---

### 3. Migration: Create Conversation Notes Table
**الملف:** `backend/migrations/20250103_create_conversation_notes.sql`  
**التاريخ:** 2025-01-03  
**الحالة:** ✅ مطبق بنجاح

**Schema:**
```sql
CREATE TABLE conversation_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL COMMENT 'Conversation ID',
  user_id INT NOT NULL COMMENT 'User who created the note',
  note TEXT NOT NULL COMMENT 'Note content',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_notes_conversation 
    FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  CONSTRAINT fk_notes_user 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Indexes
  INDEX idx_notes_conversation (conversation_id),
  INDEX idx_notes_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**الغرض:**
- إضافة ملاحظات داخلية على المحادثات
- تتبع من أضاف الملاحظة ومتى
- مفيد للتواصل بين أعضاء الفريق

---

## 📋 Schema الحالي للجداول المهمة

### 1. whatsapp_messages (محدّث)

**الأعمدة الأساسية:**
```
id                  INT PRIMARY KEY AUTO_INCREMENT
organization_id     INT NOT NULL
session_name        VARCHAR(255) NOT NULL
message_id          VARCHAR(255) UNIQUE
from_number         VARCHAR(50)
to_number           VARCHAR(50)
direction           ENUM('inbound', 'outbound')
message_type        ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'button', 'list')
content             JSON
status              ENUM('pending', 'sent', 'delivered', 'read', 'failed')
sent_at             TIMESTAMP
delivered_at        TIMESTAMP NULL
read_at             TIMESTAMP NULL
metadata            JSON NULL
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**الأعمدة الجديدة (User Tracking):**
```
user_id             INT NULL                    -- المستخدم الذي رد
replied_by_name     VARCHAR(255) NULL           -- اسم المستخدم
replied_at          TIMESTAMP NULL              -- وقت الرد
```

**Foreign Keys:**
- `fk_messages_organization` → organizations(id)
- `fk_messages_user` → users(id) ✨ جديد

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (message_id)
- idx_messages_organization (organization_id)
- idx_messages_session (session_name)
- idx_messages_direction (direction)
- idx_messages_status (status)
- idx_messages_sent_at (sent_at)
- idx_messages_user (user_id) ✨ جديد
- idx_messages_replied_at (replied_at) ✨ جديد

---

### 2. whatsapp_conversations (جديد)

**الأعمدة:**
```
id                  INT PRIMARY KEY AUTO_INCREMENT
organization_id     INT NOT NULL
contact_id          INT NULL
session_name        VARCHAR(255) NOT NULL
status              ENUM('open', 'closed', 'pending') DEFAULT 'open'
assigned_to         INT NULL
tags                JSON NULL
priority            ENUM('high', 'medium', 'low') DEFAULT 'medium'
last_message_at     TIMESTAMP NULL
closed_at           TIMESTAMP NULL
closed_by           INT NULL
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**Foreign Keys:**
- `fk_conversations_organization` → organizations(id) ON DELETE CASCADE
- `fk_conversations_contact` → whatsapp_contacts(id) ON DELETE SET NULL
- `fk_conversations_assigned_to` → users(id) ON DELETE SET NULL
- `fk_conversations_closed_by` → users(id) ON DELETE SET NULL

**Indexes (محسّنة):**
- PRIMARY KEY (id)
- idx_conversations_org_contact (organization_id, contact_id)
- idx_conversations_status_assigned (status, assigned_to)
- idx_conversations_last_message (last_message_at)

**مثال على البيانات:**
```json
{
  "id": 1,
  "organization_id": 183,
  "contact_id": 45,
  "session_name": "123",
  "status": "open",
  "assigned_to": 5,
  "tags": ["vip", "urgent"],
  "priority": "high",
  "last_message_at": "2025-10-03 15:30:00",
  "closed_at": null,
  "closed_by": null
}
```

---

### 3. conversation_notes (جديد)

**الأعمدة:**
```
id                  INT PRIMARY KEY AUTO_INCREMENT
conversation_id     INT NOT NULL
user_id             INT NOT NULL
note                TEXT NOT NULL
created_at          TIMESTAMP
```

**Foreign Keys:**
- `fk_notes_conversation` → whatsapp_conversations(id) ON DELETE CASCADE
- `fk_notes_user` → users(id) ON DELETE CASCADE

**Indexes:**
- PRIMARY KEY (id)
- idx_notes_conversation (conversation_id)
- idx_notes_created (created_at)

**مثال على البيانات:**
```json
{
  "id": 1,
  "conversation_id": 1,
  "user_id": 5,
  "note": "العميل طلب عرض سعر للمنتج X",
  "created_at": "2025-10-03 15:35:00"
}
```

---

## 🔧 المشاكل التي حدثت وكيف تم حلها

### المشكلة 1: Too Many Indexes (64 index limit)

**الوصف:**
```
Error: Too many keys specified; max 64 keys allowed
SQL: ALTER TABLE `organizations` CHANGE `domain` `domain` VARCHAR(100) NOT NULL UNIQUE;
```

**السبب:**
- جدول `organizations` كان يحتوي على 64 index (الحد الأقصى في MySQL)
- جميعها على نفس الـ `domain` column:
  - domain, domain_2, domain_3, ... domain_60, idx_domain, unique_domain
- السبب: تشغيل `sequelize.sync({ alter: true })` عدة مرات
- كل مرة يحاول Sequelize إضافة UNIQUE index جديد بدلاً من استخدام الموجود

**الحل المطبق:**

**1. حذف جميع الـ indexes الزائدة:**
```javascript
// Script لحذف الـ indexes
const indexesToDrop = [
  'domain', 'domain_2', 'domain_3', ..., 'domain_60', 'idx_domain'
];

for (const idx of indexesToDrop) {
  await connection.query(`ALTER TABLE organizations DROP INDEX ${idx}`);
}

// النتيجة: تبقى فقط PRIMARY و unique_domain و idx_is_active
```

**2. تعطيل sequelize.sync():**
```javascript
// في backend/src/models/index.js
// قبل:
await sequelize.sync({ force: false, alter: true }); // ❌

// بعد:
// await sequelize.sync({ force: false, alter: true }); // ❌ معطل
logger.info('✅ Skipping sync - using migrations instead');
```

**3. استخدام migrations فقط:**
```bash
# بدلاً من sync، استخدم:
node scripts/run-migration.js <migration-file>.sql
```

**الدروس المستفادة:**
- ❌ لا تستخدم `sequelize.sync({ alter: true })` في production
- ✅ استخدم migrations فقط للتغييرات على schema
- ✅ راقب عدد الـ indexes في كل جدول (الحد الأقصى 64)

---

### المشكلة 2: WhatsAppConversation Indexes Overflow

**الوصف:**
- Migration الأصلي كان يحتوي على 8 indexes منفصلة
- هذا كان سيزيد العدد الإجمالي للـ indexes في database

**الحل:**
دمج الـ indexes المرتبطة:

```sql
-- قبل (8 indexes):
INDEX idx_conversations_organization (organization_id)
INDEX idx_conversations_contact (contact_id)
INDEX idx_conversations_session (session_name)
INDEX idx_conversations_status (status)
INDEX idx_conversations_assigned_to (assigned_to)
INDEX idx_conversations_priority (priority)
INDEX idx_conversations_last_message (last_message_at)
INDEX idx_conversations_created (created_at)

-- بعد (3 indexes):
INDEX idx_conversations_org_contact (organization_id, contact_id)
INDEX idx_conversations_status_assigned (status, assigned_to)
INDEX idx_conversations_last_message (last_message_at)
```

**الفوائد:**
- تقليل عدد الـ indexes من 8 إلى 3
- نفس الأداء (composite indexes تعمل بكفاءة)
- تجنب مشكلة الحد الأقصى

---

### المشكلة 3: Foreign Key Constraint عند حذف الجدول

**الوصف:**
```
Error: Cannot delete or update a parent row: a foreign key constraint fails
```

**السبب:**
- محاولة حذف `whatsapp_conversations` بينما `conversation_notes` يحتوي على foreign key إليه

**الحل:**
```sql
-- الترتيب الصحيح:
DROP TABLE IF EXISTS conversation_notes;      -- الابن أولاً
DROP TABLE IF EXISTS whatsapp_conversations;  -- الأب ثانياً
```

---

## 🔍 التحقق من حالة Database

### 1. التحقق من الاتصال:
```bash
cd backend
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
```

### 2. عرض جميع الجداول:
```sql
SHOW TABLES;
```

### 3. التحقق من schema جدول معين:
```sql
DESCRIBE whatsapp_messages;
DESCRIBE whatsapp_conversations;
DESCRIBE conversation_notes;
```

### 4. عرض الـ indexes:
```sql
SHOW INDEX FROM whatsapp_messages;
SHOW INDEX FROM whatsapp_conversations;
SHOW INDEX FROM organizations;
```

### 5. عرض الـ foreign keys:
```sql
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'u339372869_newtask'
  AND REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_NAME IN ('whatsapp_messages', 'whatsapp_conversations', 'conversation_notes');
```

---

## 📝 ملاحظات مهمة

### 1. Naming Conventions:
- **Tables:** snake_case (whatsapp_messages, conversation_notes)
- **Columns:** snake_case (user_id, replied_by_name)
- **Models:** PascalCase (WhatsAppMessage, ConversationNote)
- **Model Properties:** camelCase (userId, repliedByName)

### 2. Sequelize Field Mapping:
```javascript
// في Model
userId: {
  type: DataTypes.INTEGER,
  field: 'user_id',  // ← mapping إلى database column
}
```

### 3. Timestamps:
- جميع الجداول تستخدم `created_at` و `updated_at`
- Sequelize يديرها تلقائياً مع `timestamps: true`
- في database: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

### 4. JSON Columns:
- `tags` في conversations: `JSON NULL`
- `content` في messages: `JSON`
- `metadata` في messages: `JSON NULL`

### 5. ENUM Values:
```sql
-- Conversation Status
ENUM('open', 'closed', 'pending')

-- Priority
ENUM('high', 'medium', 'low')

-- Message Direction
ENUM('inbound', 'outbound')

-- Message Status
ENUM('pending', 'sent', 'delivered', 'read', 'failed')
```

---

## 🚀 الخطوات التالية للـ Database

### Migrations المقترحة للمستقبل:

1. **Message Templates Table:**
```sql
CREATE TABLE message_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  created_by INT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

2. **Conversation Tags Table (بدلاً من JSON):**
```sql
CREATE TABLE conversation_tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP
);
```

3. **Message Attachments Table:**
```sql
CREATE TABLE message_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  message_id INT NOT NULL,
  file_type ENUM('image', 'video', 'audio', 'document'),
  file_url VARCHAR(500),
  file_size INT,
  created_at TIMESTAMP
);
```

---

**آخر تحديث:** 2025-10-03  
**الحالة:** Database جاهز وصحي ✅  
**عدد الجداول:** 15+  
**عدد الـ Migrations المطبقة:** 3

