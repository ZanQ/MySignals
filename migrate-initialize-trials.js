const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const config = require('./src/config/config');
const { User } = require('./src/models');

/**
 * Migration script to initialize trial period for existing users
 */
async function initializeTrialsForExistingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    // Find all users without trial_start_date
    const usersWithoutTrial = await User.find({
      trial_start_date: { $exists: false },
    });

    console.log(`\nFound ${usersWithoutTrial.length} users without trial period`);

    if (usersWithoutTrial.length === 0) {
      console.log('No users to update');
      await mongoose.disconnect();
      return;
    }

    // Initialize trial for each user
    let updatedCount = 0;
    for (const user of usersWithoutTrial) {
      console.log(`\n👤 Processing user: ${user.email}`);
      console.log(`   Created: ${user.created_at}`);
      
      // Initialize trial
      user.initializeTrial();
      await user.save();
      
      console.log(`   ✅ Trial initialized`);
      console.log(`   Trial start: ${user.trial_start_date}`);
      console.log(`   Trial end: ${user.trial_end_date}`);
      console.log(`   Status: ${user.subscription_status}`);
      
      updatedCount++;
    }

    console.log(`\n✨ Successfully initialized trials for ${updatedCount} users`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the migration
initializeTrialsForExistingUsers();
