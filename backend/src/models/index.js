/**
 * ملف تصدير جميع النماذج - Sequelize/MySQL
 * يسهل استيراد النماذج من مكان واحد
 */

import { getSequelize } from '../config/database.js';
import logger from '../config/logger.js';
import WhatsAppSessionModel from './WhatsAppSession.js';
import WhatsAppMessageModel from './WhatsAppMessage.js';
import WhatsAppContactModel from './WhatsAppContact.js';
import WhatsAppConversationModel from './WhatsAppConversation.js';
import ConversationNoteModel from './ConversationNote.js';
import MessageTemplateModel from './MessageTemplate.js';
import OrganizationModel from './Organization.js';
import UserModel from './User-mysql.js';
import CustomerModel from './Customer-mysql.js';
import ProjectModel from './Project-mysql.js';
import TaskModel from './Task-mysql.js';

// متغير لحفظ النماذج المهيأة
const models = {};
let isInitialized = false;
let currentSequelize = null; // حفظ الـ sequelize instance الحالي

/**
 * تهيئة جميع النماذج مع Sequelize
 * @param {Sequelize} customSequelize - اختياري: instance من Sequelize للاختبارات
 */
const initializeModels = async (customSequelize = null) => {
  if (isInitialized && !customSequelize) {
    return models;
  }

  try {
    const sequelize = customSequelize || getSequelize();
    currentSequelize = sequelize; // حفظ الـ instance

    // تهيئة النماذج الأساسية
    models.Organization = OrganizationModel(sequelize);
    models.User = UserModel(sequelize);
    models.Customer = CustomerModel(sequelize);
    models.Project = ProjectModel(sequelize);
    models.Task = TaskModel(sequelize);
    models.WhatsAppSession = WhatsAppSessionModel(sequelize);
    models.WhatsAppMessage = WhatsAppMessageModel(sequelize);
    models.WhatsAppContact = WhatsAppContactModel(sequelize);
    models.WhatsAppConversation = WhatsAppConversationModel(sequelize);
    models.ConversationNote = ConversationNoteModel(sequelize);
    models.MessageTemplate = MessageTemplateModel(sequelize);

    // تعريف العلاقات
    setupAssociations();

    // مزامنة قاعدة البيانات (فقط إذا لم يكن للاختبارات)
    if (!customSequelize) {
      // ✅ معطل لتجنب مشاكل الـ indexes - استخدم migrations بدلاً من ذلك
      // await sequelize.sync({ force: false, alter: true });
      logger.info('✅ Skipping sync - using migrations instead');
    }

    if (!customSequelize) {
      isInitialized = true;
    }
    logger.info('✅ Models initialized successfully');
    return models;
  } catch (error) {
    console.error('❌ Error initializing models:', error);
    throw error;
  }
};

/**
 * إعداد العلاقات بين النماذج
 */
