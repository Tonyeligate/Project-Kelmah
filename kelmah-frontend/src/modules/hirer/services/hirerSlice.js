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

// Mock hirer data
const mockHirerData = {
  profile: {
    id: 'hirer-001',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@example.com',
    phone: '+233 24 567 8901',
    company: 'Mitchell Construction Ltd',
    location: 'Accra, Greater Accra',
    bio: 'We are a leading construction company specializing in residential and commercial projects. We value quality workmanship and reliable partnerships with skilled professionals.',
    avatar: '/api/placeholder/150/150',
    rating: 4.8,
    reviewsCount: 28,
    totalJobsPosted: 45,
    totalAmountSpent: 125000,
    currency: 'GH₵',
    verified: true,
    joinedAt: new Date('2021-08-15'),
    lastActive: new Date(),
    companySize: '10-50 employees',
    industry: 'Construction',
    website: 'https://mitchellconstruction.gh'
  },

  jobs: {
    active: [
      {
        id: 'job-h1',
        title: 'Kitchen Renovation - Custom Cabinets',
        description: 'Looking for an experienced carpenter to build custom kitchen cabinets. The project involves measuring, designing, and installing high-quality wooden cabinets with modern hardware.',
        category: 'Carpentry',
        location: 'Accra, Greater Accra',
        budget: 5500,
        currency: 'GH₵',
        type: 'fixed-price',
        status: 'active',
        urgency: 'normal',
        featured: true,
        tags: ['Carpentry', 'Kitchen', 'Custom Work'],
        requirements: [
          'Minimum 5 years carpentry experience',
          'Portfolio of kitchen cabinet work',
          'Own tools and equipment',
          'Available for 3-4 weeks project duration'
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        applicationsCount: 12,
        viewsCount: 67,
        applications: [
          {
            id: 'app-h1',
            workerId: '7a1f417c-e2e2-4210-9824-08d5fac336ac',
            workerName: 'Tony Gate',
            workerRating: 4.8,
            proposedRate: 5200,
            coverLetter: 'I am very interested in this kitchen cabinet project...',
            status: 'pending',
            appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
          }
        ]
      },
      {
        id: 'job-h2',
        title: 'Office Interior Design & Setup',
        description: 'Complete office interior design and furniture setup for a new branch office. Includes space planning, furniture selection, and installation.',
        category: 'Interior Design',
        location: 'Tema, Greater Accra',
        budget: 15000,
        currency: 'GH₵',
        type: 'fixed-price',
        status: 'active',
        urgency: 'high',
        featured: false,
        tags: ['Interior Design', 'Office Setup', 'Furniture'],
        requirements: [
          'Interior design certification',
          'Experience with office spaces',
          'Ability to work with suppliers',
          'Project management skills'
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
        applicationsCount: 8,
        viewsCount: 45,
        applications: []
      }
    ],

    completed: [
      {
        id: 'job-h3',
        title: 'Residential Plumbing Installation',
        description: 'Complete plumbing installation for a new 3-bedroom house including bathroom fixtures, kitchen plumbing, and water heating system.',
        category: 'Plumbing',
        location: 'Accra, Greater Accra',
        budget: 8500,
        currency: 'GH₵',
        type: 'fixed-price',
        status: 'completed',
        urgency: 'normal',
        featured: false,
        tags: ['Plumbing', 'Installation', 'Residential'],
        requirements: [
          'Licensed plumber',
          'Experience with residential projects',
          'Quality materials and workmanship',
          'Warranty on work performed'
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        applicationsCount: 15,
        viewsCount: 89,
        finalPayment: 8500,
        workerRating: 5,
        workerReview: 'Excellent work! Professional, timely, and high-quality installation.',
        assignedWorker: {
          id: 'worker-p1',
          name: 'Emmanuel Asante',
          rating: 4.9,
          completedJobs: 32
        }
      }
    ],

    draft: [
      {
        id: 'job-h4',
        title: 'Garden Landscaping Project',
        description: 'Design and implement landscaping for residential garden including plant selection, hardscaping, and irrigation system.',
        category: 'Landscaping',
        location: 'East Legon, Accra',
        budget: 12000,
        currency: 'GH₵',
        type: 'fixed-price',
        status: 'draft',
        urgency: 'normal',
        featured: false,
        tags: ['Landscaping', 'Garden Design', 'Irrigation'],
        requirements: [
          'Landscaping experience',
          'Knowledge of local plants',
          'Irrigation system expertise',
          'Portfolio of previous work'
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
        deadline: null,
        applicationsCount: 0,
        viewsCount: 0
      }
    ]
  },

  analytics: {
    totalJobsPosted: 45,
    activeJobs: 2,
    completedJobs: 38,
    draftJobs: 5,
    totalApplicationsReceived: 284,
    averageApplicationsPerJob: 6.3,
    totalAmountSpent: 125000,
    averageJobValue: 3289,
    successfulHires: 38,
    hireSuccessRate: 84,
    averageTimeToHire: '5.2 days',
    workerRetentionRate: 72,
    averageWorkerRating: 4.7,
    monthlySpending: {
      current: 23500,
      previous: 18200,
      growth: 29
    },
    topCategories: [
      { category: 'Carpentry', jobs: 12, spending: 35000 },
      { category: 'Plumbing', jobs: 8, spending: 28000 },
      { category: 'Electrical', jobs: 6, spending: 22000 },
      { category: 'Painting', jobs: 5, spending: 15000 }
    ]
  }
};

// Async thunks for hirer operations with mock fallbacks
export const fetchHirerProfile = createAsyncThunk(
  'hirer/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userServiceClient.get('/api/users/me/profile');
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for hirer profile, using mock data:', error.message);
      return {
        success: true,
        data: { hirer: mockHirerData.profile }
      };
    }
  },
);

export const updateHirerProfile = createAsyncThunk(
  'hirer/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userServiceClient.put('/api/users/me/profile', profileData);
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for profile update, simulating success:', error.message);
      return {
        success: true,
        data: { hirer: { ...mockHirerData.profile, ...profileData, updatedAt: new Date() } },
        message: 'Profile updated successfully (mock)'
      };
    }
  },
);

