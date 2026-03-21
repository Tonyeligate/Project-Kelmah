import { api } from '../../../services/apiClient';

const CALENDAR_ENDPOINTS = ['/events', '/calendar/events'];

const shouldTryFallback = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 501 || status === 503;
};

const extractPayload = (response) => {
  const body = response?.data;

  if (body?.success === false) {
    const message = body?.error?.message || body?.message || 'Calendar request failed';
    const normalized = new Error(message);
    normalized.response = response;
    normalized.code = body?.error?.code;
    throw normalized;
  }

  if (body && Object.prototype.hasOwnProperty.call(body, 'data')) {
    return body.data;
  }

  return body;
};

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
      if (import.meta.env.DEV) console.error('Error fetching events:', error);
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
      if (import.meta.env.DEV) console.error('Error creating event:', error);
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
      if (import.meta.env.DEV) console.error('Error updating event:', error);
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
      if (import.meta.env.DEV) console.error('Error deleting event:', error);
      throw error;
    }
  },
};

export default eventsService;
