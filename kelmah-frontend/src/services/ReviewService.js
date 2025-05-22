import api from './api';

class ReviewService {
  // Get reviews for a specific user
  async getUserReviews(userId, page = 1, limit = 10, reviewType = null) {
    try {
      let url = `/reviews/user/${userId}?page=${page}&limit=${limit}`;
      if (reviewType) {
        url += `&reviewType=${reviewType}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }

  // Get reviews for a specific job
  async getJobReviews(jobId) {
    try {
      const response = await api.get(`/reviews/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job reviews:', error);
      throw error;
    }
  }

  // Get review statistics for a user
  async getUserReviewStats(userId) {
    try {
      const response = await api.get(`/reviews/stats/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user review stats:', error);
      throw error;
    }
  }

  // Create a new review
  async createReview(reviewData) {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Update a review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
}

export default new ReviewService();
