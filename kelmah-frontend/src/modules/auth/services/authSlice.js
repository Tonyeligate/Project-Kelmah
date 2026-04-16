import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';
import { AUTH_CONFIG } from '../../../config/environment';
import { secureStorage } from '../../../utils/secureStorage';
import { normalizeUser } from '../../../utils/userUtils';
import {
  createFeatureLogger,
  devError,
  devWarn,
} from '@/modules/common/utils/devLogger';
// Support import.meta.env in Vite and process.env in tests
// Use Node.js environment variables for tests
const devLog = createFeatureLogger({ flagName: 'VITE_DEBUG_AUTH' });

const normalizeAuthUser = (user) => {
  if (!user) {
    return null;
  }

  if (user.__isNormalized) {
    return user;
  }

  return normalizeUser(user._raw || user);
};

const resolveInitialAuthState = () => {
  try {
    const token = secureStorage.getAuthToken();
    const storedUser = secureStorage.getUserData();
    const normalizedStoredUser = normalizeAuthUser(storedUser);

    if (AUTH_CONFIG.httpOnlyCookieAuth) {
      return {
        token: token || null,
        user: normalizedStoredUser,
        isAuthenticated: Boolean(token || normalizedStoredUser),
      };
    }

    if (!token) {
      return { token: null, user: null, isAuthenticated: false };
    }

    const user = normalizedStoredUser;
    if (!user) {
      return { token: null, user: null, isAuthenticated: false };
    }

    secureStorage.setUserData(user);
    return { token, user, isAuthenticated: true };
  } catch (error) {
    devWarn('Failed to resolve initial auth state:', error);
    secureStorage.clearAuthData();
    return { token: null, user: null, isAuthenticated: false };
  }
};

const initialResolvedState = resolveInitialAuthState();

// Register thunk
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      const normalizedUser = normalizeAuthUser(response.user);

      return {
        ...response,
        user: normalizedUser,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue(errorMessage);
    }
  },
);

