/**
 * Test Messages Debug Script
 *
 * This script tests the validation functions with real API data
 */

// Import validation functions
const { isValidMessage, validatePhoneNumber } = require('./src/utils/validation.ts');

// Sample message from API (based on backend logs)
const sampleMessages = [
  {
    id: 1173,
    messageId: "ACD20CB507E8493533A09590D40AC232",
    direction: "inbound",
    fromNumber: "120363272840857632@g.us",
    toNumber: "me",
    content: "{\"text\":\"يا شباب الدمج من الدعم واقف ولا ايه\\nفتحت\"}",
    messageType: "text",
    status: "delivered",
    sentAt: "2025-01-01T10:00:00.000Z",
    organizationId: 183,
    sessionName: "123",
    createdAt: "2025-01-01T10:00:00.000Z",
    updatedAt: "2025-01-01T10:00:00.000Z"
  },
  {
    id: 1168,
    messageId: "3EB03E38F74281BC38FA3F",
    direction: "inbound",
    fromNumber: "12513732044@s.whatsapp.net",
    toNumber: "me",
    content: "{\"text\":\"أهلاً بك مرة تانية. حابين نشكر حضرتك على \"}",
    messageType: "text",
    status: "delivered",
    sentAt: "2025-01-01T09:00:00.000Z",
    organizationId: 183,
    sessionName: "123",
    createdAt: "2025-01-01T09:00:00.000Z",
    updatedAt: "2025-01-01T09:00:00.000Z"
  },
  {
    id: 1242,
    messageId: "3EB042F0F750087F7A6EC6",
    direction: "outbound",
    fromNumber: "me",
    toNumber: "201123087139@s.whatsapp.net",
    content: "{\"text\":\"0000\"}",
    messageType: "text",
    status: "sent",
    sentAt: "2025-01-01T11:00:00.000Z",
    organizationId: 183,
    sessionName: "123",
    createdAt: "2025-01-01T11:00:00.000Z",
    updatedAt: "2025-01-01T11:00:00.000Z"
  }
];

console.log('🧪 Testing Message Validation\n');
console.log('=' .repeat(60));

sampleMessages.forEach((msg, index) => {
  console.log(`\n📨 Message ${index + 1}:`);
  console.log(`   ID: ${msg.id}`);
  console.log(`   From: ${msg.fromNumber}`);
  console.log(`   To: ${msg.toNumber}`);
  console.log(`   Direction: ${msg.direction}`);

  // Test validation
  try {
    const isValid = isValidMessage(msg);
    console.log(`   ✅ Validation: ${isValid ? 'PASS' : 'FAIL'}`);

    if (!isValid) {
      console.log(`   ❌ Message failed validation!`);

      // Test individual fields
      console.log(`   Testing individual fields:`);
      console.log(`     - ID: ${typeof msg.id === 'number' && msg.id > 0}`);
      console.log(`     - messageId: ${typeof msg.messageId === 'string' && msg.messageId.length > 0}`);
      console.log(`     - direction: ${msg.direction === 'inbound' || msg.direction === 'outbound'}`);
      console.log(`     - fromNumber: ${typeof msg.fromNumber === 'string' && msg.fromNumber.length > 0}`);
      console.log(`     - toNumber: ${typeof msg.toNumber === 'string' && msg.toNumber.length > 0}`);
      console.log(`     - messageType: ${typeof msg.messageType === 'string'}`);
      console.log(`     - content: ${msg.content !== null && msg.content !== undefined}`);
      console.log(`     - status: ${typeof msg.status === 'string'}`);
      console.log(`     - sentAt: ${typeof msg.sentAt === 'string' && msg.sentAt.length > 0}`);
    }
  } catch (error) {
    console.log(`   ❌ Error during validation: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ Test completed!\n');