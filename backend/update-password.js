/**
 * Script لتحديث كلمة مرور المستخدم admin@test.com
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, getSequelize } from './src/config/database.js';

// تحميل متغيرات البيئة
dotenv.config();

async function updatePassword() {
  try {
    console.log('🔄 Updating password...\n');

    // الاتصال بقاعدة البيانات
    await connectDB();
    const sequelize = getSequelize();

    // تشفير كلمة المرور الجديدة
    const newPassword = 'admin123';
    const hashedPassword = bcrypt.hashSync(newPassword, 12);
    
    console.log('🔐 New password hash:', hashedPassword);

    // تحديث كلمة المرور
    const [result] = await sequelize.query(`
      UPDATE users 
      SET password = '${hashedPassword}' 
      WHERE email = 'admin@test.com'
    `);
    
    console.log('✅ Password updated successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');

    // التحقق من التحديث
    const [users] = await sequelize.query(`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = 'admin@test.com'
    `);
    
    if (users.length > 0) {
      console.log('\n📊 Updated user:');
      console.table(users);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating password:', error);
    process.exit(1);
  }
}

updatePassword();
