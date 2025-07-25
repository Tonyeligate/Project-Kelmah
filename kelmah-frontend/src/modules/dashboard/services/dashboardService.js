import axios from 'axios';
import { API_BASE_URL } from '../../../config/constants';
import { io } from 'socket.io-client';

/**
 * Dashboard service to handle dashboard data fetching and real-time updates
 */
class DashboardService {
  constructor() {
    this.token = null;
    this.socket = null;
    this.listeners = {};
    this.connected = false;
  }

  /**
   * Initialize the service with authentication token
   * @param {string} token - JWT token
   */
  initialize(token) {
    this.token = token;
  }

  /**
   * Initialize WebSocket connection for dashboard
   */
  connect() {
    if (this.socket) return;

    if (!this.token) return;

    this.socket = io(API_BASE_URL, {
      auth: { token: this.token },
      path: '/ws',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Dashboard socket connected');

      // Join dashboard channel
      const userId = JSON.parse(atob(this.token.split('.')[1])).sub;
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

    if (this.token) {
      const userId = JSON.parse(atob(this.token.split('.')[1])).sub;
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
      (cb) => cb !== callback,
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

  // Get dashboard overview data
  async getOverview() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/overview`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }

  // Get recent activity
  async getRecentActivity(page = 1, limit = 10) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/activity`,
        {
          params: { page, limit },
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  // Get statistics
  async getStatistics(timeframe = 'week') {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/statistics`,
        {
          params: { timeframe },
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  // Get upcoming tasks
  async getUpcomingTasks() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/tasks`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      throw error;
    }
  }

  // Get recent messages
  async getRecentMessages() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/messages`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      throw error;
    }
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/performance`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  // Get quick actions
  async getQuickActions() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/quick-actions`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      throw error;
    }
  }

  // Get notifications summary
  async getNotificationsSummary() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/notifications-summary`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notifications summary:', error);
      throw error;
    }
  }

  // Get real-time stats
  async getRealTimeStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
      throw error;
    }
  }
}

const dashboardService = new DashboardService();

export default dashboardService;
