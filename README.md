# MySignals - Trading Position Tracker API

A Node.js REST API for tracking trading positions, profit/loss analytics, and user authentication via magic link. Built for traders to monitor their portfolio performance and receive position updates.

## Features

- **Magic Link Authentication** - Passwordless login via email
- **Stripe Subscriptions** - 1-month free trial, then monthly subscription
- **Position Tracking** - Track open and closed trading positions
- **P&L Analytics** - Automatic profit/loss calculations and win rate statistics
- **Email Notifications** - Beautiful MJML-powered email templates
- **User Management** - Subscription preferences for signals and position updates
- **Payment Control** - Admin can exempt users from subscription requirements
- **NoSQL Database** - MongoDB with Mongoose ODM
- **Security** - JWT tokens, rate limiting, helmet, XSS protection
- **API Documentation** - Swagger/OpenAPI docs
- **Testing** - Unit and integration tests with Jest
- **Docker Support** - Production-ready containerization

## 🆕 Stripe Integration

This API now includes **Stripe Checkout Sessions** for subscription management:

- **1-month free trial** for all new users
- Monthly subscription required after trial
- Admin can flag users as payment-exempt
- Users without active subscription cannot access signals/emails
- Secure webhook handling for subscription events

📚 **See [STRIPE_INTEGRATION_GUIDE.md](STRIPE_INTEGRATION_GUIDE.md)** for complete setup instructions and frontend integration examples.

## Quick Start

### Prerequisites

- Node.js >= 12.0.0
- MongoDB (local or Atlas)
- SMTP email account (Gmail recommended)
- **Stripe account** (for subscriptions)

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd MySignals
```

Install dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the root directory. See [ENV_SETUP.md](ENV_SETUP.md) for complete guide.

**Required environment variables:**

```bash
# Server
PORT=8888
NODE_ENV=development

# MongoDB
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/TSXBot?retryWrites=true&w=majority

# Frontend URL (for magic link emails)
BASE_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=your-email@gmail.com

# Stripe Configuration (REQUIRED)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
STRIPE_PRICE_ID=price_your_subscription_price_id
```

**Important:** 
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- Change `JWT_SECRET` to a strong random string in production
- Update `BASE_URL` to your frontend application URL
- Replace MongoDB connection string with your own cluster
- **Get Stripe keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)**
- **See [ENV_SETUP.md](ENV_SETUP.md) for detailed Stripe setup instructions**

## Running the Application

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Run tests:

```bash
yarn dev
Run tests:

```bash
npm test

# run tests in watch mode
npm run test:watch

# run test coverage
npm run coverage
```

Docker:

```bash
# run docker container in development mode
npm run docker:dev

# run docker container in production mode
npm run docker:prod
```

Linting:

```bash
# run ESLint
npm run lint

# fix ESLint errors
npm run lint:fix

# run prettier
npm run prettier:fix
```

## API Documentation

Once the server is running, visit `http://localhost:8888/v1/docs` to view the interactive Swagger API documentation.

## API Endpoints

### Authentication

**Magic Link Authentication:**
- `POST /v1/auth/magic-link` - Request a magic link (sends email)
  ```json
  {
    "email": "user@example.com"
  }
  ```

- `GET /v1/auth/verify/verify?token={token}` - Verify magic link and get JWT tokens

**Legacy Password Authentication:**
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login with email/password
- `POST /v1/auth/logout` - Logout
- `POST /v1/auth/refresh-tokens` - Refresh auth tokens
- `POST /v1/auth/forgot-password` - Send reset password email
- `POST /v1/auth/reset-password` - Reset password

### Users

- `GET /v1/users` - Get all users (admin only)
- `GET /v1/users/:userId` - Get user by ID
- `PATCH /v1/users/:userId` - Update user
- `DELETE /v1/users/:userId` - Delete user
- `POST /v1/users/:userId/payment-exempt` - Mark user as payment exempt (admin only)
- `DELETE /v1/users/:userId/payment-exempt` - Remove payment exemption (admin only)

### Subscriptions

- `GET /v1/subscriptions/status` - Get current user's subscription status
- `POST /v1/subscriptions/create-checkout-session` - Create Stripe checkout for subscription
- `POST /v1/subscriptions/create-portal-session` - Create billing portal session to manage subscription
- `POST /v1/subscriptions/webhook` - Stripe webhook endpoint (internal use)

### Portfolio

- `POST /v1/portfolio/dashboard` - Get portfolio dashboard (requires active subscription)

### Positions (Coming Soon)

- `GET /v1/positions` - Get user's positions
- `POST /v1/positions` - Create new position
- `GET /v1/positions/:positionId` - Get position details
- `PATCH /v1/positions/:positionId` - Update position
- `DELETE /v1/positions/:positionId` - Delete position
- `GET /v1/positions/stats` - Get trading statistics

## Database Models

### User Model

```javascript
{
  email: String (required, unique),
  name: String (required),
  subscribe_signals: Boolean (default: false),
  subscribe_positions: Boolean (default: false),
  active: Boolean (default: true),
  
  // Subscription fields
  is_payment_exempt: Boolean (default: false),
  stripe_customer_id: String,
  stripe_subscription_id: String,
  subscription_status: String, // trial, active, past_due, canceled, etc.
  trial_start_date: Date,
  trial_end_date: Date,
  subscription_start_date: Date,
  subscription_end_date: Date,
  
  last_login: Date,
  created_at: Date (default: now)
}
```

### Position Model

