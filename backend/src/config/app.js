import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

/**
 * إعدادات التطبيق المركزية
 */
const config = {
  // إعدادات السيرفر
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost',
    appName: process.env.APP_NAME || 'SaaS ERP System',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  // إعدادات قاعدة البيانات - MySQL
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'saas_erp',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql',
    testName: process.env.DB_TEST_NAME || 'saas_erp_test',
  },

  // إعدادات Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
  },

  // إعدادات JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    expire: process.env.JWT_EXPIRE || '24h',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  // إعدادات الأمان
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 دقيقة
    rateLimitMaxRequests:
      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
      (process.env.NODE_ENV === 'development' ? 1000 : 100), // 1000 للتطوير
  },

  // إعدادات CORS
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:3002',
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600,
  },

  // إعدادات رفع الملفات
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    uploadPath: process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads'),
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },

  // إعدادات WhatsApp
  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || path.join(process.cwd(), 'sessions'),
    maxRetryAttempts: parseInt(process.env.WHATSAPP_MAX_RETRY_ATTEMPTS) || 3,
    reconnectInterval: parseInt(process.env.WHATSAPP_RECONNECT_INTERVAL) || 5000,
  },

  // إعدادات السجلات
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs'),
  },

  // إعدادات البريد الإلكتروني
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
  },

  // المنطقة الزمنية
  timezone: process.env.TZ || 'Africa/Cairo',
};

// التحقق من المتغيرات المطلوبة في الإنتاج
if (config.server.env === 'production') {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingEnvVars.join(', ')}`
    );
  }
}

export default config;
