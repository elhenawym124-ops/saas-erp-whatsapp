import express from 'express';
import authRoutes from './auth.js';
import whatsappRoutes from './whatsapp.js';
import templateRoutes from './templates.js';
import healthRoutes from './health.js';

const router = express.Router();

/**
 * API Routes
 * تجميع جميع مسارات API
 *
 * ❌ تم حذف Routes التالية لأنها تستخدم Mongoose Models:
 * - attendance (Mongoose)
 * - deals (Mongoose)
 * - invoices (Mongoose)
 * - payroll (Mongoose)
 * - reports (Mongoose)
 * - super-admin (Mongoose)
 * - projects (Mongoose)
 * - tasks (Mongoose)
 * - customers (Mongoose)
 * - expenses (Mongoose)
 *
 * ✅ Routes المتاحة حالياً:
 * - auth (MySQL) - تسجيل الدخول والتسجيل
 * - whatsapp (MySQL) - إدارة WhatsApp
 * - health (MySQL) - فحص صحة النظام
 */

// Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes
router.use('/auth', authRoutes);

// WhatsApp Routes
router.use('/whatsapp', whatsappRoutes);

// Template Routes
router.use('/templates', templateRoutes);

// Health & Error Tracking Routes
router.use('/health', healthRoutes);

export default router;
