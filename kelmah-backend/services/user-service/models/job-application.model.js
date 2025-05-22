/**
 * Job Application Model
 * Represents a worker's application to a job posting
 */

const { DataTypes, Model } = require('sequelize');
const logger = require('../utils/logger');

module.exports = (sequelize) => {
  class JobApplication extends Model {
    static associate(models) {
      // Define associations here
      JobApplication.belongsTo(models.User, {
        foreignKey: 'workerId',
        as: 'worker'
      });
      
      // When job-service models are available, these should be uncommented
      // JobApplication.belongsTo(models.Job, {
      //   foreignKey: 'jobId',
      //   as: 'job'
      // });
    }
  }

  JobApplication.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    workerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    proposedRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    availability: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn'),
      defaultValue: 'pending'
    },
    interviewDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    feedbackFromHirer: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    appliedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'JobApplication',
    tableName: 'job_applications',
    timestamps: true,
    hooks: {
      beforeCreate: (jobApplication) => {
        logger.info(`New job application created by worker ${jobApplication.workerId} for job ${jobApplication.jobId}`);
      },
      afterUpdate: (jobApplication) => {
        if (jobApplication.changed('status')) {
          logger.info(`Job application ${jobApplication.id} status changed to ${jobApplication.status}`);
        }
      }
    }
  });

  return JobApplication;
}; 