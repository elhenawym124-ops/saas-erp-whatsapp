import { Sequelize } from 'sequelize';
import logger from './logger.js';

/**
 * إعدادات الاتصال بقاعدة البيانات MySQL البعيدة
 */
let sequelize;

const connectDB = async () => {
  try {
    // التحقق من متغيرات البيئة المطلوبة
    const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`${envVar} is not defined in environment variables`);
      }
    }

    // إنشاء اتصال Sequelize
    sequelize = new Sequelize(
      process.env.NODE_ENV === 'test' ? process.env.DB_TEST_NAME : process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        pool: {
          max: 5, // تقليل عدد الاتصالات من 20 إلى 5
          min: 1, // تقليل الحد الأدنى من 5 إلى 1
          acquire: 60000, // زيادة وقت الانتظار
          idle: 30000, // زيادة وقت الخمول
          evict: 1000, // فحص الاتصالات كل ثانية
          handleDisconnects: true, // إعادة الاتصال التلقائي
        },
        dialectOptions: {
          charset: 'utf8mb4',
          connectTimeout: 60000,
        },
        define: {
          charset: 'utf8mb4',
          timestamps: true,
          underscored: false,
        },
      }
    );

    // اختبار الاتصال
    await sequelize.authenticate();

    logger.info(`✅ MySQL Connected: ${process.env.DB_HOST}`);
    logger.info(`✅ Database Name: ${sequelize.getDatabaseName()}`);

    return sequelize;
  } catch (error) {
    logger.error(`❌ Error connecting to MySQL: ${error.message}`);
    process.exit(1);
  }
};

/**
 * قطع الاتصال بقاعدة البيانات
 */
const disconnectDB = async () => {
  try {
    if (sequelize) {
      await sequelize.close();
      logger.info('✅ MySQL connection closed');
    }
  } catch (error) {
    logger.error(`❌ Error disconnecting from MySQL: ${error.message}`);
    throw error;
  }
};

/**
 * مسح قاعدة البيانات (للاختبارات فقط)
 */
const clearDatabase = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearDatabase can only be used in test environment');
  }

  if (sequelize) {
    await sequelize.sync({ force: true });
    logger.info('✅ Database cleared');
  }
};

/**
 * الحصول على instance الـ Sequelize
 */
const getSequelize = () => {
  if (!sequelize) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return sequelize;
};

// معالجة إغلاق التطبيق
process.on('SIGINT', async () => {
  await disconnectDB();
  logger.info('✅ MySQL connection closed due to application termination');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  logger.info('✅ MySQL connection closed due to application termination');
  process.exit(0);
});

export { connectDB, disconnectDB, clearDatabase, getSequelize };
export default connectDB;
