/**
 * Create WhatsApp Contacts Table Script
 * سكريبت لإنشاء جدول جهات اتصال WhatsApp في قاعدة البيانات
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

const createWhatsAppContactsTable = async () => {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to MySQL database');
    
    // إنشاء جدول whatsapp_contacts
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS whatsapp_contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        session_id VARCHAR(255),
        phone_number VARCHAR(50) NOT NULL,
        jid VARCHAR(255),
        name VARCHAR(255),
        profile_pic_url TEXT,
        is_group BOOLEAN DEFAULT FALSE,
        is_blocked BOOLEAN DEFAULT FALSE,
        tags JSON,
        notes TEXT,
        last_message_at TIMESTAMP NULL,
        last_seen TIMESTAMP NULL,
        related_user_id INT,
        related_customer_id INT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes
        UNIQUE KEY unique_org_phone (organization_id, phone_number),
        INDEX idx_organization (organization_id),
        INDEX idx_session (session_id),
        INDEX idx_phone (phone_number),
        INDEX idx_last_message (last_message_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    console.log('🔄 Creating whatsapp_contacts table...');
    await connection.execute(createTableSQL);
    console.log('✅ whatsapp_contacts table created successfully');
    
    // إضافة بعض البيانات التجريبية
    const insertTestData = `
      INSERT IGNORE INTO whatsapp_contacts 
      (organization_id, session_id, phone_number, name, jid, is_group, created_at, updated_at) 
      VALUES 
      (1, '1_9568', '201065676135', 'Test Contact 1', '201065676135@s.whatsapp.net', FALSE, NOW(), NOW()),
      (1, '1_9568', '966500000000', 'Test Contact 2', '966500000000@s.whatsapp.net', FALSE, NOW(), NOW()),
      (1, '1_9568', '971500000000', 'Test Contact 3', '971500000000@s.whatsapp.net', FALSE, NOW(), NOW())
    `;
    
    console.log('🔄 Inserting test data...');
    await connection.execute(insertTestData);
    console.log('✅ Test data inserted successfully');
    
    // التحقق من البيانات
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM whatsapp_contacts');
    console.log(`📊 Total contacts in database: ${rows[0].count}`);
    
    console.log('🎉 WhatsApp Contacts table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up WhatsApp Contacts table:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
};

// تشغيل السكريبت
createWhatsAppContactsTable()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
