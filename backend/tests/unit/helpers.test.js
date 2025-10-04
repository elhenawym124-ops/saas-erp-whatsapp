import {
  successResponse,
  errorResponse,
  getPaginationParams,
  getPaginationData,
  cleanObject,
  slugify,
  generateRandomCode,
  formatPhoneForWhatsApp,
  isValidEmail,
  isValidPhone,
} from '../../src/utils/helpers.js';

describe('Helper Functions', () => {
  describe('successResponse', () => {
    test('should create a success response with default values', () => {
      const response = successResponse();
      expect(response).toEqual({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
      });
    });

    test('should create a success response with custom values', () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data, 'Created', 201);
      expect(response).toEqual({
        success: true,
        statusCode: 201,
        message: 'Created',
        data,
      });
    });
  });

  describe('errorResponse', () => {
    test('should create an error response with default values', () => {
      const response = errorResponse();
      expect(response).toEqual({
        success: false,
        statusCode: 500,
        message: 'Error',
        errors: null,
      });
    });

    test('should create an error response with custom values', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const response = errorResponse('Validation failed', 400, errors);
      expect(response).toEqual({
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors,
      });
    });
  });

  describe('getPaginationParams', () => {
    test('should return default pagination params', () => {
      const params = getPaginationParams({});
      expect(params).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      });
    });

    test('should return custom pagination params', () => {
      const params = getPaginationParams({ page: '2', limit: '10' });
      expect(params).toEqual({
        page: 2,
        limit: 10,
        skip: 10,
      });
    });

    test('should limit max page size', () => {
      const params = getPaginationParams({ limit: '200' });
      expect(params.limit).toBe(100);
    });
  });

  describe('getPaginationData', () => {
    test('should calculate pagination data correctly', () => {
      const data = getPaginationData(100, 2, 20);
      expect(data).toEqual({
        total: 100,
        page: 2,
        limit: 20,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    test('should handle first page', () => {
      const data = getPaginationData(100, 1, 20);
      expect(data.hasPrevPage).toBe(false);
      expect(data.hasNextPage).toBe(true);
    });

    test('should handle last page', () => {
      const data = getPaginationData(100, 5, 20);
      expect(data.hasPrevPage).toBe(true);
      expect(data.hasNextPage).toBe(false);
    });
  });

  describe('cleanObject', () => {
    test('should remove null and undefined values', () => {
      const obj = {
        name: 'Test',
        age: null,
        email: undefined,
        active: true,
        count: 0,
        text: '',
      };
      const cleaned = cleanObject(obj);
      expect(cleaned).toEqual({
        name: 'Test',
        active: true,
        count: 0,
      });
    });
  });

  describe('slugify', () => {
    test('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test  Multiple   Spaces')).toBe('test-multiple-spaces');
      expect(slugify('Special!@#$%Characters')).toBe('specialcharacters');
    });
  });

  describe('generateRandomCode', () => {
    test('should generate code with default length', () => {
      const code = generateRandomCode();
      expect(code).toHaveLength(6);
      expect(/^[0-9A-Z]+$/.test(code)).toBe(true);
    });

    test('should generate code with custom length', () => {
      const code = generateRandomCode(10);
      expect(code).toHaveLength(10);
    });
  });

  describe('isValidEmail', () => {
    test('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('should validate correct phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('+201234567890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
    });

    test('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abcdefghij')).toBe(false);
    });
  });

  describe('formatPhoneForWhatsApp', () => {
    test('should format phone number for WhatsApp', () => {
      expect(formatPhoneForWhatsApp('01234567890')).toBe('201234567890@s.whatsapp.net');
      expect(formatPhoneForWhatsApp('+201234567890')).toBe('201234567890@s.whatsapp.net');
      expect(formatPhoneForWhatsApp('201234567890')).toBe('201234567890@s.whatsapp.net');
    });

    test('should remove non-numeric characters', () => {
      expect(formatPhoneForWhatsApp('(012) 345-6789')).toBe('200123456789@s.whatsapp.net');
    });
  });
});

