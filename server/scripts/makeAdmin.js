const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const makeAdmin = async () => {
  const identifier = process.argv[2];

  if (!identifier) {
    console.error('❌ Error: Please provide a username or email as a CLI argument.');
    console.log('Usage: node scripts/makeAdmin.js <username_or_email>');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/progress-tracker';

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB...');

    const searchStr = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: searchStr }, { username: searchStr }],
    });

    if (!user) {
      console.error(`❌ User not found with username or email: '${identifier}'`);
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();

    console.log(`✅ Success! Set isAdmin: true for user '${user.username}' (${user.email}).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    process.exit(1);
  }
};

makeAdmin();
