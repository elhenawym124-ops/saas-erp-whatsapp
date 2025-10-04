#!/usr/bin/env node

/**
 * Script لإنشاء بيانات تجريبية في قاعدة البيانات MySQL
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/database.js';
import { initializeModels, getModel } from '../src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../.env') });

async function setupTestData() {
  try {
    console.log('🔗 Connecting to MySQL database...');
    
    // الاتصال بقاعدة البيانات
    await connectDB();
    console.log('✅ Connected to MySQL database');

    // تهيئة النماذج
    await initializeModels();
    console.log('✅ Models initialized');

    // الحصول على نموذج Organization
    const Organization = getModel('Organization');

    // التحقق من وجود organization تجريبية
    const existingOrg = await Organization.findOne({
      where: { domain: 'test-org' }
    });

    if (existingOrg) {
      console.log('📋 Test organization already exists:');
      console.log(`   ID: ${existingOrg.id}`);
      console.log(`   Name: ${existingOrg.name}`);
      console.log(`   Domain: ${existingOrg.domain}`);
      console.log(`   Email: ${existingOrg.email}`);
      return existingOrg;
    }

    // إنشاء organization تجريبية
    console.log('🏢 Creating test organization...');
    const testOrg = await Organization.create({
      name: 'شركة تجريبية',
      domain: 'test-org',
      email: 'test@test-org.com',
      phone: '+201234567890',
      address: 'القاهرة، مصر',
      website: 'https://test-org.com',
      description: 'شركة تجريبية لاختبار نظام WhatsApp',
      isActive: true,
      settings: {
        timezone: 'Africa/Cairo',
        currency: 'EGP',
        language: 'ar'
      }
    });

    console.log('✅ Test organization created successfully:');
    console.log(`   ID: ${testOrg.id}`);
    console.log(`   Name: ${testOrg.name}`);
    console.log(`   Domain: ${testOrg.domain}`);
    console.log(`   Email: ${testOrg.email}`);

    // إنشاء WhatsApp session تجريبية
    console.log('📱 Creating test WhatsApp session...');
    const WhatsAppSession = getModel('WhatsAppSession');

    const existingSession = await WhatsAppSession.findOne({
      where: { 
        organizationId: testOrg.id,
        sessionName: 'default'
      }
    });

    if (!existingSession) {
      const testSession = await WhatsAppSession.create({
        organizationId: testOrg.id,
        sessionName: 'default',
        status: 'disconnected',
        connectionAttempts: 0,
        isActive: true
      });

      console.log('✅ Test WhatsApp session created:');
      console.log(`   ID: ${testSession.id}`);
      console.log(`   Session Name: ${testSession.sessionName}`);
      console.log(`   Status: ${testSession.status}`);
    } else {
      console.log('📋 Test WhatsApp session already exists');
    }

    console.log('🎉 Test data setup completed successfully!');
    console.log('');
    console.log('📋 You can now use:');
    console.log(`   Organization ID: ${testOrg.id}`);
    console.log(`   Domain: ${testOrg.domain}`);
    console.log('');

    return testOrg;

  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// تشغيل الإعداد
setupTestData();
