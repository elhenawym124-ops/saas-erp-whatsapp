/**
 * Error Tracking Middleware
 * Middleware لتتبع الأخطاء تلقائياً
 */

import errorTrackingService from '../services/errorTrackingService.js';
import logger from '../config/logger.js';

/**
 * Middleware لتتبع جميع الأخطاء تلقائياً
 */
export const trackErrors = (err, req, res, next) => {
  // تحديد مستوى الخطورة بناءً على نوع الخطأ
  let severity = 'medium';

  if (err.statusCode >= 500) {
    severity = 'critical';
  } else if (err.statusCode >= 400) {
    severity = 'high';
  } else if (err.name === 'ValidationError') {
    severity = 'low';
  }

  // تسجيل الخطأ في قاعدة البيانات
  errorTrackingService
    .logError({
      organizationId: req.user?.organization || null,
      userId: req.user?._id || null,
      errorType: err.name || 'UnknownError',
      errorMessage: err.message,
      stackTrace: err.stack,
      requestUrl: req.originalUrl,
      requestMethod: req.method,
      requestBody: req.method !== 'GET' ? req.body : null,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      severity,
    })
    .catch((trackingError) => {
      logger.error('Failed to track error:', trackingError);
    });

  // تمرير الخطأ إلى معالج الأخطاء التالي
  next(err);
};

/**
 * Middleware لمراقبة الأداء
 */
export const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();

  // حفظ الدالة الأصلية
  const originalSend = res.send;

  // تعديل دالة send لتسجيل وقت الاستجابة
  res.send = function (data) {
    const responseTime = Date.now() - startTime;

    // تسجيل الطلبات البطيئة (أكثر من 1 ثانية)
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
      });

      // تسجيل كخطأ إذا كان بطيئاً جداً (أكثر من 5 ثواني)
      if (responseTime > 5000) {
        errorTrackingService
          .logError({
            organizationId: req.user?.organization || null,
            userId: req.user?._id || null,
            errorType: 'PerformanceIssue',
            errorMessage: `Slow request: ${req.method} ${req.originalUrl} took ${responseTime}ms`,
            requestUrl: req.originalUrl,
            requestMethod: req.method,
            severity: 'medium',
          })
          .catch((err) => {
            logger.error('Failed to log performance issue:', err);
          });
      }
    }

    // استدعاء الدالة الأصلية
    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware لتتبع الطلبات
 */
export const requestTracking = (req, res, next) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;

  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?._id,
  });

  next();
};

/**
 * Middleware للتحقق من صحة النظام قبل معالجة الطلبات
 */
export const healthCheckMiddleware = async (req, res, next) => {
  // تخطي فحص الصحة لمسارات الصحة نفسها
  if (req.path.startsWith('/api/v1/health')) {
    return next();
  }

  try {
    // يمكن إضافة فحوصات إضافية هنا
    // مثل التحقق من اتصال قاعدة البيانات قبل معالجة الطلب
    next();
  } catch (error) {
    logger.error('Health check middleware error:', error);
    next(error);
  }
};
