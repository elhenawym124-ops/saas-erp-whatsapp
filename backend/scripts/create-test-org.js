#!/usr/bin/env node

/**
 * Script لإنشاء organization تجريبية مباشرة في MySQL
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createTestOrg() {
  try {
    console.log('🔗 Connecting to MySQL...');
    
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

    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');

    // التحقق من وجود organization تجريبية
    const [existingOrgs] = await sequelize.query(
      "SELECT * FROM organizations WHERE domain = 'test-org' LIMIT 1"
    );

    if (existingOrgs.length > 0) {
      const org = existingOrgs[0];
      console.log('📋 Test organization already exists:');
      console.log(`   ID: ${org.id}`);
      console.log(`   Name: ${org.name}`);
      console.log(`   Domain: ${org.domain}`);
      console.log(`   Email: ${org.email}`);
      
      await sequelize.close();
      return org;
    }

    // إنشاء organization تجريبية
    console.log('🏢 Creating test organization...');
    
    const [result] = await sequelize.query(`
      INSERT INTO organizations (
        name, domain, email, phone, address, website, description, 
        is_active, settings, created_at, updated_at
      ) VALUES (
        'شركة تجريبية', 'test-org', 'test@test-org.com', '+201234567890',
        'القاهرة، مصر', 'https://test-org.com', 'شركة تجريبية لاختبار نظام WhatsApp',
        1, '{"timezone":"Africa/Cairo","currency":"EGP","language":"ar"}',
        NOW(), NOW()
      )
    `);

    const orgId = result.insertId;
    console.log('✅ Test organization created successfully:');
    console.log(`   ID: ${orgId}`);
    console.log(`   Name: شركة تجريبية`);
    console.log(`   Domain: test-org`);

    // التحقق من وجود WhatsApp session
    const [existingSessions] = await sequelize.query(
      `SELECT * FROM whatsapp_sessions WHERE organization_id = ${orgId} AND session_name = 'default' LIMIT 1`
    );

    if (existingSessions.length === 0) {
      console.log('📱 Creating test WhatsApp session...');
      
      await sequelize.query(`
        INSERT INTO whatsapp_sessions (
          organization_id, session_name, status, connection_attempts, 
          is_active, created_at, updated_at
        ) VALUES (
          ${orgId}, 'default', 'disconnected', 0, 1, NOW(), NOW()
        )
      `);

      console.log('✅ Test WhatsApp session created');
    } else {
      console.log('📋 Test WhatsApp session already exists');
    }

    await sequelize.close();
    console.log('🎉 Setup completed successfully!');
    console.log('');
    console.log('📋 You can now use:');
    console.log(`   Organization ID: ${orgId}`);
    console.log(`   Domain: test-org`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// تشغيل الإنشاء
createTestOrg();
