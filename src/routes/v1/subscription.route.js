const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const subscriptionValidation = require('../../validations/subscription.validation');
const subscriptionController = require('../../controllers/subscription.controller');

const router = express.Router();

// Webhook route must come BEFORE express.json() middleware, handled separately
router
  .route('/webhook')
  .post(express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

router
  .route('/create-checkout-session')
  .post(auth(), validate(subscriptionValidation.createCheckoutSession), subscriptionController.createCheckoutSession);

router
  .route('/create-portal-session')
  .post(auth(), validate(subscriptionValidation.createPortalSession), subscriptionController.createPortalSession);

router
  .route('/status')
  .get(auth(), subscriptionController.getSubscriptionStatus);

router
  .route('/payment-history')
  .get(auth(), subscriptionController.getPaymentHistory);

router
  .route('/cancel')
  .post(auth(), subscriptionController.cancelSubscription);

router
  .route('/reactivate')
  .post(auth(), subscriptionController.reactivateSubscription);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription management and Stripe integration
 */

/**
 * @swagger
 * /subscriptions/create-checkout-session:
 *   post:
 *     summary: Create a Stripe Checkout Session
 *     description: Create a Stripe Checkout Session for subscription payment
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - successUrl
 *               - cancelUrl
 *             properties:
 *               successUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect after successful payment
 *               cancelUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect after canceled payment
 *             example:
 *               successUrl: https://yourdomain.com/success
 *               cancelUrl: https://yourdomain.com/cancel
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 url:
 *                   type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /subscriptions/create-portal-session:
 *   post:
 *     summary: Create a Stripe Customer Portal Session
 *     description: Create a Stripe Customer Portal Session for managing subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - returnUrl
 *             properties:
 *               returnUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to return to after managing subscription
 *             example:
 *               returnUrl: https://yourdomain.com/account
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /subscriptions/status:
 *   get:
 *     summary: Get subscription status
 *     description: Get current user's subscription status
 *     tags: [Subscriptions]
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
 *                 hasAccess:
 *                   type: boolean
 *                 isPaymentExempt:
 *                   type: boolean
 *                 subscriptionStatus:
 *                   type: string
 *                 trialEndDate:
 *                   type: string
 *                   format: date-time
 *                 subscriptionEndDate:
 *                   type: string
 *                   format: date-time
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
