const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const paymentSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stripe_invoice_id: {
      type: String,
      required: true,
      unique: true,
    },
    stripe_payment_intent_id: {
      type: String,
      default: null,
    },
    stripe_subscription_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number, // Amount in cents
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'paid', 'void', 'uncollectible'],
      required: true,
    },
    payment_date: {
      type: Date,
      default: null,
    },
    period_start: {
      type: Date,
      required: true,
    },
    period_end: {
      type: Date,
      required: true,
    },
    invoice_pdf: {
      type: String, // URL to Stripe invoice PDF
      default: null,
    },
    hosted_invoice_url: {
      type: String, // URL to Stripe hosted invoice page
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

paymentSchema.plugin(toJSON);
paymentSchema.plugin(paginate);

// Indexes
paymentSchema.index({ user_id: 1, created_at: -1 });
paymentSchema.index({ stripe_invoice_id: 1 });
paymentSchema.index({ status: 1 });

/**
 * @typedef Payment
 */
const Payment = mongoose.model('Payment', paymentSchema, 'payments');

module.exports = Payment;
