# 🗄️ Database Schema - مخطط قاعدة البيانات

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [MongoDB Models](#mongodb-models)
3. [MySQL Tables](#mysql-tables)
4. [العلاقات بين الجداول](#العلاقات-بين-الجداول)
5. [Indexes](#indexes)

---

## 🎯 نظرة عامة

النظام يستخدم قاعدتي بيانات:
- **MongoDB**: قاعدة البيانات الرئيسية (NoSQL)
- **MySQL**: قاعدة بيانات ثانوية للتقارير والتحليلات (SQL)

---

## 📊 MongoDB Models

### **1. Organization** (المؤسسات)

```javascript
{
  _id: ObjectId,
  name: String,                    // اسم المؤسسة
  domain: String,                  // نطاق فريد (my-company)
  industry: String,                // القطاع
  size: String,                    // حجم المؤسسة (1-10, 10-50, etc.)
  
  contactInfo: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  
  subscription: {
    plan: String,                  // free, basic, pro, enterprise
    status: String,                // active, inactive, suspended, trial
    startDate: Date,
    endDate: Date,
    maxUsers: Number,
    maxProjects: Number
  },
  
  whatsappConfig: {
    phoneNumber: String,
    sessionData: Mixed,
    isActive: Boolean,
    lastConnected: Date
  },
  
  settings: {
    timezone: String,
    language: String,
    currency: String,
    dateFormat: String,
    workingHours: {
      start: String,
      end: String
    },
    workingDays: [String]
  },
  
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `domain` (unique)
- `contactInfo.email` (unique)

---

### **2. User** (المستخدمون)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,          // ref: Organization
  
  email: String,                   // unique
  password: String,                // hashed
  
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,
    nationality: String,
    nationalId: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  
  workInfo: {
    employeeId: String,
    department: String,
    position: String,
    hireDate: Date,
    salary: Number,
    manager: ObjectId,             // ref: User
    workSchedule: ObjectId         // ref: WorkSchedule
  },
  
  permissions: {
    role: String,                  // super_admin, admin, manager, employee
    modules: [String],             // ['attendance', 'projects', 'whatsapp']
    customPermissions: Mixed
  },
  
  status: String,                  // active, inactive, suspended
  lastLogin: Date,
  refreshToken: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `email` (unique)
- `organization`
- `workInfo.employeeId`

---

### **3. Subscription** (الاشتراكات)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,          // ref: Organization
  
  plan: String,                    // free, basic, pro, enterprise
  status: String,                  // active, trial, expired, cancelled, suspended
  
  billingCycle: String,            // monthly, yearly
  price: Number,
  currency: String,
  
  features: {
    maxUsers: Number,              // -1 = unlimited
    maxProjects: Number,
    maxStorage: Number,            // GB
    whatsappSessions: Number,
    customReports: Boolean,
    apiAccess: Boolean,
    prioritySupport: Boolean,
    customDomain: Boolean
  },
  
  currentUsage: {
    users: Number,
    projects: Number,
    storage: Number
  },
  
  startDate: Date,
  endDate: Date,
  trialEndsAt: Date,
  
  autoRenew: Boolean,
  suspensionReason: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{organization, sessionName}` (unique compound)
- `status`

---

### **4. Payment** (المدفوعات)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  subscription: ObjectId,
  
  invoiceNumber: String,           // auto-generated (INV-202501-00001)
  amount: Number,
  currency: String,
  
  status: String,                  // pending, paid, failed, refunded, cancelled
  
  paymentMethod: String,           // credit_card, bank_transfer, paypal
  paymentDetails: Mixed,
  
  dueDate: Date,
  paidAt: Date,
  
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  
  notes: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `invoiceNumber` (unique)
- `organization`
- `status`

---

### **5. WhatsAppSession** (جلسات WhatsApp)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  sessionName: String,             // default, sales, support
  
  phoneNumber: String,
  status: String,                  // connected, disconnected, connecting, failed
  
  qrCode: String,
  sessionData: Mixed,              // encrypted
  
  lastConnected: Date,
  lastDisconnected: Date,
  connectionAttempts: Number,
  
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{organization, sessionName}` (unique compound)
- `status`

---

### **6. WhatsAppMessage** (رسائل WhatsApp)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  sessionId: String,
  
  messageId: String,               // من WhatsApp
  from: String,
  to: String,
  
  direction: String,               // incoming, outgoing
  type: String,                    // text, image, video, audio, document
  
  content: {
    text: String,
    caption: String,
    mediaUrl: String,
    mimeType: String,
    filename: String,
    buttons: [{
      id: String,
      text: String
    }],
    listItems: [{
      id: String,
      title: String,
      description: String
    }]
  },
  
  status: String,                  // pending, sent, delivered, read, failed
  
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  
  errorMessage: String,
  
  relatedUser: ObjectId,
  relatedCustomer: ObjectId,
  
  metadata: Mixed,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `organization`
- `sessionId`
- `{from, to}`
- `timestamp`

---

### **7. WhatsAppContact** (جهات اتصال WhatsApp)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  
  phoneNumber: String,
  name: String,
  profilePicUrl: String,
  
  isBlocked: Boolean,
  tags: [String],
  notes: String,
  
  lastMessageAt: Date,
  
  relatedUser: ObjectId,
  relatedCustomer: ObjectId,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### **8. Attendance** (الحضور)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  user: ObjectId,
  
  date: Date,
  
  checkIn: {
    time: Date,
    location: {
      type: String,
      coordinates: [Number]
    },
    notes: String,
    method: String               // manual, qr, biometric, mobile
  },
  
  checkOut: {
    time: Date,
    location: {
      type: String,
      coordinates: [Number]
    },
    notes: String
  },
  
  breaks: [{
    start: Date,
    end: Date,
    duration: Number,
    type: String
  }],
  
  totalHours: Number,
  status: String,                // present, absent, late, half_day, on_leave
  
  approvedBy: ObjectId,
  approvalDate: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### **9. Project** (المشاريع)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  
  name: String,
  description: String,
  
  status: String,                // planning, active, on_hold, completed, cancelled
  priority: String,              // low, medium, high, critical
  
  startDate: Date,
  endDate: Date,
  actualEndDate: Date,
  
  budget: Number,
  actualCost: Number,
  
  progress: Number,              // 0-100
  
  manager: ObjectId,
  team: [ObjectId],
  
  tags: [String],
  attachments: [String],
  
  createdBy: ObjectId,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### **10. Task** (المهام)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  project: ObjectId,
  
  title: String,
  description: String,
  
  status: String,                // todo, in_progress, review, done, cancelled
  priority: String,              // low, medium, high, critical
  
  assignedTo: ObjectId,
  assignedBy: ObjectId,
  
  startDate: Date,
  dueDate: Date,
  completedAt: Date,
  
  estimatedHours: Number,
  actualHours: Number,
  
  dependencies: [ObjectId],
  tags: [String],
  attachments: [String],
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### **11. Customer** (العملاء)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  
  name: String,
  type: String,                  // individual, company
  
  contactInfo: {
    email: String,
    phone: String,
    website: String
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  status: String,                // active, inactive
  
  tags: [String],
  notes: String,
  
  assignedTo: ObjectId,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### **12. Deal** (الصفقات)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  customer: ObjectId,
  
  title: String,
  description: String,
  
  value: Number,
  currency: String,
  
  stage: String,                 // lead, qualified, proposal, negotiation, won, lost
  probability: Number,           // 0-100
  
  expectedCloseDate: Date,
  actualCloseDate: Date,
  
  assignedTo: ObjectId,
  
  source: String,
  lostReason: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### **13. Invoice** (الفواتير)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  customer: ObjectId,
  
  invoiceNumber: String,
  
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  
  status: String,                // draft, sent, paid, overdue, cancelled
  
  issueDate: Date,
  dueDate: Date,
  paidDate: Date,
  
  notes: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### **14. Expense** (المصروفات)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  
  category: String,
  description: String,
  
  amount: Number,
  currency: String,
  
  date: Date,
  
  paymentMethod: String,
  receipt: String,
  
  project: ObjectId,
  approvedBy: ObjectId,
  
  status: String,                // pending, approved, rejected
  
  createdBy: ObjectId,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### **15. Payroll** (الرواتب)

```javascript
{
  _id: ObjectId,
  organization: ObjectId,
  user: ObjectId,
  
  month: Number,
  year: Number,
  
  basicSalary: Number,
  allowances: Number,
  deductions: Number,
  netSalary: Number,
  
  status: String,                // pending, paid
  paidDate: Date,
  
  notes: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 العلاقات بين الجداول

```
Organization (1) ──── (N) User
Organization (1) ──── (1) Subscription
Organization (1) ──── (N) Payment
Organization (1) ──── (N) WhatsAppSession
Organization (1) ──── (N) WhatsAppMessage
Organization (1) ──── (N) Project
Organization (1) ──── (N) Customer

User (1) ──── (N) Attendance
User (1) ──── (N) Task (assigned)
User (1) ──── (N) Deal (assigned)

Project (1) ──── (N) Task
Customer (1) ──── (N) Deal
Customer (1) ──── (N) Invoice

WhatsAppContact (1) ──── (1) Customer (optional)
WhatsAppMessage (1) ──── (1) Customer (optional)
```

---

## 📇 Indexes

### **Performance Indexes**
```javascript
// Organization
db.organizations.createIndex({ domain: 1 }, { unique: true });
db.organizations.createIndex({ "contactInfo.email": 1 }, { unique: true });

// User
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ organization: 1 });
db.users.createIndex({ "permissions.role": 1 });

// Subscription
db.subscriptions.createIndex({ organization: 1, sessionName: 1 }, { unique: true });
db.subscriptions.createIndex({ status: 1 });

// WhatsAppSession
db.whatsappsessions.createIndex({ organization: 1, sessionName: 1 }, { unique: true });

// WhatsAppMessage
db.whatsappmessages.createIndex({ organization: 1 });
db.whatsappmessages.createIndex({ sessionId: 1 });
db.whatsappmessages.createIndex({ timestamp: -1 });

// Attendance
db.attendances.createIndex({ organization: 1, user: 1, date: 1 });

// Project
db.projects.createIndex({ organization: 1 });
db.projects.createIndex({ status: 1 });

// Task
db.tasks.createIndex({ organization: 1 });
db.tasks.createIndex({ project: 1 });
db.tasks.createIndex({ assignedTo: 1 });
```

---

**تم بحمد الله ✨**

