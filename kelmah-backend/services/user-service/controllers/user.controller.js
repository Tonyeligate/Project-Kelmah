// Use MongoDB WorkerProfile model for consistency
const db = require('../models');
// Destructure frequently-used models from service index (RULE-001 compliant)
const { Bookmark, Availability, Certificate, Job, Application, Portfolio, ActivityEvent } = db;
const { ensureConnection, mongoose: connectionInstance } = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { logger } = require('../utils/logger');
const { buildCanonicalWorkerSnapshot } = require('../../../shared/utils/canonicalWorker');
const mongooseInstance = connectionInstance || require('mongoose');
const { Types } = mongooseInstance;

const ensureModelsLoaded = () => {
  if (typeof db.loadModels === 'function' && (!db.User || !db.WorkerProfile)) {
    try {
      db.loadModels();
    } catch (error) {
      logger.warn('user.controller: loadModels failed', error.message);
    }
  }
};

const getUserModel = () => {
  ensureModelsLoaded();
  return db.User;
};

const getWorkerProfileModel = () => {
  ensureModelsLoaded();
  return db.WorkerProfile;
};

const requireUserModel = () => {
  const model = getUserModel();
  if (!model) {
    throw new Error('User model not initialized');
  }
  return model;
};

const requireWorkerProfileModel = () => {
  const model = getWorkerProfileModel();
  if (!model) {
    throw new Error('WorkerProfile model not initialized');
  }
  return model;
};

const normalizeDocument = (doc) => {
  if (!doc) {
    return {};
  }

  if (typeof doc.toObject === 'function') {
    return doc.toObject();
  }

  return doc;
};

const getActiveDb = () => mongooseInstance?.connection?.db || null;

const buildGraphFromTotal = (total) => {
  const normalized = Math.max(Number(total) || 0, 0);
  const monthlyAverage = normalized / 12 || 0;
  return Array.from({ length: 12 }).map((_, index) => ({
    month: index + 1,
    amount: Number((monthlyAverage * (0.85 + (index % 4) * 0.05)).toFixed(2)),
  }));
};

const buildEarningsFallback = (total, overrides = {}) => {
  const normalized = Math.max(Number(total) || 0, 0);
  const last30Days = overrides.last30Days ?? Number((normalized * 0.12).toFixed(2));
  const last7Days = overrides.last7Days ?? Number((normalized * 0.04).toFixed(2));
  const graph = overrides.graph || buildGraphFromTotal(normalized);
  return { total: normalized, last30Days, last7Days, graph };
};

const formatProfilePayload = (userDoc, workerDoc) => {
  const userData = normalizeDocument(userDoc);
  const workerData = normalizeDocument(workerDoc);
  const isWorker = (userData.role || 'worker') === 'worker';
  const canonicalWorker = buildCanonicalWorkerSnapshot(userData, workerData);

  const profile = {
    id: userData._id?.toString() || userData.id || null,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    phone: userData.phone || '',
    role: userData.role || 'worker',
    profilePicture: isWorker ? canonicalWorker.profilePicture : userData.profilePicture || workerData.profilePicture || null,
    bio: isWorker ? canonicalWorker.bio : workerData.bio ?? userData.bio ?? '',
    location: isWorker ? canonicalWorker.location : workerData.location ?? userData.location ?? '',
    address: userData.address || '',
    city: userData.city || '',
    state: userData.state || '',
    country: userData.country || 'Ghana',
    countryCode: userData.countryCode || 'GH',
    profession: isWorker ? canonicalWorker.profession : workerData.profession ?? userData.profession ?? '',
    hourlyRate: isWorker ? canonicalWorker.hourlyRate ?? null : workerData.hourlyRate ?? userData.hourlyRate ?? null,
    currency: isWorker ? canonicalWorker.currency : workerData.currency ?? userData.currency ?? 'GHS',
    experienceLevel: workerData.experienceLevel ?? null,
    yearsOfExperience: isWorker ? canonicalWorker.yearsOfExperience ?? null : workerData.yearsOfExperience ?? userData.yearsOfExperience ?? null,
    skills: isWorker
      ? canonicalWorker.skills
      : Array.isArray(workerData.skills)
        ? workerData.skills
        : Array.isArray(userData.skills)
          ? userData.skills
          : [],
    isEmailVerified: Boolean(userData.isEmailVerified),
    isPhoneVerified: Boolean(userData.isPhoneVerified),
    createdAt: userData.createdAt || null,
    updatedAt: canonicalWorker.updatedAt || userData.updatedAt || null,
  };

  const meta = {
    source: workerData && (workerData._id || workerData.id) ? 'user-service' : 'auth-service',
    workerProfileId: workerData?._id?.toString() || workerData?.id || null,
  };

  return { profile, meta };
};

const USER_PROFILE_PROJECTION = {
  firstName: 1,
  lastName: 1,
  email: 1,
  phone: 1,
  role: 1,
  profilePicture: 1,
  bio: 1,
  address: 1,
  city: 1,
  state: 1,
  country: 1,
  countryCode: 1,
  profession: 1,
  hourlyRate: 1,
  currency: 1,
  isEmailVerified: 1,
  isPhoneVerified: 1,
  yearsOfExperience: 1,
  skills: 1,
  location: 1,
  createdAt: 1,
  updatedAt: 1,
};

const WORKER_PROFILE_PROJECTION = {
  bio: 1,
  location: 1,
  profession: 1,
  title: 1,
  headline: 1,
  hourlyRate: 1,
  currency: 1,
  experienceLevel: 1,
  yearsOfExperience: 1,
  skills: 1,
  skillEntries: 1,
  specializations: 1,
  profilePicture: 1,
  availabilityStatus: 1,
  isVerified: 1,
  profileCompleteness: 1,
  updatedAt: 1,
  createdAt: 1,
  userId: 1,
};

const isBsonVersionMismatch = (error) =>
  Boolean(error) &&
  typeof error.message === 'string' &&
  error.message.toLowerCase().includes('unsupported bson version');

const DASHBOARD_DB_TIMEOUT_MS = Number(process.env.DASHBOARD_DB_TIMEOUT_MS || 4000);
const DASHBOARD_HTTP_TIMEOUT_MS = Number(process.env.DASHBOARD_HTTP_TIMEOUT_MS || 3500);
const DASHBOARD_CONNECTION_TIMEOUT_MS = Number(process.env.DASHBOARD_CONNECTION_TIMEOUT_MS || 8000);

const buildMonthlyZeroGrowth = (now = new Date()) =>
  Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      users: 0,
    };
  });

const createOperationTimeoutError = (label, timeoutMs) => {
  const error = new Error(`Operation timed out: ${label} (${timeoutMs}ms)`);
  error.code = 'OPERATION_TIMEOUT';
  error.operation = label;
  return error;
};

const runWithTimeout = async (label, operation, timeoutMs) => {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(createOperationTimeoutError(label, timeoutMs));
    }, timeoutMs);
  });

  try {
    const operationPromise = typeof operation === 'function'
      ? Promise.resolve().then(operation)
      : Promise.resolve(operation);
    return await Promise.race([operationPromise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const safeCountDocuments = (model, filter, label) =>
  runWithTimeout(
    label,
    () => model.countDocuments(filter).maxTimeMS(DASHBOARD_DB_TIMEOUT_MS),
    DASHBOARD_DB_TIMEOUT_MS + 250,
  );

const fetchProfileDocuments = async ({ UserModel, WorkerProfileModel, userId }) => {
  ensureModelsLoaded();
  const resolvedUserModel = UserModel && typeof UserModel.findById === 'function'
    ? UserModel
    : getUserModel();
  const resolvedWorkerModel = WorkerProfileModel && typeof WorkerProfileModel.findOne === 'function'
    ? WorkerProfileModel
    : getWorkerProfileModel();

  try {
    const [userDoc, workerDoc] = await Promise.all([
      resolvedUserModel?.findById(userId)
        .select(USER_PROFILE_PROJECTION)
        .lean({ getters: true }),
      resolvedWorkerModel && typeof resolvedWorkerModel.findOne === 'function'
        ? resolvedWorkerModel.findOne({ userId })
            .select(WORKER_PROFILE_PROJECTION)
            .lean({ getters: true })
        : null,
    ]);

    return { userDoc, workerDoc };
  } catch (error) {
    if (!isBsonVersionMismatch(error)) {
      throw error;
    }

    logger.warn(
      'Detected BSON version mismatch while loading profile, retrying with native driver',
      { error: error.message },
    );

    if (!Types.ObjectId.isValid(userId)) {
      throw error;
    }

    const nativeObjectId = new Types.ObjectId(userId);
    const db = getActiveDb();

    if (!db) {
      throw error;
    }

    const userDoc = await db.collection('users').findOne(
      { _id: nativeObjectId },
      { projection: USER_PROFILE_PROJECTION },
    );

    let workerDoc = null;

    if (resolvedWorkerModel && resolvedWorkerModel.collection) {
      const workerCollectionName =
        resolvedWorkerModel.collection.collectionName ||
        resolvedWorkerModel.collection.name ||
        'workerprofiles';

      workerDoc = await db.collection(workerCollectionName).findOne(
        { userId: nativeObjectId },
        { projection: WORKER_PROFILE_PROJECTION },
      );
    } else {
      workerDoc = await db
        .collection('workerprofiles')
        .findOne(
          { userId: nativeObjectId },
          { projection: WORKER_PROFILE_PROJECTION },
        )
        .catch(() => null);
    }

    return { userDoc, workerDoc };
  }
};

const PROFILE_COMPLETENESS_REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'profession',
  'bio',
  'location',
  'hourlyRate',
  'skills',
];

const PROFILE_COMPLETENESS_OPTIONAL_FIELDS = [
  'profilePicture',
  'phone',
  'licenses',
  'certifications',
  'portfolio',
  'yearsOfExperience',
];

const hasStructuredValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return value !== undefined && value !== null && value !== '';
};

const buildAvailabilityPayload = (availabilityDoc) => {
  if (!availabilityDoc) {
    return {
      status: 'not_set',
      isAvailable: false,
      timezone: 'Africa/Accra',
      schedule: [],
      daySlots: [],
      nextAvailable: null,
      lastUpdated: null,
      message: 'Availability not configured',
    };
  }

  const normalizedDaySlots = Array.isArray(availabilityDoc.daySlots)
    ? availabilityDoc.daySlots
    : [];

  const dayNameByIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parseTimeToMinutes = (value) => {
    if (!value || typeof value !== 'string') return null;
    const [h, m] = value.split(':').map((part) => Number(part));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };

  const schedule = normalizedDaySlots.map((daySlot) => {
    const slots = Array.isArray(daySlot?.slots) ? daySlot.slots : [];
    const first = slots[0] || {};
    const firstStartMinutes = parseTimeToMinutes(first.start);
    const firstEndMinutes = parseTimeToMinutes(first.end);

    return {
      day: dayNameByIndex[daySlot?.dayOfWeek] || null,
      dayOfWeek: Number.isFinite(daySlot?.dayOfWeek) ? daySlot.dayOfWeek : null,
      available: slots.length > 0,
      slots,
      startHour: firstStartMinutes !== null ? Math.floor(firstStartMinutes / 60) : null,
      startMinute: firstStartMinutes !== null ? firstStartMinutes % 60 : null,
      endHour: firstEndMinutes !== null ? Math.floor(firstEndMinutes / 60) : null,
      endMinute: firstEndMinutes !== null ? firstEndMinutes % 60 : null,
    };
  });

  const now = new Date();
  let nextAvailable = null;

  if (schedule.length > 0) {
    const currentDayIndex = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let offset = 0; offset < 7; offset += 1) {
      const dayIndex = (currentDayIndex + offset) % 7;
      const dayEntry = schedule.find((item) => item.dayOfWeek === dayIndex);
      if (!dayEntry || !Array.isArray(dayEntry.slots) || dayEntry.slots.length === 0) {
        continue;
      }

      const candidateMinutes = dayEntry.slots
        .map((slot) => parseTimeToMinutes(slot.start))
        .filter((value) => value !== null)
        .sort((a, b) => a - b)
        .find((value) => offset > 0 || value > currentMinutes);

      if (candidateMinutes !== undefined) {
        const hour = Math.floor(candidateMinutes / 60);
        const minute = candidateMinutes % 60;
        nextAvailable = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        break;
      }
    }
  }

  return {
    status: availabilityDoc.isAvailable ? 'available' : 'unavailable',
    isAvailable: Boolean(availabilityDoc.isAvailable),
    timezone: availabilityDoc.timezone || 'Africa/Accra',
    schedule,
    daySlots: normalizedDaySlots,
    nextAvailable,
    lastUpdated: availabilityDoc.updatedAt || null,
    message: null,
  };
};

