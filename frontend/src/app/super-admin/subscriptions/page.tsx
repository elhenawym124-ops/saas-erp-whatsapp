'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  FaCreditCard, 
  FaCheckCircle, 
  FaClock,
  FaTimesCircle,
  FaBan,
  FaPlay,
  FaArrowLeft,
  FaExclamationTriangle
} from 'react-icons/fa';

interface Subscription {
  _id: string;
  organization: {
    _id: string;
    name: string;
    domain: string;
  };
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  currentPrice: number;
  billingCycle: string;
  autoRenew: boolean;
  createdAt: string;
}

export default function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'cancelled'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, filter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params: any = { page, limit: 10 };
      
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await axios.get('http://localhost:3000/api/v1/super-admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setSubscriptions(response.data.data.subscriptions);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const suspendSubscription = async (organizationId: string) => {
    const reason = prompt('يرجى إدخال سبب التعليق:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/v1/super-admin/subscriptions/${organizationId}/suspend`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('تم تعليق الاشتراك بنجاح');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error suspending subscription:', error);
      alert('فشل تعليق الاشتراك');
    }
  };

  const reactivateSubscription = async (organizationId: string) => {
    if (!confirm('هل أنت متأكد من إعادة تفعيل هذا الاشتراك؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/v1/super-admin/subscriptions/${organizationId}/reactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('تم إعادة تفعيل الاشتراك بنجاح');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      alert('فشل إعادة تفعيل الاشتراك');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { color: string; icon: any; text: string } } = {
      active: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle, text: 'نشط' },
      trial: { color: 'bg-blue-100 text-blue-800', icon: FaClock, text: 'تجريبي' },
      expired: { color: 'bg-yellow-100 text-yellow-800', icon: FaExclamationTriangle, text: 'منتهي' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FaTimesCircle, text: 'ملغي' },
      suspended: { color: 'bg-gray-100 text-gray-800', icon: FaBan, text: 'معلق' },
    };

    const badge = badges[status] || badges.active;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${badge.color}`}>
        <Icon className="ml-1" />
        {badge.text}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const plans: { [key: string]: { color: string; text: string } } = {
      free: { color: 'bg-gray-100 text-gray-800', text: 'مجاني' },
      basic: { color: 'bg-blue-100 text-blue-800', text: 'أساسي' },
      pro: { color: 'bg-purple-100 text-purple-800', text: 'احترافي' },
      enterprise: { color: 'bg-indigo-100 text-indigo-800', text: 'مؤسسات' },
    };

    const planBadge = plans[plan] || plans.free;

    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${planBadge.color}`}>
        {planBadge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FaCreditCard className="ml-3" />
                إدارة الاشتراكات
              </h1>
              <p className="mt-2 text-purple-100">عرض وإدارة جميع اشتراكات المؤسسات</p>
            </div>
            <Link
              href="/super-admin"
              className="flex items-center bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <FaArrowLeft className="ml-2" />
              العودة للوحة التحكم
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              نشط
            </button>
            <button
              onClick={() => setFilter('trial')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'trial'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              تجريبي
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'expired'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              منتهي
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ملغي
            </button>
          </div>
        </div>

        {/* Subscriptions Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaCreditCard className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-600">لا توجد اشتراكات</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المؤسسة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الخطة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      السعر
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الانتهاء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sub.organization.name}</div>
                        <div className="text-sm text-gray-500">{sub.organization.domain}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPlanBadge(sub.plan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${sub.currentPrice}</div>
                        <div className="text-xs text-gray-500">{sub.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(sub.endDate).toLocaleDateString('ar-SA')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {sub.status === 'active' || sub.status === 'trial' ? (
                            <button
                              onClick={() => suspendSubscription(sub.organization._id)}
                              className="text-red-600 hover:text-red-900"
                              title="تعليق"
                            >
                              <FaBan className="text-lg" />
                            </button>
                          ) : (
                            <button
                              onClick={() => reactivateSubscription(sub.organization._id)}
                              className="text-green-600 hover:text-green-900"
                              title="إعادة تفعيل"
                            >
                              <FaPlay className="text-lg" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <span className="text-sm text-gray-700">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