export const fetchHirerJobs = createAsyncThunk(
  'hirer/fetchJobs',
  async (status = 'active', { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.get('/api/jobs/my-jobs', { 
        params: { status, role: 'hirer' } 
      });
      return { status, jobs: response.data };
    } catch (error) {
      console.warn(`Job service unavailable for hirer jobs (${status}), using mock data:`, error.message);
      
      const jobs = mockHirerData.jobs[status] || [];
      return { status, jobs };
    }
  },
);

export const createHirerJob = createAsyncThunk(
  'hirer/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.post('/api/jobs', jobData);
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for job creation, simulating success:', error.message);
      
      const newJob = {
        id: `job-${Date.now()}`,
        ...jobData,
        status: jobData.status || 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        applicationsCount: 0,
        viewsCount: 0
      };
      
      return {
        success: true,
        data: { job: newJob },
        message: 'Job created successfully (mock)'
      };
    }
  },
);

export const updateHirerJob = createAsyncThunk(
  'hirer/updateJob',
  async ({ jobId, jobData }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.put(`/api/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for job update, simulating success:', error.message);
      
      return {
        success: true,
        data: { job: { id: jobId, ...jobData, updatedAt: new Date() } },
        message: 'Job updated successfully (mock)'
      };
    }
  },
);

export const updateJobStatus = createAsyncThunk(
  'hirer/updateJobStatus',
  async ({ jobId, status }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.patch(`/api/jobs/${jobId}/status`, { status });
      return { jobId, status, ...response.data };
    } catch (error) {
      console.warn('Job service unavailable for status update, simulating success:', error.message);
      
      return {
        jobId,
        status,
        updatedAt: new Date(),
        message: 'Job status updated successfully (mock)'
      };
    }
  },
);

export const deleteHirerJob = createAsyncThunk(
  'hirer/deleteJob',
  async (jobId, { rejectWithValue }) => {
    try {
      await jobServiceClient.delete(`/api/jobs/${jobId}`);
      return { jobId };
    } catch (error) {
      console.warn('Job service unavailable for job deletion, simulating success:', error.message);
      
      return { 
        jobId,
        message: 'Job deleted successfully (mock)'
      };
    }
  },
);

export const fetchJobApplications = createAsyncThunk(
  'hirer/fetchJobApplications',
  async ({ jobId, status = 'pending' }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.get(`/api/jobs/${jobId}/applications`, {
        params: { status }
      });
      return { jobId, status, applications: response.data };
    } catch (error) {
      console.warn(`Job service unavailable for applications (${jobId}), using mock data:`, error.message);
      
      // Find mock job and return its applications
      const allJobs = [...mockHirerData.jobs.active, ...mockHirerData.jobs.completed];
      const job = allJobs.find(j => j.id === jobId);
      const applications = job?.applications || [];
      
      return { jobId, status, applications };
    }
  },
);

export const updateApplicationStatus = createAsyncThunk(
  'hirer/updateApplicationStatus',
  async ({ jobId, applicationId, status }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.put(
        `/api/jobs/${jobId}/applications/${applicationId}`,
        { status }
      );
      return { jobId, applicationId, status, ...response.data };
    } catch (error) {
      console.warn('Job service unavailable for application status update, simulating success:', error.message);
      
      return {
        jobId,
        applicationId,
        status,
        updatedAt: new Date(),
        message: 'Application status updated successfully (mock)'
      };
    }
  },
);

export const searchWorkers = createAsyncThunk(
  'hirer/searchWorkers',
  async (searchParams, { rejectWithValue }) => {
    try {
      // Mock search for now, as no dedicated worker service is available
      const mockWorkers = [
        { id: 'worker-w1', name: 'John Doe', rating: 4.5, experience: '5 years', hourlyRate: 50 },
        { id: 'worker-w2', name: 'Jane Smith', rating: 4.9, experience: '3 years', hourlyRate: 60 },
        { id: 'worker-w3', name: 'Peter Jones', rating: 4.2, experience: '2 years', hourlyRate: 45 },
      ];
      return { workers: mockWorkers, pagination: { currentPage: 1, totalPages: 1, totalItems: 3 } };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to search workers',
      );
    }
  },
);

export const fetchSavedWorkers = createAsyncThunk(
  'hirer/fetchSavedWorkers',
  async (_, { rejectWithValue }) => {
    try {
      // Mock saved workers for now
      const mockSavedWorkers = [
        { id: 'worker-s1', name: 'Alice Brown', rating: 4.8, experience: '4 years' },
        { id: 'worker-s2', name: 'Bob Green', rating: 4.9, experience: '6 years' },
      ];
      return mockSavedWorkers;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch saved workers',
      );
    }
  },
);

export const saveWorker = createAsyncThunk(
  'hirer/saveWorker',
  async (workerId, { rejectWithValue }) => {
    try {
      // Mock save worker for now
      return { workerId, message: 'Worker saved successfully (mock)' };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to save worker',
      );
    }
  },
);

export const unsaveWorker = createAsyncThunk(
  'hirer/unsaveWorker',
  async (workerId, { rejectWithValue }) => {
    try {
      // Mock unsave worker for now
      return { workerId, message: 'Worker unsaved successfully (mock)' };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove saved worker',
      );
    }
  },
);

export const releasePayment = createAsyncThunk(
  'hirer/releasePayment',
  async ({ jobId, milestoneId, amount }, { rejectWithValue }) => {
    try {
      // Mock payment release for now
      return { jobId, milestoneId, amount, totalPaid: amount, message: 'Payment released successfully (mock)' };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to release payment',
      );
    }
  },
);

export const createReview = createAsyncThunk(
  'hirer/createReview',
  async ({ workerId, jobId, reviewData }, { rejectWithValue }) => {
    try {
      // Mock review creation for now
      return { workerId, jobId, reviewData, message: 'Review created successfully (mock)' };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create review',
      );
    }
  },
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
      cancelled: [],
    },
    applications: {},
    searchResults: {
      workers: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      },
    },
    savedWorkers: [],
    payments: {
      pending: [],
      completed: [],
      total: 0,
    },
    reviews: [],
    loading: {
      profile: false,
      jobs: false,
      applications: false,
      workers: false,
      payments: false,
      reviews: false,
    },
    error: {
      profile: null,
      jobs: null,
      applications: null,
      workers: null,
      payments: null,
      reviews: null,
    },
  },
  reducers: {
    clearHirerErrors: (state) => {
      state.error = {
        profile: null,
        jobs: null,
        applications: null,
        workers: null,
        payments: null,
        reviews: null,
      };
    },
    updateSearchParams: (state, action) => {
      state.searchParams = {
        ...state.searchParams,
        ...action.payload,
      };
    },
    setApplicationsPage: (state, action) => {
      if (state.applications[action.payload.jobId]) {
        state.applications[action.payload.jobId].pagination.currentPage =
          action.payload.page;
      }
    },
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
        state.profile = action.payload.data.hirer;
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
        state.profile = action.payload.data.hirer;
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
        const { status, jobs } = action.payload;
        state.jobs[status] = jobs;
      })
      .addCase(fetchHirerJobs.rejected, (state, action) => {
        state.loading.jobs = false;
        state.error.jobs = action.payload;
      })
      .addCase(createHirerJob.fulfilled, (state, action) => {
        if (action.payload.status === 'draft') {
          state.jobs.draft.unshift(action.payload.data.job);
        } else {
          state.jobs.active.unshift(action.payload.data.job);
        }
      })
      .addCase(updateHirerJob.fulfilled, (state, action) => {
        const { id, status } = action.payload.data.job;

        // Remove from all status categories
        Object.keys(state.jobs).forEach((statusKey) => {
          state.jobs[statusKey] = state.jobs[statusKey].filter(
            (job) => job.id !== id,
          );
        });

        // Add to the appropriate category
        state.jobs[status].unshift(action.payload.data.job);
      })
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        const { jobId, status } = action.payload;

        // Remove from all status categories
        Object.keys(state.jobs).forEach((statusKey) => {
          state.jobs[statusKey] = state.jobs[statusKey].filter(
            (job) => job.id !== jobId,
          );
        });

        // Add to the new status category
        state.jobs[status].unshift(action.payload);
      })
      .addCase(deleteHirerJob.fulfilled, (state, action) => {
        const jobId = action.payload.jobId;

        // Remove from all status categories
        Object.keys(state.jobs).forEach((statusKey) => {
          state.jobs[statusKey] = state.jobs[statusKey].filter(
            (job) => job.id !== jobId,
          );
        });
      })

      // Applications
      .addCase(fetchJobApplications.pending, (state) => {
        state.loading.applications = true;
        state.error.applications = null;
      })
      .addCase(fetchJobApplications.fulfilled, (state, action) => {
        state.loading.applications = false;
        const { jobId, status, applications } = action.payload;

        if (!state.applications[jobId]) {
          state.applications[jobId] = {
            pending: [],
            accepted: [],
            rejected: [],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
            },
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
          state.applications[jobId][oldStatus] = state.applications[jobId][
            oldStatus
          ].filter((application) => application.id !== applicationId);

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
        state.savedWorkers.push(action.payload.workerId);
      })
      .addCase(unsaveWorker.fulfilled, (state, action) => {
        state.savedWorkers = state.savedWorkers.filter(
          (worker) => worker.id !== action.payload.workerId,
        );
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
          (payment) => payment.milestoneId !== action.payload.milestoneId,
        );

        // Update job if applicable
        const { jobId } = action.payload;
        if (state.jobs.active) {
          const jobIndex = state.jobs.active.findIndex(
            (job) => job.id === jobId,
          );
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
  },
});

// Selectors
export const selectHirerProfile = (state) => state.hirer.profile;
export const selectHirerJobs = (status) => (state) => state.hirer.jobs[status];
export const selectJobApplications = (jobId, status) => (state) =>
  state.hirer.applications[jobId]?.[status] || [];
export const selectSearchResults = (state) => state.hirer.searchResults;
export const selectSavedWorkers = (state) => state.hirer.savedWorkers;
export const selectPayments = (status) => (state) =>
  state.hirer.payments[status];
export const selectHirerLoading = (key) => (state) => state.hirer.loading[key];
export const selectHirerError = (key) => (state) => state.hirer.error[key];

export const { clearHirerErrors, updateSearchParams, setApplicationsPage } =
  hirerSlice.actions;

export default hirerSlice.reducer;
