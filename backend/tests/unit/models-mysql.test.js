import { getTestSequelize } from '../setup.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * اختبارات Unit للنماذج - MySQL/Sequelize
 */

// استخدام UUID لإنشاء unique values
const getUniqueId = () => {
  return uuidv4().substring(0, 8); // استخدام أول 8 أحرف فقط
};

// Helper function to get models from sequelize
const getModel = (modelName) => {
  const sequelize = getTestSequelize();
  return sequelize.models[modelName];
};

describe('Organization Model', () => {
  test('يجب إنشاء مؤسسة بنجاح', async () => {
    const Organization = getModel('Organization');

    const orgData = {
      name: 'شركة الاختبار',
      domain: 'test-company',
      email: 'info@test.com',
      phone: '01234567890',
      isActive: true,
    };

    const org = await Organization.create(orgData);

    expect(org.name).toBe(orgData.name);
    expect(org.domain).toBe(orgData.domain);
    expect(org.email).toBe(orgData.email);
    expect(org.isActive).toBe(true);
  });

  test('يجب رفض إنشاء مؤسسة بدون اسم', async () => {
    const Organization = getModel('Organization');

    const orgData = {
      domain: 'test',
      email: 'test@test.com',
      phone: '01234567890',
    };

    await expect(Organization.create(orgData)).rejects.toThrow();
  });

  test('يجب رفض إنشاء مؤسسة بدون domain', async () => {
    const Organization = getModel('Organization');

    const orgData = {
      name: 'Test Org',
      email: 'test@test.com',
      phone: '01234567890',
    };

    await expect(Organization.create(orgData)).rejects.toThrow();
  });
});

describe('User Model', () => {
  let organization;

  beforeEach(async () => {
    const Organization = getModel('Organization');
    const uniqueId = getUniqueId();
    organization = await Organization.create({
      name: 'Test Org',
      domain: `test-org-user-${uniqueId}`,
      email: `org-user-${uniqueId}@test.com`,
      phone: '0123456789',
    });
  });

  test('يجب إنشاء مستخدم بنجاح', async () => {
    const User = getModel('User');

    const userData = {
      organizationId: organization.id,
      email: 'user@test.com',
      password: 'password123',
      phone: '01234567890',
      firstName: 'أحمد',
      lastName: 'محمد',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'Developer',
      role: 'employee',
    };

    const user = await User.create(userData);

    expect(user.email).toBe(userData.email);
    expect(user.firstName).toBe(userData.firstName);
    expect(user.lastName).toBe(userData.lastName);
    expect(user.password).not.toBe(userData.password); // يجب أن تكون مشفرة
  });

  test('يجب تشفير كلمة المرور', async () => {
    const User = getModel('User');

    const user = await User.create({
      organizationId: organization.id,
      email: 'test@test.com',
      password: 'password123',
      phone: '0123456789',
      firstName: 'Test',
      lastName: 'User',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'Dev',
      role: 'employee',
    });

    expect(user.password).not.toBe('password123');
    expect(user.password.length).toBeGreaterThan(20);
  });

  test('يجب مقارنة كلمة المرور بنجاح', async () => {
    const User = getModel('User');

    const user = await User.create({
      organizationId: organization.id,
      email: 'test@test.com',
      password: 'password123',
      phone: '0123456789',
      firstName: 'Test',
      lastName: 'User',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'Dev',
      role: 'employee',
    });

    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);

    const isNotMatch = await user.comparePassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });

  test('يجب الحصول على الاسم الكامل', async () => {
    const User = getModel('User');

    const user = await User.create({
      organizationId: organization.id,
      email: `test-fullname-${Date.now()}@test.com`,
      password: 'password123',
      phone: '0123456789',
      firstName: 'أحمد',
      lastName: 'محمد',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'Dev',
      role: 'employee',
    });

    const fullName = user.getFullName();
    expect(fullName).toBe('أحمد محمد');
  });
});

