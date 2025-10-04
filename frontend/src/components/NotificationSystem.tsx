'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FiBell, FiMessageCircle, FiPhone, FiUser, FiX } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';

interface NotificationData {
  id: string;
  type: 'message' | 'call' | 'session' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  sessionId?: string;
  phoneNumber?: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSystemProps {
  socket?: any;
  onNotificationClick?: (notification: NotificationData) => void;
}

/**
 * نظام الإشعارات المتقدم
 * Advanced Notification System Component
 */
export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  socket,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);

  /**
   * طلب إذن الإشعارات من المتصفح
   */
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        toast.success('تم تفعيل إشعارات المتصفح');
      } else {
        toast.warning('لم يتم تفعيل إشعارات المتصفح');
      }
    }
  }, []);

  /**
   * إرسال إشعار متصفح
   */
  const showBrowserNotification = useCallback((notification: NotificationData) => {
    if (!browserNotificationsEnabled || !('Notification' in window)) return;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/whatsapp-icon.png',
      badge: '/notification-badge.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'high',
      silent: notification.priority === 'low'
    });

    browserNotification.onclick = () => {
      window.focus();
      onNotificationClick?.(notification);
      browserNotification.close();
    };

    // إغلاق تلقائي بعد 5 ثوان للإشعارات العادية
    if (notification.priority !== 'high') {
      setTimeout(() => browserNotification.close(), 5000);
    }
  }, [browserNotificationsEnabled, onNotificationClick]);

  /**
   * إضافة إشعار جديد
   */
  const addNotification = useCallback((data: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    const notification: NotificationData = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // الاحتفاظ بآخر 50 إشعار

    // إشعار toast
    const toastOptions = {
      duration: notification.priority === 'high' ? 10000 : 4000,
      action: notification.type === 'message' ? {
        label: 'عرض',
        onClick: () => onNotificationClick?.(notification)
      } : undefined
    };

    switch (notification.priority) {
      case 'high':
        toast.error(notification.message, toastOptions);
        break;
      case 'medium':
        toast.warning(notification.message, toastOptions);
        break;
      default:
        toast.info(notification.message, toastOptions);
    }

    // إشعار متصفح
    showBrowserNotification(notification);

    return notification;
  }, [onNotificationClick, showBrowserNotification]);

  /**
   * معالجة الرسائل الواردة
   */
  const handleNewMessage = useCallback((data: any) => {
    console.log('🔔 NotificationSystem: new_message event received', {
      hasMessage: !!data.message,
      sessionId: data.sessionId,
      timestamp: data.timestamp
    });

    const message = data.message;
    if (!message) {
      console.log('⏭️ NotificationSystem: No message data, skipping');
      return;
    }

    if (message.direction !== 'inbound') {
      console.log('⏭️ NotificationSystem: Not an inbound message, skipping', {
        direction: message.direction
      });
      return;
    }

    console.log('✅ NotificationSystem: Creating notification for inbound message', {
      fromNumber: message.fromNumber,
      messageType: message.messageType
    });

    addNotification({
      type: 'message',
      title: 'رسالة WhatsApp جديدة',
      message: `رسالة من ${message.fromNumber}: ${getMessagePreview(message)}`,
      sessionId: data.sessionId,
      phoneNumber: message.fromNumber,
      priority: 'medium'
    });
  }, [addNotification]);

  /**
   * معالجة تحديثات حالة الجلسة
   */
  const handleSessionUpdate = useCallback((data: any) => {
    const { sessionId, status } = data;
    
    let title = 'تحديث جلسة WhatsApp';
    let message = '';
    let priority: 'low' | 'medium' | 'high' = 'low';

    switch (status) {
      case 'connected':
        message = `تم الاتصال بجلسة ${sessionId}`;
        priority = 'medium';
        break;
      case 'disconnected':
        message = `تم قطع الاتصال عن جلسة ${sessionId}`;
        priority = 'high';
        break;
      case 'connecting':
        message = `جاري الاتصال بجلسة ${sessionId}`;
        priority = 'low';
        break;
      default:
        message = `حالة جلسة ${sessionId}: ${status}`;
    }

    addNotification({
      type: 'session',
      title,
      message,
      sessionId,
      priority
    });
  }, [addNotification]);

  /**
   * إعداد مستمعي الأحداث
   */
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', handleNewMessage);
    socket.on('whatsapp_message', handleNewMessage);
    socket.on('session_status_update', handleSessionUpdate);
    socket.on('whatsapp_session_update', handleSessionUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('whatsapp_message', handleNewMessage);
      socket.off('session_status_update', handleSessionUpdate);
      socket.off('whatsapp_session_update', handleSessionUpdate);
    };
  }, [socket, handleNewMessage, handleSessionUpdate]);

  /**
   * فحص إذن الإشعارات عند التحميل
   */
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  /**
   * تحديد أيقونة الإشعار
   */
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <FiMessageCircle className="w-4 h-4" />;
      case 'call': return <FiPhone className="w-4 h-4" />;
      case 'session': return <BsWhatsapp className="w-4 h-4" />;
      default: return <FiBell className="w-4 h-4" />;
    }
  };

  /**
   * تحديد لون الإشعار
   */
  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* زر الإشعارات */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* قائمة الإشعارات */}
      {showNotifications && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">الإشعارات</h3>
            <div className="flex items-center gap-2">
              {!browserNotificationsEnabled && (
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  تفعيل إشعارات المتصفح
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                لا توجد إشعارات
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    onNotificationClick?.(notification);
                    setNotifications(prev =>
                      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                    );
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp.toLocaleString('ar-EG')}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * استخراج معاينة الرسالة
 */
function getMessagePreview(message: any): string {
  if (typeof message.content === 'string') {
    return message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
  }
  
  if (message.content?.text) {
    return message.content.text.substring(0, 50) + (message.content.text.length > 50 ? '...' : '');
  }
  
  switch (message.messageType) {
    case 'image': return '📷 صورة';
    case 'video': return '🎥 فيديو';
    case 'audio': return '🎵 رسالة صوتية';
    case 'document': return '📄 مستند';
    default: return 'رسالة';
  }
}

export default NotificationSystem;
