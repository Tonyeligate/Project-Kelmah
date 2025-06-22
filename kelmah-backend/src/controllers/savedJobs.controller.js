const SavedJob = require('../../services/job-service/models/SavedJob');
// Use single Job model definition to avoid OverwriteModelError
const Job = require('../models/Job');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * Save a job for the current user
 */
exports.saveJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    // Prevent duplicate saves
    const existing = await SavedJob.findOne({ job: jobId, user: userId });
    if (existing) {
      return errorResponse(res, 400, 'Job already saved');
    }

    const record = await SavedJob.create({ job: jobId, user: userId });
    return successResponse(res, 201, 'Job saved successfully', record);
  } catch (error) {
    return next(error);
  }
};

/**
 * Unsave a previously saved job
 */
exports.unsaveJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    const removed = await SavedJob.findOneAndDelete({ job: jobId, user: userId });
    if (!removed) {
      return errorResponse(res, 404, 'Saved job not found');
    }

    return successResponse(res, 200, 'Job unsaved successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * Get paginated list of saved jobs for current user
 */
exports.getSavedJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    const query = { user: userId };
    const total = await SavedJob.countDocuments(query);

    const saved = await SavedJob.find(query)
      .populate({ path: 'job', populate: { path: 'hirer', select: 'firstName lastName profileImage' } })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Extract jobs from saved records
    const jobs = saved.map(record => record.job);

    return paginatedResponse(res, 200, 'Saved jobs retrieved successfully', jobs, page, limit, total);
  } catch (error) {
    return next(error);
  }
}; 