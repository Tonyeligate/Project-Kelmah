import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../../services/apiClient';
import { API_ENDPOINTS } from '../../../config/environment';

const { USER, JOB } = API_ENDPOINTS;

// Use centralized clients with auth/retries

// Initial state - properly structured to prevent undefined access
const initialState = {
  loading: false,
  error: null,
  data: {
    metrics: {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      totalEarnings: 0,
      pendingApplications: 0,
      avgRating: 0,
      profileViews: 0,
      weeklyViews: 0,
      responseRate: 85,
      completionRate: 95,
      // Changes for trending indicators
      jobsChange: 0,
      applicationsChange: 0,
      earningsChange: 0,
      viewsChange: 0,
    },
    recentJobs: [],
    activeWorkers: [],
    analytics: {
      jobsThisMonth: 0,
      applicationsThisMonth: 0,
      earningsThisMonth: 0,
      averageResponseTime: '0 hours',
      completionRate: 95,
      clientSatisfaction: 4.8,
      monthlyGrowth: {
        jobs: 0,
        earnings: 0,
        applications: 0,
      },
      topSkills: [],
    },
  },
  lastUpdated: null,
  refreshing: false,
};

// Enhanced async thunks with proper service routing and mock fallback
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check if we already have recent data to prevent unnecessary calls
      const { dashboard } = getState();
      const lastUpdated = dashboard?.lastUpdated;
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      if (lastUpdated && new Date(lastUpdated).getTime() > fiveMinutesAgo) {
        return dashboard.data; // Return cached data if recent
      }

      // Try to fetch from actual services
      const [
        metricsResponse,
        jobsResponse,
        workersResponse,
        analyticsResponse,
      ] = await Promise.allSettled([
        api.get(USER.DASHBOARD_METRICS),
        api.get(JOB.DASHBOARD),
        api.get(USER.DASHBOARD_WORKERS),
        api.get(USER.DASHBOARD_ANALYTICS),
      ]);

      // Extract successful responses or use empty defaults on failure
      const metrics =
        metricsResponse.status === 'fulfilled'
          ? metricsResponse.value.data
          : {
            ...initialState.data.metrics,
            _serviceUnavailable: true,
          };

      const recentJobs =
        jobsResponse.status === 'fulfilled'
          ? Array.isArray(jobsResponse.value.data)
            ? jobsResponse.value.data
            : Array.isArray(jobsResponse.value.data?.jobs)
              ? jobsResponse.value.data.jobs
              : []
          : [];

      const activeWorkers =
        workersResponse.status === 'fulfilled'
          ? Array.isArray(workersResponse.value.data)
            ? workersResponse.value.data
            : Array.isArray(workersResponse.value.data?.workers)
              ? workersResponse.value.data.workers
              : []
          : initialState.data.activeWorkers;

      const analytics =
        analyticsResponse.status === 'fulfilled'
          ? {
            ...analyticsResponse.value.data,
            topSkills: Array.isArray(analyticsResponse.value.data?.topSkills)
              ? analyticsResponse.value.data.topSkills
              : [],
          }
          : {
            ...initialState.data.analytics,
            _serviceUnavailable: true,
          };

      // Log which services are using mock data
      if (metricsResponse.status === 'rejected') {
        console.warn('User service unavailable for metrics, using mock data');
      }
      if (jobsResponse.status === 'rejected') {
        console.warn(
          'Job service unavailable for dashboard jobs, using mock data',
        );
      }
      if (workersResponse.status === 'rejected') {
        console.warn('User service unavailable for workers data');
      }
      if (analyticsResponse.status === 'rejected') {
        console.warn('User service unavailable for analytics, using mock data');
      }

      return {
        metrics,
        recentJobs,
        activeWorkers,
        analytics,
      };
    } catch (error) {
      console.warn(
        'All dashboard services unavailable:',
        error.message,
      );

      // Return empty state with unavailable flag instead of fake data
      return {
        metrics: {
          ...initialState.data.metrics,
          _serviceUnavailable: true,
        },
        recentJobs: [],
        activeWorkers: [],
        analytics: {
          ...initialState.data.analytics,
          _serviceUnavailable: true,
        },
      };
    }
  },
);

export const updateJobStatus = createAsyncThunk(
  'dashboard/updateJobStatus',
  async ({ jobId, status }) => {
    try {
      const response = await api.patch(`${JOB.BY_ID(jobId)}/status`, {
        status,
      });
      const payload = response.data?.data || response.data || {};
      return { jobId, status: payload.status ?? status, ...payload };
    } catch (error) {
      console.warn('Job status update unavailable:', error.message);
      throw error;
    }
  },
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedJob: (state, action) => {
      state.selectedJob = action.payload;
    },
    setSelectedWorker: (state, action) => {
      state.selectedWorker = action.payload;
    },
    setDashboardData: (state, action) => {
      // Merge payload into state.data (supports partial updates)
      if (typeof action.payload === 'object' && action.payload !== null) {
        state.data = { ...state.data, ...action.payload };
        state.lastUpdated = new Date().toISOString();
      }
    },
    setLoading: (state, action) => {
      // Accepts boolean or object map like { overview: true }
      if (typeof action.payload === 'boolean') {
        state.loading = action.payload;
      } else if (typeof action.payload === 'object') {
        state.loading = Object.values(action.payload).some(Boolean);
      }
    },
    setError: (state, action) => {
      if (typeof action.payload === 'string') {
        state.error = action.payload;
      } else if (typeof action.payload === 'object' && action.payload !== null) {
        state.error = Object.values(action.payload).find(Boolean) || null;
      }
    },
    clearDashboardError: (state) => {
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
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = { ...state.data, ...action.payload };
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update job status
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        const jobIndex = state.data.recentJobs.findIndex(
          (job) => job.id === action.payload.jobId,
        );
        if (jobIndex !== -1) {
          state.data.recentJobs[jobIndex] = {
            ...state.data.recentJobs[jobIndex],
            ...action.payload,
          };
        }
      });
  },
});

export const {
  setSelectedJob,
  setSelectedWorker,
  setDashboardData,
  setLoading,
  setError,
  clearDashboardError,
  setRefreshing,
  updateMetrics,
  resetDashboard,
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
