const express = require('express');
const {
  getReviews,
  addReview,
  updateReview,
  deleteReview,
  getAllReviews,
  updateReviewStatus
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const advancedFiltering = require('../middleware/advancedFiltering');
const Review = require('../models/Review');

const router = express.Router({ mergeParams: true });

// Public routes
router
  .route('/')
  .get(
    advancedFiltering(Review, [
      { path: 'user', select: 'name email' },
      { path: 'product', select: 'name price' }
    ]),
    getReviews
  )
  .post(protect, addReview);

// Admin routes
router
  .route('/admin')
  .get(
    protect,
    authorize('admin'),
    advancedFiltering(Review, [
      { path: 'user', select: 'name email' },
      { path: 'product', select: 'name price' }
    ]),
    getAllReviews
  );

router
  .route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

router
  .route('/:id/status')
  .put(protect, authorize('admin'), updateReviewStatus);

module.exports = router;
