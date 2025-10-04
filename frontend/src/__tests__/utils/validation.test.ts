import {
  validatePhoneNumber,
  validateEmail,
  validateUrl,
  isValidContact,
  isValidMessage,
  isValidSession,
} from '@/utils/validation';

describe('validation', () => {
  describe('validatePhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      expect(validatePhoneNumber('201505129931')).toBe(true);
      expect(validatePhoneNumber('15551234567')).toBe(true);
      expect(validatePhoneNumber('966501234567')).toBe(true);
    });

    it('should return true for phone numbers with formatting', () => {
      expect(validatePhoneNumber('+1 (555) 123-4567')).toBe(true);
      expect(validatePhoneNumber('+20 150 512 9931')).toBe(true);
    });

    it('should return false for too short numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('12345')).toBe(false);
    });

    it('should return false for too long numbers', () => {
      expect(validatePhoneNumber('12345678901234567890')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(validatePhoneNumber(null)).toBe(false);
      expect(validatePhoneNumber(undefined)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(validatePhoneNumber(123 as any)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validatePhoneNumber('')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should return true for valid URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('https://example.com/path')).toBe(true);
      expect(validateUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(validateUrl('invalid')).toBe(false);
      expect(validateUrl('not a url')).toBe(false);
      expect(validateUrl('example.com')).toBe(false); // Missing protocol
    });

    it('should return false for null or undefined', () => {
      expect(validateUrl(null)).toBe(false);
      expect(validateUrl(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('isValidContact', () => {
    const validContact = {
      id: 1,
      phoneNumber: '201505129931',
      organizationId: 1,
      name: 'John Doe',
      profilePicture: 'https://example.com/pic.jpg',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should return true for valid contact', () => {
      expect(isValidContact(validContact)).toBe(true);
    });

    it('should return true for contact without optional fields', () => {
      const minimal = {
        id: 1,
        phoneNumber: '201505129931',
        organizationId: 1,
      };
      expect(isValidContact(minimal)).toBe(true);
    });

    it('should return false for missing id', () => {
      const invalid = { ...validContact, id: undefined };
      expect(isValidContact(invalid)).toBe(false);
    });

    it('should return false for invalid id type', () => {
      const invalid = { ...validContact, id: '1' };
      expect(isValidContact(invalid)).toBe(false);
    });

    it('should return false for invalid phoneNumber', () => {
      const invalid = { ...validContact, phoneNumber: '123' };
      expect(isValidContact(invalid)).toBe(false);
    });

    it('should return false for missing organizationId', () => {
      const invalid = { ...validContact, organizationId: undefined };
      expect(isValidContact(invalid)).toBe(false);
    });

    it('should return false for invalid profilePicture URL', () => {
      const invalid = { ...validContact, profilePicture: 'not a url' };
      expect(isValidContact(invalid)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidContact(null)).toBe(false);
      expect(isValidContact(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isValidContact('string')).toBe(false);
      expect(isValidContact(123)).toBe(false);
    });
  });

  describe('isValidMessage', () => {
    const validMessage = {
      id: 1,
      messageId: 'ABC123',
      sessionName: 'session1',
      direction: 'inbound' as const,
      fromNumber: '201505129931',
      toNumber: '966501234567',
      messageType: 'text' as const,
      status: 'delivered' as const,
      content: 'Hello',
      sentAt: '2024-01-01T00:00:00Z',
    };

    it('should return true for valid message', () => {
      expect(isValidMessage(validMessage)).toBe(true);
    });

    it('should return true for message with only messageId', () => {
      const msg = { ...validMessage, id: undefined };
      expect(isValidMessage(msg)).toBe(true);
    });

    it('should return false for missing id and messageId', () => {
      const invalid = { ...validMessage, id: undefined, messageId: undefined };
      expect(isValidMessage(invalid)).toBe(false);
    });

    it('should return false for invalid direction', () => {
      const invalid = { ...validMessage, direction: 'invalid' };
      expect(isValidMessage(invalid)).toBe(false);
    });

    it('should return false for invalid fromNumber', () => {
      const invalid = { ...validMessage, fromNumber: '123' };
      expect(isValidMessage(invalid)).toBe(false);
    });

    it('should return false for invalid toNumber', () => {
      const invalid = { ...validMessage, toNumber: '123' };
      expect(isValidMessage(invalid)).toBe(false);
    });

    it('should return false for invalid messageType', () => {
      const invalid = { ...validMessage, messageType: 'invalid' };
      expect(isValidMessage(invalid)).toBe(false);
    });

    it('should return false for invalid status', () => {
      const invalid = { ...validMessage, status: 'invalid' };
      expect(isValidMessage(invalid)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidMessage(null)).toBe(false);
      expect(isValidMessage(undefined)).toBe(false);
    });
  });

  describe('isValidSession', () => {
    const validSession = {
      id: 1,
      sessionName: 'session1',
      phoneNumber: '201505129931',
      status: 'connected' as const,
      organizationId: 1,
      qrCode: 'QR_CODE_DATA',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should return true for valid session', () => {
      expect(isValidSession(validSession)).toBe(true);
    });

    it('should return false for missing id', () => {
      const invalid = { ...validSession, id: undefined };
      expect(isValidSession(invalid)).toBe(false);
    });

    it('should return false for missing sessionName', () => {
      const invalid = { ...validSession, sessionName: undefined };
      expect(isValidSession(invalid)).toBe(false);
    });

    it('should return false for invalid phoneNumber', () => {
      const invalid = { ...validSession, phoneNumber: '123' };
      expect(isValidSession(invalid)).toBe(false);
    });

    it('should return false for invalid status', () => {
      const invalid = { ...validSession, status: 'invalid' };
      expect(isValidSession(invalid)).toBe(false);
    });

    it('should return true for all valid statuses', () => {
      expect(isValidSession({ ...validSession, status: 'connected' })).toBe(true);
      expect(isValidSession({ ...validSession, status: 'disconnected' })).toBe(true);
      expect(isValidSession({ ...validSession, status: 'connecting' })).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isValidSession(null)).toBe(false);
      expect(isValidSession(undefined)).toBe(false);
    });
  });
});

