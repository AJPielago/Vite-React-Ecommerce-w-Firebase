import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const serviceApi = {
  // Get all services with pagination and search
  getServices: async (page = 1, limit = 10, search = '') => {
    const response = await api.get('/services', {
      params: { page, limit, search },
    });
    return response.data;
  },

  // Get single service by ID
  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  // Create new service
  createService: async (serviceData) => {
    const formData = new FormData();
    
    // Append service data
    Object.keys(serviceData).forEach(key => {
      if (key === 'images' && serviceData[key]) {
        // Handle file uploads
        serviceData[key].forEach((file, index) => {
          formData.append('images', file);
        });
      } else if (serviceData[key] !== undefined && serviceData[key] !== null) {
        formData.append(key, serviceData[key]);
      }
    });

    const response = await api.post('/services', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update service
  updateService: async (id, serviceData) => {
    const formData = new FormData();
    
    // Append service data
    Object.keys(serviceData).forEach(key => {
      if (key === 'images' && serviceData[key]) {
        // Handle file uploads
        serviceData[key].forEach((file, index) => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
      } else if (serviceData[key] !== undefined && serviceData[key] !== null) {
        formData.append(key, serviceData[key]);
      }
    });

    const response = await api.put(`/services/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete service
  deleteService: async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  // Bulk delete services
  bulkDeleteServices: async (ids) => {
    const response = await api.delete('/services', { data: { ids } });
    return response.data;
  },

  // Delete service image
  deleteServiceImage: async (serviceId, imageId) => {
    const response = await api.delete(`/services/${serviceId}/images/${imageId}`);
    return response.data;
  },
};

export default api;
