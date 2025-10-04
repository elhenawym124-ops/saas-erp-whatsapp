/**
 * Catch Async Errors Wrapper
 * دالة مساعدة للتعامل مع الأخطاء في الدوال غير المتزامنة
 */

/**
 * @param {Function} fn - الدالة غير المتزامنة
 * @returns {Function} - دالة middleware تلتقط الأخطاء
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
