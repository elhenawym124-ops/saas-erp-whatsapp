import { DataTypes } from 'sequelize';

/**
 * ✅ WhatsApp Contact Model - Sequelize
 * يخزن جهات اتصال WhatsApp للمؤسسات
 */
export const createWhatsAppContactModel = (sequelize) => {
  const WhatsAppContact = sequelize.define(
    'WhatsAppContact',
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
      sessionId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'WhatsApp session ID',
        field: 'session_id',
      },
      phoneNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Phone number with country code',
        field: 'phone_number',
      },
      jid: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'WhatsApp JID (phone@s.whatsapp.net)',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Contact display name',
      },
      profilePicUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Profile picture URL',
        field: 'profile_pic_url',
      },
      isGroup: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Is this a group chat',
        field: 'is_group',
      },
      isBlocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Is contact blocked',
        field: 'is_blocked',
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Contact tags array',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes about contact',
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last message timestamp',
        field: 'last_message_at',
      },
      lastSeen: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last seen timestamp',
        field: 'last_seen',
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
      tableName: 'whatsapp_contacts',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['organization_id', 'phone_number'],
          name: 'unique_org_phone',
        },
        {
          fields: ['organization_id'],
          name: 'idx_whatsapp_contact_organization',
        },
        {
          fields: ['session_id'],
          name: 'idx_whatsapp_contact_session',
        },
        {
          fields: ['phone_number'],
          name: 'idx_whatsapp_contact_phone',
        },
        {
          fields: ['last_message_at'],
          name: 'idx_whatsapp_contact_last_message',
        },
      ],
      comment: 'WhatsApp contacts table',
    }
  );

  return WhatsAppContact;
};

export default createWhatsAppContactModel;
