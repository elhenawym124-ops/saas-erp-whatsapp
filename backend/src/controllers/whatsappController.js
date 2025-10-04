import whatsappService from '../services/whatsappService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/helpers.js';
import { getModel } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

/**
 * Helper: التحقق من وجود الجلسة وإعطاء رسالة خطأ واضحة
 */
const validateSession = (sessionId, organizationId, sessionName) => {
  const session = whatsappService.sessions.get(sessionId);
  if (!session) {
    // الحصول على قائمة الجلسات المتاحة لهذه المؤسسة
    const availableSessions = Array.from(whatsappService.sessions.keys())
      .filter((k) => k.startsWith(`${organizationId}_`))
      .map((k) => k.split('_')[1]);

    const errorMessage =
      availableSessions.length > 0
        ? `الجلسة "${sessionName}" غير موجودة. الجلسات المتاحة: ${availableSessions.join(', ')}`
        : 'لا توجد جلسات WhatsApp نشطة. يرجى إنشاء جلسة جديدة.';

    throw new AppError(errorMessage, 400);
  }
  return session;
};

/**
 * WhatsApp Controller
 * معالجات طلبات WhatsApp
 */

/**
 * @desc    إنشاء جلسة WhatsApp جديدة
 * @route   POST /api/v1/whatsapp/sessions
 * @access  Private
 */
export const createSession = asyncHandler(async (req, res) => {
  const { sessionName = 'default' } = req.body;
  const organizationId = req.user.organization;

  const sessionId = await whatsappService.createSession(organizationId, sessionName);

  res
    .status(201)
    .json(successResponse({ sessionId }, 'تم إنشاء الجلسة بنجاح. يرجى مسح QR Code', 201));
});

/**
 * @desc    الحصول على QR Code
 * @route   GET /api/v1/whatsapp/sessions/:sessionName/qr
 * @access  Private
 */
export const getQRCode = asyncHandler(async (req, res) => {
  const { sessionName = 'default' } = req.params;
  const organizationId = req.user.organization;
  const sessionId = `${organizationId}_${sessionName}`;

  const qrCode = await whatsappService.getQRCode(sessionId);

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      message: 'QR Code غير متاح. يرجى إنشاء جلسة جديدة',
    });
  }

  res.json(successResponse({ qrCode }, 'تم الحصول على QR Code بنجاح'));
});

/**
 * @desc    الحصول على حالة الجلسة
 * @route   GET /api/v1/whatsapp/sessions/:sessionName/status
 * @access  Private
 */
export const getSessionStatus = asyncHandler(async (req, res) => {
  const { sessionName = 'default' } = req.params;
  const organizationId = req.user.organization;
  const sessionId = `${organizationId}_${sessionName}`;

  const status = whatsappService.getSessionStatus(sessionId);

  // الحصول من قاعدة البيانات
  const WhatsAppSession = getModel('WhatsAppSession');
  const session = await WhatsAppSession.findOne({
    where: {
      organizationId,
      sessionName,
    },
  });

  res.json(
    successResponse(
      {
        status,
        session,
      },
      'تم الحصول على حالة الجلسة بنجاح'
    )
  );
});

/**
 * @desc    الحصول على جميع الجلسات
 * @route   GET /api/v1/whatsapp/sessions
 * @access  Private
 */
export const getSessions = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;

  logger.info('📋 getSessions called', {
    organizationId,
    userId: req.user.id,
    userEmail: req.user.email
  });

  const WhatsAppSession = getModel('WhatsAppSession');
  const sessions = await WhatsAppSession.findAll({
    where: { organizationId },
    order: [['updatedAt', 'DESC']],
  });

  logger.info('✅ Sessions retrieved from database', {
    organizationId,
    sessionsCount: sessions.length,
    sessionNames: sessions.map(s => s.sessionName)
  });

  // الحصول على حالة الجلسات من الذاكرة
  const sessionsWithStatus = sessions.map(session => {
    const sessionId = `${organizationId}_${session.sessionName}`;
    const liveStatus = whatsappService.getSessionStatus(sessionId);

    logger.info(`📱 Session status check: ${sessionId}`, {
      dbStatus: session.status,
      liveStatus,
      sessionName: session.sessionName
    });

    return {
      ...session.toJSON(),
      liveStatus,
      isConnected: liveStatus === 'connected'
    };
  });

  logger.info('📊 Final sessions response', {
    organizationId,
    totalSessions: sessionsWithStatus.length,
    connectedSessions: sessionsWithStatus.filter(s => s.isConnected).length
  });

  res.json(successResponse(sessionsWithStatus, 'تم الحصول على الجلسات بنجاح'));
});

