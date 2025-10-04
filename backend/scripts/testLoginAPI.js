import axios from 'axios';

async function testLogin() {
  try {
    console.log('🧪 Testing Login API...\n');

    const loginData = {
      email: 'admin@example.com',
      password: 'Admin@1234',
    };

    console.log('📤 Sending request to: http://localhost:3000/api/v1/auth/login');
    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password:', loginData.password);
    console.log('');

    const response = await axios.post(
      'http://localhost:3000/api/v1/auth/login',
      loginData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Login successful!');
    console.log('📊 Status:', response.status);
    console.log('📦 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('🎫 Access Token:', response.data.data.accessToken.substring(0, 50) + '...');
    console.log('👤 User:', response.data.data.user.email);
    console.log('🏢 Organization:', response.data.data.user.organization.name);
    console.log('');
    console.log('✅ Test passed!');
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full error:', error.response?.data);
    process.exit(1);
  }
}

testLogin();

