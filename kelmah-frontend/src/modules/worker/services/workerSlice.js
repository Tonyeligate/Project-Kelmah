import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../../services/apiClient';

// Async thunks for worker operations
export const fetchWorkerProfile = createAsyncThunk(
  'worker/fetchProfile',
  async (workerId, { rejectWithValue }) => {
    try {
      // Use user-service worker endpoint
      const response = await api.get(`/users/workers/${workerId}`);
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
        `/users/workers/${workerId}`,
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
      const response = await api.get(`/users/workers/${workerId}/skills`);
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
      if (!workerId) {
        throw new Error('workerId is required');
      }

      const normalizedSkills = Array.isArray(skills)
        ? skills
            .map((skill) => {
              if (typeof skill === 'string') {
                const name = skill.trim();
                return name ? { name } : null;
              }

              if (skill && typeof skill === 'object') {
                const name = String(
                  skill.name || skill.skillName || '',
                ).trim();

                if (!name) {
                  return null;
                }

                return {
                  name,
                  level: skill.level,
                  category: skill.category,
                  yearsOfExperience: skill.yearsOfExperience,
                  description: skill.description,
                };
              }

              return null;
            })
            .filter(Boolean)
        : [];

      if (normalizedSkills.length === 0) {
        return [];
      }

      const existingRes = await api.get(`/users/workers/${workerId}/skills`);
      const existingSkills =
        existingRes.data?.data?.skills ||
        existingRes.data?.skills ||
        existingRes.data ||
        [];

      const existingByName = new Map(
        (Array.isArray(existingSkills) ? existingSkills : []).map((entry) => [
          String(entry?.name || '').trim().toLowerCase(),
          entry,
        ]),
      );

      const mutationTasks = normalizedSkills.map(async (entry) => {
        const key = entry.name.toLowerCase();
        const current = existingByName.get(key);

        if (!current) {
          await api.post(`/users/workers/${workerId}/skills`, {
            name: entry.name,
            ...(entry.level ? { level: entry.level } : {}),
            ...(entry.category ? { category: entry.category } : {}),
            ...(Number.isFinite(Number(entry.yearsOfExperience))
              ? { yearsOfExperience: Number(entry.yearsOfExperience) }
              : {}),
            ...(entry.description ? { description: entry.description } : {}),
          });
          return;
        }

        const skillId = current?.id || current?._id;
        if (!skillId) {
          return;
        }

        const updatePayload = {
          ...(entry.level ? { level: entry.level } : {}),
          ...(entry.category !== undefined ? { category: entry.category } : {}),
          ...(entry.description !== undefined
            ? { description: entry.description }
            : {}),
          ...(Number.isFinite(Number(entry.yearsOfExperience))
            ? { yearsOfExperience: Number(entry.yearsOfExperience) }
            : {}),
        };

        if (Object.keys(updatePayload).length > 0) {
          await api.put(
            `/users/workers/${workerId}/skills/${skillId}`,
            updatePayload,
          );
        }
      });

      await Promise.all(mutationTasks);

      const latestRes = await api.get(`/users/workers/${workerId}/skills`);
      return (
        latestRes.data?.data?.skills ||
        latestRes.data?.skills ||
        latestRes.data ||
        []
      );
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
        `/jobs/${jobId}/apply`,
        applicationData,
      );
      return response.data?.data || response.data;
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
        `/users/workers/${workerId}/earnings?period=${period}`,
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
      const dayOrder = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];

      const availableHours = availabilityData?.availableHours || {};
      const availabilityStatus = availabilityData?.availabilityStatus || 'available';
      const isAvailable = !['unavailable', 'vacation'].includes(
        String(availabilityStatus).toLowerCase(),
      );

      const daySlots = dayOrder.map((day, dayOfWeek) => {
        const dayData = availableHours?.[day] || {};
        const hasSlot = Boolean(dayData?.available);

        return {
          dayOfWeek,
          slots: hasSlot
            ? [
              {
                start: dayData?.start || '09:00',
                end: dayData?.end || '17:00',
              },
            ]
            : [],
        };
      });

      const payload = {
        timezone: 'Africa/Accra',
        isAvailable,
        pausedUntil: availabilityData?.pausedUntil || null,
        daySlots,
      };

      const response = await api.put(
        `/availability/${workerId}`,
        payload,
      );

      return response.data?.data || response.data;
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
    },
    applications: {
      pending: [],
      accepted: [],
      rejected: [],
    },
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
      .addCase(updateWorkerSkills.pending, (state) => {
        state.loading.skills = true;
        state.error.skills = null;
      })
      .addCase(updateWorkerSkills.fulfilled, (state, action) => {
        state.loading.skills = false;
        state.skills = action.payload;
      })
      .addCase(updateWorkerSkills.rejected, (state, action) => {
        state.loading.skills = false;
        state.error.skills = action.payload;
      })

      // Jobs
      .addCase(fetchWorkerJobs.pending, (state) => {
        state.loading.jobs = true;
        state.error.jobs = null;
      })
      .addCase(fetchWorkerJobs.fulfilled, (state, action) => {
        state.loading.jobs = false;
        const { jobs, status } = action.payload;
        const normalizedStatus = status === 'completed' ? 'completed' : 'active';
        state.jobs[normalizedStatus] = jobs;
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
        const application =
          action.payload?.application || action.payload?.data || action.payload;

        if (application && typeof application === 'object') {
          state.applications.pending.push(application);
        }
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
export const selectWorkerLoading = (key) => (state) =>
  state.worker.loading[key];
export const selectWorkerError = (key) => (state) => state.worker.error[key];

export const {
  clearWorkerErrors,
} = workerSlice.actions;

export default workerSlice.reducer;
