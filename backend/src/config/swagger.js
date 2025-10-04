/**
 * Swagger Configuration
 * إعدادات توثيق API
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SaaS ERP System API',
      version: '1.0.0',
      description: 'نظام ERP متكامل مع تكامل WhatsApp - API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'أدخل JWT token الخاص بك',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'حدث خطأ',
            },
            error: {
              type: 'string',
              example: 'تفاصيل الخطأ',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'تمت العملية بنجاح',
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            fullName: {
              type: 'string',
              example: 'أحمد محمد',
            },
            email: {
              type: 'string',
              example: 'ahmed@example.com',
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'admin', 'manager', 'employee'],
              example: 'employee',
            },
            organization: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            invoiceNumber: {
              type: 'string',
              example: 'INV-2025-001',
            },
            customer: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unitPrice: { type: 'number' },
                },
              },
            },
            subtotal: {
              type: 'number',
              example: 1000,
            },
            taxRate: {
              type: 'number',
              example: 14,
            },
            discount: {
              type: 'number',
              example: 50,
            },
            total: {
              type: 'number',
              example: 1090,
            },
            status: {
              type: 'string',
              enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
              example: 'draft',
            },
          },
        },
        Expense: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            description: {
              type: 'string',
              example: 'إيجار المكتب',
            },
            amount: {
              type: 'number',
              example: 5000,
            },
            category: {
              type: 'string',
              enum: ['office', 'travel', 'utilities', 'salaries', 'marketing', 'other'],
              example: 'office',
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'paid'],
              example: 'pending',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication & Authorization',
      },
      {
        name: 'WhatsApp',
        description: 'WhatsApp Integration',
      },
      {
        name: 'Attendance',
        description: 'Attendance Management',
      },
      {
        name: 'Projects',
        description: 'Project Management',
      },
      {
        name: 'Tasks',
        description: 'Task Management',
      },
      {
        name: 'Customers',
        description: 'Customer Management (CRM)',
      },
      {
        name: 'Deals',
        description: 'Deal Management (CRM)',
      },
      {
        name: 'Invoices',
        description: 'Invoice Management (Accounting)',
      },
      {
        name: 'Expenses',
        description: 'Expense Management (Accounting)',
      },
      {
        name: 'Payroll',
        description: 'Payroll Management (Accounting)',
      },
      {
        name: 'Reports',
        description: 'Reports & Analytics',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
