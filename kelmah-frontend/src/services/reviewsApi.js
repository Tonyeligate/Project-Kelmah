/**
 * Reviews API Service
 * Handles all review and rating related API calls
 */

import { userServiceClient, reviewsServiceClient } from '../modules/common/services/axios';
import { getApiBaseUrl } from '../config/environment';

const REVIEWS_BASE = '/api/reviews';

// Auth handled by centralized axios when using apiGet/apiPost; kept for direct calls

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
      const response = await userServiceClient.post(`${REVIEWS_BASE}/`, {
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
      // Backend wraps payload as { success, message, data }
      return response.data || response;
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

      const response = await userServiceClient.get(`${REVIEWS_BASE}/worker/${workerId}?${queryParams}`);
      const payload = response.data || response;
      if (payload?.data?.reviews) {
        return payload.data;
      }
      if (payload?.reviews) {
        return { reviews: payload.reviews, pagination: payload.pagination };
      }
      return { reviews: [], pagination: { page: params.page || 1, limit: params.limit || 10, total: 0, pages: 1 } };
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
      const response = await userServiceClient.get(`/api/ratings/worker/${workerId}`);
      return response.data?.data || response.data;
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
      const response = await userServiceClient.get(`${REVIEWS_BASE}/${reviewId}`);
      return response.data || response;
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
      const response = await userServiceClient.put(`${REVIEWS_BASE}/${reviewId}/response`, {
        comment: comment.trim()
      });
      return response.data || response;
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
      const response = await userServiceClient.post(`${REVIEWS_BASE}/${reviewId}/helpful`);
      return response.data || response;
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
      const response = await userServiceClient.post(`${REVIEWS_BASE}/${reviewId}/report`, {
        reason
      });
      return response.data || response;
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
      const response = await userServiceClient.get(`${REVIEWS_BASE}/analytics`);
      return response.data || response;
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
      const response = await userServiceClient.post(`/api/admin/reviews/${reviewId}/moderate`, {
        status,
        note: moderationNote
      });
      return response.data?.data || response.data;
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
      const response = await userServiceClient.get(`/api/admin/reviews/queue?${queryParams}`);
      return response.data?.data || response.data;
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
      const baseURL = await getApiBaseUrl();
      const response = await axios.get(`${baseURL}/api/ratings/top-workers`, {
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
      const response = await userServiceClient.get(`${REVIEWS_BASE}/trends?timeRange=${timeRange}`);
      return response.data || response;
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

      const response = await userServiceClient.get(`${REVIEWS_BASE}/search?${params}`);
      return response.data || response;
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
      const response = await userServiceClient.get(`${REVIEWS_BASE}/can-review`, {
        params: { workerId, jobId }
      });
      const payload = response.data || response;
      return payload?.data || payload;
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