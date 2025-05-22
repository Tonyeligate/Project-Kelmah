const { User, Activity, Transaction, LoginAttempt } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const deviceUtil = require('../../auth-service/utils/device');
const { getIpInfo } = require('../utils/ip-utils');

/**
 * Fraud Detection Controller
 * Provides APIs for fraud detection dashboards and alert management
 */
const fraudDetectionController = {
  /**
   * Get all fraud alerts with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFraudAlerts(req, res) {
    try {
      const { status, riskLevel, category, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;
      
      // Build query filters
      const filters = {};
      
      if (status) {
        filters.status = status;
      }
      
      if (riskLevel) {
        filters.riskLevel = riskLevel;
      }
      
      if (category) {
        filters.category = category;
      }

      // Query database for alerts
      // This is a placeholder - replace with your actual database model
      // In a real implementation, you would have a FraudAlert model
      
      // For demonstration, we'll generate mock data
      const mockAlerts = generateMockAlerts(filters, skip, parseInt(limit));
      
      return res.status(200).json({
        success: true,
        alerts: mockAlerts.data,
        pagination: {
          total: mockAlerts.total,
          page: parseInt(page),
          pages: Math.ceil(mockAlerts.total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching fraud alerts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve fraud alerts',
        error: error.message
      });
    }
  },
  
  /**
   * Get fraud detection statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFraudStats(req, res) {
    try {
      // In a real implementation, you would query your database for actual statistics
      // For demonstration, we'll return mock data
      
      const mockStats = {
        dailyAlerts: generateDailyAlertStats(),
        categoryCounts: {
          payment: 35,
          login: 48,
          profile: 17,
          behavior: 29
        },
        riskLevelCounts: {
          low: 42,
          medium: 56,
          high: 31
        }
      };
      
      return res.status(200).json({
        success: true,
        stats: mockStats
      });
    } catch (error) {
      logger.error('Error fetching fraud statistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve fraud statistics',
        error: error.message
      });
    }
  },
  
  /**
   * Resolve a fraud alert
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;
      const { action } = req.body;
      const adminId = req.user.id;
      
      if (!['ignore', 'flag', 'block'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "ignore", "flag", or "block"'
        });
      }
      
      // In a real implementation, you would update the alert in your database
      // and take the appropriate action based on the resolution

      // For demonstration, we'll just return success
      return res.status(200).json({
        success: true,
        message: `Alert ${alertId} has been resolved with action: ${action}`
      });
    } catch (error) {
      logger.error('Error resolving fraud alert:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to resolve fraud alert',
        error: error.message
      });
    }
  },
  
  /**
   * Get detailed information about a specific fraud alert
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAlertDetails(req, res) {
    try {
      const { alertId } = req.params;
      
      // In a real implementation, you would query your database for the alert
      // For demonstration, we'll return mock data
      
      // Find a matching alert in our mock data
      const mockAlerts = generateMockAlerts({}, 0, 100);
      const alert = mockAlerts.data.find(a => a.id === alertId);
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Fraud alert not found'
        });
      }
      
      // Add additional details
      const detailedAlert = {
        ...alert,
        userEmail: `user_${alert.userId.split('-')[0]}@example.com`,
        metadata: {
          // Additional data would be added here based on the alert type
          ipAddress: '192.168.1.100',
          deviceInfo: {
            browser: 'Chrome',
            os: 'Windows',
            deviceType: 'desktop'
          },
          locationData: {
            country: 'Ghana',
            city: 'Accra',
            coordinates: [5.6037, -0.1870]
          },
          activityHistory: [
            {
              action: 'login',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              ipAddress: '192.168.1.100'
            },
            {
              action: 'profile_update',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              ipAddress: '192.168.1.100'
            }
          ]
        }
      };
      
      return res.status(200).json({
        success: true,
        alert: detailedAlert
      });
    } catch (error) {
      logger.error('Error fetching alert details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve alert details',
        error: error.message
      });
    }
  },
  
  /**
   * Run a scheduled fraud detection scan
   * This would typically be called by a cron job
   */
  async runFraudDetectionScan() {
    try {
      logger.info('Running scheduled fraud detection scan');
      
      await Promise.all([
        detectPaymentFraud(),
        detectLoginAnomalies(),
        detectProfileAnomalies(),
        detectBehavioralAnomalies()
      ]);
      
      logger.info('Fraud detection scan completed');
      return true;
    } catch (error) {
      logger.error('Error running fraud detection scan:', error);
      return false;
    }
  }
};

/**
 * Detect suspicious payment activities
 * @private
 */
