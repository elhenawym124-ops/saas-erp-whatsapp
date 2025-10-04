import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

/**
 * نموذج المستخدمين - MySQL/Sequelize
 * يحتوي على معلومات الموظفين والمستخدمين في النظام
 */
const User = (sequelize) => {
  const UserModel = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // المؤسسة التابع لها
      organizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id',
        },
        field: 'organization_id',
      },

      // معلومات تسجيل الدخول
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },

      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      // المعلومات الشخصية
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
      },

      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
      },

      avatar: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      birthDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'birth_date',
      },

      nationalId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'national_id',
      },

      gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: true,
      },

      // العنوان
      address: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },

      // معلومات العمل
      // ❌ تم تعطيل employeeId لأن العمود غير موجود في الجدول
      // employeeId: {
      //   type: DataTypes.STRING(50),
      //   allowNull: false,
      //   unique: true,
      //   field: 'employee_id',
      // },

      department: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      position: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      hireDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'hire_date',
      },

      salary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      managerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        field: 'manager_id',
      },

      // الصلاحيات
      role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'manager', 'employee'),
        allowNull: false,
        defaultValue: 'employee',
      },

      modulesAccess: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          attendance: true,
          projects: true,
          tasks: true,
          team: false,
          customers: false,
          invoices: false,
          reports: false,
          settings: false,
        },
        field: 'modules_access',
      },

      // إعدادات WhatsApp
      whatsappNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'whatsapp_number',
      },

      whatsappNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'whatsapp_notifications',
      },

      // الحالة
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'terminated'),
        allowNull: false,
        defaultValue: 'active',
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },

      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_email_verified',
      },

      isPhoneVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_phone_verified',
      },

      // معلومات الجلسة
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login',
      },

      lastLoginIP: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'last_login_ip',
      },

      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'refresh_token',
      },

      // إعادة تعيين كلمة المرور
      resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'reset_password_token',
      },

      resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reset_password_expire',
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
      tableName: 'users',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['email'],
          name: 'unique_email',
        },
        // ❌ تم تعطيل index على employee_id لأن العمود غير موجود في الجدول
        // {
        //   unique: true,
        //   fields: ['employee_id'],
        //   name: 'unique_employee_id',
        // },
        {
          fields: ['organization_id'],
          name: 'idx_organization',
        },
        {
          fields: ['role'],
          name: 'idx_role',
        },
        {
          fields: ['status'],
          name: 'idx_status',
        },
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  // Instance Methods
  UserModel.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  UserModel.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
  };

  UserModel.prototype.hasPermission = function (permission) {
    if (this.role === 'super_admin') {
      return true;
    }
    if (this.role === 'admin') {
      return true;
    }
    return false;
  };

  UserModel.prototype.hasModuleAccess = function (moduleName) {
    if (this.role === 'super_admin' || this.role === 'admin') {
      return true;
    }
    return this.modulesAccess && this.modulesAccess[moduleName] === true;
  };

  return UserModel;
};

export default User;
