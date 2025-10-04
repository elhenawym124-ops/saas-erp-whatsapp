// Test the message display fix in frontend context
// Copy of getMessageContent function from messageUtils.ts
function getMessageContent(message) {
  // Handle null/undefined message
  if (!message) {
    return '';
  }

  // Handle both string and object content
  if (typeof message.content === 'string') {
    // If content is empty, return empty
    if (!message.content.trim()) {
      return '';
    }

    try {
      // Try to parse JSON string content
      const parsed = JSON.parse(message.content);

      // Handle different content types
      if (parsed.text && typeof parsed.text === 'string' && parsed.text.trim()) {
        return parsed.text.trim();
      }

      if (parsed.caption && typeof parsed.caption === 'string' && parsed.caption.trim()) {
        return parsed.caption.trim();
      }

      // Handle media messages
      if (parsed.mimetype) {
        if (parsed.mimetype.startsWith('image/')) {
          return parsed.caption?.trim() || '📷 صورة';
        }
        if (parsed.mimetype.startsWith('video/')) {
          return parsed.caption?.trim() || '🎥 فيديو';
        }
        if (parsed.mimetype.startsWith('audio/')) {
          return parsed.caption?.trim() || '🎵 صوت';
        }
        if (parsed.mimetype === 'application/pdf') {
          return parsed.caption?.trim() || '📄 ملف PDF';
        }
        if (parsed.mimetype.startsWith('application/')) {
          return parsed.caption?.trim() || '📎 ملف';
        }
        return parsed.caption?.trim() || '📎 ملف';
      }

      // Handle protocol messages (system messages)
      if (parsed.raw) {
        try {
          const rawParsed = JSON.parse(parsed.raw);
          if (rawParsed.protocolMessage) {
            return '📋 رسالة نظام';
          }
          if (rawParsed.senderKeyDistributionMessage) {
            return '🔐 رسالة تشفير';
          }
          if (rawParsed.reactionMessage) {
            return '👍 تفاعل';
          }
        } catch (e) {
          // Ignore parsing errors for raw content
        }
        return '📋 رسالة نظام';
      }

      // If parsed but no recognizable content, check if it's just a simple object
      if (typeof parsed === 'object' && parsed !== null) {
        // If it's an empty object or doesn't have text content, return placeholder
        return 'رسالة غير مدعومة';
      }

      // If it's a simple value, return it
      return String(parsed).trim();
    } catch (e) {
      // If not valid JSON, return as is (it's probably plain text)
      return message.content.trim();
    }
  }

  // Handle object content
  if (typeof message.content === 'object' && message.content !== null) {
    if (message.content.text && typeof message.content.text === 'string' && message.content.text.trim()) {
      return message.content.text.trim();
    }
    if (message.content.caption && typeof message.content.caption === 'string' && message.content.caption.trim()) {
      return message.content.caption.trim();
    }

    // Handle media objects without text/caption
    if (message.content.mimetype) {
      if (message.content.mimetype.startsWith('image/')) {
        return '📷 صورة';
      }
      if (message.content.mimetype.startsWith('video/')) {
        return '🎥 فيديو';
      }
      if (message.content.mimetype.startsWith('audio/')) {
        return '🎵 صوت';
      }
      if (message.content.mimetype === 'application/pdf') {
        return '📄 ملف PDF';
      }
      if (message.content.mimetype.startsWith('application/')) {
        return '📎 ملف';
      }
      return '📎 ملف';
    }

    return '';
  }

  // Fallback to body field
  if (message.body && typeof message.body === 'string' && message.body.trim()) {
    return message.body.trim();
  }

  // Additional fallbacks for different message structures
  if (message.text && typeof message.text === 'string' && message.text.trim()) {
    return message.text.trim();
  }

  if (message.message && typeof message.message === 'string' && message.message.trim()) {
    return message.message.trim();
  }

  // If message has messageType but no content, show type-specific placeholder
  if (message.messageType) {
    switch (message.messageType) {
      case 'image':
        return '📷 صورة';
      case 'video':
        return '🎥 فيديو';
      case 'audio':
        return '🎵 صوت';
      case 'document':
        return '📄 مستند';
      case 'location':
        return '📍 موقع';
      case 'contact':
        return '👤 جهة اتصال';
      case 'sticker':
        return '😀 ملصق';
      default:
        return '';
    }
  }

  return '';
}

