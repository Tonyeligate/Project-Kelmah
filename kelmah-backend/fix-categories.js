require('../kelmah-backend/dns-fix');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const URI = process.env.MONGODB_URI;

// Map old verbose category names to standard short names
const CATEGORY_FIXES = {
  "Plumbing Services": "Plumbing",
  "Electrical Work": "Electrical",
  "Carpentry & Woodwork": "Carpentry",
  "HVAC & Climate Control": "HVAC",
  "Construction & Building": "Construction",
  "Painting & Decoration": "Painting"
};

const PRIMARY_SKILL_MAP = {
  "Plumbing": ["Plumbing"],
  "Electrical": ["Electrical"],
  "Carpentry": ["Carpentry"],
  "HVAC": ["HVAC"],
  "Construction": ["Construction"],
  "Painting": ["Painting"],
  "Masonry": ["Masonry"],
  "Welding": ["Welding"],
  "Roofing": ["Roofing"],
  "Flooring": ["Flooring"],
  "Tiling": ["Flooring"],
  "Interior Design": ["Painting"],
  "Landscaping": ["Construction"],
  "General Repairs": ["Construction"],
};

(async () => {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const jobsCollection = db.collection('jobs');
  
  console.log('=== Fixing old category names ===');
  
  for (const [oldCat, newCat] of Object.entries(CATEGORY_FIXES)) {
    const matched = await jobsCollection.countDocuments({ category: oldCat });
    if (matched > 0) {
      const primarySkills = PRIMARY_SKILL_MAP[newCat] || ["Construction"];
      await jobsCollection.updateMany(
        { category: oldCat },
        { $set: { 
          category: newCat,
          'requirements.primarySkills': primarySkills
        }}
      );
      console.log(`  "${oldCat}" → "${newCat}" (${matched} jobs updated)`);
    }
  }
  
  // Also verify all jobs now have valid categories
  const categories = await jobsCollection.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log('\nFinal categories:');
  categories.forEach(c => console.log(`  ${c._id}: ${c.count}`));
  
  const total = await jobsCollection.countDocuments();
  const openPublic = await jobsCollection.countDocuments({ status: 'open', visibility: 'public' });
  console.log(`\nTotal: ${total} | Open+Public: ${openPublic}`);
  
  await mongoose.disconnect();
  console.log('✅ Category standardization complete.');
})().catch(e => console.error('ERROR:', e));
