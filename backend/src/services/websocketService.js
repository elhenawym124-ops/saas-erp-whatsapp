import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import config from '../config/app.js';

/**
 * خدمة WebSocket للتحديثات الفورية
 * Real-time WebSocket service for instant updates
 */
class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // userId -> socket
    this.organizationRooms = new Map(); // organizationId -> Set of socketIds
    this.sessionRooms = new Map(); // sessionId -> Set of socketIds
    this.initialized = false;
  }

  /**
   * تهيئة خدمة WebSocket
   * Initialize WebSocket service
   */
  initialize(server) {
    try {
      this.io = new Server(server, {
        cors: {
          origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            'https://yourdomain.com',
          ],
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
      });

      // Middleware للمصادقة
      this.io.use(this.authenticateSocket.bind(this));

      // معالجة الاتصالات
      this.io.on('connection', this.handleConnection.bind(this));

      this.initialized = true;
      logger.info('✅ WebSocket service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize WebSocket service:', error);
      throw error;
    }
  }

  /**
   * مصادقة Socket
   * Authenticate socket connection
   */
  async authenticateSocket(socket, next) {
    try {
      // Try to get token from auth or headers first
      let token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      // If no token, try to get from cookies
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'accessToken') {
            token = value;
            break;
          }
        }
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret);

      // JWT token يحتوي على userId (من authService.generateToken)
      // نحتاج للحصول على معلومات المستخدم من قاعدة البيانات
      const { User } = (await import('../models/index.js')).default;
      const user = await User.findByPk(decoded.userId, {
        include: ['organization'],
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.organizationId = user.organizationId;
      socket.userRole = user.role;

      logger.info(
        `🔌 Socket authenticated for user: ${user.id}, org: ${user.organizationId}, role: ${user.role}`
      );
      next();
    } catch (error) {
      logger.error('❌ Socket authentication failed:', error.message);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * معالجة اتصال جديد
   * Handle new connection
   */
  handleConnection(socket) {
    try {
      const { userId, organizationId, userRole } = socket;

      logger.info(
        `🔌 New WebSocket connection: User ${userId}, Org ${organizationId}, Role ${userRole}`
      );

      // إضافة العميل للخريطة
      this.connectedClients.set(userId, socket);

      // إضافة للغرفة الخاصة بالمنظمة
      const orgRoom = `org_${organizationId}`;
      socket.join(orgRoom);

      if (!this.organizationRooms.has(organizationId)) {
        this.organizationRooms.set(organizationId, new Set());
      }
      this.organizationRooms.get(organizationId).add(socket.id);

      // إرسال حالة الاتصال
      socket.emit('connection_status', {
        status: 'connected',
        userId,
        organizationId,
        timestamp: new Date().toISOString(),
      });

      // معالجة الأحداث
      this.setupEventHandlers(socket);

      // معالجة قطع الاتصال
      socket.on('disconnect', () => this.handleDisconnection(socket));
    } catch (error) {
      logger.error('❌ Error handling WebSocket connection:', error);
      socket.disconnect();
    }
  }

  /**
   * إعداد معالجات الأحداث
   * Setup event handlers
   */
  setupEventHandlers(socket) {
    const { userId, organizationId } = socket;

    // الاشتراك في جلسة WhatsApp محددة
    socket.on('subscribe_session', (data) => {
      try {
        const { sessionName } = data;
        const sessionId = `${organizationId}_${sessionName}`;
        const sessionRoom = `session_${sessionId}`;

        socket.join(sessionRoom);

        if (!this.sessionRooms.has(sessionId)) {
          this.sessionRooms.set(sessionId, new Set());
        }
        this.sessionRooms.get(sessionId).add(socket.id);

        logger.info(`📱 User ${userId} subscribed to session: ${sessionId}`);

        socket.emit('session_subscribed', {
          sessionId,
          sessionName,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('❌ Error subscribing to session:', error);
        socket.emit('error', { message: 'Failed to subscribe to session' });
      }
    });

    // إلغاء الاشتراك في جلسة
    socket.on('unsubscribe_session', (data) => {
      try {
        const { sessionName } = data;
        const sessionId = `${organizationId}_${sessionName}`;
        const sessionRoom = `session_${sessionId}`;

        socket.leave(sessionRoom);

        if (this.sessionRooms.has(sessionId)) {
          this.sessionRooms.get(sessionId).delete(socket.id);
        }

        logger.info(`📱 User ${userId} unsubscribed from session: ${sessionId}`);

        socket.emit('session_unsubscribed', {
          sessionId,
          sessionName,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('❌ Error unsubscribing from session:', error);
      }
    });

    // طلب حالة الجلسات
    socket.on('get_sessions_status', () => {
      try {
        // سيتم تنفيذ هذا لاحقاً مع WhatsAppService
        socket.emit('sessions_status', {
          sessions: [],
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('❌ Error getting sessions status:', error);
      }
    });

    // Ping/Pong للحفاظ على الاتصال
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  }

  /**
   * معالجة قطع الاتصال
   * Handle disconnection
   */
  handleDisconnection(socket) {
    try {
      const { userId, organizationId } = socket;

      logger.info(`🔌 WebSocket disconnected: User ${userId}, Org ${organizationId}`);

      // إزالة من الخرائط
      this.connectedClients.delete(userId);

      if (this.organizationRooms.has(organizationId)) {
        this.organizationRooms.get(organizationId).delete(socket.id);
        if (this.organizationRooms.get(organizationId).size === 0) {
          this.organizationRooms.delete(organizationId);
        }
      }

      // إزالة من جميع غرف الجلسات
      for (const [sessionId, socketIds] of this.sessionRooms.entries()) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          this.sessionRooms.delete(sessionId);
        }
      }
    } catch (error) {
      logger.error('❌ Error handling WebSocket disconnection:', error);
    }
  }

  /**
   * إرسال تحديث حالة جلسة WhatsApp
   * Send WhatsApp session status update
   */
  broadcastSessionStatus(sessionId, status, data = {}) {
    try {
      if (!this.initialized) {
        return;
      }

      const sessionRoom = `session_${sessionId}`;
      const [organizationId] = sessionId.split('_');
      const orgRoom = `org_${organizationId}`;

      const updateData = {
        sessionId,
        status,
        timestamp: new Date().toISOString(),
        ...data,
      };

      // إرسال للمشتركين في الجلسة
      this.io.to(sessionRoom).emit('session_status_update', updateData);

      // إرسال للمنظمة
      this.io.to(orgRoom).emit('whatsapp_session_update', updateData);

      logger.info(`📡 Broadcasted session status: ${sessionId} -> ${status}`);
    } catch (error) {
      logger.error('❌ Error broadcasting session status:', error);
    }
  }

  /**
   * إرسال تحديث QR Code
   * Send QR Code update
   */
  broadcastQRCode(sessionId, qrCode) {
    try {
      if (!this.initialized) {
        return;
      }

      const sessionRoom = `session_${sessionId}`;
      const [organizationId] = sessionId.split('_');
      const orgRoom = `org_${organizationId}`;

      const qrData = {
        sessionId,
        qrCode,
        timestamp: new Date().toISOString(),
      };

      this.io.to(sessionRoom).emit('qr_code_update', qrData);
      this.io.to(orgRoom).emit('whatsapp_qr_update', qrData);

      logger.info(`📱 Broadcasted QR code for session: ${sessionId}`);
    } catch (error) {
      logger.error('❌ Error broadcasting QR code:', error);
    }
  }

  /**
   * إرسال رسالة جديدة
   * Send new message notification
   */
  broadcastNewMessage(sessionId, messageData) {
    try {
      if (!this.initialized) {
        logger.warn('⚠️ WebSocket not initialized, cannot broadcast message');
        return;
      }

      const sessionRoom = `session_${sessionId}`;
      const [organizationId] = sessionId.split('_');
      const orgRoom = `org_${organizationId}`;

      // عدد المستمعين في كل غرفة
      const sessionRoomSize = this.io.sockets.adapter.rooms.get(sessionRoom)?.size || 0;
      const orgRoomSize = this.io.sockets.adapter.rooms.get(orgRoom)?.size || 0;

      logger.info('📡 Broadcasting new message', {
        sessionId,
        sessionRoom,
        orgRoom,
        sessionRoomListeners: sessionRoomSize,
        orgRoomListeners: orgRoomSize,
        messageId: messageData.messageId,
        direction: messageData.direction,
        messageType: messageData.messageType || messageData.type
      });

      const notificationData = {
        sessionId,
        message: messageData,
        timestamp: new Date().toISOString(),
      };

      this.io.to(sessionRoom).emit('new_message', notificationData);
      this.io.to(orgRoom).emit('whatsapp_message', notificationData);

      logger.info(`💬 Broadcasted new message for session: ${sessionId}`, {
        totalListeners: sessionRoomSize + orgRoomSize
      });
    } catch (error) {
      logger.error('❌ Error broadcasting new message:', error);
    }
  }

  /**
   * إرسال إشعار عام للمنظمة
   * Send general notification to organization
   */
  broadcastToOrganization(organizationId, event, data) {
    try {
      if (!this.initialized) {
        return;
      }

      const orgRoom = `org_${organizationId}`;

      this.io.to(orgRoom).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });

      logger.info(`📢 Broadcasted to organization ${organizationId}: ${event}`);
    } catch (error) {
      logger.error('❌ Error broadcasting to organization:', error);
    }
  }

  /**
   * الحصول على إحصائيات الاتصالات
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.connectedClients.size,
      organizationRooms: this.organizationRooms.size,
      sessionRooms: this.sessionRooms.size,
      initialized: this.initialized,
    };
  }

  /**
   * ✅ Broadcast conversation assigned event
   */
  broadcastConversationAssigned(organizationId, conversationData) {
    try {
      if (!this.initialized) {
        return;
      }

      const orgRoom = `org_${organizationId}`;
      this.io.to(orgRoom).emit('conversation_assigned', {
        conversation: conversationData,
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ Broadcasted conversation assigned for org: ${organizationId}`);
    } catch (error) {
      logger.error('❌ Error broadcasting conversation assigned:', error);
    }
  }

  /**
   * ✅ Broadcast conversation status changed event
   */
  broadcastConversationStatusChanged(organizationId, conversationData) {
    try {
      if (!this.initialized) {
        return;
      }

      const orgRoom = `org_${organizationId}`;
      this.io.to(orgRoom).emit('conversation_status_changed', {
        conversation: conversationData,
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ Broadcasted conversation status changed for org: ${organizationId}`);
    } catch (error) {
      logger.error('❌ Error broadcasting conversation status changed:', error);
    }
  }

  /**
   * ✅ Broadcast note added event
   */
  broadcastNoteAdded(organizationId, noteData) {
    try {
      if (!this.initialized) {
        return;
      }

      const orgRoom = `org_${organizationId}`;
      this.io.to(orgRoom).emit('note_added', {
        note: noteData,
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ Broadcasted note added for org: ${organizationId}`);
    } catch (error) {
      logger.error('❌ Error broadcasting note added:', error);
    }
  }

  /**
   * ✅ Broadcast new contact created event
   * Send notification when a new contact is created from incoming message
   */
  broadcastNewContact(sessionId, contactData) {
    try {
      if (!this.initialized) {
        return;
      }

      const sessionRoom = `session_${sessionId}`;
      const [organizationId] = sessionId.split('_');
      const orgRoom = `org_${organizationId}`;

      const notificationData = {
        sessionId,
        contact: contactData,
        timestamp: new Date().toISOString(),
      };

      this.io.to(sessionRoom).emit('new_contact', notificationData);
      this.io.to(orgRoom).emit('whatsapp_contact_created', notificationData);

      logger.info(
        `📱 Broadcasted new contact for session: ${sessionId}, phone: ${contactData.phoneNumber}`
      );
    } catch (error) {
      logger.error('❌ Error broadcasting new contact:', error);
    }
  }

  /**
   * إغلاق الخدمة
   * Shutdown service
   */
  shutdown() {
    try {
      if (this.io) {
        this.io.close();
        logger.info('✅ WebSocket service shutdown completed');
      }
    } catch (error) {
      logger.error('❌ Error shutting down WebSocket service:', error);
    }
  }
}

// إنشاء instance واحد
const websocketService = new WebSocketService();

export default websocketService;