const setupAssociations = () => {
  const {
    Organization,
    User,
    Customer,
    Project,
    Task,
    WhatsAppSession,
    WhatsAppMessage,
    WhatsAppContact,
    WhatsAppConversation,
    ConversationNote,
  } = models;

  // علاقة Organization مع User
  if (Organization && User) {
    Organization.hasMany(User, {
      foreignKey: 'organizationId',
      as: 'users',
    });

    User.belongsTo(Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
  }

  // علاقة User مع User (Manager)
  if (User) {
    User.belongsTo(User, {
      foreignKey: 'managerId',
      as: 'manager',
    });

    User.hasMany(User, {
      foreignKey: 'managerId',
      as: 'subordinates',
    });
  }

  // علاقة Organization مع Customer
  if (Organization && Customer) {
    Organization.hasMany(Customer, {
      foreignKey: 'organizationId',
      as: 'customers',
    });

    Customer.belongsTo(Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
  }

  // علاقة Customer مع User (المسؤول)
  if (Customer && User) {
    Customer.belongsTo(User, {
      foreignKey: 'assignedToId',
      as: 'assignedTo',
    });

    User.hasMany(Customer, {
      foreignKey: 'assignedToId',
      as: 'assignedCustomers',
    });
  }

  // علاقة Organization مع Project
  if (Organization && Project) {
    Organization.hasMany(Project, {
      foreignKey: 'organizationId',
      as: 'projects',
    });

    Project.belongsTo(Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
  }

  // علاقة Project مع Customer
  if (Project && Customer) {
    Project.belongsTo(Customer, {
      foreignKey: 'customerId',
      as: 'customer',
    });

    Customer.hasMany(Project, {
      foreignKey: 'customerId',
      as: 'projects',
    });
  }

  // علاقة Project مع User (المدير)
  if (Project && User) {
    Project.belongsTo(User, {
      foreignKey: 'managerId',
      as: 'manager',
    });

    User.hasMany(Project, {
      foreignKey: 'managerId',
      as: 'managedProjects',
    });
  }

  // علاقة Organization مع Task
  if (Organization && Task) {
    Organization.hasMany(Task, {
      foreignKey: 'organizationId',
      as: 'tasks',
    });

    Task.belongsTo(Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
  }

  // علاقة Task مع Project
  if (Task && Project) {
    Task.belongsTo(Project, {
      foreignKey: 'projectId',
      as: 'project',
    });

    Project.hasMany(Task, {
      foreignKey: 'projectId',
      as: 'tasks',
    });
  }

  // علاقة Task مع User (المسؤول)
  if (Task && User) {
    Task.belongsTo(User, {
      foreignKey: 'assignedToId',
      as: 'assignedTo',
    });

    User.hasMany(Task, {
      foreignKey: 'assignedToId',
      as: 'assignedTasks',
    });

    Task.belongsTo(User, {
      foreignKey: 'createdById',
      as: 'createdBy',
    });

    User.hasMany(Task, {
      foreignKey: 'createdById',
      as: 'createdTasks',
    });
  }

  // علاقة Task مع Task (المهام الفرعية)
  if (Task) {
    Task.belongsTo(Task, {
      foreignKey: 'parentTaskId',
      as: 'parentTask',
    });

    Task.hasMany(Task, {
      foreignKey: 'parentTaskId',
      as: 'subtasks',
    });
  }

  // علاقة Organization مع WhatsAppSession
  if (Organization && WhatsAppSession) {
    Organization.hasMany(WhatsAppSession, {
      foreignKey: 'organizationId',
      as: 'whatsappSessions',
    });

    WhatsAppSession.belongsTo(Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
  }

  // علاقة Organization مع WhatsAppMessage - مؤقتاً معطلة
  // if (Organization && WhatsAppMessage) {
  //   Organization.hasMany(WhatsAppMessage, {
  //     foreignKey: 'organizationId',
  //     as: 'whatsappMessages',
  //   });

  //   WhatsAppMessage.belongsTo(Organization, {
  //     foreignKey: 'organizationId',
  //     as: 'organization',
  //   });
  // }

  // علاقة WhatsAppSession مع WhatsAppMessage - مؤقتاً معطلة
  // if (WhatsAppSession && WhatsAppMessage) {
  //   WhatsAppSession.hasMany(WhatsAppMessage, {
  //     foreignKey: 'sessionName',
  //     sourceKey: 'sessionName',
  //     as: 'messages',
  //   });

  //   WhatsAppMessage.belongsTo(WhatsAppSession, {
  //     foreignKey: 'sessionName',
  //     targetKey: 'sessionName',
  //     as: 'session',
  //   });
  // }

  // علاقة WhatsAppMessage مع User (المستخدم الذي أرسل/رد على الرسالة)
  if (WhatsAppMessage && User) {
    WhatsAppMessage.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
    });

    User.hasMany(WhatsAppMessage, {
      foreignKey: 'userId',
      as: 'whatsappMessages',
    });
  }

  // علاقة WhatsAppConversation مع Organization
  if (WhatsAppConversation && Organization) {
    WhatsAppConversation.belongsTo(Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });

    Organization.hasMany(WhatsAppConversation, {
      foreignKey: 'organizationId',
      as: 'whatsappConversations',
    });
  }

  // علاقة WhatsAppConversation مع WhatsAppContact
  if (WhatsAppConversation && WhatsAppContact) {
    WhatsAppConversation.belongsTo(WhatsAppContact, {
      foreignKey: 'contactId',
      as: 'contact',
    });

    WhatsAppContact.hasMany(WhatsAppConversation, {
      foreignKey: 'contactId',
      as: 'conversations',
    });
  }

  // علاقة WhatsAppConversation مع User (assigned_to)
  if (WhatsAppConversation && User) {
    WhatsAppConversation.belongsTo(User, {
      foreignKey: 'assignedTo',
      as: 'assignedUser',
    });

    User.hasMany(WhatsAppConversation, {
      foreignKey: 'assignedTo',
      as: 'assignedConversations',
    });

    // علاقة مع User (closed_by)
    WhatsAppConversation.belongsTo(User, {
      foreignKey: 'closedBy',
      as: 'closedByUser',
    });

    User.hasMany(WhatsAppConversation, {
      foreignKey: 'closedBy',
      as: 'closedConversations',
    });
  }

  // علاقة ConversationNote مع WhatsAppConversation
  if (ConversationNote && WhatsAppConversation) {
    ConversationNote.belongsTo(WhatsAppConversation, {
      foreignKey: 'conversationId',
      as: 'conversation',
    });

    WhatsAppConversation.hasMany(ConversationNote, {
      foreignKey: 'conversationId',
      as: 'notes',
    });
  }

  // علاقة ConversationNote مع User
  if (ConversationNote && User) {
    ConversationNote.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
    });

    User.hasMany(ConversationNote, {
      foreignKey: 'userId',
      as: 'conversationNotes',
    });
  }

  logger.info('✅ Model associations set up successfully');
};

/**
 * الحصول على نموذج معين
 */
const getModel = (modelName) => {
  // إذا كان هناك sequelize instance محفوظ، استخدم models منه
  if (currentSequelize && currentSequelize.models && currentSequelize.models[modelName]) {
    return currentSequelize.models[modelName];
  }

  // السماح بالوصول للنماذج حتى لو لم يتم تهيئتها (للاختبارات)
  if (!models[modelName]) {
    throw new Error(
      `Model ${modelName} not found. Available models: ${Object.keys(models).join(', ')}`
    );
  }

  return models[modelName];
};

/**
 * الحصول على الـ Sequelize instance الحالي
 */
const getCurrentSequelize = () => currentSequelize;

export { initializeModels, getModel, models, getCurrentSequelize };
export default models;
