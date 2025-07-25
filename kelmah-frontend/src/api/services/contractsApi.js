/**
 * Contracts API Service
 * Handles job contracts and agreements
 */

import apiClient from '../index';

class ContractsApi {
  /**
   * Get all contracts for current user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @param {string} params.status - Filter by status
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order ('asc' or 'desc')
   * @returns {Promise<Object>} Contracts data
   */
  async getContracts(params = {}) {
    const response = await apiClient.get('/contracts', { params });
    return response.data;
  }

  /**
   * Get a specific contract
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} Contract data
   */
  async getContract(contractId) {
    const response = await apiClient.get(`/contracts/${contractId}`);
    return response.data;
  }

  /**
   * Create a new contract
   * @param {Object} contractData - Contract data
   * @param {string} contractData.jobId - Job ID
   * @param {string} contractData.workerId - Worker ID
   * @param {number} contractData.amount - Contract amount
   * @param {string} contractData.startDate - Start date
   * @param {string} contractData.endDate - End date (optional)
   * @param {string} contractData.description - Contract description
   * @param {Array} contractData.terms - Contract terms
   * @returns {Promise<Object>} Created contract
   */
  async createContract(contractData) {
    const response = await apiClient.post('/contracts', contractData);
    return response.data;
  }

  /**
   * Update a contract
   * @param {string} contractId - Contract ID
   * @param {Object} contractData - Updated contract data
   * @returns {Promise<Object>} Updated contract
   */
  async updateContract(contractId, contractData) {
    const response = await apiClient.put(
      `/contracts/${contractId}`,
      contractData,
    );
    return response.data;
  }

  /**
   * Accept a contract
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} Updated contract
   */
  async acceptContract(contractId) {
    const response = await apiClient.put(`/contracts/${contractId}/accept`);
    return response.data;
  }

  /**
   * Reject a contract
   * @param {string} contractId - Contract ID
   * @param {Object} rejectionData - Rejection data
   * @param {string} rejectionData.reason - Rejection reason
   * @returns {Promise<Object>} Updated contract
   */
  async rejectContract(contractId, rejectionData) {
    const response = await apiClient.put(
      `/contracts/${contractId}/reject`,
      rejectionData,
    );
    return response.data;
  }

  /**
   * Cancel a contract
   * @param {string} contractId - Contract ID
   * @param {Object} cancellationData - Cancellation data
   * @param {string} cancellationData.reason - Cancellation reason
   * @returns {Promise<Object>} Updated contract
   */
  async cancelContract(contractId, cancellationData) {
    const response = await apiClient.put(
      `/contracts/${contractId}/cancel`,
      cancellationData,
    );
    return response.data;
  }

  /**
   * Mark contract as completed
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} Updated contract
   */
  async completeContract(contractId) {
    const response = await apiClient.put(`/contracts/${contractId}/complete`);
    return response.data;
  }

  /**
   * Add a milestone to a contract
   * @param {string} contractId - Contract ID
   * @param {Object} milestoneData - Milestone data
   * @returns {Promise<Object>} Updated contract
   */
  async addMilestone(contractId, milestoneData) {
    const response = await apiClient.post(
      `/contracts/${contractId}/milestones`,
      milestoneData,
    );
    return response.data;
  }

  /**
   * Update a milestone
   * @param {string} contractId - Contract ID
   * @param {string} milestoneId - Milestone ID
   * @param {Object} milestoneData - Updated milestone data
   * @returns {Promise<Object>} Updated contract
   */
  async updateMilestone(contractId, milestoneId, milestoneData) {
    const response = await apiClient.put(
      `/contracts/${contractId}/milestones/${milestoneId}`,
      milestoneData,
    );
    return response.data;
  }

  /**
   * Complete a milestone
   * @param {string} contractId - Contract ID
   * @param {string} milestoneId - Milestone ID
   * @returns {Promise<Object>} Updated contract
   */
  async completeMilestone(contractId, milestoneId) {
    const response = await apiClient.put(
      `/contracts/${contractId}/milestones/${milestoneId}/complete`,
    );
    return response.data;
  }

  /**
   * Get contract templates
   * @returns {Promise<Object>} Contract templates
   */
  async getContractTemplates() {
    const response = await apiClient.get('/contracts/templates');
    return response.data;
  }

  /**
   * Generate a contract from template
   * @param {Object} templateData - Template data
   * @param {string} templateData.templateId - Template ID
   * @param {string} templateData.jobId - Job ID
   * @param {string} templateData.workerId - Worker ID
   * @returns {Promise<Object>} Generated contract
   */
  async generateFromTemplate(templateData) {
    const response = await apiClient.post('/contracts/generate', templateData);
    return response.data;
  }

  /**
   * Get contract disputes
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Contract disputes
   */
  async getDisputes(params = {}) {
    const response = await apiClient.get('/contracts/disputes', { params });
    return response.data;
  }

  /**
   * Create a contract dispute
   * @param {string} contractId - Contract ID
   * @param {Object} disputeData - Dispute data
   * @returns {Promise<Object>} Created dispute
   */
  async createDispute(contractId, disputeData) {
    const response = await apiClient.post(
      `/contracts/${contractId}/disputes`,
      disputeData,
    );
    return response.data;
  }

  /**
   * Get a specific dispute
   * @param {string} disputeId - Dispute ID
   * @returns {Promise<Object>} Dispute data
   */
  async getDispute(disputeId) {
    const response = await apiClient.get(`/contracts/disputes/${disputeId}`);
    return response.data;
  }

  /**
   * Add message to a dispute
   * @param {string} disputeId - Dispute ID
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Updated dispute
   */
  async addDisputeMessage(disputeId, messageData) {
    const response = await apiClient.post(
      `/contracts/disputes/${disputeId}/messages`,
      messageData,
    );
    return response.data;
  }

  /**
   * Get a contract by ID
   */
  async getContractById(contractId) {
    const response = await apiClient.get(`/contracts/${contractId}`);
    return response.data;
  }

  /**
   * Get contracts for current user
   * @param {Object} params - pagination params
   */
  async getMyContracts(params = {}) {
    const response = await apiClient.get('/contracts', { params });
    return response.data;
  }
}

export default new ContractsApi();
