import logger from '../config/logger.js';
import { ERROR_CODES } from '../utils/constants.js';

/**
 * معالج الأخطاء المركزي
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * معالج أخطاء Mongoose
 */
const handleMongooseError = () => {
  // خطأ التحقق من الصحة
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    return new AppError('خطأ في التحقق من البيانات', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // خطأ القيمة المكررة
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new AppError(`القيمة ${field} موجودة بالفعل`, 400, ERROR_CODES.DUPLICATE_ERROR);
  }

  // خطأ Cast (معرف غير صحيح)
  if (error.name === 'CastError') {
    return new AppError('معرف غير صحيح', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return error;
};

/**
 * معالج أخطاء JWT
 */
const handleJWTError = () => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('رمز المصادقة غير صحيح', 401, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError('انتهت صلاحية رمز المصادقة', 401, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  return error;
};

/**
 * معالج الأخطاء في وضع التطوير
 */
const sendErrorDev = (err, res) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    error: err,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    statusCode: err.statusCode || 500,
    errorCode: err.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

/**
 * معالج الأخطاء في وضع الإنتاج
 */
const sendErrorProd = (err, res) => {
  // أخطاء تشغيلية معروفة: إرسال رسالة للعميل
  if (err.isOperational) {
    logger.error('Operational Error:', {
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
    });

    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      message: err.message,
    });
  } else {
    // أخطاء برمجية أو غير معروفة: عدم تسريب التفاصيل
    logger.error('Programming or Unknown Error:', {
      message: err.message,
      stack: err.stack,
      error: err,
    });

    res.status(500).json({
      success: false,
      statusCode: 500,
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'حدث خطأ في الخادم',
    });
  }
};

/**
 * Middleware معالجة الأخطاء
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // معالجة أنواع مختلفة من الأخطاء
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) {
    error = handleMongooseError(err);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }

  // إرسال الاستجابة بناءً على البيئة
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * معالج المسارات غير الموجودة
 */
const notFound = (req, res, next) => {
  const error = new AppError(`المسار ${req.originalUrl} غير موجود`, 404, ERROR_CODES.NOT_FOUND);
  next();
};

/**
 * Wrapper لمعالجة الأخطاء في الدوال غير المتزامنة
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { AppError, errorHandler, notFound, asyncHandler };
export default errorHandler;
