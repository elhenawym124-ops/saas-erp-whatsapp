/**
 * Script لتحديث جميع الـ hard-coded URLs في المشروع
 * يستبدل جميع الـ localhost:3000 بـ API Config المركزي
 */

const fs = require('fs');
const path = require('path');

// الملفات التي تحتاج تحديث
const filesToUpdate = [
  'src/app/dashboard/analytics/page.tsx',
  'src/app/dashboard/customers/page.tsx',
  'src/app/dashboard/deals/page.tsx',
  'src/app/dashboard/expenses/page.tsx',
  'src/app/dashboard/invoices/page.tsx',
  'src/app/dashboard/projects/page.tsx',
  'src/app/dashboard/tasks/page.tsx',
  'src/app/dashboard/whatsapp/messages/page.tsx',
  'src/app/dashboard/whatsapp/page.tsx',
  'src/app/super-admin/analytics/page.tsx',
  'src/app/super-admin/organizations/page.tsx',
  'src/app/super-admin/page.tsx',
  'src/app/super-admin/payments/page.tsx',
  'src/app/super-admin/subscriptions/page.tsx',
];

// التحويلات المطلوبة
const replacements = [
  // استبدال axios imports
  {
    from: /import axios from ['"]axios['"];/g,
    to: "import { apiClient, API_ENDPOINTS } from '@/lib/api';",
  },
  
  // استبدال localhost:3000 URLs
  {
    from: /['"]http:\/\/localhost:3000\/api\/v1\/([^'"]+)['"]/g,
    to: (match, endpoint) => {
      // تحويل الـ endpoint إلى API_ENDPOINTS format
      return `API_ENDPOINTS.${convertEndpointToConstant(endpoint)}`;
    },
  },
  
  // استبدال process.env.NEXT_PUBLIC_API_URL patterns
  {
    from: /\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ['"]http:\/\/localhost:3000\/api\/v1['"]\}\/([^`'"]+)/g,
    to: (match, endpoint) => {
      return `API_ENDPOINTS.${convertEndpointToConstant(endpoint)}`;
    },
  },
];

/**
 * تحويل endpoint إلى constant name
 */
function convertEndpointToConstant(endpoint) {
  // إزالة query parameters
  endpoint = endpoint.split('?')[0];
  
  // تحويل إلى uppercase مع underscores
  const parts = endpoint.split('/').filter(p => p);
  
  // معالجة الـ endpoints المختلفة
  if (parts[0] === 'auth') {
    return `AUTH.${parts[1].toUpperCase()}`;
  }
  
  if (parts[0] === 'whatsapp') {
    if (parts[1] === 'sessions') {
      if (parts.length === 2) return 'WHATSAPP.SESSIONS';
      if (parts[3] === 'qr') return `WHATSAPP.QR('${parts[2]}')`;
      return `WHATSAPP.DELETE_SESSION('${parts[2]}')`;
    }
    if (parts[1] === 'contacts') return 'WHATSAPP.CONTACTS';
    if (parts[1] === 'messages') {
      if (parts[2] === 'send') return 'WHATSAPP.SEND_MESSAGE';
      if (parts[2]?.startsWith('send-')) {
        const type = parts[2].replace('send-', '').toUpperCase();
        return `WHATSAPP.SEND_${type}`;
      }
      return 'WHATSAPP.MESSAGES';
    }
    if (parts[1] === 'websocket') return 'WHATSAPP.WEBSOCKET_STATS';
  }
  
  if (parts[0] === 'customers') {
    if (parts.length === 1) return 'CUSTOMERS.LIST';
    if (parts[1] === 'statistics') return 'CUSTOMERS.STATISTICS';
    return `CUSTOMERS.BY_ID('${parts[1]}')`;
  }
  
  if (parts[0] === 'projects') {
    if (parts.length === 1) return 'PROJECTS.LIST';
    if (parts[1] === 'statistics') return 'PROJECTS.STATISTICS';
    return `PROJECTS.BY_ID('${parts[1]}')`;
  }
  
  if (parts[0] === 'tasks') {
    if (parts.length === 1) return 'TASKS.LIST';
    if (parts[1] === 'statistics') return 'TASKS.STATISTICS';
    if (parts[2] === 'status') return `TASKS.UPDATE_STATUS('${parts[1]}')`;
    return `TASKS.BY_ID('${parts[1]}')`;
  }
  
  if (parts[0] === 'invoices') {
    if (parts.length === 1) return 'INVOICES.LIST';
    if (parts[1] === 'statistics') return 'INVOICES.STATISTICS';
    if (parts[2] === 'status') return `INVOICES.UPDATE_STATUS('${parts[1]}')`;
    return `INVOICES.BY_ID('${parts[1]}')`;
  }
  
  if (parts[0] === 'expenses') {
    if (parts.length === 1) return 'EXPENSES.LIST';
    if (parts[1] === 'statistics') return 'EXPENSES.STATISTICS';
    if (parts[2] === 'status') return `EXPENSES.UPDATE_STATUS('${parts[1]}')`;
    return `EXPENSES.BY_ID('${parts[1]}')`;
  }
  
  if (parts[0] === 'deals') {
    if (parts.length === 1) return 'DEALS.LIST';
    if (parts[1] === 'statistics') return 'DEALS.STATISTICS';
    if (parts[2] === 'stage') return `DEALS.UPDATE_STAGE('${parts[1]}')`;
    return `DEALS.BY_ID('${parts[1]}')`;
  }
  
  if (parts[0] === 'reports') {
    return `REPORTS.${parts[1].toUpperCase()}`;
  }
  
  if (parts[0] === 'super-admin') {
    if (parts[1] === 'analytics') return 'SUPER_ADMIN.ANALYTICS';
    if (parts[1] === 'organizations') {
      if (parts.length === 2) return 'SUPER_ADMIN.ORGANIZATIONS';
      if (parts[3] === 'toggle-status') return `SUPER_ADMIN.TOGGLE_ORG_STATUS('${parts[2]}')`;
    }
    if (parts[1] === 'payments') {
      if (parts.length === 2) return 'SUPER_ADMIN.PAYMENTS';
      if (parts[3] === 'mark-paid') return `SUPER_ADMIN.MARK_PAID('${parts[2]}')`;
    }
    if (parts[1] === 'subscriptions') {
      if (parts.length === 2) return 'SUPER_ADMIN.SUBSCRIPTIONS';
      if (parts[3] === 'suspend') return `SUPER_ADMIN.SUSPEND_SUBSCRIPTION('${parts[2]}')`;
      if (parts[3] === 'reactivate') return `SUPER_ADMIN.REACTIVATE_SUBSCRIPTION('${parts[2]}')`;
    }
  }
  
  // fallback
  return `'/${endpoint}'`;
}

/**
 * تحديث ملف واحد
 */
function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // تطبيق جميع التحويلات
  replacements.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

/**
 * تحديث جميع الملفات
 */
function updateAllFiles() {
  console.log('🚀 Starting API URLs update...\n');
  
  filesToUpdate.forEach(file => {
    updateFile(file);
  });
  
  console.log('\n✅ Done! All files updated.');
  console.log('\n⚠️  Note: Please review the changes manually.');
  console.log('Some complex patterns may need manual adjustment.');
}

// تشغيل
updateAllFiles();

