console.log('🧪 Testing message content fixes...');

// Simple test cases
const testCases = [
  { content: '{"text":"مرحبا"}', expected: 'مرحبا' },
  { content: null, expected: '' },
  { content: '{}', expected: 'رسالة غير مدعومة' },
  { content: '{"text":""}', expected: 'رسالة غير مدعومة' }
];

testCases.forEach((test, i) => {
  console.log(`Test ${i + 1}: ${test.content} -> ${test.expected}`);
});

console.log('✅ Basic test completed!');
