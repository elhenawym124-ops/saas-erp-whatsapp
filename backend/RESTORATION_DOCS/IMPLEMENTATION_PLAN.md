# 🚀 **خطة التنفيذ التفصيلية**

## 📊 **نظرة عامة:**

```
┌─────────────────────────────────────────────────────────┐
│  المهمة: إعادة بناء 47 ملف محذوف                       │
│  الوقت المتوقع: 8-12 ساعة عمل                          │
│  الأولوية: عالية جداً 🔴                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 **Phase 1: Customer Module** (Priority 1) 🔴

### **الوقت المتوقع:** 1 ساعة

### **الملفات المطلوبة:**
```
✅ backend/src/models/Customer-mysql.js
✅ backend/src/services/customerService-mysql.js
✅ backend/src/controllers/customerController.js
✅ backend/src/routes/customers.js
```

### **الخطوات:**

#### **Step 1.1: إنشاء Model**
```bash
# انسخ من CODE_TEMPLATES.md -> Template 1
# أنشئ ملف: backend/src/models/Customer-mysql.js
```

**Fields:**
- ✅ id (UUID)
- ✅ organizationId (FK)
- ✅ name (String)
- ✅ email (String, Unique)
- ✅ phone (String)
- ✅ address (Text)
- ✅ status (Enum)
- ✅ createdAt, updatedAt

**Associations:**
- ✅ belongsTo(Organization)
- ✅ hasMany(Deal)
- ✅ hasMany(Invoice)

#### **Step 1.2: تسجيل Model في index.js**
```javascript
// في backend/src/models/index.js
import CustomerModel from './Customer-mysql.js';
const Customer = CustomerModel(sequelize);
models.Customer = Customer;
```

#### **Step 1.3: إنشاء Service**
```bash
# انسخ من CODE_TEMPLATES.md -> Template 2
# أنشئ ملف: backend/src/services/customerService-mysql.js
```

**Functions:**
- ✅ createCustomer(data)
- ✅ getCustomers(organizationId, filters)
- ✅ getCustomerById(id)
- ✅ updateCustomer(id, data)
- ✅ deleteCustomer(id)
- ✅ searchCustomers(organizationId, query)

#### **Step 1.4: إنشاء Controller**
```bash
# انسخ من CODE_TEMPLATES.md -> Template 3
# أنشئ ملف: backend/src/controllers/customerController.js
```

**Endpoints:**
- ✅ POST /api/v1/customers
- ✅ GET /api/v1/customers
- ✅ GET /api/v1/customers/:id
- ✅ PUT /api/v1/customers/:id
- ✅ DELETE /api/v1/customers/:id
- ✅ GET /api/v1/customers/search

#### **Step 1.5: إنشاء Routes**
```bash
# انسخ من CODE_TEMPLATES.md -> Template 4
# أنشئ ملف: backend/src/routes/customers.js
```

#### **Step 1.6: تسجيل Routes**
```javascript
// في backend/src/routes/index.js
import customerRoutes from './customers.js';
router.use('/customers', customerRoutes);
```

#### **Step 1.7: اختبار**
```bash
# Test Create
curl -X POST http://localhost:8000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Customer","email":"test@example.com"}'

# Test Get All
curl http://localhost:8000/api/v1/customers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 **Phase 2: Project Module** (Priority 1) 🔴

### **الوقت المتوقع:** 1.5 ساعة

### **الملفات المطلوبة:**
```
✅ backend/src/models/Project-mysql.js
✅ backend/src/services/projectService-mysql.js
✅ backend/src/controllers/projectController.js
✅ backend/src/routes/projects.js
```

### **Model Fields:**
- id, organizationId, name, description
- status (planning, active, completed, cancelled)
- startDate, endDate, budget
- createdBy (FK -> User)
- createdAt, updatedAt

### **Associations:**
- belongsTo(Organization)
- belongsTo(User, as: 'creator')
- hasMany(Task)

### **Service Functions:**
- createProject, getProjects, getProjectById
- updateProject, deleteProject
- getProjectStats, getProjectTasks

### **Endpoints:**
- POST /api/v1/projects
- GET /api/v1/projects
- GET /api/v1/projects/:id
- PUT /api/v1/projects/:id
- DELETE /api/v1/projects/:id
- GET /api/v1/projects/:id/tasks
- GET /api/v1/projects/stats

---

## 🎯 **Phase 3: Task Module** (Priority 1) 🔴

### **الوقت المتوقع:** 1.5 ساعة

### **الملفات المطلوبة:**
```
✅ backend/src/models/Task-mysql.js
✅ backend/src/services/taskService-mysql.js
✅ backend/src/controllers/taskController.js
✅ backend/src/routes/tasks.js
```

### **Model Fields:**
- id, organizationId, projectId, title, description
- status (todo, in_progress, review, done)
- priority (low, medium, high, urgent)
- assignedTo (FK -> User)
- dueDate
- createdAt, updatedAt

### **Associations:**
- belongsTo(Organization)
- belongsTo(Project)
- belongsTo(User, as: 'assignee')
- hasMany(TimeTracking)

### **Service Functions:**
- createTask, getTasks, getTaskById
- updateTask, deleteTask
- assignTask, updateTaskStatus
- getTasksByProject, getTasksByUser

### **Endpoints:**
- POST /api/v1/tasks
- GET /api/v1/tasks
- GET /api/v1/tasks/:id
- PUT /api/v1/tasks/:id
- DELETE /api/v1/tasks/:id
- PUT /api/v1/tasks/:id/assign
- PUT /api/v1/tasks/:id/status

