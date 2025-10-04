import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: 'srv1812.hstgr.io',
  user: 'u339372869_newtask',
  password: '0165676135Aa@A',
  database: 'u339372869_newtask',
  port: 3306,
  multipleStatements: true
};

async function runMigration() {
  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');
    
    // قراءة اسم الملف من command line arguments أو استخدام الافتراضي
    const migrationFile = process.argv[2] || '20250103_add_user_tracking_to_messages.sql';
    const migrationPath = path.join(__dirname, '../migrations', migrationFile);
    console.log('📄 Reading migration file:', migrationPath);
    
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // تقسيم SQL إلى statements منفصلة
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // إزالة التعليقات والأسطر الفارغة
        const lines = s.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('--');
        });
        return lines.length > 0;
      });

    console.log(`📝 Found ${statements.length} statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          console.log(`   ${statement.substring(0, 60)}...`);
          
          await connection.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully\n`);
        } catch (error) {
          // تجاهل أخطاء "column already exists" أو "index already exists"
          if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Added columns: user_id, replied_by_name, replied_at');
    console.log('✅ Added foreign key constraint');
    console.log('✅ Added indexes for performance');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

runMigration();

