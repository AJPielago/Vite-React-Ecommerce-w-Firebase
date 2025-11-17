const Review = require('../models/Review');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');

// Helper function to check and filter profanity (bad-words is an ES module)
const checkProfanity = async (text) => {
  try {
    const { default: Filter } = await import('bad-words');
    const filter = new Filter();
    
    // Check if text contains profanity
    if (filter.isProfane(text)) {
      return { hasProfanity: true, cleaned: null };
    }
    
    // No profanity found, return cleaned text (for consistency)
    return { hasProfanity: false, cleaned: text };
  } catch (error) {
    console.error('Error checking profanity:', error);
    // Fallback: simple check if bad-words fails
    const hasProfanity = /\b(fuck|shit|damn|hell|bitch|ass)\b/gi.test(text);
    return { 
      hasProfanity, 
      cleaned: hasProfanity ? null : text 
    };
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/v1/products/:productId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ 
    product: req.params.productId,
    status: 'approved'
  })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Add review
// @route   POST /api/v1/products/:productId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  // Add user and product to req.body
  req.body.user = req.user.id;
  req.body.product = req.params.productId;
  
  // Check for profanity and block if found
  if (req.body.comment) {
    const profanityCheck = await checkProfanity(req.body.comment);
    if (profanityCheck.hasProfanity) {
      return next(
        new ErrorResponse('Your review contains inappropriate language. Please revise your comment.', 400)
      );
    }
    req.body.comment = profanityCheck.cleaned;
  }

  // Check if user already reviewed the product
  const existingReview = await Review.findOne({
    user: req.user.id,
    product: req.params.productId
  });

  if (existingReview) {
    return next(
      new ErrorResponse('You have already reviewed this product', 400)
    );
  }

  // Ensure the user purchased this product and the order was delivered
  const Order = require('../models/Order');
  const hasDeliveredOrder = await Order.findOne({
    user: req.user.id,
    isDelivered: true,
    'orderItems.product': req.params.productId
  });

  if (!hasDeliveredOrder) {
    return next(
      new ErrorResponse('Only customers who have received this product can leave a review', 403)
    );
  }

  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to update this review', 401)
    );
  }

  // Check for profanity and block if found
  if (req.body.comment) {
    const profanityCheck = await checkProfanity(req.body.comment);
    if (profanityCheck.hasProfanity) {
      return next(
        new ErrorResponse('Your review contains inappropriate language. Please revise your comment.', 400)
      );
    }
    req.body.comment = profanityCheck.cleaned;
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/Admin
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is admin or the review owner
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to delete this review', 401)
    );
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all reviews (Admin)
// @route   GET /api/v1/reviews
// @access  Private/Admin
exports.getAllReviews = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Update review status (Admin)
// @route   PUT /api/v1/reviews/:id/status
// @access  Private/Admin
exports.updateReviewStatus = asyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    {
      new: true,
      runValidators: true
    }
  );

  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review
  });
});
