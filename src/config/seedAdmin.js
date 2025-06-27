require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');

const defaultAdmin = {
  email: 'admin@cms.com',
  password: 'admin123',
  firstName: 'Model Campus Damak',
  lastName: '',
  role: 'ADMIN',
  isActive: true
};

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Check if admin exists
    const adminExists = await User.findOne({ role: 'ADMIN' });
    
    if (adminExists) {
      console.log('Admin already exists');
      process.exit(0);
    }

    // Create admin
    const admin = await User.create(defaultAdmin);
    console.log('Default admin created:', {
      email: admin.email,
      name: admin.fullName,
      role: admin.role
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
}

seedAdmin(); 