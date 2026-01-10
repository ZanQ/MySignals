const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { subscriptionService } = require('../services');

const createCheckoutSession = catchAsync(async (req, res) => {
  const { successUrl, cancelUrl } = req.body;
  const session = await subscriptionService.createCheckoutSession(
    req.user.id,
    req.user.email,
    successUrl,
    cancelUrl
  );
  res.status(httpStatus.OK).send(session);
});

const createPortalSession = catchAsync(async (req, res) => {
  const { returnUrl } = req.body;
  const session = await subscriptionService.createPortalSession(req.user.id, returnUrl);
  res.status(httpStatus.OK).send(session);
});

const getSubscriptionStatus = catchAsync(async (req, res) => {
  const status = await subscriptionService.getSubscriptionStatus(req.user.id);
  res.status(httpStatus.OK).send(status);
});

const handleWebhook = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const config = require('../config/config');
  const Stripe = require('stripe');
  const stripe = new Stripe(config.stripe.secretKey);

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    return res.status(httpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  await subscriptionService.handleWebhook(event);
  res.status(httpStatus.OK).send({ received: true });
});

const getPaymentHistory = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const payments = await subscriptionService.getPaymentHistory(req.user.id, { page, limit });
  res.status(httpStatus.OK).send(payments);
});

const cancelSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.cancelSubscription(req.user.id);
  res.status(httpStatus.OK).send(result);
});

const reactivateSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.reactivateSubscription(req.user.id);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  handleWebhook,
  getPaymentHistory,
  cancelSubscription,
  reactivateSubscription,
};
