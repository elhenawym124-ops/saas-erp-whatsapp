/**
 * Script لنقل جلسات WhatsApp من Organization 183 إلى Organization 1
 */

import dotenv from 'dotenv';
import { connectDB, getSequelize } from './src/config/database.js';

// تحميل متغيرات البيئة
dotenv.config();

async function migrateSessions() {
  try {
    console.log('🔄 Starting migration...\n');

    // الاتصال بقاعدة البيانات
    await connectDB();
    const sequelize = getSequelize();

    // 0. التحقق من Organizations الموجودة
    console.log('📊 Available Organizations:');
    const [organizations] = await sequelize.query(`
      SELECT id, name FROM organizations ORDER BY id
    `);
    console.table(organizations);

    // 1. التحقق من الجلسات الحالية
    console.log('\n📊 Current Sessions:');
    const [currentSessions] = await sequelize.query(`
      SELECT id, organization_id, session_name, phone_number, status
      FROM whatsapp_sessions
      WHERE status = 'connected'
    `);
    console.table(currentSessions);

    // التحقق من وجود Organization 1
    const org1 = organizations.find(org => org.id === 1);
    if (!org1) {
      console.error('\n❌ Organization 1 does not exist!');
      console.log('📝 Available options:');
      console.log('1. Create Organization 1 first');
      console.log('2. Use a different organization ID');
      console.log('\nAborting migration...');
      return;
    }

    console.log(`\n✅ Target Organization: ${org1.name} (ID: ${org1.id})`);

    // 2. نقل الجلسات
    console.log('\n🔄 Migrating sessions...');
    const [sessionsResult] = await sequelize.query(`
      UPDATE whatsapp_sessions
      SET organization_id = 1
      WHERE organization_id = 183 AND status = 'connected'
    `);
    console.log(`✅ Updated ${sessionsResult.affectedRows} sessions`);

    // 3. نقل جهات الاتصال
    console.log('\n🔄 Migrating contacts...');
    const [contactsResult] = await sequelize.query(`
      UPDATE whatsapp_contacts
      SET organization_id = 1, session_id = REPLACE(session_id, '183_', '1_')
      WHERE organization_id = 183
    `);
    console.log(`✅ Updated ${contactsResult.affectedRows} contacts`);

    // 4. نقل الرسائل
    console.log('\n🔄 Migrating messages...');
    const [messagesResult] = await sequelize.query(`
      UPDATE whatsapp_messages
      SET organization_id = 1, session_name = REPLACE(session_name, '183_', '1_')
      WHERE organization_id = 183
    `);
    console.log(`✅ Updated ${messagesResult.affectedRows} messages`);

    // 5. نقل المحادثات
    console.log('\n🔄 Migrating conversations...');
    const [conversationsResult] = await sequelize.query(`
      UPDATE whatsapp_conversations
      SET organization_id = 1
      WHERE organization_id = 183
    `);
    console.log(`✅ Updated ${conversationsResult.affectedRows} conversations`);

    // 6. التحقق من النتيجة
    console.log('\n📊 Updated Sessions:');
    const [updatedSessions] = await sequelize.query(`
      SELECT id, organization_id, session_name, phone_number, status
      FROM whatsapp_sessions
      WHERE organization_id = 1 AND status = 'connected'
    `);
    console.table(updatedSessions);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. إعادة تشغيل Backend (Ctrl+C ثم npm run dev)');
    console.log('2. تحديث الصفحة في المتصفح (F5)');
    console.log('3. اختبار الرسائل الواردة');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

// تنفيذ الـ migration
migrateSessions();

