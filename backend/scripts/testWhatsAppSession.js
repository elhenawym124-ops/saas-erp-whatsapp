import axios from 'axios';

async function testWhatsAppSession() {
  try {
    console.log('🧪 Testing WhatsApp Session Creation...\n');

    // 1. تسجيل الدخول
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@example.com',
      password: 'Admin@1234',
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Logged in successfully\n');

    // 2. إنشاء جلسة WhatsApp
    console.log('2️⃣ Creating WhatsApp session...');
    const createResponse = await axios.post(
      'http://localhost:3000/api/v1/whatsapp/sessions',
      { sessionName: 'default' },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ Session created:', createResponse.data.data.sessionId);
    console.log('📝 Message:', createResponse.data.message);
    console.log('');

    // 3. الانتظار قليلاً لتوليد QR Code
    console.log('3️⃣ Waiting for QR Code generation (5 seconds)...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log('');

    // 4. محاولة الحصول على QR Code
    console.log('4️⃣ Fetching QR Code...');
    try {
      const qrResponse = await axios.get(
        'http://localhost:3000/api/v1/whatsapp/sessions/default/qr',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ QR Code received!');
      console.log('📊 QR Code length:', qrResponse.data.data.qrCode.length);
      console.log('📝 Message:', qrResponse.data.message);
      console.log('');
      console.log('🎉 Test passed!');
    } catch (qrError) {
      console.error('❌ QR Code not available yet');
      console.error('Status:', qrError.response?.status);
      console.error('Message:', qrError.response?.data?.message);
      console.log('');
      console.log('⚠️  This might be normal - QR Code generation can take time');
      console.log('💡 Try refreshing the page in the browser');
    }

    // 5. الحصول على قائمة الجلسات
    console.log('');
    console.log('5️⃣ Fetching sessions list...');
    const sessionsResponse = await axios.get('http://localhost:3000/api/v1/whatsapp/sessions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Sessions:', sessionsResponse.data.data.sessions.length);
    sessionsResponse.data.data.sessions.forEach((session) => {
      console.log(`   - ${session.sessionName}: ${session.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testWhatsAppSession();

