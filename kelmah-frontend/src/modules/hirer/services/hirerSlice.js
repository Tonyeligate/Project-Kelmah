import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authServiceClient, userServiceClient, jobServiceClient, paymentServiceClient } from '../../common/services/axios';

// Clients are centralized in modules/common/services/axios.js with auth interceptors

// Async thunks for API operations
export const fetchHirerProfile = createAsyncThunk(
  'hirer/fetchProfile',
  async () => {
    try {
      // Align with user-service: profile is served under /api/profile
      const response = await userServiceClient.get('/api/users/me/credentials');
      return response.data.data || response.data;
    } catch (error) {
      console.warn('User service unavailable for hirer profile:', error.message);
      return getRealUserData();
    }
  }
);

export const fetchHirerJobs = createAsyncThunk(
  'hirer/fetchJobs',
  async (status = 'all') => {
    try {
      const response = await jobServiceClient.get('/api/jobs/my-jobs', {
        params: { status, role: 'hirer' },
      });
      const jobs = response.data?.data || response.data?.jobs || response.data || [];
      return { status, jobs };
    } catch (error) {
      console.warn(`Job service unavailable for hirer jobs (${status}):`, error.message);
      return { status, jobs: [] };
    }
  }
);

export const createHirerJob = createAsyncThunk(
  'hirer/createJob',
  async (jobData) => {
    try {
      const response = await jobServiceClient.post('/api/jobs', jobData);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for job creation:', error.message);
      throw error;
    }
  }
);

export const updateHirerProfile = createAsyncThunk(
  'hirer/updateProfile',
  async (profileData) => {
    try {
      const response = await userServiceClient.put('/api/users/me/profile', profileData);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('User service unavailable for profile update:', error.message);
      throw error;
    }
  }
);

// Get real user data from localStorage
const getRealUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    return null;
  }
};

// Create hirer profile from real user data only
const createHirerProfile = () => {
  const realUser = getRealUserData();

  if (realUser) {
    return {
      id: realUser.id || realUser._id,
      firstName: realUser.firstName || realUser.first_name || 'User',
      lastName: realUser.lastName || realUser.last_name || '',
      email: realUser.email || 'user@example.com',
      phone: realUser.phone || realUser.phoneNumber || '',
      company: realUser.company || realUser.companyName || '',
      location: realUser.location || realUser.address || '',
      bio: realUser.bio || realUser.description || '',
      avatar: realUser.avatar || realUser.profilePicture || '',
      role: realUser.role || realUser.userType || 'hirer',
      rating: realUser.rating || 0,
      reviewsCount: realUser.reviewsCount || 0,
      totalJobsPosted: realUser.totalJobsPosted || 0,
      totalAmountSpent: realUser.totalAmountSpent || 0,
      currency: realUser.currency || 'GH₵',
      verified: realUser.verified || false,
      joinedAt: realUser.createdAt ? new Date(realUser.createdAt) : new Date(),
      completionRate: realUser.completionRate || 0,
      responseTime: realUser.responseTime || 'N/A',
      preferences: realUser.preferences || {
        communicationMethod: 'email',
        jobNotifications: true,
        marketingEmails: false,
        currency: "GHS",
      },
      businessDetails: realUser.businessDetails || {
        registrationNumber: '',
        industry: '',
        employees: '',
        website: '',
      },
    };
  }

  // No fallback; return null to indicate absence of real user data
  return null;
};