---

## 🎯 **Phase 4: Expense Module** (Priority 1) 🔴

### **الوقت المتوقع:** 1 ساعة

### **الملفات المطلوبة:**
```
✅ backend/src/models/Expense-mysql.js
✅ backend/src/services/expenseService-mysql.js
✅ backend/src/controllers/expenseController.js
✅ backend/src/routes/expenses.js
```

### **Model Fields:**
- id, organizationId, category, amount, description
- expenseDate, receiptUrl
- createdBy (FK -> User)
- status (pending, approved, rejected)
- approvedBy (FK -> User)
- createdAt, updatedAt

### **Service Functions:**
- createExpense, getExpenses, getExpenseById
- updateExpense, deleteExpense
- approveExpense, rejectExpense
- getExpensesByCategory, getExpenseReport

---

## 🎯 **Phase 5: Deal Module** (Priority 2) 🟡

### **الوقت المتوقع:** 1 ساعة

### **الملفات المطلوبة:**
```
✅ backend/src/models/Deal-mysql.js
✅ backend/src/services/dealService-mysql.js
✅ backend/src/controllers/dealController.js
✅ backend/src/routes/deals.js
```

### **Model Fields:**
- id, organizationId, customerId, title, amount
- status (lead, negotiation, won, lost)
- probability (0-100)
- expectedCloseDate
- createdBy (FK -> User)
- createdAt, updatedAt

---

## 🎯 **Phase 6: Invoice & Payment Modules** (Priority 2) 🟡

### **الوقت المتوقع:** 2 ساعات

### **Invoice Model:**
```
✅ backend/src/models/Invoice-mysql.js
✅ backend/src/services/invoiceService-mysql.js
✅ backend/src/controllers/invoiceController.js
✅ backend/src/routes/invoices.js
```

### **Payment Model:**
```
✅ backend/src/models/Payment-mysql.js
✅ backend/src/services/paymentService-mysql.js
✅ backend/src/controllers/paymentController.js
✅ backend/src/routes/payments.js
```

---

## 🎯 **Phase 7: Attendance Module** (Priority 2) 🟡

### **الوقت المتوقع:** 1 ساعة

### **الملفات المطلوبة:**
```
✅ backend/src/models/Attendance-mysql.js
✅ backend/src/services/attendanceService-mysql.js
✅ backend/src/controllers/attendanceController.js
✅ backend/src/routes/attendance.js
```

---

## 🎯 **Phase 8: HR Modules** (Priority 3) 🟢

### **الوقت المتوقع:** 3 ساعات

### **Modules:**
1. LeaveRequest
2. Payroll
3. WorkSchedule
4. TimeTracking

---

## 🎯 **Phase 9: Inventory Modules** (Priority 3) 🟢

### **الوقت المتوقع:** 2 ساعات

### **Modules:**
1. Product
2. StockMovement

---

## 🎯 **Phase 10: System Modules** (Priority 3) 🟢

### **الوقت المتوقع:** 1.5 ساعة

### **Modules:**
1. Subscription
2. NotificationTemplate
3. Report Service

---

## 📋 **Checklist للتأكد من كل Module:**

```
□ Model created with correct fields
□ Model registered in models/index.js
□ Associations defined correctly
□ Service created with all CRUD functions
□ Controller created with all endpoints
□ Routes created and protected with auth
□ Routes registered in routes/index.js
□ Tested with curl/Postman
□ No errors in server logs
□ Database tables created correctly
```

---

## 🔧 **أدوات مساعدة:**

### **1. اختبار سريع للـ API:**
```bash
# في backend/
npm run test-api
```

### **2. فحص الـ Models:**
```bash
node -e "
import db from './src/models/index.js';
console.log('Models:', Object.keys(db));
"
```

### **3. فحص الـ Routes:**
```bash
curl http://localhost:8000/api/v1/health
```

---

## 📊 **تتبع التقدم:**

```
Phase 1: Customer      [ ] 0/4 files
Phase 2: Project       [ ] 0/4 files
Phase 3: Task          [ ] 0/4 files
Phase 4: Expense       [ ] 0/4 files
Phase 5: Deal          [ ] 0/4 files
Phase 6: Invoice       [ ] 0/8 files
Phase 7: Attendance    [ ] 0/4 files
Phase 8: HR            [ ] 0/16 files
Phase 9: Inventory     [ ] 0/8 files
Phase 10: System       [ ] 0/12 files
─────────────────────────────────
Total Progress:        [ ] 0/64 files (0%)
```

---

## 🚨 **ملاحظات مهمة:**

1. ⚠️ **لا تنسى** تسجيل كل Model في `models/index.js`
2. ⚠️ **لا تنسى** تسجيل كل Route في `routes/index.js`
3. ⚠️ **اختبر** كل endpoint بعد إنشائه
4. ⚠️ **راجع** الـ Associations بين الـ Models
5. ⚠️ **استخدم** نفس الـ naming convention (underscored)

---

## 💡 **نصائح للتسريع:**

1. ✅ **استخدم VS Code snippets** لتسريع الكتابة
2. ✅ **انسخ والصق** من CODE_TEMPLATES.md
3. ✅ **اعمل Phase واحد في المرة** - لا تقفز بين Phases
4. ✅ **اختبر فوراً** بعد كل Phase
5. ✅ **استخدم Git commits** بعد كل Phase ناجح

---

**🎯 ابدأ الآن بـ Phase 1: Customer Module!**

