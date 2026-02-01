/**
 * Test inserting a job directly to MongoDB to see exact error
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Import the actual Job model
const JobSchema = require('./kelmah-backend/shared/models/Job');

async function testJobInsert() {
    try {
        console.log('🔌 Connecting to MongoDB...');

        // Configure mongoose like the job service does
        mongoose.set('bufferCommands', false);
        mongoose.set('autoCreate', false);

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const Job = mongoose.model('Job', JobSchema.schema);

        // Create test job with proper data
        const testJob = {
            title: "Test Carpentry Job",
            description: "We need an experienced carpenter for home renovation work",
            category: "Carpentry",
            location: {
                type: "onsite",
                coordinates: { lat: 5.6037, lng: -0.1870 },
                address: "Accra, Ghana"
            },
            skills: ["Carpentry"],
            duration: { value: 2, unit: "day" },
            budget: 500,
            paymentType: "fixed",
            currency: "GHS",
            hirer: "6891595768c3cdade00f564f",
            requirements: {
                primarySkills: ["Carpentry"],
                secondarySkills: [],
                experienceLevel: "intermediate"
            },
            bidding: {
                maxBidders: 5,
                minBidAmount: 400,
                maxBidAmount: 600,
                bidStatus: "open"
            },
            locationDetails: {
                region: "Greater Accra",
                coordinates: { lat: 5.6037, lng: -0.1870 }
            }
        };

        console.log('📝 Attempting to create job...');
        console.log('Job data:', JSON.stringify(testJob, null, 2));
        console.log('');

        const job = new Job(testJob);

        console.log('✅ Job model created (validation passed)');
        console.log('🔄 Attempting to save to database...');

        const saved = await job.save();

        console.log('✅ Job saved successfully!');
        console.log('Job ID:', saved._id);
        console.log('');

        // Clean up - delete the test job
        await Job.deleteOne({ _id: saved._id });
        console.log('🗑️  Test job deleted');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.errors) {
            console.error('\nValidation errors:');
            Object.keys(error.errors).forEach(key => {
                console.error(`  - ${key}: ${error.errors[key].message}`);
            });
        }
        console.error('\nFull error:');
        console.error(error);

        try {
            await mongoose.disconnect();
        } catch (e) { }

        process.exit(1);
    }
}

testJobInsert();
