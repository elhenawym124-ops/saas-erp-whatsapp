import { createClient } from 'redis';
import logger from './logger.js';

let redisClient = null;

/**
 * إنشاء والاتصال بـ Redis
 */
const connectRedis = async () => {
  try {
    // إذا لم يتم تفعيل Redis، تخطي الاتصال
    if (!process.env.REDIS_HOST) {
      logger.warn('Redis configuration not found. Caching will be disabled.');
      return null;
    }

    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB) || 0,
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis Client Error: ${err.message}`);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.warn('Redis Client Disconnected');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.error(`Error connecting to Redis: ${error.message}`);
    logger.warn('Application will continue without caching');
    return null;
  }
};

/**
 * الحصول على عميل Redis
 */
const getRedisClient = () => {
  return redisClient;
};

/**
 * قطع الاتصال بـ Redis
 */
const disconnectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

/**
 * تخزين قيمة في Redis
 */
const setCache = async (key, value, expirationInSeconds = 3600) => {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    const serializedValue = JSON.stringify(value);
    await redisClient.setEx(key, expirationInSeconds, serializedValue);
    return true;
  } catch (error) {
    logger.error(`Error setting cache for key ${key}: ${error.message}`);
    return false;
  }
};

/**
 * الحصول على قيمة من Redis
 */
const getCache = async (key) => {
  if (!redisClient || !redisClient.isOpen) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Error getting cache for key ${key}: ${error.message}`);
    return null;
  }
};

/**
 * حذف قيمة من Redis
 */
const deleteCache = async (key) => {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Error deleting cache for key ${key}: ${error.message}`);
    return false;
  }
};

/**
 * حذف جميع المفاتيح التي تطابق النمط
 */
const deleteCachePattern = async (pattern) => {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error(`Error deleting cache pattern ${pattern}: ${error.message}`);
    return false;
  }
};

/**
 * مسح جميع البيانات من Redis (للاختبارات فقط)
 */
const flushCache = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('flushCache can only be used in test environment');
  }

  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    await redisClient.flushDb();
    logger.info('Redis cache flushed');
    return true;
  } catch (error) {
    logger.error(`Error flushing cache: ${error.message}`);
    return false;
  }
};

export {
  connectRedis,
  getRedisClient,
  disconnectRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  flushCache,
};

export default {
  connect: connectRedis,
  disconnect: disconnectRedis,
  set: setCache,
  get: getCache,
  delete: deleteCache,
  deletePattern: deleteCachePattern,
  flush: flushCache,
};
