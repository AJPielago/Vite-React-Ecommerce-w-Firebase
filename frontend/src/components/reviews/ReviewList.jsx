import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/20/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductReviews, deleteReview } from '../../services/reviewApi';
import { getMyOrders } from '../../services/orderApi';
import { useAuth } from '../../context/AuthContext';
import ReviewForm from './ReviewForm';

export default function ReviewList({ productId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // Fetch reviews for the product
  const { 
    data: reviews = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getProductReviews(productId),
    enabled: !!productId
  });

  // Fetch user's orders to check if they are allowed to review
  const { data: myOrdersRaw } = useQuery({
    queryKey: ['myOrders'],
    queryFn: getMyOrders,
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });

  // Normalize the query result: API returns { success, data } so prefer .data when present
  const myOrders = myOrdersRaw?.data || myOrdersRaw || [];

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
  });

  // Check if current user has already reviewed the product
  const userReview = reviews.find(review => review.user._id === user?._id);
  
  // Handle review submission success
  const handleReviewSuccess = () => {
    setShowForm(false);
    setEditingReview(null);
    queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
  };

  // Handle review edit
  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowForm(true);
  };

  // Handle review delete
  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      await deleteMutation.mutateAsync(reviewId);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
        Error loading reviews: {error.message}
      </div>
    );
  }

  // Determine if the user can write a review: must have an order that contains this product and be delivered
  const hasPurchasedAndDelivered = Array.isArray(myOrders) && myOrders.some(o => 
    o.orderItems?.some(item => String(item.product) === String(productId)) && (o.isDelivered || o.status === 'delivered')
  );

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        
        {user && !userReview && hasPurchasedAndDelivered && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {(showForm || editingReview) && (
        <div className="mb-8">
          <ReviewForm
            productId={productId}
            review={editingReview}
            onSuccess={handleReviewSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingReview(null);
            }}
          />
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          {!user && (
            <p className="mt-2 text-sm text-gray-500">
              <a href="/login" className="text-blue-600 hover:underline">Sign in</a> to leave a review.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {review.user.name}
                  </h4>
                  <div className="flex items-center mt-1">
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
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Edit/Delete buttons */}
                {(user?._id === review.user._id || user?.role === 'admin') && (
                  <div className="flex space-x-2">
                    {user?._id === review.user._id && (
                      <button
                        onClick={() => handleEditReview(review)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                    {user?._id === review.user._id && (
                      <span className="text-gray-300">|</span>
                    )}
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="text-sm text-red-600 hover:text-red-800"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
              
              <p className="mt-2 text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
