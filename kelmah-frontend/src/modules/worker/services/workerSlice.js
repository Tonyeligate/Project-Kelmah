import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../../services/apiClient';

// Async thunks for worker operations
export const fetchWorkerProfile = createAsyncThunk(
  'worker/fetchProfile',
  async (workerId, { rejectWithValue }) => {
    try {
      // Use user-service worker endpoint
      const response = await api.get(`/api/users/workers/${workerId}`);
      return (
        response.data?.data?.worker || response.data?.data || response.data
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch worker profile',
      );
    }
  },
);

export const updateWorkerProfile = createAsyncThunk(
  'worker/updateProfile',
  async ({ workerId, profileData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/users/workers/${workerId}`,
        profileData,
      );
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update worker profile',
      );
    }
  },
);

export const fetchWorkerSkills = createAsyncThunk(
  'worker/fetchSkills',
  async (workerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/users/workers/${workerId}/skills`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch worker skills',
      );
    }
  },
);

export const updateWorkerSkills = createAsyncThunk(
  'worker/updateSkills',
  async ({ workerId, skills }, { rejectWithValue }) => {
    try {
      // Bulk update not supported; client should call add/update individually
      const response = await api.get(`/api/users/workers/${workerId}/skills`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update worker skills',
      );
    }
  },
);

export const fetchWorkerJobs = createAsyncThunk(
  'worker/fetchJobs',
  async (status = 'active', { rejectWithValue }) => {
    try {
      const response = await api.get('/jobs/assigned', {
        params: { status },
      });
      const payload = response.data?.data || response.data;
      const jobs = Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload)
          ? payload
          : [];
      return { status, jobs };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch worker jobs',
      );
    }
  },
);

export const fetchWorkerApplications = createAsyncThunk(
  'worker/fetchApplications',
  async (status = 'pending', { rejectWithValue }) => {
    try {
      const response = await api.get('/jobs/applications/me', {
        params: { status },
      });
      const apps = response.data?.data || response.data || [];
      return { status, applications: Array.isArray(apps) ? apps : [] };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch worker applications',
      );
    }
  },
);

export const submitWorkerApplication = createAsyncThunk(
  'worker/submitApplication',
  async ({ jobId, applicationData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/jobs/${jobId}/apply`,
        applicationData,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit application',
      );
    }
  },
);

export const fetchWorkerEarnings = createAsyncThunk(
  'worker/fetchEarnings',
  async ({ workerId, period = 'month' }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/users/workers/${workerId}/earnings?period=${period}`,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch worker earnings',
      );
    }
  },
);

