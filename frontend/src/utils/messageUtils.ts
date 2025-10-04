/**
 * Message Utilities
 *
 * Utility functions for message handling, deduplication, sorting, and validation
 *
 * @module messageUtils
 *
 * Note: Uses generic 'any' type to be compatible with different Message interfaces
 * across the application (page.tsx has a more specific Message interface)
 */

/**
 * Clean phone number by removing all non-digit characters
 * 
 * @param phoneNumber - Phone number to clean
 * @returns Cleaned phone number with only digits
 * 
 * @example
 * cleanPhoneNumber('+1 (555) 123-4567') // Returns: '15551234567'
 * cleanPhoneNumber('201505129931') // Returns: '201505129931'
 */
export const cleanPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Remove leading country codes (1, 20, 966, etc.)
  // Keep only the last 10-15 digits
  if (cleaned.length > 15) {
    cleaned = cleaned.slice(-15);
  }
  
  return cleaned;
};

/**
 * Normalize phone number for comparison
 * Removes country codes and formatting
 * 
 * @param phoneNumber - Phone number to normalize
 * @returns Normalized phone number
 * 
 * @example
 * normalizePhoneNumber('+201505129931') // Returns: '1505129931'
 * normalizePhoneNumber('201505129931@s.whatsapp.net') // Returns: '1505129931'
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Remove WhatsApp suffix
  let normalized = phoneNumber.replace(/@s\.whatsapp\.net/g, '');
  
  // Clean the number
  normalized = cleanPhoneNumber(normalized);
  
  // Remove common country codes
  if (normalized.startsWith('20') && normalized.length > 10) {
    normalized = normalized.slice(2); // Remove Egypt country code (20)
  } else if (normalized.startsWith('966') && normalized.length > 10) {
    normalized = normalized.slice(3); // Remove Saudi Arabia country code (966)
  } else if (normalized.startsWith('1') && normalized.length === 11) {
    normalized = normalized.slice(1); // Remove US/Canada country code (1)
  }
  
  return normalized;
};

/**
 * Get unique message identifier
 * Tries multiple fields to find a unique ID
 *
 * @param message - Message object
 * @returns Unique identifier or null
 */
export const getMessageId = (message: any): string | null => {
  return message.messageId || message.id?.toString() || null;
};

/**
 * Validate message ID
 * 
 * @param messageId - Message ID to validate
 * @returns True if valid, false otherwise
 */
export const validateMessageId = (messageId: string | number | null | undefined): boolean => {
  if (!messageId) return false;
  
  const id = messageId.toString().trim();
  
  // Must be non-empty and not 'undefined' or 'null'
  if (!id || id === 'undefined' || id === 'null') return false;
  
  // Must be at least 1 character
  if (id.length < 1) return false;
  
  return true;
};

/**
 * Get message content from various possible fields
 *
 * @param message - Message object
 * @returns Message content or empty string
 */
