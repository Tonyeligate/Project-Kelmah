/**
 * Admin Controller
 * Handles admin-specific operations like user management, content moderation, and analytics
 */

const { User, WorkerProfile, Skill, sequelize, PlatformAnalytics, SystemConfig } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const axios = require('axios');
const moment = require('moment');

/**
 * Get all users with pagination and filtering
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Parse query parameters
    const {
      page = 1,
      limit = 20,
      role,
      status,
      searchQuery,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Add role filter if provided
    if (role) {
      filter.role = role;
    }
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Add text search if provided
    if (searchQuery) {
      filter[Op.or] = [
        { firstName: { [Op.iLike]: `%${searchQuery}%` } },
        { lastName: { [Op.iLike]: `%${searchQuery}%` } },
        { email: { [Op.iLike]: `%${searchQuery}%` } }
      ];
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort order
    const order = [[sortBy, sortOrder]];
    
    // Execute query
    const { count, rows } = await User.findAndCountAll({
      where: filter,
      attributes: { 
        exclude: ['password', 'refreshToken'] 
      },
      include: [
        {
          model: WorkerProfile,
          as: 'workerProfile',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset,
      order
    });
    
    // Format response
    const users = rows.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      workerProfile: user.workerProfile ? {
        headline: user.workerProfile.headline,
        hourlyRate: user.workerProfile.hourlyRate,
        rating: user.workerProfile.rating,
        isVerified: user.workerProfile.isVerified
      } : null
    }));
    
    // Return response
    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error getting users: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

/**
 * Get user details by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { 
        exclude: ['password', 'refreshToken'] 
      },
      include: [
        {
          model: WorkerProfile,
          as: 'workerProfile',
          required: false,
          include: [
            {
              model: Skill,
              as: 'skills',
              through: { attributes: [] }
            }
          ]
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get additional information from related services if needed
    let jobsInfo = {};
    let paymentsInfo = {};
    
    try {
      // Fetch job statistics if applicable
      if (user.role === 'worker' || user.role === 'hirer') {
        const jobsResponse = await axios.get(
          `${process.env.JOB_SERVICE_URL}/api/stats/user/${id}`,
          { headers: { Authorization: req.headers.authorization } }
        );
        jobsInfo = jobsResponse.data.data || {};
      }
      
      // Fetch payment information if applicable
      const paymentsResponse = await axios.get(
        `${process.env.PAYMENT_SERVICE_URL}/api/admin/users/${id}/payments`,
        { headers: { Authorization: req.headers.authorization } }
      );
      paymentsInfo = paymentsResponse.data.data || {};
    } catch (error) {
      logger.warn(`Could not fetch related service data: ${error.message}`);
      // Continue without the data from other services
    }
    
    return res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        jobs: jobsInfo,
        payments: paymentsInfo
      }
    });
  } catch (error) {
    logger.error(`Error getting user: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message
    });
  }
};

/**
 * Update user status (activate, deactivate, suspend, etc.)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id;
    
    if (!['active', 'inactive', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow admins to change status of other admins
    if (user.role === 'admin' && req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot change the status of other admins'
      });
    }
    
    // Record previous status for auditing
    const previousStatus = user.status;
    
    // Update user status
    user.status = status;
    user.statusReason = reason || null;
    user.statusChangedBy = adminId;
    user.statusChangedAt = new Date();
    
    await user.save();
    
    // Log status change
    logger.info(`User ${id} status changed from ${previousStatus} to ${status} by admin ${adminId}`);
    
    // Create admin action log
    await sequelize.models.AdminActionLog.create({
      adminId,
      actionType: 'user_status_change',
      targetType: 'user',
      targetId: id,
      details: {
        previousStatus,
        newStatus: status,
        reason: reason || null
      }
    });
    
    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: {
        id: user.id,
        status: user.status,
        statusChangedAt: user.statusChangedAt
      }
    });
  } catch (error) {
    logger.error(`Error updating user status: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

/**
 * Get system analytics 
 */
