import helmet from 'helmet';
import cors from 'cors';
import logger from '../config/logger.js';

/**
 * إعدادات الأمان المحسنة
 */

/**
 * إعدادات CORS محسنة
 */
export const corsOptions = {
  origin(origin, callback) {
    // قائمة النطاقات المسموحة
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:4000',
      'http://localhost:5173',
      'http://localhost:8000',
      'http://localhost:8001',
      'https://yourdomain.com',
      'https://www.yourdomain.com',
    ];

    // السماح للطلبات بدون origin (مثل mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    // Debug logging
    logger.warn(`🔍 CORS Check - Origin: "${origin}", Allowed: ${allowedOrigins.includes(origin)}`);

    if (allowedOrigins.indexOf(origin) !== -1) {
      logger.warn(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      logger.warn(`❌ CORS blocked for origin: ${origin}`);
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('غير مسموح بالوصول من هذا النطاق'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400, // 24 ساعة
};

/**
 * إعدادات Helmet للأمان
 */
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
};

/**
 * Middleware للتحقق من صحة User-Agent
 */
export const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');

  if (!userAgent) {
    logger.warn(`Request without User-Agent from IP: ${req.ip}`);
    return res.status(400).json({
      success: false,
      message: 'User-Agent header مطلوب',
    });
  }

  // قائمة User-Agents المشبوهة
  const suspiciousAgents = ['curl', 'wget', 'python-requests', 'bot', 'crawler', 'spider'];

  const isSuspicious = suspiciousAgents.some((agent) =>
    userAgent.toLowerCase().includes(agent.toLowerCase())
  );

  if (isSuspicious && process.env.NODE_ENV === 'production') {
    logger.warn(`Suspicious User-Agent detected: ${userAgent} from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'وصول غير مصرح به',
    });
  }

  next();
};

/**
 * Middleware للتحقق من IP المشبوهة
 */
export const validateIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  // قائمة IPs محظورة (يمكن تحديثها من قاعدة البيانات)
  const blockedIPs = [
    // أضف IPs محظورة هنا
  ];

  if (blockedIPs.includes(clientIP)) {
    logger.error(`Blocked IP attempted access: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'تم حظر الوصول من هذا العنوان',
    });
  }

  next();
};

/**
 * Middleware لتسجيل الطلبات المشبوهة
 */
export const logSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /%3C/i, // Encoded < character
  ];

  const url = req.originalUrl || req.url;
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);

  const isSuspicious = suspiciousPatterns.some(
    (pattern) => pattern.test(url) || pattern.test(body) || pattern.test(query)
  );

  if (isSuspicious) {
    logger.error(`Suspicious request detected from IP: ${req.ip}`, {
      url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
    });
  }

  next();
};

/**
 * Middleware للحماية من CSRF
 */
export const csrfProtection = (req, res, next) => {
  // تخطي CSRF للطلبات GET
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn(`CSRF token mismatch from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'CSRF token غير صحيح',
    });
  }

  next();
};

/**
 * Middleware لإضافة headers أمان إضافية
 */
export const addSecurityHeaders = (req, res, next) => {
  // منع caching للبيانات الحساسة
  if (req.originalUrl.includes('/api/')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });
  }

  // إضافة headers أمان
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });

  next();
};

export default {
  corsOptions,
  helmetOptions,
  validateUserAgent,
  validateIP,
  logSuspiciousActivity,
  csrfProtection,
  addSecurityHeaders,
};
