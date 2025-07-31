import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service client - temporarily using AUTH_SERVICE until JOB_SERVICE is deployed
const jobServiceClient = axios.create({
  baseURL: SERVICES.AUTH_SERVICE, // Will be SERVICES.JOB_SERVICE when deployed
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth tokens to requests
jobServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Comprehensive mock jobs data
const mockJobsData = {
  jobs: [],
  totalPages: 2,
  totalJobs: 8,
};

// Data transformation helpers
const transformJobListItem = (job) => {
  if (!job) return null;

  return {
    id: job.id,
    title: job.title,
    description: job.description?.substring(0, 150) + '...',
    category: job.category,
    subcategory: job.subcategory,
    type: job.type,
    budget: job.budget,
    currency: job.currency,
    status: job.status,
    location: job.location,
    skills: job.skills || [],
  };
};
};

export default jobsApi;
