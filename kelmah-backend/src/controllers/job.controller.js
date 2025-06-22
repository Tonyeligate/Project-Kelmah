/**
 * Job Controller
 */

const Job = require('../models/Job');
const User = require('../models/User');
const { AppError } = require('../middlewares/error');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * Create a new job
 * @route POST /api/jobs
 * @access Private (Hirer only)
 */
const createJob = async (req, res, next) => {
  try {
    // Add hirer ID to job data
    req.body.hirer = req.user.id;
    
    // Create job
    const job = await Job.create(req.body);
    
    // Emit new job event for dashboard
    const dashboardSocket = req.app.get('dashboardSocket');
    if (dashboardSocket) dashboardSocket.emitNewJob(job);
    
    return successResponse(res, 201, 'Job created successfully', job);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all jobs with filtering, sorting and pagination
 * @route GET /api/jobs
 * @access Public
 */
const getJobs = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build query
    let query = { status: 'open', visibility: 'public' };
    
    // Filtering
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.skills) {
      query.skills = { $in: req.query.skills.split(',') };
    }
    
    if (req.query.budget) {
      const [min, max] = req.query.budget.split('-');
      query.budget = {};
      if (min) query.budget.$gte = parseInt(min);
      if (max) query.budget.$lte = parseInt(max);
    }
    
    if (req.query.location) {
      query['location.country'] = req.query.location;
    }
    
    // Filter by job type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Execute query with pagination
    const jobs = await Job.find(query)
      .populate('hirer', 'firstName lastName profileImage')
      .skip(startIndex)
      .limit(limit)
      .sort(req.query.sort || '-createdAt');
    
    // Get total count
    const total = await Job.countDocuments(query);
    
    return paginatedResponse(res, 200, 'Jobs retrieved successfully', jobs, page, limit, total);
  } catch (error) {
    next(error);
  }
};

/**
 * Get job by ID
 * @route GET /api/jobs/:id
 * @access Public
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('hirer', 'firstName lastName profileImage email')
      .populate('worker', 'firstName lastName profileImage');
    
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    
    // Increment view count
    job.viewCount += 1;
    await job.save();
    
    return successResponse(res, 200, 'Job retrieved successfully', job);
  } catch (error) {
    next(error);
  }
};

/**
 * Update job
 * @route PUT /api/jobs/:id
 * @access Private (Job owner only)
 */
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);
    
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    
    // Check if user is job owner
    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to update this job');
    }
    
    // Check if job can be updated
    if (job.status !== 'draft' && job.status !== 'open') {
      return errorResponse(res, 400, 'Cannot update job that is already in progress or completed');
    }
    
    // Update job
    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    return successResponse(res, 200, 'Job updated successfully', job);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete job
 * @route DELETE /api/jobs/:id
 * @access Private (Job owner only)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    
    // Check if user is job owner
    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to delete this job');
    }
    
    // Check if job can be deleted
    if (job.status !== 'draft' && job.status !== 'open') {
      return errorResponse(res, 400, 'Cannot delete job that is already in progress or completed');
    }
    
    await job.remove();
    
    return successResponse(res, 200, 'Job deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get jobs posted by current user
 * @route GET /api/jobs/my-jobs
 * @access Private (Hirer only)
 */
const getMyJobs = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build query
    let query = { hirer: req.user.id };
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Execute query with pagination
    const jobs = await Job.find(query)
      .populate('worker', 'firstName lastName profileImage')
      .skip(startIndex)
      .limit(limit)
      .sort(req.query.sort || '-createdAt');
    
    // Get total count
    const total = await Job.countDocuments(query);
    
    return paginatedResponse(res, 200, 'My jobs retrieved successfully', jobs, page, limit, total);
  } catch (error) {
    next(error);
  }
};

/**
 * Change job status
 * @route PATCH /api/jobs/:id/status
 * @access Private (Job owner only)
 */
const changeJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return errorResponse(res, 400, 'Status is required');
    }
    
    let job = await Job.findById(req.params.id);
    
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    
    // Check if user is job owner
    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to update this job');
    }
    
    // Validate status transition
    const validTransitions = {
      'draft': ['open', 'cancelled'],
      'open': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    if (!validTransitions[job.status].includes(status)) {
      return errorResponse(res, 400, `Cannot change status from ${job.status} to ${status}`);
    }
    
    // Update status and relevant dates
    job.status = status;
    
    if (status === 'in-progress') {
      job.startDate = Date.now();
    } else if (status === 'completed') {
      job.completedDate = Date.now();
    }
    
    await job.save();
    
    // Emit job status change event for dashboard
    const dashboardSocket = req.app.get('dashboardSocket');
    if (dashboardSocket) dashboardSocket.emitStatusChange(job);
    
    return successResponse(res, 200, 'Job status updated successfully', job);
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured jobs for homepage
 */
const getFeaturedJobs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const jobs = await Job.find({ status: 'open', visibility: 'public' })
      .populate('hirer', 'firstName lastName profileImage')
      .sort('-viewCount')
      .limit(limit);
    return successResponse(res, 200, 'Featured jobs retrieved successfully', jobs);
  } catch (error) {
    next(error);
  }
};

/**
 * Get job categories
 */
const getJobCategories = async (req, res, next) => {
  try {
    const categories = await Job.distinct('category', { status: 'open', visibility: 'public' });
    return successResponse(res, 200, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  changeJobStatus,
  getFeaturedJobs,
  getJobCategories
};