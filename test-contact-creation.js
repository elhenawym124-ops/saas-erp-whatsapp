/**
 * Test Script for Contact Creation and Message Display
 * 
 * This script tests the new contact creation functionality when receiving
 * messages from unknown phone numbers.
 * 
 * Usage:
 *   node test-contact-creation.js
 */

import axios from 'axios';
import { io } from 'socket.io-client';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:8000';
const WS_URL = process.env.WS_URL || 'http://localhost:8000';

// Test credentials (update these)
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Test phone numbers (update these)
const TEST_NUMBERS = {
  sessionNumber: '201017854018',  // Your WhatsApp Business number
  newContact: '201234567890',     // New number to test with
};

let authToken = null;
let socket = null;

/**
 * Login and get authentication token
 */
async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

/**
 * Connect to WebSocket
 */
function connectWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Connecting to WebSocket...');
    
    socket = io(WS_URL, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('✅ WebSocket connected, Socket ID:', socket.id);
      resolve();
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      reject(error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });
    
    // Listen for new contact events
    socket.on('new_contact', (data) => {
      console.log('\n📱 NEW CONTACT EVENT RECEIVED:');
      console.log('  Session ID:', data.sessionId);
      console.log('  Phone Number:', data.contact.phoneNumber);
      console.log('  Name:', data.contact.name);
      console.log('  JID:', data.contact.jid);
      console.log('  Created At:', data.contact.createdAt);
      console.log('  Timestamp:', data.timestamp);
    });
    
    socket.on('whatsapp_contact_created', (data) => {
      console.log('\n📱 WHATSAPP CONTACT CREATED EVENT RECEIVED:');
      console.log('  Session ID:', data.sessionId);
      console.log('  Phone Number:', data.contact.phoneNumber);
      console.log('  Name:', data.contact.name);
    });
    
    // Listen for new message events
    socket.on('new_message', (data) => {
      console.log('\n💬 NEW MESSAGE EVENT RECEIVED:');
      console.log('  Session ID:', data.sessionId);
      console.log('  From:', data.message.fromNumber);
      console.log('  To:', data.message.toNumber);
      console.log('  Direction:', data.message.direction);
      console.log('  Content:', data.message.content);
      console.log('  Timestamp:', data.timestamp);
    });
    
    socket.on('whatsapp_message', (data) => {
      console.log('\n💬 WHATSAPP MESSAGE EVENT RECEIVED:');
      console.log('  Session ID:', data.sessionId);
      console.log('  Message ID:', data.message.messageId);
      console.log('  Direction:', data.message.direction);
    });
  });
}

/**
 * Get current contacts
 */
async function getContacts() {
  try {
    console.log('\n📋 Fetching current contacts...');
    const response = await axios.get(`${API_URL}/api/v1/whatsapp/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      const contacts = response.data.data.contacts;
      console.log(`✅ Found ${contacts.length} contacts`);
      
      // Check if test number exists
      const testContact = contacts.find(c => c.phoneNumber.includes(TEST_NUMBERS.newContact.slice(-10)));
      if (testContact) {
        console.log(`⚠️  Test number ${TEST_NUMBERS.newContact} already exists as contact`);
        console.log('   Contact ID:', testContact.id);
        console.log('   Name:', testContact.name);
      } else {
        console.log(`✅ Test number ${TEST_NUMBERS.newContact} is NOT in contacts (good for testing)`);
      }
      
      return contacts;
    } else {
      console.error('❌ Failed to fetch contacts:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching contacts:', error.message);
    return [];
  }
}

/**
 * Get messages for a contact
 */
async function getMessages(phoneNumber) {
  try {
    console.log(`\n📨 Fetching messages for ${phoneNumber}...`);
    const response = await axios.get(`${API_URL}/api/v1/whatsapp/messages`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { contact: phoneNumber }
    });
    
    if (response.data.success) {
      const messages = response.data.data.messages;
      console.log(`✅ Found ${messages.length} messages`);
      return messages;
    } else {
      console.error('❌ Failed to fetch messages:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching messages:', error.message);
    return [];
  }
}

/**
 * Wait for a specific duration
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting Contact Creation Tests\n');
  console.log('=' .repeat(60));
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Step 2: Connect WebSocket
  try {
    await connectWebSocket();
  } catch (error) {
    console.error('❌ Cannot proceed without WebSocket connection');
    process.exit(1);
  }
  
  // Step 3: Get initial contacts
  const initialContacts = await getContacts();
  const initialContactCount = initialContacts.length;
  
  // Step 4: Instructions for manual testing
  console.log('\n' + '='.repeat(60));
  console.log('📱 MANUAL TEST INSTRUCTIONS');
  console.log('='.repeat(60));
  console.log('\n1. Send a WhatsApp message from this number:');
  console.log(`   ${TEST_NUMBERS.newContact}`);
  console.log('\n2. Send it to your WhatsApp Business number:');
  console.log(`   ${TEST_NUMBERS.sessionNumber}`);
  console.log('\n3. Message content: "Test message for contact creation"');
  console.log('\n4. This script will monitor for:');
  console.log('   - new_contact WebSocket event');
  console.log('   - whatsapp_contact_created WebSocket event');
  console.log('   - new_message WebSocket event');
  console.log('   - Contact appearing in contact list');
  console.log('\n5. Waiting for 60 seconds...');
  console.log('='.repeat(60));
  
  // Step 5: Wait and monitor
  let newContactDetected = false;
  let newMessageDetected = false;
  
  const checkInterval = setInterval(async () => {
    const currentContacts = await getContacts();
    if (currentContacts.length > initialContactCount) {
      console.log('\n✅ NEW CONTACT DETECTED IN CONTACT LIST!');
      const newContact = currentContacts.find(c => 
        !initialContacts.some(ic => ic.id === c.id)
      );
      if (newContact) {
        console.log('   Phone:', newContact.phoneNumber);
        console.log('   Name:', newContact.name);
        console.log('   ID:', newContact.id);
        newContactDetected = true;
        
        // Check messages
        const messages = await getMessages(newContact.phoneNumber);
        if (messages.length > 0) {
          console.log('\n✅ MESSAGES FOUND FOR NEW CONTACT!');
          console.log(`   Total messages: ${messages.length}`);
          newMessageDetected = true;
        }
      }
    }
  }, 5000); // Check every 5 seconds
  
  // Wait for 60 seconds
  await wait(60000);
  
  clearInterval(checkInterval);
  
  // Step 6: Final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ WebSocket Events:`);
  console.log(`   - new_contact: ${newContactDetected ? '✅ RECEIVED' : '❌ NOT RECEIVED'}`);
  console.log(`   - new_message: ${newMessageDetected ? '✅ RECEIVED' : '❌ NOT RECEIVED'}`);
  
  const finalContacts = await getContacts();
  console.log(`\n✅ Contact List:`);
  console.log(`   - Initial count: ${initialContactCount}`);
  console.log(`   - Final count: ${finalContacts.length}`);
  console.log(`   - New contacts: ${finalContacts.length - initialContactCount}`);
  
  if (newContactDetected && newMessageDetected) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('   - Contact was created automatically');
    console.log('   - Message appeared in the UI');
    console.log('   - WebSocket events were received');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    if (!newContactDetected) {
      console.log('   - Contact was NOT created or WebSocket event was missed');
    }
    if (!newMessageDetected) {
      console.log('   - Message was NOT found for the new contact');
    }
  }
  
  console.log('='.repeat(60));
  
  // Cleanup
  if (socket) {
    socket.disconnect();
  }
  
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});

