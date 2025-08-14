import axiosInstance from '../../common/services/axios';

class ReviewService {
  // Get reviews for a specific user
  async getUserReviews(userId, page = 1, limit = 10, filters = {}) {
    try {
      // Call backend for reviews of a worker
      const response = await axiosInstance.get(
        `/api/reviews/worker/${userId}`,
        {
          params: { page, limit, ...filters },
        },
      );
      // Normalize backend response to { reviews, pagination }
      const raw = response.data;
      const reviews = raw?.data?.reviews || raw?.data || raw?.reviews || [];
      const pagination = raw?.data?.pagination || raw?.pagination || { page, limit, total: reviews.length, pages: 1 };
      return { reviews, pagination };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }

  // Get reviews for a specific job
  async getJobReviews(jobId, page = 1, limit = 10) {
    try {
      const response = await axiosInstance.get(`/api/reviews/job/${jobId}`, {
        params: { page, limit },
      });
      const raw = response.data;
      const reviews = raw.data || [];
      const pagination = raw.meta?.pagination || {};
      return { reviews, pagination };
    } catch (error) {
      console.error('Error fetching job reviews:', error);
      throw error;
    }
  }

  // Get review statistics for a user
  // Optionally implement stats endpoint when available

  // Create a new review
  async createReview(reviewData) {
    try {
      const response = await axiosInstance.post('/api/reviews', reviewData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Update a review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await axiosInstance.put(
        `/api/reviews/${reviewId}`,
        reviewData,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      await axiosInstance.delete(`/api/reviews/${reviewId}`);
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
}

export default new ReviewService();
