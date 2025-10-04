'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiFileText, FiCheckCircle, FiClock } from 'react-icons/fi';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customer: {
    _id: string;
    name: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  createdAt: string;
}

interface Statistics {
  total: number;
  byStatus: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
  amounts: {
    total: number;
    paid: number;
    overdue: number;
    pending: number;
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    customer: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    taxRate: 14,
    discount: 0,
    dueDate: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  });

  useEffect(() => {
    fetchInvoices();
    fetchStatistics();
  }, [filterStatus]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const params: any = {};
      if (filterStatus) params.status = filterStatus;

      const response = await axios.get('http://localhost:3000/api/v1/invoices', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setInvoices(response.data.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/invoices/statistics', {
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
      
      if (editingInvoice) {
        await axios.put(
          `http://localhost:3000/api/v1/invoices/${editingInvoice._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post('http://localhost:3000/api/v1/invoices', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      resetForm();
      fetchInvoices();
      fetchStatistics();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/v1/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInvoices();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/v1/invoices/${id}/status`,
        { status, paymentDate: status === 'paid' ? new Date().toISOString() : undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchInvoices();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      customer: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 14,
      discount: 0,
      dueDate: '',
      status: 'draft',
    });
    setEditingInvoice(null);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    draft: 'مسودة',
    sent: 'مرسلة',
    paid: 'مدفوعة',
    overdue: 'متأخرة',
    cancelled: 'ملغاة',
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">الفواتير</h1>
        <p className="text-gray-600 mt-2">إدارة الفواتير والمدفوعات</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <FiFileText className="h-8 w-8 text-blue-500" />
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
                <p className="text-sm text-gray-600">المتأخرة</p>
                <p className="text-2xl font-bold text-red-600">{statistics.byStatus.overdue}</p>
                <p className="text-xs text-gray-500">{statistics.amounts.overdue.toLocaleString()} ج.م</p>
              </div>
              <FiClock className="h-8 w-8 text-red-500" />
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2"
          >
            <option value="">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="sent">مرسلة</option>
            <option value="paid">مدفوعة</option>
            <option value="overdue">متأخرة</option>
            <option value="cancelled">ملغاة</option>
          </select>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FiPlus /> إضافة فاتورة
        </button>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الفاتورة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الاستحقاق</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {invoice.invoiceNumber}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {invoice.customer.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {invoice.total.toLocaleString()} ج.م
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <select
                    value={invoice.status}
                    onChange={(e) => handleStatusChange(invoice._id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[invoice.status]}`}
                  >
                    <option value="draft">مسودة</option>
                    <option value="sent">مرسلة</option>
                    <option value="paid">مدفوعة</option>
                    <option value="overdue">متأخرة</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(invoice.dueDate).toLocaleDateString('ar-EG')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(invoice._id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={invoice.status === 'paid'}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal - Simplified for now */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">
              {editingInvoice ? 'تعديل فاتورة' : 'إضافة فاتورة جديدة'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">رقم الفاتورة</label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
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

