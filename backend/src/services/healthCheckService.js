/**
 * Health Check Service
 * خدمة فحص صحة النظام والخدمات المختلفة
 */

import mysql from 'mysql2/promise';
import logger from '../config/logger.js';

// MySQL Connection Pool
const mysqlPool = mysql.createPool({
  host: '92.113.22.70',
  user: 'u339372869_newtask',
  password: '0165676135Aa@A',
  database: 'u339372869_newtask',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

class HealthCheckService {
  /**
   * فحص صحة قاعدة بيانات MySQL
   */
  async checkMySQLHealth() {
    const startTime = Date.now();
    try {
      const [rows] = await mysqlPool.execute('SELECT 1 as health');
      const responseTime = Date.now() - startTime;

      const status = responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'down';

      await this.logHealthCheck('mysql', status, responseTime, {
        connected: true,
        responseTime,
      });

      return {
        status,
        responseTime,
        message: 'MySQL database is accessible',
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      await this.logHealthCheck('mysql', 'down', responseTime, {
        connected: false,
        error: error.message,
      });

      return {
        status: 'down',
        responseTime,
        message: 'MySQL database is not accessible',
        error: error.message,
      };
    }
  }

  /**
   * فحص صحة قاعدة بيانات MongoDB
   * ❌ تم تعطيل MongoDB - النظام يستخدم MySQL فقط
   */
  async checkMongoDBHealth() {
    return {
      status: 'disabled',
      responseTime: 0,
      message: 'MongoDB is not configured (System uses MySQL only)',
    };
  }

  /**
   * فحص صحة النظام (CPU, Memory, Disk)
   */
  async checkSystemHealth() {
    const startTime = Date.now();
    try {
      const os = await import('os');

      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      const cpuUsage = os.loadavg()[0]; // 1 minute load average
      const cpuCount = os.cpus().length;
      const cpuUsagePercent = (cpuUsage / cpuCount) * 100;

      const uptime = os.uptime();
      const responseTime = Date.now() - startTime;

      // تحديد الحالة بناءً على استخدام الموارد
      let status = 'healthy';
      if (memoryUsagePercent > 90 || cpuUsagePercent > 90) {
        status = 'down';
      } else if (memoryUsagePercent > 70 || cpuUsagePercent > 70) {
        status = 'degraded';
      }

      const details = {
        memory: {
          total: `${Math.round((totalMemory / 1024 / 1024 / 1024) * 100) / 100} GB`,
          used: `${Math.round((usedMemory / 1024 / 1024 / 1024) * 100) / 100} GB`,
          free: `${Math.round((freeMemory / 1024 / 1024 / 1024) * 100) / 100} GB`,
          usagePercent: `${Math.round(memoryUsagePercent * 100) / 100}%`,
        },
        cpu: {
          count: cpuCount,
          loadAverage: cpuUsage,
          usagePercent: `${Math.round(cpuUsagePercent * 100) / 100}%`,
        },
        uptime: `${Math.round((uptime / 60 / 60) * 100) / 100} hours`,
        platform: os.platform(),
        arch: os.arch(),
      };

      await this.logHealthCheck('system', status, responseTime, details);

      return {
        status,
        responseTime,
        message: 'System health check completed',
        details,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      await this.logHealthCheck('system', 'down', responseTime, {
        error: error.message,
      });

      return {
        status: 'down',
        responseTime,
        message: 'System health check failed',
        error: error.message,
      };
    }
  }

  /**
   * فحص صحة API
   */
  async checkAPIHealth() {
    const startTime = Date.now();
    try {
      const responseTime = Date.now() - startTime;
      const status = 'healthy';

      await this.logHealthCheck('api', status, responseTime, {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });

      return {
        status,
        responseTime,
        message: 'API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      await this.logHealthCheck('api', 'down', responseTime, {
        error: error.message,
      });

      return {
        status: 'down',
        responseTime,
        message: 'API health check failed',
        error: error.message,
      };
    }
  }

  /**
   * فحص شامل لجميع الخدمات
   */
  async checkAllServices() {
    try {
      const [mysql, mongodb, system, api] = await Promise.all([
        this.checkMySQLHealth(),
        this.checkMongoDBHealth(),
        this.checkSystemHealth(),
        this.checkAPIHealth(),
      ]);

      // تحديد الحالة العامة
      const statuses = [mysql.status, mongodb.status, system.status, api.status];
      let overallStatus = 'healthy';

      if (statuses.includes('down')) {
        overallStatus = 'down';
      } else if (statuses.includes('degraded')) {
        overallStatus = 'degraded';
      }

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: {
          mysql,
          mongodb,
          system,
          api,
        },
      };
    } catch (error) {
      logger.error('Failed to check all services:', error);
      return {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * تسجيل نتيجة فحص الصحة في قاعدة البيانات
   */
  async logHealthCheck(checkType, status, responseTime, details) {
    try {
      await mysqlPool.execute(
        `INSERT INTO system_health_checks (check_type, status, response_time, details)
         VALUES (?, ?, ?, ?)`,
        [checkType, status, responseTime, JSON.stringify(details)]
      );
    } catch (error) {
      logger.error('Failed to log health check:', error);
      // لا نرمي خطأ هنا
    }
  }

  /**
   * الحصول على سجل فحوصات الصحة
   */
  async getHealthCheckHistory(checkType, limit = 100) {
    try {
      let query = 'SELECT * FROM system_health_checks';
      const params = [];

      if (checkType) {
        query += ' WHERE check_type = ?';
        params.push(checkType);
      }

      query += ' ORDER BY checked_at DESC LIMIT ?';
      params.push(limit);

      const [rows] = await mysqlPool.execute(query, params);
      return rows;
    } catch (error) {
      logger.error('Failed to get health check history:', error);
      throw error;
    }
  }

  /**
   * حذف سجلات فحوصات الصحة القديمة (أكثر من 7 أيام)
   */
  async cleanupOldHealthChecks() {
    try {
      const [result] = await mysqlPool.execute(
        `DELETE FROM system_health_checks 
         WHERE checked_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );

      logger.info('Old health checks cleaned up', { deletedCount: result.affectedRows });
      return result.affectedRows;
    } catch (error) {
      logger.error('Failed to cleanup old health checks:', error);
      throw error;
    }
  }
}

export default new HealthCheckService();
