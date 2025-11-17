const express = require('express');
const {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders
} = require('../controllers/orders');
const { updateOrderStatus } = require('../controllers/orderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/').post(protect, addOrderItems).get(protect, authorize('admin'), getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, authorize('admin'), updateOrderToDelivered);
router.route('/:id/status').put(protect, authorize('admin'), updateOrderStatus);

module.exports = router;
