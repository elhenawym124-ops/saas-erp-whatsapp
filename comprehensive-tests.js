#!/usr/bin/env node

/**
 * 🧪 WhatsApp Messages - Comprehensive Test Suite
 * ================================================
 * Tests: Backend APIs + Frontend Integration + End-to-End
 */

import axios from 'axios';
import fs from 'fs';

// Configuration
const BASE_URL = 'http://localhost:8000/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk0LCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU5NTA2NDEzLCJleHAiOjE3NTk1OTI4MTN9.7rFHzNJiWjwrO7wOAJ_EVcZvBezouoKYYKhV8SWD1Iw';

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
  log('\n' + '='.repeat(60), 'blue');
  log(title, 'blue');
  log('='.repeat(60) + '\n', 'blue');
}

async function runTest(name, testFn) {
  results.total++;
  process.stdout.write(`${colors.yellow}🧪 Test ${results.total}: ${name}${colors.reset} ... `);
  
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED', error: null });
    log('✅ PASSED', 'green');
    return true;
  } catch (error) {
    results.failed++;
    const errorMsg = error.response?.data?.message || error.message;
    results.tests.push({ name, status: 'FAILED', error: errorMsg });
    log(`❌ FAILED: ${errorMsg}`, 'red');
    return false;
  }
}

// API Client
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// ============================================
// Phase 1: Backend API Tests
// ============================================

async function testBackendAPIs() {
  printHeader('Phase 1: Backend API Tests');
  
  // Test 1.1: GET /whatsapp/sessions
  await runTest('GET /whatsapp/sessions', async () => {
    const res = await api.get('/whatsapp/sessions');
    if (!res.data.success) throw new Error('Response not successful');
  });
  
  // Test 1.2: GET /whatsapp/contacts
  await runTest('GET /whatsapp/contacts', async () => {
    const res = await api.get('/whatsapp/contacts');
    if (!res.data.success) throw new Error('Response not successful');
    if (!res.data.data.contacts) throw new Error('No contacts array in response');
  });
  
  // Test 1.3: GET /whatsapp/conversations
  await runTest('GET /whatsapp/conversations', async () => {
    const res = await api.get('/whatsapp/conversations');
    if (!res.data.success) throw new Error('Response not successful');
  });
  
  // Test 1.4: GET /templates
  await runTest('GET /templates', async () => {
    const res = await api.get('/templates');
    if (!res.data.success) throw new Error('Response not successful');
    if (!Array.isArray(res.data.data.templates)) throw new Error('Templates not an array');
    log(`   Found ${res.data.data.templates.length} templates`, 'cyan');
  });
  
  // Test 1.5: GET /whatsapp/messages/:phoneNumber
  await runTest('GET /whatsapp/messages/:phoneNumber', async () => {
    const res = await api.get('/whatsapp/messages/201123087745');
    if (!res.data.success) throw new Error('Response not successful');
    log(`   Found ${res.data.data?.messages?.length || 0} messages`, 'cyan');
  });
  
  // Test 1.6: GET /whatsapp/conversations/:id
  await runTest('GET /whatsapp/conversations/:id (should fail - no conversations)', async () => {
    try {
      await api.get('/whatsapp/conversations/999');
    } catch (error) {
      if (error.response?.status === 404) {
        return; // Expected 404
      }
      throw error;
    }
  });
  
  // Test 1.7: POST /templates/:id/use
  await runTest('POST /templates/:id/use', async () => {
    const res = await api.post('/templates/13/use');
    if (!res.data.success) throw new Error('Response not successful');
  });
}

// ============================================
// Phase 2: Message Operations Tests
// ============================================

async function testMessageOperations() {
  printHeader('Phase 2: Message Operations Tests');
  
  // Test 2.1: Send text message
  await runTest('POST /whatsapp/send-message (text)', async () => {
    const res = await api.post('/whatsapp/send-message', {
      sessionName: '123',
      to: '201017854018',
      text: '🧪 Test message from automated test suite'
    });
    if (!res.data.success) throw new Error('Response not successful');
    log(`   Message sent successfully`, 'cyan');
  });
  
  // Test 2.2: Get messages after sending
  await runTest('GET /whatsapp/messages/:phoneNumber (after send)', async () => {
    // Wait a bit for message to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    const res = await api.get('/whatsapp/messages/201017854018');
    if (!res.data.success) throw new Error('Response not successful');
    log(`   Found ${res.data.data?.messages?.length || 0} messages`, 'cyan');
  });
}

// ============================================
// Phase 3: Conversation Management Tests
// ============================================

async function testConversationManagement() {
  printHeader('Phase 3: Conversation Management Tests');
  
  // Test 3.1: Get conversations
  await runTest('GET /whatsapp/conversations', async () => {
    const res = await api.get('/whatsapp/conversations');
    if (!res.data.success) throw new Error('Response not successful');
    log(`   Found ${res.data.data?.conversations?.length || 0} conversations`, 'cyan');
  });
}

// ============================================
// Phase 4: Template Tests
// ============================================

async function testTemplates() {
  printHeader('Phase 4: Template Tests');
  
  // Test 4.1: Get all templates
  await runTest('GET /templates', async () => {
    const res = await api.get('/templates');
    if (!res.data.success) throw new Error('Response not successful');
    const templates = res.data.data.templates;
    log(`   Found ${templates.length} templates`, 'cyan');
    if (templates.length > 0) {
      log(`   First template: ${templates[0].name}`, 'cyan');
    }
  });
  
  // Test 4.2: Get template by shortcut
  await runTest('GET /templates/shortcut/:shortcut', async () => {
    const res = await api.get('/templates/shortcut//hello');
    if (!res.data.success) throw new Error('Response not successful');
    log(`   Template: ${res.data.data.template.name}`, 'cyan');
  });
  
  // Test 4.3: Use template
  await runTest('POST /templates/:id/use', async () => {
    const res = await api.post('/templates/13/use');
    if (!res.data.success) throw new Error('Response not successful');
  });
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  log('\n🚀 Starting Comprehensive Test Suite...', 'cyan');
  log(`📅 Date: ${new Date().toISOString()}`, 'cyan');
  log(`🔗 Base URL: ${BASE_URL}\n`, 'cyan');
  
  try {
    await testBackendAPIs();
    await testMessageOperations();
    await testConversationManagement();
    await testTemplates();
    
    // Print summary
    printHeader('Test Summary');
    log(`Total Tests: ${results.total}`, 'blue');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, 'red');
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%\n`, 'cyan');
    
    // Save results to file
    const reportPath = 'TEST_RESULTS_DETAILED.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    log(`📄 Detailed results saved to: ${reportPath}`, 'cyan');
    
    if (results.failed === 0) {
      log('\n🎉 All tests passed!\n', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed!\n', 'yellow');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}\n`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();

