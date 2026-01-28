const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');

const register = catchAsync(async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    
    // Generate and send magic link email to new user
    const magicLinkToken = await tokenService.generateMagicLinkToken(user);
    await emailService.sendMagicLinkEmail(user.email, magicLinkToken, user.name);
    
    res.status(httpStatus.CREATED).send({ 
      success: true, 
      message: 'User added successfully',
      user 
    });
  } catch (error) {
    if (error.statusCode === httpStatus.BAD_REQUEST && error.message.includes('already exists')) {
      return res.status(httpStatus.BAD_REQUEST).send({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    throw error;
  }
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendMagicLink = catchAsync(async (req, res) => {
  try {
    const { token, user } = await authService.sendMagicLink(req.body.email);
    await emailService.sendMagicLinkEmail(req.body.email, token, user.name);
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    if (error.statusCode === httpStatus.NOT_FOUND) {
      return res.status(httpStatus.NOT_FOUND).send({ success: false, message: 'user not found' });
    }
    throw error;
  }
});

const verifyMagicLink = catchAsync(async (req, res) => {
  const user = await authService.loginWithMagicLink(req.query.token);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  sendMagicLink,
  verifyMagicLink,
};
