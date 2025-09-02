/**
 * Custom hook for robust authentication checking
 * Provides standardized auth state checking across all components
 */

import { useMemo } from 'react';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../modules/auth/contexts/AuthContext';
import { useSelector } from 'react-redux';

export const useAuthCheck = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const isInitialized = true; // Redux auth is always initialized

  // Robust authentication state checking with error handling
  const isUserAuthenticated = useMemo(() => {
    try {
      if (!isAuthenticated || typeof isAuthenticated !== 'function') {
        return false;
      }
      return isAuthenticated();
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }, [isAuthenticated]);

  // Enhanced user data extraction
  const userData = useMemo(() => {
    if (!user) return null;
    
    return {
      id: user.id || user._id,
      email: user.email,
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ')[1] || '',
      fullName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.name || user.email || 'User',
      role: user.role || user.userType || user.userRole || 'user',
      profileImage: user.profileImage || user.avatar,
      isVerified: user.isVerified || false,
      isOnline: true // Default to online, will be updated by real-time status
    };
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