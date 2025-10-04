import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

async function checkMessages() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // First, check the table structure
    const [columns] = await sequelize.query(
      'DESCRIBE whatsapp_messages'
    );
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    // Check total messages
    const [totalResult] = await sequelize.query(
      'SELECT COUNT(*) as total FROM whatsapp_messages'
    );
    console.log('\n📊 Total messages:', totalResult[0].total);

    // Check messages for org 183
    const [orgMessages] = await sequelize.query(
      `SELECT COUNT(*) as total FROM whatsapp_messages WHERE organization_id = 183`
    );
    console.log('\n📊 Messages for org 183:', orgMessages[0].total);

    // Check recent messages for org 183
    const [recentMessages] = await sequelize.query(
      `SELECT id, messageId, direction, from_number, to_number,
       LEFT(content, 50) as content_preview,
       created_at
       FROM whatsapp_messages
       WHERE organization_id = 183
       ORDER BY created_at DESC
       LIMIT 10`
    );

    console.log('\n📨 Recent 10 messages for org 183:');
    recentMessages.forEach((msg, index) => {
      console.log(`\n${index + 1}. Message ID: ${msg.messageId}`);
      console.log(`   Direction: ${msg.direction}`);
      console.log(`   From: ${msg.from_number}`);
      console.log(`   To: ${msg.to_number}`);
      console.log(`   Content: ${msg.content_preview}`);
      console.log(`   Created: ${msg.created_at}`);
    });

    // Check messages for specific contact
    const testContact = '201112257060';
    const [contactMessages] = await sequelize.query(
      `SELECT id, messageId, direction, from_number, to_number,
       LEFT(content, 50) as content_preview
       FROM whatsapp_messages
       WHERE organization_id = 183
       AND (from_number LIKE '%${testContact}%' OR to_number LIKE '%${testContact}%')
       ORDER BY created_at DESC
       LIMIT 5`
    );

    console.log(`\n📱 Messages for contact ${testContact}:`);
    console.log(`   Total: ${contactMessages.length}`);
    contactMessages.forEach((msg, index) => {
      console.log(`\n${index + 1}. ${msg.direction}: ${msg.from_number} -> ${msg.to_number}`);
      console.log(`   Content: ${msg.content_preview}`);
    });

    await sequelize.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMessages();

