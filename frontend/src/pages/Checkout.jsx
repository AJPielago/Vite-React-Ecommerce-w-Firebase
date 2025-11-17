import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import Form from '../components/forms/FormikForm';
import { Field } from 'formik';
import FormInput from '../components/forms/FormInput';
import { checkoutValidationSchema } from '../utils/validations';
import { createOrder } from '../services/orderApi';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const itemsPrice = getCartTotal();
  const shippingPrice = 10;
  const taxPrice = +(itemsPrice * 0.1).toFixed(2);
  const totalPrice = +(itemsPrice + shippingPrice + taxPrice).toFixed(2);

  const handlePlaceOrder = async (values, { setSubmitting }) => {
    try {
      const orderItems = cartItems.map(i => ({
        name: i.name,
        qty: i.qty,
        image: i.image || i.product?.images?.[0] || '',
        price: i.price,
        product: i.product?._id || i.product || i._id
      }));

      if (!orderItems || orderItems.length === 0) {
        alert('Your cart is empty');
        return;
      }

      const payload = {
        orderItems,
        shippingAddress: values.shippingAddress,
        paymentMethod: values.paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice
      };

      const { data } = await createOrder(payload);
      // Clear local cart after successful order
      clearCart();

      // Navigate to order details (new page added)
      navigate(`/orders/${data._id}`);
    } catch (err) {
      console.error('Failed to create order', err);
      alert(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues = {
    shippingAddress: {
      address: user?.shippingAddress?.address || '',
      city: user?.shippingAddress?.city || '',
      postalCode: user?.shippingAddress?.postalCode || '',
      country: user?.shippingAddress?.country || ''
    },
    paymentMethod: 'PayPal'
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow">
          <p className="text-lg">You must be logged in to checkout</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => navigate('/login?redirect=checkout')}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <Form
              initialValues={initialValues}
              validationSchema={checkoutValidationSchema}
              onSubmit={handlePlaceOrder}
              submitText={`Place Order ($${totalPrice.toFixed(2)})`}
            >
              <FormInput name="shippingAddress.address" label="Address" />
              <FormInput name="shippingAddress.city" label="City" />
              <FormInput name="shippingAddress.postalCode" label="Postal Code" />
              <FormInput name="shippingAddress.country" label="Country" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <Field type="radio" name="paymentMethod" value="PayPal" className="mr-2" />
                    PayPal
                  </label>
                  <label className="inline-flex items-center">
                    <Field type="radio" name="paymentMethod" value="Card" className="mr-2" />
                    Card
                  </label>
                  <label className="inline-flex items-center">
                    <Field type="radio" name="paymentMethod" value="CashOnDelivery" className="mr-2" />
                    Cash on Delivery
                  </label>
                </div>
              </div>
            </Form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            {cartItems.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <div>
                <ul className="mb-4 divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <li key={item._id || item.product} className="py-3 flex items-center">
                      <img src={item.image || 'https://via.placeholder.com/100'} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <span>{item.name}</span>
                          <span>${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-500">Qty: {item.qty}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${itemsPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shippingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${taxPrice.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