const normalizeCredentialSkills = (workerProfile, userId) =>
  ([
    ...(Array.isArray(workerProfile?.skills) ? workerProfile.skills : []),
    ...(Array.isArray(workerProfile?.skillEntries) ? workerProfile.skillEntries : []),
  ])
    .filter(Boolean)
    .map((skill, index) => {
      if (typeof skill === 'string') {
        return {
          id: `${workerProfile?._id || userId}-skill-${index}`,
          name: skill,
          category: 'general',
          proficiencyLevel: workerProfile?.experienceLevel || 'intermediate',
          yearsOfExperience: workerProfile?.yearsOfExperience || 0,
          isVerified: Boolean(workerProfile?.isVerified),
        };
      }

      if (skill && typeof skill === 'object') {
        return {
          id: skill._id?.toString() || skill.id || `${workerProfile?._id || userId}-skill-${index}`,
          name: skill.name || skill.label || 'Unknown Skill',
          category: skill.category || skill.type || 'general',
          proficiencyLevel: skill.proficiencyLevel || skill.level || workerProfile?.experienceLevel || 'intermediate',
          yearsOfExperience: Number(skill.yearsOfExperience ?? skill.experience ?? workerProfile?.yearsOfExperience ?? 0),
          isVerified: Boolean(skill.isVerified || skill.verified || workerProfile?.isVerified),
        };
      }

      return null;
    })
    .filter(Boolean);

const normalizeCredentialItems = (items = [], workerProfile, userId, kind) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item._id?.toString() || item.id || `${workerProfile?._id || userId}-${kind}-${index}`,
    name: item.name || item.title || (kind === 'license' ? 'License' : 'Certification'),
    issuingOrganization: item.issuer || item.issuingOrganization || item.provider || '',
    issueDate: item.issueDate || item.issuedAt || null,
    expiryDate: item.expiryDate || item.expiresAt || null,
    status: item.status || (item.isVerified ? 'verified' : 'pending'),
    isVerified: Boolean(item.isVerified || item.status === 'verified'),
  }));

const loadCredentialPayload = async ({ workerProfile, userId }) => {
  if (!workerProfile) {
    return {
      skills: [],
      licenses: [],
      certifications: [],
    };
  }

  let certificateDocs = [];

  if (Certificate && typeof Certificate.find === 'function') {
    certificateDocs = await Certificate.find({ workerId: workerProfile.userId }).lean();
  }

  const normalizedSkills = normalizeCredentialSkills(workerProfile, userId);

  const normalizedCertifications = certificateDocs.length > 0
    ? certificateDocs.map((cert) => ({
        id: cert._id?.toString(),
        name: cert.name,
        issuingOrganization: cert.issuer || cert.issuingOrganization || '',
        issueDate: cert.issuedAt || cert.issueDate || null,
        expiryDate: cert.expiresAt || cert.expiryDate || null,
        status: cert.status || cert.verification?.result || (cert.isVerified ? 'verified' : 'pending'),
        isVerified: Boolean(
          cert.status === 'verified' ||
          cert.verification?.result === 'verified' ||
          cert.isVerified,
        ),
      }))
    : normalizeCredentialItems(workerProfile.certifications, workerProfile, userId, 'cert');

  const sourceLicenses = Array.isArray(workerProfile.licenses)
    ? workerProfile.licenses
    : Array.isArray(workerProfile.certifications)
      ? workerProfile.certifications.filter((item) =>
          (item.type && item.type.toLowerCase() === 'license') ||
          (item.category && item.category.toLowerCase() === 'license') ||
          (item.label && item.label.toLowerCase().includes('license')),
        )
      : [];

  return {
    skills: normalizedSkills,
    licenses: normalizeCredentialItems(sourceLicenses, workerProfile, userId, 'license'),
    certifications: normalizedCertifications,
  };
};

const formatPortfolioSignalItem = (doc = {}) => ({
  id: doc._id?.toString() || doc.id || null,
  title: doc.title || 'Untitled project',
  description: doc.description || '',
  projectType: doc.projectType || 'professional',
  skillsUsed: Array.isArray(doc.skillsUsed) ? doc.skillsUsed : [],
  location: doc.location || null,
  clientRating: doc.clientRating ?? null,
  status: doc.status || 'draft',
  isFeatured: Boolean(doc.isFeatured),
  createdAt: doc.createdAt || null,
});

const loadPortfolioSignalPayload = async ({ workerProfileId, limit = 6 }) => {
  if (!workerProfileId || !Portfolio || typeof Portfolio.find !== 'function') {
    return {
      portfolioItems: [],
      stats: { total: 0, published: 0, featured: 0 },
    };
  }

  const query = {
    workerProfileId,
    isActive: true,
  };

  const [total, published, featured, items] = await Promise.all([
    Portfolio.countDocuments(query),
    Portfolio.countDocuments({ ...query, status: 'published' }),
    Portfolio.countDocuments({ ...query, isFeatured: true }),
    Portfolio.find(query)
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean(),
  ]);

  return {
    portfolioItems: items.map((item) => formatPortfolioSignalItem(item)).filter((item) => item.id),
    stats: {
      total,
      published,
      featured,
    },
  };
};

const buildProfileCompletenessPayload = ({ profile, credentials, portfolio, workerProfile }) => {
  const combined = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    profession: profile.profession,
    bio: profile.bio,
    location: profile.location,
    hourlyRate: profile.hourlyRate,
    skills: credentials.skills.length > 0 ? credentials.skills : profile.skills,
    profilePicture: profile.profilePicture,
    phone: profile.phone,
    licenses: credentials.licenses,
    certifications: credentials.certifications,
    portfolio: portfolio.portfolioItems,
    yearsOfExperience: profile.yearsOfExperience,
  };

  const completedRequired = PROFILE_COMPLETENESS_REQUIRED_FIELDS.filter((field) =>
    hasStructuredValue(combined[field]),
  ).length;
  const completedOptional = PROFILE_COMPLETENESS_OPTIONAL_FIELDS.filter((field) =>
    hasStructuredValue(combined[field]),
  ).length;

  const missingRequired = PROFILE_COMPLETENESS_REQUIRED_FIELDS.filter((field) =>
    !hasStructuredValue(combined[field]),
  );
  const missingOptional = PROFILE_COMPLETENESS_OPTIONAL_FIELDS.filter((field) =>
    !hasStructuredValue(combined[field]),
  );

  const requiredCompletion = Math.round((completedRequired / PROFILE_COMPLETENESS_REQUIRED_FIELDS.length) * 100);
  const optionalCompletion = Math.round((completedOptional / PROFILE_COMPLETENESS_OPTIONAL_FIELDS.length) * 100);
  const completionPercentage = Math.round((requiredCompletion * 0.7) + (optionalCompletion * 0.3));

  const recommendations = [];
  if (missingRequired.includes('bio')) {
    recommendations.push('Complete your professional bio');
  }
  if (missingRequired.includes('skills')) {
    recommendations.push('Add your top trade skills so matching stays accurate');
  }
  if (missingOptional.includes('certifications')) {
    recommendations.push('List your certifications to improve trust in job recommendations');
  }
  if (missingOptional.includes('portfolio')) {
    recommendations.push('Add recent portfolio work so hirers can verify your experience');
  }
  if (recommendations.length === 0 && completionPercentage < 100) {
    recommendations.push('Review your profile details to reach 100% completion');
  }

  return {
    completionPercentage,
    requiredCompletion,
    optionalCompletion,
    missingRequired,
    missingOptional,
    recommendations,
    source: {
      user: true,
      workerProfile: Boolean(workerProfile),
      storedProfileCompleteness: Number(workerProfile?.profileCompleteness ?? completionPercentage),
    },
  };
};

