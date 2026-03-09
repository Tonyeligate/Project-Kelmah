import { api } from '../../../services/apiClient';
// MED-19 FIX: Use shared websocketService instead of creating a third socket connection
import websocketService from '../../../services/websocketService';

const __DEV__ = import.meta.env.DEV;
const devLog = (...args) => { if (__DEV__) console.log(...args); };

/**
 * MED-20 FIX: Safe JWT decode utility (handles malformed tokens gracefully)
 */
function safeDecodeUserId(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.sub || payload.id || payload.userId || null;
  } catch {
    return null;
  }
}

/**
 * Dashboard service to handle dashboard data fetching and real-time updates.
 * MED-19: Reuses the shared websocketService singleton instead of creating its own Socket.IO connection.
 */
class DashboardService {
  constructor() {
    this.token = null;
    this.listeners = {};
    this.connected = false;
    this._overviewCache = null;
    this._overviewCacheTime = 0;
    // Bound handlers for removal
    this._onDashboardUpdate = (data) => this._triggerListeners('dashboardUpdate', data);
    this._onNewJob = (data) => this._triggerListeners('newJob', data);
    this._onStatusChange = (data) => this._triggerListeners('statusChange', data);
  }

  /**
   * Initialize the service with authentication token
   * @param {string} token - JWT token
   */
  initialize(token) {
    this.token = token;
  }

  /**
   * Subscribe to dashboard events on the shared socket
   */
  async connect() {
    if (this.connected) return;

    const socket = websocketService.socket;
    if (!socket) {
      devLog('⚠️ Dashboard: shared websocket not connected yet, deferring');
      return;
    }

    devLog('📡 Dashboard subscribing to shared websocket events');

    // Join dashboard channel using safely decoded user ID
    const userId = safeDecodeUserId(this.token);
    if (userId && socket.connected) {
      socket.emit('join:dashboard', userId);
    }

    // Subscribe to dashboard-specific events on the shared socket
    socket.on('dashboard:update', this._onDashboardUpdate);
    socket.on('dashboard:new-job', this._onNewJob);
    socket.on('dashboard:status-change', this._onStatusChange);
    this.connected = true;
  }

