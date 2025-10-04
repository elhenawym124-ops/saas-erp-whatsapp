/**
 * ثوابت التطبيق
 */

// حالات المستخدم
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
};

// الأدوار والصلاحيات
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  CLIENT: 'client',
};

// حالات الحضور
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EARLY_LEAVE: 'early_leave',
  ON_LEAVE: 'on_leave',
  HOLIDAY: 'holiday',
};

// طرق تسجيل الحضور
export const CHECK_IN_METHODS = {
  FINGERPRINT: 'fingerprint',
  CARD: 'card',
  MOBILE: 'mobile',
  QR: 'qr',
  MANUAL: 'manual',
};

// أنواع الإجازات
export const LEAVE_TYPES = {
  ANNUAL: 'annual',
  SICK: 'sick',
  EMERGENCY: 'emergency',
  UNPAID: 'unpaid',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
};

// حالات طلبات الإجازة
export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// حالات المشاريع
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// أولويات المشاريع والمهام
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// أولويات المشاريع
export const PROJECT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// أولويات المهام
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// حالات المهام
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// حالات العملاء
export const CUSTOMER_STATUS = {
  LEAD: 'lead',
  PROSPECT: 'prospect',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOST: 'lost',
};

// مراحل الصفقات
export const DEAL_STAGES = {
  LEAD: 'lead',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost',
};

// حالات الفواتير
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

// حالات المصروفات
export const EXPENSE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
};

// حالات الرواتب
export const PAYROLL_STATUS = {
  DRAFT: 'draft',
  PROCESSED: 'processed',
  PAID: 'paid',
};

// أنواع حركات المخزون
export const STOCK_MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
};

// حالات جلسات WhatsApp
export const WHATSAPP_SESSION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  QR_REQUIRED: 'qr_required',
  ERROR: 'error',
};

// أنواع رسائل WhatsApp
export const WHATSAPP_MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  VIDEO: 'video',
  STICKER: 'sticker',
  LOCATION: 'location',
  CONTACT: 'contact',
  BUTTON: 'button',
  LIST: 'list',
  TEMPLATE: 'template',
};

// اتجاه الرسائل
export const MESSAGE_DIRECTION = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
};

// حالات الرسائل
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

// أنواع الإشعارات
export const NOTIFICATION_TYPES = {
  ATTENDANCE_LATE: 'attendance_late',
  ATTENDANCE_ABSENT: 'attendance_absent',
  LEAVE_REQUEST: 'leave_request',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  TASK_ASSIGNED: 'task_assigned',
  TASK_DUE: 'task_due',
  TASK_OVERDUE: 'task_overdue',
  TASK_COMPLETED: 'task_completed',
  PROJECT_UPDATE: 'project_update',
  EXPENSE_APPROVED: 'expense_approved',
  EXPENSE_REJECTED: 'expense_rejected',
  INVOICE_DUE: 'invoice_due',
  STOCK_LOW: 'stock_low',
  PERFORMANCE_REVIEW: 'performance_review',
  ANNOUNCEMENT: 'announcement',
};

// أنواع التقارير
export const REPORT_TYPES = {
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  PROJECT: 'project',
  TASK: 'task',
  SALES: 'sales',
  EXPENSE: 'expense',
  PAYROLL: 'payroll',
  INVENTORY: 'inventory',
  PERFORMANCE: 'performance',
};

// تنسيقات التقارير
export const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json',
};

// فترات التقارير
export const REPORT_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
};

// رموز الأخطاء
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
};

// رسائل النجاح
export const SUCCESS_MESSAGES = {
  CREATED: 'تم الإنشاء بنجاح',
  UPDATED: 'تم التحديث بنجاح',
  DELETED: 'تم الحذف بنجاح',
  OPERATION_SUCCESS: 'تمت العملية بنجاح',
};

// الحد الأقصى لحجم الصفحة
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export default {
  USER_STATUS,
  USER_ROLES,
  ATTENDANCE_STATUS,
  CHECK_IN_METHODS,
  LEAVE_TYPES,
  LEAVE_STATUS,
  PROJECT_STATUS,
  PROJECT_PRIORITY,
  PRIORITY_LEVELS,
  TASK_STATUS,
  TASK_PRIORITY,
  CUSTOMER_STATUS,
  DEAL_STAGES,
  INVOICE_STATUS,
  EXPENSE_STATUS,
  PAYROLL_STATUS,
  STOCK_MOVEMENT_TYPES,
  WHATSAPP_SESSION_STATUS,
  WHATSAPP_MESSAGE_TYPES,
  MESSAGE_DIRECTION,
  MESSAGE_STATUS,
  NOTIFICATION_TYPES,
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_PERIODS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  PAGINATION,
};
