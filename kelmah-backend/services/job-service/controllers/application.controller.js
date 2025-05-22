/**
 * Application Controller
 * Handles API requests for job application resources
 */

const { getModels } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { createNotification } = require('../utils/notification.utils');
const contractController = require('./contract.controller');

/**
 * Get applications for the logged-in worker
 */
exports.getMyApplications = async (req, res) => {
  try {
    const { Application, Job } = await getModels();
    
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // Get filter from query params
    const status = req.query.status || null;
    const filter = {
      workerId: req.user.id,
      deletedAt: null
    };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Get applications with pagination
    const { count, rows } = await Application.findAndCountAll({
      where: filter,
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'budget', 'currency', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // Prepare pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    return res.status(200).json({
      success: true,
      count,
      pages: totalPages,
      currentPage: page,
      hasMore,
      data: rows
    });
  } catch (error) {
    logger.error(`Error in getMyApplications: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications',
      error: error.message
    });
  }
};

/**
 * Get applications for a job (for hirer)
 */
exports.getJobApplications = async (req, res) => {
  try {
    const { Application, Job } = await getModels();
    const { jobId } = req.params;
    
    // Verify the job exists and belongs to the logged-in hirer
    const job = await Job.findOne({
      where: {
        id: jobId,
        hirerId: req.user.id
      }
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to view its applications'
      });
    }
    
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // Get filter from query params
    const status = req.query.status || null;
    const filter = {
      jobId,
      deletedAt: null
    };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Get applications with pagination
    const { count, rows } = await Application.findAndCountAll({
      where: filter,
      include: [
        {
          model: 'User',
          as: 'worker',
          attributes: ['id', 'username', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // Prepare pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    return res.status(200).json({
      success: true,
      count,
      pages: totalPages,
      currentPage: page,
      hasMore,
      data: rows
    });
  } catch (error) {
    logger.error(`Error in getJobApplications: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job applications',
      error: error.message
    });
  }
};

/**
 * Get a specific application by ID
 */
