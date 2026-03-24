/**
 * Error handling utility functions
 */
import { devError } from '';

/**
 * Format error message from API response
 * @param {Error} error - Error object from API call
 * @returns {string} - Formatted error message
 */
export const formatApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'An unknown error occurred. Please try again.';
};

/**
 * Log error to monitoring service
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = 'general') => {
  devError(`[${context}]`, error);
  // In production, would send to error monitoring service
};
