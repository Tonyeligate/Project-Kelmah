import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../common/services/axios';
import { API_BASE_URL, TOKEN_KEY } from '../../../config/constants';
import authService from '../services/authService';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../services/authSlice';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const reduxAuth = useSelector(selectIsAuthenticated);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  // Attempt to get navigate function; fallback to no-op if outside a Router
  let navigate = () => {};
  try {
    navigate = useNavigate();
  } catch (e) {
    // No Router context, navigation no-op
  }

  // Clear context state when Redux logs out
  useEffect(() => {
    if (!reduxAuth) {
      setUser(null);
      setToken(null);
    }
  }, [reduxAuth]);

  // Set axios authorization header
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] =
        `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check for authentication status periodically
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        if (!user) {
          console.log(
            '[AuthContext] User found in storage but not in state, restoring',
          );
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } else if (!storedToken && user) {
        console.log(
          '[AuthContext] No token in storage but user in state, clearing',
        );
        setUser(null);
        setToken(null);
      }
    };

    // Check immediately
    checkAuthStatus();

    // Setup a polling interval (every 3 seconds)
    const interval = setInterval(checkAuthStatus, 3000);

    // Cleanup
    return () => clearInterval(interval);
  }, [user]);

  // Initialize authentication state from local storage
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);

        if (storedToken) {
          // Try to validate token on the server
          try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
            setToken(storedToken);
          } catch (apiError) {
            console.error('API error while validating token:', apiError);

            // For development: If backend is not available, use stored user data
            // In production this would be more secure, but for development it helps
            if (process.env.NODE_ENV === 'development') {
              const storedUser = JSON.parse(
                localStorage.getItem('user') || 'null',
              );
              if (storedUser) {
                console.log('Using stored user data in development mode');
                setUser(storedUser);
                setToken(storedToken);
              } else {
                throw apiError; // Rethrow if no stored user
              }
            } else {
              throw apiError;
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        // If token validation fails, clear authentication
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);
      console.log('Login response in context:', response);

      // Handle different response structures
      const tokenValue = response.token || response.data?.token;
      const userData = response.user || response.data?.user;

      if (!tokenValue) {
        throw new Error('No token received from server');
      }

      // Store token and user in localStorage
      localStorage.setItem(TOKEN_KEY, tokenValue);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update state
      setToken(tokenValue);
      setUser(userData);

      console.log('Login successful. User:', userData);
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
          'Login failed. Please check your credentials.',
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(userData);
      return response;
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.',
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (token) {
        try {
          await authService.logout();
        } catch (err) {
          console.warn('Logout API error:', err);
          // Continue with local logout even if API fails
        }
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('user');
      // Update state
      setToken(null);
      setUser(null);
      // Redirect to login
      navigate('/login');
    }
  }, [token, navigate]);

  // Password reset request
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.requestPasswordReset(email);
      return response;
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to request password reset. Please try again.',
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password with token
  const resetPassword = useCallback(async (token, newPassword) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.resetPassword(token, newPassword);
      return response;
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to reset password. Please try again.',
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser((prevUser) => ({ ...prevUser, ...updatedUser }));
      return updatedUser;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to update profile. Please try again.',
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup two-factor authentication
  const mfaSetup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.mfaSetup();
      return data;
    } catch (err) {
      console.error('MFA setup error:', err);
      setError(err.response?.data?.message || 'Failed to setup MFA.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify two-factor authentication code
  const verifyTwoFactor = useCallback(async (token) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.verifyTwoFactor(token);
      return data;
    } catch (err) {
      console.error('MFA verify error:', err);
      setError(err.response?.data?.message || 'Failed to verify MFA code.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Disable two-factor authentication
  const disableMfa = useCallback(async (password, token) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.disableMfa({ password, token });
      return data;
    } catch (err) {
      console.error('MFA disable error:', err);
      setError(err.response?.data?.message || 'Failed to disable MFA.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    // Check both context state and localStorage
    const contextAuth = !!token && !!user;
    const storageAuth =
      !!localStorage.getItem(TOKEN_KEY) && !!localStorage.getItem('user');

    return contextAuth || storageAuth;
  }, [token, user]);

  // Get user role
  const getUserRole = useCallback(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          return parsedUser.role || parsedUser.userType || parsedUser.userRole;
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      return null;
    }

    return user.role || user.userType || user.userRole;
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback(
    (role) => {
      const userRole = getUserRole();
      return userRole === role;
    },
    [getUserRole],
  );

  const value = {
    user,
    loading,
    error,
    isInitialized,
    isAuthenticated,
    getToken: useCallback(() => token, [token]),
    hasRole,
    getUserRole,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    mfaSetup,
    verifyTwoFactor,
    disableMfa,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// PropTypes validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Auth Context Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
