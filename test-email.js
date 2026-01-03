const mongoose = require('mongoose');
const config = require('./src/config/config');
const { emailService } = require('./src/services');
const logger = require('./src/config/logger');

// Connect to MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  sendTestEmail();
});

const sendTestEmail = async () => {
  try {
    const testEmail = 'peter.tang.lai@gmail.com';
    const testToken = 'test-token-123456789';
    const testUserName = 'Peter Tang';

    logger.info(`Sending test magic link email to ${testEmail}...`);
    
    await emailService.sendMagicLinkEmail(testEmail, testToken, testUserName);
    
    logger.info('✅ Test email sent successfully!');
    logger.info(`Check inbox at ${testEmail}`);
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to send test email:', error);
    process.exit(1);
  }
};

// Handle errors
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  process.exit(1);
});
