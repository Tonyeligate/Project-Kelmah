/**
 * Test MongoDB Connection from Render Environment
 * This script tests if Render can connect to MongoDB Atlas
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

console.log('🔍 Testing MongoDB connection from current environment...');
console.log('📍 Target:', MONGODB_URI.substring(0, 50) + '...');

const testConnection = async () => {
    try {
        console.log('⏳ Attempting connection with 10 second timeout...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000
        });

        console.log('✅ SUCCESS: MongoDB connection established');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🖥️  Host: ${mongoose.connection.host}`);
        console.log(`🔌 Ready State: ${mongoose.connection.readyState} (1 = connected)`);

        // Try a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📚 Collections found: ${collections.length}`);
        collections.forEach(col => console.log(`   - ${col.name}`));

        await mongoose.disconnect();
        console.log('✅ Disconnected successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ MONGODB CONNECTION FAILED');
        console.error(`📛 Error Message: ${error.message}`);
        console.error(`📛 Error Name: ${error.name}`);
        if (error.reason) {
            console.error(`📛 Reason:`, error.reason);
        }
        console.error('\n💡 Common causes:');
        console.error('   1. MongoDB Atlas IP whitelist not configured for Render IPs');
        console.error('   2. Incorrect credentials in connection string');
        console.error('   3. Network connectivity issues from Render to MongoDB Atlas');
        console.error('   4. MongoDB Atlas cluster paused or unavailable');
        console.error('\n🔧 Solution for Render deployment:');
        console.error('   Add 0.0.0.0/0 to MongoDB Atlas IP whitelist (Network Access)');
        console.error('   Or add specific Render IP ranges if available');
        process.exit(1);
    }
};

testConnection();