const normalizePreferences = (preferences) => {
  if (!preferences || typeof preferences !== 'object') return {};
  return Object.entries(preferences).reduce((acc, [key, value]) => {
    acc[key] = value === undefined ? null : value;
    return acc;
  }, {});
};

const buildProfileStatistics = (workerDoc) => {
  if (!workerDoc) return {};

  const createdAt = workerDoc.createdAt ? new Date(workerDoc.createdAt) : null;
  const yearsActive = createdAt ? new Date().getFullYear() - createdAt.getFullYear() : 0;

  return {
    completedJobs: workerDoc.successStats?.completedJobs ?? 0,
    ratings: workerDoc.successStats?.ratings ?? {},
    responseRate: workerDoc.successStats?.responseRate ?? 0,
    onTimeRate: workerDoc.successStats?.onTimeRate ?? 0,
    yearsActive,
    hourlyRate: workerDoc.hourlyRate ?? null,
  };
};

const ACTIVITY_DEFAULT_PAGE = 1;
const ACTIVITY_DEFAULT_LIMIT = 10;
const ACTIVITY_MAX_LIMIT = 25;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toIsoString = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    const normalized = value instanceof Date ? value : new Date(value);
    return Number.isNaN(normalized.getTime()) ? null : normalized.toISOString();
  } catch (_) {
    return null;
  }
};

const buildActivityItem = ({ id, type, timestamp, summary, details = {} }) => ({
  id: id ? String(id) : `${type}-${timestamp || Date.now()}`,
  type,
  timestamp: toIsoString(timestamp),
  summary,
  details,
});

