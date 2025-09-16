#!/usr/bin/env node

/**
 * Create or Update Gifty Test User
 * Ensures the test user exists with correct credentials for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB (assuming same connection as backend)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kelmah_db';

// User Schema (simplified version)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['hirer', 'worker'], default: 'worker' },
    isEmailVerified: { type: Boolean, default: true }, // Set to true for testing
    profileCompletion: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

/**
 * Create or update test user
 */
async function createOrUpdateGifty() {
    console.log('🎯 Creating/Updating Gifty Test User');
    console.log('====================================');
    
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const testUser = {
            email: 'giftyafisa@gmail.com',
            password: '1221122Ga',
            firstName: 'Gifty',
            lastName: 'Afisa',
            role: 'worker',
            isEmailVerified: true,
            profileCompletion: 85
        };

        // Hash the password
        console.log('🔒 Hashing password...');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(testUser.password, saltRounds);

        // Check if user exists
        console.log('🔍 Checking if user exists...');
        let user = await User.findOne({ email: testUser.email });

        if (user) {
            console.log('👤 User exists, updating credentials...');
            
            // Update existing user
            user.password = hashedPassword;
            user.firstName = testUser.firstName;
            user.lastName = testUser.lastName;
            user.role = testUser.role;
            user.isEmailVerified = true; // Ensure email is verified
            user.profileCompletion = testUser.profileCompletion;
            user.updatedAt = new Date();
            
            await user.save();
            console.log('✅ User updated successfully!');
        } else {
            console.log('➕ Creating new user...');
            
            // Create new user
            user = new User({
                ...testUser,
                password: hashedPassword
            });
            
            await user.save();
            console.log('✅ User created successfully!');
        }

        // Verify the user can login (test password hash)
        console.log('\n🧪 Testing password verification...');
        const isPasswordValid = await bcrypt.compare('1221122Ga', user.password);
        
        if (isPasswordValid) {
            console.log('✅ Password verification successful!');
        } else {
            console.log('❌ Password verification failed!');
        }

        console.log('\n📋 User Details:');
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Name: ${user.firstName} ${user.lastName}`);
        console.log(`   🎭 Role: ${user.role}`);
        console.log(`   ✉️  Email Verified: ${user.isEmailVerified}`);
        console.log(`   📊 Profile Completion: ${user.profileCompletion}%`);
        console.log(`   🆔 User ID: ${user._id}`);

        console.log('\n🎉 User setup completed! You can now test authentication.');

    } catch (error) {
        console.error('💥 Error setting up user:', error.message);
        
        if (error.code === 11000) {
            console.error('📧 Email already exists with different case or format');
        }
        
        process.exit(1);
    } finally {
        // Close MongoDB connection
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
}

/**
 * Create additional test users
 */
async function createAdditionalTestUsers() {
    console.log('\n➕ Creating additional test users...');
    
    const additionalUsers = [
        {
            email: 'test.worker@kelmah.com',
            password: 'TestWorker123!',
            firstName: 'Test',
            lastName: 'Worker',
            role: 'worker',
            isEmailVerified: true,
            profileCompletion: 90
        },
        {
            email: 'test.hirer@kelmah.com', 
            password: 'TestHirer123!',
            firstName: 'Test',
            lastName: 'Hirer',
            role: 'hirer',
            isEmailVerified: true,
            profileCompletion: 75
        }
    ];

    for (const userData of additionalUsers) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            
            let user = await User.findOne({ email: userData.email });
            
            if (!user) {
                user = new User({
                    ...userData,
                    password: hashedPassword
                });
                await user.save();
                console.log(`✅ Created user: ${userData.email}`);
            } else {
                console.log(`📧 User already exists: ${userData.email}`);
            }
        } catch (error) {
            console.log(`❌ Failed to create user ${userData.email}:`, error.message);
        }
    }
}

/**
 * Main function
 */
async function main() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        
        // Create/update Gifty
        await createOrUpdateGifty();
        
        // Create additional test users
        await createAdditionalTestUsers();
        
    } catch (error) {
        console.error('💥 Setup failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
