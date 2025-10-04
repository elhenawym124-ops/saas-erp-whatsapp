import express from 'express';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  useTemplate,
  deleteTemplate,
  getTemplateByShortcut,
} from '../controllers/templateController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * ✅ Template Routes
 * جميع routes الخاصة بقوالب الرسائل
 */

// جميع الـ routes تحتاج authentication
router.use(protect);

// GET /api/v1/templates - جلب القوالب
router.get('/', getTemplates);

// POST /api/v1/templates - إنشاء قالب جديد
router.post('/', createTemplate);

// PUT /api/v1/templates/:id - تحديث قالب
router.put('/:id', updateTemplate);

// POST /api/v1/templates/:id/use - زيادة عداد الاستخدام
router.post('/:id/use', useTemplate);

// DELETE /api/v1/templates/:id - حذف قالب
router.delete('/:id', deleteTemplate);

// GET /api/v1/templates/shortcut/:shortcut - البحث بالاختصار
router.get('/shortcut/:shortcut', getTemplateByShortcut);

export default router;
