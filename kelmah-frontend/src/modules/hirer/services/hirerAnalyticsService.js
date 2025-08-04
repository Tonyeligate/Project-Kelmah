import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/hirers';

/**
 * Service for managing hirer analytics and insights
 */
const hirerAnalyticsService = {
  /**
   * Get comprehensive analytics for a hirer
   * @param {string} hirerId - Hirer ID
   * @param {string} timeRange - Time range for analytics
   * @returns {Promise<Object>} - Analytics data
   */
  getHirerAnalytics: async (hirerId, timeRange = '12months') => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${hirerId}/analytics`,
        { params: { timeRange } }
      );
      return response.data;
    } catch (error) {
      // Fallback with comprehensive mock data for development
      console.warn('Hirer analytics API not available, using mock data');
      
      const mockData = generateMockHirerAnalytics(timeRange);
      
      return {
        data: mockData
      };
    }
  },

  /**
   * Get spending breakdown and trends
   * @param {string} hirerId - Hirer ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} - Spending data
   */
  getSpendingAnalytics: async (hirerId, filters = {}) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${hirerId}/spending`,
        { params: filters }
      );
      return response.data;
    } catch (error) {
      console.warn('Spending analytics API not available, using mock data');
      return {
        data: {
          totalSpending: 125000,
          averageJobCost: 3500,
          spendingByCategory: {
            'Plumbing': 45000,
            'Electrical': 35000,
            'Carpentry': 25000,
            'Painting': 15000,
            'Other': 5000
          },
          monthlyTrend: generateMockSpendingTrend(),
          budgetUtilization: 78,
          costPerHire: 2800,
          savingsFromNegotiation: 8500
        }
      };
    }
  },

  /**
   * Get worker performance analytics
   * @param {string} hirerId - Hirer ID
   * @returns {Promise<Object>} - Worker performance data
   */
  getWorkerPerformance: async (hirerId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${hirerId}/workers/performance`
      );
      return response.data;
    } catch (error) {
      console.warn('Worker performance API not available, using mock data');
      return {
        data: {
          totalWorkersHired: 35,
          repeatHires: 12,
          averageWorkerRating: 4.6,
          topPerformers: generateMockTopWorkers(),
          categoryPerformance: {
            'Plumbing': { rating: 4.8, jobs: 15, satisfaction: 92 },
            'Electrical': { rating: 4.5, jobs: 12, satisfaction: 88 },
            'Carpentry': { rating: 4.7, jobs: 10, satisfaction: 90 },
            'Painting': { rating: 4.3, jobs: 8, satisfaction: 85 }
          },
          workerRetentionRate: 68,
          timeToHire: 3.2 // days
        }
      };
    }
  },

  /**
   * Get job success metrics
   * @param {string} hirerId - Hirer ID
   * @returns {Promise<Object>} - Job success data
   */
  getJobSuccessMetrics: async (hirerId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${hirerId}/jobs/success-metrics`
      );
      return response.data;
    } catch (error) {
      console.warn('Job success metrics API not available, using mock data');
      return {
        data: {
          totalJobsPosted: 42,
          completedJobs: 38,
          successRate: 90.5,
          averageJobDuration: 12, // days
          onTimeCompletionRate: 85,
          budgetAdherenceRate: 82,
          clientSatisfactionScore: 4.5,
          disputeRate: 5,
          repostRate: 8,
          qualityScore: 87
        }
      };
    }
  },

  /**
   * Get market insights and benchmarks
   * @param {string} hirerId - Hirer ID
   * @returns {Promise<Object>} - Market insights
   */
  getMarketInsights: async (hirerId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${hirerId}/market-insights`
      );
      return response.data;
    } catch (error) {
      console.warn('Market insights API not available, using mock data');
      return {
        data: {
          marketPosition: 'Above Average',
          spendingPercentile: 75,
          efficiencyRank: 23, // out of 100
          recommendations: [
            {
              type: 'cost_optimization',
              title: 'Optimize Spending',
              description: 'You spend 15% more than similar hirers. Consider negotiating rates.',
              potential_savings: 2500
            },
            {
              type: 'worker_retention',
              title: 'Improve Worker Retention',
              description: 'Building long-term relationships can reduce hiring costs by 30%.',
              potential_savings: 3500
            },
            {
              type: 'category_expansion',
              title: 'Expand Service Categories',
              description: 'Consider adding HVAC and Roofing to your regular services.',
              potential_value: 8000
            }
          ],
          industryBenchmarks: {
            averageJobCost: 3200,
            successRate: 85,
            timeToCompletion: 14,
            workerSatisfaction: 4.3
          }
        }
      };
    }
  },

  /**
   * Export analytics data
   * @param {string} hirerId - Hirer ID
   * @param {string} timeRange - Time range for export
   * @returns {Promise<Blob>} - PDF report blob
   */
  exportAnalyticsData: async (hirerId, timeRange = '12months') => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${hirerId}/analytics/export`,
        { 
          params: { timeRange, format: 'pdf' },
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.warn('Analytics export API not available, generating mock PDF');
      return generateMockPDF();
    }
  },

  /**
   * Get cost savings opportunities
   * @param {string} hirerId - Hirer ID
   * @returns {Promise<Object>} - Cost savings data
   */
  getCostSavingsOpportunities: async (hirerId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${hirerId}/cost-savings`
      );
      return response.data;
    } catch (error) {
      console.warn('Cost savings API not available, using mock data');
      return {
        data: {
          totalPotentialSavings: 12500,
          opportunities: [
            {
              category: 'Bundle Jobs',
              description: 'Combine similar jobs to negotiate better rates',
              potentialSavings: 4500,
              difficulty: 'Easy',
              timeline: '1-2 weeks'
            },
            {
              category: 'Long-term Contracts',
              description: 'Establish ongoing relationships with top workers',
              potentialSavings: 3500,
              difficulty: 'Medium',
              timeline: '1-3 months'
            },
            {
              category: 'Off-peak Scheduling',
              description: 'Schedule non-urgent work during slower periods',
              potentialSavings: 2500,
              difficulty: 'Easy',
              timeline: 'Immediate'
            },
            {
              category: 'Bulk Material Purchase',
              description: 'Coordinate material purchases across jobs',
              potentialSavings: 2000,
              difficulty: 'Hard',
              timeline: '3-6 months'
            }
          ]
        }
      };
    }
  },

  /**
   * Get hiring efficiency metrics
   * @param {string} hirerId - Hirer ID
   * @returns {Promise<Object>} - Efficiency metrics
   */
  getHiringEfficiencyMetrics: async (hirerId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${hirerId}/efficiency`
      );
      return response.data;
    } catch (error) {
      console.warn('Hiring efficiency API not available, using mock data');
      return {
        data: {
          averageTimeToHire: 3.2, // days
          applicationResponseRate: 85,
          interviewToHireRatio: 0.65,
          offerAcceptanceRate: 92,
          firstChoiceHireRate: 78,
          processEfficiencyScore: 82,
          bottlenecks: [
            {
              stage: 'Initial Response',
              averageTime: 1.5,
              improvement: 'Set up automated responses'
            },
            {
              stage: 'Interview Scheduling',
              averageTime: 0.8,
              improvement: 'Use scheduling tools'
            },
            {
              stage: 'Decision Making',
              averageTime: 0.9,
              improvement: 'Define clear criteria'
            }
          ]
        }
      };
    }
  }
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
        jobs: Math.floor(Math.random() * 3) + 1
      });
      
      totalSpending += amount;
      totalJobs += 1;
    }
  } else {
    // Monthly data for longer periods
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsCount = timeRange === '3months' ? 3 : 
                       timeRange === '6months' ? 6 : 12;
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const amount = Math.floor(Math.random() * 8000) + 5000;
      const jobs = Math.floor(Math.random() * 8) + 3;
      
      periods.push({
        period: monthNames[date.getMonth()],
        amount,
        jobs
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
      successRateChange: Math.random() * 5 - 2
    },
    spendingData: periods,
    jobStatusData: [
      { name: 'Completed', count: Math.floor(totalJobs * 0.65) },
      { name: 'In Progress', count: Math.floor(totalJobs * 0.20) },
      { name: 'Posted', count: Math.floor(totalJobs * 0.10) },
      { name: 'Cancelled', count: Math.floor(totalJobs * 0.05) }
    ],
    categoryBreakdown: [
      { category: 'Plumbing', spending: totalSpending * 0.35, jobs: Math.floor(totalJobs * 0.3) },
      { category: 'Electrical', spending: totalSpending * 0.25, jobs: Math.floor(totalJobs * 0.25) },
      { category: 'Carpentry', spending: totalSpending * 0.20, jobs: Math.floor(totalJobs * 0.2) },
      { category: 'Painting', spending: totalSpending * 0.15, jobs: Math.floor(totalJobs * 0.15) },
      { category: 'Other', spending: totalSpending * 0.05, jobs: Math.floor(totalJobs * 0.1) }
    ],
    topWorkers: generateMockTopWorkers(),
    performance: {
      completionRate: 85 + Math.random() * 10,
      onTimeRate: 80 + Math.random() * 15,
      workerSatisfaction: 85 + Math.random() * 10,
      budgetAdherence: 75 + Math.random() * 20
    },
    recentActivity: generateMockRecentActivity(),
    insights: [
      {
        type: 'success',
        title: 'Great Job Completion Rate',
        description: 'Your completion rate of 92% is above the platform average of 85%.',
        action: 'View Details'
      },
      {
        type: 'warning',
        title: 'Budget Overruns',
        description: 'Recent jobs exceeded budget by an average of 12%. Consider more detailed planning.',
        action: 'Optimize Budget'
      },
      {
        type: 'info',
        title: 'Expand Your Network',
        description: 'You could save up to 15% by working with more diverse workers.',
        action: 'Find Workers'
      }
    ]
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
    { name: 'Kofi Osei', category: 'Plumbing', location: 'Tamale' }
  ];

  return workers.map((worker, index) => ({
    id: index + 1,
    name: worker.name,
    category: worker.category,
    location: worker.location,
    jobsCompleted: Math.floor(Math.random() * 15) + 5,
    rating: 4.2 + Math.random() * 0.7,
    totalPaid: Math.floor(Math.random() * 8000) + 3000
  }));
};

/**
 * Generate mock recent activity
 * @returns {Array} Mock recent activity
 */
const generateMockRecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'job_completed',
      title: 'Kitchen Plumbing Completed',
      description: 'Job completed by Kwame Asante',
      amount: 1500,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      type: 'payment_made',
      title: 'Payment Released',
      description: 'Payment released for electrical work',
      amount: 2200,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      type: 'job_posted',
      title: 'New Job Posted',
      description: 'Bathroom renovation job posted',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      type: 'job_completed',
      title: 'Carpentry Work Finished',
      description: 'Custom furniture completed',
      amount: 3500,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return activities;
};

/**
 * Generate mock spending trend
 * @returns {Array} Mock spending trend
 */
const generateMockSpendingTrend = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return months.map(month => ({
    month,
    spending: Math.floor(Math.random() * 8000) + 5000,
    budget: Math.floor(Math.random() * 2000) + 8000
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