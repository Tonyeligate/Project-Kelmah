#!/usr/bin/env node
/**
 * Backfill worker geo coordinates using MongoDB-only models.
 *
 * Default mode is dry-run (no writes):
 *   node scripts/backfill-user-geo.js
 *
 * Apply changes:
 *   node scripts/backfill-user-geo.js --apply
 *
 * Optional flags:
 *   --sync-existing   overwrite existing coordinates when candidate differs
 *   --include-inactive include inactive workers
 *   --limit=250       max records to process
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { User, WorkerProfile } = require('../models');

const GHANA_LOCATION_CENTROIDS = {
  accra: { lat: 5.6037, lng: -0.1870 },
  tema: { lat: 5.6698, lng: -0.0166 },
  kumasi: { lat: 6.6885, lng: -1.6244 },
  tamale: { lat: 9.4034, lng: -0.8424 },
  takoradi: { lat: 4.8982, lng: -1.7603 },
  'cape coast': { lat: 5.1053, lng: -1.2466 },
  sunyani: { lat: 7.3399, lng: -2.3268 },
  ho: { lat: 6.6008, lng: 0.4713 },
  koforidua: { lat: 6.0907, lng: -0.2591 },
  bolgatanga: { lat: 10.7856, lng: -0.8514 },
  wa: { lat: 10.0601, lng: -2.5019 },
  'greater accra': { lat: 5.6037, lng: -0.1870 },
  ashanti: { lat: 6.6885, lng: -1.6244 },
  'northern region': { lat: 9.4034, lng: -0.8424 },
  'western region': { lat: 4.8982, lng: -1.7603 },
  'western north': { lat: 6.3000, lng: -2.9000 },
  'central region': { lat: 5.1053, lng: -1.2466 },
  'eastern region': { lat: 6.0907, lng: -0.2591 },
  volta: { lat: 6.6008, lng: 0.4713 },
  'upper east': { lat: 10.7856, lng: -0.8514 },
  'upper west': { lat: 10.0601, lng: -2.5019 },
  'bono east': { lat: 7.9500, lng: -1.9000 },
  ahafo: { lat: 7.0000, lng: -2.5000 },
  oti: { lat: 8.3500, lng: 0.5000 },
  savannah: { lat: 9.8000, lng: -1.8000 },
  north: { lat: 9.4034, lng: -0.8424 },
  ghana: { lat: 7.9465, lng: -1.0232 },
};

const parseArgs = (argv) => {
  const options = {
    apply: false,
    syncExisting: false,
    includeInactive: false,
    limit: 0,
  };

  for (const arg of argv) {
    if (arg === '--apply') {
      options.apply = true;
      continue;
    }

    if (arg === '--sync-existing') {
      options.syncExisting = true;
      continue;
    }

    if (arg === '--include-inactive') {
      options.includeInactive = true;
      continue;
    }

    if (arg.startsWith('--limit=')) {
      const parsed = Number(arg.split('=')[1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = Math.floor(parsed);
      }
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/backfill-user-geo.js [--apply] [--sync-existing] [--include-inactive] [--limit=250]');
      process.exit(0);
    }
  }

  return options;
};

const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const normalizeGeo = (lat, lng) => ({
  lat: Number(lat),
  lng: Number(lng),
});

const extractUserGeo = (userDoc) => {
  const coords = userDoc?.locationCoordinates?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!isValidLatLng(lat, lng)) {
    return null;
  }

  return { lat, lng };
};

const geoDiffers = (left, right, epsilon = 1e-6) => {
  if (!left || !right) {
    return true;
  }

  return Math.abs(left.lat - right.lat) > epsilon || Math.abs(left.lng - right.lng) > epsilon;
};

const resolveFromLocationText = (text) => {
  const normalized = String(text || '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  for (const [token, coords] of Object.entries(GHANA_LOCATION_CENTROIDS)) {
    if (normalized.includes(token)) {
      return { ...coords, source: `location:${token}` };
    }
  }

  return null;
};

const resolveCandidateCoordinates = ({ workerProfile, user }) => {
  const fromWorkerProfile = normalizeGeo(workerProfile?.latitude, workerProfile?.longitude);
  if (isValidLatLng(fromWorkerProfile.lat, fromWorkerProfile.lng)) {
    return { ...fromWorkerProfile, source: 'workerProfile' };
  }

  const fromUserLegacy = normalizeGeo(user?.latitude, user?.longitude);
  if (isValidLatLng(fromUserLegacy.lat, fromUserLegacy.lng)) {
    return { ...fromUserLegacy, source: 'userLegacy' };
  }

  const locationsToTry = [
    workerProfile?.location,
    user?.location,
    user?.city,
    user?.state,
    user?.address,
  ];

  for (const locationText of locationsToTry) {
    const resolved = resolveFromLocationText(locationText);
    if (resolved) {
      return resolved;
    }
  }

  return null;
};

const updateUserGeo = async ({ userId, lat, lng, apply }) => {
  if (!apply) {
    return { matchedCount: 1, modifiedCount: 1 };
  }

  return User.updateOne(
    { _id: userId },
    {
      $set: {
        locationCoordinates: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      },
    },
  );
};

const updateWorkerProfileGeo = async ({ profileId, lat, lng, apply }) => {
  if (!apply) {
    return { matchedCount: 1, modifiedCount: 1 };
  }

  return WorkerProfile.updateOne(
    { _id: profileId },
    {
      $set: {
        latitude: lat,
        longitude: lng,
      },
    },
  );
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const mongoUri = process.env.USER_MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing USER_MONGO_URI or MONGODB_URI.');
    process.exit(1);
  }

  const stats = {
    mode: options.apply ? 'apply' : 'dry-run',
    syncExisting: options.syncExisting,
    includeInactive: options.includeInactive,
    limit: options.limit || null,
    scannedProfiles: 0,
    scannedUsersWithoutProfile: 0,
    skippedMissingUser: 0,
    skippedNoCandidate: 0,
    skippedExistingGeo: 0,
    plannedUserUpdates: 0,
    plannedProfileUpdates: 0,
    updatedUsers: 0,
    updatedProfiles: 0,
    sourceCounts: {},
    errors: 0,
  };

  const processedUserIds = new Set();

  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB. Running in ${stats.mode} mode.`);

  const profileQuery = {};
  if (!options.includeInactive) {
    profileQuery.isActive = { $ne: false };
  }

  const profileCursor = WorkerProfile.find(profileQuery)
    .select('_id userId latitude longitude location isActive')
    .lean()
    .cursor();

  for await (const workerProfile of profileCursor) {
    if (options.limit > 0 && stats.scannedProfiles >= options.limit) {
      break;
    }

    stats.scannedProfiles += 1;
    const userId = workerProfile?.userId;
    if (!userId) {
      stats.skippedMissingUser += 1;
      continue;
    }

    const user = await User.findById(userId)
      .select('_id role isActive location city state address latitude longitude locationCoordinates')
      .lean();

    if (!user) {
      stats.skippedMissingUser += 1;
      continue;
    }

    if (user.role !== 'worker') {
      continue;
    }

    if (!options.includeInactive && !user.isActive) {
      continue;
    }

    processedUserIds.add(String(user._id));

    const candidate = resolveCandidateCoordinates({ workerProfile, user });
    if (!candidate || !isValidLatLng(candidate.lat, candidate.lng)) {
      stats.skippedNoCandidate += 1;
      continue;
    }

    const sourceKey = candidate.source || 'unknown';
    stats.sourceCounts[sourceKey] = (stats.sourceCounts[sourceKey] || 0) + 1;

    const existingUserGeo = extractUserGeo(user);
    const shouldUpdateUser = !existingUserGeo || (options.syncExisting && geoDiffers(existingUserGeo, candidate));

    const profileGeo = normalizeGeo(workerProfile?.latitude, workerProfile?.longitude);
    const profileHasValidGeo = isValidLatLng(profileGeo.lat, profileGeo.lng);
    const shouldUpdateProfile = !profileHasValidGeo || (options.syncExisting && geoDiffers(profileGeo, candidate));

    if (!shouldUpdateUser && !shouldUpdateProfile) {
      stats.skippedExistingGeo += 1;
      continue;
    }

    try {
      if (shouldUpdateUser) {
        stats.plannedUserUpdates += 1;
        const result = await updateUserGeo({ userId: user._id, lat: candidate.lat, lng: candidate.lng, apply: options.apply });
        if (options.apply && (result.modifiedCount > 0 || result.upsertedCount > 0)) {
          stats.updatedUsers += 1;
        }
      }

      if (shouldUpdateProfile) {
        stats.plannedProfileUpdates += 1;
        const result = await updateWorkerProfileGeo({ profileId: workerProfile._id, lat: candidate.lat, lng: candidate.lng, apply: options.apply });
        if (options.apply && (result.modifiedCount > 0 || result.upsertedCount > 0)) {
          stats.updatedProfiles += 1;
        }
      }
    } catch (error) {
      stats.errors += 1;
      console.error(`Failed to backfill profile ${workerProfile._id}:`, error.message);
    }
  }

  const userQuery = {
    role: 'worker',
  };
  if (!options.includeInactive) {
    userQuery.isActive = true;
  }

  const userCursor = User.find(userQuery)
    .select('_id role isActive location city state address latitude longitude locationCoordinates')
    .lean()
    .cursor();

  for await (const user of userCursor) {
    if (options.limit > 0 && stats.scannedUsersWithoutProfile >= options.limit) {
      break;
    }

    if (processedUserIds.has(String(user._id))) {
      continue;
    }

    stats.scannedUsersWithoutProfile += 1;

    const candidate = resolveCandidateCoordinates({ workerProfile: null, user });
    if (!candidate || !isValidLatLng(candidate.lat, candidate.lng)) {
      stats.skippedNoCandidate += 1;
      continue;
    }

    const sourceKey = candidate.source || 'unknown';
    stats.sourceCounts[sourceKey] = (stats.sourceCounts[sourceKey] || 0) + 1;

    const existingUserGeo = extractUserGeo(user);
    const shouldUpdateUser = !existingUserGeo || (options.syncExisting && geoDiffers(existingUserGeo, candidate));
    if (!shouldUpdateUser) {
      stats.skippedExistingGeo += 1;
      continue;
    }

    try {
      stats.plannedUserUpdates += 1;
      const result = await updateUserGeo({ userId: user._id, lat: candidate.lat, lng: candidate.lng, apply: options.apply });
      if (options.apply && (result.modifiedCount > 0 || result.upsertedCount > 0)) {
        stats.updatedUsers += 1;
      }
    } catch (error) {
      stats.errors += 1;
      console.error(`Failed to backfill user ${user._id}:`, error.message);
    }
  }

  console.log('Backfill summary:');
  console.log(JSON.stringify(stats, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});


