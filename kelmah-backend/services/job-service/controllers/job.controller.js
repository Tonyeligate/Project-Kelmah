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
  WorkerProfile,
  Category,
  Contract,
  ContractDispute,
  Availability
} = require("../models");
const { AppError } = require("../middlewares/error");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response");
const { ensureConnection, ensureMongoReady, mongoose } = require('../config/db');
const { transformJobsForFrontend, transformJobForFrontend } = require('../utils/jobTransform');
const { createLogger } = require('../utils/logger');
const {
  hasCloudinaryConfig,
  uploadDataUri,
  toMediaAsset,
  isDataUri,
} = require('../../../shared/utils/cloudinary');
const { buildCanonicalWorkerSnapshot } = require('../../../shared/utils/canonicalWorker');
const {
  MOBILE_RECOMMENDATIONS_CONTRACT,
  PROFILE_INCOMPLETE_RECOMMENDATION_MESSAGE,
} = require('../../../shared/constants/recommendations');

const jobLogger = createLogger('job-controller');

const normalizeHeaders = (headers = {}) => {
  return Object.entries(headers).reduce((acc, [key, value]) => {
    acc[String(key).toLowerCase()] = value;
    return acc;
  }, {});
};

const parseContentLength = (explicitValue, fallbackBody) => {
  const numericValue = Number(explicitValue);
  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  try {
    const serialized = JSON.stringify(fallbackBody ?? {});
    return Buffer.byteLength(serialized, 'utf8');
  } catch (err) {
    jobLogger.debug('job.create.payloadSizeFallbackFailed', { error: err.message });
    return undefined;
  }
};

const resolveRequestMeta = (req = {}) => {
  const headers = normalizeHeaders(req.headers || {});
  const requestId = req.id || headers['x-request-id'] || headers['x-correlation-id'];
  const correlationId = headers['x-correlation-id'] || requestId;
  const authSource = headers['x-auth-source'] || 'unknown';
  const contentLength = parseContentLength(headers['content-length'], req.body);

  return {
    requestId,
    correlationId,
    authSource,
    contentLength
  };
};

const countArray = (value) => (Array.isArray(value) ? value.length : 0);

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const summarizeJobPayload = (body = {}) => {
  return {
    paymentType: body.paymentType || null,
    currency: body.currency || null,
    budget: safeNumber(body.budget),
    visibility: body.visibility || 'public',
    skillsCount: countArray(body.skills),
    requirements: {
      primarySkills: countArray(body.requirements?.primarySkills),
      secondarySkills: countArray(body.requirements?.secondarySkills),
      experienceLevel: body.requirements?.experienceLevel || null
    },
    bidding: {
      minBidAmount: safeNumber(body.bidding?.minBidAmount),
      maxBidAmount: safeNumber(body.bidding?.maxBidAmount),
      maxBidders: safeNumber(body.bidding?.maxBidders)
    },
    duration: typeof body.duration === 'object' ? body.duration : null,
    locationType: body.location?.type || null,
    region: body.locationDetails?.region || body.region || null,
    attachments: countArray(body.attachments),
    tags: countArray(body.tags),
    hasDescription: Boolean(body.description)
  };
};

const READY_REUSE_WINDOW_MS = Number(process.env.DB_READY_REUSE_MS || 2000);

const normalizeJobCoverImage = async (body = {}, userId) => {
  if (!body.coverImage || !isDataUri(body.coverImage) || !hasCloudinaryConfig()) {
    return body;
  }

  const uploaded = await uploadDataUri({
    dataUri: body.coverImage,
    folder: 'jobs/covers',
    filename: `job-cover-${userId || 'unknown'}-${Date.now()}`,
    resourceType: 'image',
    tags: ['job-cover'],
    context: {
      userId: String(userId || 'unknown'),
    },
  });

  return {
    ...body,
    coverImage: uploaded.secure_url,
    coverImageMetadata: toMediaAsset(uploaded),
  };
};

const bindJobCoverImageMetadata = (metadata = {}, { jobId, hirerId, coverImage } = {}) => {
  const normalizedJobId = jobId?.toString?.() || String(jobId || '');
  const normalizedHirerId = hirerId?.toString?.() || String(hirerId || '');
  const normalizedCoverImage = typeof coverImage === 'string' ? coverImage.trim() : '';

  if (!normalizedJobId) {
    return metadata;
  }

  return {
    ...(metadata && typeof metadata === 'object' ? metadata : {}),
    url: metadata?.url || metadata?.secureUrl || metadata?.secure_url || normalizedCoverImage || '',
    secureUrl: metadata?.secureUrl || metadata?.secure_url || metadata?.url || normalizedCoverImage || '',
    ownerType: 'job',
    ownerId: normalizedJobId,
    jobId: normalizedJobId,
    hirerId: normalizedHirerId || null,
    imageBindingKey: `job:${normalizedJobId}:cover`,
  };
};

const canViewRestrictedJob = (reqUser, job = {}) => {
  if (!reqUser || !job) {
    return false;
  }

  const hirerId = job.hirer?._id || job.hirer;
  return reqUser.role === 'admin' || String(reqUser.id) === String(hirerId);
};

const normalizeSkillValues = (values = []) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => {
      if (typeof value === 'string') {
        return value;
      }
      if (value && typeof value === 'object') {
        return value.name || value.skillName || value.title || '';
      }
      return '';
    })
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
};

const collectJobSkills = (job = {}) => {
  const primarySkills = normalizeSkillValues(job.requirements?.primarySkills || []);
  const secondarySkills = normalizeSkillValues(job.requirements?.secondarySkills || []);
  const explicitSkills = normalizeSkillValues(job.skills || []);
  return Array.from(new Set([...primarySkills, ...secondarySkills, ...explicitSkills]));
};

const collectWorkerSkills = (worker = {}) => {
  return Array.from(
    new Set([
      ...normalizeSkillValues(worker.skills || []),
      ...normalizeSkillValues(worker.workerProfile?.skills || []),
      ...normalizeSkillValues(worker.specializations || []),
      ...normalizeSkillValues(worker.workerProfile?.specializations || []),
    ]),
  );
};

const escapeRegexLiteral = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCaseInsensitiveExactRegexes = (values = []) =>
  Array.from(new Set(normalizeSkillValues(values))).map(
    (value) => new RegExp(`^${escapeRegexLiteral(value)}$`, 'i'),
  );

const SKILL_SYNONYM_MAP = {
  electrician: ['electrical', 'electrical work', 'wiring'],
  electrical: ['electrician', 'electrical work', 'wiring'],
  'electrical work': ['electrician', 'electrical', 'wiring'],
  plumbing: ['plumber', 'pipe fitting', 'sanitary'],
  plumber: ['plumbing', 'pipe fitting', 'sanitary'],
  carpentry: ['carpenter', 'woodwork', 'joinery'],
  carpenter: ['carpentry', 'woodwork', 'joinery'],
  masonry: ['mason', 'bricklaying', 'construction'],
  mason: ['masonry', 'bricklaying', 'construction'],
  painting: ['painter', 'decorating'],
  painter: ['painting', 'decorating'],
  welding: ['welder', 'metal work', 'fabrication'],
  welder: ['welding', 'metal work', 'fabrication'],
};

const expandSkillSynonyms = (skill = '') => {
  const normalized = String(skill || '').trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return Array.from(new Set([normalized, ...(SKILL_SYNONYM_MAP[normalized] || [])]));
};

const skillsSemanticallyMatch = (leftSkill = '', rightSkill = '') => {
  const normalizedLeft = String(leftSkill || '').trim().toLowerCase();
  const normalizedRight = String(rightSkill || '').trim().toLowerCase();

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  const leftVariants = expandSkillSynonyms(normalizedLeft);
  const rightVariants = expandSkillSynonyms(normalizedRight);

  if (leftVariants.some((variant) => rightVariants.includes(variant))) {
    return true;
  }

  const leftWords = normalizedLeft.split(/\s+/).filter(Boolean);
  const rightWords = normalizedRight.split(/\s+/).filter(Boolean);
  if (leftWords.length < 2 && rightWords.length < 2) {
    return false;
  }

  return (
    leftWords.every((word) => rightWords.includes(word)) ||
    rightWords.every((word) => leftWords.includes(word))
  );
};

const getCanonicalWorkerContext = async (workerId) => {
  const [workerUser, workerProfile, userPerformance, activeContractsCount, availability] = await Promise.all([
    User.findById(workerId).lean(),
    WorkerProfile.findOne({ userId: workerId }).lean(),
    UserPerformance.findOne({ userId: workerId }).lean(),
    typeof Contract?.countDocuments === 'function'
      ? Contract.countDocuments({
        worker: workerId,
        status: { $in: ['pending', 'active'] },
      })
      : 0,
    Availability ? Availability.findOne({ user: workerId }).lean() : null,
  ]);

  if (!workerUser || workerUser.role !== 'worker') {
    return null;
  }

  const worker = {
    ...buildCanonicalWorkerSnapshot(workerUser, workerProfile || {}),
    userPerformance,
    activeContractsCount,
    availability,
  };

  return {
    workerUser,
    workerProfile,
    userPerformance,
    activeContractsCount,
    availability,
    worker,
  };
};

const mapExperienceLevelToMinimumYears = (level = '') => {
  switch (String(level).trim().toLowerCase()) {
    case 'expert':
      return 8;
    case 'advanced':
      return 5;
    case 'intermediate':
      return 2;
    case 'beginner':
      return 0;
    default:
      return null;
  }
};

const readLocationParts = (locationValue = {}) => {
  if (typeof locationValue === 'string') {
    const parts = locationValue.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean);
    return {
      city: parts[0] || '',
      region: parts[1] || parts[0] || '',
    };
  }

  return {
    city: String(locationValue.city || locationValue.district || '').trim().toLowerCase(),
    region: String(locationValue.region || '').trim().toLowerCase(),
  };
};

// Haversine distance in km between two lat/lng pairs
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Extract coordinates from job or worker location data
const extractCoordinates = (entity) => {
  if (entity.geoLocation?.coordinates?.length === 2) {
    return { lat: entity.geoLocation.coordinates[1], lng: entity.geoLocation.coordinates[0] };
  }
  if (entity.locationDetails?.coordinates?.lat && entity.locationDetails?.coordinates?.lng) {
    return { lat: Number(entity.locationDetails.coordinates.lat), lng: Number(entity.locationDetails.coordinates.lng) };
  }
  if (entity.locationCoordinates?.coordinates?.length === 2) {
    return { lat: entity.locationCoordinates.coordinates[1], lng: entity.locationCoordinates.coordinates[0] };
  }
  return null;
};

/**
 * Create a new job
 * @route POST /api/jobs
 * @access Private (Hirer only)
 */