  /**
   * Unsubscribe from dashboard events (does NOT disconnect the shared socket)
   */
  disconnect() {
    const socket = websocketService.socket;
    if (!socket) return;

    const userId = safeDecodeUserId(this.token);
    if (userId && socket.connected) {
      socket.emit('leave:dashboard', userId);
    }

    socket.off('dashboard:update', this._onDashboardUpdate);
    socket.off('dashboard:new-job', this._onNewJob);
    socket.off('dashboard:status-change', this._onStatusChange);
    this._overviewCache = null;
    this._overviewCacheTime = 0;
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
        if (import.meta.env.DEV) console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Get dashboard overview data (cached for 5 seconds to avoid redundant API calls)
  async getOverview() {
    const now = Date.now();
    if (this._overviewCache && now - this._overviewCacheTime < 5000) {
      return this._overviewCache;
    }
    try {
      const [metricsRes, jobsRes, analyticsRes, workersRes] =
        await Promise.allSettled([
          api.get('/users/dashboard/metrics'),
          api.get('/jobs/dashboard'),
          api.get('/users/dashboard/analytics'),
          api.get('/users/dashboard/workers'),
        ]);

      const metrics =
        metricsRes.status === 'fulfilled'
          ? metricsRes.value.data?.data || metricsRes.value.data
          : {
            totalUsers: 0,
            totalWorkers: 0,
            activeWorkers: 0,
            totalJobs: 0,
            completedJobs: 0,
            growthRate: 0,
            source: 'fallback',
          };

      const jobsData =
        jobsRes.status === 'fulfilled'
          ? jobsRes.value.data?.data || jobsRes.value.data
          : { recentJobs: [], totalOpenJobs: 0, totalJobsToday: 0 };

      const analytics =
        analyticsRes.status === 'fulfilled'
          ? analyticsRes.value.data?.data || analyticsRes.value.data
          : { userGrowth: [], topSkills: [], trends: [] };

      const workers =
        workersRes.status === 'fulfilled'
          ? workersRes.value.data?.data?.items || workersRes.value.data?.data?.workers || workersRes.value.data?.workers || workersRes.value.data || []
          : [];

      const result = { metrics, jobs: jobsData, analytics, workers };
      this._overviewCache = result;
      this._overviewCacheTime = Date.now();
      return result;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching dashboard overview:', error);
      return {
        metrics: {
          totalUsers: 0,
          totalWorkers: 0,
          activeWorkers: 0,
          totalJobs: 0,
          completedJobs: 0,
          growthRate: 0,
          source: 'fallback-error',
        },
        jobs: { recentJobs: [], totalOpenJobs: 0, totalJobsToday: 0 },
        analytics: { userGrowth: [], topSkills: [], trends: [] },
        workers: [],
      };
    }
  }

  // Get recent activity
  async getRecentActivity(page = 1, limit = 10) {
    try {
      const response = await api.get('/users/profile/activity', {
        params: { page, limit },
      });
      const data = response.data?.data || response.data || {};
      const activities = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.entries)
          ? data.entries
          : Array.isArray(data)
            ? data
            : [];
      const pagination = data.pagination || response.data?.meta?.pagination || {};
      return {
        activities,
        hasMore:
          typeof pagination.hasNextPage === 'boolean'
            ? pagination.hasNextPage
            : activities.length >= limit,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching recent activity:', error);
      return {
        activities: [],
        hasMore: false,
      };
    }
  }

  // Get statistics
  async getStatistics(timeframe = 'week') {
    try {
      const response = await api.get('/users/dashboard/analytics', {
        params: { timeframe },
      });
      return response.data?.data || response.data || {};
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching statistics:', error);
      return {
        userGrowth: [],
        metrics: {},
        timeframe,
        fallback: true,
      };
    }
  }

  // MED-22 FIX: Return empty results — no real tasks API exists yet
  async getUpcomingTasks() {
    return [];
  }

  // Get recent messages
  async getRecentMessages() {
    try {
      const response = await api.get('/conversations', {
        params: { limit: 5 },
      });
      const conversations =
        response.data?.data || response.data?.conversations || response.data;
      if (Array.isArray(conversations)) {
        return conversations;
      }
      return [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching recent messages:', error);
      return [];
    }
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    try {
      const response = await api.get('/users/dashboard/analytics');
      const analytics = response.data?.data || response.data || {};
      return {
        completionRate: analytics.completionRate || 0,
        clientSatisfaction: analytics.clientSatisfaction || 0,
        averageResponseTime: analytics.averageResponseTime || 'N/A',
        jobsThisMonth: analytics.jobsThisMonth || 0,
        earningsThisMonth: analytics.earningsThisMonth || 0,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching performance metrics:', error);
      return {
        completionRate: 0,
        clientSatisfaction: 0,
        averageResponseTime: 'N/A',
        jobsThisMonth: 0,
        earningsThisMonth: 0,
        fallback: true,
      };
    }
  }

  // Get quick actions
  async getQuickActions() {
    try {
      const overview = await this.getOverview();
      const topJob = overview.jobs?.recentJobs?.[0];
      return [
        topJob
          ? {
            id: topJob.id || 'job-highlight',
            label: `Review ${topJob.title}`,
            type: 'job',
            source: 'jobs',
          }
          : {
            id: 'refresh-dashboard',
            label: 'Refresh dashboard data',
            type: 'action',
          },
        {
          id: 'update-profile',
          label: 'Update your profile details',
          type: 'profile',
        },
      ];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching quick actions:', error);
      return [
        {
          id: 'refresh-dashboard',
          label: 'Refresh dashboard data',
          type: 'action',
        },
      ];
    }
  }

  // Get notifications summary
  async getNotificationsSummary() {
    try {
      const overview = await this.getOverview();
      return {
        // Use dedicated fields from the metrics API when available;
        // fall back to 0 instead of misusing unrelated worker counts.
        unreadMessages: overview.metrics?.unreadMessages || 0,
        pendingJobs: overview.jobs?.totalOpenJobs || 0,
        newApplicants: overview.metrics?.newApplicants || overview.jobs?.totalJobsToday || 0,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching notifications summary:', error);
      return {
        unreadMessages: 0,
        pendingJobs: 0,
        newApplicants: 0,
      };
    }
  }

  // Get real-time stats
  async getRealTimeStats() {
    try {
      const overview = await this.getOverview();
      return overview.metrics || {};
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching real-time stats:', error);
      return {
        totalUsers: 0,
        totalWorkers: 0,
        activeWorkers: 0,
        totalJobs: 0,
        completedJobs: 0,
      };
    }
  }

  // Get job matches for workers
  async getJobMatches() {
    try {
      const response = await api.get('/jobs/recommendations');
      return response.data?.data || response.data || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching job matches:', error);
      return [];
    }
  }

  // Get personalized recommendations
  async getRecommendations() {
    try {
      const response = await api.get('/jobs/recommendations');
      return response.data?.data || response.data || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching recommendations:', error);
      return [];
    }
  }
}

const dashboardService = new DashboardService();

export default dashboardService;
