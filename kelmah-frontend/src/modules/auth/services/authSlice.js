import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';
import { AUTH_CONFIG } from '../../../config/environment';
import { secureStorage } from '../../../utils/secureStorage';
// Support import.meta.env in Vite and process.env in tests
// Use Node.js environment variables for tests
const metaEnv = process.env;

// Register thunk
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);

      // Store auth data
      if (response.token) {
        secureStorage.setAuthToken(response.token);
        secureStorage.setUserData(response.user);
      }

      return response;
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

      // Make sure we have a token and user data
      if (token) {
        // Log the user data we're storing for debugging
        console.log('Storing user data with role in authSlice:', user);

        // Store token and user data securely
        secureStorage.setAuthToken(token);
        secureStorage.setUserData(user);
        if (refreshToken) {
          secureStorage.setRefreshToken(refreshToken);
        }

        // Return structured data for the reducer
        return {
          token,
          user,
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
      const token = secureStorage.getAuthToken();
      if (!token) {
        console.warn('No token found in localStorage or secureStorage');
        throw new Error('No authentication token found');
      }

      // Check if there's user data in localStorage
      const storedUser = JSON.stringify(secureStorage.getUserData());
      console.log(
        'Currently stored user:',
        storedUser ? JSON.parse(storedUser) : 'none',
      );

      // Verify against backend
      const verify = await authService.verifyAuth();
      console.log('Auth verify response:', verify);

      if (verify?.user) {
        // Update stored user data with fresh data from API
        secureStorage.setUserData(verify.user);

        return {
          user: verify.user,
          isAuthenticated: true,
        };
      } else if (verify?.success) {
        // API returned success but no user data, use stored user
        const storedUserData = secureStorage.getUserData();
        if (storedUserData) {
          console.log('Using stored user data for verification:', storedUserData.email);
          return {
            user: storedUserData,
            isAuthenticated: true,
          };
        } else {
          console.warn('API returned success but no user data and no stored user found');
          // Don't throw error here, just return the stored user from initial state
          const initialStateUser = secureStorage.getUserData();
          if (initialStateUser) {
            return {
              user: initialStateUser,
              isAuthenticated: true,
            };
          }
        }
      }

      throw new Error('Could not verify authentication');
    } catch (error) {
      console.error('Auth verification failed:', error);
      secureStorage.clear();
      return rejectWithValue(
        error.message || 'Authentication verification failed',
      );
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
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      localStorage.removeItem('user');
      return rejectWithValue(error.message || 'Logout failed');
    }
  },
);

const initialState = {
  user: secureStorage.getUserData() || null,
  token: secureStorage.getAuthToken() || null,
  isAuthenticated: !!secureStorage.getAuthToken(),
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
      state.isAuthenticated = true;
      state.user = user;
      state.token = token;
      state.loading = false;
      state.error = null;

      // Save securely
      secureStorage.setAuthToken(token);
      secureStorage.setUserData(user);
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
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
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
      })
      .addCase(verifyAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
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
