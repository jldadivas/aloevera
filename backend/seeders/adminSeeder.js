const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

const seedAdminUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vera_db');
    console.log('Connected to MongoDB');

    // Clear existing admins (optional - comment out if you want to preserve existing admins)
    // await User.deleteMany({ role: 'admin' });
    // console.log('Cleared existing admins');

    // Admin users to seed
    const admins = [
      {
        email: 'admin@vera.com',
        password_hash: 'Admin@123456', // Will be hashed by pre-save hook
        full_name: 'Admin User',
        role: 'admin',
        phone: '+1234567890',
        is_active: true
      },
      {
        email: 'superadmin@vera.com',
        password_hash: 'SuperAdmin@123456', // Will be hashed by pre-save hook
        full_name: 'Super Admin',
        role: 'admin',
        phone: '+0987654321',
        is_active: true
      }
    ];

    // Check and create admins
    for (const adminData of admins) {
      const existingAdmin = await User.findOne({ email: adminData.email });

      if (existingAdmin) {
        console.log(`Admin with email ${adminData.email} already exists. Skipping...`);
      } else {
        const admin = await User.create(adminData);
        console.log(`✓ Admin created: ${admin.email} (${admin.full_name})`);
      }
    }

    console.log('\n✓ Admin seeding completed successfully!');
    console.log('\nDefault Admin Credentials:');
    console.log('Email: admin@vera.com');
    console.log('Password: Admin@123456');
    console.log('\nDefault Super Admin Credentials:');
    console.log('Email: superadmin@vera.com');
    console.log('Password: SuperAdmin@123456');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin users:', error);
    process.exit(1);
  }
};

// Run seeder
seedAdminUsers();
