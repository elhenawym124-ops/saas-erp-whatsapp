'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  FaChartLine, 
  FaArrowLeft,
  FaBuilding,
  FaUsers,
  FaCreditCard,
  FaDollarSign
} from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface Analytics {
  organizations: {
    total: number;
    active: number;
    inactive: number;
  };
  users: {
    total: number;
    active: number;
  };
  subscriptions: {
    total: number;
    active: number;
    trial: number;
    expired: number;
    cancelled: number;
  };
  plans: Array<{
    _id: string;
    count: number;
  }>;
  revenue: {
    total: number;
    monthly: number;
    mrr: number;
    arr: number;
  };
  metrics: {
    churnRate: string;
  };
}

export default function SystemAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/super-admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600">فشل تحميل البيانات</p>
        </div>
      </div>
    );
  }

  // تحضير بيانات الرسوم البيانية
  const planNames: { [key: string]: string } = {
    free: 'مجاني',
    basic: 'أساسي',
    pro: 'احترافي',
    enterprise: 'مؤسسات',
  };

  const plansData = analytics.plans.map(plan => ({
    name: planNames[plan._id] || plan._id,
    value: plan.count,
  }));

  const COLORS = ['#9CA3AF', '#3B82F6', '#8B5CF6', '#4F46E5'];

  const subscriptionStatusData = [
    { name: 'نشط', value: analytics.subscriptions.active, color: '#10B981' },
    { name: 'تجريبي', value: analytics.subscriptions.trial, color: '#3B82F6' },
    { name: 'منتهي', value: analytics.subscriptions.expired, color: '#F59E0B' },
    { name: 'ملغي', value: analytics.subscriptions.cancelled, color: '#EF4444' },
  ];

  const revenueData = [
    { name: 'الإيرادات الإجمالية', value: analytics.revenue.total },
    { name: 'الإيرادات الشهرية', value: analytics.revenue.monthly },
    { name: 'MRR', value: analytics.revenue.mrr },
    { name: 'ARR', value: analytics.revenue.arr },
  ];

  const organizationData = [
    { name: 'نشط', value: analytics.organizations.active, color: '#10B981' },
    { name: 'غير نشط', value: analytics.organizations.inactive, color: '#EF4444' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FaChartLine className="ml-3" />
                التحليلات والإحصائيات
              </h1>
              <p className="mt-2 text-indigo-100">تحليلات شاملة لأداء النظام</p>
            </div>
            <Link
              href="/super-admin"
              className="flex items-center bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <FaArrowLeft className="ml-2" />
              العودة للوحة التحكم
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي المؤسسات</p>
                <p className="text-4xl font-bold mt-2">{analytics.organizations.total}</p>
                <p className="text-blue-100 text-sm mt-2">
                  {analytics.organizations.active} نشط
                </p>
              </div>
              <FaBuilding className="text-5xl text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">إجمالي المستخدمين</p>
                <p className="text-4xl font-bold mt-2">{analytics.users.total}</p>
                <p className="text-green-100 text-sm mt-2">
                  {analytics.users.active} نشط
                </p>
              </div>
              <FaUsers className="text-5xl text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">الاشتراكات النشطة</p>
                <p className="text-4xl font-bold mt-2">{analytics.subscriptions.active}</p>
                <p className="text-purple-100 text-sm mt-2">
                  من {analytics.subscriptions.total} إجمالي
                </p>
              </div>
              <FaCreditCard className="text-5xl text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">MRR</p>
                <p className="text-4xl font-bold mt-2">${analytics.revenue.mrr}</p>
                <p className="text-yellow-100 text-sm mt-2">
                  ARR: ${analytics.revenue.arr}
                </p>
              </div>
              <FaDollarSign className="text-5xl text-yellow-200" />
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Plans Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">توزيع الخطط</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={plansData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {plansData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Subscription Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">حالة الاشتراكات</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">الإيرادات</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10B981" name="المبلغ ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Organizations Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">حالة المؤسسات</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={organizationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {organizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">مؤشرات الأداء الرئيسية (KPIs)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">معدل الإلغاء (Churn Rate)</p>
              <p className="text-5xl font-bold text-red-600">{analytics.metrics.churnRate}%</p>
              <p className="text-gray-500 text-xs mt-2">نسبة الاشتراكات الملغاة</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">معدل الاحتفاظ (Retention Rate)</p>
              <p className="text-5xl font-bold text-green-600">
                {(100 - parseFloat(analytics.metrics.churnRate)).toFixed(2)}%
              </p>
              <p className="text-gray-500 text-xs mt-2">نسبة الاشتراكات المستمرة</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">متوسط المستخدمين لكل مؤسسة</p>
              <p className="text-5xl font-bold text-blue-600">
                {analytics.organizations.total > 0 
                  ? (analytics.users.total / analytics.organizations.total).toFixed(1)
                  : 0}
              </p>
              <p className="text-gray-500 text-xs mt-2">مستخدم/مؤسسة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

