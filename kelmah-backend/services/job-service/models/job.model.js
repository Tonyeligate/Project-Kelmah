/**
 * Job Model
 * Defines the structure and behavior of jobs in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Job title is required'
      },
      len: {
        args: [5, 100],
        msg: 'Job title must be between 5 and 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Job description is required'
      },
      len: {
        args: [20, 5000],
        msg: 'Job description must be between 20 and 5000 characters'
      }
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Job category is required'
      }
    }
  },
  subCategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Budget must be at least 1'
      }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
  paymentType: {
    type: DataTypes.ENUM('fixed', 'hourly'),
    allowNull: false,
    defaultValue: 'fixed'
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in days
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  isRemote: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM(
      'draft',       // Job is saved but not published
      'open',        // Job is open for applications
      'in_progress', // Job is in progress
      'completed',   // Job is completed
      'cancelled',   // Job is cancelled
      'expired'      // Job posting has expired
    ),
    defaultValue: 'open',
    allowNull: false
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'invitation'),
    defaultValue: 'public',
    allowNull: false
  },
  experienceLevel: {
    type: DataTypes.ENUM('entry', 'intermediate', 'expert'),
    allowNull: true
  },
  applicationDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON, // Array of attachment objects (URLs, names, types)
    defaultValue: []
  },
  applicantsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  escrowFunded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  escrowReleased: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hirerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users', // This refers to the User model in the auth service
      key: 'id'
    }
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: true, // Null until a worker is assigned
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  milestones: {
    type: DataTypes.JSON, // Array of milestone objects
    defaultValue: []
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: true, // Will be linked to a payment when job is funded
    references: {
      model: 'Payments',
      key: 'id'
    }
  },
  contractId: {
    type: DataTypes.UUID,
    allowNull: true, // Will be linked to a contract when job is awarded
    references: {
      model: 'Contracts',
      key: 'id'
    }
  }
}, {
  tableName: 'jobs',
  timestamps: true, // createAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'jobs_status_idx',
      fields: ['status']
    },
    {
      name: 'jobs_hirer_id_idx',
      fields: ['hirerId']
    },
    {
      name: 'jobs_worker_id_idx',
      fields: ['workerId']
    },
    {
      name: 'jobs_category_idx',
      fields: ['category']
    },
    {
      name: 'jobs_created_at_idx',
      fields: ['createdAt']
    }
  ]
});

/**
 * Class methods
 */

// Find jobs by status
Job.findByStatus = async (status) => {
  return await Job.findAll({
    where: { status },
    order: [['createdAt', 'DESC']]
  });
};

// Find jobs by hirer ID
Job.findByHirerId = async (hirerId) => {
  return await Job.findAll({
    where: { hirerId },
    order: [['createdAt', 'DESC']]
  });
};

// Find jobs by worker ID
Job.findByWorkerId = async (workerId) => {
  return await Job.findAll({
    where: { workerId },
    order: [['createdAt', 'DESC']]
  });
};

// Search jobs with filters
Job.searchJobs = async (filters) => {
  const whereClause = {
    status: 'open', // Default to open jobs
    ...filters
  };
  
  return await Job.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']]
  });
};

/**
 * Instance methods
 */

// Update job status
Job.prototype.updateStatus = async function(status) {
  this.status = status;
  return await this.save();
};

// Assign worker to job
Job.prototype.assignWorker = async function(workerId) {
  this.workerId = workerId;
  this.status = 'in_progress';
  return await this.save();
};

// Complete job
Job.prototype.complete = async function() {
  this.status = 'completed';
  return await this.save();
};

// Cancel job
Job.prototype.cancel = async function() {
  this.status = 'cancelled';
  return await this.save();
};

// Add or update milestone
Job.prototype.updateMilestones = async function(milestones) {
  this.milestones = milestones;
  return await this.save();
};

// Link with payment
Job.prototype.linkPayment = async function(paymentId) {
  this.paymentId = paymentId;
  this.escrowFunded = true;
  return await this.save();
};

// Mark escrow as released
Job.prototype.releaseEscrow = async function() {
  this.escrowReleased = true;
  return await this.save();
};

module.exports = Job; 