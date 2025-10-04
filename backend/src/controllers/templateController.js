import templateService from '../services/templateService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import logger from '../config/logger.js';

/**
 * ✅ Template Controller
 * معالجة طلبات HTTP للقوالب
 */

/**
 * GET /api/v1/templates
 * جلب القوالب مع filters
 */
export const getTemplates = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;
  const filters = {
    category: req.query.category,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    search: req.query.search,
    limit: parseInt(req.query.limit) || 50,
    offset: parseInt(req.query.offset) || 0,
  };

  const templates = await templateService.getTemplates(organizationId, filters);

  res.json(
    successResponse({
      templates,
      total: templates.length,
      filters,
    })
  );
});

/**
 * POST /api/v1/templates
 * إنشاء قالب جديد
 */
export const createTemplate = asyncHandler(async (req, res) => {
  const { name, content, category, shortcut } = req.body;

  if (!name || !content) {
    return res.status(400).json(errorResponse('اسم القالب والمحتوى مطلوبان'));
  }

  const templateData = {
    organizationId: req.user.organization,
    name,
    content,
    category,
    shortcut,
    createdBy: req.user.id,
  };

  const template = await templateService.createTemplate(templateData);

  res.status(201).json(
    successResponse({
      template,
      message: 'تم إنشاء القالب بنجاح',
    })
  );
});

/**
 * PUT /api/v1/templates/:id
 * تحديث قالب
 */
export const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, content, category, shortcut, isActive } = req.body;

  const template = await templateService.updateTemplate(id, {
    name,
    content,
    category,
    shortcut,
    isActive,
  });

  res.json(
    successResponse({
      template,
      message: 'تم تحديث القالب بنجاح',
    })
  );
});

/**
 * POST /api/v1/templates/:id/use
 * زيادة عداد الاستخدام
 */
export const useTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await templateService.incrementUsage(id);

  res.json(
    successResponse({
      message: 'تم تسجيل استخدام القالب',
    })
  );
});

/**
 * DELETE /api/v1/templates/:id
 * حذف قالب
 */
export const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await templateService.deleteTemplate(id);

  res.json(
    successResponse({
      message: 'تم حذف القالب بنجاح',
    })
  );
});

/**
 * GET /api/v1/templates/shortcut/:shortcut
 * البحث بالـ shortcut
 */
export const getTemplateByShortcut = asyncHandler(async (req, res) => {
  const { shortcut } = req.params;
  const organizationId = req.user.organization;

  const template = await templateService.getTemplateByShortcut(organizationId, shortcut);

  if (!template) {
    return res.status(404).json(errorResponse('لم يتم العثور على قالب بهذا الاختصار'));
  }

  res.json(successResponse({ template }));
});
