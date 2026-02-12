import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../../services/apiClient';

// Clients are centralized in modules/common/services/axios.js with auth interceptors

// Async thunks for API operations
export const fetchHirerProfile = createAsyncThunk(
  'hirer/fetchProfile',
  async () => {
    try {
      // Align with user-service: profile is served under /api/profile
      const response = await api.get('/users/me/credentials');
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'User service unavailable for hirer profile:',
        error.message,
      );
      return getRealUserData();
    }
  },
);

// Map frontend status terminology to database canonical statuses
const STATUS_MAP = {
  'active': 'open',      // Frontend "active" = database "open"
  'completed': 'completed',
  'in-progress': 'in-progress',
  'cancelled': 'cancelled',
  'draft': 'draft',
  'all': null,           // No filter
  'open': 'open',        // Direct mapping
};

export const fetchHirerJobs = createAsyncThunk(
  'hirer/fetchJobs',
  async (status = 'all') => {
    try {
      // Map frontend status to database canonical status
      const dbStatus = STATUS_MAP[status] || status;
      const params = { role: 'hirer' };
      if (dbStatus) {
        params.status = dbStatus;
      }

      const response = await api.get('/jobs/my-jobs', { params });
      // Response structure: { success: true, data: { items: [...], pagination: {...} } }
      // Extract items array from response - check multiple possible paths
      const responseData = response.data?.data;
      const jobs = responseData?.items || responseData?.jobs || responseData || response.data?.jobs || [];
      console.log('[HirerSlice] Fetched jobs:', { requestedStatus: status, dbStatus, count: Array.isArray(jobs) ? jobs.length : 0 });
      return { status, jobs: Array.isArray(jobs) ? jobs : [] };
    } catch (error) {
      console.warn(
        `Job service unavailable for hirer jobs (${status}):`,
        error.message,
      );
      // Always return empty array on error
      return { status, jobs: [] };
    }
  },
);

export const createHirerJob = createAsyncThunk(
  'hirer/createJob',
  async (jobData) => {
    try {
      const response = await api.post('/jobs', jobData);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for job creation:', error.message);
      throw error;
    }
  },
);

export const updateHirerJob = createAsyncThunk(
  'hirer/updateJob',
  async ({ jobId, updates }) => {
    try {
      const response = await api.put(`/jobs/${jobId}`, updates);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for job update:', error.message);
      throw error;
    }
  },
);

export const updateHirerProfile = createAsyncThunk(
  'hirer/updateProfile',
  async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'User service unavailable for profile update:',
        error.message,
      );
      throw error;
    }
  },
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

