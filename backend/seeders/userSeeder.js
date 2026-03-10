const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vera_db');
    console.log('Connected to MongoDB');

    // Regular users to seed
    const users = [
      {
        email: 'user@vera.com',
        password_hash: 'User@123456',
        full_name: 'Test User',
        role: 'grower',
        phone: '+1234567890',
        is_active: true
      },
      {
        email: 'grower@vera.com',
        password_hash: 'Grower@123456',
        full_name: 'John Grower',
        role: 'grower',
        phone: '+1111111111',
        is_active: true
      }
    ];

    // Check and create users
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User with email ${userData.email} already exists. Skipping...`);
      } else {
        const user = await User.create(userData);
        console.log(`✓ User created: ${user.email} (${user.full_name})`);
      }
    }

    console.log('\n✓ User seeding completed successfully!');
    console.log('\nTest User Credentials:');
    console.log('Email: user@vera.com');
    console.log('Password: User@123456');
    console.log('\nGrower Credentials:');
    console.log('Email: grower@vera.com');
    console.log('Password: Grower@123456');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

// Run seeder
seedUsers();