const createJob = async (req, res, next) => {
  const totalStart = Date.now();
  const requestMeta = resolveRequestMeta(req);
  const requestId = requestMeta.requestId;
  const correlationId = requestMeta.correlationId;
  const baseLogMeta = {
    requestId,
    correlationId,
    userId: req.user?.id,
    authSource: requestMeta.authSource,
    contentLength: requestMeta.contentLength
  };

  try {
    // SECURITY: allowlist body fields to prevent prototype pollution during processing
    // S-05 FIX: Removed 'status' — clients cannot set arbitrary status on creation
    const JOB_CREATE_FIELDS = [
      'title', 'description', 'category', 'budget', 'paymentType', 'currency',
      'duration', 'location', 'locationType', 'skills', 'requirements',
      'bidding', 'locationDetails', 'region', 'district', 'locationRegion',
      'locationDistrict', 'coordinates', 'experienceLevel', 'visibility',
      'tags', 'attachments', 'urgency', 'deadline', 'coverImage',
      'coverImageMetadata'
    ];
    const body = {};
    for (const key of JOB_CREATE_FIELDS) {
      if (key in req.body) body[key] = req.body[key];
    }
    body.hirer = req.user?.id;

    if (typeof body.budget === 'object') {
      const b = body.budget || {};
      const type = body.paymentType || b.type;
      const amount = type === 'hourly'
        ? Number(b.max || b.min || b.amount)
        : Number(b.fixed || b.amount);
      body.paymentType = type || 'fixed';
      body.budget = Number.isFinite(amount) ? amount : undefined;
      body.currency = body.currency || b.currency || 'GHS';
    } else if (typeof body.budget === 'string') {
      body.budget = Number(body.budget);
    }

    if (!body.paymentType) body.paymentType = 'fixed';
    if (!body.currency) body.currency = 'GHS';
    // Always default to public visibility so new jobs appear on the public jobs page
    if (!body.visibility) body.visibility = 'public';
    // Force status - clients cannot set arbitrary status on creation
    body.status = (body.status === 'draft') ? 'draft' : 'open';

    if (typeof body.duration === 'string') {
      const match = body.duration.match(/(\d+)\s*(hour|day|week|month|hours|days|weeks|months)/i);
      if (match) {
        const val = Number(match[1]);
        let unit = match[2].toLowerCase();
        if (unit.endsWith('s')) unit = unit.slice(0, -1);
        body.duration = { value: val, unit };
      }
    }
    if (!body.duration || typeof body.duration !== 'object') {
      body.duration = { value: 1, unit: 'week' };
    }

    if (!body.location || typeof body.location === 'string' || body.locationType) {
      const type = body.locationType || body.location?.type || 'remote';
      const address = typeof body.location === 'string' ? body.location : body.location?.address;
      body.location = { type, address };
    }

    if (Array.isArray(body.skills)) {
      body.skills = body.skills.map(String);
    }

    Object.assign(body, await normalizeJobCoverImage(body, req.user?.id));

    // Valid enum values for requirements.primarySkills and secondarySkills
    const VALID_PRIMARY_SKILLS = ["Plumbing", "Electrical", "Carpentry", "Construction", "Painting", "Welding", "Masonry", "HVAC", "Roofing", "Flooring"];

    if (!body.requirements) {
      // Filter skills to only include valid enum values for primarySkills
      const allSkills = Array.isArray(body.skills) ? body.skills.map(String) : [];
      const validSkills = allSkills.filter(skill => VALID_PRIMARY_SKILLS.includes(skill));

      // If no valid skills found, try to map category to a skill
      // AUD2-M01 FIX: Expanded map to cover all frontend-offered categories.
      // Unmapped categories now return a clear 400 instead of silently misfiling as Construction.
      let primary = validSkills.length > 0 ? [validSkills[0]] : [];
      if (primary.length === 0 && body.category) {
        // Map frontend-offered categories to primarySkills enum values
        const categoryToSkill = {
          'Plumbing': 'Plumbing',
          'Electrical': 'Electrical',
          'Carpentry': 'Carpentry',
          'Masonry': 'Masonry',
          'Welding': 'Welding',
          'Painting': 'Painting',
          'HVAC': 'HVAC',
          'Roofing': 'Roofing',
          'Tiling': 'Flooring',
          'Flooring': 'Flooring',
          'Construction': 'Construction',
          'Interior Design': 'Painting',
          'Landscaping': 'Construction',
          // Additional categories aligned with frontend options
          'General Repairs': 'Construction',
          'Cleaning': 'Construction',
          'Pest Control': 'Construction',
          'Security': 'Construction',
          'IT/Tech': 'Construction',
        };
        const mappedSkill = categoryToSkill[body.category];
        if (mappedSkill) {
          primary = [mappedSkill];
        } else {
          // AUD2-M01 FIX: Return 400 for unknown categories instead of silently misfiling
          // as Construction which corrupts search index and worker matching.
          jobLogger.warn('job.create.unmappedCategory', {
            ...baseLogMeta,
            category: body.category,
            message: 'Category cannot be mapped to a valid primary skill'
          });
          return errorResponse(res, 400,
            `Category "${body.category}" is not supported. Please use one of the available categories or include a matching skill from: ${VALID_PRIMARY_SKILLS.join(', ')}`,
            'UNSUPPORTED_CATEGORY'
          );
        }
      }

      const secondary = validSkills.length > 1 ? validSkills.slice(1) : [];
      body.requirements = {
        primarySkills: primary,
        secondarySkills: secondary,
        experienceLevel: body.experienceLevel || 'intermediate',
        certifications: [],
        tools: []
      };
    }

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

    const payloadSummary = summarizeJobPayload(body);

    jobLogger.info('job.create.request', {
      ...baseLogMeta,
      payload: payloadSummary
    });

    const writeStart = Date.now();

    // ========== COMPREHENSIVE SCHEMA VALIDATION DEBUG ==========
    // Check if data matches what the schema expects BEFORE attempting insert
    const VALID_REGIONS = [
      "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
      "Volta", "Northern", "Upper East", "Upper West", "Brong-Ahafo",
      "Oti", "Bono East", "North East", "Savannah", "Western North", "Ahafo"
    ];
    const VALID_SKILLS = ["Plumbing", "Electrical", "Carpentry", "Construction", "Painting", "Welding", "Masonry", "HVAC", "Roofing", "Flooring"];
    const VALID_LOCATION_TYPES = ["remote", "onsite", "hybrid"];
    const VALID_PAYMENT_TYPES = ["fixed", "hourly"];
    const VALID_DURATION_UNITS = ["hour", "day", "week", "month"];
    const VALID_EXP_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

    const validationIssues = [];

    // Check required fields
    if (!body.title) validationIssues.push('MISSING: title (required)');
    if (!body.description) validationIssues.push('MISSING: description (required)');
    if (!body.category) validationIssues.push('MISSING: category (required)');
    if (body.budget == null || !Number.isFinite(body.budget)) validationIssues.push(`INVALID: budget=${body.budget} (must be a number)`);
    if (!body.hirer) validationIssues.push('MISSING: hirer (required ObjectId)');

    // Check location.type enum
    if (!body.location?.type) {
      validationIssues.push('MISSING: location.type (required)');
    } else if (!VALID_LOCATION_TYPES.includes(body.location.type)) {
      validationIssues.push(`INVALID: location.type="${body.location.type}" not in [${VALID_LOCATION_TYPES.join(', ')}]`);
    }

    // Check paymentType enum
    if (!body.paymentType) {
      validationIssues.push('MISSING: paymentType (required)');
    } else if (!VALID_PAYMENT_TYPES.includes(body.paymentType)) {
      validationIssues.push(`INVALID: paymentType="${body.paymentType}" not in [${VALID_PAYMENT_TYPES.join(', ')}]`);
    }

    // Check duration
    if (!body.duration?.value || !Number.isFinite(body.duration.value)) {
      validationIssues.push(`INVALID: duration.value=${body.duration?.value} (must be a number)`);
    }
    if (!body.duration?.unit) {
      validationIssues.push('MISSING: duration.unit (required)');
    } else if (!VALID_DURATION_UNITS.includes(body.duration.unit)) {
      validationIssues.push(`INVALID: duration.unit="${body.duration.unit}" not in [${VALID_DURATION_UNITS.join(', ')}]`);
    }

    // Check locationDetails.region enum (REQUIRED)
    if (!body.locationDetails?.region) {
      validationIssues.push('MISSING: locationDetails.region (required)');
    } else if (!VALID_REGIONS.includes(body.locationDetails.region)) {
      validationIssues.push(`INVALID: locationDetails.region="${body.locationDetails.region}" not in [${VALID_REGIONS.join(', ')}]`);
    }

    // Check requirements.primarySkills enum (REQUIRED)
    if (!body.requirements?.primarySkills || !Array.isArray(body.requirements.primarySkills) || body.requirements.primarySkills.length === 0) {
      validationIssues.push('MISSING: requirements.primarySkills (required array with at least one skill)');
    } else {
      const invalidPrimarySkills = body.requirements.primarySkills.filter(s => !VALID_SKILLS.includes(s));
      if (invalidPrimarySkills.length > 0) {
        validationIssues.push(`INVALID: requirements.primarySkills contains invalid values: [${invalidPrimarySkills.join(', ')}]`);
      }
    }

    // Check requirements.experienceLevel enum
    if (body.requirements?.experienceLevel && !VALID_EXP_LEVELS.includes(body.requirements.experienceLevel)) {
      validationIssues.push(`INVALID: requirements.experienceLevel="${body.requirements.experienceLevel}" not in [${VALID_EXP_LEVELS.join(', ')}]`);
    }

    // Check bidding required fields
    if (body.bidding?.minBidAmount == null || !Number.isFinite(body.bidding.minBidAmount)) {
      validationIssues.push(`INVALID: bidding.minBidAmount=${body.bidding?.minBidAmount} (required number)`);
    }
    if (body.bidding?.maxBidAmount == null || !Number.isFinite(body.bidding.maxBidAmount)) {
      validationIssues.push(`INVALID: bidding.maxBidAmount=${body.bidding?.maxBidAmount} (required number)`);
    }

    // Log validation results
    jobLogger.info('job.create.schemaValidation', {
      ...baseLogMeta,
      validationPassed: validationIssues.length === 0,
      issueCount: validationIssues.length,
      issues: validationIssues,
      actualData: {
        title: body.title ? `"${body.title.substring(0, 30)}..."` : null,
        description: body.description ? `${body.description.length} chars` : null,
        category: body.category,
        budget: body.budget,
        paymentType: body.paymentType,
        hirer: body.hirer,
        locationType: body.location?.type,
        locationRegion: body.locationDetails?.region,
        durationValue: body.duration?.value,
        durationUnit: body.duration?.unit,
        primarySkills: body.requirements?.primarySkills,
        experienceLevel: body.requirements?.experienceLevel,
        biddingMin: body.bidding?.minBidAmount,
        biddingMax: body.bidding?.maxBidAmount
      }
    });

    // Debug: Log model and connection state before write
    jobLogger.info('job.create.preWrite', {
      ...baseLogMeta,
      mongooseConnectionReadyState: mongoose.connection.readyState,
      mongooseConnectionHost: mongoose.connection.host,
      modelDbName: Job.db?.name || 'no-db',
      modelDbReadyState: Job.db?.readyState,
      modelHasCollection: !!Job.collection,
      schemaBufferTimeoutMS: Job.schema?.options?.bufferTimeoutMS || 'not-set-on-schema',
      schemaBufferCommands: Job.schema?.options?.bufferCommands,
      // Check if model is using the same mongoose instance
      modelMongooseId: Job.base?.models ? Object.keys(Job.base.models).length : 'unknown',
      connectionMongooseId: mongoose.models ? Object.keys(mongoose.models).length : 'unknown'
    });

    // AUD2-M10 FIX: Removed duplicate fail-fast based on manual validationIssues array.
    // Mongoose validateSync() below is the single canonical gating check.
    // The manual block above is retained only for its detailed diagnostic logging.

    // ========== ATTEMPT DOCUMENT CREATION ==========
    // validateSync catches any schema violations before we attempt a DB write.
    const jobDoc = new Job(body);
    if (jobDoc.coverImage || jobDoc.coverImageMetadata) {
      jobDoc.coverImageMetadata = bindJobCoverImageMetadata(jobDoc.coverImageMetadata, {
        jobId: jobDoc._id,
        hirerId: jobDoc.hirer,
        coverImage: jobDoc.coverImage,
      });
    }
    const syncValidationError = jobDoc.validateSync();
    if (syncValidationError) {
      jobLogger.error('job.create.mongooseValidationFailed', {
        ...baseLogMeta,
        validationError: syncValidationError.message,
        errors: Object.keys(syncValidationError.errors || {}).map(key => ({
          field: key,
          message: syncValidationError.errors[key].message,
          kind: syncValidationError.errors[key].kind,
          value: syncValidationError.errors[key].value
        }))
      });
      return errorResponse(res, 400, 'Mongoose validation failed', 'MONGOOSE_VALIDATION_ERROR');
    }

    jobLogger.info('job.create.validationPassed', {
      ...baseLogMeta,
      message: 'All validations passed, attempting save...'
    });

    // Save with explicit timeout handling
    const job = await jobDoc.save({ wtimeout: 30000 });
    const writeLatencyMs = Date.now() - writeStart;

    jobLogger.info('job.create.success', {
      ...baseLogMeta,
      jobId: job?._id?.toString?.() || job?.id,
      paymentType: body.paymentType,
      budget: body.budget,
      status: job.status,
      writeLatencyMs,
      totalLatencyMs: Date.now() - totalStart
    }); return successResponse(res, 201, 'Job created successfully', job);
  } catch (error) {
    jobLogger.error('job.create.failed', {
      ...baseLogMeta,
      readyState: mongoose.connection.readyState,
      durationMs: Date.now() - totalStart,
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      }
    });

    return next(error);
  }
};
/**
 * Get single contract by id
 * @route GET /api/jobs/contracts/:id
 * @access Public
 */
const getContractById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Guard against invalid Mongo ObjectId values (e.g. mock ids like "contract-1")
    // to avoid CastError -> 500 and retry storms on the client.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 404, 'Contract not found');
    }

    const contract = await Contract.findById(id)
      .populate('job', 'title category')
      .populate('hirer', 'firstName lastName')
      .populate('worker', 'firstName lastName');
    if (!contract) return errorResponse(res, 404, 'Contract not found');

    // Authorization check - only contract parties and admins can view
    const userId = req.user?.id;
    if (userId) {
      const isParty = String(contract.hirer?._id || contract.hirer) === String(userId) ||
                       String(contract.worker?._id || contract.worker) === String(userId);
      const isAdmin = req.user?.role === 'admin';
      if (!isParty && !isAdmin) {
        return errorResponse(res, 403, 'Access denied. Only contract parties can view this contract');
      }
    } else {
      return errorResponse(res, 401, 'Authentication required to view contracts');
    }

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
 * Update a contract (hirer or worker on contract)
 * @route PUT /api/jobs/contracts/:id
 * @access Private
 */
const updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const contract = await Contract.findById(id);
    if (!contract) return errorResponse(res, 404, 'Contract not found');
    if (String(contract.hirer) !== String(userId) && String(contract.worker) !== String(userId)) {
      return errorResponse(res, 403, 'Only contract parties can update this contract');
    }

    // H-D4 FIX: Prevent modifying contracts that are no longer in draft status
    if (contract.status !== 'draft') {
      return errorResponse(res, 400, 'Cannot modify contract that is not in draft status');
    }

    // Allowed fields for update
    const allowedFields = ['title', 'description', 'startDate', 'endDate', 'value', 'paymentTerms', 'deliverables', 'termsAndConditions'];
    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    const updated = await Contract.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate('job', 'title category')
      .populate('hirer', 'firstName lastName')
      .populate('worker', 'firstName lastName');

    return successResponse(res, 200, 'Contract updated', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a milestone in a contract (hirer only)
 * @route PUT /api/jobs/contracts/:contractId/milestones/:milestoneId/approve
 * @access Private (Hirer)
 */
const approveMilestone = async (req, res, next) => {
  try {
    const { contractId, milestoneId } = req.params;
    const userId = req.user?.id;
    const contract = await Contract.findById(contractId);
    if (!contract) return errorResponse(res, 404, 'Contract not found');
    if (String(contract.hirer) !== String(userId)) {
      return errorResponse(res, 403, 'Only the hirer can approve milestones');
    }

    const milestone = contract.milestones.id(milestoneId);
    if (!milestone) return errorResponse(res, 404, 'Milestone not found');
    if (milestone.status !== 'completed') {
      return errorResponse(res, 400, 'Milestone must be in "completed" status before approval');
    }

    milestone.status = 'approved';
    milestone.completionDate = new Date();
    await contract.save();

    return successResponse(res, 200, 'Milestone approved', contract);
  } catch (error) {
    next(error);
  }
};

// ==================== Milestone CRUD ====================

/**
 * Get milestones for a contract
 * @route GET /api/milestones/contract/:contractId
 * @access Private
 */
const getContractMilestones = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.contractId).lean();
    if (!contract) return errorResponse(res, 404, 'Contract not found');
    return successResponse(res, 200, 'Milestones retrieved', contract.milestones || []);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single milestone
 * @route GET /api/milestones/:milestoneId
 * @access Private
 */
