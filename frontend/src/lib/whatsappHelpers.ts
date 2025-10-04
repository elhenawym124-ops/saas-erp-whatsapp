/**
 * WhatsApp Messages Helper Functions
 * مساعدات لصفحة رسائل WhatsApp
 *
 * ⚠️ تحذير: هذا الملف قديم ويجب استخدام /lib/api.ts بدلاً منه
 * تم الاحتفاظ به للتوافق مع الكود القديم فقط
 */

import { getToken as getTokenFromApi, getAxiosConfig as getAxiosConfigFromApi } from './api';

/**
 * تنسيق الوقت لعرض الرسائل - محسّن
 */
export const formatTime = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    // منذ أقل من دقيقة
    if (diffMinutes < 1) {
      return 'الآن';
    }

    // منذ أقل من ساعة
    if (diffMinutes < 60) {
      return `منذ ${diffMinutes} دقيقة`;
    }

    // منذ أقل من 24 ساعة (اليوم)
    if (diffHours < 24 && diffDays === 0) {
      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // إذا كان بالأمس
    if (diffDays === 1) {
      return `أمس ${date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }

    // إذا كان خلال الأسبوع
    if (diffDays < 7) {
      return `${date.toLocaleDateString('ar-EG', { weekday: 'long' })} ${date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }

    // تاريخ كامل
    return date.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

/**
 * تنظيف رقم الهاتف
 */
export const cleanPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  return phoneNumber
    .replace('@s.whatsapp.net', '')
    .replace('@lid', '')
    .replace('@g.us', '')
    .replace(/\D/g, ''); // إزالة كل شيء غير الأرقام
};

/**
 * مقارنة رقمين للتحقق من التطابق
 */
export const phoneNumbersMatch = (phone1: string, phone2: string): boolean => {
  const clean1 = cleanPhoneNumber(phone1);
  const clean2 = cleanPhoneNumber(phone2);
  
  return clean1 === clean2 || 
         clean1.endsWith(clean2) || 
         clean2.endsWith(clean1);
};

/**
 * الحصول على JWT Token من localStorage
 * @deprecated استخدم getToken من /lib/api.ts بدلاً من ذلك
 */
export const getToken = (): string | null => {
  return getTokenFromApi();
};

/**
 * إنشاء Axios Config مع JWT Token
 * @deprecated استخدم getAxiosConfig من /lib/api.ts بدلاً من ذلك
 */
export const getAxiosConfig = () => {
  return getAxiosConfigFromApi();
};

/**
 * معالجة خطأ المصادقة
 */
export const handleAuthError = (
  error: any,
  setError: (error: string) => void
): void => {
  if (error.response?.status === 401) {
    setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }
};

/**
 * Parse message content
 */
export const parseMessageContent = (content: any): any => {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (e) {
      return { text: content };
    }
  }
  return content;
};

/**
 * الحصول على اسم الجلسة من localStorage
 * ملاحظة: لا توجد قيمة افتراضية - يجب على التطبيق تحديد الجلسة النشطة تلقائياً
 */
export const getSessionName = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('whatsappSessionName');
  }
  return null;
};

/**
 * حفظ اسم الجلسة في localStorage
 */
export const setSessionName = (sessionName: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('whatsappSessionName', sessionName);
  }
};

/**
 * مسح اسم الجلسة من localStorage
 */
export const clearSessionName = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('whatsappSessionName');
  }
};

