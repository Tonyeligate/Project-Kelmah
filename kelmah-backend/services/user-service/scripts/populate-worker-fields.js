/**
 * Script to populate missing worker fields for existing users
 * This ensures existing workers have the required fields for frontend display
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Use the same connection string as the service
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Simple schema for updates
const userSchema = new mongoose.Schema({}, {strict: false});
const User = mongoose.model('User', userSchema);

async function populateWorkerFields() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all workers
    const workers = await User.find({ role: 'worker', isActive: true });
    console.log(`📊 Found ${workers.length} workers to update`);

    let updateCount = 0;
    
    for (const worker of workers) {
      const updates = {};
      let needsUpdate = false;

      // Set default values for missing fields
      if (!worker.profession) { updates.profession = 'General Worker'; needsUpdate = true; }
      if (!worker.skills || worker.skills.length === 0) { 
        updates.skills = ['General Work', 'Manual Labor']; 
        needsUpdate = true; 
      }
      if (!worker.hourlyRate) { updates.hourlyRate = 25; needsUpdate = true; }
      if (!worker.currency) { updates.currency = 'GHS'; needsUpdate = true; }
      if (worker.rating === undefined) { updates.rating = 4.5; needsUpdate = true; }
      if (!worker.totalReviews) { updates.totalReviews = 0; needsUpdate = true; }
      if (!worker.totalJobsCompleted) { updates.totalJobsCompleted = 0; needsUpdate = true; }
      if (!worker.availabilityStatus) { updates.availabilityStatus = 'available'; needsUpdate = true; }
      if (worker.isVerified === undefined) { updates.isVerified = false; needsUpdate = true; }
      if (!worker.yearsOfExperience) { updates.yearsOfExperience = 2; needsUpdate = true; }
      if (!worker.location) { updates.location = 'Accra, Ghana'; needsUpdate = true; }
      if (!worker.specializations || worker.specializations.length === 0) { 
        updates.specializations = ['General Work']; 
        needsUpdate = true; 
      }
      if (!worker.bio) { 
        updates.bio = `Experienced ${updates.profession || worker.profession || 'worker'} with ${updates.yearsOfExperience || worker.yearsOfExperience || 2} years of experience in ${updates.location || worker.location || 'Ghana'}.`; 
        needsUpdate = true; 
      }

      if (needsUpdate) {
        await User.findByIdAndUpdate(worker._id, updates);
        updateCount++;
        console.log(`✅ Updated worker: ${worker.firstName} ${worker.lastName}`);
      }
    }

    console.log(`🎉 Successfully updated ${updateCount} workers`);
    
    // Verify the updates
    const updatedWorkers = await User.find({ role: 'worker', isActive: true }).limit(3);
    console.log('\n📋 Sample updated workers:');
    updatedWorkers.forEach(worker => {
      console.log(`- ${worker.firstName} ${worker.lastName}: ${worker.profession}, ${worker.skills?.join(', ')}, ₵${worker.hourlyRate}/hr`);
    });

  } catch (error) {
    console.error('❌ Error updating workers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

populateWorkerFields();
