# 🗄️ **Database Schema - MySQL**

## 📊 **Entity Relationship Diagram (ERD)**

```
┌─────────────────┐
│  organizations  │
│─────────────────│
│ id (PK)         │
│ name            │
│ domain          │
│ status          │
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│     users       │       │   customers     │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ organization_id │◄──────│ organization_id │
│ email           │       │ name            │
│ password        │       │ email           │
│ role            │       │ phone           │
│ status          │       │ address         │
│ created_at      │       │ status          │
│ updated_at      │       │ created_at      │
└─────────────────┘       │ updated_at      │
         │                └─────────────────┘
         │                         │
         │ 1:N                     │ 1:N
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│    projects     │       │      deals      │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ organization_id │       │ organization_id │
│ name            │       │ customer_id (FK)│
│ description     │       │ title           │
│ status          │       │ amount          │
│ start_date      │       │ status          │
│ end_date        │       │ probability     │
│ budget          │       │ expected_close  │
│ created_by (FK) │       │ created_by (FK) │
│ created_at      │       │ created_at      │
│ updated_at      │       │ updated_at      │
└─────────────────┘       └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│      tasks      │       │    invoices     │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ organization_id │       │ organization_id │
│ project_id (FK) │       │ customer_id (FK)│
│ title           │       │ invoice_number  │
│ description     │       │ amount          │
│ status          │       │ tax             │
│ priority        │       │ total           │
│ assigned_to (FK)│       │ status          │
│ due_date        │       │ issue_date      │
│ created_at      │       │ due_date        │
│ updated_at      │       │ items (JSON)    │
└─────────────────┘       │ created_at      │
         │                │ updated_at      │
         │ 1:N            └─────────────────┘
         ▼                         │
┌─────────────────┐                │ 1:N
│ time_tracking   │                ▼
│─────────────────│       ┌─────────────────┐
│ id (PK)         │       │    payments     │
│ organization_id │       │─────────────────│
│ user_id (FK)    │       │ id (PK)         │
│ task_id (FK)    │       │ organization_id │
│ start_time      │       │ invoice_id (FK) │
│ end_time        │       │ amount          │
│ duration        │       │ payment_method  │
│ description     │       │ payment_date    │
│ created_at      │       │ reference_number│
│ updated_at      │       │ notes           │
└─────────────────┘       │ created_at      │
                          │ updated_at      │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│    expenses     │       │   attendance    │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ organization_id │       │ organization_id │
│ category        │       │ user_id (FK)    │
│ amount          │       │ date            │
│ description     │       │ check_in        │
│ expense_date    │       │ check_out       │
│ receipt_url     │       │ status          │
│ created_by (FK) │       │ notes           │
│ status          │       │ created_at      │
│ approved_by (FK)│       │ updated_at      │
│ created_at      │       └─────────────────┘
│ updated_at      │
└─────────────────┘       ┌─────────────────┐
                          │ leave_requests  │
┌─────────────────┐       │─────────────────│
│    products     │       │ id (PK)         │
│─────────────────│       │ organization_id │
│ id (PK)         │       │ user_id (FK)    │
│ organization_id │       │ leave_type      │
│ name            │       │ start_date      │
│ sku             │       │ end_date        │
│ description     │       │ reason          │
│ price           │       │ status          │
│ cost            │       │ approved_by (FK)│
│ quantity        │       │ created_at      │
│ unit            │       │ updated_at      │
│ category        │       └─────────────────┘
│ status          │
│ created_at      │       ┌─────────────────┐
│ updated_at      │       │     payroll     │
└─────────────────┘       │─────────────────│
         │                │ id (PK)         │
         │ 1:N            │ organization_id │
         ▼                │ user_id (FK)    │
┌─────────────────┐       │ month           │
│ stock_movements │       │ year            │
│─────────────────│       │ basic_salary    │
│ id (PK)         │       │ allowances      │
│ organization_id │       │ deductions      │
│ product_id (FK) │       │ net_salary      │
│ type            │       │ status          │
│ quantity        │       │ payment_date    │
│ reference_number│       │ created_at      │
│ notes           │       │ updated_at      │
│ created_by (FK) │       └─────────────────┘
│ created_at      │
│ updated_at      │       ┌─────────────────┐
└─────────────────┘       │ work_schedules  │
                          │─────────────────│
┌─────────────────┐       │ id (PK)         │
│ subscriptions   │       │ organization_id │
│─────────────────│       │ user_id (FK)    │
│ id (PK)         │       │ day_of_week     │
│ organization_id │       │ start_time      │
│ plan_name       │       │ end_time        │
│ status          │       │ is_working_day  │
│ start_date      │       │ created_at      │
│ end_date        │       │ updated_at      │
│ amount          │       └─────────────────┘
│ billing_cycle   │
│ created_at      │       ┌─────────────────┐
│ updated_at      │       │ notification_   │
└─────────────────┘       │   templates     │
                          │─────────────────│
                          │ id (PK)         │
                          │ organization_id │
                          │ name            │
                          │ type            │
                          │ subject         │
                          │ body            │
                          │ variables (JSON)│
                          │ is_active       │
                          │ created_at      │
                          │ updated_at      │
                          └─────────────────┘
```

---

## 📋 **Tables Summary:**

