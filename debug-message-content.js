// Use backend's database configuration
import { Sequelize } from 'sequelize';
import { createWhatsAppMessageModel } from './backend/src/models/WhatsAppMessage.js';

// Database configuration
const sequelize = new Sequelize('saas_erp_whatsapp', 'root', 'root', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

const WhatsAppMessage = createWhatsAppMessageModel(sequelize);

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
      
      if (msg.content) {
        if (typeof msg.content === 'string') {
          console.log(`Content Length: ${msg.content.length}`);
          try {
            const parsed = JSON.parse(msg.content);
            console.log(`Parsed Content: ${JSON.stringify(parsed, null, 2)}`);
            
            // Test getMessageContent logic
            let extractedContent = '';
            if (parsed.text && typeof parsed.text === 'string') {
              extractedContent = parsed.text.trim();
            } else if (parsed.caption && typeof parsed.caption === 'string') {
              extractedContent = parsed.caption.trim();
            } else if (parsed.mimetype) {
              if (parsed.mimetype.startsWith('image/')) {
                extractedContent = parsed.caption?.trim() || '📷 صورة';
              } else if (parsed.mimetype.startsWith('video/')) {
                extractedContent = parsed.caption?.trim() || '🎥 فيديو';
              } else if (parsed.mimetype.startsWith('audio/')) {
                extractedContent = parsed.caption?.trim() || '🎵 صوت';
              } else if (parsed.mimetype === 'application/pdf') {
                extractedContent = parsed.caption?.trim() || '📄 ملف PDF';
              } else if (parsed.mimetype.startsWith('application/')) {
                extractedContent = parsed.caption?.trim() || '📎 ملف';
              } else {
                extractedContent = parsed.caption?.trim() || '📎 ملف';
              }
            } else if (parsed.raw) {
              extractedContent = '📋 رسالة نظام';
            } else if (typeof parsed === 'object' && parsed !== null) {
              extractedContent = 'رسالة غير مدعومة';
            } else {
              extractedContent = String(parsed).trim();
            }
            
            console.log(`Extracted Content: "${extractedContent}"`);
            console.log(`Content Empty: ${!extractedContent}`);
            
          } catch (e) {
            console.log(`Content Parse Error: ${e.message}`);
            console.log(`Raw Content: "${msg.content}"`);
          }
        } else if (typeof msg.content === 'object') {
          console.log(`Content Object: ${JSON.stringify(msg.content, null, 2)}`);
          
          // Test object content extraction
          let extractedContent = '';
          if (msg.content.text && typeof msg.content.text === 'string') {
            extractedContent = msg.content.text.trim();
          } else if (msg.content.caption && typeof msg.content.caption === 'string') {
            extractedContent = msg.content.caption.trim();
          }
          
          console.log(`Extracted Content: "${extractedContent}"`);
          console.log(`Content Empty: ${!extractedContent}`);
        }
      } else {
        console.log(`Content is NULL/undefined`);
      }
      
      console.log('---');
    });
    
    // Get statistics using Sequelize
    console.log('\n📈 Content Statistics:');

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
    `, { type: sequelize.QueryTypes.SELECT });

    stats.forEach(stat => {
      console.log(`${stat.direction} ${stat.message_type}: ${stat.count} total, ${stat.null_content} null, ${stat.empty_content} empty`);
    });

    // Check for problematic messages
    console.log('\n🔍 Checking for problematic messages:');

    const problematic = await WhatsAppMessage.findAll({
      where: {
        [sequelize.Op.or]: [
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
