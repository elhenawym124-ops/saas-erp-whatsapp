/**
 * Error Tracking Service
 * خدمة تتبع الأخطاء وتسجيلها في قاعدة البيانات
 */

import mysql from 'mysql2/promise';
import logger from '../config/logger.js';

// MySQL Connection Pool
const pool = mysql.createPool({
  host: '92.113.22.70',
  user: 'u339372869_newtask',
  password: '0165676135Aa@A',
  database: 'u339372869_newtask',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

class ErrorTrackingService {
  /**
   * تسجيل خطأ في قاعدة البيانات
   */
  async logError({
    organizationId = null,
    userId = null,
    errorType,
    errorMessage,
    stackTrace = null,
    requestUrl = null,
    requestMethod = null,
    requestBody = null,
    userAgent = null,
    ipAddress = null,
    severity = 'medium',
  }) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO error_logs (
          organization_id, user_id, error_type, error_message, stack_trace,
          request_url, request_method, request_body, user_agent, ip_address, severity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          organizationId,
          userId,
          errorType,
          errorMessage,
          stackTrace,
          requestUrl,
          requestMethod,
          requestBody ? JSON.stringify(requestBody) : null,
          userAgent,
          ipAddress,
          severity,
        ]
      );

      logger.error('Error logged to database', {
        errorId: result.insertId,
        errorType,
        severity,
      });

      // إرسال تنبيه للأخطاء الحرجة
      if (severity === 'critical') {
        await this.sendCriticalErrorAlert({
          errorId: result.insertId,
          errorType,
          errorMessage,
        });
      }

      return result.insertId;
    } catch (error) {
      logger.error('Failed to log error to database:', error);
      // لا نرمي خطأ هنا لتجنب حلقة لا نهائية
    }
  }

  /**
   * الحصول على جميع الأخطاء
   */
  async getErrors({ organizationId, severity, isResolved, limit = 100, offset = 0 }) {
    try {
      let query = 'SELECT * FROM error_logs WHERE 1=1';
      const params = [];

      if (organizationId) {
        query += ' AND organization_id = ?';
        params.push(organizationId);
      }

      if (severity) {
        query += ' AND severity = ?';
        params.push(severity);
      }

      if (isResolved !== undefined) {
        query += ' AND is_resolved = ?';
        params.push(isResolved);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      logger.error('Failed to get errors:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الأخطاء
   */
  async getErrorStatistics(organizationId) {
    try {
      const [stats] = await pool.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low,
          SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN is_resolved = 1 THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN is_resolved = 0 THEN 1 ELSE 0 END) as unresolved
        FROM error_logs
        WHERE organization_id = ? OR organization_id IS NULL`,
        [organizationId]
      );

      return stats[0];
    } catch (error) {
      logger.error('Failed to get error statistics:', error);
      throw error;
    }
  }

  /**
   * وضع علامة على خطأ كمحلول
   */
  async resolveError(errorId, resolvedBy) {
    try {
      await pool.execute(
        `UPDATE error_logs 
         SET is_resolved = 1, resolved_by = ?, resolved_at = NOW()
         WHERE id = ?`,
        [resolvedBy, errorId]
      );

      logger.info('Error marked as resolved', { errorId, resolvedBy });
    } catch (error) {
      logger.error('Failed to resolve error:', error);
      throw error;
    }
  }

  /**
   * حذف الأخطاء القديمة (أكثر من 90 يوم)
   */
  async cleanupOldErrors() {
    try {
      const [result] = await pool.execute(
        `DELETE FROM error_logs 
         WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
         AND is_resolved = 1`
      );

      logger.info('Old errors cleaned up', { deletedCount: result.affectedRows });
      return result.affectedRows;
    } catch (error) {
      logger.error('Failed to cleanup old errors:', error);
      throw error;
    }
  }

  /**
   * إرسال تنبيه للأخطاء الحرجة
   */
  async sendCriticalErrorAlert({ errorId, errorType, errorMessage }) {
    try {
      // يمكن إضافة إرسال بريد إلكتروني أو رسالة WhatsApp هنا
      logger.error('🚨 CRITICAL ERROR ALERT', {
        errorId,
        errorType,
        errorMessage,
      });

      // TODO: إضافة إرسال بريد إلكتروني
      // TODO: إضافة إرسال رسالة WhatsApp للمسؤولين
    } catch (error) {
      logger.error('Failed to send critical error alert:', error);
    }
  }

  /**
   * الحصول على الأخطاء الأكثر تكراراً
   */
  async getMostFrequentErrors(organizationId, limit = 10) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          error_type,
          COUNT(*) as count,
          MAX(created_at) as last_occurrence,
          severity
        FROM error_logs
        WHERE organization_id = ? OR organization_id IS NULL
        GROUP BY error_type, severity
        ORDER BY count DESC
        LIMIT ?`,
        [organizationId, limit]
      );

      return rows;
    } catch (error) {
      logger.error('Failed to get most frequent errors:', error);
      throw error;
    }
  }

  /**
   * الحصول على تقرير الأخطاء اليومي
   */
  async getDailyErrorReport(organizationId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
        FROM error_logs
        WHERE (organization_id = ? OR organization_id IS NULL)
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC`,
        [organizationId]
      );

      return rows;
    } catch (error) {
      logger.error('Failed to get daily error report:', error);
      throw error;
    }
  }
}

export default new ErrorTrackingService();
