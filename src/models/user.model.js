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
 * Get active users subscribed to signals
 * @returns {Promise<User[]>}
 */
userSchema.statics.getSignalSubscribers = async function () {
  return this.find({ active: true, subscribe_signals: true });
};

/**
 * Get active users subscribed to positions
 * @returns {Promise<User[]>}
 */
userSchema.statics.getPositionSubscribers = async function () {
  return this.find({ active: true, subscribe_positions: true });
};

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
