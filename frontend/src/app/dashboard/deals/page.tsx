'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiTrendingUp, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface Deal {
  _id: string;
  title: string;
  customer: {
    _id: string;
    name: string;
  };
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  status: 'active' | 'closed';
  expectedCloseDate?: string;
  assignedTo?: {
    _id: string;
    name: string;
  };
  description?: string;
  createdAt: string;
}

interface Customer {
  _id: string;
  name: string;
}

interface Statistics {
  total: number;
  active: number;
  won: number;
  lost: number;
  totalValue: number;
  wonValue: number;
  lostValue: number;
  winRate: number;
  byStage: {
    lead: number;
    qualified: number;
    proposal: number;
    negotiation: number;
    won: number;
    lost: number;
  };
}

const stageColors: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-800',
  qualified: 'bg-blue-100 text-blue-800',
  proposal: 'bg-yellow-100 text-yellow-800',
  negotiation: 'bg-orange-100 text-orange-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

const stageNames: Record<string, string> = {
  lead: 'عميل محتمل',
  qualified: 'مؤهل',
  proposal: 'عرض سعر',
  negotiation: 'تفاوض',
  won: 'فاز',
  lost: 'خسر',
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    customer: '',
    value: '',
    stage: 'lead' as Deal['stage'],
    expectedCloseDate: '',
    description: '',
  });

  useEffect(() => {
    fetchDeals();
    fetchCustomers();
    fetchStatistics();
  }, [filterStage, filterStatus]);

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem('token');
      const params: any = {};
      
      if (filterStage !== 'all') params.stage = filterStage;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await axios.get('http://localhost:3000/api/v1/deals', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setDeals(response.data.data.deals || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCustomers(response.data.data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/deals/statistics', {
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
      const payload = {
        title: formData.title,
        customer: formData.customer,
        value: parseFloat(formData.value),
        stage: formData.stage,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        description: formData.description,
      };

      if (editingDeal) {
        await axios.put(
          `http://localhost:3000/api/v1/deals/${editingDeal._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post('http://localhost:3000/api/v1/deals', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      resetForm();
      fetchDeals();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error saving deal:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء حفظ الصفقة');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصفقة؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/v1/deals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchDeals();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء حذف الصفقة');
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      customer: deal.customer._id,
      value: deal.value.toString(),
      stage: deal.stage,
      expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split('T')[0] : '',
      description: deal.description || '',
    });
    setShowModal(true);
  };

  const handleMoveStage = async (dealId: string, newStage: Deal['stage']) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/v1/deals/${dealId}/stage`,
        { stage: newStage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchDeals();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error moving stage:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء نقل المرحلة');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      customer: '',
      value: '',
      stage: 'lead',
      expectedCloseDate: '',
      description: '',
    });
    setEditingDeal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الصفقات</h1>
          <p className="text-gray-600">تتبع وإدارة صفقات المبيعات</p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">إجمالي الصفقات</div>
                <FiDollarSign className="text-blue-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
              <div className="text-xs text-gray-500 mt-1">
                {statistics.totalValue.toLocaleString()} ج.م
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">صفقات نشطة</div>
                <FiTrendingUp className="text-orange-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-orange-600">{statistics.active}</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">صفقات فائزة</div>
                <FiCheckCircle className="text-green-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-green-600">{statistics.won}</div>
              <div className="text-xs text-gray-500 mt-1">
                {statistics.wonValue.toLocaleString()} ج.م
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">معدل الفوز</div>
                <FiXCircle className="text-red-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {statistics.winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {statistics.lost} صفقات خاسرة
              </div>
            </div>
          </div>
        )}

        {/* Stage Statistics */}
        {statistics && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">الصفقات حسب المرحلة</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {Object.entries(statistics.byStage).map(([stage, count]) => (
                <div key={stage} className="text-center">
                  <div className={`px-3 py-2 rounded-lg ${stageColors[stage]}`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs mt-1">{stageNames[stage]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع المراحل</option>
              <option value="lead">عميل محتمل</option>
              <option value="qualified">مؤهل</option>
              <option value="proposal">عرض سعر</option>
              <option value="negotiation">تفاوض</option>
              <option value="won">فاز</option>
              <option value="lost">خسر</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="closed">مغلق</option>
            </select>

            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <FiPlus /> إضافة صفقة
            </button>
          </div>
        </div>

        {/* Deals Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">جاري التحميل...</div>
          ) : deals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">لا توجد صفقات</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">القيمة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المرحلة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ المتوقع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deals.map((deal) => (
                  <tr key={deal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{deal.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{deal.customer.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {deal.value.toLocaleString()} ج.م
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={deal.stage}
                        onChange={(e) => handleMoveStage(deal._id, e.target.value as Deal['stage'])}
                        className={`px-2 py-1 rounded text-xs ${stageColors[deal.stage]} border-0`}
                        disabled={deal.status === 'closed'}
                      >
                        <option value="lead">عميل محتمل</option>
                        <option value="qualified">مؤهل</option>
                        <option value="proposal">عرض سعر</option>
                        <option value="negotiation">تفاوض</option>
                        <option value="won">فاز</option>
                        <option value="lost">خسر</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        deal.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {deal.status === 'active' ? 'نشط' : 'مغلق'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {deal.expectedCloseDate
                        ? new Date(deal.expectedCloseDate).toLocaleDateString('ar-EG')
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(deal._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">
                {editingDeal ? 'تعديل صفقة' : 'إضافة صفقة جديدة'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">العنوان *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">العميل *</label>
                    <select
                      required
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">اختر عميل</option>
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">القيمة (ج.م) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">المرحلة</label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal['stage'] })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="lead">عميل محتمل</option>
                      <option value="qualified">مؤهل</option>
                      <option value="proposal">عرض سعر</option>
                      <option value="negotiation">تفاوض</option>
                      <option value="won">فاز</option>
                      <option value="lost">خسر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">تاريخ الإغلاق المتوقع</label>
                    <input
                      type="date"
                      value={formData.expectedCloseDate}
                      onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">الوصف</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingDeal ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

