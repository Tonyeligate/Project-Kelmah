/**
 * Dispute Model
 * Defines the structure and behavior of disputes in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dispute = sequelize.define('Dispute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Reference number
  disputeNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique identifier for this dispute'
  },
  // Associated entities
  escrowId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Escrows',
      key: 'id'
    },
    comment: 'Related escrow if the dispute is related to an escrow payment'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Jobs',
      key: 'id'
    },
    comment: 'Related job if the dispute is job-related'
  },
  contractId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Contracts',
      key: 'id'
    },
    comment: 'Related contract if the dispute is contract-related'
  },
  transactionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Transactions',
      key: 'id'
    },
    comment: 'Related transaction if the dispute is about a specific transaction'
  },
  // Parties involved
  initiatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who initiated the dispute'
  },
  respondentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who needs to respond to the dispute'
  },
  // Dispute details
  type: {
    type: DataTypes.ENUM(
      'payment',       // Dispute about payment
      'service',       // Dispute about service delivery
      'escrow',        // Dispute specifically about escrow funds
      'contract',      // Dispute about contract terms
      'refund',        // Dispute about a refund
      'communication', // Dispute about communication issues
      'other'          // Other types of disputes
    ),
    allowNull: false,
    comment: 'Type of dispute'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'More specific categorization within the type'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [5, 150],
        msg: 'Dispute title must be between 5 and 150 characters'
      }
    },
    comment: 'Short title describing the dispute'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: {
        args: [20, 5000],
        msg: 'Dispute description must be between 20 and 5000 characters'
      }
    },
    comment: 'Detailed description of the dispute'
  },
  // Amount in dispute
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0.01],
        msg: 'Disputed amount must be greater than 0'
      }
    },
    comment: 'Amount being disputed (if applicable)'
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'GHS', // Ghanaian Cedi
    allowNull: true
  },
  // Status and resolution
  status: {
    type: DataTypes.ENUM(
      'pending',       // Just opened, awaiting response
      'in_review',     // Being reviewed by admin/moderator
      'evidence_required', // Additional evidence requested
      'negotiating',   // Parties are negotiating
      'resolved',      // Dispute has been resolved
      'cancelled',     // Dispute was cancelled by initiator
      'escalated',     // Escalated to higher level of support
      'expired'        // Expired due to inactivity
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  resolution: {
    type: DataTypes.ENUM(
      'not_resolved',        // Not yet resolved
      'in_favor_of_initiator', // Resolved in favor of the initiator
      'in_favor_of_respondent', // Resolved in favor of the respondent
      'compromise',          // Compromise between parties
      'refund_issued',       // Refund was issued
      'payment_released',    // Payment was released
      'cancelled',           // Cancelled without resolution
      'no_action_required'   // No action was needed
    ),
    defaultValue: 'not_resolved',
    allowNull: false
  },
  resolutionDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed explanation of the resolution'
  },
  resolutionAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Amount decided in the resolution (if applicable)'
  },
  // Evidence and documents
  evidence: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of evidence documents or links provided by parties'
  },
  // Communication and activity
  messages: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of messages exchanged during the dispute'
  },
  // Timeline
  respondentNotifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the respondent was notified of the dispute'
  },
  respondentResponseDue: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the respondent must respond by'
  },
  respondentRespondedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the respondent responded to the dispute'
  },
  escalatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the dispute was escalated'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the dispute was resolved'
  },
  // Admin handling
  assignedAdminId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Admin user assigned to handle this dispute'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Private notes from admin about the dispute'
  },
  // Priority
  priority: {
    type: DataTypes.ENUM(
      'low',
      'medium',
      'high',
      'urgent'
    ),
    defaultValue: 'medium',
    allowNull: false
  },
  // Flags
  isEscalated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the dispute has been escalated'
  },
  requiresImmediate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the dispute requires immediate attention'
  },
  // System and automation
  autoResolveDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when the system will auto-resolve if no activity'
  },
  // Outcome tracking
  actionsTaken: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Record of actions taken to resolve the dispute'
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data for this dispute'
  }
}, {
  tableName: 'disputes',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'disputes_dispute_number_idx',
      unique: true,
      fields: ['disputeNumber']
    },
    {
      name: 'disputes_escrow_id_idx',
      fields: ['escrowId']
    },
    {
      name: 'disputes_job_id_idx',
      fields: ['jobId']
    },
    {
      name: 'disputes_contract_id_idx',
      fields: ['contractId']
    },
    {
      name: 'disputes_initiator_id_idx',
      fields: ['initiatorId']
    },
    {
      name: 'disputes_respondent_id_idx',
      fields: ['respondentId']
    },
    {
      name: 'disputes_status_idx',
      fields: ['status']
    },
    {
      name: 'disputes_assigned_admin_id_idx',
      fields: ['assignedAdminId']
    },
    {
      name: 'disputes_created_at_idx',
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeCreate: (dispute) => {
      // Generate a unique dispute number if not provided
      if (!dispute.disputeNumber) {
        const prefix = 'DSP';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        dispute.disputeNumber = `${prefix}-${timestamp}-${random}`;
      }
      
      // Set default response due date (3 days from creation)
      if (!dispute.respondentResponseDue) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);
        dispute.respondentResponseDue = dueDate;
      }
      
      // Set auto-resolve date (14 days from creation by default)
      if (!dispute.autoResolveDate) {
        const resolveDate = new Date();
        resolveDate.setDate(resolveDate.getDate() + 14);
        dispute.autoResolveDate = resolveDate;
      }
    }
  }
});

/**
 * Class methods
 */

