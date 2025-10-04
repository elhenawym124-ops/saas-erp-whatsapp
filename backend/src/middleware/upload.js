/**
 * File Upload Middleware using Multer
 * Middleware لرفع الملفات باستخدام Multer
 */

import multer from 'multer';

import AppError from '../utils/appError.js';

// تكوين التخزين في الذاكرة
const storage = multer.memoryStorage();

// فلترة أنواع الملفات
const fileFilter = (req, file, cb) => {
  // قائمة الأنواع المسموحة
  const allowedMimes = [
    // صور
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // فيديو
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    // صوت
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    // مستندات
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('نوع الملف غير مدعوم', 400), false);
  }
};

// تكوين multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB (حد WhatsApp)
  },
});

// Middleware لرفع ملف واحد
export const uploadSingle = (fieldName) => upload.single(fieldName);

// Middleware لرفع عدة ملفات
export const uploadMultiple = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);

// Middleware لرفع حقول متعددة
export const uploadFields = (fields) => upload.fields(fields);

export default upload;
