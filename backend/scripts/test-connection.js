#!/usr/bin/env node

/**
 * Script لاختبار الاتصال بقاعدة البيانات MySQL
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  try {
    console.log('🔗 Testing MySQL connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);

    // إنشاء اتصال Sequelize بسيط
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      }
    );

    // اختبار الاتصال
    await sequelize.authenticate();
    console.log('✅ MySQL connection successful!');

    // عرض قواعد البيانات
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('📋 Existing tables:');
    results.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    await sequelize.close();
    console.log('🔌 Connection closed');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

// تشغيل الاختبار
testConnection();
