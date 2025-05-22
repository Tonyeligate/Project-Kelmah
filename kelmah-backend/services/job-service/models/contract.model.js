/**
 * Contract Model
 * Defines the structure and behavior of job contracts in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const Contract = sequelize.define('Contract', {
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
  hirerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Contract title is required'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  terms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Total amount must be greater than 0'
      }
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: false
  },
  paymentType: {
    type: DataTypes.ENUM('fixed', 'hourly', 'milestone'),
    allowNull: false,
    defaultValue: 'fixed'
  },
  milestones: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(
      'draft',           // Contract created but not yet agreed
      'pending_worker',  // Waiting for worker to accept
      'pending_hirer',   // Waiting for hirer to accept
      'active',          // Contract is active
      'completed',       // Work completed successfully
      'cancelled',       // Contract cancelled before completion
      'disputed',        // Contract is in dispute
      'terminated'       // Contract terminated without completion
    ),
    defaultValue: 'draft',
    allowNull: false
  },
  hirerSignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  workerSignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hirerSignature: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Base64 encoded signature image or typed signature text'
  },
  workerSignature: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Base64 encoded signature image or typed signature text'
  },
  hirerIpAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IP address recorded during signing for verification'
  },
  workerIpAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IP address recorded during signing for verification'
  },
  hirerDeviceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Device information recorded during signing for verification'
  },
  workerDeviceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Device information recorded during signing for verification'
  },
  escrowId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Escrows',
      key: 'id'
    }
  },
  completionNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contractFiles: {
    type: DataTypes.JSON, // Array of contract document URLs
    defaultValue: []
  },
  hirerReviewId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Reviews',
      key: 'id'
    }
  },
  workerReviewId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Reviews',
      key: 'id'
    }
  },
  hirerCanReview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  workerCanReview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastModifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  contractTemplateId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ContractTemplates',
      key: 'id'
    },
    comment: 'Reference to the template used to create this contract'
  },
  variableValues: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Values used to fill template variables'
  },
  signatureRequirements: {
    type: DataTypes.JSON,
    defaultValue: {
      requireHirer: true,
      requireWorker: true
    },
    comment: 'Configuration for signature requirements'
  },
  signatureHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'History of signature events with timestamps'
  }
}, {
  tableName: 'contracts',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'contracts_job_id_idx',
      fields: ['jobId']
    },
    {
      name: 'contracts_hirer_id_idx',
      fields: ['hirerId']
    },
    {
      name: 'contracts_worker_id_idx',
      fields: ['workerId']
    },
    {
      name: 'contracts_status_idx',
      fields: ['status']
    },
    {
      name: 'contracts_created_at_idx',
      fields: ['createdAt']
    }
  ]
});

/**
 * Class methods
 */

// Find contract by job ID
Contract.findByJobId = async (jobId) => {
  return await Contract.findOne({
    where: { jobId }
  });
};

// Find contracts by hirer ID
Contract.findByHirerId = async (hirerId) => {
  return await Contract.findAll({
    where: { hirerId },
    order: [['createdAt', 'DESC']]
  });
};

// Find contracts by worker ID
Contract.findByWorkerId = async (workerId) => {
  return await Contract.findAll({
    where: { workerId },
    order: [['createdAt', 'DESC']]
  });
};

// Find contracts by status
Contract.findByStatus = async (status) => {
  return await Contract.findAll({
    where: { status },
    order: [['createdAt', 'DESC']]
  });
};

// Search contracts with advanced filtering
Contract.searchContracts = async (params) => {
  const { 
    userId, userRole, status, jobId, title, startDateFrom, startDateTo,
    endDateFrom, endDateTo, minAmount, maxAmount, page = 1, limit = 10
  } = params;
  
  const queryOptions = {
    where: {},
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };
  
  // Filter by access based on user role
  if (userRole !== 'admin') {
    queryOptions.where = {
      [Op.or]: [
        { hirerId: userId },
        { workerId: userId }
      ]
    };
  }
  
  // Apply status filter
  if (status && status !== 'all') {
    queryOptions.where.status = status;
  }
  
  // Apply job filter
  if (jobId) {
    queryOptions.where.jobId = jobId;
  }
  
  // Apply title search filter
  if (title) {
    queryOptions.where.title = {
      [Op.iLike]: `%${title}%`
    };
  }
  
  // Apply date range filters
  if (startDateFrom || startDateTo) {
    queryOptions.where.startDate = {};
    
    if (startDateFrom) {
      queryOptions.where.startDate[Op.gte] = new Date(startDateFrom);
    }
    
    if (startDateTo) {
      queryOptions.where.startDate[Op.lte] = new Date(startDateTo);
    }
  }
  
  if (endDateFrom || endDateTo) {
    queryOptions.where.endDate = {};
    
    if (endDateFrom) {
      queryOptions.where.endDate[Op.gte] = new Date(endDateFrom);
    }
    
    if (endDateTo) {
      queryOptions.where.endDate[Op.lte] = new Date(endDateTo);
    }
  }
  
  // Apply amount range filters
  if (minAmount || maxAmount) {
    queryOptions.where.totalAmount = {};
    
    if (minAmount) {
      queryOptions.where.totalAmount[Op.gte] = parseFloat(minAmount);
    }
    
    if (maxAmount) {
      queryOptions.where.totalAmount[Op.lte] = parseFloat(maxAmount);
    }
  }
  
  const { count, rows } = await Contract.findAndCountAll(queryOptions);
  
  return {
    contracts: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit))
    }
  };
};

