/**
 * Check MongoDB job collection structure and existing data
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

async function checkJobCollection() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // List all collections
        console.log('📋 Collections in database:');
        const collections = await db.listCollections().toArray();
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });
        console.log('');

        // Check if jobs collection exists
        const jobsCollectionExists = collections.some(col => col.name === 'jobs');
        console.log(`📦 Jobs collection exists: ${jobsCollectionExists}\n`);

        if (jobsCollectionExists) {
            // Get collection stats
            const stats = await db.collection('jobs').stats();
            console.log('📊 Jobs collection stats:');
            console.log(`  - Document count: ${stats.count}`);
            console.log(`  - Size: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`  - Indexes: ${stats.nindexes}`);
            console.log('');

            // Get indexes
            console.log('🔍 Indexes on jobs collection:');
            const indexes = await db.collection('jobs').indexes();
            indexes.forEach(idx => {
                console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
            });
            console.log('');

            // Get sample document
            console.log('📄 Sample job document (if any):');
            const sampleJob = await db.collection('jobs').findOne({});
            if (sampleJob) {
                console.log('  Fields in existing job:');
                Object.keys(sampleJob).forEach(key => {
                    const value = sampleJob[key];
                    const type = Array.isArray(value) ? 'array' : typeof value;
                    console.log(`    - ${key}: ${type}`);
                });
                console.log('\n  Full sample document:');
                console.log(JSON.stringify(sampleJob, null, 2));
            } else {
                console.log('  No jobs found in collection');
            }
        } else {
            console.log('❌ Jobs collection does not exist!');
            console.log('   This is why insertOne() is timing out.');
            console.log('   With autoCreate: false, Mongoose cannot create the collection.');
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

checkJobCollection();
