# 🚀 دليل الإعداد والتثبيت - Setup Guide

## 📋 جدول المحتويات

1. [المتطلبات](#المتطلبات)
2. [التثبيت المحلي](#التثبيت-المحلي)
3. [إعداد قواعد البيانات](#إعداد-قواعد-البيانات)
4. [المتغيرات البيئية](#المتغيرات-البيئية)
5. [تشغيل المشروع](#تشغيل-المشروع)
6. [إنشاء بيانات تجريبية](#إنشاء-بيانات-تجريبية)
7. [النشر (Deployment)](#النشر-deployment)
8. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 📦 المتطلبات

### **Software Requirements**

| البرنامج | الإصدار المطلوب | الغرض |
|----------|-----------------|-------|
| Node.js | >= 18.0.0 | Runtime للـ Backend و Frontend |
| npm | >= 9.0.0 | Package Manager |
| MongoDB | >= 6.0 | قاعدة البيانات الرئيسية |
| MySQL | >= 8.0 | قاعدة بيانات ثانوية (اختياري) |
| Redis | >= 7.0 | Caching (اختياري) |
| Git | >= 2.0 | Version Control |

### **Hardware Requirements**

**للتطوير المحلي**:
- RAM: 8 GB (الحد الأدنى)
- Storage: 10 GB (مساحة حرة)
- CPU: 2 Cores

**للإنتاج**:
- RAM: 16 GB (موصى به)
- Storage: 50 GB SSD
- CPU: 4 Cores

---

## 🔧 التثبيت المحلي

### **1. استنساخ المشروع**

```bash
# استنساخ المشروع
git clone https://github.com/your-org/newtask.git
cd newtask

# التحقق من الفروع
git branch -a
```

---

### **2. تثبيت Backend**

```bash
cd backend

# تثبيت المكتبات
npm install

# التحقق من التثبيت
npm list --depth=0
```

**المكتبات الرئيسية**:
```json
{
  "express": "^4.19.2",
  "mongoose": "^8.3.2",
  "mysql2": "^3.9.7",
  "@whiskeysockets/baileys": "^6.7.9",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "joi": "^17.13.1",
  "multer": "^1.4.5-lts.2",
  "winston": "^3.13.0"
}
```

---

### **3. تثبيت Frontend**

```bash
cd ../frontend

# تثبيت المكتبات
npm install

# التحقق من التثبيت
npm list --depth=0
```

**المكتبات الرئيسية**:
```json
{
  "next": "14.2.3",
  "react": "^18",
  "typescript": "^5",
  "tailwindcss": "^3.4.3",
  "axios": "^1.7.2",
  "recharts": "^2.12.7"
}
```

---

## 🗄️ إعداد قواعد البيانات

### **MongoDB**

#### **تثبيت MongoDB (Ubuntu/Debian)**

```bash
# استيراد المفتاح العام
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# إضافة المستودع
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# التحديث والتثبيت
sudo apt-get update
sudo apt-get install -y mongodb-org

# تشغيل MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# التحقق من التشغيل
sudo systemctl status mongod
```

#### **تثبيت MongoDB (macOS)**

```bash
# باستخدام Homebrew
brew tap mongodb/brew
brew install mongodb-community@7.0

# تشغيل MongoDB
brew services start mongodb-community@7.0
```

#### **تثبيت MongoDB (Windows)**

1. تحميل من: https://www.mongodb.com/try/download/community
2. تشغيل المثبت
3. اختيار "Complete" installation
4. تفعيل "Install MongoDB as a Service"

#### **إنشاء قاعدة البيانات**

```bash
# الاتصال بـ MongoDB
mongosh

# إنشاء قاعدة البيانات
use saas_erp

# إنشاء مستخدم (اختياري)
db.createUser({
  user: "saas_admin",
  pwd: "your_password",
  roles: [{ role: "readWrite", db: "saas_erp" }]
})

# الخروج
exit
```

---

### **MySQL (اختياري)**

#### **تثبيت MySQL (Ubuntu/Debian)**

```bash
sudo apt-get update
sudo apt-get install mysql-server

# تأمين التثبيت
sudo mysql_secure_installation

# تشغيل MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### **إنشاء قاعدة البيانات**

```bash
# الاتصال بـ MySQL
mysql -u root -p

# إنشاء قاعدة البيانات
CREATE DATABASE saas_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# إنشاء مستخدم
CREATE USER 'saas_admin'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON saas_erp.* TO 'saas_admin'@'localhost';
FLUSH PRIVILEGES;

# الخروج
EXIT;
```

---

### **Redis (اختياري)**

#### **تثبيت Redis (Ubuntu/Debian)**

```bash
sudo apt-get update
sudo apt-get install redis-server

# تشغيل Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# التحقق
redis-cli ping
# يجب أن يرجع: PONG
```

---

## ⚙️ المتغيرات البيئية

### **Backend Environment (.env)**

```bash
cd backend
cp .env.example .env
nano .env
```

**ملف `.env` الكامل**:

```env
# ═══════════════════════════════════════════════════════
# Server Configuration
# ═══════════════════════════════════════════════════════
NODE_ENV=development
PORT=3000
HOST=localhost

# ═══════════════════════════════════════════════════════
# MongoDB Configuration
# ═══════════════════════════════════════════════════════
MONGODB_URI=mongodb://localhost:27017/saas_erp
# أو مع مصادقة:
# MONGODB_URI=mongodb://saas_admin:your_password@localhost:27017/saas_erp

# ═══════════════════════════════════════════════════════
# MySQL Configuration (Optional)
# ═══════════════════════════════════════════════════════
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=saas_admin
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=saas_erp

# ═══════════════════════════════════════════════════════
# JWT Configuration
# ═══════════════════════════════════════════════════════
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_ACCESS_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# ═══════════════════════════════════════════════════════
# Redis Configuration (Optional)
# ═══════════════════════════════════════════════════════
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ═══════════════════════════════════════════════════════
# Email Configuration (Optional)
# ═══════════════════════════════════════════════════════
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@newtask.com

# ═══════════════════════════════════════════════════════
# Frontend URL
# ═══════════════════════════════════════════════════════
FRONTEND_URL=http://localhost:3001

# ═══════════════════════════════════════════════════════
# File Upload
# ═══════════════════════════════════════════════════════
MAX_FILE_SIZE=16777216
# 16MB = 16 * 1024 * 1024

UPLOAD_DIR=./uploads

# ═══════════════════════════════════════════════════════
# WhatsApp Configuration
# ═══════════════════════════════════════════════════════
WHATSAPP_SESSION_DIR=./sessions

# ═══════════════════════════════════════════════════════
# Logging
# ═══════════════════════════════════════════════════════
LOG_LEVEL=info
LOG_DIR=./logs

# ═══════════════════════════════════════════════════════
# Security
# ═══════════════════════════════════════════════════════
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
# 15 minutes = 15 * 60 * 1000
RATE_LIMIT_MAX_REQUESTS=100

# ═══════════════════════════════════════════════════════
# CORS
# ═══════════════════════════════════════════════════════
CORS_ORIGIN=http://localhost:3001
```

---

### **Frontend Environment (.env.local)**

```bash
cd frontend
cp .env.example .env.local
nano .env.local
```

**ملف `.env.local`**:

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=SaaS ERP System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Features Flags (Optional)
NEXT_PUBLIC_ENABLE_WHATSAPP=true
NEXT_PUBLIC_ENABLE_CRM=true
NEXT_PUBLIC_ENABLE_ACCOUNTING=true
```

---

## ▶️ تشغيل المشروع

### **1. تشغيل Backend**

```bash
cd backend

# Development mode (مع hot reload)
npm run dev

# Production mode
npm start

# مع PM2 (للإنتاج)
npm install -g pm2
pm2 start src/server.js --name "saas-erp-backend"
pm2 save
pm2 startup
```

**التحقق من التشغيل**:
```bash
curl http://localhost:3000/health
```

**الناتج المتوقع**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-01T10:30:00.000Z",
  "environment": "development"
}
```

---

### **2. تشغيل Frontend**

```bash
cd frontend

# Development mode
npm run dev

# Production build
npm run build
npm start
```

**الوصول للتطبيق**:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs

---

## 🎭 إنشاء بيانات تجريبية

### **1. إنشاء Super Admin**

```bash
cd backend
node scripts/createSuperAdmin.js
```

**البيانات الافتراضية**:
- Email: superadmin@newtask.com
- Password: SuperAdmin@123

---

### **2. إنشاء مؤسسات ومستخدمين تجريبيين**

```bash
node scripts/createTestUsers.js
```

**المؤسسات المنشأة**:

1. **شركة الأمل** (Basic Plan)
   - admin@alamal.com / Ahmed@123
   - fatima@alamal.com / Fatima@123

2. **شركة النجاح** (Pro Plan)
   - sara@alnajah.com / Sara@123
   - omar@alnajah.com / Omar@123

3. **شركة التميز** (Free Plan)
   - noura@altamayoz.com / Noura@123

---

### **3. إنشاء بيانات كاملة (مشاريع، مهام، عملاء)**

```bash
node scripts/seedDatabase.js
```

---

## 🌐 النشر (Deployment)

### **نشر على VPS (Ubuntu)**

#### **1. تحضير السيرفر**

```bash
# تحديث النظام
sudo apt-get update
sudo apt-get upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت MongoDB
# (راجع قسم إعداد قواعد البيانات)

# تثبيت Nginx
sudo apt-get install nginx -y

# تثبيت PM2
sudo npm install -g pm2
```

---

#### **2. رفع المشروع**

```bash
# على جهازك المحلي
cd newtask
git push origin main

# على السيرفر
cd /var/www
sudo git clone https://github.com/your-org/newtask.git
cd newtask

# Backend
cd backend
npm install --production
cp .env.example .env
nano .env  # تعديل المتغيرات

# Frontend
cd ../frontend
npm install --production
npm run build
```

---

#### **3. إعداد PM2**

```bash
cd /var/www/newtask/backend

# تشغيل Backend
pm2 start src/server.js --name saas-erp-backend

# تشغيل Frontend
cd ../frontend
pm2 start npm --name saas-erp-frontend -- start

# حفظ الإعدادات
pm2 save
pm2 startup
```

---

#### **4. إعداد Nginx**

```bash
sudo nano /etc/nginx/sites-available/newtask
```

**ملف Nginx**:

```nginx
# Backend
server {
    listen 80;
    server_name api.newtask.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name newtask.com www.newtask.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/newtask /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

#### **5. إعداد SSL (Let's Encrypt)**

```bash
sudo apt-get install certbot python3-certbot-nginx -y

sudo certbot --nginx -d newtask.com -d www.newtask.com
sudo certbot --nginx -d api.newtask.com
```

---

## 🔍 استكشاف الأخطاء

### **المشكلة: Backend لا يعمل**

```bash
# التحقق من Logs
cd backend
tail -f logs/combined.log

# التحقق من PM2
pm2 logs saas-erp-backend

# التحقق من المنفذ
sudo lsof -i :3000
```

---

### **المشكلة: MongoDB لا يتصل**

```bash
# التحقق من تشغيل MongoDB
sudo systemctl status mongod

# التحقق من الاتصال
mongosh

# التحقق من الـ URI في .env
cat .env | grep MONGODB_URI
```

---

### **المشكلة: Frontend لا يتصل بـ Backend**

```bash
# التحقق من NEXT_PUBLIC_API_URL
cd frontend
cat .env.local | grep NEXT_PUBLIC_API_URL

# التحقق من CORS في Backend
cd ../backend
cat .env | grep CORS_ORIGIN
```

---

**تم بحمد الله ✨**

