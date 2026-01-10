const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subscribe_signals: {
      type: Boolean,
      default: false,
    },
    subscribe_positions: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Subscription fields
    is_payment_exempt: {
      type: Boolean,
      default: false,
    },
    stripe_customer_id: {
      type: String,
      default: null,
    },
    stripe_subscription_id: {
      type: String,
      default: null,
    },
    subscription_status: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', null],
      default: null,
    },
    trial_start_date: {
      type: Date,
      default: null,
    },
    trial_end_date: {
      type: Date,
      default: null,
    },
    subscription_start_date: {
      type: Date,
      default: null,
    },
    subscription_end_date: {
      type: Date,
      default: null,
    },
    // Additional subscription details
    subscription_plan_name: {
      type: String,
      default: null,
    },
    subscription_amount: {
      type: Number, // Amount in cents
      default: null,
    },
    subscription_interval: {
      type: String,
      enum: ['month', 'year', null],
      default: null,
    },
    current_period_end: {
      type: Date,
      default: null,
    },
    cancel_at_period_end: {
      type: Boolean,
      default: false,
    },
    last_login: {
      type: Date,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Using custom created_at field
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

// Indexes for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ active: 1 });

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Get active users subscribed to signals who have active subscriptions
 * @returns {Promise<User[]>}
 */
userSchema.statics.getSignalSubscribers = async function () {
  const users = await this.find({ active: true, subscribe_signals: true });
  
  // Filter users who have active subscriptions
  return users.filter((user) => user.hasActiveSubscription());
};

/**
 * Get active users subscribed to positions who have active subscriptions
 * @returns {Promise<User[]>}
 */
userSchema.statics.getPositionSubscribers = async function () {
  const users = await this.find({ active: true, subscribe_positions: true });
  
  // Filter users who have active subscriptions
  return users.filter((user) => user.hasActiveSubscription());
};

/**
 * Check if user has active subscription (payment exempt, trial, or paid)
 * @returns {boolean}
 */
userSchema.methods.hasActiveSubscription = function () {
  // Payment exempt users always have access
  if (this.is_payment_exempt) {
    return true;
  }

  // Check if user is in trial period (using trial_end_date)
  if (this.trial_end_date && new Date() <= this.trial_end_date) {
    return true;
  }

  // Fallback: Check if user was created within last 30 days (for existing users without trial dates)
  if (this.created_at) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (new Date(this.created_at) > thirtyDaysAgo) {
      return true;
    }
  }

  // Check if user has active paid subscription
  if (
    this.subscription_status === 'active' ||
    this.subscription_status === 'trialing'
  ) {
    return true;
  }

  return false;
};

/**
 * Initialize trial period for new user (1 month)
 */
userSchema.methods.initializeTrial = function () {
  if (!this.trial_start_date && !this.is_payment_exempt) {
    this.trial_start_date = new Date();
    this.trial_end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    this.subscription_status = 'trial';
  }
};

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
