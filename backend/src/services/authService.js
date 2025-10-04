import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getModel } from '../models/index.js';
import config from '../config/app.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * خدمة المصادقة
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

    // التحقق من عدم وجود المستخدم مسبقاً
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('البريد الإلكتروني مستخدم بالفعل', 400);
    }

    // التحقق من رقم الهاتف
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new AppError('رقم الهاتف مستخدم بالفعل', 400);
    }

    // إنشاء المؤسسة إذا كانت جديدة
    let organization;
    if (organizationData) {
      // التحقق من عدم وجود النطاق
      const existingOrg = await Organization.findOne({ domain: organizationData.domain });
      if (existingOrg) {
        throw new AppError('النطاق مستخدم بالفعل', 400);
      }

      organization = await Organization.create(organizationData);
    } else {
      throw new AppError('بيانات المؤسسة مطلوبة', 400);
    }

    // إنشاء المستخدم
    const user = await User.create({
      organization: organization._id,
      email,
      password,
      phone,
      personalInfo,
      workInfo,
      permissions: {
        role: 'super_admin', // أول مستخدم يكون Super Admin
        modulesAccess: {
          attendance: true,
          projects: true,
          tasks: true,
          team: true,
          customers: true,
          invoices: true,
          reports: true,
          settings: true,
        },
      },
    });

    // إنشاء Tokens
    const accessToken = this.generateToken(user._id, 'access');
    const refreshToken = this.generateToken(user._id, 'refresh');

    // حفظ Refresh Token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.permissions.role,
        organization: {
          id: organization._id,
          name: organization.name,
          domain: organization.domain,
        },
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * تسجيل الدخول
   */
  async login(email, password, ipAddress) {
    // البحث عن المستخدم
    const user = await User.findOne({ email, isActive: true })
      .select('+password +refreshToken')
      .populate('organization', 'name domain isActive');

    if (!user) {
      throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    // التحقق من حالة المؤسسة
    if (!user.organization || !user.organization.isActive) {
      throw new AppError('المؤسسة غير نشطة', 403);
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    // تحديث معلومات آخر تسجيل دخول
    user.lastLogin = new Date();
    user.lastLoginIP = ipAddress;

    // إنشاء Tokens جديدة
    const accessToken = this.generateToken(user._id, 'access');
    const refreshToken = this.generateToken(user._id, 'refresh');

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.personalInfo.avatar,
        role: user.permissions.role,
        modulesAccess: user.permissions.modulesAccess,
        organization: {
          id: user.organization._id,
          name: user.organization.name,
          domain: user.organization.domain,
        },
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * تسجيل الخروج
   */
  async logout(userId) {
    const user = await User.findById(userId).select('+refreshToken');
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    user.refreshToken = null;
    await user.save();

    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  /**
   * تحديث Access Token باستخدام Refresh Token
   */
  async refreshAccessToken(refreshToken) {
    // التحقق من Refresh Token
    const decoded = this.verifyToken(refreshToken, 'refresh');

    // البحث عن المستخدم
    const user = await User.findById(decoded.userId)
      .select('+refreshToken')
      .populate('organization', 'name domain');

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Refresh token غير صالح', 401);
    }

    // إنشاء Access Token جديد
    const accessToken = this.generateToken(user._id, 'access');

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.permissions.role,
      },
    };
  }

  /**
   * طلب إعادة تعيين كلمة المرور
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      // لا نكشف عن وجود المستخدم من عدمه
      return { message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين' };
    }

    // إنشاء Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 دقيقة
    await user.save();

    // TODO: إرسال البريد الإلكتروني مع الرابط
    // const resetUrl = `${config.server.frontendUrl}/reset-password/${resetToken}`;

    return {
      message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين',
      resetToken, // في الإنتاج، لا نرجع هذا - فقط للتطوير
    };
  }

  /**
   * إعادة تعيين كلمة المرور
   */
  async resetPassword(resetToken, newPassword) {
    // تشفير Token للمقارنة
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // البحث عن المستخدم
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      throw new AppError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية', 400);
    }

    // تحديث كلمة المرور
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  /**
   * تغيير كلمة المرور
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    // التحقق من كلمة المرور الحالية
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('كلمة المرور الحالية غير صحيحة', 401);
    }

    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  /**
   * الحصول على المستخدم الحالي
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId)
      .populate('organization', 'name domain logo')
      .populate('workInfo.manager', 'personalInfo.firstName personalInfo.lastName');

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404);
    }

    return user;
  }
}

export default new AuthService();
