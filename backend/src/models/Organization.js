import { DataTypes } from 'sequelize';

/**
 * نموذج المؤسسات - MySQL/Sequelize
 * يحتوي على معلومات الشركات/المؤسسات المسجلة في النظام
 */
const Organization = (sequelize) => {
  return sequelize.define(
    'Organization',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [2, 100],
        },
      },

      domain: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z0-9-]+$/,
        },
      },

      logo: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
        allowNull: true,
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },

      settings: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
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
      tableName: 'organizations',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['domain'],
          name: 'unique_domain',
        },
        {
          fields: ['is_active'],
          name: 'idx_is_active',
        },
      ],
    }
  );
};

export default Organization;
