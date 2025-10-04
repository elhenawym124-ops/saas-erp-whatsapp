import { DataTypes } from 'sequelize';

/**
 * ✅ WhatsApp Message Model - Sequelize
 * يخزن جميع الرسائل المرسلة والمستقبلة
 */
export const createWhatsAppMessageModel = (sequelize) => {
  const WhatsAppMessage = sequelize.define(
    'WhatsAppMessage',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      messageId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'WhatsApp message ID',
      },
      sessionName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'WhatsApp session name',
      },
      direction: {
        type: DataTypes.ENUM('inbound', 'outbound'),
        allowNull: false,
        comment: 'Message direction',
      },
      fromNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Sender phone number',
        field: 'from_number',
      },
      toNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Recipient phone number',
        field: 'to_number',
      },
      messageType: {
        type: DataTypes.ENUM(
          'text',
          'image',
          'video',
          'audio',
          'document',
          'location',
          'contact',
          'button',
          'list'
        ),
        allowNull: false,
        defaultValue: 'text',
        comment: 'Type of message',
        field: 'message_type',
      },
      content: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Message content (text, media, buttons, etc.)',
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Message status',
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When message was sent',
        field: 'sent_at',
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When message was delivered',
        field: 'delivered_at',
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When message was read',
        field: 'read_at',
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error message if failed',
        field: 'error_message',
      },
      organizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Organization ID',
        field: 'organization_id',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User who sent/replied to this message',
        field: 'user_id',
      },
      repliedByName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Name of user who replied',
        field: 'replied_by_name',
      },
      repliedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When user replied',
        field: 'replied_at',
      },
      relatedUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Related user ID',
        field: 'related_user_id',
      },
      relatedCustomerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Related customer ID',
        field: 'related_customer_id',
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional metadata',
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
      tableName: 'whatsapp_messages',
      timestamps: true,
      indexes: [
        // تم تعطيل الفهارس مؤقتاً لتجنب التعارضات
      ],
      comment: 'WhatsApp messages table',
    }
  );

  return WhatsAppMessage;
};

export default createWhatsAppMessageModel;
