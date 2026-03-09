import { api } from '../../../services/apiClient';

const unwrapAnalyticsPayload = (response) => response?.data?.data ?? response?.data ?? null;

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

/**
 * Service for managing hirer analytics and insights
 * NOTE: No /api/hirers gateway mount exists yet. All methods attempt real API
 * calls and fall back to generated placeholder data so the Dashboard renders
 * without errors. Once backend hirer analytics routes are implemented, remove
 * the fallback generators and rely on real data.
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
        : generateMockHirerAnalytics(timeRange);
    } catch {
      return generateMockHirerAnalytics(timeRange);
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
      return { spendingTrend: generateMockSpendingTrend(), total: 0 };
    } catch {
      return { spendingTrend: generateMockSpendingTrend(), total: 0 };
    }
  },

  getWorkerPerformance: async (hirerId) => {
    try {
      const response = await api.get(`/hirers/${hirerId}/workers/performance`);
      return normalizeListContainer(unwrapAnalyticsPayload(response), 'workers', generateMockTopWorkers()) || {
        workers: generateMockTopWorkers(),
      };
    } catch {
      return { workers: generateMockTopWorkers() };
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
        : {
          completionRate: 0,
          onTimeRate: 0,
          workerSatisfaction: 0,
          budgetAdherence: 0,
        };
    } catch {
      return {
        completionRate: 0,
        onTimeRate: 0,
        workerSatisfaction: 0,
        budgetAdherence: 0,
      };
    }
  },

  getMarketInsights: async (hirerId) => {
    try {
      const response = await api.get(`/hirers/${hirerId}/market-insights`);
      return normalizeListContainer(unwrapAnalyticsPayload(response), 'insights') || { insights: [] };
    } catch {
      return { insights: [] };
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
      return generateMockPDF();
    }
  },

  getCostSavingsOpportunities: async (hirerId) => {
    try {
      const response = await api.get(`/hirers/${hirerId}/cost-savings`);
      return normalizeListContainer(unwrapAnalyticsPayload(response), 'opportunities') || {
        opportunities: [],
      };
    } catch {
      return { opportunities: [] };
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
        : { averageTimeToHire: 0, avgCostPerHire: 0, metrics: [] };
    } catch {
      return { averageTimeToHire: 0, avgCostPerHire: 0, metrics: [] };
    }
  },
};

/**
 * Generate mock hirer analytics data
 * @param {string} timeRange - Time range
 * @returns {Object} Mock analytics data
 */
const generateMockHirerAnalytics = (timeRange) => {
  const now = new Date();
  const periods = [];
  let totalSpending = 0;
  let totalJobs = 0;

  // Generate spending data based on time range
  if (timeRange === '30days') {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const amount = Math.floor(Math.random() * 500) + 200;

      periods.push({
        period: date.getDate().toString(),
        amount,
        jobs: Math.floor(Math.random() * 3) + 1,
      });

      totalSpending += amount;
      totalJobs += 1;
    }
  } else {
    // Monthly data for longer periods
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthsCount =
      timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;

    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const amount = Math.floor(Math.random() * 8000) + 5000;
      const jobs = Math.floor(Math.random() * 8) + 3;

      periods.push({
        period: monthNames[date.getMonth()],
        amount,
        jobs,
      });

      totalSpending += amount;
      totalJobs += jobs;
    }
  }

  return {
    summary: {
      totalSpending,
      spendingChange: Math.random() * 25 - 5, // Random change between -5% and 20%
      activeJobs: Math.floor(Math.random() * 8) + 3,
      jobsChange: Math.random() * 30 - 10,
      workersHired: Math.floor(totalJobs * 0.8),
      workersChange: Math.random() * 20 - 5,
      successRate: 85 + Math.random() * 10,
      successRateChange: Math.random() * 5 - 2,
    },
    spendingData: periods,
    jobStatusData: [
      { name: 'Completed', count: Math.floor(totalJobs * 0.65) },
      { name: 'In Progress', count: Math.floor(totalJobs * 0.2) },
      { name: 'Posted', count: Math.floor(totalJobs * 0.1) },
      { name: 'Cancelled', count: Math.floor(totalJobs * 0.05) },
    ],
    categoryBreakdown: [
      {
        category: 'Plumbing',
        spending: totalSpending * 0.35,
        jobs: Math.floor(totalJobs * 0.3),
      },
      {
        category: 'Electrical',
        spending: totalSpending * 0.25,
        jobs: Math.floor(totalJobs * 0.25),
      },
      {
        category: 'Carpentry',
        spending: totalSpending * 0.2,
        jobs: Math.floor(totalJobs * 0.2),
      },
      {
        category: 'Painting',
        spending: totalSpending * 0.15,
        jobs: Math.floor(totalJobs * 0.15),
      },
      {
        category: 'Other',
        spending: totalSpending * 0.05,
        jobs: Math.floor(totalJobs * 0.1),
      },
    ],
    topWorkers: generateMockTopWorkers(),
    performance: {
      completionRate: 85 + Math.random() * 10,
      onTimeRate: 80 + Math.random() * 15,
      workerSatisfaction: 85 + Math.random() * 10,
      budgetAdherence: 75 + Math.random() * 20,
    },
    recentActivity: [],
    insights: [
      {
        type: 'success',
        title: 'Great Job Completion Rate',
        description:
          'Your completion rate of 92% is above the platform average of 85%.',
        action: 'View Details',
      },
      {
        type: 'warning',
        title: 'Budget Overruns',
        description:
          'Recent jobs exceeded budget by an average of 12%. Consider more detailed planning.',
        action: 'Optimize Budget',
      },
      {
        type: 'info',
        title: 'Expand Your Network',
        description:
          'You could save up to 15% by working with more diverse workers.',
        action: 'Find Workers',
      },
    ],
  };
};

/**
 * Generate mock top workers data
 * @returns {Array} Mock top workers
 */
const generateMockTopWorkers = () => {
  const workers = [
    { name: 'Kwame Asante', category: 'Plumbing', location: 'Accra' },
    { name: 'Akosua Boamah', category: 'Electrical', location: 'Kumasi' },
    { name: 'Fiifi Mensah', category: 'Carpentry', location: 'Accra' },
    { name: 'Ama Serwaa', category: 'Painting', location: 'Tema' },
    { name: 'Kofi Osei', category: 'Plumbing', location: 'Tamale' },
  ];

  return workers.map((worker, index) => ({
    id: index + 1,
    name: worker.name,
    category: worker.category,
    location: worker.location,
    jobsCompleted: Math.floor(Math.random() * 15) + 5,
    rating: 4.2 + Math.random() * 0.7,
    totalPaid: Math.floor(Math.random() * 8000) + 3000,
  }));
};

/**
 * Generate mock spending trend
 * @returns {Array} Mock spending trend
 */
const generateMockSpendingTrend = () => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Oct',
    'Nov',
    'Dec',
  ];

  return months.map((month) => ({
    month,
    spending: Math.floor(Math.random() * 8000) + 5000,
    budget: Math.floor(Math.random() * 2000) + 8000,
  }));
};

/**
 * Generate mock PDF blob
 * @returns {Blob} Mock PDF blob
 */
const generateMockPDF = () => {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Filter /ASCIIHexDecode
/Length 44
>>
stream
48656C6C6F20576F726C64210A0A4869726572204E616C7974696373205265706F7274
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000100 00000 n 
0000000179 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
251
%%EOF`;

  return new Blob([pdfContent], { type: 'application/pdf' });
};

export default hirerAnalyticsService;
