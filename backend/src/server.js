import app from './app.js';
import config from './config/app.js';
import logger from './config/logger.js';
import connectDB from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initializeModels } from './models/index.js';
import whatsappService from './services/whatsappService.js';
import websocketService from './services/websocketService.js';
import { createServer } from 'http';

/**
 * معالجة الأخطاء غير المعالجة
 */
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  process.exit(1);
});

/**
 * بدء تشغيل السيرفر
 */
const startServer = async () => {
  try {
    // الاتصال بقاعدة البيانات MySQL
    await connectDB();
    logger.info('✅ Database connected successfully');

    // تهيئة النماذج
    await initializeModels();
    logger.info('✅ Models initialized successfully');

    // الاتصال بـ Redis (اختياري)
    try {
      await connectRedis();
      logger.info('✅ Redis connected successfully');
    } catch (error) {
      logger.warn('⚠️  Redis connection failed. Continuing without cache...');
    }

    // ✅ استعادة جلسات WhatsApp النشطة
    try {
      await whatsappService.restoreActiveSessions();
    } catch (error) {
      logger.warn('⚠️  Failed to restore WhatsApp sessions:', error.message);
    }

    // إنشاء HTTP server
    const server = createServer(app);

    // تهيئة WebSocket
    websocketService.initialize(server);
    logger.info('✅ WebSocket service initialized');

    // بدء تشغيل السيرفر
    server.listen(config.server.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ${config.server.appName}                            ║
║                                                           ║
║   📡 Server running on: http://${config.server.host}:${config.server.port}     ║
║   🌍 Environment: ${config.server.env}                   ║
║   📅 Started at: ${new Date().toLocaleString('ar-EG')}   ║
║   🔌 WebSocket: Enabled                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    /**
     * معالجة إيقاف التطبيق بشكل صحيح
     */
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // إغلاق WebSocket service
          websocketService.shutdown();
          logger.info('WebSocket service closed');

          // قطع الاتصال بـ Redis
          await disconnectRedis();
          logger.info('Redis disconnected');

          // قطع الاتصال بقاعدة البيانات
          // سيتم التعامل معه في database.js عبر SIGINT

          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // إجبار الإغلاق بعد 10 ثواني
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // الاستماع لإشارات الإيقاف
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    /**
     * معالجة Promise rejections غير المعالجة
     */
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      logger.error(err.stack);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// بدء التشغيل
startServer();

export default startServer;