export const updateWorkerAvailability = createAsyncThunk(
  'worker/updateAvailability',
  async ({ workerId, availabilityData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/users/workers/${workerId}/availability`,
        availabilityData,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update availability',
      );
    }
  },
);

// Worker slice definition
const workerSlice = createSlice({
  name: 'worker',
  initialState: {
    profile: null,
    skills: [],
    jobs: {
      active: [],
      completed: [],
      available: [],
    },
    applications: {
      pending: [],
      accepted: [],
      rejected: [],
    },
    portfolio: [],
    earnings: {
      totalEarned: 0,
      pendingPayments: 0,
      recentTransactions: [],
      monthlyData: [],
    },
    availability: {
      schedule: {},
      preferences: {},
    },
    loading: {
      profile: false,
      skills: false,
      jobs: false,
      applications: false,
      earnings: false,
      availability: false,
    },
    error: {
      profile: null,
      skills: null,
      jobs: null,
      applications: null,
      earnings: null,
      availability: null,
    },
  },
  reducers: {
    clearWorkerErrors: (state) => {
      state.error = {
        profile: null,
        skills: null,
        jobs: null,
        applications: null,
        earnings: null,
        availability: null,
      };
    },
    addPortfolioItem: (state, action) => {
      state.portfolio.push(action.payload);
    },
    removePortfolioItem: (state, action) => {
      state.portfolio = state.portfolio.filter(
        (item) => item.id !== action.payload,
      );
    },
    updatePortfolioItem: (state, action) => {
      const index = state.portfolio.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index !== -1) {
        state.portfolio[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Profile
      .addCase(fetchWorkerProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(fetchWorkerProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload;
      })
      .addCase(fetchWorkerProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = action.payload;
      })
      .addCase(updateWorkerProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(updateWorkerProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload;
      })
      .addCase(updateWorkerProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = action.payload;
      })

      // Skills
      .addCase(fetchWorkerSkills.pending, (state) => {
        state.loading.skills = true;
        state.error.skills = null;
      })
      .addCase(fetchWorkerSkills.fulfilled, (state, action) => {
        state.loading.skills = false;
        state.skills = action.payload;
      })
      .addCase(fetchWorkerSkills.rejected, (state, action) => {
        state.loading.skills = false;
        state.error.skills = action.payload;
      })
      .addCase(updateWorkerSkills.fulfilled, (state, action) => {
        state.skills = action.payload;
      })

      // Jobs
      .addCase(fetchWorkerJobs.pending, (state) => {
        state.loading.jobs = true;
        state.error.jobs = null;
      })
      .addCase(fetchWorkerJobs.fulfilled, (state, action) => {
        state.loading.jobs = false;
        const { jobs, status } = action.payload;
        state.jobs[status] = jobs;
      })
      .addCase(fetchWorkerJobs.rejected, (state, action) => {
        state.loading.jobs = false;
        state.error.jobs = action.payload;
      })

      // Applications
      .addCase(fetchWorkerApplications.pending, (state) => {
        state.loading.applications = true;
        state.error.applications = null;
      })
      .addCase(fetchWorkerApplications.fulfilled, (state, action) => {
        state.loading.applications = false;
        const { applications, status } = action.payload;
        state.applications[status] = applications;
      })
      .addCase(fetchWorkerApplications.rejected, (state, action) => {
        state.loading.applications = false;
        state.error.applications = action.payload;
      })
      .addCase(submitWorkerApplication.fulfilled, (state, action) => {
        state.applications.pending.push(action.payload);
      })

      // Earnings
      .addCase(fetchWorkerEarnings.pending, (state) => {
        state.loading.earnings = true;
        state.error.earnings = null;
      })
      .addCase(fetchWorkerEarnings.fulfilled, (state, action) => {
        state.loading.earnings = false;
        state.earnings = action.payload;
      })
      .addCase(fetchWorkerEarnings.rejected, (state, action) => {
        state.loading.earnings = false;
        state.error.earnings = action.payload;
      })

      // Availability
      .addCase(updateWorkerAvailability.pending, (state) => {
        state.loading.availability = true;
        state.error.availability = null;
      })
      .addCase(updateWorkerAvailability.fulfilled, (state, action) => {
        state.loading.availability = false;
        state.availability = action.payload;
      })
      .addCase(updateWorkerAvailability.rejected, (state, action) => {
        state.loading.availability = false;
        state.error.availability = action.payload;
      });
  },
});

// Selectors
export const selectWorkerProfile = (state) => state.worker.profile;
export const selectWorkerSkills = (state) => state.worker.skills;
export const selectWorkerJobs = (status) => (state) =>
  state.worker.jobs[status];
export const selectWorkerApplications = (status) => (state) =>
  state.worker.applications[status];
export const selectWorkerEarnings = (state) => state.worker.earnings;
export const selectWorkerAvailability = (state) => state.worker.availability;
export const selectWorkerPortfolio = (state) => state.worker.portfolio;
export const selectWorkerLoading = (key) => (state) =>
  state.worker.loading[key];
export const selectWorkerError = (key) => (state) => state.worker.error[key];

export const {
  clearWorkerErrors,
  addPortfolioItem,
  removePortfolioItem,
  updatePortfolioItem,
} = workerSlice.actions;

export default workerSlice.reducer;