/**
 * @desc    قطع اتصال الجلسة
 * @route   DELETE /api/v1/whatsapp/sessions/:sessionName
 * @access  Private
 */
export const disconnectSession = asyncHandler(async (req, res) => {
  const { sessionName = 'default' } = req.params;
  const organizationId = req.user.organization;
  const sessionId = `${organizationId}_${sessionName}`;

  await whatsappService.disconnect(sessionId);

  // تحديث في قاعدة البيانات
  const WhatsAppSession = getModel('WhatsAppSession');
  await WhatsAppSession.update(
    {
      status: 'disconnected',
      updatedAt: new Date(),
    },
    {
      where: {
        organizationId,
        sessionName,
      },
    }
  );

  res.json(successResponse(null, 'تم قطع الاتصال بنجاح'));
});

/**
 * @desc    إرسال رسالة نصية
 * @route   POST /api/v1/whatsapp/messages/send
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  let { to, text, sessionName = 'default' } = req.body;
  const organizationId = req.user.organization;
  const sessionId = `${organizationId}_${sessionName}`;

  logger.info('📤 Sending message', {
    to,
    sessionName,
    sessionId,
    organizationId,
    userId: req.user.id
  });

  // ✅ تنظيف رقم الهاتف - إزالة أي رموز غير رقمية
  to = to.replace(/\D/g, '');

  // ✅ التحقق من وجود الجلسة
  validateSession(sessionId, organizationId, sessionName);

  // ✅ إضافة معلومات المستخدم
  const userId = req.user.id;
  const userName = `${req.user.firstName} ${req.user.lastName}`;

  const result = await whatsappService.sendTextMessage(sessionId, to, text, userId, userName);

  logger.info('✅ Message sent successfully', {
    messageId: result.key.id,
    to,
    sessionId
  });

  // ✅ جلب الرسالة من قاعدة البيانات لإرجاعها كاملة
  const WhatsAppMessage = getModel('WhatsAppMessage');
  const message = await WhatsAppMessage.findOne({
    where: { messageId: result.key.id },
    order: [['createdAt', 'DESC']],
  });

  logger.info('📊 Message retrieved from database', {
    messageId: result.key.id,
    found: !!message
  });

  res.json(
    successResponse(
      {
        messageId: result.key.id,
        message, // ✅ إرجاع الـ message object كاملة
      },
      'تم إرسال الرسالة بنجاح'
    )
  );
});

/**
 * @desc    إرسال صورة
 * @route   POST /api/v1/whatsapp/messages/send-image
 * @access  Private
 */
export const sendImageMessage = asyncHandler(async (req, res) => {
  let { to, caption, sessionName = 'default' } = req.body;
  const organizationId = req.user.organization;
  const sessionId = `${organizationId}_${sessionName}`;

  // ✅ تنظيف رقم الهاتف
  to = to.replace(/\D/g, '');

  // ✅ التحقق من وجود الجلسة
  validateSession(sessionId, organizationId, sessionName);

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'يرجى إرفاق صورة',
    });
  }

  const result = await whatsappService.sendImageMessage(
    sessionId,
    to,
    req.file.buffer,
    caption || ''
  );

  // ✅ جلب الرسالة من قاعدة البيانات
  const WhatsAppMessage = getModel('WhatsAppMessage');
  const message = await WhatsAppMessage.findOne({
    where: { messageId: result.key.id },
    order: [['createdAt', 'DESC']],
  });

  res.json(
    successResponse(
      {
        messageId: result.key.id,
        message,
      },
      'تم إرسال الصورة بنجاح'
    )
  );
});

/**
 * @desc    إرسال ملف
 * @route   POST /api/v1/whatsapp/messages/send-document
 * @access  Private
 */
export const sendDocumentMessage = asyncHandler(async (req, res) => {
  let { to, sessionName = 'default' } = req.body;
  const organizationId = req.user.organization;
  const sessionId = `${organizationId}_${sessionName}`;

  // ✅ تنظيف رقم الهاتف
  to = to.replace(/\D/g, '');

  // ✅ التحقق من وجود الجلسة
  validateSession(sessionId, organizationId, sessionName);

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'يرجى إرفاق ملف',
    });
  }

  const result = await whatsappService.sendDocumentMessage(
    sessionId,
    to,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  // ✅ جلب الرسالة من قاعدة البيانات
  const WhatsAppMessage = getModel('WhatsAppMessage');
  const message = await WhatsAppMessage.findOne({
    where: { messageId: result.key.id },
    order: [['createdAt', 'DESC']],
  });

  res.json(
    successResponse(
      {
        messageId: result.key.id,
        message,
      },
      'تم إرسال الملف بنجاح'
    )
  );
});

