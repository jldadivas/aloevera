const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

const testUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const allUsers = await User.find({}).select('-password_hash');
    console.log('All users in database:', allUsers.length);
    
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.full_name}) - role: ${user.role} - active: ${user.is_active}`);
    });

    if (allUsers.length === 0) {
      console.log('\n❌ No users found!');
    } else {
      console.log('\n✓ Users found');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testUsers();
