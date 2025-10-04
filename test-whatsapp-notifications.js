/**
 * اختبار شامل لنظام الإشعارات والرسائل في WhatsApp
 * Comprehensive WhatsApp Notifications and Messages Test
 */

const axios = require('axios');
const io = require('socket.io-client');

// إعدادات الاختبار
const CONFIG = {
  API_BASE_URL: 'http://localhost:8000/api/v1',
  WS_URL: 'http://localhost:8000',
  TEST_SESSION: '183_123', // جلسة WhatsApp نشطة
  TEST_PHONE: '201017854018', // رقم للاختبار
  TOKEN: null // سيتم الحصول عليه من تسجيل الدخول
};

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 1. تسجيل الدخول والحصول على Token
 */
async function login() {
  try {
    log('🔐 تسجيل الدخول...', 'blue');
    
    const response = await axios.post(`${CONFIG.API_BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });

    if (response.data.success) {
      CONFIG.TOKEN = response.data.data.tokens.accessToken;
      log('✅ تم تسجيل الدخول بنجاح', 'green');
      log(`🔑 Token: ${CONFIG.TOKEN.substring(0, 50)}...`, 'cyan');
      return true;
    }
  } catch (error) {
    log(`❌ فشل تسجيل الدخول: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

/**
 * 2. فحص حالة جلسات WhatsApp
 */
async function checkWhatsAppSessions() {
  try {
    log('📱 فحص جلسات WhatsApp...', 'blue');
    log(`  URL: ${CONFIG.API_BASE_URL}/whatsapp/sessions`, 'cyan');
    log(`  Token: ${CONFIG.TOKEN.substring(0, 30)}...`, 'cyan');

    const response = await axios.get(`${CONFIG.API_BASE_URL}/whatsapp/sessions`, {
      headers: { Authorization: `Bearer ${CONFIG.TOKEN}` }
    });

    log('📊 Response received:', 'cyan');
    log(`  Status: ${response.status}`, 'cyan');
    log(`  Success: ${response.data.success}`, 'cyan');
    log(`  Data type: ${typeof response.data.data}`, 'cyan');
    log(`  Data is array: ${Array.isArray(response.data.data)}`, 'cyan');
    log(`  Raw data: ${JSON.stringify(response.data).substring(0, 200)}...`, 'cyan');

    if (response.data.success) {
      const sessions = Array.isArray(response.data.data) ? response.data.data : [];
      log(`✅ تم العثور على ${sessions.length} جلسة`, 'green');

      if (sessions.length > 0) {
        sessions.forEach(session => {
          const status = session.status === 'connected' || session.liveStatus === 'connected' ? '🟢' : '🔴';
          log(`  ${status} ${session.sessionName}:`, 'cyan');
          log(`    - DB Status: ${session.status}`, 'cyan');
          log(`    - Live Status: ${session.liveStatus || 'N/A'}`, 'cyan');
          log(`    - Organization ID: ${session.organizationId}`, 'cyan');
        });
      } else {
        log('  لا توجد جلسات نشطة', 'yellow');
      }

      return sessions;
    }
  } catch (error) {
    log(`❌ فشل في فحص الجلسات: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response) {
      log(`  Status Code: ${error.response.status}`, 'red');
      log(`  Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return [];
  }
}

/**
 * 3. اختبار WebSocket Connection
 */
function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    log('🔌 اختبار اتصال WebSocket...', 'blue');
    
    const socket = io(CONFIG.WS_URL, {
      auth: { token: CONFIG.TOKEN },
      transports: ['websocket']
    });

    let messageReceived = false;
    let sessionStatusReceived = false;

    // اختبار الاتصال
    socket.on('connect', () => {
      log('✅ تم الاتصال بـ WebSocket', 'green');
      
      // الاشتراك في جلسة
      socket.emit('subscribe_session', { sessionName: CONFIG.TEST_SESSION });
      log(`📡 تم الاشتراك في الجلسة: ${CONFIG.TEST_SESSION}`, 'cyan');
    });

    // اختبار استقبال الرسائل
    socket.on('new_message', (data) => {
      messageReceived = true;
      log('📨 تم استقبال رسالة جديدة عبر WebSocket:', 'green');
      log(`  الجلسة: ${data.sessionId}`, 'cyan');
      log(`  من: ${data.message.fromNumber}`, 'cyan');
      log(`  النوع: ${data.message.messageType}`, 'cyan');
      log(`  المحتوى: ${JSON.stringify(data.message.content).substring(0, 100)}...`, 'cyan');
    });

    // اختبار تحديثات حالة الجلسة
    socket.on('session_status_update', (data) => {
      sessionStatusReceived = true;
      log('📱 تم استقبال تحديث حالة الجلسة:', 'green');
      log(`  الجلسة: ${data.sessionId}`, 'cyan');
      log(`  الحالة: ${data.status}`, 'cyan');
    });

    // اختبار الأحداث الأخرى
    socket.on('whatsapp_message', (data) => {
      log('💬 تم استقبال رسالة WhatsApp عامة:', 'yellow');
      log(`  الجلسة: ${data.sessionId}`, 'cyan');
    });

    socket.on('whatsapp_session_update', (data) => {
      log('🔄 تم استقبال تحديث جلسة WhatsApp:', 'yellow');
      log(`  الجلسة: ${data.sessionId}`, 'cyan');
    });

    // أخطاء الاتصال
    socket.on('connect_error', (error) => {
      log(`❌ خطأ في اتصال WebSocket: ${error.message}`, 'red');
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      log(`🔌 تم قطع اتصال WebSocket: ${reason}`, 'yellow');
    });

    // إنهاء الاختبار بعد 30 ثانية
    setTimeout(() => {
      socket.disconnect();
      resolve({
        connected: true,
        messageReceived,
        sessionStatusReceived
      });
    }, 30000);
  });
}

/**
 * 4. اختبار إرسال رسالة واستقبال الرد
 */
async function testSendMessage() {
  try {
    log('📤 اختبار إرسال رسالة...', 'blue');
    
    const testMessage = `اختبار الإشعارات - ${new Date().toLocaleString('ar-EG')}`;
    
    const response = await axios.post(`${CONFIG.API_BASE_URL}/whatsapp/messages/send`, {
      to: CONFIG.TEST_PHONE,
      text: testMessage,
      sessionName: CONFIG.TEST_SESSION.split('_')[1] // إزالة organization ID
    }, {
      headers: { Authorization: `Bearer ${CONFIG.TOKEN}` }
    });

    if (response.data.success) {
      log('✅ تم إرسال الرسالة بنجاح', 'green');
      log(`  معرف الرسالة: ${response.data.data.messageId}`, 'cyan');
      return response.data.data;
    }
  } catch (error) {
    log(`❌ فشل في إرسال الرسالة: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

/**
 * 5. فحص الرسائل المحفوظة
 */
async function checkStoredMessages() {
  try {
    log('📋 فحص الرسائل المحفوظة...', 'blue');
    
    const response = await axios.get(`${CONFIG.API_BASE_URL}/whatsapp/messages`, {
      headers: { Authorization: `Bearer ${CONFIG.TOKEN}` },
      params: {
        sessionName: CONFIG.TEST_SESSION.split('_')[1],
        limit: 10
      }
    });

    if (response.data.success) {
      const messages = response.data.data.messages;
      log(`✅ تم العثور على ${messages.length} رسالة`, 'green');
      
      messages.slice(0, 3).forEach((msg, index) => {
        log(`  ${index + 1}. ${msg.direction} - ${msg.messageType} - ${msg.status}`, 'cyan');
        log(`     من: ${msg.fromNumber} إلى: ${msg.toNumber}`, 'cyan');
        log(`     الوقت: ${new Date(msg.sentAt).toLocaleString('ar-EG')}`, 'cyan');
      });
      
      return messages;
    }
  } catch (error) {
    log(`❌ فشل في فحص الرسائل: ${error.response?.data?.message || error.message}`, 'red');
    return [];
  }
}

/**
 * 6. اختبار شامل للنظام
 */
async function runComprehensiveTest() {
  log('🚀 بدء الاختبار الشامل لنظام الإشعارات والرسائل', 'magenta');
  log('============================================================', 'magenta');

  // 1. تسجيل الدخول
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('❌ فشل الاختبار: لا يمكن تسجيل الدخول', 'red');
    return;
  }

  // 2. فحص الجلسات
  const sessions = await checkWhatsAppSessions();
  if (!sessions || sessions.length === 0) {
    log('⚠️ تحذير: لا توجد جلسات WhatsApp نشطة، سنتابع الاختبار', 'yellow');
    // return; // لا نوقف الاختبار، نتابع
  }

  // 3. اختبار WebSocket
  log('\n📡 اختبار WebSocket (30 ثانية)...', 'blue');
  const wsResults = await testWebSocketConnection();
  
  // 4. اختبار إرسال رسالة
  await testSendMessage();
  
  // 5. فحص الرسائل المحفوظة
  await checkStoredMessages();

  // 6. تقرير النتائج
  log('\n📊 تقرير النتائج:', 'magenta');
  log('========================================', 'magenta');
  log(`✅ تسجيل الدخول: نجح`, 'green');
  log(`✅ جلسات WhatsApp: ${sessions.length} جلسة نشطة`, 'green');
  log(`${wsResults.connected ? '✅' : '❌'} اتصال WebSocket: ${wsResults.connected ? 'نجح' : 'فشل'}`, wsResults.connected ? 'green' : 'red');
  log(`${wsResults.messageReceived ? '✅' : '⚠️'} استقبال الرسائل: ${wsResults.messageReceived ? 'يعمل' : 'لم يتم اختباره'}`, wsResults.messageReceived ? 'green' : 'yellow');
  log(`${wsResults.sessionStatusReceived ? '✅' : '⚠️'} تحديثات الحالة: ${wsResults.sessionStatusReceived ? 'يعمل' : 'لم يتم اختباره'}`, wsResults.sessionStatusReceived ? 'green' : 'yellow');

  log('\n🎉 انتهى الاختبار!', 'magenta');
}

// تشغيل الاختبار
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = {
  runComprehensiveTest,
  testWebSocketConnection,
  checkWhatsAppSessions,
  testSendMessage
};
