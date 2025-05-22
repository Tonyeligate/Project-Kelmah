/**
 * Admin Action Log Model
 * Records all actions performed by admin users for auditing and accountability
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminActionLog = sequelize.define('AdminActionLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Admin who performed the action
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'ID of the admin who performed this action'
  },
  // Type of action performed
  actionType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of action (e.g., user_status_change, job_approval, payment_refund)'
  },
  // Type of entity that was targeted
  targetType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of the target entity (e.g., user, job, payment)'
  },
  // ID of the entity that was targeted
  targetId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ID of the target entity'
  },
  // Additional details specific to the action
  details: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional JSON data about the action'
  },
  // IP address of the admin
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IP address from which the action was performed'
  },
  // User agent information
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent information from the request'
  }
}, {
  tableName: 'admin_action_logs',
  timestamps: true,
  updatedAt: false, // We only care about creation time
  indexes: [
    {
      name: 'admin_action_logs_admin_id_idx',
      fields: ['adminId']
    },
    {
      name: 'admin_action_logs_action_type_idx',
      fields: ['actionType']
    },
    {
      name: 'admin_action_logs_target_type_idx',
      fields: ['targetType']
    },
    {
      name: 'admin_action_logs_target_id_idx',
      fields: ['targetId']
    },
    {
      name: 'admin_action_logs_created_at_idx',
      fields: ['createdAt']
    }
  ]
});

// Associate with User model when it's available
AdminActionLog.associate = (models) => {
  AdminActionLog.belongsTo(models.User, {
    foreignKey: 'adminId',
    as: 'admin'
  });
};

// Helper method to log an admin action
AdminActionLog.logAction = async function({ req, adminId, actionType, targetType, targetId, details }) {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;
    
    return await this.create({
      adminId,
      actionType,
      targetType,
      targetId,
      details,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw, as this is a non-critical operation
    return null;
  }
};

module.exports = AdminActionLog; 