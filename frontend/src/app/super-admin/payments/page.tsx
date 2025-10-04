'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  FaDollarSign, 
  FaCheckCircle, 
  FaClock,
  FaTimesCircle,
  FaArrowLeft,
  FaFileInvoice
} from 'react-icons/fa';

interface Payment {
  _id: string;
  organization: {
    _id: string;
    name: string;
    domain: string;
  };
  subscription: {
    plan: string;
    status: string;
  };
  invoiceNumber: string;
  amount: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export default function PaymentsHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPayments();
  }, [page, filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params: any = { page, limit: 10 };
      
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await axios.get('http://localhost:3000/api/v1/super-admin/payments', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setPayments(response.data.data.payments);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (paymentId: string) => {
    if (!confirm('هل أنت متأكد من وضع علامة على هذا الدفع كمدفوع؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/v1/super-admin/payments/${paymentId}/mark-paid`,
        {
          paymentDetails: {
            transactionId: `TXN-${Date.now()}`,
            paymentGateway: 'manual',
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('تم وضع علامة على الدفع كمدفوع بنجاح');
      fetchPayments();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      alert('فشل وضع علامة على الدفع');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { color: string; icon: any; text: string } } = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaClock, text: 'قيد الانتظار' },
      paid: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle, text: 'مدفوع' },
      failed: { color: 'bg-red-100 text-red-800', icon: FaTimesCircle, text: 'فشل' },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle, text: 'مسترد' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle, text: 'ملغي' },
    };

    const badge = badges[status] || badges.pending;
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
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${planBadge.color}`}>
        {planBadge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FaDollarSign className="ml-3" />
                سجل المدفوعات
              </h1>
              <p className="mt-2 text-green-100">عرض وإدارة جميع المدفوعات والفواتير</p>
            </div>
            <Link
              href="/super-admin"
              className="flex items-center bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
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
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              قيد الانتظار
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              مدفوع
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'failed'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              فشل
            </button>
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaDollarSign className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-600">لا توجد مدفوعات</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الفاتورة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المؤسسة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الخطة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الاستحقاق
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaFileInvoice className="text-gray-400 ml-2" />
                          <span className="text-sm font-medium text-gray-900">{payment.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.organization.name}</div>
                        <div className="text-sm text-gray-500">{payment.organization.domain}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPlanBadge(payment.subscription.plan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {payment.currency} {payment.totalAmount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.dueDate).toLocaleDateString('ar-SA')}
                        </div>
                        {payment.paidAt && (
                          <div className="text-xs text-green-600">
                            دفع في: {new Date(payment.paidAt).toLocaleDateString('ar-SA')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => markAsPaid(payment._id)}
                            className="text-green-600 hover:text-green-900"
                            title="وضع علامة كمدفوع"
                          >
                            <FaCheckCircle className="text-lg" />
                          </button>
                        )}
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