```javascript
{
  user_email: String (required),
  ticker: String (required),
  entry_price: Number (required),
  entry_date: String (required),
  shares: Number (required),
  is_active: Boolean (default: true),
  added_at: Date (default: now),
  
  // Exit fields (when position is closed)
  exit_price: Number,
  exit_date: String,
  exit_reason: String,
  closed_at: Date,
  profit: Number,
  return_pct: Number
}
```

## Email Templates

Email templates use MJML for maximum compatibility across email clients (Outlook, Gmail, Apple Mail, etc.).

**Location:** `src/views/emails/`

To customize the magic link email, edit `magicLink.mjml`:
- Change colors and branding
- Modify text and messaging
- Update app name and support email

## Project Structure

```
src/
 |--config/         # Configuration (database, JWT, email, etc.)
 |--controllers/    # Route controllers (request/response handling)
 |--docs/           # Swagger API documentation
 |--middlewares/    # Custom Express middlewares
 |--models/         # Mongoose models (User, Position, Token)
 |--routes/         # API routes
 |--services/       # Business logic layer
 |--utils/          # Utility functions
 |--validations/    # Request validation schemas (Joi)
 |--views/          # Email templates (MJML)
 |--app.js          # Express app setup
 |--index.js        # Application entry point
```

## Testing the Email System

To send a test magic link email:

```bash
NODE_ENV=development node test-email.js
```

This will send a test email to the address specified in the script.

## Testing Stripe Integration

Several test tools are provided:

### Interactive Shell Script
```bash
./test-api.sh
```
Interactive menu to test all subscription endpoints with curl commands.

### Node.js Test Script
```bash
node test-subscription.js
```
Automated test suite for subscription functionality.

### Manual Testing with Stripe CLI
```bash
# Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/v1/subscriptions/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

See [STRIPE_INTEGRATION_GUIDE.md](STRIPE_INTEGRATION_GUIDE.md) for comprehensive testing guide.

## Docker Deployment

Build and run with Docker:

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Security Best Practices

- Always use strong, unique JWT secrets in production
- Enable HTTPS in production
- Use environment-specific `.env` files
- Regularly update dependencies
- Use App Passwords for Gmail SMTP
- Implement rate limiting (already configured)
- Validate all user inputs (Joi validation in place)

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT tokens, Magic Link
- **Email:** Nodemailer with MJML templates
- **Validation:** Joi
- **Testing:** Jest
- **Documentation:** Swagger/OpenAPI
- **Security:** Helmet, express-mongo-sanitize, xss-clean
- **Process Manager:** PM2

## License

[MIT](LICENSE)

```javascript
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const userSchema = mongoose.Schema(
  {
    /* schema definition here */
  },
  { timestamps: true }
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate);

const User = mongoose.model('User', userSchema);
```

### toJSON

The toJSON plugin applies the following changes in the toJSON transform call:

- removes \_\_v, createdAt, updatedAt, and any schema path that has private: true
- replaces \_id with id

### paginate

The paginate plugin adds the `paginate` static method to the mongoose schema.

Adding this plugin to the `User` model schema will allow you to do the following:

```javascript
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};
```

The `filter` param is a regular mongo filter.

The `options` param can have the following (optional) fields:

```javascript
const options = {
  sortBy: 'name:desc', // sort order
  limit: 5, // maximum results per page
  page: 2, // page number
};
```

The plugin also supports sorting by multiple criteria (separated by a comma): `sortBy: name:desc,role:asc`

The `paginate` method returns a Promise, which fulfills with an object having the following properties:

```json
{
  "results": [],
  "page": 2,
  "limit": 5,
  "totalPages": 10,
  "totalResults": 48
}
```

## Linting

Linting is done using [ESLint](https://eslint.org/) and [Prettier](https://prettier.io).

In this app, ESLint is configured to follow the [Airbnb JavaScript style guide](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb-base) with some modifications. It also extends [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) to turn off all rules that are unnecessary or might conflict with Prettier.

To modify the ESLint configuration, update the `.eslintrc.json` file. To modify the Prettier configuration, update the `.prettierrc.json` file.

To prevent a certain file or directory from being linted, add it to `.eslintignore` and `.prettierignore`.

To maintain a consistent coding style across different IDEs, the project contains `.editorconfig`

## 📚 Documentation

This project includes comprehensive documentation:

- **[STRIPE_INTEGRATION_GUIDE.md](STRIPE_INTEGRATION_GUIDE.md)** - Complete Stripe setup guide with frontend examples
- **[ENV_SETUP.md](ENV_SETUP.md)** - Quick reference for environment variables and Stripe configuration
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical summary of what was implemented
- **[API_PORTFOLIO_DASHBOARD.md](API_PORTFOLIO_DASHBOARD.md)** - Portfolio API documentation

### Test Scripts

- `test-subscription.js` - Node.js script to test subscription endpoints
- `test-api.sh` - Interactive bash script with curl commands for API testing
- `test-email.js` - Test email sending functionality

## Contributing

Contributions are more than welcome! Please check out the [contributing guide](CONTRIBUTING.md).

## Inspirations

- [danielfsousa/express-rest-es2017-boilerplate](https://github.com/danielfsousa/express-rest-es2017-boilerplate)
- [madhums/node-express-mongoose](https://github.com/madhums/node-express-mongoose)
- [kunalkapadia/express-mongoose-es6-rest-api](https://github.com/kunalkapadia/express-mongoose-es6-rest-api)

## License

[MIT](LICENSE)
