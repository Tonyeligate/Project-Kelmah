import api from './axios';

const eventsApi = {
    getEvents: async () => {
        console.log('Starting getEvents request...');
        try {
            // Check if token exists
            const token = localStorage.getItem('token');
            console.log('Token exists:', !!token);
            
            const response = await api.get('/api/events');
            console.log('Events API response:', response.data);
            return response.data.events;
        } catch (error) {
            console.error('Error fetching events:', error);
            console.error('Response data:', error.response?.data);
            console.error('Status code:', error.response?.status);
            throw error.response?.data || { message: 'Failed to fetch events' };
        }
    },

    createEvent: async (eventData) => {
        try {
            const response = await api.post('/api/events', eventData);
            return response.data;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error.response?.data || { message: 'Failed to create event' };
        }
    },

    updateEvent: async (eventId, eventData) => {
        try {
            const response = await api.put(`/api/events/${eventId}`, eventData);
            return response.data;
        } catch (error) {
            console.error('Error updating event:', error);
            throw error.response?.data || { message: 'Failed to update event' };
        }
    },

    deleteEvent: async (eventId) => {
        try {
            const response = await api.delete(`/api/events/${eventId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error.response?.data || { message: 'Failed to delete event' };
        }
    }
};

export default eventsApi; 