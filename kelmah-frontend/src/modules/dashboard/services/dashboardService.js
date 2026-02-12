import { api } from '../../../services/apiClient';
import { WS_CONFIG } from '../../../config/environment';
import { io } from 'socket.io-client';
import { getWebSocketUrl } from '../../../services/socketUrl';

/**
 * Dashboard service to handle dashboard data fetching and real-time updates
 */
class DashboardService {
  constructor() {
    this.token = null;
    this.socket = null;
    this.listeners = {};
    this.connected = false;
    this._overviewCache = null;
    this._overviewCacheTime = 0;
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
  async connect() {
    if (this.socket) return;

    if (!this.token) return;

    const wsUrl = await getWebSocketUrl();
    console.log('📡 Dashboard WebSocket connecting to:', wsUrl);

    // Connect to backend WebSocket server
    // When passing full URL, Socket.IO automatically handles the path
    this.socket = io(wsUrl, {
      auth: { token: this.token },
      transports: ['websocket', 'polling'],
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
          ? workersRes.value.data?.workers || workersRes.value.data || []
          : [];

      const result = { metrics, jobs: jobsData, analytics, workers };
      this._overviewCache = result;
      this._overviewCacheTime = Date.now();
      return result;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
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
      const response = await api.get('/jobs/dashboard', {
        params: { page, limit },
      });
      const data = response.data?.data || response.data || {};
      const activities = Array.isArray(data.recentJobs) ? data.recentJobs : [];
      return {
        activities,
        hasMore: activities.length >= limit,
      };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
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
      console.error('Error fetching statistics:', error);
      return {
        userGrowth: [],
        metrics: {},
        timeframe,
        fallback: true,
      };
    }
  }

  // Get upcoming tasks
  async getUpcomingTasks() {
    try {
      const response = await api.get('/users/dashboard/workers');
      const workers = response.data?.workers || response.data || [];
      return workers.slice(0, 5).map((worker, index) => ({
        id: worker.id || index,
        title: `Follow up with ${worker.name || 'worker'}`,
        dueDate: new Date(Date.now() + index * 86400000).toISOString(),
        status: worker.isAvailable ? 'scheduled' : 'pending',
      }));
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      return [];
    }
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
      console.error('Error fetching recent messages:', error);
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
      console.error('Error fetching performance metrics:', error);
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
      console.error('Error fetching quick actions:', error);
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
        unreadMessages: overview.metrics?.activeWorkers || 0,
        pendingJobs: overview.jobs?.totalOpenJobs || 0,
        newApplicants: overview.metrics?.totalWorkers || 0,
      };
    } catch (error) {
      console.error('Error fetching notifications summary:', error);
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
      console.error('Error fetching real-time stats:', error);
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
      console.error('Error fetching job matches:', error);
      return [];
    }
  }

  // Get personalized recommendations
  async getRecommendations() {
    try {
      const response = await api.get('/jobs/recommendations');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }
}

const dashboardService = new DashboardService();

export default dashboardService;
