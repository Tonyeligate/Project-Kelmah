import { api } from '../../../services/apiClient';

const unwrapAnalyticsPayload = (response) =>
  response?.data?.data ?? response?.data ?? null;

const normalizeListContainer = (payload, key, fallbackList = []) => {
  if (Array.isArray(payload)) {
    return { [key]: payload };
  }

  if (payload && typeof payload === 'object') {
    const list = Array.isArray(payload[key])
      ? payload[key]
      : Array.isArray(payload.items)
        ? payload.items
        : fallbackList;

    return {
      ...payload,
      [key]: list,
    };
  }

  return null;
};

const analyticsUnavailable = (overrides = {}) => ({
  unavailable: true,
  message: 'Analytics data is currently unavailable. Please try again later.',
  ...overrides,
});

const emptySummary = {
  totalSpending: 0,
  spendingChange: 0,
  activeJobs: 0,
  jobsChange: 0,
  workersHired: 0,
  workersChange: 0,
  successRate: 0,
  successRateChange: 0,
};

const emptyAnalyticsPayload = () =>
  analyticsUnavailable({
    summary: { ...emptySummary },
    spendingData: [],
    jobStatusData: [],
    categoryBreakdown: [],
    topWorkers: [],
    performance: {
      completionRate: 0,
      onTimeRate: 0,
      workerSatisfaction: 0,
      budgetAdherence: 0,
    },
    recentActivity: [],
    insights: [],
  });

/**
 * Service for managing hirer analytics and insights
 * NOTE: No /api/hirers gateway mount exists yet. All methods attempt real API
 * calls and fall back to explicit unavailable payloads so the UI remains honest
 * when analytics endpoints are unavailable.
 */
const hirerAnalyticsService = {
  getHirerAnalytics: async (hirerId, timeRange = '12months') => {
    try {
      const response = await api.get(`/hirers/${hirerId}/analytics`, {
        params: { timeRange },
      });
      const payload = unwrapAnalyticsPayload(response);
      return payload && typeof payload === 'object'
        ? payload
        : emptyAnalyticsPayload();
    } catch {
      return emptyAnalyticsPayload();
    }
  },

  getSpendingAnalytics: async (hirerId, filters = {}) => {
    try {
      const response = await api.get(`/hirers/${hirerId}/spending`, {
        params: filters,
      });
      const payload = unwrapAnalyticsPayload(response);
      if (Array.isArray(payload)) {
        return { spendingTrend: payload, total: 0 };
      }
      if (payload && typeof payload === 'object') {
        return {
          ...payload,
          spendingTrend: Array.isArray(payload.spendingTrend)
            ? payload.spendingTrend
            : Array.isArray(payload.items)
              ? payload.items
              : [],
          total: payload.total ?? 0,
        };
      }
      return analyticsUnavailable({ spendingTrend: [], total: 0 });
    } catch {
      return analyticsUnavailable({ spendingTrend: [], total: 0 });
    }
  },

  getWorkerPerformance: async (hirerId) => {
    try {
      const response = await api.get(`/hirers/${hirerId}/workers/performance`);
      return (
        normalizeListContainer(
          unwrapAnalyticsPayload(response),
          'workers',
          [],
        ) || {
          workers: [],
        }
      );
    } catch {
      return analyticsUnavailable({ workers: [] });
    }
  },

  getJobSuccessMetrics: async (hirerId) => {
    try {
      const response = await api.get(`/hirers/${hirerId}/jobs/success-metrics`);
      const payload = unwrapAnalyticsPayload(response);
      return payload && typeof payload === 'object'
        ? {
            completionRate: payload.completionRate ?? 0,
            onTimeRate: payload.onTimeRate ?? 0,
            workerSatisfaction: payload.workerSatisfaction ?? 0,
            budgetAdherence: payload.budgetAdherence ?? 0,
            ...payload,
          }
        : analyticsUnavailable({
            completionRate: 0,
            onTimeRate: 0,
            workerSatisfaction: 0,
            budgetAdherence: 0,
          });
    } catch {
      return analyticsUnavailable({
        completionRate: 0,
        onTimeRate: 0,
        workerSatisfaction: 0,
        budgetAdherence: 0,
      });
    }
  },

  getMarketInsights: async (hirerId) => {
    try {
      const response = await api.get(`/hirers/${hirerId}/market-insights`);
      return (
        normalizeListContainer(
          unwrapAnalyticsPayload(response),
          'insights',
        ) || { insights: [] }
      );
    } catch {
      return analyticsUnavailable({ insights: [] });
    }
  },

  exportAnalyticsData: async (hirerId, timeRange = '12months') => {
    try {
      const response = await api.get(`/hirers/${hirerId}/analytics/export`, {
        params: { timeRange, format: 'pdf' },
        responseType: 'blob',
      });
      return response.data;
    } catch {
      throw new Error('Analytics export is unavailable right now.');
    }
  },

  getCostSavingsOpportunities: async (hirerId) => {
    try {
      const response = await api.get(`/hirers/${hirerId}/cost-savings`);
      return (
        normalizeListContainer(
          unwrapAnalyticsPayload(response),
          'opportunities',
        ) || {
          opportunities: [],
        }
      );
    } catch {
      return analyticsUnavailable({ opportunities: [] });
    }
  },

  getHiringEfficiencyMetrics: async (hirerId) => {
    try {
      const response = await api.get(`/hirers/${hirerId}/efficiency`);
      const payload = unwrapAnalyticsPayload(response);
      return payload && typeof payload === 'object'
        ? {
            averageTimeToHire: payload.averageTimeToHire ?? 0,
            avgCostPerHire: payload.avgCostPerHire ?? 0,
            metrics: Array.isArray(payload.metrics)
              ? payload.metrics
              : Array.isArray(payload.items)
                ? payload.items
                : [],
            ...payload,
          }
        : analyticsUnavailable({
            averageTimeToHire: 0,
            avgCostPerHire: 0,
            metrics: [],
          });
    } catch {
      return analyticsUnavailable({
        averageTimeToHire: 0,
        avgCostPerHire: 0,
        metrics: [],
      });
    }
  },
};

export default hirerAnalyticsService;
