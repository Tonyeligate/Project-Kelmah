const Application = require('../../services/job-service/models/Application');
const Job = require('../models/Job');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Apply to a job
 */
exports.applyToJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const workerId = req.user.id;
    const {
      proposedRate,
      coverLetter,
      estimatedDuration,
      attachments,
      availabilityStartDate,
      questionResponses
    } = req.body;

    const application = await Application.create({
      job: jobId,
      worker: workerId,
      proposedRate,
      coverLetter,
      estimatedDuration,
      attachments,
      availabilityStartDate,
      questionResponses
    });

    // Increment proposal count on job
    await Job.findByIdAndUpdate(jobId, { $inc: { proposalCount: 1 } });

    // Emit dashboard update for new application
    const job = await Job.findById(jobId);
    const dashboardSocket = req.app.get('dashboardSocket');
    if (dashboardSocket) dashboardSocket.emitUpdate(job.hirer.toString(), { type: 'newApplication', application });

    return successResponse(res, 201, 'Application submitted successfully', application);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all applications for a specific job
 */
exports.getJobApplications = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const applications = await Application.find({ job: jobId })
      .populate('worker', 'firstName lastName profileImage');
    return successResponse(res, 200, 'Applications retrieved successfully', applications);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all applications submitted by the current worker
 */
exports.getMyApplications = async (req, res, next) => {
  try {
    const workerId = req.user.id;
    const applications = await Application.find({ worker: workerId })
      .populate('job');
    return successResponse(res, 200, 'My applications retrieved successfully', applications);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update application status (hirer only)
 */
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const appId = req.params.appId;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 400, 'Status is required');
    }

    // Ensure job exists and belongs to hirer
    const job = await Job.findById(jobId);
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to update applications for this job');
    }

    const application = await Application.findById(appId);
    if (!application) {
      return errorResponse(res, 404, 'Application not found');
    }
    if (application.job.toString() !== jobId) {
      return errorResponse(res, 400, 'Application does not belong to this job');
    }

    application.status = status;
    await application.save();

    return successResponse(res, 200, 'Application status updated successfully', application);
  } catch (error) {
    return next(error);
  }
}; 