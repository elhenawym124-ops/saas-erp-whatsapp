'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

interface Session {
  id: number;
  sessionName: string;
  status: string;
  phoneNumber?: string;
  qrCode?: string;
  lastConnected?: string;
  lastDisconnected?: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

interface WebSocketStats {
  totalConnections: number;
  organizationRooms: number;
  sessionRooms: number;
  initialized: boolean;
}

export default function WhatsAppPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isFetchingQR, setIsFetchingQR] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>('default');
  const [webSocketStats, setWebSocketStats] = useState<WebSocketStats | null>(null);
  const [isClient, setIsClient] = useState(false);

  // New Session Form
  const [newSessionForm, setNewSessionForm] = useState({
    sessionName: '',
    showForm: false,
  });

  // Send Message Form
  const [messageForm, setMessageForm] = useState({
    to: '',
    text: '',
  });

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  };

  // Fetch WebSocket Stats
  const fetchWebSocketStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/whatsapp/websocket/stats`
      );

      if (response.data.success) {
        setWebSocketStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch WebSocket stats:', error);
    }
  };

  // Fetch Sessions
  const fetchSessions = async () => {
    const token = getToken();
    if (!token) {
      toast.error('يرجى تسجيل الدخول أولاً');
      router.push('/login');
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/whatsapp/sessions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        console.log('✅ Sessions fetched:', response.data.data);
        // ✅ Fix: Backend returns { sessions: [...] }, extract the array
        const sessionsArray = response.data.data.sessions || response.data.data || [];
        setSessions(Array.isArray(sessionsArray) ? sessionsArray : []);

        // Update selectedSession to best available session
        if (sessionsArray.length > 0) {
          // Priority: 1. Connected sessions, 2. QR ready sessions, 3. Any session
          const connectedSession = sessionsArray.find((s: Session) => s.status === 'connected');
          const qrReadySession = sessionsArray.find((s: Session) => s.status === 'qr_ready');
          const targetSession = connectedSession || qrReadySession || sessionsArray[sessionsArray.length - 1]; // Use latest session
          console.log('🎯 Selected session:', targetSession.sessionName, 'Status:', targetSession.status);
          setSelectedSession(targetSession.sessionName);
        }
      }
    } catch (error: any) {
      console.error('Fetch sessions error:', error);
      if (error.response?.status === 401) {
        toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        router.push('/login');
      } else if (error.response?.status === 429) {
        toast.error('تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة بعد قليل');
      } else {
        toast.error('فشل في جلب الجلسات');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Create Session
  const createSession = async (sessionName?: string) => {
    const token = getToken();
    if (!token) return;

    setIsCreatingSession(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/whatsapp/sessions`,
        { sessionName: sessionName || 'default' },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        console.log('✅ Session created:', response.data.data);
        toast.success('تم إنشاء الجلسة بنجاح!');
        fetchSessions();
        setNewSessionForm({ sessionName: '', showForm: false });
        // Fetch QR Code after 2 seconds
        setTimeout(() => {
          console.log('⏰ Fetching QR code after session creation...');
          fetchQRCode(sessionName || 'main-session');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Create session error:', error);
      if (error.response?.status === 401) {
        toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        router.push('/login');
      } else if (error.response?.status === 429) {
        toast.error('تم تجاوز الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة');
      } else {
        toast.error(error.response?.data?.message || 'فشل في إنشاء الجلسة');
      }
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Create New Session with Custom Name
  const createNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionName = newSessionForm.sessionName.trim();

    if (!sessionName) {
      toast.error('يرجى إدخال اسم الجلسة');
      return;
    }

    if (sessionName.length < 3) {
      toast.error('اسم الجلسة يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    if (sessionName.length > 50) {
      toast.error('اسم الجلسة يجب أن يكون أقل من 50 حرف');
      return;
    }

    await createSession(sessionName);
    setNewSessionForm({ sessionName: '', showForm: false });
  };

  // Fetch QR Code
  const fetchQRCode = async (sessionName?: string) => {
    const token = getToken();
    if (!token) return;

    setIsFetchingQR(true);

    // Use the provided sessionName or find the best session for QR
    let targetSession = sessionName;
    if (!targetSession && sessions.length > 0) {
      // Priority: 1. QR ready sessions, 2. Disconnected sessions, 3. Latest session
      const qrReadySession = sessions.find(s => s.status === 'qr_ready');
      const disconnectedSession = sessions.find(s => s.status === 'disconnected');
      const latestSession = sessions[sessions.length - 1];

      const bestSession = qrReadySession || disconnectedSession || latestSession;
      targetSession = bestSession.sessionName;
      console.log('🎯 Auto-selected session for QR:', targetSession, 'Status:', bestSession.status);
    }
    if (!targetSession) {
      console.log('❌ No sessions available for QR code');
      toast.error('لا توجد جلسات متاحة. أنشئ جلسة أولاً');
      setIsFetchingQR(false);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/whatsapp/sessions/${targetSession}/qr`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success && response.data.data.qrCode) {
        console.log('✅ QR Code received for session:', targetSession);
        setQrCode(response.data.data.qrCode);
        toast.success('QR Code جاهز! امسحه بـ WhatsApp');
      } else {
        console.log('❌ No QR Code in response:', response.data);
        toast.info('QR Code غير متاح حالياً، جرب مرة أخرى بعد قليل');
      }
    } catch (error: any) {
      console.error('Fetch QR error:', error);
      if (error.response?.status === 404) {
        toast.info('QR Code غير متاح حالياً، جرب مرة أخرى بعد قليل');
      } else if (error.response?.status === 400) {
        toast.warning('الجلسة متصلة بالفعل أو QR Code منتهي الصلاحية');
      } else {
        toast.error('فشل في الحصول على QR Code');
      }
    } finally {
      setIsFetchingQR(false);
    }
  };

  // Send Message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    if (!messageForm.to || !messageForm.text) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setIsSendingMessage(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/whatsapp/messages/send`,
        {
          to: messageForm.to,
          text: messageForm.text,
          sessionName: selectedSession,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success('تم إرسال الرسالة بنجاح!');
        setMessageForm({ to: '', text: '' });
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error(error.response?.data?.message || 'فشل في إرسال الرسالة');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Disconnect Session
  const disconnectSession = async (sessionName: string) => {
    const token = getToken();
    if (!token) return;

    if (!confirm('هل أنت متأكد من قطع الاتصال؟')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/whatsapp/sessions/${sessionName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('تم قطع الاتصال بنجاح');
      fetchSessions();
      setQrCode(null);
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error('فشل في قطع الاتصال');
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchSessions();
      fetchWebSocketStats();

      // Fetch WebSocket stats every 30 seconds
      const statsInterval = setInterval(fetchWebSocketStats, 30000);

      return () => {
        clearInterval(statsInterval);
      };
    }
  }, [isClient]);

  // Check if user is logged in (only on client side)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (isClient) {
      const token = getToken();
      setIsLoggedIn(!!token);
    }
  }, [isClient]);

  if (!isClient || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }



  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp</h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-6xl">🔐</div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">تسجيل الدخول مطلوب</h2>
            <p className="mt-2 text-gray-600">يجب تسجيل الدخول للوصول إلى ميزات WhatsApp</p>
            <div className="mt-6 space-y-4">
              <div>
                <a
                  href="/login"
                  className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors inline-block"
                >
                  تسجيل الدخول
                </a>
              </div>
              <p className="text-sm text-gray-500">
                استخدم البيانات: test@test.com / test123
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp</h1>
              <p className="mt-1 text-sm text-gray-600">
                إدارة جلسات WhatsApp وإرسال الرسائل
              </p>
            </div>
            <a
              href="/dashboard"
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            >
              العودة للوحة التحكم
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Sessions & QR Code */}
          <div className="space-y-6">
            {/* WebSocket Status Card */}
            {webSocketStats && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4">حالة WebSocket</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <div className="text-2xl font-bold text-blue-600">{webSocketStats.totalConnections}</div>
                    <div className="text-sm text-blue-600">اتصالات نشطة</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="text-2xl font-bold text-green-600">{webSocketStats.initialized ? '✅' : '❌'}</div>
                    <div className="text-sm text-green-600">حالة التهيئة</div>
                  </div>
                </div>
              </div>
            )}

            {/* Sessions Card */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">الجلسات</h2>
                  <p className="text-sm text-gray-600">
                    المجموع: {sessions.length} | متصل: {sessions.filter(s => s.status === 'connected').length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchSessions}
                    disabled={isLoading}
                    className="rounded-lg bg-gray-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => {
                      const quickSessionName = `quick-${Date.now()}`;
                      createSession(quickSessionName);
                    }}
                    disabled={isCreatingSession}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCreatingSession ? 'جاري الإنشاء...' : '⚡ جلسة سريعة'}
                  </button>
                  <button
                    onClick={() => setNewSessionForm({ ...newSessionForm, showForm: !newSessionForm.showForm })}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    ➕ جلسة مخصصة
                  </button>
                </div>
              </div>

              {/* New Session Form */}
              {newSessionForm.showForm && (
                <div className="mb-4 rounded-lg bg-gray-50 p-4">
                  <form onSubmit={createNewSession} className="space-y-3">
                    <div>
                      <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700">
                        اسم الجلسة الجديدة
                      </label>
                      <input
                        type="text"
                        id="sessionName"
                        value={newSessionForm.sessionName}
                        onChange={(e) => setNewSessionForm({ ...newSessionForm, sessionName: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="مثال: work-phone, personal-whatsapp, support-team (3-50 حرف)"
                        disabled={isCreatingSession}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isCreatingSession}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCreatingSession ? 'جاري الإنشاء...' : 'إنشاء'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSessionForm({ sessionName: '', showForm: false })}
                        className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {sessions.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    📱
                  </div>
                  <p className="mt-4 text-gray-600 font-medium">لا توجد جلسات WhatsApp</p>
                  <p className="mt-2 text-sm text-gray-500">
                    أنشئ جلسة جديدة للبدء في إرسال الرسائل
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 تأكد من تسجيل الدخول أولاً قبل إنشاء الجلسات
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {session.sessionName}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              session.status === 'connected'
                                ? 'bg-green-500'
                                : session.status === 'qr_ready'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                            }`}
                          ></span>
                          <span className="text-sm text-gray-600">
                            {session.status === 'connected'
                              ? 'متصل ✅'
                              : session.status === 'qr_ready'
                              ? 'في انتظار المسح ⏳'
                              : 'غير متصل ❌'}
                          </span>
                          <span className="text-xs text-gray-400">
                            ID: {session.id}
                          </span>
                        </div>
                        {session.phoneNumber && (
                          <p className="mt-1 text-xs text-gray-500">
                            {session.phoneNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {session.status !== 'connected' && (
                          <button
                            onClick={() => fetchQRCode(session.sessionName)}
                            disabled={isFetchingQR}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isFetchingQR ? 'جاري التحميل...' : 'QR Code'}
                          </button>
                        )}
                        <button
                          onClick={() => disconnectSession(session.sessionName)}
                          className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                        >
                          قطع الاتصال
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QR Code Card */}
            {qrCode && (
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    QR Code للاتصال
                  </h2>
                  <button
                    onClick={() => setQrCode(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-center">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="h-64 w-64 rounded-lg border-2 border-gray-200"
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-center text-sm text-gray-600">
                      امسح هذا الرمز بتطبيق WhatsApp على هاتفك
                    </p>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                        في انتظار المسح
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      <p>📱 افتح WhatsApp &gt; الإعدادات &gt; الأجهزة المرتبطة &gt; ربط جهاز</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Loading */}
            {isFetchingQR && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  جاري تحضير QR Code
                </h2>
                <div className="rounded-lg bg-gray-50 p-8">
                  <div className="flex justify-center">
                    <div className="h-64 w-64 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-gray-600">جاري التحميل...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Send Message */}
          <div className="space-y-6">
            {/* Send Message Card */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                إرسال رسالة
              </h2>

              <form onSubmit={sendMessage} className="space-y-4">
                {/* Session Selection */}
                {sessions.length > 0 && (
                  <div>
                    <label
                      htmlFor="sessionSelect"
                      className="block text-sm font-medium text-gray-700"
                    >
                      اختر الجلسة
                    </label>
                    <select
                      id="sessionSelect"
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSendingMessage}
                    >
                      {sessions.map((session) => (
                        <option key={session.id} value={session.sessionName}>
                          {session.sessionName} {session.phoneNumber ? `(${session.phoneNumber})` : ''}
                          {session.status === 'connected' ? ' ✅' : session.status === 'disconnected' ? ' ❌' : ' ⏳'}
                        </option>
                      ))}
                    </select>
                    {sessions.filter(s => s.status === 'connected').length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        ⚠️ لا توجد جلسات متصلة. قم بمسح QR Code أولاً
                      </p>
                    )}
                  </div>
                )}

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="to"
                    className="block text-sm font-medium text-gray-700"
                  >
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    id="to"
                    value={messageForm.to}
                    onChange={(e) =>
                      setMessageForm({ ...messageForm, to: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="201234567890"
                    disabled={isSendingMessage}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    أدخل الرقم بدون + أو 00
                  </p>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="text"
                    className="block text-sm font-medium text-gray-700"
                  >
                    الرسالة
                  </label>
                  <textarea
                    id="text"
                    value={messageForm.text}
                    onChange={(e) =>
                      setMessageForm({ ...messageForm, text: e.target.value })
                    }
                    rows={6}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اكتب رسالتك هنا..."
                    disabled={isSendingMessage}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSendingMessage || sessions.length === 0}
                  className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSendingMessage ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </button>

                {sessions.length === 0 && (
                  <p className="text-center text-sm text-red-600">
                    يجب إنشاء جلسة أولاً
                  </p>
                )}

                {sessions.length > 0 && sessions.filter(s => s.status === 'connected').length === 0 && (
                  <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <p>⚠️ لا توجد جلسات متصلة</p>
                    <p className="text-xs mt-1">قم بمسح QR Code لإحدى الجلسات أولاً</p>
                  </div>
                )}
              </form>
            </div>

            {/* Instructions Card */}
            <div className="rounded-lg bg-blue-50 p-6">
              <h3 className="font-semibold text-blue-900">
                📖 كيفية إضافة رقم جديد
              </h3>
              <div className="mt-3 space-y-3 text-sm text-blue-800">
                <div>
                  <h4 className="font-semibold">⚡ الطريقة السريعة:</h4>
                  <ol className="mt-1 space-y-1 ml-4">
                    <li>1. انقر على "⚡ جلسة سريعة"</li>
                    <li>2. امسح QR Code بـ WhatsApp</li>
                    <li>3. أرسل رسالة لأي رقم</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold">➕ جلسة مخصصة:</h4>
                  <ol className="mt-1 space-y-1 ml-4">
                    <li>1. انقر على "➕ جلسة مخصصة"</li>
                    <li>2. أدخل اسم مميز للجلسة</li>
                    <li>3. امسح QR Code</li>
                    <li>4. اختر الجلسة عند الإرسال</li>
                  </ol>
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded">
                  <p className="text-xs">💡 يمكنك إنشاء عدة جلسات لأرقام مختلفة</p>
                </div>
              </div>
            </div>

            {/* WebSocket Test Card */}
            <div className="rounded-lg bg-yellow-50 p-6">
              <h3 className="font-semibold text-yellow-900">
                🔧 أدوات الاختبار
              </h3>
              <div className="mt-3 space-y-2">
                <a
                  href="http://localhost:3000/api/v1/whatsapp/websocket/stats"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  📊 إحصائيات WebSocket
                </a>
                <a
                  href="/test-websocket.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  🧪 اختبار WebSocket التفاعلي
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
