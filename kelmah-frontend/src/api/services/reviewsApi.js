/**
 * Reviews API Service
 * Handles user reviews and ratings
 */

import apiClient from '../index';

class ReviewsApi {
  /**
   * Get reviews for a worker
   * @param {string} workerId - Worker ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order ('asc' or 'desc')
   * @returns {Promise<Object>} Worker reviews
   */
  async getWorkerReviews(workerId, params = {}) {
    const response = await apiClient.get(`/reviews/workers/${workerId}`, {
      params,
    });
    return response.data;
  }

  /**
   * Get reviews for a hirer
   * @param {string} hirerId - Hirer ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order ('asc' or 'desc')
   * @returns {Promise<Object>} Hirer reviews
   */
  async getHirerReviews(hirerId, params = {}) {
    const response = await apiClient.get(`/reviews/hirers/${hirerId}`, {
      params,
    });
    return response.data;
  }

  /**
   * Get reviews written by current user
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Reviews written by user
   */
  async getMyReviews(params = {}) {
    const response = await apiClient.get('/reviews/my-reviews', { params });
    return response.data;
  }

  /**
   * Get a specific review
   * @param {string} reviewId - Review ID
   * @returns {Promise<Object>} Review data
   */
  async getReview(reviewId) {
    const response = await apiClient.get(`/reviews/${reviewId}`);
    return response.data;
  }

  /**
   * Create a review for a worker
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.workerId - Worker ID
   * @param {string} reviewData.jobId - Job ID
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @param {Array} reviewData.strengths - Worker strengths
   * @returns {Promise<Object>} Created review
   */
  async createWorkerReview(reviewData) {
    const response = await apiClient.post('/reviews/workers', reviewData);
    return response.data;
  }

  /**
   * Create a review for a hirer
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.hirerId - Hirer ID
   * @param {string} reviewData.jobId - Job ID
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @returns {Promise<Object>} Created review
   */
  async createHirerReview(reviewData) {
    const response = await apiClient.post('/reviews/hirers', reviewData);
    return response.data;
  }

  /**
   * Update a review
   * @param {string} reviewId - Review ID
   * @param {Object} reviewData - Updated review data
   * @returns {Promise<Object>} Updated review
   */
  async updateReview(reviewId, reviewData) {
    const response = await apiClient.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  }

  /**
   * Delete a review
   * @param {string} reviewId - Review ID
   * @returns {Promise<Object>} Deletion response
   */
  async deleteReview(reviewId) {
    const response = await apiClient.delete(`/reviews/${reviewId}`);
    return response.data;
  }

  /**
   * Report a review
   * @param {string} reviewId - Review ID
   * @param {Object} reportData - Report data
   * @param {string} reportData.reason - Report reason
   * @param {string} reportData.details - Additional details
   * @returns {Promise<Object>} Report response
   */
  async reportReview(reviewId, reportData) {
    const response = await apiClient.post(
      `/reviews/${reviewId}/report`,
      reportData,
    );
    return response.data;
  }

  /**
   * Get review summary for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} Review summary
   */
  async getWorkerReviewSummary(workerId) {
    const response = await apiClient.get(
      `/reviews/workers/${workerId}/summary`,
    );
    return response.data;
  }

  /**
   * Get review summary for a hirer
   * @param {string} hirerId - Hirer ID
   * @returns {Promise<Object>} Review summary
   */
  async getHirerReviewSummary(hirerId) {
    const response = await apiClient.get(`/reviews/hirers/${hirerId}/summary`);
    return response.data;
  }

  /**
   * Get pending reviews that user needs to write
   * @returns {Promise<Object>} Pending reviews to write
   */
  async getPendingReviews() {
    const response = await apiClient.get('/reviews/pending');
    return response.data;
  }

  /**
   * Create a new review
   * @param {Object} data - Review data
   */
  async createReview(data) {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  }

  /**
   * Get reviews for a specific worker
   * @param {string} workerId
   * @param {Object} params - pagination options
   */
  async getReviewsForWorker(workerId, params = {}) {
    const response = await apiClient.get(`/reviews/worker/${workerId}`, {
      params,
    });
    return response.data;
  }

  /**
   * Get reviews submitted by current user
   */
  async getMyReviews() {
    const response = await apiClient.get('/reviews/me');
    return response.data;
  }
}

export default new ReviewsApi();
