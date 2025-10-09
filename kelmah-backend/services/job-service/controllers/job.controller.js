/**
 * Job Controller
 */

// Use shared and service-specific models via index
const { 
  Job, 
  User, 
  Application, 
  SavedJob,
  Bid,
  UserPerformance,
  Category,
  Contract,
  ContractDispute
} = require("../models");
const { AppError } = require("../middlewares/error");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response");
const { ensureConnection } = require('../config/db');

/**
 * Create a new job
 * @route POST /api/jobs
 * @access Private (Hirer only)
 */
const createJob = async (req, res, next) => {
  try {
    // Normalize incoming payload from legacy UI fields
    const body = { ...req.body };
    body.hirer = req.user.id;

    // Map legacy fields to canonical model
    // paymentType + budget.{min,max,fixed} → budget (number) + currency
    if (typeof body.budget === 'object') {
      const b = body.budget || {};
      const type = body.paymentType || b.type;
      const amount = type === 'hourly' ? Number(b.max || b.min || b.amount) : Number(b.fixed || b.amount);
      body.paymentType = type || 'fixed';
      body.budget = isFinite(amount) ? amount : undefined;
      body.currency = body.currency || b.currency || 'GHS';
    } else if (typeof body.budget === 'string') {
      body.budget = Number(body.budget);
    }

    // Ensure defaults for payment type and currency
    if (!body.paymentType) body.paymentType = 'fixed';
    if (!body.currency) body.currency = 'GHS';

    // duration string like "2 weeks" → { value, unit }
    if (typeof body.duration === 'string') {
      const match = body.duration.match(/(\d+)\s*(hour|day|week|month|hours|days|weeks|months)/i);
      if (match) {
        const val = Number(match[1]);
        let unit = match[2].toLowerCase();
        if (unit.endsWith('s')) unit = unit.slice(0, -1);
        body.duration = { value: val, unit };
      }
    }
    // Provide a default duration if still missing
    if (!body.duration || typeof body.duration !== 'object') {
      body.duration = { value: 1, unit: 'week' };
    }

    // locationType + location string → location object
    if (!body.location || typeof body.location === 'string' || body.locationType) {
      const type = body.locationType || body.location?.type || 'remote';
      const address = typeof body.location === 'string' ? body.location : body.location?.address;
      body.location = { type, address };
    }

    // Ensure skills is array of strings
    if (Array.isArray(body.skills)) {
      body.skills = body.skills.map(String);
    }

    // Map skills into requirements if requirements not provided
    if (!body.requirements) {
      const primary = Array.isArray(body.skills) && body.skills.length > 0 ? [String(body.skills[0])] : [];
      const secondary = Array.isArray(body.skills) && body.skills.length > 1 ? body.skills.slice(1).map(String) : [];
      body.requirements = {
        primarySkills: primary,
        secondarySkills: secondary,
        experienceLevel: body.experienceLevel || 'intermediate',
        certifications: [],
        tools: []
      };
    }

    // Provide bidding defaults if missing
    if (!body.bidding) {
      const base = Number(body.budget) || 0;
      const min = base > 0 ? Math.max(1, Math.floor(base * 0.8)) : 100;
      const max = base > 0 ? Math.max(min, Math.ceil(base * 1.2)) : 500;
      body.bidding = {
        maxBidders: 5,
        currentBidders: 0,
        bidDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        minBidAmount: min,
        maxBidAmount: max,
        bidStatus: 'open'
      };
    } else {
      // Ensure required bidding fields exist
      if (body.bidding.minBidAmount == null) {
        const base = Number(body.budget) || 0;
        body.bidding.minBidAmount = base > 0 ? Math.max(1, Math.floor(base * 0.8)) : 100;
      }
      if (body.bidding.maxBidAmount == null) {
        const base = Number(body.budget) || 0;
        const min = Number(body.bidding.minBidAmount) || 100;
        body.bidding.maxBidAmount = base > 0 ? Math.max(min, Math.ceil(base * 1.2)) : 500;
      }
      if (!body.bidding.bidDeadline) {
        body.bidding.bidDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      if (!body.bidding.maxBidders) body.bidding.maxBidders = 5;
      if (body.bidding.currentBidders == null) body.bidding.currentBidders = 0;
      if (!body.bidding.bidStatus) body.bidding.bidStatus = 'open';
    }

    // Map region/district into locationDetails if missing
    if (!body.locationDetails) {
      const region = body.region || body.location?.region || body.locationRegion || 'Greater Accra';
      const district = body.district || body.location?.district || body.locationDistrict;
      body.locationDetails = {
        region,
        district,
        coordinates: body.coordinates || { lat: undefined, lng: undefined },
        searchRadius: 25
      };
    }

    // Create job
    const job = await Job.create(body);

    return successResponse(res, 201, "Job created successfully", job);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single contract by id
 * @route GET /api/jobs/contracts/:id
 * @access Public
 */
const getContractById = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('job', 'title category')
      .populate('hirer', 'firstName lastName')
      .populate('worker', 'firstName lastName');
    if (!contract) return errorResponse(res, 404, 'Contract not found');
    return successResponse(res, 200, 'Contract retrieved', contract);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a contract dispute
 * @route POST /api/jobs/contracts/:id/disputes
 * @access Private (Hirer or Worker on contract)
 */
const createContractDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body || {};
    const userId = req.user?.id;
    if (!reason || !description) return errorResponse(res, 400, 'reason and description are required');
    const contract = await Contract.findById(id);
    if (!contract) return errorResponse(res, 404, 'Contract not found');
    if (String(contract.hirer) !== String(userId) && String(contract.worker) !== String(userId)) {
      return errorResponse(res, 403, 'Only contract parties can open disputes');
    }
    const dispute = await ContractDispute.create({ contract: id, user: userId, reason, description, status: 'open' });
    return successResponse(res, 201, 'Dispute created', dispute);
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
    const mongoose = require('mongoose');
    console.log('[GET JOBS] Starting getJobs function');
    console.log('[GET JOBS] Mongoose connection state:', mongoose.connection.readyState);
    
    // CHECK IF JOB MODEL IS USING THE CONNECTED MONGOOSE INSTANCE
    console.log('[GET JOBS] Job model database:', Job.db ? Job.db.databaseName : 'NO DB');
    console.log('[GET JOBS] Job model connection state:', Job.db ? Job.db.readyState : 'NO DB');
    console.log('[GET JOBS] Main mongoose database:', mongoose.connection.name);
    console.log('[GET JOBS] Same connection?:', Job.db === mongoose.connection);
    
    // Try direct MongoDB driver query to bypass Mongoose
    try {
      const client = mongoose.connection.getClient();
      const db = client.db();
      const jobsCollection = db.collection('jobs');
      const directCount = await jobsCollection.countDocuments({ status: 'open', visibility: 'public' });
      console.log('[GET JOBS] Direct driver query SUCCESS - open jobs count:', directCount);
      
      // If direct query works, try to use it
      if (directCount > 0) {
        console.log('[GET JOBS] USING DIRECT DRIVER QUERY as workaround');
      }
    } catch (clientError) {
      console.error('[GET JOBS] Error with direct driver query:', clientError.message);
    }
    
    console.log('[GET JOBS] Query params:', JSON.stringify(req.query));
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    console.log('[GET JOBS] Pagination:', { page, limit, startIndex });

    // Build query
    let query = { status: "open", visibility: "public" };
    console.log('[GET JOBS] Initial query:', JSON.stringify(query));

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

    // Enhanced location filtering
    if (req.query.location) {
      if (req.query.location.includes(',')) {
        // Multiple locations
        const locations = req.query.location.split(',').map(loc => loc.trim());
        query.$or = [
          { "location.city": { $in: locations } },
          { "location.region": { $in: locations } },
          { "location.country": { $in: locations } }
        ];
      } else {
        // Single location - search across city, region, country
        query.$or = [
          { "location.city": { $regex: req.query.location, $options: "i" } },
          { "location.region": { $regex: req.query.location, $options: "i" } },
          { "location.country": { $regex: req.query.location, $options: "i" } }
        ];
      }
    }

    // Geographic search (latitude/longitude with radius)
    if (req.query.latitude && req.query.longitude && req.query.radius) {
      const lat = parseFloat(req.query.latitude);
      const lng = parseFloat(req.query.longitude);
      const radius = parseFloat(req.query.radius) || 50; // km

      query["location.coordinates"] = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius / 6378.1] // Earth radius in km
        }
      };
    }

    // Job type filter
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Urgency filter
    if (req.query.urgent === 'true') {
      query.urgency = { $in: ['high', 'urgent'] };
    }

    // Remote work filter
    if (req.query.remote === 'true') {
      query.remote = true;
    }

    // Experience level filter
    if (req.query.experience) {
      query.experienceLevel = req.query.experience;
    }

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) query.createdAt.$lte = new Date(req.query.dateTo);
    }

    // Hirer rating filter
    if (req.query.minHirerRating) {
      // This would require a join with User collection to filter by hirer rating
      // For now, we'll add it to the aggregation pipeline later
    }

    // Search with advanced text search
    if (req.query.search) {
      const searchTerms = req.query.search.trim().split(' ');
      query.$or = [
        { $text: { $search: req.query.search } },
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { skills: { $in: searchTerms.map(term => new RegExp(term, 'i')) } },
        { category: { $regex: req.query.search, $options: "i" } }
      ];
    }

    // Execute query with pagination
    console.log('[GET JOBS] About to execute query...');
    console.log('[GET JOBS] Final query:', JSON.stringify(query));
    console.log('[GET JOBS] Sort:', req.query.sort || "-createdAt");
    
    // WORKAROUND: Use direct MongoDB driver because Mongoose model is disconnected
    const client = mongoose.connection.getClient();
    const db = client.db();
    const jobsCollection = db.collection('jobs');
    const usersCollection = db.collection('users');
    
    // Get jobs using native MongoDB driver
    const sortField = req.query.sort || "-createdAt";
    const sortOrder = sortField.startsWith('-') ? -1 : 1;
    const sortKey = sortField.replace(/^-/, '');
    
    const jobsCursor = jobsCollection
      .find(query)
      .sort({ [sortKey]: sortOrder })
      .skip(startIndex)
      .limit(limit);
    
    const jobs = await jobsCursor.toArray();
    console.log('[GET JOBS] Direct driver query executed successfully');
    console.log('[GET JOBS] Jobs found:', jobs.length);
    
    // Manually populate hirer data
    const hirerIds = [...new Set(jobs.map(j => j.hirer).filter(Boolean))];
    const hirers = await usersCollection
      .find({ _id: { $in: hirerIds } })
      .project({ firstName: 1, lastName: 1, profileImage: 1 })
      .toArray();
    
    const hirerMap = new Map(hirers.map(h => [h._id.toString(), h]));
    jobs.forEach(job => {
      if (job.hirer) {
        job.hirer = hirerMap.get(job.hirer.toString());
      }
    });

    // Transform jobs to match frontend expectations
    const transformedJobs = jobs.map(job => ({
      ...job,
      _id: job._id.toString(), // Convert ObjectId to string
      // Add budget object for complex budget display
      budget: {
        min: job.bidding?.minBidAmount || job.budget || 0,
        max: job.bidding?.maxBidAmount || job.budget || 0,
        type: job.paymentType || 'fixed',
        amount: job.budget || 0,
        currency: job.currency || 'GHS'
      },
      // Add missing fields that frontend expects
      hirer_name: job.hirer ? `${job.hirer.firstName} ${job.hirer.lastName}` : 'Unknown',
      profession: job.category,
      skills_required: job.skills ? job.skills.join(', ') : '',
      created_at: job.createdAt,
      // Add avatar field for hirer
      hirer: job.hirer ? {
        ...job.hirer,
        _id: job.hirer._id.toString(),
        avatar: job.hirer.profileImage,
        name: `${job.hirer.firstName} ${job.hirer.lastName}`
      } : null
    }));

    // Get total count using direct driver
    console.log('[GET JOBS] Getting total count...');
    const total = await jobsCollection.countDocuments(query);
    console.log('[GET JOBS] Total jobs:', total);

    console.log('[GET JOBS] Sending response...');
    return paginatedResponse(
      res,
      200,
      "Jobs retrieved successfully",
      transformedJobs,
      page,
      limit,
      total,
    );
  } catch (error) {
    console.error('[GET JOBS ERROR]', error);
    console.error('[GET JOBS ERROR] Stack:', error.stack);
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

    // Transform job data to match frontend expectations
    const transformedJob = {
      ...job.toObject(),
      // Add budget object for complex budget display (keeping original budget as well)
      budget: {
        min: job.bidding?.minBidAmount || job.budget || 0,
        max: job.bidding?.maxBidAmount || job.budget || 0,
        type: job.paymentType || 'fixed',
        amount: job.budget || 0,
        currency: job.currency || 'GHS'
      },
      // Add missing fields that frontend expects
      hirer_name: job.hirer ? `${job.hirer.firstName} ${job.hirer.lastName}` : 'Unknown',
      profession: job.category,
      skills_required: job.skills ? job.skills.join(', ') : '',
      created_at: job.createdAt,
      // Add avatar field for hirer
      hirer: {
        ...job.hirer?.toObject(),
        avatar: job.hirer?.profileImage,
        name: job.hirer ? `${job.hirer.firstName} ${job.hirer.lastName}` : 'Unknown'
      }
    };

    return successResponse(res, 200, "Job retrieved successfully", transformedJob);
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

    // Normalize incoming payload similarly to create
    const body = { ...req.body };
    if (typeof body.budget === 'object') {
      const b = body.budget || {};
      const type = body.paymentType || b.type;
      const amount = type === 'hourly' ? Number(b.max || b.min || b.amount) : Number(b.fixed || b.amount);
      body.paymentType = type || job.paymentType;
      body.budget = isFinite(amount) ? amount : job.budget;
      body.currency = body.currency || b.currency || job.currency || 'GHS';
    } else if (typeof body.budget === 'string') {
      body.budget = Number(body.budget);
    }
    if (typeof body.duration === 'string') {
      const match = body.duration.match(/(\d+)\s*(hour|day|week|month|hours|days|weeks|months)/i);
      if (match) {
        const val = Number(match[1]);
        let unit = match[2].toLowerCase();
        if (unit.endsWith('s')) unit = unit.slice(0, -1);
        body.duration = { value: val, unit };
      }
    }
    if (!body.location || typeof body.location === 'string' || body.locationType) {
      const type = body.locationType || body.location?.type || job.location?.type || 'remote';
      const address = typeof body.location === 'string' ? body.location : body.location?.address;
      body.location = { type, address };
    }
    if (Array.isArray(body.skills)) {
      body.skills = body.skills.map(String);
    }

    // Update job
    job = await Job.findByIdAndUpdate(req.params.id, body, {
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
const getDashboardJobs = async (req, res) => {
  const fallbackJobs = [
    {
      id: 'fallback-1',
      title: 'Electrical Wiring Project',
      description: 'Residential rewiring for three-bedroom house.',
      budget: { amount: 3200, currency: 'GHS' },
      location: { type: 'onsite', city: 'Accra', country: 'Ghana' },
      urgency: 'medium',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: 'fallback-2',
      title: 'Plumbing Maintenance',
      description: 'Monthly maintenance for small apartment complex.',
      budget: { amount: 1800, currency: 'GHS' },
      location: { type: 'onsite', city: 'Kumasi', country: 'Ghana' },
      urgency: 'low',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
  ];

  try {
    await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });
  } catch (connectionError) {
    console.warn('Dashboard jobs: database not ready, returning fallback data:', connectionError.message);
    return successResponse(res, 200, 'Dashboard jobs fallback data', {
      recentJobs: fallbackJobs,
      totalOpenJobs: fallbackJobs.length,
      totalJobsToday: 0,
      source: 'fallback-db-unready',
    });
  }

  let source = 'database';
  let recentJobs = [];

  try {
    recentJobs = await Job.find({ status: 'open', visibility: 'public' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('hirer', 'firstName lastName companyName')
      .select('title description budget location urgency createdAt')
      .lean({ defaults: true });
  } catch (queryError) {
    console.warn('Dashboard jobs: query failed, using fallback data:', queryError.message);
    source = 'fallback-query-failed';
    recentJobs = fallbackJobs;
  }

  if (!Array.isArray(recentJobs) || recentJobs.length === 0) {
    source = 'fallback-empty';
    recentJobs = fallbackJobs;
  } else {
    recentJobs = recentJobs.map((job) => ({
      ...job,
      id: job._id ? String(job._id) : job.id,
    }));
  }

  const [totalOpenResult, totalTodayResult] = await Promise.allSettled([
    Job.countDocuments({ status: 'open', visibility: 'public' }),
    Job.countDocuments({
      status: 'open',
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  if (totalOpenResult.status === 'rejected') {
    console.warn('Dashboard jobs: failed to count open jobs:', totalOpenResult.reason?.message);
  }
  if (totalTodayResult.status === 'rejected') {
    console.warn('Dashboard jobs: failed to count today jobs:', totalTodayResult.reason?.message);
  }

  const dashboardData = {
    recentJobs,
    totalOpenJobs: totalOpenResult.status === 'fulfilled' ? totalOpenResult.value : recentJobs.length,
    totalJobsToday: totalTodayResult.status === 'fulfilled' ? totalTodayResult.value : 0,
    source,
  };

  return successResponse(res, 200, 'Dashboard jobs retrieved successfully', dashboardData);
};

/**
 * Get contracts (jobs with contracts)
 * @route GET /api/jobs/contracts
 * @access Public
 */
const getContracts = async (req, res, next) => {
  try {
    console.log('📋 GET /api/jobs/contracts - Contracts endpoint called');
    console.log('🔍 Request details:', {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      service: 'job-service'
    });

    // Enhanced mock contracts data with more realistic details
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
        progress: 65,
        description: "Complete kitchen renovation including cabinets, countertops, and appliances",
        milestones: [
          {
            id: "milestone-1",
            title: "Demolition Complete",
            amount: 1500,
            status: "completed",
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
          },
          {
            id: "milestone-2",
            title: "Cabinet Installation", 
            amount: 2500,
            status: "in_progress",
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
          }
        ]
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
        progress: 0,
        description: "Modern office interior design with ergonomic workspace solutions",
        milestones: [
          {
            id: "milestone-3",
            title: "Design Approval",
            amount: 2000,
            status: "pending",
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)
          }
        ]
      },
      {
        id: "contract-3",
        title: "Plumbing System Upgrade",
        status: "completed",
        client: "Residential Complex Ltd",
        worker: "Expert Plumbers Co",
        amount: 3200,
        currency: "GHS",
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        progress: 100,
        description: "Complete plumbing system upgrade for 10-unit residential building",
        milestones: [
          {
            id: "milestone-4",
            title: "System Installation",
            amount: 3200,
            status: "completed",
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
          }
        ]
      }
    ];

    console.log(`✅ Returning ${contracts.length} contracts from Job Service`);
    return successResponse(res, 200, "Contracts retrieved successfully", { 
      contracts,
      meta: {
        total: contracts.length,
        service: 'job-service',
        timestamp: new Date().toISOString(),
        source: 'mock-data' // Will be 'database' when real implementation is done
      }
    });
  } catch (error) {
    console.error('❌ Error in getContracts:', error);
    next(error);
  }
};

/**
 * Get job recommendations for a worker based on their profile
 * @route GET /api/jobs/recommendations
 * @access Private (Worker only)
 */
const getJobRecommendations = async (req, res, next) => {
  try {
    const workerId = req.user.id;
    const { limit = 20, minScore = 40 } = req.query;
    
    // Get worker profile (assuming it's available via user service)
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      return errorResponse(res, 403, 'Only workers can access job recommendations');
    }

    // Build base query for available jobs
    let query = { 
      status: 'open', 
      visibility: 'public',
      // Don't show jobs user already applied to
      'applications.applicant': { $ne: workerId }
    };

    // Get all available jobs
    const jobs = await Job.find(query)
      .populate('hirer', 'firstName lastName profileImage rating totalJobsPosted')
      .sort('-createdAt')
      .limit(parseInt(limit) * 2); // Get more to allow for filtering

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => {
      const matchScore = calculateJobMatchScore(job, worker);
      
      return {
        ...job.toObject(),
        matchScore: matchScore.totalScore,
        matchDetails: matchScore.breakdown,
        matchReasons: matchScore.reasons
      };
    });

    // Filter by minimum score and sort by match score
    const recommendedJobs = jobsWithScores
      .filter(job => job.matchScore >= parseInt(minScore))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, parseInt(limit));

    return successResponse(res, 200, 'Job recommendations retrieved successfully', {
      jobs: recommendedJobs,
      totalRecommendations: recommendedJobs.length,
      averageMatchScore: recommendedJobs.reduce((sum, job) => sum + job.matchScore, 0) / recommendedJobs.length || 0
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get worker matches for a specific job
 * @route GET /api/jobs/:id/worker-matches
 * @access Private (Hirer only)
 */
const getWorkerMatches = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const hirerId = req.user.id;
    const { limit = 20, minScore = 40 } = req.query;

    // Get job and verify ownership
    const job = await Job.findById(jobId);
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    if (job.hirer.toString() !== hirerId) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Get available workers (this would typically call user-service)
    // For now, we'll use a basic query - in production this would be a service call
    const workers = await User.find({ 
      role: 'worker',
      isActive: true,
      'workerProfile.availabilityStatus': { $in: ['available', 'partially_available'] }
    }).limit(parseInt(limit) * 2);

    // Calculate match scores for each worker
    const workersWithScores = workers.map(worker => {
      const matchScore = calculateWorkerMatchScore(job, worker);
      
      return {
        id: worker._id,
        name: `${worker.firstName} ${worker.lastName}`,
        profileImage: worker.profileImage,
        rating: worker.rating || 0,
        completedJobs: worker.completedJobs || 0,
        skills: worker.skills || [],
        hourlyRate: worker.workerProfile?.hourlyRate || 0,
        location: worker.location,
        matchScore: matchScore.totalScore,
        matchDetails: matchScore.breakdown,
        matchReasons: matchScore.reasons
      };
    });

    // Filter by minimum score and sort by match score
    const matchedWorkers = workersWithScores
      .filter(worker => worker.matchScore >= parseInt(minScore))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, parseInt(limit));

    return successResponse(res, 200, 'Worker matches retrieved successfully', {
      workers: matchedWorkers,
      totalMatches: matchedWorkers.length,
      averageMatchScore: matchedWorkers.reduce((sum, worker) => sum + worker.matchScore, 0) / matchedWorkers.length || 0
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Calculate job match score for a worker
 */
function calculateJobMatchScore(job, worker) {
  let totalScore = 0;
  const breakdown = {};
  const reasons = [];

  // Skills matching (40% weight)
  const jobSkills = job.skills || [];
  const workerSkills = worker.skills || [];
  
  const skillMatches = jobSkills.filter(jobSkill =>
    workerSkills.some(workerSkill => 
      jobSkill.toLowerCase().includes(workerSkill.toLowerCase()) ||
      workerSkill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );
  
  const skillScore = jobSkills.length > 0 ? (skillMatches.length / jobSkills.length) * 40 : 0;
  breakdown.skills = skillScore;
  totalScore += skillScore;
  
  if (skillMatches.length > 0) {
    reasons.push(`${skillMatches.length}/${jobSkills.length} skill matches`);
  }

  // Location matching (25% weight)
  let locationScore = 0;
  if (job.location && worker.location) {
    if (job.location.city === worker.location.city) {
      locationScore = 25;
      reasons.push('Same city');
    } else if (job.location.region === worker.location.region) {
      locationScore = 15;
      reasons.push('Same region');
    } else if (job.location.country === worker.location.country) {
      locationScore = 5;
      reasons.push('Same country');
    }
  }
  breakdown.location = locationScore;
  totalScore += locationScore;

  // Budget compatibility (20% weight)
  let budgetScore = 0;
  if (job.budget && worker.workerProfile?.hourlyRate) {
    const expectedHours = job.estimatedHours || 40;
    const totalBudget = worker.workerProfile.hourlyRate * expectedHours;
    
    if (totalBudget <= job.budget) {
      budgetScore = 20;
      reasons.push('Budget compatible');
    } else if (totalBudget <= job.budget * 1.2) {
      budgetScore = 10;
      reasons.push('Budget close match');
    }
  } else if (!worker.workerProfile?.hourlyRate) {
    budgetScore = 10; // Neutral score if no rate specified
  }
  breakdown.budget = budgetScore;
  totalScore += budgetScore;

  // Worker rating (10% weight)
  const ratingScore = ((worker.rating || 0) / 5) * 10;
  breakdown.rating = ratingScore;
  totalScore += ratingScore;
  
  if (worker.rating >= 4.5) {
    reasons.push('Highly rated worker');
  }

  // Experience level (5% weight)
  let experienceScore = 0;
  const completedJobs = worker.completedJobs || 0;
  if (completedJobs >= 50) experienceScore = 5;
  else if (completedJobs >= 20) experienceScore = 4;
  else if (completedJobs >= 10) experienceScore = 3;
  else if (completedJobs >= 5) experienceScore = 2;
  else if (completedJobs >= 1) experienceScore = 1;
  
  breakdown.experience = experienceScore;
  totalScore += experienceScore;
  
  if (completedJobs >= 20) {
    reasons.push('Experienced worker');
  }

  return {
    totalScore: Math.round(totalScore),
    breakdown,
    reasons
  };
}

/**
 * Calculate worker match score for a job (inverse of above)
 */
function calculateWorkerMatchScore(job, worker) {
  // This is essentially the same logic as calculateJobMatchScore
  // but from the perspective of matching workers to a job
  return calculateJobMatchScore(job, worker);
}

/**
 * Advanced job search with multiple filters and sorting options
 * @route GET /api/jobs/search
 * @access Public
 */
const advancedJobSearch = async (req, res, next) => {
  try {
    const {
      q: query = '',
      location,
      category,
      skills,
      minBudget,
      maxBudget,
      jobType,
      experienceLevel,
      remote,
      urgent,
      latitude,
      longitude,
      radius = 50,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
      dateFrom,
      dateTo,
      minHirerRating
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    // Build aggregation pipeline for advanced search
    const pipeline = [];

    // Match stage - basic filters
    const matchStage = { 
      status: 'open', 
      visibility: 'public' 
    };

    // Category filter
    if (category) {
      matchStage.category = category;
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      matchStage.skills = { $in: skillsArray };
    }

    // Budget range filter
    if (minBudget || maxBudget) {
      matchStage.budget = {};
      if (minBudget) matchStage.budget.$gte = parseInt(minBudget);
      if (maxBudget) matchStage.budget.$lte = parseInt(maxBudget);
    }

    // Job type filter
    if (jobType) {
      matchStage.type = jobType;
    }

    // Experience level filter
    if (experienceLevel) {
      matchStage.experienceLevel = experienceLevel;
    }

    // Remote work filter
    if (remote === 'true') {
      matchStage.remote = true;
    }

    // Urgency filter
    if (urgent === 'true') {
      matchStage.urgency = { $in: ['high', 'urgent'] };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    // Location and geographic filters
    if (location) {
      const locationRegex = new RegExp(location, 'i');
      matchStage.$or = [
        { 'location.city': locationRegex },
        { 'location.region': locationRegex },
        { 'location.country': locationRegex }
      ];
    }

    // Geographic search
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius);

      matchStage['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusKm / 6378.1]
        }
      };
    }

    // Text search
    if (query) {
      const searchTerms = query.trim().split(' ');
      matchStage.$or = [
        { $text: { $search: query } },
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { skills: { $in: searchTerms.map(term => new RegExp(term, 'i')) } },
        { category: { $regex: query, $options: 'i' } }
      ];
    }

    pipeline.push({ $match: matchStage });

    // Lookup hirer information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'hirer',
        foreignField: '_id',
        as: 'hirerInfo'
      }
    });

    pipeline.push({
      $unwind: '$hirerInfo'
    });

    // Filter by hirer rating if specified
    if (minHirerRating) {
      pipeline.push({
        $match: {
          'hirerInfo.rating': { $gte: parseFloat(minHirerRating) }
        }
      });
    }

    // Add computed fields for sorting
    pipeline.push({
      $addFields: {
        relevanceScore: {
          $add: [
            { $cond: [{ $ne: ['$featured', null] }, 10, 0] },
            { $multiply: [{ $ifNull: ['$hirerInfo.rating', 0] }, 2] },
            { $cond: [{ $eq: ['$urgency', 'high'] }, 5, 0] },
            { $cond: [{ $gte: ['$budget', 1000] }, 3, 0] }
          ]
        },
        distanceScore: {
          $cond: [
            { $and: [{ $ne: ['$location.coordinates', null] }, latitude, longitude] },
            { $literal: 0 }, // Would calculate actual distance here
            { $literal: 0 }
          ]
        }
      }
    });

    // Sorting
    let sortStage = {};
    switch (sortBy) {
      case 'newest':
        sortStage = { createdAt: -1 };
        break;
      case 'oldest':
        sortStage = { createdAt: 1 };
        break;
      case 'budget_high':
        sortStage = { budget: -1, createdAt: -1 };
        break;
      case 'budget_low':
        sortStage = { budget: 1, createdAt: -1 };
        break;
      case 'rating':
        sortStage = { 'hirerInfo.rating': -1, createdAt: -1 };
        break;
      case 'distance':
        sortStage = { distanceScore: 1, relevanceScore: -1 };
        break;
      case 'relevance':
      default:
        sortStage = { relevanceScore: -1, createdAt: -1 };
        break;
    }

    pipeline.push({ $sort: sortStage });

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    // Project final fields
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        category: 1,
        skills: 1,
        budget: 1,
        type: 1,
        experienceLevel: 1,
        location: 1,
        remote: 1,
        urgency: 1,
        featured: 1,
        createdAt: 1,
        updatedAt: 1,
        relevanceScore: 1,
        hirer: {
          _id: '$hirerInfo._id',
          firstName: '$hirerInfo.firstName',
          lastName: '$hirerInfo.lastName',
          profileImage: '$hirerInfo.profileImage',
          rating: '$hirerInfo.rating',
          totalJobsPosted: '$hirerInfo.totalJobsPosted'
        }
      }
    });

    // Execute aggregation
    const jobs = await Job.aggregate(pipeline);

    // Get total count for pagination (separate query for performance)
    const countPipeline = pipeline.slice(0, -3); // Remove skip, limit, project
    countPipeline.push({ $count: 'total' });
    const countResult = await Job.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    return paginatedResponse(
      res,
      200,
      'Advanced job search completed',
      jobs,
      pageNum,
      pageSize,
      total
    );

  } catch (error) {
    console.error('Advanced search error:', error);
    next(error);
  }
};

/**
 * Get job analytics for admin dashboard
 * @route GET /api/jobs/analytics
 * @access Private (Admin only)
 */
const getJobAnalytics = async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return errorResponse(res, 403, 'Admin access required');
    }

    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      totalJobs,
      activeJobs,
      completedJobs,
      newJobs,
      jobsByCategory,
      jobsByLocation,
      budgetDistribution,
      jobTrends,
      avgJobBudget,
      topSkills
    ] = await Promise.all([
      Job.countDocuments({ visibility: 'public' }),
      Job.countDocuments({ status: 'open', visibility: 'public' }),
      Job.countDocuments({ status: 'completed', visibility: 'public' }),
      Job.countDocuments({ 
        createdAt: { $gte: startDate },
        visibility: 'public'
      }),
      
      // Jobs by category
      Job.aggregate([
        { $match: { visibility: 'public' } },
        { $group: { _id: '$category', count: { $sum: 1 }, avgBudget: { $avg: '$budget' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Jobs by location
      Job.aggregate([
        { $match: { visibility: 'public', 'location.city': { $exists: true } } },
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Budget distribution
      Job.aggregate([
        { $match: { visibility: 'public', budget: { $exists: true, $gt: 0 } } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ['$budget', 500] }, then: '0-500' },
                  { case: { $lte: ['$budget', 1000] }, then: '501-1000' },
                  { case: { $lte: ['$budget', 2500] }, then: '1001-2500' },
                  { case: { $lte: ['$budget', 5000] }, then: '2501-5000' },
                  { case: { $gt: ['$budget', 5000] }, then: '5000+' }
                ],
                default: 'Unknown'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Job trends (last 30 days)
      Job.aggregate([
        { 
          $match: { 
            createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
            visibility: 'public'
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Average job budget
      Job.aggregate([
        { $match: { visibility: 'public', budget: { $exists: true, $gt: 0 } } },
        { $group: { _id: null, avgBudget: { $avg: '$budget' } } }
      ]),
      
      // Top skills in demand
      Job.aggregate([
        { $match: { visibility: 'public', skills: { $exists: true, $ne: [] } } },
        { $unwind: '$skills' },
        { $group: { _id: '$skills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ])
    ]);

    const analytics = {
      overview: {
        totalJobs,
        activeJobs,
        completedJobs,
        newJobs,
        completionRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
        avgBudget: avgJobBudget[0]?.avgBudget || 0
      },
      categories: jobsByCategory,
      locations: jobsByLocation,
      budgetDistribution,
      trends: jobTrends,
      topSkills,
      timeRange,
      generatedAt: new Date().toISOString()
    };

    return successResponse(res, 200, 'Job analytics retrieved successfully', analytics);

  } catch (error) {
    console.error('Job analytics error:', error);
    next(error);
  }
};

/**
 * Get jobs assigned to current worker
 * @route GET /api/jobs/assigned
 * @access Private (Worker only)
 */
const getMyAssignedJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const query = { worker: req.user.id };
    if (req.query.status) query.status = req.query.status;
    const jobs = await Job.find(query)
      .populate('hirer', 'firstName lastName profileImage')
      .skip(startIndex)
      .limit(limit)
      .sort(req.query.sort || '-createdAt');
    const total = await Job.countDocuments(query);
    return paginatedResponse(res, 200, 'Assigned jobs retrieved', jobs, page, limit, total);
  } catch (error) { next(error); }
};

/**
 * Get applications of current worker
 * @route GET /api/jobs/applications/me
 * @access Private (Worker only)
 */
const getMyApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = { worker: req.user.id };
    if (status) q.status = status;
    const apps = await Application.find(q)
      .populate('job', 'title category budget location status')
      .sort('-createdAt');
    return successResponse(res, 200, 'Applications retrieved', apps);
  } catch (error) { next(error); }
};

/**
 * Apply to a job
 * @route POST /api/jobs/:id/apply
 * @access Private (Worker only)
 */
const applyToJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const workerId = req.user.id;
    const { proposedRate, coverLetter, estimatedDuration, attachments, availabilityStartDate, questionResponses } = req.body || {};

    const job = await Job.findById(jobId);
    if (!job) return errorResponse(res, 404, 'Job not found');

    // Only allow applying to open/public jobs
    if (job.status !== 'open' || job.visibility === 'private') {
      return errorResponse(res, 400, 'Job is not open for applications');
    }

    const app = await Application.create({
      job: jobId,
      worker: workerId,
      proposedRate,
      coverLetter,
      estimatedDuration,
      attachments,
      availabilityStartDate,
      questionResponses,
      status: 'pending',
    });

    return successResponse(res, 201, 'Application submitted', app);
  } catch (error) {
    if (error?.code === 11000) {
      return errorResponse(res, 409, 'You already applied to this job');
    }
    next(error);
  }
};

/**
 * Get applications for a job (hirer)
 * @route GET /api/jobs/:id/applications
 * @access Private (Hirer only)
 */
const getJobApplications = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) return errorResponse(res, 404, 'Job not found');
    if (String(job.hirer) !== String(req.user.id)) {
      return errorResponse(res, 403, 'Not authorized');
    }
    const { status } = req.query;
    const query = { job: jobId };
    if (status) query.status = status;
    const apps = await Application.find(query)
      .populate('worker', 'firstName lastName profileImage rating')
      .sort('-createdAt');
    return successResponse(res, 200, 'Applications retrieved', apps);
  } catch (error) {
    next(error);
  }
};

/**
 * Update application status (hirer)
 * @route PUT /api/jobs/:id/applications/:applicationId
 * @access Private (Hirer only)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id: jobId, applicationId } = req.params;
    const { status, notes } = req.body || {};
    const job = await Job.findById(jobId);
    if (!job) return errorResponse(res, 404, 'Job not found');
    if (String(job.hirer) !== String(req.user.id)) {
      return errorResponse(res, 403, 'Not authorized');
    }
    const valid = ['pending','under_review','accepted','rejected','withdrawn'];
    if (!valid.includes(status)) return errorResponse(res, 400, 'Invalid status');
    const app = await Application.findOne({ _id: applicationId, job: jobId });
    if (!app) return errorResponse(res, 404, 'Application not found');
    app.status = status;
    if (notes) app.notes = notes;
    await app.save();
    return successResponse(res, 200, 'Application updated', app);
  } catch (error) { next(error); }
};

/**
 * Withdraw application (worker)
 * @route DELETE /api/jobs/:id/applications/:applicationId
 * @access Private (Worker only)
 */
const withdrawApplication = async (req, res, next) => {
  try {
    const { id: jobId, applicationId } = req.params;
    const app = await Application.findOne({ _id: applicationId, job: jobId });
    if (!app) return errorResponse(res, 404, 'Application not found');
    if (String(app.worker) !== String(req.user.id)) {
      return errorResponse(res, 403, 'Not authorized');
    }
    app.status = 'withdrawn';
    await app.save();
    return successResponse(res, 200, 'Application withdrawn', app);
  } catch (error) { next(error); }
};

/**
 * Saved jobs
 */
const getSavedJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const saves = await SavedJob.find({ user: userId })
      .populate('job')
      .sort('-createdAt');
    const jobs = saves.map((s) => s.job).filter(Boolean);
    return successResponse(res, 200, 'Saved jobs retrieved', { jobs });
  } catch (error) { next(error); }
};

const saveJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) return errorResponse(res, 404, 'Job not found');
    await SavedJob.create({ user: userId, job: jobId });
    return successResponse(res, 201, 'Job saved');
  } catch (error) {
    if (error?.code === 11000) return successResponse(res, 200, 'Job already saved');
    next(error);
  }
};

const unsaveJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;
    await SavedJob.deleteOne({ user: userId, job: jobId });
    return successResponse(res, 200, 'Job unsaved');
  } catch (error) { next(error); }
};

/**
 * Job categories
 */
const getJobCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    return successResponse(res, 200, 'Categories retrieved', categories);
  } catch (error) { next(error); }
};

/**
 * Enhanced Job Distribution Methods
 */

// Get jobs by location with performance-based filtering
const getJobsByLocation = async (req, res, next) => {
  try {
    const { region, district } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    if (!region) {
      return errorResponse(res, 400, 'Region is required');
    }

    const query = { 'locationDetails.region': region };
    if (district) {
      query['locationDetails.district'] = district;
    }

    const { count, rows } = await Job.findAndCountAll({
      where: query,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        { model: 'User', as: 'hirer', attributes: ['firstName', 'lastName', 'profilePicture'] }
      ]
    });

    return paginatedResponse(res, 200, 'Jobs by location retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Get jobs by skill with performance-based filtering
const getJobsBySkill = async (req, res, next) => {
  try {
    const { skill } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const jobs = await Job.findBySkill(skill)
      .populate('hirer', 'firstName lastName profilePicture')
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCount = await Job.countDocuments({
      $or: [
        { 'requirements.primarySkills': skill },
        { 'requirements.secondarySkills': skill },
        { skills: skill }
      ]
    });

    return paginatedResponse(res, 200, `Jobs for ${skill} skill retrieved successfully`, jobs, page, limit, totalCount);
  } catch (error) {
    next(error);
  }
};

// Get jobs by performance tier
const getJobsByPerformanceTier = async (req, res, next) => {
  try {
    const { tier } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const validTiers = ['tier1', 'tier2', 'tier3'];
    if (!validTiers.includes(tier)) {
      return errorResponse(res, 400, 'Invalid tier. Must be tier1, tier2, or tier3');
    }

    const jobs = await Job.findByPerformanceTier(tier)
      .populate('hirer', 'firstName lastName profilePicture')
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCount = await Job.countDocuments({ performanceTier: tier });

    return paginatedResponse(res, 200, `Jobs for ${tier} retrieved successfully`, jobs, page, limit, totalCount);
  } catch (error) {
    next(error);
  }
};

// Get personalized job recommendations based on user performance
const getPersonalizedJobRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Get user performance data
    const userPerformance = await UserPerformance.findOne({ userId });
    if (!userPerformance) {
      return errorResponse(res, 404, 'User performance data not found');
    }

    // Get user's skills
    const primarySkills = userPerformance.skillVerification.primarySkills
      .filter(skill => skill.verified)
      .map(skill => skill.skill);
    
    const secondarySkills = userPerformance.skillVerification.secondarySkills
      .filter(skill => skill.verified)
      .map(skill => skill.skill);

    const allSkills = [...primarySkills, ...secondarySkills];

    if (allSkills.length === 0) {
      return successResponse(res, 200, 'No skills found for recommendations', []);
    }

    // Find jobs matching user skills
    const jobs = await Job.find({
      $or: [
        { 'requirements.primarySkills': { $in: allSkills } },
        { 'requirements.secondarySkills': { $in: allSkills } },
        { skills: { $in: allSkills } }
      ],
      status: 'open',
      'bidding.bidStatus': 'open'
    })
    .populate('hirer', 'firstName lastName profilePicture')
    .skip(offset)
    .limit(limit)
    .sort({ createdAt: -1 });

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => {
      let score = 0;
      
      // Skill matching (40% weight)
      const primarySkillMatch = job.requirements.primarySkills.some(skill => primarySkills.includes(skill));
      const secondarySkillMatch = job.requirements.secondarySkills.some(skill => secondarySkills.includes(skill));
      if (primarySkillMatch) score += 40;
      if (secondarySkillMatch) score += 20;
      
      // Location matching (30% weight)
      if (userPerformance.locationPreferences.primaryRegion === job.locationDetails.region) {
        score += 30;
      }
      
      // Performance tier matching (20% weight)
      if (userPerformance.performanceTier === job.performanceTier) {
        score += 20;
      }
      
      // Recent job bonus (10% weight)
      const daysSincePosted = Math.floor((new Date() - job.createdAt) / (1000 * 60 * 60 * 24));
      if (daysSincePosted <= 3) score += 10;
      
      return { ...job.toObject(), matchScore: score };
    });

    // Sort by match score
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    const totalCount = await Job.countDocuments({
      $or: [
        { 'requirements.primarySkills': { $in: allSkills } },
        { 'requirements.secondarySkills': { $in: allSkills } },
        { skills: { $in: allSkills } }
      ],
      status: 'open',
      'bidding.bidStatus': 'open'
    });

    return paginatedResponse(res, 200, 'Personalized job recommendations retrieved successfully', jobsWithScores, page, limit, totalCount);
  } catch (error) {
    next(error);
  }
};

