/**
 * FIX WORKER SPECIALIZATIONS
 * Maps profession field to correct specializations array
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../../../.env' });

const MONGODB_URI = process.env.JOB_MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Missing MongoDB connection string. Set JOB_MONGO_URI or MONGODB_URI.');
  process.exit(1);
}

// Profession → Specialization mapping
const PROFESSION_TO_SPECIALIZATION = {
  // Carpentry
  'Master Carpenter': ['Carpentry & Woodwork'],
  'Carpenter': ['Carpentry & Woodwork'],
  
  // Electrical
  'Licensed Electrician': ['Electrical Work'],
  'Electrician': ['Electrical Work'],
  'Electrical Engineer': ['Electrical Work'],
  
  // Plumbing
  'Expert Plumber': ['Plumbing Services'],
  'Plumber': ['Plumbing Services'],
  'Master Plumber': ['Plumbing Services'],
  
  // Masonry
  'Professional Mason': ['Masonry & Stonework'],
  'Mason': ['Masonry & Stonework'],
  'Bricklayer': ['Masonry & Stonework'],
  
  // Painting
  'Painting Specialist': ['Painting & Decoration'],
  'Painter': ['Painting & Decoration'],
  'Professional Painter': ['Painting & Decoration'],
  
  // HVAC
  'HVAC Technician': ['HVAC & Climate Control'],
  'Air Conditioning Technician': ['HVAC & Climate Control'],
  
  // Roofing
  'Roofing Expert': ['Roofing Services'],
  'Roofer': ['Roofing Services'],
  
  // Welding
  'Welding Specialist': ['Welding Services'],
  'Welder': ['Welding Services'],
  'Metal Worker': ['Welding Services'],
  
  // Tiling
  'Tile & Flooring Expert': ['Tiling & Flooring'],
  'Tiler': ['Tiling & Flooring'],
  'Flooring Specialist': ['Tiling & Flooring'],
  
  // Landscaping
  'Landscaping Professional': ['Landscaping'],
  'Landscaper': ['Landscaping'],
  'Gardener': ['Landscaping'],
  
  // Construction
  'General Contractor': ['Construction & Building'],
  'Construction Supervisor': ['Construction & Building'],
  'Builder': ['Construction & Building'],
  
  // Drywall
  'Drywall Specialist': ['General Maintenance'], // Could also be Construction
  
  // Default
  'General Maintenance': ['General Maintenance']
};

const DRY_RUN = process.argv.includes('--live') ? false : true;

async function fixSpecializations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = mongoose.connection.db;
    const workersCollection = db.collection('users');
    
    const workers = await workersCollection.find({ role: 'worker' }).toArray();
    
    console.log(`Found ${workers.length} workers to process`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);
    
    let updatedCount = 0;
    let unchangedCount = 0;
    
    for (const worker of workers) {
      const profession = worker.profession;
      const currentSpecs = worker.specializations || [];
      
      // Get correct specialization based on profession
      const correctSpecs = PROFESSION_TO_SPECIALIZATION[profession] || ['General Maintenance'];
      
      // Check if update needed
      const specsMatch = JSON.stringify(currentSpecs.sort()) === JSON.stringify(correctSpecs.sort());
      
      if (!specsMatch) {
        const fullName = `${worker.firstName} ${worker.lastName}`;
        console.log(`📝 UPDATE: ${fullName}`);
        console.log(`   Profession: ${profession}`);
        console.log(`   Current: [${currentSpecs.join(', ')}]`);
        console.log(`   New: [${correctSpecs.join(', ')}]`);
        
        if (!DRY_RUN) {
          await workersCollection.updateOne(
            { _id: worker._id },
            { $set: { specializations: correctSpecs } }
          );
          console.log(`   ✅ Updated`);
        } else {
          console.log(`   ⏸️  Would update (DRY RUN)`);
        }
        updatedCount++;
      } else {
        unchangedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Total Workers: ${workers.length}`);
    console.log(`To Update: ${updatedCount}`);
    console.log(`Unchanged: ${unchangedCount}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN MODE - No changes applied');
      console.log('Run with --live flag to apply changes');
    } else {
      console.log('\n✅ Changes applied successfully');
    }
    console.log('='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixSpecializations();
