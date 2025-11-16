const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email: rawEmail, password, role } = req.body;
  const email = String(rawEmail || '').replace(/,/g, '.').trim();

  // Validate input
  if (!name || !email || !password) {
    return next(new ErrorResponse('Please provide name, email and password', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user' // Default to 'user' role if not specified
  });
  // Mark auth provider as email-based for users created via registration
  user.authProvider = 'email';
  await user.save();

  // Save emailVerified if provided (from Firebase)
  if (req.body.emailVerified) {
    user.emailVerified = true;
    await user.save();
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email: rawEmail, password } = req.body;
  const email = String(rawEmail || '').replace(/,/g, '.').trim();

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new ErrorResponse('Your account has been deactivated. Please contact support.', 403));
  }

  // Require email verification (if the flag exists)
  if (typeof user.emailVerified !== 'undefined' && !user.emailVerified) {
    return next(new ErrorResponse('Please verify your email before logging in', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// Get token from model, create cookie and send response
// @desc    Update user profile
// @route   PUT /api/v1/auth/me/update
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  // Load user so we can update fields and optionally change the password.
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Update basic fields when provided
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = String(req.body.email).replace(/,/g, '.').trim();
  if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;

  // Update shipping address if provided
  if (req.body.shippingAddress) {
    user.shippingAddress = {
      address: req.body.shippingAddress.address || '',
      city: req.body.shippingAddress.city || '',
      postalCode: req.body.shippingAddress.postalCode || '',
      country: req.body.shippingAddress.country || ''
    };
  }

  // Allow updating emailVerified flag if provided (from Firebase)
  if (typeof req.body.emailVerified !== 'undefined') {
    user.emailVerified = !!req.body.emailVerified;
  }

  // Handle password change; this is optional and only performed when newPassword is provided
  if (req.body.newPassword) {
    if (!req.body.currentPassword) {
      return next(new ErrorResponse('Current password is required to change password', 400));
    }

    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Assign new password and let the `pre('save')` hook handle hashing
    user.password = req.body.newPassword;
  }

  // Save the user to run hooks/validators
  await user.save();

  // Re-query to remove sensitive fields like password
  const updatedUser = await User.findById(req.user.id).select('-password');

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  
  // Cookie expires in 7 days (default)
  const cookieExpire = parseInt(process.env.JWT_COOKIE_EXPIRE) || 7;
  
  const options = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : 'localhost'
  };

  // Set the cookie and send response
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    });
};
