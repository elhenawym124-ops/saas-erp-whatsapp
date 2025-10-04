# 🔄 **خطة استعادة الملفات المحذوفة**

## ⚠️ **المشكلة:**
تم حذف **47 ملف** بالخطأ بدلاً من تحويلها من Mongoose إلى Sequelize!

---

## 📋 **الملفات المحذوفة:**

### **1. Models (17 ملف)** ❌
```
backend/src/models/
├── Attendance.js          ❌ DELETED
├── Customer.js            ❌ DELETED  
├── Deal.js                ❌ DELETED
├── Expense.js             ❌ DELETED
├── Invoice.js             ❌ DELETED
├── LeaveRequest.js        ❌ DELETED
├── NotificationTemplate.js ❌ DELETED
├── Payment.js             ❌ DELETED
├── Payroll.js             ❌ DELETED
├── Product.js             ❌ DELETED
├── Project.js             ❌ DELETED
├── StockMovement.js       ❌ DELETED
├── Subscription.js        ❌ DELETED
├── Task.js                ❌ DELETED
├── TimeTracking.js        ❌ DELETED
├── User.js                ❌ DELETED
└── WorkSchedule.js        ❌ DELETED
```

### **2. Services (10 ملفات)** ❌
```
backend/src/services/
├── attendanceService.js   ❌ DELETED
├── customerService.js     ❌ DELETED
├── dealService.js         ❌ DELETED
├── expenseService.js      ❌ DELETED
├── invoiceService.js      ❌ DELETED
├── payrollService.js      ❌ DELETED
├── projectService.js      ❌ DELETED
├── reportService.js       ❌ DELETED
├── subscriptionService.js ❌ DELETED
└── taskService.js         ❌ DELETED
```

### **3. Controllers (10 ملفات)** ❌
```
backend/src/controllers/
├── attendanceController.js   ❌ DELETED
├── customerController.js     ❌ DELETED
├── dealController.js         ❌ DELETED
├── expenseController.js      ❌ DELETED
├── invoiceController.js      ❌ DELETED
├── payrollController.js      ❌ DELETED
├── projectController.js      ❌ DELETED
├── reportController.js       ❌ DELETED
├── superAdminController.js   ❌ DELETED
└── taskController.js         ❌ DELETED
```

### **4. Routes (10 ملفات)** ❌
```
backend/src/routes/
├── attendance.js          ❌ DELETED
├── customers.js           ❌ DELETED
├── deals.js               ❌ DELETED
├── expenses.js            ❌ DELETED
├── invoices.js            ❌ DELETED
├── payroll.js             ❌ DELETED
├── projects.js            ❌ DELETED
├── reports.js             ❌ DELETED
├── superAdmin.js          ❌ DELETED
└── tasks.js               ❌ DELETED
```

---

## 🎯 **خطة الاستعادة:**

### **المرحلة 1: Models (Sequelize/MySQL)** 🔄

يجب إنشاء **17 Model** جديد باستخدام Sequelize:

#### **1.1 Customer-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- name (String)
- email (String, Unique)
- phone (String)
- address (Text)
- status (Enum: active, inactive)
- created_at, updated_at
- Associations: belongsTo(Organization), hasMany(Deal), hasMany(Invoice)
```

#### **1.2 Project-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- name (String)
- description (Text)
- status (Enum: planning, active, completed, cancelled)
- start_date (Date)
- end_date (Date)
- budget (Decimal)
- created_by (Foreign Key -> User)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(User), hasMany(Task)
```

#### **1.3 Task-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- project_id (Foreign Key)
- title (String)
- description (Text)
- status (Enum: todo, in_progress, review, done)
- priority (Enum: low, medium, high, urgent)
- assigned_to (Foreign Key -> User)
- due_date (Date)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(Project), belongsTo(User)
```

#### **1.4 Deal-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- customer_id (Foreign Key)
- title (String)
- amount (Decimal)
- status (Enum: lead, negotiation, won, lost)
- probability (Integer 0-100)
- expected_close_date (Date)
- created_by (Foreign Key -> User)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(Customer), belongsTo(User)
```

#### **1.5 Invoice-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- customer_id (Foreign Key)
- invoice_number (String, Unique)
- amount (Decimal)
- tax (Decimal)
- total (Decimal)
- status (Enum: draft, sent, paid, overdue, cancelled)
- issue_date (Date)
- due_date (Date)
- items (JSON)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(Customer), hasMany(Payment)
```

#### **1.6 Payment-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- invoice_id (Foreign Key)
- amount (Decimal)
- payment_method (Enum: cash, card, bank_transfer, other)
- payment_date (Date)
- reference_number (String)
- notes (Text)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(Invoice)
```

