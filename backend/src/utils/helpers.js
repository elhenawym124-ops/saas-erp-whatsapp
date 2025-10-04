import { PAGINATION } from './constants.js';

/**
 * دوال مساعدة عامة
 */

/**
 * إنشاء استجابة موحدة للنجاح
 */
export const successResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
};

/**
 * إنشاء استجابة موحدة للخطأ
 */
export const errorResponse = (message = 'Error', statusCode = 500, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    errors,
  };
};

/**
 * معالجة معاملات الصفحات
 */
export const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * إنشاء بيانات الصفحات
 */
export const getPaginationData = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
};

/**
 * تنظيف الكائن من القيم الفارغة
 */
export const cleanObject = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/**
 * تحويل النص إلى slug
 */
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

/**
 * توليد رمز عشوائي
 */
export const generateRandomCode = (length = 6) => {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

/**
 * توليد رقم عشوائي
 */
export const generateRandomNumber = (min = 100000, max = 999999) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * تنسيق التاريخ
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * حساب الفرق بين تاريخين بالأيام
 */
export const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * حساب الفرق بين تاريخين بالساعات
 */
export const getHoursDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return diffTime / (1000 * 60 * 60);
};

/**
 * التحقق من صحة البريد الإلكتروني
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * التحقق من صحة رقم الهاتف
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * تنسيق رقم الهاتف لـ WhatsApp
 */
export const formatPhoneForWhatsApp = (phone) => {
  // إزالة جميع الأحرف غير الرقمية
  let cleaned = phone.replace(/\D/g, '');

  // إضافة رمز الدولة إذا لم يكن موجوداً (مصر 20)
  if (!cleaned.startsWith('20') && cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = `20${cleaned.substring(1)}`;
  } else if (!cleaned.startsWith('20') && cleaned.length === 10) {
    cleaned = `20${cleaned}`;
  }

  return `${cleaned}@s.whatsapp.net`;
};

/**
 * تحويل الحجم بالبايت إلى نص قابل للقراءة
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

/**
 * تأخير التنفيذ
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * محاولة تنفيذ دالة مع إعادة المحاولة
 */
export const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(delay * attempt);
    }
  }
};

/**
 * إخفاء جزء من النص
 */
export const maskString = (str, visibleChars = 4, maskChar = '*') => {
  if (!str || str.length <= visibleChars) {
    return str;
  }

  const visible = str.slice(-visibleChars);
  const masked = maskChar.repeat(str.length - visibleChars);
  return masked + visible;
};

/**
 * توليد معرف فريد
 */
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * التحقق من كون القيمة كائن
 */
export const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * دمج الكائنات بعمق
 */
export const deepMerge = (target, source) => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

export default {
  successResponse,
  errorResponse,
  getPaginationParams,
  getPaginationData,
  cleanObject,
  slugify,
  generateRandomCode,
  generateRandomNumber,
  formatDate,
  getDaysDifference,
  getHoursDifference,
  isValidEmail,
  isValidPhone,
  formatPhoneForWhatsApp,
  formatFileSize,
  sleep,
  retry,
  maskString,
  generateUniqueId,
  isObject,
  deepMerge,
};
