import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from './axios';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'app/fetchUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  'app/updateUserProfile',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

const appSlice = createSlice({
  name: 'app',
  initialState: {
    user: null,
    theme: 'dark',
    loading: false,
    error: null,
    notifications: [],
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setTheme, addNotification, removeNotification } =
  appSlice.actions;
export default appSlice.reducer;