#### **1.7 Expense-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- category (String)
- amount (Decimal)
- description (Text)
- expense_date (Date)
- receipt_url (String)
- created_by (Foreign Key -> User)
- status (Enum: pending, approved, rejected)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(User)
```

#### **1.8 Attendance-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- user_id (Foreign Key)
- date (Date)
- check_in (Time)
- check_out (Time)
- status (Enum: present, absent, late, half_day)
- notes (Text)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(User)
```

#### **1.9 LeaveRequest-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- user_id (Foreign Key)
- leave_type (Enum: sick, vacation, personal, other)
- start_date (Date)
- end_date (Date)
- reason (Text)
- status (Enum: pending, approved, rejected)
- approved_by (Foreign Key -> User)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(User)
```

#### **1.10 Payroll-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- user_id (Foreign Key)
- month (Integer 1-12)
- year (Integer)
- basic_salary (Decimal)
- allowances (Decimal)
- deductions (Decimal)
- net_salary (Decimal)
- status (Enum: draft, processed, paid)
- payment_date (Date)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(User)
```

#### **1.11 Product-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- name (String)
- sku (String, Unique)
- description (Text)
- price (Decimal)
- cost (Decimal)
- quantity (Integer)
- unit (String)
- category (String)
- status (Enum: active, inactive)
- created_at, updated_at
- Associations: belongsTo(Organization), hasMany(StockMovement)
```

#### **1.12 StockMovement-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- product_id (Foreign Key)
- type (Enum: in, out, adjustment)
- quantity (Integer)
- reference_number (String)
- notes (Text)
- created_by (Foreign Key -> User)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(Product), belongsTo(User)
```

#### **1.13 TimeTracking-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- user_id (Foreign Key)
- task_id (Foreign Key)
- start_time (DateTime)
- end_time (DateTime)
- duration (Integer, minutes)
- description (Text)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(User), belongsTo(Task)
```

#### **1.14 WorkSchedule-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- user_id (Foreign Key)
- day_of_week (Integer 0-6)
- start_time (Time)
- end_time (Time)
- is_working_day (Boolean)
- created_at, updated_at
- Associations: belongsTo(Organization), belongsTo(User)
```

