import jwt from 'jsonwebtoken';
import config from '../config/app.js';
import { AppError } from '../middleware/errorHandler.js';
import { getModel } from '../models/index.js';

/**
 * خدمة المصادقة المبسطة - للاختبار مع MySQL
 */
class AuthService {
  /**
   * إنشاء JWT Token
   */
  generateToken(userId, type = 'access') {
    const secret = type === 'refresh' ? config.jwt.refreshSecret : config.jwt.secret;
    const expiresIn = type === 'refresh' ? config.jwt.refreshExpire : config.jwt.expire;

    return jwt.sign({ userId, type }, secret, { expiresIn });
  }

  /**
   * التحقق من JWT Token
   */
  verifyToken(token, type = 'access') {
    try {
      const secret = type === 'refresh' ? config.jwt.refreshSecret : config.jwt.secret;
      return jwt.verify(token, secret);
    } catch (error) {
      throw new AppError('Token غير صالح', 401);
    }
  }

  /**
   * تسجيل دخول تجريبي
   */
  async testLogin(email, password) {
    // تسجيل دخول تجريبي بسيط
    if (email === 'test@test.com' && password === 'test123') {
      const userId = 1; // ID تجريبي
      const organizationId = 1; // Organization ID تجريبي

      const accessToken = this.generateToken(userId, 'access');
      const refreshToken = this.generateToken(userId, 'refresh');

      return {
        user: {
          id: userId,
          email,
          fullName: 'مستخدم تجريبي',
          role: 'admin',
          organization: {
            id: organizationId,
            name: 'شركة تجريبية',
            domain: 'test-org',
          },
        },
        accessToken,
        refreshToken,
      };
    }

    throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
  }

  /**
   * الحصول على المستخدم الحالي (تجريبي)
   */
  async getCurrentUser(userId) {
    if (userId === 1) {
      return {
        id: 1,
        email: 'test@test.com',
        fullName: 'مستخدم تجريبي',
        role: 'admin',
        organization: {
          id: 1,
          name: 'شركة تجريبية',
          domain: 'test-org',
        },
      };
    }

    throw new AppError('المستخدم غير موجود', 404);
  }

  /**
   * تسجيل الخروج
   */
  async logout(userId) {
    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  /**
   * تحديث Access Token
   */
  async refreshAccessToken(refreshToken) {
    const decoded = this.verifyToken(refreshToken, 'refresh');
    const accessToken = this.generateToken(decoded.userId, 'access');

    return {
      accessToken,
      user: {
        id: decoded.userId,
        email: 'test@test.com',
        fullName: 'مستخدم تجريبي',
        role: 'admin',
      },
    };
  }
}

export default new AuthService();
