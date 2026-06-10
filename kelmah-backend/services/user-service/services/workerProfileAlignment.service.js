const modelsModule = require('../models');
const { ensureConnection } = require('../config/db');
const { calculateWorkerProfileAlignment } = require('../../../shared/utils/workerProfileAlignment');

const DEFAULT_SAMPLE_SIZE = 10;
const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_INITIAL_DELAY_MS = 5 * 60 * 1000;

const maintenanceState = {
  started: false,
  running: false,
  intervalHandle: null,
  initialHandle: null,
};

const normalizePositiveInt = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isMaintenanceEnabled = () => {
  if (process.env.WORKER_PROFILE_ALIGNMENT_MAINTENANCE_ENABLED !== undefined) {
    return process.env.WORKER_PROFILE_ALIGNMENT_MAINTENANCE_ENABLED === 'true';
  }

  return process.env.NODE_ENV === 'production';
};

const buildAuditEntry = (worker = {}, alignment = {}) => ({
  workerId: String(worker._id || worker.id || ''),
  workerName: `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || String(worker._id || worker.id || 'Unknown worker'),
  missingProfile: Boolean(alignment.missingProfile),
  mismatches: alignment.mismatches || {},
  authoritative: {
    profession: alignment.authoritative?.profession || '',
    bio: alignment.authoritative?.bio || '',
    skills: alignment.authoritative?.skills || [],
    specializations: alignment.authoritative?.specializations || [],
    sources: alignment.authoritative?.sources || {},
  },
  userUpdates: alignment.userUpdates || {},
  profileUpdates: alignment.profileUpdates || {},
  profileCreate: alignment.profileCreate || null,
});

const resolveModels = (override = modelsModule) => {
  if (typeof override.loadModels === 'function') {
    override.loadModels();
  }

  const { User, WorkerProfile } = override;
  if (!User || !WorkerProfile) {
    throw new Error('User or WorkerProfile model not initialized');
  }

  return { User, WorkerProfile };
};

const runWorkerProfileAlignmentAudit = async ({
  apply = false,
  limit = null,
  workerId = null,
  sampleSize = DEFAULT_SAMPLE_SIZE,
  ensureReady = true,
  models = modelsModule,
} = {}) => {
  if (ensureReady) {
    await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });
  }

  const { User, WorkerProfile } = resolveModels(models);
  const normalizedLimit = normalizePositiveInt(limit, null);
  const normalizedSampleSize = normalizePositiveInt(sampleSize, DEFAULT_SAMPLE_SIZE);

  const query = {
    role: 'worker',
    isActive: { $ne: false },
  };

  if (workerId) {
    query._id = workerId;
  }

  let workerQuery = User.find(query).sort({ updatedAt: -1 });
  if (normalizedLimit) {
    workerQuery = workerQuery.limit(normalizedLimit);
  }

  const workers = await workerQuery.lean();
  const workerIds = workers.map((worker) => worker._id);
  const profiles = await WorkerProfile.find({ userId: { $in: workerIds } }).lean();
  const profilesByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  const summary = {
    totalWorkers: workers.length,
    inspectedProfiles: profiles.length,
    missingProfiles: 0,
    mismatchedFields: {
      profession: 0,
      bio: 0,
      skills: 0,
      specializations: 0,
    },
    workersNeedingChanges: 0,
    userUpdates: 0,
    profileUpdates: 0,
    profilesCreated: 0,
  };

  const samples = [];

  for (const worker of workers) {
    const profile = profilesByUserId.get(String(worker._id)) || null;
    const alignment = calculateWorkerProfileAlignment(worker, profile);

    if (!alignment.hasChanges) {
      continue;
    }

    summary.workersNeedingChanges += 1;
    if (alignment.missingProfile) {
      summary.missingProfiles += 1;
      summary.profilesCreated += 1;
    }

    Object.entries(alignment.mismatches).forEach(([field, hasMismatch]) => {
      if (hasMismatch) {
        summary.mismatchedFields[field] += 1;
      }
    });

    summary.userUpdates += Object.keys(alignment.userUpdates).length;
    summary.profileUpdates += Object.keys(alignment.profileUpdates).length;

    if (samples.length < normalizedSampleSize) {
      samples.push(buildAuditEntry(worker, alignment));
    }

    if (apply) {
      if (Object.keys(alignment.userUpdates).length > 0) {
        await User.updateOne({ _id: worker._id }, { $set: alignment.userUpdates });
      }

      if (alignment.missingProfile) {
        await WorkerProfile.create(alignment.profileCreate);
      } else if (Object.keys(alignment.profileUpdates).length > 0) {
        await WorkerProfile.updateOne({ userId: worker._id }, { $set: alignment.profileUpdates });
      }
    }
  }

  return {
    mode: apply ? 'apply' : 'dry-run',
    generatedAt: new Date().toISOString(),
    filters: {
      workerId: workerId || null,
      limit: normalizedLimit,
      sampleSize: normalizedSampleSize,
    },
    summary,
    samples,
  };
};

const startWorkerProfileAlignmentMaintenance = ({ logger } = {}) => {
  const enabled = isMaintenanceEnabled();
  const intervalMs = normalizePositiveInt(
    process.env.WORKER_PROFILE_ALIGNMENT_MAINTENANCE_INTERVAL_MS,
    DEFAULT_INTERVAL_MS,
  );
  const initialDelayMs = normalizePositiveInt(
    process.env.WORKER_PROFILE_ALIGNMENT_MAINTENANCE_INITIAL_DELAY_MS,
    DEFAULT_INITIAL_DELAY_MS,
  );

  const stop = () => {
    if (maintenanceState.initialHandle) {
      clearTimeout(maintenanceState.initialHandle);
    }
    if (maintenanceState.intervalHandle) {
      clearInterval(maintenanceState.intervalHandle);
    }

    maintenanceState.started = false;
    maintenanceState.initialHandle = null;
    maintenanceState.intervalHandle = null;
    maintenanceState.running = false;
  };

  const execute = async (trigger = 'interval') => {
    if (maintenanceState.running) {
      logger?.warn?.('Skipping worker profile alignment maintenance run because a previous run is still active', {
        trigger,
      });
      return { skipped: true, reason: 'already-running' };
    }

    maintenanceState.running = true;
    try {
      const result = await runWorkerProfileAlignmentAudit({
        apply: true,
        sampleSize: 3,
      });

      logger?.info?.('Worker profile alignment maintenance completed', {
        trigger,
        summary: result.summary,
        sampleWorkerIds: result.samples.map((sample) => sample.workerId),
      });

      return result;
    } catch (error) {
      logger?.error?.('Worker profile alignment maintenance failed', {
        trigger,
        error: error.message,
      });
      return null;
    } finally {
      maintenanceState.running = false;
    }
  };

  if (!enabled) {
    logger?.info?.('Worker profile alignment maintenance is disabled', {
      enabled,
      intervalMs,
      initialDelayMs,
    });
    return {
      enabled,
      stop,
      triggerNow: execute,
    };
  }

  if (maintenanceState.started) {
    logger?.info?.('Worker profile alignment maintenance already started', {
      intervalMs,
      initialDelayMs,
    });
    return {
      enabled,
      stop,
      triggerNow: execute,
    };
  }

  maintenanceState.started = true;
  maintenanceState.intervalHandle = setInterval(() => {
    void execute('interval');
  }, intervalMs);
  maintenanceState.initialHandle = setTimeout(() => {
    void execute('initial-delay');
  }, initialDelayMs);

  if (typeof maintenanceState.intervalHandle.unref === 'function') {
    maintenanceState.intervalHandle.unref();
  }
  if (typeof maintenanceState.initialHandle.unref === 'function') {
    maintenanceState.initialHandle.unref();
  }

  logger?.info?.('Worker profile alignment maintenance started', {
    enabled,
    intervalMs,
    initialDelayMs,
  });

  return {
    enabled,
    stop,
    triggerNow: execute,
  };
};

module.exports = {
  runWorkerProfileAlignmentAudit,
  startWorkerProfileAlignmentMaintenance,
};