/**
 * Bid Service — Frontend API client for the bidding system
 *
 * DATA FLOW:
 *   Frontend component → bidApi method → GET/POST/PATCH /api/bids/* → Gateway → Job Service
 *
 * Per spec:
 *   - Max 5 bidders per job
 *   - Max 5 bids per worker per month
 *   - Bid amounts must be within job's min/max range
 *   - One bid per job per worker (modification allowed before deadline)
 */

import { api } from '../../../services/apiClient';

const bidApi = {
  /**
   * Submit a new bid on a job (worker only)
   * @param {Object} data - { job, bidAmount, estimatedDuration, coverLetter, portfolio?, availability? }
   */
  async createBid(data) {
    const response = await api.post('/bids', data);
    return response.data?.data || response.data;
  },

  /**
   * Get all bids for a specific job (hirer/admin)
   * @param {string} jobId
   * @param {Object} params - { page, limit, sort }
   */
  async getJobBids(jobId, params = {}) {
    const response = await api.get(`/bids/job/${jobId}`, { params });
    return response.data?.data || response.data;
  },

  /**
   * Get all bids submitted by a worker (own/admin)
   * @param {string} workerId
   * @param {Object} params - { page, limit, status }
   */
  async getWorkerBids(workerId, params = {}) {
    const response = await api.get(`/bids/worker/${workerId}`, { params });
    return response.data?.data || response.data;
  },

  /**
   * Get a single bid by ID
   * @param {string} bidId
   */
  async getBidById(bidId) {
    const response = await api.get(`/bids/${bidId}`);
    return response.data?.data || response.data;
  },

  /**
   * Accept a bid (hirer only — auto-rejects other bids for the job)
   * @param {string} bidId
   * @param {Object} data - { notes? }
   */
  async acceptBid(bidId, data = {}) {
    const response = await api.patch(`/bids/${bidId}/accept`, data);
    return response.data?.data || response.data;
  },

  /**
   * Reject a bid (hirer only)
   * @param {string} bidId
   * @param {Object} data - { reason? }
   */
  async rejectBid(bidId, data = {}) {
    const response = await api.patch(`/bids/${bidId}/reject`, data);
    return response.data?.data || response.data;
  },

  /**
   * Withdraw own bid (worker only)
   * @param {string} bidId
   * @param {Object} data - { reason? }
   */
  async withdrawBid(bidId, data = {}) {
    const response = await api.patch(`/bids/${bidId}/withdraw`, data);
    return response.data?.data || response.data;
  },

  /**
   * Modify a pending bid (worker only — before deadline)
   * @param {string} bidId
   * @param {Object} data - { bidAmount?, estimatedDuration?, coverLetter? }
   */
  async modifyBid(bidId, data) {
    const response = await api.patch(`/bids/${bidId}/modify`, data);
    return response.data?.data || response.data;
  },

  /**
   * Get worker's monthly bid statistics
   * @param {string} workerId
   * @returns {Object} { count, quota, remaining, tier }
   */
  async getWorkerBidStats(workerId) {
    const response = await api.get(`/bids/stats/worker/${workerId}`);
    return response.data?.data || response.data;
  },
};

export default bidApi;