#### **1.15 Subscription-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- plan_name (String)
- status (Enum: active, cancelled, expired)
- start_date (Date)
- end_date (Date)
- amount (Decimal)
- billing_cycle (Enum: monthly, yearly)
- created_at, updated_at
- Associations: belongsTo(Organization)
```

#### **1.16 NotificationTemplate-mysql.js**
```javascript
// Structure:
- id (UUID, Primary Key)
- organization_id (Foreign Key)
- name (String)
- type (Enum: email, sms, whatsapp)
- subject (String)
- body (Text)
- variables (JSON)
- is_active (Boolean)
- created_at, updated_at
- Associations: belongsTo(Organization)
```

---

### **المرحلة 2: Services** 🔄

يجب إنشاء **10 Service** جديد:

#### **2.1 customerService-mysql.js**
```javascript
// Functions:
- createCustomer(data)
- getCustomers(organizationId, filters)
- getCustomerById(id)
- updateCustomer(id, data)
- deleteCustomer(id)
- searchCustomers(organizationId, query)
```

#### **2.2 projectService-mysql.js**
```javascript
// Functions:
- createProject(data)
- getProjects(organizationId, filters)
- getProjectById(id)
- updateProject(id, data)
- deleteProject(id)
- getProjectStats(organizationId)
```

#### **2.3 taskService-mysql.js**
```javascript
// Functions:
- createTask(data)
- getTasks(organizationId, filters)
- getTaskById(id)
- updateTask(id, data)
- deleteTask(id)
- assignTask(taskId, userId)
- updateTaskStatus(taskId, status)
```

#### **2.4 dealService-mysql.js**
```javascript
// Functions:
- createDeal(data)
- getDeals(organizationId, filters)
- getDealById(id)
- updateDeal(id, data)
- deleteDeal(id)
- getDealsPipeline(organizationId)
```

#### **2.5 invoiceService-mysql.js**
```javascript
// Functions:
- createInvoice(data)
- getInvoices(organizationId, filters)
- getInvoiceById(id)
- updateInvoice(id, data)
- deleteInvoice(id)
- generateInvoiceNumber(organizationId)
- sendInvoice(invoiceId)
```

#### **2.6 expenseService-mysql.js**
```javascript
// Functions:
- createExpense(data)
- getExpenses(organizationId, filters)
- getExpenseById(id)
- updateExpense(id, data)
- deleteExpense(id)
- approveExpense(id, approverId)
- rejectExpense(id, approverId, reason)
```

#### **2.7 attendanceService-mysql.js**
```javascript
// Functions:
- checkIn(userId, organizationId)
- checkOut(userId, organizationId)
- getAttendance(organizationId, filters)
- getUserAttendance(userId, month, year)
- updateAttendance(id, data)
```

#### **2.8 payrollService-mysql.js**
```javascript
// Functions:
- createPayroll(data)
- getPayrolls(organizationId, filters)
- getPayrollById(id)
- processPayroll(id)
- generatePayrollReport(organizationId, month, year)
```

#### **2.9 reportService-mysql.js**
```javascript
// Functions:
- getSalesReport(organizationId, startDate, endDate)
- getExpenseReport(organizationId, startDate, endDate)
- getProjectReport(organizationId, startDate, endDate)
- getAttendanceReport(organizationId, month, year)
- getFinancialSummary(organizationId, startDate, endDate)
```

#### **2.10 subscriptionService-mysql.js**
```javascript
// Functions:
- createSubscription(data)
- getSubscriptions(organizationId)
- updateSubscription(id, data)
- cancelSubscription(id)
- renewSubscription(id)
```

---

### **المرحلة 3: Controllers** 🔄

يجب إنشاء **10 Controller** جديد - كل controller يستخدم الـ service المقابل

---

### **المرحلة 4: Routes** 🔄

يجب إنشاء **10 Route** جديد - كل route يستخدم الـ controller المقابل

---

## 📝 **ملاحظات مهمة:**

1. ✅ **استخدام Sequelize فقط** - لا Mongoose
2. ✅ **اتباع نفس Pattern** الموجود في `User-mysql.js`
3. ✅ **استخدام UUID** للـ Primary Keys
4. ✅ **Underscored naming** للـ fields: `organization_id` بدلاً من `organizationId`
5. ✅ **Timestamps** في كل model: `created_at`, `updated_at`
6. ✅ **Soft Deletes** إذا لزم الأمر: `deleted_at`
7. ✅ **Associations** صحيحة بين الـ models
8. ✅ **Validation** على الـ fields المهمة
9. ✅ **Indexes** على الـ Foreign Keys والـ fields المستخدمة في البحث

---

## 🚀 **الأولويات:**

### **Priority 1 (High)** 🔴
```
1. Customer-mysql.js + Service + Controller + Routes
2. Project-mysql.js + Service + Controller + Routes
3. Task-mysql.js + Service + Controller + Routes
4. Expense-mysql.js + Service + Controller + Routes
```

### **Priority 2 (Medium)** 🟡
```
5. Deal-mysql.js + Service + Controller + Routes
6. Invoice-mysql.js + Service + Controller + Routes
7. Payment-mysql.js + Service + Controller + Routes
8. Attendance-mysql.js + Service + Controller + Routes
```

### **Priority 3 (Low)** 🟢
```
9. LeaveRequest-mysql.js + Service + Controller + Routes
10. Payroll-mysql.js + Service + Controller + Routes
11. Product-mysql.js + Service + Controller + Routes
12. StockMovement-mysql.js + Service + Controller + Routes
13. TimeTracking-mysql.js + Service + Controller + Routes
14. WorkSchedule-mysql.js + Service + Controller + Routes
15. Subscription-mysql.js + Service + Controller + Routes
16. NotificationTemplate-mysql.js + Service + Controller + Routes
17. reportService-mysql.js + Controller + Routes
```

---

## 📊 **الإحصائيات:**

```
┌─────────────────────────────────────────┐
│  الملفات المطلوب إنشاؤها:               │
│  📦 17 Models                           │
│  🔧 10 Services                         │
│  🎮 10 Controllers                      │
│  🛣️  10 Routes                          │
│  ─────────────────────────────────────  │
│  📊 Total: 47 ملف                       │
└─────────────────────────────────────────┘
```

---

**💡 الخطوة التالية:** ابدأ بإنشاء الملفات حسب الأولوية!

