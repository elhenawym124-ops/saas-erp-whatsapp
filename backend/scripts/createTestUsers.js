/**
 * Create Test Users Script
 * سكريبت لإنشاء مستخدمين تجريبيين للاختبار
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

/**
 * الاتصال بقاعدة البيانات
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات MongoDB');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    process.exit(1);
  }
}

/**
 * إنشاء مؤسسة Super Admin
 */
async function createSuperAdminOrganization() {
  try {
    // التحقق من وجود المؤسسة
    let org = await Organization.findOne({ domain: 'superadmin' });
    
    if (org) {
      console.log('⚠️  مؤسسة Super Admin موجودة بالفعل');
      return org;
    }

    // إنشاء مؤسسة جديدة
    org = await Organization.create({
      name: 'Super Admin Organization',
      domain: 'superadmin',
      industry: 'Technology',
      size: 'enterprise',
      contactInfo: {
        email: 'admin@newtask.com',
        phone: '+966500000000',
        address: {
          street: 'King Fahd Road',
          city: 'Riyadh',
          state: 'Riyadh',
          country: 'Saudi Arabia',
          postalCode: '12345',
        },
      },
      settings: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
      },
      isActive: true,
    });

    console.log('✅ تم إنشاء مؤسسة Super Admin');
    return org;
  } catch (error) {
    console.error('❌ خطأ في إنشاء مؤسسة Super Admin:', error);
    throw error;
  }
}

/**
 * إنشاء مستخدم Super Admin
 */
async function createSuperAdmin(organization) {
  try {
    // التحقق من وجود المستخدم
    let user = await User.findOne({ email: 'superadmin@newtask.com' });

    if (user) {
      console.log('⚠️  مستخدم Super Admin موجود بالفعل');
      return user;
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 12);

    // إنشاء مستخدم جديد
    user = await User.create({
      organization: organization._id,
      email: 'superadmin@newtask.com',
      password: hashedPassword,
      phone: '+966500000000',
      personalInfo: {
        firstName: 'Super',
        lastName: 'Admin',
        gender: 'male',
      },
      workInfo: {
        employeeId: 'SA-001',
        department: 'Management',
        position: 'System Administrator',
        hireDate: new Date(),
      },
      role: 'super_admin',
      status: 'active',
    });

    console.log('✅ تم إنشاء مستخدم Super Admin');
    console.log('📧 Email: superadmin@newtask.com');
    console.log('🔑 Password: SuperAdmin@123');
    return user;
  } catch (error) {
    console.error('❌ خطأ في إنشاء مستخدم Super Admin:', error);
    throw error;
  }
}

/**
 * إنشاء مؤسسة تجريبية
 */
async function createTestOrganization(name, domain, plan = 'free') {
  try {
    // التحقق من وجود المؤسسة
    let org = await Organization.findOne({ domain });
    
    if (org) {
      console.log(`⚠️  مؤسسة ${name} موجودة بالفعل`);
      return org;
    }

    // إنشاء مؤسسة جديدة
    org = await Organization.create({
      name,
      domain,
      industry: 'Technology',
      size: 'small',
      contactInfo: {
        email: `info@${domain}.com`,
        phone: '+966500000001',
        address: {
          street: 'Main Street',
          city: 'Riyadh',
          state: 'Riyadh',
          country: 'Saudi Arabia',
          postalCode: '12345',
        },
      },
      settings: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
      },
      isActive: true,
    });

    // إنشاء اشتراك للمؤسسة
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // شهر واحد

    await Subscription.create({
      organization: org._id,
      plan,
      status: 'active',
      startDate: new Date(),
      endDate,
      billingCycle: 'monthly',
      autoRenew: true,
    });

    console.log(`✅ تم إنشاء مؤسسة ${name} مع خطة ${plan}`);
    return org;
  } catch (error) {
    console.error(`❌ خطأ في إنشاء مؤسسة ${name}:`, error);
    throw error;
  }
}

/**
 * إنشاء مستخدم تجريبي
 */
