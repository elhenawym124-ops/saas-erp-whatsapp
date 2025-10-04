/**
 * Script to update WhatsApp session status in database
 * This will mark session 101_123 as connected
 */

import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv1812.hstgr.io',
  user: 'u339372869_newtask',
  password: '0165676135Aa@A',
  database: 'u339372869_newtask',
};

async function updateSessionStatus() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check if session exists
    console.log('\n🔍 Checking if session exists...');
    const [existing] = await connection.execute(
      `SELECT id FROM whatsapp_sessions WHERE organization_id = 101 AND session_name = '123'`
    );

    if (existing.length === 0) {
      // Insert new session
      console.log('\n🔄 Creating new session record...');
      const [insertResult] = await connection.execute(
        `INSERT INTO whatsapp_sessions (organization_id, session_name, status, phone_number, created_at, updated_at)
         VALUES (101, '123', 'connected', '201123087745', NOW(), NOW())`
      );
      console.log(`✅ Created new session with ID: ${insertResult.insertId}`);
    } else {
      // Update existing session
      console.log('\n🔄 Updating existing session status to connected...');
      const [updateResult] = await connection.execute(
        `UPDATE whatsapp_sessions
         SET status = 'connected',
             phone_number = '201123087745',
             updated_at = NOW()
         WHERE organization_id = 101 AND session_name = '123'`
      );
      console.log(`✅ Updated ${updateResult.affectedRows} row(s)`);
    }

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const [rows] = await connection.execute(
      `SELECT id, organization_id, session_name, status, phone_number, created_at, updated_at
       FROM whatsapp_sessions 
       WHERE organization_id = 101`
    );

    console.log('\n📊 Sessions for Organization 101:');
    console.table(rows);

    console.log('\n✅ Session status updated successfully!');
    console.log('🔄 Please restart the backend to load the session.');

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

updateSessionStatus();