/**
 * @desc    إرسال فيديو
 * @route   POST /api/v1/whatsapp/messages/send-video
 * @access  Private
 */
export const sendVideoMessage = asyncHandler(async (req, res) => {
  let { to, caption, sessionName = 'default' } = req.body;
  const organizationId = req.user.organization;
  const sessionId = `${organizationId}_${sessionName}`;

  // ✅ تنظيف رقم الهاتف
  to = to.replace(/\D/g, '');

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'يرجى إرفاق فيديو',
    });
  }

  const result = await whatsappService.sendVideoMessage(
    sessionId,
    to,
    req.file.buffer,
    caption || ''
  );

  // ✅ جلب الرسالة من قاعدة البيانات
  const WhatsAppMessage = getModel('WhatsAppMessage');
  const message = await WhatsAppMessage.findOne({
    where: { messageId: result.key.id },
    order: [['createdAt', 'DESC']],
  });

  res.json(
    successResponse(
      {
        messageId: result.key.id,
        message,
      },
      'تم إرسال الفيديو بنجاح'
    )
  );
});

/**
 * @desc    إرسال رسالة صوتية
 * @route   POST /api/v1/whatsapp/messages/send-audio
 * @access  Private
 */
export const sendAudioMessage = asyncHandler(async (req, res) => {
  let { to, sessionName = 'default' } = req.body;
  const organizationId = req.user.organization;
  const sessionId = `${organizationId}_${sessionName}`;

  // ✅ تنظيف رقم الهاتف
  to = to.replace(/\D/g, '');

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'يرجى إرفاق ملف صوتي',
    });
  }

  const result = await whatsappService.sendAudioMessage(sessionId, to, req.file.buffer);

  // ✅ جلب الرسالة من قاعدة البيانات
  const WhatsAppMessage = getModel('WhatsAppMessage');
  const message = await WhatsAppMessage.findOne({
    where: { messageId: result.key.id },
    order: [['createdAt', 'DESC']],
  });

  res.json(
    successResponse(
      {
        messageId: result.key.id,
        message,
      },
      'تم إرسال الرسالة الصوتية بنجاح'
    )
  );
});

/**
 * @desc    الحصول على الرسائل
 * @route   GET /api/v1/whatsapp/messages
 * @access  Private
 */
