const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { APIError, asyncHandler, successResponse } = require('../utils/response.util');
const User = require('../models/user.model');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new APIError('Invalid credentials', 401);
  }

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new APIError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new APIError('Your account has been deactivated', 401);
  }

  // Get role-specific profile for students and teachers
  let profile;
  switch (user.role) {
    case 'STUDENT':
      profile = await Student.findOne({ user: user._id });
      break;
    case 'TEACHER':
      profile = await Teacher.findOne({ user: user._id });
      break;
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Generate tokens
  const tokens = generateTokens(user._id, user.role);
  
  // Set cookies for browser clients
  // Set access token cookie - httpOnly for security, secure should be true in production
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
  
  // Set refresh token cookie with longer expiration
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  const userData = {
    _id: user._id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image
  };

  if (profile) {
    userData.profile = profile;
  }

  successResponse(res, 200, 'Login successful', {
    user: userData,
    ...tokens // Still include tokens in response for non-browser clients
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  // In a real application, you might want to invalidate the token
  // This could be done by maintaining a blacklist of invalid tokens
  // or by using Redis to store invalid tokens until they expire
  
  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  
  successResponse(res, 200, 'Logout successful');
});

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new APIError('Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  successResponse(res, 200, 'Password updated successfully');
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new APIError('User not found', 404);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // In a real application, send email with reset token
  // For development, we'll just return the token
  successResponse(res, 200, 'Password reset token sent', {
    resetToken,
    message: 'In production, this token would be sent via email'
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  // Get hashed token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new APIError('Invalid or expired reset token', 400);
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  successResponse(res, 200, 'Password reset successful');
});

/**
 * @desc    Get current user info
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = asyncHandler(async (req, res) => {
  // Get role-specific profile
  let profile;
  switch (req.user.role) {
    case 'STUDENT':
      profile = await Student.findOne({ user: req.user._id });
      break;
    case 'TEACHER':
      profile = await Teacher.findOne({ user: req.user._id });
      break;
  }

  successResponse(res, 200, 'User data retrieved successfully', {
    _id: req.user._id,
    email: req.user.email,
    role: req.user.role,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    profile
  });
});

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Private
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookie
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    throw new APIError('No refresh token provided', 401);
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new APIError('User not found', 404);
    }

    if (!user.isActive) {
      throw new APIError('Your account has been deactivated', 401);
    }

    // Generate new tokens
    const tokens = generateTokens(user._id, user.role);

    // Set new cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    successResponse(res, 200, 'Tokens refreshed successfully', tokens);
  } catch (error) {
    throw new APIError('Invalid refresh token', 401);
  }
});