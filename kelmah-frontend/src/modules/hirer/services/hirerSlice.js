import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../../services/apiClient';
import { createFeatureLogger, devWarn } from '@/modules/common/utils/devLogger';

const devLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_HIRER',
  level: 'log',
});

// Clients are centralized in modules/common/services/axios.js with auth interceptors

// Async thunks for API operations
export const fetchHirerProfile = createAsyncThunk(
  'hirer/fetchProfile',
  async (_, { rejectWithValue }) => {
    // Canonical endpoint: /users/me/credentials (verified in user-service routes)
    try {
      const response = await api.get('/users/me/credentials');
      return response?.data?.data ?? response?.data ?? {};
    } catch (error) {
      devWarn(
        'User service unavailable for hirer profile:',
        error.message,
      );
      // Fallback: try /users/profile as secondary endpoint
      try {
        const fallback = await api.get('/users/profile');
        return fallback?.data?.data ?? fallback?.data ?? {};
      } catch (fallbackError) {
        return rejectWithValue(
          fallbackError?.response?.data?.message ||
            fallbackError?.message ||
            'Failed to fetch hirer profile',
        );
      }
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

const unwrapApiPayload = (payload) => payload?.data ?? payload ?? null;

const extractThunkCollectionItems = (payload) => {
  const data = unwrapApiPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.jobs)) {
    return data.jobs;
  }

  if (Array.isArray(data?.applications)) {
    return data.applications;
  }

  return [];
};

export const fetchHirerJobs = createAsyncThunk(
  'hirer/fetchJobs',
  async (status = 'all', { rejectWithValue }) => {
    try {
      // Map frontend status to database canonical status
      const dbStatus = STATUS_MAP[status] !== undefined ? STATUS_MAP[status] : status;
      // Use a high limit for the consolidated 'all' fetch; otherwise 50 per bucket
      const params = { role: 'hirer', limit: status === 'all' ? 200 : 50 };
      if (dbStatus) {
        params.status = dbStatus;
      }

      const response = await api.get('/jobs/my-jobs', { params });
      const jobs = extractThunkCollectionItems(response.data);
      devLog('[HirerSlice] Fetched jobs:', { requestedStatus: status, dbStatus, count: Array.isArray(jobs) ? jobs.length : 0 });
      return { status, jobs: Array.isArray(jobs) ? jobs : [] };
    } catch (error) {
      devWarn('fetchHirerJobs error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch jobs');
    }
  },
);

export const createHirerJob = createAsyncThunk(
  'hirer/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      const response = await api.post('/jobs', jobData);
      return response.data.data || response.data;
    } catch (error) {
      devWarn('Job service unavailable for job creation:', error.message);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create job');
    }
  },
);

export const updateHirerJob = createAsyncThunk(
  'hirer/updateJob',
  async ({ jobId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/jobs/${jobId}`, updates);
      return response.data.data || response.data;
    } catch (error) {
      devWarn('Job service unavailable for job update:', error.message);
      const backendMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update job';
      return rejectWithValue(backendMessage);
    }
  },
);

export const updateHirerProfile = createAsyncThunk(
  'hirer/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data.data ?? response.data;
    } catch (error) {
      devWarn(
        'User service unavailable for profile update:',
        error.message,
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateJobStatus = createAsyncThunk(
  'hirer/updateJobStatus',
  async ({ jobId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/jobs/${jobId}/status`, {
        status,
      });
      return unwrapApiPayload(response.data) ?? response.data ?? {};
    } catch (error) {
      devWarn(
        'Job service unavailable for status update:',
        error.message,
      );
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update job status');
    }
  },
);

export const deleteHirerJob = createAsyncThunk(
  'hirer/deleteJob',
  async (jobId, { rejectWithValue }) => {
    try {
      await api.delete(`/jobs/${jobId}`);
      return { jobId };
    } catch (error) {
      devWarn(
        'Job service unavailable for job deletion:',
        error.message,
      );
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete job');
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
      return { jobId, applications: extractThunkCollectionItems(response.data) };
    } catch (error) {
      devWarn('Service unavailable:', error.message);
      throw error;
    }
  },
);

export const fetchHirerAnalytics = createAsyncThunk(
  'hirer/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/dashboard/analytics');
      return response.data?.data ?? response.data;
    } catch (error) {
      devWarn('Service unavailable:', error.message);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch analytics');
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

      // Unwrap { success: true, data: walletDoc } returned by the backend
      const walletRaw = walletResp?.data;
      const wallet = walletRaw?.success ? (walletRaw.data ?? walletRaw) : (walletRaw ?? {});
      // Escrows: getEscrows returns a plain array already, but guard for raw response
      const escrowRaw = escrowsResp?.data;
      const escrows = Array.isArray(escrowRaw)
        ? escrowRaw
        : Array.isArray(escrowRaw?.data)
          ? escrowRaw.data
          : escrowRaw?.escrows || [];
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
      devWarn('Service unavailable:', error.message);
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
  const list = extractThunkCollectionItems(apiPayload);

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
    open: [],          // jobs with status 'open'
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
        if (!Array.isArray(jobs)) return;

        if (status === 'all') {
          // Distribute the consolidated list into per-status buckets so status
          // counts and tab filtering work without additional processing.
          const buckets = { open: [], 'in-progress': [], completed: [], cancelled: [], draft: [] };
          jobs.forEach((job) => {
            const s = job.status || 'draft';
            if (buckets[s]) buckets[s].push(job);
            else buckets[s] = [job]; // Handle any unexpected status values
          });
          Object.assign(state.jobs, buckets);
        } else if (status) {
          // Canonical status key - map 'active' alias to 'open'
          const key = status === 'active' ? 'open' : status;
          state.jobs[key] = jobs;
        }
      })
      .addCase(fetchHirerJobs.rejected, (state, action) => {
        state.loading.jobs = false;
        state.error.jobs = action.payload || 'Failed to fetch jobs';
        // Set empty array for the failed status bucket
        const rawStatus = action.meta.arg || 'open';
        const key = rawStatus === 'active' ? 'open' : rawStatus;
        if (key !== 'all') state.jobs[key] = [];
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
        const updatedId = updatedJob?.id || updatedJob?._id;
        if (!updatedJob || !updatedId) {
          return;
        }

        let placed = false;
        Object.keys(state.jobs).forEach((status) => {
          const idx = state.jobs[status].findIndex((j) => (j.id || j._id) === updatedId);
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
        const payload = action.payload || {};
        const status = payload.status;
        const jobId = payload.jobId || payload.id || payload._id;
        if (!jobId || !status) return;

        // Move job between status lists
        let movedJob = null;
        Object.keys(state.jobs).forEach((currentStatus) => {
          const jobIndex = state.jobs[currentStatus].findIndex(
            (job) => (job.id || job._id) === jobId,
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
        const { jobId } = payload;
        if (!jobId) {
          return;
        }
        Object.keys(state.jobs).forEach((status) => {
          state.jobs[status] = state.jobs[status].filter(
            (job) => (job.id || job._id) !== jobId,
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

        const appList = Array.isArray(applications) ? applications : [];
        state.applications[jobId] = {
          jobId,
          buckets: normalizeApplicationsByStatus(applications),
          total: appList.length,
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
  const key = status === 'active' ? 'open' : status;
  const jobs = state.hirer.jobs[key];
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