const dedupeActivityItems = (items = []) => {
  const seen = new Set();

  return items.filter((item) => {
    if (!item?.timestamp || !item?.summary) {
      return false;
    }

    const key = [
      item.type,
      item.timestamp,
      item.details?.jobId || '',
      item.details?.applicationId || '',
      item.summary,
    ].join(':');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const buildActivityPagination = (page, limit, total) => {
  const pages = total > 0 ? Math.ceil(total / limit) : 1;
  return {
    page,
    limit,
    total,
    pages,
    hasNextPage: page < pages,
    hasPrevPage: page > 1,
  };
};

const buildPersistedActivityEvent = ({
  userId,
  actorUserId = userId,
  type,
  sourceCollection,
  sourceId,
  occurredAt,
  summary,
  details = {},
}) => ({
  userId,
  actorUserId,
  type,
  sourceCollection,
  sourceId: String(sourceId),
  occurredAt: new Date(occurredAt),
  summary,
  details,
});

const didTimestampAdvance = (createdAt, updatedAt) => {
  const createdMs = new Date(createdAt || 0).getTime();
  const updatedMs = new Date(updatedAt || 0).getTime();
  return Number.isFinite(updatedMs) && Number.isFinite(createdMs) && updatedMs > createdMs + 1000;
};

const collectAuthoritativeActivityEvents = async ({ userId, userRole, workerDoc, userDoc, queryLimit }) => {
  const events = [];
  const userCreatedAt = userDoc?.createdAt || null;
  const latestProfileUpdate = [userDoc?.updatedAt, workerDoc?.updatedAt]
    .map((value) => (value ? new Date(value) : null))
    .filter((value) => value && !Number.isNaN(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0] || null;

  if (userCreatedAt) {
    events.push(buildPersistedActivityEvent({
      userId,
      type: 'account_created',
      sourceCollection: 'users',
      sourceId: userDoc?._id || userId,
      occurredAt: userCreatedAt,
      summary: 'You joined Kelmah',
      details: { source: 'user-profile' },
    }));
  }

  if (latestProfileUpdate && didTimestampAdvance(userCreatedAt, latestProfileUpdate)) {
    events.push(buildPersistedActivityEvent({
      userId,
      type: 'profile_updated',
      sourceCollection: workerDoc?._id ? 'workerprofiles' : 'users',
      sourceId: workerDoc?._id || userDoc?._id || userId,
      occurredAt: latestProfileUpdate,
      summary: 'You updated your profile',
      details: {
        source: workerDoc?._id ? 'worker-profile' : 'user-profile',
      },
    }));
  }

  const JobModel = db.Job || Job;
  const ApplicationModel = db.Application || Application;

  if (userRole === 'hirer') {
    const hirerJobs = JobModel
      ? await JobModel.find({ hirer: userId })
          .select('title status createdAt updatedAt completedDate')
          .sort({ updatedAt: -1 })
          .limit(queryLimit)
          .lean({ getters: true })
      : [];

    const jobIds = hirerJobs.map((job) => job?._id).filter(Boolean);
    const recentApplications = ApplicationModel && jobIds.length > 0
      ? await ApplicationModel.find({ job: { $in: jobIds } })
          .select('job status createdAt updatedAt')
          .sort({ createdAt: -1 })
          .limit(queryLimit)
          .lean({ getters: true })
      : [];

    const jobTitleMap = new Map(
      hirerJobs.map((job) => [String(job._id), job.title || 'Untitled Job']),
    );

    events.push(
      ...hirerJobs.map((job) => buildPersistedActivityEvent({
        userId,
        type: 'job_posted',
        sourceCollection: 'jobs',
        sourceId: job._id,
        occurredAt: job.createdAt,
        summary: `You posted "${job.title || 'Untitled Job'}"`,
        details: {
          jobId: String(job._id),
          status: job.status || 'open',
        },
      })),
    );

    events.push(
      ...hirerJobs
        .filter((job) => didTimestampAdvance(job.createdAt, job.completedDate || job.updatedAt) && !['open', 'draft'].includes(job.status))
        .map((job) => buildPersistedActivityEvent({
          userId,
          type: job.status === 'completed' ? 'job_completed' : 'job_status_changed',
          sourceCollection: 'jobs',
          sourceId: `${job._id}:${job.status}`,
          occurredAt: job.completedDate || job.updatedAt,
          summary:
            job.status === 'completed'
              ? `Job completed: ${job.title || 'Untitled Job'}`
              : `${job.title || 'Untitled Job'} is now ${job.status}`,
          details: {
            jobId: String(job._id),
            status: job.status || null,
          },
        })),
    );

    events.push(
      ...recentApplications.map((application) => buildPersistedActivityEvent({
        userId,
        type: 'application_received',
        sourceCollection: 'applications',
        sourceId: application._id,
        occurredAt: application.createdAt,
        summary: `New application received for "${jobTitleMap.get(String(application.job)) || 'your job'}"`,
        details: {
          applicationId: String(application._id),
          jobId: String(application.job),
          status: application.status || 'pending',
        },
      })),
    );
  } else {
    const workerApplications = ApplicationModel
      ? await ApplicationModel.find({ worker: userId })
          .select('job status createdAt updatedAt')
          .sort({ updatedAt: -1 })
          .limit(queryLimit)
          .lean({ getters: true })
      : [];

    const referencedJobIds = [
      ...new Set(workerApplications.map((application) => String(application.job)).filter(Boolean)),
    ];

    const referencedJobs = JobModel && referencedJobIds.length > 0
      ? await JobModel.find({ _id: { $in: referencedJobIds } })
          .select('title status completedDate updatedAt createdAt')
          .lean({ getters: true })
      : [];

    const jobMeta = new Map(
      referencedJobs.map((job) => [String(job._id), job]),
    );

    events.push(
      ...workerApplications.map((application) => buildPersistedActivityEvent({
        userId,
        type: 'application_submitted',
        sourceCollection: 'applications',
        sourceId: application._id,
        occurredAt: application.createdAt,
        summary: `You applied to "${jobMeta.get(String(application.job))?.title || 'a job'}"`,
        details: {
          applicationId: String(application._id),
          jobId: String(application.job),
          status: application.status || 'pending',
        },
      })),
    );

    events.push(
      ...workerApplications
        .filter((application) => didTimestampAdvance(application.createdAt, application.updatedAt) && !['pending', 'submitted'].includes(String(application.status || '').toLowerCase()))
        .map((application) => buildPersistedActivityEvent({
          userId,
          type: 'application_status_changed',
          sourceCollection: 'applications',
          sourceId: `${application._id}:${application.status}`,
          occurredAt: application.updatedAt,
          summary: `Your application for "${jobMeta.get(String(application.job))?.title || 'a job'}" is now ${application.status || 'updated'}`,
          details: {
            applicationId: String(application._id),
            jobId: String(application.job),
            status: application.status || null,
          },
        })),
    );

    events.push(
      ...referencedJobs
        .filter((job) => String(job.status || '').toLowerCase() === 'completed')
        .map((job) => buildPersistedActivityEvent({
          userId,
          type: 'job_completed',
          sourceCollection: 'jobs',
          sourceId: `${job._id}:completed`,
          occurredAt: job.completedDate || job.updatedAt || job.createdAt,
          summary: `You completed "${job.title || 'Untitled Job'}"`,
          details: {
            jobId: String(job._id),
            status: job.status || 'completed',
          },
        })),
    );
  }

  return dedupeActivityItems(
    events.map((event) => buildActivityItem({
      id: `${event.sourceCollection}:${event.sourceId}:${event.type}`,
      type: event.type,
      timestamp: event.occurredAt,
      summary: event.summary,
      details: event.details,
    })).map((item, index) => ({ ...item, __persisted: events[index] })),
  ).map((item) => item.__persisted);
};

const syncProfileActivitySource = async ({ userId, userRole, workerDoc, userDoc, page, limit }) => {
  const ActivityEventModel = db.ActivityEvent || ActivityEvent;
  const queryLimit = Math.min(page * limit * 3, 60);
  const events = await collectAuthoritativeActivityEvents({
    userId,
    userRole,
    workerDoc,
    userDoc,
    queryLimit,
  });

  if (!ActivityEventModel) {
    const sorted = [...events].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    const total = sorted.length;
    const startIndex = (page - 1) * limit;
    return {
      items: sorted.slice(startIndex, startIndex + limit).map((event) => buildActivityItem({
        id: `${event.sourceCollection}:${event.sourceId}:${event.type}`,
        type: event.type,
        timestamp: event.occurredAt,
        summary: event.summary,
        details: event.details,
      })),
      pagination: buildActivityPagination(page, limit, total),
      role: userRole,
    };
  }

  if (events.length > 0) {
    await ActivityEventModel.bulkWrite(
      events.map((event) => ({
        updateOne: {
          filter: {
            userId: event.userId,
            type: event.type,
            sourceCollection: event.sourceCollection,
            sourceId: event.sourceId,
            occurredAt: event.occurredAt,
          },
          update: {
            $set: {
              actorUserId: event.actorUserId,
              summary: event.summary,
              details: event.details,
            },
            $setOnInsert: {
              userId: event.userId,
              type: event.type,
              sourceCollection: event.sourceCollection,
              sourceId: event.sourceId,
              occurredAt: event.occurredAt,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  const total = await ActivityEventModel.countDocuments({ userId });
  const persistedEvents = await ActivityEventModel.find({ userId })
    .sort({ occurredAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean({ getters: true });

  return {
    items: persistedEvents.map((event) => buildActivityItem({
      id: event._id,
      type: event.type,
      timestamp: event.occurredAt,
      summary: event.summary,
      details: event.details || {},
    })),
    pagination: buildActivityPagination(page, limit, total),
    role: userRole,
  };
};

const resolveRequesterId = (req) => {
  return req?.user?.id || req?.user?._id || null;
};

const resolveRequestId = (req) => (
  req?.requestId ||
  req?.id ||
  req?.headers?.['x-request-id'] ||
  req?.headers?.['X-Request-ID'] ||
  null
);

const firstHeaderValue = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  if (typeof value === 'string') {
    return value.split(',')[0].trim() || null;
  }

  return null;
};

const resolveGatewayBase = (req) => {
  const explicitGatewayBase = process.env.API_GATEWAY_URL
    ? process.env.API_GATEWAY_URL.replace(/\/$/, '')
    : null;

  if (explicitGatewayBase) {
    return explicitGatewayBase;
  }

  const proxiedGatewayOrigin = firstHeaderValue(req?.headers?.['x-gateway-origin']);
  if (proxiedGatewayOrigin) {
    return proxiedGatewayOrigin.replace(/\/$/, '');
  }

  const forwardedProto = firstHeaderValue(req?.headers?.['x-forwarded-proto']) || null;
  const forwardedHost = firstHeaderValue(req?.headers?.['x-forwarded-host']) || null;

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '');
  }

  return null;
};

const summarizeEndpointForTrace = (endpoint) => {
  if (!endpoint) return null;

  try {
    const parsed = new URL(endpoint);
    return `${parsed.origin}${parsed.pathname}`;
  } catch (_) {
    return endpoint;
  }
};

const logEarningsTrace = (req, details = {}) => {
  logger.info('getEarnings trace', {
    requestId: resolveRequestId(req),
    userId: details.effectiveUserId || details.userId || resolveRequesterId(req),
    ...details,
  });
};

exports.toggleBookmark = async (req, res) => {
  try {
    const userId = resolveRequesterId(req);
    const { id: workerId } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!workerId) return res.status(400).json({ success: false, message: 'workerId required' });

    // Check existing (Mongo)
    const existing = await Bookmark.findOne({ userId, workerId });
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ success: true, data: { workerId, bookmarked: false } });
    }
    await Bookmark.create({ userId, workerId });
    return res.json({ success: true, data: { workerId, bookmarked: true } });
  } catch (e) {
    logger.error('toggleBookmark error:', e);
    return res.status(500).json({ success: false, message: 'Failed to toggle bookmark' });
  }
};

// LOW-11 FIX: Return populated worker details alongside IDs
exports.getBookmarks = async (req, res) => {
  try {
    const userId = resolveRequesterId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const docs = await Bookmark.find({ userId }).select('workerId').lean();
    const workerIds = docs.map(d => String(d.workerId));
    // Try to populate basic worker info; fall back to IDs only on failure
    let workers = [];
    try {
      const { WorkerProfile } = require('../models');
      workers = await WorkerProfile.find({ userId: { $in: workerIds } })
        .select('userId skills hourlyRate isAvailable rating')
        .lean();
    } catch (_) { /* populate optional */ }
    return res.json({ success: true, data: { workerIds, workers } });
  } catch (e) {
    logger.error('getBookmarks error:', e);
    return res.status(500).json({ success: false, message: 'Failed to load bookmarks' });
  }
};

exports.getProfileStatistics = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { workerDoc } = await fetchProfileDocuments({ userId });

    return successResponse(
      res,
      200,
      'Profile statistics retrieved successfully',
      buildProfileStatistics(workerDoc),
    );
  } catch (error) {
    logger.error('getProfileStatistics error:', error);
    return errorResponse(res, 500, 'Failed to fetch profile statistics');
  }
};

exports.getProfileActivity = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, 401, 'Unauthorized');

    const page = parsePositiveInt(req.query?.page, ACTIVITY_DEFAULT_PAGE);
    const limit = Math.min(
      parsePositiveInt(req.query?.limit, ACTIVITY_DEFAULT_LIMIT),
      ACTIVITY_MAX_LIMIT,
    );

    const { workerDoc, userDoc } = await fetchProfileDocuments({ userId });
    const activity = await syncProfileActivitySource({
      userId,
      userRole: userDoc?.role || req.user?.role || 'worker',
      workerDoc,
      userDoc,
      page,
      limit,
    });

    return paginatedResponse(
      res,
      activity.items,
      activity.pagination,
      'Profile activity retrieved successfully',
      { role: activity.role },
    );
  } catch (error) {
    logger.error('getProfileActivity error:', error);
    return errorResponse(res, 500, 'Failed to fetch profile activity');
  }
};

exports.getProfilePreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, 401, 'Unauthorized');

    const { userDoc } = await fetchProfileDocuments({ userId });

    return successResponse(
      res,
      200,
      'Profile preferences retrieved successfully',
      { preferences: normalizePreferences(userDoc?.preferences) },
    );
  } catch (error) {
    logger.error('getProfilePreferences error:', error);
    return errorResponse(res, 500, 'Failed to fetch preferences');
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const requestedId = req.params.workerId;
    const currentUserId = req.user?.id;
    const currentRole = req.user?.role;
    // Only allow users to view their own earnings unless they are admin
    const userId = (currentRole === 'admin' && requestedId) ? requestedId : currentUserId;
    if (!userId) return res.status(400).json({ success: false, message: 'workerId required' });

    logEarningsTrace(req, {
      stage: 'entry',
      requestedId: requestedId || null,
      effectiveUserId: userId,
      requesterUserId: currentUserId || null,
      requesterRole: currentRole || null,
      hasAuthorizationHeader: Boolean(req.headers.authorization),
    });

    const workerModel = getWorkerProfileModel();

    if (!workerModel) {
      logger.warn('getEarnings: WorkerProfile model unavailable, returning defaults');
      const fallbackTotals = buildEarningsFallback(0);
      return res.json({
        success: true,
        data: {
          totals: {
            allTime: fallbackTotals.total,
            last30Days: fallbackTotals.last30Days,
            last7Days: fallbackTotals.last7Days,
            currency: 'GHS',
          },
          breakdown: { byMonth: fallbackTotals.graph },
          source: 'fallback-no-model',
        },
      });
    }

    const resolveWorkerProfile = async () => {
      const workerLookupTimeoutMs = 2500;
      const workerCollectionName = workerModel?.collection?.collectionName
        || workerModel?.collection?.name
        || 'workerprofiles';

      const fetchWorkerProfileNative = async () => {
        const db = getActiveDb();
        if (!db || !Types.ObjectId.isValid(userId)) {
          return null;
        }

        return db.collection(workerCollectionName).findOne({
          userId: new Types.ObjectId(userId),
        });
      };

      try {
        const timedLookupError = new Error(
          `WorkerProfile lookup timed out after ${workerLookupTimeoutMs}ms`,
        );
        timedLookupError.code = 'WORKER_PROFILE_LOOKUP_TIMEOUT';

        const worker = await Promise.race([
          workerModel.findOne({ userId })
            .maxTimeMS(workerLookupTimeoutMs)
            .lean({ getters: true }),
          new Promise((_, reject) => {
            setTimeout(() => reject(timedLookupError), workerLookupTimeoutMs);
          }),
        ]);

        return {
          worker,
          lookupSource: 'mongoose',
        };
      } catch (error) {
        const canFallbackToNative = isBsonVersionMismatch(error)
          || error?.code === 'WORKER_PROFILE_LOOKUP_TIMEOUT'
          || error?.code === 50
          || /timed out|buffering timed out|exceeded time limit/i.test(error?.message || '');

        if (!canFallbackToNative) {
          throw error;
        }

        logger.warn('getEarnings: WorkerProfile lookup degraded, retrying with native driver', {
          message: error?.message,
          code: error?.code,
          timeoutMs: workerLookupTimeoutMs,
        });

        try {
          const worker = await fetchWorkerProfileNative();
          return {
            worker,
            lookupSource: 'native-driver',
            fallbackReason: error?.code || error?.message || 'unknown',
          };
        } catch (nativeError) {
          logger.warn('getEarnings: native WorkerProfile lookup failed, using synthesized totals', {
            message: nativeError?.message,
            code: nativeError?.code,
          });
          return {
            worker: null,
            lookupSource: 'native-driver-failed',
            fallbackReason: error?.code || error?.message || 'unknown',
            nativeErrorCode: nativeError?.code || null,
          };
        }
      }
    };

    const {
      worker,
      lookupSource = 'unknown',
      fallbackReason = null,
      nativeErrorCode = null,
    } = await resolveWorkerProfile();

    logEarningsTrace(req, {
      stage: 'post-worker-lookup',
      effectiveUserId: userId,
      lookupSource,
      workerFound: Boolean(worker),
      workerProfileId: worker?._id?.toString?.() || worker?._id || null,
      fallbackReason,
      nativeErrorCode,
      workerCurrency: worker?.currency || null,
      workerTotalEarnings: Number(worker?.totalEarnings ?? worker?.successStats?.lifetimeEarnings ?? 0),
    });

    if (!worker) {
      logger.warn('getEarnings: worker profile missing, returning synthesized totals');
      const fallbackTotals = buildEarningsFallback(0);
      return res.json({
        success: true,
        data: {
          totals: {
            allTime: fallbackTotals.total,
            last30Days: fallbackTotals.last30Days,
            last7Days: fallbackTotals.last7Days,
            currency: 'GHS',
          },
          breakdown: { byMonth: fallbackTotals.graph },
          source: 'fallback-no-profile',
        },
      });
    }

    const baseTotal = Number(worker.totalEarnings ?? worker.successStats?.lifetimeEarnings ?? 0);
    const fallbackTotals = buildEarningsFallback(baseTotal);
    const paymentServiceBase = process.env.PAYMENT_SERVICE_URL
      ? process.env.PAYMENT_SERVICE_URL.replace(/\/$/, '')
      : null;
    const gatewayBase = resolveGatewayBase(req);

    const candidateEndpoints = [];
    if (gatewayBase) {
      candidateEndpoints.push(`${gatewayBase}/api/payments/transactions/history`);
    }
    if (paymentServiceBase) {
      candidateEndpoints.push(`${paymentServiceBase}/api/payments/transactions/history`);
    }

    const uniqueCandidateEndpoints = [...new Set(candidateEndpoints.filter(Boolean))];

    const respondWith = (totals, source = 'fallback') => res.json({
      success: true,
      data: {
        totals: {
          allTime: totals.total,
          last30Days: totals.last30Days,
          last7Days: totals.last7Days,
          currency: worker.currency || 'GHS',
        },
        breakdown: { byMonth: totals.graph },
        source,
      },
    });

    if (!uniqueCandidateEndpoints.length) {
      logger.warn('getEarnings: payment service host missing, returning fallback totals');
      return respondWith(fallbackTotals, 'fallback-missing-payment-host');
    }

    try {
      const axios = require('axios');
      const headers = {};
      if (req.headers.authorization) headers.Authorization = req.headers.authorization;
      const requestId = resolveRequestId(req);
      if (requestId) headers['X-Request-ID'] = requestId;
      const requestTimeoutMs = 2500;
      const since30Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const since7Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const since30 = since30Date.toISOString();

      const extractTransactions = (payload) => {
        if (Array.isArray(payload?.transactions)) {
          return payload.transactions;
        }
        if (Array.isArray(payload?.data)) {
          return payload.data;
        }
        if (Array.isArray(payload)) {
          return payload;
        }
        return null;
      };

      const fetchTransactions = async (from) => {
        const attempts = [];

        for (const endpoint of uniqueCandidateEndpoints) {
          const controller = typeof AbortController === 'function'
            ? new AbortController()
            : null;
          const hardTimeout = setTimeout(() => {
            if (controller) {
              controller.abort();
            }
          }, requestTimeoutMs);

          try {
            const response = await axios.get(endpoint, {
              params: { recipient: userId, from },
              headers,
              timeout: requestTimeoutMs,
              signal: controller?.signal,
              validateStatus: (status) => status >= 200 && status < 500,
            });

            const transactions = extractTransactions(response?.data);
            if (Array.isArray(transactions)) {
              attempts.push({
                endpoint: summarizeEndpointForTrace(endpoint),
                outcome: 'success',
                status: response?.status || null,
                transactionCount: transactions.length,
              });

              return {
                transactions,
                attempts,
                sourceEndpoint: summarizeEndpointForTrace(endpoint),
                sourceStatus: response?.status || null,
              };
            }

            attempts.push({
              endpoint: summarizeEndpointForTrace(endpoint),
              outcome: 'non-array-response',
              status: response?.status || null,
            });

            logger.warn('Payment history response did not contain a transaction array', {
              endpoint,
              status: response?.status,
            });
          } catch (error) {
            attempts.push({
              endpoint: summarizeEndpointForTrace(endpoint),
              outcome: 'request-failed',
              status: error?.response?.status || null,
              code: error?.code || null,
            });

            logger.warn('Payment history request failed', {
              endpoint,
              message: error?.message,
              code: error?.code,
              status: error?.response?.status,
              timeoutMs: requestTimeoutMs,
            });
          } finally {
            clearTimeout(hardTimeout);
          }
        }

        return {
          transactions: null,
          attempts,
          sourceEndpoint: null,
          sourceStatus: null,
        };
      };

      const paymentFetchResult = await fetchTransactions(since30);
      const tx30 = paymentFetchResult.transactions;

      logEarningsTrace(req, {
        stage: 'post-payment-fetch',
        effectiveUserId: userId,
        gatewayBase,
        paymentServiceBase,
        paymentSourceEndpoint: paymentFetchResult.sourceEndpoint,
        paymentSourceStatus: paymentFetchResult.sourceStatus,
        paymentAttemptCount: paymentFetchResult.attempts.length,
        paymentAttempts: paymentFetchResult.attempts,
        paymentTransactionCount: Array.isArray(tx30) ? tx30.length : 0,
      });

      if (!tx30) {
        logger.warn('getEarnings: payment service unreachable, using fallback values');
        return respondWith(fallbackTotals, 'fallback-payment-timeout');
      }

      const sumTransactions = (transactions = []) =>
        transactions.reduce((sum, tx) => sum + Number(tx?.amount || 0), 0);

      const selectTransactionDate = (tx) => (
        tx?.completedAt ||
        tx?.paidAt ||
        tx?.processedAt ||
        tx?.createdAt ||
        tx?.updatedAt ||
        tx?.date ||
        null
      );

      const tx7 = tx30.filter((tx) => {
        const candidateDate = selectTransactionDate(tx);
        if (!candidateDate) return false;
        const parsedDate = new Date(candidateDate);
        return !Number.isNaN(parsedDate.getTime()) && parsedDate >= since7Date;
      });

      const last30 = tx30 ? Number(sumTransactions(tx30).toFixed(2)) : fallbackTotals.last30Days;
      const last7 = tx7
        ? Number(sumTransactions(tx7).toFixed(2))
        : tx30
          ? Number((last30 / 4).toFixed(2))
          : fallbackTotals.last7Days;

      const derivedTotal = Math.max(
        fallbackTotals.total,
        last30 * 3,
        last7 * 6,
      );

      const responseTotals = {
        total: derivedTotal,
        last30Days: last30,
        last7Days: last7,
        graph: buildGraphFromTotal(derivedTotal),
      };

      return respondWith(responseTotals, 'payment-service-derived');
    } catch (error) {
      logger.warn('getEarnings: unexpected error, using fallback totals', error?.message);
      return respondWith(fallbackTotals, 'fallback-unexpected-error');
    }
  } catch (e) {
    logger.error('getEarnings error:', e);
    return res.status(500).json({ success: false, message: 'Failed to get earnings' });
  }
};

