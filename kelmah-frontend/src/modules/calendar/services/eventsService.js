import gatewayClient from '../../common/services/axios';

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
      const response = await gatewayClient.get('/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
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
      const response = await gatewayClient.post('/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
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
      const response = await gatewayClient.put(
        `/api/events/${eventId}`,
        eventData,
      );
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
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
      await gatewayClient.delete(`/api/events/${eventId}`);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },
};

export default eventsService;
