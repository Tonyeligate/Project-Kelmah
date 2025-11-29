const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority';

async function checkJobs() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('kelmah_platform');

        // Total jobs in DB
        const totalJobs = await db.collection('jobs').countDocuments();
        console.log('=== Total Jobs in Database ===');
        console.log('Total:', totalJobs);

        // Jobs by status
        console.log('\n=== Jobs by Status ===');
        const statusCounts = await db.collection('jobs').aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        console.log(JSON.stringify(statusCounts, null, 2));

        // Jobs by hirer (poster)
        console.log('\n=== Jobs by Hirer ===');
        const hirerCounts = await db.collection('jobs').aggregate([
            { $group: { _id: '$hirer', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).toArray();
        console.log(JSON.stringify(hirerCounts, null, 2));

        // Get Gifty's user ID and check her jobs
        const gifty = await db.collection('users').findOne({ email: 'giftyafisa@gmail.com' });
        if (gifty) {
            console.log('\n=== Gifty\'s Jobs (Hirer) ===');
            console.log('Gifty User ID:', gifty._id.toString());

            const giftyJobs = await db.collection('jobs').find({ hirer: gifty._id }).toArray();
            console.log('Jobs posted by Gifty:', giftyJobs.length);

            // Also check with string ID
            const giftyJobsString = await db.collection('jobs').find({ hirer: gifty._id.toString() }).toArray();
            console.log('Jobs with string hirer ID:', giftyJobsString.length);

            // Check jobs with various hirer formats
            const allHirerFormats = await db.collection('jobs').find({
                $or: [
                    { hirer: gifty._id },
                    { hirer: gifty._id.toString() },
                    { 'hirer._id': gifty._id },
                    { 'hirer.id': gifty._id.toString() }
                ]
            }).toArray();
            console.log('Jobs (all hirer formats):', allHirerFormats.length);
        }

        // Sample job document structure
        console.log('\n=== Sample Job Document ===');
        const sampleJob = await db.collection('jobs').findOne({});
        if (sampleJob) {
            console.log(JSON.stringify({
                _id: sampleJob._id,
                title: sampleJob.title,
                status: sampleJob.status,
                hirer: sampleJob.hirer,
                hirerType: typeof sampleJob.hirer,
                createdAt: sampleJob.createdAt
            }, null, 2));
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}
checkJobs();