describe('Customer Model', () => {
  let organization;

  beforeEach(async () => {
    const Organization = getModel('Organization');
    const uniqueId = getUniqueId();
    organization = await Organization.create({
      name: 'Test Org',
      domain: `test-org-customer-${uniqueId}`,
      email: `org-customer-${uniqueId}@test.com`,
      phone: '0123456789',
    });
  });

  test('يجب إنشاء عميل بنجاح', async () => {
    const Customer = getModel('Customer');

    const customerData = {
      organizationId: organization.id,
      name: 'عميل اختبار',
      email: 'customer@test.com',
      phone: '01234567890',
      type: 'individual',
      status: 'active',
    };

    const customer = await Customer.create(customerData);

    expect(customer.name).toBe(customerData.name);
    expect(customer.email).toBe(customerData.email);
    expect(customer.type).toBe(customerData.type);
    expect(customer.status).toBe(customerData.status);
  });

  test('يجب رفض إنشاء عميل بدون اسم', async () => {
    const Customer = getModel('Customer');

    const customerData = {
      organizationId: organization.id,
      email: 'customer@test.com',
      phone: '01234567890',
    };

    await expect(Customer.create(customerData)).rejects.toThrow();
  });
});

describe('Project Model', () => {
  let organization, user, customer;

  beforeEach(async () => {
    const Organization = getModel('Organization');
    const User = getModel('User');
    const Customer = getModel('Customer');

    const uniqueId = getUniqueId();

    organization = await Organization.create({
      name: 'Test Org',
      domain: `test-org-project-${uniqueId}`,
      email: `org-project-${uniqueId}@test.com`,
      phone: '0123456789',
    });

    user = await User.create({
      organizationId: organization.id,
      email: `manager-${uniqueId}@test.com`,
      password: 'password123',
      phone: '0123456789',
      firstName: 'Manager',
      lastName: 'Test',
      employeeId: 'MGR001',
      department: 'IT',
      position: 'Manager',
      role: 'manager',
    });

    customer = await Customer.create({
      organizationId: organization.id,
      name: 'Test Customer',
      email: `customer-${uniqueId}@test.com`,
      phone: '0123456789',
      type: 'individual',
      status: 'active',
    });
  });

  test('يجب إنشاء مشروع بنجاح', async () => {
    const Project = getModel('Project');

    const projectData = {
      organizationId: organization.id,
      name: 'مشروع اختبار',
      code: 'PRJ001',
      description: 'وصف المشروع',
      customerId: customer.id,
      managerId: user.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'planning',
      priority: 'medium',
    };

    const project = await Project.create(projectData);

    expect(project.name).toBe(projectData.name);
    expect(project.code).toBe(projectData.code);
    expect(project.status).toBe(projectData.status);
  });
});

describe('Task Model', () => {
  let organization, user, project;

  beforeEach(async () => {
    const Organization = getModel('Organization');
    const User = getModel('User');
    const Project = getModel('Project');
    const Customer = getModel('Customer');

    const uniqueId = getUniqueId();

    organization = await Organization.create({
      name: 'Test Org',
      domain: `test-org-task-${uniqueId}`,
      email: `org-task-${uniqueId}@test.com`,
      phone: '0123456789',
    });

    user = await User.create({
      organizationId: organization.id,
      email: `user-task-${uniqueId}@test.com`,
      password: 'password123',
      phone: '0123456789',
      firstName: 'Test',
      lastName: 'User',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'Developer',
      role: 'employee',
    });

    const customer = await Customer.create({
      organizationId: organization.id,
      name: 'Test Customer',
      email: `customer-task-${uniqueId}@test.com`,
      phone: '0123456789',
      type: 'individual',
      status: 'active',
    });

    project = await Project.create({
      organizationId: organization.id,
      name: 'Test Project',
      code: 'PRJ001',
      customerId: customer.id,
      managerId: user.id,
      startDate: new Date(),
      status: 'active',
    });
  });

  test('يجب إنشاء مهمة بنجاح', async () => {
    const Task = getModel('Task');

    const taskData = {
      organizationId: organization.id,
      projectId: project.id,
      title: 'مهمة اختبار',
      description: 'وصف المهمة',
      assignedToId: user.id,
      createdById: user.id,
      status: 'todo',
      priority: 'medium',
    };

    const task = await Task.create(taskData);

    expect(task.title).toBe(taskData.title);
    expect(task.status).toBe(taskData.status);
    expect(task.priority).toBe(taskData.priority);
  });
});