export const getMessages = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;
  const { sessionName, contact, direction, page = 1, limit = 50 } = req.query;

  logger.info('📥 getMessages called', {
    contact,
    sessionName,
    page,
    limit,
    direction,
    organizationId,
    userId: req.user.id
  });

  const WhatsAppMessage = getModel('WhatsAppMessage');
  const { Op } = await import('sequelize');

  // ✅ التحقق من صحة رقم الهاتف إذا تم تقديمه
  if (contact) {
    // إذا لم يكن JID (لا يحتوي على @)، يجب أن يكون رقم هاتف صحيح
    if (!contact.includes('@')) {
      // ✅ دعم أرقام المجموعات (حتى 20 رقم)
      const phoneRegex = /^\d{10,20}$/;
      if (!phoneRegex.test(contact)) {
        throw new AppError('رقم الهاتف يجب أن يكون من 10-20 رقم', 400);
      }
    }
  }

  // بناء شروط البحث
  const whereClause = { organizationId };

  if (sessionName) {
    whereClause.sessionName = sessionName;
  }

  if (contact) {
    // البحث عن الرقم بجميع الصيغ الممكنة
    // WhatsApp يستخدم صيغ مختلفة: @s.whatsapp.net, @lid, @g.us
    const contactWithoutSuffix = contact.replace(/@s\.whatsapp\.net|@lid|@g\.us/g, '');

    // جميع الصيغ الممكنة للرقم
    const contactVariations = [
      contact, // الرقم كما هو
      contactWithoutSuffix, // بدون أي suffix
      `${contactWithoutSuffix}@s.whatsapp.net`, // صيغة عادية
      `${contactWithoutSuffix}@lid`, // صيغة WhatsApp Business/Channels
      `${contactWithoutSuffix}@g.us`, // صيغة المجموعات
    ];

    // ✅ استخدام Op.or للبحث عن جميع الصيغ
    whereClause[Op.or] = [
      // البحث في from_number
      { fromNumber: { [Op.in]: contactVariations } },
      // البحث في to_number
      { toNumber: { [Op.in]: contactVariations } },
      // البحث في الرسائل الصادرة (from: me)
      { fromNumber: 'me', toNumber: { [Op.in]: contactVariations } },
    ];
  }

  if (direction) {
    // تحويل direction من frontend إلى database format
    if (direction === 'incoming') {
      whereClause.direction = 'inbound';
    } else if (direction === 'outgoing') {
      whereClause.direction = 'outbound';
    } else {
      whereClause.direction = direction;
    }
  }

  logger.info('🔍 Query whereClause', {
    contact,
    whereClauseKeys: Object.keys(whereClause),
    hasOrCondition: !!whereClause[Op.or],
    orConditionsCount: whereClause[Op.or] ? whereClause[Op.or].length : 0,
    direction: direction || 'all'
  });

  // ✅ جلب الرسائل مع user info
  const User = getModel('User');
  const messages = await WhatsAppMessage.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  // عدد إجمالي الرسائل
  const total = await WhatsAppMessage.count({ where: whereClause });

  logger.info('✅ Messages retrieved', {
    contact,
    messagesCount: messages.length,
    total,
    page,
    limit,
    firstMessage: messages.length > 0 ? {
      id: messages[0].id,
      messageId: messages[0].messageId,
      direction: messages[0].direction,
      fromNumber: messages[0].fromNumber,
      toNumber: messages[0].toNumber,
      content: typeof messages[0].content === 'string' ? messages[0].content.substring(0, 50) : 'non-string'
    } : null
  });

  // ✅ تحويل الرسائل إلى JSON plain objects
  const messagesData = messages.map(msg => msg.toJSON());

  logger.info('📤 Sending response', {
    messagesCount: messagesData.length,
    firstMessageKeys: messagesData.length > 0 ? Object.keys(messagesData[0]) : []
  });

  res.json(
    successResponse(
      {
        messages: messagesData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'تم الحصول على الرسائل بنجاح'
    )
  );
});

/**
 * @desc    الحصول على جهات الاتصال
 * @route   GET /api/v1/whatsapp/contacts
 * @access  Private
 */
export const getContacts = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;
  const { sessionName, search, page = 1, limit = 50 } = req.query;

  const WhatsAppContact = getModel('WhatsAppContact');
  const { Op } = await import('sequelize');

  // بناء شروط البحث
  const whereClause = { organizationId };

  if (sessionName) {
    whereClause.sessionId = `${organizationId}_${sessionName}`;
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { phoneNumber: { [Op.like]: `%${search}%` } },
    ];
  }

  // جلب جهات الاتصال مع pagination
  const contacts = await WhatsAppContact.findAll({
    where: whereClause,
    order: [['name', 'ASC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  // عدد إجمالي جهات الاتصال
  const total = await WhatsAppContact.count({
    where: whereClause,
  });

  res.json(
    successResponse(
      {
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'تم الحصول على جهات الاتصال بنجاح'
    )
  );
});

/**
 * @desc    إنشاء جهة اتصال جديدة
 * @route   POST /api/v1/whatsapp/contacts
 * @access  Private
 */
export const createContact = asyncHandler(async (req, res) => {
  const { phoneNumber, name, sessionName = '456456' } = req.body;
  const organizationId = req.user.organization;

  const WhatsAppContact = getModel('WhatsAppContact');

  // تنظيف رقم الهاتف
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '').replace(/^20/, '');
  const jid = `${cleanPhoneNumber}@s.whatsapp.net`;
  const sessionId = `${organizationId}_${sessionName}`;

  // التحقق من وجود جهة الاتصال
  const existingContact = await WhatsAppContact.findOne({
    where: {
      organizationId,
      phoneNumber: cleanPhoneNumber,
    },
  });

  if (existingContact) {
    return res.status(400).json({
      success: false,
      message: 'جهة الاتصال موجودة بالفعل',
      data: existingContact,
    });
  }

  // إنشاء جهة اتصال جديدة
  const newContact = await WhatsAppContact.create({
    organizationId,
    sessionId,
    jid,
    name: name || cleanPhoneNumber,
    phoneNumber: cleanPhoneNumber,
    isGroup: false,
    lastSeen: new Date(),
  });

  res.status(201).json(successResponse(newContact, 'تم إنشاء جهة الاتصال بنجاح'));
});

/**
 * @desc    تحديث جهة اتصال
 * @route   PUT /api/v1/whatsapp/contacts/:id
 * @access  Private
 */
export const updateContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, tags, notes, linkedCustomer } = req.body;

  const WhatsAppContact = getModel('WhatsAppContact');

  // البحث عن جهة الاتصال
  const contact = await WhatsAppContact.findByPk(id);

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'جهة الاتصال غير موجودة',
    });
  }

  // التحقق من المؤسسة
  if (contact.organizationId !== req.user.organization) {
    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية لتحديث هذه الجهة',
    });
  }

  // تحديث البيانات
  const updateData = {};
  if (name !== undefined) {
    updateData.name = name;
  }
  if (tags !== undefined) {
    updateData.tags = tags;
  }
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  if (linkedCustomer !== undefined) {
    updateData.relatedCustomerId = linkedCustomer;
  }

  await contact.update(updateData);

  res.json(successResponse(contact, 'تم تحديث جهة الاتصال بنجاح'));
});

