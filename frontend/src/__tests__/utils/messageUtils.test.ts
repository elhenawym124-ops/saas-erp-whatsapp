import {
  cleanPhoneNumber,
  normalizePhoneNumber,
  getMessageId,
  validateMessageId,
  getMessageContent,
  getMessageTimestamp,
  getMessagePhoneNumber,
  deduplicateMessages,
  sortMessagesByTime,
  sortMessagesByTimeDesc,
  isMessageFromContact,
  filterMessagesByContact,
  mergeMessages,
  addMessage,
} from '@/utils/messageUtils';

describe('messageUtils', () => {
  describe('cleanPhoneNumber', () => {
    it('should remove all non-digit characters', () => {
      expect(cleanPhoneNumber('+1 (555) 123-4567')).toBe('15551234567');
      expect(cleanPhoneNumber('201-505-129-931')).toBe('201505129931');
    });

    it('should handle empty string', () => {
      expect(cleanPhoneNumber('')).toBe('');
    });

    it('should handle numbers longer than 15 digits', () => {
      const longNumber = '12345678901234567890';
      const result = cleanPhoneNumber(longNumber);
      expect(result.length).toBe(15);
      expect(result).toBe('678901234567890');
    });

    it('should handle already clean numbers', () => {
      expect(cleanPhoneNumber('1234567890')).toBe('1234567890');
    });
  });

  describe('normalizePhoneNumber', () => {
    it('should remove WhatsApp suffix', () => {
      expect(normalizePhoneNumber('201505129931@s.whatsapp.net')).toBe('1505129931');
    });

    it('should remove Egypt country code (20)', () => {
      expect(normalizePhoneNumber('201505129931')).toBe('1505129931');
    });

    it('should remove Saudi Arabia country code (966)', () => {
      expect(normalizePhoneNumber('966501234567')).toBe('501234567');
    });

    it('should remove US/Canada country code (1)', () => {
      expect(normalizePhoneNumber('15551234567')).toBe('5551234567');
    });

    it('should handle empty string', () => {
      expect(normalizePhoneNumber('')).toBe('');
    });

    it('should not remove country code if number is too short', () => {
      expect(normalizePhoneNumber('201234')).toBe('201234');
    });
  });

  describe('getMessageId', () => {
    it('should return messageId if present', () => {
      const message = { messageId: 'ABC123', id: 456 };
      expect(getMessageId(message)).toBe('ABC123');
    });

    it('should return id as string if messageId not present', () => {
      const message = { id: 456 };
      expect(getMessageId(message)).toBe('456');
    });

    it('should return null if no ID fields present', () => {
      const message = { content: 'Hello' };
      expect(getMessageId(message)).toBe(null);
    });
  });

  describe('validateMessageId', () => {
    it('should return true for valid string ID', () => {
      expect(validateMessageId('ABC123')).toBe(true);
    });

    it('should return true for valid number ID', () => {
      expect(validateMessageId(123)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateMessageId(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(validateMessageId(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateMessageId('')).toBe(false);
    });

    it('should return false for whitespace', () => {
      expect(validateMessageId('   ')).toBe(false);
    });

    it('should return false for string "undefined"', () => {
      expect(validateMessageId('undefined')).toBe(false);
    });

    it('should return false for string "null"', () => {
      expect(validateMessageId('null')).toBe(false);
    });
  });

  describe('getMessageContent', () => {
    it('should return string content', () => {
      const message = { content: 'Hello World' };
      expect(getMessageContent(message)).toBe('Hello World');
    });

    it('should return text from object content', () => {
      const message = { content: { text: 'Hello World' } };
      expect(getMessageContent(message)).toBe('Hello World');
    });

    it('should return caption from object content', () => {
      const message = { content: { caption: 'Image caption' } };
      expect(getMessageContent(message)).toBe('Image caption');
    });

    it('should prefer text over caption', () => {
      const message = { content: { text: 'Text', caption: 'Caption' } };
      expect(getMessageContent(message)).toBe('Text');
    });

    it('should return body if content not present', () => {
      const message = { body: 'Body text' };
      expect(getMessageContent(message)).toBe('Body text');
    });

    it('should return empty string if no content fields', () => {
      const message = { id: 123 };
      expect(getMessageContent(message)).toBe('');
    });

    it('should handle null content', () => {
      const message = { content: null };
      expect(getMessageContent(message)).toBe('');
    });
  });

  describe('getMessageTimestamp', () => {
    it('should return timestamp field', () => {
      const message = { timestamp: '2024-01-01T00:00:00Z' };
      expect(getMessageTimestamp(message)).toBe('2024-01-01T00:00:00Z');
    });

    it('should return sentAt field', () => {
      const message = { sentAt: '2024-01-01T00:00:00Z' };
      expect(getMessageTimestamp(message)).toBe('2024-01-01T00:00:00Z');
    });

    it('should return createdAt field', () => {
      const message = { createdAt: '2024-01-01T00:00:00Z' };
      expect(getMessageTimestamp(message)).toBe('2024-01-01T00:00:00Z');
    });

    it('should convert Unix timestamp to ISO', () => {
      const message = { timestamp: 1704067200 }; // 2024-01-01 00:00:00 UTC
      const result = getMessageTimestamp(message);
      expect(result).toContain('2024-01-01');
    });

    it('should return current time if no timestamp', () => {
      const message = { id: 123 };
      const result = getMessageTimestamp(message);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('getMessagePhoneNumber', () => {
    it('should return fromNumber for "from" direction', () => {
      const message = { fromNumber: '1234567890', toNumber: '0987654321' };
      expect(getMessagePhoneNumber(message, 'from')).toBe('1234567890');
    });

    it('should return toNumber for "to" direction', () => {
      const message = { fromNumber: '1234567890', toNumber: '0987654321' };
      expect(getMessagePhoneNumber(message, 'to')).toBe('0987654321');
    });

    it('should fallback to "from" field', () => {
      const message = { from: '1234567890' };
      expect(getMessagePhoneNumber(message, 'from')).toBe('1234567890');
    });

    it('should return empty string if no phone number', () => {
      const message = { id: 123 };
      expect(getMessagePhoneNumber(message, 'from')).toBe('');
    });
  });

  describe('deduplicateMessages', () => {
    it('should remove duplicate messages', () => {
      const messages = [
        { messageId: 'ABC123', content: 'Hello' },
        { messageId: 'ABC123', content: 'Hello' },
        { messageId: 'DEF456', content: 'World' },
      ];
      const result = deduplicateMessages(messages);
      expect(result).toHaveLength(2);
      expect(result[0].messageId).toBe('ABC123');
      expect(result[1].messageId).toBe('DEF456');
    });

    it('should handle empty array', () => {
      expect(deduplicateMessages([])).toEqual([]);
    });

    it('should skip messages with invalid IDs', () => {
      const messages = [
        { messageId: 'ABC123', content: 'Valid' },
        { content: 'No ID' },
        { messageId: '', content: 'Empty ID' },
      ];
      const result = deduplicateMessages(messages);
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toBe('ABC123');
    });

    it('should handle messages with id field', () => {
      const messages = [
        { id: 1, content: 'First' },
        { id: 1, content: 'Duplicate' },
        { id: 2, content: 'Second' },
      ];
      const result = deduplicateMessages(messages);
      expect(result).toHaveLength(2);
    });
  });

  describe('sortMessagesByTime', () => {
    it('should sort messages oldest first', () => {
      const messages = [
        { messageId: 'B', timestamp: '2024-01-02T00:00:00Z' },
        { messageId: 'A', timestamp: '2024-01-01T00:00:00Z' },
        { messageId: 'C', timestamp: '2024-01-03T00:00:00Z' },
      ];
      const result = sortMessagesByTime(messages);
      expect(result[0].messageId).toBe('A');
      expect(result[1].messageId).toBe('B');
      expect(result[2].messageId).toBe('C');
    });

    it('should handle empty array', () => {
      expect(sortMessagesByTime([])).toEqual([]);
    });

    it('should not mutate original array', () => {
      const messages = [
        { messageId: 'B', timestamp: '2024-01-02T00:00:00Z' },
        { messageId: 'A', timestamp: '2024-01-01T00:00:00Z' },
      ];
      const original = [...messages];
      sortMessagesByTime(messages);
      expect(messages).toEqual(original);
    });
  });

  describe('sortMessagesByTimeDesc', () => {
    it('should sort messages newest first', () => {
      const messages = [
        { messageId: 'B', timestamp: '2024-01-02T00:00:00Z' },
        { messageId: 'A', timestamp: '2024-01-01T00:00:00Z' },
        { messageId: 'C', timestamp: '2024-01-03T00:00:00Z' },
      ];
      const result = sortMessagesByTimeDesc(messages);
      expect(result[0].messageId).toBe('C');
      expect(result[1].messageId).toBe('B');
      expect(result[2].messageId).toBe('A');
    });
  });

  describe('isMessageFromContact', () => {
    it('should return true if message from matches contact', () => {
      const message = { fromNumber: '201505129931' };
      expect(isMessageFromContact(message, '1505129931')).toBe(true);
    });

    it('should return true if message to matches contact', () => {
      const message = { toNumber: '201505129931' };
      expect(isMessageFromContact(message, '1505129931')).toBe(true);
    });

    it('should return false if no match', () => {
      const message = { fromNumber: '1234567890' };
      expect(isMessageFromContact(message, '0987654321')).toBe(false);
    });
  });

  describe('filterMessagesByContact', () => {
    it('should filter messages by contact', () => {
      const messages = [
        { id: 1, fromNumber: '201505129931' },
        { id: 2, fromNumber: '1234567890' },
        { id: 3, toNumber: '201505129931' },
      ];
      const result = filterMessagesByContact(messages, '1505129931');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
    });

    it('should return all messages if no contact specified', () => {
      const messages = [{ id: 1 }, { id: 2 }];
      const result = filterMessagesByContact(messages, '');
      expect(result).toHaveLength(2);
    });
  });

  describe('mergeMessages', () => {
    it('should merge and deduplicate messages', () => {
      const existing = [
        { messageId: 'A', timestamp: '2024-01-01T00:00:00Z' },
        { messageId: 'B', timestamp: '2024-01-02T00:00:00Z' },
      ];
      const newMsgs = [
        { messageId: 'B', timestamp: '2024-01-02T00:00:00Z' }, // Duplicate
        { messageId: 'C', timestamp: '2024-01-03T00:00:00Z' },
      ];
      const result = mergeMessages(existing, newMsgs);
      expect(result).toHaveLength(3);
      expect(result[0].messageId).toBe('A');
      expect(result[1].messageId).toBe('B');
      expect(result[2].messageId).toBe('C');
    });

    it('should handle empty arrays', () => {
      expect(mergeMessages([], [])).toEqual([]);
    });
  });

  describe('addMessage', () => {
    it('should add new message', () => {
      const existing = [
        { messageId: 'A', timestamp: '2024-01-01T00:00:00Z' },
      ];
      const newMsg = { messageId: 'B', timestamp: '2024-01-02T00:00:00Z' };
      const result = addMessage(existing, newMsg);
      expect(result).toHaveLength(2);
    });

    it('should not add duplicate message', () => {
      const existing = [
        { messageId: 'A', timestamp: '2024-01-01T00:00:00Z' },
      ];
      const duplicate = { messageId: 'A', timestamp: '2024-01-01T00:00:00Z' };
      const result = addMessage(existing, duplicate);
      expect(result).toHaveLength(1);
    });

    it('should not add message with invalid ID', () => {
      const existing = [{ messageId: 'A', timestamp: '2024-01-01T00:00:00Z' }];
      const invalid = { content: 'No ID' };
      const result = addMessage(existing, invalid);
      expect(result).toHaveLength(1);
    });

    it('should maintain sort order', () => {
      const existing = [
        { messageId: 'A', timestamp: '2024-01-01T00:00:00Z' },
        { messageId: 'C', timestamp: '2024-01-03T00:00:00Z' },
      ];
      const newMsg = { messageId: 'B', timestamp: '2024-01-02T00:00:00Z' };
      const result = addMessage(existing, newMsg);
      expect(result[0].messageId).toBe('A');
      expect(result[1].messageId).toBe('B');
      expect(result[2].messageId).toBe('C');
    });
  });
});

