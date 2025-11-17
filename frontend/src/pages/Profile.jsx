import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import ProfileForm from '../components/auth/ProfileForm';
import axios from 'axios';
import { getMyOrders } from '../services/orderApi';

const Profile = () => {
  const { user, updateUserProfile, loading, resendVerification } = useContext(AuthContext);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await getMyOrders();
        setOrders(data || []);
        setOrdersLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-semibold capitalize">{user?.role}</p>
                </div>
                {user?.shippingAddress && (
                  <div>
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <p className="font-semibold">{user?.shippingAddress?.address}</p>
                    <p className="text-sm text-gray-600">{user?.shippingAddress?.city}, {user?.shippingAddress?.postalCode}</p>
                    <p className="text-sm text-gray-600">{user?.shippingAddress?.country}</p>
                  </div>
                )}
                {!user?.emailVerified && user?.authProvider === 'email' && (
                  <div className="mt-3 p-3 rounded-md bg-yellow-50 text-yellow-800">
                    <p className="text-sm">Your email is not verified.</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          setResendLoading(true);
                          setResendError('');
                          setResendSuccess('');
                          try {
                            const result = await resendVerification();
                            if (!result.success) throw new Error(result.error || 'Failed to resend');
                            setResendSuccess('Verification email sent. Please check your inbox.');
                          } catch (err) {
                            setResendError(err.message || 'Failed to send verification email');
                          } finally {
                            setResendLoading(false);
                          }
                        }}
                        disabled={resendLoading}
                        className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {resendLoading ? 'Sending...' : 'Resend verification'}
                      </button>

                      {resendSuccess && <p className="text-sm text-green-700">{resendSuccess}</p>}
                      {resendError && <p className="text-sm text-red-700">{resendError}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <ProfileForm user={user} onSubmit={updateUserProfile} loading={loading} />
            </div>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Orders</h2>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm text-gray-600">Order ID</p>
                          <p className="font-semibold">{order._id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-semibold text-indigo-600">
                            ${order.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Payment Status</p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              order.isPaid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Delivery Status</p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              order.isDelivered
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {order.isDelivered ? 'Delivered' : 'Processing'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">Items</p>
                        <ul className="mt-2 space-y-1">
                          {order.orderItems.map((item, index) => (
                            <li key={index} className="text-sm">
                              {item.name} x {item.qty}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
