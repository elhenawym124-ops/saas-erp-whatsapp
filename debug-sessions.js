/**
 * Debug script to check active WhatsApp sessions
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/v1';

async function debugSessions() {
  try {
    console.log('🔍 Debugging WhatsApp Sessions...\n');

    // 1. Login as test-org183@example.com
    console.log('1️⃣ Logging in as test-org183@example.com...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test-org183@example.com',
      password: 'Test123456'
    });

    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;
    console.log(`✅ Logged in successfully`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Organization ID: ${user.organizationId}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}\n`);

    // 2. Get sessions from API
    console.log('2️⃣ Fetching sessions from API...');
    const sessionsResponse = await axios.get(`${BASE_URL}/whatsapp/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sessions = sessionsResponse.data.data.sessions;
    console.log(`✅ Found ${sessions.length} sessions:\n`);
    
    sessions.forEach((session, index) => {
      console.log(`   Session ${index + 1}:`);
      console.log(`   - ID: ${session.id}`);
      console.log(`   - Session Name: ${session.sessionName}`);
      console.log(`   - Phone Number: ${session.phoneNumber}`);
      console.log(`   - Status: ${session.status}`);
      console.log(`   - Expected sessionId: ${user.organizationId}_${session.sessionName}`);
      console.log('');
    });

    // 3. Test sending message with each session
    console.log('3️⃣ Testing message sending with each session...\n');
    
    for (const session of sessions) {
      const sessionName = session.sessionName;
      const expectedSessionId = `${user.organizationId}_${sessionName}`;
      
      console.log(`   Testing session: ${sessionName} (${expectedSessionId})`);
      
      try {
        const sendResponse = await axios.post(
          `${BASE_URL}/whatsapp/messages/send`,
          {
            sessionName: sessionName,
            to: '201017854018',
            text: `🧪 Test message from session ${sessionName}`
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        console.log(`   ✅ SUCCESS - Message sent with session ${sessionName}`);
        console.log(`      Message ID: ${sendResponse.data.data.messageId}\n`);
      } catch (error) {
        console.log(`   ❌ FAILED - ${error.response?.data?.message || error.message}\n`);
      }
    }

    // 4. Summary
    console.log('\n📊 Summary:');
    console.log(`   Organization ID: ${user.organizationId}`);
    console.log(`   Available Sessions: ${sessions.map(s => s.sessionName).join(', ')}`);
    console.log(`   Expected sessionIds:`);
    sessions.forEach(s => {
      console.log(`   - ${user.organizationId}_${s.sessionName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugSessions();

