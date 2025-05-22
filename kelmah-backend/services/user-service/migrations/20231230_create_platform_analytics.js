'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('platform_analytics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true
      },
      totalUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      newUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      activeUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      usersByRole: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      totalJobs: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      newJobs: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      completedJobs: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      activeJobs: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalApplications: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      acceptedApplications: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalRevenue: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      platformFees: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      transactionCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      messagesSent: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      newConversations: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      averageSessionDuration: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      pageViews: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      usersByLocation: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      usersByDevice: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      customMetrics: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('platform_analytics', ['date'], {
      name: 'platform_analytics_date_idx',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('platform_analytics');
  }
}; 