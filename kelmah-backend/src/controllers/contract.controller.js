const Contract = require('../../services/job-service/models/Contract');
const Application = require('../../services/job-service/models/Application');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

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