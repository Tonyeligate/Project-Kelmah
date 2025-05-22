import axios from 'axios';
import { API_BASE_URL, JWT_LOCAL_STORAGE_KEY, JWT_REFRESH_KEY, AUTH_USER_KEY } from '../config/config';

// Direct auth service URL for testing
const AUTH_SERVICE_URL = 'http://localhost:5002';

/**
 * Authentication service for handling auth-related operations
 */
class AuthService {
    /**
     * Login user with email and password
     * @param {Object} credentials - User login credentials
     * @param {string} credentials.email - User email
     * @param {string} credentials.password - User password
     * @returns {Promise<Object>} User data and tokens
     */
    async login(credentials) {
        try {
            // Try direct connection to auth service first (for debugging)
            let response;
            try {
                console.log('Trying direct connection to auth service...');
                response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, credentials);
            } catch (directError) {
                console.log('Direct connection failed, falling back to API gateway');
                response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
            }
            
            console.log('Full login response:', response);

            // Check for different response structures
            let userData, token, refreshToken;
            
            if (response.data.token) {
                // Direct structure
                token = response.data.token;
                refreshToken = response.data.refreshToken;
                userData = response.data.user;
            } else if (response.data.data && response.data.data.token) {
                // Nested data structure 
                token = response.data.data.token;
                refreshToken = response.data.data.refreshToken;
                userData = response.data.data.user;
            } else if (response.data.status === 'success' && response.data.data) {
                // Success with data but different structure
                token = response.data.data.token || response.data.data.accessToken;
                refreshToken = response.data.data.refreshToken;
                userData = response.data.data.user || response.data.data.userData;
            }
            
            if (token) {
                console.log('Storing token and user data', token, userData);
                this.setAuthToken(token);
                
                if (refreshToken) {
                    this.setRefreshToken(refreshToken);
                }
                
                if (userData) {
                    // Ensure role is present and handled correctly
                    if (!userData.role && userData.userType) {
                        userData.role = userData.userType;
                    }
                    
                    console.log('Setting user data with role:', userData.role);
                    this.setUserData(userData);
                } else {
                    console.warn('No user data received in login response');
                }
                
                return { token, user: userData, refreshToken };
            } else {
                console.error('No token found in login response', response.data);
                throw new Error('No authentication token received');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} User data
     */
    register(userData) {
        return axios.post(`${API_BASE_URL}/auth/register`, userData);
    }
    
    /**
     * Logout the current user
     */
    logout() {
        localStorage.removeItem(JWT_LOCAL_STORAGE_KEY);
        localStorage.removeItem(JWT_REFRESH_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        
        // Optional: Call logout endpoint if needed
        // return axios.post(`${API_BASE_URL}/auth/logout`);
    }
    
    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        const token = this.getAuthToken();
        return !!token;
    }
    
    /**
     * Get the current JWT auth token
     * @returns {string|null} JWT token or null
     */
    getAuthToken() {
        return localStorage.getItem(JWT_LOCAL_STORAGE_KEY);
    }
    
    /**
     * Set the JWT auth token
     * @param {string} token - JWT token
     */
    setAuthToken(token) {
        localStorage.setItem(JWT_LOCAL_STORAGE_KEY, token);
    }
    
    /**
     * Get the refresh token
     * @returns {string|null} Refresh token or null
     */
    getRefreshToken() {
        return localStorage.getItem(JWT_REFRESH_KEY);
    }
    
    /**
     * Set the refresh token
     * @param {string} token - Refresh token
     */
    setRefreshToken(token) {
        localStorage.setItem(JWT_REFRESH_KEY, token);
    }
    
    /**
     * Get user data from local storage
     * @returns {Object|null} User data or null
     */
    getUserData() {
        const userData = localStorage.getItem(AUTH_USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }
    
    /**
     * Set user data in local storage
     * @param {Object} user - User data
     */
    setUserData(user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
    
    /**
     * Refresh the JWT token
     * @returns {Promise<Object>} New tokens
     */
    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken
            });
            
            if (response.data.token) {
                this.setAuthToken(response.data.token);
                
                if (response.data.refreshToken) {
                    this.setRefreshToken(response.data.refreshToken);
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            throw error;
        }
    }
    
    /**
     * Request password reset
     * @param {string} email - User email
     * @returns {Promise<Object>} Response data
     */
    requestPasswordReset(email) {
        return axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    }
    
    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} password - New password
     * @returns {Promise<Object>} Response data
     */
    resetPassword(token, password) {
        return axios.post(`${API_BASE_URL}/auth/reset-password`, {
            token,
            password
        });
    }
    
    /**
     * Verify email address
     * @param {string} token - Verification token
     * @returns {Promise<Object>} Response data
     */
    verifyEmail(token) {
        return axios.post(`${API_BASE_URL}/auth/verify-email`, { token });
    }
    
    /**
     * Verify authentication status
     * @returns {Promise<Object>} User data
     */
    async verifyAuth() {
        const token = this.getAuthToken();
        
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        try {
            console.log('Verifying auth token...');
            
            // Try direct connection to auth service first (for debugging)
            let response;
            try {
                console.log('Trying direct connection to auth service for verification...');
                response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    withCredentials: true
                });
            } catch (directError) {
                console.log('Direct connection failed, falling back to API gateway for verification');
                response = await axios.get(`${API_BASE_URL}/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    withCredentials: true
                });
            }
            
            console.log('Verification response:', response.data);
            
            // If we get a valid response, update the stored user data
            if (response.data && response.data.user) {
                console.log('Auth verified, user data:', response.data.user);
                
                // Make sure role is correctly set in the user data
                const userData = response.data.user;
                
                // Ensure role exists and is properly extracted
                if (!userData.role && userData.userType) {
                    userData.role = userData.userType;
                }
                
                console.log('Storing verified user data with role:', userData.role);
                this.setUserData(userData);
                
                return { 
                    user: userData,
                    success: true 
                };
            } else if (response.data && response.data.success) {
                // Alternative structure - success flag directly in response
                const storedUser = this.getUserData();
                return { 
                    user: storedUser,
                    success: true 
                };
            }
            
            // Fallback to currently stored user data
            return { user: this.getUserData() };
        } catch (error) {
            console.error('Auth verification failed:', error);
            
            // Clear invalid auth data
            this.logout();
            throw error;
        }
    }
}

const authService = new AuthService();

// Export individual functions for easier usage
export const getAuthToken = () => authService.getAuthToken();
export const isAuthenticated = () => authService.isAuthenticated();
export const getUserData = () => authService.getUserData();
export const logout = () => authService.logout();

// Export the service instance as default
export default authService; 