#!/usr/bin/env node

/**
 * Unlock User Account
 * Clears account lockout after failed login attempts
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// User Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    role: String,
    isEmailVerified: Boolean,
    failedLoginAttempts: Number,
    accountLockedUntil: Date,
    loginAttempts: Number,
    lockUntil: Date,
    updatedAt: Date
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function unlockAccount(email) {
    console.log('🔓 Unlocking User Account');
    console.log('========================\n');
    
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find user
        console.log(`🔍 Looking for user: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found!');
            process.exit(1);
        }

        console.log('👤 User found!');
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        
        // Check lockout status
        if (user.failedLoginAttempts > 0 || user.accountLockedUntil || user.loginAttempts > 0 || user.lockUntil) {
            console.log(`\n🔒 Current Lockout Status:`);
            console.log(`   Failed Login Attempts: ${user.failedLoginAttempts || 0}`);
            console.log(`   Account Locked Until: ${user.accountLockedUntil ? new Date(user.accountLockedUntil).toLocaleString() : 'Not locked'}`);
            console.log(`   Login Attempts (legacy): ${user.loginAttempts || 0}`);
            console.log(`   Lock Until (legacy): ${user.lockUntil ? new Date(user.lockUntil).toLocaleString() : 'Not locked'}`);
            
            // Clear all lockout fields
            console.log('\n🔧 Clearing all lockout fields...');
            user.failedLoginAttempts = 0;
            user.accountLockedUntil = undefined;
            user.loginAttempts = 0;
            user.lockUntil = undefined;
            user.updatedAt = new Date();
            await user.save();
            
            console.log('✅ Account unlocked successfully!');
        } else {
            console.log('\n✅ Account is not locked');
        }

        console.log('\n🎉 Account is ready for login!');
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔑 Use password: 11221122Tg`);

    } catch (error) {
        console.error('💥 Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
    }
}

// Run with email from command line or default to Gifty
const email = process.argv[2] || 'giftyafisa@gmail.com';
unlockAccount(email);
