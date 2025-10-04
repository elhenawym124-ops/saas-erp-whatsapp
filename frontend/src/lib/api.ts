/**
 * API Configuration
 * ملف مركزي لإعدادات الـ API
 * 
 * هذا الملف يحتوي على جميع إعدادات الـ API والـ URLs
 * لا تستخدم hard-coded URLs في أي مكان آخر!
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * الحصول على Base URL من متغيرات البيئة
 * يدعم التشغيل على أي بورت بدون تعديل الكود
 */
export const getApiBaseUrl = (): string => {
  // أولاً: جرب متغير البيئة
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // ثانياً: إذا كنا في المتصفح، استخدم window.location
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // افتراض أن الـ backend على نفس الـ hostname لكن بورت مختلف
    // يمكن تعديل هذا حسب الحاجة
    return `${protocol}//${hostname}:8000/api/v1`;
  }

  // ثالثاً: fallback للتطوير المحلي
  return 'http://localhost:8000/api/v1';
};

/**
 * الحصول على WebSocket URL من متغيرات البيئة
 */
export const getWebSocketUrl = (): string => {
  // أولاً: جرب متغير البيئة
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  // ثانياً: استخرج من API URL
  const apiUrl = getApiBaseUrl();
  // إزالة /api/v1 من النهاية
  return apiUrl.replace('/api/v1', '');
};

/**
 * الحصول على JWT Token من localStorage
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

/**
 * إنشاء Axios Config مع JWT Token
 */
export const getAxiosConfig = (): AxiosRequestConfig => {
  const token = getToken();
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  };
};

/**
 * Axios Instance مع إعدادات افتراضية
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor - إضافة Token تلقائياً
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - معالجة الأخطاء تلقائياً
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // معالجة خطأ المصادقة
    if (error.response?.status === 401) {
      // حذف Token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        // إعادة التوجيه لصفحة تسجيل الدخول
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * API Endpoints
 * جميع الـ endpoints في مكان واحد
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },

  // WhatsApp
  WHATSAPP: {
    SESSIONS: '/whatsapp/sessions',
    CONTACTS: '/whatsapp/contacts',
    MESSAGES: '/whatsapp/messages',
    SEND_MESSAGE: '/whatsapp/messages/send',
    SEND_IMAGE: '/whatsapp/messages/send-image',
    SEND_VIDEO: '/whatsapp/messages/send-video',
    SEND_AUDIO: '/whatsapp/messages/send-audio',
    SEND_DOCUMENT: '/whatsapp/messages/send-document',
    DELETE_CONVERSATION: '/whatsapp/messages/conversation',
    DELETE_CHAT: '/whatsapp/messages/chat',
    QR: (sessionName: string) => `/whatsapp/sessions/${sessionName}/qr`,
    DELETE_SESSION: (sessionName: string) => `/whatsapp/sessions/${sessionName}`,
    WEBSOCKET_STATS: '/whatsapp/websocket/stats',

    // ✅ Conversation Management
    CONVERSATIONS: '/whatsapp/conversations',
    CONVERSATION_BY_ID: (id: string) => `/whatsapp/conversations/${id}`,
    ASSIGN_CONVERSATION: (id: string) => `/whatsapp/conversations/${id}/assign`,
    UPDATE_CONVERSATION_STATUS: (id: string) => `/whatsapp/conversations/${id}/status`,
    CONVERSATION_NOTES: (id: string) => `/whatsapp/conversations/${id}/notes`,
  },

  // ✅ Users
  USERS: {
    LIST: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },

  // ✅ Templates
  TEMPLATES: {
    LIST: '/templates',
    CREATE: '/templates',
    BY_ID: (id: string) => `/templates/${id}`,
    USE: (id: string) => `/templates/${id}/use`,
    BY_SHORTCUT: (shortcut: string) => `/templates/shortcut/${shortcut}`,
  },

  // Customers
  CUSTOMERS: {
    LIST: '/customers',
    STATISTICS: '/customers/statistics',
    BY_ID: (id: string) => `/customers/${id}`,
  },

  // Projects
  PROJECTS: {
    LIST: '/projects',
    STATISTICS: '/projects/statistics',
    BY_ID: (id: string) => `/projects/${id}`,
  },

  // Tasks
  TASKS: {
    LIST: '/tasks',
    STATISTICS: '/tasks/statistics',
    BY_ID: (id: string) => `/tasks/${id}`,
    UPDATE_STATUS: (id: string) => `/tasks/${id}/status`,
  },

  // Invoices
  INVOICES: {
    LIST: '/invoices',
    STATISTICS: '/invoices/statistics',
    BY_ID: (id: string) => `/invoices/${id}`,
    UPDATE_STATUS: (id: string) => `/invoices/${id}/status`,
  },

  // Expenses
  EXPENSES: {
    LIST: '/expenses',
    STATISTICS: '/expenses/statistics',
    BY_ID: (id: string) => `/expenses/${id}`,
    UPDATE_STATUS: (id: string) => `/expenses/${id}/status`,
  },

  // Deals
  DEALS: {
    LIST: '/deals',
    STATISTICS: '/deals/statistics',
    BY_ID: (id: string) => `/deals/${id}`,
    UPDATE_STAGE: (id: string) => `/deals/${id}/stage`,
  },

  // Reports
  REPORTS: {
    ANALYTICS: '/reports/analytics',
    FINANCIAL: '/reports/financial',
  },

  // Super Admin
  SUPER_ADMIN: {
    ANALYTICS: '/super-admin/analytics',
    ORGANIZATIONS: '/super-admin/organizations',
    TOGGLE_ORG_STATUS: (id: string) => `/super-admin/organizations/${id}/toggle-status`,
    PAYMENTS: '/super-admin/payments',
    MARK_PAID: (id: string) => `/super-admin/payments/${id}/mark-paid`,
    SUBSCRIPTIONS: '/super-admin/subscriptions',
    SUSPEND_SUBSCRIPTION: (id: string) => `/super-admin/subscriptions/${id}/suspend`,
    REACTIVATE_SUBSCRIPTION: (id: string) => `/super-admin/subscriptions/${id}/reactivate`,
  },
};

/**
 * Helper Functions لبناء URLs كاملة
 */
export const buildUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

/**
 * معالجة خطأ المصادقة
 */
export const handleAuthError = (
  error: any,
  setError?: (error: string) => void
): void => {
  if (error.response?.status === 401) {
    const message = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    if (setError) {
      setError(message);
    }
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }, 2000);
  }
};

export default apiClient;

