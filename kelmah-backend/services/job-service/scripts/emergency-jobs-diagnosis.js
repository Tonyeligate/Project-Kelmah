/**
 * EMERGENCY JOBS DIAGNOSIS
 * Critical Issue: All jobs disappeared (was 12, now 0)
 * Phase 2: Verify jobs data exists
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../../../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

async function diagnoseJobs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = mongoose.connection.db;
    const jobsCollection = db.collection('jobs');
    
    console.log('='.repeat(80));
    console.log('EMERGENCY JOBS DIAGNOSIS');
    console.log('='.repeat(80));
    
    // Check 1: Total jobs count
    const totalJobs = await jobsCollection.countDocuments({});
    console.log(`\n📊 Total Jobs in Database: ${totalJobs}`);
    
    if (totalJobs === 0) {
      console.log('❌ CRITICAL: Jobs collection is EMPTY!');
      console.log('   Action Required: Restore from backup or recreate jobs');
      process.exit(1);
    }
    
    // Check 2: Jobs by status
    console.log('\n📋 Jobs by Status:');
    const statuses = await jobsCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    statuses.forEach(s => {
      console.log(`   ${s._id || '(null)'}: ${s.count} jobs`);
    });
    
    // Check 3: Open jobs specifically
    const openJobs = await jobsCollection.countDocuments({ status: 'Open' });
    const openJobsLower = await jobsCollection.countDocuments({ status: 'open' });
    console.log(`\n✅ Open Jobs (capitalized): ${openJobs}`);
    console.log(`⚠️  Open Jobs (lowercase): ${openJobsLower}`);
    
    // Check 4: Sample job documents
    console.log('\n📄 Sample Job Documents:');
    const samples = await jobsCollection.find({}).limit(3).toArray();
    samples.forEach((job, i) => {
      console.log(`\nJob ${i + 1}:`);
      console.log(`  Title: ${job.title}`);
      console.log(`  Status: "${job.status}"`);
      console.log(`  City: ${job.location?.city || job.city || '(missing)'}`);
      console.log(`  Budget: ${job.budget} ${job.currency || 'GHS'}`);
      console.log(`  Category: ${job.category || job.primaryTrade || '(missing)'}`);
      console.log(`  Posted: ${job.createdAt}`);
    });
    
    // Check 5: Jobs with missing required fields
    console.log('\n🔍 Data Integrity Checks:');
    const noTitle = await jobsCollection.countDocuments({ 
      $or: [{ title: null }, { title: '' }, { title: { $exists: false } }] 
    });
    const noDescription = await jobsCollection.countDocuments({ 
      $or: [{ description: null }, { description: '' }, { description: { $exists: false } }] 
    });
    const noCity = await jobsCollection.countDocuments({
      $and: [
        { 'location.city': { $exists: false } },
        { city: { $exists: false } }
      ]
    });
    
    console.log(`   Jobs missing title: ${noTitle}`);
    console.log(`   Jobs missing description: ${noDescription}`);
    console.log(`   Jobs missing city: ${noCity}`);
    
    // Check 6: Text search test
    console.log('\n🔎 Text Search Test:');
    try {
      const paintingJobs = await jobsCollection.find({ 
        $text: { $search: 'painting' } 
      }).toArray();
      console.log(`   "painting" search: ${paintingJobs.length} jobs found`);
      if (paintingJobs.length > 0) {
        console.log(`   Example: ${paintingJobs[0].title}`);
      }
    } catch (error) {
      console.log(`   ❌ Text search failed: ${error.message}`);
      console.log('   Text index may be missing - will need to create it');
    }
    
    // Check 7: API query simulation
    console.log('\n🔌 API Query Simulation:');
    
    // Simulate GET /api/jobs (default query)
    const defaultQuery = await jobsCollection.find({}).limit(10).toArray();
    console.log(`   GET /api/jobs (no filters): ${defaultQuery.length} jobs`);
    
    // Simulate with status filter
    const statusQuery = await jobsCollection.find({ status: 'Open' }).limit(10).toArray();
    console.log(`   GET /api/jobs?status=Open: ${statusQuery.length} jobs`);
    
    // Check 8: Index verification
    console.log('\n📑 Index Verification:');
    const indexes = await jobsCollection.indexes();
    const hasTextIndex = indexes.some(idx => idx.name && idx.name.includes('text'));
    console.log(`   Text index exists: ${hasTextIndex ? 'YES ✅' : 'NO ❌'}`);
    
    if (!hasTextIndex) {
      console.log('   Creating text index...');
      await jobsCollection.createIndex({ 
        title: 'text', 
        description: 'text', 
        requiredSkills: 'text',
        category: 'text'
      });
      console.log('   ✅ Text index created');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(80));
    
    if (totalJobs > 0 && openJobs === 0 && openJobsLower > 0) {
      console.log('\n⚠️  ISSUE IDENTIFIED: Status capitalization mismatch');
      console.log('   Jobs have lowercase "open" but API queries for "Open"');
      console.log('   Solution: Update job statuses to capitalized "Open"');
    } else if (totalJobs > 0 && openJobs > 0) {
      console.log('\n✅ Jobs data appears intact');
      console.log('   Issue may be in frontend API call or backend routing');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

diagnoseJobs();
