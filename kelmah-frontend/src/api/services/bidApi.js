/**
 * Bid API Service
 * Handles bidding system operations
 */

import apiClient from '../index';

class BidApi {
  /**
   * Create a new bid
   * @param {Object} bidData - Bid data
   * @param {string} bidData.jobId - Job ID
   * @param {number} bidData.bidAmount - Bid amount
   * @param {Object} bidData.estimatedDuration - Duration object
   * @param {string} bidData.coverLetter - Cover letter
   * @param {Array} bidData.portfolio - Portfolio items
   * @param {Object} bidData.availability - Availability object
   * @returns {Promise<Object>} Created bid data
   */
  async createBid(bidData) {
    const response = await apiClient.post('/bids', bidData);
    return response.data;
  }

  /**
   * Get all bids for a specific job
   * @param {string} jobId - Job ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Job bids
   */
  async getJobBids(jobId, params = {}) {
    const response = await apiClient.get(`/bids/job/${jobId}`, { params });
    return response.data;
  }

  /**
   * Get all bids by a specific worker
   * @param {string} workerId - Worker ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Worker bids
   */
  async getWorkerBids(workerId, params = {}) {
    const response = await apiClient.get(`/bids/worker/${workerId}`, { params });
    return response.data;
  }

  /**
   * Get a specific bid by ID
   * @param {string} bidId - Bid ID
   * @returns {Promise<Object>} Bid data
   */
  async getBidById(bidId) {
    const response = await apiClient.get(`/bids/${bidId}`);
    return response.data;
  }

  /**
   * Accept a bid
   * @param {string} bidId - Bid ID
   * @param {string} hirerNotes - Optional hirer notes
   * @returns {Promise<Object>} Updated bid data
   */
  async acceptBid(bidId, hirerNotes = '') {
    const response = await apiClient.patch(`/bids/${bidId}/accept`, { hirerNotes });
    return response.data;
  }

  /**
   * Reject a bid
   * @param {string} bidId - Bid ID
   * @param {string} hirerNotes - Optional hirer notes
   * @returns {Promise<Object>} Updated bid data
   */
  async rejectBid(bidId, hirerNotes = '') {
    const response = await apiClient.patch(`/bids/${bidId}/reject`, { hirerNotes });
    return response.data;
  }

  /**
   * Withdraw a bid
   * @param {string} bidId - Bid ID
   * @param {string} workerNotes - Optional worker notes
   * @returns {Promise<Object>} Updated bid data
   */
  async withdrawBid(bidId, workerNotes = '') {
    const response = await apiClient.patch(`/bids/${bidId}/withdraw`, { workerNotes });
    return response.data;
  }

  /**
   * Modify a bid
   * @param {string} bidId - Bid ID
   * @param {string} field - Field to modify
   * @param {*} newValue - New value
   * @param {string} reason - Reason for modification
   * @returns {Promise<Object>} Updated bid data
   */
  async modifyBid(bidId, field, newValue, reason = '') {
    const response = await apiClient.patch(`/bids/${bidId}/modify`, {
      field,
      newValue,
      reason
    });
    return response.data;
  }

  /**
   * Get worker's monthly bid statistics
   * @param {string} workerId - Worker ID
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {Promise<Object>} Bid statistics
   */
  async getWorkerBidStats(workerId, month = null, year = null) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    const response = await apiClient.get(`/bids/stats/worker/${workerId}`, { params });
    return response.data;
  }

  /**
   * Get expired bids (admin only)
   * @returns {Promise<Object>} Expired bids
   */
  async getExpiredBids() {
    const response = await apiClient.get('/bids/expired');
    return response.data;
  }

  /**
   * Clean up expired bids (admin only)
   * @returns {Promise<Object>} Cleanup response
   */
  async cleanupExpiredBids() {
    const response = await apiClient.patch('/bids/cleanup/expired');
    return response.data;
  }
}

export default new BidApi();
