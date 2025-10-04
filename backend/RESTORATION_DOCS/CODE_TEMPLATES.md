# 📝 **قوالب الكود الجاهزة**

## 🎯 **Template 1: Sequelize Model**

### **مثال: Customer-mysql.js**

```javascript
import { DataTypes } from 'sequelize';

/**
 * Customer Model (MySQL/Sequelize)
 * نموذج العملاء
 */
const Customer = (sequelize) => {
  return sequelize.define(
    'Customer',
    {
      // Primary Key
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      // Foreign Keys
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_id',
        references: {
          model: 'organizations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      // Basic Info
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 255],
        },
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true,
        },
      },

      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Status
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false,
      },

      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      tableName: 'customers',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['email'],
          name: 'unique_customer_email',
        },
        {
          fields: ['organization_id'],
          name: 'idx_customer_organization',
        },
        {
          fields: ['status'],
          name: 'idx_customer_status',
        },
      ],
    }
  );
};

/**
 * Setup Model Associations
 */
Customer.setupAssociations = (models) => {
  // Customer belongs to Organization
  Customer.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization',
  });

  // Customer has many Deals
  Customer.hasMany(models.Deal, {
    foreignKey: 'customerId',
    as: 'deals',
  });

  // Customer has many Invoices
  Customer.hasMany(models.Invoice, {
    foreignKey: 'customerId',
    as: 'invoices',
  });
};

export default Customer;
```

---

## 🎯 **Template 2: Service**

### **مثال: customerService-mysql.js**

```javascript
import { Op } from 'sequelize';
import db from '../models/index.js';
import logger from '../config/logger.js';

const { Customer, Organization, Deal, Invoice } = db;

/**
 * Customer Service (MySQL)
 * خدمات إدارة العملاء
 */
class CustomerService {
  /**
   * Create new customer
   */
  async createCustomer(data) {
    try {
      const customer = await Customer.create({
        organizationId: data.organizationId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: data.status || 'active',
      });

      logger.info(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Get all customers for organization
   */
  async getCustomers(organizationId, filters = {}) {
    try {
      const where = { organizationId };

      // Apply filters
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } },
          { phone: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      const customers = await Customer.findAll({
        where,
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      });

      return customers;
    } catch (error) {
      logger.error('Error getting customers:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id) {
    try {
      const customer = await Customer.findByPk(id, {
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name'],
          },
          {
            model: Deal,
            as: 'deals',
            limit: 10,
          },
          {
            model: Invoice,
            as: 'invoices',
            limit: 10,
          },
        ],
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      return customer;
    } catch (error) {
      logger.error('Error getting customer:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(id, data) {
    try {
      const customer = await Customer.findByPk(id);

      if (!customer) {
        throw new Error('Customer not found');
      }

      await customer.update({
        name: data.name || customer.name,
        email: data.email || customer.email,
        phone: data.phone || customer.phone,
        address: data.address || customer.address,
        status: data.status || customer.status,
      });

      logger.info(`Customer updated: ${id}`);
      return customer;
    } catch (error) {
      logger.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id) {
    try {
      const customer = await Customer.findByPk(id);

      if (!customer) {
        throw new Error('Customer not found');
      }

      await customer.destroy();

      logger.info(`Customer deleted: ${id}`);
      return { message: 'Customer deleted successfully' };
    } catch (error) {
      logger.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(organizationId, query) {
    try {
      const customers = await Customer.findAll({
        where: {
          organizationId,
          [Op.or]: [
            { name: { [Op.like]: `%${query}%` } },
            { email: { [Op.like]: `%${query}%` } },
            { phone: { [Op.like]: `%${query}%` } },
          ],
        },
        limit: 20,
      });

      return customers;
    } catch (error) {
      logger.error('Error searching customers:', error);
      throw error;
    }
  }
}

export default new CustomerService();
```

---

## 🎯 **Template 3: Controller**

### **مثال: customerController.js**

```javascript
import customerService from '../services/customerService-mysql.js';
import logger from '../config/logger.js';

/**
 * Customer Controller
 * معالج طلبات العملاء
 */

/**
 * Create new customer
 * POST /api/v1/customers
 */
export const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address, status } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const customer = await customerService.createCustomer({
      organizationId: req.user.organizationId,
      name,
      email,
      phone,
      address,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    logger.error('Error in createCustomer:', error);
    next(error);
  }
};

/**
 * Get all customers
 * GET /api/v1/customers
 */
export const getCustomers = async (req, res, next) => {
  try {
    const { status, search, limit, offset } = req.query;

    const customers = await customerService.getCustomers(
      req.user.organizationId,
      { status, search, limit, offset }
    );

    res.status(200).json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (error) {
    logger.error('Error in getCustomers:', error);
    next(error);
  }
};

/**
 * Get customer by ID
 * GET /api/v1/customers/:id
 */
export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await customerService.getCustomerById(id);

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    logger.error('Error in getCustomerById:', error);
    next(error);
  }
};

/**
 * Update customer
 * PUT /api/v1/customers/:id
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, status } = req.body;

    const customer = await customerService.updateCustomer(id, {
      name,
      email,
      phone,
      address,
      status,
    });

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    logger.error('Error in updateCustomer:', error);
    next(error);
  }
};

/**
 * Delete customer
 * DELETE /api/v1/customers/:id
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    await customerService.deleteCustomer(id);

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    logger.error('Error in deleteCustomer:', error);
    next(error);
  }
};

/**
 * Search customers
 * GET /api/v1/customers/search
 */
export const searchCustomers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const customers = await customerService.searchCustomers(
      req.user.organizationId,
      q
    );

    res.status(200).json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (error) {
    logger.error('Error in searchCustomers:', error);
    next(error);
  }
};
```

---

## 🎯 **Template 4: Routes**

### **مثال: customers.js**

```javascript
import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

/**
 * Customer Routes
 * مسارات إدارة العملاء
 */

// Search customers (must be before /:id)
router.get('/search', authenticate, searchCustomers);

// CRUD operations
router.post('/', authenticate, authorize(['admin', 'manager']), createCustomer);
router.get('/', authenticate, getCustomers);
router.get('/:id', authenticate, getCustomerById);
router.put('/:id', authenticate, authorize(['admin', 'manager']), updateCustomer);
router.delete('/:id', authenticate, authorize(['admin']), deleteCustomer);

export default router;
```

---

## 📋 **الخطوات التالية:**

1. ✅ **نسخ Template 1** وإنشاء Model جديد
2. ✅ **تعديل الـ fields** حسب الحاجة
3. ✅ **إضافة الـ Associations** الصحيحة
4. ✅ **نسخ Template 2** وإنشاء Service جديد
5. ✅ **نسخ Template 3** وإنشاء Controller جديد
6. ✅ **نسخ Template 4** وإنشاء Routes جديد
7. ✅ **تسجيل الـ Routes** في `routes/index.js`
8. ✅ **اختبار الـ API** باستخدام curl أو Postman

---

**💡 نصيحة:** ابدأ بـ Customer لأنه الأبسط، ثم انتقل إلى Project و Task!