| # | Table Name | Description | Priority |
|---|------------|-------------|----------|
| 1 | organizations | المؤسسات | ✅ Exists |
| 2 | users | المستخدمين | ✅ Exists |
| 3 | customers | العملاء | 🔴 High |
| 4 | projects | المشاريع | 🔴 High |
| 5 | tasks | المهام | 🔴 High |
| 6 | expenses | المصروفات | 🔴 High |
| 7 | deals | الصفقات | 🟡 Medium |
| 8 | invoices | الفواتير | 🟡 Medium |
| 9 | payments | المدفوعات | 🟡 Medium |
| 10 | attendance | الحضور | 🟡 Medium |
| 11 | leave_requests | طلبات الإجازة | 🟢 Low |
| 12 | payroll | الرواتب | 🟢 Low |
| 13 | products | المنتجات | 🟢 Low |
| 14 | stock_movements | حركة المخزون | 🟢 Low |
| 15 | time_tracking | تتبع الوقت | 🟢 Low |
| 16 | work_schedules | جداول العمل | 🟢 Low |
| 17 | subscriptions | الاشتراكات | 🟢 Low |
| 18 | notification_templates | قوالب الإشعارات | 🟢 Low |

---

## 🔗 **Relationships:**

### **Organization (1:N)**
```
organizations
├── users (1:N)
├── customers (1:N)
├── projects (1:N)
├── tasks (1:N)
├── deals (1:N)
├── invoices (1:N)
├── payments (1:N)
├── expenses (1:N)
├── attendance (1:N)
├── leave_requests (1:N)
├── payroll (1:N)
├── products (1:N)
├── stock_movements (1:N)
├── time_tracking (1:N)
├── work_schedules (1:N)
├── subscriptions (1:N)
└── notification_templates (1:N)
```

### **User (1:N)**
```
users
├── projects (created_by) (1:N)
├── tasks (assigned_to) (1:N)
├── deals (created_by) (1:N)
├── expenses (created_by) (1:N)
├── attendance (1:N)
├── leave_requests (1:N)
├── payroll (1:N)
├── stock_movements (created_by) (1:N)
├── time_tracking (1:N)
└── work_schedules (1:N)
```

### **Customer (1:N)**
```
customers
├── deals (1:N)
└── invoices (1:N)
```

### **Project (1:N)**
```
projects
└── tasks (1:N)
```

### **Task (1:N)**
```
tasks
└── time_tracking (1:N)
```

### **Invoice (1:N)**
```
invoices
└── payments (1:N)
```

### **Product (1:N)**
```
products
└── stock_movements (1:N)
```

---

## 🔑 **Common Fields:**

### **All Tables Have:**
```sql
id              UUID PRIMARY KEY
organization_id UUID NOT NULL REFERENCES organizations(id)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### **Status Fields:**
```sql
-- Users
status ENUM('active', 'inactive', 'suspended')

-- Customers
status ENUM('active', 'inactive')

-- Projects
status ENUM('planning', 'active', 'completed', 'cancelled')

-- Tasks
status ENUM('todo', 'in_progress', 'review', 'done')

-- Deals
status ENUM('lead', 'negotiation', 'won', 'lost')

-- Invoices
status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled')

-- Expenses
status ENUM('pending', 'approved', 'rejected')

-- Attendance
status ENUM('present', 'absent', 'late', 'half_day')

-- Leave Requests
status ENUM('pending', 'approved', 'rejected')

-- Payroll
status ENUM('draft', 'processed', 'paid')

-- Products
status ENUM('active', 'inactive')

-- Subscriptions
status ENUM('active', 'cancelled', 'expired')
```

---

## 📊 **Indexes:**

### **Required Indexes:**
```sql
-- Foreign Keys (automatic in most cases)
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_customers_organization ON customers(organization_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_tasks_organization ON tasks(organization_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_deals_organization ON deals(organization_id);
CREATE INDEX idx_deals_customer ON deals(customer_id);
CREATE INDEX idx_invoices_organization ON invoices(organization_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_expenses_organization ON expenses(organization_id);
CREATE INDEX idx_attendance_organization ON attendance(organization_id);
CREATE INDEX idx_attendance_user ON attendance(user_id);

-- Unique Constraints
CREATE UNIQUE INDEX unique_customer_email ON customers(email);
CREATE UNIQUE INDEX unique_invoice_number ON invoices(invoice_number);
CREATE UNIQUE INDEX unique_product_sku ON products(sku);

-- Search Indexes
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_tasks_title ON tasks(title);
CREATE INDEX idx_products_name ON products(name);

-- Status Indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_expenses_status ON expenses(status);

-- Date Indexes
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_attendance_date ON attendance(date);
```

---

## 💾 **Storage Estimates:**

```
┌────────────────────────────────────────────┐
│  Table              │ Rows/Org │ Size/Row  │
│─────────────────────┼──────────┼───────────│
│  organizations      │    1     │   1 KB    │
│  users              │   50     │   2 KB    │
│  customers          │  500     │   1 KB    │
│  projects           │  100     │   2 KB    │
│  tasks              │ 1000     │   1 KB    │
│  deals              │  200     │   1 KB    │
│  invoices           │  500     │   2 KB    │
│  payments           │  500     │   1 KB    │
│  expenses           │  300     │   1 KB    │
│  attendance         │ 1500     │  500 B    │
│  leave_requests     │  100     │   1 KB    │
│  payroll            │  600     │   1 KB    │
│  products           │  200     │   1 KB    │
│  stock_movements    │  500     │  500 B    │
│  time_tracking      │ 2000     │  500 B    │
│─────────────────────┴──────────┴───────────│
│  Total per Organization: ~10 MB            │
│  Total for 100 Organizations: ~1 GB        │
└────────────────────────────────────────────┘
```

---

**💡 استخدم هذا الملف كمرجع عند إنشاء الـ Models والـ Associations!**

