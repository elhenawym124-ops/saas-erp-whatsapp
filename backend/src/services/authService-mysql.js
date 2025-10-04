import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getModel } from '../models/index.js';
import config from '../config/app.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

/**
 * خدمة المصادقة - MySQL/Sequelize
 * تحتوي على منطق الأعمال للتسجيل وتسجيل الدخول
 */
class AuthService {
  /**
   * إنشاء JWT Token
   */
  generateToken(userId, type = 'access') {
    const secret = type === 'access' ? config.jwt.secret : config.jwt.refreshSecret;
    const expiresIn = type === 'access' ? config.jwt.expire : config.jwt.refreshExpire;

    return jwt.sign({ userId, type }, secret, { expiresIn });
  }

  /**
   * التحقق من JWT Token
   */
  verifyToken(token, type = 'access') {
    try {
      const secret = type === 'access' ? config.jwt.secret : config.jwt.refreshSecret;
      const decoded = jwt.verify(token, secret);

      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  /**
   * تسجيل مستخدم جديد
   */
  async register(userData) {
    const { email, password, phone, organizationData, personalInfo, workInfo } = userData;

    const User = getModel('User');
    const Organization = getModel('Organization');

    // التحقق من عدم وجود المستخدم مسبقاً
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('البريد الإلكتروني مستخدم بالفعل', 400);
    }

    // إنشاء المؤسسة أولاً
    let organization;
    if (organizationData) {
      organization = await Organization.create({
        name: organizationData.name,
        domain: organizationData.domain,
        email: organizationData.email || email,
        phone: organizationData.phone || phone,
        isActive: true,
      });
    } else {
      throw new AppError('بيانات المؤسسة مطلوبة', 400);
    }

    // إنشاء المستخدم
    const user = await User.create({
      organizationId: organization.id,
      email,
      password, // سيتم تشفيرها تلقائياً في hook
      phone,
      firstName: personalInfo?.firstName || '',
      lastName: personalInfo?.lastName || '',
      birthDate: personalInfo?.birthDate,
      nationalId: personalInfo?.nationalId,
      gender: personalInfo?.gender,
      address: personalInfo?.address || {},
      employeeId: workInfo?.employeeId || `EMP${Date.now()}`,
      department: workInfo?.department || 'General',
      position: workInfo?.position || 'Employee',
      hireDate: workInfo?.hireDate || new Date(),
      salary: workInfo?.salary,
      role: workInfo?.role || 'admin', // أول مستخدم يكون admin
      status: 'active',
      isActive: true,
    });

    // إنشاء Tokens
    const accessToken = this.generateToken(user.id, 'access');
    const refreshToken = this.generateToken(user.id, 'refresh');

    // حفظ refresh token
    await user.update({ refreshToken });

    // إرجاع البيانات بدون كلمة المرور
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return {
      user: userResponse,
      organization,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * تسجيل الدخول
   */
  async login(email, password, ipAddress) {
    const User = getModel('User');
    const Organization = getModel('Organization');

    // البحث عن المستخدم
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Organization,
          as: 'organization',
        },
      ],
    });

