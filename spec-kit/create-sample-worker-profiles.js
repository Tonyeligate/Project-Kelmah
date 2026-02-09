/**
 * Create Sample Worker Profiles Script
 * Creates sample WorkerProfile documents for existing users to populate dashboard
 */

const mongoose = require('mongoose');

// Use same MongoDB connection as user service
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

console.log('🔌 Connecting to MongoDB...');

mongoose.connect(mongoUri)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        try {
            // Import models
            const User = require('./kelmah-backend/services/user-service/models/User');
            const { WorkerProfile } = require('./kelmah-backend/services/user-service/models');

            // Get existing users with worker role
            const workers = await User.find({ role: 'worker' }).limit(10);
            console.log(`📊 Found ${workers.length} worker users`);

            if (workers.length === 0) {
                console.log('❌ No worker users found. Creating a sample user first...');

                // Create a sample worker user
                const sampleUser = new User({
                    firstName: 'John',
                    lastName: 'Carpenter',
                    email: 'john.carpenter@example.com',
                    phone: '+233241234567',
                    password: '$2a$12$LQv3c1yqBwlV7ksF4xnPZuEiDx8z2J9.ZGKmPczxTvTqoKjF8gS.K', // hashed "TestUser123!"
                    role: 'worker',
                    isEmailVerified: true,
                    isActive: true
                });

                const savedUser = await sampleUser.save();
                workers.push(savedUser);
                console.log('✅ Created sample worker user');
            }

            // Create WorkerProfile documents for users who don't have them
            let profilesCreated = 0;
            const skills = [
                'Carpentry', 'Plumbing', 'Electrical Work', 'Masonry', 'Painting',
                'Roofing', 'Welding', 'HVAC', 'Tiling', 'Landscaping'
            ];

            for (let user of workers) {
                // Check if profile already exists
                const existingProfile = await WorkerProfile.findOne({ userId: user._id });
                if (existingProfile) {
                    console.log(`📋 Profile already exists for ${user.firstName} ${user.lastName}`);
                    continue;
                }

                // Create new WorkerProfile
                const profile = new WorkerProfile({
                    userId: user._id,
                    bio: `Experienced ${skills[Math.floor(Math.random() * skills.length)].toLowerCase()} professional with years of hands-on experience in residential and commercial projects.`,
                    hourlyRate: Math.floor(Math.random() * 50) + 20, // 20-70 GHS
                    currency: 'GHS',
                    location: ['Accra', 'Kumasi', 'Tamale', 'Cape Coast'][Math.floor(Math.random() * 4)],
                    isAvailable: true,
                    availabilityStatus: 'available',
                    experienceLevel: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
                    yearsOfExperience: Math.floor(Math.random() * 15) + 1,
                    skills: [skills[Math.floor(Math.random() * skills.length)]],
                    rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
                    totalJobs: Math.floor(Math.random() * 50),
                    completedJobs: Math.floor(Math.random() * 40),
                    totalReviews: Math.floor(Math.random() * 20),
                    isVerified: Math.random() > 0.5,
                    lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) // Last 7 days
                });

                await profile.save();
                profilesCreated++;
                console.log(`✅ Created profile for ${user.firstName} ${user.lastName}`);
            }

            console.log(`\n🎉 Successfully created ${profilesCreated} worker profiles`);

            // Verify data
            const totalUsers = await User.countDocuments();
            const totalWorkers = await WorkerProfile.countDocuments();
            const availableWorkers = await WorkerProfile.countDocuments({ isAvailable: true });

            console.log('\n📊 Database Summary:');
            console.log(`   Total Users: ${totalUsers}`);
            console.log(`   Total Worker Profiles: ${totalWorkers}`);
            console.log(`   Available Workers: ${availableWorkers}`);

        } catch (error) {
            console.error('❌ Error creating profiles:', error);
        }

    })
    .catch(error => {
        console.error('❌ MongoDB connection failed:', error);
    })
    .finally(() => {
        console.log('🔌 MongoDB connection closed');
        mongoose.connection.close();
        process.exit(0);
    });
