/**
 * Application Model
 * Defines the structure and behavior of job applications in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Jobs',
      key: 'id'
    }
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Cover letter is required'
      },
      len: {
        args: [20, 2000],
        msg: 'Cover letter must be between 20 and 2000 characters'
      }
    }
  },
  proposedBudget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Proposed budget must be at least 1'
      }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
  estimatedDuration: {
    type: DataTypes.INTEGER, // Duration in days
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON, // Array of attachment objects
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM(
      'pending',    // Application submitted but not reviewed
      'shortlisted', // Application shortlisted by hirer
      'accepted',   // Application accepted by hirer
      'rejected',   // Application rejected by hirer
      'withdrawn'   // Application withdrawn by worker
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  milestoneProposal: {
    type: DataTypes.JSON, // Array of milestone objects proposed by worker
    defaultValue: []
  },
  isInvited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  viewedByHirer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  responseMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'applications',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'applications_job_id_idx',
      fields: ['jobId']
    },
    {
      name: 'applications_worker_id_idx',
      fields: ['workerId']
    },
    {
      name: 'applications_status_idx',
      fields: ['status']
    },
    {
      name: 'applications_created_at_idx',
      fields: ['createdAt']
    }
  ]
});

/**
 * Class methods
 */

// Find applications by job ID
Application.findByJobId = async (jobId) => {
  return await Application.findAll({
    where: { jobId },
    order: [['createdAt', 'DESC']]
  });
};

// Find applications by worker ID
Application.findByWorkerId = async (workerId) => {
  return await Application.findAll({
    where: { workerId },
    order: [['createdAt', 'DESC']]
  });
};

// Find applications by status
Application.findByStatus = async (status) => {
  return await Application.findAll({
    where: { status },
    order: [['createdAt', 'DESC']]
  });
};

// Count applications for a job
Application.countByJobId = async (jobId) => {
  return await Application.count({
    where: { jobId }
  });
};

/**
 * Instance methods
 */

// Update application status
Application.prototype.updateStatus = async function(status, responseMessage = null) {
  this.status = status;
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
  return await this.save();
};

// Mark as viewed by hirer
Application.prototype.markAsViewed = async function() {
  this.viewedByHirer = true;
  this.viewedAt = new Date();
  return await this.save();
};

// Shortlist application
Application.prototype.shortlist = async function() {
  this.status = 'shortlisted';
  return await this.save();
};

// Accept application
Application.prototype.accept = async function(message = null) {
  this.status = 'accepted';
  if (message) {
    this.responseMessage = message;
  }
  this.lastMessageAt = new Date();
  return await this.save();
};

// Reject application
Application.prototype.reject = async function(message = null) {
  this.status = 'rejected';
  if (message) {
    this.responseMessage = message;
  }
  this.lastMessageAt = new Date();
  return await this.save();
};

// Withdraw application
Application.prototype.withdraw = async function(message = null) {
  this.status = 'withdrawn';
  if (message) {
    this.notes = message;
  }
  return await this.save();
};

module.exports = Application; 