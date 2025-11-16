const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate('cartItems.product');
  
  if (!cart) {
    // If no cart exists, create one
    cart = await Cart.create({ user: req.user.id, cartItems: [] });
  }
  
  res.status(200).json({
    success: true,
    data: cart
  });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, qty = 1 } = req.body;
  
  // Validate product exists and is in stock
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${productId}`, 404));
  }
  if (product.stock < qty) {
    return next(new ErrorResponse(`Not enough stock. Only ${product.stock} items available.`, 400));
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ 
      user: req.user.id, 
      cartItems: [] 
    });
  }

  // Check if product already in cart
  const itemIndex = cart.cartItems.findIndex(
    item => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    // Update quantity if product exists
    const newQty = cart.cartItems[itemIndex].qty + Number(qty);
    if (product.stock < newQty) {
      return next(new ErrorResponse(
        `Not enough stock. Only ${product.stock} items available.`, 
        400
      ));
    }
    cart.cartItems[itemIndex].qty = newQty;
  } else {
    // Add new item to cart
    cart.cartItems.push({
      product: productId,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      price: product.price,
      countInStock: product.stock,
      qty: Number(qty)
    });
  }

  // Save cart (will trigger pre-save hook to calculate totals)
  await cart.save();
  
  // Populate product details for response
  await cart.populate('cartItems.product', 'name price images stock');

  res.status(200).json({
    success: true,
    data: cart
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
exports.updateCartItemQty = asyncHandler(async (req, res, next) => {
  const { qty } = req.body;
  
  if (!qty || qty < 1) {
    return next(new ErrorResponse('Please provide a valid quantity', 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  const itemIndex = cart.cartItems.findIndex(
    item => item._id.toString() === req.params.id
  );

  if (itemIndex === -1) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }

  // Get the product to check stock
  const product = await Product.findById(cart.cartItems[itemIndex].product);
  
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  if (product.stock < qty) {
    return next(
      new ErrorResponse(
        `Only ${product.stock} items of ${product.name} are available in stock`,
        400
      )
    );
  }

  // Update quantity
  cart.cartItems[itemIndex].qty = Number(qty);
  
  // Save will trigger the pre-save hook to calculate totals
  await cart.save();
  
  res.status(200).json({
    success: true,
    data: cart.cartItems[itemIndex]
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  const itemIndex = cart.cartItems.findIndex(
    item => item._id.toString() === req.params.id
  );

  if (itemIndex === -1) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }

  // Remove the item from the cart
  cart.cartItems.splice(itemIndex, 1);
  
  // If cart is empty, delete it, otherwise save it
  if (cart.cartItems.length === 0) {
    await Cart.findByIdAndDelete(cart._id);
    return res.status(200).json({
      success: true,
      data: {}
    });
  }
  
  // Save will trigger the pre-save hook to calculate totals
  await cart.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update entire cart
// @route   PUT /api/cart
// @access  Private
exports.updateCart = asyncHandler(async (req, res, next) => {
  const { items } = req.body;
  
  if (!Array.isArray(items)) {
    return next(new ErrorResponse('Please provide an array of items', 400));
  }

  // Log incoming payload for debugging invalid requests
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Cart] updateCart payload items:', JSON.stringify(items, null, 2));
  }

  // Validate all products exist and are in stock
  // First aggregate quantities by product ID so we check the total requested qty
  const productTotals = {};
  items.forEach(item => {
    const pid = String(item.product);
    const qty = Number(item.qty) || 0;
    productTotals[pid] = (productTotals[pid] || 0) + qty;
  });

  // Validate each unique product
  for (const productId of Object.keys(productTotals)) {
    const totalQty = productTotals[productId];
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${productId}`, 404));
    }
    // Debug logging to help diagnose 400 errors
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cart] Validating product ${productId}: requested=${totalQty}, stock=${product.stock}`);
    }
    if (product.stock < totalQty) {
      return next(new ErrorResponse(
        `Not enough stock for ${product.name}. Only ${product.stock} items available.`,
        400
      ));
    }
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = new Cart({ 
      user: req.user.id, 
      cartItems: [] 
    });
  }

  // Update cart items
  // Merge duplicate products in the incoming items by product id (sum quantities)
  const merged = {};
  items.forEach(item => {
    const pid = String(item.product);
    if (!merged[pid]) {
      merged[pid] = { ...item, qty: Number(item.qty) };
    } else {
      merged[pid].qty = Number(merged[pid].qty) + Number(item.qty);
    }
  });

  cart.cartItems = Object.keys(merged).map(pid => ({
    product: pid,
    name: merged[pid].name,
    image: merged[pid].image,
    price: merged[pid].price,
    countInStock: merged[pid].countInStock,
    qty: merged[pid].qty
  }));

  // Save cart (will trigger pre-save hook to calculate totals)
  await cart.save();
  
  // Populate product details for response
  await cart.populate('cartItems.product', 'name price images stock');

  res.status(200).json({
    success: true,
    data: cart
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }
  
  // Remove the cart document since it's empty
  await Cart.findByIdAndDelete(cart._id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});