/**
 * Get all users (MongoDB)
 */
/**
 * Get all users (MongoDB)
 * MED-11 FIX: Added pagination with limit/skip and max page size
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const UserModel = requireUserModel();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const role = req.query.role;

    const filter = {};
    if (role && ['worker', 'hirer', 'admin'].includes(role)) filter.role = role;

    const [users, total] = await Promise.all([
      UserModel.find(filter).select('-password -refreshToken').skip(skip).limit(limit).lean(),
      UserModel.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk update users (MongoDB) — admin only
 * Body: { userIds: string[], updateData: object }
 */
exports.bulkUpdateUsers = async (req, res) => {
  try {
    const UserModel = requireUserModel();
    const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
    const { userIds, updateData } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'userIds must be a non-empty array' } });
    }
    // Validate every ID is a valid ObjectId to prevent NoSQL injection
    const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ success: false, error: { message: `Invalid user IDs: ${invalidIds.join(', ')}` } });
    }
    if (!updateData || typeof updateData !== 'object') {
      return res.status(400).json({ success: false, error: { message: 'updateData must be an object' } });
    }

    // Allowlist approach: only permit safe fields to be bulk-updated
    const ALLOWED_FIELDS = ['isActive', 'availabilityStatus', 'profession', 'city', 'state', 'country'];
    const sanitized = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in updateData) sanitized[key] = updateData[key];
    }
    if (Object.keys(sanitized).length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No allowed fields to update. Allowed: ' + ALLOWED_FIELDS.join(', ') } });
    }

    const result = await UserModel.updateMany(
      { _id: { $in: userIds } },
      { $set: sanitized }
    );

    return res.json({
      success: true,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    });
  } catch (err) {
    logger.error('bulkUpdateUsers error:', err);
    return res.status(500).json({ success: false, error: { message: 'Bulk update failed' } });
  }
};

/**
 * Bulk delete users (MongoDB) — admin only
 * Body: { userIds: string[] }
 */
exports.bulkDeleteUsers = async (req, res) => {
  try {
    const UserModel = requireUserModel();
    const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'userIds must be a non-empty array' } });
    }
    // Validate every ID is a valid ObjectId to prevent NoSQL injection
    const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ success: false, error: { message: `Invalid user IDs: ${invalidIds.join(', ')}` } });
    }

    // Soft-delete instead of permanent deletion to preserve data integrity
    const result = await UserModel.updateMany(
      { _id: { $in: userIds } },
      { $set: { isActive: false, deletedAt: new Date() } }
    );

    return res.json({
      success: true,
      data: { deactivated: result.modifiedCount },
    });
  } catch (err) {
    logger.error('bulkDeleteUsers error:', err);
    return res.status(500).json({ success: false, error: { message: 'Bulk delete failed' } });
  }
};

/**
 * Create a new user (MongoDB)
 * HIGH-12 FIX: Whitelist allowed fields — never pass raw req.body to Model.create()
 */
exports.createUser = async (req, res, next) => {
  try {
    const UserModel = requireUserModel();
    // Only allow safe fields — prevents privilege escalation via isAdmin, role, etc.
    const ALLOWED_FIELDS = [
      'firstName', 'lastName', 'email', 'password', 'role',
      'phone', 'location', 'bio', 'profession',
      'skills', 'hourlyRate', 'currency', 'profilePicture'
    ];
    const sanitized = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        sanitized[field] = req.body[field];
      }
    }
    // Enforce role whitelist
    if (sanitized.role && !['worker', 'hirer'].includes(sanitized.role)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid role' } });
    }
    const user = await UserModel.create(sanitized);
    // Remove sensitive data before sending response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    return res.status(201).json(userResponse);
  } catch (err) {
    next(err);
  }
};

