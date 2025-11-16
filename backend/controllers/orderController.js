const Order = require('../models/Order');
const { Email } = require('../utils/emailService');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, shippingCarrier, comment } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Validate status transition
  const validTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };

  if (status !== order.status) {
    if (!validTransitions[order.status]?.includes(status)) {
      res.status(400);
      throw new Error(`Cannot change status from ${order.status} to ${status}`);
    }
  }

  // Update order status and tracking info
  order.status = status;
  
  // Update tracking info if provided
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (shippingCarrier) order.shippingCarrier = shippingCarrier;
  
  // Update delivered status if applicable
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  // Add to status history
  order.statusHistory.push({
    status,
    changedBy: req.user._id,
    comment,
    changedAt: Date.now()
  });

  const updatedOrder = await order.save();

  try {
    // Send email notification to customer
    const user = await User.findById(order.user);
    // Only send notifications if the user's email is verified
    if (user && user.emailVerified) {
      await new Email(user, updatedOrder).sendOrderStatusUpdate();
    }
  } catch (emailError) {
    console.error('Failed to send status update email:', emailError);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    data: updatedOrder
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('statusHistory.changedBy', 'name');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is admin or order belongs to user
  if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized to view this order');
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = {};
  
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('user', 'id name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const count = await Order.countDocuments(query);

  res.json({
    success: true,
    data: orders,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count
  });
});
