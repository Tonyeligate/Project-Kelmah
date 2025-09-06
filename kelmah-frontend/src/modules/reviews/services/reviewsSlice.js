import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getApiBaseUrl } from '../../../config/environment';

// Create async thunk for submitting reviews
export const submitReview = createAsyncThunk(
  'reviews/submit',
  async (reviewData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const baseURL = await getApiBaseUrl();
      const response = await axios.post(`${baseURL}/api/reviews`, reviewData, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

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
    { rejectWithValue, getState },
  ) => {
    try {
      const { auth } = getState();

      const baseURL = await getApiBaseUrl();
      const response = await axios.get(`${baseURL}/api/reviews`, {
        params: {
          recipientId,
          recipientType,
          page,
          limit,
        },
        headers: {
          Authorization: `Bearer ${auth.token}`,
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
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const baseURL = await getApiBaseUrl();
      const response = await axios.get(
        `${baseURL}/api/reviews/contract/${contractId}`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        },
      );

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
        state.reviews = action.payload.reviews;
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.currentPage;
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
        state.contractReviews = action.payload;
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