const getMilestoneById = async (req, res, next) => {
  try {
    const contracts = await Contract.find({ 'milestones._id': req.params.milestoneId }).lean();
    if (!contracts.length) return errorResponse(res, 404, 'Milestone not found');
    const contract = contracts[0];
    const milestone = contract.milestones.find(m => String(m._id) === req.params.milestoneId);
    return successResponse(res, 200, 'Milestone retrieved', { ...milestone, contractId: contract._id });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a milestone for a contract
 * @route POST /api/milestones/contract/:contractId
 * @access Private (contract parties)
 */
const createMilestone = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const contract = await Contract.findById(req.params.contractId);
    if (!contract) return errorResponse(res, 404, 'Contract not found');
    if (String(contract.hirer) !== String(userId) && String(contract.worker) !== String(userId)) {
      return errorResponse(res, 403, 'Only contract parties can add milestones');
    }

    const { title, description, amount, dueDate } = req.body;
    if (!title) return errorResponse(res, 400, 'Milestone title is required');

    contract.milestones.push({ title, description, amount, dueDate, status: 'pending' });
    await contract.save();

    const newMilestone = contract.milestones[contract.milestones.length - 1];
    return successResponse(res, 201, 'Milestone created', newMilestone);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a milestone
 * @route PUT /api/milestones/:milestoneId
 * @access Private (contract parties)
 */
const updateMilestone = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const contracts = await Contract.find({ 'milestones._id': req.params.milestoneId }).limit(1);
    if (!contracts.length) return errorResponse(res, 404, 'Milestone not found');
    const contract = contracts[0];
    const isHirer = String(contract.hirer) === String(userId);
    const isWorker = String(contract.worker) === String(userId);
    if (!isHirer && !isWorker) {
      return errorResponse(res, 403, 'Only contract parties can update milestones');
    }

    const milestone = contract.milestones.id(req.params.milestoneId);
    const { title, description, amount, dueDate, status } = req.body;

    // CRIT-06 FIX: Validate status transitions and enforce role-based restrictions.
    // Valid flow: pending → in_progress → completed → approved → paid
    if (status) {
      const VALID_TRANSITIONS = {
        'pending': ['in_progress'],
        'in_progress': ['completed'],
        'completed': ['approved'],
        'approved': ['paid'],
        'paid': []
      };
      // Role restrictions: workers mark in_progress/completed; hirers approve/pay
      const WORKER_STATUSES = ['in_progress', 'completed'];
      const HIRER_STATUSES = ['approved', 'paid'];

      const allowed = VALID_TRANSITIONS[milestone.status];
      if (!allowed || !allowed.includes(status)) {
        return errorResponse(res, 400,
          `Cannot transition milestone from "${milestone.status}" to "${status}". Allowed: ${(allowed || []).join(', ') || 'none'}`);
      }
      if (WORKER_STATUSES.includes(status) && !isWorker) {
        return errorResponse(res, 403, 'Only the worker can mark milestones as in-progress or completed');
      }
      if (HIRER_STATUSES.includes(status) && !isHirer) {
        return errorResponse(res, 403, 'Only the hirer can approve or pay milestones');
      }
      milestone.status = status;
    }

    // Only allow metadata edits on pending milestones
    if (milestone.status === 'pending' || !status) {
      if (title) milestone.title = title;
      if (description) milestone.description = description;
      if (amount !== undefined) milestone.amount = amount;
      if (dueDate) milestone.dueDate = dueDate;
    }

    await contract.save();
    return successResponse(res, 200, 'Milestone updated', milestone);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a milestone
 * @route DELETE /api/milestones/:milestoneId
 * @access Private (contract parties)
 */
const deleteMilestone = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const contracts = await Contract.find({ 'milestones._id': req.params.milestoneId }).limit(1);
    if (!contracts.length) return errorResponse(res, 404, 'Milestone not found');
    const contract = contracts[0];
    if (String(contract.hirer) !== String(userId) && String(contract.worker) !== String(userId)) {
      return errorResponse(res, 403, 'Only contract parties can delete milestones');
    }

    // H-D3 FIX: Prevent deletion of milestones that are in progress or already paid
    const milestone = contract.milestones.id(req.params.milestoneId);
    if (!milestone) return errorResponse(res, 404, 'Milestone not found');
    if (milestone.status !== 'pending') {
      return errorResponse(res, 400, 'Cannot delete milestone that is in progress or already paid');
    }

    contract.milestones.pull({ _id: req.params.milestoneId });
    await contract.save();
    return successResponse(res, 200, 'Milestone deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a milestone as paid
 * @route PATCH /api/milestones/:milestoneId/pay
 * @access Private (hirer only)
 */
const payMilestone = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const contracts = await Contract.find({ 'milestones._id': req.params.milestoneId }).limit(1);
    if (!contracts.length) return errorResponse(res, 404, 'Milestone not found');
    const contract = contracts[0];
    if (String(contract.hirer) !== String(userId)) {
      return errorResponse(res, 403, 'Only the hirer can pay milestones');
    }

    const milestone = contract.milestones.id(req.params.milestoneId);
    if (milestone.status !== 'approved') {
      return errorResponse(res, 400, 'Milestone must be approved before payment');
    }

    milestone.status = 'paid';
    milestone.paymentDate = new Date();
    await contract.save();
    return successResponse(res, 200, 'Milestone marked as paid', milestone);
  } catch (error) {
    next(error);
  }
};

/**
 * Get search suggestions for job queries
 * @route GET /api/jobs/suggestions
 * @access Public
 */
const getSearchSuggestions = async (req, res, next) => {
  try {
    await ensureConnection();

    const rawQuery = (
      req.query.q ||
      req.query.query ||
      req.query.keyword ||
      ''
    ).toString().trim();

    if (!rawQuery || rawQuery.length < 2) {
      return successResponse(res, 200, 'Search suggestions retrieved', []);
    }

    const normalizedQuery = rawQuery.replace(/\s+/g, ' ');
    const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startsWithRegex = new RegExp(`^${escapedQuery}`, 'i');
    const containsRegex = new RegExp(escapedQuery, 'i');

    const mongoose = require('mongoose');
    const client = mongoose.connection.getClient();
    const db = client.db();
    const jobsCollection = db.collection('jobs');
    const usersCollection = db.collection('users');

    const searchMatch = {
      $or: [
        { title: startsWithRegex },
        { title: containsRegex },
        { category: startsWithRegex },
        { category: containsRegex },
        { 'requirements.primarySkills': startsWithRegex },
        { 'requirements.primarySkills': containsRegex },
        { 'requirements.secondarySkills': startsWithRegex },
        { 'requirements.secondarySkills': containsRegex },
        { skills: startsWithRegex },
        { skills: containsRegex },
        { 'location.city': startsWithRegex },
        { 'location.region': startsWithRegex },
        { 'location.address': containsRegex },
        { 'locationDetails.region': containsRegex },
        { 'locationDetails.district': containsRegex }
      ]
    };

    const strictVisibilityMatch = {
      status: { $in: ['open', 'Open'] },
      $or: [
        { visibility: 'public' },
        { visibility: { $exists: false } },
        { visibility: null }
      ]
    };

    let jobs = await jobsCollection
      .find({
        ...strictVisibilityMatch,
        ...searchMatch
      })
      .project({
        title: 1,
        category: 1,
        skills: 1,
        requirements: 1,
        location: 1,
        locationDetails: 1,
        hirer: 1,
        createdAt: 1
      })
      .limit(40)
      .toArray();

    // Fallback: if strict public visibility pass returns nothing, retry with status-only.
    // This preserves user experience when older records are missing visibility metadata.
    if (jobs.length === 0) {
      jobs = await jobsCollection
        .find({
          status: { $in: ['open', 'Open'] },
          ...searchMatch
        })
        .project({
          title: 1,
          category: 1,
          skills: 1,
          requirements: 1,
          location: 1,
          locationDetails: 1,
          hirer: 1,
          createdAt: 1,
          visibility: 1
        })
        .limit(40)
        .toArray();
    }

    const hirerIds = Array.from(
      new Set(
        jobs
          .map((job) => job.hirer)
          .filter(Boolean)
          .map((hirerId) => {
            try {
              return new mongoose.Types.ObjectId(hirerId);
            } catch (_) {
              return null;
            }
          })
          .filter(Boolean)
      )
    );

    let hirerMap = new Map();
    if (hirerIds.length > 0) {
      const hirers = await usersCollection
        .find({ _id: { $in: hirerIds } })
        .project({
          firstName: 1,
          lastName: 1,
          companyName: 1,
          businessName: 1
        })
        .toArray();

      hirerMap = new Map(hirers.map((hirer) => [hirer._id.toString(), hirer]));
    }

    const suggestionAccumulator = new Map();
    const registerSuggestion = (type, value, meta = {}) => {
      if (!value || typeof value !== 'string') return;
      const trimmedValue = value.trim();
      if (!trimmedValue) return;
      const key = `${type}:${trimmedValue.toLowerCase()}`;
      if (!suggestionAccumulator.has(key)) {
        suggestionAccumulator.set(key, {
          type,
          value: trimmedValue,
          hits: 0,
          meta: { ...meta }
        });
      }
      const entry = suggestionAccumulator.get(key);
      entry.hits += 1;
      if (meta && Object.keys(meta).length > 0) {
        entry.meta = { ...entry.meta, ...meta };
      }
    };

    jobs.forEach((job) => {
      registerSuggestion('jobTitle', job.title);
      if (job.category) {
        registerSuggestion('category', job.category);
      }
      if (Array.isArray(job.skills)) {
        job.skills.forEach((skill) => registerSuggestion('skill', skill));
      }
      if (job.requirements) {
        const { primarySkills, secondarySkills } = job.requirements;
        if (Array.isArray(primarySkills)) {
          primarySkills.forEach((skill) => registerSuggestion('skill', skill));
        }
        if (Array.isArray(secondarySkills)) {
          secondarySkills.forEach((skill) => registerSuggestion('skill', skill));
        }
      }
      const location = job.location || {};
      if (typeof location === 'string') {
        registerSuggestion('location', location);
      } else {
        registerSuggestion('location', location.address);
        registerSuggestion('location', location.city);
        registerSuggestion('location', location.region);
        registerSuggestion('location', location.country);
      }
      const locationDetails = job.locationDetails || {};
      registerSuggestion('location', locationDetails.region);
      registerSuggestion('location', locationDetails.district);
      if (job.hirer) {
        const hirer = hirerMap.get(job.hirer.toString());
        if (hirer) {
          const hirerLabel =
            hirer.companyName ||
            hirer.businessName ||
            [hirer.firstName, hirer.lastName].filter(Boolean).join(' ').trim();
          if (hirerLabel) {
            registerSuggestion('hirer', hirerLabel, { hirerId: job.hirer.toString() });
          }
        }
      }
    });

    const typePriority = {
      jobTitle: 0,
      skill: 1,
      category: 2,
      location: 3,
      hirer: 4
    };

    const buildHighlight = (value) => {
      const lowerValue = value.toLowerCase();
      const lowerQuery = normalizedQuery.toLowerCase();
      const index = lowerValue.indexOf(lowerQuery);
      if (index === -1) {
        return {
          prefix: value,
          match: '',
          suffix: ''
        };
      }
      return {
        prefix: value.slice(0, index),
        match: value.slice(index, index + normalizedQuery.length),
        suffix: value.slice(index + normalizedQuery.length)
      };
    };

    const suggestions = Array.from(suggestionAccumulator.values())
      .map((suggestion) => ({
        ...suggestion,
        highlight: buildHighlight(suggestion.value)
      }))
      .sort((a, b) => {
        if (b.hits !== a.hits) return b.hits - a.hits;
        const aPriority = typePriority[a.type] ?? 99;
        const bPriority = typePriority[b.type] ?? 99;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.value.localeCompare(b.value);
      })
      .slice(0, 8)
      .map(({ hits, ...rest }) => rest);

    return successResponse(res, 200, 'Search suggestions retrieved', suggestions);
  } catch (error) {
    jobLogger.error('Search suggestions error', { error: error.message });
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
    const isDebugJobs = process.env.JOB_SERVICE_DEBUG === 'true';
    const escapeRegex = (value) =>
      String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (isDebugJobs) {
      jobLogger.info('[GET JOBS] Starting getJobs function');
      jobLogger.info('[GET JOBS] Mongoose connection state:', mongoose.connection.readyState);
    }

    // CHECK IF JOB MODEL IS USING THE CONNECTED MONGOOSE INSTANCE
    if (isDebugJobs) {
      jobLogger.info('[GET JOBS] Job model database:', Job.db ? Job.db.databaseName : 'NO DB');
      jobLogger.info('[GET JOBS] Job model connection state:', Job.db ? Job.db.readyState : 'NO DB');
      jobLogger.info('[GET JOBS] Main mongoose database:', mongoose.connection.name);
      jobLogger.info('[GET JOBS] Same connection?:', Job.db === mongoose.connection);
    }

    // Try direct MongoDB driver query to bypass Mongoose
    // FIX M9: Only run debug count query when debug is actually enabled
    if (isDebugJobs) {
      try {
        const client = mongoose.connection.getClient();
        const db = client.db();
        const jobsCollection = db.collection('jobs');
        const directCount = await jobsCollection.countDocuments({ status: 'open', visibility: 'public' });
        jobLogger.info('[GET JOBS] Direct driver query SUCCESS - open jobs count:', directCount);

        // If direct query works, try to use it
        if (directCount > 0) {
          jobLogger.info('[GET JOBS] USING DIRECT DRIVER QUERY as workaround');
        }
      } catch (clientError) {
        jobLogger.error('[GET JOBS] Error with direct driver query:', clientError.message);
      }
    }

    if (isDebugJobs) {
      jobLogger.info('[GET JOBS] Query params:', JSON.stringify(req.query));
    }

    // ── Query Budget Guards ──────────────────────────────────────────
    // Cap pagination to prevent excessive result sets
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const MAX_PAGE = 100; // prevent absurd deep-pagination scans
    if (page > MAX_PAGE) {
      return errorResponse(res, 400, `Page must be <= ${MAX_PAGE}`, 'QUERY_BUDGET_EXCEEDED');
    }
    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const startIndex = (page - 1) * limit;

    if (isDebugJobs) {
      jobLogger.info('[GET JOBS] Pagination:', { page, limit, startIndex });
    }

    // Build query - Use lowercase "open" status (matches database canonical values)
    // Tolerant visibility filter: show jobs explicitly marked 'public' OR with no visibility
    // field at all (legacy jobs inserted before the visibility field was added should be
    // treated as public — no hirer deliberately set them to private).
    // C-04 FIX: Tolerate legacy 'Open' status variant alongside canonical 'open'
    let query = {
      status: { $in: ['open', 'Open'] },
      $and: [
        { $or: [
          { visibility: "public" },
          { visibility: { $exists: false } },
          { visibility: null }
        ]}
      ]
    };
    if (isDebugJobs) {
      jobLogger.info('[GET JOBS] Initial query:', JSON.stringify(query));
    }

    // Filtering
    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.skills) {
      const skillTokens = req.query.skills.split(",").slice(0, 10); // max 10 skills
      query.skills = { $in: buildCaseInsensitiveExactRegexes(skillTokens) };
    }

    if (req.query.budget) {
      const [min, max] = req.query.budget.split("-");
      query.budget = {};
      if (min) query.budget.$gte = parseInt(min);
      if (max) query.budget.$lte = parseInt(max);
    }

    // Also handle min_budget/max_budget as separate query params (frontend sends these)
    if (req.query.min_budget) {
      const minBudget = parseInt(req.query.min_budget, 10);
      if (Number.isFinite(minBudget)) {
        if (!query.budget) query.budget = {};
        query.budget.$gte = minBudget;
      }
    }
    if (req.query.max_budget) {
      const maxBudget = parseInt(req.query.max_budget, 10);
      if (Number.isFinite(maxBudget)) {
        if (!query.budget) query.budget = {};
        query.budget.$lte = maxBudget;
      }
    }

    // Enhanced location filtering
    if (req.query.location) {
      if (req.query.location.includes(',')) {
        // Multiple locations — cap to 6 to limit $or fan-out
        const locations = req.query.location.split(',').map(loc => loc.trim()).slice(0, 6);
        query.$and.push({ $or: [
          { "location.city": { $in: locations } },
          { "location.region": { $in: locations } },
          { "location.country": { $in: locations } },
          { "location.address": { $in: locations } },
          { "locationDetails.region": { $in: locations } },
          { "locationDetails.district": { $in: locations } }
        ]});
      } else {
        // Single location - search across city, region, country
        const safeLocation = escapeRegex(req.query.location);
        query.$and.push({ $or: [
          { "location.city": { $regex: safeLocation, $options: "i" } },
          { "location.region": { $regex: safeLocation, $options: "i" } },
          { "location.country": { $regex: safeLocation, $options: "i" } },
          { "location.address": { $regex: safeLocation, $options: "i" } },
          { "locationDetails.region": { $regex: safeLocation, $options: "i" } },
          { "locationDetails.district": { $regex: safeLocation, $options: "i" } }
        ]});
      }
    }

    // Geographic search (latitude/longitude with radius)
    if (req.query.latitude && req.query.longitude && req.query.radius) {
      const lat = parseFloat(req.query.latitude);
      const lng = parseFloat(req.query.longitude);
      const radius = Math.min(parseFloat(req.query.radius) || 50, 500); // km, capped at 500

      query["geoLocation"] = {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], parseFloat(radius) / 6378.1]
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

    // Payment type filter (hourly / fixed)
    if (req.query.paymentType) {
      query.paymentType = req.query.paymentType;
    }

    // Remote work filter
    if (req.query.remote === 'true') {
      query['location.type'] = 'remote';
    }

    // Experience level filter
    if (req.query.experience) {
      query.experienceLevel = req.query.experience;
    }

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      if (req.query.dateFrom) {
        const dateFrom = new Date(req.query.dateFrom);
        if (!isNaN(dateFrom.getTime())) {
          if (!query.createdAt) query.createdAt = {};
          query.createdAt.$gte = dateFrom;
        }
      }
      if (req.query.dateTo) {
        const dateTo = new Date(req.query.dateTo);
        if (!isNaN(dateTo.getTime())) {
          if (!query.createdAt) query.createdAt = {};
          query.createdAt.$lte = dateTo;
        }
      }
    }

    // Hirer rating filter
    if (req.query.minHirerRating) {
      // This would require a join with User collection to filter by hirer rating
      // For now, we'll add it to the aggregation pipeline later
    }

    // Search with advanced text search
    if (req.query.search) {
      const normalizedSearch = String(req.query.search).trim().slice(0, 100); // tightened from 120
      if (normalizedSearch.length < 2) {
        return errorResponse(res, 400, 'Search term must be at least 2 characters', 'SEARCH_TOO_SHORT');
      }
      const safeSearch = escapeRegex(normalizedSearch);
      const searchTerms = normalizedSearch
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 6); // tightened from 8 — each term creates a RegExp
      const searchConditions = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { skills: { $in: searchTerms.map((term) => new RegExp(escapeRegex(term), 'i')) } },
        { category: { $regex: safeSearch, $options: "i" } }
      ];
      query.$and.push({ $or: searchConditions });
    }

    // Execute query with pagination
    if (isDebugJobs) {
      jobLogger.info('[GET JOBS] About to execute query...');
      jobLogger.info('[GET JOBS] Final query:', JSON.stringify(query));
      jobLogger.info('[GET JOBS] Sort:', req.query.sort || "-createdAt");
    }

    // WORKAROUND: Use direct MongoDB driver because Mongoose model is disconnected
    const client = mongoose.connection.getClient();
    const db = client.db();
    const jobsCollection = db.collection('jobs');
    const usersCollection = db.collection('users');

    // Pre-filter by verified hirers to ensure correct pagination totals (CRIT-19)
    // FIX H1: Cap the verified hirer query to prevent loading all users into memory
    if (req.query.verified === 'true') {
      const verifiedHirers = await usersCollection
        .find({ isVerified: true }, { projection: { _id: 1 } })
        .limit(5000)
        .toArray();
      const verifiedHirerIds = verifiedHirers.map(h => h._id);
      query.hirer = { $in: verifiedHirerIds };
    }

    // Determine sort strategy based on frontend sort parameter
    const SORT_MAP = {
      newest: { createdAt: -1, _id: -1 },
      budget_high: { budget: -1, createdAt: -1, _id: -1 },
      budget_low: { budget: 1, createdAt: -1, _id: -1 },
      oldest: { createdAt: 1, _id: 1 },
    };
    let sortSpec;
    if (req.query.sort && SORT_MAP[req.query.sort]) {
      sortSpec = SORT_MAP[req.query.sort];
    } else if (req.query.sort) {
      const ALLOWED_SORT_FIELDS = ['createdAt', 'budget', 'title', 'updatedAt', 'deadline', 'views'];
      const sortField = req.query.sort;
      const sortOrder = sortField.startsWith('-') ? -1 : 1;
      const sortKey = sortField.replace(/^-/, '');
      if (ALLOWED_SORT_FIELDS.includes(sortKey)) {
        sortSpec = { [sortKey]: sortOrder, _id: sortOrder };
      } else {
        sortSpec = { createdAt: -1, _id: -1 }; // fallback to default
      }
    } else {
      // Default: newest first
      sortSpec = { createdAt: -1, _id: -1 };
    }

    const jobsCursor = jobsCollection
      .find(query)
      .sort(sortSpec)
      .skip(startIndex)
      .limit(limit)
      .maxTimeMS(20000);

    const [jobs, total] = await Promise.all([
      jobsCursor.toArray(),
      jobsCollection.countDocuments(query, { maxTimeMS: 5000 })
    ]);
    if (isDebugJobs) {
      jobLogger.info('[GET JOBS] Direct driver query executed successfully');
      jobLogger.info('[GET JOBS] Jobs found:', jobs.length);
      jobLogger.info('[GET JOBS] Total jobs:', total);
    }

    // Manually populate hirer data with all required fields
    const hirerIds = [...new Set(jobs.map(j => j.hirer).filter(Boolean))];
    const hirers = await usersCollection
      .find({ _id: { $in: hirerIds } })
      .project({
        firstName: 1,
        lastName: 1,
        profileImage: 1,
        avatar: 1,
        verified: 1,
        isVerified: 1,
        rating: 1
      })
      .toArray();

    const hirerMap = new Map(hirers.map(h => [h._id.toString(), h]));
    jobs.forEach(job => {
      if (job.hirer) {
        job.hirer = hirerMap.get(job.hirer.toString());
      }
    });

    // Transform jobs to match frontend expectations (using shared transformation)
    const transformedJobs = transformJobsForFrontend(jobs);

    if (isDebugJobs) {
      jobLogger.info('[GET JOBS] Sending response...');
    }
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
    jobLogger.error('getJobs error', { error: error.message, stack: error.stack });
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
      .populate("hirer", "firstName lastName profileImage companyName rating verified isVerified")
      .populate("worker", "firstName lastName profileImage")
      .lean();

    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }

    const normalizedStatus = String(job.status || '').toLowerCase();
    const visibility = job.visibility || 'public';
    const isPubliclyVisible = visibility === 'public' && normalizedStatus !== 'draft';
    if (!isPubliclyVisible && !canViewRestrictedJob(req.user, job)) {
      return errorResponse(res, 404, 'Job not found');
    }

    // LOW-02 FIX: Log view count errors instead of silently swallowing
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      Job.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).catch((err) => {
        jobLogger.warn(`viewCount increment failed for job ${req.params.id}`, { error: err.message });
      });
    }

    // Transform job data to match frontend expectations
    const transformedJob = {
      ...job,
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
        ...(job.hirer || {}),
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

    // Check if job can be updated (canonical statuses are lowercase)
    const currentStatus = String(job.status || '').toLowerCase();
    if (currentStatus !== "draft" && currentStatus !== "open") {
      return errorResponse(
        res,
        400,
        "Cannot update job that is already in progress or completed",
      );
    }

    // Normalize incoming payload similarly to create — SECURITY: only allow safe fields
    const JOB_UPDATE_ALLOWED = ['title', 'description', 'category', 'skills', 'budget', 'currency',
      'paymentType', 'duration', 'location', 'locationType', 'urgency', 'visibility',
      'requirements', 'tags', 'deadline', 'attachments', 'coverImage', 'coverImageMetadata'];
    const body = {};
    for (const key of JOB_UPDATE_ALLOWED) {
      if (key in req.body) body[key] = req.body[key];
    }
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

    Object.assign(body, await normalizeJobCoverImage(body, req.user?.id));
    if (body.coverImage || body.coverImageMetadata) {
      body.coverImageMetadata = bindJobCoverImageMetadata(body.coverImageMetadata, {
        jobId: job._id,
        hirerId: job.hirer,
        coverImage: body.coverImage || job.coverImage,
      });
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

    // Check if job can be deleted (canonical statuses are lowercase)
    const currentStatus = String(job.status || '').toLowerCase();
    if (currentStatus !== "draft" && currentStatus !== "open") {
      return errorResponse(
        res,
        400,
        "Cannot delete job that is already in progress or completed",
      );
    }

    await Job.findByIdAndDelete(req.params.id);

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
    await ensureConnection();

    const mongoose = require('mongoose');

    let hirerObjectId;
    try {
      hirerObjectId = new mongoose.Types.ObjectId(req.user.id);
    } catch (objectIdError) {
      return errorResponse(res, 400, 'Invalid hirer identifier');
    }

    const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const startIndex = (page - 1) * limit;

    const client = mongoose.connection.getClient();
    const db = client.db();
    const jobsCollection = db.collection('jobs');
    const usersCollection = db.collection('users');

    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';

    const baseQuery = { hirer: hirerObjectId };
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      baseQuery.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { 'location.city': searchRegex },
        { 'location.region': searchRegex },
        { 'location.address': searchRegex },
        { 'locationDetails.region': searchRegex },
        { 'locationDetails.district': searchRegex },
      ];
    }

    // Build query
    const query = { ...baseQuery };
    if (req.query.status) {
      const VALID_STATUSES = ['open', 'closed', 'in-progress', 'completed', 'cancelled', 'draft', 'expired', 'pending'];
      if (typeof req.query.status === 'string' && VALID_STATUSES.includes(req.query.status)) {
        query.status = req.query.status;
      }
    }

    const ALLOWED_SORT_FIELDS = ['createdAt', 'budget', 'title', 'updatedAt', 'deadline', 'views', 'status'];
    const rawSort = req.query.sort || '-createdAt';
    const sortOrder = rawSort.startsWith('-') ? -1 : 1;
    const sortKey = rawSort.replace(/^-/, '');
    const sortField = ALLOWED_SORT_FIELDS.includes(sortKey) ? sortKey : 'createdAt';

    const jobs = await jobsCollection
      .find(query)
      .sort({ [sortField]: sortOrder })
      .skip(startIndex)
      .limit(limit)
      .toArray();

    const workerIds = Array.from(
      new Set(
        jobs
          .map((job) => job.worker)
          .filter(Boolean)
          .map((id) => {
            try {
              return new mongoose.Types.ObjectId(id);
            } catch (_) {
              return null;
            }
          })
          .filter(Boolean)
          .map((objectId) => objectId.toString())
      )
    );

    let workerMap = new Map();
    if (workerIds.length > 0) {
      const workerObjectIds = workerIds.map((id) => new mongoose.Types.ObjectId(id));
      const workers = await usersCollection
        .find({ _id: { $in: workerObjectIds } })
        .project({ firstName: 1, lastName: 1, profileImage: 1 })
        .toArray();
      workerMap = new Map(workers.map((worker) => [worker._id.toString(), worker]));
    }

    const normalizedJobs = jobs.map((job) => {
      const jobId = job._id?.toString?.() || String(job._id);
      const workerId = job.worker ? job.worker.toString() : null;
      const worker = workerId ? workerMap.get(workerId) : null;

      return {
        ...job,
        _id: jobId,
        id: jobId,
        hirer: job.hirer?.toString?.() || String(job.hirer),
        worker: worker
          ? {
            _id: worker._id.toString(),
            firstName: worker.firstName || null,
            lastName: worker.lastName || null,
            profileImage: worker.profileImage || null,
          }
          : null,
      };
    });

    const [total, statusCounts] = await Promise.all([
      jobsCollection.countDocuments(query),
      jobsCollection.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).toArray(),
    ]);

    const countsByStatus = statusCounts.reduce((acc, entry) => {
      if (entry?._id) {
        acc[entry._id] = entry.count;
      }
      return acc;
    }, {
      open: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0,
      draft: 0,
      closed: 0,
      expired: 0,
      pending: 0,
    });

    return paginatedResponse(
      res,
      200,
      'My jobs retrieved successfully',
      normalizedJobs,
      page,
      limit,
      total,
      { countsByStatus },
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

    const allowedNext = validTransitions[job.status];
    if (!allowedNext || !allowedNext.includes(status)) {
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
  // Empty fallback — never show fake data in production
  const fallbackJobs = [];

  try {
    await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });
  } catch (connectionError) {
    jobLogger.warn('Dashboard jobs: database not ready, returning fallback data:', connectionError.message);
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
    recentJobs = await Job.find({ status: { $in: ['open', 'Open'] }, visibility: 'public' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('hirer', 'firstName lastName companyName')
      .select('title description budget location urgency createdAt')
      .lean({ defaults: true });
  } catch (queryError) {
    jobLogger.warn('Dashboard jobs: query failed, using fallback data:', queryError.message);
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
    Job.countDocuments({ status: { $in: ['open', 'Open'] }, visibility: 'public' }),
    Job.countDocuments({
      status: { $in: ['open', 'Open'] },
      visibility: 'public',
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  if (totalOpenResult.status === 'rejected') {
    jobLogger.warn('Dashboard jobs: failed to count open jobs:', totalOpenResult.reason?.message);
  }
  if (totalTodayResult.status === 'rejected') {
    jobLogger.warn('Dashboard jobs: failed to count today jobs:', totalTodayResult.reason?.message);
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
    const userId = req.user?.id;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * Math.min(parseInt(limit, 10) || 20, 100);

    // Build query — show contracts where the user is hirer or worker
    // SECURITY: userId is REQUIRED — without it, return empty (prevents open query)
    const query = {};
    if (!userId) {
      return successResponse(res, 200, 'Contracts retrieved successfully', { contracts: [], pagination: { total: 0, page: 1, limit: 20 } });
    }
    query.$or = [{ hirer: userId }, { worker: userId }];
    if (status) {
      query.status = status;
    }

    const [contracts, total] = await Promise.all([
      Contract.find(query)
        .populate('hirer', 'firstName lastName profilePicture profileImage')
        .populate('worker', 'firstName lastName profilePicture profileImage')
        .populate('job', 'title category budget currency')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(parseInt(limit, 10) || 20, 100))
        .lean(),
      Contract.countDocuments(query),
    ]);

    return successResponse(res, 200, "Contracts retrieved successfully", {
      contracts,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
        service: 'job-service',
        timestamp: new Date().toISOString(),
        source: 'database'
      }
    });
  } catch (error) {
    jobLogger.error('❌ Error in getContracts:', error);
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
    const workerId = req.user?.id;
    const {
      limit = 20,
      minScore = 40,
      includeInsights: rawIncludeInsights = true,
      includeBreakdown: rawIncludeBreakdown = true,
      includeReasons: rawIncludeReasons = true,
    } = req.query;

    const toBoolean = (value, defaultValue) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(lower)) return true;
        if (['false', '0', 'no', 'off'].includes(lower)) return false;
      }
      return defaultValue;
    };

    const includeInsights = toBoolean(rawIncludeInsights, true);
    const includeBreakdown = toBoolean(rawIncludeBreakdown, true);
    const includeReasons = toBoolean(rawIncludeReasons, true);

    if (!workerId) {
      return errorResponse(res, 400, 'Worker identifier is required');
    }

    const numericLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const numericMinScore = Math.max(0, Math.min(100, parseInt(minScore, 10) || 40));

    const [workerContext, existingApplications] = await Promise.all([
      getCanonicalWorkerContext(workerId),
      Application.find({ worker: workerId }).select('job').lean(),
    ]);

    if (!workerContext?.worker) {
      return errorResponse(res, 403, 'Only workers can access job recommendations');
    }

    const worker = workerContext.worker;

    const appliedJobIds = existingApplications
      .map((application) => application.job)
      .filter(Boolean);

    const query = {
      status: { $in: ['open', 'Open'] },
      'bidding.bidStatus': 'open',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
      $and: [
        {
          $or: [
            { visibility: 'public' },
            { visibility: { $exists: false } },
            { visibility: null },
          ],
        },
      ],
    };
    if (appliedJobIds.length > 0) {
      query._id = { $nin: appliedJobIds };
    }

    // Use worker skills in the initial query to get better candidates
    const workerSkillsList = collectWorkerSkills(worker);

    // C-02 FIX: Expand synonyms in DB pre-filter so "carpentry" also matches "woodwork"/"joinery"
    if (workerSkillsList.length > 0) {
      const expandedSkills = workerSkillsList.flatMap(s => expandSkillSynonyms(s));
      const skillRegexes = buildCaseInsensitiveExactRegexes(expandedSkills);
      query.$and.push({
        $or: [
          { 'requirements.primarySkills': { $in: skillRegexes } },
          { 'requirements.secondarySkills': { $in: skillRegexes } },
          { skills: { $in: skillRegexes } },
        ],
      });
    }

    const candidateJobs = await Job.find(query)
      .populate('hirer', 'firstName lastName profilePicture profileImage rating totalJobsPosted companyName businessName')
      .sort({ createdAt: -1 })
      .limit(Math.max(numericLimit * 3, 30))
      .lean();

    const scoredJobs = candidateJobs
      .map((jobDoc) => {
        const job = transformJobForFrontend(jobDoc);
        const matchScore = calculateJobMatchScore(jobDoc, worker);

        return {
          job,
          matchScore: matchScore.totalScore,
          matchDetails: matchScore.breakdown,
          matchReasons: matchScore.reasons,
        };
      })
      .filter((entry) => entry.matchScore >= numericMinScore)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        const aCreated = new Date(a.job?.createdAt || 0).getTime();
        const bCreated = new Date(b.job?.createdAt || 0).getTime();
        return bCreated - aCreated;
      })
      .slice(0, numericLimit);

    const jobs = scoredJobs.map((entry) => {
      const jobPayload = {
        ...entry.job,
        matchScore: entry.matchScore,
      };

      if (includeBreakdown) {
        jobPayload.matchBreakdown = entry.matchDetails;
      }
      if (includeReasons) {
        jobPayload.aiReasoning = entry.matchReasons?.join('; ');
        jobPayload.aiReasons = entry.matchReasons;
      }

      return jobPayload;
    });

    const defaultInsights = {
      summary: `We analysed ${candidateJobs.length} recent jobs and found ${jobs.length} strong matches for your skills and profile.`,
      tags: [],
    };

    if (includeInsights) {
      if (Array.isArray(worker.skills)) {
        defaultInsights.tags.push(...worker.skills.slice(0, 3));
      }
      if (typeof worker.profession === 'string' && worker.profession.trim()) {
        defaultInsights.tags.push(worker.profession);
      }
    }

    return successResponse(res, 200, 'Job recommendations retrieved successfully', {
      jobs,
      insights: includeInsights ? defaultInsights : undefined,
      totalRecommendations: jobs.length,
      averageMatchScore:
        jobs.length > 0
          ? Math.round(
            (jobs.reduce((sum, jobEntry) => sum + (jobEntry.matchScore || 0), 0) /
              jobs.length) *
            100,
          ) / 100
          : 0,
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
    const job = await Job.findById(jobId).lean();
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    if (job.hirer.toString() !== hirerId) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Get available workers (this would typically call user-service)
    // For now, we'll use a basic query - in production this would be a service call
    const numericLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 50);

    // Pre-filter workers by job skills for better relevance
    const jobSkills = collectJobSkills(job);
    const workerQuery = {
      role: 'worker',
      isActive: true,
      availabilityStatus: { $in: ['available', 'partially_available'] }
    };
    if (jobSkills.length > 0) {
      // Case-insensitive skill matching to handle mixed-case stored values
      const skillRegexes = jobSkills.map(s => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
      // FIX L7: Removed 'workerProfile.skills' — that field lives in
      // the separate WorkerProfile collection, not embedded in User.
      // Use specializations as additional matching source instead.
      workerQuery.$or = [
        { skills: { $in: skillRegexes } },
        { specializations: { $in: skillRegexes } },
      ];
    }

    const workers = await User.find(workerQuery)
      .select('firstName lastName profileImage rating totalJobsCompleted skills hourlyRate location locationCoordinates availabilityStatus yearsOfExperience isVerified')
      .limit(numericLimit * 3)
      .lean();

    const workerProfiles = await WorkerProfile.find({
      userId: { $in: workers.map((worker) => worker._id) },
    }).lean();
    const workerProfileMap = new Map(
      workerProfiles.map((profile) => [String(profile.userId), profile]),
    );

    // Calculate match scores for each worker
    const workersWithScores = workers.map(workerDoc => {
      const canonicalWorker = buildCanonicalWorkerSnapshot(
        workerDoc,
        workerProfileMap.get(String(workerDoc._id)) || {},
      );
      const matchScore = calculateWorkerMatchScore(job, canonicalWorker);

      return {
        id: canonicalWorker.id,
        name: canonicalWorker.name,
        profileImage: canonicalWorker.profilePicture,
        rating: canonicalWorker.rating || 0,
        completedJobs: canonicalWorker.totalJobsCompleted || canonicalWorker.completedJobs || 0,
        skills: canonicalWorker.skills || [],
        hourlyRate: canonicalWorker.hourlyRate || 0,
        location: canonicalWorker.location,
        matchScore: matchScore.totalScore,
        matchDetails: matchScore.breakdown,
        matchReasons: matchScore.reasons
      };
    });

    // Filter by minimum score and sort by match score
    const matchedWorkers = workersWithScores
      .filter(worker => worker.matchScore >= parseInt(minScore, 10))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, numericLimit);

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
  const WEIGHTS = {
    skills: 30,
    location: 18,
    budget: 14,
    rating: 10,
    experience: 10,
    availability: 10,
    performance: 8,
  };

  let totalScore = 0;
  const breakdown = {};
  const reasons = [];

  const jobSkills = collectJobSkills(job);
  const workerSkills = collectWorkerSkills(worker);
  const skillMatches = (jobSkills || []).filter((jobSkill) =>
    (workerSkills || []).some((workerSkill) => skillsSemanticallyMatch(jobSkill, workerSkill)),
  );

  // C-01 FIX: Jobs with no skills defined get 0 skill credit (was 0.5 — inflated matches)
  const skillFit = jobSkills.length > 0
    ? (skillMatches.length / jobSkills.length)
    : 0;
  const skillScore = skillFit * WEIGHTS.skills;
  breakdown.skills = Math.round(skillScore * 10) / 10;
  totalScore += skillScore;

  if (skillMatches.length > 0) {
    reasons.push(`${skillMatches.length}/${jobSkills.length} skill matches`);
  } else if (jobSkills.length === 0) {
    reasons.push('Job has no skill requirements listed');
  }

  let locationScore = 0;
  const jobLoc = job.locationDetails || job.location || {};
  const workerLoc = worker.locationDetails || worker.location || {};

  const jobLocation = readLocationParts(jobLoc);
  const workerLocation = readLocationParts(workerLoc);
  const jobCity = jobLocation.city;
  const workerCity = workerLocation.city;
  const jobRegion = jobLocation.region;
  const workerRegion = workerLocation.region;

  const jobCoords = extractCoordinates(job);
  const workerCoords = extractCoordinates(worker);

  if (jobCoords && workerCoords) {
    const distanceKm = haversineDistance(jobCoords.lat, jobCoords.lng, workerCoords.lat, workerCoords.lng);
    if (distanceKm <= 5) {
      locationScore = 25;
      reasons.push(`Very close (${Math.round(distanceKm)}km away)`);
    } else if (distanceKm <= 15) {
      locationScore = 22;
      reasons.push(`Nearby (${Math.round(distanceKm)}km away)`);
    } else if (distanceKm <= 30) {
      locationScore = 18;
      reasons.push(`In your area (${Math.round(distanceKm)}km away)`);
    } else if (distanceKm <= 50) {
      locationScore = 15;
      reasons.push(`Reachable (${Math.round(distanceKm)}km away)`);
    } else if (distanceKm <= 100) {
      locationScore = 10;
      reasons.push(`Same broader area (${Math.round(distanceKm)}km)`);
    } else if (jobRegion && workerRegion && jobRegion === workerRegion) {
      locationScore = 8;
      reasons.push('Same region but far');
    } else {
      locationScore = 3;
    }
  } else if (job.location?.type === 'remote' || job.locationType === 'remote') {
    locationScore = 20;
    reasons.push('Remote-friendly job');
  } else if (jobCity && workerCity && jobCity === workerCity) {
    locationScore = 25;
    reasons.push('Same city');
  } else if (jobRegion && workerRegion && jobRegion === workerRegion) {
    locationScore = 15;
    reasons.push('Same region');
  } else {
    const jobLocationText = String(job.location?.city || job.location || job.locationDetails?.district || '').trim().toLowerCase();
    const workerLocationText = String(worker.location?.city || worker.location || worker.locationDetails?.district || '').trim().toLowerCase();
    if (
      jobLocationText &&
      workerLocationText &&
      (jobLocationText.includes(workerLocationText) || workerLocationText.includes(jobLocationText))
    ) {
      locationScore = 20;
      reasons.push('Location match (text)');
    }
  }
  const normalizedLocationScore = (locationScore / 25) * WEIGHTS.location;
  breakdown.location = Math.round(normalizedLocationScore * 10) / 10;
  totalScore += normalizedLocationScore;

  let budgetFit = 0;
  const workerHourlyRate = Number(worker.hourlyRate || worker.workerProfile?.hourlyRate || 0);
  const jobCurrency = (job.currency || 'GHS').toUpperCase();
  const workerCurrency = (worker.currency || worker.workerProfile?.currency || 'GHS').toUpperCase();
  const currencyMatch = jobCurrency === workerCurrency;

  if (job.budget && workerHourlyRate > 0 && currencyMatch) {
    if (job.paymentType === 'fixed' || !job.paymentType) {
      let estimatedHours = 8;
      if (job.duration?.value) {
        const unit = (job.duration.unit || 'day').toLowerCase();
        if (unit === 'hour') estimatedHours = job.duration.value;
        else if (unit === 'day') estimatedHours = job.duration.value * 8;
        else if (unit === 'week') estimatedHours = job.duration.value * 40;
        else if (unit === 'month') estimatedHours = job.duration.value * 160;
      }
      const expectedCost = workerHourlyRate * estimatedHours;
      const budgetRatio = expectedCost > 0 ? job.budget / expectedCost : 0;
      if (budgetRatio >= 1.0) {
        budgetFit = 1;
        reasons.push('Budget exceeds your rate');
      } else if (budgetRatio >= 0.7) {
        budgetFit = 0.75;
        reasons.push('Budget compatible');
      } else if (budgetRatio >= 0.5) {
        budgetFit = 0.55;
        reasons.push('Budget close match');
      } else {
        budgetFit = 0.25;
      }
    } else {
      let estimatedHours = 40;
      if (job.duration && job.duration.value) {
        const unit = (job.duration.unit || 'hour').toLowerCase();
        if (unit === 'hour' || unit === 'hours') estimatedHours = job.duration.value;
        else if (unit === 'day' || unit === 'days') estimatedHours = job.duration.value * 8;
        else if (unit === 'week' || unit === 'weeks') estimatedHours = job.duration.value * 40;
        else if (unit === 'month' || unit === 'months') estimatedHours = job.duration.value * 160;
      }

      const workerCost = workerHourlyRate * estimatedHours;
      const budgetRatio = job.budget / workerCost;

      if (budgetRatio >= 1.0) {
        budgetFit = 1;
        reasons.push('Budget exceeds your rate');
      } else if (budgetRatio >= 0.8) {
        budgetFit = 0.8;
        reasons.push('Budget compatible');
      } else if (budgetRatio >= 0.6) {
        budgetFit = 0.55;
        reasons.push('Budget close match');
      } else if (budgetRatio >= 0.4) {
        budgetFit = 0.25;
      }
    }
  } else if (!currencyMatch && job.budget && workerHourlyRate > 0) {
    budgetFit = 0.1;
  } else if (workerHourlyRate <= 0) {
    budgetFit = 0.5;
    reasons.push('Budget neutral until your rate is set');
  }
  const budgetScore = budgetFit * WEIGHTS.budget;
  breakdown.budget = Math.round(budgetScore * 10) / 10;
  totalScore += budgetScore;

  const ratingScore = ((worker.rating || 0) / 5) * WEIGHTS.rating;
  breakdown.rating = Math.round(ratingScore * 10) / 10;
  totalScore += ratingScore;

  if (worker.rating >= 4.5) {
    reasons.push('Highly rated worker');
  }

  let experienceScore = 0;
  const completedJobs = worker.totalJobsCompleted || worker.completedJobs || 0;
  const workerYearsOfExperience = Number(
    worker.yearsOfExperience || worker.workerProfile?.yearsOfExperience || 0,
  );
  const requiredExperienceYears = mapExperienceLevelToMinimumYears(job.requirements?.experienceLevel);
  if (completedJobs >= 50) experienceScore = 5;
  else if (completedJobs >= 20) experienceScore = 4;
  else if (completedJobs >= 10) experienceScore = 3;
  else if (completedJobs >= 5) experienceScore = 2;
  else if (completedJobs >= 1) experienceScore = 1;

  if (requiredExperienceYears !== null && workerYearsOfExperience >= requiredExperienceYears) {
    experienceScore = Math.max(experienceScore, 5);
    reasons.push(`Experience level fits ${job.requirements?.experienceLevel} work`);
  } else if (workerYearsOfExperience >= 1) {
    experienceScore = Math.max(experienceScore, 1);
  }

  const normalizedExperienceScore = (experienceScore / 5) * WEIGHTS.experience;
  breakdown.experience = Math.round(normalizedExperienceScore * 10) / 10;
  totalScore += normalizedExperienceScore;

  if (completedJobs >= 20) {
    reasons.push('Experienced worker');
  }

  const avail = worker.availability;
  const availabilityStatus = String(
    worker.availabilityStatus || worker.workerProfile?.availabilityStatus || '',
  ).trim().toLowerCase();
  let availabilityScore = 0;

  if (avail) {
    const now = new Date();

    if (avail.isAvailable === false) {
      availabilityScore = 0;
      reasons.push('Worker is currently unavailable');
    } else if (avail.pausedUntil && new Date(avail.pausedUntil) > now) {
      availabilityScore = 0;
      reasons.push('Worker availability paused');
    } else {
      availabilityScore = 3;

      const todayStr = now.toISOString().slice(0, 10);
      const isHoliday = Array.isArray(avail.holidays) && avail.holidays.some((h) => {
        const hDate = h.date ? new Date(h.date).toISOString().slice(0, 10) : '';
        return hDate === todayStr;
      });

      if (isHoliday) {
        availabilityScore = 1;
      } else {
        const dayOfWeek = now.getDay();
        const todaySlots = Array.isArray(avail.daySlots)
          ? avail.daySlots.find((ds) => ds.dayOfWeek === dayOfWeek)
          : null;

        if (todaySlots && Array.isArray(todaySlots.slots) && todaySlots.slots.length > 0) {
          availabilityScore = 5;
          reasons.push('Currently available (schedule confirmed)');
        } else if (Array.isArray(avail.daySlots) && avail.daySlots.length > 0) {
          availabilityScore = 3;
          reasons.push('Available (not scheduled today)');
        } else if (avail.dailyHours && avail.dailyHours >= 4) {
          availabilityScore = 4;
          reasons.push('Currently available');
        } else {
          availabilityScore = 3;
          reasons.push('Currently available');
        }
      }

      if (avail.weeklyHoursCap && avail.weeklyHoursCap < 20) {
        availabilityScore = Math.max(1, availabilityScore - 1);
      }
    }
  } else if (availabilityStatus === 'available') {
    availabilityScore = 5;
    reasons.push('Currently available');
  } else if (availabilityStatus === 'busy') {
    availabilityScore = 1;
  }

  const normalizedAvailabilityScore = (availabilityScore / 5) * WEIGHTS.availability;
  breakdown.availability = Math.round(normalizedAvailabilityScore * 10) / 10;
  totalScore += normalizedAvailabilityScore;

  const performanceMetrics = worker.userPerformance?.metrics || {};
  const jobCompletionRate = Number(performanceMetrics.jobCompletionRate || 0);
  const onTimeDeliveryRate = Number(performanceMetrics.onTimeDeliveryRate || 0);
  const clientSatisfaction = Number(
    performanceMetrics.clientSatisfaction || performanceMetrics.averageRating || 0,
  );
  const performanceScore = Math.round(
    ((jobCompletionRate * 0.4) + (onTimeDeliveryRate * 0.35) + (clientSatisfaction * 0.25)) / 10,
  );
  const normalizedPerformanceScore = (performanceScore / 10) * WEIGHTS.performance;
  breakdown.performance = Math.round(normalizedPerformanceScore * 10) / 10;
  totalScore += normalizedPerformanceScore;

  if (performanceScore >= 7) {
    reasons.push('Strong historical performance');
  }

  const activeContractsCount = Number(worker.activeContractsCount || 0);
  let capacityPenalty = 0;
  if (activeContractsCount >= 5) {
    capacityPenalty = 8;
    reasons.push('Multiple active contracts already in progress');
  } else if (activeContractsCount >= 3) {
    capacityPenalty = 4;
  }
  breakdown.capacity = -capacityPenalty;
  totalScore -= capacityPenalty;

  return {
    totalScore: Math.max(0, Math.min(100, Math.round(totalScore))),
    breakdown,
    reasons
  };
}

