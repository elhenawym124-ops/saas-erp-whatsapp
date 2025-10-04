import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function checkNumberFormats() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // فحص صيغ الأرقام المختلفة
    console.log('\n🔍 صيغ الأرقام المختلفة في from_number:');
    const fromFormats = await sequelize.query(
      `SELECT 
         CASE 
           WHEN from_number LIKE '%@s.whatsapp.net' THEN '@s.whatsapp.net'
           WHEN from_number LIKE '%@lid' THEN '@lid'
           WHEN from_number LIKE '%@g.us' THEN '@g.us'
           WHEN from_number = 'me' THEN 'me'
           ELSE 'other'
         END as format_type,
         COUNT(*) as count
       FROM whatsapp_messages 
       WHERE organization_id = 183 
       GROUP BY format_type
       ORDER BY count DESC`,
      { type: QueryTypes.SELECT }
    );
    
    console.table(fromFormats);

    // أمثلة على كل صيغة
    console.log('\n📋 أمثلة على كل صيغة:');
    for (const format of fromFormats) {
      const examples = await sequelize.query(
        `SELECT from_number, to_number, direction, created_at
         FROM whatsapp_messages 
         WHERE organization_id = 183 
           AND from_number LIKE :pattern
         ORDER BY created_at DESC 
         LIMIT 2`,
        {
          replacements: {
            pattern: format.format_type === 'me' ? 'me' : `%${format.format_type}`
          },
          type: QueryTypes.SELECT
        }
      );
      
      console.log(`\n${format.format_type} (${format.count} messages):`);
      console.table(examples);
    }

    // فحص الرسالة الأخيرة من 242477344759810
    console.log('\n🔍 الرسائل من/إلى 242477344759810:');
    const messages = await sequelize.query(
      `SELECT id, message_id, from_number, to_number, direction, 
              LEFT(content, 100) as content_preview, created_at
       FROM whatsapp_messages 
       WHERE organization_id = 183 
         AND (from_number LIKE '%242477344759810%' OR to_number LIKE '%242477344759810%')
       ORDER BY created_at DESC 
       LIMIT 5`,
      { type: QueryTypes.SELECT }
    );
    
    console.table(messages);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkNumberFormats();

