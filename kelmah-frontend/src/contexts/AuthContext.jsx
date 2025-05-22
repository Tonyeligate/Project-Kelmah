import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  login as loginAction, 
  register as registerAction, 
  logout as logoutAction,
  verifyAuth,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError
} from '../store/slices/authSlice';
import PropTypes from 'prop-types';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  
  // Get auth state from Redux
  const user = useSelector(selectCurrentUser);
  const isAuthenticatedRedux = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = localStorage.getItem('token');
    if (token && !isAuthenticatedRedux) {
      dispatch(verifyAuth());
    }
  }, [dispatch]);

  // Login method using Redux action
  const login = async (credentials) => {
    try {
      const resultAction = await dispatch(loginAction(credentials));
      return resultAction.payload;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Register method using Redux action
  const register = async (userData) => {
    try {
      const resultAction = await dispatch(registerAction(userData));
      return resultAction.payload;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  // Logout method using Redux action
  const logout = async () => {
    try {
      await dispatch(logoutAction());
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return isAuthenticatedRedux;
  };

  // Get current user data
  const getCurrentUser = () => {
    return user;
  };
  
  // Context value
  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    getCurrentUser,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// PropTypes validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
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