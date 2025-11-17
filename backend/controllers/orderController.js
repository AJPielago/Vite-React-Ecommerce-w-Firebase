const Order = require('../models/Order');
const { Email } = require('../utils/emailService');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, shippingCarrier, comment } = req.body;
  
  // Validate that status is provided
  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update order status'
    });
  }

  // Get current status (default to 'pending' if not set)
  const currentStatus = order.status || 'pending';

  // Validate status transition
  const validTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };

  // Validate status value
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`
    });
  }

  // Only validate transition if status is actually changing
  if (status !== currentStatus) {
    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}. Valid transitions from ${currentStatus} are: ${validTransitions[currentStatus]?.join(', ') || 'none'}`
      });
    }
  }

  // Update order status and tracking info
  order.status = status;
  
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (shippingCarrier) order.shippingCarrier = shippingCarrier;
  
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  // Add to status history
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status,
    changedBy: req.user._id,
    comment,
    changedAt: Date.now()
  });

  const updatedOrder = await order.save();

  // Send email notification to customer for every update
  let emailSent = false;
  let emailError = null;
  try {
    const user = await User.findById(order.user).select('name email');
    if (user?.email) {
      console.log(`Attempting to send order status update email to: ${user.email}`);
      await new Email(user, updatedOrder).sendOrderStatusUpdate();
      emailSent = true;
      console.log(`Order status update email sent successfully to: ${user.email}`);
    } else {
      console.warn(`User ${order.user} has no email address, skipping email notification`);
    }
  } catch (err) {
    emailError = err;
    console.error('Failed to send status update email:', {
      error: err.message,
      stack: err.stack,
      userEmail: order.user?.email || 'unknown',
      orderId: order._id
    });
  }

  res.json({
    success: true,
    data: updatedOrder,
    emailSent,
    emailError: emailError ? emailError.message : null
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