export const getMessageContent = (message: any): string => {
  // Handle null/undefined message
  if (!message) {
    return '';
  }

  // Handle both string and object content
  if (typeof message.content === 'string') {
    // If content is empty, return empty
    if (!message.content.trim()) {
      return '';
    }

    try {
      // Try to parse JSON string content
      const parsed = JSON.parse(message.content);

      // Handle different content types
      if (parsed.text && typeof parsed.text === 'string') {
        return parsed.text.trim();
      }

      if (parsed.caption && typeof parsed.caption === 'string') {
        return parsed.caption.trim();
      }

      // Handle media messages
      if (parsed.mimetype) {
        if (parsed.mimetype.startsWith('image/')) {
          return parsed.caption?.trim() || '📷 صورة';
        }
        if (parsed.mimetype.startsWith('video/')) {
          return parsed.caption?.trim() || '🎥 فيديو';
        }
        if (parsed.mimetype.startsWith('audio/')) {
          return parsed.caption?.trim() || '🎵 صوت';
        }
        if (parsed.mimetype === 'application/pdf') {
          return parsed.caption?.trim() || '📄 ملف PDF';
        }
        if (parsed.mimetype.startsWith('application/')) {
          return parsed.caption?.trim() || '📎 ملف';
        }
        return parsed.caption?.trim() || '📎 ملف';
      }

      // Handle protocol messages (system messages)
      if (parsed.raw) {
        try {
          const rawParsed = JSON.parse(parsed.raw);
          if (rawParsed.protocolMessage) {
            return '📋 رسالة نظام';
          }
          if (rawParsed.senderKeyDistributionMessage) {
            return '🔐 رسالة تشفير';
          }
          if (rawParsed.reactionMessage) {
            return '👍 تفاعل';
          }
        } catch (e) {
          // Ignore parsing errors for raw content
        }
        return '📋 رسالة نظام';
      }

      // If parsed but no recognizable content, check if it's just a simple object
      if (typeof parsed === 'object' && parsed !== null) {
        // If it's an empty object or doesn't have text content, return placeholder
        return 'رسالة غير مدعومة';
      }

      // If it's a simple value, return it
      return String(parsed).trim();
    } catch (e) {
      // If not valid JSON, return as is (it's probably plain text)
      return message.content.trim();
    }
  }

  // Handle object content
  if (typeof message.content === 'object' && message.content !== null) {
    if (message.content.text && typeof message.content.text === 'string') {
      return message.content.text.trim();
    }
    if (message.content.caption && typeof message.content.caption === 'string') {
      return message.content.caption.trim();
    }
    return '';
  }

  // Fallback to body field
  if (message.body && typeof message.body === 'string') {
    return message.body.trim();
  }

  return '';
};

/**
 * Get message timestamp from various possible fields
 *
 * @param message - Message object
 * @returns ISO timestamp string
 */
export const getMessageTimestamp = (message: any): string => {
  const timestamp = message.timestamp || message.sentAt || message.createdAt;

  if (!timestamp) {
    return new Date().toISOString();
  }

  // If already ISO string, return as is
  if (typeof timestamp === 'string' && timestamp.includes('T')) {
    return timestamp;
  }

  // If Unix timestamp (number), convert to ISO
  if (typeof timestamp === 'number') {
    return new Date(timestamp * 1000).toISOString();
  }

  // Try to parse as date
  try {
    return new Date(timestamp).toISOString();
  } catch (error) {
    console.error('❌ Error parsing timestamp:', timestamp, error);
    return new Date().toISOString();
  }
};

/**
 * Get message phone number (from or to)
 *
 * @param message - Message object
 * @param direction - 'from' or 'to'
 * @returns Phone number or empty string
 */
export const getMessagePhoneNumber = (message: any, direction: 'from' | 'to'): string => {
  if (direction === 'from') {
    return message.fromNumber || message.from || message.phoneNumber || '';
  } else {
    return message.toNumber || message.to || '';
  }
};

/**
 * Deduplicate messages array
 * Removes duplicate messages based on messageId or id
 *
 * @param messages - Array of messages
 * @returns Deduplicated array of messages
 *
 * @example
 * const messages = [
 *   { messageId: 'ABC123', body: 'Hello' },
 *   { messageId: 'ABC123', body: 'Hello' }, // Duplicate
 *   { messageId: 'DEF456', body: 'World' }
 * ];
 * deduplicateMessages(messages) // Returns: 2 messages (ABC123, DEF456)
 */
export const deduplicateMessages = (messages: any[]): any[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const deduplicated: any[] = [];

  for (const message of messages) {
    const id = getMessageId(message);

    if (!id || !validateMessageId(id)) {
      console.warn('⚠️ Message has invalid ID, skipping:', message);
      continue;
    }

    if (seen.has(id)) {
      console.log('⏭️ Skipping duplicate message:', id);
      continue;
    }

    seen.add(id);
    deduplicated.push(message);
  }

  console.log(`✅ Deduplicated ${messages.length} messages to ${deduplicated.length} unique messages`);

  return deduplicated;
};

