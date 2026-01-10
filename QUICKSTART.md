# 🚀 Quick Start - Stripe Integration

Get your Stripe subscription integration running in 5 minutes!

## Step 1: Install Dependencies ✅

Already done! The `stripe` package was installed.

## Step 2: Get Stripe Keys (2 minutes)

1. **Sign up at Stripe**
   - Go to https://stripe.com
   - Create an account
   - Stay in **Test Mode** for now (toggle in top-right)

2. **Get Secret Key**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy the **Secret key** (starts with `sk_test_`)

3. **Create Subscription Product**
   - Go to: https://dashboard.stripe.com/test/products
   - Click "Add product"
   - Name: `MySignals Subscription`
   - Select "Recurring" pricing
   - Price: `$29.99` (or your price)
   - Billing period: `Monthly`
   - Save and copy the **Price ID** (starts with `price_`)

## Step 3: Configure Environment Variables (1 minute)

Add these three lines to your `.env` file:

```bash
STRIPE_SECRET_KEY=sk_test_paste_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_we_will_get_this_in_step4
STRIPE_PRICE_ID=price_paste_your_price_id_here
```

## Step 4: Set Up Webhooks (2 minutes)

**For Local Development:**

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks (keep this running)
stripe listen --forward-to http://localhost:8888/v1/subscriptions/webhook
```

Copy the **webhook signing secret** from the output (starts with `whsec_`) and add it to your `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_paste_your_webhook_secret_here
```

## Step 5: Start Your Server

```bash
npm run dev
```

## Step 6: Test It! 🎉

### Option A: Use the Test Script

```bash
# You'll need to get an access token first
# See test-subscription.js for details
node test-subscription.js
```

### Option B: Use curl commands

```bash
# Get your access token by logging in first
# Then test subscription status:
curl http://localhost:8888/v1/subscriptions/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option C: Interactive Menu

```bash
./test-api.sh
```

## Test Card Numbers

Use these in Stripe Checkout (test mode only):

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- Use any future expiry date
- Use any 3-digit CVC
- Use any postal code

## What Happens Now?

### For New Users:
1. User signs up → Gets 1-month free trial automatically
2. Can access all features during trial
3. After 30 days → Must subscribe to continue

### For Subscribing:
1. Frontend calls `/subscriptions/create-checkout-session`
2. User redirected to Stripe Checkout page
3. User enters payment info
4. Stripe processes payment
5. Webhook updates your database
6. User can now access all features!

## Common First-Time Issues

### "Config validation error"
**Fix**: Make sure all three Stripe variables are in your `.env` file

### "No such price"
**Fix**: Make sure your `STRIPE_PRICE_ID` matches a real price in your Stripe Dashboard

### "Webhook signature verification failed"
**Fix**: 
- For local dev: Make sure `stripe listen` is running
- Use the webhook secret from the `stripe listen` command output
- Restart your server after updating `.env`

### "Cannot read property 'hasActiveSubscription'"
**Fix**: The user model needs to be updated. Restart your server.

## Next Steps

Once basic integration is working:

1. **Frontend Integration**
   - See [STRIPE_INTEGRATION_GUIDE.md](STRIPE_INTEGRATION_GUIDE.md)
   - Contains React examples and API details

2. **Admin Features**
   - Mark users as payment exempt:
     ```bash
     curl -X POST http://localhost:3000/v1/users/{userId}/payment-exempt \
       -H "Authorization: Bearer ADMIN_TOKEN"
     ```

3. **Production Setup**
   - Switch to live Stripe keys
   - Set up production webhook endpoint
   - See [ENV_SETUP.md](ENV_SETUP.md) for details

## Troubleshooting

### Check Webhook Events
Go to: https://dashboard.stripe.com/test/webhooks
- See all webhook deliveries
- Retry failed webhooks
- View request/response details

### Check Customer/Subscriptions
Go to: https://dashboard.stripe.com/test/customers
- See all test customers
- View subscription status
- Cancel/modify subscriptions

### View Stripe Logs
Go to: https://dashboard.stripe.com/test/logs
- See all API requests
- Debug issues
- View error details

## Getting Help

- **Full Setup Guide**: [STRIPE_INTEGRATION_GUIDE.md](STRIPE_INTEGRATION_GUIDE.md)
- **Environment Variables**: [ENV_SETUP.md](ENV_SETUP.md)
- **Technical Details**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Stripe Docs**: https://stripe.com/docs
- **Test Your Integration**: https://stripe.com/docs/testing

## Success Checklist ✓

- [ ] Stripe account created
- [ ] Secret key added to `.env`
- [ ] Subscription product created
- [ ] Price ID added to `.env`
- [ ] Stripe CLI installed
- [ ] Webhooks forwarded with `stripe listen`
- [ ] Webhook secret added to `.env`
- [ ] Server running without errors
- [ ] Successfully created a test checkout session
- [ ] Completed a test payment with `4242 4242 4242 4242`
- [ ] Webhook received and subscription updated in database

Once all are checked, you're ready to integrate with your frontend! 🎉
