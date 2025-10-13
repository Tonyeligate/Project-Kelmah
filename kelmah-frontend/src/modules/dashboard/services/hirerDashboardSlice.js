import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { hirerService } from '@/modules/hirer/services/hirerService';

// Async thunk for fetching hirer dashboard data
export const fetchHirerDashboardData = createAsyncThunk(
  'hirerDashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hirerService.getDashboardData();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard data',
      );
    }
  },
);

// Async thunk for fetching hirer metrics
export const fetchHirerMetrics = createAsyncThunk(
  'hirerDashboard/fetchMetrics',
  async (timeframe = '30d', { rejectWithValue }) => {
    try {
      const response = await hirerService.getStats(timeframe);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch metrics',
      );
    }
  },
);

// Async thunk for fetching active jobs
export const fetchActiveJobs = createAsyncThunk(
  'hirerDashboard/fetchActiveJobs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hirerService.getRecentJobs();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch active jobs',
      );
    }
  },
);

// Async thunk for fetching recent applications
export const fetchRecentApplications = createAsyncThunk(
  'hirerDashboard/fetchRecentApplications',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await hirerService.getApplications({ limit });
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch applications',
      );
    }
  },
);

const initialState = {
  data: {
    metrics: null,
    activeJobs: [],
    recentApplications: [],
    notifications: [],
  },
  loading: false,
  error: null,
  lastUpdated: null,
  refreshing: false,
};

const hirerDashboardSlice = createSlice({
  name: 'hirerDashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    updateMetrics: (state, action) => {
      if (state.data.metrics) {
        state.data.metrics = { ...state.data.metrics, ...action.payload };
      }
    },
    addNotification: (state, action) => {
      state.data.notifications.unshift(action.payload);
    },
    markNotificationRead: (state, action) => {
      const notification = state.data.notifications.find(
        (n) => n.id === action.payload,
      );
      if (notification) {
        notification.read = true;
      }
    },
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchHirerDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHirerDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = { ...state.data, ...action.payload };
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchHirerDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch metrics
      .addCase(fetchHirerMetrics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHirerMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.data.metrics = action.payload;
      })
      .addCase(fetchHirerMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch active jobs
      .addCase(fetchActiveJobs.fulfilled, (state, action) => {
        state.data.activeJobs = action.payload;
      })

      // Fetch recent applications
      .addCase(fetchRecentApplications.fulfilled, (state, action) => {
        state.data.recentApplications = action.payload;
      });
  },
});

export const {
  clearError,
  setRefreshing,
  updateMetrics,
  addNotification,
  markNotificationRead,
  resetDashboard,
} = hirerDashboardSlice.actions;

export default hirerDashboardSlice.reducer;
