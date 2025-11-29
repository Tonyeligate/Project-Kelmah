const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority';

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      w: 0, // Unacknowledged writes
      j: false,
      retryWrites: false
    });
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // ===== FIX JOBS COLLECTION =====
    console.log('🔧 FIXING JOBS COLLECTION...\n');

    const jobsCollection = db.collection('jobs');

    // 1. Fix hirer field - ensure it's ObjectId, not string
    console.log('  1️⃣ Converting hirer strings to ObjectIds...');
    const jobs = await jobsCollection.find({ hirer: { $type: 'string' } }).toArray();
    if (jobs.length > 0) {
      for (const job of jobs) {
        await jobsCollection.updateOne(
          { _id: job._id },
          { $set: { hirer: new mongoose.Types.ObjectId(job.hirer) } }
        );
      }
      console.log(`     ✓ Fixed ${jobs.length} jobs with string hirer`);
    } else {
      console.log('     ✓ All hirers already ObjectIds');
    }

    // 2. Fix worker field - ensure it's ObjectId, not string
    console.log('\n  2️⃣ Converting worker strings to ObjectIds...');
    const jobsWithWorker = await jobsCollection.find({ 
      worker: { $type: 'string' } 
    }).toArray();
    if (jobsWithWorker.length > 0) {
      for (const job of jobsWithWorker) {
        await jobsCollection.updateOne(
          { _id: job._id },
          { $set: { worker: new mongoose.Types.ObjectId(job.worker) } }
        );
      }
      console.log(`     ✓ Fixed ${jobsWithWorker.length} jobs with string worker`);
    } else {
      console.log('     ✓ All workers already ObjectIds or null');
    }

    // 3. Add missing indexes
    console.log('\n  3️⃣ Adding missing indexes...');
    
    try {
      await jobsCollection.createIndex({ hirer: 1 });
      console.log('     ✓ Created index on hirer');
    } catch (e) {
      console.log('     • Index on hirer already exists');
    }

    try {
      await jobsCollection.createIndex({ status: 1, hirer: 1, createdAt: -1 });
      console.log('     ✓ Created compound index on (status, hirer, createdAt)');
    } catch (e) {
      console.log('     • Compound index already exists');
    }

    // ===== FIX APPLICATIONS COLLECTION =====
    console.log('\n🔧 FIXING APPLICATIONS COLLECTION...\n');

    const appCollection = db.collection('applications');

    console.log('  1️⃣ Converting worker strings to ObjectIds...');
    const appsWithWorker = await appCollection.find({ 
      worker: { $type: 'string' } 
    }).toArray();
    if (appsWithWorker.length > 0) {
      for (const app of appsWithWorker) {
        await appCollection.updateOne(
          { _id: app._id },
          { $set: { worker: new mongoose.Types.ObjectId(app.worker) } }
        );
      }
      console.log(`     ✓ Fixed ${appsWithWorker.length} applications with string worker`);
    } else {
      console.log('     ✓ All workers already ObjectIds');
    }

    console.log('\n  2️⃣ Converting job strings to ObjectIds...');
    const appsWithJob = await appCollection.find({ 
      job: { $type: 'string' } 
    }).toArray();
    if (appsWithJob.length > 0) {
      for (const app of appsWithJob) {
        await appCollection.updateOne(
          { _id: app._id },
          { $set: { job: new mongoose.Types.ObjectId(app.job) } }
        );
      }
      console.log(`     ✓ Fixed ${appsWithJob.length} applications with string job`);
    } else {
      console.log('     ✓ All jobs already ObjectIds');
    }

    // ===== FIX USERS COLLECTION =====
    console.log('\n🔧 FIXING USERS COLLECTION...\n');

    const usersCollection = db.collection('users');

    console.log('  1️⃣ Ensuring email field is unique...');
    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      console.log('     ✓ Created unique index on email');
    } catch (e) {
      if (e.message.includes('duplicate')) {
        console.log('     ⚠️  Cannot create unique index - duplicate emails exist');
        const dupeEmails = await usersCollection.aggregate([
          { $group: { _id: '$email', count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } }
        ]).toArray();
        console.log(`     Found ${dupeEmails.length} duplicate email(s)`);
      } else {
        console.log('     • Unique index on email already exists');
      }
    }

    // ===== VERIFICATION =====
    console.log('\n✅ DATABASE FIXES COMPLETE\n');
    console.log('📊 Verification:');

    const fixedJobsCount = await jobsCollection.countDocuments();
    const fixedAppsCount = await appCollection.countDocuments();
    const fixedUsersCount = await usersCollection.countDocuments();

    console.log(`   • Jobs: ${fixedJobsCount} documents`);
    console.log(`   • Applications: ${fixedAppsCount} documents`);
    console.log(`   • Users: ${fixedUsersCount} documents`);

    console.log('\n✓ Database is now properly structured for job creation!');

    await mongoose.disconnect();

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
})();
