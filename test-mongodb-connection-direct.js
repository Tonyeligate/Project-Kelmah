#!/usr/bin/env node
/**
 * Direct MongoDB connection test
 * Tests if MongoDB Atlas connection works from local machine
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('❌ MONGODB_URI not set in environment');
        process.exit(1);
    }

    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI (sanitized):', mongoUri.replace(/:[^@]+@/, ':****@'));

    try {
        console.log('Connecting...');
        const start = Date.now();

        const conn = await mongoose.connect(mongoUri, {
            dbName: 'kelmah_platform',
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });

        const elapsed = Date.now() - start;
        console.log(`✅ Connection successful in ${elapsed}ms`);
        console.log('Connection state:', mongoose.connection.readyState);
        console.log('Connection host:', mongoose.connection.host);
        console.log('Connection db:', mongoose.connection.name);

        // Try a simple operation
        console.log('\nTesting write operation...');

        const testSchema = new mongoose.Schema({ test: String });
        const TestModel = mongoose.model('Test', testSchema);

        const doc = new TestModel({ test: `Connection test at ${new Date().toISOString()}` });
        const saved = await doc.save();
        console.log('✅ Write successful:', saved._id);

        // Clean up
        await TestModel.deleteOne({ _id: saved._id });
        console.log('✅ Cleanup successful');

        await mongoose.disconnect();
        console.log('✅ Disconnected');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

test();
