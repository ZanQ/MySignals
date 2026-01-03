# MySignals - Trading Position Tracker API

A Node.js REST API for tracking trading positions, profit/loss analytics, and user authentication via magic link. Built for traders to monitor their portfolio performance and receive position updates.

## Features

- **Magic Link Authentication** - Passwordless login via email
- **Position Tracking** - Track open and closed trading positions
- **P&L Analytics** - Automatic profit/loss calculations and win rate statistics
- **Email Notifications** - Beautiful MJML-powered email templates
- **User Management** - Subscription preferences for signals and position updates
- **NoSQL Database** - MongoDB with Mongoose ODM
- **Security** - JWT tokens, rate limiting, helmet, XSS protection
- **API Documentation** - Swagger/OpenAPI docs
- **Testing** - Unit and integration tests with Jest
- **Docker Support** - Production-ready containerization

## Quick Start

### Prerequisites

- Node.js >= 12.0.0
- MongoDB (local or Atlas)
- SMTP email account (Gmail recommended)

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

Create a `.env` file in the root directory with the following variables:

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
```

**Important:** 
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- Change `JWT_SECRET` to a strong random string in production
- Update `BASE_URL` to your frontend application URL
- Replace MongoDB connection string with your own cluster

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

- `GET /v1/auth/magic-link/verify?token={token}` - Verify magic link and get JWT tokens

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

## Contributing

Contributions are more than welcome! Please check out the [contributing guide](CONTRIBUTING.md).

## Inspirations

- [danielfsousa/express-rest-es2017-boilerplate](https://github.com/danielfsousa/express-rest-es2017-boilerplate)
- [madhums/node-express-mongoose](https://github.com/madhums/node-express-mongoose)
- [kunalkapadia/express-mongoose-es6-rest-api](https://github.com/kunalkapadia/express-mongoose-es6-rest-api)

## License

[MIT](LICENSE)
