import { getModel } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

/**
 * ✅ Template Service
 * خدمة إدارة قوالب الرسائل
 */

export const templateService = {
  /**
   * جلب القوالب مع فلترة
   */
  async getTemplates(organizationId, filters = {}) {
    try {
      const MessageTemplate = getModel('MessageTemplate');

      const where = { organizationId };

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { content: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      const templates = await MessageTemplate.findAll({
        where,
        order: [
          ['usageCount', 'DESC'],
          ['name', 'ASC'],
        ],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      });

      logger.info(`✅ Templates fetched: ${templates.length} for org ${organizationId}`);
      return templates;
    } catch (error) {
      logger.error('❌ Error fetching templates:', error);
      throw error;
    }
  },

  /**
   * إنشاء قالب جديد
   */
  async createTemplate(data) {
    try {
      const MessageTemplate = getModel('MessageTemplate');
      const template = await MessageTemplate.create(data);

      logger.info(`✅ Template created: ${template.id} - ${template.name}`);
      return template;
    } catch (error) {
      logger.error('❌ Error creating template:', error);
      throw error;
    }
  },

  /**
   * تحديث قالب
   */
  async updateTemplate(id, data) {
    try {
      const MessageTemplate = getModel('MessageTemplate');
      const template = await MessageTemplate.findByPk(id);

      if (!template) {
        throw new Error('Template not found');
      }

      const updatedTemplate = await template.update(data);
      logger.info(`✅ Template updated: ${id}`);
      return updatedTemplate;
    } catch (error) {
      logger.error('❌ Error updating template:', error);
      throw error;
    }
  },

  /**
   * زيادة عداد الاستخدام
   */
  async incrementUsage(id) {
    try {
      const MessageTemplate = getModel('MessageTemplate');
      const template = await MessageTemplate.findByPk(id);

      if (template) {
        await template.increment('usageCount');
        logger.info(`✅ Template usage incremented: ${id}`);
      }
    } catch (error) {
      logger.error('❌ Error incrementing template usage:', error);
      throw error;
    }
  },

  /**
   * حذف قالب
   */
  async deleteTemplate(id) {
    try {
      const MessageTemplate = getModel('MessageTemplate');
      const template = await MessageTemplate.findByPk(id);

      if (!template) {
        throw new Error('Template not found');
      }

      await template.destroy();
      logger.info(`✅ Template deleted: ${id}`);
    } catch (error) {
      logger.error('❌ Error deleting template:', error);
      throw error;
    }
  },

  /**
   * البحث بالـ shortcut
   */
  async getTemplateByShortcut(organizationId, shortcut) {
    try {
      const MessageTemplate = getModel('MessageTemplate');

      const template = await MessageTemplate.findOne({
        where: {
          organizationId,
          shortcut,
          isActive: true,
        },
      });

      if (template) {
        logger.info(`✅ Template found by shortcut: ${shortcut}`);
      }

      return template;
    } catch (error) {
      logger.error('❌ Error finding template by shortcut:', error);
      throw error;
    }
  },
};

export default templateService;
