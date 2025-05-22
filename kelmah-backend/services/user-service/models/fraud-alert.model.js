const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Fraud Alert Model
 * Stores information about detected fraud and suspicious activities
 */
const FraudAlert = sequelize.define('FraudAlert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.ENUM('payment', 'login', 'profile', 'behavior'),
    allowNull: false,
    comment: 'Category of fraud alert'
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    comment: 'Risk level assessment'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Detailed description of the suspicious activity'
  },
  detectedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the suspicious activity was detected'
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Current status of the alert'
  },
  resolution: {
    type: DataTypes.ENUM('ignore', 'flag', 'block'),
    allowNull: true,
    comment: 'How the alert was resolved if applicable'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the alert was resolved'
  },
  resolvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Admin who resolved the alert'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional data related to the alert (IP, device info, etc.)'
  }
}, {
  tableName: 'fraud_alerts',
  timestamps: true,
  indexes: [
    {
      name: 'fraud_alerts_user_id_idx',
      fields: ['userId']
    },
    {
      name: 'fraud_alerts_category_idx',
      fields: ['category']
    },
    {
      name: 'fraud_alerts_risk_level_idx',
      fields: ['riskLevel']
    },
    {
      name: 'fraud_alerts_status_idx',
      fields: ['status']
    },
    {
      name: 'fraud_alerts_detected_at_idx',
      fields: ['detectedAt']
    }
  ]
});

// Associate with User model
FraudAlert.associate = (models) => {
  // User who triggered the alert
  FraudAlert.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // Admin who resolved the alert
  FraudAlert.belongsTo(models.User, {
    foreignKey: 'resolvedBy',
    as: 'resolver'
  });
};

module.exports = FraudAlert; 