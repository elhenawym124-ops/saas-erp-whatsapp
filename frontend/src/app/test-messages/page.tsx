'use client';

import { useState } from 'react';
import { getToken } from '@/utils/tokenUtils';

interface Message {
  id: number;
  messageId: string;
  direction: string;
  fromNumber: string;
  toNumber: string;
  messageType: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export default function TestMessagesPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<{
    url: string;
    token: string;
    timestamp: string;
    statusCode: number | null;
  } | null>(null);

  const fetchMessages = async () => {
    if (!phoneNumber.trim()) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const token = getToken();
      const url = `http://localhost:8000/api/v1/whatsapp/messages?contact=${phoneNumber}&page=1&limit=50`;
      const timestamp = new Date().toISOString();

      console.log('🔍 Test Page - Fetching messages:', {
        url,
        phoneNumber,
        token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        timestamp,
      });

      setRequestInfo({
        url,
        token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        timestamp,
        statusCode: null,
      });

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const statusCode = res.status;
      setRequestInfo((prev) => (prev ? { ...prev, statusCode } : null));

      console.log('📊 Test Page - Response status:', statusCode);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${statusCode}`);
      }

      const data: ApiResponse = await res.json();
      
      console.log('✅ Test Page - Response data:', data);
      console.log('📊 Test Page - Messages count:', data.data?.messages?.length || 0);
      
      if (data.data?.messages) {
        console.log('📋 Test Page - First message:', data.data.messages[0]);
      }

      setResponse(data);
    } catch (err: any) {
      const errorMessage = err.message || 'حدث خطأ غير معروف';
      console.error('❌ Test Page - Error:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testNumbers = [
    { label: 'رقم عادي (@s.whatsapp.net)', number: '201123087139' },
    { label: 'رقم Business (@lid)', number: '242477344759810' },
    { label: 'مجموعة (@g.us)', number: '120363420803971218' },
    { label: 'رقم آخر', number: '201112257060' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧪 صفحة اختبار الرسائل
          </h1>
          <p className="text-gray-600">
            اختبار جلب الرسائل من API للتحقق من الإصلاحات الأخيرة
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📱 إدخال رقم الهاتف
          </h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="أدخل رقم الهاتف (مثال: 201123087139)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && fetchMessages()}
            />
            <button
              onClick={fetchMessages}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ جاري الجلب...' : '🔍 جلب الرسائل'}
            </button>
          </div>

          {/* Quick Test Numbers */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 self-center">أرقام اختبار سريعة:</span>
            {testNumbers.map((test) => (
              <button
                key={test.number}
                onClick={() => setPhoneNumber(test.number)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {test.label}
              </button>
            ))}
          </div>
        </div>

        {/* Request Info */}
        {requestInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              📡 معلومات الطلب
            </h3>
            <div className="space-y-1 text-sm">
              <p><strong>URL:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{requestInfo.url}</code></p>
              <p><strong>Token:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{requestInfo.token}</code></p>
              <p><strong>Timestamp:</strong> {requestInfo.timestamp}</p>
              {requestInfo.statusCode && (
                <p>
                  <strong>Status Code:</strong>{' '}
                  <span className={`font-bold ${requestInfo.statusCode === 200 ? 'text-green-600' : 'text-red-600'}`}>
                    {requestInfo.statusCode}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">❌ خطأ</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <>
            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                ✅ النتيجة
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">عدد الرسائل</p>
                  <p className="text-2xl font-bold text-green-700">
                    {response.data?.messages?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">الصفحة</p>
                  <p className="text-2xl font-bold text-green-700">
                    {response.data?.pagination?.page || 1}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">الإجمالي</p>
                  <p className="text-2xl font-bold text-green-700">
                    {response.data?.pagination?.total || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">عدد الصفحات</p>
                  <p className="text-2xl font-bold text-green-700">
                    {response.data?.pagination?.totalPages || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Table */}
            {response.data?.messages && response.data.messages.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <h3 className="text-lg font-semibold text-gray-800 p-4 bg-gray-50 border-b">
                  📋 الرسائل ({response.data.messages.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">الاتجاه</th>
                        <th className="px-4 py-2 text-left">من</th>
                        <th className="px-4 py-2 text-left">إلى</th>
                        <th className="px-4 py-2 text-left">المحتوى</th>
                        <th className="px-4 py-2 text-left">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {response.data.messages.map((msg) => (
                        <tr key={msg.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-xs">{msg.id}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                msg.direction === 'inbound'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {msg.direction}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{msg.fromNumber}</td>
                          <td className="px-4 py-2 font-mono text-xs">{msg.toNumber}</td>
                          <td className="px-4 py-2 max-w-xs truncate">
                            {(() => {
                              try {
                                const content = JSON.parse(msg.content);
                                return content.text || content.caption || 'N/A';
                              } catch {
                                return msg.content;
                              }
                            })()}
                          </td>
                          <td className="px-4 py-2 text-xs">
                            {new Date(msg.createdAt).toLocaleString('ar-EG')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Raw JSON Response */}
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <h3 className="text-lg font-semibold text-white mb-2">
                📄 Raw JSON Response
              </h3>
              <pre className="text-green-400 text-xs overflow-x-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            💡 تعليمات الاستخدام
          </h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>أدخل رقم الهاتف في الحقل أعلاه (بدون @ أو أي إضافات)</li>
            <li>اضغط على "جلب الرسائل" أو اضغط Enter</li>
            <li>تحقق من عدد الرسائل المسترجعة في قسم "النتيجة"</li>
            <li>راجع تفاصيل الرسائل في الجدول</li>
            <li>افحص الـ Raw JSON Response للتأكد من البيانات الكاملة</li>
            <li>افتح Console في المتصفح (F12) لرؤية السجلات التفصيلية</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