// Close job bidding
const closeJobBidding = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);

    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only close bidding for your own jobs');
    }

    await job.closeBidding();

    return successResponse(res, 200, 'Job bidding closed successfully', job);
  } catch (error) {
    next(error);
  }
};

// Extend job deadline
const extendJobDeadline = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { days = 7 } = req.body;
    const job = await Job.findById(jobId);

    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only extend deadline for your own jobs');
    }

    await job.extendDeadline(days);

    return successResponse(res, 200, 'Job deadline extended successfully', job);
  } catch (error) {
    next(error);
  }
};

// Renew expired job
const renewJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);

    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only renew your own jobs');
    }

    if (!job.isExpired) {
      return errorResponse(res, 400, 'Job is not expired');
    }

    await job.renewJob();

    return successResponse(res, 200, 'Job renewed successfully', job);
  } catch (error) {
    next(error);
  }
};

// Get expired jobs for cleanup
const getExpiredJobs = async (req, res, next) => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const expiredJobs = await Job.findExpiredJobs();
    return successResponse(res, 200, 'Expired jobs retrieved successfully', expiredJobs);
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
  getContractById,
  createContractDispute,
  getJobRecommendations,
  getWorkerMatches,
  advancedJobSearch,
  getJobAnalytics,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  getSavedJobs,
  saveJob,
  unsaveJob,
  getJobCategories,
  getMyAssignedJobs,
  getMyApplications,
  // Enhanced Job Distribution Methods
  getJobsByLocation,
  getJobsBySkill,
  getJobsByPerformanceTier,
  getPersonalizedJobRecommendations,
  closeJobBidding,
  extendJobDeadline,
  renewJob,
  getExpiredJobs,
};
