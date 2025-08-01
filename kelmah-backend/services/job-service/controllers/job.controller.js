/**
 * Job Controller
 */

const Job = require("../models/Job");
const User = require("../models/User");
const { AppError } = require("../middlewares/error");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response");

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

    return successResponse(res, 201, "Job created successfully", job);
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
    let query = { status: "open", visibility: "public" };

    // Filtering
    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.skills) {
      query.skills = { $in: req.query.skills.split(",") };
    }

    if (req.query.budget) {
      const [min, max] = req.query.budget.split("-");
      query.budget = {};
      if (min) query.budget.$gte = parseInt(min);
      if (max) query.budget.$lte = parseInt(max);
    }

    if (req.query.location) {
      query["location.country"] = req.query.location;
    }

    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Execute query with pagination
    const jobs = await Job.find(query)
      .populate("hirer", "firstName lastName profileImage")
      .skip(startIndex)
      .limit(limit)
      .sort(req.query.sort || "-createdAt");

    // Get total count
    const total = await Job.countDocuments(query);

    return paginatedResponse(
      res,
      200,
      "Jobs retrieved successfully",
      jobs,
      page,
      limit,
      total,
    );
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
      .populate("hirer", "firstName lastName profileImage email")
      .populate("worker", "firstName lastName profileImage");

    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }

    // Increment view count
    job.viewCount += 1;
    await job.save();

    return successResponse(res, 200, "Job retrieved successfully", job);
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
      return errorResponse(res, 404, "Job not found");
    }

    // Check if user is job owner
    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, "Not authorized to update this job");
    }

    // Check if job can be updated
    if (job.status !== "draft" && job.status !== "open") {
      return errorResponse(
        res,
        400,
        "Cannot update job that is already in progress or completed",
      );
    }

    // Update job
    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, 200, "Job updated successfully", job);
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
      return errorResponse(res, 404, "Job not found");
    }

    // Check if user is job owner
    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, "Not authorized to delete this job");
    }

    // Check if job can be deleted
    if (job.status !== "draft" && job.status !== "open") {
      return errorResponse(
        res,
        400,
        "Cannot delete job that is already in progress or completed",
      );
    }

    await job.remove();

    return successResponse(res, 200, "Job deleted successfully");
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
      .populate("worker", "firstName lastName profileImage")
      .skip(startIndex)
      .limit(limit)
      .sort(req.query.sort || "-createdAt");

    // Get total count
    const total = await Job.countDocuments(query);

    return paginatedResponse(
      res,
      200,
      "My jobs retrieved successfully",
      jobs,
      page,
      limit,
      total,
    );
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
      return errorResponse(res, 400, "Status is required");
    }

    let job = await Job.findById(req.params.id);

    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }

    // Check if user is job owner
    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, "Not authorized to update this job");
    }

    // Validate status transition
    const validTransitions = {
      draft: ["open", "cancelled"],
      open: ["in-progress", "cancelled"],
      "in-progress": ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[job.status].includes(status)) {
      return errorResponse(
        res,
        400,
        `Cannot change status from ${job.status} to ${status}`,
      );
    }

    // Update status and relevant dates
    job.status = status;

    if (status === "in-progress") {
      job.startDate = Date.now();
    } else if (status === "completed") {
      job.completedDate = Date.now();
    }

    await job.save();

    return successResponse(res, 200, "Job status updated successfully", job);
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard jobs
 * @route GET /api/jobs/dashboard
 * @access Public
 */
