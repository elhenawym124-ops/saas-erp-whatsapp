/**
 * Health Check Routes
 * مسارات فحص صحة النظام
 */

import express from 'express';
import {
  checkMySQLHealth,
  checkMongoDBHealth,
  checkSystemHealth,
  checkAPIHealth,
  checkAllServices,
  getHealthCheckHistory,
  getErrors,
  getErrorStatistics,
  resolveError,
  getMostFrequentErrors,
  getDailyErrorReport,
} from '../controllers/healthController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/health/mysql:
 *   get:
 *     summary: فحص صحة قاعدة بيانات MySQL
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: نتيجة فحص MySQL
 */
router.get('/mysql', checkMySQLHealth);

/**
 * @swagger
 * /api/v1/health/mongodb:
 *   get:
 *     summary: فحص صحة قاعدة بيانات MongoDB
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: نتيجة فحص MongoDB
 */
router.get('/mongodb', checkMongoDBHealth);

/**
 * @swagger
 * /api/v1/health/system:
 *   get:
 *     summary: فحص صحة النظام (CPU, Memory, Disk)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: نتيجة فحص النظام
 */
router.get('/system', checkSystemHealth);

/**
 * @swagger
 * /api/v1/health/api:
 *   get:
 *     summary: فحص صحة API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: نتيجة فحص API
 */
router.get('/api', checkAPIHealth);

/**
 * @swagger
 * /api/v1/health/all:
 *   get:
 *     summary: فحص شامل لجميع الخدمات
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: نتيجة فحص جميع الخدمات
 */
router.get('/all', checkAllServices);

/**
 * @swagger
 * /api/v1/health/history:
 *   get:
 *     summary: الحصول على سجل فحوصات الصحة
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: checkType
 *         schema:
 *           type: string
 *         description: نوع الفحص (mysql, mongodb, system, api)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: عدد النتائج
 *     responses:
 *       200:
 *         description: سجل فحوصات الصحة
 */
router.get('/history', protect, authorize(['admin', 'super_admin']), getHealthCheckHistory);

/**
 * @swagger
 * /api/v1/health/errors:
 *   get:
 *     summary: الحصول على جميع الأخطاء
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: isResolved
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: قائمة الأخطاء
 */
router.get('/errors', protect, authorize(['admin', 'super_admin']), getErrors);

/**
 * @swagger
 * /api/v1/health/errors/statistics:
 *   get:
 *     summary: الحصول على إحصائيات الأخطاء
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: إحصائيات الأخطاء
 */
router.get('/errors/statistics', protect, authorize(['admin', 'super_admin']), getErrorStatistics);

/**
 * @swagger
 * /api/v1/health/errors/frequent:
 *   get:
 *     summary: الحصول على الأخطاء الأكثر تكراراً
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: الأخطاء الأكثر تكراراً
 */
router.get('/errors/frequent', protect, authorize(['admin', 'super_admin']), getMostFrequentErrors);

/**
 * @swagger
 * /api/v1/health/errors/daily-report:
 *   get:
 *     summary: الحصول على تقرير الأخطاء اليومي
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تقرير الأخطاء اليومي
 */
router.get(
  '/errors/daily-report',
  protect,
  authorize(['admin', 'super_admin']),
  getDailyErrorReport
);

/**
 * @swagger
 * /api/v1/health/errors/{id}/resolve:
 *   patch:
 *     summary: وضع علامة على خطأ كمحلول
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: تم وضع علامة على الخطأ كمحلول
 */
router.patch('/errors/:id/resolve', protect, authorize(['admin', 'super_admin']), resolveError);

export default router;
