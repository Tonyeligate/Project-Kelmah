/**
 * Job Controller
 * Handles API requests for job resources
 */

const { getModels } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Get all jobs with pagination and filtering
 */
exports.getJobs = async (req, res) => {
  try {
    const { Job } = await getModels();
    
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // Build filter object
    const filter = {
      status: req.query.status || 'open',
      visibility: 'public',
      deletedAt: null
    };
    
    // Add category filter if provided
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Add skill filter if provided
    if (req.query.skills) {
      const skills = Array.isArray(req.query.skills) 
        ? req.query.skills 
        : req.query.skills.split(',');
      
      filter.skills = {
        [Op.overlap]: skills
      };
    }
    
    // Add budget range filter if provided
    if (req.query.minBudget || req.query.maxBudget) {
      filter.budget = {};
      
      if (req.query.minBudget) {
        filter.budget[Op.gte] = parseFloat(req.query.minBudget);
      }
      
      if (req.query.maxBudget) {
        filter.budget[Op.lte] = parseFloat(req.query.maxBudget);
      }
    }
    
    // Add job type filter if provided
    if (req.query.jobType) {
      filter.jobType = req.query.jobType;
    }
    
    // Add experience level filter if provided
    if (req.query.experience) {
      filter.experience = req.query.experience;
    }
    
    // Get jobs with pagination
    const { count, rows } = await Job.findAndCountAll({
      where: filter,
      limit,
      offset,
      order: [
        ['createdAt', 'DESC']
      ]
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
    logger.error(`Error in getJobs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve jobs',
      error: error.message
    });
  }
};

/**
 * Get job by ID
 */
exports.getJobById = async (req, res) => {
  try {
    const { Job } = await getModels();
    const { id } = req.params;
    
    // Find job by ID
    const job = await Job.findOne({
      where: {
        id,
        deletedAt: null
      }
    });
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if job is private and user is not the hirer
    if (job.visibility === 'private' && job.hirerUserId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this job'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error(`Error in getJobById: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job',
      error: error.message
    });
  }
};

/**
 * Create a new job
 */
exports.createJob = async (req, res) => {
  try {
    const { Job } = await getModels();
    
    // Extract user ID from request
    const hirerUserId = req.user.id;
    
    // Validate required fields
    const requiredFields = [
      'title', 'description', 'category', 'budget', 
      'paymentType', 'jobType', 'experience'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }
    
    // Create new job
    const job = await Job.create({
      ...req.body,
      hirerUserId,
      status: req.body.status || 'draft'
    });
    
    // Log job creation
    logger.info(`Job created: ${job.id} by user ${hirerUserId}`);
    
    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    logger.error(`Error in createJob: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
};

/**
 * Update job by ID
 */
exports.updateJob = async (req, res) => {
  try {
    const { Job } = await getModels();
    const { id } = req.params;
    
    // Find job by ID
    const job = await Job.findOne({
      where: {
        id,
        deletedAt: null
      }
    });
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user has permission to update this job
    if (job.hirerUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this job'
      });
    }
    
    // Check if job is in a status that can be updated
    const updatableStatuses = ['draft', 'open'];
    if (!updatableStatuses.includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update job in ${job.status} status`
      });
    }
    
    // Fields that cannot be updated directly
    const restrictedFields = [
      'hirerUserId', 'applicationCount', 'hiredCount',
      'createdAt', 'updatedAt', 'deletedAt'
    ];
    
    // Filter out restricted fields from request body
    const updates = Object.keys(req.body)
      .filter(key => !restrictedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});
    
    // Update job
    await job.update(updates);
    
    // Log job update
    logger.info(`Job updated: ${job.id} by user ${req.user.id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    logger.error(`Error in updateJob: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
};

/**
 * Delete job by ID (soft delete)
 */
exports.deleteJob = async (req, res) => {
  try {
    const { Job } = await getModels();
    const { id } = req.params;
    
    // Find job by ID
    const job = await Job.findOne({
      where: {
        id,
        deletedAt: null
      }
    });
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user has permission to delete this job
    if (job.hirerUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this job'
      });
    }
    
    // Check if job can be deleted
    const deletableStatuses = ['draft', 'open', 'cancelled', 'expired'];
    if (!deletableStatuses.includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete job in ${job.status} status`
      });
    }
    
    // Soft delete the job
    await job.update({
      deletedAt: new Date(),
      status: 'cancelled'
    });
    
    // Log job deletion
    logger.info(`Job deleted: ${job.id} by user ${req.user.id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    logger.error(`Error in deleteJob: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
};

/**
 * Get job metrics
 */
exports.getJobMetrics = async (req, res) => {
  try {
    const { Job, db } = await getModels();
    const { id } = req.params;
    
    // Find job by ID
    const job = await Job.findOne({
      where: {
        id,
        deletedAt: null
      }
    });
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user has permission to view job metrics
    if (job.hirerUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view metrics for this job'
      });
    }
    
    // Get metrics from TimescaleDB
    const sequelize = db.getSequelize();
    
    const metrics = await sequelize.query(`
      SELECT 
        time_bucket('1 day', timestamp) AS day,
        metric_type,
        SUM(value) AS total
      FROM job_metrics
      WHERE job_id = :jobId
      GROUP BY day, metric_type
      ORDER BY day DESC
    `, {
      replacements: { jobId: id },
      type: sequelize.QueryTypes.SELECT
    });
    
    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error(`Error in getJobMetrics: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job metrics',
      error: error.message
    });
  }
};

/**
 * Change job status
 */
exports.changeJobStatus = async (req, res) => {
  try {
    const { Job } = await getModels();
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['draft', 'open', 'in_progress', 'completed', 'cancelled', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Find job by ID
    const job = await Job.findOne({
      where: {
        id,
        deletedAt: null
      }
    });
    
    // Check if job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user has permission to change job status
    if (job.hirerUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to change status for this job'
      });
    }
    
    // Validate state transitions
    const validTransitions = {
      draft: ['open', 'cancelled'],
      open: ['in_progress', 'cancelled', 'expired'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      expired: []
    };
    
    if (!validTransitions[job.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change job from ${job.status} to ${status}`
      });
    }
    
    // Update job status
    await job.update({ status });
    
    // Log job status change
    logger.info(`Job status changed: ${job.id} from ${job.status} to ${status} by user ${req.user.id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Job status updated successfully',
      data: job
    });
  } catch (error) {
    logger.error(`Error in changeJobStatus: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update job status',
      error: error.message
    });
  }
}; 