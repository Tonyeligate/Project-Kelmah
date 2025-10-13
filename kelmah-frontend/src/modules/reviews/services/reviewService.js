import { userServiceClient } from '../../common/services/axios';

/**
 * Review Service - Handles review management
 * Routes through User Service for review operations
 */
class ReviewService {
  /**
   * Get reviews for a specific worker with pagination and filters
   */
  async getUserReviews(userId, page = 1, limit = 10, filters = {}) {
    try {
      const response = await userServiceClient.get(`/reviews/worker/${userId}`, {
        params: { page, limit, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a specific job with pagination
   */
  async getJobReviews(jobId, page = 1, limit = 10) {
    try {
      const response = await userServiceClient.get(`/reviews/job/${jobId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching job reviews:', error);
      throw error;
    }
  }

  /**
   * Create a new review
   */
  async createReview(reviewData) {
    try {
      const response = await userServiceClient.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  /**
   * Update an existing review
   */
  async updateReview(reviewId, reviewData) {
    try {
      const response = await userServiceClient.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId) {
    try {
      const response = await userServiceClient.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  /**
   * Get a single review by ID
   */
  async getReview(reviewId) {
    try {
      const response = await userServiceClient.get(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review:', error);
      throw error;
    }
  }

  /**
   * Report a review as inappropriate
   */
  async reportReview(reviewId, reason) {
    try {
      const response = await userServiceClient.post(`/reviews/${reviewId}/report`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }

  /**
   * Get review statistics for a worker
   */
  async getReviewStats(userId) {
    try {
      const response = await userServiceClient.get(`/reviews/worker/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }
}

const reviewService = new ReviewService();
export default reviewService;
