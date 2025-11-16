const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Update user profile
// @route   PUT /api/v1/auth/me
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  // Load user so we can safely update and optionally change the password
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = String(req.body.email).replace(/,/g, '.').trim();
  if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;

  if (req.body.shippingAddress) {
    user.shippingAddress = {
      address: req.body.shippingAddress.address || '',
      city: req.body.shippingAddress.city || '',
      postalCode: req.body.shippingAddress.postalCode || '',
      country: req.body.shippingAddress.country || ''
    };
  }

  // Password change is optional
  if (req.body.newPassword) {
    if (!req.body.currentPassword) {
      return next(new ErrorResponse('Current password is required to change password', 400));
    }

    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }
    user.password = req.body.newPassword;
  }

  await user.save();

  const updatedUser = await User.findById(req.user.id).select('-password');

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
});