/**
 * Calculate worker match score for a job (from hirer's perspective)
 * FIX M2: Distinct scoring from hirer viewpoint — verification, reviews,
 * and completed jobs weigh more than budget compatibility.
 */
function calculateWorkerMatchScore(job, worker) {
  const base = calculateJobMatchScore(job, worker);
  const rebalancedBaseScore = base.totalScore * 0.8;
  let score = rebalancedBaseScore;
  const reasons = [...base.reasons];
  const breakdown = {
    ...base.breakdown,
    baseMatch: Math.round(rebalancedBaseScore * 10) / 10,
  };

  // Boost verified workers
  if (worker.isVerified) {
    score += 6;
    reasons.push('Verified worker');
    breakdown.verifiedBonus = 6;
  } else {
    breakdown.verifiedBonus = 0;
  }

  // Boost workers with high review counts
  const reviews = Number(worker.totalReviews || 0);
  if (reviews >= 10) {
    score += 8;
    reasons.push(`${reviews} reviews`);
    breakdown.reviewHistory = 8;
  } else if (reviews >= 5) {
    score += 5;
    breakdown.reviewHistory = 5;
  } else if (reviews >= 3) {
    score += 3;
    breakdown.reviewHistory = 3;
  } else {
    breakdown.reviewHistory = 0;
  }

  // Boost workers with strong completion history
  const completed = Number(worker.totalJobsCompleted || 0);
  if (completed >= 20) {
    score += 6;
    reasons.push(`${completed} jobs completed`);
    breakdown.completionHistory = 6;
  } else if (completed >= 10) {
    score += 4;
    breakdown.completionHistory = 4;
  } else if (completed >= 5) {
    score += 3;
    breakdown.completionHistory = 3;
  } else {
    breakdown.completionHistory = 0;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    totalScore: score,
    breakdown,
    reasons
  };
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

    // Match stage - basic filters (tolerate legacy status case variants)
    const matchStage = {
      status: { $in: ['open', 'Open'] },
      $and: [
        {
          $or: [
            { visibility: 'public' },
            { visibility: { $exists: false } },
            { visibility: null }
          ]
        }
      ]
    };

    // Category filter
    if (category) {
      matchStage.category = category;
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map((s) => s.trim());
      const skillRegexes = buildCaseInsensitiveExactRegexes(skillsArray);
      matchStage.$and.push({
        $or: [
          { skills: { $in: skillRegexes } },
          { 'requirements.primarySkills': { $in: skillRegexes } },
          { 'requirements.secondarySkills': { $in: skillRegexes } }
        ]
      });
    }

    // Budget range filter
    if (minBudget || maxBudget) {
      matchStage.budget = {};
      if (minBudget) matchStage.budget.$gte = parseInt(minBudget);
      if (maxBudget) matchStage.budget.$lte = parseInt(maxBudget);
    }

    // Job type filter
    if (jobType) {
      if (['fixed', 'hourly'].includes(jobType)) {
        matchStage.paymentType = jobType;
      } else if (['remote', 'onsite', 'hybrid'].includes(jobType)) {
        matchStage['location.type'] = jobType;
      }
    }

    // Experience level filter
    if (experienceLevel) {
      matchStage['requirements.experienceLevel'] = experienceLevel;
    }

    // Remote work filter
    if (remote === 'true') {
      matchStage['location.type'] = 'remote';
    }

    // Urgency filter
    if (urgent === 'true') {
      const soonThreshold = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      matchStage.$and.push({
        $or: [
          { urgency: { $in: ['high', 'urgent'] } },
          { expiresAt: { $gte: new Date(), $lte: soonThreshold } },
          { 'bidding.bidDeadline': { $gte: new Date(), $lte: soonThreshold } }
        ]
      });
    }

    // Date range filter
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    // Location and geographic filters
    if (location) {
      const escapedLoc = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const locationRegex = new RegExp(escapedLoc, 'i');
      matchStage.$and.push({
        $or: [
          { 'location.city': locationRegex },
          { 'location.country': locationRegex },
          { 'locationDetails.region': locationRegex },
          { 'locationDetails.district': locationRegex }
        ]
      });
    }

    // Geographic search
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius);
      const latDelta = radiusKm / 111;
      const lngDivisor = Math.max(Math.cos((lat * Math.PI) / 180), 0.1);
      const lngDelta = radiusKm / (111 * lngDivisor);

      matchStage['locationDetails.coordinates.lat'] = {
        $gte: lat - latDelta,
        $lte: lat + latDelta,
      };
      matchStage['locationDetails.coordinates.lng'] = {
        $gte: lng - lngDelta,
        $lte: lng + lngDelta,
      };
    }

    // Text search — use Mongo text-score ranking when the schema text index is available.
    const normalizedQuery = String(query || '').trim().slice(0, 120);
    const hasTextQuery = Boolean(normalizedQuery);

    if (hasTextQuery) {
      matchStage.$text = { $search: normalizedQuery };
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
      $unwind: { path: '$hirerInfo', preserveNullAndEmptyArrays: true }
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
    // FIX H3: Compute actual distance when user coordinates are provided
    const distanceField = (latitude && longitude)
      ? {
          // C-03 FIX: Equirectangular approximation with cosine latitude correction
          // (previous formula was Euclidean — ignored longitude convergence at latitude)
          $let: {
            vars: {
              jobLat: { $ifNull: ['$locationDetails.coordinates.lat', 0] },
              jobLng: { $ifNull: ['$locationDetails.coordinates.lng', 0] },
              userLat: { $literal: parseFloat(latitude) },
              userLng: { $literal: parseFloat(longitude) },
            },
            in: {
              $multiply: [
                6371,
                {
                  $sqrt: {
                    $add: [
                      { $pow: [{ $subtract: [{ $degreesToRadians: '$$jobLat' }, { $degreesToRadians: '$$userLat' }] }, 2] },
                      { $pow: [
                        { $multiply: [
                          { $cos: { $degreesToRadians: { $divide: [{ $add: ['$$jobLat', '$$userLat'] }, 2] } } },
                          { $subtract: [{ $degreesToRadians: '$$jobLng' }, { $degreesToRadians: '$$userLng' }] },
                        ] }, 2,
                      ] },
                    ],
                  },
                },
              ],
            },
          },
        }
      : { $literal: 99999 };

    pipeline.push({
      $addFields: {
        relevanceScore: {
          $add: [
            { $multiply: [{ $ifNull: ['$hirerInfo.rating', 0] }, 2] },
            { $cond: [{ $eq: ['$location.type', 'remote'] }, 3, 0] },
            { $cond: [{ $gte: ['$budget', 1000] }, 3, 0] },
            { $cond: [{ $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, 4, 0] },
            { $cond: [{ $gt: [{ $size: { $ifNull: ['$requirements.primarySkills', []] } }, 0] }, 2, 0] }
          ]
        },
        distanceScore: distanceField
      }
    });

    // Sorting
    let sortStage = {};
    switch (sortBy) {
      case 'newest':
        sortStage = { createdAt: -1, _id: -1 };
        break;
      case 'oldest':
        sortStage = { createdAt: 1, _id: 1 };
        break;
      case 'budget_high':
        sortStage = { budget: -1, createdAt: -1, _id: -1 };
        break;
      case 'budget_low':
        sortStage = { budget: 1, createdAt: -1, _id: -1 };
        break;
      case 'rating':
        sortStage = { 'hirerInfo.rating': -1, createdAt: -1, _id: -1 };
        break;
      case 'distance':
        sortStage = { distanceScore: 1, relevanceScore: -1, createdAt: -1, _id: -1 };
        break;
      case 'relevance':
      default:
        sortStage = hasTextQuery
          ? { score: { $meta: 'textScore' }, relevanceScore: -1, createdAt: -1, _id: -1 }
          : { relevanceScore: -1, createdAt: -1, _id: -1 };
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
        paymentType: 1,
        'requirements.experienceLevel': 1,
        location: 1,
        locationDetails: 1,
        expiresAt: 1,
        createdAt: 1,
        updatedAt: 1,
        relevanceScore: 1,
        ...(hasTextQuery ? { textScore: { $meta: 'textScore' } } : {}),
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

    // Execute aggregation (run jobs and count in parallel for performance)
    // Keep count pipeline lightweight: reuse only filter-related stages.
    const countPipeline = [{ $match: matchStage }];
    if (minHirerRating) {
      countPipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'hirer',
            foreignField: '_id',
            as: 'hirerInfo'
          }
        },
        {
          $unwind: { path: '$hirerInfo', preserveNullAndEmptyArrays: true }
        },
        {
          $match: {
            'hirerInfo.rating': { $gte: parseFloat(minHirerRating) }
          }
        }
      );
    }
    countPipeline.push({ $count: 'total' });

    const [jobs, countResult] = await Promise.all([
      Job.aggregate(pipeline),
      Job.aggregate(countPipeline)
    ]);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Transform jobs to match frontend expectations (same format as getJobs)
    const transformedJobs = transformJobsForFrontend(jobs);

    return paginatedResponse(
      res,
      200,
      'Advanced job search completed',
      transformedJobs,
      pageNum,
      pageSize,
      total
    );

  } catch (error) {
    jobLogger.error('Advanced search error', { error: error.message });
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
      Job.countDocuments({ status: { $in: ['open', 'Open'] }, visibility: 'public' }),
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
    jobLogger.error('Job analytics error', { error: error.message });
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
    // AUD2-H02 FIX: Populate payment so the frontend earningsSummary can derive
    // totalEarnings from job.payment.amount instead of falling back to 0.
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('hirer', 'firstName lastName profilePicture profileImage')
        .populate('payment', 'amount status paidAt currency')
        .skip(startIndex)
        .limit(limit)
        .sort(req.query.sort || '-createdAt')
        .lean(),
      Job.countDocuments(query),
    ]);
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const q = { worker: req.user.id };
    if (status) q.status = status;
    const [total, apps] = await Promise.all([
      Application.countDocuments(q),
      Application.find(q)
        .populate('job', 'title category budget location status')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);
    return paginatedResponse(res, 200, 'Applications retrieved', apps, page, limit, total);
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

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return errorResponse(res, 400, 'Invalid job identifier');
    }

    const parsedRate = Number(proposedRate);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      return errorResponse(res, 400, 'proposedRate must be a positive number');
    }

    const normalizedCoverLetter = typeof coverLetter === 'string' ? coverLetter.trim() : '';
    if (!normalizedCoverLetter) {
      return errorResponse(res, 400, 'coverLetter is required');
    }
    if (normalizedCoverLetter.length > 5000) {
      return errorResponse(res, 400, 'coverLetter cannot exceed 5000 characters');
    }

    if (attachments != null && !Array.isArray(attachments)) {
      return errorResponse(res, 400, 'attachments must be an array when provided');
    }

    const job = await Job.findById(jobId);
    if (!job) return errorResponse(res, 404, 'Job not found');

    // Only allow applying to open/public jobs (canonical status is lowercase)
    const jobStatus = String(job.status || '').toLowerCase();
    if (jobStatus !== 'open' || job.visibility === 'private') {
      return errorResponse(res, 400, 'Job is not open for applications');
    }

    const now = Date.now();
    const closingDate = job.expiresAt || job.bidding?.bidDeadline;
    if (closingDate && new Date(closingDate).getTime() <= now) {
      return errorResponse(res, 400, 'Application deadline has passed for this job');
    }

    // Check for duplicate application before creating
    const existingApp = await Application.findOne({ job: jobId, worker: workerId });
    if (existingApp) {
      return errorResponse(res, 409, 'You already applied to this job');
    }

    const app = await Application.create({
      job: jobId,
      worker: workerId,
      proposedRate: parsedRate,
      coverLetter: normalizedCoverLetter,
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
  const requestId = req.id || req.headers?.['x-request-id'];
  try {
    const jobId = req.params.id;

    // Find job with timeout
    const job = await Job.findById(jobId).maxTimeMS(5000).lean();
    if (!job) return errorResponse(res, 404, 'Job not found');
    if (String(job.hirer) !== String(req.user.id)) {
      return errorResponse(res, 403, 'Not authorized');
    }

    const { status } = req.query;
    const query = { job: jobId };
    if (status) query.status = status;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 20), 100);
    const skip = (page - 1) * limit;

    // Query applications with timeout and lean for performance
    const [total, apps] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate('worker', 'firstName lastName profileImage rating')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .maxTimeMS(8000)
        .lean()
    ]);

    return paginatedResponse(res, 200, 'Applications retrieved', apps, page, limit, total);
  } catch (error) {
    jobLogger.error('getJobApplications.error', {
      requestId,
      jobId: req.params?.id,
      error: error.message,
      code: error.code,
      name: error.name
    });
    next(error);
  }
};

