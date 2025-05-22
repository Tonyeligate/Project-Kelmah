import { apiService } from '../utils/apiUtils';

/**
 * Service for making API calls related to contracts
 */
export const contractService = {
  /**
   * Get all contracts with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of contract objects
   */
  getContracts: async (filters = {}) => {
    try {
      const data = await apiService.get('/api/contracts', filters);
      return data;
    } catch (error) {
      console.error('Error fetching contracts:', error);
      return [];
    }
  },

  /**
   * Get a contract by ID
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} - Contract object
   */
  getContractById: async (contractId) => {
    try {
      const data = await apiService.get(`/api/contracts/${contractId}`);
      return data;
    } catch (error) {
      console.error(`Error fetching contract ${contractId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new contract
   * @param {Object} contractData - Contract data to create
   * @returns {Promise<Object>} - Created contract object
   */
  createContract: async (contractData) => {
    try {
      const data = await apiService.post('/api/contracts', contractData);
      return data;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing contract
   * @param {string} contractId - Contract ID to update
   * @param {Object} contractData - Updated contract data
   * @returns {Promise<Object>} - Updated contract object
   */
  updateContract: async (contractId, contractData) => {
    try {
      const data = await apiService.put(`/api/contracts/${contractId}`, contractData);
      return data;
    } catch (error) {
      console.error(`Error updating contract ${contractId}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a contract
   * @param {string} contractId - Contract ID to delete
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteContract: async (contractId) => {
    try {
      const data = await apiService.delete(`/api/contracts/${contractId}`);
      return data;
    } catch (error) {
      console.error(`Error deleting contract ${contractId}:`, error);
      throw error;
    }
  },
  
  /**
   * Sign a contract
   * @param {string} contractId - Contract ID
   * @param {Object} signatureData - Signature data
   * @returns {Promise<Object>} - Signed contract object
   */
  signContract: async (contractId, signatureData) => {
    try {
      const data = await apiService.post(`/api/contracts/${contractId}/sign`, signatureData);
      return data;
    } catch (error) {
      console.error(`Error signing contract ${contractId}:`, error);
      throw error;
    }
  },
  
  /**
   * Send contract for signature
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} - Confirmation object
   */
  sendContractForSignature: async (contractId) => {
    try {
      const data = await apiService.post(`/api/contracts/${contractId}/send-for-signature`, {});
      return data;
    } catch (error) {
      console.error(`Error sending contract ${contractId} for signature:`, error);
      throw error;
    }
  },
  
  /**
   * Get contract milestones
   * @param {string} contractId - Contract ID
   * @returns {Promise<Array>} - Array of milestone objects
   */
  getContractMilestones: async (contractId) => {
    try {
      const data = await apiService.get(`/api/contracts/${contractId}/milestones`);
      return data;
    } catch (error) {
      console.error(`Error fetching milestones for contract ${contractId}:`, error);
      return [];
    }
  },
  
  /**
   * Create a contract milestone
   * @param {string} contractId - Contract ID
   * @param {Object} milestoneData - Milestone data
   * @returns {Promise<Object>} - Created milestone object
   */
  createMilestone: async (contractId, milestoneData) => {
    try {
      const data = await apiService.post(`/api/contracts/${contractId}/milestones`, milestoneData);
      return data;
    } catch (error) {
      console.error(`Error creating milestone for contract ${contractId}:`, error);
      throw error;
    }
  },
  
  /**
   * Update a milestone
   * @param {string} contractId - Contract ID
   * @param {string} milestoneId - Milestone ID
   * @param {Object} milestoneData - Updated milestone data
   * @returns {Promise<Object>} - Updated milestone object
   */
  updateMilestone: async (contractId, milestoneId, milestoneData) => {
    try {
      const data = await apiService.put(`/api/contracts/${contractId}/milestones/${milestoneId}`, milestoneData);
      return data;
    } catch (error) {
      console.error(`Error updating milestone ${milestoneId}:`, error);
      throw error;
    }
  },
  
  /**
   * Complete a milestone
   * @param {string} contractId - Contract ID
   * @param {string} milestoneId - Milestone ID
   * @param {Object} completionData - Completion data
   * @returns {Promise<Object>} - Completed milestone object
   */
  completeMilestone: async (contractId, milestoneId, completionData = {}) => {
    try {
      const data = await apiService.post(`/api/contracts/${contractId}/milestones/${milestoneId}/complete`, completionData);
      return data;
    } catch (error) {
      console.error(`Error completing milestone ${milestoneId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get contract templates
   * @returns {Promise<Array>} - Array of template objects
   */
  getContractTemplates: async () => {
    try {
      const data = await apiService.get('/api/contracts/templates');
      return data;
    } catch (error) {
      console.error('Error fetching contract templates:', error);
      return [];
    }
  },
  
  /**
   * Get contract template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} - Template object
   */
  getContractTemplateById: async (templateId) => {
    try {
      const data = await apiService.get(`/api/contracts/templates/${templateId}`);
      return data;
    } catch (error) {
      console.error(`Error fetching contract template ${templateId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new contract template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} - Created template object
   */
  createContractTemplate: async (templateData) => {
    try {
      const data = await apiService.post('/api/contracts/templates', templateData);
      return data;
    } catch (error) {
      console.error('Error creating contract template:', error);
      throw error;
    }
  },
  
  /**
   * Create contract from template
   * @param {string} templateId - Template ID
   * @param {Object} contractData - Contract data
   * @returns {Promise<Object>} - Created contract object
   */
  createFromTemplate: async (templateId, contractData) => {
    try {
      const data = await apiService.post(`/api/contracts/templates/${templateId}/create`, contractData);
      return data;
    } catch (error) {
      console.error(`Error creating contract from template ${templateId}:`, error);
      throw error;
    }
  },
  
  /**
   * Cancel contract
   * @param {string} contractId - Contract ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Cancelled contract object
   */
  cancelContract: async (contractId, reason) => {
    try {
      const data = await apiService.post(`/api/contracts/${contractId}/cancel`, { reason });
      return data;
    } catch (error) {
      console.error(`Error cancelling contract ${contractId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a dispute for contract
   * @param {string} contractId - Contract ID
   * @param {Object} disputeData - Dispute data
   * @returns {Promise<Object>} - Created dispute object
   */
  createDispute: async (contractId, disputeData) => {
    try {
      const data = await apiService.post(`/api/contracts/${contractId}/disputes`, disputeData);
      return data;
    } catch (error) {
      console.error(`Error creating dispute for contract ${contractId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get dispute by ID
   * @param {string} disputeId - Dispute ID
   * @returns {Promise<Object>} - Dispute object
   */
  getDisputeById: async (disputeId) => {
    try {
      const data = await apiService.get(`/api/disputes/${disputeId}`);
      return data;
    } catch (error) {
      console.error(`Error fetching dispute ${disputeId}:`, error);
      throw error;
    }
  },
  
  /**
   * Download contract as PDF
   * @param {string} contractId - Contract ID
   * @returns {Promise<Blob>} - PDF blob
   */
  downloadContract: async (contractId) => {
    try {
      const response = await apiService.get(`/api/contracts/${contractId}/download`, {}, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error(`Error downloading contract ${contractId}:`, error);
      throw error;
    }
  }
};

export default contractService; 