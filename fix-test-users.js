#!/usr/bin/env node

/**
 * Check and Fix Test User in Database
 * Ensures a test user exists with correct credentials
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String,
  isEmailVerified: Boolean,
  isActive: Boolean,
  profileCompletion: Number,
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function checkAndFixUser() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!');

    // Check if Gifty user exists
    console.log('\n📧 Checking for giftyafisa@gmail.com...');
    let user = await User.findOne({ email: 'giftyafisa@gmail.com' });

    if (user) {
      console.log('✅ User exists!');
      console.log('   Name:', `${user.firstName} ${user.lastName}`);
      console.log('   Role:', user.role);
      console.log('   Email Verified:', user.isEmailVerified);
      console.log('   Active:', user.isActive);

      // Fix password and email verification
      console.log('\n🔧 Updating user with correct password and verification...');
      const hashedPassword = await bcrypt.hash('11221122Tg', 12);
      
      await User.updateOne(
        { email: 'giftyafisa@gmail.com' },
        {
          $set: {
            password: hashedPassword,
            isEmailVerified: true,
            isActive: true
          }
        }
      );
      
      console.log('✅ User updated successfully!');
      console.log('   Email: giftyafisa@gmail.com');
      console.log('   Password: 11221122Tg');
      console.log('   Email Verified: true');
      console.log('   Active: true');

    } else {
      console.log('❌ User does NOT exist!');
      console.log('\n🆕 Creating new user...');
      
      const hashedPassword = await bcrypt.hash('11221122Tg', 12);
      
      user = await User.create({
        email: 'giftyafisa@gmail.com',
        password: hashedPassword,
        firstName: 'Gifty',
        lastName: 'Afisa',
        role: 'worker',
        isEmailVerified: true,
        isActive: true,
        profileCompletion: 85
      });
      
      console.log('✅ User created successfully!');
      console.log('   Email: giftyafisa@gmail.com');
      console.log('   Password: 11221122Tg');
    }

    // Also create a test hirer if doesn't exist
    console.log('\n📧 Checking for test hirer...');
    let hirer = await User.findOne({ email: 'hirer@test.com' });
    
    if (!hirer) {
      console.log('🆕 Creating test hirer...');
      const hashedPassword = await bcrypt.hash('TestUser123!', 12);
      
      hirer = await User.create({
        email: 'hirer@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Hirer',
        role: 'hirer',
        isEmailVerified: true,
        isActive: true,
        profileCompletion: 90
      });
      
      console.log('✅ Test hirer created!');
      console.log('   Email: hirer@test.com');
      console.log('   Password: TestUser123!');
    } else {
      console.log('✅ Test hirer already exists');
      
      // Update to ensure it's verified and active
      const hashedPassword = await bcrypt.hash('TestUser123!', 12);
      await User.updateOne(
        { email: 'hirer@test.com' },
        {
          $set: {
            password: hashedPassword,
            isEmailVerified: true,
            isActive: true
          }
        }
      );
      console.log('✅ Test hirer updated!');
    }

    console.log('\n✅ ALL TEST USERS READY FOR TESTING!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAndFixUser();
