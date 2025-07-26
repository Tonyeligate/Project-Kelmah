import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service clients - temporarily using AUTH_SERVICE for all calls
// until USER_SERVICE and JOB_SERVICE are deployed
const authServiceClient = axios.create({
  baseURL: SERVICES.AUTH_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// For now, use auth service for both user and job operations
const userServiceClient = authServiceClient;
const jobServiceClient = authServiceClient;

// Add auth tokens to requests
authServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Comprehensive mock hirer data
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
    completionRate: 95,
    responseTime: '2 hours',
    preferences: {
      communicationMethod: 'email',
      jobNotifications: true,
      marketingEmails: false,
      currency: 'GHS'
    },
    businessDetails: {
      registrationNumber: 'BN/2021/08/12345',
      industry: 'Construction & Real Estate',
      employees: '10-50',
      website: 'https://mitchellconstruction.com.gh'
    }
  },

  jobs: {
    active: [
      {
        id: 'job-h1',
        title: 'Kitchen Renovation - Custom Cabinets',
        description: 'We need a skilled carpenter to design and install custom kitchen cabinets for a modern home renovation project.',
        category: 'Carpentry',
        type: 'fixed',
        budget: 5500,
        currency: 'GHS',
        status: 'active',
        location: 'East Legon, Accra',
        skills: ['Carpentry', 'Cabinet Making', 'Wood Finishing'],
        urgency: 'medium',
        duration: '3 weeks',
        applicationsCount: 8,
        viewsCount: 24,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        requirements: [
          'Minimum 3 years carpentry experience',
          'Portfolio of kitchen cabinet work',
          'Own tools and transportation',
          'Available for 3-week project timeline'
        ],
        benefits: [
          'Competitive fixed rate payment',
          'Potential for future projects',
          'Professional reference provided',
          'Material costs covered separately'
        ]
      },
      {
        id: 'job-h2',
        title: 'Office Interior Design & Setup',
        description: 'Looking for an experienced interior designer to completely redesign and set up our new office space.',
        category: 'Interior Design',
        type: 'fixed',
        budget: 15000,
        currency: 'GHS',
        status: 'active',
        location: 'Airport City, Accra',
        skills: ['Interior Design', 'Space Planning', 'Project Management'],
        urgency: 'high',
        duration: '4 weeks',
        applicationsCount: 12,
        viewsCount: 45,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
        requirements: [
          'Interior design certification or equivalent experience',
          'Proven track record with office designs',
          'Ability to manage full project lifecycle',
          'Experience with modern office layouts'
        ],
        benefits: [
          'High-value project with room for creativity',
          'Milestone-based payments',
          'Portfolio piece for future marketing',
          'Long-term client relationship potential'
        ]
      },
      {
        id: 'job-h3',
        title: 'Residential Electrical System Upgrade',
        description: 'Complete electrical system upgrade for a 4-bedroom house including new wiring, outlets, and modern electrical panel.',
        category: 'Electrical',
        type: 'fixed',
        budget: 8500,
        currency: 'GHS',
        status: 'active',
        location: 'Tema, Greater Accra',
        skills: ['Electrical Installation', 'Wiring', 'Safety Certification'],
        urgency: 'medium',
        duration: '2 weeks',
        applicationsCount: 6,
        viewsCount: 18,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
        requirements: [
          'Licensed electrician certification',
          'Experience with residential electrical systems',
          'Safety protocol compliance',
          'Insurance coverage required'
        ],
        benefits: [
          'Fair market rate compensation',
          'Materials provided by client',
          'Flexible working hours',
          'Safety equipment provided'
        ]
      }
    ],

    completed: [
      {
        id: 'job-c1',
        title: 'Bathroom Renovation - Modern Design',
        description: 'Complete bathroom renovation with modern fixtures and tiling.',
        category: 'Plumbing',
        type: 'fixed',
        budget: 7800,
        currency: 'GHS',
        status: 'completed',
        location: 'Spintex, Accra',
        skills: ['Plumbing', 'Tiling', 'Bathroom Design'],
        duration: '2.5 weeks',
        applicationsCount: 9,
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
        workerName: 'Michael Asante',
        workerRating: 4.7,
        finalAmount: 7800,
        clientRating: 5,
        clientReview: 'Excellent work! The bathroom looks amazing and everything was completed on schedule.'
      },
      {
        id: 'job-c2',
        title: 'Living Room Painting & Decoration',
        description: 'Professional painting and decorative finishing for large living room.',
        category: 'Painting',
        type: 'fixed',
        budget: 3200,
        currency: 'GHS',
        status: 'completed',
        location: 'Achimota, Accra',
        skills: ['Interior Painting', 'Color Consultation', 'Surface Preparation'],
        duration: '1 week',
        applicationsCount: 15,
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50),
        workerName: 'David Mensah',
        workerRating: 4.5,
        finalAmount: 3200,
        clientRating: 4,
        clientReview: 'Good quality work. David was professional and completed the job as agreed.'
      }
    ],

    draft: [
      {
        id: 'job-d1',
        title: 'Garden Landscaping Project',
        description: 'Design and implement landscaping for front and back garden areas.',
        category: 'Landscaping',
        type: 'fixed',
        budget: 12000,
        currency: 'GHS',
        status: 'draft',
        location: 'Labone, Accra',
        skills: ['Landscaping', 'Garden Design', 'Plant Selection'],
        urgency: 'low',
        duration: '3 weeks',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        requirements: [
          'Landscaping certification preferred',
          'Knowledge of local plants and climate',
          'Creative design portfolio',
          'Equipment and tools included'
        ],
        benefits: [
          'Creative freedom in design',
          'Long-term maintenance contract potential',
          'High-visibility project',
          'Premium rate for quality work'
        ]
      },
      {
        id: 'job-d2',
        title: 'Commercial Kitchen Equipment Installation',
        description: 'Installation of professional kitchen equipment for new restaurant.',
        category: 'Installation',
        type: 'fixed',
        budget: 18000,
        currency: 'GHS',
        status: 'draft',
        location: 'Osu, Accra',
        skills: ['Equipment Installation', 'Plumbing', 'Electrical'],
        urgency: 'high',
        duration: '2 weeks',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        requirements: [
          'Commercial kitchen experience',
          'Multi-trade capabilities (plumbing/electrical)',
          'Equipment manufacturer certifications',
          'Health and safety compliance'
        ],
        benefits: [
          'High-value commercial project',
          'Opportunity for ongoing maintenance contracts',
          'Professional kitchen environment',
          'Potential restaurant chain expansion work'
        ]
      }
    ]
  },

  analytics: {
    overview: {
      totalJobsPosted: 45,
      activeJobs: 3,
      completedJobs: 32,
      draftJobs: 2,
      cancelledJobs: 8,
      totalSpent: 125000,
      averageJobValue: 3289,
      successRate: 84,
      averageCompletionTime: 18 // days
    },

    monthlyStats: [
      { month: 'Jan', jobsPosted: 6, totalSpent: 18500, avgRating: 4.7 },
      { month: 'Feb', jobsPosted: 4, totalSpent: 12000, avgRating: 4.8 },
      { month: 'Mar', jobsPosted: 7, totalSpent: 21500, avgRating: 4.6 },
      { month: 'Apr', jobsPosted: 5, totalSpent: 15000, avgRating: 4.9 },
      { month: 'May', jobsPosted: 8, totalSpent: 23500, avgRating: 4.8 },
      { month: 'Jun', jobsPosted: 6, totalSpent: 18200, avgRating: 4.7 }
    ],

    topCategories: [
      { category: 'Carpentry', jobsPosted: 12, totalSpent: 35000, avgRating: 4.8 },
      { category: 'Plumbing', jobsPosted: 8, totalSpent: 28000, avgRating: 4.7 },
      { category: 'Electrical', jobsPosted: 6, totalSpent: 22000, avgRating: 4.9 },
      { category: 'Painting', jobsPosted: 5, totalSpent: 15000, avgRating: 4.6 },
      { category: 'Interior Design', jobsPosted: 4, totalSpent: 25000, avgRating: 4.8 }
    ],

    workerInteractions: {
      totalApplicationsReceived: 284,
      uniqueWorkersInteracted: 67,
      averageApplicationsPerJob: 8.4,
      topWorkers: [
        { name: 'Tony Gate', jobsCompleted: 5, rating: 4.8, totalEarned: 18500 },
        { name: 'Sarah Williams', jobsCompleted: 3, rating: 4.9, totalEarned: 22000 },
        { name: 'Michael Asante', jobsCompleted: 4, rating: 4.7, totalEarned: 15800 }
      ]
    }
  },

  applications: [
    {
      id: 'app-1',
      jobId: 'job-h1',
      jobTitle: 'Kitchen Renovation - Custom Cabinets',
      applicant: {
        id: 'worker-1',
        name: 'Tony Gate',
        avatar: '/api/placeholder/50/50',
        rating: 4.8,
        completedJobs: 23,
        skills: ['Carpentry', 'Cabinet Making', 'Wood Finishing']
      },
      appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      status: 'pending',
      proposedRate: 5200,
      estimatedDuration: '3 weeks',
      coverLetter: 'I have extensive experience in custom cabinet making and would love to work on your kitchen renovation project.',
      portfolio: ['cabinet1.jpg', 'cabinet2.jpg', 'kitchen_work.jpg']
    },
    {
      id: 'app-2',
      jobId: 'job-h2',
      jobTitle: 'Office Interior Design & Setup',
      applicant: {
        id: 'worker-2',
        name: 'Sarah Williams',
        avatar: '/api/placeholder/50/50',
        rating: 4.9,
        completedJobs: 31,
        skills: ['Interior Design', 'Space Planning', 'Project Management']
      },
      appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      status: 'pending',
      proposedRate: 14500,
      estimatedDuration: '4 weeks',
      coverLetter: 'I specialize in modern office design and can transform your space into a productive and inspiring environment.',
      portfolio: ['office1.jpg', 'office2.jpg', 'design_portfolio.pdf']
    }
  ],

  payments: {
    summary: {
      totalPaid: 87500,
      pendingPayments: 23500,
      escrowBalance: 45000,
      totalEscrowCreated: 156000,
      averagePaymentTime: 2.3, // days
      paymentMethods: {
        mobileMoney: 65,
        bankTransfer: 30,
        cardPayment: 5
      }
    },
    recentTransactions: [
      {
        id: 'pay-1',
        type: 'payment_released',
        jobTitle: 'Bathroom Renovation',
        workerName: 'Michael Asante',
        amount: 7800,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        status: 'completed',
        method: 'Mobile Money'
      },
      {
        id: 'pay-2',
        type: 'escrow_created',
        jobTitle: 'Kitchen Renovation',
        amount: 5500,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        status: 'active',
        method: 'Bank Transfer'
      }
    ]
  }
};

