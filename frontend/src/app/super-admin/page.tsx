'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  FaBuilding, 
  FaUsers, 
  FaCreditCard, 
  FaDollarSign,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';

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

export default function SuperAdminDashboard() {
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
          <p className="text-gray-600">فشل تحميل البيانات</p>
        </div>
      </div>
    );
  }

  const planNames: { [key: string]: string } = {
    free: 'مجاني',
    basic: 'أساسي',
    pro: 'احترافي',
    enterprise: 'مؤسسات',
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold">لوحة تحكم Super Admin</h1>
          <p className="mt-2 text-purple-100">إدارة شاملة لجميع المؤسسات والاشتراكات</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Organizations */}
          <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">المؤسسات</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.organizations.total}</p>
                <p className="text-sm text-green-600 mt-1">
                  {analytics.organizations.active} نشط
                </p>
              </div>
              <FaBuilding className="text-blue-500 text-4xl" />
            </div>
          </div>

          {/* Users */}
          <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">المستخدمين</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.users.total}</p>
                <p className="text-sm text-green-600 mt-1">
                  {analytics.users.active} نشط
                </p>
              </div>
              <FaUsers className="text-green-500 text-4xl" />
            </div>
          </div>

          {/* Subscriptions */}
          <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">الاشتراكات</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{analytics.subscriptions.total}</p>
                <p className="text-sm text-green-600 mt-1">
                  {analytics.subscriptions.active} نشط
                </p>
              </div>
              <FaCreditCard className="text-purple-500 text-4xl" />
            </div>
          </div>

          {/* MRR */}
          <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">الإيرادات الشهرية</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">${analytics.revenue.mrr}</p>
                <p className="text-sm text-gray-600 mt-1">
                  ARR: ${analytics.revenue.arr}
                </p>
              </div>
              <FaDollarSign className="text-yellow-500 text-4xl" />
            </div>
          </div>
        </div>

        {/* Revenue & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaChartLine className="ml-2 text-green-600" />
              الإيرادات
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700">إجمالي الإيرادات</span>
                <span className="text-2xl font-bold text-green-600">${analytics.revenue.total}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700">الإيرادات الشهرية</span>
                <span className="text-2xl font-bold text-blue-600">${analytics.revenue.monthly}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <span className="text-gray-700">MRR (الإيرادات الشهرية المتكررة)</span>
                <span className="text-2xl font-bold text-purple-600">${analytics.revenue.mrr}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                <span className="text-gray-700">ARR (الإيرادات السنوية المتكررة)</span>
                <span className="text-2xl font-bold text-indigo-600">${analytics.revenue.arr}</span>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaCreditCard className="ml-2 text-purple-600" />
              حالة الاشتراكات
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-600 ml-2" />
                  <span className="text-gray-700">نشط</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{analytics.subscriptions.active}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <FaClock className="text-blue-600 ml-2" />
                  <span className="text-gray-700">تجريبي</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{analytics.subscriptions.trial}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-yellow-600 ml-2" />
                  <span className="text-gray-700">منتهي</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{analytics.subscriptions.expired}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-600 ml-2" />
                  <span className="text-gray-700">ملغي</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{analytics.subscriptions.cancelled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Distribution & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Plans Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">توزيع الخطط</h2>
            <div className="space-y-3">
              {analytics.plans.map((plan) => (
                <div key={plan._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">{planNames[plan._id] || plan._id}</span>
                  <span className="text-xl font-bold text-blue-600">{plan.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">المؤشرات الرئيسية</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                <p className="text-gray-700 text-sm mb-2">معدل الإلغاء (Churn Rate)</p>
                <p className="text-3xl font-bold text-red-600">{analytics.metrics.churnRate}%</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <p className="text-gray-700 text-sm mb-2">معدل الاحتفاظ</p>
                <p className="text-3xl font-bold text-green-600">{(100 - parseFloat(analytics.metrics.churnRate)).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/super-admin/organizations"
              className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <FaBuilding className="ml-2 text-blue-600" />
              <span className="text-blue-600 font-medium">إدارة المؤسسات</span>
            </Link>
            <Link
              href="/super-admin/subscriptions"
              className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <FaCreditCard className="ml-2 text-purple-600" />
              <span className="text-purple-600 font-medium">إدارة الاشتراكات</span>
            </Link>
            <Link
              href="/super-admin/payments"
              className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <FaDollarSign className="ml-2 text-green-600" />
              <span className="text-green-600 font-medium">سجل المدفوعات</span>
            </Link>
            <Link
              href="/super-admin/users"
              className="flex items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              <FaUsers className="ml-2 text-yellow-600" />
              <span className="text-yellow-600 font-medium">جميع المستخدمين</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

