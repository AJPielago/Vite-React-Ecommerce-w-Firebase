const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
  getOrders, 
  getOrderById, 
  updateOrderStatus 
} = require('../controllers/orderController');

// Admin routes
router.route('/')
  .get(protect, admin, getOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

module.exports = router;