export const updateJobStatus = createAsyncThunk(
  'hirer/updateJobStatus',
  async ({ jobId, status }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.patch(`/api/jobs/${jobId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable for status update, simulating success:',
        error.message,
      );
      throw error;
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
      console.warn(
        'Job service unavailable for job deletion, simulating success:',
        error.message,
      );
      throw error;
    }
  },
);

export const fetchJobApplications = createAsyncThunk(
  'hirer/fetchJobApplications',
  async ({ jobId, status }, { rejectWithValue }) => {
    try {
      const response = await jobServiceClient.get(
        `/api/jobs/${jobId}/applications`,
        {
          params: { status },
        },
      );
      return { jobId, applications: response.data };
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
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
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },
);

export const fetchPaymentSummary = createAsyncThunk(
  'hirer/fetchPaymentSummary',
  async (_, { rejectWithValue }) => {
    try {
      // Compose summary from wallet, escrows, and transactions
      const [walletResp, escrowsResp, txResp] = await Promise.all([
        paymentServiceClient.get('/api/payments/wallet').catch(() => ({ data: null })),
        paymentServiceClient.get('/api/payments/escrows').catch(() => ({ data: [] })),
        paymentServiceClient.get('/api/payments/transactions/history').catch(() => ({ data: [] })),
      ]);

      const wallet = walletResp?.data || {};
      const escrows = Array.isArray(escrowsResp?.data) ? escrowsResp.data : (escrowsResp?.data?.escrows || []);
      const history = Array.isArray(txResp?.data?.data) ? txResp.data.data : (Array.isArray(txResp?.data) ? txResp.data : []);

      // Compute escrow balance
      const escrowBalance = Array.isArray(wallet?.accounts)
        ? (wallet.accounts.find(a => a.type === 'escrow')?.balance || 0)
        : escrows.reduce((sum, e) => sum + (e.amount || 0) * (e.status === 'active' ? 1 : 0), 0);

      // Build pending payments from escrows' pending milestones
      const pending = [];
      escrows.forEach((e) => {
        const milestones = Array.isArray(e.milestones) ? e.milestones : [];
        milestones.forEach((m) => {
          if (m.status === 'pending' || m.status === 'ready_for_release') {
            pending.push({
              id: `${e.id}_${m.id}`,
              escrowId: e.id,
              milestoneId: m.id,
              jobTitle: e.jobTitle || e.jobId,
              worker: e.worker || {},
              amount: m.amount || 0,
              milestone: m.description || m.name || 'Milestone',
              dueDate: m.dueDate || null,
              status: m.status === 'ready_for_release' ? 'ready_for_release' : 'pending_approval',
            });
          }
        });
      });

      // Compute totals
      const totalPaid = history
        .filter((t) => (t.type === 'payout' || t.type === 'payment') && (t.status === 'completed' || t.status === 'success'))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Average payment time (basic heuristic)
      const payoutDurations = history
        .filter((t) => (t.type === 'payout' || t.type === 'payment') && t.createdAt && (t.completedAt || t.updatedAt))
        .map((t) => new Date(t.completedAt || t.updatedAt).getTime() - new Date(t.createdAt).getTime())
        .filter((d) => Number.isFinite(d) && d > 0);
      const avgMs = payoutDurations.length
        ? Math.round(payoutDurations.reduce((a, b) => a + b, 0) / payoutDurations.length)
        : null;
      const averagePaymentTime = avgMs
        ? `${Math.max(1, Math.round(avgMs / (1000 * 60))) } min`
        : 'N/A';

      return {
        wallet,
        escrows,
        history,
        pending,
        escrowBalance,
        totalPaid,
        pendingPayments: pending.length,
        averagePaymentTime,
      };
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },
);

// Initial state
const initialState = {
  profile: null,
  jobs: {
    open: [],
    'in-progress': [],
    completed: [],
    cancelled: [],
    draft: [],
  },
  applications: [],
  analytics: null,
  payments: null,
  loading: {
    profile: false,
    jobs: false,
    applications: false,
    analytics: false,
    payments: false,
  },
  error: {
    profile: null,
    jobs: null,
    applications: null,
    analytics: null,
    payments: null,
  },
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
      Object.keys(state.error).forEach((key) => {
        state.error[key] = null;
      });
    },
    updateJobInList: (state, action) => {
      const { jobId, updates } = action.payload;
      Object.keys(state.jobs).forEach((status) => {
        const jobIndex = state.jobs[status].findIndex(
          (job) => job.id === jobId,
        );
        if (jobIndex !== -1) {
          state.jobs[status][jobIndex] = {
            ...state.jobs[status][jobIndex],
            ...updates,
          };
        }
      });
    },
    removeJobFromList: (state, action) => {
      const jobId = action.payload;
      Object.keys(state.jobs).forEach((status) => {
        state.jobs[status] = state.jobs[status].filter(
          (job) => job.id !== jobId,
        );
      });
    },
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
        state.profile = null;
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
        // No fallback data - user will see empty state
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
        Object.keys(state.jobs).forEach((currentStatus) => {
          const jobIndex = state.jobs[currentStatus].findIndex(
            (job) => job.id === jobId,
          );
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
        Object.keys(state.jobs).forEach((status) => {
          state.jobs[status] = state.jobs[status].filter(
            (job) => job.id !== jobId,
          );
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
        state.error.applications =
          action.payload || 'Failed to fetch applications';
        // No fallback data
        state.applications = [];
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
        // No fallback data
        state.analytics = null;
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
        // No fallback data
        state.payments = null;
      });
  },
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
export const {
  clearHirerData,
  clearHirerErrors,
  updateJobInList,
  removeJobFromList,
} = hirerSlice.actions;

// Export reducer
export default hirerSlice.reducer;
