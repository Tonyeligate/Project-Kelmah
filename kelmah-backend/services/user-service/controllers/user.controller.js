// Use MongoDB WorkerProfile model for consistency
const db = require('../models');
// Destructure frequently-used models from service index (RULE-001 compliant)
const { Bookmark, Availability, Certificate } = db;
const { ensureConnection, mongoose: connectionInstance } = require('../config/db');
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

  const profile = {
    id: userData._id?.toString() || userData.id || null,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    phone: userData.phone || '',
    role: userData.role || 'worker',
    profilePicture: userData.profilePicture || workerData.profilePicture || null,
    bio: workerData.bio ?? userData.bio ?? '',
    location: workerData.location ?? userData.location ?? '',
    address: userData.address || '',
    city: userData.city || '',
    state: userData.state || '',
    country: userData.country || 'Ghana',
    countryCode: userData.countryCode || 'GH',
    profession: workerData.profession ?? userData.profession ?? '',
    hourlyRate: workerData.hourlyRate ?? userData.hourlyRate ?? null,
    currency: workerData.currency ?? userData.currency ?? 'GHS',
    experienceLevel: workerData.experienceLevel ?? null,
    yearsOfExperience: workerData.yearsOfExperience ?? userData.yearsOfExperience ?? null,
    skills: Array.isArray(workerData.skills)
      ? workerData.skills
      : Array.isArray(userData.skills)
        ? userData.skills
        : [],
    isEmailVerified: Boolean(userData.isEmailVerified),
    isPhoneVerified: Boolean(userData.isPhoneVerified),
    createdAt: userData.createdAt || null,
    updatedAt: userData.updatedAt || null,
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
  hourlyRate: 1,
  currency: 1,
  experienceLevel: 1,
  yearsOfExperience: 1,
  skills: 1,
  profilePicture: 1,
  updatedAt: 1,
  createdAt: 1,
  userId: 1,
};

const isBsonVersionMismatch = (error) =>
  Boolean(error) &&
  typeof error.message === 'string' &&
  error.message.toLowerCase().includes('unsupported bson version');

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

const buildProfileActivity = (workerDoc, userDoc) => {
  const timeline = [];

  if (workerDoc?.activity?.recentJobs) {
    timeline.push(...workerDoc.activity.recentJobs.map((job) => ({
      type: 'job_update',
      timestamp: job.updatedAt ? job.updatedAt.toISOString() : null,
      summary: job.title || 'Job updated',
      details: { status: job.status, jobId: job._id?.toString() || job.id },
    })));
  }

  if (userDoc?.activity?.logins) {
    timeline.push(...userDoc.activity.logins.map((entry) => ({
      type: 'login',
      timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : null,
      summary: entry.device || 'Login activity',
      details: { ip: entry.ip },
    })));
  }

  return timeline
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 20);
};

const resolveRequesterId = (req) => {
  return req?.user?.id || req?.user?._id || null;
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

    return res.json({
      success: true,
      data: buildProfileStatistics(workerDoc),
    });
  } catch (error) {
    logger.error('getProfileStatistics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile statistics' });
  }
};

exports.getProfileActivity = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { workerDoc, userDoc } = await fetchProfileDocuments({ userId });

    return res.json({
      success: true,
      data: { entries: buildProfileActivity(workerDoc, userDoc) },
    });
  } catch (error) {
    logger.error('getProfileActivity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile activity' });
  }
};

