const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority';

(async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // ===== CHECK JOBS COLLECTION =====
        console.log('=' * 60);
        console.log('🔍 JOBS COLLECTION AUDIT');
        console.log('='.repeat(60));

        const jobsCollection = db.collection('jobs');
        const jobsCount = await jobsCollection.countDocuments();
        console.log(`\n📊 Documents: ${jobsCount}`);

        // Get indexes
        const jobIndexes = await jobsCollection.listIndexes().toArray();
        console.log(`\n📑 Indexes (${jobIndexes.length} total):`);
        for (const idx of jobIndexes) {
            console.log(`  • ${JSON.stringify(idx.key)}`);
        }

        // Check a sample job document
        if (jobsCount > 0) {
            const sampleJob = await jobsCollection.findOne({});
            console.log('\n📋 Sample Job Structure:');
            console.log(JSON.stringify(sampleJob, null, 2).split('\n').slice(0, 50).join('\n'));

            // Check for schema mismatches
            console.log('\n🔎 Field Type Analysis:');
            const requiredFields = ['title', 'description', 'category', 'skills', 'budget', 'paymentType', 'location', 'hirer'];
            for (const field of requiredFields) {
                const value = sampleJob[field];
                const type = Array.isArray(value) ? 'array' : typeof value;
                const hasValue = value !== null && value !== undefined;
                const status = hasValue ? '✓' : '✗';
                console.log(`    ${status} ${field}: ${type} ${hasValue ? `(present)` : '(MISSING!)'}`);
            }
        }

        // ===== CHECK USERS COLLECTION =====
        console.log('\n\n' + '='.repeat(60));
        console.log('🔍 USERS COLLECTION AUDIT');
        console.log('='.repeat(60));

        const usersCollection = db.collection('users');
        const usersCount = await usersCollection.countDocuments();
        console.log(`\n📊 Documents: ${usersCount}`);

        const userIndexes = await usersCollection.listIndexes().toArray();
        console.log(`\n📑 Indexes (${userIndexes.length} total):`);
        for (const idx of userIndexes) {
            console.log(`  • ${JSON.stringify(idx.key)}`);
        }

        if (usersCount > 0) {
            const sampleUser = await usersCollection.findOne({});
            console.log('\n📋 Sample User Structure:');
            const userStr = JSON.stringify(sampleUser, null, 2).split('\n').slice(0, 40).join('\n');
            console.log(userStr);

            console.log('\n🔎 Field Type Analysis:');
            const userFields = ['firstName', 'lastName', 'email', 'password', 'role', 'isEmailVerified'];
            for (const field of userFields) {
                const value = sampleUser[field];
                const type = Array.isArray(value) ? 'array' : typeof value;
                const hasValue = value !== null && value !== undefined;
                const status = hasValue ? '✓' : '✗';
                console.log(`    ${status} ${field}: ${type} ${hasValue ? `(present)` : '(MISSING!)'}`);
            }
        }

        // ===== CHECK APPLICATIONS COLLECTION =====
        console.log('\n\n' + '='.repeat(60));
        console.log('🔍 APPLICATIONS COLLECTION AUDIT');
        console.log('='.repeat(60));

        const appCollection = db.collection('applications');
        const appCount = await appCollection.countDocuments();
        console.log(`\n📊 Documents: ${appCount}`);

        const appIndexes = await appCollection.listIndexes().toArray();
        console.log(`\n📑 Indexes (${appIndexes.length} total):`);
        for (const idx of appIndexes) {
            console.log(`  • ${JSON.stringify(idx.key)}`);
        }

        // ===== RECOMMENDATIONS =====
        console.log('\n\n' + '='.repeat(60));
        console.log('💡 RECOMMENDATIONS');
        console.log('='.repeat(60));

        const recommendations = [];

        // Check jobs collection indexes
        const hasJobHirerIndex = jobIndexes.some(idx => idx.key.hirer === 1);
        const hasJobStatusIndex = jobIndexes.some(idx => idx.key.status === 1);
        const hasJobCreatedIndex = jobIndexes.some(idx => idx.key.createdAt === 1);

        if (!hasJobHirerIndex) recommendations.push('❌ Missing index on jobs.hirer - will slow job retrieval by hirer');
        if (!hasJobStatusIndex) recommendations.push('❌ Missing index on jobs.status - will slow job filtering');
        if (!hasJobCreatedIndex) recommendations.push('❌ Missing index on jobs.createdAt - will slow sorting');

        // Check users collection indexes
        const hasEmailIndex = userIndexes.some(idx => idx.key.email === 1);
        if (!hasEmailIndex) recommendations.push('❌ Missing unique index on users.email - duplicate emails possible');

        // Check applications collection indexes
        const hasAppJobWorkerIndex = appIndexes.some(idx =>
            (idx.key.job === 1 || idx.key.job === -1) &&
            (idx.key.worker === 1 || idx.key.worker === -1)
        );
        if (!hasAppJobWorkerIndex) recommendations.push('❌ Missing compound index on applications (job, worker) - unique constraint not enforced');

        if (recommendations.length === 0) {
            console.log('✓ All recommended indexes are present');
        } else {
            recommendations.forEach(rec => console.log(`\n${rec}`));
            console.log('\n📝 ACTION NEEDED: Run "node fix-database-indexes.js" to create missing indexes');
        }

        console.log('\n\n' + '='.repeat(60));
        console.log('🔧 DATABASE STRUCTURE STATUS');
        console.log('='.repeat(60));
        console.log('\n✓ Connected collections:', [
            jobsCount > 0 ? '✓ jobs' : '✗ jobs (empty)',
            usersCount > 0 ? '✓ users' : '✗ users (empty)',
            appCount >= 0 ? `✓ applications` : '✗ applications'
        ].join(', '));

        await mongoose.disconnect();
        console.log('\n✓ Audit complete');

    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
})();
