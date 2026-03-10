const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'admin@vera.com' }).select('+password_hash');
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log('User found:', {
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    });

    // Test password comparison
    const password = 'Admin@123456';
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    console.log('✓ Login test successful');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testLogin();
