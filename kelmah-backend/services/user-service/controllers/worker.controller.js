/**
 * Worker Profile Controller
 * Handles all worker-related operations
 */

const mongoose = require('mongoose');
const modelsModule = require('../models');
// DO NOT destructure models at module load time - use modelsModule.ModelName or local variables
// Models are loaded AFTER database connection, so they're undefined at module load time
const { ensureConnection } = require('../config/db');
const { validateInput, handleServiceError, generatePagination } = require('../utils/helpers');
const auditLogger = require('../../../shared/utils/audit-logger');
const { verifyAccessToken, decodeUserFromClaims } = require('../../../shared/utils/jwt');

const REQUIRED_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'profession',
  'bio',
  'location',
  'hourlyRate',
  'skills',
];

const OPTIONAL_PROFILE_FIELDS = [
  'profilePicture',
  'phone',
  'website',
  'portfolio',
  'certifications',
  'yearsOfExperience',
];

// Normalised mapping between UI trade filters and stored worker values
const TRADE_SYNONYM_MAP = {
  carpentry: ['Carpentry', 'Carpenter', 'Carpentry & Woodwork', 'Woodwork', 'Joinery'],
  masonry: ['Masonry', 'Mason', 'Masonry & Stonework', 'Bricklayer', 'Stonework'],
  plumbing: ['Plumbing', 'Plumber', 'Plumbing Services'],
  'electrical work': ['Electrical Work', 'Electrician', 'Licensed Electrician', 'Electrical Engineer', 'Electrical Services'],
  painting: ['Painting', 'Painter', 'Painting & Decoration', 'Decorating'],
  welding: ['Welding', 'Welder', 'Welding Services', 'Metal Work'],
  roofing: ['Roofing', 'Roofer', 'Roofing Services'],
  flooring: ['Flooring', 'Flooring Specialist', 'Tile & Flooring', 'Tiling', 'Tiler'],
  hvac: ['HVAC', 'HVAC & Climate Control', 'Air Conditioning', 'Air Conditioning Technician'],
  landscaping: ['Landscaping', 'Landscaper', 'Gardener', 'Landscaping Services'],
  'general construction': ['General Construction', 'Construction', 'Construction & Building', 'Builder', 'General Contractor'],
  maintenance: ['Maintenance', 'General Maintenance', 'Handyman'],
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildTradeRegexes = (trade) => {
  if (!trade) {
    return [];
  }

  const normalisedKey = trade.trim().toLowerCase();
  const synonyms = TRADE_SYNONYM_MAP[normalisedKey] || [trade];
  const canonical = Array.from(new Set([trade, ...synonyms]));
  return canonical.map((term) => new RegExp(escapeRegex(term), 'i'));
};

const WORKER_RANK_WEIGHTS = {
  verified: Number(process.env.RANK_WEIGHT_VERIFIED || 0.3),
  rating: Number(process.env.RANK_WEIGHT_RATING || 0.5),
  jobsCompleted: Number(process.env.RANK_WEIGHT_JOBS || 0.2),
};

const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

const scoreWorker = (worker = {}) => {
  const ratingNorm = clamp01(Number(worker.rating || 0) / 5);
  const jobsNorm = clamp01(
    Math.log10(1 + Number(worker.totalJobsCompleted || 0)) / 3,
  );
  const verifiedBonus = worker.isVerified ? 1 : 0;

  return (
    WORKER_RANK_WEIGHTS.rating * ratingNorm +
    WORKER_RANK_WEIGHTS.jobsCompleted * jobsNorm +
    WORKER_RANK_WEIGHTS.verified * verifiedBonus
  );
};

const autopopulateWorkerDefaults = async (worker, usersCollection) => {
  if (!worker) {
    return worker;
  }

  let updateNeeded = false;
  const updates = {};

  if (!worker.profession) {
    updates.profession = 'General Worker';
    updateNeeded = true;
  }

  if (!worker.skills || worker.skills.length === 0) {
    updates.skills = ['General Work'];
    updateNeeded = true;
  }

  if (!worker.hourlyRate) {
    updates.hourlyRate = 25;
    updateNeeded = true;
  }

  if (!worker.currency) {
    updates.currency = 'GHS';
    updateNeeded = true;
  }

  if (worker.rating === undefined) {
    updates.rating = 4.5;
    updateNeeded = true;
  }

  if (!worker.totalReviews) {
    updates.totalReviews = 0;
    updateNeeded = true;
  }

  if (!worker.totalJobsCompleted) {
    updates.totalJobsCompleted = 0;
    updateNeeded = true;
  }

  if (!worker.availabilityStatus) {
    updates.availabilityStatus = 'available';
    updateNeeded = true;
  }

  if (worker.isVerified === undefined) {
    updates.isVerified = false;
    updateNeeded = true;
  }

  if (!worker.bio) {
    updates.bio = `Experienced ${
      worker.profession || 'General Worker'
    } with ${worker.yearsOfExperience || 2} years of experience in ${
      worker.location || 'Accra, Ghana'
    }.`;
    updateNeeded = true;
  }

  if (updateNeeded && usersCollection) {
    try {
      await usersCollection.updateOne(
        { _id: worker._id },
        { $set: updates },
      );
      console.log(
        `✅ Auto-populated worker fields for ${
          worker.firstName || ''
        } ${worker.lastName || ''}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to auto-populate worker fields for ${worker._id}:`,
        error,
      );
    }
  }

  return { ...worker, ...updates };
};

const formatWorkerForResponse = (workerDoc) => {
  if (!workerDoc) {
    return null;
  }

  return {
    id: workerDoc._id.toString(),
    userId: workerDoc._id.toString(),
    name: `${workerDoc.firstName || ''} ${workerDoc.lastName || ''}`.trim(),
    bio:
      workerDoc.bio ||
      `${workerDoc.profession || 'Professional Worker'} with ${
        workerDoc.yearsOfExperience || 0
      } years of experience.`,
    location: workerDoc.location || 'Ghana',
    city: workerDoc.location
      ? workerDoc.location.split(',')[0].trim()
      : 'Accra',
    hourlyRate: workerDoc.hourlyRate || 25,
    currency: workerDoc.currency || 'GHS',
    rating: workerDoc.rating || 4.5,
    totalReviews: workerDoc.totalReviews || 0,
    totalJobsCompleted: workerDoc.totalJobsCompleted || 0,
    availabilityStatus: workerDoc.availabilityStatus || 'available',
    isVerified: workerDoc.isVerified || false,
    profilePicture: workerDoc.profilePicture || null,
    specializations: workerDoc.specializations || ['General Maintenance'],
    profession: workerDoc.profession || 'General Worker',
    workType: workerDoc.workerProfile?.workType || 'Full-time',
    skills:
      workerDoc.skills?.map((skill) => ({
        name:
          typeof skill === 'string'
            ? skill
            : skill.skillName || skill.name || skill,
        level: typeof skill === 'string' ? 'Intermediate' : skill.level || 'Intermediate',
      })) || [],
    rankScore: scoreWorker(workerDoc),
  };
};

const buildProfileFallbackPayload = (reason = 'USER_SERVICE_DB_UNAVAILABLE') => ({
  completionPercentage: 0,
  requiredCompletion: 0,
  optionalCompletion: 0,
  missingRequired: [...REQUIRED_PROFILE_FIELDS],
  missingOptional: [...OPTIONAL_PROFILE_FIELDS],
  recommendations: [
    'Complete your professional bio',
    'Add your profile picture',
    'List your certifications',
    'Update your portfolio',
  ],
  source: {
    user: false,
    workerProfile: false,
  },
  fallback: true,
  fallbackReason: reason,
});

const buildAvailabilityFallbackPayload = (workerId = null, reason = 'USER_SERVICE_DB_UNAVAILABLE') => ({
  status: 'not_set',
  isAvailable: true,
  timezone: 'Africa/Accra',
  daySlots: [],
  schedule: [],
  nextAvailable: null,
  message: 'Availability temporarily unavailable',
  pausedUntil: null,
  lastUpdated: null,
  fallback: true,
  fallbackReason: reason,
  user: workerId,
});

const isNil = (value) => value === null || value === undefined;

const toIsoString = (value) => {
  if (isNil(value)) {
    return null;
  }

  try {
    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
      return null;
    }
    return dateValue.toISOString();
  } catch (err) {
    return null;
  }
};

const toSafeString = (value, fallback = '') => {
  if (isNil(value)) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value.toString === 'function') {
    try {
      const stringified = value.toString();
      return typeof stringified === 'string' ? stringified : fallback;
    } catch (error) {
      return fallback;
    }
  }

  return fallback;
};

const toSafeNumber = (value, fallback = 0) => {
  if (isNil(value)) {
    return fallback;
  }

  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toSafeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalised)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalised)) {
      return false;
    }
    return fallback;
  }

  if (!isNil(value)) {
    return Boolean(value);
  }

  return fallback;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => !isNil(item));
  }
  return [];
};

const uniqBy = (items = [], getKey = (item) => item) => {
  const seen = new Set();
  const result = [];

  items.forEach((item) => {
    if (isNil(item)) {
      return;
    }

    const key = getKey(item);
    if (isNil(key)) {
      return;
    }

    const keyString = String(key).toLowerCase();
    if (seen.has(keyString)) {
      return;
    }

    seen.add(keyString);
    result.push(item);
  });

  return result;
};

const normalizeSkill = (skill, source = 'user') => {
  if (isNil(skill)) {
    return null;
  }

  if (typeof skill === 'string') {
    const trimmed = skill.trim();
    return trimmed
      ? {
          name: trimmed,
          level: 'Intermediate',
          source,
        }
      : null;
  }

  if (typeof skill === 'object') {
    const name = toSafeString(skill.name || skill.skillName || skill.title || skill._id).trim();
    if (!name) {
      return null;
    }

    const level = toSafeString(skill.level || skill.proficiency || skill.skillLevel || 'Intermediate').trim();

    return {
      name,
      level: level || 'Intermediate',
      source,
    };
  }

  const fallbackName = toSafeString(skill).trim();
  return fallbackName
    ? {
        name: fallbackName,
        level: 'Intermediate',
        source,
      }
    : null;
};

const toObjectIdOrNull = (value) => {
  if (!value) {
    return null;
  }

  try {
    if (mongoose.Types.ObjectId.isValid(value)) {
      return new mongoose.Types.ObjectId(value);
    }
  } catch (error) {
    return null;
  }

  return null;
};

