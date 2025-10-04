'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organization: {
    id: string;
    name: string;
    domain: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error: any) {
        console.error('Fetch user error:', error);
        toast.error('فشل في تحميل بيانات المستخدم');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Card */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-2xl font-bold text-gray-900">
            مرحباً، {user?.fullName || 'المستخدم'}!
          </h2>
          <p className="mt-2 text-gray-600">
            {user?.organization?.name || 'المؤسسة'}
          </p>
          <div className="mt-4 flex gap-4">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {user?.role === 'super_admin' ? 'مدير النظام' : user?.role}
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Stat Card 1 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الموظفين</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المشاريع</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المهام</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Stat Card 4 - WhatsApp */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">WhatsApp</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الوحدات الرئيسية</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* WhatsApp Messages */}
            <a
              href="/dashboard/whatsapp/messages"
              className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-green-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">💬 الدردشة</h4>
              </div>
              <p className="text-sm text-gray-700">
                إرسال واستقبال رسائل WhatsApp
              </p>
            </a>

            {/* WhatsApp Settings */}
            <a
              href="/dashboard/whatsapp"
              className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-emerald-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">⚙️ إعدادات WhatsApp</h4>
              </div>
              <p className="text-sm text-gray-700">
                إدارة الجلسات والإعدادات
              </p>
            </a>

            {/* Attendance */}
            <a
              href="/dashboard/attendance"
              className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-blue-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">الحضور والانصراف</h4>
              </div>
              <p className="text-sm text-gray-700">
                تسجيل الحضور ومتابعة الموظفين
              </p>
            </a>

            {/* Customers */}
            <a
              href="/dashboard/customers"
              className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-purple-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">العملاء</h4>
              </div>
              <p className="text-sm text-gray-700">
                إدارة قاعدة بيانات العملاء
              </p>
            </a>

            {/* Deals */}
            <a
              href="/dashboard/deals"
              className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-orange-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">الصفقات</h4>
              </div>
              <p className="text-sm text-gray-700">
                تتبع وإدارة صفقات المبيعات
              </p>
            </a>

            {/* Projects */}
            <a
              href="/dashboard/projects"
              className="rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-yellow-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">المشاريع</h4>
              </div>
              <p className="text-sm text-gray-700">
                إدارة المشاريع والمهام
              </p>
            </a>

            {/* Tasks */}
            <a
              href="/dashboard/tasks"
              className="rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-pink-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">المهام</h4>
              </div>
              <p className="text-sm text-gray-700">
                متابعة وإدارة المهام اليومية
              </p>
            </a>

            {/* Invoices */}
            <a
              href="/dashboard/invoices"
              className="rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-indigo-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">الفواتير</h4>
              </div>
              <p className="text-sm text-gray-700">
                إدارة الفواتير والمدفوعات
              </p>
            </a>

            {/* Expenses */}
            <a
              href="/dashboard/expenses"
              className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-red-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">المصروفات</h4>
              </div>
              <p className="text-sm text-gray-700">
                تتبع المصروفات والنفقات
              </p>
            </a>

            {/* Analytics */}
            <a
              href="/dashboard/analytics"
              className="rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 shadow transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-cyan-600 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">التحليلات</h4>
              </div>
              <p className="text-sm text-gray-700">
                التقارير والإحصائيات
              </p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

