'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiFolder, FiUsers, FiCalendar, FiCheckCircle } from 'react-icons/fi';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  budget?: number;
  team: any[];
  progress: number;
  createdAt: string;
}

interface Statistics {
  total: number;
  byStatus: {
    planning: number;
    active: number;
    on_hold: number;
    completed: number;
    cancelled: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: 0,
  });

  useEffect(() => {
    fetchProjects();
    fetchStatistics();
  }, [filterStatus]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const params: any = {};
      if (filterStatus) params.status = filterStatus;

      const response = await axios.get('http://localhost:3000/api/v1/projects', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/v1/projects/statistics', {
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
      
      if (editingProject) {
        await axios.put(
          `http://localhost:3000/api/v1/projects/${editingProject._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post('http://localhost:3000/api/v1/projects', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      resetForm();
      fetchProjects();
      fetchStatistics();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/v1/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProjects();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: 0,
    });
    setEditingProject(null);
  };

  const statusLabels: Record<string, string> = {
    planning: 'تخطيط',
    active: 'نشط',
    on_hold: 'معلق',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">المشاريع</h1>
        <p className="text-gray-600 mt-2">إدارة المشاريع والفرق</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المشاريع</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <FiFolder className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">نشطة</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.byStatus.active}</p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مكتملة</p>
                <p className="text-2xl font-bold text-green-600">{statistics.byStatus.completed}</p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معلقة</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.byStatus.on_hold}</p>
              </div>
              <FiCalendar className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تخطيط</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.byStatus.planning}</p>
              </div>
              <FiFolder className="h-8 w-8 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        >
          <option value="">جميع الحالات</option>
          <option value="planning">تخطيط</option>
          <option value="active">نشط</option>
          <option value="on_hold">معلق</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغي</option>
        </select>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FiPlus /> إضافة مشروع
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project._id} className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{project.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingProject(project);
                    setFormData({
                      name: project.name,
                      description: project.description,
                      status: project.status,
                      startDate: project.startDate.split('T')[0],
                      endDate: project.endDate ? project.endDate.split('T')[0] : '',
                      budget: project.budget || 0,
                    });
                    setShowModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDelete(project._id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiCalendar className="h-4 w-4" />
                <span>{new Date(project.startDate).toLocaleDateString('ar-EG')}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiUsers className="h-4 w-4" />
                <span>{project.team.length} أعضاء</span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
                <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">
              {editingProject ? 'تعديل مشروع' : 'إضافة مشروع جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">اسم المشروع</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    <option value="planning">تخطيط</option>
                    <option value="active">نشط</option>
                    <option value="on_hold">معلق</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">الميزانية</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
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

