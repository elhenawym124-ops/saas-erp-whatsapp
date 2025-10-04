import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param } from 'express-validator';

const router = express.Router();

/**
 * Auth Routes
 * مسارات المصادقة والتسجيل
 */

// Validation Rules
const registerValidation = [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'),
  body('phone')
    .matches(/^\+?\d{10,20}$/)
    .withMessage('رقم الهاتف غير صحيح (يجب أن يكون 10-20 رقم)'),
  body('organizationData.name').notEmpty().withMessage('اسم المؤسسة مطلوب'),
  body('organizationData.domain').notEmpty().withMessage('نطاق المؤسسة مطلوب'),
  body('personalInfo.firstName').notEmpty().withMessage('الاسم الأول مطلوب'),
  body('personalInfo.lastName').notEmpty().withMessage('اسم العائلة مطلوب'),
];

const loginValidation = [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
];

const resetPasswordValidation = [
  param('token').notEmpty().withMessage('Token مطلوب'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'),
];

// Public Routes
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, validateRequest, resetPassword);

// Protected Routes
router.use(protect); // جميع المسارات التالية محمية

router.post('/logout', logout);
router.post('/change-password', changePasswordValidation, validateRequest, changePassword);
router.get('/me', getMe);
router.put('/me', updateMe);

export default router;
