/**
 * System Validation Script
 * سكريبت فحص شامل لمنطق النظام
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// تحميل متغيرات البيئة
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// استيراد النماذج
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import Subscription from '../src/models/Subscription.js';
import Payment from '../src/models/Payment.js';
import { SUBSCRIPTION_PLANS, PLAN_FEATURES } from '../src/models/Subscription.js';

// استيراد الخدمات
import subscriptionService from '../src/services/subscriptionService.js';

/**
 * الاتصال بقاعدة البيانات
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات MongoDB\n');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    process.exit(1);
  }
}

/**
 * فحص نماذج الاشتراكات
 */
async function validateSubscriptionModels() {
  console.log('📋 فحص نماذج الاشتراكات...\n');

  try {
    // 1. فحص خطط الاشتراك
    console.log('1️⃣  فحص خطط الاشتراك:');
    const plans = Object.keys(PLAN_FEATURES);
    console.log(`   ✅ عدد الخطط: ${plans.length}`);
    plans.forEach(plan => {
      const features = PLAN_FEATURES[plan];
      console.log(`   - ${features.name}: $${features.price}/${features.billingCycle}`);
      console.log(`     • المستخدمين: ${features.features.maxUsers === -1 ? 'غير محدود' : features.features.maxUsers}`);
      console.log(`     • المشاريع: ${features.features.maxProjects === -1 ? 'غير محدود' : features.features.maxProjects}`);
      console.log(`     • التخزين: ${features.features.maxStorage} GB`);
      console.log(`     • جلسات WhatsApp: ${features.features.whatsappSessions === -1 ? 'غير محدود' : features.features.whatsappSessions}`);
    });

    // 2. فحص الاشتراكات الموجودة
    console.log('\n2️⃣  فحص الاشتراكات الموجودة:');
    const subscriptions = await Subscription.find().populate('organization', 'name domain');
    console.log(`   ✅ عدد الاشتراكات: ${subscriptions.length}`);
    
    const statusCounts = {};
    const planCounts = {};
    
    subscriptions.forEach(sub => {
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
      planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1;
    });

    console.log('   حسب الحالة:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`);
    });

    console.log('   حسب الخطة:');
    Object.entries(planCounts).forEach(([plan, count]) => {
      console.log(`     - ${plan}: ${count}`);
    });

    // 3. فحص الاشتراكات المنتهية
    console.log('\n3️⃣  فحص الاشتراكات المنتهية:');
    const expiredSubs = subscriptions.filter(sub => sub.isExpired);
    console.log(`   ${expiredSubs.length > 0 ? '⚠️' : '✅'} اشتراكات منتهية: ${expiredSubs.length}`);
    
    if (expiredSubs.length > 0) {
      expiredSubs.forEach(sub => {
        console.log(`     - ${sub.organization.name}: انتهى في ${sub.endDate.toLocaleDateString('ar-SA')}`);
      });
    }

    // 4. فحص الاشتراكات التجريبية
    console.log('\n4️⃣  فحص الاشتراكات التجريبية:');
    const trialSubs = subscriptions.filter(sub => sub.isInTrial);
    console.log(`   ✅ اشتراكات تجريبية: ${trialSubs.length}`);
    
    if (trialSubs.length > 0) {
      trialSubs.forEach(sub => {
        console.log(`     - ${sub.organization.name}: تنتهي في ${sub.trialEndsAt.toLocaleDateString('ar-SA')}`);
      });
    }

    // 5. فحص حدود الاستخدام
    console.log('\n5️⃣  فحص حدود الاستخدام:');
    for (const sub of subscriptions) {
      const planFeatures = PLAN_FEATURES[sub.plan];
      const features = planFeatures.features;
      const usage = sub.currentUsage;

      console.log(`   ${sub.organization.name} (${sub.plan}):`);

      // فحص المستخدمين
      if (features.maxUsers !== -1) {
        const userPercentage = (usage.users / features.maxUsers) * 100;
        const status = userPercentage >= 90 ? '⚠️' : userPercentage >= 70 ? '⚡' : '✅';
        console.log(`     ${status} المستخدمين: ${usage.users}/${features.maxUsers} (${userPercentage.toFixed(0)}%)`);
      } else {
        console.log(`     ✅ المستخدمين: ${usage.users}/غير محدود`);
      }

      // فحص المشاريع
      if (features.maxProjects !== -1) {
        const projectPercentage = (usage.projects / features.maxProjects) * 100;
        const status = projectPercentage >= 90 ? '⚠️' : projectPercentage >= 70 ? '⚡' : '✅';
        console.log(`     ${status} المشاريع: ${usage.projects}/${features.maxProjects} (${projectPercentage.toFixed(0)}%)`);
      } else {
        console.log(`     ✅ المشاريع: ${usage.projects}/غير محدود`);
      }

      // فحص التخزين
      const storagePercentage = (usage.storage / features.maxStorage) * 100;
      const storageStatus = storagePercentage >= 90 ? '⚠️' : storagePercentage >= 70 ? '⚡' : '✅';
      console.log(`     ${storageStatus} التخزين: ${usage.storage}/${features.maxStorage} GB (${storagePercentage.toFixed(0)}%)`);
    }

    console.log('\n✅ فحص نماذج الاشتراكات مكتمل\n');
  } catch (error) {
    console.error('❌ خطأ في فحص نماذج الاشتراكات:', error);
  }
}

