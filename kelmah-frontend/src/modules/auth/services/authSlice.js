import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';
import { TOKEN_KEY } from '../../../config/constants';
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
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
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

        // Store token and user data in localStorage
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem('user', JSON.stringify(user));

        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
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

      // In development mode, always use mock authentication
      if (metaEnv.DEV || process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using mock authentication');
        const storedUser = localStorage.getItem('user');

        // If there's already user data in localStorage, use it
        if (storedUser) {
          console.log('Using stored user data in dev mode');
          return {
            user: JSON.parse(storedUser),
            isAuthenticated: true,
          };
        }

        // Otherwise, use the mock data from authService
        console.log('No stored user, using default dev user');
        const mockUser = await authService.getCurrentUser();
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem(TOKEN_KEY, 'dev-mode-fake-token-12345');

        return {
          user: mockUser,
          isAuthenticated: true,
        };
      }

      // Production mode auth verification logic
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.warn('No token found in localStorage');
        throw new Error('No authentication token found');
      }

      // Check if there's user data in localStorage
      const storedUser = localStorage.getItem('user');
      console.log(
        'Currently stored user:',
        storedUser ? JSON.parse(storedUser) : 'none',
      );

      try {
        const response = await authService.getCurrentUser();
        console.log('User profile data received:', response);

        if (response) {
          // Update stored user data with fresh data from API
          localStorage.setItem('user', JSON.stringify(response));

          return {
            user: response,
            isAuthenticated: true,
          };
        }
      } catch (apiError) {
        console.warn('API unreachable, using stored user data:', apiError);
        // If API is unreachable but we have stored user data, use that
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          return {
            user: userData,
            isAuthenticated: true,
          };
        }
      }

      throw new Error('Could not verify authentication');
    } catch (error) {
      console.error('Auth verification failed:', error);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('user');
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
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      // Regardless of API call success/failure, we remove local data
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('user');
      return rejectWithValue(error.message || 'Logout failed');
    }
  },
);

const initialState = {
  user: (() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  })(),
  token: localStorage.getItem(TOKEN_KEY) || null,
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('user');
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

      // Save to localStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('user', JSON.stringify(user));
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
