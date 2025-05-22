import api from '../api/axios';
import performanceService, { PerformanceService } from './PerformanceService';
import CacheService from './CacheService';

class ApiService {
    async get(endpoint, params = {}, useCache = false) {
        const startTime = performanceService.now();
        try {
            if (useCache) {
                const cacheKey = `${endpoint}${JSON.stringify(params)}`;
                const cachedData = CacheService.get(cacheKey);
                if (cachedData) return cachedData;
            }

            const response = await api.get(endpoint, { params });
            
            if (useCache) {
                const cacheKey = `${endpoint}${JSON.stringify(params)}`;
                CacheService.set(cacheKey, response.data);
            }

            performanceService.trackApiCall(endpoint, startTime);
            return response.data;
        } catch (error) {
            performanceService.trackError(endpoint, error);
            throw error;
        }
    }

    async post(endpoint, data) {
        const startTime = performanceService.now();
        try {
            const response = await api.post(endpoint, data);
            performanceService.trackApiCall(endpoint, startTime);
            return response.data;
        } catch (error) {
            performanceService.trackError(endpoint, error);
            throw error;
        }
    }

    async put(endpoint, data) {
        const startTime = performanceService.now();
        try {
            const response = await api.put(endpoint, data);
            performanceService.trackApiCall(endpoint, startTime);
            return response.data;
        } catch (error) {
            performanceService.trackError(endpoint, error);
            throw error;
        }
    }

    async delete(endpoint) {
        const startTime = performanceService.now();
        try {
            const response = await api.delete(endpoint);
            performanceService.trackApiCall(endpoint, startTime);
            return response.data;
        } catch (error) {
            performanceService.trackError(endpoint, error);
            throw error;
        }
    }

    // Calendar specific endpoints
    async createEvent(eventData) {
        return this.post('/api/events', eventData);
    }

    async updateEvent(eventId, eventData) {
        return this.put(`/api/events/${eventId}`, eventData);
    }

    async deleteEvent(eventId) {
        return this.delete(`/api/events/${eventId}`);
    }

    async getEvents(params) {
        return this.get('/api/events', params, true);
    }

    // Dashboard specific endpoints
    async getDashboardStats() {
        return this.get('/api/dashboard/stats');
    }

    // Job Applications endpoints
    async getJobApplications() {
        return this.get('/api/job-applications/worker');
    }

    async getJobApplicationDetails(applicationId) {
        return this.get(`/api/job-applications/${applicationId}`);
    }

    async updateJobApplication(applicationId, status) {
        return this.put(`/api/job-applications/${applicationId}`, { status });
    }

    async getJobApplicationFeedback(applicationId) {
        return this.get(`/api/job-applications/${applicationId}/feedback`);
    }

    // Skills Assessment endpoints
    async getWorkerSkills() {
        return this.get('/api/worker-profile/skills');
    }

    async getSkillAssessments() {
        return this.get('/api/worker-profile/assessments');
    }

    async startSkillAssessment(skillId) {
        return this.post('/api/worker-profile/assessments/start', { skillId });
    }

    async submitSkillAssessment(assessmentId, answers) {
        return this.post(`/api/worker-profile/assessments/${assessmentId}/submit`, { answers });
    }

    async getAssessmentResults(assessmentId) {
        return this.get(`/api/worker-profile/assessments/${assessmentId}/results`);
    }
}

export const apiService = new ApiService();

// Fraud Detection API
export const getFraudAlerts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await api.get(`/api/fraud-detection/alerts?${params.toString()}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching fraud alerts:', error);
    throw error;
  }
};

export const getFraudStats = async () => {
  try {
    const response = await api.get('/api/fraud-detection/stats', {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching fraud statistics:', error);
    throw error;
  }
};

export const getAlertDetails = async (alertId) => {
  try {
    const response = await api.get(`/api/fraud-detection/alerts/${alertId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching alert details:', error);
    throw error;
  }
};

export const resolveAlert = async (alertId, action) => {
  try {
    const response = await api.put(
      `/api/fraud-detection/alerts/${alertId}/resolve`, 
      { action },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
};