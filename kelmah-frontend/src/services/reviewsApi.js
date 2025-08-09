/**
 * Reviews API Service
 * Handles all review and rating related API calls
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/environment';

// Create reviews service client
const reviewsServiceClient = axios.create({
  baseURL: `${API_BASE_URL}/api/reviews`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
reviewsServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
reviewsServiceClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Reviews API Error:', error);
    throw error.response?.data || error;
  }
);

const reviewsApi = {
  /**
   * Submit a new review for a worker
   */
  async submitReview(reviewData) {
    try {
      const response = await reviewsServiceClient.post('/', {
        workerId: reviewData.workerId,
        jobId: reviewData.jobId,
        ratings: reviewData.ratings,
        title: reviewData.title,
        comment: reviewData.comment,
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        jobCategory: reviewData.jobCategory,
        jobValue: reviewData.jobValue,
        projectDuration: reviewData.projectDuration,
        wouldRecommend: reviewData.wouldRecommend
      });
      return response;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error(`Failed to submit review: ${error.message}`);
    }
  },

  /**
   * Get reviews for a specific worker
   */
  async getWorkerReviews(workerId, params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        status: params.status || 'approved',
        ...(params.category && { category: params.category }),
        ...(params.minRating && { minRating: params.minRating }),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.order && { order: params.order })
      });

      const response = await reviewsServiceClient.get(`/worker/${workerId}?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching worker reviews:', error);
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
  },

  /**
   * Get worker rating summary and analytics
   */
  async getWorkerRating(workerId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ratings/worker/${workerId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching worker rating:', error);
      // Return default empty rating if not found
      if (error.response?.status === 404) {
        return {
          workerId,
          totalReviews: 0,
          averageRating: 0,
          ratings: {
            overall: 0,
            quality: 0,
            communication: 0,
            timeliness: 0,
            professionalism: 0
          },
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          categoryRatings: [],
          recommendationRate: 0,
          verifiedReviewsCount: 0,
          responseRate: 0,
          recentRating: 0,
          trendDirection: 'stable'
        };
      }
      throw new Error(`Failed to fetch worker rating: ${error.message}`);
    }
  },

  /**
   * Get specific review details
   */
  async getReview(reviewId) {
    try {
      const response = await reviewsServiceClient.get(`/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review:', error);
      throw new Error(`Failed to fetch review: ${error.message}`);
    }
  },

  /**
   * Add worker response to a review
   */
  async addWorkerResponse(reviewId, comment) {
    try {
      const response = await reviewsServiceClient.put(`/${reviewId}/response`, {
        comment: comment.trim()
      });
      return response;
    } catch (error) {
      console.error('Error adding worker response:', error);
      throw new Error(`Failed to add response: ${error.message}`);
    }
  },

  /**
   * Vote a review as helpful
   */
  async voteHelpful(reviewId) {
    try {
      const response = await reviewsServiceClient.post(`/${reviewId}/helpful`);
      return response;
    } catch (error) {
      console.error('Error voting review helpful:', error);
      throw new Error(`Failed to vote: ${error.message}`);
    }
  },

  /**
   * Report a review for moderation
   */
  async reportReview(reviewId, reason) {
    try {
      const response = await reviewsServiceClient.post(`/${reviewId}/report`, {
        reason
      });
      return response;
    } catch (error) {
      console.error('Error reporting review:', error);
      throw new Error(`Failed to report review: ${error.message}`);
    }
  },

  /**
   * Get review analytics (admin only)
   */
  async getReviewAnalytics() {
    try {
      const response = await reviewsServiceClient.get('/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching review analytics:', error);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
  },

  /**
   * Moderate a review (admin only)
   */
  async moderateReview(reviewId, status, moderationNote = '') {
    try {
      // Use admin endpoint via API Gateway
      const response = await axios.post(`${API_BASE_URL}/api/admin/reviews/${reviewId}/moderate`, {
        status,
        note: moderationNote
      });
      return response.data;
    } catch (error) {
      console.error('Error moderating review:', error);
      throw new Error(`Failed to moderate review: ${error.message}`);
    }
  },

  /**
   * Admin moderation queue
   */
  async getModerationQueue(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.status && { status: params.status }),
        ...(params.category && { category: params.category }),
        ...(params.minRating && { minRating: params.minRating })
      });
      const response = await axios.get(`${API_BASE_URL}/api/admin/reviews/queue?${queryParams}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      throw new Error(`Failed to fetch moderation queue: ${error.message}`);
    }
  },

  

  /**
   * Get top-rated workers by category
   */
  async getTopWorkersByCategory(category, limit = 10) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ratings/top-workers`, {
        params: { category, limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching top workers:', error);
      throw new Error(`Failed to fetch top workers: ${error.message}`);
    }
  },

  /**
   * Get review trends and insights
   */
  async getReviewTrends(timeRange = '30d') {
    try {
      const response = await reviewsServiceClient.get(`/trends?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review trends:', error);
      throw new Error(`Failed to fetch trends: ${error.message}`);
    }
  },

  /**
   * Search reviews by content
   */
  async searchReviews(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        page: filters.page || 1,
        limit: filters.limit || 20,
        ...(filters.workerId && { workerId: filters.workerId }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minRating && { minRating: filters.minRating }),
        ...(filters.verified && { verified: filters.verified })
      });

      const response = await reviewsServiceClient.get(`/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching reviews:', error);
      throw new Error(`Failed to search reviews: ${error.message}`);
    }
  },

  /**
   * Get worker review statistics for dashboard
   */
  async getWorkerReviewStats(workerId) {
    try {
      const [rating, recentReviews] = await Promise.all([
        this.getWorkerRating(workerId),
        this.getWorkerReviews(workerId, { limit: 5, sortBy: 'createdAt', order: 'desc' })
      ]);

      return {
        rating,
        recentReviews: recentReviews.reviews,
        summary: {
          totalReviews: rating.totalReviews,
          averageRating: rating.averageRating,
          recommendationRate: rating.recommendationRate,
          responseRate: rating.responseRate,
          trendDirection: rating.trendDirection
        }
      };
    } catch (error) {
      console.error('Error fetching worker review stats:', error);
      throw new Error(`Failed to fetch review stats: ${error.message}`);
    }
  },

  /**
   * Check if user can review a worker (based on completed job)
   */
  async canReviewWorker(workerId, jobId = null) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reviews/can-review`, {
        params: { workerId, jobId }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { canReview: false, reason: 'Unable to verify eligibility' };
    }
  },

  /**
   * Get review templates for quick submission
   */
  getReviewTemplates() {
    return {
      positive: {
        title: 'Excellent work quality',
        pros: ['Professional attitude', 'High quality work', 'Great communication'],
        cons: [],
        ratings: { overall: 5, quality: 5, communication: 5, timeliness: 5, professionalism: 5 }
      },
      neutral: {
        title: 'Good work with room for improvement',
        pros: ['Completed the job', 'Fair pricing'],
        cons: ['Could improve communication'],
        ratings: { overall: 3, quality: 3, communication: 3, timeliness: 3, professionalism: 3 }
      },
      negative: {
        title: 'Did not meet expectations',
        pros: [],
        cons: ['Poor communication', 'Delayed completion', 'Quality issues'],
        ratings: { overall: 2, quality: 2, communication: 2, timeliness: 2, professionalism: 2 }
      }
    };
  }
};

export default reviewsApi;