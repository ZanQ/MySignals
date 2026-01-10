# Stripe Subscription Integration Guide

## Overview
This MySignals API now includes Stripe Checkout Sessions for subscription management. Users get a **1-month free trial** before subscription payments are required. Payment-exempt users (flagged by admin) never need to pay.

## Environment Variables Setup

Add the following environment variables to your `.env` file:

### Sandbox (Test) Environment
```bash
# Stripe Test Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price ID (create a product/price in test mode)
STRIPE_PRICE_ID=price_your_test_price_id_here
```

### Production Environment
```bash
# Stripe Live Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here

# Stripe Price ID (create a product/price in live mode)
STRIPE_PRICE_ID=price_your_live_price_id_here
```

## Setting Up Stripe

### 1. Create a Stripe Account
- Go to [https://stripe.com](https://stripe.com) and sign up
- Verify your email and complete account setup

### 2. Get API Keys
**Test Mode:**
- Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
- Copy the "Secret key" (starts with `sk_test_`)
- Add it to your `.env` as `STRIPE_SECRET_KEY`

**Live Mode (when ready for production):**
- Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- Copy the "Secret key" (starts with `sk_live_`)

### 3. Create a Product and Price
1. Go to [Products](https://dashboard.stripe.com/test/products) in your Stripe Dashboard
2. Click "Add product"
3. Set up your subscription:
   - **Name**: MySignals Subscription (or your preferred name)
   - **Description**: Monthly subscription to MySignals trading platform
   - **Pricing**: Select "Recurring"
   - **Price**: Enter your monthly price (e.g., $29.99)
   - **Billing period**: Monthly
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_`) from the pricing section
6. Add it to your `.env` as `STRIPE_PRICE_ID`

### 4. Set Up Webhooks
Webhooks notify your server about subscription events (payments, cancellations, etc.)

**For Local Development:**
1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Run: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to http://localhost:3000/v1/subscriptions/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) from the output
5. Add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

**For Production:**
1. Go to [Webhooks](https://dashboard.stripe.com/webhooks) in Stripe Dashboard
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/v1/subscriptions/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add it to your production `.env` as `STRIPE_WEBHOOK_SECRET`

## Frontend Integration

### API Endpoints

#### 1. Check Subscription Status
```javascript
GET /v1/subscriptions/status
Authorization: Bearer <access_token>

Response:
{
  "hasAccess": true,
  "isPaymentExempt": false,
  "subscriptionStatus": "trial",
  "trialEndDate": "2026-02-07T00:00:00.000Z",
  "subscriptionEndDate": null,
  "stripeCustomerId": "cus_xxxxx",
  "stripeSubscriptionId": null
}
```

#### 2. Create Checkout Session
```javascript
POST /v1/subscriptions/create-checkout-session
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "successUrl": "https://yourdomain.com/success",
  "cancelUrl": "https://yourdomain.com/cancel"
}

Response:
{
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
}
```

#### 3. Create Customer Portal Session
```javascript
POST /v1/subscriptions/create-portal-session
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "returnUrl": "https://yourdomain.com/account"
}

Response:
{
  "url": "https://billing.stripe.com/p/session/xxxxx"
}
```

### Frontend Implementation Example

#### React Example

```javascript
import { useState, useEffect } from 'react';