// Login thunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // authService.login() already stores token/refreshToken/user in secureStorage
      // and sets up automatic token refresh. We only extract what the reducer needs.
      const response = await authService.login(credentials);

      const responseData = response.data || response;
      const token = responseData.token;
      const user = responseData.user || {};
      const refreshToken = responseData.refreshToken;
      const normalizedUser = normalizeAuthUser(user);

      const canUseCookieSessionWithoutToken = AUTH_CONFIG.httpOnlyCookieAuth;

      if (token || canUseCookieSessionWithoutToken) {
        // Return structured data for the reducer - storage is handled by authService.login()
        return {
          token: token || null,
          user: normalizedUser,
          refreshToken: refreshToken || null,
        };
      } else {
        devWarn(
          'No token received in login response. Response structure:',
          response,
        );
        return rejectWithValue('No authentication token received');
      }
    } catch (error) {
      devError('Login error in thunk:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  },
);

// Verify auth status thunk
export const verifyAuth = createAsyncThunk(
  'auth/verify',
  async (_, { rejectWithValue }) => {
    try {
      devLog('Verifying auth status...');

      // Development mock authentication disabled - always verify via API

      // Production mode auth verification logic - cookie and token aware
      let token = secureStorage.getAuthToken();

      // Check if there's user data in secure storage
      const storedUserSnapshot = secureStorage.getUserData();
      const storedRefreshToken = secureStorage.getRefreshToken();
      devLog('Currently stored user:', storedUserSnapshot || 'none');

      // Always attempt backend verification first to support cookie sessions.
      let verify = await authService.verifyAuth();
      devLog('Auth verify response:', verify);

      const hasSessionHint = Boolean(
        token || storedUserSnapshot || storedRefreshToken,
      );
      const shouldAttemptCookieRefresh = AUTH_CONFIG.httpOnlyCookieAuth;

      if (verify?.success === false && !verify?.user && !token) {
        if (!hasSessionHint && !shouldAttemptCookieRefresh) {
          return rejectWithValue({
            message: null,
            shouldReset: true,
            silent: true,
          });
        }

        devLog('No local access token available, attempting refresh...');
        const refreshResult = await authService.refreshToken();
        const canContinueWithCookieSession =
          AUTH_CONFIG.httpOnlyCookieAuth && refreshResult?.success;

        if (refreshResult?.token || canContinueWithCookieSession) {
          token = refreshResult?.token || null;
          verify = await authService.verifyAuth();
        } else {
          const refreshError = new Error(
            refreshResult?.error || 'Session expired. Please log in again.',
          );
          refreshError.shouldReset =
            refreshResult?.shouldReset !== undefined
              ? refreshResult.shouldReset
              : true;
          refreshError.isNetworkError = refreshResult?.isNetworkError;
          throw refreshError;
        }
      }

      if (verify?.success === false && !verify?.user) {
        throw new Error(
          verify?.error ||
            'Authentication verification failed. Please log in again.',
        );
      }

      const fallbackUser = storedUserSnapshot || secureStorage.getUserData();
      const resolvedUser = verify?.user || fallbackUser;
      const normalizedUser = normalizeAuthUser(resolvedUser);
      if (!normalizedUser) {
        throw new Error('Unable to load your account details.');
      }

      if (!token) {
        try {
          const refreshResult = await authService.refreshToken({
            suppressUnauthorizedReset: true,
          });
          if (refreshResult?.token) {
            token = refreshResult.token;
          }
        } catch {
          // Cookie-backed sessions may remain valid even when token hydration fails.
        }
      }

      // Update stored user data with fresh data from API
      secureStorage.setUserData(normalizedUser);
      if (token) {
        secureStorage.setAuthToken(token);
      }

      return {
        user: normalizedUser,
        token: token || null,
        isAuthenticated: true,
      };
    } catch (error) {
      devError('Auth verification failed:', error);
      const message = error?.message || 'Authentication verification failed';
      const isNetworkError =
        typeof error?.isNetworkError === 'boolean'
          ? error.isNetworkError
          : /network/i.test(message) || /timeout/i.test(message);
      const shouldReset =
        typeof error?.shouldReset === 'boolean'
          ? error.shouldReset
          : !isNetworkError;

      if (shouldReset) {
        secureStorage.clearAuthData();
      }

      return rejectWithValue({
        message,
        shouldReset,
      });
    }
  },
);

// Logout thunk
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      secureStorage.clearAuthData();
      return { success: true };
    } catch (error) {
      // Regardless of API call success/failure, we remove local data
      secureStorage.clearAuthData();
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      localStorage.removeItem('user');
      // Clear cached personal/payment data on logout (shared device safety)
      localStorage.removeItem('worker_search_cache');
      localStorage.removeItem('savedMomoNumbers');
      return rejectWithValue(error.message || 'Logout failed');
    }
  },
);

const initialState = {
  user: initialResolvedState.user,
  token: initialResolvedState.token,
  isAuthenticated: initialResolvedState.isAuthenticated,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      secureStorage.clearAuthData();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setOAuthLogin: (state, action) => {
      const { user, token } = action.payload;
      const normalizedUser = normalizeAuthUser(user);
      state.isAuthenticated = true;
      state.user = normalizedUser;
      state.token = token;
      state.loading = false;
      state.error = null;

      // Save securely
      if (AUTH_CONFIG.storeTokensClientSide) {
        secureStorage.setAuthToken(token);
      } else {
        secureStorage.removeItem('auth_token');
      }
      if (normalizedUser) {
        secureStorage.setUserData(normalizedUser);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        // Registration flow redirects to login; keep user unauthenticated
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Verify auth cases
      .addCase(verifyAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
        // CRITICAL: Don't clear user data during verification to prevent route protection failures
        // Keep existing authentication state during verification
      })
      .addCase(verifyAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        // CRITICAL: Ensure user data is never set to undefined
        state.user = action.payload.user || state.user;
        state.token = action.payload.token || state.token;
        state.loading = false;
        state.error = null;
        devLog('Auth verification fulfilled with user:', state.user?.email);
      })
      .addCase(verifyAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.silent
          ? null
          : action.payload?.message || action.payload;
        if (action.payload?.shouldReset !== false) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
        devLog('Auth verification rejected:', state.error);
      })
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthToken = (state) => state.auth.token;

// Export actions
export const { logout, clearError, setError, setOAuthLogin } =
  authSlice.actions;

// Export reducer
export default authSlice.reducer;
