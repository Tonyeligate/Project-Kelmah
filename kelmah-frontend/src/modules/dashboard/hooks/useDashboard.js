import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dashboardService from '../services/dashboardService';
import {
  setDashboardData,
  setLoading,
  setError,
  updateMetrics,
  setRefreshing,
  clearDashboardError,
} from '../services/dashboardSlice';
import { useAuth } from '../../auth/hooks/useAuth';
import { secureStorage } from '../../../utils/secureStorage';

export const useDashboard = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const dashboardData = useSelector((state) => state.dashboard?.data);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [realTimeData, setRealTimeData] = useState({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Initialize dashboard service with token from localStorage
  useEffect(() => {
    try {
      const token = secureStorage.getAuthToken();
      if (token) {
        dashboardService.initialize(token);
      }
    } catch (error) {
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_FRONTEND === 'true') {
        console.warn('Dashboard initialization skipped due to auth token read failure.', error);
      }
    }
  }, []);

  // Initialize socket connection and listeners when authenticated
  useEffect(() => {
    if (isAuthenticated && !isSocketConnected) {
      // Connect to socket only if not already connected
      dashboardService.connect();
      setIsSocketConnected(dashboardService.connected);

      // Set up event listeners
      const handleDashboardUpdate = (data) => {
        dispatch(setDashboardData(data));
        setRealTimeData((prev) => ({ ...prev, ...data }));
      };

      const handleNewJob = (job) => {
        // Dispatch plain object — setDashboardData merges into state.data
        dispatch(
          setDashboardData({
            quickActions: [
              { label: `New Job: ${job.title}`, ...job },
            ],
          }),
        );
      };

      const handleStatusChange = (change) => {
        setRealTimeData((prev) => ({
          ...prev,
          statusChanges: [change, ...(prev.statusChanges || []).slice(0, 4)],
        }));
      };

      // Register event listeners
      dashboardService.on('dashboardUpdate', handleDashboardUpdate);
      dashboardService.on('newJob', handleNewJob);
      dashboardService.on('statusChange', handleStatusChange);

      // Clean up on unmount
      return () => {
        dashboardService.off('dashboardUpdate', handleDashboardUpdate);
        dashboardService.off('newJob', handleNewJob);
        dashboardService.off('statusChange', handleStatusChange);
        dashboardService.disconnect();
        setIsSocketConnected(false);
      };
    }
  }, [isAuthenticated, dispatch]);

  const loadOverview = useCallback(async () => {
    try {
      dispatch(setLoading({ overview: true }));
      const overview = await dashboardService.getOverview();
      dispatch(setDashboardData({ overview }));
      return overview;
    } catch (error) {
      dispatch(setError({ overview: error.message }));
      throw error;
    } finally {
      dispatch(setLoading({ overview: false }));
    }
  }, [dispatch]);

  const loadRecentActivity = useCallback(
    async (reset = false) => {
      try {
        dispatch(setLoading({ recentActivity: true }));
        const currentPage = reset ? 1 : page;
        const response = await dashboardService.getRecentActivity(currentPage);

        if (reset) {
          dispatch(setDashboardData({ recentActivity: response.activities }));
          setPage(1);
        } else {
          const existingActivities = dashboardData?.recentActivity || [];
          dispatch(
            setDashboardData({
              recentActivity: [
                ...existingActivities,
                ...response.activities,
              ],
            }),
          );
          setPage(currentPage + 1);
        }

        setHasMore(response.hasMore);
        return response.activities;
      } catch (error) {
        dispatch(setError({ recentActivity: error.message }));
        throw error;
      } finally {
        dispatch(setLoading({ recentActivity: false }));
      }
    },
    [dispatch, page, dashboardData],
  );

  const loadStatistics = useCallback(
    async (timeframe = 'week') => {
      try {
        dispatch(setLoading({ statistics: true }));
        const statistics = await dashboardService.getStatistics(timeframe);
        dispatch(setDashboardData({ statistics }));
        return statistics;
      } catch (error) {
        dispatch(setError({ statistics: error.message }));
        throw error;
      } finally {
        dispatch(setLoading({ statistics: false }));
      }
    },
    [dispatch],
  );

  const loadUpcomingTasks = useCallback(async () => {
    try {
      dispatch(setLoading({ upcomingTasks: true }));
      const tasks = await dashboardService.getUpcomingTasks();
      dispatch(setDashboardData({ upcomingTasks: tasks }));
      return tasks;
    } catch (error) {
      dispatch(setError({ upcomingTasks: error.message }));
      throw error;
    } finally {
      dispatch(setLoading({ upcomingTasks: false }));
    }
  }, [dispatch]);

  const loadRecentMessages = useCallback(async () => {
    try {
      dispatch(setLoading({ recentMessages: true }));
      const messages = await dashboardService.getRecentMessages();
      dispatch(setDashboardData({ recentMessages: messages }));
      return messages;
    } catch (error) {
      dispatch(setError({ recentMessages: error.message }));
      throw error;
    } finally {
      dispatch(setLoading({ recentMessages: false }));
    }
  }, [dispatch]);

  const loadPerformanceMetrics = useCallback(async () => {
    try {
      dispatch(setLoading({ performanceMetrics: true }));
      const metrics = await dashboardService.getPerformanceMetrics();
      dispatch(setDashboardData({ performanceMetrics: metrics }));
      return metrics;
    } catch (error) {
      dispatch(setError({ performanceMetrics: error.message }));
      throw error;
    } finally {
      dispatch(setLoading({ performanceMetrics: false }));
    }
  }, [dispatch]);

  const loadQuickActions = useCallback(async () => {
    try {
      dispatch(setLoading({ quickActions: true }));
      const actions = await dashboardService.getQuickActions();
      dispatch(setDashboardData({ quickActions: actions }));
      return actions;
    } catch (error) {
      dispatch(setError({ quickActions: error.message }));
      throw error;
    } finally {
      dispatch(setLoading({ quickActions: false }));
    }
  }, [dispatch]);

  const loadNotificationsSummary = useCallback(async () => {
    try {
      dispatch(setLoading({ notificationsSummary: true }));
      const summary = await dashboardService.getNotificationsSummary();
      dispatch(setDashboardData({ notificationsSummary: summary }));
      return summary;
    } catch (error) {
      dispatch(setError({ notificationsSummary: error.message }));
      throw error;
    } finally {
      dispatch(setLoading({ notificationsSummary: false }));
    }
  }, [dispatch]);

  const loadRealTimeStats = useCallback(async () => {
    try {
      dispatch(setLoading({ realTimeStats: true }));
      const stats = await dashboardService.getRealTimeStats();
      setRealTimeData((prev) => ({ ...prev, stats }));
      return stats;
    } catch (error) {
      dispatch(setError({ realTimeStats: error.message }));
      throw error;
    } finally {
      dispatch(setLoading({ realTimeStats: false }));
    }
  }, [dispatch]);

  const loadSummary = useCallback(async () => {
    try {
      dispatch(setLoading({ summary: true }));
      const summary = await dashboardService.getSummary();
      dispatch(
        setDashboardData({
          overview: summary?.overview || {},
          metrics: summary?.overview?.metrics || {},
          recentJobs: summary?.overview?.jobs?.recentJobs || [],
          activeWorkers: summary?.overview?.workers || [],
          analytics: summary?.overview?.analytics || {},
          recentActivity: summary?.recentActivity?.activities || [],
          statistics: summary?.statistics || {},
          upcomingTasks: summary?.upcomingTasks || [],
          recentMessages: summary?.recentMessages || [],
          performanceMetrics: summary?.performanceMetrics || {},
          quickActions: summary?.quickActions || [],
          notificationsSummary: summary?.notificationsSummary || {},
          realTimeStats: summary?.realTimeStats || {},
        }),
      );
      setHasMore(summary?.recentActivity?.hasMore ?? false);
      if (summary?.realTimeStats) {
        setRealTimeData((prev) => ({ ...prev, stats: summary.realTimeStats }));
      }
      return summary;
    } catch (error) {
      dispatch(setError({ summary: error.message }));
      throw error;
    } finally {
      dispatch(setLoading({ summary: false }));
    }
  }, [dispatch]);

  // Load a single dashboard summary payload when authenticated.
  useEffect(() => {
    if (isAuthenticated) {
      loadSummary();
    }
  }, [isAuthenticated, loadSummary]);

  return {
    hasMore,
    realTimeData,
    isSocketConnected,
    loadSummary,
    loadOverview,
    loadRecentActivity,
    loadStatistics,
    loadUpcomingTasks,
    loadRecentMessages,
    loadPerformanceMetrics,
    loadQuickActions,
    loadNotificationsSummary,
    loadRealTimeStats,
  };
};
