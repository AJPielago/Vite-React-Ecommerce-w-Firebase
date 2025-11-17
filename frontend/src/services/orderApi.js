import api from '../utils/api';

// API_URL should not include the /api prefix because VITE_API_URL may already
// include it (see .env). Keep the path relative to baseURL.
const API_URL = '/orders';

// Reuse application axios instance which sets baseURL, headers and auth tokens

// Get all orders (admin only)
export const getOrders = async (params = {}) => {
  try {
    const response = await api.get(API_URL, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch orders';
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`${API_URL}/${orderId}`);
    // Return the actual order object (backend wraps payload as { success, data })
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch order';
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (orderId, statusData) => {
  try {
    const response = await api.put(
      `${API_URL}/${orderId}/status`,
      statusData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update order status';
  }
};

// Get user's orders
export const getMyOrders = async () => {
  try {
    const response = await api.get(`${API_URL}/myorders`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch your orders';
  }
};

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const response = await api.post(API_URL, orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create order';
  }
};