/**
 * Sort messages by timestamp (oldest first)
 *
 * @param messages - Array of messages
 * @returns Sorted array of messages
 *
 * @example
 * const messages = [
 *   { messageId: 'B', timestamp: '2024-01-02T00:00:00Z' },
 *   { messageId: 'A', timestamp: '2024-01-01T00:00:00Z' },
 *   { messageId: 'C', timestamp: '2024-01-03T00:00:00Z' }
 * ];
 * sortMessagesByTime(messages) // Returns: [A, B, C]
 */
export const sortMessagesByTime = (messages: any[]): any[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  return [...messages].sort((a, b) => {
    const timeA = new Date(getMessageTimestamp(a)).getTime();
    const timeB = new Date(getMessageTimestamp(b)).getTime();

    return timeA - timeB; // Oldest first
  });
};

/**
 * Sort messages by timestamp (newest first)
 *
 * @param messages - Array of messages
 * @returns Sorted array of messages
 */
export const sortMessagesByTimeDesc = (messages: any[]): any[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  return [...messages].sort((a, b) => {
    const timeA = new Date(getMessageTimestamp(a)).getTime();
    const timeB = new Date(getMessageTimestamp(b)).getTime();

    return timeB - timeA; // Newest first
  });
};

/**
 * Check if message is from a specific contact
 *
 * @param message - Message object
 * @param contactPhoneNumber - Contact phone number
 * @returns True if message is from contact, false otherwise
 */
export const isMessageFromContact = (message: any, contactPhoneNumber: string): boolean => {
  const messageFrom = normalizePhoneNumber(getMessagePhoneNumber(message, 'from'));
  const messageTo = normalizePhoneNumber(getMessagePhoneNumber(message, 'to'));
  const contactNumber = normalizePhoneNumber(contactPhoneNumber);

  return messageFrom === contactNumber || messageTo === contactNumber;
};

/**
 * Filter messages by contact
 *
 * @param messages - Array of messages
 * @param contactPhoneNumber - Contact phone number
 * @returns Filtered array of messages
 */
export const filterMessagesByContact = (messages: any[], contactPhoneNumber: string): any[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  if (!contactPhoneNumber) {
    return messages;
  }

  return messages.filter((message) => isMessageFromContact(message, contactPhoneNumber));
};

/**
 * Merge new messages with existing messages
 * Deduplicates and sorts the result
 *
 * @param existingMessages - Existing messages array
 * @param newMessages - New messages to add
 * @returns Merged, deduplicated, and sorted array
 */
export const mergeMessages = (existingMessages: any[], newMessages: any[]): any[] => {
  if (!Array.isArray(existingMessages)) existingMessages = [];
  if (!Array.isArray(newMessages)) newMessages = [];

  // Combine arrays
  const combined = [...existingMessages, ...newMessages];

  // Deduplicate
  const deduplicated = deduplicateMessages(combined);

  // Sort by time (oldest first)
  const sorted = sortMessagesByTime(deduplicated);

  return sorted;
};

/**
 * Add a single message to existing messages
 * Deduplicates and maintains sort order
 *
 * @param existingMessages - Existing messages array
 * @param newMessage - New message to add
 * @returns Updated messages array
 */
export const addMessage = (existingMessages: any[], newMessage: any): any[] => {
  if (!newMessage) {
    console.warn('⚠️ Cannot add null/undefined message');
    return existingMessages;
  }

  const messageId = getMessageId(newMessage);

  if (!validateMessageId(messageId)) {
    console.warn('⚠️ Cannot add message with invalid ID:', newMessage);
    return existingMessages;
  }

  // Check if message already exists
  const exists = existingMessages.some((msg) => {
    const existingId = getMessageId(msg);
    return existingId === messageId;
  });

  if (exists) {
    console.log('⏭️ Message already exists, skipping:', messageId);
    return existingMessages;
  }

  // Add message and sort
  const updated = [...existingMessages, newMessage];
  return sortMessagesByTime(updated);
};

