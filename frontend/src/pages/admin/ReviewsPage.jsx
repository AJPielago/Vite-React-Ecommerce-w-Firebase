import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StarIcon } from '@heroicons/react/20/solid';
import { getAllReviews, updateReviewStatus, deleteReview } from '../../services/reviewApi';
import { toast } from 'react-toastify';

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  // Fetch all reviews with filters
  const { data: reviews = [], isLoading, error } = useQuery({
    queryKey: ['adminReviews', filters],
    queryFn: () => getAllReviews(filters)
  });

  // Update review status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ reviewId, status }) => updateReviewStatus(reviewId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      toast.success('Review status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update review status');
    }
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      toast.success('Review deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete review');
    }
  });

  // Handle status filter change
  const handleStatusChange = (e) => {
    setFilters(prev => ({
      ...prev,
      status: e.target.value
    }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  // Handle status update
  const handleUpdateStatus = (reviewId, status) => {
    updateStatusMutation.mutate({ reviewId, status });
  };

  // Handle review deletion
  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      deleteMutation.mutate(reviewId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
        <p>Error loading reviews: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Product Reviews</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and moderate customer reviews
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            id="status"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={filters.status}
            onChange={handleStatusChange}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Search by product name or user..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      User
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Rating
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-3 py-4 text-sm text-gray-500 text-center">
                        No reviews found
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => (
                      <tr key={review._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={review.product?.images?.[0] || '/placeholder-product.png'}
                                alt={review.product?.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900 line-clamp-1">
                                {review.product?.name || 'Product not found'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="text-gray-900">{review.user?.name || 'Unknown User'}</div>
                          <div className="text-gray-500">{review.user?.email || ''}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                className={`h-5 w-5 ${
                                  star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <select
                            value={review.status}
                            onChange={(e) => handleUpdateStatus(review._id, e.target.value)}
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              review.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : review.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            } border-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                            disabled={updateStatusMutation.isPending}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
