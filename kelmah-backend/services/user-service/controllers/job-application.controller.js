/**
 * Job Application Controller
 * Handles API requests for job applications
 */

const { JobApplication } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all job applications for a worker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWorkerApplications = async (req, res) => {
  try {
    // Get userId from authenticated request
    const workerId = req.user.id;

    const applications = await JobApplication.findAll({
      where: { workerId },
      order: [['appliedAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    logger.error(`Error fetching job applications: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve job applications'
    });
  }
};

/**
 * Get a specific job application by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const workerId = req.user.id;

    const application = await JobApplication.findOne({
      where: { id, workerId }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Job application not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error(`Error fetching job application: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve job application'
    });
  }
};

/**
 * Create a new job application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createApplication = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { jobId, jobTitle, companyName, coverLetter, proposedRate, availability } = req.body;

    if (!jobId || !jobTitle || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Please provide jobId, jobTitle, and companyName'
      });
    }

    // Check if worker has already applied to this job
    const existingApplication = await JobApplication.findOne({
      where: { workerId, jobId }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'You have already applied to this job'
      });
    }

    const application = await JobApplication.create({
      workerId,
      jobId,
      jobTitle,
      companyName,
      coverLetter,
      proposedRate,
      availability,
      status: 'pending',
      appliedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      data: application,
      message: 'Job application submitted successfully'
    });
  } catch (error) {
    logger.error(`Error creating job application: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not create job application'
    });
  }
};

/**
 * Update an existing job application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const workerId = req.user.id;
    const { coverLetter, proposedRate, availability } = req.body;

    const application = await JobApplication.findOne({
      where: { id, workerId }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Job application not found'
      });
    }

    // Check if application can be updated
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: `Cannot update application in ${application.status} status`
      });
    }

    await application.update({
      coverLetter: coverLetter || application.coverLetter,
      proposedRate: proposedRate || application.proposedRate,
      availability: availability || application.availability
    });

    return res.status(200).json({
      success: true,
      data: application,
      message: 'Job application updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating job application: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not update job application'
    });
  }
};

/**
 * Withdraw a job application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const workerId = req.user.id;

    const application = await JobApplication.findOne({
      where: { id, workerId }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Job application not found'
      });
    }

    // Check if application can be withdrawn
    if (['accepted', 'rejected', 'withdrawn'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: `Cannot withdraw application in ${application.status} status`
      });
    }

    await application.update({
      status: 'withdrawn'
    });

    return res.status(200).json({
      success: true,
      data: application,
      message: 'Job application withdrawn successfully'
    });
  } catch (error) {
    logger.error(`Error withdrawing job application: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not withdraw job application'
    });
  }
};

/**
 * Get application statistics for a worker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getApplicationStats = async (req, res) => {
  try {
    const workerId = req.user.id;

    // Get all applications for the worker
    const applications = await JobApplication.findAll({
      where: { workerId },
      attributes: ['status']
    });

    // Count applications by status
    const stats = {
      total: applications.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0
    };

    // Calculate counts
    applications.forEach(app => {
      stats[app.status] = (stats[app.status] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Error fetching application stats: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve application statistics'
    });
  }
}; 