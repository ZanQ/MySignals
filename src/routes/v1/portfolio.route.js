const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const requireSubscription = require('../../middlewares/subscription');
const portfolioValidation = require('../../validations/portfolio.validation');
const portfolioController = require('../../controllers/portfolio.controller');

const router = express.Router();

router.post('/positions', auth(), validate(portfolioValidation.addPosition), portfolioController.addPosition);
router.patch('/positions/close', auth(), validate(portfolioValidation.closePosition), portfolioController.closePosition);
router.post('/dashboard', auth(), requireSubscription(), portfolioController.getDashboard);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Portfolio
 *   description: Portfolio management and statistics
 */

/**
 * @swagger
 * /portfolio/positions:
 *   post:
 *     summary: Add a new position to portfolio
 *     description: Adds a new stock position to the authenticated user's portfolio with entry details.
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticker
 *               - entry_price
 *               - entry_date
 *             properties:
 *               ticker:
 *                 type: string
 *                 description: Stock ticker symbol (will be converted to uppercase)
 *                 example: "AAPL"
 *               entry_price:
 *                 type: number
 *                 minimum: 0
 *                 description: Entry price per share
 *                 example: 150.25
 *               entry_date:
 *                 type: string
 *                 description: Entry date (YYYY-MM-DD format recommended)
 *                 example: "2026-01-07"
 *               shares:
 *                 type: number
 *                 minimum: 1
 *                 default: 100
 *                 description: Number of shares purchased
 *                 example: 100
 *     responses:
 *       "201":
 *         description: Position created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Position added: AAPL for user@example.com"
 *                 position:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     user_email:
 *                       type: string
 *                     ticker:
 *                       type: string
 *                     entry_price:
 *                       type: number
 *                     entry_date:
 *                       type: string
 *                     shares:
 *                       type: number
 *                     is_active:
 *                       type: boolean
 *                     added_at:
 *                       type: string
 *                       format: date-time
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /portfolio/positions/close:
 *   patch:
 *     summary: Close an active position
 *     description: Closes an active stock position for the authenticated user, calculating profit/loss and return percentage.
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticker
 *               - exit_price
 *               - exit_date
 *               - reason
 *             properties:
 *               ticker:
 *                 type: string
 *                 description: Stock ticker symbol (must match an active position)
 *                 example: "AAPL"
 *               exit_price:
 *                 type: number
 *                 minimum: 0
 *                 description: Exit price per share
 *                 example: 175.50
 *               exit_date:
 *                 type: string
 *                 description: Exit date (YYYY-MM-DD format recommended)
 *                 example: "2026-01-07"
 *               reason:
 *                 type: string
 *                 description: Reason for closing the position
 *                 example: "Take profit"
 *     responses:
 *       "200":
 *         description: Position closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Position closed: AAPL for user@example.com"
 *                 position:
 *                   type: object
 *                   description: Updated position object with exit details
 *                 summary:
 *                   type: object
 *                   properties:
 *                     entry_price:
 *                       type: number
 *                       example: 150.25
 *                     exit_price:
 *                       type: number
 *                       example: 175.50
 *                     return_pct:
 *                       type: number
 *                       example: 16.81
 *                       description: Return percentage
 *                     profit:
 *                       type: number
 *                       example: 2525.00
 *                       description: Total profit/loss in currency
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *         description: No active position found for the specified ticker
 */

/**
 * @swagger
 * /portfolio/dashboard:
 *   post:
 *     summary: Get portfolio dashboard
 *     description: Returns comprehensive portfolio statistics including current holdings, historical trades, YTD and all-time performance metrics for the authenticated user.
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_active_positions:
 *                       type: number
 *                       description: Total number of active positions
 *                     unique_tickers:
 *                       type: number
 *                       description: Number of unique tickers in portfolio
 *                     total_invested:
 *                       type: number
 *                       description: Total capital invested in active positions
 *                     total_trades:
 *                       type: number
 *                       description: Total number of closed trades
 *                 current_holdings:
 *                   type: array
 *                   description: Array of current stock holdings
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticker:
 *                         type: string
 *                       total_shares:
 *                         type: number
 *                       avg_entry_price:
 *                         type: number
 *                       total_invested:
 *                         type: number
 *                       position_count:
 *                         type: number
 *                       positions:
 *                         type: array
 *                 performance:
 *                   type: object
 *                   properties:
 *                     ytd:
 *                       type: object
 *                       properties:
 *                         trades:
 *                           type: number
 *                         profit:
 *                           type: number
 *                         return_pct:
 *                           type: number
 *                           description: Year-to-date return percentage
 *                         invested:
 *                           type: number
 *                     all_time:
 *                       type: object
 *                       properties:
 *                         trades:
 *                           type: number
 *                         profit:
 *                           type: number
 *                         return_pct:
 *                           type: number
 *                           description: All-time return percentage
 *                         invested:
 *                           type: number
 *                 trading_stats:
 *                   type: object
 *                   properties:
 *                     total_trades:
 *                       type: number
 *                     winning_trades:
 *                       type: number
 *                     losing_trades:
 *                       type: number
 *                     win_rate:
 *                       type: number
 *                     avg_win:
 *                       type: number
 *                     avg_loss:
 *                       type: number
 *                     profit_factor:
 *                       type: number
 *                     largest_win:
 *                       type: number
 *                     largest_loss:
 *                       type: number
 *                 recent_trades:
 *                   type: array
 *                   description: 10 most recent closed trades
 *                 historical_trades:
 *                   type: array
 *                   description: All historical closed trades
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