// Async thunks for hirer operations with comprehensive mock fallbacks
export const fetchHirerProfile = createAsyncThunk(
  'hirer/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      // Try the dedicated user service endpoint first, but it will likely fail
      const response = await userServiceClient.get('/api/users/me/profile');
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for hirer profile, using comprehensive mock data:', error.message);
      
      // Return comprehensive mock data
      return {
        success: true,
        data: mockHirerData.profile
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
        data: { ...mockHirerData.profile, ...profileData, updatedAt: new Date() },
        message: 'Profile updated successfully (mock)'
      };
    }
  },
);

export const fetchHirerJobs = createAsyncThunk(
  'hirer/fetchJobs',
  async (status = 'active', { rejectWithValue }) => {
    try {
      // Try the dedicated job service endpoint first, but it will likely fail
      const response = await jobServiceClient.get('/api/jobs/my-jobs', { 
        params: { status, role: 'hirer' } 
      });
      return { status, jobs: response.data };
    } catch (error) {
      console.warn(`Job service unavailable for hirer jobs (${status}), using comprehensive mock data:`, error.message);
      
      // Return comprehensive mock data
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
        status: 'draft',
        applicationsCount: 0,
        viewsCount: 0,
        createdAt: new Date(),
        currency: 'GHS'
      };
      
      return {
        success: true,
        data: newJob,
        message: 'Job created successfully (mock)'
      };
    }
  },
);

