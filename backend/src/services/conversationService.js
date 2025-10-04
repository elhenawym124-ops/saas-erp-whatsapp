import { getModel } from '../models/index.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';

/**
 * ✅ Conversation Service
 * إدارة المحادثات مع معلومات الحالة والتعيين
 */

/**
 * جلب المحادثات مع filters
 */
export const getConversations = async (organizationId, filters = {}) => {
  try {
    const WhatsAppConversation = getModel('WhatsAppConversation');
    const User = getModel('User');
    const WhatsAppContact = getModel('WhatsAppContact');

    const whereClause = { organizationId };

    // تطبيق filters
    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.assignedTo) {
      whereClause.assignedTo = filters.assignedTo;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    if (filters.sessionName) {
      whereClause.sessionName = filters.sessionName;
    }

    // البحث في tags
    if (filters.tags && filters.tags.length > 0) {
      whereClause.tags = {
        [Op.contains]: filters.tags,
      };
    }

    const conversations = await WhatsAppConversation.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: WhatsAppContact,
          as: 'contact',
          attributes: ['id', 'phoneNumber', 'name', 'profilePicUrl'],
        },
      ],
      order: [['lastMessageAt', 'DESC']],
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });

    logger.info(`✅ Retrieved ${conversations.length} conversations for org ${organizationId}`);
    return conversations;
  } catch (error) {
    logger.error('❌ Error getting conversations:', error);
    throw error;
  }
};

/**
 * جلب محادثة واحدة
 */
export const getConversationById = async (id) => {
  try {
    const WhatsAppConversation = getModel('WhatsAppConversation');
    const User = getModel('User');
    const WhatsAppContact = getModel('WhatsAppContact');

    const conversation = await WhatsAppConversation.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'closedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: WhatsAppContact,
          as: 'contact',
          attributes: ['id', 'phoneNumber', 'name', 'profilePicUrl'],
        },
      ],
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    logger.info(`✅ Retrieved conversation ${id}`);
    return conversation;
  } catch (error) {
    logger.error(`❌ Error getting conversation ${id}:`, error);
    throw error;
  }
};

/**
 * إنشاء محادثة جديدة
 */
export const createConversation = async (data) => {
  try {
    const WhatsAppConversation = getModel('WhatsAppConversation');

    const conversation = await WhatsAppConversation.create({
      organizationId: data.organizationId,
      contactId: data.contactId,
      sessionName: data.sessionName,
      status: data.status || 'open',
      priority: data.priority || 'medium',
      assignedTo: data.assignedTo || null,
      tags: data.tags || [],
      lastMessageAt: new Date(),
    });

    logger.info(`✅ Created conversation ${conversation.id}`);
    return conversation;
  } catch (error) {
    logger.error('❌ Error creating conversation:', error);
    throw error;
  }
};

/**
 * تحديث حالة المحادثة
 */
export const updateConversationStatus = async (id, status, userId = null) => {
  try {
    const WhatsAppConversation = getModel('WhatsAppConversation');

    const updateData = { status };

    if (status === 'closed') {
      updateData.closedAt = new Date();
      updateData.closedBy = userId;
    }

    const [updated] = await WhatsAppConversation.update(updateData, {
      where: { id },
    });

    if (!updated) {
      throw new Error('Conversation not found');
    }

    logger.info(`✅ Updated conversation ${id} status to ${status}`);
    return await getConversationById(id);
  } catch (error) {
    logger.error(`❌ Error updating conversation ${id} status:`, error);
    throw error;
  }
};

/**
 * تعيين محادثة لمستخدم
 */
export const assignConversation = async (id, userId) => {
  try {
    const WhatsAppConversation = getModel('WhatsAppConversation');

    const [updated] = await WhatsAppConversation.update({ assignedTo: userId }, { where: { id } });

    if (!updated) {
      throw new Error('Conversation not found');
    }

    logger.info(`✅ Assigned conversation ${id} to user ${userId}`);
    return await getConversationById(id);
  } catch (error) {
    logger.error(`❌ Error assigning conversation ${id}:`, error);
    throw error;
  }
};

/**
 * إضافة tags للمحادثة
 */
export const addTags = async (id, tags) => {
  try {
    const WhatsAppConversation = getModel('WhatsAppConversation');

    const conversation = await WhatsAppConversation.findByPk(id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const currentTags = conversation.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])]; // إزالة التكرار

    await conversation.update({ tags: newTags });

    logger.info(`✅ Added tags to conversation ${id}`);
    return await getConversationById(id);
  } catch (error) {
    logger.error(`❌ Error adding tags to conversation ${id}:`, error);
    throw error;
  }
};

/**
 * إضافة ملاحظة للمحادثة
 */
export const addNote = async (conversationId, userId, noteText) => {
  try {
    const ConversationNote = getModel('ConversationNote');

    const note = await ConversationNote.create({
      conversationId,
      userId,
      note: noteText,
    });

    logger.info(`✅ Added note to conversation ${conversationId}`);
    return note;
  } catch (error) {
    logger.error(`❌ Error adding note to conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * جلب ملاحظات المحادثة
 */
export const getConversationNotes = async (conversationId) => {
  try {
    const ConversationNote = getModel('ConversationNote');
    const User = getModel('User');

    const notes = await ConversationNote.findAll({
      where: { conversationId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    logger.info(`✅ Retrieved ${notes.length} notes for conversation ${conversationId}`);
    return notes;
  } catch (error) {
    logger.error(`❌ Error getting notes for conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * إحصائيات المحادثة
 */
export const getConversationStats = async (conversationId) => {
  try {
    const WhatsAppMessage = getModel('WhatsAppMessage');
    const ConversationNote = getModel('ConversationNote');
    const conversation = await getConversationById(conversationId);

    // عدد الرسائل
    const totalMessages = await WhatsAppMessage.count({
      where: {
        organizationId: conversation.organizationId,
        [Op.or]: [
          { fromNumber: conversation.contact?.phoneNumber },
          { toNumber: conversation.contact?.phoneNumber },
        ],
      },
    });

    // عدد الملاحظات
    const totalNotes = await ConversationNote.count({
      where: { conversationId },
    });

    const stats = {
      totalMessages,
      totalNotes,
      status: conversation.status,
      priority: conversation.priority,
      assignedTo: conversation.assignedUser,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
    };

    logger.info(`✅ Retrieved stats for conversation ${conversationId}`);
    return stats;
  } catch (error) {
    logger.error(`❌ Error getting stats for conversation ${conversationId}:`, error);
    throw error;
  }
};

export default {
  getConversations,
  getConversationById,
  createConversation,
  updateConversationStatus,
  assignConversation,
  addTags,
  addNote,
  getConversationNotes,
  getConversationStats,
};
