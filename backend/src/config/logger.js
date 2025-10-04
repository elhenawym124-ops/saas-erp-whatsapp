import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// تحديد مستوى السجل بناءً على البيئة
const logLevel = process.env.LOG_LEVEL || 'info';
const logPath = process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs');

// تنسيق السجلات
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// تنسيق السجلات للـ console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// إعداد النقل اليومي للملفات
const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logPath, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

const errorRotateFileTransport = new DailyRotateFile({
  filename: path.join(logPath, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: logFormat,
});

// إنشاء Logger
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'saas-erp' },
  transports: [
    dailyRotateFileTransport,
    errorRotateFileTransport,
    // سجل console في وضع التطوير فقط
    ...(process.env.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: consoleFormat,
          }),
        ]
      : []),
  ],
  // معالجة الاستثناءات غير المعالجة
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logPath, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  // معالجة الرفض غير المعالج للـ promises
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logPath, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// في وضع الاختبار، قلل من السجلات
if (process.env.NODE_ENV === 'test') {
  logger.transports.forEach((t) => (t.silent = true));
}

// إضافة دالة trace لـ Baileys
logger.trace = (...args) => logger.debug(...args);

export default logger;
