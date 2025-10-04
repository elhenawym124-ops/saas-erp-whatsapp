import rateLimit from 'express-rate-limit';
import config from '../config/app.js';
import logger from '../config/logger.js';

/**
 * معالج تجاوز الحد
 */
const rateLimitHandler = (req, res) => {
  logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
  res.status(429).json({
    success: false,
    statusCode: 429,
    message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً',
  });
};

/**
 * Rate limiter عام للتطبيق
 */
export const generalLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // تخطي Rate limiting في وضع الاختبار أو التطوير مع localhost
    return (
      process.env.NODE_ENV === 'test' ||
      (process.env.NODE_ENV === 'development' && req.ip === '::1')
    );
  },
});

/**
 * Rate limiter لتسجيل الدخول
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات فقط
  message: 'تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة',
  handler: rateLimitHandler,
  skipSuccessfulRequests: true,
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter لإنشاء الحسابات
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 3, // 3 حسابات فقط
  message: 'تم تجاوز عدد محاولات إنشاء الحسابات. يرجى المحاولة لاحقاً',
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter لإرسال رسائل WhatsApp
 */
export const whatsappLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 20, // 20 رسالة في الدقيقة
  message: 'تم تجاوز الحد الأقصى لإرسال الرسائل. يرجى المحاولة لاحقاً',
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * ✅ Rate limiter محسن لإنشاء جلسات WhatsApp
 */
export const whatsappSessionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 دقائق
  max: 3, // 3 جلسات فقط كل 5 دقائق
  message: 'تم تجاوز الحد الأقصى لإنشاء جلسات WhatsApp. يرجى المحاولة بعد 5 دقائق',
  handler: (req, res) => {
    logger.warn(
      `WhatsApp session creation rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id}`
    );
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'تم تجاوز الحد الأقصى لإنشاء جلسات WhatsApp. يرجى المحاولة بعد 5 دقائق',
      retryAfter: 300, // 5 دقائق بالثواني
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => {
    // استخدام IP + User ID للتحكم الدقيق
    return `whatsapp_session_${req.ip}_${req.user?.id || 'anonymous'}`;
  },
});

/**
 * ✅ Rate limiter لطلبات QR Code
 */
export const qrCodeLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 ثانية
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // 100 للتطوير، 10 للإنتاج
  message: 'تم تجاوز الحد الأقصى لطلبات QR Code. يرجى المحاولة لاحقاً',
  handler: rateLimitHandler,
  skip: (req) =>
    process.env.NODE_ENV === 'test' || (process.env.NODE_ENV === 'development' && req.ip === '::1'),
  keyGenerator: (req) => {
    return `qr_code_${req.ip}_${req.params.sessionName || 'default'}`;
  },
});

/**
 * Rate limiter لرفع الملفات
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10, // 10 ملفات
  message: 'تم تجاوز الحد الأقصى لرفع الملفات. يرجى المحاولة لاحقاً',
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter للـ API العامة
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب
  message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * ✅ Rate limiter للحماية من الهجمات المكثفة
 */
export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // دقيقة واحدة
  max: 5, // 5 طلبات فقط
  message: 'تم اكتشاف نشاط مشبوه. تم حظر الوصول مؤقتاً',
  handler: (req, res) => {
    logger.error(
      `Suspicious activity detected from IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`
    );
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'تم اكتشاف نشاط مشبوه. تم حظر الوصول مؤقتاً',
      retryAfter: 60,
    });
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * ✅ Rate limiter ديناميكي حسب المستخدم
 */
export const createUserBasedLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: 'تم تجاوز الحد الأقصى للطلبات لهذا المستخدم',
    handler: rateLimitHandler,
    skip: (req) => process.env.NODE_ENV === 'test',
    keyGenerator: (req) => {
      // استخدام User ID بدلاً من IP للمستخدمين المسجلين
      return req.user?.id ? `user_${req.user.id}` : `ip_${req.ip}`;
    },
  });
};

/**
 * ✅ Rate limiter للعمليات الحساسة
 */
export const sensitiveOperationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 10, // 10 عمليات حساسة فقط
  message: 'تم تجاوز الحد الأقصى للعمليات الحساسة. يرجى المحاولة لاحقاً',
  handler: (req, res) => {
    logger.warn(`Sensitive operation rate limit exceeded for User: ${req.user?.id}, IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'تم تجاوز الحد الأقصى للعمليات الحساسة. يرجى المحاولة لاحقاً',
      retryAfter: 3600,
    });
  },
  skip: (req) => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => {
    return req.user?.id ? `sensitive_user_${req.user.id}` : `sensitive_ip_${req.ip}`;
  },
});

export default {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  whatsappLimiter,
  whatsappSessionLimiter,
  qrCodeLimiter,
  uploadLimiter,
  apiLimiter,
  strictLimiter,
  createUserBasedLimiter,
  sensitiveOperationsLimiter,
};
