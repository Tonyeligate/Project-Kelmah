/**
 * Script to fix existing jobs in MongoDB to match schema requirements
 */
const mongoose = require('mongoose');

const uri = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority';

async function fixExistingJobs() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const jobsCollection = db.collection('jobs');

        console.log('\n=== FIXING EXISTING JOBS ===\n');

        // 1. Fix status: 'Open' -> 'open' (case sensitivity)
        const statusResult = await jobsCollection.updateMany(
            { status: 'Open' },
            { $set: { status: 'open' } }
        );
        console.log('✅ Fixed status case:', statusResult.modifiedCount, 'jobs');

        // Also fix other potential status values
        await jobsCollection.updateMany({ status: 'Closed' }, { $set: { status: 'completed' } });
        await jobsCollection.updateMany({ status: 'In Progress' }, { $set: { status: 'in-progress' } });

        // 2. Add missing locationDetails with defaults (no null coordinates - breaks geo index)
        const locationResult = await jobsCollection.updateMany(
            { locationDetails: { $exists: false } },
            {
                $set: {
                    locationDetails: {
                        region: 'Greater Accra',
                        district: '',
                        searchRadius: 25
                    }
                }
            }
        );
        console.log('✅ Added locationDetails:', locationResult.modifiedCount, 'jobs');

        // Fix any existing null coordinates (remove them to avoid geo index issues)
        const fixCoordsResult = await jobsCollection.updateMany(
            { 'locationDetails.coordinates.lat': null },
            { $unset: { 'locationDetails.coordinates': '' } }
        );
        console.log('✅ Fixed null coordinates:', fixCoordsResult.modifiedCount, 'jobs');        // 3. Add missing requirements with defaults based on category
        const jobsNeedingRequirements = await jobsCollection.find({
            requirements: { $exists: false }
        }).toArray();

        const categoryToSkill = {
            'Electrical Work': 'Electrical',
            'Electrical': 'Electrical',
            'Plumbing': 'Plumbing',
            'Plumbing Work': 'Plumbing',
            'Carpentry': 'Carpentry',
            'Carpentry Work': 'Carpentry',
            'Masonry': 'Masonry',
            'Masonry Work': 'Masonry',
            'Construction': 'Construction',
            'Construction Work': 'Construction',
            'Painting': 'Painting',
            'Painting Work': 'Painting',
            'Welding': 'Welding',
            'Welding Work': 'Welding',
            'HVAC': 'HVAC',
            'Roofing': 'Roofing',
            'Flooring': 'Flooring',
            'Tiling': 'Flooring'
        };

        for (const job of jobsNeedingRequirements) {
            const skill = categoryToSkill[job.category] || 'Construction';

            await jobsCollection.updateOne(
                { _id: job._id },
                {
                    $set: {
                        requirements: {
                            primarySkills: [skill],
                            secondarySkills: [],
                            experienceLevel: 'intermediate',
                            certifications: [],
                            tools: []
                        }
                    }
                }
            );
        }
        console.log('✅ Added requirements:', jobsNeedingRequirements.length, 'jobs');

        // 4. Add missing bidding fields based on budget
        const jobsNeedingBidding = await jobsCollection.find({
            $or: [
                { 'bidding.minBidAmount': { $exists: false } },
                { 'bidding.maxBidAmount': { $exists: false } }
            ]
        }).toArray();

        for (const job of jobsNeedingBidding) {
            const budget = job.budget || 500;
            const minBid = Math.floor(budget * 0.8);
            const maxBid = Math.ceil(budget * 1.2);

            await jobsCollection.updateOne(
                { _id: job._id },
                {
                    $set: {
                        'bidding.minBidAmount': minBid,
                        'bidding.maxBidAmount': maxBid,
                        'bidding.maxBidders': job.bidding?.maxBidders || 5,
                        'bidding.currentBidders': job.bidding?.currentBidders || 0,
                        'bidding.bidStatus': job.bidding?.bidStatus || 'open',
                        'bidding.bidDeadline': job.bidding?.bidDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                }
            );
        }
        console.log('✅ Added bidding fields:', jobsNeedingBidding.length, 'jobs');

        // Verify fixes
        console.log('\n=== VERIFICATION ===\n');
        const sampleJob = await jobsCollection.findOne({});
        console.log('Sample job after fixes:');
        console.log('  status:', sampleJob.status);
        console.log('  locationDetails:', JSON.stringify(sampleJob.locationDetails, null, 4));
        console.log('  requirements:', JSON.stringify(sampleJob.requirements, null, 4));
        console.log('  bidding:', JSON.stringify(sampleJob.bidding, null, 4));

        // Count jobs with all required fields
        const completeJobs = await jobsCollection.countDocuments({
            status: { $in: ['draft', 'open', 'in-progress', 'completed', 'cancelled'] },
            'locationDetails.region': { $exists: true },
            'requirements.primarySkills': { $exists: true },
            'bidding.minBidAmount': { $exists: true },
            'bidding.maxBidAmount': { $exists: true }
        });
        const totalJobs = await jobsCollection.countDocuments({});
        console.log('\n✅ Jobs with all required fields:', completeJobs, '/', totalJobs);

        await mongoose.disconnect();
        console.log('\n🎉 All jobs fixed successfully!');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixExistingJobs();
