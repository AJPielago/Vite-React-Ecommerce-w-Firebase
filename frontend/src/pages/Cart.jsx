import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import { TrashIcon } from '@heroicons/react/24/outline';

const Cart = () => {
  const { cartItems, removeFromCart, updateCartQty, getCartTotal } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
            <Link
              to="/products"
              className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center p-6 border-b border-gray-200 last:border-b-0"
                >
                  <img
                    src={item.image || (item.product?.images?.[0] && item.product.images[0] !== 'no-photo.jpg'
                      ? item.product.images[0]
                      : 'https://via.placeholder.com/100x100?text=No+Image')}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <div className="flex-1 ml-6">
                    <Link
                      to={`/products/${item.product?._id || item.product || item._id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-pink-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-gray-600 mt-1">${item.price.toFixed(2)}</p>
                    <div className="mt-2">
                      <div className="relative">
                        <select
                          value={item.qty}
                          onChange={(e) => updateCartQty(item._id, e.target.value)}
                          className="pl-3 pr-8 py-1.5 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500 appearance-none bg-white w-20"
                        >
                          {[...Array(Math.min(item.countInStock || 0, 10)).keys()].map((x) => (
                            <option key={x + 1} value={x + 1}>
                              {x + 1}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${(item.price * item.qty).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="mt-2 text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">$10.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">${(getCartTotal() * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold text-pink-600">
                      ${(getCartTotal() + 10 + getCartTotal() * 0.1).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition-colors"
              >
                Proceed to Checkout
              </button>
              <Link
                to="/products"
                className="block text-center mt-4 text-pink-600 hover:text-rose-600 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