/**
 * @desc    الحصول على إحصائيات WhatsApp
 * @route   GET /api/v1/whatsapp/stats
 * @access  Private
 */
export const getStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;

  const [totalSessions, activeSessions, totalMessages, totalContacts, messagesLast24h] =
    await Promise.all([
      // إحصائيات تجريبية للآن
      Promise.resolve(3), // totalSessions
      Promise.resolve(1), // activeSessions
      Promise.resolve(25), // totalMessages
      Promise.resolve(10), // totalContacts
      Promise.resolve(5), // messagesLast24h
    ]);

  res.json(
    successResponse(
      {
        totalSessions,
        activeSessions,
        totalMessages,
        totalContacts,
        messagesLast24h,
      },
      'تم الحصول على الإحصائيات بنجاح'
    )
  );
});

/**
 * @desc    حذف محادثة كاملة مع جهة اتصال
 * @route   DELETE /api/v1/whatsapp/messages/conversation
 * @access  Private
 */
export const deleteConversation = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.query;
  const organizationId = req.user.organization;

  // ✅ Validation
  if (!phoneNumber) {
    throw new AppError('رقم الهاتف مطلوب', 400);
  }

  // ✅ تنظيف رقم الهاتف
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');

  if (cleanedPhoneNumber.length < 10 || cleanedPhoneNumber.length > 15) {
    throw new AppError('رقم الهاتف غير صحيح', 400);
  }

  // ✅ حذف جميع الرسائل المرتبطة بهذا الرقم
  const WhatsAppMessage = getModel('WhatsAppMessage');

  const deletedCount = await WhatsAppMessage.destroy({
    where: {
      organizationId,
      [Op.or]: [{ fromNumber: cleanedPhoneNumber }, { toNumber: cleanedPhoneNumber }],
    },
  });

  res.json(
    successResponse(
      {
        deletedCount,
        phoneNumber: cleanedPhoneNumber,
      },
      `تم حذف ${deletedCount} رسالة بنجاح`
    )
  );
});

/**
 * @desc    حذف دردشة كاملة (رسائل + جهة اتصال)
 * @route   DELETE /api/v1/whatsapp/messages/chat
 * @access  Private
 */
export const deleteChat = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.query;
  const organizationId = req.user.organization;

  // ✅ Validation
  if (!phoneNumber) {
    throw new AppError('رقم الهاتف مطلوب', 400);
  }

  // ✅ تنظيف رقم الهاتف
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');

  if (cleanedPhoneNumber.length < 10 || cleanedPhoneNumber.length > 15) {
    throw new AppError('رقم الهاتف غير صحيح', 400);
  }

  // ✅ حذف جميع الرسائل المرتبطة بهذا الرقم
  const WhatsAppMessage = getModel('WhatsAppMessage');
  const WhatsAppContact = getModel('WhatsAppContact');

  const deletedMessagesCount = await WhatsAppMessage.destroy({
    where: {
      organizationId,
      [Op.or]: [{ fromNumber: cleanedPhoneNumber }, { toNumber: cleanedPhoneNumber }],
    },
  });

  // ✅ حذف جهة الاتصال
  const deletedContactsCount = await WhatsAppContact.destroy({
    where: {
      organizationId,
      phoneNumber: cleanedPhoneNumber,
    },
  });

  res.json(
    successResponse(
      {
        deletedMessagesCount,
        deletedContactsCount,
        phoneNumber: cleanedPhoneNumber,
      },
      `تم حذف الدردشة بنجاح (${deletedMessagesCount} رسالة، ${deletedContactsCount} جهة اتصال)`
    )
  );
});
