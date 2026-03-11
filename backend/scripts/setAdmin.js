/**
 * Admin Setup Script
 * Run this script to set your email as admin
 * Usage: node scripts/setAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const ADMIN_EMAIL = 'othman.mekouar99@gmail.com';

async function setAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: ADMIN_EMAIL });
    
    if (!user) {
      console.log(`❌ User with email ${ADMIN_EMAIL} not found`);
      console.log('Please register with this email first');
      process.exit(1);
    }

    // Update user role to admin
    user.role = 'admin';
    user.status = 'active';
    await user.save();

    console.log(`✅ User ${ADMIN_EMAIL} is now an admin!`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log('\n🎉 You can now access the admin dashboard at /admin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setAdmin();
