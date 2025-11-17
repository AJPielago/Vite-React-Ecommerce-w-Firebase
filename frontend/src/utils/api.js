import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000, // 10 seconds
  // Enable cross-site credentials
  crossDomain: true,
  // Important for CORS
  withCredentials: true
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // Skip adding Authorization only for public auth endpoints (login/register)
    if (
      config.url.includes('/v1/auth/login') ||
      config.url.includes('/v1/auth/register')
    ) {
      return config;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // For debugging
      console.log('Adding Authorization header to request:', {
        url: config.url,
        hasToken: !!token,
        tokenStart: token ? token.substring(0, 10) + '...' : 'none',
        method: config.method
      });
    } else {
      console.warn('No token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    // Debug successful responses if needed
    if (response.config.url.includes('/auth/')) {
      console.log('Auth API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log the error for debugging
    console.error('API Error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: originalRequest?.method,
        headers: originalRequest?.headers,
        _retry: originalRequest?._retry
      }
    });
    
    // If the error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      
      // Debug log
      console.log('Received 401 Unauthorized for:', originalRequest.url, {
        hasToken: !!localStorage.getItem('token'),
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Try to refresh the token if we have a refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          console.log('Attempting to refresh token...');
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/v1/auth/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );
          
          if (data.token) {
            console.log('Token refreshed successfully');
            localStorage.setItem('token', data.token);
            originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      // Clear the invalid token
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        console.log('Redirecting to login due to 401');
        window.location.href = '/login';
      }
    }
    
    // Handle other errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Show error message to user
      if (data?.message) {
        toast.error(data.message);
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (status === 404) {
        toast.error('The requested resource was not found.');
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (status === 401) {
        toast.error('Your session has expired. Please log in again.');
      }
    } else if (error.request) {
      // Request was made but no response was received
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened while setting up the request
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry requests to auth endpoints
    if (originalRequest.url.includes('/auth/')) {
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we get a 401, clear the token and redirect to login
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle other errors
    if (error.response) {
      // Server responded with a status code outside 2xx
      const { status, data } = error.response;
      
      // Show error message to user
      if (data?.message) {
        toast.error(data.message);
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (status === 404) {
        toast.error('The requested resource was not found.');
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (status === 401) {
        toast.error('Your session has expired. Please log in again.');
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened while setting up the request
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
