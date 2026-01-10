const Stripe = require('stripe');
const httpStatus = require('http-status');
const config = require('../config/config');
const { User, Payment } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const stripe = new Stripe(config.stripe.secretKey);

/**
 * Create a Stripe Checkout Session for subscription
 * @param {string} userId - User's ID
 * @param {string} email - User's email
 * @param {string} successUrl - URL to redirect after successful payment
 * @param {string} cancelUrl - URL to redirect after canceled payment
 * @returns {Promise<Object>}
 */
const createCheckoutSession = async (userId, email, successUrl, cancelUrl) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user is payment exempt
  if (user.is_payment_exempt) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment exempt users do not need to subscribe');
  }

  // Create or retrieve Stripe customer
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId: userId.toString(),
      },
    });
    customerId = customer.id;
    user.stripe_customer_id = customerId;
    await user.save();
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: config.stripe.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId.toString(),
    },
    subscription_data: {
      metadata: {
        userId: userId.toString(),
      },
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
};

/**
 * Create a Stripe Customer Portal session for managing subscriptions
 * @param {string} userId - User's ID
 * @param {string} returnUrl - URL to return to after managing subscription
 * @returns {Promise<Object>}
 */
const createPortalSession = async (userId, returnUrl) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.stripe_customer_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No subscription found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: returnUrl,
  });

  return {
    url: session.url,
  };
};

/**
 * Get user's subscription status
 * @param {string} userId - User's ID
 * @returns {Promise<Object>}
 */
const getSubscriptionStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const hasAccess = user.hasActiveSubscription();
  
  return {
    user: {
      name: user.name,
      email: user.email,
      subscribe_signals: user.subscribe_signals,
      subscribe_positions: user.subscribe_positions,
      active: user.active,
      is_payment_exempt: user.is_payment_exempt,
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: user.stripe_subscription_id,
      subscription_status: user.subscription_status,
      trial_start_date: user.trial_start_date,
      trial_end_date: user.trial_end_date,
      subscription_start_date: user.subscription_start_date,
      subscription_end_date: user.subscription_end_date,
      last_login: user.last_login,
      created_at: user.created_at,
    },
    status: user.subscription_status,
    plan: user.subscription_plan_name,
    amount: user.subscription_amount,
    interval: user.subscription_interval,
    current_period_end: user.current_period_end,
    cancel_at_period_end: user.cancel_at_period_end,
    has_active_subscription: hasAccess,
  };
};

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe webhook event
 * @returns {Promise<void>}
 */
const handleWebhook = async (event) => {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    default:
      // Unhandled event type
      logger.info(`Unhandled webhook event: ${event.type}`);
      break;
  }
};

/**
 * Handle subscription creation/update
 * @param {Object} subscription - Stripe subscription object
 * @returns {Promise<void>}
 */
const handleSubscriptionUpdate = async (subscription) => {
  const userId = subscription.metadata.userId;
  const user = await User.findById(userId);

  if (user) {
    user.stripe_subscription_id = subscription.id;
    user.subscription_status = subscription.status;
    user.subscription_start_date = new Date(subscription.current_period_start * 1000);
    user.subscription_end_date = new Date(subscription.current_period_end * 1000);
    user.current_period_end = new Date(subscription.current_period_end * 1000);
    user.cancel_at_period_end = subscription.cancel_at_period_end;
    
    // Get price details
    if (subscription.items && subscription.items.data.length > 0) {
      const item = subscription.items.data[0];
      const price = item.price;
      
      user.subscription_amount = price.unit_amount;
      user.subscription_interval = price.recurring.interval;
      user.subscription_plan_name = price.nickname || `${price.recurring.interval}ly Plan`;
    }
    
    // Clear trial dates when subscription becomes active
    if (subscription.status === 'active') {
      user.trial_start_date = null;
      user.trial_end_date = null;
    }
    
    await user.save();
    logger.info(`Subscription updated for user ${user.email}: ${subscription.status}`);
  }
};

/**
 * Handle subscription deletion
 * @param {Object} subscription - Stripe subscription object
 * @returns {Promise<void>}
 */
