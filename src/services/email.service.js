const nodemailer = require('nodemailer');
const mjml2html = require('mjml');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const { convert } = require('html-to-text');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Load and compile an MJML email template with Handlebars
 * @param {string} templateName - Name of the template file (without extension)
 * @param {Object} variables - Variables to inject into the template
 * @returns {Object} - Object containing html and text versions
 */
const loadTemplate = (templateName, variables) => {
  // Check for MJML template first, fallback to HTML
  const mjmlPath = path.join(__dirname, '../views/emails', `${templateName}.mjml`);
  const htmlPath = path.join(__dirname, '../views/emails', `${templateName}.html`);
  
  let html;
  
  if (fs.existsSync(mjmlPath)) {
    // Load MJML template
    const mjmlSource = fs.readFileSync(mjmlPath, 'utf8');
    
    // Compile with Handlebars first (for variables)
    const template = handlebars.compile(mjmlSource);
    const mjmlWithVars = template(variables);
    
    // Convert MJML to HTML
    const { html: mjmlHtml, errors } = mjml2html(mjmlWithVars, {
      keepComments: false,
      validationLevel: 'soft',
    });
    
    if (errors && errors.length > 0) {
      logger.warn('MJML compilation warnings:', errors);
    }
    
    html = mjmlHtml;
  } else if (fs.existsSync(htmlPath)) {
    // Fallback to HTML template
    const htmlSource = fs.readFileSync(htmlPath, 'utf8');
    const template = handlebars.compile(htmlSource);
    html = template(variables);
  } else {
    throw new Error(`Template ${templateName} not found`);
  }
  
  // Generate plain text version
  const text = convert(html, {
    wordwrap: 130,
  });
  
  return { html, text };
};

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html - Optional HTML content
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html) => {
  const msg = { from: config.email.from, to, subject, text };
  if (html) {
    msg.html = html;
  }
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  const resetPasswordUrl = `${config.baseUrl}/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `${config.baseUrl}/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send magic link email
 * @param {string} to
 * @param {string} token
 * @param {string} userName - User's name
 * @returns {Promise}
 */
const sendMagicLinkEmail = async (to, token, userName = 'there') => {
  const subject = 'Your Magic Link to Sign In';
  const magicLinkUrl = `${config.baseUrl}/auth/magic-link?token=${token}`;
  
  const { html, text } = loadTemplate('magicLink', {
    appName: 'MySignals',
    userName,
    magicLink: magicLinkUrl,
    supportEmail: config.email.from,
  });

  await sendEmail(to, subject, text, html);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendMagicLinkEmail,
};
