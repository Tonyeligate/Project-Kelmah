/**
 * Saved Search Model
 * Represents users' saved search queries with notification options
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavedSearch = sequelize.define('SavedSearch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  query: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parameters: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'JSON object containing search parameters (skills, location, etc.)'
  },
  notificationsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the user wants to receive notifications for new matches'
  },
  lastNotificationSent: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastResultCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of results found last time this search was run'
  }
}, {
  tableName: 'saved_searches',
  timestamps: true,
  indexes: [
    {
      name: 'saved_searches_user_id_idx',
      fields: ['userId']
    },
    {
      name: 'saved_searches_notifications_idx',
      fields: ['notificationsEnabled', 'lastNotificationSent']
    }
  ]
});

/**
 * Class methods
 */

// Find all saved searches for a user
SavedSearch.findByUserId = async function(userId) {
  return await this.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
};

// Find all saved searches with notifications enabled
SavedSearch.findWithNotificationsEnabled = async function() {
  const { Op } = require('sequelize');
  
  return await this.findAll({
    where: {
      notificationsEnabled: true,
      [Op.or]: [
        { lastNotificationSent: null },
        {
          lastNotificationSent: {
            [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last notification sent more than 24 hours ago
          }
        }
      ]
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'notificationPreferences']
      }
    ]
  });
};

/**
 * Instance methods
 */

// Update notification status
SavedSearch.prototype.updateNotificationStatus = async function(enabled) {
  this.notificationsEnabled = enabled;
  return await this.save();
};

// Mark notification as sent
SavedSearch.prototype.markNotificationSent = async function(resultCount) {
  this.lastNotificationSent = new Date();
  this.lastResultCount = resultCount || 0;
  return await this.save();
};

module.exports = SavedSearch; 