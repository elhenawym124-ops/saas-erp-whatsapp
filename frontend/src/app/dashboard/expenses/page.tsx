'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiTrendingUp, FiCheckCircle, FiClock } from 'react-icons/fi';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: 'office' | 'travel' | 'utilities' | 'salaries' | 'marketing' | 'other';
  vendor?: string;
  date: string;
  paymentMethod: 'cash' | 'credit_card' | 'bank_transfer' | 'check';
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
}

interface Statistics {
  total: number;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
  };
  amounts: {
    total: number;
    paid: number;
    pending: number;
  };
  byCategory: Record<string, { count: number; total: number }>;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'office' as 'office' | 'travel' | 'utilities' | 'salaries' | 'marketing' | 'other',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'credit_card' | 'bank_transfer' | 'check',
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'paid',
  });

  useEffect(() => {
    fetchExpenses();
    fetchStatistics();
  }, [filterCategory, filterStatus]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const params: any = {};
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;

      const response = await axios.get('http://localhost:3000/api/v1/expenses', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setExpenses(response.data.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/expenses/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingExpense) {
        await axios.put(
          `http://localhost:3000/api/v1/expenses/${editingExpense._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post('http://localhost:3000/api/v1/expenses', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      resetForm();
      fetchExpenses();
      fetchStatistics();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/v1/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchExpenses();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/v1/expenses/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchExpenses();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      category: 'office',
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      status: 'pending',
    });
    setEditingExpense(null);
  };

  const categoryLabels: Record<string, string> = {
    office: 'مكتب',
    travel: 'سفر',
    utilities: 'مرافق',
    salaries: 'رواتب',
    marketing: 'تسويق',
    other: 'أخرى',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    approved: 'موافق عليه',
    rejected: 'مرفوض',
    paid: 'مدفوع',
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">المصروفات</h1>
        <p className="text-gray-600 mt-2">إدارة المصروفات والنفقات</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <FiTrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المدفوعة</p>
                <p className="text-2xl font-bold text-green-600">{statistics.byStatus.paid}</p>
                <p className="text-xs text-gray-500">{statistics.amounts.paid.toLocaleString()} ج.م</p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">قيد الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.byStatus.pending}</p>
                <p className="text-xs text-gray-500">{statistics.amounts.pending.toLocaleString()} ج.م</p>
              </div>
              <FiClock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الإجمالي</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.amounts.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">جنيه مصري</p>
              </div>
              <FiDollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2"
          >
            <option value="">جميع الفئات</option>
            <option value="office">مكتب</option>
            <option value="travel">سفر</option>
            <option value="utilities">مرافق</option>
            <option value="salaries">رواتب</option>
            <option value="marketing">تسويق</option>
            <option value="other">أخرى</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="approved">موافق عليه</option>
            <option value="rejected">مرفوض</option>
            <option value="paid">مدفوع</option>
          </select>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FiPlus /> إضافة مصروف
        </button>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفئة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {expenses.map((expense) => (
              <tr key={expense._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {expense.amount.toLocaleString()} ج.م
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {categoryLabels[expense.category]}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <select
                    value={expense.status}
                    onChange={(e) => handleStatusChange(expense._id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[expense.status]}`}
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="approved">موافق عليه</option>
                    <option value="rejected">مرفوض</option>
                    <option value="paid">مدفوع</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(expense.date).toLocaleDateString('ar-EG')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <button
                    onClick={() => handleDelete(expense._id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={expense.status === 'paid'}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">
              {editingExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">الوصف</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">المبلغ</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">الفئة</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="office">مكتب</option>
                    <option value="travel">سفر</option>
                    <option value="utilities">مرافق</option>
                    <option value="salaries">رواتب</option>
                    <option value="marketing">تسويق</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