function SubscriptionManager() {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/v1/subscriptions/status', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/v1/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      });
      
      const { url } = await response.json();
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/v1/subscriptions/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.origin,
        }),
      });
      
      const { url } = await response.json();
      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="subscription-manager">
      <h2>Subscription Status</h2>
      
      {subscriptionStatus.isPaymentExempt ? (
        <div className="alert alert-success">
          You have lifetime access (payment exempt)
        </div>
      ) : subscriptionStatus.subscriptionStatus === 'trial' ? (
        <div className="alert alert-info">
          You are in your free trial period.
          Trial ends: {new Date(subscriptionStatus.trialEndDate).toLocaleDateString()}
        </div>
      ) : subscriptionStatus.hasAccess ? (
        <div className="alert alert-success">
          Your subscription is active
          <button onClick={handleManageSubscription} className="btn btn-secondary">
            Manage Subscription
          </button>
        </div>
      ) : (
        <div className="alert alert-warning">
          Your trial has ended. Subscribe to continue accessing signals.
          <button onClick={handleSubscribe} className="btn btn-primary">
            Subscribe Now
          </button>
        </div>
      )}
    </div>
  );
}
```

#### JavaScript/Vanilla Example

```javascript
// Check subscription status on page load
async function checkSubscriptionStatus() {
  try {
    const response = await fetch('/v1/subscriptions/status', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const status = await response.json();
    
    if (!status.hasAccess) {
      showSubscriptionPrompt();
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
  }
}

// Create checkout session and redirect to Stripe
async function initiateCheckout() {
  try {
    const response = await fetch('/v1/subscriptions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        successUrl: window.location.origin + '/success',
        cancelUrl: window.location.origin + '/cancel',
      }),
    });
    
    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Handling Protected Routes

When accessing protected endpoints (like portfolio), handle 402 Payment Required errors:

```javascript
async function fetchPortfolioDashboard() {
  try {
    const response = await fetch('/v1/portfolio/dashboard', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (response.status === 402) {
      // Payment required
      alert('Subscription required to access this feature');
      // Redirect to subscription page
      window.location.href = '/subscribe';
      return;
    }
    
    const data = await response.json();
    // Handle data...
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## User Flow

### New User Flow
1. User signs up → Account created with 1-month free trial
2. User can access all features during trial
3. After 30 days, user must subscribe to continue
4. If subscription lapses, user loses access to signals/emails

### Subscription Flow
1. User clicks "Subscribe" button
2. Frontend calls `/subscriptions/create-checkout-session`
3. Frontend redirects user to Stripe Checkout URL
4. User enters payment details on Stripe's secure page
5. After successful payment, Stripe redirects to your `successUrl`
6. Stripe webhook notifies your server → Subscription activated
7. User can now access all features

### Manage Subscription Flow
1. User clicks "Manage Subscription" button
2. Frontend calls `/subscriptions/create-portal-session`
3. Frontend redirects user to Stripe Customer Portal URL
4. User can update payment method, cancel subscription, view invoices, etc.
5. Any changes are communicated via webhooks

## Payment Exempt Users

To flag a user as payment exempt (admin only):

```javascript
// You'll need to add an admin endpoint or use database directly
// For now, update directly in MongoDB:

db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { is_payment_exempt: true } }
)
```

Or create an admin function in your user service and expose via admin route.

## Testing

### Test Cards (Use in Sandbox Mode)
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- Use any future expiry date and any 3-digit CVC

### Test Scenarios
1. **New User Trial**: Create new user → Check they have trial status → Verify trial_end_date is 30 days out
2. **Subscribe**: Use test card to complete checkout → Verify subscription_status becomes 'active'
3. **Access Control**: Try accessing `/portfolio/dashboard` without subscription → Should get 402 error
4. **Cancel Subscription**: Use Customer Portal to cancel → Verify access ends at period end
5. **Payment Exempt**: Flag user as exempt → Verify they always have access

## Subscription Status Values
- `trial` - User is in free trial period
- `active` - User has active paid subscription
- `past_due` - Payment failed, user has grace period
- `canceled` - Subscription was canceled
- `incomplete` - Initial payment failed
- `incomplete_expired` - Payment wasn't completed in time
- `unpaid` - Payment failed after grace period

## Security Notes
- **Never expose your Secret Key** to the frontend
- Webhook signature validation ensures requests are from Stripe
- Always verify subscription status server-side before granting access
- Use HTTPS in production for all Stripe communication

## Support
- Stripe Documentation: [https://stripe.com/docs](https://stripe.com/docs)
- Test your integration: [https://dashboard.stripe.com/test/dashboard](https://dashboard.stripe.com/test/dashboard)
- Webhook testing: Use Stripe CLI for local development

## Example .env File

```bash
# Server
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Database
MONGODB_URL=mongodb://localhost:27017/mysignals

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@mysignals.com

# Stripe (Use test keys for development)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
```
