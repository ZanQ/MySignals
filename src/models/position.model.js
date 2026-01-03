const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const positionSchema = mongoose.Schema(
  {
    user_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    ticker: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    entry_price: {
      type: Number,
      required: true,
      min: 0,
    },
    entry_date: {
      type: String,
      required: true,
    },
    shares: {
      type: Number,
      required: true,
      min: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
    // Exit fields (only present when position is closed)
    exit_price: {
      type: Number,
      min: 0,
      default: null,
    },
    exit_date: {
      type: String,
      default: null,
    },
    exit_reason: {
      type: String,
      trim: true,
      default: null,
    },
    closed_at: {
      type: Date,
      default: null,
    },
    // Calculated fields
    profit: {
      type: Number,
      default: null,
    },
    return_pct: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: false, // Using custom added_at field
  }
);

// add plugin that converts mongoose to json
positionSchema.plugin(toJSON);
positionSchema.plugin(paginate);

// Indexes for efficient queries
positionSchema.index({ user_email: 1, is_active: 1 });
positionSchema.index({ ticker: 1 });
positionSchema.index({ added_at: -1 });

/**
 * Method to close position and calculate profit/loss
 * @param {number} exitPrice - The exit price per share
 * @param {string} exitReason - Reason for closing the position
 * @returns {Position}
 */
positionSchema.methods.closePosition = function (exitPrice, exitReason = '') {
  this.is_active = false;
  this.exit_price = exitPrice;
  this.exit_date = new Date().toISOString().split('T')[0];
  this.exit_reason = exitReason;
  this.closed_at = new Date();
  this.profit = (exitPrice - this.entry_price) * this.shares;
  this.return_pct = ((exitPrice - this.entry_price) / this.entry_price) * 100;
  return this;
};

/**
 * Method to calculate unrealized profit/loss for open positions
 * @param {number} currentPrice - Current market price of the ticker
 * @returns {Object} Object containing profit, return_pct, and type
 */
positionSchema.methods.calculateUnrealizedPL = function (currentPrice) {
  if (!this.is_active) {
    return {
      profit: this.profit,
      return_pct: this.return_pct,
      type: 'realized',
    };
  }

  const unrealizedProfit = (currentPrice - this.entry_price) * this.shares;
  const unrealizedReturnPct = ((currentPrice - this.entry_price) / this.entry_price) * 100;

  return {
    profit: unrealizedProfit,
    return_pct: unrealizedReturnPct,
    type: 'unrealized',
  };
};

/**
 * Get all positions for a specific user
 * @param {string} userEmail - The user's email
 * @param {boolean} activeOnly - If true, only return active positions
 * @returns {Promise<Position[]>}
 */
positionSchema.statics.getPositionsByUser = async function (userEmail, activeOnly = false) {
  const query = { user_email: userEmail };
  if (activeOnly) {
    query.is_active = true;
  }
  return this.find(query).sort({ added_at: -1 });
};

/**
 * Get user's trading statistics
 * @param {string} userEmail - The user's email
 * @returns {Promise<Object>}
 */
positionSchema.statics.getUserStats = async function (userEmail) {
  const closedPositions = await this.find({ user_email: userEmail, is_active: false });

  const totalTrades = closedPositions.length;
  const winningTrades = closedPositions.filter((p) => p.profit > 0).length;
  const losingTrades = closedPositions.filter((p) => p.profit < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalProfit = closedPositions.reduce((sum, p) => sum + (p.profit || 0), 0);
  const avgReturn = totalTrades > 0 ? closedPositions.reduce((sum, p) => sum + (p.return_pct || 0), 0) / totalTrades : 0;

  return {
    total_trades: totalTrades,
    winning_trades: winningTrades,
    losing_trades: losingTrades,
    win_rate: parseFloat(winRate.toFixed(2)),
    total_profit: parseFloat(totalProfit.toFixed(2)),
    avg_return_pct: parseFloat(avgReturn.toFixed(2)),
  };
};

/**
 * @typedef Position
 */
const Position = mongoose.model('Position', positionSchema, 'positions');

module.exports = Position;
