/**
 * Platform Analytics Model
 * Stores aggregated platform metrics
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlatformAnalytics = sequelize.define('PlatformAnalytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Date for which analytics are recorded
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
    comment: 'Date for which these analytics are recorded (YYYY-MM-DD)'
  },
  // User metrics
  totalUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of registered users'
  },
  newUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of new user registrations on this date'
  },
  activeUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of users active on this date'
  },
  usersByRole: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Breakdown of users by role (e.g., {worker: 100, hirer: 50, admin: 5})'
  },
  // Job metrics
  totalJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of jobs in the system'
  },
  newJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of new jobs posted on this date'
  },
  completedJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of jobs completed on this date'
  },
  activeJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of active jobs on this date'
  },
  // Application metrics
  totalApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of job applications on this date'
  },
  acceptedApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of applications accepted on this date'
  },
  // Payment metrics
  totalRevenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total revenue generated on this date'
  },
  platformFees: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Platform fees collected on this date'
  },
  transactionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of payment transactions on this date'
  },
  // Messaging metrics
  messagesSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of messages sent on this date'
  },
  newConversations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of new conversations started on this date'
  },
  // Engagement metrics
  averageSessionDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Average session duration in seconds'
  },
  pageViews: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of page views on this date'
  },
  // Geographical data
  usersByLocation: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Breakdown of user activity by location'
  },
  // Device data
  usersByDevice: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Breakdown of user activity by device type'
  },
  // Additional custom metrics
  customMetrics: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Any additional custom metrics to track'
  }
}, {
  tableName: 'platform_analytics',
  timestamps: true,
  indexes: [
    {
      name: 'platform_analytics_date_idx',
      unique: true,
      fields: ['date']
    }
  ]
});

// Class methods
PlatformAnalytics.findByDateRange = async function(startDate, endDate) {
  return await this.findAll({
    where: {
      date: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['date', 'ASC']]
  });
};

PlatformAnalytics.getLatest = async function() {
  return await this.findOne({
    order: [['date', 'DESC']]
  });
};

PlatformAnalytics.updateOrCreate = async function(dateStr, metrics) {
  const [record, created] = await this.findOrCreate({
    where: { date: dateStr },
    defaults: metrics
  });
  
  if (!created) {
    // Update existing record with new metrics
    await record.update(metrics);
  }
  
  return record;
};

// Calculate growth between two dates
PlatformAnalytics.calculateGrowth = async function(startDate, endDate) {
  const startMetrics = await this.findOne({
    where: { date: startDate }
  });
  
  const endMetrics = await this.findOne({
    where: { date: endDate }
  });
  
  if (!startMetrics || !endMetrics) {
    return null;
  }
  
  // Calculate percentage change for various metrics
  const growthData = {
    users: {
      absolute: endMetrics.totalUsers - startMetrics.totalUsers,
      percentage: calculatePercentage(startMetrics.totalUsers, endMetrics.totalUsers)
    },
    jobs: {
      absolute: endMetrics.totalJobs - startMetrics.totalJobs,
      percentage: calculatePercentage(startMetrics.totalJobs, endMetrics.totalJobs)
    },
    revenue: {
      absolute: parseFloat(endMetrics.totalRevenue) - parseFloat(startMetrics.totalRevenue),
      percentage: calculatePercentage(parseFloat(startMetrics.totalRevenue), parseFloat(endMetrics.totalRevenue))
    },
    activeUsers: {
      absolute: endMetrics.activeUsers - startMetrics.activeUsers,
      percentage: calculatePercentage(startMetrics.activeUsers, endMetrics.activeUsers)
    }
  };
  
  return growthData;
};

// Helper function to calculate percentage change
function calculatePercentage(start, end) {
  if (start === 0) return end > 0 ? 100 : 0;
  return parseFloat(((end - start) / start * 100).toFixed(2));
}

module.exports = PlatformAnalytics; 