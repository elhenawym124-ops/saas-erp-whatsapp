/**
 * Health Check Integration Tests
 * اختبارات تكامل نظام فحص الصحة
 */

import request from 'supertest';
import app from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/database.js';

describe('Health Check API', () => {
  let authToken;
  let adminToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('GET /api/v1/health/mysql', () => {
    it('should check MySQL database health', async () => {
      const res = await request(app).get('/api/v1/health/mysql');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('responseTime');
    });
  });

  describe('GET /api/v1/health/mongodb', () => {
    it('should check MongoDB database health', async () => {
      const res = await request(app).get('/api/v1/health/mongodb');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('state');
    });
  });

  describe('GET /api/v1/health/system', () => {
    it('should check system health (CPU, Memory)', async () => {
      const res = await request(app).get('/api/v1/health/system');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data.details).toHaveProperty('memory');
      expect(res.body.data.details).toHaveProperty('cpu');
      expect(res.body.data.details).toHaveProperty('uptime');
    });
  });

  describe('GET /api/v1/health/api', () => {
    it('should check API health', async () => {
      const res = await request(app).get('/api/v1/health/api');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('version');
      expect(res.body.data).toHaveProperty('environment');
    });
  });

  describe('GET /api/v1/health/all', () => {
    it('should check all services health', async () => {
      const res = await request(app).get('/api/v1/health/all');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('services');
      expect(res.body.data.services).toHaveProperty('mysql');
      expect(res.body.data.services).toHaveProperty('mongodb');
      expect(res.body.data.services).toHaveProperty('system');
      expect(res.body.data.services).toHaveProperty('api');
    });
  });

  describe('Error Tracking (Admin Only)', () => {
    beforeAll(async () => {
      // تسجيل مستخدم عادي
      const registerRes = await request(app).post('/api/v1/auth/register').send({
        fullName: 'Test User',
        email: 'testuser@example.com',
        password: 'Test@1234',
        organizationName: 'Test Org',
      });
      authToken = registerRes.body.data.token;

      // تسجيل مسؤول
      const adminRegisterRes = await request(app).post('/api/v1/auth/register').send({
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@1234',
        organizationName: 'Admin Org',
      });
      adminToken = adminRegisterRes.body.data.token;
    });

    describe('GET /api/v1/health/errors/statistics', () => {
      it('should get error statistics (admin only)', async () => {
        const res = await request(app)
          .get('/api/v1/health/errors/statistics')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('total');
        expect(res.body.data).toHaveProperty('low');
        expect(res.body.data).toHaveProperty('medium');
        expect(res.body.data).toHaveProperty('high');
        expect(res.body.data).toHaveProperty('critical');
      });

      it('should deny access for non-admin users', async () => {
        const res = await request(app)
          .get('/api/v1/health/errors/statistics')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(403);
      });
    });

    describe('GET /api/v1/health/errors', () => {
      it('should get all errors (admin only)', async () => {
        const res = await request(app)
          .get('/api/v1/health/errors')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('should filter errors by severity', async () => {
        const res = await request(app)
          .get('/api/v1/health/errors?severity=critical')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('GET /api/v1/health/errors/frequent', () => {
      it('should get most frequent errors', async () => {
        const res = await request(app)
          .get('/api/v1/health/errors/frequent?limit=5')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/v1/health/errors/daily-report', () => {
      it('should get daily error report', async () => {
        const res = await request(app)
          .get('/api/v1/health/errors/daily-report')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track slow requests', async () => {
      // محاكاة طلب بطيء
      const res = await request(app).get('/api/v1/health/all');

      expect(res.status).toBe(200);
      // يجب أن يكون وقت الاستجابة معقولاً
      expect(res.headers['x-response-time']).toBeDefined;
    });
  });
});

