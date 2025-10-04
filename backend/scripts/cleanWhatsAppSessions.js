import mongoose from 'mongoose';
import WhatsAppSession from '../src/models/WhatsAppSession.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanSessions() {
  try {
    console.log('🧹 Cleaning WhatsApp sessions...\n');

    // الاتصال بقاعدة البيانات
    await mongoose.connect('mongodb://localhost:27017/saas_erp');
    console.log('✅ Connected to MongoDB\n');

    // حذف جميع الجلسات من قاعدة البيانات
    const result = await WhatsAppSession.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} sessions from database\n`);

    // حذف مجلد sessions
    const sessionsPath = path.join(__dirname, '../sessions');
    if (fs.existsSync(sessionsPath)) {
      fs.rmSync(sessionsPath, { recursive: true, force: true });
      console.log('✅ Deleted sessions folder\n');
    }

    // إعادة إنشاء مجلد sessions
    fs.mkdirSync(sessionsPath, { recursive: true });
    console.log('✅ Created new sessions folder\n');

    await mongoose.disconnect();
    console.log('✅ Cleanup completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanSessions();

