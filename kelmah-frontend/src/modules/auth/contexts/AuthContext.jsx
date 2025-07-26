import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { AUTH_CONFIG } from '../../../config/environment';
import PropTypes from 'prop-types';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Check if user is already authenticated
        if (authService.isAuthenticated()) {
          try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (apiError) {
            console.error('Failed to get current user:', apiError);

            // If API fails but we have stored user data, use it (development mode)
            const storedUser = authService.getStoredUser();
              if (storedUser) {
              console.log('Using stored user data');
                setUser(storedUser);
            } else {
              // Clear invalid authentication
              authService.clearStorage();
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        authService.clearStorage();
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

      // Get user data from response
      const userData = response.data?.user || response.user;

      if (userData) {
      setUser(userData);
      console.log('Login successful. User:', userData);
      return userData;
      } else {
        throw new Error('No user data received from login');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
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
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
        try {
          await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local state
      setUser(null);
      setError(null);
      
      // Redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // Password reset request
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.requestPasswordReset(email);
      return response;
    } catch (err) {
      console.error('Password reset request error:', err);
      const errorMessage = err.message || 'Failed to request password reset. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
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
      const errorMessage = err.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
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
      const errorMessage = err.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup two-factor authentication
  const setupMFA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.setupMFA();
      return data;
    } catch (err) {
      console.error('MFA setup error:', err);
      const errorMessage = err.message || 'Failed to setup MFA.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify two-factor authentication code
  const verifyMFA = useCallback(async (token) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.verifyMFA(token);
      return data;
    } catch (err) {
      console.error('MFA verify error:', err);
      const errorMessage = err.message || 'Failed to verify MFA code.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Disable two-factor authentication
  const disableMFA = useCallback(async (password, token) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.disableMFA(password, token);
      return data;
    } catch (err) {
      console.error('MFA disable error:', err);
      const errorMessage = err.message || 'Failed to disable MFA.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  // Get user role
  const getUserRole = useCallback(() => {
    return authService.getUserRole();
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return authService.hasRole(role);
  }, []);

  // Get stored token
  const getToken = useCallback(() => {
    return authService.getStoredToken();
  }, []);

  // Context value
  const value = {
    user,
    loading,
    error,
    isInitialized,
    isAuthenticated,
    getToken,
    hasRole,
    getUserRole,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    setupMFA,
    verifyMFA,
    disableMFA,
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
