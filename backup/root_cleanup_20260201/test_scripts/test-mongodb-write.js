/**
 * Test MongoDB write operations
 * Run this locally to verify MongoDB Atlas connectivity
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority';

async function testMongoDBWrite() {
    console.log('🔗 Connecting to MongoDB Atlas...');

    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            w: 1
        });

        console.log('✅ Connected to MongoDB!');
        console.log('📊 Database:', mongoose.connection.name);
        console.log('🏠 Host:', mongoose.connection.host);

        // Simple test schema
        const TestSchema = new mongoose.Schema({
            message: String,
            createdAt: { type: Date, default: Date.now }
        });

        const TestModel = mongoose.model('ConnectionTest', TestSchema);

        // Try to write
        console.log('\n📝 Testing write operation...');
        const startWrite = Date.now();
        const doc = await TestModel.create({ message: 'Test from local machine at ' + new Date().toISOString() });
        const writeTime = Date.now() - startWrite;

        console.log('✅ Write successful!');
        console.log('📄 Document ID:', doc._id);
        console.log('⏱️ Write time:', writeTime, 'ms');

        // Clean up
        await TestModel.deleteOne({ _id: doc._id });
        console.log('🧹 Cleaned up test document');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error name:', error.name);
        if (error.reason) {
            console.error('Reason:', JSON.stringify(error.reason, null, 2));
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testMongoDBWrite();
