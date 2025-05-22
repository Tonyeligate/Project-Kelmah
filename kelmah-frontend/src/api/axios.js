import axios from 'axios';

const isDevelopment = import.meta.env.MODE === 'development';
const API_BASE_URL = isDevelopment 
    ? 'http://localhost:8080'
    : import.meta.env.VITE_API_URL;

// Create a production-ready axios instance with reasonable defaults
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout as a reasonable default
    withCredentials: true // This enables sending cookies with requests
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Skip auth for health checks and certain endpoints if specified
        if (config.skipAuthRefresh) {
            return config;
        }
        
        // Get token from localStorage using consistent key
        const token = localStorage.getItem('token');
        if (token) {
            // Add token to headers
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Adding auth token to request:', config.url);
        } else {
            console.log('No auth token available for request:', config.url);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Completely silent handling for health checks
        if (error.config?.url.includes('/api/health')) {
            // Return empty successful response for health checks to prevent console errors
            return Promise.resolve({ status: 503, data: { message: 'API unreachable' } });
        }
        
        // Skip other error handling if specifically requested in the config
        if (error.config?.skipErrorHandling) {
            return Promise.reject(error);
        }

        const originalRequest = error.config;

        // If unauthorized and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token
                const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    withCredentials: true
                });

                const { token } = refreshResponse.data;
                localStorage.setItem('token', token);

                // Retry original request with new token
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return axios(originalRequest);
            } catch (refreshError) {
                // Logout user if refresh fails
                localStorage.removeItem('token');
                
                // Only redirect if it's not an API health check
                if (!originalRequest.url.includes('/api/health')) {
                    window.location.href = '/login';
                }
                
                return Promise.reject(refreshError);
            }
        }

        // Check for offline/network errors and handle gracefully
        if (!error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED')) {
            // Don't log if it's a health check to reduce console noise
            if (!originalRequest.url.includes('/api/health')) {
                console.warn('Network error - API may be offline');
            }
            // We'll let the calling code handle this based on their needs
        }

        return Promise.reject(error);
    }
);

export default api;