/**
 * فحص نماذج المدفوعات
 */
async function validatePaymentModels() {
  console.log('💰 فحص نماذج المدفوعات...\n');

  try {
    const payments = await Payment.find()
      .populate('organization', 'name domain')
      .populate('subscription', 'plan status');

    console.log(`✅ عدد المدفوعات: ${payments.length}\n`);

    if (payments.length === 0) {
      console.log('⚠️  لا توجد مدفوعات في النظام\n');
      return;
    }

    // إحصائيات المدفوعات
    const statusCounts = {};
    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;

    payments.forEach(payment => {
      statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
      totalRevenue += payment.totalAmount;
      
      if (payment.status === 'paid') {
        paidRevenue += payment.totalAmount;
      } else if (payment.status === 'pending') {
        pendingRevenue += payment.totalAmount;
      }
    });

    console.log('حسب الحالة:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    console.log('\nالإيرادات:');
    console.log(`  - إجمالي: $${totalRevenue.toFixed(2)}`);
    console.log(`  - مدفوع: $${paidRevenue.toFixed(2)}`);
    console.log(`  - قيد الانتظار: $${pendingRevenue.toFixed(2)}`);

    // فحص المدفوعات المتأخرة
    const overduePayments = payments.filter(p => p.isOverdue);
    console.log(`\n${overduePayments.length > 0 ? '⚠️' : '✅'} مدفوعات متأخرة: ${overduePayments.length}`);

    if (overduePayments.length > 0) {
      overduePayments.forEach(payment => {
        console.log(`  - ${payment.organization.name}: ${payment.invoiceNumber} ($${payment.totalAmount})`);
        console.log(`    تاريخ الاستحقاق: ${payment.dueDate.toLocaleDateString('ar-SA')}`);
      });
    }

    console.log('\n✅ فحص نماذج المدفوعات مكتمل\n');
  } catch (error) {
    console.error('❌ خطأ في فحص نماذج المدفوعات:', error);
  }
}

/**
 * فحص خدمات الاشتراكات
 */
async function validateSubscriptionService() {
  console.log('🔧 فحص خدمات الاشتراكات...\n');

  try {
    // الحصول على جميع الاشتراكات
    const result = await subscriptionService.getAllSubscriptions({ page: 1, limit: 100 });
    console.log(`✅ خدمة getAllSubscriptions تعمل بنجاح`);
    console.log(`   - عدد الاشتراكات: ${result.subscriptions.length}`);
    console.log(`   - إجمالي الصفحات: ${result.pagination.pages}`);

    console.log('\n✅ فحص خدمات الاشتراكات مكتمل\n');
  } catch (error) {
    console.error('❌ خطأ في فحص خدمات الاشتراكات:', error);
  }
}

/**
 * فحص المستخدمين والمؤسسات
 */
async function validateUsersAndOrganizations() {
  console.log('👥 فحص المستخدمين والمؤسسات...\n');

  try {
    const organizations = await Organization.find();
    const users = await User.find();

    console.log(`✅ عدد المؤسسات: ${organizations.length}`);
    console.log(`✅ عدد المستخدمين: ${users.length}\n`);

    // إحصائيات المؤسسات
    const activeOrgs = organizations.filter(org => org.isActive).length;
    console.log('المؤسسات:');
    console.log(`  - نشطة: ${activeOrgs}`);
    console.log(`  - غير نشطة: ${organizations.length - activeOrgs}`);

    // إحصائيات المستخدمين
    const roleCounts = {};
    const statusCounts = {};

    users.forEach(user => {
      const role = user.permissions?.role || 'غير محدد';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
      statusCounts[user.status] = (statusCounts[user.status] || 0) + 1;
    });

    console.log('\nالمستخدمين حسب الدور:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count}`);
    });

    console.log('\nالمستخدمين حسب الحالة:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    console.log('\n✅ فحص المستخدمين والمؤسسات مكتمل\n');
  } catch (error) {
    console.error('❌ خطأ في فحص المستخدمين والمؤسسات:', error);
  }
}

/**
 * السكريبت الرئيسي
 */
async function main() {
  try {
    console.log('🚀 بدء فحص النظام الشامل...\n');
    console.log('='.repeat(60) + '\n');

    // الاتصال بقاعدة البيانات
    await connectDB();

    // فحص المستخدمين والمؤسسات
    await validateUsersAndOrganizations();
    console.log('='.repeat(60) + '\n');

    // فحص نماذج الاشتراكات
    await validateSubscriptionModels();
    console.log('='.repeat(60) + '\n');

    // فحص نماذج المدفوعات
    await validatePaymentModels();
    console.log('='.repeat(60) + '\n');

    // فحص خدمات الاشتراكات
    await validateSubscriptionService();
    console.log('='.repeat(60) + '\n');

    console.log('✅ اكتمل فحص النظام بنجاح!\n');
  } catch (error) {
    console.error('\n💥 فشل فحص النظام:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات\n');
    process.exit(0);
  }
}

// تشغيل السكريبت
main();