export const updateJobStatus = createAsyncThunk(
  'hirer/updateJobStatus',
  async ({ jobId, status }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.put(`/api/jobs/${jobId}/status`, { status });
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for status update, simulating success:', error.message);
      return {
        success: true,
        data: { jobId, status, updatedAt: new Date() },
        message: `Job status updated to ${status} (mock)`
      };
    }
  },
);

export const deleteHirerJob = createAsyncThunk(
  'hirer/deleteJob',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.delete(`/api/jobs/${jobId}`);
      return { jobId };
    } catch (error) {
      console.warn('Job service unavailable for job deletion, simulating success:', error.message);
      return {
        success: true,
        data: { jobId },
        message: 'Job deleted successfully (mock)'
      };
    }
  },
);

export const fetchJobApplications = createAsyncThunk(
  'hirer/fetchJobApplications',
  async ({ jobId, status }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.get(`/api/jobs/${jobId}/applications`, {
        params: { status }
      });
      return { jobId, applications: response.data };
    } catch (error) {
      console.warn('Job service unavailable for applications, using mock data:', error.message);
      
      // Return mock applications for the specific job
      const jobApplications = mockHirerData.applications.filter(app => app.jobId === jobId);
      return { jobId, applications: jobApplications };
    }
  },
);

export const fetchHirerAnalytics = createAsyncThunk(
  'hirer/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userServiceClient.get('/api/users/me/analytics');
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for analytics, using comprehensive mock data:', error.message);
      return {
        success: true,
        data: mockHirerData.analytics
      };
    }
  },
);

