/**
 * Subscription Integration Tests
 * اختبارات تكامل لنظام الاشتراكات
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Organization from '../../src/models/Organization.js';
import Subscription from '../../src/models/Subscription.js';
import Payment from '../../src/models/Payment.js';

describe('Subscription API Tests', () => {
  let superAdminToken;
  let adminToken;
  let testOrganization;
  let testSubscription;

  beforeAll(async () => {
    // الاتصال بقاعدة البيانات للاختبار
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/saas_erp_test');
    }
  });

  afterAll(async () => {
    // تنظيف قاعدة البيانات
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Subscription.deleteMany({});
    await Payment.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // تنظيف البيانات قبل كل اختبار
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Subscription.deleteMany({});
    await Payment.deleteMany({});

    // إنشاء مؤسسة Super Admin
    const superAdminOrg = await Organization.create({
      name: 'Super Admin Org',
      domain: 'superadmin',
      industry: 'Technology',
      size: 'enterprise',
      contactInfo: {
        email: 'admin@test.com',
        phone: '+1234567890',
        address: {
          street: 'Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
        },
      },
      isActive: true,
    });

    // إنشاء Super Admin
    const superAdmin = await User.create({
      organization: superAdminOrg._id,
      email: 'superadmin@test.com',
      password: 'Password@123',
      phone: '+1234567890',
      personalInfo: {
        firstName: 'Super',
        lastName: 'Admin',
        gender: 'male',
      },
      workInfo: {
        employeeId: 'SA-001',
        department: 'Management',
        position: 'System Administrator',
        hireDate: new Date(),
      },
      role: 'super_admin',
      status: 'active',
    });

    // تسجيل دخول Super Admin
    const superAdminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@test.com',
        password: 'Password@123',
      });

    superAdminToken = superAdminLogin.body.data.token;

    // إنشاء مؤسسة اختبار
    testOrganization = await Organization.create({
      name: 'Test Organization',
      domain: 'testorg',
      industry: 'Technology',
      size: 'small',
      contactInfo: {
        email: 'test@testorg.com',
        phone: '+1234567891',
        address: {
          street: 'Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
        },
      },
      isActive: true,
    });

    // إنشاء Admin للمؤسسة
    const admin = await User.create({
      organization: testOrganization._id,
      email: 'admin@testorg.com',
      password: 'Password@123',
      phone: '+1234567891',
      personalInfo: {
        firstName: 'Test',
        lastName: 'Admin',
        gender: 'male',
      },
      workInfo: {
        employeeId: 'EMP-001',
        department: 'Management',
        position: 'Administrator',
        hireDate: new Date(),
      },
      role: 'admin',
      status: 'active',
    });

    // تسجيل دخول Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@testorg.com',
        password: 'Password@123',
      });

    adminToken = adminLogin.body.data.token;

    // إنشاء اشتراك اختبار
    testSubscription = await Subscription.create({
      organization: testOrganization._id,
      plan: 'basic',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوم
      billingCycle: 'monthly',
      autoRenew: true,
    });
  });

  describe('GET /api/v1/super-admin/analytics', () => {
    it('should get system analytics (Super Admin only)', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/analytics')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('organizations');
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('subscriptions');
      expect(response.body.data).toHaveProperty('revenue');
      expect(response.body.data).toHaveProperty('metrics');
    });

    it('should deny access for non-super-admin', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/super-admin/subscriptions', () => {
    it('should get all subscriptions (Super Admin only)', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/subscriptions')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('subscriptions');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.subscriptions)).toBe(true);
    });

    it('should filter subscriptions by status', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/subscriptions?status=active')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.subscriptions.every(sub => sub.status === 'active')).toBe(true);
    });

    it('should filter subscriptions by plan', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/subscriptions?plan=basic')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.subscriptions.every(sub => sub.plan === 'basic')).toBe(true);
    });
  });

  describe('PATCH /api/v1/super-admin/subscriptions/:organizationId/suspend', () => {
    it('should suspend a subscription (Super Admin only)', async () => {
      const response = await request(app)
        .patch(`/api/v1/super-admin/subscriptions/${testOrganization._id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          reason: 'Payment overdue',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('suspended');
    });

    it('should deny access for non-super-admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/super-admin/subscriptions/${testOrganization._id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/super-admin/subscriptions/:organizationId/reactivate', () => {
    it('should reactivate a suspended subscription', async () => {
      // تعليق الاشتراك أولاً
      await Subscription.findByIdAndUpdate(testSubscription._id, { status: 'suspended' });

      const response = await request(app)
        .patch(`/api/v1/super-admin/subscriptions/${testOrganization._id}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });
  });

  describe('GET /api/v1/super-admin/organizations', () => {
    it('should get all organizations', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('organizations');
      expect(Array.isArray(response.body.data.organizations)).toBe(true);
    });

    it('should search organizations by name', async () => {
      const response = await request(app)
        .get('/api/v1/super-admin/organizations?search=Test')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.organizations.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/v1/super-admin/organizations/:id/toggle-status', () => {
    it('should toggle organization status', async () => {
      const response = await request(app)
        .patch(`/api/v1/super-admin/organizations/${testOrganization._id}/toggle-status`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(!testOrganization.isActive);
    });
  });

  describe('GET /api/v1/super-admin/payments', () => {
    it('should get all payments', async () => {
      // إنشاء دفعة اختبار
      await Payment.create({
        organization: testOrganization._id,
        subscription: testSubscription._id,
        invoiceNumber: 'INV-TEST-001',
        amount: 99,
        currency: 'USD',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        billingPeriod: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        planAtPayment: 'basic',
        items: [
          {
            description: 'Basic Plan - Monthly',
            quantity: 1,
            unitPrice: 99,
            total: 99,
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/super-admin/payments')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payments');
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });
  });

  describe('Subscription Model Tests', () => {
    it('should check if can add user', () => {
      expect(testSubscription.canAddUser()).toBe(true);
    });

    it('should check if can add project', () => {
      expect(testSubscription.canAddProject()).toBe(true);
    });

    it('should check if can add WhatsApp session', () => {
      expect(testSubscription.canAddWhatsAppSession()).toBe(true);
    });

    it('should calculate days remaining', () => {
      const daysRemaining = testSubscription.daysRemaining;
      expect(daysRemaining).toBeGreaterThan(0);
      expect(daysRemaining).toBeLessThanOrEqual(30);
    });
  });
});

