const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Student = require('../src/models/Student');
const StatsSnapshot = require('../src/models/StatsSnapshot');

const run = async () => {
  try {
    const isConfirm = process.argv.includes('--confirm');

    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/progress-tracker';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB...');

    const models = [
      { name: 'User', model: User },
      { name: 'Student', model: Student },
      { name: 'StatsSnapshot', model: StatsSnapshot }
    ];

    console.log('\n--- Database Collection Status ---');
    for (const { name, model } of models) {
      const count = await model.countDocuments();
      console.log(`[${name}]: ${count} documents found`);
    }
    console.log('----------------------------------\n');

    if (!isConfirm) {
      console.log('⚠️  DRY RUN ⚠️');
      console.log('The above documents WOULD be deleted, but no changes were made.');
      console.log('To proceed with actual deletion, run this script with the --confirm flag:');
      console.log('  node scripts/wipeDatabase.js --confirm\n');
      process.exit(0);
    }

    console.log('🔥 --confirm flag detected. Wiping collections...\n');
    for (const { name, model } of models) {
      await model.deleteMany({});
      const afterCount = await model.countDocuments();
      console.log(`✅ [${name}] wiped. Remaining documents: ${afterCount}`);
    }

    console.log('\n✅ Database wiped successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ An error occurred:', error);
    process.exit(1);
  }
};

run();
