const express = require('express');
const router = express.Router();
const {
  getSalesAnalytics,
  getMonthlySales,
  getSalesByCategory
} = require('../controllers/salesController');

const { protect, authorize } = require('../middleware/auth');

// Protect all routes with authentication and admin authorization
router.use(protect);
router.use(authorize('admin'));

// Sales analytics with date range
router.get('/analytics', getSalesAnalytics);

// Monthly sales for the current year
router.get('/monthly', getMonthlySales);

// Sales by category
router.get('/category', getSalesByCategory);

module.exports = router;