/**
 * Get dashboard metrics (MongoDB)
 */
exports.getDashboardMetrics = async (req, res) => {
  const defaultMetrics = {
    totalUsers: 0,
    totalWorkers: 0,
    activeWorkers: 0,
    totalJobs: 0,
    completedJobs: 0,
    revenue: 0,
    growthRate: 0,
    source: 'fallback',
  };

  try {
    await ensureConnection({
      timeoutMs: DASHBOARD_CONNECTION_TIMEOUT_MS,
    });

    if (typeof db.loadModels === 'function') {
      db.loadModels();
    }

    let MongoUser = db.User;
    let MongoWorkerProfile = db.WorkerProfile;

    if (!MongoUser || !MongoWorkerProfile) {
      logger.warn('Dashboard metrics: models not initialized, returning fallback data.');
      return successResponse(
        res,
        200,
        'Dashboard metrics retrieved successfully',
        { ...defaultMetrics, reason: 'models-not-ready' },
      );
    }

    const [totalUsersResult, totalWorkersResult, activeWorkersResult] = await Promise.allSettled([
      safeCountDocuments(MongoUser, { isActive: true }, 'metrics-total-users'),
      safeCountDocuments(MongoWorkerProfile, {}, 'metrics-total-workers'),
      safeCountDocuments(MongoWorkerProfile, { isAvailable: true }, 'metrics-active-workers'),
    ]);

    const totalUsers = totalUsersResult.status === 'fulfilled' ? totalUsersResult.value : 0;
    const totalWorkers = totalWorkersResult.status === 'fulfilled' ? totalWorkersResult.value : 0;
    const activeWorkers = activeWorkersResult.status === 'fulfilled' ? activeWorkersResult.value : 0;

    // MED-13 FIX: Track failed metrics for partial data indication
    const failedMetrics = [];
    if (totalUsersResult.status === 'rejected') {
      failedMetrics.push('totalUsers');
      logger.warn('Dashboard metrics: failed to count users:', totalUsersResult.reason?.message);
    }
    if (totalWorkersResult.status === 'rejected') {
      failedMetrics.push('totalWorkers');
      logger.warn('Dashboard metrics: failed to count worker profiles:', totalWorkersResult.reason?.message);
    }
    if (activeWorkersResult.status === 'rejected') {
      failedMetrics.push('activeWorkers');
      logger.warn('Dashboard metrics: failed to count available workers:', activeWorkersResult.reason?.message);
    }

    let jobMetrics = { totalJobs: 0, completedJobs: 0 };
    let jobMetricsSource = 'fallback';

    try {
      const axios = require('axios');
      const jobServiceUrl = process.env.JOB_SERVICE_URL || process.env.API_GATEWAY_URL || 'http://localhost:5003';
      const response = await runWithTimeout(
        'metrics-job-service',
        () => axios.get(`${jobServiceUrl}/api/jobs/dashboard/metrics`, {
          headers: { Authorization: req.headers.authorization },
          timeout: DASHBOARD_HTTP_TIMEOUT_MS,
        }),
        DASHBOARD_HTTP_TIMEOUT_MS + 250,
      );

      const payload = response?.data?.data || response?.data || {};
      if (payload && typeof payload === 'object') {
        jobMetrics = {
          totalJobs: Number(payload.totalJobs ?? payload.posted ?? payload.jobsPosted) || 0,
          completedJobs: Number(payload.completedJobs ?? payload.completed ?? payload.jobsCompleted) || 0,
        };
        jobMetricsSource = 'job-service';
      }
    } catch (error) {
      logger.warn('Dashboard metrics: could not fetch job metrics:', error.message);
      failedMetrics.push('jobMetrics');
    }

    const metrics = {
      totalUsers,
      totalWorkers,
      activeWorkers,
      totalJobs: jobMetrics.totalJobs,
      completedJobs: jobMetrics.completedJobs,
      revenue: 0,
      growthRate: totalUsers > 0 ? Math.round((activeWorkers / totalUsers) * 100) : 0,
      source: 'database',
      jobMetricsSource,
      // MED-13 FIX: Indicate which metrics failed so frontend can show partial data warnings
      ...(failedMetrics.length > 0 && { partial: true, failedMetrics }),
    };

    return successResponse(
      res,
      200,
      'Dashboard metrics retrieved successfully',
      metrics,
    );
  } catch (err) {
    logger.error('Dashboard metrics error:', err);
    return successResponse(
      res,
      200,
      'Dashboard metrics retrieved successfully',
      { ...defaultMetrics, reason: 'metrics-unavailable' },
    );
  }
};

/**
 * Get dashboard workers
 */
exports.getDashboardWorkers = async (req, res, next) => {
  try {
    // Use the MongoDB WorkerProfile from our models index
    const { WorkerProfile, User } = require('../models');
    const mongoose = require('mongoose');
    const { logger } = require('../utils/logger');

    // Check MongoDB connection status
    if (mongoose.connection.readyState !== 1) {
      logger.error('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return errorResponse(
        res,
        503,
        'Service temporarily unavailable. Please try again in a moment.',
        { reason: 'database-connection-not-ready' },
      );
    }

    // Get workers WITHOUT populate to avoid model registration issues
    const workers = await WorkerProfile.find()
      .select('userId skills hourlyRate isAvailable rating totalJobs completedJobs')
      .sort({ rating: -1, totalJobs: -1 })
      .limit(10)
      .lean()
      .maxTimeMS(5000);

    // Handle empty result set
    if (!workers || workers.length === 0) {
      logger.info('No workers found in database');
      return paginatedResponse(
        res,
        [],
        { page: 1, limit: 10, total: 0, pages: 1 },
        'Dashboard workers retrieved successfully',
        { workers: [] },
      );
    }

    // Manually fetch user data for each worker to avoid populate issues
    const userIds = workers.map(w => w.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select('firstName lastName profilePicture')
      .lean()
      .maxTimeMS(DASHBOARD_DB_TIMEOUT_MS);

    // Create a map of userId to user data
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });

    // Format workers with user data
    const formattedWorkers = workers.map(worker => {
      const user = userMap[worker.userId?.toString()];
      return {
        id: worker._id?.toString() || null,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        skills: worker.skills || [],
        rating: worker.rating || 0,
        totalJobs: worker.totalJobs || 0,
        completedJobs: worker.completedJobs || 0,
        hourlyRate: worker.hourlyRate || 0,
        isAvailable: worker.isAvailable || false,
        profilePicture: user?.profilePicture || null
      };
    });

    return paginatedResponse(
      res,
      formattedWorkers,
      {
        page: 1,
        limit: formattedWorkers.length || 10,
        total: formattedWorkers.length,
        pages: 1,
      },
      'Dashboard workers retrieved successfully',
      { workers: formattedWorkers },
    );
  } catch (err) {
    logger.error('Dashboard workers error:', err);
    logger.error('Error stack:', err.stack);

    return errorResponse(
      res,
      500,
      'Failed to fetch dashboard workers',
      process.env.NODE_ENV === 'development' ? { stack: err.stack } : null,
    );
  }
};

/**
 * Get dashboard analytics (MongoDB)
 */
