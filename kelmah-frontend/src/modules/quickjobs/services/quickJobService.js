/**
 * QuickJob Service - Protected Quick-Hire System
 * Frontend API service for quick job operations
 */

import { api } from '../../../services/apiClient';

const API_BASE = '/quick-jobs';

/**
 * Service categories available for quick jobs
 */
export const SERVICE_CATEGORIES = [
  { id: 'plumbing', name: 'Plumbing', icon: '🔧', nameGh: 'Plumber' },
  { id: 'electrical', name: 'Electrical', icon: '⚡', nameGh: 'Electrician' },
  { id: 'carpentry', name: 'Carpentry', icon: '🪚', nameGh: 'Carpenter' },
  { id: 'masonry', name: 'Masonry', icon: '🧱', nameGh: 'Mason' },
  { id: 'painting', name: 'Painting', icon: '🎨', nameGh: 'Painter' },
  { id: 'welding', name: 'Welding', icon: '🔥', nameGh: 'Welder' },
  { id: 'tailoring', name: 'Tailoring', icon: '🧵', nameGh: 'Tailor' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', nameGh: 'Cleaner' },
  { id: 'hvac', name: 'AC & Refrigeration', icon: '❄️', nameGh: 'AC Tech' },
  { id: 'roofing', name: 'Roofing', icon: '🏠', nameGh: 'Roofer' },
  { id: 'tiling', name: 'Tiling', icon: '🔲', nameGh: 'Tiler' },
  { id: 'general_repair', name: 'General Repair', icon: '🔨', nameGh: 'Handyman' },
  { id: 'other', name: 'Other', icon: '📋', nameGh: 'Skilled Worker' }
];

/**
 * Urgency levels for jobs
 */
export const URGENCY_LEVELS = [
  { id: 'emergency', name: 'Emergency', description: 'Need someone right now!', color: 'error' },
  { id: 'soon', name: 'Soon', description: 'Within a few hours', color: 'warning' },
  { id: 'flexible', name: 'Flexible', description: 'Anytime today/tomorrow', color: 'success' }
];

/**
 * Create a new quick job request
 * @param {Object} jobData - Job details
 * @returns {Promise<Object>} Created job
 */
export const createQuickJob = async (jobData) => {
  const response = await api.post(API_BASE, jobData);
  return response.data;
};

/**
 * Get quick jobs near a location (for workers)
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {number} maxDistance - Max distance in km (default 10)
 * @param {string} category - Optional category filter
 * @returns {Promise<Object>} Nearby jobs
 */
export const getNearbyQuickJobs = async (lng, lat, maxDistance = 10, category = null) => {
  const params = { lng, lat, maxDistance };
  if (category) params.category = category;
  
  const response = await api.get(`${API_BASE}/nearby`, { params });
  return response.data;
};

/**
 * Get client's own quick jobs
 * @param {string} status - Optional status filter
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Jobs with pagination
 */
export const getMyQuickJobs = async (status = null, page = 1, limit = 20) => {
  const params = { page, limit };
  if (status) params.status = status;
  
  const response = await api.get(`${API_BASE}/my-jobs`, { params });
  return response.data;
};

/**
 * Get jobs where worker has quoted or been accepted
 * @param {string} status - Optional status filter
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Quoted jobs with pagination
 */
export const getMyQuotedJobs = async (status = null, page = 1, limit = 20) => {
  const params = { page, limit };
  if (status) params.status = status;
  
  const response = await api.get(`${API_BASE}/my-quotes`, { params });
  return response.data;
};

/**
 * Get a single quick job by ID
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job details
 */
export const getQuickJob = async (jobId) => {
  const response = await api.get(`${API_BASE}/${jobId}`);
  return response.data;
};

/**
 * Submit a quote for a job (worker)
 * @param {string} jobId - Job ID
 * @param {Object} quoteData - Quote details
 * @returns {Promise<Object>} Submitted quote
 */
export const submitQuote = async (jobId, quoteData) => {
  const response = await api.post(`${API_BASE}/${jobId}/quote`, quoteData);
  return response.data;
};

/**
 * Accept a quote (client)
 * @param {string} jobId - Job ID
 * @param {string} quoteId - Quote ID to accept
 * @returns {Promise<Object>} Acceptance result
 */
export const acceptQuote = async (jobId, quoteId) => {
  const response = await api.post(`${API_BASE}/${jobId}/accept-quote`, { quoteId });
  return response.data;
};

/**
 * Mark worker is on the way
 * @param {string} jobId - Job ID
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 * @returns {Promise<Object>} Status update result
 */
export const markOnWay = async (jobId, latitude, longitude) => {
  const response = await api.post(`${API_BASE}/${jobId}/on-way`, { latitude, longitude });
  return response.data;
};

/**
 * Mark worker has arrived (GPS verified)
 * @param {string} jobId - Job ID
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 * @returns {Promise<Object>} Arrival verification result
 */
export const markArrived = async (jobId, latitude, longitude) => {
  const response = await api.post(`${API_BASE}/${jobId}/arrived`, { latitude, longitude });
  return response.data;
};

/**
 * Mark work has started
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Start result
 */
export const startWork = async (jobId) => {
  const response = await api.post(`${API_BASE}/${jobId}/start`);
  return response.data;
};

/**
 * Mark work as complete (with photos)
 * @param {string} jobId - Job ID
 * @param {Array} photos - Completion photos [{url: string}]
 * @param {string} note - Optional worker note
 * @param {number} latitude - Optional current latitude
 * @param {number} longitude - Optional current longitude
 * @returns {Promise<Object>} Completion result
 */
export const markComplete = async (jobId, photos, note = '', latitude = null, longitude = null) => {
  const response = await api.post(`${API_BASE}/${jobId}/complete`, {
    photos,
    note,
    latitude,
    longitude
  });
  return response.data;
};

/**
 * Approve work and release payment (client)
 * @param {string} jobId - Job ID
 * @param {number} rating - Rating 1-5
 * @param {string} review - Optional review text
 * @returns {Promise<Object>} Approval result
 */
export const approveWork = async (jobId, rating, review = '') => {
  const response = await api.post(`${API_BASE}/${jobId}/approve`, { rating, review });
  return response.data;
};

/**
 * Raise a dispute
 * @param {string} jobId - Job ID
 * @param {string} reason - Dispute reason
 * @param {string} description - Detailed description
 * @param {Array} evidence - Evidence items
 * @returns {Promise<Object>} Dispute result
 */
export const raiseDispute = async (jobId, reason, description, evidence = []) => {
  const response = await api.post(`${API_BASE}/${jobId}/dispute`, {
    reason,
    description,
    evidence
  });
  return response.data;
};

/**
 * Cancel a quick job
 * @param {string} jobId - Job ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancellation result
 */
export const cancelQuickJob = async (jobId, reason = '') => {
  const response = await api.post(`${API_BASE}/${jobId}/cancel`, { reason });
  return response.data;
};

/**
 * Get user's current location using browser geolocation API
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Please enable location access to use this feature';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Format currency for Ghana Cedis
 * @param {number} amount - Amount in GH₵
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return `GH₵${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Calculate platform fee (15%)
 * @param {number} amount - Job amount
 * @returns {{platformFee: number, workerPayout: number}}
 */
export const calculateFees = (amount) => {
  const platformFee = Math.round(amount * 0.15 * 100) / 100;
  const workerPayout = amount - platformFee;
  return { platformFee, workerPayout };
};

export default {
  SERVICE_CATEGORIES,
  URGENCY_LEVELS,
  createQuickJob,
  getNearbyQuickJobs,
  getMyQuickJobs,
  getMyQuotedJobs,
  getQuickJob,
  submitQuote,
  acceptQuote,
  markOnWay,
  markArrived,
  startWork,
  markComplete,
  approveWork,
  raiseDispute,
  cancelQuickJob,
  getCurrentLocation,
  formatCurrency,
  calculateFees
};
