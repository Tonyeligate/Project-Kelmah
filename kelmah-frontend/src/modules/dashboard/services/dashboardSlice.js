import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service clients
const userServiceClient = axios.create({
  baseURL: SERVICES.USER_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth tokens to requests
[],
  activeWorkers: [],
  analytics: {
    jobsThisMonth: 8,
    applicationsThisMonth: 25,
    earningsThisMonth: 3200,
    averageResponseTime: '2.5 hours',
    completionRate: 94,
    clientSatisfaction: 4.7,
    monthlyGrowth: {
      jobs: 15,
      earnings: 12,
      applications: 8,
    },
    topSkills: [
      { skill: 'Carpentry', demand: 85, jobs: 12 },
      { skill: 'Plumbing', demand: 78, jobs: 9 },
      { skill: 'Electrical', demand: 72, jobs: 8 },
      { skill: 'Painting', demand: 65, jobs: 6 },
    ],
  },
};

// Enhanced async thunks with proper service routing and mock fallback
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      // Try to fetch from actual services
      const [
        metricsResponse,
        jobsResponse,
        workersResponse,
        analyticsResponse,
      ] = await Promise.allSettled([
        userServiceClient.get('/api/users/dashboard/metrics'),
        jobServiceClient.get('/api/jobs/dashboard'),
        userServiceClient.get('/api/users/dashboard/workers'),
        userServiceClient.get('/api/users/dashboard/analytics'),
      ]);

      // Extract successful responses or use mock data
      const metrics =
        metricsResponse.status === 'fulfilled'
          ? metricsResponse.value.data
          : mockDashboardData.metrics;

      const recentJobs =
        jobsResponse.status === 'fulfilled'
          ? jobsResponse.value.data
          : mockDashboardData.recentJobs;

      const activeWorkers =
        workersResponse.status === 'fulfilled'
          ? workersResponse.value.data
          : mockDashboardData.activeWorkers;

      const analytics =
        analyticsResponse.status === 'fulfilled'
          ? analyticsResponse.value.data
          : mockDashboardData.analytics;

      // Log which services are using mock data
      if (metricsResponse.status === 'rejected') {
        console.warn(User service unavailable for metrics, service unavailable);
      }
      if (jobsResponse.status === 'rejected') {
        console.warn(Job service unavailable for dashboard jobs, service unavailable,
        );
      }
      if (workersResponse.status === 'rejected') {
        console.warn(User service unavailable for workers data, service unavailable,
        );
      }
      if (analyticsResponse.status === 'rejected') {
        console.warn(User service unavailable for analytics, service unavailable);
      }

      return {
        metrics,
        recentJobs,
        activeWorkers,
        analytics,
      };
    } catch (error) {
      console.warn(
        'All dashboard services unavailable, using complete mock data',
      );
      return mockDashboardData;
    }
  },
);

export const updateJobStatus = createAsyncThunk(
  'dashboard/updateJobStatus',
  async ({ jobId, status }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.patch(
        `/api/jobs/${jobId}/status`,
        { status },
      );
      return { jobId, ...response.data };
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    data: {
      metrics: {},
      recentJobs: [],
      activeWorkers: [],
      analytics: {},
    },
    loading: false,
    error: null,
    selectedJob: null,
    selectedWorker: null,
  },
  reducers: {
    setSelectedJob: (state, action) => {
      state.selectedJob = action.payload;
    },
    setSelectedWorker: (state, action) => {
      state.selectedWorker = action.payload;
    },
    clearDashboardError: (state) => {
      state.error = null;
    },
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
        state.data = action.payload;
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

export const { setSelectedJob, setSelectedWorker, clearDashboardError } =
  dashboardSlice.actions;
export default dashboardSlice.reducer;