const handleSubscriptionDeleted = async (subscription) => {
  const userId = subscription.metadata.userId;
  const user = await User.findById(userId);

  if (user) {
    user.subscription_status = 'canceled';
    user.subscription_end_date = new Date(subscription.ended_at * 1000);
    await user.save();
  }
};

/**
 * Handle successful checkout
 * @param {Object} session - Stripe checkout session object
 * @returns {Promise<void>}
 */
const handleCheckoutCompleted = async (session) => {
  const userId = session.metadata.userId;
  const user = await User.findById(userId);

  if (user && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    await handleSubscriptionUpdate(subscription);
  }
};

/**
 * Handle failed payment
 * @param {Object} invoice - Stripe invoice object
 * @returns {Promise<void>}
 */
const handlePaymentFailed = async (invoice) => {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.userId;
    const user = await User.findById(userId);

    if (user) {
      user.subscription_status = 'past_due';
      await user.save();
      logger.warn(`Payment failed for user ${user.email}`);
      // Here you could send an email notification about the failed payment
    }
  }
};

/**
 * Handle successful invoice payment
 * @param {Object} invoice - Stripe invoice object
 * @returns {Promise<void>}
 */
const handleInvoicePaid = async (invoice) => {
  try {
    // Find user by customer ID
    const user = await User.findOne({ stripe_customer_id: invoice.customer });
    if (!user) {
      logger.error(`User not found for customer ${invoice.customer}`);
      return;
    }

    // Store payment record
    await Payment.create({
      user_id: user._id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent,
      stripe_subscription_id: invoice.subscription,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      payment_date: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
      period_start: new Date(invoice.period_start * 1000),
      period_end: new Date(invoice.period_end * 1000),
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    });

    logger.info(`Payment recorded for user ${user.email}: $${(invoice.amount_paid / 100).toFixed(2)}`);
  } catch (error) {
    logger.error('Error handling invoice paid:', error);
    throw error;
  }
};

/**
 * Get user's payment history
 * @param {string} userId - User's ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>}
 */
const getPaymentHistory = async (userId, options = {}) => {
  const { page = 1, limit = 10 } = options;

  const payments = await Payment.paginate(
    { user_id: userId },
    {
      page,
      limit,
      sort: { created_at: -1 },
    }
  );

  return payments;
};

/**
 * Mark user as payment exempt
 * @param {string} userId - User's ID
 * @returns {Promise<User>}
 */
const markPaymentExempt = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  user.is_payment_exempt = true;
  await user.save();
  return user;
};

/**
 * Remove payment exempt status
 * @param {string} userId - User's ID
 * @returns {Promise<User>}
 */
const removePaymentExempt = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  user.is_payment_exempt = false;
  
  // Initialize trial if they don't have one
  if (!user.trial_start_date && !user.subscription_status) {
    user.initializeTrial();
  }
  
  await user.save();
  return user;
};

/**
 * Cancel subscription at period end
 * @param {string} userId - User's ID
 * @returns {Promise<Object>}
 */
const cancelSubscription = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.stripe_subscription_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No active subscription to cancel');
  }

  if (user.is_payment_exempt) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel payment exempt subscription');
  }

  // Cancel at period end in Stripe
  const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  // Update user record
  user.cancel_at_period_end = true;
  await user.save();

  logger.info(`Subscription canceled at period end for user ${user.email}`);

  return {
    message: 'Subscription will be canceled at the end of the current billing period',
    cancel_at_period_end: true,
    current_period_end: user.current_period_end,
  };
};

/**
 * Reactivate a canceled subscription
 * @param {string} userId - User's ID
 * @returns {Promise<Object>}
 */
const reactivateSubscription = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.stripe_subscription_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No subscription found');
  }

  if (!user.cancel_at_period_end) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subscription is not set to cancel');
  }

  // Remove cancel at period end in Stripe
  const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
    cancel_at_period_end: false,
  });

  // Update user record
  user.cancel_at_period_end = false;
  await user.save();

  logger.info(`Subscription reactivated for user ${user.email}`);

  return {
    message: 'Subscription reactivated successfully',
    cancel_at_period_end: false,
    current_period_end: user.current_period_end,
  };
};

module.exports = {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  handleWebhook,
  handleInvoicePaid,
  getPaymentHistory,
  cancelSubscription,
  reactivateSubscription,
  markPaymentExempt,
  removePaymentExempt,
};
