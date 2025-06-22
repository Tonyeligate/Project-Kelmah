import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../common/services/axios';

// Enhanced async thunks
export const fetchDashboardData = createAsyncThunk(
    'dashboard/fetchData',
    async (_, { rejectWithValue }) => {
        try {
            const [
                metricsResponse,
                jobsResponse,
                workersResponse,
                analyticsResponse
            ] = await Promise.all([
                api.get('/api/dashboard/metrics'),
                api.get('/api/dashboard/jobs'),
                api.get('/api/dashboard/workers'),
                api.get('/api/dashboard/analytics')
            ]);

            return {
                metrics: metricsResponse.data,
                recentJobs: jobsResponse.data,
                activeWorkers: workersResponse.data,
                analytics: analyticsResponse.data
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data');
        }
    }
);

export const updateJobStatus = createAsyncThunk(
    'dashboard/updateJobStatus',
    async ({ jobId, status }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/jobs/${jobId}/status`, { status });
            return { jobId, ...response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update job status');
        }
    }
);

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState: {
        data: {
            metrics: {},
            recentJobs: [],
            activeWorkers: [],
            analytics: {}
        },
        loading: false,
        error: null,
        selectedJob: null,
        selectedWorker: null
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
        }
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
                    job => job.id === action.payload.jobId
                );
                if (jobIndex !== -1) {
                    state.data.recentJobs[jobIndex] = {
                        ...state.data.recentJobs[jobIndex],
                        ...action.payload
                    };
                }
            });
    }
});

export const { setSelectedJob, setSelectedWorker, clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer; 
