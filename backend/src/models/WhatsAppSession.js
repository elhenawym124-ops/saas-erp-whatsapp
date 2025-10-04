import { DataTypes } from 'sequelize';
import { getSequelize } from '../config/database.js';
import { WHATSAPP_SESSION_STATUS } from '../utils/constants.js';

/**
 * نموذج جلسات WhatsApp
 * يدير اتصالات WhatsApp للمؤسسات - MySQL/Sequelize
 */
const WhatsAppSession = (sequelize) => {
  return sequelize.define(
    'WhatsAppSession',
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

      sessionName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'default',
        field: 'session_name',
      },

      phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'phone_number',
      },

      status: {
        type: DataTypes.ENUM(...Object.values(WHATSAPP_SESSION_STATUS)),
        allowNull: false,
        defaultValue: WHATSAPP_SESSION_STATUS.DISCONNECTED,
      },

      sessionData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'session_data',
      },

      lastConnected: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_connected',
      },

      lastDisconnected: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_disconnected',
      },

      connectionAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'connection_attempts',
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
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
      tableName: 'whatsapp_sessions',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['organization_id', 'session_name'],
          name: 'unique_org_session',
        },
        {
          fields: ['status'],
          name: 'idx_whatsapp_session_status',
        },
        {
          fields: ['is_active'],
          name: 'idx_whatsapp_session_is_active',
        },
      ],
    }
  );
};

// تصدير factory function
export default WhatsAppSession;
