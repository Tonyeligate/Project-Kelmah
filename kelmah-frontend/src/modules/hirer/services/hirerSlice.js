import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../common/services/axios';

// Async thunks for hirer operations
export const fetchHirerProfile = createAsyncThunk(
  'hirer/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/hirer/profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hirer profile');
    }
  }
);

export const updateHirerProfile = createAsyncThunk(
  'hirer/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/api/hirer/profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update hirer profile');
    }
  }
);

export const fetchHirerJobs = createAsyncThunk(
  'hirer/fetchJobs',
  async (status = 'active', { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/hirer/jobs?status=${status}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hirer jobs');
    }
  }
);

export const createHirerJob = createAsyncThunk(
  'hirer/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/hirer/jobs', jobData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create job');
    }
  }
);

export const updateHirerJob = createAsyncThunk(
  'hirer/updateJob',
  async ({ jobId, jobData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/hirer/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update job');
    }
  }
);

export const updateJobStatus = createAsyncThunk(
  'hirer/updateJobStatus',
  async ({ jobId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/hirer/jobs/${jobId}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update job status');
    }
  }
);

export const deleteHirerJob = createAsyncThunk(
  'hirer/deleteJob',
  async (jobId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/hirer/jobs/${jobId}`);
      return jobId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete job');
    }
  }
);

export const deleteJob = deleteHirerJob;

export const fetchJobApplications = createAsyncThunk(
  'hirer/fetchApplications',
  async ({ jobId, status = 'pending' }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/hirer/jobs/${jobId}/applications?status=${status}`);
      return { jobId, applications: response.data, status };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch applications');
    }
  }
);

export const updateApplicationStatus = createAsyncThunk(
  'hirer/updateApplicationStatus',
  async ({ jobId, applicationId, status, feedback }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/hirer/jobs/${jobId}/applications/${applicationId}`, { 
        status, 
        feedback 
      });
      return { jobId, applicationId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update application status');
    }
  }
);

export const searchWorkers = createAsyncThunk(
  'hirer/searchWorkers',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/hirer/workers/search', { params: searchParams });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search workers');
    }
  }
);

export const fetchSavedWorkers = createAsyncThunk(
  'hirer/fetchSavedWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/hirer/saved-workers');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch saved workers');
    }
  }
);

export const saveWorker = createAsyncThunk(
  'hirer/saveWorker',
  async (workerId, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/hirer/saved-workers', { workerId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save worker');
    }
  }
);

export const unsaveWorker = createAsyncThunk(
  'hirer/unsaveWorker',
  async (workerId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/hirer/saved-workers/${workerId}`);
      return workerId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove saved worker');
    }
  }
);

export const releasePayment = createAsyncThunk(
  'hirer/releasePayment',
  async ({ jobId, milestoneId, amount }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/hirer/jobs/${jobId}/milestones/${milestoneId}/payment`, {
        amount
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to release payment');
    }
  }
);

export const createReview = createAsyncThunk(
  'hirer/createReview',
  async ({ workerId, jobId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/hirer/workers/${workerId}/reviews`, {
        jobId,
        ...reviewData
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create review');
    }
  }
);

