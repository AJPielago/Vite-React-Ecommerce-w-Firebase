import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { getOrderById } from '../../services/orderApi';

const statusIcons = {
  pending: <ClockIcon className="h-6 w-6 text-yellow-500" />,
  processing: <ClockIcon className="h-6 w-6 text-blue-500" />,
  shipped: <TruckIcon className="h-6 w-6 text-indigo-500" />,
  delivered: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
  cancelled: <XCircleIcon className="h-6 w-6 text-red-500" />,
};

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
        <p>{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Orders
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Order #{order._id.substring(-6).toUpperCase()}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {statusIcons[order.status]}
                <span className="ml-1">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Order Items</h3>
            </div>
            <div className="px-4 py-5 sm:p-0">
              <ul className="divide-y divide-gray-200">
                {order.orderItems.map((item) => (
                  <li key={item._id} className="py-4 sm:py-5">
                    <div className="flex items-center">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.image || 'https://via.placeholder.com/150'}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>{item.name}</h3>
                          <p className="ml-4">${item.price.toFixed(2)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Qty: {item.qty}</p>
                        <p className="mt-1 text-sm text-gray-900">
                          ${(item.price * item.qty).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Status History</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {[...order.statusHistory]
                      .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                      .map((history, idx, array) => (
                        <li key={history._id || idx}>
                          <div className="relative pb-8">
                            {idx !== array.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  history.status === 'pending' ? 'bg-yellow-100 text-yellow-500' :
                                  history.status === 'processing' ? 'bg-blue-100 text-blue-500' :
                                  history.status === 'shipped' ? 'bg-indigo-100 text-indigo-500' :
                                  history.status === 'delivered' ? 'bg-green-100 text-green-500' :
                                  'bg-red-100 text-red-500'
                                }`}>
                                  {statusIcons[history.status]}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-700">
                                    Status changed to <span className="font-medium">
                                      {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                                    </span>
                                    {history.comment && (
                                      <span className="block text-gray-500 text-sm mt-1">{history.comment}</span>
                                    )}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  <time dateTime={history.changedAt}>
                                    {format(new Date(history.changedAt), 'MMM d, yyyy h:mm a')}
                                  </time>
                                  {history.changedBy?.name && (
                                    <p className="text-xs text-gray-400">by {history.changedBy.name}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Customer</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <span className="text-xl font-medium">
                    {order.user?.name?.charAt(0) || 'G'}
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    {order.user?.name || 'Guest'}
                  </h4>
                  <p className="text-sm text-gray-500">{order.user?.email || ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Shipping Address</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <address className="not-italic">
                <div className="text-sm text-gray-700">
                  <p>{order.shippingAddress?.address}</p>
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                  <p>{order.shippingAddress?.country}</p>
                </div>
              </address>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Order Summary</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${order.itemsPrice?.toFixed(2) || '0.00'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Shipping</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${order.shippingPrice?.toFixed(2) || '0.00'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Tax</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${order.taxPrice?.toFixed(2) || '0.00'}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-medium text-gray-900">
                    ${order.totalPrice?.toFixed(2) || '0.00'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Payment Information</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Payment Method:</span>
                <span className="text-sm text-gray-700">
                  {order.paymentMethod?.charAt(0).toUpperCase() + order.paymentMethod?.slice(1) || 'N/A'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Payment Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.isPaid ? 'Paid' : 'Not Paid'}
                </span>
              </div>
              {order.paidAt && (
                <div className="mt-2 text-sm text-gray-500">
                  Paid on {format(new Date(order.paidAt), 'MMMM d, yyyy')}
                </div>
              )}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <span className="font-medium">Order Note:</span> {order.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