exports.getSystemAnalytics = async (req, res) => {
  try {
    // Get time range from query parameters
    const { timeframe = 'month' } = req.query;
    
    // Calculate start date based on timeframe
    const startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to month
    }
    
    // Get user statistics
    const userStats = await getUserStats(startDate);
    
    // Try to get job statistics from job service
    let jobStats = {};
    try {
      const jobResponse = await axios.get(
        `${process.env.JOB_SERVICE_URL}/api/admin/analytics?timeframe=${timeframe}`,
        { headers: { Authorization: req.headers.authorization } }
      );
      jobStats = jobResponse.data.data || {};
    } catch (error) {
      logger.warn(`Could not fetch job stats: ${error.message}`);
    }
    
    // Try to get payment statistics from payment service
    let paymentStats = {};
    try {
      const paymentResponse = await axios.get(
        `${process.env.PAYMENT_SERVICE_URL}/api/admin/analytics?timeframe=${timeframe}`,
        { headers: { Authorization: req.headers.authorization } }
      );
      paymentStats = paymentResponse.data.data || {};
    } catch (error) {
      logger.warn(`Could not fetch payment stats: ${error.message}`);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        timeframe,
        users: userStats,
        jobs: jobStats,
        payments: paymentStats
      }
    });
  } catch (error) {
    logger.error(`Error getting system analytics: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system analytics',
      error: error.message
    });
  }
};

/**
 * Helper function to get user statistics
 */
async function getUserStats(startDate) {
  // Total users
  const totalUsers = await User.count();
  
  // New users in timeframe
  const newUsers = await User.count({
    where: {
      createdAt: {
        [Op.gte]: startDate
      }
    }
  });
  
  // Users by role
  const usersByRole = await User.findAll({
    attributes: [
      'role',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['role']
  });
  
  // Active users by role
  const activeUsersByRole = await User.findAll({
    attributes: [
      'role',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      status: 'active'
    },
    group: ['role']
  });
  
  // Format the results
  const roleStats = {};
  usersByRole.forEach(result => {
    roleStats[result.role] = {
      total: parseInt(result.get('count')),
      active: 0
    };
  });
  
  activeUsersByRole.forEach(result => {
    if (roleStats[result.role]) {
      roleStats[result.role].active = parseInt(result.get('count'));
    }
  });
  
  // Return the stats
  return {
    total: totalUsers,
    new: newUsers,
    byRole: roleStats
  };
}

/**
 * Get system configuration
 */
exports.getSystemConfig = async (req, res) => {
  try {
    // Get configuration from database or settings service
    const config = await sequelize.models.SystemConfig.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });
    
    // Group by category
    const groupedConfig = {};
    
    config.forEach(item => {
      if (!groupedConfig[item.category]) {
        groupedConfig[item.category] = {};
      }
      
      groupedConfig[item.category][item.key] = item.value;
    });
    
    return res.status(200).json({
      success: true,
      data: groupedConfig
    });
  } catch (error) {
    logger.error(`Error getting system config: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system configuration',
      error: error.message
    });
  }
};

/**
 * Update system configuration
 */
