const Contract = require('../../services/job-service/models/Contract');
const Application = require('../../services/job-service/models/Application');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const ContractTemplate = require('../../services/job-service/models/ContractTemplate');
const ContractDispute = require('../../services/job-service/models/ContractDispute');

/**
 * Create a new contract based on an application
 */
exports.createContract = async (req, res, next) => {
  try {
    const { job, application, startDate, paymentTerms } = req.body;
    const hirer = req.user.id;

    // Verify application exists
    const app = await Application.findById(application);
    if (!app) {
      return errorResponse(res, 404, 'Application not found');
    }
    // Verify hirer owns the job
    if (app.job.toString() !== job || app.hirer && app.hirer.toString() !== hirer) {
      // In case application model has no hirer, check job->hirer field
      // Fetch job from contract-service Job model if needed
      // For simplicity, assume app.job.hirer is correct
      return errorResponse(res, 403, 'Not authorized to create contract for this application');
    }

    // Create contract document
    const contract = await Contract.create({
      job,
      application,
      hirer,
      worker: app.worker,
      startDate,
      paymentTerms,
      status: 'pending'
    });

    return successResponse(res, 201, 'Contract created successfully', contract);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get contract by ID (hirer or worker only)
 */
exports.getContractById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const contract = await Contract.findById(id)
      .populate('job')
      .populate('worker', 'firstName lastName profilePicture')
      .populate('hirer', 'firstName lastName profilePicture')
      .populate('application');

    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }

    // Only participants can view
    if (contract.hirer.toString() !== userId && contract.worker.toString() !== userId) {
      return errorResponse(res, 403, 'Not authorized to view this contract');
    }

    return successResponse(res, 200, 'Contract retrieved successfully', contract);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get contracts for current user (hirer or worker)
 */
exports.getMyContracts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Find contracts where user is hirer or worker
    const query = { $or: [{ hirer: userId }, { worker: userId }] };
    const total = await Contract.countDocuments(query);
    const contracts = await Contract.find(query)
      .populate('job')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    return paginatedResponse(res, 200, 'Contracts retrieved successfully', contracts, page, limit, total);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update an existing contract (participants only)
 */
exports.updateContract = async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    let contract = await Contract.findById(id);
    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }

    // Only participants can update
    if (contract.hirer.toString() !== userId && contract.worker.toString() !== userId) {
      return errorResponse(res, 403, 'Not authorized to update this contract');
    }

    // Apply updates
    Object.assign(contract, updates);
    await contract.save();

    return successResponse(res, 200, 'Contract updated successfully', contract);
  } catch (error) {
    return next(error);
  }
};

/** TEMPLATE ENDPOINTS **/
// Get all contract templates
exports.getContractTemplates = async (req, res, next) => {
  try {
    const templates = await ContractTemplate.find();
    return successResponse(res, 200, 'Templates retrieved successfully', templates);
  } catch (error) {
    return next(error);
  }
};

// Get a single contract template by ID
exports.getContractTemplateById = async (req, res, next) => {
  try {
    const template = await ContractTemplate.findById(req.params.id);
    if (!template) {
      return errorResponse(res, 404, 'Template not found');
    }
    return successResponse(res, 200, 'Template retrieved successfully', template);
  } catch (error) {
    return next(error);
  }
};

// Create a new contract template
exports.createContractTemplate = async (req, res, next) => {
  try {
    const template = await ContractTemplate.create({ ...req.body, createdBy: req.user.id });
    return successResponse(res, 201, 'Template created successfully', template);
  } catch (error) {
    return next(error);
  }
};

/** MILESTONE ENDPOINTS **/
// Get milestones for a contract
exports.getContractMilestones = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }
    return successResponse(res, 200, 'Milestones retrieved successfully', contract.milestones);
  } catch (error) {
    return next(error);
  }
};

// Create a milestone for a contract
exports.createMilestone = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }
    contract.milestones.push(req.body);
    await contract.save();
    const milestone = contract.milestones[contract.milestones.length - 1];
    return successResponse(res, 201, 'Milestone created successfully', milestone);
  } catch (error) {
    return next(error);
  }
};

// Update a milestone
exports.updateMilestone = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }
    const milestone = contract.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return errorResponse(res, 404, 'Milestone not found');
    }
    Object.assign(milestone, req.body);
    await contract.save();
    return successResponse(res, 200, 'Milestone updated successfully', milestone);
  } catch (error) {
    return next(error);
  }
};

// Complete a milestone
exports.completeMilestone = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }
    const milestone = contract.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return errorResponse(res, 404, 'Milestone not found');
    }
    milestone.status = 'completed';
    milestone.completionDate = new Date();
    await contract.save();
    return successResponse(res, 200, 'Milestone completed successfully', milestone);
  } catch (error) {
    return next(error);
  }
};

/** SIGNATURE AND CANCELLATION **/
// Sign a contract
exports.signContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }
    contract.status = 'active';
    await contract.save();
    return successResponse(res, 200, 'Contract signed successfully', contract);
  } catch (error) {
    return next(error);
  }
};

// Send contract for signature
exports.sendContractForSignature = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }
    // Placeholder for notification/email logic
    return successResponse(res, 200, 'Contract sent for signature', contract);
  } catch (error) {
    return next(error);
  }
};

// Cancel a contract
exports.cancelContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }
    contract.status = 'cancelled';
    contract.terminationReason = req.body.reason;
    contract.endDate = new Date();
    await contract.save();
    return successResponse(res, 200, 'Contract cancelled successfully', contract);
  } catch (error) {
    return next(error);
  }
};

/** DISPUTES **/
// Create a dispute for a contract
exports.createDispute = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }
    const dispute = await ContractDispute.create({
      contract: contract._id,
      user: req.user.id,
      reason: req.body.reason,
      description: req.body.description
    });
    contract.status = 'disputed';
    await contract.save();
    return successResponse(res, 201, 'Dispute created successfully', dispute);
  } catch (error) {
    return next(error);
  }
}; 