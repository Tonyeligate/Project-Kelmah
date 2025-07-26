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
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../services/authSlice';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(authService.getStoredToken());
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

  // Sync with stored auth data
  useEffect(() => {
    const syncAuthState = () => {
      const storedToken = authService.getStoredToken();
      const storedUser = authService.getStoredUser();

      if (storedToken && storedUser) {
        if (!user || user.id !== storedUser.id) {
          console.log('🔄 Syncing auth state from storage');
          setUser(storedUser);
          setToken(storedToken);
        }
      } else if (!storedToken && (user || token)) {
        console.log('🔄 Clearing auth state (no stored data)');
        setUser(null);
        setToken(null);
      }
    };

    // Check immediately
    syncAuthState();

    // Setup polling interval (every 3 seconds)
    const interval = setInterval(syncAuthState, 3000);

    return () => clearInterval(interval);
  }, [user, token]);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      setError(null);

      try {
        const storedToken = authService.getStoredToken();

        if (storedToken) {
          console.log('🔐 Validating stored token...');
          
          try {
            const userData = await authService.getCurrentUser();
            console.log('✅ Token valid, user authenticated:', userData);
            
            setUser(userData);
            setToken(storedToken);
          } catch (apiError) {
            console.warn('⚠️ Token validation failed:', apiError.message);
            
            // For development: If backend is not available, use stored user data
            if (process.env.NODE_ENV === 'development') {
              const storedUser = authService.getStoredUser();
              if (storedUser) {
                console.log('🧪 Using stored user data in development mode');
                setUser(storedUser);
                setToken(storedToken);
              } else {
                throw apiError;
              }
            } else {
              throw apiError;
            }
          }
        } else {
          console.log('ℹ️ No stored token found');
        }
      } catch (err) {
        console.error('❌ Failed to initialize auth:', err);
        
        // Clear invalid authentication data
        authService.clearStorage();
        setUser(null);
        setToken(null);
        setError('Session expired. Please log in again.');
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
      console.log('🔐 Attempting login...');
      const response = await authService.login(credentials);
      
      // Handle different response structures
      const data = response.data || response;
      const tokenValue = data.token;
      const userData = data.user;

      if (!tokenValue || !userData) {
        throw new Error('Invalid response from server');
      }

      console.log('✅ Login successful:', userData);
      
      // Update state
      setToken(tokenValue);
      setUser(userData);

      return userData;
    } catch (err) {
      console.error('❌ Login error:', err);
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
      console.log('📝 Attempting registration...');
      const response = await authService.register(userData);
      console.log('✅ Registration successful');
      
      return response;
    } catch (err) {
      console.error('❌ Registration error:', err);
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log('🚪 Logging out...');
      await authService.logout();
      console.log('✅ Logout successful');
    } catch (err) {
      console.warn('⚠️ Logout API error:', err);
      // Continue with local logout even if API fails
    } finally {
      // Clear state regardless of API success
      setToken(null);
      setUser(null);
      setError(null);
      setLoading(false);
      
      // Redirect to login
      navigate('/login?reason=logged_out');
    }
  }, [navigate]);

  // Password reset request
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📧 Requesting password reset for:', email);
      const response = await authService.requestPasswordReset(email);
      console.log('✅ Password reset request successful');
      
      return response;
    } catch (err) {
      console.error('❌ Password reset request error:', err);
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
      console.log('🔑 Resetting password...');
      const response = await authService.resetPassword(token, newPassword);
      console.log('✅ Password reset successful');
      
      return response;
    } catch (err) {
      console.error('❌ Password reset error:', err);
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
      console.log('👤 Updating profile...');
      const updatedUser = await authService.updateProfile(profileData);
      
      // Update user state
      setUser(prevUser => ({ ...prevUser, ...updatedUser }));
      console.log('✅ Profile updated successfully');
      
      return updatedUser;
    } catch (err) {
      console.error('❌ Profile update error:', err);
      const errorMessage = err.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // MFA functions
  const setupMFA = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Setting up MFA...');
      const data = await authService.setupMFA();
      console.log('✅ MFA setup successful');
      
      return data;
    } catch (err) {
      console.error('❌ MFA setup error:', err);
      const errorMessage = err.message || 'Failed to setup MFA.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyMFA = useCallback(async (token) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Verifying MFA...');
      const data = await authService.verifyMFA(token);
      console.log('✅ MFA verification successful');
      
      return data;
    } catch (err) {
      console.error('❌ MFA verification error:', err);
      const errorMessage = err.message || 'Failed to verify MFA code.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const disableMFA = useCallback(async (password, mfaToken) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Disabling MFA...');
      const data = await authService.disableMFA(password, mfaToken);
      console.log('✅ MFA disabled successfully');
      
      return data;
    } catch (err) {
      console.error('❌ MFA disable error:', err);
      const errorMessage = err.message || 'Failed to disable MFA.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Utility functions
  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  const getUserRole = useCallback(() => {
    return authService.getUserRole();
  }, []);

  const hasRole = useCallback((role) => {
    return authService.hasRole(role);
  }, []);

  const getToken = useCallback(() => {
    return authService.getStoredToken();
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // State
    user,
    loading,
    error,
    isInitialized,
    token,
    
    // Functions
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    setupMFA,
    verifyMFA,
    disableMFA,
    
    // Utilities
    isAuthenticated,
    getUserRole,
    hasRole,
    getToken,
    clearError
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
