import { DataTypes } from 'sequelize';

/**
 * نموذج المشاريع - MySQL/Sequelize
 */
const Project = (sequelize) => {
  const ProjectModel = sequelize.define(
    'Project',
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

      // معلومات المشروع
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'كود المشروع الفريد',
      },

      // العميل
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
        field: 'customer_id',
      },

      // مدير المشروع
      managerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        field: 'manager_id',
      },

      // التواريخ
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'start_date',
      },

      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'end_date',
      },

      deadline: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'الموعد النهائي للتسليم',
      },

      // الحالة
      status: {
        type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planning',
      },

      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },

      // الميزانية
      budget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      actualCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'actual_cost',
      },

      // التقدم
      progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
        comment: 'نسبة الإنجاز (0-100)',
      },

      // معلومات إضافية
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },

      attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: 'projects',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['code'],
          name: 'unique_code',
        },
        {
          fields: ['organization_id'],
          name: 'idx_project_organization',
        },
        {
          fields: ['customer_id'],
          name: 'idx_project_customer',
        },
        {
          fields: ['manager_id'],
          name: 'idx_project_manager',
        },
        {
          fields: ['status'],
          name: 'idx_project_status',
        },
        {
          fields: ['priority'],
          name: 'idx_project_priority',
        },
      ],
    }
  );

  return ProjectModel;
};

export default Project;
