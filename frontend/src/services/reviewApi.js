import api from '../utils/api';
import { getToken } from './authService';

const API_URL = '/products';

// Get all reviews for a product
export const getProductReviews = async (productId) => {
  const response = await api.get(`${API_URL}/${productId}/reviews`);
  return response.data.data;
};

// Add a review
export const addReview = async (productId, reviewData) => {
  const response = await api.post(`${API_URL}/${productId}/reviews`, reviewData);
  return response.data.data;
};

// Update a review
export const updateReview = async (reviewId, reviewData) => {
  const response = await api.put(`/reviews/${reviewId}`, reviewData);
  return response.data.data;
};

// Delete a review
export const deleteReview = async (reviewId) => {
  await api.delete(`/reviews/${reviewId}`);
};

// Get all reviews (Admin)
export const getAllReviews = async (filters = {}) => {
  const response = await api.get(`/reviews/admin`, {
    params: filters
  });
  return response.data;
};

// Update review status (Admin)
export const updateReviewStatus = async (reviewId, status) => {
  const response = await api.put(`/reviews/${reviewId}/status`, { status });
  return response.data.data;
};
