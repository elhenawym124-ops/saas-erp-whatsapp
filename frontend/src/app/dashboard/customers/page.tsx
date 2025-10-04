'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser } from 'react-icons/fi';
import { HiOfficeBuilding } from 'react-icons/hi';

interface Customer {
  _id: string;
  name: string;
  type: 'individual' | 'company';
  contactInfo: {
    email?: string;
    phone?: string;
  };
  address?: {
    street?: string;
    city?: string;
    country?: string;
  };
  status: 'active' | 'inactive';
  tags?: string[];
  createdAt: string;
}

interface Statistics {
  total: number;
  active: number;
  inactive: number;
  individual: number;
  company: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'company'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'individual' as 'individual' | 'company',
    email: '',
    phone: '',
    street: '',
    city: '',
    country: '',
    status: 'active' as 'active' | 'inactive',
    tags: '',
  });

  useEffect(() => {
    fetchCustomers();
    fetchStatistics();
  }, [searchTerm, filterType, filterStatus]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await axios.get('http://localhost:3000/api/v1/customers', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setCustomers(response.data.data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/customers/statistics', {
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
        name: formData.name,
        type: formData.type,
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
        },
        address: {
          street: formData.street,
          city: formData.city,
          country: formData.country,
        },
        status: formData.status,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      if (editingCustomer) {
        await axios.put(
          `http://localhost:3000/api/v1/customers/${editingCustomer._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post('http://localhost:3000/api/v1/customers', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      resetForm();
      fetchCustomers();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء حفظ العميل');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/v1/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchCustomers();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء حذف العميل');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      type: customer.type,
      email: customer.contactInfo.email || '',
      phone: customer.contactInfo.phone || '',
      street: customer.address?.street || '',
      city: customer.address?.city || '',
      country: customer.address?.country || '',
      status: customer.status,
      tags: customer.tags?.join(', ') || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'individual',
      email: '',
      phone: '',
      street: '',
      city: '',
      country: '',
      status: 'active',
      tags: '',
    });
    setEditingCustomer(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة العملاء</h1>
          <p className="text-gray-600">إدارة قاعدة بيانات العملاء</p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">إجمالي العملاء</div>
              <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">نشط</div>
              <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">غير نشط</div>
              <div className="text-2xl font-bold text-gray-600">{statistics.inactive}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">أفراد</div>
              <div className="text-2xl font-bold text-purple-600">{statistics.individual}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">شركات</div>
              <div className="text-2xl font-bold text-orange-600">{statistics.company}</div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الأنواع</option>
              <option value="individual">أفراد</option>
              <option value="company">شركات</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>

            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <FiPlus /> إضافة عميل
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">جاري التحميل...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">لا توجد عملاء</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدينة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {customer.type === 'individual' ? (
                          <FiUser className="text-purple-600" />
                        ) : (
                          <HiOfficeBuilding className="text-orange-600" />
                        )}
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        customer.type === 'individual' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {customer.type === 'individual' ? 'فرد' : 'شركة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.contactInfo.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.contactInfo.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.address?.city || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id)}
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
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingCustomer ? 'تعديل عميل' : 'إضافة عميل جديد'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">الاسم *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">النوع *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="individual">فرد</option>
                      <option value="company">شركة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">الهاتف</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">الشارع</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">المدينة</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">الدولة</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">الحالة</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">العلامات (مفصولة بفاصلة)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="VIP, مهم, ..."
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
                    {editingCustomer ? 'تحديث' : 'إضافة'}
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

