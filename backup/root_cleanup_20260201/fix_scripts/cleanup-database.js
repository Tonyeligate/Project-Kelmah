/**
 * Database Cleanup and Organization Script
 * Analyzes existing data, removes duplicates, and organizes worker profiles
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./kelmah-backend/services/user-service/models/User');
const { WorkerProfile } = require('./kelmah-backend/services/user-service/models');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_CONNECTION_STRING || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

async function cleanupDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');

        // 1. Analyze existing data
        console.log('\n📊 Analyzing existing database...');

        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const workerUsers = await User.countDocuments({ role: 'worker' });
        const hirerUsers = await User.countDocuments({ role: 'hirer' });
        const totalProfiles = await WorkerProfile.countDocuments();

        console.log(`👥 Users: ${totalUsers} total, ${activeUsers} active`);
        console.log(`👷 Workers: ${workerUsers}, 👔 Hirers: ${hirerUsers}`);
        console.log(`📋 Worker Profiles: ${totalProfiles}`);

        // 2. Find and display worker users without profiles
        const workersWithoutProfiles = await User.find({
            role: 'worker',
            isActive: true
        }).select('_id firstName lastName email');

        const existingProfileUserIds = await WorkerProfile.find().distinct('userId');
        const workersNeedingProfiles = workersWithoutProfiles.filter(worker =>
            !existingProfileUserIds.some(id => id.toString() === worker._id.toString())
        );

        console.log(`\n🔍 Workers needing profiles: ${workersNeedingProfiles.length}`);
        workersNeedingProfiles.slice(0, 5).forEach(worker => {
            console.log(`  - ${worker.firstName} ${worker.lastName} (${worker.email})`);
        });

        // 3. Check for duplicate profiles
        console.log('\n🔍 Checking for duplicate profiles...');
        const duplicateCheck = await WorkerProfile.aggregate([
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    profiles: { $push: '$_id' }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        if (duplicateCheck.length > 0) {
            console.log(`❌ Found ${duplicateCheck.length} users with duplicate profiles`);
            for (const duplicate of duplicateCheck) {
                console.log(`  User ${duplicate._id} has ${duplicate.count} profiles`);
                // Keep the first profile, remove others
                const profilesToRemove = duplicate.profiles.slice(1);
                await WorkerProfile.deleteMany({ _id: { $in: profilesToRemove } });
                console.log(`    Removed ${profilesToRemove.length} duplicate profiles`);
            }
        } else {
            console.log('✅ No duplicate profiles found');
        }

        // 4. Find orphaned profiles (profiles without valid users)
        console.log('\n🔍 Checking for orphaned profiles...');
        const allUserIds = await User.find().distinct('_id');
        const orphanedProfiles = await WorkerProfile.find({
            userId: { $nin: allUserIds }
        });

        if (orphanedProfiles.length > 0) {
            console.log(`❌ Found ${orphanedProfiles.length} orphaned profiles`);
            await WorkerProfile.deleteMany({ userId: { $nin: allUserIds } });
            console.log(`✅ Removed ${orphanedProfiles.length} orphaned profiles`);
        } else {
            console.log('✅ No orphaned profiles found');
        }

        // 5. Validate and fix profile data inconsistencies
        console.log('\n🔧 Validating and fixing profile data...');
        const profiles = await WorkerProfile.find().populate('userId', 'firstName lastName');
        let fixedCount = 0;

        for (const profile of profiles) {
            let needsUpdate = false;
            const updates = {};

            // Fix negative or invalid ratings
            if (profile.rating < 0 || profile.rating > 5) {
                updates.rating = Math.max(0, Math.min(5, profile.rating || 0));
                needsUpdate = true;
            }

            // Fix negative job counts
            if (profile.totalJobs < 0) {
                updates.totalJobs = 0;
                needsUpdate = true;
            }
            if (profile.completedJobs < 0) {
                updates.completedJobs = 0;
                needsUpdate = true;
            }

            // Fix completion rate if it's wrong
            if (profile.totalJobs > 0) {
                const correctCompletionRate = Math.round((profile.completedJobs / profile.totalJobs) * 100);
                if (Math.abs(profile.completionRate - correctCompletionRate) > 5) {
                    updates.completionRate = correctCompletionRate;
                    needsUpdate = true;
                }
            }

            // Fix profile completeness
            const requiredFields = ['bio', 'hourlyRate', 'location', 'skills', 'experienceLevel'];
            let completedFields = 0;
            if (profile.bio && profile.bio.trim().length > 0) completedFields++;
            if (profile.hourlyRate > 0) completedFields++;
            if (profile.location && profile.location.trim().length > 0) completedFields++;
            if (profile.skills && profile.skills.length > 0) completedFields++;
            if (profile.experienceLevel) completedFields++;

            const correctCompleteness = Math.round((completedFields / requiredFields.length) * 100);
            if (Math.abs(profile.profileCompleteness - correctCompleteness) > 10) {
                updates.profileCompleteness = correctCompleteness;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await WorkerProfile.updateOne({ _id: profile._id }, updates);
                fixedCount++;
            }
        }

        console.log(`✅ Fixed ${fixedCount} profiles with data inconsistencies`);

        // 6. Create profiles for workers who need them (only if they don't exist)
        if (workersNeedingProfiles.length > 0) {
            console.log(`\n🔨 Creating profiles for ${workersNeedingProfiles.length} workers...`);

            const skillSets = [
                ['plumbing', 'pipe repair', 'drainage'],
                ['electrical work', 'wiring', 'lighting'],
                ['carpentry', 'woodwork', 'furniture'],
                ['masonry', 'bricklaying', 'construction'],
                ['painting', 'decoration', 'wall finishing'],
                ['cleaning', 'housekeeping', 'maintenance'],
                ['gardening', 'landscaping', 'outdoor work'],
                ['delivery', 'logistics', 'transportation'],
                ['appliance repair', 'electronics', 'technical'],
                ['general maintenance', 'handyman', 'repairs']
            ];

            const newProfiles = workersNeedingProfiles.map((user, index) => ({
                userId: user._id,
                bio: `Experienced ${user.firstName} ready to provide quality services`,
                hourlyRate: Math.floor(Math.random() * 30) + 20, // 20-50 GHS
                currency: 'GHS',
                location: 'Accra, Ghana',
                skills: skillSets[index % skillSets.length],
                experienceLevel: 'intermediate',
                yearsOfExperience: Math.floor(Math.random() * 8) + 2,
                rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5-5.0
                totalJobs: Math.floor(Math.random() * 20) + 5,
                completedJobs: Math.floor(Math.random() * 15) + 3,
                totalEarnings: Math.floor(Math.random() * 3000) + 500,
                isAvailable: true,
                isVerified: Math.random() > 0.4, // 60% verified
                profileCompleteness: 80,
                lastActiveAt: new Date(),
                onlineStatus: 'online'
            }));

            await WorkerProfile.insertMany(newProfiles);
            console.log(`✅ Created ${newProfiles.length} new worker profiles`);
        }

        // 7. Final summary
        console.log('\n📊 Final database state:');
        const finalUsers = await User.countDocuments();
        const finalProfiles = await WorkerProfile.countDocuments();
        const availableWorkers = await WorkerProfile.countDocuments({ isAvailable: true });
        const verifiedWorkers = await WorkerProfile.countDocuments({ isVerified: true });

        console.log(`👥 Total Users: ${finalUsers}`);
        console.log(`📋 Total Worker Profiles: ${finalProfiles}`);
        console.log(`✅ Available Workers: ${availableWorkers}`);
        console.log(`🔐 Verified Workers: ${verifiedWorkers}`);

        // Test dashboard query to make sure it works
        console.log('\n🧪 Testing dashboard query...');
        const dashboardStats = await WorkerProfile.getDashboardStats();
        console.log('Dashboard Stats:', dashboardStats);

        console.log('\n🎉 Database cleanup completed successfully!');

    } catch (error) {
        console.error('❌ Database cleanup failed:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the cleanup
cleanupDatabase().catch(console.error);
