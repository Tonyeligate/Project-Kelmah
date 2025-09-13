/**
 * Custom hook for robust authentication checking
 * Provides standardized auth state checking across all components
 * FIXED: Uses centralized user normalization utility for consistent user data structure
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { normalizeUser } from '../utils/userUtils';

export const useAuthCheck = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const isInitialized = true; // Redux auth is always initialized

  // Robust authentication state checking with error handling
  const isUserAuthenticated = useMemo(() => {
    try {
      // Redux auth state: isAuthenticated is a boolean, not a function
      return Boolean(isAuthenticated);
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }, [isAuthenticated]);

  // Enhanced user data extraction using standardized normalization
  const userData = useMemo(() => {
    return normalizeUser(user);
  }, [user]);

  // Auth state summary
  const authState = useMemo(() => ({
    isAuthenticated: isUserAuthenticated,
    isInitialized,
    isLoading: loading,
    hasUser: !!userData,
    user: userData,
    
    // Convenience flags
    canShowUserFeatures: isInitialized && isUserAuthenticated && userData,
    shouldShowAuthButtons: isInitialized && !isUserAuthenticated,
    isReady: isInitialized && !loading
  }), [isUserAuthenticated, isInitialized, loading, userData]);

  return authState;
};