/**
 * Get grouped applications summary across all non-bidding jobs for the authenticated hirer
 * @route GET /api/jobs/applications/received-summary
 * @access Private (Hirer only)
 */
const getHirerApplicationsSummary = async (req, res, next) => {
  const requestId = req.id || req.headers?.['x-request-id'];
  try {
    const hirerId = req.user?.id;
    const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
    const requestedJobId = typeof req.query.jobId === 'string' ? req.query.jobId.trim() : '';
    const requestedSort = typeof req.query.sort === 'string' ? req.query.sort.trim().toLowerCase() : 'newest';
    const requestedPage = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 50);
    const validStatuses = new Set(['pending', 'accepted', 'rejected', 'under_review', 'withdrawn']);
    const normalizedSort = {
      newest: 'newest',
      latest: 'newest',
      'highest-rated': 'highest-rated',
      highest_rated: 'highest-rated',
      rating: 'highest-rated',
      'proposed-rate': 'proposed-rate',
      proposed_rate: 'proposed-rate',
      rate: 'proposed-rate',
    }[requestedSort] || 'newest';
    const sortStage = normalizedSort === 'highest-rated'
      ? { workerRatingSort: -1, createdAt: -1, _id: -1 }
      : normalizedSort === 'proposed-rate'
        ? { proposedRateSort: -1, createdAt: -1, _id: -1 }
        : { createdAt: -1, _id: -1 };
    const createEmptyCounts = () => ({
      pending: 0,
      accepted: 0,
      rejected: 0,
      under_review: 0,
      withdrawn: 0,
      total: 0,
    });

    const jobs = await Job.find({ hirer: hirerId })
      .select('title status budget budgetRange paymentType bidding createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(8000);

    const standardJobs = jobs.filter((job) => !job?.bidding?.bidStatus);
    if (standardJobs.length === 0) {
      return successResponse(res, 200, 'Hirer applications summary retrieved', {
        jobs: [],
        applications: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 1,
        },
        summary: {
          totalJobs: 0,
          totalApplications: 0,
          countsByStatus: {
            pending: 0,
            accepted: 0,
            rejected: 0,
            under_review: 0,
            withdrawn: 0,
          },
        },
        filters: {
          jobId: null,
          status: validStatuses.has(statusFilter) ? statusFilter : null,
          sort: normalizedSort,
        },
      });
    }

    const jobIds = standardJobs.map((job) => job._id);
    const jobMap = new Map(
      standardJobs.map((job) => {
        const jobId = job._id?.toString?.() || String(job._id);
        return [jobId, job];
      }),
    );

    if (requestedJobId && !jobMap.has(requestedJobId)) {
      return errorResponse(res, 404, 'Job not found');
    }

    const countsByStatus = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      under_review: 0,
      withdrawn: 0,
    };
    const jobCountsMap = new Map();

    const countsAggregation = await Application.aggregate([
      {
        $match: {
          job: { $in: jobIds },
        },
      },
      {
        $group: {
          _id: {
            job: '$job',
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
    ]).option({ maxTimeMS: 8000 });

    countsAggregation.forEach((entry) => {
      const jobId = entry?._id?.job?.toString?.() || String(entry?._id?.job);
      const status = entry?._id?.status || 'pending';
      const count = Number(entry?.count) || 0;

      if (!jobCountsMap.has(jobId)) {
        jobCountsMap.set(jobId, createEmptyCounts());
      }

      const jobCounts = jobCountsMap.get(jobId);
      if (jobCounts[status] === undefined) {
        jobCounts[status] = 0;
      }
      jobCounts[status] += count;
      jobCounts.total += count;

      if (countsByStatus[status] !== undefined) {
        countsByStatus[status] += count;
      }
    });

    const jobsWithCounts = standardJobs.map((job) => {
      const jobId = job._id?.toString?.() || String(job._id);
      return {
        ...job,
        _id: jobId,
        id: jobId,
        applicationCounts: jobCountsMap.get(jobId) || createEmptyCounts(),
      };
    });

    const applicationQuery = requestedJobId
      ? { job: jobMap.get(requestedJobId)._id }
      : { job: { $in: jobIds } };

    if (validStatuses.has(statusFilter)) {
      applicationQuery.status = statusFilter;
    }

    const total = await Application.countDocuments(applicationQuery).maxTimeMS(8000);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * limit;

    const applications = total > 0
      ? await Application.aggregate([
        {
          $match: applicationQuery,
        },
        {
          $lookup: {
            from: User.collection.name,
            localField: 'worker',
            foreignField: '_id',
            as: 'worker',
          },
        },
        {
          $unwind: {
            path: '$worker',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            workerRatingSort: { $ifNull: ['$worker.rating', -1] },
            proposedRateSort: { $ifNull: ['$proposedRate', -1] },
          },
        },
        {
          $sort: sortStage,
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            workerRatingSort: 0,
            proposedRateSort: 0,
          },
        },
      ]).option({ maxTimeMS: 8000 })
      : [];

    const normalizedApplications = applications.map((application) => {
      const jobId = application.job?.toString?.() || String(application.job);
      return {
        ...application,
        id: application._id?.toString?.() || String(application._id),
        jobId,
        jobTitle: jobMap.get(jobId)?.title || 'Unknown Job',
      };
    });

    const totalApplications = Object.values(countsByStatus).reduce((sum, value) => sum + value, 0);

    return successResponse(res, 200, 'Hirer applications summary retrieved', {
      jobs: jobsWithCounts,
      applications: normalizedApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalJobs: jobsWithCounts.length,
        totalApplications,
        countsByStatus,
      },
      filters: {
        jobId: requestedJobId || null,
        status: validStatuses.has(statusFilter) ? statusFilter : null,
        sort: normalizedSort,
      },
    });
  } catch (error) {
    jobLogger.error('getHirerApplicationsSummary.error', {
      requestId,
      hirerId: req.user?.id,
      jobId: req.query?.jobId,
      status: req.query?.status,
      sort: req.query?.sort,
      page: req.query?.page,
      limit: req.query?.limit,
      error: error.message,
      code: error.code,
      name: error.name,
    });
    next(error);
  }
};