const ensureWorkerDocuments = async ({ workerId, lean = true }) => {
  if (!workerId) {
    return { userDoc: null, workerProfile: null };
  }

  await ensureConnection({
    timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
  });

  if (typeof modelsModule.loadModels === 'function') {
    try {
      modelsModule.loadModels();
    } catch (error) {
      console.warn('loadModels failed while fetching worker documents:', error.message);
    }
  }

  const MongoUser = modelsModule.User;
  const WorkerProfileModel = modelsModule.WorkerProfile;

  if (!MongoUser) {
    throw new Error('User model not initialized');
  }

  const objectId = toObjectIdOrNull(workerId);
  const findUser = (query) =>
    lean ? MongoUser.findOne(query).lean({ getters: true }) : MongoUser.findOne(query);
  const findProfile = (query) =>
    WorkerProfileModel
      ? lean
        ? WorkerProfileModel.findOne(query).lean({ getters: true })
        : WorkerProfileModel.findOne(query)
      : null;

  let userDoc = objectId
    ? await findUser({ _id: objectId })
    : await findUser({ _id: workerId });

  let workerProfile = null;

  if (userDoc) {
    workerProfile = WorkerProfileModel
      ? await findProfile({ userId: userDoc._id })
      : null;
  } else if (WorkerProfileModel && objectId) {
    workerProfile = await findProfile({ _id: objectId });
    if (workerProfile) {
      userDoc = await findUser({ _id: workerProfile.userId });
    }
  }

  return { userDoc, workerProfile };
};

const getMutableWorkerProfile = async (userDoc) => {
  const WorkerProfileModel = modelsModule.WorkerProfile;
  if (!WorkerProfileModel) {
    throw new Error('WorkerProfile model not initialized');
  }

  let profile = await WorkerProfileModel.findOne({ userId: userDoc._id });
  if (!profile) {
    profile = new WorkerProfileModel({
      userId: userDoc._id,
      location: userDoc.location,
      bio: userDoc.bio,
      skills: userDoc.skills || [],
      hourlyRate: userDoc.hourlyRate,
      currency: userDoc.currency,
    });
  }
  return profile;
};

const canMutateWorkerResource = (reqUser, targetUserId) => {
  if (!reqUser || !targetUserId) {
    return false;
  }

  if (['admin', 'staff'].includes(reqUser.role)) {
    return true;
  }

  return String(reqUser.id) === String(targetUserId);
};

const normalizeSkillEntries = (skillEntries = [], fallbackSkills = []) => {
  const structuredEntries = (skillEntries || []).map((entry = {}) => ({
    id: entry._id ? entry._id.toString() : undefined,
    name: entry.name || 'Untitled Skill',
    level: entry.level || 'Intermediate',
    category: entry.category || null,
    yearsOfExperience: Number.isFinite(entry.yearsOfExperience)
      ? entry.yearsOfExperience
      : null,
    verified: Boolean(entry.verified),
    description: entry.description || null,
    source: entry.source || 'worker-profile',
    lastUsedAt: entry.lastUsedAt || null,
    evidenceUrl: entry.evidenceUrl || null,
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
  }));

  const legacyEntries = (fallbackSkills || []).map((skill) => {
    if (typeof skill === 'string') {
      return {
        id: `legacy_${skill}`,
        name: skill,
        level: 'Intermediate',
        source: 'legacy-user-skills',
        verified: false,
      };
    }

    if (typeof skill === 'object' && skill !== null) {
      return {
        id: skill._id ? `legacy_${skill._id}` : undefined,
        name: skill.name || skill.skillName || 'Untitled Skill',
        level: skill.level || skill.skillLevel || 'Intermediate',
        source: 'legacy-user-skills',
        verified: Boolean(skill.verified),
      };
    }

    return null;
  }).filter(Boolean);

  return uniqBy([...structuredEntries, ...legacyEntries], (entry) =>
    entry.name ? entry.name.toLowerCase() : entry.id,
  );
};

const normalizeWorkHistoryEntries = (workHistory = []) =>
  (workHistory || []).map((entry = {}) => ({
    id: entry._id ? entry._id.toString() : undefined,
    role: entry.role || 'Professional',
    company: entry.company || null,
    employmentType: entry.employmentType || 'contract',
    location: entry.location || null,
    startDate: entry.startDate || null,
    endDate: entry.endDate || null,
    isCurrent: Boolean(entry.isCurrent),
    description: entry.description || null,
    highlights: Array.isArray(entry.highlights) ? entry.highlights : [],
    clientsServed: Array.isArray(entry.clientsServed) ? entry.clientsServed : [],
    technologies: Array.isArray(entry.technologies) ? entry.technologies : [],
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
  }));

const formatPortfolioDocument = (doc = {}) => ({
  id: doc._id ? doc._id.toString() : undefined,
  workerProfileId: doc.workerProfileId ? doc.workerProfileId.toString() : undefined,
  title: doc.title,
  description: doc.description,
  projectType: doc.projectType || 'professional',
  primarySkillId: doc.primarySkillId ? doc.primarySkillId.toString() : null,
  skillsUsed: doc.skillsUsed || [],
  mainImage: doc.getMainImageUrl ? doc.getMainImageUrl() : doc.mainImage,
  images: doc.getAllImageUrls ? doc.getAllImageUrls() : doc.images || [],
  videos: doc.videos || [],
  documents: doc.documents || [],
  projectValue: doc.projectValue || null,
  currency: doc.currency || 'GHS',
  startDate: doc.startDate || null,
  endDate: doc.endDate || null,
  location: doc.location || null,
  clientRating: doc.clientRating || null,
  status: doc.status || 'draft',
  isFeatured: Boolean(doc.isFeatured),
  viewCount: doc.viewCount || 0,
  likeCount: doc.likeCount || 0,
  sortOrder: doc.sortOrder || null,
  tags: doc.tags || [],
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null,
});

const formatCertificateDocument = (doc = {}) => ({
  id: doc._id ? doc._id.toString() : undefined,
  name: doc.name,
  issuer: doc.issuer,
  credentialId: doc.credentialId || null,
  url: doc.url || null,
  issuedAt: doc.issuedAt || null,
  expiresAt: doc.expiresAt || null,
  status: doc.status || 'draft',
  verification: doc.verification || null,
  metadata: doc.metadata || {},
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null,
});

const mapAvailableHours = (availableHours) => {
  if (!availableHours) {
    return [];
  }

  const entries = availableHours instanceof Map
    ? Array.from(availableHours.entries())
    : typeof availableHours === 'object'
      ? Object.entries(availableHours)
      : [];

  return entries
    .map(([day, value]) => {
      const start = toSafeString(value?.start, null);
      const end = toSafeString(value?.end, null);
      const normalisedDay = toSafeString(day, '').toLowerCase();

      if (!normalisedDay || !start || !end) {
        return null;
      }

      return {
        day: normalisedDay,
        start,
        end,
        available: toSafeBoolean(value?.available, true),
      };
    })
    .filter(Boolean);
};

const mapDaySlots = (daySlots) => {
  if (!Array.isArray(daySlots)) {
    return [];
  }

  return daySlots
    .map((slot) => {
      const dayOfWeek = typeof slot?.dayOfWeek === 'number' ? slot.dayOfWeek : null;

      if (isNil(dayOfWeek)) {
        return null;
      }

      const slots = Array.isArray(slot?.slots)
        ? slot.slots
            .map((timeSlot) => {
              const start = toSafeString(timeSlot?.start, null);
              const end = toSafeString(timeSlot?.end, null);
              if (!start || !end) {
                return null;
              }
              return { start, end };
            })
            .filter(Boolean)
        : [];

      return {
        dayOfWeek,
        slots,
      };
    })
    .filter(Boolean);
};

const mapPortfolioDoc = (item) => {
  if (!item) {
    return null;
  }

  const images = toArray(item.images).map((image) =>
    typeof image === 'object' ? toSafeString(image.url, '') : toSafeString(image, '')
  ).filter(Boolean);

  const skillsUsed = uniqBy(
    toArray(item.skillsUsed).map((skill) => toSafeString(skill, '').trim()).filter(Boolean),
    (skill) => skill
  );

  return {
    id: toSafeString(item._id || item.id, ''),
    title: toSafeString(item.title, ''),
    description: toSafeString(item.description, ''),
    projectType: toSafeString(item.projectType, 'professional'),
    status: toSafeString(item.status, 'draft'),
    isFeatured: toSafeBoolean(item.isFeatured, false),
    isActive: toSafeBoolean(item.isActive, true),
    completedAt: toIsoString(item.endDate || item.completedAt),
    clientName: toSafeString(item.clientName, ''),
    metrics: {
      projectValue: isNil(item.projectValue) ? null : toSafeNumber(item.projectValue, null),
      currency: toSafeString(item.currency, 'GHS'),
      viewCount: toSafeNumber(item.viewCount, 0),
      likeCount: toSafeNumber(item.likeCount, 0),
      shareCount: toSafeNumber(item.shareCount, 0),
    },
    skillsUsed,
    images,
    source: 'portfolioCollection',
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  };
};

const mapEmbeddedPortfolioItem = (item, index = 0) => {
  if (!item) {
    return null;
  }

  const skills = uniqBy(
    toArray(item.skills).map((skill) => toSafeString(skill, '').trim()).filter(Boolean),
    (skill) => skill
  );

  return {
    id: toSafeString(item._id || item.id, '') || `embedded-portfolio-${index}`,
    title: toSafeString(item.title, ''),
    description: toSafeString(item.description, ''),
    projectType: toSafeString(item.projectType, 'professional'),
    status: toSafeString(item.status, 'published'),
    isFeatured: toSafeBoolean(item.isFeatured, false),
    isActive: toSafeBoolean(item.isActive, true),
    completedAt: toIsoString(item.completedAt),
    clientName: toSafeString(item.client, ''),
    metrics: {
      projectValue: isNil(item.projectValue) ? null : toSafeNumber(item.projectValue, null),
      currency: toSafeString(item.currency, 'GHS'),
      viewCount: toSafeNumber(item.viewCount, 0),
      likeCount: toSafeNumber(item.likeCount, 0),
      shareCount: toSafeNumber(item.shareCount, 0),
    },
    skillsUsed: skills,
    images: toArray(item.images).map((image) => toSafeString(image?.url || image, '')).filter(Boolean),
    source: 'profileEmbedded',
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  };
};

