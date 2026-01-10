const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to check if user has an active subscription
 * Payment exempt users, users in trial, and active subscribers pass
 */
const requireSubscription = () => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    const hasAccess = req.user.hasActiveSubscription();
    
    if (!hasAccess) {
      return next(
        new ApiError(
          httpStatus.PAYMENT_REQUIRED,
          'Active subscription required. Your trial period has ended or subscription has expired.'
        )
      );
    }

    next();
  };
};

module.exports = requireSubscription;
