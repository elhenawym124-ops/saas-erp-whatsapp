import express from 'express';
import {
  createSession,
  getQRCode,
  getSessionStatus,
  getSessions,
  disconnectSession,
  sendMessage,
  sendImageMessage,
  sendDocumentMessage,
  sendVideoMessage,
  sendAudioMessage,
  getMessages,
  getContacts,
  createContact,
  updateContact,
  getStats,
  deleteConversation,
  deleteChat,
} from '../controllers/whatsappController.js';
import conversationController from '../controllers/conversationController.js';
import { protect, authorize, checkModuleAccess } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';
import { uploadSingle } from '../middleware/upload.js';
import {
  whatsappLimiter,
  whatsappSessionLimiter,
  qrCodeLimiter,
  sensitiveOperationsLimiter,
} from '../middleware/rateLimit.js';
import websocketService from '../services/websocketService.js';

const router = express.Router();

/**
 * WhatsApp Routes
 * مسارات WhatsApp
 */

// Public WebSocket Stats Route (for testing)
router.get('/websocket/stats', (req, res) => {
  try {
    const stats = websocketService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get WebSocket stats',
      error: error.message,
    });
  }
});

// Public Test Route for creating session (for testing)
router.post('/test/session', async (req, res) => {
  try {
    const { createSession } = await import('../controllers/whatsappController.js');

    // Mock request object for testing
    req.user = {
      id: 'test-user-id',
      organization: 'test-org-id',
    };

    await createSession(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test session',
      error: error.message,
    });
  }
});

// Public Test Login Route (for testing)
router.post('/test/login', async (req, res) => {
  try {
    // Generate a test token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      {
        id: 'test-user-id',
        organization: 'test-org-id',
        email: 'test@test.com',
        type: 'access',
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@test.com',
          fullName: 'Test User',
        },
        accessToken: token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test token',
      error: error.message,
    });
  }
});

// Public Test QR Code Route (for testing)
router.get('/test/qr/:sessionName?', async (req, res) => {
  try {
    const { getQRCode } = await import('../controllers/whatsappController.js');

    // Mock request object for testing
    req.user = {
      id: 'test-user-id',
      organization: 'test-org-id',
    };

    // Use provided sessionName or default
    req.params.sessionName = req.params.sessionName || 'default';

    await getQRCode(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get test QR code',
      error: error.message,
    });
  }
});

// جميع المسارات الأخرى محمية وتحتاج صلاحية الوصول لموديول WhatsApp
router.use(protect);
router.use(checkModuleAccess('whatsapp'));

// Validation Rules
const createSessionValidation = [
  body('sessionName')
    .optional()
    .isString()
    .withMessage('اسم الجلسة يجب أن يكون نص')
    .isLength({ min: 3, max: 50 })
    .withMessage('اسم الجلسة يجب أن يكون بين 3 و 50 حرف'),
];

const sendMessageValidation = [
  body('to')
    .notEmpty()
    .withMessage('رقم المستقبل مطلوب')
    .matches(/^\d{10,20}$/)
    .withMessage('رقم الهاتف غير صحيح (يجب أن يكون من 10-20 رقم)'),
  body('text')
    .notEmpty()
    .withMessage('نص الرسالة مطلوب')
    .isLength({ min: 1, max: 4096 })
    .withMessage('نص الرسالة يجب أن يكون بين 1 و 4096 حرف'),
  body('sessionName').optional().isString().withMessage('اسم الجلسة يجب أن يكون نص'),
];

const createContactValidation = [
  body('phoneNumber')
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب')
    .isMobilePhone()
    .withMessage('رقم الهاتف غير صحيح'),
  body('name').optional().isString().withMessage('الاسم يجب أن يكون نص'),
  body('sessionName').optional().isString().withMessage('اسم الجلسة يجب أن يكون نص'),
];

const updateContactValidation = [
  param('id').isInt().withMessage('معرف جهة الاتصال غير صحيح'),
  body('name').optional().isString().withMessage('الاسم يجب أن يكون نص'),
  body('tags').optional().isArray().withMessage('العلامات يجب أن تكون مصفوفة'),
  body('notes').optional().isString().withMessage('الملاحظات يجب أن تكون نص'),
  body('linkedCustomer').optional().isInt().withMessage('معرف العميل غير صحيح'),
];

// Session Routes - ✅ مع Rate Limiting محسن
router.post(
  '/sessions',
  whatsappSessionLimiter,
  createSessionValidation,
  validateRequest,
  createSession
);
router.get('/sessions', getSessions);
router.get('/sessions/:sessionName/qr', qrCodeLimiter, getQRCode);
router.get('/sessions/:sessionName/status', getSessionStatus);
router.delete('/sessions/:sessionName', sensitiveOperationsLimiter, disconnectSession);

// Message Routes - ✅ مع Rate Limiting للرسائل
router.post('/messages/send', whatsappLimiter, sendMessageValidation, validateRequest, sendMessage);
router.post('/messages/send-image', whatsappLimiter, uploadSingle('image'), sendImageMessage);
router.post(
  '/messages/send-document',
  whatsappLimiter,
  uploadSingle('document'),
  sendDocumentMessage
);
router.post('/messages/send-video', whatsappLimiter, uploadSingle('video'), sendVideoMessage);
router.post('/messages/send-audio', whatsappLimiter, uploadSingle('audio'), sendAudioMessage);
router.get('/messages', getMessages);
router.delete('/messages/conversation', sensitiveOperationsLimiter, deleteConversation);
router.delete('/messages/chat', sensitiveOperationsLimiter, deleteChat);

// Contact Routes
router.get('/contacts', getContacts);
router.post('/contacts', createContactValidation, validateRequest, createContact);
router.put('/contacts/:id', updateContactValidation, validateRequest, updateContact);

// Stats Route
router.get('/stats', getStats);

// ✅ Conversation Management Routes
router.get('/conversations', conversationController.getConversations);
router.get('/conversations/:id', conversationController.getConversationById);
router.post('/conversations/:id/assign', conversationController.assignConversation);
router.patch('/conversations/:id/status', conversationController.updateStatus);
router.post('/conversations/:id/tags', conversationController.addTags);
router.post('/conversations/:id/notes', conversationController.addNote);
router.get('/conversations/:id/notes', conversationController.getNotes);
router.get('/conversations/:id/stats', conversationController.getStats);

export default router;
