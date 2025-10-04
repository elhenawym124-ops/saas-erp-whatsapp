/**
 * Custom Application Error Class
 * فئة خطأ مخصصة للتطبيق
 */

class AppError extends Error {
  /**
   * @param {string} message - رسالة الخطأ
   * @param {number} statusCode - كود حالة HTTP
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