/**
 * Get proposals across all jobs for the authenticated hirer
 * @route GET /api/jobs/proposals
 * @access Private (Hirer only)
 */
const getHirerProposals = async (req, res, next) => {
  try {
    const hirerId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
    const statusFilter = (req.query.status || 'all').toLowerCase();
    const jobStatusFilter = (req.query.jobStatus || 'all').toLowerCase();
    const searchTerm = (req.query.search || '').trim();

    const jobCriteria = { hirer: hirerId };
    if (jobStatusFilter !== 'all') {
      jobCriteria.status = jobStatusFilter;
    }

    const jobs = await Job.find(jobCriteria).select(
      'title category status budget currency paymentType location locationDetails duration createdAt',
    ).lean().limit(200);

    if (jobs.length === 0) {
      return paginatedResponse(
        res,
        200,
        'No proposals available for this hirer',
        [],
        page,
        limit,
        0,
        {
          aggregates: {
            statusCounts: {},
            total: 0,
            jobCount: 0,
            averageRate: 0,
            updatedAt: new Date().toISOString(),
          },
        },
      );
    }

    const jobIds = jobs.map((job) => job._id);
    const jobLookup = new Map(jobs.map((job) => [job._id.toString(), job]));

    const baseMatch = { job: { $in: jobIds } };
    const filteredMatch = { ...baseMatch };
    if (statusFilter !== 'all') {
      filteredMatch.status = statusFilter;
    }
    if (searchTerm) {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filteredMatch.$or = [
        { coverLetter: regex },
        { 'questionResponses.answer': regex },
      ];
    }

    const [total, proposals, statusBuckets, averageRateBucket] = await Promise.all([
      Application.countDocuments(filteredMatch),
      Application.find(filteredMatch)
        .populate('worker', 'firstName lastName profileImage rating location city country experienceLevel profession totalJobs completedJobs')
        .populate('job', 'title category status budget currency paymentType location locationDetails duration createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Application.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, averageRate: { $avg: '$proposedRate' } } },
      ]),
    ]);

    const statusCounts = statusBuckets.reduce((acc, bucket) => {
      if (!bucket?._id) return acc;
      acc[bucket._id] = bucket.count;
      return acc;
    }, {});

    const averageRate = Number(averageRateBucket?.[0]?.averageRate || 0);

    const formatLocationLabel = (location = {}) => {
      if (!location) return 'Location not specified';
      if (typeof location === 'string') return location;
      const { city, region, country, address } = location;
      const parts = [city, region, address, country]
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);
      return parts.length ? parts.join(', ') : 'Location not specified';
    };

    const trimCoverLetter = (text = '') => {
      if (!text) return '';
      const normalized = String(text).trim();
      return normalized.length > 280
        ? `${normalized.slice(0, 277)}...`
        : normalized;
    };

    const normalizedProposals = proposals.map((application) => {
      const jobDoc = application.job || jobLookup.get(String(application.job));
      const workerDoc = application.worker || {};
      const workerName = [workerDoc.firstName, workerDoc.lastName]
        .filter(Boolean)
        .join(' ')
        .trim()
        || workerDoc.displayName
        || 'Worker';

      return {
        id: application._id,
        status: application.status,
        submittedAt: application.createdAt,
        proposedRate: application.proposedRate,
        currency: jobDoc?.currency || 'GHS',
        availability: {
          startDate: application.availabilityStartDate,
          duration: application.estimatedDuration,
        },
        coverLetterPreview: trimCoverLetter(application.coverLetter),
        job: jobDoc
          ? {
            id: jobDoc._id,
            title: jobDoc.title,
            category: jobDoc.category,
            status: jobDoc.status,
            budget: jobDoc.budget,
            paymentType: jobDoc.paymentType,
            duration: jobDoc.duration,
            location: formatLocationLabel(
              jobDoc.location || jobDoc.locationDetails,
            ),
          }
          : null,
        worker: {
          id: workerDoc?._id,
          name: workerName,
          avatar: workerDoc?.profileImage || null,
          rating: Number(workerDoc?.rating || 0),
          location: formatLocationLabel(
            workerDoc?.location || {
              city: workerDoc?.city,
              country: workerDoc?.country,
            },
          ),
          experience:
            workerDoc?.experienceLevel ||
            workerDoc?.profession ||
            'Experience not specified',
          completedJobs: workerDoc?.completedJobs || workerDoc?.totalJobs || 0,
        },
      };
    });

    return paginatedResponse(
      res,
      200,
      'Proposals retrieved successfully',
      normalizedProposals,
      page,
      limit,
      total,
      {
        aggregates: {
          statusCounts,
          total,
          jobCount: jobs.length,
          averageRate,
          filters: {
            status: statusFilter,
            jobStatus: jobStatusFilter,
          },
          updatedAt: new Date().toISOString(),
        },
      },
    );
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
    const valid = ['pending', 'under_review', 'accepted', 'rejected', 'withdrawn'];
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const [total, saves] = await Promise.all([
      SavedJob.countDocuments({ user: userId }),
      SavedJob.find({ user: userId })
        .populate('job')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);
    const jobs = saves.map((s) => s.job).filter(Boolean);
    return paginatedResponse(res, 200, 'Saved jobs retrieved', jobs, page, limit, total);
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
    // LOW-03 FIX: Return 409 Conflict for duplicate save (idempotent but semantically correct)
    if (error?.code === 11000) return errorResponse(res, 409, 'Job already saved');
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
    // FIX L2: Cap limit to prevent dumping the entire collection
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = (page - 1) * limit;

    if (!region) {
      return errorResponse(res, 400, 'Region is required');
    }

    const query = { 'locationDetails.region': region, status: 'open', visibility: 'public' };
    if (district) {
      query['locationDetails.district'] = district;
    }

    // FIX L1: Run find and countDocuments in parallel instead of sequentially
    const [jobs, totalCount] = await Promise.all([
      Job.find(query)
        .populate('hirer', 'firstName lastName profilePicture profileImage')
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Job.countDocuments(query),
    ]);

    return paginatedResponse(res, 200, 'Jobs by location retrieved successfully', jobs, page, limit, totalCount);
  } catch (error) {
    next(error);
  }
};

