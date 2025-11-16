const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  countInStock: { type: Number, required: true },
  qty: { type: Number, required: true }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cartItems: [cartItemSchema],
  totalPrice: { type: Number, required: true, default: 0 },
  totalQty: { type: Number, required: true, default: 0 }
}, {
  timestamps: true
});

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.totalQty = this.cartItems.reduce((total, item) => total + item.qty, 0);
  this.totalPrice = this.cartItems.reduce(
    (total, item) => total + (item.price * item.qty),
    0
  );
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
