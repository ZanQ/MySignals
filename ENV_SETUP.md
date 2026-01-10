# Environment Variables - Quick Reference

Add these to your `.env` file:

```bash
# ================================
# STRIPE CONFIGURATION (REQUIRED)
# ================================

# Get from: https://dashboard.stripe.com/test/apikeys (test mode)
# or https://dashboard.stripe.com/apikeys (live mode)
STRIPE_SECRET_KEY=sk_test_your_key_here

# Get from: Stripe Dashboard > Webhooks > Your endpoint > Signing secret
# For local dev: Run `stripe listen --forward-to localhost:3000/v1/subscriptions/webhook`
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Get from: Stripe Dashboard > Products > Your subscription product > Pricing
# Create a recurring monthly subscription product first
STRIPE_PRICE_ID=price_your_price_id_here

# ================================
# EXISTING CONFIGURATION
# ================================

NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000
MONGODB_URL=mongodb://localhost:27017/mysignals
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@mysignals.com
```

## Quick Start Steps

### 1. Stripe Setup (5 minutes)
```bash
# 1. Go to https://stripe.com and sign up
# 2. Go to https://dashboard.stripe.com/test/apikeys
# 3. Copy "Secret key" → add to STRIPE_SECRET_KEY
# 4. Go to https://dashboard.stripe.com/test/products
# 5. Click "Add product" → Create monthly subscription
# 6. Copy "Price ID" → add to STRIPE_PRICE_ID
```

### 2. Local Webhook Setup (for development)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to http://localhost:3000/v1/subscriptions/webhook

# Copy the webhook signing secret from the output
# Add it to STRIPE_WEBHOOK_SECRET in your .env
```

### 3. Production Webhook Setup
```bash
# 1. Go to https://dashboard.stripe.com/webhooks
# 2. Click "Add endpoint"
# 3. Enter: https://yourdomain.com/v1/subscriptions/webhook
# 4. Select events: all customer.subscription.* and checkout.session.completed
# 5. Copy "Signing secret" → add to STRIPE_WEBHOOK_SECRET
```

## Test Your Setup

```bash
# 1. Start your server
npm run dev

# 2. In another terminal, forward webhooks (if testing locally)
stripe listen --forward-to http://localhost:3000/v1/subscriptions/webhook

# 3. Test with curl or your frontend
curl -X POST http://localhost:3000/v1/subscriptions/create-checkout-session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"successUrl":"http://localhost:3000/success","cancelUrl":"http://localhost:3000/cancel"}'

# 4. Use test card: 4242 4242 4242 4242
#    - Any future expiry date
#    - Any 3-digit CVC
#    - Any billing postal code
```

## Common Issues

### "Stripe key not set"
- Make sure `STRIPE_SECRET_KEY` is in your `.env` file
- Restart your server after adding environment variables

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` is correct
- For local dev: Use the secret from `stripe listen` command output
- For production: Use the secret from Stripe Dashboard > Webhooks

### "Price not found"
- Make sure `STRIPE_PRICE_ID` matches a real price in your Stripe account
- Check you're using test price ID in test mode, live price ID in live mode

## Switch to Production

When ready to go live:

1. **Get live API keys**: https://dashboard.stripe.com/apikeys
2. **Update .env**:
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxx  # Change from sk_test_
   STRIPE_PRICE_ID=price_live_xxxxx  # Create a new price in live mode
   ```
3. **Set up production webhook** (see "Production Webhook Setup" above)
4. **Test thoroughly** with real payment methods before launching

## Security Checklist

- [ ] Never commit `.env` file to git
- [ ] Never expose secret keys in frontend code
- [ ] Use live keys only in production environment
- [ ] Enable webhook signature verification (already implemented)
- [ ] Use HTTPS in production
- [ ] Regularly rotate API keys

## Need Help?

- **Stripe Docs**: https://stripe.com/docs
- **Dashboard**: https://dashboard.stripe.com
- **CLI Docs**: https://stripe.com/docs/stripe-cli
- **Full Guide**: See STRIPE_INTEGRATION_GUIDE.md in this project
