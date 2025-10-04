import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saas_erp');
    console.log('✅ Connected to MongoDB');

    const email = 'admin@example.com';
    const password = 'Admin@1234';

    console.log('\n🔍 Testing login for:', email);

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found');
    console.log('   - Email:', user.email);
    console.log('   - isActive:', user.isActive);
    console.log('   - Password hash exists:', !!user.password);

    if (!user.password) {
      console.log('❌ Password hash is missing!');
      process.exit(1);
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log('   - Password valid:', isValid ? '✅ YES' : '❌ NO');

    if (!isValid) {
      console.log('\n🔧 Resetting password to Admin@1234...');
      const hashedPassword = await bcrypt.hash('Admin@1234', 12);
      await User.updateOne({ email }, { password: hashedPassword });
      console.log('✅ Password reset successfully');
    }

    await mongoose.disconnect();
    console.log('\n✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();

