const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority';

async function checkUser() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('kelmah_platform');

        // Check for the talent user
        console.log('=== Searching for Talent User ===');
        const user = await db.collection('users').findOne({ email: 'kwame.asante1@kelmah.test' });

        if (user) {
            console.log('✅ User found:', JSON.stringify({
                _id: user._id,
                email: user.email,
                role: user.role,
                userType: user.userType,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
                isActive: user.isActive,
                createdAt: user.createdAt
            }, null, 2));
        } else {
            console.log('❌ User NOT FOUND: kwame.asante1@kelmah.test');
        }

        // Check all roles/userTypes in the system
        console.log('\n=== Distinct Roles in DB ===');
        const roles = await db.collection('users').distinct('role');
        console.log('Roles:', roles);

        const userTypes = await db.collection('users').distinct('userType');
        console.log('UserTypes:', userTypes);

        // Count users by role
        console.log('\n=== User Count by Role ===');
        const roleCounts = await db.collection('users').aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]).toArray();
        console.log(JSON.stringify(roleCounts, null, 2));

        // List a few sample users
        console.log('\n=== Sample Users (first 5) ===');
        const sampleUsers = await db.collection('users').find({}).limit(5).project({
            email: 1, role: 1, userType: 1, isEmailVerified: 1
        }).toArray();
        console.log(JSON.stringify(sampleUsers, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}
checkUser();
