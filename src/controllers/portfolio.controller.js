const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const portfolioService = require('../services/portfolio.service');

/**
 * Add a new position to user's portfolio
 */
const addPosition = catchAsync(async (req, res) => {
  const position = await portfolioService.addPosition(req.user, req.body);
  res.status(httpStatus.CREATED).send({
    message: `Position added: ${position.ticker} for ${req.user.email}`,
    position,
  });
});

/**
 * Close an active position
 */
const closePosition = catchAsync(async (req, res) => {
  const result = await portfolioService.closePosition(req.user, req.body);
  res.status(httpStatus.OK).send({
    message: `Position closed: ${result.position.ticker} for ${req.user.email}`,
    ...result,
  });
});

/**
 * Get portfolio dashboard for authenticated user
 */
const getDashboard = catchAsync(async (req, res) => {
  const dashboard = await portfolioService.getPortfolioDashboard(req.user);
  res.status(httpStatus.OK).send(dashboard);
});

module.exports = {
  addPosition,
  closePosition,
  getDashboard,
};
