/**
 * Validation Utilities
 * 
 * Runtime validation functions for data integrity
 * 
 * @module utils/validation
 */

import type { Contact, Message, Session, Conversation } from '@/types/whatsapp';

/**
 * Validate phone number format
 *
 * @param phoneNumber - Phone number to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * validatePhoneNumber('201505129931') // true
 * validatePhoneNumber('123') // false (too short)
 * validatePhoneNumber('abc123') // false (contains letters)
 * validatePhoneNumber('120363420803971218') // true (group ID - 18 digits)
 */
export const validatePhoneNumber = (phoneNumber: string | null | undefined): boolean => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Must be between 10 and 20 digits (to support WhatsApp group IDs which can be up to 18 digits)
  if (cleaned.length < 10 || cleaned.length > 20) {
    return false;
  }

  return true;
};

/**
 * Validate email format
 * 
 * @param email - Email to validate
 * @returns True if valid, false otherwise
 */
export const validateEmail = (email: string | null | undefined): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * 
 * @param url - URL to validate
 * @returns True if valid, false otherwise
 */
export const validateUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate Contact object
 *
 * @param contact - Contact object to validate
 * @returns True if valid Contact, false otherwise
 */
export const isValidContact = (contact: any): contact is Contact => {
  if (!contact || typeof contact !== 'object') {
    return false;
  }

  // Required fields
  if (typeof contact.id !== 'number') {
    console.warn('⚠️ Invalid contact: missing or invalid id', contact);
    return false;
  }

  // ✅ Remove WhatsApp suffixes before validation
  const phoneNumberClean = contact.phoneNumber
    ? contact.phoneNumber.replace(/@s\.whatsapp\.net$/, '')
        .replace(/@lid$/, '')
        .replace(/@g\.us$/, '')
    : '';

  if (!validatePhoneNumber(phoneNumberClean)) {
    console.warn('⚠️ Invalid contact: invalid phoneNumber', contact.phoneNumber, 'cleaned:', phoneNumberClean);
    return false;
  }

  if (typeof contact.organizationId !== 'number') {
    console.warn('⚠️ Invalid contact: missing or invalid organizationId', contact);
    return false;
  }

  // Optional fields validation
  if (contact.name !== undefined && typeof contact.name !== 'string') {
    console.warn('⚠️ Invalid contact: name must be string', contact);
    return false;
  }

  if (contact.profilePicture !== undefined && !validateUrl(contact.profilePicture)) {
    console.warn('⚠️ Invalid contact: invalid profilePicture URL', contact);
    return false;
  }

  return true;
};

/**
 * Remove WhatsApp suffixes from phone number
 *
 * @param phoneNumber - Phone number with or without suffix
 * @returns Phone number without suffix
 */
const removeWhatsAppSuffix = (phoneNumber: string | null | undefined): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '';
  }

  return phoneNumber
    .replace(/@s\.whatsapp\.net$/, '')
    .replace(/@lid$/, '')
    .replace(/@g\.us$/, '');
};

/**
 * Validate Message object
 *
 * @param message - Message object to validate
 * @returns True if valid Message, false otherwise
 */
export const isValidMessage = (message: any): message is Message => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  // Required fields
  if (typeof message.id !== 'number' && typeof message.messageId !== 'string') {
    console.warn('⚠️ Invalid message: missing id or messageId', message);
    return false;
  }

  if (typeof message.sessionName !== 'string') {
    console.warn('⚠️ Invalid message: missing sessionName', message);
    return false;
  }

  if (message.direction !== 'inbound' && message.direction !== 'outbound') {
    console.warn('⚠️ Invalid message: invalid direction', message);
    return false;
  }

  // ✅ Remove WhatsApp suffixes before validation
  const fromNumberClean = removeWhatsAppSuffix(message.fromNumber);
  const toNumberClean = removeWhatsAppSuffix(message.toNumber);

  // ✅ Allow "me" as a valid phone number (used by WhatsApp for self-messages)
  if (fromNumberClean !== 'me' && !validatePhoneNumber(fromNumberClean)) {
    console.warn('⚠️ Invalid message: invalid fromNumber', message.fromNumber, 'cleaned:', fromNumberClean);
    return false;
  }

  if (toNumberClean !== 'me' && !validatePhoneNumber(toNumberClean)) {
    console.warn('⚠️ Invalid message: invalid toNumber', message.toNumber, 'cleaned:', toNumberClean);
    return false;
  }

  // Validate message type
  const validTypes = ['text', 'image', 'video', 'audio', 'document'];
  if (!validTypes.includes(message.messageType)) {
    console.warn('⚠️ Invalid message: invalid messageType', message);
    return false;
  }

  // Validate status
  const validStatuses = ['pending', 'sent', 'delivered', 'read', 'failed'];
  if (!validStatuses.includes(message.status)) {
    console.warn('⚠️ Invalid message: invalid status', message);
    return false;
  }

  return true;
};

/**
 * Validate Session object
 *
 * @param session - Session object to validate
 * @returns True if valid Session, false otherwise
 */
export const isValidSession = (session: any): session is Session => {
  if (!session || typeof session !== 'object') {
    return false;
  }

  // Required fields
  if (typeof session.id !== 'number') {
    console.warn('⚠️ Invalid session: missing or invalid id', session);
    return false;
  }

  if (typeof session.sessionName !== 'string') {
    console.warn('⚠️ Invalid session: missing sessionName', session);
    return false;
  }

  // ✅ Remove WhatsApp suffixes before validation
  const phoneNumberClean = session.phoneNumber
    ? session.phoneNumber.replace(/@s\.whatsapp\.net$/, '')
        .replace(/@lid$/, '')
        .replace(/@g\.us$/, '')
    : '';

  if (!validatePhoneNumber(phoneNumberClean)) {
    console.warn('⚠️ Invalid session: invalid phoneNumber', session.phoneNumber, 'cleaned:', phoneNumberClean);
    return false;
  }

  // Validate status
  const validStatuses = ['connected', 'disconnected', 'connecting'];
  if (!validStatuses.includes(session.status)) {
    console.warn('⚠️ Invalid session: invalid status', session);
    return false;
  }

  if (typeof session.organizationId !== 'number') {
    console.warn('⚠️ Invalid session: missing or invalid organizationId', session);
    return false;
  }

  return true;
};

