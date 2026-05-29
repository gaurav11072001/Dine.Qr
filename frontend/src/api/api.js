import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.5:5000/api';
// Provide base URL for static uploads as well
export const STATIC_BASE_URL = 'http://192.168.1.5:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT tokens into request headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dineqr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors by clearing invalid tokens and redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only redirect to login if we're on an admin/dashboard page
      const isAdminPage = window.location.pathname.includes('/dashboard') || 
                          window.location.pathname.includes('/admin');
      
      if (isAdminPage) {
        // Token is invalid or expired on admin page
        localStorage.removeItem('dineqr_token');
        localStorage.removeItem('dineqr_user');
        // Redirect to login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/restaurant/login';
        }
      }
      // For customer pages (menu, order history), just ignore 401 errors
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
