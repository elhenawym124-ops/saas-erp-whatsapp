import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import config from './config/app.js';
import logger from './config/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimit.js';
import routes from './routes/index.js';
import swaggerSpec from './config/swagger.js';
import { trackErrors, performanceMonitoring, requestTracking } from './middleware/errorTracking.js';
import {
  corsOptions,
  helmetOptions,
  validateUserAgent,
  validateIP,
  logSuspiciousActivity,
  addSecurityHeaders,
} from './middleware/security.js';

/**
 * إنشاء تطبيق Express
 */
const app = express();

/**
 * ✅ إعدادات الأمان المحسنة
 */
// Trust proxy للحصول على IP الصحيح
app.set('trust proxy', 1);

// ✅ Security headers محسنة
app.use(addSecurityHeaders);

// ✅ CORS محسن
app.use(cors(corsOptions));

// ✅ Helmet محسن لحماية HTTP headers
app.use(helmet(helmetOptions));

// ✅ التحقق من IP والـ User-Agent
app.use(validateIP);
app.use(validateUserAgent);

// ✅ تسجيل النشاط المشبوه
app.use(logSuspiciousActivity);

// منع MongoDB Injection
app.use(mongoSanitize());

/**
 * Middleware للطلبات
 */
// تحليل JSON
app.use(express.json({ limit: '10mb' }));

// تحليل URL-encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// تحليل Cookies
app.use(cookieParser());

// ضغط الاستجابات
app.use(compression());

// تسجيل الطلبات
if (config.server.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Rate limiting
if (config.server.env !== 'test') {
  app.use('/api/', generalLimiter);
}

/**
 * Error Tracking & Performance Monitoring
 */
// تتبع الطلبات
app.use(requestTracking);

// مراقبة الأداء
app.use(performanceMonitoring);

/**
 * المسارات الأساسية
 */
// صفحة الصحة
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
  });
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'مرحباً بك في نظام إدارة المؤسسات',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

/**
 * Swagger API Documentation
 */
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SaaS ERP API Documentation',
  })
);

/**
 * مسارات API
 */
app.use('/api/v1', routes);

/**
 * معالجة الأخطاء
 */
// معالج المسارات غير الموجودة
app.use(notFound);

// تتبع الأخطاء تلقائياً
app.use(trackErrors);

// معالج الأخطاء المركزي
app.use(errorHandler);

export default app;
