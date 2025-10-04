/**
 * Response Formatter Utility
 * أداة تنسيق الاستجابات
 */

/**
 * تنسيق استجابة ناجحة
 */
export const successResponse = (data, message = 'تمت العملية بنجاح') => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * تنسيق استجابة خطأ
 */
export const errorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode,
  };
};

/**
 * تنسيق استجابة مع pagination
 */
export const paginatedResponse = (data, pagination, message = 'تمت العملية بنجاح') => {
  return {
    success: true,
    message,
    data,
    pagination,
  };
};