// Get jobs by skill with performance-based filtering
const getJobsBySkill = async (req, res, next) => {
  try {
    const { skill } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    // FIX L2: Cap limit
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = (page - 1) * limit;

    const skillQuery = {
      $or: [
        { 'requirements.primarySkills': { $regex: new RegExp(`^${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { 'requirements.secondarySkills': { $regex: new RegExp(`^${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { skills: { $regex: new RegExp(`^${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ],
      status: 'open',
      visibility: 'public'
    };

    // FIX L1: Run find and countDocuments in parallel
    const [jobs, totalCount] = await Promise.all([
      Job.find(skillQuery)
        .populate('hirer', 'firstName lastName profilePicture profileImage')
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Job.countDocuments(skillQuery),
    ]);

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
    // FIX L2: Cap limit
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = (page - 1) * limit;

    const validTiers = ['tier1', 'tier2', 'tier3'];
    if (!validTiers.includes(tier)) {
      return errorResponse(res, 400, 'Invalid tier. Must be tier1, tier2, or tier3');
    }

    const tierQuery = { performanceTier: tier, status: 'open', visibility: 'public' };

    // FIX L1: Run in parallel + add .lean()
    const [jobs, totalCount] = await Promise.all([
      Job.find(tierQuery)
        .populate('hirer', 'firstName lastName profilePicture profileImage')
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Job.countDocuments(tierQuery),
    ]);

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
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = (page - 1) * limit;
    const candidateLimit = Math.max((offset + limit) * 4, 60);
    const databaseCandidateLimit = Math.min(candidateLimit * 2, 1000);

    const [workerContext, userPerformance, appliedJobIds] = await Promise.all([
      getCanonicalWorkerContext(userId),
      UserPerformance.findOne({ userId }).lean(),
      typeof Application.distinct === 'function'
        ? Application.distinct('job', { worker: userId })
        : Promise.resolve([]),
    ]);

    if (!workerContext?.worker) {
      return errorResponse(res, 403, 'Only workers can access personalized job recommendations');
    }

    const canonicalWorker = workerContext.worker;

    const performancePrimarySkills = (userPerformance?.skillVerification?.primarySkills || [])
      .filter(skill => skill.verified)
      .map(skill => skill.skill);

    const performanceSecondarySkills = (userPerformance?.skillVerification?.secondarySkills || [])
      .filter(skill => skill.verified)
      .map(skill => skill.skill);

    const canonicalSkills = collectWorkerSkills(canonicalWorker);
    const allSkills = Array.from(new Set([
      ...canonicalSkills,
      ...performancePrimarySkills,
      ...performanceSecondarySkills,
    ]));
    const allSkillSet = new Set(allSkills.map((skill) => String(skill).trim().toLowerCase()));

    if (allSkills.length === 0) {
      return successResponse(
        res,
        200,
        PROFILE_INCOMPLETE_RECOMMENDATION_MESSAGE,
        {
          jobs: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 1,
          },
          totalRecommendations: 0,
          averageMatchScore: 0,
          isNewUser: !userPerformance,
        },
        {
          recommendationSource: userPerformance ? 'skills-missing' : 'profile-incomplete',
          contract: MOBILE_RECOMMENDATIONS_CONTRACT,
        },
      );
    }

    // Fetch a bounded candidate window tied to the requested page, THEN score and paginate.
    // This avoids scoring a fixed 200 jobs for every request while still giving the sort
    // enough headroom to find strong matches beyond the visible page size.
    // FIX C1: Previous code had duplicate `$or` keys in the object literal which
    // caused the skills $or to be silently overwritten by the expiry $or.
    // Now all conditions are wrapped inside a single $and array.
    const skillRegexes = buildCaseInsensitiveExactRegexes(allSkills);
    const regexMatchConditions = skillRegexes.map((regex) => ({ $regexMatch: { input: { $toString: '$$skill' }, regex } }));
    const baseCandidateQuery = {
      status: { $in: ['open', 'Open'] },
      'bidding.bidStatus': 'open',
      ...(appliedJobIds.length > 0 ? { _id: { $nin: appliedJobIds } } : {}),
      $and: [
        {
          $or: [
            { 'requirements.primarySkills': { $in: skillRegexes } },
            { 'requirements.secondarySkills': { $in: skillRegexes } },
            { skills: { $in: skillRegexes } },
          ],
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
          ],
        },
        {
          $or: [
            { visibility: 'public' },
            { visibility: { $exists: false } },
            { visibility: null },
          ],
        },
      ],
    };

    let candidateJobs;
    if (typeof Job.aggregate === 'function') {
      const candidatePipeline = [
        { $match: baseCandidateQuery },
        {
          $addFields: {
            matchedPrimarySkills: {
              $filter: {
                input: { $ifNull: ['$requirements.primarySkills', []] },
                as: 'skill',
                cond: { $or: regexMatchConditions },
              },
            },
            matchedSecondarySkills: {
              $filter: {
                input: { $ifNull: ['$requirements.secondarySkills', []] },
                as: 'skill',
                cond: { $or: regexMatchConditions },
              },
            },
            matchedExplicitSkills: {
              $filter: {
                input: { $ifNull: ['$skills', []] },
                as: 'skill',
                cond: { $or: regexMatchConditions },
              },
            },
          },
        },
        {
          $addFields: {
            skillOverlapCount: {
              $add: [
                { $size: '$matchedPrimarySkills' },
                { $size: '$matchedSecondarySkills' },
                { $size: '$matchedExplicitSkills' },
              ],
            },
          },
        },
        { $sort: { skillOverlapCount: -1, createdAt: -1, _id: -1 } },
        { $limit: databaseCandidateLimit },
      ];

      candidateJobs = await Job.aggregate(candidatePipeline);
      const hirerIds = Array.from(new Set(candidateJobs.map((job) => job.hirer).filter(Boolean)));
      const hirers = await User.find({ _id: { $in: hirerIds } })
        .select('firstName lastName profilePicture profileImage rating totalJobsPosted companyName businessName')
        .lean();
      const hirerMap = new Map(hirers.map((hirer) => [String(hirer._id), hirer]));
      candidateJobs.forEach((job) => {
        if (job.hirer) {
          job.hirer = hirerMap.get(String(job.hirer)) || job.hirer;
        }
      });
    } else {
      candidateJobs = await Job.find(baseCandidateQuery)
        .populate('hirer', 'firstName lastName profilePicture profileImage rating totalJobsPosted companyName businessName')
        .sort({ createdAt: -1, _id: -1 })
        .limit(candidateLimit)
        .lean();
    }

    // Calculate match scores for each job with null guards
    const jobsWithScores = candidateJobs.map(job => {
      const baseScore = calculateJobMatchScore(job, canonicalWorker);
      let score = baseScore.totalScore;

      const jobRegion = job.locationDetails?.region;
      const workerRegion = readLocationParts(canonicalWorker.location).region;
      const preferredRegion = userPerformance?.locationPreferences?.primaryRegion;

      if (preferredRegion && jobRegion && preferredRegion === jobRegion) {
        score += 5;
      } else if (workerRegion && jobRegion && workerRegion === String(jobRegion).trim().toLowerCase()) {
        score += 3;
      }

      if (userPerformance?.performanceTier && userPerformance.performanceTier === job.performanceTier) {
        score += 4;
      }

      // C-05 FIX: Reduced bonus magnitudes to prevent score clamping at 100
      const daysSincePosted = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSincePosted <= 3) score += 5;
      else if (daysSincePosted <= 7) score += 3;
      else if (daysSincePosted > 30) score -= 8;
      else if (daysSincePosted > 14) score -= 4;

      score = Math.max(0, Math.min(100, Math.round(score)));

      return {
        ...job,
        matchScore: score,
        matchBreakdown: baseScore.breakdown,
        matchReasons: baseScore.reasons,
      };
    });

    // Sort ALL by match score FIRST, THEN paginate
    jobsWithScores.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    const totalCount = jobsWithScores.length;
    const paginatedJobs = jobsWithScores.slice(offset, offset + limit);

    const recommendationItems = paginatedJobs.map((job) => {
      const matchedPrimarySkills = (job.requirements?.primarySkills || []).filter((skill) =>
        allSkillSet.has(String(skill || '').trim().toLowerCase()),
      );
      const matchedSecondarySkills = (job.requirements?.secondarySkills || []).filter((skill) =>
        allSkillSet.has(String(skill || '').trim().toLowerCase()),
      );
      const reasons = [
        matchedPrimarySkills.length > 0 ? `Matched ${matchedPrimarySkills.length} core skill${matchedPrimarySkills.length > 1 ? 's' : ''}` : null,
        matchedSecondarySkills.length > 0 ? `Matched ${matchedSecondarySkills.length} supporting skill${matchedSecondarySkills.length > 1 ? 's' : ''}` : null,
        userPerformance?.locationPreferences?.primaryRegion && userPerformance.locationPreferences.primaryRegion === job.locationDetails?.region
          ? `Matches your preferred region: ${job.locationDetails?.region}`
          : null,
        !userPerformance && canonicalWorker.profession
          ? `Ranked using your worker profile as a ${canonicalWorker.profession}`
          : null,
      ].filter(Boolean);

      return {
        ...transformJobForFrontend(job),
        matchScore: Math.max(0, Math.min(100, Number(job.matchScore) || 0)),
        matchBreakdown: job.matchBreakdown,
        aiReasoning: reasons[0] || 'Ranked from your verified skills, location, and recent performance signals.',
        aiReasons: Array.from(new Set([...(job.matchReasons || []), ...reasons])),
        recommendationSource: 'personalized',
      };
    });

    const averageMatchScore = recommendationItems.length > 0
      ? Math.round(
        (recommendationItems.reduce((sum, item) => sum + (item.matchScore || 0), 0) /
          recommendationItems.length) *
        100,
      ) / 100
      : 0;

    return successResponse(
      res,
      200,
      'Personalized job recommendations retrieved successfully',
      {
        jobs: recommendationItems,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        },
        totalRecommendations: totalCount,
        averageMatchScore,
      },
      {
        recommendationSource: userPerformance ? 'user-performance' : 'worker-profile',
        matchedSkills: allSkills.slice(0, 5),
        contract: MOBILE_RECOMMENDATIONS_CONTRACT,
      },
    );
  } catch (error) {
    next(error);
  }
};

// Close job bidding
const closeJobBidding = async (req, res, next) => {
  try {
    const { id: jobId } = req.params;
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
    const { id: jobId } = req.params;
    const { days = 7 } = req.body;

    const numDays = Number(days);
    if (!Number.isFinite(numDays) || numDays < 1 || numDays > 90) {
      return errorResponse(res, 400, 'days must be between 1 and 90');
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.hirer.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied. You can only extend deadline for your own jobs');
    }

    await job.extendDeadline(numDays);

    return successResponse(res, 200, 'Job deadline extended successfully', job);
  } catch (error) {
    next(error);
  }
};

// Renew expired job
const renewJob = async (req, res, next) => {
  try {
    const { id: jobId } = req.params;
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

/**
 * Get platform statistics
 * @route GET /api/jobs/stats
 * @access Public
 */
const getPlatformStats = async (req, res, next) => {
  try {
    await ensureConnection();

    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel using Mongoose models
    const [
      availableJobs,
      activeEmployers,
      skilledWorkers,
      completedJobs,
      cancelledJobs,
      totalApplications,
      successfulPlacements
    ] = await Promise.all([
      // Available jobs: open status
      Job.countDocuments({
        status: { $in: ['open', 'Open', 'OPEN'] }
      }),

      // Active employers: distinct hirers with any jobs
      Job.distinct('hirer', {
        status: { $in: ['open', 'Open', 'OPEN', 'in-progress', 'completed'] }
      }).then(ids => ids.length),

      // Skilled workers: active workers
      User.countDocuments({
        role: 'worker',
        isActive: { $ne: false }
      }),

      // Completed jobs for success rate calculation
      Job.countDocuments({ status: 'completed' }),

      // Cancelled jobs for success rate calculation
      Job.countDocuments({ status: 'cancelled' }),

      // Total applications
      Application.countDocuments({}),

      // Successful placements (accepted applications)
      Application.countDocuments({ status: 'accepted' })
    ]);

    // Calculate success rate based on completed vs cancelled jobs
    const totalResolvedJobs = completedJobs + cancelledJobs;
    let successRate = 0;
    if (totalResolvedJobs > 0) {
      successRate = Math.round((completedJobs / totalResolvedJobs) * 100);
    } else if (totalApplications > 0 && successfulPlacements > 0) {
      // Fallback: calculate from applications
      successRate = Math.round((successfulPlacements / totalApplications) * 100);
    } else {
      // For new platforms with no historical data, show conservative estimate
      // Based on industry standards for skilled trade job platforms
      successRate = 0; // Will show as "N/A" or "0%" until first jobs complete
    }

    const stats = {
      availableJobs: availableJobs || 0,
      activeEmployers: activeEmployers || 0,
      skilledWorkers: skilledWorkers || 0,
      successRate: successRate || 0,
      lastUpdated: new Date().toISOString()
    };

    // Return with cache headers (1 hour cache)
    res.set('Cache-Control', 'public, max-age=3600');
    return successResponse(res, 200, 'Platform statistics retrieved successfully', stats);

  } catch (error) {
    // Fallback to reasonable defaults if query fails
    const fallbackStats = {
      availableJobs: 0,
      activeEmployers: 0,
      skilledWorkers: 0,
      successRate: 0,
      lastUpdated: new Date().toISOString()
    };

    return successResponse(res, 200, 'Platform statistics retrieved (fallback)', fallbackStats);
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
  updateContract,
  approveMilestone,
  // Milestone CRUD
  getContractMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  payMilestone,
  getJobRecommendations,
  getWorkerMatches,
  advancedJobSearch,
  getJobAnalytics,
  applyToJob,
  getJobApplications,
  getHirerApplicationsSummary,
  getHirerProposals,
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
  getPlatformStats,
  getSearchSuggestions,
  __testables: {
    calculateJobMatchScore,
    calculateWorkerMatchScore,
  },
};