// Find dispute by dispute number
Dispute.findByDisputeNumber = async function(disputeNumber) {
  return await Dispute.findOne({
    where: { disputeNumber }
  });
};

// Find disputes by initiator ID
Dispute.findByInitiatorId = async function(initiatorId, options = {}) {
  const { limit = 20, offset = 0, status } = options;
  
  const where = { initiatorId };
  
  if (status) {
    where.status = status;
  }
  
  return await Dispute.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find disputes by respondent ID
Dispute.findByRespondentId = async function(respondentId, options = {}) {
  const { limit = 20, offset = 0, status } = options;
  
  const where = { respondentId };
  
  if (status) {
    where.status = status;
  }
  
  return await Dispute.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

// Find disputes by escrow ID
Dispute.findByEscrowId = async function(escrowId) {
  return await Dispute.findAll({
    where: { escrowId },
    order: [['createdAt', 'DESC']]
  });
};

// Find disputes by job ID
Dispute.findByJobId = async function(jobId) {
  return await Dispute.findAll({
    where: { jobId },
    order: [['createdAt', 'DESC']]
  });
};

// Find disputes by contract ID
Dispute.findByContractId = async function(contractId) {
  return await Dispute.findAll({
    where: { contractId },
    order: [['createdAt', 'DESC']]
  });
};

// Find disputes by status
Dispute.findByStatus = async function(status, options = {}) {
  const { limit = 20, offset = 0, priority } = options;
  
  const where = { status };
  
  if (priority) {
    where.priority = priority;
  }
  
  return await Dispute.findAll({
    where,
    order: [
      ['priority', 'DESC'],
      ['createdAt', 'ASC']
    ],
    limit,
    offset
  });
};

// Find disputes assigned to a specific admin
Dispute.findByAssignedAdminId = async function(assignedAdminId, options = {}) {
  const { limit = 20, offset = 0, status } = options;
  
  const where = { assignedAdminId };
  
  if (status) {
    where.status = status;
  }
  
  return await Dispute.findAll({
    where,
    order: [
      ['priority', 'DESC'],
      ['createdAt', 'ASC']
    ],
    limit,
    offset
  });
};

// Find disputes that require immediate attention
Dispute.findRequiringImmediateAttention = async function(limit = 20, offset = 0) {
  return await Dispute.findAll({
    where: {
      requiresImmediate: true,
      status: {
        [sequelize.Op.notIn]: ['resolved', 'cancelled']
      }
    },
    order: [
      ['priority', 'DESC'],
      ['createdAt', 'ASC']
    ],
    limit,
    offset
  });
};

// Find disputes that have passed their auto-resolve date
Dispute.findExpiredDisputes = async function() {
  const now = new Date();
  return await Dispute.findAll({
    where: {
      status: {
        [sequelize.Op.notIn]: ['resolved', 'cancelled']
      },
      autoResolveDate: {
        [sequelize.Op.lt]: now
      }
    }
  });
};

// Find disputes where the respondent has not responded by the due date
Dispute.findOverdueResponses = async function() {
  const now = new Date();
  return await Dispute.findAll({
    where: {
      status: 'pending',
      respondentResponseDue: {
        [sequelize.Op.lt]: now
      },
      respondentRespondedAt: null
    }
  });
};

/**
 * Instance methods
 */

// Update dispute status
Dispute.prototype.updateStatus = async function(status, notes = null, updatedBy = null) {
  const oldStatus = this.status;
  this.status = status;
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'status_update',
    from: oldStatus,
    to: status,
    timestamp: new Date(),
    updatedBy,
    notes
  });
  
  // Update related timestamps
  if (status === 'in_review') {
    // No specific timestamp field for in_review
  } else if (status === 'escalated') {
    this.escalatedAt = new Date();
    this.isEscalated = true;
  } else if (status === 'resolved') {
    this.resolvedAt = new Date();
  }
  
  return await this.save();
};

