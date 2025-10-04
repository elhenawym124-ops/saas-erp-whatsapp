import { Sequelize } from 'sequelize';
import { initializeModels } from '../src/models/index.js';

/**
 * إعداد بيئة الاختبار - SQLite In-Memory
 * استخدام SQLite بدلاً من MySQL لتجنب مشاكل حدود الاتصالات
 */

let sequelize;

// Export sequelize instance for tests
export const getTestSequelize = () => sequelize;

// قبل جميع الاختبارات
beforeAll(async () => {
  // تعيين متغير البيئة للاختبار
  process.env.NODE_ENV = 'test';

  // استخدام MySQL للاختبارات مع connection pooling محسّن
  sequelize = new Sequelize(
    process.env.DB_NAME || 'u339372869_newtask',
    process.env.DB_USER || 'u339372869_newtask',
    process.env.DB_PASSWORD || '0165676135Aa@A',
    {
      host: process.env.DB_HOST || 'srv1812.hstgr.io',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 1,        // اتصال واحد فقط للاختبارات
        min: 0,        // لا اتصالات دائمة
        acquire: 30000,
        idle: 10000,
        evict: 1000,
      },
      define: {
        timestamps: true,
        underscored: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
      dialectOptions: {
        charset: 'utf8mb4',
        connectTimeout: 60000,
      },
    }
  );

  try {
    // اختبار الاتصال
    await sequelize.authenticate();
    console.log('✅ Test database connection established (MySQL)');

    // تهيئة النماذج
    await initializeModels(sequelize);

    // مزامنة قاعدة البيانات (بدون alter لتجنب تعديل الجداول)
    await sequelize.sync({ alter: false, force: false });

    console.log('✅ Test database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing test database:', error);
    throw error;
  }
}, 60000); // زيادة الوقت لـ MySQL

// بعد كل test - معطل لأننا نستخدم UUID
// المشكلة: beforeEach/afterEach في setup.js يعمل قبل/بعد كل test في جميع الملفات
// مما يسبب مشاكل مع البيانات التي تم إنشاؤها في beforeEach في test files
// الحل: استخدام UUID لضمان unique values
// beforeEach(async () => {
//   // Skip cleanup - نستخدم UUID بدلاً من ذلك
// });

// بعد جميع الاختبارات
afterAll(async () => {
  // قطع الاتصال بقاعدة البيانات
  if (sequelize) {
    await sequelize.close();
  }
}, 30000);