const mapCertificateDoc = (doc) => {
  if (!doc) {
    return null;
  }

  return {
    id: toSafeString(doc._id || doc.id, ''),
    name: toSafeString(doc.name, ''),
    issuer: toSafeString(doc.issuer, ''),
    credentialId: toSafeString(doc.credentialId, ''),
    issueDate: toIsoString(doc.issuedAt || doc.issueDate),
    expiryDate: toIsoString(doc.expiresAt || doc.expiryDate),
    status: toSafeString(doc.status, 'pending'),
    verification: {
      result: toSafeString(doc.verification?.result || (doc.status === 'verified' ? 'verified' : 'pending'), 'pending'),
      verifiedAt: toIsoString(doc.verification?.verifiedAt),
      requestedAt: toIsoString(doc.verification?.requestedAt),
      verifier: toSafeString(doc.verification?.verifier, ''),
      notes: toSafeString(doc.verification?.notes, ''),
    },
    links: {
      url: toSafeString(doc.url, ''),
      shareToken: toSafeString(doc.shareToken, ''),
      verificationUrl: toSafeString(doc.verification?.url || doc.metadata?.verificationUrl, ''),
    },
    metadata: doc.metadata || {},
    source: 'certificateCollection',
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
  };
};

const mapEmbeddedCertificate = (item, index = 0) => {
  if (!item) {
    return null;
  }

  return {
    id: toSafeString(item._id || item.id, '') || `embedded-cert-${index}`,
    name: toSafeString(item.name, ''),
    issuer: toSafeString(item.issuer, ''),
    credentialId: toSafeString(item.credentialId, ''),
    issueDate: toIsoString(item.issueDate),
    expiryDate: toIsoString(item.expiryDate),
    status: toSafeString(item.status || item.verificationStatus, 'pending'),
    verification: {
      result: toSafeString(item.verification?.result || item.verificationStatus, 'pending'),
      verificationUrl: toSafeString(item.verificationUrl, ''),
    },
    links: {
      url: toSafeString(item.verificationUrl, ''),
    },
    source: 'profileEmbedded',
  };
};

const buildAvailabilitySection = (availabilityDoc, profile, worker) => {
  const status = toSafeString(profile?.availabilityStatus || worker?.availabilityStatus, 'available');

  const isAvailable = toSafeBoolean(
    !isNil(availabilityDoc?.isAvailable)
      ? availabilityDoc?.isAvailable
      : !isNil(profile?.isAvailable)
        ? profile?.isAvailable
        : status === 'available',
    true,
  );

  const schedule = toArray(availabilityDoc?.schedule).map((entry) => ({
    start: toIsoString(entry?.start),
    end: toIsoString(entry?.end),
    status: toSafeString(entry?.status, ''),
  })).filter((entry) => entry.start || entry.end || entry.status);

  return {
    status,
    isAvailable,
    timezone: toSafeString(availabilityDoc?.timezone || profile?.timezone, 'Africa/Accra'),
    daySlots: mapDaySlots(availabilityDoc?.daySlots),
    availableHours: mapAvailableHours(profile?.availableHours),
    schedule,
    nextAvailable: toIsoString(availabilityDoc?.nextAvailable),
    message: toSafeString(availabilityDoc?.message || profile?.availabilityMessage, ''),
    pausedUntil: toIsoString(availabilityDoc?.pausedUntil || profile?.pausedUntil),
    lastUpdated: toIsoString(availabilityDoc?.updatedAt || profile?.updatedAt || worker?.updatedAt),
    emergencyAvailable: toSafeBoolean(profile?.emergencyAvailable, false),
    notes: toSafeString(availabilityDoc?.notes, ''),
    source: {
      availability: Boolean(availabilityDoc),
      workerProfile: Boolean(profile && (profile.availabilityStatus || profile.availableHours)),
    },
  };
};

const buildStats = (worker = {}, profile = {}) => {
  const rating = !isNil(profile.rating) ? profile.rating : worker.rating;
  const totalReviews = !isNil(profile.totalReviews) ? profile.totalReviews : worker.totalReviews;
  const totalJobsCompleted = !isNil(profile.totalJobsCompleted) ? profile.totalJobsCompleted : worker.totalJobsCompleted;
  const totalJobs = !isNil(profile.totalJobs) ? profile.totalJobs : worker.totalJobsCompleted;

  return {
    rating: toSafeNumber(rating, 0),
    totalReviews: toSafeNumber(totalReviews, 0),
    totalJobsCompleted: toSafeNumber(totalJobsCompleted, 0),
    totalJobs: toSafeNumber(totalJobs, 0),
    completionRate: toSafeNumber(profile.profileCompleteness ?? profile.completionRate, 0),
    responseRate: toSafeNumber(profile.responseRate, 0),
    profileViews: toSafeNumber(profile.profileViews, 0),
    totalEarnings: toSafeNumber(profile.totalEarnings, 0),
    averageResponseTime: toSafeNumber(profile.averageResponseTime, 0),
  };
};

const buildVerificationSnapshot = (worker = {}, profile = {}, certificationSummary = {}) => {
  const isVerified = toSafeBoolean(
    !isNil(profile.isVerified) ? profile.isVerified : worker.isVerified,
    false,
  );

  return {
    isVerified,
    verificationLevel: toSafeString(
      profile.verificationLevel || (isVerified ? 'basic' : 'none'),
      'none',
    ),
    backgroundCheckStatus: toSafeString(profile.backgroundCheckStatus, 'not_required'),
    verifiedCertificates: certificationSummary.verifiedCount || 0,
    totalCertificates: certificationSummary.total || 0,
    lastReviewedAt: toIsoString(profile.updatedAt || worker.updatedAt),
  };
};

const isDbUnavailableError = (error) => {
  if (!error) {
    return false;
  }

  const name = String(error.name || '').toLowerCase();
  const code = String(error.code || '').toLowerCase();
  if (
    name.includes('mongonetworkerror') ||
    name.includes('mongooseerror') ||
    name.includes('mongoerror') ||
    name.includes('mongoosetimeouts') ||
    code === 'etimedout' ||
    code === 'ecancelled'
  ) {
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('timed out waiting for mongodb connection') ||
    message.includes('mongodb connection failed to reach ready state') ||
    message.includes('failed to connect to server') ||
    message.includes('topology was destroyed')
  );
};

class WorkerController {
  /**
   * Get all workers with filtering and pagination - FIXED to use MongoDB
   */
  static async getAllWorkers(req, res) {
    try {
      console.log('🔍 getAllWorkers called - URL:', req.originalUrl, 'Path:', req.path);
      console.log('🔍 Query params:', JSON.stringify(req.query));
      await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });
      const {
        page = 1,
        limit = 20,
        city, // NEW: Use 'city' instead of 'location'
        location, // Keep for backward compatibility
        primaryTrade, // NEW: Map to specializations
        workType, // NEW: Filter by work type
        skills,
        rating,
        availability,
        maxRate,
        verified,
        search,
        keywords // NEW: Text search
      } = req.query;

      const offset = (page - 1) * limit;

      // ✅ FIXED: Use direct MongoDB driver (bypass disconnected Mongoose models)
      const mongoose = require('mongoose');
      const client = mongoose.connection.getClient();
      const db = client.db();
      const usersCollection = db.collection('users');

      // Build MongoDB query
      const mongoQuery = {
        role: 'worker',
        isActive: true
      };

      console.log('🔍 Building query with filters:', { city, location, primaryTrade, workType, keywords, search });

      // FIXED: Location filter - use location field (contains city)
      if (city || location) {
        const locationSearch = city || location;
        mongoQuery.location = { $regex: locationSearch, $options: 'i' };
        console.log('📍 Location filter:', locationSearch);
      }

      // FIXED: Primary Trade filter - handle synonyms across multiple fields
      if (primaryTrade) {
        const tradeRegexes = buildTradeRegexes(primaryTrade);
        const tradeConditions = [];

        if (tradeRegexes.length > 0) {
          tradeConditions.push({ specializations: { $in: tradeRegexes } });
          tradeConditions.push({ profession: { $in: tradeRegexes } });
          tradeConditions.push({ category: { $in: tradeRegexes } });
          tradeConditions.push({ primaryTrade: { $in: tradeRegexes } });
          tradeConditions.push({ 'workerProfile.tradeCategory': { $in: tradeRegexes } });
          tradeConditions.push({ 'workerProfile.primaryTrade': { $in: tradeRegexes } });
        }

        if (tradeConditions.length > 0) {
          mongoQuery.$and = mongoQuery.$and || [];
          mongoQuery.$and.push({ $or: tradeConditions });
        }

        console.log('🔧 Trade filter:', primaryTrade, '→ patterns:', tradeRegexes.map((regex) => regex.source));
      }

      // FIXED: Work Type filter - use workerProfile.workType
      if (workType) {
        mongoQuery['workerProfile.workType'] = workType;
        console.log('💼 Work type filter:', workType);
      }

      // Rating filter
      if (rating) {
        mongoQuery.rating = { $gte: parseFloat(rating) };
      }

      // Availability status
      if (availability) {
        mongoQuery.availabilityStatus = availability;
      }

      // Max hourly rate
      if (maxRate) {
        mongoQuery.hourlyRate = { $lte: parseFloat(maxRate) };
      }

      // Verified workers only
      if (verified === 'true') {
        mongoQuery.isVerified = true;
      }

      // FIXED: Text search - use keywords or search parameter
      const searchTerm = keywords || search;
      if (searchTerm) {
        // Try text search first, fallback to regex
        try {
          mongoQuery.$text = { $search: searchTerm };
          console.log('🔎 Text search:', searchTerm);
        } catch (error) {
          console.log('⚠️ Text search failed, using regex fallback');
          mongoQuery.$or = [
            { firstName: { $regex: searchTerm, $options: 'i' } },
            { lastName: { $regex: searchTerm, $options: 'i' } },
            { profession: { $regex: searchTerm, $options: 'i' } },
            { bio: { $regex: searchTerm, $options: 'i' } },
            { skills: { $regex: searchTerm, $options: 'i' } }
          ];
        }
      }