exports.updateSystemConfig = async (req, res) => {
  try {
    const { category, key, value } = req.body;
    const adminId = req.user.id;
    
    if (!category || !key) {
      return res.status(400).json({
        success: false,
        message: 'Category and key are required'
      });
    }
    
    // Find or create config entry
    const [config, created] = await sequelize.models.SystemConfig.findOrCreate({
      where: { category, key },
      defaults: {
        value,
        updatedBy: adminId
      }
    });
    
    // If found, update
    if (!created) {
      config.value = value;
      config.updatedBy = adminId;
      await config.save();
    }
    
    // Log configuration change
    await sequelize.models.AdminActionLog.create({
      adminId,
      actionType: 'system_config_change',
      targetType: 'system_config',
      targetId: `${category}.${key}`,
      details: {
        category,
        key,
        oldValue: created ? null : config.value,
        newValue: value
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Configuration updated',
      data: {
        category,
        key,
        value
      }
    });
  } catch (error) {
    logger.error(`Error updating system config: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update system configuration',
      error: error.message
    });
  }
};

/**
 * Get admin action logs with filtering and pagination
 */
exports.getActionLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      adminId,
      actionType,
      targetType,
      startDate,
      endDate
    } = req.query;
    
    // Build filter
    const filter = {};
    
    if (adminId) {
      filter.adminId = adminId;
    }
    
    if (actionType) {
      filter.actionType = actionType;
    }
    
    if (targetType) {
      filter.targetType = targetType;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      
      if (startDate) {
        filter.createdAt[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        filter.createdAt[Op.lte] = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const { count, rows } = await sequelize.models.AdminActionLog.findAndCountAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error getting action logs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve action logs',
      error: error.message
    });
  }
};

// Get analytics data for a specified date range
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, interval = 'day' } = req.query;
    
    // Validate date inputs
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    // Validate interval
    const validIntervals = ['day', 'week', 'month'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interval. Must be one of: day, week, month'
      });
    }
    
    // Parse dates
    const start = moment(startDate);
    const end = moment(endDate);
    
    // Validate date range
    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format.'
      });
    }
    
    if (end.isBefore(start)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }
    
    // Get analytics from the database
    const analyticsData = await PlatformAnalytics.findByDateRange(
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD')
    );
    
    // Process analytics based on interval
    const processedData = processAnalyticsByInterval(analyticsData, interval);
    
    // Calculate growth metrics
    const growth = await PlatformAnalytics.calculateGrowth(
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD')
    );
    
    return res.status(200).json({
      success: true,
      message: 'Analytics data retrieved successfully',
      data: {
        metrics: processedData,
        growth,
        interval,
        dateRange: {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD')
        }
      }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving analytics data',
      error: error.message
    });
  }
};

// Generate analytics for today (typically called by a scheduled job)
exports.generateDailyAnalytics = async (req, res) => {
  try {
    // Only allow this endpoint to be called by admin or system
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'system')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to generate analytics'
      });
    }
    
    const today = moment().format('YYYY-MM-DD');
    
    // Get user metrics
    const { User } = require('../models');
    const totalUsers = await User.count();
    const newUsers = await User.count({
      where: {
        createdAt: {
          [sequelize.Op.gte]: moment().startOf('day').toDate(),
          [sequelize.Op.lt]: moment().endOf('day').toDate()
        }
      }
    });
    
    // Get role breakdown
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });
    
    const roleBreakdown = {};
    usersByRole.forEach(item => {
      roleBreakdown[item.role] = parseInt(item.getDataValue('count'));
    });
    
    // Get active users (users who logged in today)
    // This would typically come from a user_sessions or login_history table
    // For now, we'll use a placeholder value
    const activeUsers = 0; // Replace with actual query when you have this data
    
    // Attempt to fetch job metrics from job service
    let jobMetrics = {
      totalJobs: 0,
      newJobs: 0,
      completedJobs: 0,
      activeJobs: 0,
      totalApplications: 0,
      acceptedApplications: 0
    };
    
    try {
      // Get job service URL from config
      const jobServiceUrl = await SystemConfig.getValue('services', 'job_service_url', 'http://localhost:3001');
      
      const jobResponse = await axios.get(`${jobServiceUrl}/api/internal/analytics/metrics`);
      if (jobResponse.data && jobResponse.data.success) {
        jobMetrics = jobResponse.data.data;
      }
    } catch (error) {
      console.error('Error fetching job metrics:', error.message);
      // Continue with default values if job service is unavailable
    }
    
    // Attempt to fetch payment metrics from payment service
    let paymentMetrics = {
      totalRevenue: 0,
      platformFees: 0,
      transactionCount: 0
    };
    
    try {
      // Get payment service URL from config
      const paymentServiceUrl = await SystemConfig.getValue('services', 'payment_service_url', 'http://localhost:3002');
      
      const paymentResponse = await axios.get(`${paymentServiceUrl}/api/internal/analytics/metrics`);
      if (paymentResponse.data && paymentResponse.data.success) {
        paymentMetrics = paymentResponse.data.data;
      }
    } catch (error) {
      console.error('Error fetching payment metrics:', error.message);
      // Continue with default values if payment service is unavailable
    }
    
    // Attempt to fetch messaging metrics from messaging service
    let messagingMetrics = {
      messagesSent: 0,
      newConversations: 0
    };
    
    try {
      // Get messaging service URL from config
      const messagingServiceUrl = await SystemConfig.getValue('services', 'messaging_service_url', 'http://localhost:3003');
      
      const messagingResponse = await axios.get(`${messagingServiceUrl}/api/internal/analytics/metrics`);
      if (messagingResponse.data && messagingResponse.data.success) {
        messagingMetrics = messagingResponse.data.data;
      }
    } catch (error) {
      console.error('Error fetching messaging metrics:', error.message);
      // Continue with default values if messaging service is unavailable
    }
    
    // Combine all metrics
    const metrics = {
      date: today,
      // User metrics
      totalUsers,
      newUsers,
      activeUsers,
      usersByRole: roleBreakdown,
      // Job metrics
      totalJobs: jobMetrics.totalJobs,
      newJobs: jobMetrics.newJobs,
      completedJobs: jobMetrics.completedJobs,
      activeJobs: jobMetrics.activeJobs,
      totalApplications: jobMetrics.totalApplications,
      acceptedApplications: jobMetrics.acceptedApplications,
      // Payment metrics
      totalRevenue: paymentMetrics.totalRevenue,
      platformFees: paymentMetrics.platformFees,
      transactionCount: paymentMetrics.transactionCount,
      // Messaging metrics
      messagesSent: messagingMetrics.messagesSent,
      newConversations: messagingMetrics.newConversations
      // Add other metrics as needed
    };
    
    // Save or update analytics for today
    const analyticsRecord = await PlatformAnalytics.updateOrCreate(today, metrics);
    
    return res.status(200).json({
      success: true,
      message: 'Daily analytics generated successfully',
      data: analyticsRecord
    });
  } catch (error) {
    console.error('Error generating daily analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating daily analytics',
      error: error.message
    });
  }
};

// Helper function to process analytics by interval
function processAnalyticsByInterval(analyticsData, interval) {
  if (!analyticsData || analyticsData.length === 0) {
    return [];
  }
  
  // If interval is 'day', return data as is
  if (interval === 'day') {
    return analyticsData;
  }
  
  // For week or month intervals, we need to aggregate the data
  const groupedData = {};
  
  analyticsData.forEach(record => {
    const date = moment(record.date);
    let key;
    
    if (interval === 'week') {
      // Group by week (format: YYYY-WW)
      key = `${date.year()}-W${date.isoWeek()}`;
    } else if (interval === 'month') {
      // Group by month (format: YYYY-MM)
      key = date.format('YYYY-MM');
    }
    
    if (!groupedData[key]) {
      groupedData[key] = {
        interval: key,
        date: record.date, // Use the first date of the period
        totalUsers: 0,
        newUsers: 0,
        activeUsers: 0,
        totalJobs: 0,
        newJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        acceptedApplications: 0,
        totalRevenue: 0,
        platformFees: 0,
        transactionCount: 0,
        messagesSent: 0,
        newConversations: 0
      };
    }
    
    // Numeric fields to sum
    const numericFields = [
      'newUsers', 'activeUsers', 'newJobs', 'completedJobs',
      'totalApplications', 'acceptedApplications', 'transactionCount',
      'messagesSent', 'newConversations'
    ];
    
    // Sum numeric fields
    numericFields.forEach(field => {
      groupedData[key][field] += record[field] || 0;
    });
    
    // Handle decimal fields
    groupedData[key].totalRevenue = parseFloat(groupedData[key].totalRevenue) + parseFloat(record.totalRevenue || 0);
    groupedData[key].platformFees = parseFloat(groupedData[key].platformFees) + parseFloat(record.platformFees || 0);
    
    // Use latest values for some fields
    const latestFields = ['totalUsers', 'totalJobs', 'activeJobs'];
    
    // Update to latest value
    latestFields.forEach(field => {
      if (record[field] !== undefined) {
        groupedData[key][field] = record[field];
      }
    });
  });
  
  // Convert the grouped data back to an array
  return Object.values(groupedData);
} 