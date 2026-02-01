const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority';

(async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected\n');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        // Focus on main collections
        const mainCollections = [
            'users', 'jobs', 'applications', 'workerprofiles',
            'messages', 'conversations', 'reviews', 'payments', 'contracts'
        ];

        console.log('=== MAIN COLLECTIONS IN KELMAH DATABASE ===\n');

        for (const collName of mainCollections) {
            const exists = collections.find(c => c.name === collName);
            if (!exists) {
                console.log(`❌ ${collName}: NOT FOUND\n`);
                continue;
            }

            const coll = db.collection(collName);
            const stats = await coll.stats().catch(() => null);
            const count = stats?.count || 0;
            const sampleDoc = await coll.findOne({});

            console.log(`✓ ${collName.toUpperCase()}`);
            console.log(`  Documents: ${count}`);

            if (sampleDoc) {
                console.log(`  Sample fields:`);
                const keys = Object.keys(sampleDoc).filter(k => k !== '_id' && k !== '__v');
                keys.forEach(key => {
                    const val = sampleDoc[key];
                    const type = Array.isArray(val) ? 'array' : typeof val;
                    console.log(`    • ${key} (${type}): ${JSON.stringify(val).substring(0, 50)}`);
                });
            }
            console.log();
        }

        // Get all collections
        console.log('\n=== ALL COLLECTIONS (TOTAL: ' + collections.length + ') ===\n');
        for (const col of collections.sort((a, b) => a.name.localeCompare(b.name))) {
            const coll = db.collection(col.name);
            const count = await coll.countDocuments();
            console.log(`  • ${col.name}: ${count} documents`);
        }

        await mongoose.disconnect();
        console.log('\n✓ Done');

    } catch (error) {
        console.error('✗ Error:', error.message);
    }
})();
