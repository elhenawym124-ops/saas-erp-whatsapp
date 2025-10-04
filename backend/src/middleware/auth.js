import jwt from 'jsonwebtoken';
import authService from '../services/authService-mysql.js';
import config from '../config/app.js';
import { AppError, asyncHandler } from './errorHandler.js';
import logger from '../config/logger.js';

/**
 * Auth Middleware
 * التحقق من صحة JWT Token والصلاحيات
 */

/**
 * حماية المسارات - التحقق من JWT Token
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // الحصول على Token من Header أو Cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // التحقق من وجود Token
  if (!token) {
    throw new AppError('غير مصرح لك بالوصول لهذا المسار', 401);
  }

  try {
    // التحقق من صحة Token
    const decoded = jwt.verify(token, config.jwt.secret);

    logger.info('🔐 Token decoded successfully', {
      userId: decoded.userId,
      type: decoded.type,
      path: req.path
    });

    // التحقق من نوع Token
    if (decoded.type !== 'access') {
      logger.warn('⚠️ Invalid token type', { type: decoded.type });
      throw new AppError('نوع Token غير صحيح', 401);
    }

    // الحصول على المستخدم
    const user = await authService.getCurrentUser(decoded.userId);

    if (!user) {
      logger.warn('⚠️ User not found', { userId: decoded.userId });
      throw new AppError('المستخدم غير موجود', 401);
    }

    logger.info('✅ User authenticated', {
      userId: user.id,
      email: user.email,
      organizationId: user.organization.id,
      role: user.role,
      path: req.path
    });

    // إضافة المستخدم للطلب
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organization: user.organization.id,
      modulesAccess: { whatsapp: true }, // صلاحيات تجريبية
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Token غير صالح', 401);
    } else if (error.name === 'TokenExpiredError') {
      throw new AppError('Token منتهي الصلاحية', 401);
    }
    throw error;
  }
});

/**
 * التحقق من الصلاحيات - Role-based Authorization
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('يجب تسجيل الدخول أولاً', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('ليس لديك صلاحية للوصول لهذا المسار', 403);
    }

    next();
  };
};

/**
 * التحقق من صلاحية الوصول للموديول
 */
export const checkModuleAccess = (moduleName) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('يجب تسجيل الدخول أولاً', 401);
    }

    // Super Admin له صلاحية الوصول لكل شيء
    if (req.user.role === 'super_admin') {
      return next();
    }

    // التحقق من صلاحية الوصول للموديول
    if (!req.user.modulesAccess || !req.user.modulesAccess[moduleName]) {
      throw new AppError(`ليس لديك صلاحية الوصول لموديول ${moduleName}`, 403);
    }

    next();
  };
};

/**
 * التحقق من ملكية المورد
 * يتحقق من أن المستخدم يملك المورد أو لديه صلاحية الوصول له
 */
export const checkOwnership = (Model, paramName = 'id', ownerField = 'user') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[paramName];
    const resource = await Model.findById(resourceId);

    if (!resource) {
      throw new AppError('المورد غير موجود', 404);
    }

    // Super Admin و Admin لهم صلاحية الوصول لكل شيء
    if (['super_admin', 'admin'].includes(req.user.role)) {
      return next();
    }

    // التحقق من الملكية
    const ownerId = resource[ownerField]?.toString();
    if (ownerId !== req.user.id.toString()) {
      throw new AppError('ليس لديك صلاحية الوصول لهذا المورد', 403);
    }

    next();
  });
};

/**
 * التحقق من أن المستخدم ينتمي لنفس المؤسسة
 */
export const checkOrganization = (Model, paramName = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[paramName];
    const resource = await Model.findById(resourceId);

    if (!resource) {
      throw new AppError('المورد غير موجود', 404);
    }

    // التحقق من المؤسسة
    if (resource.organization.toString() !== req.user.organization.toString()) {
      throw new AppError('ليس لديك صلاحية الوصول لهذا المورد', 403);
    }

    next();
  });
};
