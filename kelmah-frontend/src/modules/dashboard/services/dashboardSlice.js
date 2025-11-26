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

      // Extract successful responses or use enhanced mock data
      const metrics =
        metricsResponse.status === 'fulfilled'
          ? metricsResponse.value.data
          : {
            ...initialState.data.metrics,
            totalJobs: Math.floor(Math.random() * 50) + 10,
            activeJobs: Math.floor(Math.random() * 15) + 3,
            completedJobs: Math.floor(Math.random() * 35) + 5,
            totalEarnings: Math.floor(Math.random() * 5000) + 1000,
            profileViews: Math.floor(Math.random() * 200) + 50,
            weeklyViews: Math.floor(Math.random() * 50) + 10,
            jobsChange: Math.floor(Math.random() * 20) - 5,
            applicationsChange: Math.floor(Math.random() * 30) - 10,
            earningsChange: Math.floor(Math.random() * 25) + 5,
            viewsChange: Math.floor(Math.random() * 15) + 2,
          };

      const recentJobs =
        jobsResponse.status === 'fulfilled'
          ? Array.isArray(jobsResponse.value.data)
            ? jobsResponse.value.data
            : Array.isArray(jobsResponse.value.data?.jobs)
              ? jobsResponse.value.data.jobs
              : []
          : [
            {
              id: 1,
              title: 'Web Development Project',
              location: 'Accra, Ghana',
              budget: 2500,
              status: 'Active',
            },
            {
              id: 2,
              title: 'Mobile App Design',
              location: 'Kumasi, Ghana',
              budget: 1800,
              status: 'Pending',
            },
            {
              id: 3,
              title: 'Content Writing',
              location: 'Takoradi, Ghana',
              budget: 800,
              status: 'Active',
            },
          ];

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
              : ['Web Development', 'Mobile Apps', 'Design', 'Writing'],
          }
          : {
            ...initialState.data.analytics,
            jobsThisMonth: Math.floor(Math.random() * 20) + 5,
            applicationsThisMonth: Math.floor(Math.random() * 80) + 20,
            earningsThisMonth: Math.floor(Math.random() * 3000) + 500,
            averageResponseTime: '2 hours',
            completionRate: 95,
            clientSatisfaction: 4.8,
            monthlyGrowth: {
              jobs: Math.floor(Math.random() * 15) + 5,
              earnings: Math.floor(Math.random() * 25) + 10,
              applications: Math.floor(Math.random() * 20) + 8,
            },
            topSkills: [
              'Web Development',
              'Mobile Apps',
              'Design',
              'Writing',
            ],
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
        'All dashboard services unavailable, using mock data:',
        error.message,
      );

      // Return comprehensive mock data as fallback
      return {
        metrics: {
          ...initialState.data.metrics,
          totalJobs: 25,
          activeJobs: 8,
          completedJobs: 15,
          totalEarnings: 3200,
          profileViews: 156,
          weeklyViews: 24,
          jobsChange: 12,
          applicationsChange: 18,
          earningsChange: 15,
          viewsChange: 8,
        },
        recentJobs: [
          {
            id: 1,
            title: 'Web Development Project',
            location: 'Accra, Ghana',
            budget: 2500,
            status: 'Active',
          },
          {
            id: 2,
            title: 'Mobile App Design',
            location: 'Kumasi, Ghana',
            budget: 1800,
            status: 'Pending',
          },
        ],
        activeWorkers: [],
        analytics: {
          ...initialState.data.analytics,
          jobsThisMonth: 12,
          applicationsThisMonth: 45,
          earningsThisMonth: 1800,
          completionRate: 95,
          clientSatisfaction: 4.8,
          monthlyGrowth: {
            jobs: 15,
            earnings: 22,
            applications: 12,
          },
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
  clearDashboardError,
  setRefreshing,
  updateMetrics,
  resetDashboard,
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