// Add evidence to the dispute
Dispute.prototype.addEvidence = async function(evidence, providedBy) {
  if (!this.evidence) {
    this.evidence = [];
  }
  
  this.evidence.push({
    ...evidence,
    providedBy,
    uploadedAt: new Date()
  });
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'evidence_added',
    timestamp: new Date(),
    updatedBy: providedBy,
    details: {
      evidenceType: evidence.type,
      evidenceTitle: evidence.title
    }
  });
  
  return await this.save();
};

// Add a message to the dispute
Dispute.prototype.addMessage = async function(message, sentBy) {
  if (!this.messages) {
    this.messages = [];
  }
  
  this.messages.push({
    ...message,
    sentBy,
    sentAt: new Date(),
    isRead: false
  });
  
  // If respondent is sending their first message, update respondentRespondedAt
  if (sentBy === this.respondentId && !this.respondentRespondedAt) {
    this.respondentRespondedAt = new Date();
  }
  
  return await this.save();
};

// Assign an admin to the dispute
Dispute.prototype.assignAdmin = async function(adminId, assignedBy = null) {
  this.assignedAdminId = adminId;
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'admin_assigned',
    timestamp: new Date(),
    updatedBy: assignedBy || adminId,
    details: {
      adminId
    }
  });
  
  return await this.save();
};

// Add admin notes
Dispute.prototype.addAdminNotes = async function(notes, adminId) {
  this.adminNotes = this.adminNotes 
    ? `${this.adminNotes}\n\n[${new Date().toISOString()}] ${notes}`
    : `[${new Date().toISOString()}] ${notes}`;
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'admin_notes_added',
    timestamp: new Date(),
    updatedBy: adminId
  });
  
  return await this.save();
};

// Update priority
Dispute.prototype.updatePriority = async function(priority, updatedBy = null) {
  const oldPriority = this.priority;
  this.priority = priority;
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'priority_updated',
    from: oldPriority,
    to: priority,
    timestamp: new Date(),
    updatedBy
  });
  
  return await this.save();
};

// Escalate the dispute
Dispute.prototype.escalate = async function(reason, escalatedBy) {
  this.isEscalated = true;
  this.status = 'escalated';
  this.escalatedAt = new Date();
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'escalated',
    timestamp: new Date(),
    updatedBy: escalatedBy,
    reason
  });
  
  return await this.save();
};

// Mark dispute as requiring immediate attention
Dispute.prototype.markAsUrgent = async function(reason, markedBy) {
  this.requiresImmediate = true;
  this.priority = 'urgent';
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'marked_as_urgent',
    timestamp: new Date(),
    updatedBy: markedBy,
    reason
  });
  
  return await this.save();
};

// Resolve the dispute
Dispute.prototype.resolve = async function(resolution, details, resolvedBy) {
  if (this.status === 'resolved') {
    throw new Error('Dispute is already resolved');
  }
  
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolutionDetails = details;
  this.resolvedAt = new Date();
  
  // If there's a resolution amount, add it
  if (details.resolutionAmount) {
    this.resolutionAmount = details.resolutionAmount;
  }
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'resolved',
    timestamp: new Date(),
    updatedBy: resolvedBy,
    details: {
      resolution,
      resolutionDetails: details
    }
  });
  
  return await this.save();
};

// Cancel the dispute
Dispute.prototype.cancel = async function(reason, cancelledBy) {
  if (this.status === 'resolved' || this.status === 'cancelled') {
    throw new Error(`Cannot cancel dispute in ${this.status} status`);
  }
  
  this.status = 'cancelled';
  this.resolution = 'cancelled';
  this.resolutionDetails = reason;
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'cancelled',
    timestamp: new Date(),
    updatedBy: cancelledBy,
    reason
  });
  
  return await this.save();
};

// Mark as auto-resolved due to inactivity
Dispute.prototype.autoResolve = async function() {
  if (this.status === 'resolved' || this.status === 'cancelled') {
    throw new Error(`Cannot auto-resolve dispute in ${this.status} status`);
  }
  
  this.status = 'resolved';
  this.resolution = 'no_action_required';
  this.resolutionDetails = 'Automatically resolved due to inactivity';
  this.resolvedAt = new Date();
  
  // Add action to actionsTaken
  if (!this.actionsTaken) {
    this.actionsTaken = [];
  }
  
  this.actionsTaken.push({
    action: 'auto_resolved',
    timestamp: new Date(),
    updatedBy: 'system',
    reason: 'Inactivity'
  });
  
  return await this.save();
};

module.exports = Dispute; 