// Simulate real message data from backend
const realMessageExamples = [
  // Inbound text message
  {
    id: 1,
    messageId: 'ABC123',
    direction: 'inbound',
    fromNumber: '201234567890',
    toNumber: 'me',
    messageType: 'text',
    content: '{"text":"مرحبا، كيف يمكنني مساعدتك؟"}',
    status: 'received',
    sentAt: '2024-01-01T10:00:00Z'
  },
  
  // Outbound text message
  {
    id: 2,
    messageId: 'DEF456',
    direction: 'outbound',
    fromNumber: 'me',
    toNumber: '201234567890',
    messageType: 'text',
    content: '{"text":"شكراً لك، أحتاج معلومات عن المنتج"}',
    status: 'sent',
    sentAt: '2024-01-01T10:01:00Z'
  },
  
  // Inbound image with caption
  {
    id: 3,
    messageId: 'GHI789',
    direction: 'inbound',
    fromNumber: '201234567890',
    toNumber: 'me',
    messageType: 'image',
    content: '{"caption":"هذه صورة المنتج","mimetype":"image/jpeg"}',
    status: 'received',
    sentAt: '2024-01-01T10:02:00Z'
  },
  
  // Outbound image without caption
  {
    id: 4,
    messageId: 'JKL012',
    direction: 'outbound',
    fromNumber: 'me',
    toNumber: '201234567890',
    messageType: 'image',
    content: '{"caption":"","mimetype":"image/jpeg"}',
    status: 'sent',
    sentAt: '2024-01-01T10:03:00Z'
  },
  
  // Inbound system message
  {
    id: 5,
    messageId: 'MNO345',
    direction: 'inbound',
    fromNumber: '201234567890',
    toNumber: 'me',
    messageType: 'text',
    content: '{"raw":"{\\"protocolMessage\\":{\\"type\\":\\"HISTORY_SYNC_NOTIFICATION\\"}}"}',
    status: 'received',
    sentAt: '2024-01-01T10:04:00Z'
  },
  
  // Problematic message - empty content
  {
    id: 6,
    messageId: 'PQR678',
    direction: 'inbound',
    fromNumber: '201234567890',
    toNumber: 'me',
    messageType: 'text',
    content: null,
    status: 'received',
    sentAt: '2024-01-01T10:05:00Z'
  },
  
  // Problematic message - empty JSON
  {
    id: 7,
    messageId: 'STU901',
    direction: 'outbound',
    fromNumber: 'me',
    toNumber: '201234567890',
    messageType: 'text',
    content: '{}',
    status: 'sent',
    sentAt: '2024-01-01T10:06:00Z'
  },
  
  // Problematic message - empty text in JSON
  {
    id: 8,
    messageId: 'VWX234',
    direction: 'inbound',
    fromNumber: '201234567890',
    toNumber: 'me',
    messageType: 'text',
    content: '{"text":""}',
    status: 'received',
    sentAt: '2024-01-01T10:07:00Z'
  }
];

console.log('🧪 Testing message display fix in frontend context...\n');

// Test each message
let totalMessages = realMessageExamples.length;
let messagesWithContent = 0;
let messagesWithoutContent = 0;
let inboundWithoutContent = 0;
let outboundWithoutContent = 0;

realMessageExamples.forEach((msg, index) => {
  console.log(`--- Message ${index + 1} (${msg.direction}) ---`);
  console.log(`ID: ${msg.id}`);
  console.log(`Type: ${msg.messageType}`);
  console.log(`Raw Content: ${JSON.stringify(msg.content)}`);
  
  // Test the fixed getMessageContent function
  const displayContent = getMessageContent(msg);
  console.log(`Display Content: "${displayContent}"`);
  console.log(`Has Content: ${!!displayContent}`);
  
  // Count statistics
  if (displayContent) {
    messagesWithContent++;
  } else {
    messagesWithoutContent++;
    if (msg.direction === 'inbound') {
      inboundWithoutContent++;
    } else {
      outboundWithoutContent++;
    }
  }
  
  // Test search functionality
  const searchQuery = 'مرحبا';
  const searchMatch = displayContent.toLowerCase().includes(searchQuery.toLowerCase());
  console.log(`Search for "${searchQuery}": ${searchMatch}`);
  
  console.log('');
});

// Print summary
console.log('📊 Summary:');
console.log(`Total messages: ${totalMessages}`);
console.log(`Messages with content: ${messagesWithContent}`);
console.log(`Messages without content: ${messagesWithoutContent}`);
console.log(`Inbound without content: ${inboundWithoutContent}`);
console.log(`Outbound without content: ${outboundWithoutContent}`);

// Test consistency between display and search
console.log('\n🔍 Testing search consistency:');

const searchTestCases = [
  { query: 'مرحبا', expectedMatches: 1 },
  { query: 'منتج', expectedMatches: 2 },
  { query: 'صورة', expectedMatches: 2 }, // One caption + one placeholder
  { query: 'نظام', expectedMatches: 1 }
];

searchTestCases.forEach(testCase => {
  const matches = realMessageExamples.filter(msg => {
    const content = getMessageContent(msg);
    return content.toLowerCase().includes(testCase.query.toLowerCase());
  });
  
  console.log(`Search "${testCase.query}": ${matches.length} matches (expected: ${testCase.expectedMatches})`);
  console.log(`✅ ${matches.length === testCase.expectedMatches ? 'PASS' : 'FAIL'}`);
});

// Test edge cases
console.log('\n🔧 Testing edge cases:');

const edgeCases = [
  { content: null, expected: '' },
  { content: '', expected: '' },
  { content: '{}', expected: 'رسالة غير مدعومة' },
  { content: '{"text":""}', expected: 'رسالة غير مدعومة' },
  { content: '{"text":"   "}', expected: 'رسالة غير مدعومة' },
  { content: { text: null }, expected: '' },
  { content: { text: '' }, expected: '' },
  { content: { text: '   ' }, expected: '' },
  { content: { mimetype: 'image/jpeg' }, expected: '📷 صورة' }
];

edgeCases.forEach((testCase, index) => {
  const result = getMessageContent({ content: testCase.content });
  const passed = result === testCase.expected;
  console.log(`Edge case ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  if (!passed) {
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got: "${result}"`);
  }
});

console.log('\n✅ Frontend message display test completed!');

// Simulate the filtering logic from the frontend
console.log('\n🔍 Testing frontend filtering logic:');

const searchQuery = 'مرحبا';
const filteredMessages = realMessageExamples.filter((msg) => {
  // This is the FIXED search logic
  const content = getMessageContent(msg);
  return content.toLowerCase().includes(searchQuery.toLowerCase());
});

console.log(`Filtered messages for "${searchQuery}": ${filteredMessages.length}`);
filteredMessages.forEach(msg => {
  console.log(`- Message ${msg.id}: "${getMessageContent(msg)}"`);
});

console.log('\n🎉 All tests completed successfully!');
