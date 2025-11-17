import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  TruckIcon, 
  XCircleIcon,
  ChevronRightIcon,
  SearchIcon,
  FilterIcon
} from '@heroicons/react/outline';
import { getOrders } from '../../services/orderApi';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusIcons = {
  pending: <ClockIcon className="h-5 w-5 mr-1" />,
  processing: <ClockIcon className="h-5 w-5 mr-1 text-blue-500" />,
  shipped: <TruckIcon className="h-5 w-5 mr-1 text-indigo-500" />,
  delivered: <CheckCircleIcon className="h-5 w-5 mr-1 text-green-500" />,
  cancelled: <XCircleIcon className="h-5 w-5 mr-1 text-red-500" />,
};

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data, total, totalPages, currentPage } = await getOrders(filters);
        setOrders(data);
        setPagination({
          total,
          totalPages,
          currentPage
        });
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters]);

  const handleStatusFilter = (status) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? '' : status,
      page: 1
    }));
  };

  const handleSearch = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
    window.scrollTo(0, 0);
  };

  if (loading && !orders.length) {
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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search orders..."
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <span className="text-sm text-gray-700 flex-shrink-0">
            <FilterIcon className="h-5 w-5 inline mr-1" />
            Status:
          </span>
          {Object.entries(statusStyles).map(([status, style]) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                filters.status === status 
                  ? `${style} ring-2 ring-offset-2 ring-offset-white ring-${style.split('-')[1]}-200`
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {statusIcons[status]}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Order
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-3 py-4 text-sm text-gray-500 text-center">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link 
                            to={`/admin/orders/${order._id}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            #{order._id.substring(-6).toUpperCase()}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="text-gray-900">{order.user?.name || 'Guest'}</div>
                          <div className="text-gray-500">{order.user?.email || ''}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]}`}>
                            {statusIcons[order.status]}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 text-right">
                          ${order.totalPrice?.toFixed(2) || '0.00'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link 
                            to={`/admin/orders/${order._id}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                          >
                            View <ChevronRightIcon className="h-4 w-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">
                          {Math.min((filters.page - 1) * filters.limit + 1, pagination.total)}
                        </span> to{' '}
                        <span className="font-medium">
                          {Math.min(filters.page * filters.limit, pagination.total)}
                        </span> of{' '}
                        <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                          disabled={filters.page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            filters.page === 1 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronRightIcon className="h-5 w-5 transform rotate-180" aria-hidden="true" />
                        </button>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (filters.page <= 3) {
                            pageNum = i + 1;
                          } else if (filters.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = filters.page - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                filters.page === pageNum
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(Math.min(pagination.totalPages, filters.page + 1))}
                          disabled={filters.page >= pagination.totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            filters.page >= pagination.totalPages 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