exports.getDashboardAnalytics = async (req, res) => {
  const now = new Date();
  const defaultAnalytics = {
    userGrowth: buildMonthlyZeroGrowth(now),
    jobStats: { posted: 0, completed: 0, inProgress: 0, cancelled: 0 },
    topCategories: [],
    workerStats: {
      total: 0,
      available: 0,
      utilization: 0,
    },
    source: 'fallback',
  };

  try {
    await ensureConnection({
      timeoutMs: DASHBOARD_CONNECTION_TIMEOUT_MS,
    });

    let MongoUser = getUserModel();
    let MongoWorkerProfile = getWorkerProfileModel();

    if (!MongoUser || !MongoWorkerProfile) {
      if (typeof db.loadModels === 'function') {
        db.loadModels();
      }
      MongoUser = getUserModel();
      MongoWorkerProfile = getWorkerProfileModel();
    }

    if (!MongoUser || !MongoWorkerProfile) {
      return successResponse(
        res,
        200,
        'Dashboard analytics retrieved successfully',
        { ...defaultAnalytics, reason: 'models-not-ready' },
      );
    }

    const startWindow = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    let userGrowth = buildMonthlyZeroGrowth(now);
    const failedSections = [];

    try {
      const growthAggregation = await runWithTimeout(
        'analytics-user-growth',
        () => MongoUser.aggregate([
          { $match: { createdAt: { $gte: startWindow } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              users: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]).option({ maxTimeMS: DASHBOARD_DB_TIMEOUT_MS }),
        DASHBOARD_DB_TIMEOUT_MS + 250,
      );

      const growthMap = new Map();
      growthAggregation.forEach((entry) => {
        const key = `${entry._id.year}-${entry._id.month}`;
        growthMap.set(key, entry.users);
      });

      userGrowth = Array.from({ length: 12 }).map((_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
        const mapKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          users: growthMap.get(mapKey) || 0,
        };
      });
    } catch (aggregationError) {
      failedSections.push('userGrowth');
      logger.warn('User growth aggregation failed, using fallback data:', aggregationError.message);
      userGrowth = buildMonthlyZeroGrowth(now);
    }

    const [totalWorkersResult, availableWorkersResult] = await Promise.allSettled([
      safeCountDocuments(MongoWorkerProfile, {}, 'analytics-total-workers'),
      safeCountDocuments(MongoWorkerProfile, { isAvailable: true }, 'analytics-available-workers'),
    ]);

    if (totalWorkersResult.status === 'rejected') {
      failedSections.push('workerTotals');
      logger.warn('Failed to count total workers:', totalWorkersResult.reason?.message);
    }
    if (availableWorkersResult.status === 'rejected') {
      failedSections.push('workerAvailability');
      logger.warn('Failed to count available workers:', availableWorkersResult.reason?.message);
    }

    const totalWorkers = totalWorkersResult.status === 'fulfilled' ? totalWorkersResult.value : 0;
    const availableWorkers = availableWorkersResult.status === 'fulfilled' ? availableWorkersResult.value : 0;

    let jobStats = { posted: 0, completed: 0, inProgress: 0, cancelled: 0 };
    let jobStatsSource = 'fallback';
    try {
      const axios = require('axios');
      const jobServiceUrl = process.env.JOB_SERVICE_URL || process.env.API_GATEWAY_URL || 'http://localhost:5003';
      const response = await runWithTimeout(
        'analytics-job-summary',
        () => axios.get(`${jobServiceUrl}/api/jobs/analytics/summary`, {
          headers: { Authorization: req.headers.authorization },
          timeout: DASHBOARD_HTTP_TIMEOUT_MS,
        }),
        DASHBOARD_HTTP_TIMEOUT_MS + 250,
      );

      const payload = response?.data?.data || response?.data || {};
      jobStats = {
        posted: Number(payload.posted ?? payload.totalJobs ?? payload.jobsPosted) || 0,
        completed: Number(payload.completed ?? payload.completedJobs ?? payload.jobsCompleted) || 0,
        inProgress: Number(payload.inProgress ?? payload.active ?? payload.open) || 0,
        cancelled: Number(payload.cancelled ?? payload.canceled) || 0,
      };
      jobStatsSource = 'job-service';
    } catch (error) {
      failedSections.push('jobStats');
      logger.warn('Could not fetch job stats:', error.message);
    }

    const topCategories = [];

    const analyticsPayload = {
      userGrowth,
      jobStats,
      jobStatsSource,
      topCategories,
      workerStats: {
        total: totalWorkers,
        available: availableWorkers,
        utilization: totalWorkers > 0 ? Math.round((availableWorkers / totalWorkers) * 100) : 0,
      },
      source: 'database',
      ...(failedSections.length > 0 && { partial: true, failedSections }),
    };

    return successResponse(
      res,
      200,
      'Dashboard analytics retrieved successfully',
      analyticsPayload,
    );
  } catch (err) {
    logger.error('Dashboard analytics error:', err);
    return successResponse(
      res,
      200,
      'Dashboard analytics retrieved successfully',
      {
        ...defaultAnalytics,
        reason: 'analytics-unavailable',
      },
    );
  }
};

/**
 * Get user availability
 */
exports.getUserAvailability = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const availability = await Availability.findOne({ user: userId }).lean();

    if (!availability) {
      return res.json({
        status: 'not_set',
        schedule: [],
        daySlots: [],
        nextAvailable: null,
        message: 'Availability not configured'
      });
    }

    const normalizedDaySlots = Array.isArray(availability.daySlots)
      ? availability.daySlots
      : [];

    const dayNameByIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const parseTimeToMinutes = (value) => {
      if (!value || typeof value !== 'string') return null;
      const [h, m] = value.split(':').map((part) => Number(part));
      if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
      return h * 60 + m;
    };

    const schedule = normalizedDaySlots.map((daySlot) => {
      const slots = Array.isArray(daySlot?.slots) ? daySlot.slots : [];
      const first = slots[0] || {};
      const firstStartMinutes = parseTimeToMinutes(first.start);
      const firstEndMinutes = parseTimeToMinutes(first.end);

      return {
        day: dayNameByIndex[daySlot?.dayOfWeek] || null,
        dayOfWeek: Number.isFinite(daySlot?.dayOfWeek) ? daySlot.dayOfWeek : null,
        available: slots.length > 0,
        slots,
        startHour: firstStartMinutes !== null ? Math.floor(firstStartMinutes / 60) : null,
        startMinute: firstStartMinutes !== null ? firstStartMinutes % 60 : null,
        endHour: firstEndMinutes !== null ? Math.floor(firstEndMinutes / 60) : null,
        endMinute: firstEndMinutes !== null ? firstEndMinutes % 60 : null,
      };
    });

    // Calculate next available time from daySlots
    const now = new Date();
    let nextAvailable = null;

    if (schedule.length > 0) {
      const currentDayIndex = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (let offset = 0; offset < 7; offset += 1) {
        const dayIndex = (currentDayIndex + offset) % 7;
        const dayEntry = schedule.find((item) => item.dayOfWeek === dayIndex);
        if (!dayEntry || !Array.isArray(dayEntry.slots) || dayEntry.slots.length === 0) {
          continue;
        }

        const candidateMinutes = dayEntry.slots
          .map((slot) => parseTimeToMinutes(slot.start))
          .filter((value) => value !== null)
          .sort((a, b) => a - b)
          .find((value) => offset > 0 || value > currentMinutes);

        if (candidateMinutes !== undefined) {
          const hour = Math.floor(candidateMinutes / 60);
          const minute = candidateMinutes % 60;
          nextAvailable = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          break;
        }
      }
    }

    return res.json({
      status: availability.isAvailable ? 'available' : 'unavailable',
      schedule,
      daySlots: normalizedDaySlots,
      nextAvailable,
      lastUpdated: availability.updatedAt
    });
  } catch (err) {
    logger.error('Get availability error:', err);
    next(err);
  }
};

/**
 * Get user credentials
 */
exports.getUserCredentials = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized - missing user context',
          code: 'UNAUTHORIZED',
        },
      });
    }

    await ensureConnection({
      timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
    });

    if (typeof db.loadModels === 'function') {
      db.loadModels();
    }

  const WorkerProfileModel = getWorkerProfileModel();

    if (!WorkerProfileModel) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Worker profile model not initialized',
          code: 'MODEL_NOT_READY',
        },
      });
    }

    const workerProfile = await WorkerProfileModel.findOne({ userId }).lean();

    if (!workerProfile) {
      return res.status(200).json({
        success: true,
        data: {
          skills: [],
          licenses: [],
          certifications: [],
        },
        meta: {
          source: 'user-service',
          hasProfile: false,
        },
      });
    }

    const normalizedSkills = (Array.isArray(workerProfile.skills) ? workerProfile.skills : [])
      .filter(Boolean)
      .map((skill, index) => {
        if (typeof skill === 'string') {
          return {
            id: `${workerProfile._id || userId}-skill-${index}`,
            name: skill,
            category: 'general',
            proficiencyLevel: workerProfile.experienceLevel || 'intermediate',
            yearsOfExperience: workerProfile.yearsOfExperience || 0,
            isVerified: Boolean(workerProfile.isVerified),
          };
        }

        if (skill && typeof skill === 'object') {
          return {
            id: skill._id?.toString() || skill.id || `${workerProfile._id || userId}-skill-${index}`,
            name: skill.name || skill.label || 'Unknown Skill',
            category: skill.category || skill.type || 'general',
            proficiencyLevel: skill.proficiencyLevel || skill.level || workerProfile.experienceLevel || 'intermediate',
            yearsOfExperience: Number(skill.yearsOfExperience ?? skill.experience ?? workerProfile.yearsOfExperience ?? 0),
            isVerified: Boolean(skill.isVerified || skill.verified || workerProfile.isVerified),
          };
        }

        return null;
      })
      .filter(Boolean);

    let certificateDocs = [];

    if (Certificate && typeof Certificate.find === 'function') {
      certificateDocs = await Certificate.find({ workerId: workerProfile.userId }).lean();
    }

    let normalizedCertifications = [];

    if (certificateDocs.length > 0) {
      normalizedCertifications = certificateDocs.map((cert) => ({
        id: cert._id?.toString(),
        name: cert.name,
        issuingOrganization: cert.issuer || cert.issuingOrganization || '',
        issueDate: cert.issuedAt || cert.issueDate || null,
        expiryDate: cert.expiresAt || cert.expiryDate || null,
        status: cert.status || cert.verification?.result || (cert.isVerified ? 'verified' : 'pending'),
        isVerified: Boolean(
          cert.status === 'verified' ||
          cert.verification?.result === 'verified' ||
          cert.isVerified
        ),
      }));
    } else if (Array.isArray(workerProfile.certifications)) {
      normalizedCertifications = workerProfile.certifications.map((cert, index) => ({
        id: cert._id?.toString() || cert.id || `${workerProfile._id || userId}-cert-${index}`,
        name: cert.name,
        issuingOrganization: cert.issuer || cert.issuingOrganization || '',
        issueDate: cert.issueDate || cert.issuedAt || null,
        expiryDate: cert.expiryDate || cert.expiresAt || null,
        status: cert.status || (cert.isVerified ? 'verified' : 'pending'),
        isVerified: Boolean(cert.isVerified || cert.status === 'verified'),
      }));
    }

    const sourceLicenses = Array.isArray(workerProfile.licenses)
      ? workerProfile.licenses
      : Array.isArray(workerProfile.certifications)
        ? workerProfile.certifications.filter((item) =>
            (item.type && item.type.toLowerCase() === 'license') ||
            (item.category && item.category.toLowerCase() === 'license') ||
            (item.label && item.label.toLowerCase().includes('license'))
          )
        : [];

    const normalizedLicenses = sourceLicenses.map((license, index) => ({
      id: license._id?.toString() || license.id || `${workerProfile._id || userId}-license-${index}`,
      name: license.name || license.title || 'License',
      issuingOrganization: license.issuer || license.issuingOrganization || license.provider || '',
      issueDate: license.issueDate || license.issuedAt || null,
      expiryDate: license.expiryDate || license.expiresAt || null,
      isVerified: Boolean(license.isVerified || license.status === 'verified'),
    }));

    return res.status(200).json({
      success: true,
      data: {
        skills: normalizedSkills,
        licenses: normalizedLicenses,
        certifications: normalizedCertifications,
      },
      meta: {
        source: 'user-service',
        hasProfile: true,
        profileId: workerProfile._id?.toString() || null,
      },
    });
  } catch (err) {
    logger.error('Get credentials error:', err);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load user credentials',
        code: 'USER_CREDENTIALS_ERROR',
      },
    });
  }
};

