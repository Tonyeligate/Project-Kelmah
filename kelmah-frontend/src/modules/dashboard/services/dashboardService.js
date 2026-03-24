import { api } from '../../../services/apiClient';
// MED-19 FIX: Use shared websocketService instead of creating a third socket connection
import websocketService from '../../../services/websocketService';
import { SOCKET_EVENTS } from '../../../services/socketEvents';
import {
  createFeatureLogger,
  devError,
} from '@/modules/common/utils/devLogger';

const devLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_DASHBOARD',
  level: 'log',
});

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

  async getSummary() {
    try {
      const response = await api.get('/dashboard/summary');
      return response.data?.data || response.data || {};
    } catch (error) {
      devError('Error fetching dashboard summary:', error);
      const overview = await this.getOverview();
      const [recentActivity, recentMessages] = await Promise.all([
        this.getRecentActivity(1, 10),
        this.getRecentMessages(),
      ]);
      const performanceMetrics = {
        completionRate: overview.analytics?.completionRate || 0,
        clientSatisfaction: overview.analytics?.clientSatisfaction || 0,
        averageResponseTime: overview.analytics?.averageResponseTime || 'N/A',
        jobsThisMonth: overview.analytics?.jobsThisMonth || 0,
        earningsThisMonth: overview.analytics?.earningsThisMonth || 0,
      };
      const topJob = overview.jobs?.recentJobs?.[0];

      return {
        overview,
        recentActivity,
        statistics: overview.analytics || {},
        upcomingTasks: [],
        recentMessages,
        performanceMetrics,
        quickActions: topJob
          ? [
            {
              id: topJob.id || topJob._id || 'job-highlight',
              label: `Review ${topJob.title}`,
              type: 'job',
              source: 'jobs',
            },
            {
              id: 'update-profile',
              label: 'Update your profile details',
              type: 'profile',
            },
          ]
          : [
            {
              id: 'refresh-dashboard',
              label: 'Refresh dashboard data',
              type: 'action',
            },
          ],
        notificationsSummary: {
          unreadMessages: overview.metrics?.unreadMessages || 0,
          pendingJobs: overview.jobs?.totalOpenJobs || 0,
          newApplicants: overview.metrics?.newApplicants || overview.jobs?.totalJobsToday || 0,
        },
        realTimeStats: overview.metrics || {},
      };
    }
  }

  /**
   * Subscribe to dashboard events on the shared socket
   */
  async connect() {
    if (this.connected) return;

    const socket = websocketService.socket;
    if (!socket) {
      devLog('Dashboard: shared websocket not connected yet, deferring');
      return;
    }

    devLog('Dashboard subscribing to shared websocket events');

    // Subscribe to dashboard-specific events on the shared socket
    socket.on(SOCKET_EVENTS.DASHBOARD.UPDATE, this._onDashboardUpdate);
    socket.on(SOCKET_EVENTS.DASHBOARD.NEW_JOB, this._onNewJob);
    socket.on(SOCKET_EVENTS.DASHBOARD.STATUS_CHANGE, this._onStatusChange);
    this.connected = true;
  }

  /**
   * Unsubscribe from dashboard events (does NOT disconnect the shared socket)
   */
  disconnect() {
    const socket = websocketService.socket;
    if (!socket) return;

    socket.off(SOCKET_EVENTS.DASHBOARD.UPDATE, this._onDashboardUpdate);
    socket.off(SOCKET_EVENTS.DASHBOARD.NEW_JOB, this._onNewJob);
    socket.off(SOCKET_EVENTS.DASHBOARD.STATUS_CHANGE, this._onStatusChange);
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
    // Guard against duplicate listeners to prevent memory leaks
    if (this.listeners[event].includes(callback)) return;
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
          devError(`Error in ${event} listener:`, error);
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
        devError('Error fetching dashboard overview:', error);
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
      devError('Error fetching recent activity:', error);
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
      devError('Error fetching statistics:', error);
      return {
        userGrowth: [],
        metrics: {},
        timeframe,
        fallback: true,
      };
    }
  }

  // MED-22 FIX: Return empty results - no real tasks API exists yet
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
        devError('Error fetching recent messages:', error);
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
        devError('Error fetching performance metrics:', error);
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
        devError('Error fetching quick actions:', error);
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
      devError('Error fetching notifications summary:', error);
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
      devError('Error fetching real-time stats:', error);
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
      const response = await api.get('/jobs/recommendations/personalized');
      return response.data?.data || response.data || [];
    } catch (error) {
      try {
        const fallback = await api.get('/jobs/recommendations');
        return fallback.data?.data || fallback.data || [];
      } catch (_) {
        // Fall through to the stable empty payload below.
      }
      devError('Error fetching job matches:', error);
      return [];
    }
  }

  // Get personalized recommendations
  async getRecommendations() {
    try {
      const response = await api.get('/jobs/recommendations/personalized');
      return response.data?.data || response.data || [];
    } catch (error) {
      try {
        const fallback = await api.get('/jobs/recommendations');
        return fallback.data?.data || fallback.data || [];
      } catch (_) {
        // Fall through to the stable empty payload below.
      }
      devError('Error fetching recommendations:', error);
      return [];
    }
  }
}

const dashboardService = new DashboardService();

export default dashboardService;

