'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiCheckSquare, FiClock, FiUser } from 'react-icons/fi';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project: any;
  assignedTo: any;
  dueDate?: string;
  timeSpent: number;
  createdAt: string;
}

interface Statistics {
  total: number;
  byStatus: {
    todo: number;
    in_progress: number;
    review: number;
    completed: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    project: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchStatistics();
  }, [filterStatus, filterPriority]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;

      const response = await axios.get('http://localhost:3000/api/v1/tasks', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setTasks(response.data.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/tasks/statistics', {
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
      
      if (editingTask) {
        await axios.put(
          `http://localhost:3000/api/v1/tasks/${editingTask._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post('http://localhost:3000/api/v1/tasks', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      resetForm();
      fetchTasks();
      fetchStatistics();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/v1/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/v1/tasks/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      project: '',
      dueDate: '',
    });
    setEditingTask(null);
  };

  const statusLabels: Record<string, string> = {
    todo: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    review: 'قيد المراجعة',
    completed: 'مكتملة',
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  const priorityLabels: Record<string, string> = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">المهام</h1>
        <p className="text-gray-600 mt-2">إدارة المهام اليومية</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المهام</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <FiCheckSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.byStatus.in_progress}</p>
              </div>
              <FiClock className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مكتملة</p>
                <p className="text-2xl font-bold text-green-600">{statistics.byStatus.completed}</p>
              </div>
              <FiCheckSquare className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عاجلة</p>
                <p className="text-2xl font-bold text-red-600">{statistics.byPriority.urgent}</p>
              </div>
              <FiClock className="h-8 w-8 text-red-500" />
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
            <option value="todo">قيد الانتظار</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="review">قيد المراجعة</option>
            <option value="completed">مكتملة</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2"
          >
            <option value="">جميع الأولويات</option>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
            <option value="urgent">عاجلة</option>
          </select>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FiPlus /> إضافة مهمة
        </button>
      </div>

      {/* Tasks Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأولوية</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموعد النهائي</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tasks.map((task) => (
              <tr key={task._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-500">{task.description}</p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[task.status]}`}
                  >
                    <option value="todo">قيد الانتظار</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="review">قيد المراجعة</option>
                    <option value="completed">مكتملة</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityColors[task.priority]}`}>
                    {priorityLabels[task.priority]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-EG') : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="text-red-600 hover:text-red-900"
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
              {editingTask ? 'تعديل مهمة' : 'إضافة مهمة جديدة'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">العنوان</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="todo">قيد الانتظار</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="review">قيد المراجعة</option>
                    <option value="completed">مكتملة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">الأولوية</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
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

