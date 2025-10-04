import { DataTypes } from 'sequelize';

/**
 * ✅ Message Template Model
 * نموذج قوالب الرسائل الجاهزة
 */
const createMessageTemplateModel = (sequelize) => {
  const MessageTemplate = sequelize.define(
    'MessageTemplate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      organizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'organization_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      shortcut: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'usage_count',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
      },
    },
    {
      tableName: 'message_templates',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organization_id'],
        },
        {
          fields: ['category'],
        },
        {
          fields: ['shortcut'],
        },
      ],
    }
  );

  return MessageTemplate;
};

export default createMessageTemplateModel;
