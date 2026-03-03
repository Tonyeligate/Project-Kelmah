import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../../services/apiClient';

// Create async thunk for submitting reviews
export const submitReview = createAsyncThunk(
  'reviews/submit',
  async (reviewData, { rejectWithValue }) => {
    try {
      // Changed from '/api/reviews' to '/reviews' to avoid /api duplication
      // baseURL='/api' is provided by axiosInstance on Vercel
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Failed to submit review. Please try again.',
      );
    }
  },
);

// Create async thunk for fetching reviews by recipient ID
export const fetchReviewsByRecipient = createAsyncThunk(
  'reviews/fetchByRecipient',
  async (
    { recipientId, recipientType, page = 1, limit = 10 },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get('/reviews', {
        params: {
          recipientId,
          recipientType,
          page,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Failed to fetch reviews. Please try again.',
      );
    }
  },
);

// Create async thunk for fetching reviews by contract ID
export const fetchReviewsByContract = createAsyncThunk(
  'reviews/fetchByContract',
  async (contractId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/contract/${contractId}`);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Failed to fetch reviews for this contract. Please try again.',
      );
    }
  },
);

// Initial state
const initialState = {
  reviews: [],
  contractReviews: [],
  totalCount: 0,
  currentPage: 1,
  loading: false,
  submitting: false,
  error: null,
  success: false,
};

// Create slice
const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewsState: (state) => {
      state.reviews = [];
      state.contractReviews = [];
      state.totalCount = 0;
      state.currentPage = 1;
      state.error = null;
      state.success = false;
    },
    resetReviewSubmission: (state) => {
      state.submitting = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit review
      .addCase(submitReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitReview.fulfilled, (state) => {
        state.submitting = false;
        state.success = true;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Fetch by recipient
      .addCase(fetchReviewsByRecipient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviewsByRecipient.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both { data: { reviews, ... } } and flat { reviews, ... } shapes
        const payload = action.payload?.data || action.payload || {};
        state.reviews = payload.reviews || [];
        state.totalCount = payload.totalCount || payload.total || 0;
        state.currentPage = payload.currentPage || payload.page || 1;
      })
      .addCase(fetchReviewsByRecipient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch by contract
      .addCase(fetchReviewsByContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviewsByContract.fulfilled, (state, action) => {
        state.loading = false;
        // Unwrap { success, data: [...] } wrapper if present
        const payload = action.payload?.data || action.payload || [];
        state.contractReviews = Array.isArray(payload) ? payload : [];
      })
      .addCase(fetchReviewsByContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReviewsState, resetReviewSubmission } =
  reviewsSlice.actions;

export default reviewsSlice.reducer;
