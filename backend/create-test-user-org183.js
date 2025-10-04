/**
 * Create a test user for Organization 183
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: 'srv1812.hstgr.io',
  user: 'u339372869_newtask',
  password: '0165676135Aa@A',
  database: 'u339372869_newtask',
};

async function createTestUser() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check if user already exists
    const [existing] = await connection.execute(
      `SELECT id, email FROM users WHERE email = 'test-org183@example.com'`
    );

    if (existing.length > 0) {
      console.log('\n✅ User already exists:');
      console.table(existing);
      console.log('\nPassword: Test123456');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Test123456', 10);

    // Create user
    console.log('\n🔄 Creating test user for Organization 183...');
    const [result] = await connection.execute(
      `INSERT INTO users (
        organization_id, email, password, first_name, last_name, 
        phone, role, status, is_active, created_at, updated_at
      ) VALUES (
        183, 'test-org183@example.com', ?, 'Test', 'User',
        '+201234567890', 'admin', 'active', 1, NOW(), NOW()
      )`,
      [hashedPassword]
    );

    console.log(`✅ User created with ID: ${result.insertId}`);

    // Verify
    const [users] = await connection.execute(
      `SELECT id, organization_id, email, first_name, last_name, role 
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    console.log('\n📊 Created User:');
    console.table(users);

    console.log('\n✅ Test user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Email: test-org183@example.com');
    console.log('Password: Test123456');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

createTestUser();

