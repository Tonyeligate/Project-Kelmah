import api from './axios';

const jobsApi = {
    getJobs: async (params) => {
        try {
            const response = await api.get('/api/jobs', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch jobs' };
        }
    },

    getJobById: async (id) => {
        try {
            const response = await api.get(`/api/jobs/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch job details' };
        }
    },

    applyForJob: async (jobId, applicationData) => {
        try {
            const response = await api.post(`/api/jobs/${jobId}/apply`, applicationData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to submit application' };
        }
    },

    createJob: async (jobData) => {
        try {
            const response = await api.post('/api/jobs', jobData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create job' };
        }
    },

    getJobApplications: async (jobId) => {
        try {
            const response = await api.get(`/api/jobs/${jobId}/applications`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch applications' };
        }
    },

    updateJobStatus: async (jobId, status) => {
        try {
            const response = await api.patch(`/api/jobs/${jobId}/status`, { status });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update job status' };
        }
    }
};

export default jobsApi; 