export const updateJobStatus = createAsyncThunk(
  'hirer/updateJobStatus',
  async ({ jobId, status }) => {
    try {
      const response = await api.patch(`/jobs/${jobId}/status`, {
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
  async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}`);
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
  async ({ jobId, status } = {}, { rejectWithValue }) => {
    if (!jobId) {
      return rejectWithValue('jobId is required to fetch applications');
    }

    try {
      const params = {};
      if (status) {
        params.status = status;
      }

      const response = await api.get(`/jobs/${jobId}/applications`, {
        params,
      });
      return { jobId, applications: response.data };
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },
);

export const fetchHirerAnalytics = createAsyncThunk(
  'hirer/fetchAnalytics',
  async () => {
    try {
      const response = await api.get('/users/dashboard/analytics');
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },
);

export const fetchPaymentSummary = createAsyncThunk(
  'hirer/fetchPaymentSummary',
  async () => {
    try {
      // Compose summary from wallet, escrows, and transactions
      const [walletResp, escrowsResp, txResp] = await Promise.all([
        api.get('/payments/wallet').catch(() => ({ data: null })),
        api.get('/payments/escrows').catch(() => ({ data: [] })),
        api.get('/payments/transactions/history').catch(() => ({ data: [] })),
      ]);

      const wallet = walletResp?.data || {};
      const escrows = Array.isArray(escrowsResp?.data)
        ? escrowsResp.data
        : escrowsResp?.data?.escrows || [];
      const history = Array.isArray(txResp?.data?.data)
        ? txResp.data.data
        : Array.isArray(txResp?.data)
          ? txResp.data
          : [];

      // Compute escrow balance
      const escrowBalance = Array.isArray(wallet?.accounts)
        ? wallet.accounts.find((a) => a.type === 'escrow')?.balance || 0
        : escrows.reduce(
          (sum, e) => sum + (e.amount || 0) * (e.status === 'active' ? 1 : 0),
          0,
        );

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
              status:
                m.status === 'ready_for_release'
                  ? 'ready_for_release'
                  : 'pending_approval',
            });
          }
        });
      });

      // Compute totals
      const totalPaid = history
        .filter(
          (t) =>
            (t.type === 'payout' || t.type === 'payment') &&
            (t.status === 'completed' || t.status === 'success'),
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Average payment time (basic heuristic)
      const payoutDurations = history
        .filter(
          (t) =>
            (t.type === 'payout' || t.type === 'payment') &&
            t.createdAt &&
            (t.completedAt || t.updatedAt),
        )
        .map(
          (t) =>
            new Date(t.completedAt || t.updatedAt).getTime() -
            new Date(t.createdAt).getTime(),
        )
        .filter((d) => Number.isFinite(d) && d > 0);
      const avgMs = payoutDurations.length
        ? Math.round(
          payoutDurations.reduce((a, b) => a + b, 0) / payoutDurations.length,
        )
        : null;
      const averagePaymentTime = avgMs
        ? `${Math.max(1, Math.round(avgMs / (1000 * 60)))} min`
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

const APPLICATION_STATUSES = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn',
];

const createEmptyApplicationBuckets = () =>
  APPLICATION_STATUSES.reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {});

const createEmptyApplicationEntry = (jobId = null) => ({
  jobId,
  buckets: createEmptyApplicationBuckets(),
  total: 0,
  fetchedAt: null,
  isLoading: false,
  error: null,
});

const EMPTY_APPLICATION_ENTRY = createEmptyApplicationEntry();

const normalizeApplicationsByStatus = (apiPayload) => {
  const buckets = createEmptyApplicationBuckets();
  const list = Array.isArray(apiPayload?.data)
    ? apiPayload.data
    : Array.isArray(apiPayload?.items)
      ? apiPayload.items
      : Array.isArray(apiPayload)
        ? apiPayload
        : [];

  list.forEach((application) => {
    const status = application?.status || 'pending';
    if (!Array.isArray(buckets[status])) {
      buckets[status] = [];
    }
    buckets[status].push(application);
  });

  return buckets;
};

// Initial state
const initialState = {
  profile: null,
  jobs: {
    active: [], // ✅ FIXED: Changed from 'active' to active
    'in-progress': [],
    completed: [],
    cancelled: [],
    draft: [],
  },
  applications: {},
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
    clearHirerData: () => {
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
        state.profile = action.payload?.data || action.payload || null;
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
        state.profile = action.payload?.data || action.payload || null;
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
        const { status, jobs } = action.payload || {};
        if (status && Array.isArray(jobs)) {
          state.jobs[status] = jobs;
        }
      })
      .addCase(fetchHirerJobs.rejected, (state, action) => {
        state.loading.jobs = false;
        state.error.jobs = action.payload || 'Failed to fetch jobs';
        // ✅ FIXED: Set empty array instead of undefined
        const status = action.meta.arg || 'active';
        state.jobs[status] = [];
      })

      // Create Hirer Job
      .addCase(createHirerJob.pending, (state) => {
        state.loading.jobs = true;
        state.error.jobs = null;
      })
      .addCase(createHirerJob.fulfilled, (state, action) => {
        state.loading.jobs = false;
        const newJob = action.payload?.data || action.payload;
        if (newJob && state.jobs.draft) {
          state.jobs.draft.unshift(newJob);
        }
      })
      .addCase(createHirerJob.rejected, (state, action) => {
        state.loading.jobs = false;
        state.error.jobs = action.payload || 'Failed to create job';
      })

      // Update Hirer Job
      .addCase(updateHirerJob.pending, (state) => {
        state.loading.jobs = true;
        state.error.jobs = null;
      })
      .addCase(updateHirerJob.fulfilled, (state, action) => {
        state.loading.jobs = false;
        const updatedJob = action.payload?.data || action.payload;
        const updatedId = updatedJob?.id;
        if (!updatedJob || !updatedId) {
          return;
        }

        let placed = false;
        Object.keys(state.jobs).forEach((status) => {
          const idx = state.jobs[status].findIndex((j) => j.id === updatedId);
          if (idx !== -1) {
            state.jobs[status][idx] = {
              ...state.jobs[status][idx],
              ...updatedJob,
            };
            placed = true;
          }
        });

        if (!placed) {
          const target = updatedJob.status && state.jobs[updatedJob.status]
            ? updatedJob.status
            : 'draft';
          state.jobs[target].unshift(updatedJob);
        }
      })
      .addCase(updateHirerJob.rejected, (state, action) => {
        state.loading.jobs = false;
        state.error.jobs = action.payload || 'Failed to update job';
      })

      // Update Job Status
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        const payload = action.payload?.data || action.payload || {};
        const { jobId, status } = payload;
        if (!jobId || !status) return;

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
        const payload = action.payload?.data || action.payload || {};
        const jobId = payload.jobId;
        if (!jobId) {
          return;
        }
        Object.keys(state.jobs).forEach((status) => {
          state.jobs[status] = state.jobs[status].filter(
            (job) => job.id !== jobId,
          );
        });
      })

      // Fetch Job Applications
      .addCase(fetchJobApplications.pending, (state, action) => {
        state.loading.applications = true;
        state.error.applications = null;

        const pendingJobId = action.meta?.arg?.jobId;
        if (pendingJobId) {
          const existingEntry = state.applications[pendingJobId] || {};
          state.applications[pendingJobId] = {
            jobId: pendingJobId,
            buckets: existingEntry.buckets || createEmptyApplicationBuckets(),
            total: existingEntry.total || 0,
            fetchedAt: existingEntry.fetchedAt || null,
            isLoading: true,
            error: null,
          };
        }
      })
      .addCase(fetchJobApplications.fulfilled, (state, action) => {
        state.loading.applications = false;
        const { jobId, applications } = action.payload || {};
        if (!jobId) {
          return;
        }

        state.applications[jobId] = {
          jobId,
          buckets: normalizeApplicationsByStatus(applications),
          total: Array.isArray(applications) ? applications.length : 0,
          fetchedAt: Date.now(),
          isLoading: false,
          error: null,
        };
      })
      .addCase(fetchJobApplications.rejected, (state, action) => {
        state.loading.applications = false;
        state.error.applications =
          action.payload ||
          action.error?.message ||
          'Failed to fetch applications';

        const failedJobId = action.meta?.arg?.jobId;
        if (failedJobId) {
          const existingEntry = state.applications[failedJobId] || {
            buckets: createEmptyApplicationBuckets(),
            total: 0,
            fetchedAt: null,
          };
          state.applications[failedJobId] = {
            jobId: failedJobId,
            buckets: existingEntry.buckets,
            total: existingEntry.total,
            fetchedAt: existingEntry.fetchedAt,
            isLoading: false,
            error:
              action.payload ||
              action.error?.message ||
              'Failed to fetch applications',
          };
        }
      })

      // Fetch Hirer Analytics
      .addCase(fetchHirerAnalytics.pending, (state) => {
        state.loading.analytics = true;
        state.error.analytics = null;
      })
      .addCase(fetchHirerAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics = action.payload?.data || action.payload || null;
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
        state.payments = action.payload?.data || action.payload || null;
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
export const selectHirerJobs = (status) => (state) => {
  const jobs = state.hirer.jobs[status];
  return Array.isArray(jobs) ? jobs : [];
};
export const selectHirerApplications = (state) => state.hirer.applications;
export const selectHirerApplicationsByJob = (jobId) => (state) =>
  state.hirer.applications?.[jobId] || EMPTY_APPLICATION_ENTRY;
export const selectHirerPendingProposalCount = (state) =>
  Object.values(state.hirer.applications || {}).reduce(
    (total, record) => total + (record?.buckets?.pending?.length || 0),
    0,
  );
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
