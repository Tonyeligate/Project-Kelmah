const mongoose = require('mongoose');

// MongoDB Atlas connection
const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority';

(async () => {
    try {
        console.log('Connecting to MongoDB...\n');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB Atlas\n');

        const db = mongoose.connection.db;

        // Get all collections
        const collections = await db.listCollections().toArray();
        console.log('=== COLLECTIONS IN DATABASE ===\n');
        console.log(`Found ${collections.length} collections:\n`);

        for (const collection of collections) {
            const collName = collection.name;
            console.log(`\n📋 Collection: "${collName}"`);
            console.log('─'.repeat(60));

            const coll = db.collection(collName);

            // Get collection stats
            const stats = await coll.stats();
            console.log(`  Documents: ${stats.count}`);
            console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`  Avg Doc Size: ${(stats.avgObjSize / 1024).toFixed(2)} KB`);

            // Get schema/indexes
            try {
                const indexes = await coll.listIndexes().toArray();
                console.log(`  Indexes: ${indexes.length}`);
            } catch (e) {
                console.log(`  Indexes: (unable to retrieve)`);
            }

            // Sample document
            const sampleDoc = await coll.findOne({});
            if (sampleDoc) {
                console.log('\n  📄 Sample Document:');
                console.log(JSON.stringify(sampleDoc, null, 4));
            } else {
                console.log('  (Empty collection - no documents)');
            }

            // Show all fields in collection
            const fields = await coll.aggregate([
                { $project: { fields: { $objectToArray: '$$ROOT' } } },
                { $unwind: '$fields' },
                { $group: { _id: '$fields.k', types: { $addToSet: { $type: '$fields.v' } } } },
                { $sort: { _id: 1 } }
            ]).toArray();

            console.log('\n  📊 Fields in Collection:');
            for (const field of fields) {
                console.log(`    • ${field._id}: [${field.types.join(', ')}]`);
            }
        }

        console.log('\n\n=== SCHEMA DEFINITIONS (from models) ===\n');

        // Load all models to show schemas
        const modelPaths = [
            './kelmah-backend/shared/models/User.js',
            './kelmah-backend/shared/models/Job.js',
            './kelmah-backend/shared/models/Application.js',
            './kelmah-backend/shared/models/Message.js',
            './kelmah-backend/shared/models/Review.js',
            './kelmah-backend/shared/models/Contract.js',
            './kelmah-backend/shared/models/Payment.js'
        ];

        for (const modelPath of modelPaths) {
            try {
                const model = require(modelPath);
                if (model.schema) {
                    console.log(`\n📦 ${model.modelName || 'Unknown'} Schema:`);
                    console.log('─'.repeat(60));
                    const paths = model.schema.paths;
                    for (const [pathName, schemaType] of Object.entries(paths)) {
                        if (pathName === '_id' || pathName === '__v') continue;
                        const type = schemaType.instance || schemaType.constructor.name;
                        const required = schemaType.required ? '[REQUIRED]' : '';
                        const defaultVal = schemaType.defaultValue ? `(default: ${schemaType.defaultValue})` : '';
                        console.log(`  • ${pathName}: ${type} ${required} ${defaultVal}`);
                    }
                }
            } catch (e) {
                // Model might not exist
            }
        }

        console.log('\n\n=== DATA STORAGE REQUIREMENTS ===\n');
        console.log('Based on the schema analysis:');
        console.log('1. All data is stored as JSON documents (MongoDB)');
        console.log('2. No fixed "tables" or "columns" - flexible schema');
        console.log('3. Data types vary by field (String, Number, ObjectId, Array, etc.)');
        console.log('4. Required fields must be provided when creating documents');
        console.log('5. Optional fields can be omitted and added later\n');

        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB\n');

    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
})();