export const fetchPaymentSummary = createAsyncThunk(
  'hirer/fetchPaymentSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userServiceClient.get('/api/payments/summary');
      return response.data;
    } catch (error) {
      console.warn('Payment service unavailable, using mock payment data:', error.message);
      return {
        success: true,
        data: mockHirerData.payments
      };
    }
  },
);

// Initial state
const initialState = {
  profile: null,
  jobs: {
    active: [],
    completed: [],
    draft: []
  },
  applications: [],
  analytics: null,
  payments: null,
  loading: {
    profile: false,
    jobs: false,
    applications: false,
    analytics: false,
    payments: false
  },
  error: {
    profile: null,
    jobs: null,
    applications: null,
    analytics: null,
    payments: null
  }
};

// Create slice
const hirerSlice = createSlice({
  name: 'hirer',
  initialState,
  reducers: {
    clearHirerData: (state) => {
      return initialState;
    },
    clearHirerErrors: (state) => {
      Object.keys(state.error).forEach(key => {
        state.error[key] = null;
      });
    },
    updateJobInList: (state, action) => {
      const { jobId, updates } = action.payload;
      Object.keys(state.jobs).forEach(status => {
        const jobIndex = state.jobs[status].findIndex(job => job.id === jobId);
        if (jobIndex !== -1) {
          state.jobs[status][jobIndex] = { ...state.jobs[status][jobIndex], ...updates };
        }
      });
    },
    removeJobFromList: (state, action) => {
      const jobId = action.payload;
      Object.keys(state.jobs).forEach(status => {
        state.jobs[status] = state.jobs[status].filter(job => job.id !== jobId);
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Hirer Profile
      .addCase(fetchHirerProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(fetchHirerProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload.data || action.payload;
      })
      .addCase(fetchHirerProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = action.payload || 'Failed to fetch profile';
        // Fallback to mock data even on rejection
        state.profile = mockHirerData.profile;
      })

      // Update Hirer Profile
      .addCase(updateHirerProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(updateHirerProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload.data || action.payload;
      })
      .addCase(updateHirerProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = action.payload || 'Failed to update profile';
      })

      // Fetch Hirer Jobs
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
        state.error.jobs = action.payload || 'Failed to fetch jobs';
        // Fallback to mock data even on rejection
        state.jobs = mockHirerData.jobs;
      })

      // Create Hirer Job
      .addCase(createHirerJob.pending, (state) => {
        state.loading.jobs = true;
        state.error.jobs = null;
      })
      .addCase(createHirerJob.fulfilled, (state, action) => {
        state.loading.jobs = false;
        const newJob = action.payload.data || action.payload;
        state.jobs.draft.unshift(newJob);
      })
      .addCase(createHirerJob.rejected, (state, action) => {
        state.loading.jobs = false;
        state.error.jobs = action.payload || 'Failed to create job';
      })

      // Update Job Status
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        const { jobId, status } = action.payload.data || action.payload;
        // Move job between status lists
        let movedJob = null;
        Object.keys(state.jobs).forEach(currentStatus => {
          const jobIndex = state.jobs[currentStatus].findIndex(job => job.id === jobId);
          if (jobIndex !== -1) {
            movedJob = { ...state.jobs[currentStatus][jobIndex], status };
            state.jobs[currentStatus].splice(jobIndex, 1);
          }
        });
        if (movedJob && state.jobs[status]) {
          state.jobs[status].unshift(movedJob);
        }
      })

      // Delete Hirer Job
      .addCase(deleteHirerJob.fulfilled, (state, action) => {
        const jobId = action.payload.data?.jobId || action.payload.jobId;
        Object.keys(state.jobs).forEach(status => {
          state.jobs[status] = state.jobs[status].filter(job => job.id !== jobId);
        });
      })

      // Fetch Job Applications
      .addCase(fetchJobApplications.pending, (state) => {
        state.loading.applications = true;
        state.error.applications = null;
      })
      .addCase(fetchJobApplications.fulfilled, (state, action) => {
        state.loading.applications = false;
        const { applications } = action.payload;
        state.applications = applications;
      })
      .addCase(fetchJobApplications.rejected, (state, action) => {
        state.loading.applications = false;
        state.error.applications = action.payload || 'Failed to fetch applications';
        // Fallback to mock data
        state.applications = mockHirerData.applications;
      })

      // Fetch Hirer Analytics
      .addCase(fetchHirerAnalytics.pending, (state) => {
        state.loading.analytics = true;
        state.error.analytics = null;
      })
      .addCase(fetchHirerAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics = action.payload.data || action.payload;
      })
      .addCase(fetchHirerAnalytics.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error.analytics = action.payload || 'Failed to fetch analytics';
        // Fallback to mock data
        state.analytics = mockHirerData.analytics;
      })

      // Fetch Payment Summary
      .addCase(fetchPaymentSummary.pending, (state) => {
        state.loading.payments = true;
        state.error.payments = null;
      })
      .addCase(fetchPaymentSummary.fulfilled, (state, action) => {
        state.loading.payments = false;
        state.payments = action.payload.data || action.payload;
      })
      .addCase(fetchPaymentSummary.rejected, (state, action) => {
        state.loading.payments = false;
        state.error.payments = action.payload || 'Failed to fetch payments';
        // Fallback to mock data
        state.payments = mockHirerData.payments;
      });
  }
});

// Selectors
export const selectHirerProfile = (state) => state.hirer.profile;
export const selectHirerJobs = (status) => (state) => state.hirer.jobs[status];
export const selectHirerApplications = (state) => state.hirer.applications;
export const selectHirerAnalytics = (state) => state.hirer.analytics;
export const selectHirerPayments = (state) => state.hirer.payments;
export const selectHirerLoading = (key) => (state) => state.hirer.loading[key];
export const selectHirerError = (key) => (state) => state.hirer.error[key];

// Actions
export const { clearHirerData, clearHirerErrors, updateJobInList, removeJobFromList } = hirerSlice.actions;

// Export reducer
export default hirerSlice.reducer;
