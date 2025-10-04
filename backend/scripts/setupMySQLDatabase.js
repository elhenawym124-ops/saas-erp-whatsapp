/**
 * Setup MySQL Remote Database Script
 * سكريبت لإنشاء جميع الجداول في قاعدة بيانات MySQL البعيدة
 */

import mysql from 'mysql2/promise';

// بيانات الاتصال
const dbConfig = {
  host: '92.113.22.70',
  user: 'u339372869_newtask',
  password: '0165676135Aa@A',
  database: 'u339372869_newtask',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// SQL لإنشاء الجداول
const createTablesSQL = `
-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  industry VARCHAR(100),
  size VARCHAR(50),
  settings JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_domain (domain),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role ENUM('super_admin', 'admin', 'manager', 'employee') DEFAULT 'employee',
  department VARCHAR(100),
  position VARCHAR(100),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_organization (organization_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  user_id INT NOT NULL,
  check_in TIMESTAMP NOT NULL,
  check_out TIMESTAMP NULL,
  work_hours DECIMAL(5,2) DEFAULT 0,
  location_checkin JSON,
  location_checkout JSON,
  photo_checkin VARCHAR(500),
  photo_checkout VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, check_in),
  INDEX idx_organization (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  progress INT DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_organization (organization_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  project_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in_progress', 'review', 'completed') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  assigned_to INT,
  due_date DATE,
  time_spent INT DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_organization (organization_id),
  INDEX idx_project (project_id),
  INDEX idx_assigned (assigned_to),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WhatsApp Sessions Table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(50),
  qr_code TEXT,
  status ENUM('disconnected', 'connecting', 'connected') DEFAULT 'disconnected',
  last_seen TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_organization (organization_id),
  INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  session_id INT NOT NULL,
  message_id VARCHAR(255) UNIQUE,
  from_number VARCHAR(50),
  to_number VARCHAR(50),
  message_type ENUM('text', 'image', 'video', 'audio', 'document') DEFAULT 'text',
  content TEXT,
  media_url VARCHAR(500),
  status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending',
  is_from_me BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  INDEX idx_session (session_id),
  INDEX idx_from (from_number),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('individual', 'company') DEFAULT 'individual',
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  contact_info JSON,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_organization (organization_id),
  INDEX idx_name (name),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deals Table
CREATE TABLE IF NOT EXISTS deals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  customer_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  stage ENUM('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost') DEFAULT 'lead',
  probability INT DEFAULT 0,
  expected_close_date DATE,
  assigned_to INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_organization (organization_id),
  INDEX idx_customer (customer_id),
  INDEX idx_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  items JSON NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  due_date DATE,
  payment_date DATE NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_organization (organization_id),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category ENUM('office', 'travel', 'utilities', 'salaries', 'marketing', 'other') DEFAULT 'other',
  vendor VARCHAR(255),
  date DATE NOT NULL,
  payment_method ENUM('cash', 'credit_card', 'bank_transfer', 'check') DEFAULT 'cash',
  receipt_url VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
  approved_by INT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_organization (organization_id),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  employee_id INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  basic_salary DECIMAL(15,2) NOT NULL,
  allowances DECIMAL(15,2) DEFAULT 0,
  bonus DECIMAL(15,2) DEFAULT 0,
  deductions DECIMAL(15,2) DEFAULT 0,
  tax DECIMAL(15,2) DEFAULT 0,
  net_salary DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
  payment_date DATE NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_organization (organization_id),
  INDEX idx_employee (employee_id),
  INDEX idx_month_year (month, year),
  INDEX idx_status (status),
  UNIQUE KEY unique_employee_month_year (employee_id, month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Error Logs Table (لنظام اكتشاف الأخطاء)
CREATE TABLE IF NOT EXISTS error_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NULL,
  user_id INT NULL,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  request_url VARCHAR(500),
  request_method VARCHAR(10),
  request_body JSON,
  user_agent VARCHAR(500),
  ip_address VARCHAR(50),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by INT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_organization (organization_id),
  INDEX idx_error_type (error_type),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at),
  INDEX idx_is_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Health Checks Table
CREATE TABLE IF NOT EXISTS system_health_checks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  check_type VARCHAR(100) NOT NULL,
  status ENUM('healthy', 'degraded', 'down') DEFAULT 'healthy',
  response_time INT,
  details JSON,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_check_type (check_type),
  INDEX idx_status (status),
  INDEX idx_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔄 جاري الاتصال بقاعدة بيانات MySQL البعيدة...');
    console.log(`📍 Host: ${dbConfig.host}`);
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`👤 User: ${dbConfig.user}`);

    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);

    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!\n');

    // تقسيم SQL إلى جمل منفصلة
    const statements = createTablesSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log('🔄 جاري إنشاء الجداول...\n');

    let createdCount = 0;
    let existingCount = 0;

    for (const statement of statements) {
      try {
        await connection.execute(statement);
        
        // استخراج اسم الجدول
        const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
        if (match) {
          const tableName = match[1];
          
          // التحقق من وجود الجدول
          const [rows] = await connection.execute(
            `SELECT COUNT(*) as count FROM information_schema.tables 
             WHERE table_schema = ? AND table_name = ?`,
            [dbConfig.database, tableName]
          );
          
          if (rows[0].count > 0) {
            console.log(`✅ ${tableName} - تم الإنشاء/التحديث`);
            createdCount++;
          }
        }
      } catch (error) {
        console.error(`❌ خطأ في تنفيذ الجملة:`, error.message);
      }
    }

    // عرض جميع الجداول
    console.log('\n📋 جميع الجداول في قاعدة البيانات:\n');
    const [tables] = await connection.execute('SHOW TABLES');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });

    // عرض إحصائيات قاعدة البيانات
    console.log('\n📊 إحصائيات قاعدة البيانات:\n');
    
    const [dbStats] = await connection.execute(`
      SELECT 
        table_schema as 'Database',
        COUNT(*) as 'Tables',
        SUM(table_rows) as 'Total Rows',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size (MB)'
      FROM information_schema.tables
      WHERE table_schema = ?
      GROUP BY table_schema
    `, [dbConfig.database]);

    if (dbStats.length > 0) {
      const stats = dbStats[0];
      console.log(`📁 Database: ${stats.Database}`);
      console.log(`📄 Tables: ${stats.Tables}`);
      console.log(`📊 Total Rows: ${stats['Total Rows'] || 0}`);
      console.log(`💾 Size: ${stats['Size (MB)']} MB`);
    }

    console.log('\n✅ تم إعداد قاعدة البيانات بنجاح!');
    console.log(`✅ تم إنشاء/تحديث ${createdCount} جدول`);

  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
setupDatabase()
  .then(() => {
    console.log('\n🎉 تم الانتهاء بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل إعداد قاعدة البيانات:', error);
    process.exit(1);
  });

