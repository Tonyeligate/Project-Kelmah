import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';
const BASE_URL = `${API_URL}/api/milestones`;

class MilestoneService {
  constructor() {
    this.axios = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token to requests
    this.axios.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Get all milestones for a contract
   * @param {string} contractId - The contract ID
   * @returns {Promise} - Promise with milestones data
   */
  async getMilestones(contractId) {
    try {
      const response = await this.axios.get(`/contract/${contractId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching milestones:', error);
      throw error;
    }
  }

  /**
   * Get a specific milestone
   * @param {string} milestoneId - The milestone ID
   * @returns {Promise} - Promise with milestone data
   */
  async getMilestone(milestoneId) {
    try {
      const response = await this.axios.get(`/${milestoneId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching milestone:', error);
      throw error;
    }
  }

  /**
   * Create a new milestone
   * @param {string} contractId - The contract ID
   * @param {Object} milestoneData - The milestone data
   * @returns {Promise} - Promise with created milestone
   */
  async createMilestone(contractId, milestoneData) {
    try {
      const response = await this.axios.post(`/contract/${contractId}`, milestoneData);
      return response.data;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }

  /**
   * Update a milestone
   * @param {string} milestoneId - The milestone ID
   * @param {Object} updateData - The data to update
   * @returns {Promise} - Promise with updated milestone
   */
  async updateMilestone(milestoneId, updateData) {
    try {
      const response = await this.axios.put(`/${milestoneId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  }

  /**
   * Delete a milestone
   * @param {string} milestoneId - The milestone ID
   * @returns {Promise} - Promise with success message
   */
  async deleteMilestone(milestoneId) {
    try {
      const response = await this.axios.delete(`/${milestoneId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }

  /**
   * Start working on a milestone (worker only)
   * @param {string} milestoneId - The milestone ID
   * @returns {Promise} - Promise with updated milestone
   */
  async startMilestone(milestoneId) {
    try {
      const response = await this.axios.put(`/${milestoneId}`, {
        status: 'in_progress'
      });
      return response.data;
    } catch (error) {
      console.error('Error starting milestone:', error);
      throw error;
    }
  }

  /**
   * Submit a milestone for review (worker only)
   * @param {string} milestoneId - The milestone ID
   * @param {string} submissionNotes - Notes about the submission
   * @param {Array} deliverables - Updated deliverables
   * @returns {Promise} - Promise with updated milestone
   */
  async submitMilestone(milestoneId, submissionNotes, deliverables) {
    try {
      const response = await this.axios.put(`/${milestoneId}`, {
        status: 'submitted',
        submissionNotes,
        deliverables
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting milestone:', error);
      throw error;
    }
  }

  /**
   * Approve a milestone (hirer only)
   * @param {string} milestoneId - The milestone ID
   * @param {string} feedback - Optional feedback
   * @returns {Promise} - Promise with updated milestone
   */
  async approveMilestone(milestoneId, feedback = '') {
    try {
      const response = await this.axios.put(`/${milestoneId}`, {
        status: 'approved',
        feedback
      });
      return response.data;
    } catch (error) {
      console.error('Error approving milestone:', error);
      throw error;
    }
  }

  /**
   * Reject a milestone (hirer only)
   * @param {string} milestoneId - The milestone ID
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Promise} - Promise with updated milestone
   */
  async rejectMilestone(milestoneId, rejectionReason) {
    try {
      const response = await this.axios.put(`/${milestoneId}`, {
        status: 'rejected',
        rejectionReason
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting milestone:', error);
      throw error;
    }
  }

  /**
   * Mark a milestone as paid (hirer only)
   * @param {string} milestoneId - The milestone ID
   * @returns {Promise} - Promise with updated milestone
   */
  async markMilestonePaid(milestoneId) {
    try {
      const response = await this.axios.patch(`/${milestoneId}/pay`);
      return response.data;
    } catch (error) {
      console.error('Error marking milestone as paid:', error);
      throw error;
    }
  }
}

export default new MilestoneService(); 