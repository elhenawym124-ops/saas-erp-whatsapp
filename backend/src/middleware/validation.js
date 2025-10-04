import { validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';
import { ERROR_CODES } from '../utils/constants.js';
import logger from '../config/logger.js';

/**
 * Middleware للتحقق من نتائج التحقق من الصحة
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    logger.warn('Validation errors:', extractedErrors);

    const error = new AppError('خطأ في التحقق من البيانات', 400, ERROR_CODES.VALIDATION_ERROR);
    error.details = extractedErrors;
    throw error;
  }

  next();
};

// Alias for validate
export const validateRequest = validate;

/**
 * Middleware للتحقق من معاملات الصفحات
 */
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    throw new AppError('رقم الصفحة يجب أن يكون رقماً موجباً', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    throw new AppError('حد العناصر يجب أن يكون بين 1 و 100', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  next();
};

/**
 * Middleware للتحقق من ObjectId في MongoDB
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!objectIdRegex.test(id)) {
      throw new AppError('معرف غير صحيح', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    next();
  };
};

/**
 * Middleware للتحقق من نوع الملف
 */
export const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError(
        `نوع الملف غير مدعوم. الأنواع المسموحة: ${allowedTypes.join(', ')}`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    next();
  };
};

/**
 * Middleware للتحقق من حجم الملف
 */
export const validateFileSize = (maxSize) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    if (req.file.size > maxSize) {
      throw new AppError(
        `حجم الملف كبير جداً. الحد الأقصى: ${maxSize / 1024 / 1024}MB`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    next();
  };
};

/**
 * Middleware للتحقق من التواريخ
 */
export const validateDateRange = (startDateField = 'startDate', endDateField = 'endDate') => {
  return (req, res, next) => {
    const startDate = req.body[startDateField] || req.query[startDateField];
    const endDate = req.body[endDateField] || req.query[endDateField];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new AppError('تنسيق التاريخ غير صحيح', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      if (start > end) {
        throw new AppError(
          'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    next();
  };
};

export default {
  validate,
  validateRequest,
  validatePagination,
  validateObjectId,
  validateFileType,
  validateFileSize,
  validateDateRange,
};
