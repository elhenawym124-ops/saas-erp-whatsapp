/**
 * Setup Remote Database Script
 * سكريبت لإنشاء جميع الجداول (Collections) في قاعدة البيانات البعيدة
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// تحميل متغيرات البيئة
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// استيراد جميع النماذج
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import Attendance from '../src/models/Attendance.js';
import WorkSchedule from '../src/models/WorkSchedule.js';
import LeaveRequest from '../src/models/LeaveRequest.js';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';
import TimeTracking from '../src/models/TimeTracking.js';
import WhatsAppSession from '../src/models/WhatsAppSession.js';
import WhatsAppMessage from '../src/models/WhatsAppMessage.js';
import WhatsAppContact from '../src/models/WhatsAppContact.js';
import NotificationTemplate from '../src/models/NotificationTemplate.js';
import Customer from '../src/models/Customer.js';
import Deal from '../src/models/Deal.js';
import Invoice from '../src/models/Invoice.js';
import Expense from '../src/models/Expense.js';
import Payroll from '../src/models/Payroll.js';
import Product from '../src/models/Product.js';
import StockMovement from '../src/models/StockMovement.js';

const models = [
  { name: 'Organization', model: Organization },
  { name: 'User', model: User },
  { name: 'Attendance', model: Attendance },
  { name: 'WorkSchedule', model: WorkSchedule },
  { name: 'LeaveRequest', model: LeaveRequest },
  { name: 'Project', model: Project },
  { name: 'Task', model: Task },
  { name: 'TimeTracking', model: TimeTracking },
  { name: 'WhatsAppSession', model: WhatsAppSession },
  { name: 'WhatsAppMessage', model: WhatsAppMessage },
  { name: 'WhatsAppContact', model: WhatsAppContact },
  { name: 'NotificationTemplate', model: NotificationTemplate },
  { name: 'Customer', model: Customer },
  { name: 'Deal', model: Deal },
  { name: 'Invoice', model: Invoice },
  { name: 'Expense', model: Expense },
  { name: 'Payroll', model: Payroll },
  { name: 'Product', model: Product },
  { name: 'StockMovement', model: StockMovement },
];

async function setupDatabase() {
  try {
    console.log('🔄 جاري الاتصال بقاعدة البيانات البعيدة...');
    console.log(`📍 MongoDB URI: ${process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@')}`);

    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);

    // إنشاء جميع الـ Collections
    console.log('\n🔄 جاري إنشاء Collections...\n');

    for (const { name, model } of models) {
      try {
        // التحقق من وجود Collection
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionExists = collections.some((col) => col.name === model.collection.name);

        if (collectionExists) {
          console.log(`✓ ${name} - موجود بالفعل (${model.collection.name})`);
        } else {
          // إنشاء Collection
          await mongoose.connection.db.createCollection(model.collection.name);
          console.log(`✅ ${name} - تم الإنشاء (${model.collection.name})`);
        }

        // إنشاء Indexes
        await model.createIndexes();
        console.log(`  └─ Indexes created for ${name}`);
      } catch (error) {
        console.error(`❌ خطأ في ${name}:`, error.message);
      }
    }

    // عرض إحصائيات قاعدة البيانات
    console.log('\n📊 إحصائيات قاعدة البيانات:\n');

    const stats = await mongoose.connection.db.stats();
    console.log(`📁 Collections: ${stats.collections}`);
    console.log(`📄 Documents: ${stats.objects}`);
    console.log(`💾 Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🗄️ Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📇 Indexes: ${stats.indexes}`);
    console.log(`💿 Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);

    // عرض جميع Collections
    console.log('\n📋 جميع Collections:\n');
    const allCollections = await mongoose.connection.db.listCollections().toArray();
    allCollections.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name}`);
    });

    console.log('\n✅ تم إعداد قاعدة البيانات بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// تشغيل السكريبت
setupDatabase()
  .then(() => {
    console.log('\n🎉 تم الانتهاء بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشل إعداد قاعدة البيانات:', error);
    process.exit(1);
  });

