#!/usr/bin/env node
/**
 * Verify and fix lookup tables (Categories and Locations)
 * Ensures frontend and backend are in sync
 */

/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Override with MongoDB Atlas URI if not in environment
if (!process.env.MONGODB_URI && process.env.JOB_MONGO_URI) {
  process.env.MONGODB_URI = process.env.JOB_MONGO_URI;
}
if (!process.env.MONGODB_URI) {
  console.error('❌ Missing MongoDB connection string. Set JOB_MONGO_URI or MONGODB_URI.');
  process.exit(1);
}

const { connectDB, mongoose } = require('../config/db');
const { Category } = require('../models');

// Expected categories from frontend (8 categories)
const EXPECTED_CATEGORIES = [
  {
    name: "Electrical Work",
    description: "Professional electrical installation, repair, and maintenance services",
    slug: "electrical-work",
    icon: "⚡",
    displayOrder: 1
  },
  {
    name: "Plumbing Services",
    description: "Expert plumbing installation, repair, and maintenance",
    slug: "plumbing-services",
    icon: "🔧",
    displayOrder: 2
  },
  {
    name: "Carpentry & Woodwork",
    description: "Custom carpentry, furniture making, and woodworking services",
    slug: "carpentry-woodwork",
    icon: "🪚",
    displayOrder: 3
  },
  {
    name: "HVAC & Climate Control",
    description: "Heating, ventilation, and air conditioning services",
    slug: "hvac-climate-control",
    icon: "❄️",
    displayOrder: 4
  },
  {
    name: "Construction & Building",
    description: "General construction, building, and renovation services",
    slug: "construction-building",
    icon: "🏗️",
    displayOrder: 5
  },
  {
    name: "Painting & Decoration",
    description: "Professional painting and interior decoration services",
    slug: "painting-decoration",
    icon: "🎨",
    displayOrder: 6
  },
  {
    name: "Roofing Services",
    description: "Roof installation, repair, and maintenance",
    slug: "roofing-services",
    icon: "🏠",
    displayOrder: 7
  },
  {
    name: "Masonry & Stonework",
    description: "Expert masonry, bricklaying, and stonework services",
    slug: "masonry-stonework",
    icon: "🧱",
    displayOrder: 8
  }
];

// Expected locations from frontend (8 locations)
const EXPECTED_LOCATIONS = [
  "Accra, Greater Accra",
  "Kumasi, Ashanti Region",
  "Tema, Greater Accra",
  "Takoradi, Western Region",
  "Cape Coast, Central Region",
  "Tamale, Northern Region",
  "Ho, Volta Region",
  "Koforidua, Eastern Region"
];

async function verifyCategories() {
  console.log('\n📋 Verifying Trade Categories...\n');
  
  const existingCategories = await Category.find({}).sort({ displayOrder: 1 });
  const existingNames = existingCategories.map(c => c.name);
  
  console.log(`Found ${existingCategories.length} existing categories`);
  
  // Check for missing categories
  const missing = EXPECTED_CATEGORIES.filter(
    expected => !existingNames.includes(expected.name)
  );
  
  // Check for extra categories
  const expectedNames = EXPECTED_CATEGORIES.map(c => c.name);
  const extra = existingCategories.filter(
    existing => !expectedNames.includes(existing.name)
  );
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing ${missing.length} categories:`);
    for (const cat of missing) {
      console.log(`   - ${cat.name}`);
      try {
        await Category.create(cat);
        console.log(`   ✅ Created: ${cat.name}`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${cat.name}: ${error.message}`);
      }
    }
  } else {
    console.log('✅ All expected categories exist');
  }
  
  if (extra.length > 0) {
    console.log(`\n📝 Found ${extra.length} extra categories:`);
    for (const cat of extra) {
      console.log(`   - ${cat.name} (ID: ${cat._id})`);
    }
    console.log('   Note: Not removing extra categories automatically. Review manually if needed.');
  }
  
  // Verify each expected category has correct data
  console.log('\n🔍 Verifying category details...');
  for (const expected of EXPECTED_CATEGORIES) {
    const existing = await Category.findOne({ name: expected.name });
    if (existing) {
      let needsUpdate = false;
      const updates = {};
      
      if (existing.slug !== expected.slug) {
        updates.slug = expected.slug;
        needsUpdate = true;
      }
      if (existing.displayOrder !== expected.displayOrder) {
        updates.displayOrder = expected.displayOrder;
        needsUpdate = true;
      }
      if (!existing.isActive) {
        updates.isActive = true;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await Category.updateOne({ _id: existing._id }, { $set: updates });
        console.log(`   ✅ Updated: ${expected.name}`);
      }
    }
  }
  
  console.log('\n✅ Category verification complete!');
}

async function verifyLocations() {
  console.log('\n📍 Verifying Locations...\n');
  
  // Note: Locations are stored as strings in the Job model's location.city field
  // We'll verify they exist in actual job data
  const db = mongoose.connection.db;
  const jobsCol = db.collection('jobs');
  
  // Get distinct locations from jobs
  const existingLocations = await jobsCol.distinct('location.city');
  
  console.log(`Found ${existingLocations.length} distinct locations in jobs:`);
  existingLocations.forEach(loc => console.log(`   - ${loc || '(empty)'}`));
  
  // Check which expected locations are missing
  const missing = EXPECTED_LOCATIONS.filter(
    expected => !existingLocations.some(existing => 
      existing && existing.includes(expected.split(',')[0])
    )
  );
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Expected locations not found in jobs:`);
    missing.forEach(loc => console.log(`   - ${loc}`));
    console.log('\n   Note: Locations are added when jobs are created.');
    console.log('   Consider creating sample jobs for these locations.');
  } else {
    console.log('\n✅ All expected locations found in job data');
  }
  
  console.log('\n✅ Location verification complete!');
}

async function verifySkills() {
  console.log('\n🛠️  Verifying Skills Data...\n');
  
  const db = mongoose.connection.db;
  const jobsCol = db.collection('jobs');
  
  // Get all unique skills from jobs
  const allJobs = await jobsCol.find({}).toArray();
  const allSkills = new Set();
  
  allJobs.forEach(job => {
    if (job.skills && Array.isArray(job.skills)) {
      job.skills.forEach(skill => {
        if (skill) allSkills.add(skill);
      });
    }
  });
  
  console.log(`Found ${allSkills.size} unique skills in jobs:`);
  const skillsArray = Array.from(allSkills).sort();
  skillsArray.slice(0, 20).forEach(skill => console.log(`   - ${skill}`));
  if (skillsArray.length > 20) {
    console.log(`   ... and ${skillsArray.length - 20} more`);
  }
  
  console.log('\n✅ Skills verification complete!');
}

async function main() {
  console.log('🔍 LOOKUP TABLES VERIFICATION SCRIPT');
  console.log('=====================================\n');
  
  await connectDB();
  console.log('✅ Connected to MongoDB\n');
  
  try {
    await verifyCategories();
    await verifyLocations();
    await verifySkills();
    
    console.log('\n=====================================');
    console.log('✅ All verifications complete!');
    console.log('=====================================\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