const getDashboardJobs = async (req, res, next) => {
  try {
    // Get recent jobs for dashboard
    const jobs = await Job.find({ status: "open", visibility: "public" })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("hirer", "firstName lastName companyName")
      .select("title description budget location urgency createdAt");

    const dashboardData = {
      recentJobs: jobs,
      totalOpenJobs: await Job.countDocuments({ status: "open", visibility: "public" }),
      totalJobsToday: await Job.countDocuments({
        status: "open",
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    };

    return successResponse(res, 200, "Dashboard jobs retrieved successfully", dashboardData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get contracts (jobs with contracts)
 * @route GET /api/jobs/contracts
 * @access Public
 */
const getContracts = async (req, res, next) => {
  try {
    // Mock contracts data for now - in real implementation, this would come from a contracts table
    const contracts = [
      {
        id: "contract-1",
        title: "Kitchen Renovation Contract",
        status: "active",
        client: "Sarah Mitchell",
        worker: "John Contractor",
        amount: 5500,
        currency: "GHS",
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        progress: 65
      },
      {
        id: "contract-2",
        title: "Office Interior Design",
        status: "pending",
        client: "Tech Solutions Ltd",
        worker: "Maria Designer",
        amount: 8000,
        currency: "GHS",
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28),
        progress: 0
      }
    ];

    return successResponse(res, 200, "Contracts retrieved successfully", { contracts });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply to a job
 * @route POST /api/jobs/:id/apply
 * @access Private (Worker only)
 */
const applyToJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const applicationData = req.body;
    
    // Mock application creation
    const application = {
      id: `app-${Date.now()}`,
      jobId: id,
      applicant: req.user.id,
      status: "pending",
      appliedAt: new Date(),
      ...applicationData
    };
    
    return successResponse(res, 201, "Application submitted successfully", application);
  } catch (error) {
    next(error);
  }
};

/**
 * Save a job
 * @route POST /api/jobs/:id/save
 * @access Private (Worker only)
 */
const saveJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Mock save operation
    const savedJob = {
      jobId: id,
      userId: req.user.id,
      savedAt: new Date()
    };
    
    return successResponse(res, 200, "Job saved successfully", savedJob);
  } catch (error) {
    next(error);
  }
};

/**
 * Unsave a job
 * @route DELETE /api/jobs/:id/save
 * @access Private (Worker only)
 */
const unsaveJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    return successResponse(res, 200, "Job removed from saved list");
  } catch (error) {
    next(error);
  }
};

/**
 * Get my applications
 * @route GET /api/jobs/my-applications
 * @access Private (Worker only)
 */
const getMyApplications = async (req, res, next) => {
  try {
    // Mock applications data
    const applications = [
      {
        id: "app-1",
        job: {
          id: "job-1",
          title: "Kitchen Renovation",
          client: "Sarah Mitchell",
          budget: 1200,
          status: "open"
        },
        status: "pending",
        appliedAt: "2023-10-15",
        message: "I have 8+ years of experience in kitchen renovations..."
      },
      {
        id: "app-2",
        job: {
          id: "job-2",
          title: "Office Electrical Work",
          client: "Tech Solutions Ltd",
          budget: 800,
          status: "closed"
        },
        status: "accepted",
        appliedAt: "2023-10-10",
        message: "Specialized in commercial electrical installations..."
      }
    ];
    
    return successResponse(res, 200, "Applications retrieved successfully", { applications });
  } catch (error) {
    next(error);
  }
};

/**
 * Get saved jobs
 * @route GET /api/jobs/saved
 * @access Private (Worker only)
 */
const getSavedJobs = async (req, res, next) => {
  try {
    // Mock saved jobs data
    const savedJobs = [
      {
        id: "job-3",
        title: "Bathroom Plumbing Repair",
        description: "Fix leaking pipes and install new fixtures",
        budget: 600,
        location: "Accra, Ghana",
        client: "John Doe",
        postedAt: "2023-10-12",
        savedAt: "2023-10-13"
      },
      {
        id: "job-4",
        title: "Garden Landscaping",
        description: "Design and implement garden layout",
        budget: 1500,
        location: "Kumasi, Ghana",
        client: "Mary Johnson",
        postedAt: "2023-10-11",
        savedAt: "2023-10-14"
      }
    ];
    
    return successResponse(res, 200, "Saved jobs retrieved successfully", { savedJobs });
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
  getDashboardJobs,
  getContracts,
  applyToJob,
  saveJob,
  unsaveJob,
  getMyApplications,
  getSavedJobs,
};
