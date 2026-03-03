require('../kelmah-backend/dns-fix');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const URI = process.env.MONGODB_URI || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';
console.log('Connecting to:', URI.substring(0, 60) + '...');

(async () => {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  
  // Count total jobs
  const totalJobs = await db.collection('jobs').countDocuments();
  console.log('Total jobs in DB:', totalJobs);
  
  // Count by status
  const statuses = await db.collection('jobs').aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\nJobs by status:');
  statuses.forEach(s => console.log('  ', s._id, ':', s.count));
  
  // Count by boolean flags
  const activeCount = await db.collection('jobs').countDocuments({ isActive: true });
  const deletedCount = await db.collection('jobs').countDocuments({ isDeleted: true });
  const publishedCount = await db.collection('jobs').countDocuments({ isPublished: true });
  const draftCount = await db.collection('jobs').countDocuments({ isDraft: true });
  console.log('\nisActive:', activeCount);
  console.log('isDeleted:', deletedCount);
  console.log('isPublished:', publishedCount);
  console.log('isDraft:', draftCount);
  
  // Check for visibility-related fields
  const visibilityAgg = await db.collection('jobs').aggregate([
    { $group: { 
      _id: null,
      hasIsActive: { $sum: { $cond: [{ $ifNull: ['$isActive', false] }, 1, 0] } },
      hasIsDeleted: { $sum: { $cond: [{ $ifNull: ['$isDeleted', false] }, 1, 0] } },
      hasIsPublished: { $sum: { $cond: [{ $ifNull: ['$isPublished', false] }, 1, 0] } },
      missingIsActive: { $sum: { $cond: [{ $eq: [{ $type: '$isActive' }, 'missing'] }, 1, 0] } },
      missingStatus: { $sum: { $cond: [{ $eq: [{ $type: '$status' }, 'missing'] }, 1, 0] } },
    }}
  ]).toArray();
  console.log('\nVisibility field analysis:', JSON.stringify(visibilityAgg[0], null, 2));
  
  // Get ALL jobs with key fields
  const allJobs = await db.collection('jobs').find({}, {
    projection: { title: 1, status: 1, isActive: 1, isDeleted: 1, isPublished: 1, isDraft: 1, category: 1, createdAt: 1, budget: 1, location: 1, postedBy: 1, hirerId: 1, userId: 1, employer: 1 }
  }).toArray();
  
  console.log('\n=== ALL JOBS SUMMARY ===');
  allJobs.forEach((j, i) => {
    const poster = j.hirerId || j.postedBy || j.userId || j.employer || 'NO_POSTER';
    console.log(`${i+1}. "${j.title}" | status=${j.status} | isActive=${j.isActive} | isDeleted=${j.isDeleted} | cat=${j.category} | poster=${poster} | created=${j.createdAt}`);
  });
  
  // Get ONE full job document to see complete structure
  const fullDoc = await db.collection('jobs').findOne({});
  console.log('\n=== FULL DOCUMENT STRUCTURE (first job) ===');
  console.log(JSON.stringify(fullDoc, null, 2));
  
  await mongoose.disconnect();
})().catch(e => console.error('ERROR:', e.message));
