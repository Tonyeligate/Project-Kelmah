import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';
import { AUTH_CONFIG } from '../../../config/environment';
import { secureStorage } from '../../../utils/secureStorage';
import { normalizeUser } from '../../../utils/userUtils';
// Support import.meta.env in Vite and process.env in tests
// Use Node.js environment variables for tests
const metaEnv = process.env;

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
    if (!token) {
      return { token: null, user: null, isAuthenticated: false };
    }

    const storedUser = secureStorage.getUserData();
    const user = normalizeAuthUser(storedUser);
    if (!user) {
      return { token: null, user: null, isAuthenticated: false };
    }

    secureStorage.setUserData(user);
    return { token, user, isAuthenticated: true };
  } catch (error) {
    console.warn('Failed to resolve initial auth state:', error);
    secureStorage.clear();
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
      console.log('Login attempt with:', credentials.email);
      const response = await authService.login(credentials);

      console.log('Login response in authSlice:', response);

      // Handle different response structures - backend sends {success: true, data: {token, user}}
      const responseData = response.data || response;
      const token = responseData.token;
      const user = responseData.user || {};
      const refreshToken = responseData.refreshToken;
      const normalizedUser = normalizeAuthUser(user);

      // Make sure we have a token and user data
      if (token) {
        // Log the user data we're storing for debugging
        console.log('Storing user data with role in authSlice:', user);

        // Store token and user data securely
        secureStorage.setAuthToken(token);
        if (normalizedUser) {
          secureStorage.setUserData(normalizedUser);
        }
        if (refreshToken) {
          secureStorage.setRefreshToken(refreshToken);
        }

        // Return structured data for the reducer
        return {
          token,
          user: normalizedUser,
          refreshToken,
        };
      } else {
        console.warn(
          'No token received in login response. Response structure:',
          response,
        );
        return rejectWithValue('No authentication token received');
      }
    } catch (error) {
      console.error('Login error in thunk:', error);
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
      console.log('Verifying auth status...');

      // Development mock authentication disabled – always verify via API

      // Production mode auth verification logic - check both storage locations
      let token = secureStorage.getAuthToken();
      if (!token) {
        const refreshToken = secureStorage.getRefreshToken();
        if (refreshToken) {
          console.log('No access token found, attempting refresh...');
          const refreshResult = await authService.refreshToken();
          if (refreshResult?.token) {
            token = refreshResult.token;
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
        } else {
          console.warn('No token found in secure storage');
          throw new Error('Session expired. Please log in again.');
        }
      }

      // Check if there's user data in localStorage
      const storedUserSnapshot = secureStorage.getUserData();
      console.log('Currently stored user:', storedUserSnapshot || 'none');

      // Verify against backend
      const verify = await authService.verifyAuth();
      console.log('Auth verify response:', verify);

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

      // Update stored user data with fresh data from API
      secureStorage.setUserData(normalizedUser);
      secureStorage.setAuthToken(token);

      return {
        user: normalizedUser,
        token,
        isAuthenticated: true,
      };
    } catch (error) {
      console.error('Auth verification failed:', error);
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
        secureStorage.clear();
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
      secureStorage.clear();
      return { success: true };
    } catch (error) {
      // Regardless of API call success/failure, we remove local data
      secureStorage.clear();
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      localStorage.removeItem('user');
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
      secureStorage.clear();
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
      secureStorage.setAuthToken(token);
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
      .addCase(register.fulfilled, (state, action) => {
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
        console.log(
          'Auth verification fulfilled with user:',
          state.user?.email,
        );
      })
      .addCase(verifyAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload;
        if (action.payload?.shouldReset !== false) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
        console.log('Auth verification rejected:', state.error);
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
