import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000,
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Add /api prefix to all requests
        if (!config.url.startsWith('/api')) {
            config.url = '/api' + config.url;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const response = await api.post('/auth/refresh');
                const { token } = response.data;
                
                localStorage.setItem('token', token);
                originalRequest.headers.Authorization = `Bearer ${token}`;
                
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || 'An error occurred';
        enqueueSnackbar(errorMessage, { 
            variant: 'error',
            autoHideDuration: 3000
        });

        return Promise.reject(error);
    }
);

export default api;