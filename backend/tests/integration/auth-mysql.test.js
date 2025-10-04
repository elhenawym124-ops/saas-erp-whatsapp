import request from 'supertest';
import app from '../../src/app.js';
import { getTestSequelize } from '../setup.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * اختبارات Integration لنظام المصادقة - MySQL/Sequelize
 */

// استخدام UUID لإنشاء unique values
const getUniqueId = () => {
  return uuidv4().substring(0, 8); // استخدام أول 8 أحرف فقط
};

// Helper function to get models from sequelize
const getModel = (modelName) => {
  const sequelize = getTestSequelize();
  return sequelize.models[modelName];
};

// User-Agent للاختبارات
const TEST_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

describe('Auth API Integration Tests - MySQL', () => {
  describe('POST /api/v1/auth/register', () => {
    test('يجب تسجيل مستخدم جديد بنجاح', async () => {
      const uniqueId = getUniqueId();
      const userData = {
        email: `test-${uniqueId}@example.com`,
        password: 'Test@1234',
        phone: '+201234567890',
        organizationData: {
          name: 'شركة الاختبار',
          domain: `test-company-${uniqueId}`,
        },
        personalInfo: {
          firstName: 'أحمد',
          lastName: 'محمد',
        },
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('User-Agent', TEST_USER_AGENT)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      // التحقق من إنشاء المستخدم في قاعدة البيانات
      const User = getModel('User');
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe(userData.personalInfo.firstName);
    });

    test('يجب رفض التسجيل ببريد إلكتروني مستخدم', async () => {
      const Organization = getModel('Organization');
      const User = getModel('User');

      const uniqueId = getUniqueId();

      // إنشاء مؤسسة ومستخدم
      const org = await Organization.create({
        name: 'شركة موجودة',
        domain: `existing-company-${uniqueId}`,
        email: `info-existing-${uniqueId}@existing.com`,
        phone: '+201111111111',
      });

      const existingEmail = `existing-${uniqueId}@example.com`;
      await User.create({
        organizationId: org.id,
        email: existingEmail,
        password: 'Test@1234',
        phone: '+201111111111',
        firstName: 'محمد',
        lastName: 'علي',
        employeeId: 'EMP001',
        department: 'General',
        position: 'Employee',
        role: 'admin',
      });

      const userData = {
        email: existingEmail,
        password: 'Test@1234',
        phone: '+201234567890',
        organizationData: {
          name: 'شركة جديدة',
          domain: `new-company-${uniqueId}`,
        },
        personalInfo: {
          firstName: 'أحمد',
          lastName: 'محمد',
        },
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('User-Agent', TEST_USER_AGENT)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('البريد الإلكتروني مستخدم بالفعل');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;
    let testOrg;
    let testEmail;

    beforeEach(async () => {
      const Organization = getModel('Organization');
      const User = getModel('User');

      const uniqueId = getUniqueId();
      testEmail = `test-login-${uniqueId}@example.com`;

      // إنشاء مؤسسة ومستخدم للاختبار
      testOrg = await Organization.create({
        name: 'شركة الاختبار',
        domain: `test-company-login-${uniqueId}`,
        email: `info-login-${uniqueId}@test.com`,
        phone: '+201234567890',
      });

      testUser = await User.create({
        organizationId: testOrg.id,
        email: testEmail,
        password: 'Test@1234',
        phone: '+201234567890',
        firstName: 'أحمد',
        lastName: 'محمد',
        employeeId: 'EMP001',
        department: 'IT',
        position: 'Developer',
        role: 'admin',
      });
    });

    test('يجب تسجيل الدخول بنجاح', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', TEST_USER_AGENT)
        .send({
          email: testEmail,
          password: 'Test@1234',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', testEmail);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeDefined(); // Tokens في cookies
    });

    test('يجب رفض تسجيل الدخول بكلمة مرور خاطئة', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', TEST_USER_AGENT)
        .send({
          email: testEmail,
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    test('يجب رفض تسجيل الدخول لمستخدم غير موجود', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', TEST_USER_AGENT)
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@1234',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken;
    let testUser;
    let testOrg;

    // إنشاء مستخدم قبل كل اختبار
    beforeEach(async () => {
      const Organization = getModel('Organization');
      const User = getModel('User');

      const uniqueId = getUniqueId();

      // إنشاء مؤسسة ومستخدم وتسجيل الدخول
      testOrg = await Organization.create({
        name: 'شركة الاختبار - GET /me',
        domain: `test-company-getme-${uniqueId}`,
        email: `info-getme-${uniqueId}@test.com`,
        phone: '+201234567890',
      });

      testUser = await User.create({
        organizationId: testOrg.id,
        email: `test-getme-${uniqueId}@example.com`,
        password: 'Test@1234',
        phone: '+201234567890',
        firstName: 'أحمد',
        lastName: 'محمد',
        employeeId: 'EMP001',
        department: 'IT',
        position: 'Developer',
        role: 'admin',
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', TEST_USER_AGENT)
        .send({
          email: testUser.email,
          password: 'Test@1234',
        });

      accessToken = loginResponse.body.data?.tokens?.accessToken;
    });

    test('يجب الحصول على بيانات المستخدم الحالي', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('User-Agent', TEST_USER_AGENT)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data.firstName).toBe('أحمد');
    });

    test('يجب رفض الطلب بدون Token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('User-Agent', TEST_USER_AGENT)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('يجب رفض الطلب بـ Token غير صحيح', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('User-Agent', TEST_USER_AGENT)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken;
    let testUser;

    // إنشاء مستخدم قبل كل اختبار
    beforeEach(async () => {
      const Organization = getModel('Organization');
      const User = getModel('User');

      const uniqueId = getUniqueId();

      const org = await Organization.create({
        name: 'شركة الاختبار - Logout',
        domain: `test-company-logout-${uniqueId}`,
        email: `info-logout-${uniqueId}@test.com`,
        phone: '+201234567890',
      });

      testUser = await User.create({
        organizationId: org.id,
        email: `test-logout-${uniqueId}@example.com`,
        password: 'Test@1234',
        phone: '+201234567890',
        firstName: 'أحمد',
        lastName: 'محمد',
        employeeId: 'EMP001',
        department: 'IT',
        position: 'Developer',
        role: 'admin',
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', TEST_USER_AGENT)
        .send({
          email: testUser.email,
          password: 'Test@1234',
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    test('يجب تسجيل الخروج بنجاح', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('User-Agent', TEST_USER_AGENT)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('تم تسجيل الخروج بنجاح');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;
    let testEmail;

    beforeEach(async () => {
      const Organization = getModel('Organization');
      const User = getModel('User');

      const uniqueId = getUniqueId();
      testEmail = `test-refresh-${uniqueId}@example.com`;

      const org = await Organization.create({
        name: 'شركة الاختبار',
        domain: `test-company-refresh-${uniqueId}`,
        email: `info-refresh-${uniqueId}@test.com`,
        phone: '+201234567890',
      });

      await User.create({
        organizationId: org.id,
        email: testEmail,
        password: 'Test@1234',
        phone: '+201234567890',
        firstName: 'أحمد',
        lastName: 'محمد',
        employeeId: 'EMP001',
        department: 'IT',
        position: 'Developer',
        role: 'admin',
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', TEST_USER_AGENT)
        .send({
          email: testEmail,
          password: 'Test@1234',
        });

      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    test('يجب تحديث Access Token بنجاح', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('User-Agent', TEST_USER_AGENT)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });
  });
});

