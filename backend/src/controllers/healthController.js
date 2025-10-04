/**
 * Health Check Controller
 * معالج طلبات فحص صحة النظام
 */

import healthCheckService from '../services/healthCheckService.js';
import errorTrackingService from '../services/errorTrackingService.js';
import { successResponse } from '../utils/responseFormatter.js';

/**
 * فحص صحة قاعدة بيانات MySQL
 */
export const checkMySQLHealth = async (req, res, next) => {
  try {
    const result = await healthCheckService.checkMySQLHealth();
    res.json(successResponse(result, 'MySQL health check completed'));
  } catch (error) {
    next(error);
  }
};

/**
 * فحص صحة قاعدة بيانات MongoDB
 */
export const checkMongoDBHealth = async (req, res, next) => {
  try {
    const result = await healthCheckService.checkMongoDBHealth();
    res.json(successResponse(result, 'MongoDB health check completed'));
  } catch (error) {
    next(error);
  }
};

/**
 * فحص صحة النظام
 */
export const checkSystemHealth = async (req, res, next) => {
  try {
    const result = await healthCheckService.checkSystemHealth();
    res.json(successResponse(result, 'System health check completed'));
  } catch (error) {
    next(error);
  }
};

/**
 * فحص صحة API
 */
export const checkAPIHealth = async (req, res, next) => {
  try {
    const result = await healthCheckService.checkAPIHealth();
    res.json(successResponse(result, 'API health check completed'));
  } catch (error) {
    next(error);
  }
};

/**
 * فحص شامل لجميع الخدمات
 */
export const checkAllServices = async (req, res, next) => {
  try {
    const result = await healthCheckService.checkAllServices();
    res.json(successResponse(result, 'All services health check completed'));
  } catch (error) {
    next(error);
  }
};

/**
 * الحصول على سجل فحوصات الصحة
 */
export const getHealthCheckHistory = async (req, res, next) => {
  try {
    const { checkType, limit } = req.query;
    const history = await healthCheckService.getHealthCheckHistory(
      checkType,
      parseInt(limit) || 100
    );
    res.json(successResponse(history, 'Health check history retrieved'));
  } catch (error) {
    next(error);
  }
};

/**
 * الحصول على جميع الأخطاء
 */
export const getErrors = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;
    const { severity, isResolved, limit, offset } = req.query;

    const errors = await errorTrackingService.getErrors({
      organizationId,
      severity,
      isResolved: isResolved !== undefined ? isResolved === 'true' : undefined,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
    });

    res.json(successResponse(errors, 'Errors retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * الحصول على إحصائيات الأخطاء
 */
export const getErrorStatistics = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;
    const statistics = await errorTrackingService.getErrorStatistics(organizationId);
    res.json(successResponse(statistics, 'Error statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * وضع علامة على خطأ كمحلول
 */
export const resolveError = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resolvedBy = req.user._id;

    await errorTrackingService.resolveError(id, resolvedBy);
    res.json(successResponse(null, 'Error marked as resolved'));
  } catch (error) {
    next(error);
  }
};

/**
 * الحصول على الأخطاء الأكثر تكراراً
 */
export const getMostFrequentErrors = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;
    const { limit } = req.query;

    const errors = await errorTrackingService.getMostFrequentErrors(
      organizationId,
      parseInt(limit) || 10
    );

    res.json(successResponse(errors, 'Most frequent errors retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * الحصول على تقرير الأخطاء اليومي
 */
export const getDailyErrorReport = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;
    const report = await errorTrackingService.getDailyErrorReport(organizationId);
    res.json(successResponse(report, 'Daily error report retrieved successfully'));
  } catch (error) {
    next(error);
  }
};
