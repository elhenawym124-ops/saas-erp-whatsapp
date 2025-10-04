import { DataTypes } from 'sequelize';

/**
 * نموذج المهام - MySQL/Sequelize
 */
const Task = (sequelize) => {
  const TaskModel = sequelize.define(
    'Task',
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

      // المشروع
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id',
        },
        field: 'project_id',
      },

      // معلومات المهمة
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // المسؤول عن المهمة
      assignedToId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        field: 'assigned_to_id',
      },

      // من أنشأ المهمة
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        field: 'created_by_id',
      },

      // التواريخ
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'start_date',
      },

      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'due_date',
      },

      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },

      // الحالة
      status: {
        type: DataTypes.ENUM('todo', 'in_progress', 'review', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'todo',
      },

      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
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
      },

      // الوقت المقدر والفعلي
      estimatedHours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: 'estimated_hours',
      },

      actualHours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'actual_hours',
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

      // المهمة الأب (للمهام الفرعية)
      parentTaskId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id',
        },
        field: 'parent_task_id',
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
      tableName: 'tasks',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organization_id'],
          name: 'idx_task_organization',
        },
        {
          fields: ['project_id'],
          name: 'idx_task_project',
        },
        {
          fields: ['assigned_to_id'],
          name: 'idx_task_assigned_to',
        },
        {
          fields: ['created_by_id'],
          name: 'idx_task_created_by',
        },
        {
          fields: ['status'],
          name: 'idx_task_status',
        },
        {
          fields: ['priority'],
          name: 'idx_task_priority',
        },
        {
          fields: ['parent_task_id'],
          name: 'idx_task_parent_task',
        },
      ],
    }
  );

  return TaskModel;
};

export default Task;
