// Test message content parsing with different scenarios

// getMessageContent function from frontend
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

// Test cases based on different scenarios
const testMessages = [
  // Case 1: Normal text message (JSON string)
  {
    id: 1,
    direction: 'inbound',
    content: '{"text":"مرحبا كيف الحال؟"}',
    description: 'Normal text message (JSON string)'
  },
  
  // Case 2: Normal text message (object)
  {
    id: 2,
    direction: 'outbound',
    content: { text: 'أهلا وسهلا' },
    description: 'Normal text message (object)'
  },
  
  // Case 3: Empty content (null)
  {
    id: 3,
    direction: 'inbound',
    content: null,
    description: 'Empty content (null)'
  },
  
  // Case 4: Empty content (empty string)
  {
    id: 4,
    direction: 'outbound',
    content: '',
    description: 'Empty content (empty string)'
  },
  
  // Case 5: Empty JSON object
  {
    id: 5,
    direction: 'inbound',
    content: '{}',
    description: 'Empty JSON object'
  },
  
  // Case 6: Image message with caption
  {
    id: 6,
    direction: 'outbound',
    content: '{"caption":"صورة جميلة","mimetype":"image/jpeg"}',
    description: 'Image message with caption'
  },
  
  // Case 7: Image message without caption
  {
    id: 7,
    direction: 'inbound',
    content: '{"caption":"","mimetype":"image/jpeg"}',
    description: 'Image message without caption'
  },
  
  // Case 8: System message
  {
    id: 8,
    direction: 'inbound',
    content: '{"raw":"{\\"protocolMessage\\":{\\"type\\":\\"HISTORY_SYNC_NOTIFICATION\\"}}"}',
    description: 'System message'
  },
  
  // Case 9: Plain text (not JSON)
  {
    id: 9,
    direction: 'outbound',
    content: 'رسالة نصية عادية',
    description: 'Plain text (not JSON)'
  },
  
  // Case 10: Invalid JSON
  {
    id: 10,
    direction: 'inbound',
    content: '{"text":"مرحبا"',
    description: 'Invalid JSON'
  },
  
  // Case 11: Object with empty text
  {
    id: 11,
    direction: 'outbound',
    content: { text: '' },
    description: 'Object with empty text'
  },
  
  // Case 12: Object with null text
  {
    id: 12,
    direction: 'inbound',
    content: { text: null },
    description: 'Object with null text'
  },

  // Case 13: Object with whitespace-only text
  {
    id: 13,
    direction: 'outbound',
    content: { text: '   ' },
    description: 'Object with whitespace-only text'
  },

  // Case 14: JSON with empty text
  {
    id: 14,
    direction: 'inbound',
    content: '{"text":""}',
    description: 'JSON with empty text'
  },

  // Case 15: JSON with whitespace-only text
  {
    id: 15,
    direction: 'outbound',
    content: '{"text":"   "}',
    description: 'JSON with whitespace-only text'
  },

  // Case 16: Media object without caption
  {
    id: 16,
    direction: 'inbound',
    content: { mimetype: 'image/jpeg' },
    description: 'Media object without caption'
  },

  // Case 17: Message with messageType but no content
  {
    id: 17,
    direction: 'outbound',
    content: null,
    messageType: 'image',
    description: 'Message with messageType but no content'
  },

  // Case 18: Message with body field
  {
    id: 18,
    direction: 'inbound',
    body: 'رسالة في body field',
    description: 'Message with body field'
  }
];

console.log('🧪 Testing message content parsing...\n');

let emptyResults = 0;
let validResults = 0;
let inboundEmpty = 0;
let outboundEmpty = 0;

testMessages.forEach((msg, index) => {
  console.log(`--- Test ${index + 1}: ${msg.description} ---`);
  console.log(`Input: ${JSON.stringify(msg.content)}`);
  
  const result = getMessageContent(msg);
  console.log(`Output: "${result}"`);
  console.log(`Empty: ${!result}`);
  console.log(`Direction: ${msg.direction}`);
  
  // Count statistics
  if (!result) {
    emptyResults++;
    if (msg.direction === 'inbound') {
      inboundEmpty++;
    } else {
      outboundEmpty++;
    }
  } else {
    validResults++;
  }
  
  console.log('');
});

console.log('📊 Summary:');
console.log(`Total tests: ${testMessages.length}`);
console.log(`Valid results: ${validResults}`);
console.log(`Empty results: ${emptyResults}`);
console.log(`Inbound empty: ${inboundEmpty}`);
console.log(`Outbound empty: ${outboundEmpty}`);

// Test the search logic issue
console.log('\n🔍 Testing search logic issue:');

const searchTestMessage = {
  content: '{"text":"مرحبا كيف الحال؟"}'
};

// Current problematic search logic
const currentSearchContent = typeof searchTestMessage.content === 'string'
  ? searchTestMessage.content
  : searchTestMessage.content?.text || '';

// Correct search logic
const correctSearchContent = getMessageContent(searchTestMessage);

console.log(`Current search logic result: "${currentSearchContent}"`);
console.log(`Correct search logic result: "${correctSearchContent}"`);
console.log(`Search would work with current logic: ${currentSearchContent.includes('مرحبا')}`);
console.log(`Search would work with correct logic: ${correctSearchContent.includes('مرحبا')}`);

console.log('\n✅ Test completed!');