exports.getMyProfileSignals = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, 401, 'Unauthorized - missing user context');
    }

    await ensureConnection({
      timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
    });

    if (typeof db.loadModels === 'function') {
      db.loadModels();
    }

    const UserModel = getUserModel();
    const WorkerProfileModel = getWorkerProfileModel();

    if (!UserModel) {
      return errorResponse(res, 503, 'User model not initialized');
    }

    const { userDoc, workerDoc } = await fetchProfileDocuments({
      UserModel,
      WorkerProfileModel,
      userId,
    });

    if (!userDoc) {
      return errorResponse(res, 404, 'User profile not found');
    }

    const [availabilityDoc, credentials, portfolio] = await Promise.all([
      Availability.findOne({ user: userId }).lean(),
      loadCredentialPayload({ workerProfile: workerDoc, userId }),
      loadPortfolioSignalPayload({ workerProfileId: workerDoc?._id, limit: 6 }),
    ]);

    const { profile, meta } = formatProfilePayload(userDoc, workerDoc);
    const availability = buildAvailabilityPayload(availabilityDoc);
    const completeness = buildProfileCompletenessPayload({
      profile,
      credentials,
      portfolio,
      workerProfile: workerDoc,
    });

    return successResponse(
      res,
      200,
      'Profile recommendation signals retrieved successfully',
      {
        profile,
        credentials,
        availability,
        completeness,
        portfolio,
      },
      {
        ...meta,
        contract: 'mobile-profile-signals-v1',
      },
    );
  } catch (error) {
    logger.error('Get profile signals error:', error);
    return errorResponse(res, 500, 'Failed to load profile recommendation signals');
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized - missing user context',
          code: 'UNAUTHORIZED',
        },
      });
    }

    await ensureConnection({
      timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
    });

    if (typeof db.loadModels === 'function') {
      db.loadModels();
    }

    const UserModel = getUserModel();
    const WorkerProfileModel = getWorkerProfileModel();

    if (!UserModel) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'User model not initialized',
          code: 'MODEL_NOT_READY',
        },
      });
    }

    const { userDoc, workerDoc } = await fetchProfileDocuments({
      UserModel,
      WorkerProfileModel,
      userId,
    });

    if (!userDoc) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User profile not found',
          code: 'PROFILE_NOT_FOUND',
        },
      });
    }

    const { profile, meta } = formatProfilePayload(userDoc, workerDoc);

    return res.status(200).json({
      success: true,
      data: profile,
      meta,
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load account profile',
        code: 'USER_PROFILE_ERROR',
      },
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized - missing user context',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const payload = req.body || {};

    await ensureConnection({
      timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
    });

    if (typeof db.loadModels === 'function') {
      db.loadModels();
    }

    const UserModel = getUserModel();
    const WorkerProfileModel = getWorkerProfileModel();

    if (!UserModel) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'User model not initialized',
          code: 'MODEL_NOT_READY',
        },
      });
    }

    const allowedUserFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'profilePicture',
      'address',
      'city',
      'state',
      'country',
      'countryCode',
    ];

    const workerFields = [
      'bio',
      'location',
      'profession',
      'hourlyRate',
      'currency',
      'experienceLevel',
      'yearsOfExperience',
      'skills',
      'profilePicture',
    ];

    const userUpdates = {};
    allowedUserFields.forEach((field) => {
      if (payload[field] !== undefined) {
        userUpdates[field] = payload[field];
      }
    });

    const workerUpdates = {};
    workerFields.forEach((field) => {
      if (payload[field] !== undefined) {
        workerUpdates[field] = payload[field];
      }
    });

    const hasUserUpdates = Object.keys(userUpdates).length > 0;
    const hasWorkerUpdates = Object.keys(workerUpdates).length > 0;
  const dbConn = getActiveDb();
    const objectId = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : null;

    if (hasUserUpdates) {
      try {
        const result = await UserModel.updateOne(
          { _id: userId },
          { $set: userUpdates },
          { runValidators: true },
        );

        if (result?.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'User profile not found',
              code: 'PROFILE_NOT_FOUND',
            },
          });
        }
      } catch (error) {
        if (!isBsonVersionMismatch(error)) {
          throw error;
        }

        if (!objectId || !dbConn) {
          throw error;
        }

        const result = await dbConn.collection('users').updateOne(
          { _id: objectId },
          { $set: userUpdates, $currentDate: { updatedAt: true } },
          { upsert: false },
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'User profile not found',
              code: 'PROFILE_NOT_FOUND',
            },
          });
        }
      }
    }

    if (hasWorkerUpdates) {
      const canUseMongooseWorker =
        WorkerProfileModel &&
        typeof WorkerProfileModel.findOneAndUpdate === 'function';

      const upsertWorkerNative = async () => {
        if (!objectId || !dbConn) {
          throw new Error('Native MongoDB fallback unavailable for worker profile update');
        }

        const workerCollectionName =
          (WorkerProfileModel && WorkerProfileModel.collection
            ? WorkerProfileModel.collection.collectionName || WorkerProfileModel.collection.name
            : null) || 'workerprofiles';

        const now = new Date();

        await dbConn.collection(workerCollectionName).updateOne(
          { userId: objectId },
          {
            $set: { ...workerUpdates, updatedAt: now },
            $setOnInsert: {
              userId: objectId,
              createdAt: now,
            },
          },
          { upsert: true },
        );
      };

      if (canUseMongooseWorker) {
        try {
          await WorkerProfileModel.findOneAndUpdate(
            { userId },
            { $set: workerUpdates },
            {
              new: true,
              upsert: true,
              setDefaultsOnInsert: true,
              runValidators: true,
            },
          );
        } catch (error) {
          if (!isBsonVersionMismatch(error)) {
            throw error;
          }

          await upsertWorkerNative();
        }
      } else {
        await upsertWorkerNative();
      }
    }

    const { userDoc, workerDoc } = await fetchProfileDocuments({
      UserModel,
      WorkerProfileModel,
      userId,
    });

    if (!userDoc) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User profile not found',
          code: 'PROFILE_NOT_FOUND',
        },
      });
    }

    const { profile, meta } = formatProfilePayload(userDoc, workerDoc);

    return res.status(200).json({
      success: true,
      message: 'Account profile updated successfully',
      data: profile,
      meta,
    });
  } catch (error) {
    logger.error('Update user profile error:', error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Email already in use',
          code: 'EMAIL_CONFLICT',
        },
      });
    }

    if (error?.name === 'ValidationError') {
      return res.status(422).json({
        success: false,
        error: {
          message: 'Invalid profile data',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update account profile',
        code: 'USER_PROFILE_UPDATE_ERROR',
      },
    });
  }
};

/**
 * Database cleanup and optimization endpoint
 */
exports.cleanupDatabase = async (req, res) => {
  try {
    const UserModel = requireUserModel();
    const WorkerProfileModel = requireWorkerProfileModel();

    logger.info('🔧 Starting database cleanup...');

    // Get current counts
    const userCount = await UserModel.countDocuments();
    const workerProfileCount = await WorkerProfileModel.countDocuments();

    logger.info(`📊 Current state: ${userCount} users, ${workerProfileCount} worker profiles`);

    // Find users without matching worker profiles (for workers)
    const workerUsers = await UserModel.find({ role: 'worker' }).select('_id firstName lastName email');
    const existingProfiles = await WorkerProfileModel.find().select('userId');
    const existingUserIds = existingProfiles.map(p => p.userId.toString());

    const usersWithoutProfiles = workerUsers.filter(user =>
      !existingUserIds.includes(user._id.toString())
    );

    logger.info(`👤 Found ${workerUsers.length} worker users, ${usersWithoutProfiles.length} need profiles`);

    // Remove duplicate or orphaned worker profiles
    const duplicateProfiles = await WorkerProfileModel.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 }, profiles: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    let removedDuplicates = 0;
    for (const dup of duplicateProfiles) {
      // Keep the first profile, remove others
      const toRemove = dup.profiles.slice(1);
      await WorkerProfileModel.deleteMany({ _id: { $in: toRemove } });
      removedDuplicates += toRemove.length;
      logger.info(`🗑️  Removed ${toRemove.length} duplicate profiles for user ${dup._id}`);
    }

    // Create missing worker profiles
    if (usersWithoutProfiles.length > 0) {
      const skillCategories = [
        ['plumbing', 'pipe fitting', 'drain cleaning'],
        ['electrical work', 'wiring', 'lighting'],
        ['carpentry', 'furniture making', 'wood work'],
        ['masonry', 'bricklaying', 'concrete work'],
        ['painting', 'interior design', 'decoration'],
        ['cleaning', 'housekeeping', 'maintenance'],
        ['gardening', 'landscaping', 'lawn care'],
        ['delivery', 'logistics', 'transportation']
      ];

      const newProfiles = usersWithoutProfiles.map((user, index) => {
        const skills = skillCategories[index % skillCategories.length];
        const experience = Math.floor(Math.random() * 10) + 1;
        const completedJobs = Math.floor(Math.random() * 50) + 5;

        return {
          userId: user._id,
          bio: `Professional ${skills[0]} specialist. Quality work guaranteed.`,
          hourlyRate: Math.floor(Math.random() * 30) + 20, // 20-50 GHS
          currency: 'GHS',
          location: 'Accra, Ghana',
          skills: skills,
          experienceLevel: experience < 3 ? 'beginner' : experience < 7 ? 'intermediate' : 'advanced',
          yearsOfExperience: experience,
          rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5-5.0
          totalJobs: completedJobs + Math.floor(Math.random() * 10),
          completedJobs: completedJobs,
          totalEarnings: completedJobs * (Math.floor(Math.random() * 150) + 100),
          isAvailable: true,
          isVerified: Math.random() > 0.5,
          profileCompleteness: Math.floor(Math.random() * 30) + 70,
          lastActiveAt: new Date(),
          onlineStatus: 'online'
        };
      });

      await WorkerProfileModel.insertMany(newProfiles);
      logger.info(`✅ Created ${newProfiles.length} new worker profiles`);
    }

    // Final counts
    const finalUserCount = await UserModel.countDocuments();
    const finalWorkerProfileCount = await WorkerProfileModel.countDocuments();
    const activeWorkers = await WorkerProfileModel.countDocuments({ isAvailable: true });

    const result = {
      success: true,
      message: 'Database cleanup completed',
      before: {
        users: userCount,
        workerProfiles: workerProfileCount
      },
      after: {
        users: finalUserCount,
        workerProfiles: finalWorkerProfileCount,
        activeWorkers: activeWorkers
      },
      actions: {
        duplicatesRemoved: removedDuplicates,
        profilesCreated: usersWithoutProfiles.length
      }
    };

    logger.info('🎉 Database cleanup completed:', result);
    return res.json(result);

  } catch (error) {
    logger.error('❌ Database cleanup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database cleanup failed'
    });
  }
};
