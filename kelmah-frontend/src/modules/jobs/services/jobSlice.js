import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import jobsApi from './jobsService';

// Async thunks
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params, { rejectWithValue }) => {
    try {
      return await jobsApi.getJobs(params);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (id, { rejectWithValue }) => {
    try {
      return await jobsApi.getJobById(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      return await jobsApi.createJob(jobData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const applyForJob = createAsyncThunk(
  'jobs/applyForJob',
  async ({ jobId, applicationData }, { rejectWithValue }) => {
    try {
      return await jobsApi.applyForJob(jobId, applicationData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    currentJob: null,
    applications: [],
    loading: false,
    error: null,
    totalPages: 0,
    currentPage: 1,
    filters: {
      search: '',
      profession: '',
      job_type: '',
      min_budget: '',
      max_budget: '',
      status: 'open',
      sort: '',
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      if (Object.prototype.hasOwnProperty.call(action.payload, 'page')) {
        state.currentPage = action.payload.page;
      } else {
        state.currentPage = 1;
      }
    },
    clearJobError: (state) => {
      state.error = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setJobs: (state, action) => {
      state.jobs = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        // Normalize response: payload may be direct array or object with jobs + totalPages
        if (Array.isArray(action.payload)) {
          state.jobs = action.payload;
          state.totalPages = 1;
        } else {
          state.jobs = action.payload.jobs || [];
          state.totalPages = action.payload.totalPages || 1;
        }
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Single Job
      .addCase(fetchJobById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs.unshift(action.payload);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Apply for Job
      .addCase(applyForJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyForJob.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(applyForJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectJobs = (state) => state.jobs.jobs;
export const selectCurrentJob = (state) => state.jobs.currentJob;
export const selectJobsLoading = (state) => state.jobs.loading;
export const selectJobsError = (state) => state.jobs.error;
export const selectJobFilters = (state) => state.jobs.filters;
export const selectJobsPagination = createSelector(
  [(state) => state.jobs.currentPage, (state) => state.jobs.totalPages],
  (currentPage, totalPages) => ({
    currentPage,
    totalPages,
  }),
);

export const {
  setFilters,
  clearJobError,
  setCurrentPage,
  setJobs,
  setLoading,
  setError,
} = jobSlice.actions;
export default jobSlice.reducer;
