# Frontend - SaaS ERP System

واجهة نظام إدارة المؤسسات الأمامية (Frontend) مبنية على Next.js 14 + React + TypeScript

## 🚀 البدء السريع

### المتطلبات
- Node.js >= 18.0.0
- npm >= 9.0.0

### التثبيت

```bash
# 1. الانتقال لمجلد Frontend
cd frontend

# 2. تثبيت التبعيات
npm install

# 3. إعداد ملف البيئة
cp .env.example .env.local
# قم بتعديل .env.local بالإعدادات المناسبة

# 4. تشغيل في وضع التطوير
npm run dev

# 5. بناء للإنتاج
npm run build
npm start
```

## 📁 هيكل المشروع

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # صفحات المصادقة
│   │   ├── (dashboard)/  # صفحات لوحة التحكم
│   │   ├── layout.tsx    # Layout رئيسي
│   │   └── page.tsx      # الصفحة الرئيسية
│   ├── components/       # مكونات React
│   │   ├── ui/           # مكونات UI أساسية
│   │   ├── forms/        # نماذج
│   │   ├── layouts/      # Layouts
│   │   └── shared/       # مكونات مشتركة
│   ├── lib/              # مكتبات ودوال مساعدة
│   │   ├── api/          # API clients
│   │   ├── hooks/        # Custom hooks
│   │   ├── store/        # State management (Zustand)
│   │   └── utils/        # دوال مساعدة
│   ├── styles/           # ملفات CSS
│   └── types/            # TypeScript types
├── public/               # ملفات ثابتة
├── next.config.js        # إعدادات Next.js
├── tailwind.config.js    # إعدادات Tailwind
└── tsconfig.json         # إعدادات TypeScript
```

## 🎨 التقنيات المستخدمة

- **Next.js 14** - إطار عمل React
- **TypeScript** - لغة البرمجة
- **Tailwind CSS** - تنسيق الواجهة
- **Zustand** - إدارة الحالة
- **React Query** - إدارة البيانات
- **React Hook Form** - إدارة النماذج
- **Zod** - التحقق من البيانات
- **Axios** - HTTP client
- **Recharts** - الرسوم البيانية
- **React Icons** - الأيقونات
- **Sonner** - الإشعارات

## 🔧 الأوامر المتاحة

```bash
npm run dev        # تشغيل في وضع التطوير
npm run build      # بناء للإنتاج
npm start          # تشغيل الإنتاج
npm run lint       # فحص الكود
npm run format     # تنسيق الكود
```

## 📱 الصفحات الرئيسية

### المصادقة
- `/login` - تسجيل الدخول
- `/register` - إنشاء حساب
- `/forgot-password` - استعادة كلمة المرور

### لوحة التحكم
- `/dashboard` - الصفحة الرئيسية
- `/dashboard/attendance` - الحضور والانصراف
- `/dashboard/projects` - المشاريع
- `/dashboard/tasks` - المهام
- `/dashboard/team` - الفريق
- `/dashboard/customers` - العملاء
- `/dashboard/invoices` - الفواتير
- `/dashboard/reports` - التقارير
- `/dashboard/settings` - الإعدادات

## 🎨 المكونات الأساسية

### UI Components
- Button
- Input
- Select
- Modal
- Card
- Table
- Tabs
- Badge
- Avatar
- Dropdown

### Form Components
- LoginForm
- RegisterForm
- AttendanceForm
- ProjectForm
- TaskForm
- InvoiceForm

### Layout Components
- Sidebar
- Navbar
- Header
- Footer
- DashboardLayout

## 🔌 API Integration

```typescript
// مثال على استخدام API
import { useQuery } from 'react-query';
import { api } from '@/lib/api';

function ProjectsList() {
  const { data, isLoading } = useQuery('projects', () => 
    api.get('/projects')
  );
  
  // ...
}
```

## 🌐 المتغيرات البيئية

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=SaaS ERP System
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

## 🎯 الميزات

- ✅ تصميم متجاوب (Responsive)
- ✅ الوضع الليلي (Dark Mode)
- ✅ دعم اللغة العربية (RTL)
- ✅ تحسين الأداء (Performance)
- ✅ SEO محسّن
- ✅ Progressive Web App (PWA)
- ✅ Offline Support
- ✅ Real-time Updates

## 🧪 الاختبارات

```bash
# سيتم إضافة الاختبارات لاحقاً
npm test
```

## 📝 التوثيق

راجع مجلد `/docs` للتوثيق الكامل.

## 🤝 المساهمة

راجع ملف CONTRIBUTING.md في الجذر الرئيسي للمشروع.

## 📄 الترخيص

MIT License

