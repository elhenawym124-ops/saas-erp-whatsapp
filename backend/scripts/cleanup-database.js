#!/usr/bin/env node

/**
 * Script لتنظيف قاعدة البيانات وإصلاح مشاكل WhatsApp sessions
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saas_erp';

async function cleanupDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. عرض الـ sessions الحالية
    console.log('\n📊 Current WhatsApp sessions:');
    try {
      const sessions = await mongoose.connection.db.collection('whatsappsessions').find({}).toArray();
      console.log(`   Found ${sessions.length} sessions`);
      
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. Session: ${session.sessionName || 'unnamed'}`);
        console.log(`      Status: ${session.status || 'unknown'}`);
        console.log(`      Organization: ${session.organization || 'unknown'}`);
        console.log(`      Created: ${session.createdAt || 'unknown'}`);
        console.log('');
      });
    } catch (err) {
      console.log('⚠️ Error reading sessions:', err.message);
    }

    // 2. عرض الـ indexes الحالية
    console.log('📋 Current indexes:');
    try {
      const indexes = await mongoose.connection.db.collection('whatsappsessions').indexes();
      indexes.forEach(index => {
        console.log(`   - Name: ${index.name}`);
        console.log(`     Key: ${JSON.stringify(index.key)}`);
        console.log(`     Unique: ${index.unique || false}`);
        console.log('');
      });
    } catch (err) {
      console.log('⚠️ Error reading indexes:', err.message);
    }

    // 3. حذف جميع WhatsApp sessions
    console.log('🗑️ Deleting all WhatsApp sessions...');
    try {
      const deleteResult = await mongoose.connection.db.collection('whatsappsessions').deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} sessions`);
    } catch (err) {
      console.log('⚠️ Error deleting sessions:', err.message);
    }

    // 4. حذف collection بالكامل لإزالة جميع الـ indexes
    console.log('🗑️ Dropping whatsappsessions collection...');
    try {
      await mongoose.connection.db.collection('whatsappsessions').drop();
      console.log('✅ Collection dropped successfully');
    } catch (err) {
      console.log('⚠️ Collection drop error:', err.message);
    }

    // 5. إنشاء collection جديدة بـ indexes صحيحة
    console.log('🔧 Creating new collection with correct indexes...');
    try {
      // إنشاء collection جديدة
      await mongoose.connection.db.createCollection('whatsappsessions');
      
      // إضافة الـ indexes الصحيحة
      await mongoose.connection.db.collection('whatsappsessions').createIndex(
        { organization: 1, sessionName: 1 }, 
        { unique: true, name: 'organization_sessionName_unique' }
      );
      
      await mongoose.connection.db.collection('whatsappsessions').createIndex(
        { status: 1 }, 
        { name: 'status_index' }
      );
      
      console.log('✅ New collection created with correct indexes');
    } catch (err) {
      console.log('⚠️ Error creating collection:', err.message);
    }

    // 6. التحقق من الـ indexes الجديدة
    console.log('\n📋 New indexes:');
    try {
      const newIndexes = await mongoose.connection.db.collection('whatsappsessions').indexes();
      newIndexes.forEach(index => {
        console.log(`   - Name: ${index.name}`);
        console.log(`     Key: ${JSON.stringify(index.key)}`);
        console.log(`     Unique: ${index.unique || false}`);
        console.log('');
      });
    } catch (err) {
      console.log('⚠️ Error reading new indexes:', err.message);
    }

    console.log('🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// تشغيل التنظيف
cleanupDatabase();