      // Skills filter (array of skills)
      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
        mongoQuery.skills = { $in: skillsArray };
      }

      console.log('📋 Final MongoDB query:', JSON.stringify(mongoQuery, null, 2));

      // Execute MongoDB query using direct driver
      const [workers, totalCount] = await Promise.all([
        usersCollection
          .find(mongoQuery)
          .sort({ updatedAt: -1 })
          .skip(offset)
          .limit(parseInt(limit))
          .toArray(),
        usersCollection.countDocuments(mongoQuery)
      ]);

      console.log(`✅ Found ${workers.length} workers (total: ${totalCount})`);

      // Ranking weights from env or defaults
      const weights = {
        verified: Number(process.env.RANK_WEIGHT_VERIFIED || 0.3),
        rating: Number(process.env.RANK_WEIGHT_RATING || 0.5),
        jobsCompleted: Number(process.env.RANK_WEIGHT_JOBS || 0.2),
      };
      const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
      const scoreFor = (w) => {
        const ratingNorm = clamp01((Number(w.rating || 0)) / 5);
        const jobsNorm = clamp01(Math.log10(1 + Number(w.totalJobsCompleted || 0)) / 3);
        const verifiedBonus = w.isVerified ? 1 : 0;
        return (
          weights.rating * ratingNorm +
          weights.jobsCompleted * jobsNorm +
          weights.verified * verifiedBonus
        );
      };

      // Auto-populate missing worker fields for existing users
      const workersWithDefaults = await Promise.all(workers.map(async (worker) => {
        let updateNeeded = false;
        const updates = {};

        // Set default values for missing fields
        if (!worker.profession) { updates.profession = 'General Worker'; updateNeeded = true; }
        if (!worker.skills || worker.skills.length === 0) { updates.skills = ['General Work']; updateNeeded = true; }
        if (!worker.hourlyRate) { updates.hourlyRate = 25; updateNeeded = true; }
        if (!worker.currency) { updates.currency = 'GHS'; updateNeeded = true; }
        if (worker.rating === undefined) { updates.rating = 4.5; updateNeeded = true; }
        if (!worker.totalReviews) { updates.totalReviews = 0; updateNeeded = true; }
        if (!worker.totalJobsCompleted) { updates.totalJobsCompleted = 0; updateNeeded = true; }
        if (!worker.availabilityStatus) { updates.availabilityStatus = 'available'; updateNeeded = true; }
        if (worker.isVerified === undefined) { updates.isVerified = false; updateNeeded = true; }
        if (!worker.bio) {
          updates.bio = `Experienced ${worker.profession || 'General Worker'} with ${worker.yearsOfExperience || 2} years of experience in ${worker.location || 'Accra, Ghana'}.`;
          updateNeeded = true;
        }

        // Update MongoDB document if needed (using direct driver)
        if (updateNeeded) {
          try {
            await usersCollection.updateOne(
              { _id: worker._id },
              { $set: updates }
            );
            console.log(`✅ Auto-populated worker fields for ${worker.firstName} ${worker.lastName}`);
          } catch (error) {
            console.error(`❌ Failed to auto-populate worker fields for ${worker._id}:`, error);
          }
        }

        // Return worker with populated defaults
        return { ...worker, ...updates };
      }));

      // Format response data with ranking score
      const formattedWorkers = workersWithDefaults.map(worker => ({
        id: worker._id.toString(),
        userId: worker._id.toString(),
        name: `${worker.firstName} ${worker.lastName}`,
        bio: worker.bio || `${worker.profession || 'Professional Worker'} with ${worker.yearsOfExperience || 0} years of experience.`,
        location: worker.location || 'Ghana',
        city: worker.location ? worker.location.split(',')[0].trim() : 'Accra', // Extract city from location
        hourlyRate: worker.hourlyRate || 25,
        currency: worker.currency || 'GHS',
        rating: worker.rating || 4.5,
        totalReviews: worker.totalReviews || 0,
        totalJobsCompleted: worker.totalJobsCompleted || 0,
        availabilityStatus: worker.availabilityStatus || 'available',
        isVerified: worker.isVerified || false,
        profilePicture: worker.profilePicture || null,
        specializations: worker.specializations || ['General Maintenance'],
        profession: worker.profession || 'General Worker',
        workType: worker.workerProfile?.workType || 'Full-time',
        skills: worker.skills?.map(skill => ({
          name: typeof skill === 'string' ? skill : skill.skillName || skill.name || skill,
          level: typeof skill === 'string' ? 'Intermediate' : skill.level || 'Intermediate'
        })) || [],
        rankScore: 0 // Will be calculated below
      })).map((w) => ({ ...w, rankScore: scoreFor(w) }));

      // Sort by rank score for better relevance
      formattedWorkers.sort((a, b) => b.rankScore - a.rankScore);

      return res.status(200).json({
        success: true,
        workers: formattedWorkers,
        pagination: {
          currentPage: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / limit),
          totalWorkers: totalCount
        }
      });
    } catch (error) {
      console.error('❌ Error in getAllWorkers:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async searchWorkers(req, res) {
    try {
      await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });
      const {
        query = '',
        location,
        skills,
        minRating = 0,
        maxRate,
        availability = 'available',
        radius = 50,
        latitude,
        longitude,
        page = 1,
        limit = 20,
        sortBy = 'relevance'
      } = req.query;

      const offset = (page - 1) * limit;

      // Always get models from modelsModule (they're loaded after DB connection)
      const MongoUser = modelsModule.User;

      // Build MongoDB query
      const mongoQuery = {
        role: 'worker',
        isActive: true
      };

      // Text search
      if (query) {
        mongoQuery.$or = [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { profession: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } }
        ];
      }

      // Location search
      if (location) {
        mongoQuery.$or = mongoQuery.$or || [];
        mongoQuery.$or.push({ location: { $regex: location, $options: 'i' } });
      }

      // Skills search
      if (skills) {
        const skillsArray = skills.split(',');
        mongoQuery.skills = { $in: skillsArray };
      }

      // Rating filter
      if (minRating > 0) {
        mongoQuery.rating = { $gte: parseFloat(minRating) };
      }

      // Rate filter
      if (maxRate) {
        mongoQuery.hourlyRate = { $lte: parseFloat(maxRate) };
      }

      // Geographic search
      if (latitude && longitude && radius) {
        mongoQuery.locationCoordinates = {
          $near: {
            $geometry: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
            $maxDistance: Number(radius) * 1000
          }
        };
      }

      // Sort options
      let sortClause = {};
      switch (sortBy) {
        case 'rating':
          sortClause = { rating: -1, totalReviews: -1 };
          break;
        case 'price_low':
          sortClause = { hourlyRate: 1 };
          break;
        case 'price_high':
          sortClause = { hourlyRate: -1 };
          break;
        case 'experience':
          sortClause = { totalJobsCompleted: -1, yearsOfExperience: -1 };
          break;
        default: // relevance
          sortClause = { isVerified: -1, rating: -1, totalJobsCompleted: -1 };
      }

      // Execute MongoDB query
      const [workers, totalCount] = await Promise.all([
        MongoUser.find(mongoQuery)
          .sort(sortClause)
          .skip(offset)
          .limit(parseInt(limit))
          .lean(),
        MongoUser.countDocuments(mongoQuery)
      ]);

      // Calculate ranking scores
      const weights = {
        verified: Number(process.env.RANK_WEIGHT_VERIFIED || 0.3),
        rating: Number(process.env.RANK_WEIGHT_RATING || 0.5),
        jobsCompleted: Number(process.env.RANK_WEIGHT_JOBS || 0.2),
      };
      const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
      const scoreFor = (w) => {
        const ratingNorm = clamp01((Number(w.rating || 0)) / 5);
        const jobsNorm = clamp01(Math.log10(1 + Number(w.totalJobsCompleted || 0)) / 3);
        const verifiedBonus = w.isVerified ? 1 : 0;
        return (
          weights.rating * ratingNorm +
          weights.jobsCompleted * jobsNorm +
          weights.verified * verifiedBonus
        );
      };

      // Auto-populate missing worker fields for search results
      const workersWithDefaults = await Promise.all(workers.map(async (worker) => {
        let updateNeeded = false;
        const updates = {};

        // Add missing worker fields with defaults
        if (!worker.profession) {
          updates.profession = 'General Worker';
          updateNeeded = true;
        }
        if (!worker.skills || worker.skills.length === 0) {
          updates.skills = ['General Work', 'Manual Labor'];
          updateNeeded = true;
        }
        if (!worker.hourlyRate) {
          updates.hourlyRate = 25;
          updateNeeded = true;
        }
        if (!worker.currency) {
          updates.currency = 'GHS';
          updateNeeded = true;
        }
        if (!worker.rating) {
          updates.rating = 4.5;
          updateNeeded = true;
        }
        if (!worker.totalReviews) {
          updates.totalReviews = 0;
          updateNeeded = true;
        }
        if (!worker.totalJobsCompleted) {
          updates.totalJobsCompleted = 0;
          updateNeeded = true;
        }
        if (!worker.availabilityStatus) {
          updates.availabilityStatus = 'available';
          updateNeeded = true;
        }
        if (worker.isVerified === undefined) {
          updates.isVerified = false;
          updateNeeded = true;
        }
        if (!worker.bio) {
          updates.bio = `Experienced ${worker.profession || 'General Worker'} with ${worker.yearsOfExperience || 2} years of experience in ${worker.location || 'Accra, Ghana'}.`;
          updateNeeded = true;
        }

        // Update MongoDB document if needed
        if (updateNeeded) {
          try {
            await MongoUser.updateOne({ _id: worker._id }, { $set: updates });
            console.log(`✅ Auto-populated worker fields for ${worker.firstName} ${worker.lastName}`);
          } catch (error) {
            console.error(`❌ Failed to auto-populate worker fields for ${worker._id}:`, error);
          }
        }

        // Return worker with populated defaults
        return { ...worker, ...updates };
      }));

      // Format search results
      const searchResults = workersWithDefaults.map(worker => ({
        id: worker._id.toString(),
        userId: worker._id.toString(),
        name: `${worker.firstName} ${worker.lastName}`,
        bio: worker.bio,
        location: worker.location,
        hourlyRate: worker.hourlyRate,
        currency: worker.currency,
        rating: worker.rating,
        totalReviews: worker.totalReviews,
        totalJobsCompleted: worker.totalJobsCompleted,
        isVerified: worker.isVerified,
        profilePicture: worker.profilePicture,
        skills: worker.skills?.slice(0, 5).map(skill => skill.skillName) || [],
        distance: latitude && longitude && worker.latitude && worker.longitude ?
          calculateDistance(latitude, longitude, worker.latitude, worker.longitude) : null
      })).map((w) => ({ ...w, rankScore: scoreFor(w) }));

      // Sort by relevance if requested
      if (sortBy === 'relevance') {
        searchResults.sort((a, b) => b.rankScore - a.rankScore);
      }

      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: {
          workers: searchResults,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          },
          searchParams: {
            query,
            location,
            skills,
            minRating,
            maxRate,
            radius
          }
        }
      });

    } catch (error) {
      console.error('Search workers error:', error);
      if (error?.message?.toLowerCase().includes('timed out waiting for mongodb connection')) {
        return res.status(503).json({
          success: false,
          message: 'User Service database is reconnecting. Please try again shortly.',
          code: 'USER_DB_NOT_READY'
        });
      }
      return handleServiceError(res, error, 'Search failed');
    }
  }

  static async getWorkerById(req, res) {
    const workerId = req.params.id;
    
    try {
      if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid worker ID required',
          code: 'INVALID_WORKER_ID',
        });
      }

      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ MongoDB not ready for getWorkerById request');
        return res.status(503).json({
          success: false,
          message: 'User Service database is reconnecting. Please try again shortly.',
          code: 'USER_SERVICE_DB_NOT_READY',
        });
      }

      await ensureConnection({
        timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
      });

      const MongoUser = modelsModule.User;
      const MongoWorkerProfile = modelsModule.WorkerProfile;

      if (!MongoUser) {
        console.error('❌ User model not available');
        return res.status(503).json({
          success: false,
          message: 'User model not initialized',
          code: 'USER_MODEL_UNAVAILABLE',
        });
      }

      const [workerDoc, workerProfileDoc] = await Promise.all([
        MongoUser.findById(workerId)
          .lean()
          .catch((err) => {
            console.error('❌ Error querying User:', err);
            return null;
          }),
        MongoWorkerProfile
          ? MongoWorkerProfile.findOne({ userId: workerId })
              .lean()
              .catch((err) => {
                console.error('⚠️ Error querying WorkerProfile:', err);
                return null;
              })
          : null,
      ]);

      if (!workerDoc && !workerProfileDoc) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found',
          code: 'WORKER_NOT_FOUND',
        });
      }

      if (workerDoc && (workerDoc.role !== 'worker' || workerDoc.isActive === false || workerDoc.deletedAt)) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found',
          code: 'NOT_AN_ACTIVE_WORKER',
        });
      }

      const workerProfileId = workerProfileDoc?._id;

      const [availabilityDoc, certificateDocs, portfolioDocs] = await Promise.all([
        modelsModule.Availability
          ? modelsModule.Availability.findOne({ user: workerId })
              .lean()
              .catch((err) => {
                console.error('⚠️ Error querying Availability:', err);
                return null;
              })
          : null,
        modelsModule.Certificate
          ? modelsModule.Certificate.find({ workerId, status: { $ne: 'archived' } })
              .sort({ status: -1, createdAt: -1 })
              .limit(25)
              .lean()
              .catch((err) => {
                console.error('⚠️ Error querying Certificates:', err);
                return [];
              })
          : [],
        workerProfileId && modelsModule.Portfolio
          ? modelsModule.Portfolio.find({
              workerProfileId,
              isActive: true,
              status: { $ne: 'archived' },
            })
              .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
              .limit(20)
              .lean()
              .catch((err) => {
                console.error('⚠️ Error querying Portfolio:', err);
                return [];
              })
          : [],
      ]);

      const worker = workerDoc || {};
      const profile = workerProfileDoc || {};

      const skills = uniqBy(
        [
          ...toArray(worker.skills).map((skill) => normalizeSkill(skill, 'user')), 
          ...toArray(profile.skills).map((skill) => normalizeSkill(skill, 'profile')),
        ].filter(Boolean),
        (skill) => skill.name.toLowerCase(),
      );

      const specializations = uniqBy(
        [
          ...toArray(worker.specializations).map((item) => toSafeString(item, '').trim()).filter(Boolean),
          ...toArray(profile.specializations).map((item) => toSafeString(item, '').trim()).filter(Boolean),
        ],
        (item) => item.toLowerCase(),
      );

      const languages = uniqBy(
        toArray(profile.languages).map((item) => toSafeString(item, '').trim()).filter(Boolean),
        (lang) => lang.toLowerCase(),
      );

      const embeddedPortfolio = toArray(profile.portfolioItems)
        .map((item, index) => mapEmbeddedPortfolioItem(item, index))
        .filter(Boolean);

      const collectedPortfolio = toArray(portfolioDocs)
        .map((item) => mapPortfolioDoc(item))
        .filter(Boolean);

      const combinedPortfolio = uniqBy(
        [...embeddedPortfolio, ...collectedPortfolio],
        (item) => item.id || `${item.title}-${item.completedAt || item.createdAt || ''}`,
      );

      const embeddedCertificates = toArray(profile.certifications)
        .map((item, index) => mapEmbeddedCertificate(item, index))
        .filter(Boolean);

      const collectedCertificates = toArray(certificateDocs)
        .map((item) => mapCertificateDoc(item))
        .filter(Boolean);

      const combinedCertificates = uniqBy(
        [...collectedCertificates, ...embeddedCertificates],
        (item) => item.id || `${item.name}-${item.issueDate || ''}`,
      );

      const certificationSummary = {
        items: combinedCertificates.slice(0, 20),
        total: combinedCertificates.length,
        verifiedCount: combinedCertificates.filter((cert) => {
          const status = toSafeString(cert.status, '').toLowerCase();
          const result = toSafeString(cert.verification?.result, '').toLowerCase();
          return status === 'verified' || result === 'verified';
        }).length,
      };

      const portfolioSummary = {
        items: combinedPortfolio.slice(0, 20),
        total: combinedPortfolio.length,
        featured: combinedPortfolio.filter((item) => item.isFeatured).slice(0, 5),
      };

      const stats = buildStats(worker, profile);

      const rate = {
        amount: !isNil(profile.hourlyRate) ? toSafeNumber(profile.hourlyRate, null) : toSafeNumber(worker.hourlyRate, null),
        min: toSafeNumber(profile.hourlyRateMin, null),
        max: toSafeNumber(profile.hourlyRateMax, null),
        currency: toSafeString(profile.currency || worker.currency, 'GHS'),
      };

      const hourlyRateValue = !isNil(rate.amount) && Number.isFinite(rate.amount)
        ? rate.amount
        : !isNil(rate.min) && Number.isFinite(rate.min)
          ? rate.min
          : !isNil(rate.max) && Number.isFinite(rate.max)
            ? rate.max
            : 0;

      const availability = buildAvailabilitySection(availabilityDoc, profile, worker);

      const verification = buildVerificationSnapshot(worker, profile, certificationSummary);

      const workerPayload = {
        id: worker._id ? toSafeString(worker._id) : toSafeString(profile.userId, ''),
        userId: worker._id ? toSafeString(worker._id) : toSafeString(profile.userId, ''),
        name: `${toSafeString(worker.firstName)} ${toSafeString(worker.lastName)}`.trim() || 'Worker',
        firstName: toSafeString(worker.firstName, ''),
        lastName: toSafeString(worker.lastName, ''),
        bio: toSafeString(profile.bio || worker.bio, `Professional worker in ${worker.location || 'Ghana'}.`),
        tagline: toSafeString(profile.tagline || profile.headline, ''),
        location: toSafeString(profile.location || worker.location, 'Ghana'),
        city: toSafeString(profile.location || worker.location, 'Accra').split(',')[0].trim(),
        country: toSafeString(profile.country || worker.country || 'Ghana', 'Ghana'),
        hourlyRate: hourlyRateValue,
        rate,
        currency: rate.currency,
        rating: stats.rating,
        totalReviews: stats.totalReviews,
        totalJobsCompleted: stats.totalJobsCompleted,
        availabilityStatus: toSafeString(profile.availabilityStatus || worker.availabilityStatus, 'available'),
        isVerified: verification.isVerified,
        profilePicture: worker.profilePicture || profile.profilePicture || null,
        bannerImage: profile.bannerImage || null,
        specializations,
        profession: toSafeString(worker.profession || profile.profession, 'General Worker'),
        workType: toSafeString(profile.workType || 'Full-time'),
        skills,
        languages,
        stats,
        verification,
        availability,
        experience: {
          level: toSafeString(profile.experienceLevel, ''),
          years: toSafeNumber(!isNil(profile.yearsOfExperience) ? profile.yearsOfExperience : worker.yearsOfExperience, 0),
          preferredJobTypes: toArray(profile.preferredJobTypes).map((item) => toSafeString(item, '')).filter(Boolean),
          workingHoursPreference: toSafeString(profile.workingHoursPreference, ''),
          travelWillingness: toSafeString(profile.travelWillingness, ''),
          emergencyAvailable: toSafeBoolean(profile.emergencyAvailable, false),
        },
        portfolio: portfolioSummary,
        certifications: certificationSummary,
        contact: {
          email: toSafeString(worker.email, ''),
          phone: toSafeString(worker.phone, ''),
          website: toSafeString(profile.website || worker.website, ''),
          social: {
            linkedin: toSafeString(profile.linkedinUrl || profile.socialLinks?.linkedin, ''),
            instagram: toSafeString(profile.socialLinks?.instagram, ''),
            facebook: toSafeString(profile.socialLinks?.facebook, ''),
          },
        },
        business: profile.businessInfo
          ? {
              name: toSafeString(profile.businessInfo.businessName, ''),
              type: toSafeString(profile.businessInfo.businessType, ''),
              registrationNumber: toSafeString(profile.businessInfo.registrationNumber, ''),
              taxId: toSafeString(profile.businessInfo.taxId, ''),
            }
          : null,
        insurance: profile.insuranceInfo
          ? {
              hasInsurance: toSafeBoolean(profile.insuranceInfo.hasInsurance, false),
              provider: toSafeString(profile.insuranceInfo.provider, ''),
              expiryDate: toIsoString(profile.insuranceInfo.expiryDate),
              coverage: toSafeNumber(profile.insuranceInfo.coverage, null),
            }
          : null,
        user: {
          id: worker._id ? toSafeString(worker._id) : toSafeString(profile.userId, ''),
          email: toSafeString(worker.email, ''),
          phone: toSafeString(worker.phone, ''),
          role: toSafeString(worker.role, 'worker'),
          isActive: toSafeBoolean(worker.isActive, true),
          isEmailVerified: toSafeBoolean(worker.isEmailVerified, false),
          createdAt: toIsoString(worker.createdAt),
          updatedAt: toIsoString(worker.updatedAt),
          lastLogin: toIsoString(worker.lastLogin),
        },
        lastActiveAt: toIsoString(profile.lastActiveAt || worker.lastLogin),
        metadata: {
          retrievedAt: new Date().toISOString(),
          source: {
            user: Boolean(workerDoc),
            workerProfile: Boolean(workerProfileDoc),
            availability: Boolean(availabilityDoc),
            portfolio: combinedPortfolio.length > 0,
            certifications: combinedCertificates.length > 0,
          },
        },
      };

      workerPayload.rankScore = scoreWorker({
        rating: stats.rating,
        totalJobsCompleted: stats.totalJobsCompleted,
        isVerified: verification.isVerified,
      });

      return res.status(200).json({
        success: true,
        data: {
          worker: workerPayload,
        },
      });

    } catch (error) {
      console.error('❌ getWorkerById FATAL ERROR:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
        workerId,
      });
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching worker profile',
        code: 'INTERNAL_SERVER_ERROR',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get profile completion percentage for a worker
   */
  static async getProfileCompletion(req, res) {
    const workerId = req.params.id;
    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid worker ID required',
      });
    }

    const sendFallback = (reason) =>
      res.status(200).json({
        success: true,
        data: buildProfileFallbackPayload(reason),
      });

    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not ready for profile completeness request, returning fallback', {
        readyState: mongoose.connection.readyState,
      });
      return sendFallback('USER_SERVICE_DB_NOT_READY');
    }

    try {
      await ensureConnection({
        timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
      });

      // Always get models from modelsModule (they're loaded after DB connection)
      const MongoUser = modelsModule.User;
      const MongoWorkerProfile = modelsModule.WorkerProfile;

      if (!MongoUser) {
        return res.status(503).json({
          success: false,
          message: 'User model not initialized',
        });
      }

      const [worker, workerProfile] = await Promise.all([
        MongoUser.findById(workerId).lean(),
        MongoWorkerProfile ? MongoWorkerProfile.findOne({ userId: workerId }).lean() : null,
      ]);

      if (!worker && !workerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found'
        });
      }

      const normalizeArray = (value) => {
        if (Array.isArray(value)) {
          return value.filter((item) => item !== null && item !== undefined);
        }
        return [];
      };

      const combined = {
        ...(worker || {}),
        ...(workerProfile || {}),
        // Explicit precedence rules for overlapping fields
        bio: worker?.bio ?? workerProfile?.bio ?? '',
        location: worker?.location ?? workerProfile?.location ?? '',
        hourlyRate:
          worker?.hourlyRate ??
          workerProfile?.hourlyRate ??
          workerProfile?.hourlyRateMin ??
          workerProfile?.hourlyRateMax ?? null,
        skills: normalizeArray(
          (Array.isArray(worker?.skills) && worker?.skills.length > 0
            ? worker.skills
            : workerProfile?.skills) || [],
        ),
        profilePicture: worker?.profilePicture ?? workerProfile?.profilePicture ?? null,
        certifications: normalizeArray(
          (workerProfile?.certifications && workerProfile.certifications.length
            ? workerProfile.certifications
            : worker?.certifications) || [],
        ),
        portfolio: normalizeArray(
          (workerProfile?.portfolioItems && workerProfile.portfolioItems.length
            ? workerProfile.portfolioItems
            : worker?.portfolio) || [],
        ),
        yearsOfExperience: worker?.yearsOfExperience ?? workerProfile?.yearsOfExperience ?? null,
        profession: worker?.profession ?? workerProfile?.profession ?? '',
        phone: worker?.phone ?? workerProfile?.phone ?? '',
        website: worker?.website ?? workerProfile?.website ?? '',
      };

      const getFieldValue = (field) => {
        switch (field) {
          case 'portfolio':
            return combined.portfolio;
          case 'certifications':
            return combined.certifications;
          case 'skills':
            return combined.skills;
          default:
            return combined[field];
        }
      };

      const hasValue = (value) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (value && typeof value === 'object') {
          return Object.keys(value).length > 0;
        }
        return value !== undefined && value !== null && value !== '';
      };

      // Calculate completion percentage based on profile fields
      let completedRequired = 0;
      let completedOptional = 0;

      // Check required fields
      REQUIRED_PROFILE_FIELDS.forEach(field => {
        const value = getFieldValue(field);
        if (hasValue(value)) {
          completedRequired++;
        }
      });

      // Check optional fields
      OPTIONAL_PROFILE_FIELDS.forEach(field => {
        const value = getFieldValue(field);
        if (hasValue(value)) {
          completedOptional++;
        }
      });

      const requiredPercentage = (completedRequired / REQUIRED_PROFILE_FIELDS.length) * 70; // 70% weight
      const optionalPercentage = (completedOptional / OPTIONAL_PROFILE_FIELDS.length) * 30; // 30% weight
      const totalPercentage = Math.round(requiredPercentage + optionalPercentage);

      // Determine missing fields
      const missingRequired = REQUIRED_PROFILE_FIELDS.filter((field) => !hasValue(getFieldValue(field)));

      const missingOptional = OPTIONAL_PROFILE_FIELDS.filter((field) => !hasValue(getFieldValue(field)));

      const recommendations = [];
      if (missingRequired.includes('bio')) {
        recommendations.push('Complete your professional bio');
      }
      if (missingRequired.includes('profilePicture')) {
        recommendations.push('Add your profile picture');
      }
      if (missingOptional.includes('certifications')) {
        recommendations.push('List your certifications');
      }
      if (missingOptional.includes('portfolio')) {
        recommendations.push('Update your portfolio');
      }
      if (recommendations.length === 0 && totalPercentage < 100) {
        recommendations.push('Review your profile details to reach 100% completion');
      }

      res.json({
        success: true,
        data: {
          completionPercentage: totalPercentage,
          requiredCompletion: Math.round((completedRequired / REQUIRED_PROFILE_FIELDS.length) * 100),
          optionalCompletion: Math.round((completedOptional / OPTIONAL_PROFILE_FIELDS.length) * 100),
          missingRequired,
          missingOptional,
          recommendations,
          source: {
            user: !!worker,
            workerProfile: !!workerProfile,
          },
        }
      });

    } catch (error) {
      console.error('❌ ERROR in getProfileCompletion - Full details:', {
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        workerId,
        modelsModuleLoaded: !!modelsModule,
        UserModelExists: !!User,
        WorkerProfileModelExists: !!WorkerProfile,
        connectionState: mongoose.connection.readyState
      });
      if (isDbUnavailableError(error)) {
        return sendFallback('USER_SERVICE_DB_UNAVAILABLE');
      }
      return handleServiceError(res, error, 'Failed to get profile completion');
    }
  }

  /**
   * Get recent jobs for workers
   */
  static async getRecentJobs(req, res) {
    try {
      const { limit = 10 } = req.query;
      const parseGatewayUser = () => {
        if (req.user?.id) {
          return req.user;
        }

        const gatewayHeader = req.headers['x-authenticated-user'];
        if (gatewayHeader) {
          try {
            const parsed = JSON.parse(gatewayHeader);
            if (parsed && parsed.id) {
              return parsed;
            }
          } catch (error) {
            console.warn('Failed to parse x-authenticated-user header:', error.message);
          }
        }

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7);
          try {
            const decoded = verifyAccessToken(token);
            const claims = decodeUserFromClaims(decoded);
            if (claims?.id) {
              return claims;
            }
          } catch (error) {
            console.warn('Unable to decode authorization token for recent jobs:', error.message);
          }
        }

        return null;
      };

      const buildRecentJobsFallback = (reason = 'RECENT_JOBS_FALLBACK') => {
        const mockJobs = [
          {
            id: 'job_123',
            title: 'Kitchen Cabinet Installation',
            client: 'Sarah Johnson',
            clientId: 'user_456',
            status: 'completed',
            budget: 2500,
            currency: 'GHS',
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            rating: 5,
            location: 'East Legon, Accra'
          },
          {
            id: 'job_124',
            title: 'Plumbing Repair',
            client: 'Michael Brown',
            clientId: 'user_789',
            status: 'in-progress',
            budget: 800,
            currency: 'GHS',
            startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            location: 'Tema, Accra'
          },
          {
            id: 'job_125',
            title: 'Electrical Wiring',
            client: 'Jennifer Wilson',
            clientId: 'user_321',
            status: 'pending',
            budget: 1500,
            currency: 'GHS',
            appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            location: 'Airport Residential, Accra'
          }
        ];

        return {
          success: true,
          data: {
            jobs: mockJobs.slice(0, parseInt(limit)),
            total: mockJobs.length,
            fallback: true,
            fallbackReason: reason
          }
        };
      };

      const userContext = parseGatewayUser();
      const userId = userContext?.id;

      if (!userId) {
        console.warn('Recent jobs request missing authenticated user context; returning fallback data');
        return res.status(200).json(buildRecentJobsFallback('MISSING_AUTH_CONTEXT'));
      }

      // Try to get real job data from job service
      let jobs = [];
      try {
        const axios = require('axios');
        const jobServiceUrl = process.env.JOB_SERVICE_URL || 'http://localhost:5003';
        const response = await axios.get(`${jobServiceUrl}/api/jobs/worker/recent`, {
          params: { workerId: userId, limit },
          headers: { Authorization: req.headers.authorization },
          timeout: 5000
        });
        jobs = response.data?.jobs || [];
      } catch (error) {
        console.warn('Could not fetch recent jobs from job service:', error.message);
        const fallback = buildRecentJobsFallback('JOB_SERVICE_UNAVAILABLE');
        return res.status(200).json(fallback);
      }

      res.json({
        success: true,
        data: {
          jobs: jobs.slice(0, parseInt(limit)),
          total: jobs.length
        }
      });
    } catch (error) {
      console.error('Get recent jobs error:', error);
      return handleServiceError(res, error, 'Failed to get recent jobs');
    }
  }

  /**
   * Get structured skill entries for a worker profile
   */
  static async getWorkerSkills(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    try {
      const { userDoc, workerProfile } = await ensureWorkerDocuments({ workerId, lean: true });
      if (!userDoc && !workerProfile) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const normalized = normalizeSkillEntries(
        workerProfile?.skillEntries,
        workerProfile?.skills || userDoc?.skills || [],
      );

      return res.json({
        success: true,
        data: {
          skills: normalized,
          totals: {
            count: normalized.length,
            verified: normalized.filter((entry) => entry.verified).length,
          },
          source: {
            workerProfile: Boolean(workerProfile),
            user: Boolean(userDoc),
          },
        },
      });
    } catch (error) {
      console.error('getWorkerSkills error:', error);
      return handleServiceError(res, error, 'Failed to load worker skills');
    }
  }

  /**
   * Create a new worker skill entry
   */
  static async createWorkerSkill(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    const payload = req.body || {};
    if (!payload.name || !payload.name.trim()) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to manage skills for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.skillEntries = profile.skillEntries || [];

      const now = new Date();
      profile.skillEntries.push({
        name: payload.name.trim(),
        level: payload.level || 'Intermediate',
        category: payload.category || null,
        yearsOfExperience: Number.isFinite(payload.yearsOfExperience)
          ? payload.yearsOfExperience
          : null,
        verified: Boolean(payload.verified && ['admin', 'staff'].includes(req.user?.role)),
        description: payload.description || null,
        source: payload.source || 'worker-self',
        lastUsedAt: payload.lastUsedAt || null,
        evidenceUrl: payload.evidenceUrl || null,
        createdAt: now,
        updatedAt: now,
      });

      await profile.save();
      const created = profile.skillEntries[profile.skillEntries.length - 1];
      const normalized = normalizeSkillEntries([
        created?.toObject ? created.toObject() : created,
      ])[0];

      return res.status(201).json({ success: true, data: { skill: normalized } });
    } catch (error) {
      console.error('createWorkerSkill error:', error);
      return handleServiceError(res, error, 'Failed to create worker skill');
    }
  }

  /**
   * Update an existing worker skill entry
   */
  static async updateWorkerSkill(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const skillId = req.params.skillId;
    if (!workerId || !skillId) {
      return res.status(400).json({ success: false, message: 'workerId and skillId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update skills for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.skillEntries = profile.skillEntries || [];
      const entry = profile.skillEntries.id(skillId);

      if (!entry) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }

      const payload = req.body || {};
      if (payload.name) entry.name = payload.name.trim();
      if (payload.level) entry.level = payload.level;
      if (payload.category !== undefined) entry.category = payload.category;
      if (payload.description !== undefined) entry.description = payload.description;
      if (payload.yearsOfExperience !== undefined) entry.yearsOfExperience = Number.isFinite(payload.yearsOfExperience)
        ? payload.yearsOfExperience
        : entry.yearsOfExperience;
      if (payload.lastUsedAt !== undefined) entry.lastUsedAt = payload.lastUsedAt;
      if (payload.evidenceUrl !== undefined) entry.evidenceUrl = payload.evidenceUrl;
      if (payload.source) entry.source = payload.source;
      if (payload.verified !== undefined && ['admin', 'staff'].includes(req.user?.role)) {
        entry.verified = Boolean(payload.verified);
      }
      entry.updatedAt = new Date();

      await profile.save();
      const normalized = normalizeSkillEntries([
        entry?.toObject ? entry.toObject() : entry,
      ])[0];

      return res.json({ success: true, data: { skill: normalized } });
    } catch (error) {
      console.error('updateWorkerSkill error:', error);
      return handleServiceError(res, error, 'Failed to update worker skill');
    }
  }

  /**
   * Delete a worker skill entry
   */
  static async deleteWorkerSkill(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const skillId = req.params.skillId;
    if (!workerId || !skillId) {
      return res.status(400).json({ success: false, message: 'workerId and skillId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete skills for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.skillEntries = profile.skillEntries || [];
      const entry = profile.skillEntries.id(skillId);
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }

      entry.remove();
      await profile.save();

      return res.status(204).send();
    } catch (error) {
      console.error('deleteWorkerSkill error:', error);
      return handleServiceError(res, error, 'Failed to delete worker skill');
    }
  }

  /**
   * Get worker work history entries
   */
  static async getWorkerWorkHistory(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    try {
      const { userDoc, workerProfile } = await ensureWorkerDocuments({ workerId, lean: true });
      if (!userDoc && !workerProfile) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const entries = normalizeWorkHistoryEntries(workerProfile?.workHistory || []);
      return res.json({
        success: true,
        data: {
          workHistory: entries,
          totals: { count: entries.length },
          source: {
            workerProfile: Boolean(workerProfile),
          },
        },
      });
    } catch (error) {
      console.error('getWorkerWorkHistory error:', error);
      return handleServiceError(res, error, 'Failed to load worker work history');
    }
  }

  /**
   * Add a work history entry for a worker
   */
  static async addWorkHistoryEntry(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    const payload = req.body || {};
    if (!payload.role || !payload.role.trim()) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify work history for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.workHistory = profile.workHistory || [];
      const now = new Date();
      profile.workHistory.push({
        role: payload.role.trim(),
        company: payload.company || null,
        employmentType: payload.employmentType || 'contract',
        location: payload.location || null,
        startDate: payload.startDate || null,
        endDate: payload.endDate || null,
        isCurrent: Boolean(payload.isCurrent),
        description: payload.description || null,
        highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
        clientsServed: Array.isArray(payload.clientsServed) ? payload.clientsServed : [],
        technologies: Array.isArray(payload.technologies) ? payload.technologies : [],
        createdAt: now,
        updatedAt: now,
      });

      await profile.save();
      const normalized = normalizeWorkHistoryEntries(profile.workHistory);
      return res.status(201).json({ success: true, data: { workHistory: normalized } });
    } catch (error) {
      console.error('addWorkHistoryEntry error:', error);
      return handleServiceError(res, error, 'Failed to add work history entry');
    }
  }

  /**
   * Update an existing work history entry
   */
  static async updateWorkHistoryEntry(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const entryId = req.params.entryId;
    if (!workerId || !entryId) {
      return res.status(400).json({ success: false, message: 'workerId and entryId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify work history for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.workHistory = profile.workHistory || [];
      const entry = profile.workHistory.id(entryId);

      if (!entry) {
        return res.status(404).json({ success: false, message: 'Work history entry not found' });
      }

      const payload = req.body || {};
      if (payload.role) entry.role = payload.role.trim();
      if (payload.company !== undefined) entry.company = payload.company;
      if (payload.employmentType) entry.employmentType = payload.employmentType;
      if (payload.location !== undefined) entry.location = payload.location;
      if (payload.startDate !== undefined) entry.startDate = payload.startDate;
      if (payload.endDate !== undefined) entry.endDate = payload.endDate;
      if (payload.isCurrent !== undefined) entry.isCurrent = Boolean(payload.isCurrent);
      if (payload.description !== undefined) entry.description = payload.description;
      if (payload.highlights) entry.highlights = Array.isArray(payload.highlights) ? payload.highlights : entry.highlights;
      if (payload.clientsServed) entry.clientsServed = Array.isArray(payload.clientsServed) ? payload.clientsServed : entry.clientsServed;
      if (payload.technologies) entry.technologies = Array.isArray(payload.technologies) ? payload.technologies : entry.technologies;
      entry.updatedAt = new Date();

      await profile.save();
      const normalized = normalizeWorkHistoryEntries([
        entry?.toObject ? entry.toObject() : entry,
      ])[0];

      return res.json({ success: true, data: { workHistory: normalized } });
    } catch (error) {
      console.error('updateWorkHistoryEntry error:', error);
      return handleServiceError(res, error, 'Failed to update work history entry');
    }
  }

  /**
   * Delete a work history entry
   */
  static async deleteWorkHistoryEntry(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const entryId = req.params.entryId;
    if (!workerId || !entryId) {
      return res.status(400).json({ success: false, message: 'workerId and entryId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete work history for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      profile.workHistory = profile.workHistory || [];
      const entry = profile.workHistory.id(entryId);
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Work history entry not found' });
      }

      entry.remove();
      await profile.save();

      return res.status(204).send();
    } catch (error) {
      console.error('deleteWorkHistoryEntry error:', error);
      return handleServiceError(res, error, 'Failed to delete work history entry');
    }
  }

  /**
   * Public portfolio feed for worker profiles
   */
  static async getWorkerPortfolio(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    try {
      const { userDoc, workerProfile } = await ensureWorkerDocuments({ workerId, lean: true });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!workerProfile) {
        return res.json({ success: true, data: { portfolioItems: [], pagination: generatePagination(1, 1, 0) } });
      }

      const PortfolioModel = modelsModule.Portfolio;
      if (!PortfolioModel) {
        return res.status(503).json({ success: false, message: 'Portfolio model unavailable' });
      }

      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
      const offset = (page - 1) * limit;
      const isOwner = canMutateWorkerResource(req.user, userDoc._id);

      const filter = {
        workerProfileId: workerProfile._id,
        isActive: true,
      };

      if (req.query.status) {
        filter.status = req.query.status;
      } else if (!isOwner) {
        filter.status = 'published';
      }

      const [items, total] = await Promise.all([
        PortfolioModel.find(filter)
          .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
          .skip(offset)
          .limit(limit),
        PortfolioModel.countDocuments(filter),
      ]);

      const formatted = items.map((doc) => formatPortfolioDocument(doc));
      return res.json({
        success: true,
        data: {
          portfolioItems: formatted,
          pagination: generatePagination(page, limit, total),
          stats: {
            total,
            published: await PortfolioModel.countDocuments({
              workerProfileId: workerProfile._id,
              isActive: true,
              status: 'published',
            }),
          },
        },
        meta: {
          ownerView: isOwner,
        },
      });
    } catch (error) {
      console.error('getWorkerPortfolio error:', error);
      return handleServiceError(res, error, 'Failed to load worker portfolio');
    }
  }

  /**
   * Public certificate feed for worker profiles
   */
  static async getWorkerCertificates(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: true });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const CertificateModel = modelsModule.Certificate;
      if (!CertificateModel) {
        return res.status(503).json({ success: false, message: 'Certificate model unavailable' });
      }

      const isOwner = canMutateWorkerResource(req.user, userDoc._id);
      const filter = { workerId: userDoc._id };

      if (req.query.status) {
        filter.status = req.query.status;
      } else if (!isOwner) {
        filter.status = { $in: ['verified', 'pending'] };
      }

      const certificates = await CertificateModel.find(filter)
        .sort({ issuedAt: -1, createdAt: -1 })
        .limit(Math.min(parseInt(req.query.limit || '50', 10), 50));

      const formatted = certificates.map((doc) => formatCertificateDocument(doc));
      return res.json({
        success: true,
        data: {
          certificates: formatted,
          totals: {
            count: formatted.length,
            verified: formatted.filter((cert) => cert.status === 'verified').length,
          },
        },
        meta: { ownerView: isOwner },
      });
    } catch (error) {
      console.error('getWorkerCertificates error:', error);
      return handleServiceError(res, error, 'Failed to load worker certificates');
    }
  }

  /**
   * Create a portfolio item for a worker (authenticated)
   */
  static async createWorkerPortfolioItem(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    const payload = req.body || {};
    const validation = validateInput(payload, ['title', 'description']);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to add portfolio items for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      await profile.save();

      const PortfolioModel = modelsModule.Portfolio;
      if (!PortfolioModel) {
        return res.status(503).json({ success: false, message: 'Portfolio model unavailable' });
      }

      const item = await PortfolioModel.create({
        workerProfileId: profile._id,
        title: payload.title,
        description: payload.description,
        projectType: payload.projectType || 'professional',
        primarySkillId: payload.primarySkillId || null,
        skillsUsed: payload.skillsUsed || [],
        mainImage: payload.mainImage || null,
        images: payload.images || [],
        videos: payload.videos || [],
        documents: payload.documents || [],
        projectValue: payload.projectValue,
        currency: payload.currency || profile.currency || 'GHS',
        startDate: payload.startDate || null,
        endDate: payload.endDate || null,
        location: payload.location || profile.location || null,
        clientName: payload.clientName || null,
        clientCompany: payload.clientCompany || null,
        clientRating: payload.clientRating || null,
        clientTestimonial: payload.clientTestimonial || null,
        challenges: payload.challenges || null,
        solutions: payload.solutions || null,
        outcomes: payload.outcomes || null,
        lessonsLearned: payload.lessonsLearned || null,
        toolsUsed: payload.toolsUsed || [],
        teamSize: payload.teamSize || null,
        role: payload.role || null,
        responsibilities: payload.responsibilities || [],
        achievements: payload.achievements || [],
        externalLinks: payload.externalLinks || [],
        status: payload.status || 'draft',
        tags: payload.tags || [],
        keywords: payload.keywords || [],
        isFeatured: Boolean(payload.isFeatured),
        isActive: true,
      });

      return res.status(201).json({ success: true, data: { portfolioItem: formatPortfolioDocument(item) } });
    } catch (error) {
      console.error('createWorkerPortfolioItem error:', error);
      return handleServiceError(res, error, 'Failed to create portfolio item');
    }
  }

  /**
   * Update a worker portfolio item
   */
  static async updateWorkerPortfolioItem(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const portfolioId = req.params.portfolioId;
    if (!workerId || !portfolioId) {
      return res.status(400).json({ success: false, message: 'workerId and portfolioId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update portfolio items for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      await profile.save();

      const PortfolioModel = modelsModule.Portfolio;
      if (!PortfolioModel) {
        return res.status(503).json({ success: false, message: 'Portfolio model unavailable' });
      }

      const item = await PortfolioModel.findOne({
        _id: portfolioId,
        workerProfileId: profile._id,
      });

      if (!item) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found' });
      }

      Object.assign(item, req.body || {}, { updatedAt: new Date() });
      await item.save();

      return res.json({ success: true, data: { portfolioItem: formatPortfolioDocument(item) } });
    } catch (error) {
      console.error('updateWorkerPortfolioItem error:', error);
      return handleServiceError(res, error, 'Failed to update portfolio item');
    }
  }

  /**
   * Delete a worker portfolio item
   */
  static async deleteWorkerPortfolioItem(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const portfolioId = req.params.portfolioId;
    if (!workerId || !portfolioId) {
      return res.status(400).json({ success: false, message: 'workerId and portfolioId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete portfolio items for this worker' });
      }

      const profile = await getMutableWorkerProfile(userDoc);
      await profile.save();

      const PortfolioModel = modelsModule.Portfolio;
      if (!PortfolioModel) {
        return res.status(503).json({ success: false, message: 'Portfolio model unavailable' });
      }

      const deleted = await PortfolioModel.findOneAndDelete({
        _id: portfolioId,
        workerProfileId: profile._id,
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('deleteWorkerPortfolioItem error:', error);
      return handleServiceError(res, error, 'Failed to delete portfolio item');
    }
  }

  /**
   * Create a worker certificate (authenticated)
   */
  static async addWorkerCertificate(req, res) {
    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId parameter is required' });
    }

    const payload = req.body || {};
    const validation = validateInput(payload, ['name', 'issuer', 'issuedAt']);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to add certificates for this worker' });
      }

      const CertificateModel = modelsModule.Certificate;
      if (!CertificateModel) {
        return res.status(503).json({ success: false, message: 'Certificate model unavailable' });
      }

      const certificate = await CertificateModel.create({
        workerId: userDoc._id,
        name: payload.name,
        issuer: payload.issuer,
        credentialId: payload.credentialId || null,
        url: payload.url || null,
        issuedAt: payload.issuedAt,
        expiresAt: payload.expiresAt || null,
        status: payload.status || 'draft',
        verification: payload.verification || { result: 'pending' },
        metadata: payload.metadata || {},
      });

      return res.status(201).json({ success: true, data: { certificate: formatCertificateDocument(certificate) } });
    } catch (error) {
      console.error('addWorkerCertificate error:', error);
      return handleServiceError(res, error, 'Failed to add certificate');
    }
  }

  /**
   * Update a worker certificate
   */
  static async updateWorkerCertificate(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const certificateId = req.params.certificateId;
    if (!workerId || !certificateId) {
      return res.status(400).json({ success: false, message: 'workerId and certificateId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update certificates for this worker' });
      }

      const CertificateModel = modelsModule.Certificate;
      if (!CertificateModel) {
        return res.status(503).json({ success: false, message: 'Certificate model unavailable' });
      }

      const updated = await CertificateModel.findOneAndUpdate(
        { _id: certificateId, workerId: userDoc._id },
        { ...req.body, updatedAt: new Date() },
        { new: true },
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
      }

      return res.json({ success: true, data: { certificate: formatCertificateDocument(updated) } });
    } catch (error) {
      console.error('updateWorkerCertificate error:', error);
      return handleServiceError(res, error, 'Failed to update certificate');
    }
  }

  /**
   * Delete a worker certificate
   */
  static async deleteWorkerCertificate(req, res) {
    const workerId = req.params.workerId || req.params.id;
    const certificateId = req.params.certificateId;
    if (!workerId || !certificateId) {
      return res.status(400).json({ success: false, message: 'workerId and certificateId are required' });
    }

    try {
      const { userDoc } = await ensureWorkerDocuments({ workerId, lean: false });
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      if (!canMutateWorkerResource(req.user, userDoc._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete certificates for this worker' });
      }

      const CertificateModel = modelsModule.Certificate;
      if (!CertificateModel) {
        return res.status(503).json({ success: false, message: 'Certificate model unavailable' });
      }

      const deleted = await CertificateModel.findOneAndDelete({
        _id: certificateId,
        workerId: userDoc._id,
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('deleteWorkerCertificate error:', error);
      return handleServiceError(res, error, 'Failed to delete certificate');
    }
  }

  /**
   * Get worker availability by worker ID
   */
  static async getWorkerAvailability(req, res) {
    const workerId = req.params.id;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Worker ID required' });
    }

    const sendFallback = (reason) =>
      res.status(200).json({
        success: true,
        data: buildAvailabilityFallbackPayload(workerId, reason),
      });

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      console.warn('Invalid worker ID supplied for availability; returning fallback', { workerId });
      return sendFallback('INVALID_WORKER_ID');
    }

    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not ready for availability request, returning fallback', {
        readyState: mongoose.connection.readyState,
      });
      return sendFallback('USER_SERVICE_DB_NOT_READY');
    }

    try {
      await ensureConnection({
        timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
      });

      // Always get models from modelsModule (they're loaded after DB connection)
      const MongoUser = modelsModule.User;
      const MongoAvailability = modelsModule.Availability;

      if (!MongoUser || !MongoAvailability) {
        console.warn('Availability request missing initialized models, returning fallback');
        return sendFallback('MODELS_NOT_INITIALIZED');
      }

      // Get worker user info
      const worker = await MongoUser.findById(workerId).lean();
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }

      const availability = await MongoAvailability.findOne({ user: workerId }).lean();

      if (!availability) {
        return res.json({
          success: true,
          data: {
            status: 'not_set',
            isAvailable: true,
            timezone: 'Africa/Accra',
            daySlots: [],
            schedule: [],
            nextAvailable: null,
            message: 'Availability not configured'
          }
        });
      }

      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const normalizedSchedule = Array.isArray(availability.daySlots)
        ? availability.daySlots.map((daySlot) => ({
            day: dayMap[daySlot.dayOfWeek] ?? 'unknown',
            available: Array.isArray(daySlot.slots) && daySlot.slots.length > 0,
            slots: Array.isArray(daySlot.slots)
              ? daySlot.slots.map((slot) => ({
                  start: slot.start,
                  end: slot.end,
                }))
              : [],
          }))
        : [];

      const computeNextAvailable = () => {
        if (!normalizedSchedule.length) {
          return null;
        }

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (let offset = 0; offset < 7; offset += 1) {
          const dayIndex = (now.getDay() + offset) % 7;
          const dayName = dayMap[dayIndex];
          const dayEntry = normalizedSchedule.find((entry) => entry.day === dayName && entry.slots.length > 0);
          if (!dayEntry) {
            continue;
          }

          for (const slot of dayEntry.slots) {
            const [startHour = '0', startMinute = '0'] = slot.start.split(':');
            const slotMinutes = Number(startHour) * 60 + Number(startMinute);
            if (offset > 0 || slotMinutes >= currentMinutes) {
              return `${dayName} ${slot.start}`;
            }
          }
        }

        return null;
      };

      res.json({
        success: true,
        data: {
          status: availability.isAvailable ? 'available' : 'unavailable',
          isAvailable: Boolean(availability.isAvailable),
          timezone: availability.timezone,
          daySlots: availability.daySlots || [],
          schedule: normalizedSchedule,
          nextAvailable: computeNextAvailable(),
          lastUpdated: availability.updatedAt,
          pausedUntil: availability.pausedUntil || null,
        }
      });
    } catch (error) {
      console.error('❌ ERROR in getWorkerAvailability - Full details:', {
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        workerId,
        modelsModuleLoaded: !!modelsModule,
        AvailabilityModelExists: !!Availability,
        UserModelExists: !!User,
        connectionState: mongoose.connection.readyState
      });
      if (isDbUnavailableError(error)) {
        return sendFallback('USER_SERVICE_DB_UNAVAILABLE');
      }
      if (error?.name === 'CastError') {
        return sendFallback('INVALID_WORKER_ID');
      }
      return handleServiceError(res, error, 'Failed to get worker availability');
    }
  }
}

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

module.exports = WorkerController;
