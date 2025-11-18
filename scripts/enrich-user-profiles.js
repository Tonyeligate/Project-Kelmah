#!/usr/bin/env node
/**
 * Normalize and enrich user documents with missing personal data so the
 * frontend profile flows have consistent city/state/profession/skill fields.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const backendEnv = path.resolve(__dirname, '../kelmah-backend/.env');
if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv });
}
require('dotenv').config();

const DEFAULT_URI =
  'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';
const mongoUri = process.env.MONGODB_URI || DEFAULT_URI;
const databaseName = process.env.DB_NAME || 'kelmah_platform';

const connectionOptions = {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  dbName: databaseName,
};

const locationsPath = path.resolve(
  __dirname,
  '../kelmah-frontend/src/modules/jobs/data/ghanaLocations.json',
);

if (!fs.existsSync(locationsPath)) {
  console.error('❌ Missing ghanaLocations.json reference file');
  process.exit(1);
}

const loadLocations = () => JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));

const normalizeText = (value = '') => value.trim().toLowerCase();

const buildLocationMaps = () => {
  const records = loadLocations();
  const byValue = new Map();
  const byCity = new Map();

  records
    .filter((item) => item?.value)
    .forEach((item) => {
      const [cityRaw, regionRaw] = (item.label || '')
        .split(',')
        .map((piece) => piece.trim())
        .filter(Boolean);

      const city = cityRaw || item.value;
      const region = regionRaw || 'Greater Accra';
      const entry = { city, region };

      byValue.set(normalizeText(item.value), entry);
      byCity.set(normalizeText(city), entry);
    });

  return { byValue, byCity };
};

const parseCityRegion = (input, maps) => {
  if (!input) return {};
  const normalized = normalizeText(input.split(',')[0] || input);
  if (!normalized) return {};

  const fromValue = maps.byValue.get(normalized);
  if (fromValue) return fromValue;

  const fromCity = maps.byCity.get(normalized);
  if (fromCity) return fromCity;

  return { city: input.split(',')[0].trim() };
};

const buildPhoneGenerator = () => {
  let counter = 0;
  return () => {
    counter += 1;
    const suffix = (100000 + counter).toString().padStart(6, '0');
    return `+23355${suffix}`;
  };
};

const enrichUsers = async () => {
  console.log('🗄️  Connecting to MongoDB for user enrichment...');
  console.log('   • Mongo URI:', mongoUri.replace(/:([^:@]{4,}[^:@]+)@/, ':****@'));
  console.log('   • Database:', databaseName);

  await mongoose.connect(mongoUri, connectionOptions);
  const db = mongoose.connection;
  const usersCol = db.collection('users');
  const workerProfilesCol = db.collection('workerprofiles');

  const workerProfiles = await workerProfilesCol
    .find({})
    .project({ userId: 1, profession: 1, skills: 1, location: 1 })
    .toArray();
  const workerProfileMap = new Map(
    workerProfiles.map((profile) => [profile.userId?.toString(), profile]),
  );

  const locationMaps = buildLocationMaps();
  const generatePhone = buildPhoneGenerator();

  const stats = {
    scanned: 0,
    updated: 0,
    city: 0,
    state: 0,
    location: 0,
    profession: 0,
    skills: 0,
    phone: 0,
  };

  const cursor = usersCol.find({});

  /* eslint-disable no-await-in-loop */
  while (await cursor.hasNext()) {
    const user = await cursor.next();
    stats.scanned += 1;
    const profile = workerProfileMap.get(user._id?.toString());

    const locationSource =
      profile?.location ||
      user.location ||
      user.city ||
      user.state ||
      profile?.city;

    const parsedLocation = parseCityRegion(locationSource, locationMaps);
    const resolvedCity = parsedLocation.city || 'Accra';
    const resolvedRegion = parsedLocation.region || 'Greater Accra';
    const update = {};

    if (!user.city && resolvedCity) {
      update.city = resolvedCity;
      stats.city += 1;
    }

    if (!user.state && resolvedRegion) {
      update.state = resolvedRegion;
      stats.state += 1;
    }

    if (!user.country) {
      update.country = 'Ghana';
    }

    if (!user.countryCode) {
      update.countryCode = 'GH';
    }

    if (!user.location) {
      const pieces = [resolvedCity, resolvedRegion].filter(Boolean);
      if (pieces.length) {
        update.location = pieces.join(', ');
        stats.location += 1;
      }
    }

    if (!user.profession) {
      if (profile?.profession) {
        update.profession = profile.profession;
      } else if (user.role === 'hirer') {
        update.profession = 'Project Owner';
      } else {
        update.profession = 'Skilled Professional';
      }
      stats.profession += 1;
    }

    const workerSkills = Array.isArray(profile?.skills) ? profile.skills : [];
    if ((!Array.isArray(user.skills) || user.skills.length === 0) && workerSkills.length) {
      update.skills = workerSkills;
      stats.skills += 1;
    }

    if (!user.phone) {
      update.phone = generatePhone();
      stats.phone += 1;
    }

    if (Object.keys(update).length) {
      await usersCol.updateOne({ _id: user._id }, { $set: update });
      stats.updated += 1;
    }
  }
  /* eslint-enable no-await-in-loop */

  await mongoose.disconnect();
  console.log('👋 Enrichment complete. Connection closed.');
  console.table(stats);
};

enrichUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to enrich users');
    console.error(error);
    process.exit(1);
  });
