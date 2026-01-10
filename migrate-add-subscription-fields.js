const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const config = require('./src/config/config');
const { User } = require('./src/models');

/**
 * Migration script to initialize new subscription fields for existing users
 */
async function updateExistingUsersWithNewFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    // Find all users
    const allUsers = await User.find({});

    console.log(`\nFound ${allUsers.length} users in database`);

    if (allUsers.length === 0) {
      console.log('No users to update');
      await mongoose.disconnect();
      return;
    }

    // Update each user with new fields if they don't exist
    let updatedCount = 0;
    for (const user of allUsers) {
      let needsUpdate = false;
      
      console.log(`\n👤 Processing user: ${user.email}`);
      console.log(`   Current status: ${user.subscription_status || 'none'}`);

      // Set defaults for new fields if they don't exist
      if (user.subscription_plan_name === undefined) {
        user.subscription_plan_name = null;
        needsUpdate = true;
      }
      
      if (user.subscription_amount === undefined) {
        user.subscription_amount = null;
        needsUpdate = true;
      }
      
      if (user.subscription_interval === undefined) {
        user.subscription_interval = null;
        needsUpdate = true;
      }
      
      if (user.current_period_end === undefined) {
        // If user is in trial, set current_period_end to trial_end_date
        if (user.trial_end_date) {
          user.current_period_end = user.trial_end_date;
        } else if (user.subscription_end_date) {
          user.current_period_end = user.subscription_end_date;
        } else {
          user.current_period_end = null;
        }
        needsUpdate = true;
      }
      
      if (user.cancel_at_period_end === undefined) {
        user.cancel_at_period_end = false;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await user.save();
        console.log(`   ✅ Updated with new fields`);
        console.log(`   - Plan: ${user.subscription_plan_name || 'none'}`);
        console.log(`   - Amount: ${user.subscription_amount ? `$${(user.subscription_amount / 100).toFixed(2)}` : 'none'}`);
        console.log(`   - Interval: ${user.subscription_interval || 'none'}`);
        console.log(`   - Period end: ${user.current_period_end || 'none'}`);
        console.log(`   - Cancel at period end: ${user.cancel_at_period_end}`);
        updatedCount++;
      } else {
        console.log(`   ℹ️  Already has all fields`);
      }
    }

    console.log(`\n✨ Successfully updated ${updatedCount} users`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the migration
updateExistingUsersWithNewFields();
