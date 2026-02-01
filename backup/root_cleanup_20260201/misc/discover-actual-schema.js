/**
 * CRITICAL DISCOVERY SCRIPT
 * Find actual database collections and schema
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

async function discoverSchema() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('\n🔍 DISCOVERING ACTUAL DATABASE SCHEMA\n');
    console.log('='.repeat(80) + '\n');
    
    await client.connect();
    const db = client.db('kelmah_platform');
    
    // List ALL collections
    console.log('📚 ALL COLLECTIONS IN DATABASE:\n');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('❌ NO COLLECTIONS FOUND!\n');
    } else {
      collections.forEach((coll, index) => {
        console.log(`${index + 1}. ${coll.name}`);
      });
      console.log('\n');
    }
    
    // Check each collection for sample data
    for (const coll of collections) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`COLLECTION: ${coll.name}`);
      console.log('='.repeat(80));
      
      const collection = db.collection(coll.name);
      const count = await collection.countDocuments();
      console.log(`\nTotal documents: ${count}`);
      
      if (count > 0) {
        const sample = await collection.findOne({});
        console.log('\nSample document structure:');
        console.log(JSON.stringify(sample, null, 2));
        
        // Check indexes
        const indexes = await collection.indexes();
        console.log('\nIndexes:');
        indexes.forEach(idx => {
          console.log(`  - ${idx.name}:`, Object.keys(idx.key));
        });
      }
    }
    
    // Specific check for users collection with worker role
    console.log('\n\n' + '='.repeat(80));
    console.log('CHECKING FOR WORKERS IN USERS COLLECTION');
    console.log('='.repeat(80) + '\n');
    
    const usersCollection = db.collection('users');
    const usersExist = collections.some(c => c.name === 'users');
    
    if (usersExist) {
      const totalUsers = await usersCollection.countDocuments();
      console.log(`Total users: ${totalUsers}`);
      
      const workers = await usersCollection.find({ role: 'worker' }).toArray();
      console.log(`Users with role='worker': ${workers.length}`);
      
      if (workers.length > 0) {
        console.log('\n✅ WORKERS FOUND IN USERS COLLECTION!\n');
        console.log('Sample worker document:');
        console.log(JSON.stringify(workers[0], null, 2));
        
        // Check for workerProfile field
        const workersWithProfile = workers.filter(w => w.workerProfile);
        console.log(`\nWorkers with workerProfile: ${workersWithProfile.length}`);
        
        if (workersWithProfile.length > 0) {
          console.log('\nSample workerProfile structure:');
          console.log(JSON.stringify(workersWithProfile[0].workerProfile, null, 2));
        }
        
        // Check location field structure
        console.log('\n📍 LOCATION FIELD ANALYSIS:');
        workers.forEach((worker, index) => {
          if (index < 3) { // Show first 3
            console.log(`\nWorker ${index + 1}: ${worker.fullName || worker.email}`);
            console.log(`  location type: ${typeof worker.location}`);
            console.log(`  location value:`, worker.location);
          }
        });
      } else {
        console.log('\n⚠️  No workers found in users collection');
      }
      
      const hirers = await usersCollection.find({ role: 'hirer' }).toArray();
      console.log(`\nUsers with role='hirer': ${hirers.length}`);
      
    } else {
      console.log('❌ Users collection does not exist!');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n\n🔌 Connection closed\n');
  }
}

discoverSchema();
