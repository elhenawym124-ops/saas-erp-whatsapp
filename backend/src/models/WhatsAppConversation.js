import { DataTypes } from 'sequelize';

/**
 * ✅ WhatsApp Conversation Model - Sequelize
 * يدير المحادثات مع معلومات الحالة والتعيين
 */
export const createWhatsAppConversationModel = (sequelize) => {
  const WhatsAppConversation = sequelize.define(
    'WhatsAppConversation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      organizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Organization ID',
        field: 'organization_id',
      },
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'WhatsApp contact ID',
        field: 'contact_id',
      },
      sessionName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'WhatsApp session name',
        field: 'session_name',
      },
      status: {
        type: DataTypes.ENUM('open', 'closed', 'pending'),
        allowNull: false,
        defaultValue: 'open',
        comment: 'Conversation status',
      },
      assignedTo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User assigned to this conversation',
        field: 'assigned_to',
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Conversation tags',
        defaultValue: [],
      },
      priority: {
        type: DataTypes.ENUM('high', 'medium', 'low'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Conversation priority',
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last message timestamp',
        field: 'last_message_at',
      },
      closedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When conversation was closed',
        field: 'closed_at',
      },
      closedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User who closed the conversation',
        field: 'closed_by',
      },
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
      tableName: 'whatsapp_conversations',
      timestamps: true,
      indexes: [
        {
          name: 'idx_conversations_org_contact',
          fields: ['organization_id', 'contact_id'],
        },
        {
          name: 'idx_conversations_status_assigned',
          fields: ['status', 'assigned_to'],
        },
        {
          name: 'idx_conversations_last_message',
          fields: ['last_message_at'],
        },
      ],
      comment: 'WhatsApp conversations management',
    }
  );

  return WhatsAppConversation;
};

export default createWhatsAppConversationModel;
