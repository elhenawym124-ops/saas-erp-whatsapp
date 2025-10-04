import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidUser,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getModel } from '../models/index.js';
import logger from '../config/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { getRedisClient, setCache, getCache, deleteCache } from '../config/redis.js';
import websocketService from './websocketService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * خدمة WhatsApp
 * إدارة الاتصال بـ WhatsApp باستخدام Baileys
 */
class WhatsAppService {
  constructor() {
    this.sessions = new Map(); // تخزين الجلسات النشطة
    this.qrCodes = new Map(); // تخزين QR Codes
    this.initialized = false;
    this.cleanupInterval = null; // مؤقت تنظيف الجلسات
    this.failedMessages = new Map(); // قائمة الرسائل الفاشلة
    this.retryInterval = null; // مؤقت إعادة المحاولة
    this.redisClient = null; // ✅ عميل Redis
    this.authDir = path.join(__dirname, '../../sessions'); // مجلد حفظ بيانات المصادقة

    // بدء تنظيف الجلسات المنتهية الصلاحية
    this.startCleanupTimer();
    // بدء معالجة الرسائل الفاشلة
    this.startRetryTimer();
    // ✅ تهيئة Redis
    this.initializeRedis();
  }

  /**
   * استعادة الجلسات النشطة عند بدء السيرفر
   */
  async restoreActiveSessions() {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('🔄 Restoring active WhatsApp sessions...');

      // ✅ أولاً: محاولة استرداد من Redis
      await this.restoreSessionsFromRedis();

      const WhatsAppSession = getModel('WhatsAppSession');

      // البحث عن الجلسات التي كانت متصلة قبل إعادة التشغيل
      const activeSessions = await WhatsAppSession.findAll({
        where: {
          isActive: true,
          status: ['connected', 'qr_ready'], // فقط الجلسات التي كانت نشطة
        },
      });

      logger.info(`Found ${activeSessions.length} sessions to restore`);

      // محاولة استعادة الجلسات التي لديها بيانات مصادقة محفوظة
      for (const session of activeSessions) {
        try {
          const sessionId = `${session.organizationId}_${session.sessionName}`;
          const authPath = path.join(this.authDir, sessionId);

          // تحقق من وجود ملفات المصادقة
          if (fs.existsSync(authPath) && fs.existsSync(path.join(authPath, 'creds.json'))) {
            logger.info(`🔄 Attempting to restore session: ${session.sessionName}`);

            // محاولة إعادة إنشاء الجلسة باستخدام البيانات المحفوظة
            try {
              await this.createSession(
                session.organizationId.toString(),
                session.sessionName,
                true
              );
              logger.info(`✅ Successfully restored session: ${session.sessionName}`);
            } catch (restoreError) {
              logger.warn(
                `⚠️ Failed to restore session ${session.sessionName}, marking as disconnected:`,
                restoreError.message
              );
              await session.update({
                status: 'disconnected',
                lastDisconnected: new Date(),
              });
            }
          } else {
            logger.info(
              `📝 No auth data found for session ${session.sessionName}, marking as disconnected`
            );
            await session.update({
              status: 'disconnected',
              lastDisconnected: new Date(),
            });
          }
        } catch (error) {
          logger.error(`Failed to process session ${session.sessionName}:`, error.message);
        }
      }

      // تحديث الجلسات الأخرى إلى disconnected
      await WhatsAppSession.update(
        {
          status: 'disconnected',
          lastDisconnected: new Date(),
        },
        {
          where: {
            isActive: true,
            status: ['connecting', 'qr_generating', 'timeout'],
          },
        }
      );

      this.initialized = true;
      logger.info('✅ Session restoration completed');
    } catch (error) {
      logger.error('Error restoring sessions:', error);
    }
  }

  /**
   * إنشاء جلسة WhatsApp جديدة أو استعادة جلسة موجودة
   */
  async createSession(organizationId, sessionName = 'default', isRestore = false) {
    const sessionId = `${organizationId}_${sessionName}`;

    try {
      if (isRestore) {
        logger.info(`🔄 Restoring WhatsApp session: ${sessionId}`);
      } else {
        logger.info(`🔄 Creating WhatsApp session: ${sessionId}`);
      }

      // التحقق من وجود جلسة نشطة
      if (this.sessions.has(sessionId)) {
        const existingSession = this.sessions.get(sessionId);
        if (existingSession.status === 'connected') {
          if (isRestore) {
            logger.info(`Session ${sessionId} already restored and connected`);
            return sessionId;
          } else {
            logger.warn(`Session ${sessionId} already exists and is connected`);
            throw new AppError('الجلسة موجودة بالفعل ومتصلة', 400);
          }
        } else {
          // إذا كانت الجلسة موجودة لكن غير متصلة، احذفها وأنشئ جديدة
          logger.info(`Replacing existing disconnected session: ${sessionId}`);
          await this.cleanupSession(sessionId);
        }
      }

      // مسار حفظ بيانات المصادقة
      const authPath = path.join(__dirname, '../../sessions', sessionId);
      if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
      }

      // تحميل حالة المصادقة
      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      // الحصول على أحدث إصدار من Baileys
      let version;
      try {
        const versionInfo = await fetchLatestBaileysVersion();
        version = versionInfo.version;
        logger.info(`Using Baileys version: ${JSON.stringify(version)}`);
      } catch (versionError) {
        logger.warn('Failed to fetch latest Baileys version, using default:', versionError.message);
        version = undefined; // استخدام الإصدار الافتراضي
      }

      // إنشاء Socket مع إعدادات مستقرة
      const sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false,
        logger,
        browser: ['Chrome', 'Desktop', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        // إعدادات أساسية للاستقرار
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: false,
        // إعدادات الأمان
        getMessage: async (key) => {
          return { conversation: 'Message not available' };
        },
      });

      // حفظ الجلسة مع معلومات إضافية
      const sessionData = {
        sock,
        organizationId,
        sessionName,
        status: 'connecting',
        createdAt: new Date(),
        lastActivity: new Date(),
        reconnectAttempts: 0,
      };

      this.sessions.set(sessionId, sessionData);

      // ✅ حفظ في Redis
      await this.saveSessionToRedis(sessionId, {
        status: sessionData.status,
        organizationId: sessionData.organizationId,
        sessionName: sessionData.sessionName,
        createdAt: sessionData.createdAt,
        lastActivity: sessionData.lastActivity,
        reconnectAttempts: sessionData.reconnectAttempts,
      });

      // معالجة الأحداث
      this.setupEventHandlers(sock, sessionId, saveCreds);

      logger.info(`✅ WhatsApp session created successfully: ${sessionId}`);
      return sessionId;
    } catch (error) {
      logger.error(`❌ Error creating WhatsApp session ${sessionId}:`, error);

      // تنظيف في حالة الفشل
      if (this.sessions.has(sessionId)) {
        await this.cleanupSession(sessionId);
      }

      // إعادة رمي الخطأ مع معلومات إضافية
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(`فشل في إنشاء جلسة WhatsApp: ${error.message}`, 500);
      }
    }
  }

  /**
   * إعداد معالجات الأحداث
   */
  setupEventHandlers(sock, sessionId, saveCreds) {
    // تحديث بيانات المصادقة
    sock.ev.on('creds.update', saveCreds);

    // تحديث الاتصال
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR Code
      if (qr) {
        await this.handleQRCode(sessionId, qr);
      }

      // الاتصال
      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
            : true; // ✅ تفعيل إعادة الاتصال التلقائي

        const errorMsg = lastDisconnect?.error?.message || 'Unknown error';
        const statusCode =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output.statusCode
            : 'unknown';

        logger.info(
          `Connection closed. Error: ${errorMsg}, Status: ${statusCode}, Reconnect: ${shouldReconnect}`
        );
        logger.info(`❌ WhatsApp connection closed for ${sessionId}: ${errorMsg}`);

        if (shouldReconnect) {
          // تحديث عداد المحاولات
          const session = this.sessions.get(sessionId);
          const attempts = (session?.reconnectAttempts || 0) + 1;
          const maxAttempts = 5;

          if (attempts <= maxAttempts) {
            const delay = Math.min(3000 * attempts, 30000); // تأخير متزايد حتى 30 ثانية
            logger.info(
              `Attempting reconnection ${attempts}/${maxAttempts} for ${sessionId} in ${delay}ms`
            );

            setTimeout(async () => {
              try {
                const sessionData = this.sessions.get(sessionId);
                if (sessionData) {
                  // تحديث عداد المحاولات
                  sessionData.reconnectAttempts = attempts;

                  const [orgId, name] = sessionId.split('_');
                  await this.reconnectSession(orgId, name);
                }
              } catch (error) {
                logger.error(`Reconnection attempt ${attempts} failed for ${sessionId}:`, error);
              }
            }, delay);
          } else {
            logger.error(
              `Max reconnection attempts reached for ${sessionId}. Cleaning up session.`
            );
            await this.cleanupSession(sessionId);
          }
        } else {
          // تسجيل الخروج أو خطأ دائم
          logger.info(`Session ${sessionId} logged out or permanent error. Cleaning up.`);
          await this.cleanupSession(sessionId);
        }
      } else if (connection === 'open') {
        logger.info(`WhatsApp session ${sessionId} connected`);
        logger.info(`✅ WhatsApp session ${sessionId} connected!`);

        // حفظ بيانات الجلسة في قاعدة البيانات للاستعادة لاحقاً
        const sessionData = this.sessions.get(sessionId);
        if (sessionData) {
          sessionData.phoneNumber = sock.user?.id?.split(':')[0];
          sessionData.lastConnected = new Date();
          sessionData.reconnectAttempts = 0; // إعادة تعيين عداد المحاولات

          // حفظ معلومات إضافية للاستعادة
          const persistentData = {
            phoneNumber: sessionData.phoneNumber,
            lastConnected: sessionData.lastConnected,
            userInfo: {
              platform: sock.user?.platform || 'unknown',
              name: sock.user?.name || 'WhatsApp',
              id: sock.user?.id,
            },
            authPath: path.join(this.authDir, sessionId),
          };

          await this.updateSessionStatus(sessionId, 'connected', persistentData);
        } else {
          await this.updateSessionStatus(sessionId, 'connected');
        }

        // ✅ إرسال تحديث WebSocket
        websocketService.broadcastSessionStatus(sessionId, 'connected', {
          phoneNumber: sock.user?.id?.split(':')[0],
          deviceInfo: {
            platform: sock.user?.platform || 'unknown',
            name: sock.user?.name || 'WhatsApp',
          },
        });

        // ✅ حذف QR Code بعد الاتصال الناجح
        this.qrCodes.delete(sessionId);
        await this.syncContacts(sessionId);
      }
    });

    // الرسائل الواردة
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const msg of messages) {
          await this.handleIncomingMessage(sessionId, msg);
        }
      }
    });

    // تحديث الرسائل
    sock.ev.on('messages.update', async (updates) => {
      for (const update of updates) {
        await this.handleMessageUpdate(sessionId, update);
      }
    });

    // ✅ معالجة LID mapping الجديد
    sock.ev.on('lid-mapping.update', async (mapping) => {
      try {
        logger.info(`📱 LID mapping update for session ${sessionId}:`, mapping);
        // يمكن حفظ mapping في قاعدة البيانات للاستخدام المستقبلي
        await this.handleLIDMapping(sessionId, mapping);
      } catch (error) {
        logger.error('Error handling LID mapping:', error);
      }
    });
  }

  /**
   * معالجة QR Code
   */
  async handleQRCode(sessionId, qr) {
    try {
      // توليد QR Code كـ Data URL
      const qrDataUrl = await QRCode.toDataURL(qr);

      // ✅ حفظ في Memory فقط (لا نحفظ في قاعدة البيانات)
      this.qrCodes.set(sessionId, qrDataUrl);

      // ✅ حفظ الحالة فقط في قاعدة البيانات
      const [organizationId, sessionName] = sessionId.split('_');
      const WhatsAppSession = getModel('WhatsAppSession');
      await WhatsAppSession.update(
        {
          status: 'qr_ready',
          updatedAt: new Date(),
        },
        {
          where: {
            organizationId,
            sessionName,
          },
        }
      );

      // ✅ إرسال QR Code عبر WebSocket
      websocketService.broadcastQRCode(sessionId, qrDataUrl);

      logger.info(`✅ QR Code generated for session ${sessionId}`);
      logger.info(`✅ QR Code ready for session: ${sessionId}`);
    } catch (error) {
      logger.error('Error handling QR code:', error);
      console.error('❌ QR Code error:', error.message);
    }
  }

  /**
   * إعادة الاتصال للجلسة
   */
  async reconnectSession(organizationId, sessionName) {
    try {
      const sessionId = `${organizationId}_${sessionName}`;
      logger.info(`🔄 Attempting to reconnect session: ${sessionId}`);

      // حذف الجلسة القديمة من الذاكرة
      this.sessions.delete(sessionId);
      this.qrCodes.delete(sessionId);

      // إنشاء جلسة جديدة
      await this.createSession(organizationId, sessionName);

      logger.info(`✅ Session reconnected successfully: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to reconnect session ${organizationId}_${sessionName}:`, error);
      return false;
    }
  }

  /**
   * تنظيف الجلسة
   */
  async cleanupSession(sessionId) {
    try {
      logger.info(`🧹 Cleaning up session: ${sessionId}`);

      // ✅ حذف من Memory
      this.sessions.delete(sessionId);
      this.qrCodes.delete(sessionId);

      // ✅ حذف من Redis
      await this.deleteSessionFromRedis(sessionId);

      // ✅ تحديث قاعدة البيانات
      const [organizationId, sessionName] = sessionId.split('_');
      const WhatsAppSession = getModel('WhatsAppSession');
      await WhatsAppSession.update(
        {
          status: 'disconnected',
          lastDisconnected: new Date(),
          connectionAttempts: 0, // إعادة تعيين عداد المحاولات
        },
        {
          where: {
            organizationId,
            sessionName,
          },
        }
      );

      // ✅ إرسال تحديث WebSocket
      websocketService.broadcastSessionStatus(sessionId, 'disconnected', {
        reason: 'cleanup',
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ Session cleaned up: ${sessionId}`);
    } catch (error) {
      logger.error('Error cleaning up session:', error);
    }
  }

  /**
   * تحديث حالة الجلسة مع بيانات إضافية للاستعادة
   */
  async updateSessionStatus(sessionId, status, persistentData = null) {
    try {
      const [organizationId, sessionName] = sessionId.split('_');
      const session = this.sessions.get(sessionId);

      if (!session) {
        return;
      }

      // تحديث في الذاكرة
      session.status = status;

      // تحديث في قاعدة البيانات
      const sessionData = {
        status,
        lastActivity: new Date(),
      };

      // إضافة معلومات الجهاز إذا كان متصلاً
      if (status === 'connected' && session.sock.user) {
        sessionData.phoneNumber = session.sock.user.id.split(':')[0];
        sessionData.lastConnected = new Date();
        sessionData.deviceInfo = {
          platform: session.sock.user.platform || 'unknown',
          deviceManufacturer: 'WhatsApp',
          deviceModel: 'Web',
        };
      }

      // إضافة البيانات الدائمة للاستعادة
      if (persistentData) {
        sessionData.sessionData = persistentData;
        if (persistentData.phoneNumber) {
          sessionData.phoneNumber = persistentData.phoneNumber;
        }
        if (persistentData.lastConnected) {
          sessionData.lastConnected = persistentData.lastConnected;
        }
      }

      const WhatsAppSession = getModel('WhatsAppSession');
      await WhatsAppSession.upsert({
        organizationId,
        sessionName,
        ...sessionData,
      });
    } catch (error) {
      logger.error('Error updating session status:', error);
    }
  }

  /**
   * معالجة الرسائل الواردة
   */
  async handleIncomingMessage(sessionId, message) {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const [organizationId] = sessionId.split('_');

        // التحقق من صحة الرسالة
        if (!message || !message.key || !message.key.id) {
          logger.warn('Invalid message received, skipping:', message);
          return;
        }

        // استخراج معلومات الرسالة مع دعم LID
        const messageData = {
          organizationId: parseInt(organizationId),
          sessionName: sessionId,
          messageId: message.key.id,
          fromNumber: message.key.remoteJid,
          toNumber: message.key.fromMe ? message.key.remoteJid : 'me',
          direction: message.key.fromMe ? 'outbound' : 'inbound',
          sentAt: new Date(message.messageTimestamp * 1000),
          status: 'received',
          // ✅ دعم LID الجديد في metadata
          metadata: {
            fromLid: message.key.remoteJidAlt || null,
            participantLid: message.key.participantAlt || null,
            addressingMode: this.detectAddressingMode(message.key),
          },
        };

        // تحديد نوع الرسالة والمحتوى
        if (message.message?.conversation) {
          messageData.messageType = 'text';
          messageData.content = { text: message.message.conversation };
        } else if (message.message?.extendedTextMessage) {
          messageData.messageType = 'text';
          messageData.content = { text: message.message.extendedTextMessage.text };
        } else if (message.message?.imageMessage) {
          messageData.messageType = 'image';
          messageData.content = {
            caption: message.message.imageMessage.caption || '',
            mimetype: message.message.imageMessage.mimetype,
          };
        } else if (message.message?.videoMessage) {
          messageData.messageType = 'video';
          messageData.content = {
            caption: message.message.videoMessage.caption || '',
            mimetype: message.message.videoMessage.mimetype,
          };
        } else if (message.message?.documentMessage) {
          messageData.messageType = 'document';
          messageData.content = {
            fileName: message.message.documentMessage.fileName,
            mimetype: message.message.documentMessage.mimetype,
          };
        } else if (message.message?.audioMessage) {
          messageData.messageType = 'audio';
          messageData.content = {
            mimetype: message.message.audioMessage.mimetype,
            duration: message.message.audioMessage.seconds,
          };
        } else {
          messageData.messageType = 'text';
          messageData.content = { raw: JSON.stringify(message.message) };
        }

        // ✅ إنشاء جهة اتصال جديدة إذا لم تكن موجودة (للرسائل الواردة فقط)
        if (messageData.direction === 'inbound') {
          await this.createContactIfNotExists(sessionId, messageData.fromNumber);
        }

        // ✅ حفظ الرسالة مع تجنب التكرار
        const WhatsAppMessage = getModel('WhatsAppMessage');
        const [savedMessage, created] = await WhatsAppMessage.findOrCreate({
          where: { messageId: message.key.id },
          defaults: messageData,
        });

        if (!created) {
          await savedMessage.update(messageData);
        }

        // ✅ إرسال الرسالة عبر WebSocket للرسائل الواردة فقط
        if (messageData.direction === 'inbound') {
          logger.info('📤 Broadcasting inbound message via WebSocket', {
            sessionId,
            messageId: messageData.messageId,
            fromNumber: messageData.fromNumber,
            messageType: messageData.type,
            organizationId: messageData.organizationId
          });

          websocketService.broadcastNewMessage(sessionId, {
            ...messageData,
            id: savedMessage.id,
          });

          logger.info('✅ Message broadcasted successfully', {
            sessionId,
            messageId: messageData.messageId
          });
        }

        // تحديث آخر نشاط للجلسة
        const session = this.sessions.get(sessionId);
        if (session) {
          session.lastActivity = new Date();
        }

        logger.info(
          `✅ Message processed successfully: ${messageData.messageId} (type: ${messageData.type})`
        );
        return; // نجح الحفظ، اخرج من الحلقة
      } catch (error) {
        retryCount++;
        logger.error(
          `❌ Error handling incoming message (attempt ${retryCount}/${maxRetries}):`,
          error
        );

        if (retryCount >= maxRetries) {
          // فشل نهائي، احفظ في قائمة الرسائل الفاشلة
          await this.saveFailedMessage(sessionId, message, error.message);
        } else {
          // انتظار قبل إعادة المحاولة
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
  }

  /**
   * معالجة تحديثات الرسائل
   */
  async handleMessageUpdate(sessionId, update) {
    try {
      const { key, update: msgUpdate } = update;

      // تحديث حالة الرسالة
      if (msgUpdate.status) {
        const WhatsAppMessage = getModel('WhatsAppMessage');
        await WhatsAppMessage.update(
          { status: msgUpdate.status },
          { where: { messageId: key.id } }
        );
      }
    } catch (error) {
      logger.error('Error handling message update:', error);
    }
  }

  /**
   * إنشاء جهة اتصال جديدة إذا لم تكن موجودة
   */
  async createContactIfNotExists(sessionId, jid) {
    try {
      const [organizationId] = sessionId.split('_');
      const WhatsAppContact = getModel('WhatsAppContact');

      // تنظيف رقم الهاتف
      const phoneNumber = jid
        .replace('@s.whatsapp.net', '')
        .replace('@lid', '')
        .replace('@g.us', '');

      // البحث عن جهة الاتصال
      const existingContact = await WhatsAppContact.findOne({
        where: {
          organizationId: parseInt(organizationId),
          phoneNumber,
        },
      });

      if (!existingContact) {
        // محاولة جلب اسم المجموعة الحقيقي إن كان jid مجموعة
        let displayName = phoneNumber;
        try {
          const session = this.sessions.get(sessionId);
          const isGroup = jid.includes('@g.us');
          if (session?.sock && isGroup && typeof session.sock.groupMetadata === 'function') {
            const meta = await session.sock.groupMetadata(jid);
            if (meta?.subject && typeof meta.subject === 'string') {
              displayName = meta.subject;
            }
          }
        } catch (e) {
          logger.warn(`⚠️ Unable to fetch group metadata for ${jid}: ${e?.message || e}`);
        }

        // إنشاء جهة اتصال جديدة
        const newContact = await WhatsAppContact.create({
          organizationId: parseInt(organizationId),
          sessionId,
          jid,
          name: displayName, // اسم المجموعة إن توفر، وإلا الرقم
          phoneNumber,
          isGroup: jid.includes('@g.us'),
          lastSeen: new Date(),
        });

        logger.info(`📱 Created new contact: ${phoneNumber} for session ${sessionId}`);

        // ✅ إرسال إشعار WebSocket بإنشاء جهة اتصال جديدة
        websocketService.broadcastNewContact(sessionId, {
          id: newContact.id,
          organizationId: newContact.organizationId,
          sessionId: newContact.sessionId,
          phoneNumber: newContact.phoneNumber,
          jid: newContact.jid,
          name: newContact.name,
          isGroup: newContact.isGroup,
          lastSeen: newContact.lastSeen,
          createdAt: newContact.createdAt,
          updatedAt: newContact.updatedAt,
        });

        return newContact;
      } else {
        // تحديث آخر ظهور + محاولة تحديث اسم المجموعة إن كان placeholder
        let updates = { lastSeen: new Date() };
        try {
          const isGroup = jid.includes('@g.us') || existingContact.isGroup;
          const hasPlaceholderName = !existingContact.name || existingContact.name === existingContact.phoneNumber;
          const session = this.sessions.get(sessionId);
          if (isGroup && hasPlaceholderName && session?.sock && typeof session.sock.groupMetadata === 'function') {
            const meta = await session.sock.groupMetadata(jid);
            if (meta?.subject && typeof meta.subject === 'string') {
              updates = { ...updates, name: meta.subject };
            }
          }
        } catch (e) {
          logger.warn(`⚠️ Unable to refresh group metadata for ${jid}: ${e?.message || e}`);
        }
        await existingContact.update(updates);
        return existingContact;
      }
    } catch (error) {
      logger.error('Error creating contact:', error);
      return null;
    }
  }

  /**
   * مزامنة جهات الاتصال
   */
  async syncContacts(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.sock) {
        return;
      }

      const [organizationId] = sessionId.split('_');
      // ✅ تعطيل مؤقت لـ getContacts لأنه غير متاح في Baileys الحديث
      logger.info(`📱 Contact sync disabled - using existing contacts from database`);
      return;
    } catch (error) {
      logger.error('Error syncing contacts:', error);
    }
  }

  /**
   * إرسال رسالة نصية مع دعم LID
   */
  async sendTextMessage(sessionId, to, text, userId = null, userName = null) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== 'connected') {
        throw new AppError('الجلسة غير متصلة', 400);
      }

      // ✅ دعم LID - التحقق من نوع المعرف
      let jid = to;
      if (!to.includes('@')) {
        // إذا كان رقم هاتف، تحويل إلى JID
        // للأرقام العادية، أضف @s.whatsapp.net
        jid = `${to}@s.whatsapp.net`;
      }

      const result = await session.sock.sendMessage(jid, { text });

      // حفظ الرسالة مع معلومات LID و User tracking
      const [organizationId] = sessionId.split('_');
      const WhatsAppMessage = getModel('WhatsAppMessage');
      const savedMessage = await WhatsAppMessage.create({
        organizationId: parseInt(organizationId),
        sessionName: sessionId,
        messageId: result.key.id,
        fromNumber: 'me',
        toNumber: jid,
        direction: 'outbound',
        messageType: 'text',
        content: { text },
        status: 'sent',
        sentAt: new Date(),
        // ✅ User tracking
        userId,
        repliedByName: userName,
        repliedAt: new Date(),
        // ✅ معلومات LID إضافية في metadata
        metadata: {
          fromLid: result.key.remoteJidAlt || null,
          participantLid: result.key.participantAlt || null,
          addressingMode: this.detectAddressingMode(result.key),
        },
      });

      // ✅ إرسال الرسالة الصادرة عبر WebSocket مع user info
      websocketService.broadcastNewMessage(sessionId, {
        id: savedMessage.id,
        organizationId: parseInt(organizationId),
        sessionName: sessionId,
        messageId: result.key.id,
        fromNumber: 'me',
        toNumber: jid,
        direction: 'outbound',
        messageType: 'text',
        content: { text },
        status: 'sent',
        sentAt: savedMessage.sentAt,
        userId,
        repliedByName: userName,
        repliedAt: savedMessage.repliedAt,
        metadata: savedMessage.metadata,
      });

      return result;
    } catch (error) {
      logger.error('Error sending text message:', error);
      throw error;
    }
  }

  /**
   * إرسال صورة
   */
  async sendImageMessage(sessionId, to, imageBuffer, caption = '') {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== 'connected') {
        throw new AppError('الجلسة غير متصلة', 400);
      }

      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      const result = await session.sock.sendMessage(jid, {
        image: imageBuffer,
        caption,
      });

      // حفظ الرسالة
      const [organizationId] = sessionId.split('_');
      const WhatsAppMessage = getModel('WhatsAppMessage');
      await WhatsAppMessage.create({
        organizationId: parseInt(organizationId),
        sessionName: sessionId,
        messageId: result.key.id,
        fromNumber: 'me',
        toNumber: jid,
        direction: 'outbound',
        messageType: 'image',
        content: { caption },
        status: 'sent',
        sentAt: new Date(),
      });

      return result;
    } catch (error) {
      logger.error('Error sending image message:', error);
      throw error;
    }
  }

  /**
   * إرسال ملف
   */
  async sendDocumentMessage(sessionId, to, documentBuffer, filename, mimetype) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== 'connected') {
        throw new AppError('الجلسة غير متصلة', 400);
      }

      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      const result = await session.sock.sendMessage(jid, {
        document: documentBuffer,
        fileName: filename,
        mimetype,
      });

      // حفظ الرسالة
      const [organizationId] = sessionId.split('_');
      const WhatsAppMessage = getModel('WhatsAppMessage');
      await WhatsAppMessage.create({
        organizationId: parseInt(organizationId),
        sessionName: sessionId,
        messageId: result.key.id,
        fromNumber: 'me',
        toNumber: jid,
        direction: 'outbound',
        messageType: 'document',
        content: { filename, mimeType: mimetype },
        status: 'sent',
        sentAt: new Date(),
      });

      return result;
    } catch (error) {
      logger.error('Error sending document message:', error);
      throw error;
    }
  }

  /**
   * إرسال فيديو
   */
  async sendVideoMessage(sessionId, to, videoBuffer, caption = '') {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== 'connected') {
        throw new AppError('الجلسة غير متصلة', 400);
      }

      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      const result = await session.sock.sendMessage(jid, {
        video: videoBuffer,
        caption,
      });

      // حفظ الرسالة
      const [organizationId] = sessionId.split('_');
      const WhatsAppMessage = getModel('WhatsAppMessage');
      await WhatsAppMessage.create({
        organizationId: parseInt(organizationId),
        sessionName: sessionId,
        messageId: result.key.id,
        fromNumber: 'me',
        toNumber: jid,
        direction: 'outbound',
        messageType: 'video',
        content: { caption },
        status: 'sent',
        sentAt: new Date(),
      });

      return result;
    } catch (error) {
      logger.error('Error sending video message:', error);
      throw error;
    }
  }

  /**
   * إرسال رسالة صوتية
   */
  async sendAudioMessage(sessionId, to, audioBuffer) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== 'connected') {
        throw new AppError('الجلسة غير متصلة', 400);
      }

      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      const result = await session.sock.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true, // Push to talk (voice message)
      });

      // حفظ الرسالة
      const [organizationId] = sessionId.split('_');
      const WhatsAppMessage = getModel('WhatsAppMessage');
      await WhatsAppMessage.create({
        organizationId: parseInt(organizationId),
        sessionName: sessionId,
        messageId: result.key.id,
        fromNumber: 'me',
        toNumber: jid,
        direction: 'outbound',
        messageType: 'audio',
        content: {},
        status: 'sent',
        sentAt: new Date(),
      });

      return result;
    } catch (error) {
      logger.error('Error sending audio message:', error);
      throw error;
    }
  }

  /**
   * الحصول على QR Code
   */
  async getQRCode(sessionId) {
    // محاولة الحصول من memory أولاً
    const qrFromMemory = this.qrCodes.get(sessionId);
    if (qrFromMemory) {
      return qrFromMemory;
    }

    // إذا لم يكن في memory، جلبه من Database
    try {
      const [organizationId, sessionName] = sessionId.split('_');
      const WhatsAppSession = getModel('WhatsAppSession');
      const session = await WhatsAppSession.findOne({
        where: {
          organizationId,
          sessionName,
        },
      });

      if (session && session.qrCode) {
        // حفظه في memory للمرات القادمة
        this.qrCodes.set(sessionId, session.qrCode);
        return session.qrCode;
      }

      return null;
    } catch (error) {
      logger.error('Error getting QR code from database:', error);
      return null;
    }
  }

  /**
   * الحصول على حالة الجلسة
   */
  getSessionStatus(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.status : 'disconnected';
  }

  /**
   * قطع الاتصال
   */
  async disconnect(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.sock) {
      await session.sock.logout();
      this.sessions.delete(sessionId);
      this.qrCodes.delete(sessionId);
    }
  }

  /**
   * بدء مؤقت تنظيف الجلسات
   */
  startCleanupTimer() {
    // تنظيف كل 30 دقيقة
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredSessions();
      },
      30 * 60 * 1000
    );

    logger.info('✅ Cleanup timer started - will run every 30 minutes');
  }

  /**
   * إيقاف مؤقت التنظيف
   */
  stopCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('🛑 Cleanup timer stopped');
    }
  }

  /**
   * تنظيف الجلسات المنتهية الصلاحية
   */
  async cleanupExpiredSessions() {
    try {
      logger.info('🧹 Starting cleanup of expired sessions...');

      const now = new Date();
      const expiredTime = 30 * 60 * 1000; // 30 دقيقة
      let cleanedCount = 0;

      // تنظيف QR Codes المنتهية الصلاحية
      for (const [sessionId, qrData] of this.qrCodes.entries()) {
        const session = this.sessions.get(sessionId);
        if (!session || session.status === 'connecting') {
          // إذا كانت الجلسة في حالة اتصال لأكثر من 30 دقيقة، احذف QR Code
          const sessionCreatedTime = session?.createdAt || new Date(now - expiredTime - 1);
          if (now - sessionCreatedTime > expiredTime) {
            this.qrCodes.delete(sessionId);
            logger.info(`🗑️ Removed expired QR code for session: ${sessionId}`);
            cleanedCount++;
          }
        }
      }

      // تنظيف الجلسات غير النشطة
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.status === 'connecting' || session.status === 'disconnected') {
          const lastActivity =
            session.lastActivity || session.createdAt || new Date(now - expiredTime - 1);
          if (now - lastActivity > expiredTime) {
            await this.cleanupSession(sessionId);
            logger.info(`🗑️ Cleaned up inactive session: ${sessionId}`);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info(`✅ Cleanup completed. Removed ${cleanedCount} expired items.`);
      } else {
        logger.info('✅ Cleanup completed. No expired items found.');
      }
    } catch (error) {
      logger.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * الحصول على إحصائيات الجلسات
   */
  getSessionStats() {
    const stats = {
      totalSessions: this.sessions.size,
      qrCodes: this.qrCodes.size,
      failedMessages: this.failedMessages.size,
      connected: 0,
      connecting: 0,
      disconnected: 0,
    };

    for (const session of this.sessions.values()) {
      if (session.status === 'connected') {
        stats.connected++;
      } else if (session.status === 'connecting') {
        stats.connecting++;
      } else {
        stats.disconnected++;
      }
    }

    return stats;
  }

  /**
   * حفظ رسالة فاشلة
   */
  async saveFailedMessage(sessionId, message, errorMessage) {
    try {
      const failedMessage = {
        sessionId,
        message,
        errorMessage,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3,
      };

      const messageId = message.key?.id || `failed_${Date.now()}`;
      this.failedMessages.set(messageId, failedMessage);

      logger.warn(`💾 Saved failed message: ${messageId} - ${errorMessage}`);
    } catch (error) {
      logger.error('Error saving failed message:', error);
    }
  }

  /**
   * بدء مؤقت إعادة المحاولة للرسائل الفاشلة
   */
  startRetryTimer() {
    // إعادة المحاولة كل 5 دقائق
    this.retryInterval = setInterval(
      () => {
        this.retryFailedMessages();
      },
      5 * 60 * 1000
    );

    logger.info('✅ Retry timer started - will run every 5 minutes');
  }

  /**
   * إيقاف مؤقت إعادة المحاولة
   */
  stopRetryTimer() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
      logger.info('🛑 Retry timer stopped');
    }
  }

  /**
   * إعادة محاولة الرسائل الفاشلة
   */
  async retryFailedMessages() {
    if (this.failedMessages.size === 0) {
      return;
    }

    logger.info(`🔄 Retrying ${this.failedMessages.size} failed messages...`);

    const messagesToRetry = Array.from(this.failedMessages.entries());
    let retriedCount = 0;
    let successCount = 0;

    for (const [messageId, failedMessage] of messagesToRetry) {
      try {
        // التحقق من أن الجلسة ما زالت متصلة
        const session = this.sessions.get(failedMessage.sessionId);
        if (!session || session.status !== 'connected') {
          continue; // تخطي إذا كانت الجلسة غير متصلة
        }

        // التحقق من عدد المحاولات
        if (failedMessage.retryCount >= failedMessage.maxRetries) {
          this.failedMessages.delete(messageId);
          logger.warn(`❌ Removing failed message after max retries: ${messageId}`);
          continue;
        }

        // إعادة محاولة معالجة الرسالة
        await this.handleIncomingMessage(failedMessage.sessionId, failedMessage.message);

        // نجحت المحاولة، احذف من قائمة الفاشلة
        this.failedMessages.delete(messageId);
        successCount++;
        logger.info(`✅ Successfully retried message: ${messageId}`);
      } catch (error) {
        // فشلت المحاولة، زيادة العداد
        failedMessage.retryCount++;
        failedMessage.lastRetry = new Date();
        logger.error(`❌ Retry failed for message ${messageId}: ${error.message}`);
      }

      retriedCount++;
    }

    if (retriedCount > 0) {
      logger.info(`✅ Retry completed: ${successCount}/${retriedCount} messages succeeded`);
    }
  }

  /**
   * تهيئة Redis
   */
  async initializeRedis() {
    try {
      this.redisClient = getRedisClient();
      if (this.redisClient) {
        logger.info('✅ Redis client initialized for WhatsApp service');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize Redis:', error);
    }
  }

  /**
   * حفظ بيانات الجلسة في Redis
   */
  async saveSessionToRedis(sessionId, sessionData) {
    try {
      if (!this.redisClient) {
        return false;
      }

      const key = `whatsapp:session:${sessionId}`;
      const data = {
        ...sessionData,
        timestamp: new Date().toISOString(),
      };

      await setCache(key, data, 24 * 60 * 60); // 24 ساعة
      logger.info(`💾 Session saved to Redis: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to save session to Redis: ${sessionId}`, error);
      return false;
    }
  }

  /**
   * استرداد بيانات الجلسة من Redis
   */
  async getSessionFromRedis(sessionId) {
    try {
      if (!this.redisClient) {
        return null;
      }

      const key = `whatsapp:session:${sessionId}`;
      const data = await getCache(key);

      if (data) {
        logger.info(`📥 Session loaded from Redis: ${sessionId}`);
      }
      return data;
    } catch (error) {
      logger.error(`❌ Failed to get session from Redis: ${sessionId}`, error);
      return null;
    }
  }

  /**
   * حذف بيانات الجلسة من Redis
   */
  async deleteSessionFromRedis(sessionId) {
    try {
      if (!this.redisClient) {
        return false;
      }

      const key = `whatsapp:session:${sessionId}`;
      await deleteCache(key);
      logger.info(`🗑️ Session deleted from Redis: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to delete session from Redis: ${sessionId}`, error);
      return false;
    }
  }

  /**
   * استرداد جميع الجلسات من Redis
   */
  async restoreSessionsFromRedis() {
    try {
      if (!this.redisClient) {
        logger.info('📭 Redis not available, skipping session restoration from cache');
        return;
      }

      // البحث عن جميع مفاتيح الجلسات
      const redisClient = getRedisClient();
      if (!redisClient || !redisClient.isOpen) {
        return;
      }

      const keys = await redisClient.keys('whatsapp:session:*');
      logger.info(`📥 Found ${keys.length} sessions in Redis cache`);

      for (const key of keys) {
        try {
          const sessionData = await getCache(key);
          if (sessionData) {
            const sessionId = key.replace('whatsapp:session:', '');
            logger.info(`📥 Restored session metadata from Redis: ${sessionId}`);

            // يمكن استخدام هذه البيانات لاحقاً في إعادة الاتصال
            // لكن لا نقوم بإعادة إنشاء الجلسة هنا لتجنب التداخل
          }
        } catch (error) {
          logger.error(`❌ Failed to restore session from Redis key ${key}:`, error);
        }
      }
    } catch (error) {
      logger.error('❌ Failed to restore sessions from Redis:', error);
    }
  }

  /**
   * معالجة LID mapping
   */
  async handleLIDMapping(sessionId, mapping) {
    try {
      const [organizationId] = sessionId.split('_');

      // ✅ حفظ mapping في Redis
      for (const [lid, pn] of Object.entries(mapping)) {
        logger.info(`📱 LID Mapping: ${lid} -> ${pn}`);

        if (this.redisClient) {
          const lidKey = `whatsapp:lid:${organizationId}:${lid}`;
          const pnKey = `whatsapp:pn:${organizationId}:${pn}`;

          await setCache(lidKey, pn, 7 * 24 * 60 * 60); // 7 أيام
          await setCache(pnKey, lid, 7 * 24 * 60 * 60); // 7 أيام
        }
      }
    } catch (error) {
      logger.error('Error handling LID mapping:', error);
    }
  }

  /**
   * تحديد نوع العنونة (LID أو PN)
   */
  detectAddressingMode(messageKey) {
    if (messageKey.remoteJidAlt || messageKey.participantAlt) {
      return 'LID';
    }
    return 'PN';
  }

  /**
   * الحصول على LID من PN
   */
  async getLIDForPN(sessionId, phoneNumber) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.sock) {
        return null;
      }

      // استخدام LID mapping store الجديد
      const lidMapping = session.sock.signalRepository?.lidMapping;
      if (lidMapping) {
        return lidMapping.getLIDForPN(phoneNumber);
      }
      return null;
    } catch (error) {
      logger.error('Error getting LID for PN:', error);
      return null;
    }
  }

  /**
   * الحصول على PN من LID
   */
  async getPNForLID(sessionId, lid) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.sock) {
        return null;
      }

      // استخدام LID mapping store الجديد
      const lidMapping = session.sock.signalRepository?.lidMapping;
      if (lidMapping) {
        return lidMapping.getPNForLID(lid);
      }
      return null;
    } catch (error) {
      logger.error('Error getting PN for LID:', error);
      return null;
    }
  }

  /**
   * تنظيف الموارد عند إغلاق الخدمة
   */
  async shutdown() {
    try {
      logger.info('🛑 Shutting down WhatsApp service...');

      // إيقاف المؤقتات
      this.stopCleanupTimer();
      this.stopRetryTimer();

      // قطع اتصال جميع الجلسات
      for (const sessionId of this.sessions.keys()) {
        await this.disconnect(sessionId);
      }

      // تنظيف البيانات
      this.sessions.clear();
      this.qrCodes.clear();
      this.failedMessages.clear();

      logger.info('✅ WhatsApp service shutdown completed');
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
    }
  }
}

export default new WhatsAppService();