async function detectPaymentFraud() {
  try {
    // Implementation would check for:
    // - Unusual payment patterns
    // - Multiple rapid transactions
    // - Transactions from unusual locations
    // - Mismatched billing info
    logger.info('Scanning for payment fraud...');
    
    // In a real implementation, you would query your database
    // and create alerts for suspicious activities
    
  } catch (error) {
    logger.error('Error detecting payment fraud:', error);
  }
}

/**
 * Detect login anomalies
 * @private
 */
async function detectLoginAnomalies() {
  try {
    // Implementation would check for:
    // - Login attempts from unusual locations
    // - Multiple failed login attempts
    // - Logins from multiple devices in short timeframes
    // - Logins from known proxy services
    logger.info('Scanning for login anomalies...');
    
    // In a real implementation, you would query your database
    // and create alerts for suspicious activities
    
  } catch (error) {
    logger.error('Error detecting login anomalies:', error);
  }
}

/**
 * Detect profile anomalies
 * @private
 */
async function detectProfileAnomalies() {
  try {
    // Implementation would check for:
    // - Suspicious profile changes
    // - Multiple profile updates in short periods
    // - Verification document anomalies
    logger.info('Scanning for profile anomalies...');
    
    // In a real implementation, you would query your database
    // and create alerts for suspicious activities
    
  } catch (error) {
    logger.error('Error detecting profile anomalies:', error);
  }
}

/**
 * Detect behavioral anomalies
 * @private
 */
async function detectBehavioralAnomalies() {
  try {
    // Implementation would check for:
    // - Unusual browsing patterns
    // - Scraping behavior
    // - Unusual activity timing
    logger.info('Scanning for behavioral anomalies...');
    
    // In a real implementation, you would query your database
    // and create alerts for suspicious activities
    
  } catch (error) {
    logger.error('Error detecting behavioral anomalies:', error);
  }
}

/**
 * Generate mock daily alert statistics
 * @private
 * @returns {Array} Array of daily alert counts
 */
function generateDailyAlertStats() {
  const days = 14; // Two weeks of data
  const result = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    result.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 10) + 1 // Random count between 1-10
    });
  }
  
  return result;
}

/**
 * Generate mock fraud alerts for demo purposes
 * @private
 * @param {Object} filters - Filters to apply
 * @param {number} skip - Number of items to skip
 * @param {number} limit - Number of items to return
 * @returns {Object} Object with data and total count
 */
function generateMockAlerts(filters, skip, limit) {
  const categories = ['payment', 'login', 'profile', 'behavior'];
  const riskLevels = ['low', 'medium', 'high'];
  const statuses = ['pending', 'resolved'];
  const descriptions = {
    payment: [
      'Suspicious large transaction attempted',
      'Multiple rapid transactions detected',
      'Payment from unusual location',
      'Transaction with mismatched billing information',
      'Unusual payment pattern detected'
    ],
    login: [
      'Login attempt from unusual location',
      'Multiple failed login attempts',
      'Login from known proxy service',
      'Login with unusual device characteristics',
      'Multiple device logins in short timeframe'
    ],
    profile: [
      'Suspicious profile changes detected',
      'Multiple profile updates in short period',
      'Verification document anomalies detected',
      'Suspicious email change',
      'Profile information inconsistencies'
    ],
    behavior: [
      'Unusual browsing pattern detected',
      'Potential scraping behavior',
      'Unusual activity timing',
      'Rapid action sequence detected',
      'Behavior pattern deviation detected'
    ]
  };
  
  // Generate a collection of 100 mock alerts
  let alerts = [];
  for (let i = 1; i <= 100; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const status = Math.random() > 0.3 ? 'pending' : 'resolved'; // 70% pending, 30% resolved
    
    const descriptionList = descriptions[category];
    const description = descriptionList[Math.floor(Math.random() * descriptionList.length)];
    
    // Create a mock user ID
    const userId = `user-${1000 + i}-${Math.floor(Math.random() * 1000)}`;
    
    // Random date within the last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const alert = {
      id: `alert-${i}`,
      userId,
      category,
      riskLevel,
      status,
      description,
      detectedAt: date.toISOString(),
      resolution: status === 'resolved' ? 
        (Math.random() > 0.5 ? 'ignore' : (Math.random() > 0.5 ? 'flag' : 'block')) : 
        null
    };
    
    alerts.push(alert);
  }
  
  // Apply filters
  if (filters.status) {
    alerts = alerts.filter(alert => alert.status === filters.status);
  }
  
  if (filters.riskLevel) {
    alerts = alerts.filter(alert => alert.riskLevel === filters.riskLevel);
  }
  
  if (filters.category) {
    alerts = alerts.filter(alert => alert.category === filters.category);
  }
  
  const total = alerts.length;
  
  // Apply pagination
  alerts = alerts.slice(skip, skip + limit);
  
  return {
    data: alerts,
    total
  };
}

module.exports = fraudDetectionController; 