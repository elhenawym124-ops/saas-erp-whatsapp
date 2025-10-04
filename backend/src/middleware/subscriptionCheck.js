/**
 * Subscription Check Middleware
 * التحقق من صلاحية الاشتراك والحدود
 */

import Subscription from '../models/Subscription.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * التحقق من صلاحية الاشتراك
 */
export const checkSubscriptionStatus = catchAsync(async (req, res, next) => {
  // تخطي التحقق لـ Super Admin
  if (req.user.role === 'super_admin') {
    return next();
  }

  const subscription = await Subscription.findOne({
    organization: req.user.organization,
  });

  if (!subscription) {
    return next(new AppError('لا يوجد اشتراك لهذه المؤسسة', 403));
  }

  // التحقق من حالة الاشتراك
  if (subscription.status === 'suspended') {
    return next(new AppError('تم تعليق اشتراك المؤسسة. يرجى التواصل مع الدعم', 403));
  }

  if (subscription.status === 'cancelled') {
    return next(new AppError('تم إلغاء اشتراك المؤسسة', 403));
  }

  if (subscription.status === 'expired') {
    return next(new AppError('انتهت صلاحية اشتراك المؤسسة. يرجى التجديد', 403));
  }

  // التحقق من تاريخ الانتهاء
  if (subscription.isExpired) {
    subscription.status = 'expired';
    await subscription.save();
    return next(new AppError('انتهت صلاحية اشتراك المؤسسة. يرجى التجديد', 403));
  }

  // إضافة الاشتراك إلى الطلب
  req.subscription = subscription;
  next();
});

/**
 * التحقق من إمكانية إضافة مستخدم جديد
 */
export const checkUserLimit = catchAsync(async (req, res, next) => {
  // تخطي التحقق لـ Super Admin
  if (req.user.role === 'super_admin') {
    return next();
  }

  const subscription = await Subscription.findOne({
    organization: req.user.organization,
  });

  if (!subscription) {
    return next(new AppError('لا يوجد اشتراك لهذه المؤسسة', 403));
  }

  if (!subscription.canAddUser()) {
    const { features } = subscription;
    return next(
      new AppError(
        `تم الوصول إلى الحد الأقصى للمستخدمين (${features.maxUsers}). يرجى ترقية الخطة`,
        403
      )
    );
  }

  next();
});

/**
 * التحقق من إمكانية إضافة مشروع جديد
 */
export const checkProjectLimit = catchAsync(async (req, res, next) => {
  // تخطي التحقق لـ Super Admin
  if (req.user.role === 'super_admin') {
    return next();
  }

  const subscription = await Subscription.findOne({
    organization: req.user.organization,
  });

  if (!subscription) {
    return next(new AppError('لا يوجد اشتراك لهذه المؤسسة', 403));
  }

  if (!subscription.canAddProject()) {
    const { features } = subscription;
    return next(
      new AppError(
        `تم الوصول إلى الحد الأقصى للمشاريع (${features.maxProjects}). يرجى ترقية الخطة`,
        403
      )
    );
  }

  next();
});

/**
 * التحقق من إمكانية إضافة جلسة WhatsApp جديدة
 */
export const checkWhatsAppSessionLimit = catchAsync(async (req, res, next) => {
  // تخطي التحقق لـ Super Admin
  if (req.user.role === 'super_admin') {
    return next();
  }

  const subscription = await Subscription.findOne({
    organization: req.user.organization,
  });

  if (!subscription) {
    return next(new AppError('لا يوجد اشتراك لهذه المؤسسة', 403));
  }

  if (!subscription.canAddWhatsAppSession()) {
    const { features } = subscription;
    return next(
      new AppError(
        `تم الوصول إلى الحد الأقصى لجلسات WhatsApp (${features.whatsappSessions}). يرجى ترقية الخطة`,
        403
      )
    );
  }

  next();
});

/**
 * التحقق من إمكانية الوصول إلى التقارير المخصصة
 */
export const checkCustomReportsAccess = catchAsync(async (req, res, next) => {
  // تخطي التحقق لـ Super Admin
  if (req.user.role === 'super_admin') {
    return next();
  }

  const subscription = await Subscription.findOne({
    organization: req.user.organization,
  });

  if (!subscription) {
    return next(new AppError('لا يوجد اشتراك لهذه المؤسسة', 403));
  }

  const { features } = subscription;
  if (!features.customReports) {
    return next(new AppError('التقارير المخصصة غير متاحة في خطتك الحالية. يرجى الترقية', 403));
  }

  next();
});

/**
 * التحقق من إمكانية الوصول إلى API
 */
export const checkAPIAccess = catchAsync(async (req, res, next) => {
  // تخطي التحقق لـ Super Admin
  if (req.user.role === 'super_admin') {
    return next();
  }

  const subscription = await Subscription.findOne({
    organization: req.user.organization,
  });

  if (!subscription) {
    return next(new AppError('لا يوجد اشتراك لهذه المؤسسة', 403));
  }

  const { features } = subscription;
  if (!features.apiAccess) {
    return next(new AppError('الوصول إلى API غير متاح في خطتك الحالية. يرجى الترقية', 403));
  }

  next();
});

/**
 * التحقق من إمكانية الوصول إلى ميزة معينة
 */
export const checkFeatureAccess = (featureName) => {
  return catchAsync(async (req, res, next) => {
    // تخطي التحقق لـ Super Admin
    if (req.user.role === 'super_admin') {
      return next();
    }

    const subscription = await Subscription.findOne({
      organization: req.user.organization,
    });

    if (!subscription) {
      return next(new AppError('لا يوجد اشتراك لهذه المؤسسة', 403));
    }

    const { features } = subscription;
    if (!features[featureName]) {
      return next(new AppError(`هذه الميزة غير متاحة في خطتك الحالية. يرجى الترقية`, 403));
    }

    next();
  });
};

/**
 * Middleware لتحديث الاستخدام عند إضافة مورد
 */
export const updateUsageOnCreate = (resourceType) => {
  return catchAsync(async (req, res, next) => {
    // تخطي التحديث لـ Super Admin
    if (req.user.role === 'super_admin') {
      return next();
    }

    const subscription = await Subscription.findOne({
      organization: req.user.organization,
    });

    if (subscription) {
      await subscription.updateUsage(resourceType, true);
    }

    next();
  });
};

/**
 * Middleware لتحديث الاستخدام عند حذف مورد
 */
export const updateUsageOnDelete = (resourceType) => {
  return catchAsync(async (req, res, next) => {
    // تخطي التحديث لـ Super Admin
    if (req.user.role === 'super_admin') {
      return next();
    }

    const subscription = await Subscription.findOne({
      organization: req.user.organization,
    });

    if (subscription) {
      await subscription.updateUsage(resourceType, false);
    }

    next();
  });
};
