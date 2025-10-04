import { Sequelize } from 'sequelize';
import { createWhatsAppMessageModel } from './src/models/WhatsAppMessage.js';

// Database configuration
const sequelize = new Sequelize('saas_erp_whatsapp', 'root', 'root', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

const WhatsAppMessage = createWhatsAppMessageModel(sequelize);

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
      if (parsed.text && typeof parsed.text === 'string') {
        return parsed.text.trim();
      }

      if (parsed.caption && typeof parsed.caption === 'string') {
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
    if (message.content.text && typeof message.content.text === 'string') {
      return message.content.text.trim();
    }
    if (message.content.caption && typeof message.content.caption === 'string') {
      return message.content.caption.trim();
    }
    return '';
  }

  // Fallback to body field
  if (message.body && typeof message.body === 'string') {
    return message.body.trim();
  }

  return '';
}

async function debugMessageContent() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Get sample messages to analyze content structure
    const rows = await WhatsAppMessage.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20,
      raw: true
    });
    
    console.log(`\n📊 Found ${rows.length} messages\n`);
    
    // Analyze each message
    let emptyContentCount = 0;
    let validContentCount = 0;
    let inboundEmptyCount = 0;
    let outboundEmptyCount = 0;
    
    rows.forEach((msg, index) => {
      console.log(`\n--- Message ${index + 1} ---`);
      console.log(`ID: ${msg.id}`);
      console.log(`Message ID: ${msg.messageId}`);
      console.log(`Direction: ${msg.direction}`);
      console.log(`From: ${msg.fromNumber}`);
      console.log(`To: ${msg.toNumber}`);
      console.log(`Type: ${msg.messageType}`);
      console.log(`Status: ${msg.status}`);
      console.log(`Sent At: ${msg.sentAt}`);
      
      // Analyze content field
      console.log(`Content Type: ${typeof msg.content}`);
      console.log(`Content Value: ${JSON.stringify(msg.content)}`);
      
      // Test getMessageContent function
      const extractedContent = getMessageContent(msg);
      console.log(`Extracted Content: "${extractedContent}"`);
      console.log(`Content Empty: ${!extractedContent}`);
      
      // Count statistics
      if (!extractedContent) {
        emptyContentCount++;
        if (msg.direction === 'inbound') {
          inboundEmptyCount++;
        } else {
          outboundEmptyCount++;
        }
      } else {
        validContentCount++;
      }
      
      console.log('---');
    });
    
    // Print summary
    console.log('\n📈 Summary:');
    console.log(`Total messages: ${rows.length}`);
    console.log(`Valid content: ${validContentCount}`);
    console.log(`Empty content: ${emptyContentCount}`);
    console.log(`Inbound empty: ${inboundEmptyCount}`);
    console.log(`Outbound empty: ${outboundEmptyCount}`);
    
    // Get overall statistics
    console.log('\n📈 Database Statistics:');
    
    const stats = await sequelize.query(`
      SELECT 
        direction,
        message_type,
        COUNT(*) as count,
        COUNT(CASE WHEN content IS NULL THEN 1 END) as null_content,
        COUNT(CASE WHEN content = '' THEN 1 END) as empty_content
      FROM whatsapp_messages 
      GROUP BY direction, message_type
      ORDER BY direction, message_type
    `, { type: Sequelize.QueryTypes.SELECT });
    
    stats.forEach(stat => {
      console.log(`${stat.direction} ${stat.message_type}: ${stat.count} total, ${stat.null_content} null, ${stat.empty_content} empty`);
    });
    
    // Check for problematic messages
    console.log('\n🔍 Checking for problematic messages:');
    
    const problematic = await WhatsAppMessage.findAll({
      where: {
        [Sequelize.Op.or]: [
          { content: null },
          { content: '' },
          { content: '{}' },
          { content: 'null' }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
      raw: true
    });
    
    if (problematic.length > 0) {
      console.log(`Found ${problematic.length} problematic messages:`);
      problematic.forEach(msg => {
        console.log(`- ID ${msg.id}: ${msg.direction} from ${msg.fromNumber} to ${msg.toNumber}, content: ${JSON.stringify(msg.content)}`);
      });
    } else {
      console.log('No problematic messages found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the debug
debugMessageContent();
