'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  FaBuilding, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaArrowLeft
} from 'react-icons/fa';

interface Organization {
  _id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  isActive: boolean;
  createdAt: string;
}

export default function OrganizationsManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrganizations();
  }, [page, filter, search]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params: any = { page, limit: 10 };
      
      if (filter !== 'all') {
        params.isActive = filter === 'active';
      }
      
      if (search) {
        params.search = search;
      }

      const response = await axios.get('http://localhost:3000/api/v1/super-admin/organizations', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setOrganizations(response.data.data.organizations);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrganizationStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/v1/super-admin/organizations/${id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrganizations();
    } catch (error) {
      console.error('Error toggling organization status:', error);
      alert('فشل تغيير حالة المؤسسة');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FaBuilding className="ml-3" />
                إدارة المؤسسات
              </h1>
              <p className="mt-2 text-blue-100">عرض وإدارة جميع المؤسسات المسجلة</p>
            </div>
            <Link
              href="/super-admin"
              className="flex items-center bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم أو النطاق..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                نشط
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                غير نشط
              </button>
            </div>
          </div>
        </div>

        {/* Organizations Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaBuilding className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-600">لا توجد مؤسسات</p>
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
                      النطاق
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الصناعة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحجم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaBuilding className="text-blue-600" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">{org.name}</div>
                            <div className="text-sm text-gray-500">{org.contactInfo.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{org.domain}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{org.industry}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {org.size}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {org.isActive ? (
                          <span className="flex items-center text-green-600">
                            <FaCheckCircle className="ml-1" />
                            نشط
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <FaTimesCircle className="ml-1" />
                            غير نشط
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/super-admin/organizations/${org._id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="عرض التفاصيل"
                          >
                            <FaEye className="text-lg" />
                          </Link>
                          <button
                            onClick={() => toggleOrganizationStatus(org._id)}
                            className={`${
                              org.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                            title={org.isActive ? 'تعطيل' : 'تفعيل'}
                          >
                            {org.isActive ? <FaToggleOff className="text-lg" /> : <FaToggleOn className="text-lg" />}
                          </button>
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