async function createTestUser(organization, firstName, lastName, email, password, role = 'admin', employeeId) {
  try {
    // التحقق من وجود المستخدم
    let user = await User.findOne({ email });

    if (user) {
      console.log(`⚠️  مستخدم ${email} موجود بالفعل`);
      return user;
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء مستخدم جديد
    user = await User.create({
      organization: organization._id,
      email,
      password: hashedPassword,
      phone: '+966500000001',
      personalInfo: {
        firstName,
        lastName,
        gender: 'male',
      },
      workInfo: {
        employeeId,
        department: 'Management',
        position: role === 'admin' ? 'Administrator' : role === 'manager' ? 'Manager' : 'Employee',
        hireDate: new Date(),
      },
      role,
      status: 'active',
    });

    console.log(`✅ تم إنشاء مستخدم ${firstName} ${lastName}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    return user;
  } catch (error) {
    console.error(`❌ خطأ في إنشاء مستخدم ${firstName} ${lastName}:`, error);
    throw error;
  }
}

/**
 * السكريبت الرئيسي
 */
async function main() {
  try {
    console.log('🚀 بدء إنشاء المستخدمين التجريبيين...\n');

    // الاتصال بقاعدة البيانات
    await connectDB();

    // 1. إنشاء Super Admin
    console.log('\n📌 إنشاء Super Admin...');
    const superAdminOrg = await createSuperAdminOrganization();
    await createSuperAdmin(superAdminOrg);

    // 2. إنشاء مؤسسات تجريبية
    console.log('\n📌 إنشاء مؤسسات تجريبية...');

    const testOrg1 = await createTestOrganization('شركة الأمل', 'alamal', 'basic');
    await createTestUser(testOrg1, 'أحمد', 'محمد', 'ahmed@alamal.com', 'Ahmed@123', 'admin', 'EMP-001');
    await createTestUser(testOrg1, 'فاطمة', 'علي', 'fatima@alamal.com', 'Fatima@123', 'manager', 'EMP-002');
    await createTestUser(testOrg1, 'محمد', 'خالد', 'mohammed@alamal.com', 'Mohammed@123', 'employee', 'EMP-003');

    const testOrg2 = await createTestOrganization('شركة النجاح', 'alnajah', 'pro');
    await createTestUser(testOrg2, 'سارة', 'أحمد', 'sara@alnajah.com', 'Sara@123', 'admin', 'EMP-001');
    await createTestUser(testOrg2, 'عمر', 'حسن', 'omar@alnajah.com', 'Omar@123', 'manager', 'EMP-002');

    const testOrg3 = await createTestOrganization('شركة التميز', 'altamayoz', 'free');
    await createTestUser(testOrg3, 'نورة', 'سعيد', 'noura@altamayoz.com', 'Noura@123', 'admin', 'EMP-001');

    // 3. عرض ملخص
    console.log('\n' + '='.repeat(60));
    console.log('🎉 تم إنشاء جميع المستخدمين التجريبيين بنجاح!');
    console.log('='.repeat(60));
    
    console.log('\n📊 الملخص:');
    console.log('\n1️⃣  Super Admin:');
    console.log('   📧 Email: superadmin@newtask.com');
    console.log('   🔑 Password: SuperAdmin@123');
    console.log('   🏢 Organization: Super Admin Organization');
    
    console.log('\n2️⃣  شركة الأمل (Basic Plan):');
    console.log('   👤 Admin: ahmed@alamal.com / Ahmed@123');
    console.log('   👤 Manager: fatima@alamal.com / Fatima@123');
    console.log('   👤 Employee: mohammed@alamal.com / Mohammed@123');
    
    console.log('\n3️⃣  شركة النجاح (Pro Plan):');
    console.log('   👤 Admin: sara@alnajah.com / Sara@123');
    console.log('   👤 Manager: omar@alnajah.com / Omar@123');
    
    console.log('\n4️⃣  شركة التميز (Free Plan):');
    console.log('   👤 Admin: noura@altamayoz.com / Noura@123');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ يمكنك الآن تسجيل الدخول باستخدام أي من الحسابات أعلاه');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n💥 فشل إنشاء المستخدمين:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات\n');
    process.exit(0);
  }
}

// تشغيل السكريبت
main();

