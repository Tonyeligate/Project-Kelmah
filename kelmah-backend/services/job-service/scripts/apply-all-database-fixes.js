/**
 * APPLY ALL DATABASE FIXES
 * Comprehensive script to fix workers specializations and jobs status
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../../../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Profession → Specialization mapping
const PROFESSION_TO_SPECIALIZATION = {
  'Master Carpenter': ['Carpentry & Woodwork'],
  'Carpenter': ['Carpentry & Woodwork'],
  'Licensed Electrician': ['Electrical Work'],
  'Electrician': ['Electrical Work'],
  'Electrical Engineer': ['Electrical Work'],
  'Expert Plumber': ['Plumbing Services'],
  'Plumber': ['Plumbing Services'],
  'Master Plumber': ['Plumbing Services'],
  'Professional Mason': ['Masonry & Stonework'],
  'Mason': ['Masonry & Stonework'],
  'Bricklayer': ['Masonry & Stonework'],
  'Painting Specialist': ['Painting & Decoration'],
  'Painter': ['Painting & Decoration'],
  'Professional Painter': ['Painting & Decoration'],
  'HVAC Technician': ['HVAC & Climate Control'],
  'Air Conditioning Technician': ['HVAC & Climate Control'],
  'Roofing Expert': ['Roofing Services'],
  'Roofer': ['Roofing Services'],
  'Welding Specialist': ['Welding Services'],
  'Welder': ['Welding Services'],
  'Metal Worker': ['Welding Services'],
  'Tile & Flooring Expert': ['Tiling & Flooring'],
  'Tiler': ['Tiling & Flooring'],
  'Flooring Specialist': ['Tiling & Flooring'],
  'Landscaping Professional': ['Landscaping'],
  'Landscaper': ['Landscaping'],
  'Gardener': ['Landscaping'],
  'General Contractor': ['Construction & Building'],
  'Construction Supervisor': ['Construction & Building'],
  'Builder': ['Construction & Building'],
  'Drywall Specialist': ['General Maintenance'],
  'General Maintenance': ['General Maintenance']
};

const DRY_RUN = process.argv.includes('--live') ? false : true;

async function applyAllFixes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = mongoose.connection.db;
    const workersCollection = db.collection('users');
    const jobsCollection = db.collection('jobs');
    
    console.log('='.repeat(80));
    console.log('DATABASE INTEGRITY FIXES');
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log('='.repeat(80));
    
    // ===== FIX 1: WORKER SPECIALIZATIONS =====
    console.log('\n📋 FIX 1: WORKER SPECIALIZATIONS');
    console.log('-'.repeat(80));
    
    const workers = await workersCollection.find({ role: 'worker' }).toArray();
    let workersUpdated = 0;
    
    for (const worker of workers) {
      const profession = worker.profession;
      const currentSpecs = worker.specializations || [];
      const correctSpecs = PROFESSION_TO_SPECIALIZATION[profession] || ['General Maintenance'];
      
      const specsMatch = JSON.stringify(currentSpecs.sort()) === JSON.stringify(correctSpecs.sort());
      
      if (!specsMatch) {
        const fullName = `${worker.firstName} ${worker.lastName}`;
        console.log(`  ${fullName}: ${currentSpecs[0]} → ${correctSpecs[0]}`);
        
        if (!DRY_RUN) {
          await workersCollection.updateOne(
            { _id: worker._id },
            { $set: { specializations: correctSpecs } }
          );
        }
        workersUpdated++;
      }
    }
    
    console.log(`\nWorkers to update: ${workersUpdated}/${workers.length}`);
    
    // ===== FIX 2: JOB STATUS CAPITALIZATION =====
    console.log('\n📋 FIX 2: JOB STATUS & APPLICATION COUNT');
    console.log('-'.repeat(80));
    
    const jobs = await jobsCollection.find({}).toArray();
    let jobsUpdated = 0;
    
    for (const job of jobs) {
      const updates = {};
      
      // Fix status capitalization
      if (job.status) {
        const capitalizedStatus = job.status.charAt(0).toUpperCase() + job.status.slice(1);
        if (job.status !== capitalizedStatus) {
          updates.status = capitalizedStatus;
        }
      }
      
      // Fix missing applicationCount
      if (job.applicationCount === undefined) {
        updates.applicationCount = 0;
      }
      
      if (Object.keys(updates).length > 0) {
        console.log(`  ${job.title}`);
        if (updates.status) console.log(`    Status: ${job.status} → ${updates.status}`);
        if (updates.applicationCount !== undefined) console.log(`    ApplicationCount: undefined → 0`);
        
        if (!DRY_RUN) {
          await jobsCollection.updateOne(
            { _id: job._id },
            { $set: updates }
          );
        }
        jobsUpdated++;
      }
    }
    
    console.log(`\nJobs to update: ${jobsUpdated}/${jobs.length}`);
    
    // ===== SUMMARY =====
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log(`\nWorkers:`);
    console.log(`  Total: ${workers.length}`);
    console.log(`  ${DRY_RUN ? 'To Update' : 'Updated'}: ${workersUpdated}`);
    console.log(`\nJobs:`);
    console.log(`  Total: ${jobs.length}`);
    console.log(`  ${DRY_RUN ? 'To Update' : 'Updated'}: ${jobsUpdated}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN MODE - No changes applied');
      console.log('Run with --live flag to apply changes');
    } else {
      console.log('\n✅ All changes applied successfully');
    }
    console.log('='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyAllFixes();