/**
 * Instance methods
 */

// Update contract status
Contract.prototype.updateStatus = async function(status, userId) {
  this.status = status;
  this.lastModifiedBy = userId;
  return await this.save();
};

// Worker signs contract
Contract.prototype.workerSign = async function(signature, ipAddress, deviceInfo) {
  const timestamp = new Date();
  this.workerSignedAt = timestamp;
  this.workerSignature = signature;
  this.workerIpAddress = ipAddress;
  this.workerDeviceInfo = deviceInfo;
  
  // Add to signature history
  const signatureEvent = {
    role: 'worker',
    timestamp,
    ipAddress,
    deviceInfo
  };
  
  this.signatureHistory = [...(this.signatureHistory || []), signatureEvent];
  
  if (this.hirerSignedAt) {
    this.status = 'active';
    this.startDate = this.startDate || timestamp;
  } else {
    this.status = 'pending_hirer';
  }
  
  return await this.save();
};

// Hirer signs contract
Contract.prototype.hirerSign = async function(signature, ipAddress, deviceInfo) {
  const timestamp = new Date();
  this.hirerSignedAt = timestamp;
  this.hirerSignature = signature;
  this.hirerIpAddress = ipAddress;
  this.hirerDeviceInfo = deviceInfo;
  
  // Add to signature history
  const signatureEvent = {
    role: 'hirer',
    timestamp,
    ipAddress,
    deviceInfo
  };
  
  this.signatureHistory = [...(this.signatureHistory || []), signatureEvent];
  
  if (this.workerSignedAt) {
    this.status = 'active';
    this.startDate = this.startDate || timestamp;
  } else {
    this.status = 'pending_worker';
  }
  
  return await this.save();
};

// Complete contract
Contract.prototype.complete = async function(completionNotes, userId) {
  this.status = 'completed';
  this.completionNotes = completionNotes;
  this.endDate = new Date();
  this.lastModifiedBy = userId;
  this.hirerCanReview = true;
  this.workerCanReview = true;
  
  return await this.save();
};

// Cancel contract
Contract.prototype.cancel = async function(cancellationReason, userId) {
  this.status = 'cancelled';
  this.cancellationReason = cancellationReason;
  this.endDate = new Date();
  this.lastModifiedBy = userId;
  
  return await this.save();
};

// Check if fully signed
Contract.prototype.isFullySigned = function() {
  const requirements = this.signatureRequirements || { requireHirer: true, requireWorker: true };
  
  return (!requirements.requireHirer || this.hirerSignedAt) && 
         (!requirements.requireWorker || this.workerSignedAt);
};

// Generate PDF version of contract
Contract.prototype.generatePDF = async function() {
  // Implementation would require a PDF generation library
  // This is a placeholder for the actual implementation
  return {
    success: true,
    message: 'PDF generation not implemented yet'
  };
};

// Add hooks
Contract.addHook('afterUpdate', async (contract, options) => {
  try {
    // Check if status has changed
    if (contract.changed('status')) {
      const oldStatus = contract.previous('status');
      const newStatus = contract.status;
      
      // Prepare notification data
      const notificationData = {
        contractId: contract.id,
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString()
      };
      
      // Send notification to both parties
      await sendNotification({
        userId: contract.hirerId,
        type: 'contract',
        title: 'Contract Status Changed',
        message: `Contract "${contract.title}" status changed from ${oldStatus} to ${newStatus}`,
        data: notificationData
      });
      
      await sendNotification({
        userId: contract.workerId,
        type: 'contract',
        title: 'Contract Status Changed',
        message: `Contract "${contract.title}" status changed from ${oldStatus} to ${newStatus}`,
        data: notificationData
      });
      
      console.log(`Notifications sent for contract ${contract.id} status change`);
    }
  } catch (error) {
    console.error('Error sending contract status notifications:', error);
  }
});

// Helper function to send notifications
async function sendNotification(notificationData) {
  try {
    // This would be implemented to connect to the notification service
    // For now, just log the notification
    console.log('Notification data:', notificationData);
    
    // In a real implementation, you would make an API call to the notification service
    // Example:
    // await axios.post(
    //   'http://notification-service:5005/api/notifications',
    //   notificationData,
    //   { headers: { 'x-api-key': process.env.NOTIFICATION_SERVICE_API_KEY } }
    // );
  } catch (error) {
    console.error('Error in sendNotification:', error);
  }
}

module.exports = Contract; 