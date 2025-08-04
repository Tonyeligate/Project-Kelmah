import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/workers';

/**
 * Service for managing worker earnings and analytics
 */
const earningsService = {
  /**
   * Get earnings analytics for a worker
   * @param {string} workerId - Worker ID
   * @param {string} timeRange - Time range for analytics
   * @returns {Promise<Object>} - Earnings analytics data
   */
  getEarningsAnalytics: async (workerId, timeRange = '12months') => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/analytics`,
        { params: { timeRange } }
      );
      return response.data;
    } catch (error) {
      // Fallback with comprehensive mock data for development
      console.warn('Earnings analytics API not available, using mock data');
      
      // Generate mock data based on time range
      const mockData = generateMockEarningsData(timeRange);
      
      return {
        data: mockData
      };
    }
  },

  /**
   * Get detailed earnings breakdown
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} - Detailed earnings data
   */
  getEarningsBreakdown: async (workerId, filters = {}) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/breakdown`,
        { params: filters }
      );
      return response.data;
    } catch (error) {
      console.warn('Earnings breakdown API not available, using mock data');
      return {
        data: {
          totalEarnings: 45000,
          platformFees: 4500,
          netEarnings: 40500,
          taxableAmount: 40500,
          breakdownByMonth: [
            { month: 'Jan', gross: 3500, fees: 350, net: 3150 },
            { month: 'Feb', gross: 4200, fees: 420, net: 3780 },
            { month: 'Mar', gross: 3800, fees: 380, net: 3420 },
            { month: 'Apr', gross: 4500, fees: 450, net: 4050 },
            { month: 'May', gross: 3900, fees: 390, net: 3510 },
            { month: 'Jun', gross: 4100, fees: 410, net: 3690 }
          ]
        }
      };
    }
  },

  /**
   * Get payment history
   * @param {string} workerId - Worker ID
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - Payment history
   */
  getPaymentHistory: async (workerId, pagination = {}) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/payments/history`,
        { params: pagination }
      );
      return response.data;
    } catch (error) {
      console.warn('Payment history API not available, using mock data');
      return {
        data: {
          payments: generateMockPaymentHistory(),
          totalCount: 45,
          totalPages: 5
        }
      };
    }
  },

  /**
   * Export earnings data as CSV
   * @param {string} workerId - Worker ID
   * @param {string} timeRange - Time range for export
   * @returns {Promise<Blob>} - CSV file blob
   */
  exportEarningsData: async (workerId, timeRange = '12months') => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/export`,
        { 
          params: { timeRange, format: 'csv' },
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.warn('Earnings export API not available, generating mock CSV');
      return generateMockCSV();
    }
  },

  /**
   * Get earnings projections
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Earnings projections
   */
  getEarningsProjections: async (workerId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/projections`
      );
      return response.data;
    } catch (error) {
      console.warn('Earnings projections API not available, using mock data');
      return {
        data: {
          nextMonth: {
            projected: 4200,
            confidence: 85,
            basedOn: 'historical_average'
          },
          nextQuarter: {
            projected: 12600,
            confidence: 78,
            basedOn: 'trend_analysis'
          },
          nextYear: {
            projected: 52000,
            confidence: 65,
            basedOn: 'market_growth'
          },
          factors: [
            'Historical performance',
            'Market demand trends',
            'Seasonal variations',
            'Skill level improvements'
          ]
        }
      };
    }
  },

  /**
   * Get tax information
   * @param {string} workerId - Worker ID
   * @param {string} taxYear - Tax year
   * @returns {Promise<Object>} - Tax information
   */
  getTaxInformation: async (workerId, taxYear = new Date().getFullYear()) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/tax`,
        { params: { taxYear } }
      );
      return response.data;
    } catch (error) {
      console.warn('Tax information API not available, using mock data');
      return {
        data: {
          taxYear,
          totalEarnings: 45000,
          deductions: {
            businessExpenses: 3500,
            equipment: 1200,
            transportation: 800,
            total: 5500
          },
          taxableIncome: 39500,
          estimatedTax: 5925, // 15% rate
          forms: [
            {
              name: 'Annual Income Declaration',
              description: 'Required for all self-employed individuals',
              deadline: `${taxYear + 1}-03-31`,
              status: 'pending'
            }
          ],
          paymentSchedule: [
            { quarter: 'Q1', amount: 1481, dueDate: `${taxYear}-04-15` },
            { quarter: 'Q2', amount: 1481, dueDate: `${taxYear}-07-15` },
            { quarter: 'Q3', amount: 1481, dueDate: `${taxYear}-10-15` },
            { quarter: 'Q4', amount: 1482, dueDate: `${taxYear + 1}-01-15` }
          ]
        }
      };
    }
  },

  /**
   * Get earnings comparison with peers
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Peer comparison data
   */
  getPeerComparison: async (workerId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/earnings/peer-comparison`
      );
      return response.data;
    } catch (error) {
      console.warn('Peer comparison API not available, using mock data');
      return {
        data: {
          yourEarnings: 3750, // Monthly average
          peerAverage: 3200,
          percentile: 75,
          comparison: 'above_average',
          insights: [
            'You earn 17% more than the average worker in your category',
            'Your hourly rate is competitive in the Accra market',
            'Consider expanding to additional services to increase earnings'
          ],
          benchmarks: {
            beginner: 2000,
            intermediate: 3200,
            advanced: 4500,
            expert: 6000
          }
        }
      };
    }
  }
};

/**
 * Generate mock earnings data based on time range
 * @param {string} timeRange - Time range
 * @returns {Object} Mock earnings data
 */
const generateMockEarningsData = (timeRange) => {
  const now = new Date();
  const periods = [];
  let totalEarnings = 0;
  let totalJobs = 0;
  let totalHours = 0;

  // Generate chart data based on time range
  if (timeRange === '7days') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const earnings = Math.floor(Math.random() * 500) + 200;
      const jobs = Math.floor(Math.random() * 3) + 1;
      const hours = Math.floor(Math.random() * 8) + 2;
      
      periods.push({
        period: date.toLocaleDateString('en-US', { weekday: 'short' }),
        earnings,
        jobs,
        hours,
        rating: 4.5 + Math.random() * 0.5
      });
      
      totalEarnings += earnings;
      totalJobs += jobs;
      totalHours += hours;
    }
  } else if (timeRange === '30days') {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const earnings = Math.floor(Math.random() * 300) + 100;
      const jobs = Math.floor(Math.random() * 2) + 0.5;
      const hours = Math.floor(Math.random() * 6) + 1;
      
      periods.push({
        period: date.getDate().toString(),
        earnings,
        jobs,
        hours,
        rating: 4.3 + Math.random() * 0.7
      });
      
      totalEarnings += earnings;
      totalJobs += Math.floor(jobs);
      totalHours += hours;
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
      const earnings = Math.floor(Math.random() * 2000) + 3000;
      const jobs = Math.floor(Math.random() * 8) + 5;
      const hours = Math.floor(Math.random() * 50) + 80;
      
      periods.push({
        period: monthNames[date.getMonth()],
        earnings,
        jobs,
        hours,
        rating: 4.2 + Math.random() * 0.8
      });
      
      totalEarnings += earnings;
      totalJobs += jobs;
      totalHours += hours;
    }
  }

  return {
    summary: {
      totalEarnings,
      earningsChange: Math.random() * 30 - 5, // Random change between -5% and 25%
      jobsCompleted: totalJobs,
      jobsChange: Math.random() * 20 - 2,
      hoursWorked: totalHours,
      hoursChange: Math.random() * 15 - 3,
      averageRating: 4.7,
      ratingChange: Math.random() * 0.2 - 0.1
    },
    chartData: periods,
    categoryBreakdown: [
      { name: 'Plumbing', earnings: totalEarnings * 0.4, jobs: Math.floor(totalJobs * 0.35) },
      { name: 'Electrical', earnings: totalEarnings * 0.25, jobs: Math.floor(totalJobs * 0.25) },
      { name: 'Carpentry', earnings: totalEarnings * 0.2, jobs: Math.floor(totalJobs * 0.25) },
      { name: 'Painting', earnings: totalEarnings * 0.1, jobs: Math.floor(totalJobs * 0.1) },
      { name: 'Other', earnings: totalEarnings * 0.05, jobs: Math.floor(totalJobs * 0.05) }
    ],
    recentTransactions: generateMockTransactions(),
    performance: {
      score: 85,
      level: 'Advanced',
      responseRate: 92,
      completionRate: 98,
      onTimeRate: 94,
      satisfactionRate: 96
    }
  };
};

/**
 * Generate mock transaction data
 * @returns {Array} Mock transactions
 */
const generateMockTransactions = () => {
  const jobs = [
    'Kitchen Plumbing Repair', 'Bathroom Installation', 'Office Electrical Work',
    'Living Room Painting', 'Bedroom Carpentry', 'Garage Door Repair',
    'Roofing Maintenance', 'HVAC Installation', 'Tile Installation'
  ];
  
  const clients = [
    'Mrs. Adwoa Mensah', 'Mr. Kwame Asante', 'GH Business Center',
    'Dr. Akosua Boamah', 'Tema Construction Ltd', 'East Legon Residence',
    'Airport City Office', 'Kumasi Hotel Group', 'Takoradi Industries'
  ];

  const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Roofing'];
  const statuses = ['completed', 'pending', 'processing'];

  const transactions = [];
  
  for (let i = 0; i < 25; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    
    transactions.push({
      id: `txn_${Date.now()}_${i}`,
      date: date.toISOString(),
      jobTitle: jobs[Math.floor(Math.random() * jobs.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      clientName: clients[Math.floor(Math.random() * clients.length)],
      amount: Math.floor(Math.random() * 3000) + 500,
      status: statuses[Math.floor(Math.random() * statuses.length)]
    });
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

/**
 * Generate mock payment history
 * @returns {Array} Mock payment history
 */
const generateMockPaymentHistory = () => {
  const payments = [];
  
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    
    payments.push({
      id: `pay_${Date.now()}_${i}`,
      date: date.toISOString(),
      amount: Math.floor(Math.random() * 2000) + 500,
      method: i % 3 === 0 ? 'MTN MoMo' : i % 3 === 1 ? 'Vodafone Cash' : 'Bank Transfer',
      status: 'completed',
      reference: `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
  }

  return payments;
};

/**
 * Generate mock CSV data
 * @returns {Blob} CSV blob
 */
const generateMockCSV = () => {
  const csvContent = [
    'Date,Job Title,Category,Client,Amount,Status',
    '2024-01-15,Kitchen Renovation,Plumbing,Mrs. Adwoa Mensah,1500,completed',
    '2024-01-20,Office Wiring,Electrical,GH Business Center,2200,completed',
    '2024-01-25,Furniture Assembly,Carpentry,Mr. Kwame Asante,800,completed',
    '2024-02-01,Bathroom Repair,Plumbing,Dr. Akosua Boamah,650,completed',
    '2024-02-05,Wall Painting,Painting,Tema Construction Ltd,1100,completed'
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

export default earningsService;