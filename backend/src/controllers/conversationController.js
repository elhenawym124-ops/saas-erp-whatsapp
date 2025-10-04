import conversationService from '../services/conversationService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import logger from '../config/logger.js';

/**
 * ✅ Conversation Controller
 * معالجة طلبات HTTP للمحادثات
 */

/**
 * GET /api/v1/whatsapp/conversations
 * جلب المحادثات مع filters
 */
export const getConversations = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;
  const filters = {
    status: req.query.status,
    assignedTo: req.query.assignedTo,
    priority: req.query.priority,
    sessionName: req.query.sessionName,
    tags: req.query.tags ? req.query.tags.split(',') : undefined,
    limit: parseInt(req.query.limit) || 50,
    offset: parseInt(req.query.offset) || 0,
  };

  const conversations = await conversationService.getConversations(organizationId, filters);

  res.json(
    successResponse({
      conversations,
      total: conversations.length,
      filters,
    })
  );
});

/**
 * GET /api/v1/whatsapp/conversations/:id
 * جلب محادثة واحدة
 */
export const getConversationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const conversation = await conversationService.getConversationById(id);

  // التحقق من أن المحادثة تنتمي لنفس المنظمة
  if (conversation.organizationId !== req.user.organization) {
    return res.status(403).json(errorResponse('غير مصرح لك بالوصول لهذه المحادثة'));
  }

  res.json(successResponse({ conversation }));
});

/**
 * POST /api/v1/whatsapp/conversations/:id/assign
 * تعيين محادثة لمستخدم
 */
export const assignConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json(errorResponse('userId مطلوب'));
  }

  // التحقق من أن المحادثة تنتمي لنفس المنظمة
  const conversation = await conversationService.getConversationById(id);
  if (conversation.organizationId !== req.user.organization) {
    return res.status(403).json(errorResponse('غير مصرح لك بالوصول لهذه المحادثة'));
  }

  const updatedConversation = await conversationService.assignConversation(id, userId);

  logger.info(`✅ Conversation ${id} assigned to user ${userId} by ${req.user.id}`);
  res.json(successResponse({ conversation: updatedConversation }));
});

/**
 * PATCH /api/v1/whatsapp/conversations/:id/status
 * تحديث حالة المحادثة
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['open', 'closed', 'pending'].includes(status)) {
    return res.status(400).json(errorResponse('حالة غير صحيحة'));
  }

  // التحقق من أن المحادثة تنتمي لنفس المنظمة
  const conversation = await conversationService.getConversationById(id);
  if (conversation.organizationId !== req.user.organization) {
    return res.status(403).json(errorResponse('غير مصرح لك بالوصول لهذه المحادثة'));
  }

  const updatedConversation = await conversationService.updateConversationStatus(
    id,
    status,
    req.user.id
  );

  logger.info(`✅ Conversation ${id} status updated to ${status} by ${req.user.id}`);
  res.json(successResponse({ conversation: updatedConversation }));
});

/**
 * POST /api/v1/whatsapp/conversations/:id/tags
 * إضافة tags للمحادثة
 */
export const addTags = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tags } = req.body;

  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return res.status(400).json(errorResponse('tags مطلوبة ويجب أن تكون array'));
  }

  // التحقق من أن المحادثة تنتمي لنفس المنظمة
  const conversation = await conversationService.getConversationById(id);
  if (conversation.organizationId !== req.user.organization) {
    return res.status(403).json(errorResponse('غير مصرح لك بالوصول لهذه المحادثة'));
  }

  const updatedConversation = await conversationService.addTags(id, tags);

  logger.info(`✅ Tags added to conversation ${id} by ${req.user.id}`);
  res.json(successResponse({ conversation: updatedConversation }));
});

/**
 * POST /api/v1/whatsapp/conversations/:id/notes
 * إضافة ملاحظة للمحادثة
 */
export const addNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note || note.trim().length === 0) {
    return res.status(400).json(errorResponse('note مطلوبة'));
  }

  // التحقق من أن المحادثة تنتمي لنفس المنظمة
  const conversation = await conversationService.getConversationById(id);
  if (conversation.organizationId !== req.user.organization) {
    return res.status(403).json(errorResponse('غير مصرح لك بالوصول لهذه المحادثة'));
  }

  const createdNote = await conversationService.addNote(id, req.user.id, note);

  logger.info(`✅ Note added to conversation ${id} by ${req.user.id}`);
  res.json(successResponse({ note: createdNote }));
});

/**
 * GET /api/v1/whatsapp/conversations/:id/notes
 * جلب ملاحظات المحادثة
 */
export const getNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // التحقق من أن المحادثة تنتمي لنفس المنظمة
  const conversation = await conversationService.getConversationById(id);
  if (conversation.organizationId !== req.user.organization) {
    return res.status(403).json(errorResponse('غير مصرح لك بالوصول لهذه المحادثة'));
  }

  const notes = await conversationService.getConversationNotes(id);

  res.json(successResponse({ notes, total: notes.length }));
});

/**
 * GET /api/v1/whatsapp/conversations/:id/stats
 * جلب إحصائيات المحادثة
 */
export const getStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // التحقق من أن المحادثة تنتمي لنفس المنظمة
  const conversation = await conversationService.getConversationById(id);
  if (conversation.organizationId !== req.user.organization) {
    return res.status(403).json(errorResponse('غير مصرح لك بالوصول لهذه المحادثة'));
  }

  const stats = await conversationService.getConversationStats(id);

  res.json(successResponse({ stats }));
});

export default {
  getConversations,
  getConversationById,
  assignConversation,
  updateStatus,
  addTags,
  addNote,
  getNotes,
  getStats,
};
