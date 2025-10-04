import authService from '../services/authService-mysql.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/helpers.js';

/**
 * Auth Controller
 * معالجات طلبات المصادقة
 */

/**
 * @desc    تسجيل مستخدم جديد
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json(successResponse(result, 'تم التسجيل بنجاح', 201));
});

/**
 * @desc    تسجيل الدخول
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  const result = await authService.login(email, password, ipAddress);

  // إرسال Access Token في Cookie
  res.cookie('accessToken', result.tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
  });

  // إرسال Refresh Token في Cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
  });

  res.json(
    successResponse(
      {
        user: result.user,
        tokens: result.tokens,
        message: 'تم تسجيل الدخول بنجاح - الـ tokens محفوظة في cookies',
      },
      'تم تسجيل الدخول بنجاح'
    )
  );
});

/**
 * @desc    تسجيل الخروج
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);

  // حذف جميع الـ cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.json(successResponse(null, 'تم تسجيل الخروج بنجاح'));
});

/**
 * @desc    تحديث Access Token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token مطلوب',
    });
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.json(successResponse(result, 'تم تحديث Access Token بنجاح'));
});

/**
 * @desc    طلب إعادة تعيين كلمة المرور
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.forgotPassword(email);

  res.json(successResponse(result, result.message));
});

/**
 * @desc    إعادة تعيين كلمة المرور
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const result = await authService.resetPassword(token, password);

  res.json(successResponse(result, result.message));
});

/**
 * @desc    تغيير كلمة المرور
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

  res.json(successResponse(result, result.message));
});

/**
 * @desc    الحصول على المستخدم الحالي
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.json(successResponse(user, 'تم الحصول على بيانات المستخدم بنجاح'));
});

/**
 * @desc    تحديث ملف المستخدم الحالي
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
export const updateMe = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateProfile(req.user.id, req.body);

  res.status(200).json(successResponse('تم تحديث البيانات بنجاح', updatedUser));
});
