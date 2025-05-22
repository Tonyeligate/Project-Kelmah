/**
 * Contract Analytics Controller
 * Provides analytics and reporting for contracts
 */

const Contract = require('../models/contract.model');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { sendError } = require('../../../utils/error-handler');

/**
 * Get contract count by status
 * 
 * @route GET /api/contract-analytics/status
 * @returns {object} Count of contracts by status
 */
exports.getContractCountByStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let whereClause = {};
    
    // Regular users can only see their own contracts
    if (userRole !== 'admin') {
      whereClause = {
        [Op.or]: [
          { hirerId: userId },
          { workerId: userId }
        ]
      };
    }
    
    const result = await Contract.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status']
    });
    
    // Convert to object format
    const statusCounts = {};
    result.forEach(item => {
      statusCounts[item.status] = parseInt(item.get('count'));
    });
    
    res.status(200).json({
      success: true,
      data: statusCounts
    });
  } catch (error) {
    console.error('Error fetching contract counts by status:', error);
    sendError(res, error);
  }
};

/**
 * Get contract value metrics
 * 
 * @route GET /api/contract-analytics/value
 * @returns {object} Contract value metrics (total, average, min, max)
 */
exports.getContractValueMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let whereClause = {};
    
    // Regular users can only see their own contracts
    if (userRole !== 'admin') {
      whereClause = {
        [Op.or]: [
          { hirerId: userId },
          { workerId: userId }
        ]
      };
    }
    
    const result = await Contract.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalValue'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageValue'],
        [sequelize.fn('MIN', sequelize.col('totalAmount')), 'minValue'],
        [sequelize.fn('MAX', sequelize.col('totalAmount')), 'maxValue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause
    });
    
    const metrics = result[0].dataValues;
    
    res.status(200).json({
      success: true,
      data: {
        totalValue: parseFloat(metrics.totalValue || 0),
        averageValue: parseFloat(metrics.averageValue || 0),
        minValue: parseFloat(metrics.minValue || 0),
        maxValue: parseFloat(metrics.maxValue || 0),
        count: parseInt(metrics.count || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching contract value metrics:', error);
    sendError(res, error);
  }
};

/**
 * Get contract timeline metrics
 * 
 * @route GET /api/contract-analytics/timeline
 * @returns {object} Contract timeline metrics
 */
exports.getContractTimelineMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let whereClause = {};
    
    // Regular users can only see their own contracts
    if (userRole !== 'admin') {
      whereClause = {
        [Op.or]: [
          { hirerId: userId },
          { workerId: userId }
        ]
      };
    }
    
    // Get contracts created per month for the last year
    const currentDate = new Date();
    const lastYearDate = new Date();
    lastYearDate.setFullYear(currentDate.getFullYear() - 1);
    
    whereClause.createdAt = {
      [Op.gte]: lastYearDate
    };
    
    const result = await Contract.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt'))],
      order: [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt'))]
    });
    
    // Format result
    const timelineData = result.map(item => ({
      month: item.get('month'),
      count: parseInt(item.get('count'))
    }));
    
    res.status(200).json({
      success: true,
      data: timelineData
    });
  } catch (error) {
    console.error('Error fetching contract timeline metrics:', error);
    sendError(res, error);
  }
};

/**
 * Get most active users
 * 
 * @route GET /api/contract-analytics/active-users
 * @param {string} role - Filter by user role (hirer or worker)
 * @returns {object} Most active users by contract count
 */
exports.getMostActiveUsers = async (req, res) => {
  try {
    const { role = 'all', limit = 10 } = req.query;
    const userRole = req.user.role;
    
    // Only admins can access this endpoint
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can access this endpoint'
      });
    }
    
    let columnToGroup;
    if (role === 'hirer') {
      columnToGroup = 'hirerId';
    } else if (role === 'worker') {
      columnToGroup = 'workerId';
    } else {
      // If 'all', we'll need to run two separate queries
      const hirerResult = await getActiveUsersByRole('hirerId', parseInt(limit));
      const workerResult = await getActiveUsersByRole('workerId', parseInt(limit));
      
      return res.status(200).json({
        success: true,
        data: {
          hirers: hirerResult,
          workers: workerResult
        }
      });
    }
    
    const result = await getActiveUsersByRole(columnToGroup, parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching most active users:', error);
    sendError(res, error);
  }
};

// Helper function to get active users by role
async function getActiveUsersByRole(roleColumn, limit) {
  const result = await Contract.findAll({
    attributes: [
      [roleColumn, 'userId'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'contractCount']
    ],
    group: [roleColumn],
    order: [[sequelize.literal('contractCount'), 'DESC']],
    limit
  });
  
  return result.map(item => ({
    userId: item.get('userId'),
    contractCount: parseInt(item.get('contractCount'))
  }));
}

/**
 * Get contract completion rate
 * 
 * @route GET /api/contract-analytics/completion-rate
 * @returns {object} Contract completion metrics
 */
exports.getContractCompletionRate = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let whereClause = {};
    
    // Regular users can only see their own contracts
    if (userRole !== 'admin') {
      whereClause = {
        [Op.or]: [
          { hirerId: userId },
          { workerId: userId }
        ]
      };
    }
    
    // Get total contracts
    const totalCount = await Contract.count({
      where: whereClause
    });
    
    // Get completed contracts
    const completedCount = await Contract.count({
      where: {
        ...whereClause,
        status: 'completed'
      }
    });
    
    // Get cancelled contracts
    const cancelledCount = await Contract.count({
      where: {
        ...whereClause,
        status: 'cancelled'
      }
    });
    
    // Get disputed contracts
    const disputedCount = await Contract.count({
      where: {
        ...whereClause,
        status: 'disputed'
      }
    });
    
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const cancellationRate = totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0;
    const disputeRate = totalCount > 0 ? (disputedCount / totalCount) * 100 : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalContracts: totalCount,
        completedContracts: completedCount,
        cancelledContracts: cancelledCount,
        disputedContracts: disputedCount,
        completionRate: parseFloat(completionRate.toFixed(2)),
        cancellationRate: parseFloat(cancellationRate.toFixed(2)),
        disputeRate: parseFloat(disputeRate.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error fetching contract completion rate:', error);
    sendError(res, error);
  }
}; 