exports.getApplicationById = async (req, res) => {
  try {
    const { Application, Job } = await getModels();
    const { id } = req.params;
    
    // Find the application
    const application = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          as: 'job'
        }
      ]
    });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Verify the user has permission to view this application
    const userId = req.user.id;
    if (application.workerId !== userId && application.job.hirerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this application'
      });
    }
    
    // If hirer is viewing, mark as viewed
    if (application.job.hirerId === userId && !application.viewedByHirer) {
      application.viewedByHirer = true;
      application.viewedAt = new Date();
      await application.save();
    }
    
    return res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error(`Error in getApplicationById: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve application',
      error: error.message
    });
  }
};

/**
 * Create a new job application
 */
exports.createApplication = async (req, res) => {
  try {
    const { Application, Job } = await getModels();
    const { jobId } = req.params;
    const workerId = req.user.id;
    
    // Check if the job exists and is open
    const job = await Job.findOne({
      where: {
        id: jobId,
        status: 'open'
      }
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not accepting applications'
      });
    }
    
    // Check if worker has already applied
    const existingApplication = await Application.findOne({
      where: {
        jobId,
        workerId
      }
    });
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }
    
    // Validate required fields
    const requiredFields = ['coverLetter', 'proposedBudget'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }
    
    // Create the application
    const application = await Application.create({
      jobId,
      workerId,
      coverLetter: req.body.coverLetter,
      proposedBudget: req.body.proposedBudget,
      currency: req.body.currency || job.currency,
      estimatedDuration: req.body.estimatedDuration,
      attachments: req.body.attachments || [],
      milestoneProposal: req.body.milestoneProposal || [],
      status: 'pending'
    });
    
    // Update the job's applicantsCount
    await Job.increment('applicantsCount', { where: { id: jobId } });
    
    // Send notification to the hirer
    await createNotification({
      userId: job.hirerId,
      type: 'NEW_APPLICATION',
      title: 'New job application',
      message: `You have received a new application for "${job.title}"`,
      data: {
        jobId: job.id,
        applicationId: application.id
      }
    });
    
    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    logger.error(`Error in createApplication: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

/**
 * Update application status (for hirer)
 */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { Application, Job } = await getModels();
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'shortlisted', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }
    
    // Find the application
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Check if the user is the hirer of the job
    const job = await Job.findByPk(application.jobId);
    if (!job || job.hirerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this application'
      });
    }
    
    // Update the application
    application.status = status;
    if (feedback) {
      application.responseMessage = feedback;
    }
    application.lastMessageAt = new Date();
    await application.save();
    
    // If accepting the application, update the job and create a contract
    if (status === 'accepted') {
      job.workerId = application.workerId;
      job.status = 'in_progress';
      await job.save();
      
      // Reject all other applications
      await Application.update(
        {
          status: 'rejected',
          responseMessage: 'Another candidate was selected for this job'
        },
        {
          where: {
            jobId: job.id,
            id: { [Op.ne]: id }
          }
        }
      );
      
      // Create a contract for the accepted application
      try {
        const contract = await contractController.createContractFromApplication(job, application);
        logger.info(`Contract created: ${contract.id} for job: ${job.id}`);
      } catch (contractError) {
        logger.error(`Error creating contract: ${contractError.message}`);
        // Don't fail the job acceptance if contract creation fails,
        // we'll just log the error and allow admin to create it manually
      }
    }
    
    // Send notification to the worker
    let notificationType, notificationMessage;
    
    switch (status) {
      case 'shortlisted':
        notificationType = 'APPLICATION_SHORTLISTED';
        notificationMessage = `Your application for "${job.title}" has been shortlisted`;
        break;
      case 'accepted':
        notificationType = 'APPLICATION_ACCEPTED';
        notificationMessage = `Congratulations! Your application for "${job.title}" has been accepted`;
        break;
      case 'rejected':
        notificationType = 'APPLICATION_REJECTED';
        notificationMessage = `Your application for "${job.title}" was not selected`;
        break;
      default:
        notificationType = 'APPLICATION_STATUS_CHANGED';
        notificationMessage = `Your application status for "${job.title}" has changed to ${status}`;
    }
    
    await createNotification({
      userId: application.workerId,
      type: notificationType,
      title: 'Application Status Update',
      message: notificationMessage,
      data: {
        jobId: job.id,
        applicationId: application.id,
        status
      }
    });
    
    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      data: application
    });
  } catch (error) {
    logger.error(`Error in updateApplicationStatus: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

/**
 * Withdraw an application (for worker)
 */
exports.withdrawApplication = async (req, res) => {
  try {
    const { Application, Job } = await getModels();
    const { id } = req.params;
    const { reason } = req.body;
    
    // Find the application
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Check if the user is the worker who applied
    if (application.workerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to withdraw this application'
      });
    }
    
    // Check if application can be withdrawn (not already accepted/rejected)
    if (application.status === 'accepted' || application.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw application with status '${application.status}'`
      });
    }
    
    // Update the application status to withdrawn
    application.status = 'withdrawn';
    if (reason) {
      application.notes = reason;
    }
    await application.save();
    
    // Notify the hirer
    const job = await Job.findByPk(application.jobId);
    await createNotification({
      userId: job.hirerId,
      type: 'APPLICATION_WITHDRAWN',
      title: 'Application Withdrawn',
      message: `An application for "${job.title}" has been withdrawn`,
      data: {
        jobId: job.id,
        applicationId: application.id
      }
    });
    
    // Decrement the job's applicantsCount
    await Job.decrement('applicantsCount', { where: { id: application.jobId } });
    
    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      data: application
    });
  } catch (error) {
    logger.error(`Error in withdrawApplication: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to withdraw application',
      error: error.message
    });
  }
};

/**
 * Initialize application methods
 */
exports.init = async () => {
  logger.info('Application controller initialized');
}; 