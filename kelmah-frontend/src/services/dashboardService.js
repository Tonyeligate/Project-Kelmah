import api from '../api/axios';
import { io } from 'socket.io-client';
import { getAuthToken } from './authService';

/**
 * Dashboard service to handle dashboard data fetching and real-time updates
 */
class DashboardService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.connected = false;
  }

  /**
   * Initialize WebSocket connection for dashboard
   */
  connect() {
    if (this.socket) return;

    const token = getAuthToken();
    if (!token) return;

    // Get the base URL from the API configuration
    const baseUrl = api.defaults.baseURL || 'http://localhost:8080';
    
    this.socket = io(baseUrl, {
      auth: { token },
      path: '/ws',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Dashboard socket connected');
      
      // Join dashboard channel
      const userId = JSON.parse(atob(token.split('.')[1])).sub;
      this.socket.emit('join:dashboard', userId);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Dashboard socket disconnected');
    });

    // Setup listeners for different dashboard events
    this.socket.on('dashboard:update', (data) => {
      this._triggerListeners('dashboardUpdate', data);
    });

    this.socket.on('dashboard:new-job', (data) => {
      this._triggerListeners('newJob', data);
    });

    this.socket.on('dashboard:status-change', (data) => {
      this._triggerListeners('statusChange', data);
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (!this.socket) return;
    
    const token = getAuthToken();
    if (token) {
      const userId = JSON.parse(atob(token.split('.')[1])).sub;
      this.socket.emit('leave:dashboard', userId);
    }
    
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback
    );
  }

  /**
   * Trigger registered listeners for an event
   * @private
   */
  _triggerListeners(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Fetch dashboard data from API
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData() {
    const response = await api.get('/api/dashboard');
    return response.data;
  }

  /**
   * Get real-time stats
   * @returns {Promise<Object>} Stats data
   */
  async getRealTimeStats() {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  }
}

// Create a singleton instance
const dashboardService = new DashboardService();

export default dashboardService; 