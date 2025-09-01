import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import dashboardService from '../services/dashboardService';
import {
  setDashboardData,
  setLoading,
  setError,
} from '../../../store/slices/dashboardSlice';
import { useAuth } from '../../auth/hooks/useAuth';

export const useDashboard = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [realTimeData, setRealTimeData] = useState({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Initialize dashboard service with token from localStorage
  useEffect(() => {
    (async () => {
      try {
        const { secureStorage } = await import('../../../utils/secureStorage');
        const token = secureStorage.getAuthToken();
        if (token) {
          dashboardService.initialize(token);
        }
      } catch {}
    })();
  }, []);

  // Initialize socket connection and listeners when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Connect to socket
      dashboardService.connect();
      setIsSocketConnected(dashboardService.connected);

      // Set up event listeners
      const handleDashboardUpdate = (data) => {
        dispatch(setDashboardData(data));
        setRealTimeData((prev) => ({ ...prev, ...data }));
      };

      const handleNewJob = (job) => {
        dispatch(
          setDashboardData((prev) => ({
            ...prev,
            quickActions: [
              { label: `New Job: ${job.title}`, ...job },
              ...(prev.quickActions || []).slice(0, 4),
            ],
          })),
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
          dispatch(
            setDashboardData((prev) => ({
              ...prev,
              recentActivity: [
                ...(prev.recentActivity || []),
                ...response.activities,
              ],
            })),
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
    [dispatch, page],
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

  // Load all dashboard data when authenticated (FIXED: No function dependencies)
  useEffect(() => {
    if (isAuthenticated) {
      loadOverview();
      loadRecentActivity(true);
      loadStatistics();
      loadUpcomingTasks();
      loadRecentMessages();
      loadPerformanceMetrics();
      loadQuickActions();
      loadNotificationsSummary();
      loadRealTimeStats();
    }
  }, [isAuthenticated]); // Fixed: Only depend on isAuthenticated to prevent infinite loop

  return {
    hasMore,
    realTimeData,
    isSocketConnected,
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
