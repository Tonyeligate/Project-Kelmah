import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import authService from '../services/authService';
import {
  login as loginThunk,
  register as registerThunk,
  verifyAuth as verifyAuthThunk,
  logoutUser,
} from '../services/authSlice';
import { secureStorage } from '../../../utils/secureStorage';

const roleMatches = (userRole, requestedRole) => {
  if (!requestedRole || !userRole) return false;
  if (Array.isArray(requestedRole)) {
    return requestedRole.includes(userRole);
  }
  if (typeof requestedRole === 'string') {
    return userRole === requestedRole;
  }
  return false;
};

const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, loading, error, isAuthenticated } = useSelector(
    (state) => state.auth,
  );

  const resolvedToken = useMemo(
    () => token || secureStorage.getAuthToken(),
    [token],
  );

  const login = useCallback(
    (credentials) => dispatch(loginThunk(credentials)).unwrap(),
    [dispatch],
  );

  const register = useCallback(
    (payload) => dispatch(registerThunk(payload)).unwrap(),
    [dispatch],
  );

  const verifyAuth = useCallback(
    () => dispatch(verifyAuthThunk()),
    [dispatch],
  );

  const logout = useCallback(() => dispatch(logoutUser()), [dispatch]);

  const requestPasswordReset = useCallback((email) => {
    return authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback((resetToken, newPassword) => {
    return authService.resetPassword(resetToken, newPassword);
  }, []);

  const updateProfile = useCallback((profileData) => {
    return authService.updateProfile(profileData);
  }, []);

  const setupMFA = useCallback(() => authService.setupMFA(), []);

  const verifyMFA = useCallback((code) => authService.verifyMFA(code), []);

  const disableMFA = useCallback(
    (password, code) => authService.disableMFA(password, code),
    [],
  );

  const hasRole = useCallback(
    (requiredRole) => roleMatches(user?.role, requiredRole),
    [user?.role],
  );

  const getToken = useCallback(() => resolvedToken, [resolvedToken]);

  return {
    user,
    token: resolvedToken,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    verifyAuth,
    logout,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    setupMFA,
    verifyMFA,
    disableMFA,
    hasRole,
    getToken,
  };
};

export { useAuth };
export default useAuth;
