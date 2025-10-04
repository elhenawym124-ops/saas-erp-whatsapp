/**
 * Script للتحقق من معلومات المستخدم admin@test.com
 */

import dotenv from 'dotenv';
import { connectDB, getSequelize } from './src/config/database.js';

// تحميل متغيرات البيئة
dotenv.config();

async function checkUser() {
  try {
    console.log('🔄 Checking user...\n');

    // الاتصال بقاعدة البيانات
    await connectDB();
    const sequelize = getSequelize();

    // البحث عن المستخدم
    console.log('📊 User: admin@test.com');
    const [users] = await sequelize.query(`
      SELECT id, email, first_name, last_name, organization_id, role 
      FROM users 
      WHERE email = 'admin@test.com'
    `);
    
    if (users.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    console.table(users);

    const user = users[0];
    
    // البحث عن Organization
    console.log(`\n📊 Organization ID: ${user.organization_id}`);
    const [orgs] = await sequelize.query(`
      SELECT id, name 
      FROM organizations 
      WHERE id = ${user.organization_id}
    `);
    
    if (orgs.length > 0) {
      console.table(orgs);
    }

    console.log('\n✅ User information retrieved successfully!');
    console.log(`\n📝 Summary:`);
    console.log(`- User ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Organization ID: ${user.organization_id}`);
    console.log(`- Organization Name: ${orgs[0]?.name || 'N/A'}`);
    console.log(`- Role: ${user.role}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// تنفيذ
checkUser();