// Hirer slice definition
const hirerSlice = createSlice({
  name: 'hirer',
  initialState: {
    profile: null,
    jobs: {
      active: [],
      draft: [],
      completed: [],
      cancelled: []
    },
    applications: {},
    searchResults: {
      workers: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
      }
    },
    savedWorkers: [],
    payments: {
      pending: [],
      completed: [],
      total: 0
    },
    reviews: [],
    loading: {
      profile: false,
      jobs: false,
      applications: false,
      workers: false,
      payments: false,
      reviews: false
    },
    error: {
      profile: null,
      jobs: null,
      applications: null,
      workers: null,
      payments: null,
      reviews: null
    }
  },
  reducers: {
    clearHirerErrors: (state) => {
      state.error = {
        profile: null,
        jobs: null,
        applications: null,
        workers: null,
        payments: null,
        reviews: null
      };
    },
    updateSearchParams: (state, action) => {
      state.searchParams = {
        ...state.searchParams,
        ...action.payload
      };
    },
    setApplicationsPage: (state, action) => {
      if (state.applications[action.payload.jobId]) {
        state.applications[action.payload.jobId].pagination.currentPage = action.payload.page;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Profile
      .addCase(fetchHirerProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(fetchHirerProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload;
      })
      .addCase(fetchHirerProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = action.payload;
      })
      .addCase(updateHirerProfile.pending, (state) => {
        state.loading.profile = true;
      })
      .addCase(updateHirerProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload;
      })
      .addCase(updateHirerProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = action.payload;
      })
      
      // Jobs
      .addCase(fetchHirerJobs.pending, (state) => {
        state.loading.jobs = true;
        state.error.jobs = null;
      })
      .addCase(fetchHirerJobs.fulfilled, (state, action) => {
        state.loading.jobs = false;
        const { jobs, status } = action.payload;
        state.jobs[status] = jobs;
      })
      .addCase(fetchHirerJobs.rejected, (state, action) => {
        state.loading.jobs = false;
        state.error.jobs = action.payload;
      })
      .addCase(createHirerJob.fulfilled, (state, action) => {
        if (action.payload.status === 'draft') {
          state.jobs.draft.unshift(action.payload);
        } else {
          state.jobs.active.unshift(action.payload);
        }
      })
      .addCase(updateHirerJob.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        
        // Remove from all status categories
        Object.keys(state.jobs).forEach(statusKey => {
          state.jobs[statusKey] = state.jobs[statusKey].filter(job => job.id !== id);
        });
        
        // Add to the appropriate category
        state.jobs[status].unshift(action.payload);
      })
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        const { jobId, status } = action.payload;
        
        // Remove from all status categories
        Object.keys(state.jobs).forEach(statusKey => {
          state.jobs[statusKey] = state.jobs[statusKey].filter(job => job.id !== jobId);
        });
        
        // Add to the new status category
        state.jobs[status].unshift(action.payload);
      })
      .addCase(deleteHirerJob.fulfilled, (state, action) => {
        const jobId = action.payload;
        
        // Remove from all status categories
        Object.keys(state.jobs).forEach(statusKey => {
          state.jobs[statusKey] = state.jobs[statusKey].filter(job => job.id !== jobId);
        });
      })
      
      // Applications
      .addCase(fetchJobApplications.pending, (state) => {
        state.loading.applications = true;
        state.error.applications = null;
      })
      .addCase(fetchJobApplications.fulfilled, (state, action) => {
        state.loading.applications = false;
        const { jobId, applications, status } = action.payload;
        
        if (!state.applications[jobId]) {
          state.applications[jobId] = {
            pending: [],
            accepted: [],
            rejected: [],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0
            }
          };
        }
        
        state.applications[jobId][status] = applications;
      })
      .addCase(fetchJobApplications.rejected, (state, action) => {
        state.loading.applications = false;
        state.error.applications = action.payload;
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const { jobId, applicationId, status, oldStatus } = action.payload;
        
        if (state.applications[jobId]) {
          // Remove application from old status array
          state.applications[jobId][oldStatus] = state.applications[jobId][oldStatus].filter(
            application => application.id !== applicationId
          );
          
          // Add application to new status array
          state.applications[jobId][status].push(action.payload);
        }
      })
      
      // Workers search
      .addCase(searchWorkers.pending, (state) => {
        state.loading.workers = true;
        state.error.workers = null;
      })
      .addCase(searchWorkers.fulfilled, (state, action) => {
        state.loading.workers = false;
        state.searchResults = action.payload;
      })
      .addCase(searchWorkers.rejected, (state, action) => {
        state.loading.workers = false;
        state.error.workers = action.payload;
      })
      
      // Saved workers
      .addCase(fetchSavedWorkers.fulfilled, (state, action) => {
        state.savedWorkers = action.payload;
      })
      .addCase(saveWorker.fulfilled, (state, action) => {
        state.savedWorkers.push(action.payload);
      })
      .addCase(unsaveWorker.fulfilled, (state, action) => {
        state.savedWorkers = state.savedWorkers.filter(worker => worker.id !== action.payload);
      })
      
      // Payments
      .addCase(releasePayment.pending, (state) => {
        state.loading.payments = true;
        state.error.payments = null;
      })
      .addCase(releasePayment.fulfilled, (state, action) => {
        state.loading.payments = false;
        state.payments.completed.push(action.payload);
        
        // Update pending payments
        state.payments.pending = state.payments.pending.filter(
          payment => payment.milestoneId !== action.payload.milestoneId
        );
        
        // Update job if applicable
        const { jobId } = action.payload;
        if (state.jobs.active) {
          const jobIndex = state.jobs.active.findIndex(job => job.id === jobId);
          if (jobIndex !== -1) {
            state.jobs.active[jobIndex].paidAmount = action.payload.totalPaid;
          }
        }
      })
      .addCase(releasePayment.rejected, (state, action) => {
        state.loading.payments = false;
        state.error.payments = action.payload;
      })
      
      // Reviews
      .addCase(createReview.pending, (state) => {
        state.loading.reviews = true;
        state.error.reviews = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading.reviews = false;
        state.reviews.push(action.payload);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading.reviews = false;
        state.error.reviews = action.payload;
      });
  }
});

// Selectors
export const selectHirerProfile = (state) => state.hirer.profile;
export const selectHirerJobs = (status) => (state) => state.hirer.jobs[status];
export const selectJobApplications = (jobId, status) => (state) => 
  state.hirer.applications[jobId]?.[status] || [];
export const selectSearchResults = (state) => state.hirer.searchResults;
export const selectSavedWorkers = (state) => state.hirer.savedWorkers;
export const selectPayments = (status) => (state) => state.hirer.payments[status];
export const selectHirerLoading = (key) => (state) => state.hirer.loading[key];
export const selectHirerError = (key) => (state) => state.hirer.error[key];

export const { 
  clearHirerErrors, 
  updateSearchParams, 
  setApplicationsPage 
} = hirerSlice.actions;

export default hirerSlice.reducer; 