exports.getProfilePreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { userDoc } = await fetchProfileDocuments({ userId });

    return res.json({
      success: true,
      data: { preferences: normalizePreferences(userDoc?.preferences) },
    });
  } catch (error) {
    logger.error('getProfilePreferences error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
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

    const worker = await workerModel.findOne({ userId });
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
    const gatewayBase = process.env.API_GATEWAY_URL
      ? process.env.API_GATEWAY_URL.replace(/\/$/, '')
      : null;

    const candidateEndpoints = [];
    if (paymentServiceBase) {
      candidateEndpoints.push(`${paymentServiceBase}/api/payments/transactions/history`);
    }
    if (gatewayBase) {
      candidateEndpoints.push(`${gatewayBase}/api/payments/transactions/history`);
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
      const requestTimeoutMs = 2500;
      const since30Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const since7Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const since30 = since30Date.toISOString();

      const fetchTransactions = async (from) => {
        const results = await Promise.all(
          uniqueCandidateEndpoints.map(async (endpoint) => {
            try {
              const response = await axios.get(endpoint, {
                params: { recipient: userId, from },
                headers,
                timeout: requestTimeoutMs,
              });
              return Array.isArray(response?.data?.transactions)
                ? response.data.transactions
                : null;
            } catch (error) {
              logger.warn('Payment history request failed', {
                endpoint,
                message: error?.message,
                timeoutMs: requestTimeoutMs,
              });
              return null;
            }
          }),
        );

        return results.find(Array.isArray) || null;
      };

      const tx30 = await fetchTransactions(since30);
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
      timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
    });

    if (typeof db.loadModels === 'function') {
      db.loadModels();
    }

    let MongoUser = db.User;
    let MongoWorkerProfile = db.WorkerProfile;

    if (!MongoUser || !MongoWorkerProfile) {
      logger.warn('Dashboard metrics: models not initialized, returning fallback data.');
      return res.json({ ...defaultMetrics, reason: 'models-not-ready' });
    }

    const [totalUsersResult, totalWorkersResult, activeWorkersResult] = await Promise.allSettled([
      MongoUser.countDocuments({ isActive: true }),
      MongoWorkerProfile.countDocuments(),
      MongoWorkerProfile.countDocuments({ isAvailable: true }),
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
      const response = await axios.get(`${jobServiceUrl}/api/jobs/dashboard/metrics`, {
        headers: { Authorization: req.headers.authorization },
        timeout: 5000,
      });

      if (response?.data && typeof response.data === 'object') {
        jobMetrics = {
          totalJobs: Number(response.data.totalJobs) || 0,
          completedJobs: Number(response.data.completedJobs) || 0,
        };
        jobMetricsSource = 'job-service';
      }
    } catch (error) {
      logger.warn('Dashboard metrics: could not fetch job metrics:', error.message);
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

    return res.json(metrics);
  } catch (err) {
    logger.error('Dashboard metrics error:', err);
    return res.json({ ...defaultMetrics, reason: 'metrics-unavailable' });
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
      return res.status(503).json({ 
        error: 'Database connection not ready',
        message: 'Service temporarily unavailable. Please try again in a moment.' 
      });
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
      return res.json({ workers: [] });
    }

    // Manually fetch user data for each worker to avoid populate issues
    const userIds = workers.map(w => w.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select('firstName lastName profilePicture')
      .lean();

    // Create a map of userId to user data
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });

    // Format workers with user data
    const formattedWorkers = workers.map(worker => {
      const user = userMap[worker.userId?.toString()];
      return {
        id: worker._id,
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

    return res.json({ workers: formattedWorkers });
  } catch (err) {
    logger.error('Dashboard workers error:', err);
    logger.error('Error stack:', err.stack);
    
    // Provide detailed error information
    const errorResponse = {
      error: 'Failed to fetch dashboard workers',
      message: 'An internal error occurred'
    };
    
    // Include stack trace in development only
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
    }
    
    return res.status(500).json(errorResponse);
  }
};

/**
 * Get dashboard analytics (MongoDB)
 */
exports.getDashboardAnalytics = async (req, res) => {
  try {
    await ensureConnection({
      timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000),
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
      return res.status(503).json({
        success: false,
        message: 'Models not initialized for analytics computation',
      });
    }

    const now = new Date();
    const startWindow = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    let userGrowth = [];

    try {
      const growthAggregation = await MongoUser.aggregate([
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
      ]);

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
      logger.warn('User growth aggregation failed, using fallback data:', aggregationError.message);
      userGrowth = Array.from({ length: 12 }).map((_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          users: 0,
        };
      });
    }

    const [totalWorkersResult, availableWorkersResult] = await Promise.allSettled([
      MongoWorkerProfile.countDocuments(),
      MongoWorkerProfile.countDocuments({ isAvailable: true }),
    ]);

    if (totalWorkersResult.status === 'rejected') {
      logger.warn('Failed to count total workers:', totalWorkersResult.reason?.message);
    }
    if (availableWorkersResult.status === 'rejected') {
      logger.warn('Failed to count available workers:', availableWorkersResult.reason?.message);
    }

    const totalWorkers = totalWorkersResult.status === 'fulfilled' ? totalWorkersResult.value : 0;
    const availableWorkers = availableWorkersResult.status === 'fulfilled' ? availableWorkersResult.value : 0;

    let jobStats = { posted: 0, completed: 0, inProgress: 0, cancelled: 0 };
    try {
      const axios = require('axios');
      const jobServiceUrl = process.env.JOB_SERVICE_URL || 'http://localhost:5003';
      const response = await axios.get(`${jobServiceUrl}/api/jobs/analytics/summary`, {
        headers: { Authorization: req.headers.authorization },
        timeout: 5000,
      });
      jobStats = response.data;
    } catch (error) {
      logger.warn('Could not fetch job stats:', error.message);
    }

    const topCategories = [
      { name: 'Plumbing', count: 15 },
      { name: 'Electrical', count: 12 },
      { name: 'Carpentry', count: 10 },
      { name: 'Construction', count: 8 },
      { name: 'Painting', count: 6 },
    ];

    return res.json({
      userGrowth,
      jobStats,
      topCategories,
      workerStats: {
        total: totalWorkers,
        available: availableWorkers,
        utilization: totalWorkers > 0 ? Math.round((availableWorkers / totalWorkers) * 100) : 0,
      },
    });
  } catch (err) {
    logger.error('Dashboard analytics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard analytics',
    });
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

    const availability = await Availability.findOne({ userId }).lean();

    if (!availability) {
      return res.json({
        status: 'not_set',
        schedule: {},
        nextAvailable: null,
        message: 'Availability not configured'
      });
    }

    // Calculate next available time
    const now = new Date();
    let nextAvailable = null;

    if (availability.schedule && availability.schedule.length > 0) {
      // Find next available slot in schedule
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.getHours() * 100 + now.getMinutes();

      for (const slot of availability.schedule) {
        if (slot.day === currentDay && slot.available) {
          const startTime = slot.startHour * 100 + slot.startMinute;
          if (startTime > currentTime) {
            nextAvailable = `${slot.startHour}:${slot.startMinute.toString().padStart(2, '0')}`;
            break;
          }
        }
      }
    }

    return res.json({
      status: availability.isAvailable ? 'available' : 'unavailable',
      schedule: availability.schedule || {},
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