/**
 * Validate Conversation object
 *
 * @param conversation - Conversation object to validate
 * @returns True if valid Conversation, false otherwise
 */
export const isValidConversation = (conversation: any): conversation is Conversation => {
  if (!conversation || typeof conversation !== 'object') {
    return false;
  }

  // Required fields
  if (typeof conversation.id !== 'number') {
    console.warn('⚠️ Invalid conversation: missing or invalid id', conversation);
    return false;
  }

  // ✅ Remove WhatsApp suffixes before validation
  const phoneNumberClean = conversation.phoneNumber
    ? conversation.phoneNumber.replace(/@s\.whatsapp\.net$/, '')
        .replace(/@lid$/, '')
        .replace(/@g\.us$/, '')
    : '';

  if (!validatePhoneNumber(phoneNumberClean)) {
    console.warn('⚠️ Invalid conversation: invalid phoneNumber', conversation.phoneNumber, 'cleaned:', phoneNumberClean);
    return false;
  }

  // Validate status
  const validStatuses = ['open', 'closed', 'pending'];
  if (!validStatuses.includes(conversation.status)) {
    console.warn('⚠️ Invalid conversation: invalid status', conversation);
    return false;
  }

  if (typeof conversation.organizationId !== 'number') {
    console.warn('⚠️ Invalid conversation: missing or invalid organizationId', conversation);
    return false;
  }

  if (typeof conversation.sessionName !== 'string') {
    console.warn('⚠️ Invalid conversation: missing sessionName', conversation);
    return false;
  }

  return true;
};

/**
 * Sanitize string input
 * Removes potentially dangerous characters
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Validate and sanitize message content
 * 
 * @param content - Message content to validate
 * @returns Sanitized content or null if invalid
 */
export const validateMessageContent = (content: any): string | null => {
  if (!content) {
    return null;
  }
  
  // If string, sanitize and return
  if (typeof content === 'string') {
    const sanitized = sanitizeString(content);
    return sanitized.length > 0 ? sanitized : null;
  }
  
  // If object, extract text or caption
  if (typeof content === 'object') {
    const text = content.text || content.caption;
    if (text && typeof text === 'string') {
      const sanitized = sanitizeString(text);
      return sanitized.length > 0 ? sanitized : null;
    }
  }
  
  return null;
};

/**
 * Validate array of items
 * Filters out invalid items
 * 
 * @param items - Array to validate
 * @param validator - Validation function
 * @returns Filtered array of valid items
 */
export const validateArray = <T>(
  items: any[],
  validator: (item: any) => item is T
): T[] => {
  if (!Array.isArray(items)) {
    console.warn('⚠️ validateArray: input is not an array');
    return [];
  }

  const valid: T[] = [];
  const invalid: any[] = [];

  for (const item of items) {
    if (validator(item)) {
      valid.push(item);
    } else {
      invalid.push(item);
    }
  }

  if (invalid.length > 0) {
    console.warn(`⚠️ validateArray: ${invalid.length} invalid items filtered out`);
  }

  return valid;
};

/**
 * WhatsApp ID helpers
 * Distinguish between regular numbers (@s.whatsapp.net), business (@lid), and groups (@g.us)
 */
export const isGroupId = (jidOrPhone: string | null | undefined): boolean => {
  if (!jidOrPhone || typeof jidOrPhone !== 'string') return false;
  return /@g\.us$/.test(jidOrPhone);
};

export const isBusinessLid = (jidOrPhone: string | null | undefined): boolean => {
  if (!jidOrPhone || typeof jidOrPhone !== 'string') return false;
  return /@lid$/.test(jidOrPhone);
};

export const isRegularJid = (jidOrPhone: string | null | undefined): boolean => {
  if (!jidOrPhone || typeof jidOrPhone !== 'string') return false;
  return /@s\.whatsapp\.net$/.test(jidOrPhone) || (!/@(g\.us|lid)$/.test(jidOrPhone) && validatePhoneNumber(removeWhatsAppSuffix(jidOrPhone)));
};

export type WhatsAppIdType = 'group' | 'business' | 'regular' | 'unknown';
export const getWhatsAppIdType = (jidOrPhone: string | null | undefined): WhatsAppIdType => {
  if (!jidOrPhone || typeof jidOrPhone !== 'string') return 'unknown';
  if (isGroupId(jidOrPhone)) return 'group';
  if (isBusinessLid(jidOrPhone)) return 'business';
  if (isRegularJid(jidOrPhone)) return 'regular';
  return 'unknown';
};

export const isGroupContact = (contact: Partial<Contact>): boolean => {
  if (!contact) return false;
  if (typeof contact.isGroup === 'boolean') return contact.isGroup;
  if (contact.jid && isGroupId(contact.jid)) return true;
  return false;
};

export const getDisplayName = (contact: Partial<Contact>): string => {
  if (!contact) return '';
  const name = typeof contact.name === 'string' && contact.name.trim().length > 0 ? contact.name.trim() : '';
  const num = typeof contact.phoneNumber === 'string' ? contact.phoneNumber : '';
  if (isGroupContact(contact)) {
    return name || `مجموعة ${num}`;
  }
  return name || num;
};
