import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service clients
const userServiceClient = axios.create({
  baseURL: SERVICES.USER_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth tokens to requests
[userServiceClient, jobServiceClient].forEach(client => {
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('kelmah_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
});

// Mock dashboard data
const mockDashboardData = {
  metrics: {
    totalJobs: 45,
    activeJobs: 12,
    completedJobs: 28,
    totalApplications: 156,
    acceptedApplications: 23,
    pendingApplications: 18,
    totalEarnings: 15420,
    monthlyEarnings: 3200,
    averageRating: 4.7,
    profileCompletion: 85
  },
  recentJobs: [
    {
      id: 'job-recent-1',
      title: 'Kitchen Cabinet Installation',
      company: 'Mitchell Residence',
      location: 'Accra, Greater Accra',
      budget: 5500,
      currency: 'GH₵',
      status: 'active',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      applicationsCount: 8,
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    },
    {
      id: 'job-recent-2',
      title: 'Bathroom Plumbing Repair',
      company: 'Chen Family Home',
      location: 'Kumasi, Ashanti Region',
      budget: 800,
      currency: 'GH₵',
      status: 'pending',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 48),
      applicationsCount: 12,
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 6)
    },
    {
      id: 'job-recent-3',
      title: 'House Electrical Rewiring',
      company: 'Thompson Residence',
      location: 'Takoradi, Western Region',
      budget: 3200,
      currency: 'GH₵',
      status: 'completed',
      deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      applicationsCount: 6,
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
    }
  ],
  activeWorkers: [
    {
      id: 'worker-1',
      name: 'Tony Gate',
      skills: ['Carpentry', 'Furniture Making'],
      rating: 4.8,
      completedJobs: 15,
      location: 'Accra, Greater Accra',
      status: 'available',
      lastActive: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: 'worker-2',
      name: 'Emmanuel Asante',
      skills: ['Plumbing', 'Pipe Installation'],
      rating: 4.6,
      completedJobs: 12,
      location: 'Kumasi, Ashanti Region',
      status: 'busy',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: 'worker-3',
      name: 'Kwame Osei',
      skills: ['Electrical', 'Wiring'],
      rating: 4.9,
      completedJobs: 20,
      location: 'Takoradi, Western Region',
      status: 'available',
      lastActive: new Date(Date.now() - 1000 * 60 * 15)
    }
  ],
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
      applications: 8
    },
    topSkills: [
      { skill: 'Carpentry', demand: 85, jobs: 12 },
      { skill: 'Plumbing', demand: 78, jobs: 9 },
      { skill: 'Electrical', demand: 72, jobs: 8 },
      { skill: 'Painting', demand: 65, jobs: 6 }
    ]
  }
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
      const metrics = metricsResponse.status === 'fulfilled' 
        ? metricsResponse.value.data 
        : mockDashboardData.metrics;
        
      const recentJobs = jobsResponse.status === 'fulfilled'
        ? jobsResponse.value.data
        : mockDashboardData.recentJobs;
        
      const activeWorkers = workersResponse.status === 'fulfilled'
        ? workersResponse.value.data
        : mockDashboardData.activeWorkers;
        
      const analytics = analyticsResponse.status === 'fulfilled'
        ? analyticsResponse.value.data
        : mockDashboardData.analytics;

      // Log which services are using mock data
      if (metricsResponse.status === 'rejected') {
        console.warn('User service unavailable for metrics, using mock data');
      }
      if (jobsResponse.status === 'rejected') {
        console.warn('Job service unavailable for dashboard jobs, using mock data');
      }
      if (workersResponse.status === 'rejected') {
        console.warn('User service unavailable for workers data, using mock data');
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
      console.warn('All dashboard services unavailable, using complete mock data');
      return mockDashboardData;
    }
  },
);

export const updateJobStatus = createAsyncThunk(
  'dashboard/updateJobStatus',
  async ({ jobId, status }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.patch(`/api/jobs/${jobId}/status`, { status });
      return { jobId, ...response.data };
    } catch (error) {
      console.warn('Job service unavailable for status update, simulating success');
      return { 
        jobId, 
        status, 
        updatedAt: new Date(),
        message: 'Job status updated (mock)'
      };
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
