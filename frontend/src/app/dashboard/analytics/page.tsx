'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
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
  ResponsiveContainer,
} from 'recharts';
import { FiUsers, FiFolder, FiCheckSquare, FiDollarSign, FiTrendingUp, FiCalendar } from 'react-icons/fi';

interface Analytics {
  overview: {
    users: number;
    projects: number;
    tasks: number;
    customers: number;
    deals: number;
  };
  recent: {
    invoices: any[];
    expenses: any[];
  };
}

interface FinancialReport {
  revenue: {
    total: number;
    byStatus: any[];
  };
  expenses: {
    total: number;
    byCategory: any[];
  };
  payroll: {
    total: number;
    byStatus: any[];
  };
  summary: {
    revenue: number;
    expenses: number;
    netProfit: number;
    profitMargin: string;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAnalytics();
    fetchFinancialReport();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/reports/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/reports/financial', {
        headers: { Authorization: `Bearer ${token}` },
        params: dateRange,
      });
      setFinancialReport(response.data.data);
    } catch (error) {
      console.error('Error fetching financial report:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  // تحضير بيانات الرسوم البيانية
  const expenseChartData = financialReport?.expenses.byCategory.map((item) => ({
    name: item._id,
    value: item.total,
  })) || [];

  const financialSummaryData = [
    { name: 'الإيرادات', value: financialReport?.summary.revenue || 0 },
    { name: 'المصروفات', value: financialReport?.summary.expenses || 0 },
    { name: 'صافي الربح', value: financialReport?.summary.netProfit || 0 },
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">التحليلات والتقارير</h1>
        <p className="text-gray-600 mt-2">نظرة شاملة على أداء النظام</p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 flex gap-4 items-center bg-white p-4 rounded-lg shadow">
        <FiCalendar className="h-5 w-5 text-gray-600" />
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المستخدمين</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.users}</p>
              </div>
              <FiUsers className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المشاريع</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.projects}</p>
              </div>
              <FiFolder className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المهام</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.tasks}</p>
              </div>
              <FiCheckSquare className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">العملاء</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.customers}</p>
              </div>
              <FiUsers className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الصفقات</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.deals}</p>
              </div>
              <FiTrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Financial Summary Cards */}
      {financialReport && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">الإيرادات</p>
                <p className="text-2xl font-bold text-green-900">
                  {financialReport.summary.revenue.toLocaleString()} ج.م
                </p>
              </div>
              <FiDollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">المصروفات</p>
                <p className="text-2xl font-bold text-red-900">
                  {financialReport.summary.expenses.toLocaleString()} ج.م
                </p>
              </div>
              <FiDollarSign className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">صافي الربح</p>
                <p className="text-2xl font-bold text-blue-900">
                  {financialReport.summary.netProfit.toLocaleString()} ج.م
                </p>
              </div>
              <FiTrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">هامش الربح</p>
                <p className="text-2xl font-bold text-purple-900">{financialReport.summary.profitMargin}%</p>
              </div>
              <FiTrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Financial Summary Bar Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الملخص المالي</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialSummaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses Pie Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">المصروفات حسب الفئة</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Invoices */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آخر الفواتير</h3>
          <div className="space-y-3">
            {analytics?.recent.invoices.map((invoice) => (
              <div key={invoice._id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium text-gray-900">{invoice.customer?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
                <p className="font-bold text-green-600">{invoice.total.toLocaleString()} ج.م</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آخر المصروفات</h3>
          <div className="space-y-3">
            {analytics?.recent.expenses.map((expense) => (
              <div key={expense._id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium text-gray-900">{expense.description}</p>
                  <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString('ar-EG')}</p>
                </div>
                <p className="font-bold text-red-600">{expense.amount.toLocaleString()} ج.م</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