    if (!user) {
      throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    // التحقق من حالة المستخدم
    if (!user.isActive) {
      throw new AppError('الحساب غير نشط', 403);
    }

    if (user.status === 'suspended') {
      throw new AppError('الحساب موقوف مؤقتاً', 403);
    }

    if (user.status === 'terminated') {
      throw new AppError('الحساب منتهي', 403);
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    // تحديث معلومات تسجيل الدخول
    await user.update({
      lastLogin: new Date(),
      lastLoginIP: ipAddress,
    });

    // إنشاء Tokens
    const accessToken = this.generateToken(user.id, 'access');
    const refreshToken = this.generateToken(user.id, 'refresh');

    // حفظ refresh token
    await user.update({ refreshToken });

    // إرجاع البيانات بدون كلمة المرور
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshToken;

    logger.info(`User logged in: ${email} from IP: ${ipAddress}`);

    return {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * تحديث Access Token باستخدام Refresh Token
   */
  async refreshAccessToken(refreshToken) {
    const User = getModel('User');

    // التحقق من صحة الـ refresh token
    const decoded = this.verifyToken(refreshToken, 'refresh');

    // البحث عن المستخدم
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    // التحقق من أن الـ refresh token مطابق للمحفوظ
    if (user.refreshToken !== refreshToken) {
      throw new AppError('Refresh token غير صالح', 401);
    }

    // التحقق من حالة المستخدم
    if (!user.isActive) {
      throw new AppError('الحساب غير نشط', 403);
    }

    // إنشاء access token جديد
    const newAccessToken = this.generateToken(user.id, 'access');

    return {
      accessToken: newAccessToken,
    };
  }

  /**
   * تسجيل الخروج
   */
  async logout(userId) {
    const User = getModel('User');

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    // حذف refresh token
    await user.update({ refreshToken: null });

    logger.info(`User logged out: ${user.email}`);

    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  /**
   * الحصول على بيانات المستخدم الحالي
   */
  async getCurrentUser(userId) {
    const User = getModel('User');
    const Organization = getModel('Organization');

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Organization,
          as: 'organization',
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'firstName', 'lastName', 'email', 'position'],
        },
      ],
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    // إرجاع البيانات بدون كلمة المرور
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.resetPasswordToken;

    return userResponse;
  }

  /**
   * تحديث بيانات المستخدم
   */
  async updateProfile(userId, updateData) {
    const User = getModel('User');

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    // الحقول المسموح بتحديثها
    const allowedFields = [
      'firstName',
      'lastName',
      'phone',
      'avatar',
      'birthDate',
      'gender',
      'address',
      'whatsappNumber',
      'whatsappNotifications',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    await user.update(updates);

    // إرجاع البيانات المحدثة
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshToken;

    logger.info(`User profile updated: ${user.email}`);

    return userResponse;
  }

  /**
   * طلب إعادة تعيين كلمة المرور
   */
  async forgotPassword(email) {
    const User = getModel('User');

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // لا نكشف عن عدم وجود المستخدم لأسباب أمنية
      return { message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين' };
    }

    // إنشاء token لإعادة التعيين
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 دقائق

    await user.update({
      resetPasswordToken,
      resetPasswordExpire,
    });

    // TODO: إرسال البريد الإلكتروني
    logger.info(`Password reset requested for: ${email}`);

    return {
      message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين',
      resetToken, // في الإنتاج، يجب إرسال هذا عبر البريد الإلكتروني فقط
    };
  }

  /**
   * إعادة تعيين كلمة المرور
   */
  async resetPassword(resetToken, newPassword) {
    const User = getModel('User');

    // تشفير الـ token للمقارنة
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken,
      },
    });

    if (!user || user.resetPasswordExpire < new Date()) {
      throw new AppError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية', 400);
    }

    // تحديث كلمة المرور
    await user.update({
      password: newPassword, // سيتم تشفيرها تلقائياً في hook
      resetPasswordToken: null,
      resetPasswordExpire: null,
      refreshToken: null, // إلغاء جميع الجلسات
    });

    logger.info(`Password reset successful for: ${user.email}`);

    return { message: 'تم إعادة تعيين كلمة المرور بنجاح' };
  }

  /**
   * تغيير كلمة المرور
   */
  async changePassword(userId, currentPassword, newPassword) {
    const User = getModel('User');

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    // التحقق من كلمة المرور الحالية
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('كلمة المرور الحالية غير صحيحة', 401);
    }

    // تحديث كلمة المرور
    await user.update({
      password: newPassword, // سيتم تشفيرها تلقائياً في hook
      refreshToken: null, // إلغاء جميع الجلسات
    });

    logger.info(`Password changed for: ${user.email}`);

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }
}

export default new AuthService();
