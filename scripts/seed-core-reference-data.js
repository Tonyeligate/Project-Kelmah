#!/usr/bin/env node
/**
 * Seed core reference data (job categories + Ghana locations) into MongoDB.
 * Uses the shared kelmah_platform database so both backend services and
 * frontend APIs can reference consistent metadata.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables from backend .env first, then fall back to root .env
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

// Lightweight reference location model for seed purposes
const locationSchema = new mongoose.Schema(
  {
    value: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    city: { type: String, required: true },
    region: { type: String, required: true },
    country: { type: String, default: 'Ghana' },
    slug: { type: String, required: true, unique: true },
    sortOrder: { type: Number, default: 0 },
  },
  { collection: 'reference_locations', timestamps: true },
);
locationSchema.index({ region: 1, city: 1 });
const LocationReference =
  mongoose.models.LocationReference || mongoose.model('LocationReference', locationSchema);

const categoriesPath = path.resolve(
  __dirname,
  '../kelmah-frontend/src/modules/jobs/data/tradeCategories.json',
);
const locationsPath = path.resolve(
  __dirname,
  '../kelmah-frontend/src/modules/jobs/data/ghanaLocations.json',
);

if (!fs.existsSync(categoriesPath) || !fs.existsSync(locationsPath)) {
  console.error('❌ Unable to locate reference JSON files under kelmah-frontend/src/modules/jobs/data');
  process.exit(1);
}

const iconMap = {
  Electrical: 'ElectricalServices',
  Plumbing: 'Plumbing',
  Carpentry: 'Handyman',
  HVAC: 'Thermostat',
  Construction: 'Construction',
  Painting: 'FormatPaint',
  Roofing: 'RoofingSharp',
  Masonry: 'Build',
};

const categoryDescriptions = {
  Electrical: 'Smart electrical systems, wiring, and renewable integrations.',
  Plumbing: 'Water systems, emergency repairs, and eco plumbing upgrades.',
  Carpentry: 'Custom woodwork, cabinetry, furniture, and structural builds.',
  HVAC: 'Cooling, heating, and smart climate optimization projects.',
  Construction: 'Residential and commercial building, renovation, and infrastructure.',
  Painting: 'Interior and exterior painting, finishing, and decorative detail.',
  Roofing: 'Roof installation, leak repairs, and weatherproofing solutions.',
  Masonry: 'Bricklaying, stonework, tiling, and concrete craftsmanship.',
};

const slugify = (value) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');

const loadJson = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
};

const normalizeCategories = () => {
  const items = loadJson(categoriesPath);
  return items
    .filter((item) => item?.value)
    .map((item, index) => {
      const name = item.label || item.value;
      const slug = slugify(item.value);
      return {
        name,
        slug,
        description: categoryDescriptions[item.value] || `Professional ${name} services`,
        icon: iconMap[item.value] || 'Work',
        isActive: true,
        displayOrder: index,
        metaData: {
          keywords: [name, item.value, `${name} jobs`, `${name} workers`],
          seoDescription: `${name} experts available on Kelmah`,
        },
      };
    });
};

const normalizeLocations = () => {
  const items = loadJson(locationsPath);
  return items
    .filter((item) => item?.value)
    .map((item, index) => {
      const labelParts = (item.label || '').split(',').map((part) => part.trim()).filter(Boolean);
      const city = labelParts[0] || item.value;
      const region = labelParts[1] || labelParts[0] || 'Greater Accra';
      return {
        value: item.value,
        label: item.label,
        city,
        region,
        slug: slugify(item.value),
        sortOrder: index,
      };
    });
};

async function seedCategories(collection) {
  const categories = normalizeCategories();
  let inserted = 0;
  for (const category of categories) {
    const result = await collection.updateOne(
      { $or: [{ slug: category.slug }, { name: category.name }] },
      { $set: category },
      { upsert: true },
    );
    if (result.upsertedCount || result.modifiedCount) {
      inserted += 1;
    }
  }
  return inserted;
}

async function seedLocations() {
  const locations = normalizeLocations();
  let inserted = 0;
  for (const location of locations) {
    await LocationReference.findOneAndUpdate(
      { value: location.value },
      { $set: location },
      { upsert: true, setDefaultsOnInsert: true },
    );
    inserted += 1;
  }
  return inserted;
}

(async () => {
  console.log('🗄️  Seeding core reference data...');
  console.log('   • Mongo URI:', mongoUri.replace(/:([^:@]{4,}[^:@]+)@/, ':****@'));
  console.log('   • Database:', databaseName);

  try {
    await mongoose.connect(mongoUri, connectionOptions);
    console.log('✅ Connected to MongoDB');

    const categoriesCollection = mongoose.connection.collection('categories');
    const [categoryCount, locationCount] = await Promise.all([
      seedCategories(categoriesCollection),
      seedLocations(),
    ]);

    console.log(`✅ Categories upserted: ${categoryCount}`);
    console.log(`✅ Locations upserted: ${locationCount}`);

    await mongoose.disconnect();
    console.log('👋 Seeding complete. Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed reference data');
    console.error(error);
    process.exit(1);
  }
})();
