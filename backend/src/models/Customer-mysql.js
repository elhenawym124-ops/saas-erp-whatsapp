import { DataTypes } from 'sequelize';

/**
 * نموذج العملاء - MySQL/Sequelize
 */
const Customer = (sequelize) => {
  const CustomerModel = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      organizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id',
        },
        field: 'organization_id',
      },

      // معلومات العميل
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },

      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      whatsappNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'whatsapp_number',
      },

      // معلومات الشركة
      company: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      taxNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'tax_number',
      },

      // العنوان
      address: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },

      // معلومات إضافية
      type: {
        type: DataTypes.ENUM('individual', 'company'),
        allowNull: false,
        defaultValue: 'individual',
      },

      status: {
        type: DataTypes.ENUM('active', 'inactive', 'blocked'),
        allowNull: false,
        defaultValue: 'active',
      },

      source: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'مصدر العميل (إعلان، إحالة، موقع، إلخ)',
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },

      // المسؤول عن العميل
      assignedToId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        field: 'assigned_to_id',
      },

      // معلومات مالية
      creditLimit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        field: 'credit_limit',
      },

      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'الرصيد الحالي (موجب = له، سالب = عليه)',
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    },
    {
      tableName: 'customers',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organization_id'],
          name: 'idx_customer_organization',
        },
        {
          fields: ['email'],
          name: 'idx_customer_email',
        },
        {
          fields: ['phone'],
          name: 'idx_customer_phone',
        },
        {
          fields: ['status'],
          name: 'idx_customer_status',
        },
        {
          fields: ['assigned_to_id'],
          name: 'idx_customer_assigned_to',
        },
      ],
    }
  );

  return CustomerModel;
};

export default Customer;
