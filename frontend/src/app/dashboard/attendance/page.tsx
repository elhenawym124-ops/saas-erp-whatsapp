'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AttendanceRecord {
  _id: string;
  checkIn: string;
  checkOut?: string;
  workHours?: number;
  status: string;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  overtimeHours?: number;
  notes?: string;
}

interface CurrentStatus {
  isCheckedIn: boolean;
  attendance: AttendanceRecord | null;
  elapsedHours?: number;
}

export default function AttendancePage() {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const [statusRes, recordsRes, statsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance/status/current`, config),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance?limit=10`, config),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance/statistics`, config),
      ]);

      setCurrentStatus(statusRes.data.data);
      setRecords(recordsRes.data.data);
      setStatistics(statsRes.data.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Get location if available
      let location = undefined;
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/attendance/check-in`,
        { location, notes: 'تسجيل حضور من الويب' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('تم تسجيل الحضور بنجاح!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء تسجيل الحضور');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Get location if available
      let location = undefined;
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/attendance/check-out`,
        { location, notes: 'تسجيل انصراف من الويب' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('تم تسجيل الانصراف بنجاح!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء تسجيل الانصراف');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      case 'absent':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'في الوقت';
      case 'late':
        return 'متأخر';
      case 'absent':
        return 'غائب';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">الحضور والانصراف</h1>
          <p className="text-gray-600 mt-2">إدارة سجلات الحضور والانصراف</p>
        </div>

        {/* Current Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">الحالة الحالية</h2>
          
          {currentStatus?.isCheckedIn ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">وقت الحضور</p>
                  <p className="text-lg font-semibold">
                    {formatDate(currentStatus.attendance!.checkIn)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">الوقت المنقضي</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentStatus.elapsedHours?.toFixed(2)} ساعة
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? 'جاري التسجيل...' : 'تسجيل انصراف'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">لم تسجل حضورك اليوم</p>
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? 'جاري التسجيل...' : 'تسجيل حضور'}
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">إجمالي السجلات</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalRecords}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">في الوقت</p>
              <p className="text-2xl font-bold text-green-600">{statistics.onTimePercentage}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">متأخر</p>
              <p className="text-2xl font-bold text-red-600">{statistics.latePercentage}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">إجمالي ساعات العمل</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.totalWorkHours.toFixed(1)}</p>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">سجلات الحضور الأخيرة</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحضور</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الانصراف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ساعات العمل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.checkIn).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.checkIn).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkOut
                        ? new Date(record.checkOut).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.workHours ? `${record.workHours.toFixed(2)} ساعة` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

