/**
 * Job View Model
 * Tracks when users view job listings for analytics and trending calculations
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobView = sequelize.define('JobView', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jobs',
        key: 'id'
      },
      field: 'job_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null for anonymous views
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    referrer: {
      type: DataTypes.STRING,
      allowNull: true
    },
    viewDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Duration of view in seconds',
      field: 'view_duration'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'job_views',
    timestamps: true,
    indexes: [
      {
        name: 'job_views_job_id_idx',
        fields: ['job_id']
      },
      {
        name: 'job_views_user_id_idx',
        fields: ['user_id']
      },
      {
        name: 'job_views_created_at_idx',
        fields: ['created_at']
      }
    ]
  });

  JobView.associate = (models) => {
    // Define associations
    JobView.belongsTo(models.Job, {
      foreignKey: 'jobId',
      as: 'job'
    });

    // If there's a User model in this service
    if (models.User) {
      JobView.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  };

  return JobView;
}; 