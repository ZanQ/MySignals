const { Position, User } = require('../models');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Add a new position for a user
 * @param {Object} user - User object with email
 * @param {Object} positionBody - Position data (ticker, entry_price, entry_date, shares)
 * @returns {Promise<Object>}
 */
const addPosition = async (user, positionBody) => {
  const { ticker, entry_price, entry_date, shares = 100 } = positionBody;

  // Verify user exists
  const userExists = await User.findOne({ email: user.email });
  if (!userExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Create position
  const position = await Position.create({
    user_email: user.email,
    ticker: ticker.toUpperCase(),
    entry_price,
    entry_date,
    shares,
    is_active: true,
    added_at: new Date(),
  });

  return position;
};

/**
 * Close an active position for a user
 * @param {Object} user - User object with email
 * @param {Object} closeBody - Close data (ticker, exit_price, exit_date, reason)
 * @returns {Promise<Object>}
 */
const closePosition = async (user, closeBody) => {
  const { ticker, exit_price, exit_date, reason } = closeBody;

  // Find active position
  const position = await Position.findOne({
    user_email: user.email,
    ticker: ticker.toUpperCase(),
    is_active: true,
  });

  if (!position) {
    throw new ApiError(httpStatus.NOT_FOUND, `No active position found: ${ticker} for ${user.email}`);
  }

  // Calculate profit/loss
  const entryPrice = position.entry_price;
  const shares = position.shares;
  const profit = (exit_price - entryPrice) * shares;
  const returnPct = ((exit_price - entryPrice) / entryPrice) * 100;

  // Update position
  position.is_active = false;
  position.exit_price = exit_price;
  position.exit_date = exit_date;
  position.exit_reason = reason;
  position.profit = profit;
  position.return_pct = returnPct;
  position.closed_at = new Date();

  await position.save();

  return {
    position,
    summary: {
      entry_price: entryPrice,
      exit_price,
      return_pct: parseFloat(returnPct.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
    },
  };
};

/**
 * Get comprehensive portfolio dashboard for a user
 * @param {Object} user - User object with email and name
 * @returns {Promise<Object>}
 */
const getPortfolioDashboard = async (user) => {
  const userEmail = user.email;
  const currentYear = new Date().getFullYear();
  const yearStartDate = new Date(currentYear, 0, 1);

  // Get all positions
  const allPositions = await Position.find({ user_email: userEmail }).sort({ added_at: -1 });
  const activePositions = allPositions.filter((p) => p.is_active);
  const closedPositions = allPositions.filter((p) => !p.is_active);

  // Current holdings - group by ticker for active positions
  const holdingsMap = new Map();
  activePositions.forEach((position) => {
    const existing = holdingsMap.get(position.ticker);
    if (existing) {
      // Average entry price weighted by shares
      const totalShares = existing.shares + position.shares;
      const totalCost = existing.entry_price * existing.shares + position.entry_price * position.shares;
      existing.entry_price = totalCost / totalShares;
      existing.shares = totalShares;
      existing.positions.push({
        id: position.id,
        entry_price: position.entry_price,
        entry_date: position.entry_date,
        shares: position.shares,
      });
    } else {
      holdingsMap.set(position.ticker, {
        ticker: position.ticker,
        entry_price: position.entry_price,
        shares: position.shares,
        positions: [
          {
            id: position.id,
            entry_price: position.entry_price,
            entry_date: position.entry_date,
            shares: position.shares,
          },
        ],
      });
    }
  });

  const currentHoldings = await Promise.all(
    Array.from(holdingsMap.values()).map(async (holding) => {
      // Get latest price from ticker collection
      let currentPrice = null;
      try {
        console.log(`\n🔍 Looking for price data for ticker: ${holding.ticker}`);
        // Strip exchange suffix (e.g., .TO, .US) from ticker
        const cleanTicker = holding.ticker.split('.')[0];
        console.log(`   Clean ticker (stripped suffix): ${cleanTicker}`);
        const tickerCollection = mongoose.connection.collection(cleanTicker);
        console.log(`   Collection found: ${tickerCollection.collectionName}`);
        
        const latestPrice = await tickerCollection.findOne({}, { sort: { date: -1, timestamp: -1, _id: -1 } });
        console.log(`   Latest price document:`, latestPrice);
        
        if (latestPrice) {
          console.log(`   Available fields:`, Object.keys(latestPrice));
          console.log(`   Close: ${latestPrice.Close}, close: ${latestPrice.close}, price: ${latestPrice.price}, last: ${latestPrice.last}`);
        } else {
          console.log(`   ⚠️  No documents found in collection`);
        }
        
        currentPrice = latestPrice?.Close || latestPrice?.close || latestPrice?.price || latestPrice?.last || null;
        console.log(`   ✅ Current price set to: ${currentPrice}`);
      } catch (error) {
        // Collection doesn't exist or error fetching price
        console.log(`   ❌ Error fetching price:`, error.message);
        currentPrice = null;
      }

      //Show the response before sending
      console.log({
        ticker: holding.ticker,
        total_shares: holding.shares,
        avg_entry_price: parseFloat(holding.entry_price.toFixed(2)),
        total_invested: parseFloat((holding.entry_price * holding.shares).toFixed(2)),
        current_price: currentPrice ? parseFloat(currentPrice.toFixed(2)) : null,
        position_count: holding.positions.length,
        positions: holding.positions,
      });

      return {
        ticker: holding.ticker,
        total_shares: holding.shares,
        avg_entry_price: parseFloat(holding.entry_price.toFixed(2)),
        total_invested: parseFloat((holding.entry_price * holding.shares).toFixed(2)),
        current_price: currentPrice ? parseFloat(currentPrice.toFixed(2)) : null,
        position_count: holding.positions.length,
        positions: holding.positions,
      };
    })
  );

  // Historical trades (closed positions)
  const historicalTrades = closedPositions.map((position) => ({
    id: position.id,
    ticker: position.ticker,
    entry_price: position.entry_price,
    entry_date: position.entry_date,
    exit_price: position.exit_price,
    exit_date: position.exit_date,
    shares: position.shares,
    profit: position.profit,
    return_pct: position.return_pct,
    exit_reason: position.exit_reason,
    closed_at: position.closed_at,
  }));

  // YTD Performance
  const ytdClosedPositions = closedPositions.filter((p) => new Date(p.closed_at) >= yearStartDate);
  const ytdProfit = ytdClosedPositions.reduce((sum, p) => sum + (p.profit || 0), 0);
  const ytdInvested = ytdClosedPositions.reduce((sum, p) => sum + p.entry_price * p.shares, 0);
  const ytdReturnPct = ytdInvested > 0 ? (ytdProfit / ytdInvested) * 100 : 0;

  // All-time Performance
  const totalRealizedProfit = closedPositions.reduce((sum, p) => sum + (p.profit || 0), 0);
  const totalInvested = closedPositions.reduce((sum, p) => sum + p.entry_price * p.shares, 0);
  const allTimeReturnPct = totalInvested > 0 ? (totalRealizedProfit / totalInvested) * 100 : 0;

  // Trading statistics
  const totalTrades = closedPositions.length;
  const winningTrades = closedPositions.filter((p) => p.profit > 0);
  const losingTrades = closedPositions.filter((p) => p.profit < 0);
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  const avgProfit = winningTrades.length > 0 ? winningTrades.reduce((sum, p) => sum + p.profit, 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, p) => sum + p.profit, 0) / losingTrades.length : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgProfit / avgLoss) : avgProfit > 0 ? Infinity : 0;
  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map((p) => p.profit)) : 0;
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map((p) => p.profit)) : 0;

  // Recent activity
  const recentTrades = closedPositions.slice(0, 10);

  // Portfolio composition
  const totalActiveInvested = currentHoldings.reduce((sum, h) => sum + h.total_invested, 0);

  return {
    user: {
      name: user.name,
      email: user.email,
      start: user.created_at,
    },
    summary: {
      total_active_positions: activePositions.length,
      unique_tickers: currentHoldings.length,
      total_invested: parseFloat(totalActiveInvested.toFixed(2)),
      total_trades: totalTrades,
    },
    current_holdings: currentHoldings,
    performance: {
      ytd: {
        trades: ytdClosedPositions.length,
        profit: parseFloat(ytdProfit.toFixed(2)),
        return_pct: parseFloat(ytdReturnPct.toFixed(2)),
        invested: parseFloat(ytdInvested.toFixed(2)),
      },
      all_time: {
        trades: totalTrades,
        profit: parseFloat(totalRealizedProfit.toFixed(2)),
        return_pct: parseFloat(allTimeReturnPct.toFixed(2)),
        invested: parseFloat(totalInvested.toFixed(2)),
      },
    },
    trading_stats: {
      total_trades: totalTrades,
      winning_trades: winningTrades.length,
      losing_trades: losingTrades.length,
      win_rate: parseFloat(winRate.toFixed(2)),
      avg_win: parseFloat(avgProfit.toFixed(2)),
      avg_loss: parseFloat(avgLoss.toFixed(2)),
      profit_factor: profitFactor === Infinity ? 'N/A' : parseFloat(profitFactor.toFixed(2)),
      largest_win: parseFloat(largestWin.toFixed(2)),
      largest_loss: parseFloat(largestLoss.toFixed(2)),
    },
    recent_trades: recentTrades.map((p) => ({
      id: p.id,
      ticker: p.ticker,
      profit: p.profit,
      return_pct: p.return_pct,
      exit_date: p.exit_date,
      closed_at: p.closed_at,
      added_at: p.added_at,
      shares: p.shares,
    })),
    historical_trades: historicalTrades,
  };
};

module.exports = {
  addPosition,
  closePosition,
  getPortfolioDashboard,
};
