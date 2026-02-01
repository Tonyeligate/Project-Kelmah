const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority';

async function testQuery() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('kelmah_platform');
        const jobsCollection = db.collection('jobs');

        const giftyId = '6891595768c3cdade00f564f';
        const hirerObjectId = new ObjectId(giftyId);

        console.log('=== Testing MongoDB Query Directly ===\n');

        // Test 1: No status filter
        const allJobs = await jobsCollection.find({ hirer: hirerObjectId }).toArray();
        console.log('No status filter:', allJobs.length, 'jobs');

        // Test 2: status=open
        const openJobs = await jobsCollection.find({ hirer: hirerObjectId, status: 'open' }).toArray();
        console.log('status=open:', openJobs.length, 'jobs');

        // Test 3: status=active (should be 0 since DB uses "open")
        const activeJobs = await jobsCollection.find({ hirer: hirerObjectId, status: 'active' }).toArray();
        console.log('status=active:', activeJobs.length, 'jobs');

        // Test 4: status=completed
        const completedJobs = await jobsCollection.find({ hirer: hirerObjectId, status: 'completed' }).toArray();
        console.log('status=completed:', completedJobs.length, 'jobs');

        // Test 5: Check what happens with hirer as string
        const stringJobs = await jobsCollection.find({ hirer: giftyId }).toArray();
        console.log('hirer as string:', stringJobs.length, 'jobs');

        // Show actual job statuses
        console.log('\n=== Actual Job Statuses in DB ===');
        const statuses = await jobsCollection.aggregate([
            { $match: { hirer: hirerObjectId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        console.log(JSON.stringify(statuses, null, 2));

        // Check hirer field type
        console.log('\n=== Hirer Field Analysis ===');
        const sampleJob = await jobsCollection.findOne({ hirer: hirerObjectId });
        console.log('Sample job hirer:', sampleJob?.hirer);
        console.log('Hirer type:', typeof sampleJob?.hirer);
        console.log('Is ObjectId:', sampleJob?.hirer instanceof ObjectId);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}
testQuery();
