import { api } from '../../../services/apiClient';
import { unwrapApiData } from '../../../services/responseNormalizer';
import { captureRecoverableApiError } from '../../../services/errorTelemetry';
import { devError } from '@/modules/common/utils/devLogger';

const CALENDAR_ENDPOINTS = ['/events', '/calendar/events'];

const shouldTryFallback = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 501 || status === 503;
};

const extractPayload = (response, defaultValue = null) =>
  unwrapApiData(response, { defaultValue });

const requestWithFallback = async (requestFactory) => {
  let lastError;

  for (let index = 0; index < CALENDAR_ENDPOINTS.length; index += 1) {
    const endpoint = CALENDAR_ENDPOINTS[index];
    try {
      const response = await requestFactory(endpoint);
      return extractPayload(response);
    } catch (error) {
      lastError = error;
      const canRetryWithFallback = index < CALENDAR_ENDPOINTS.length - 1 && shouldTryFallback(error);
      if (!canRetryWithFallback) {
        break;
      }
    }
  }

  throw lastError;
};

/**
 * Calendar events API service
 */
const eventsService = {
  /**
   * Get all events
   * @returns {Promise<Array>} - Promise with events data
   */
  getEvents: async () => {
    try {
      return await requestWithFallback((endpoint) => api.get(endpoint));
    } catch (error) {
      devError('Error fetching events:', error);
      captureRecoverableApiError(error, {
        operation: 'calendar.getEvents',
      });
      throw error;
    }
  },

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} - Promise with created event
   */
  createEvent: async (eventData) => {
    try {
      return await requestWithFallback((endpoint) => api.post(endpoint, eventData));
    } catch (error) {
      devError('Error creating event:', error);
      captureRecoverableApiError(error, {
        operation: 'calendar.createEvent',
      });
      throw error;
    }
  },

  /**
   * Update an existing event
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise<Object>} - Promise with updated event
   */
  updateEvent: async (eventId, eventData) => {
    try {
      return await requestWithFallback((endpoint) =>
        api.put(`${endpoint}/${eventId}`, eventData),
      );
    } catch (error) {
      devError('Error updating event:', error);
      captureRecoverableApiError(error, {
        operation: 'calendar.updateEvent',
      });
      throw error;
    }
  },

  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @returns {Promise<void>}
   */
  deleteEvent: async (eventId) => {
    try {
      return await requestWithFallback((endpoint) => api.delete(`${endpoint}/${eventId}`));
    } catch (error) {
      devError('Error deleting event:', error);
      captureRecoverableApiError(error, {
        operation: 'calendar.deleteEvent',
      });
      throw error;
    }
  },
};

export default eventsService;

