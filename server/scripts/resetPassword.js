const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');

const run = async () => {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.error('Usage: node scripts/resetPassword.js <email> <newPassword>');
      process.exit(1);
    }

    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/progress-tracker';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB...');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`❌ Error: No user found with email '${email}'`);
      process.exit(1);
    }

    // The User model has a pre('save') hook that automatically hashes the password using bcrypt with 10 salt rounds
    user.password = newPassword;
    await user.save();

    console.log(`✅ Success! Password has been reset for user '${user.username}' (${user.email}).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ An error occurred:', error.message);
    process.exit(1);
  }
};

run();
