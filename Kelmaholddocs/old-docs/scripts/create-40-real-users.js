#!/usr/bin/env node

/**
 * 👥 CREATE 40 REAL USERS IN MONGODB
 * Creates 20 verified worker users + 20 verified hirer users directly in MongoDB
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.DATABASE_URL;

// 20 Worker Users
const WORKER_USERS = [
  {
    firstName: 'Kwame',
    lastName: 'Asante',
    email: 'kwame.asante1@kelmah.test',
    phone: '+233241001001',
    profession: 'Plumber',
    location: 'Accra',
    skills: ['Pipe Installation', 'Leak Repair', 'Bathroom Renovation']
  },
  {
    firstName: 'Efua',
    lastName: 'Mensah',
    email: 'efua.mensah@kelmah.test',
    phone: '+233241001002',
    profession: 'Plumber',
    location: 'Accra',
    skills: ['Kitchen Plumbing', 'Water Systems', 'Drain Cleaning']
  },
  {
    firstName: 'Kwaku',
    lastName: 'Osei',
    email: 'kwaku.osei@kelmah.test',
    phone: '+233241001003',
    profession: 'Electrician',
    location: 'Accra',
    skills: ['House Wiring', 'Solar Installation', 'Circuit Repair']
  },
  {
    firstName: 'Yaa',
    lastName: 'Adjei',
    email: 'yaa.adjei@kelmah.test',
    phone: '+233241001004',
    profession: 'Electrician',
    location: 'Accra',
    skills: ['LED Installation', 'Electrical Panels', 'Safety Systems']
  },
  {
    firstName: 'Fiifi',
    lastName: 'Boateng',
    email: 'fiifi.boateng@kelmah.test',
    phone: '+233241001005',
    profession: 'Carpenter',
    location: 'Kumasi',
    skills: ['Cabinet Making', 'Furniture', 'Wood Finishing']
  },
  {
    firstName: 'Afia',
    lastName: 'Owusu',
    email: 'afia.owusu@kelmah.test',
    phone: '+233241001006',
    profession: 'Carpenter',
    location: 'Kumasi',
    skills: ['Custom Furniture', 'Wood Carving', 'Interior Carpentry']
  },
  {
    firstName: 'Kwadwo',
    lastName: 'Agyei',
    email: 'kwadwo.agyei@kelmah.test',
    phone: '+233241001007',
    profession: 'Mason',
    location: 'Kumasi',
    skills: ['Bricklaying', 'Concrete Work', 'Block Construction']
  },
  {
    firstName: 'Esi',
    lastName: 'Darko',
    email: 'esi.darko@kelmah.test',
    phone: '+233241001008',
    profession: 'Mason',
    location: 'Kumasi',
    skills: ['Stone Work', 'Tile Installation', 'Foundation Work']
  },
  {
    firstName: 'Yaw',
    lastName: 'Antwi',
    email: 'yaw.antwi@kelmah.test',
    phone: '+233241001009',
    profession: 'Painter',
    location: 'Tamale',
    skills: ['Interior Painting', 'Exterior Painting', 'Color Consultation']
  },
  {
    firstName: 'Adjoa',
    lastName: 'Oppong',
    email: 'adjoa.oppong@kelmah.test',
    phone: '+233241001010',
    profession: 'Painter',
    location: 'Tamale',
    skills: ['Wall Decoration', 'Spray Painting', 'Surface Preparation']
  },
  {
    firstName: 'Kwame',
    lastName: 'Gyamfi',
    email: 'kwame.gyamfi@kelmah.test',
    phone: '+233241001011',
    profession: 'Welder',
    location: 'Tamale',
    skills: ['Arc Welding', 'MIG Welding', 'Metal Fabrication']
  },
  {
    firstName: 'Efua',
    lastName: 'Acheampong',
    email: 'efua.acheampong@kelmah.test',
    phone: '+233241001012',
    profession: 'Welder',
    location: 'Tamale',
    skills: ['Steel Construction', 'Pipeline Welding', 'Repair Work']
  },
  {
    firstName: 'Kwaku',
    lastName: 'Addai',
    email: 'kwaku.addai@kelmah.test',
    phone: '+233241001013',
    profession: 'Mechanic',
    location: 'Cape Coast',
    skills: ['Car Repair', 'Engine Maintenance', 'Electrical Systems']
  },
  {
    firstName: 'Yaa',
    lastName: 'Wiredu',
    email: 'yaa.wiredu@kelmah.test',
    phone: '+233241001014',
    profession: 'Mechanic',
    location: 'Cape Coast',
    skills: ['Motorcycle Repair', 'Brake Systems', 'Transmission']
  },
  {
    firstName: 'Fiifi',
    lastName: 'Frimpong',
    email: 'fiifi.frimpong@kelmah.test',
    phone: '+233241001015',
    profession: 'Tailor',
    location: 'Cape Coast',
    skills: ['Custom Clothing', 'Alterations', 'Traditional Wear']
  },
  {
    firstName: 'Afia',
    lastName: 'Nyarko',
    email: 'afia.nyarko@kelmah.test',
    phone: '+233241001016',
    profession: 'Tailor',
    location: 'Cape Coast',
    skills: ['Fashion Design', 'Embroidery', 'Pattern Making']
  },
  {
    firstName: 'Kwadwo',
    lastName: 'Bediako',
    email: 'kwadwo.bediako@kelmah.test',
    phone: '+233241001017',
    profession: 'Hair Stylist',
    location: 'Sekondi-Takoradi',
    skills: ['Hair Cutting', 'Hair Styling', 'Color Treatment']
  },
  {
    firstName: 'Esi',
    lastName: 'Appiah',
    email: 'esi.appiah@kelmah.test',
    phone: '+233241001018',
    profession: 'Hair Stylist',
    location: 'Sekondi-Takoradi',
    skills: ['Braiding', 'Hair Extensions', 'Scalp Treatment']
  },
  {
    firstName: 'Yaw',
    lastName: 'Danso',
    email: 'yaw.danso@kelmah.test',
    phone: '+233241001019',
    profession: 'Gardener',
    location: 'Sekondi-Takoradi',
    skills: ['Landscaping', 'Plant Care', 'Garden Design']
  },
  {
    firstName: 'Adjoa',
    lastName: 'Ofori',
    email: 'adjoa.ofori@kelmah.test',
    phone: '+233241001020',
    profession: 'Gardener',
    location: 'Sekondi-Takoradi',
    skills: ['Lawn Maintenance', 'Tree Pruning', 'Irrigation Systems']
  }
];

// 20 Hirer Users  
const HIRER_USERS = [
  {
    firstName: 'Samuel',
    lastName: 'Osei',
    email: 'samuel.osei@ghanaconstruction.com',
    phone: '+233241002001',
    companyName: 'Ghana Construction Ltd',
    companyType: 'Construction Company',
    businessIndustry: 'Construction & Real Estate',
    city: 'Accra'
  },
  {
    firstName: 'Akosua',
    lastName: 'Mensah',
    email: 'akosua.mensah@goldstarbuilders.com',
    phone: '+233241002002',
    companyName: 'Gold Star Builders',
    companyType: 'Construction Company',
    businessIndustry: 'Construction & Real Estate',
    city: 'Kumasi'
  },
  {
    firstName: 'Kwame',
    lastName: 'Boateng',
    email: 'kwame.boateng@modernbuild.com',
    phone: '+233241002003',
    companyName: 'Modern Build Ghana',
    companyType: 'Construction Company',
    businessIndustry: 'Construction & Real Estate',
    city: 'Tamale'
  },
  {
    firstName: 'Ama',
    lastName: 'Asante',
    email: 'ama.asante@reliableconstruct.com',
    phone: '+233241002004',
    companyName: 'Reliable Construction Services',
    companyType: 'Construction Company',
    businessIndustry: 'Construction & Real Estate',
    city: 'Cape Coast'
  },
  {
    firstName: 'Kofi',
    lastName: 'Adjei',
    email: 'kofi.adjei@elmaconstruction.com',
    phone: '+233241002005',
    companyName: 'Elma Construction Group',
    companyType: 'Construction Company',
    businessIndustry: 'Construction & Real Estate',
    city: 'Sekondi-Takoradi'
  },
  {
    firstName: 'Yaw',
    lastName: 'Opoku',
    email: 'yaw.opoku@grandrealestate.com',
    phone: '+233241002006',
    companyName: 'Grand Real Estate Development',
    companyType: 'Real Estate Developer',
    businessIndustry: 'Real Estate Development',
    city: 'Accra'
  },
  {
    firstName: 'Abena',
    lastName: 'Owusu',
    email: 'abena.owusu@cityviewdevelopers.com',
    phone: '+233241002007',
    companyName: 'City View Developers',
    companyType: 'Real Estate Developer',
    businessIndustry: 'Real Estate Development',
    city: 'Kumasi'
  },
  {
    firstName: 'Kwaku',
    lastName: 'Darko',
    email: 'kwaku.darko@coastalproperties.com',
    phone: '+233241002008',
    companyName: 'Coastal Properties Ltd',
    companyType: 'Real Estate Developer',
    businessIndustry: 'Real Estate Development',
    city: 'Cape Coast'
  },
  {
    firstName: 'Margaret',
    lastName: 'Agyei',
    email: 'margaret.agyei@gmail.com',
    phone: '+233241002009',
    companyName: 'Margaret\'s Properties',
    companyType: 'Individual Property Owner',
    businessIndustry: 'Property Management',
    city: 'Accra'
  },
  {
    firstName: 'Joseph',
    lastName: 'Appiah',
    email: 'joseph.appiah@gmail.com',
    phone: '+233241002010',
    companyName: 'Joe\'s Home Investments',
    companyType: 'Individual Property Owner',
    businessIndustry: 'Property Investment',
    city: 'Kumasi'
  },
  {
    firstName: 'Grace',
    lastName: 'Adomako',
    email: 'grace.adomako@gmail.com',
    phone: '+233241002011',
    companyName: 'Grace Property Holdings',
    companyType: 'Individual Property Owner',
    businessIndustry: 'Property Management',
    city: 'Tamale'
  },
  {
    firstName: 'Daniel',
    lastName: 'Ofori',
    email: 'daniel.ofori@gmail.com',
    phone: '+233241002012',
    companyName: 'Dan\'s Property Solutions',
    companyType: 'Individual Property Owner',
    businessIndustry: 'Property Management',
    city: 'Cape Coast'
  },
  {
    firstName: 'Rebecca',
    lastName: 'Boadu',
    email: 'rebecca.boadu@palmgrovehotel.com',
    phone: '+233241002013',
    companyName: 'Palm Grove Hotel',
    companyType: 'Hospitality Business',
    businessIndustry: 'Hospitality & Tourism',
    city: 'Accra'
  },
  {
    firstName: 'Charles',
    lastName: 'Nkrumah',
    email: 'charles.nkrumah@goldenlodge.com',
    phone: '+233241002014',
    companyName: 'Golden Lodge Resort',
    companyType: 'Hospitality Business',
    businessIndustry: 'Hospitality & Tourism',
    city: 'Kumasi'
  },
  {
    firstName: 'Comfort',
    lastName: 'Amponsah',
    email: 'comfort.amponsah@beachviewhotel.com',
    phone: '+233241002015',
    companyName: 'Beach View Hotel',
    companyType: 'Hospitality Business',
    businessIndustry: 'Hospitality & Tourism',
    city: 'Cape Coast'
  },
  {
    firstName: 'Emmanuel',
    lastName: 'Tetteh',
    email: 'emmanuel.tetteh@maxvalue.com',
    phone: '+233241002016',
    companyName: 'Max Value Supermarket',
    companyType: 'Retail Business',
    businessIndustry: 'Retail & Commercial',
    city: 'Accra'
  },
  {
    firstName: 'Vivian',
    lastName: 'Asiedu',
    email: 'vivian.asiedu@plazacentre.com',
    phone: '+233241002017',
    companyName: 'Plaza Shopping Centre',
    companyType: 'Retail Business',
    businessIndustry: 'Retail & Commercial',
    city: 'Kumasi'
  },
  {
    firstName: 'Francis',
    lastName: 'Hayford',
    email: 'francis.hayford@citymarket.com',
    phone: '+233241002018',
    companyName: 'City Market Complex',
    companyType: 'Retail Business',
    businessIndustry: 'Retail & Commercial',
    city: 'Tamale'
  },
  {
    firstName: 'Sarah',
    lastName: 'Kuffour',
    email: 'sarah.kuffour@govgh.org',
    phone: '+233241002019',
    companyName: 'Ministry of Infrastructure',
    companyType: 'Government Agency',
    businessIndustry: 'Government & Public Sector',
    city: 'Accra'
  },
  {
    firstName: 'Isaac',
    lastName: 'Obeng',
    email: 'isaac.obeng@communitydev.org',
    phone: '+233241002020',
    companyName: 'Community Development Foundation',
    companyType: 'NGO',
    businessIndustry: 'Non-Profit',
    city: 'Kumasi'
  }
];

async function create40RealUsers() {
  console.log('👥 CREATING 40 REAL USERS IN MONGODB');
  console.log('====================================');

  if (!MONGODB_URI) {
    console.error('❌ DATABASE_URL environment variable required');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI, {
    retryWrites: true,
    serverSelectionTimeoutMS: 30000
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');

    const db = client.db('kelmah_platform');
    const usersCollection = db.collection('users');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('TestUser123!', 12);
    console.log('🔐 Password hashed successfully');

    let createdCount = 0;
    let skippedCount = 0;

    // Create worker users
    console.log('\n👷 Creating 20 Worker Users...');
    for (let i = 0; i < WORKER_USERS.length; i++) {
      const worker = WORKER_USERS[i];
      
      try {
        const userDoc = {
          firstName: worker.firstName,
          lastName: worker.lastName,
          email: worker.email,
          phone: worker.phone,
          password: hashedPassword,
          role: 'worker',
          
          // Profile information
          profession: worker.profession,
          skills: worker.skills,
          location: worker.location,
          bio: `Experienced ${worker.profession.toLowerCase()} with expertise in ${worker.skills.join(', ')}. Based in ${worker.location}.`,
          
          // Verification status - ALREADY VERIFIED
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
          
          // Professional stats
          rating: 4.8,
          completedProjects: Math.floor(Math.random() * 20) + 10,
          yearsExperience: Math.floor(Math.random() * 8) + 3,
          hourlyRate: Math.floor(Math.random() * 50) + 30,
          
          // Timestamps
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
          
          // Additional worker fields
          availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          tools: ['Basic Tools', 'Power Tools', 'Safety Equipment'],
          certifications: [],
          
          // Account status
          accountLocked: false,
          failedLoginAttempts: 0,
          tokenVersion: 0
        };

        await usersCollection.insertOne(userDoc);
        createdCount++;
        console.log(`   ✅ ${i + 1}/20 - ${worker.firstName} ${worker.lastName} (${worker.profession})`);
        
      } catch (error) {
        if (error.code === 11000) {
          console.log(`   ⚠️  ${i + 1}/20 - ${worker.firstName} ${worker.lastName} (already exists)`);
          skippedCount++;
        } else {
          console.log(`   ❌ ${i + 1}/20 - ${worker.firstName} ${worker.lastName} (error: ${error.message})`);
        }
      }
    }

    // Create hirer users
    console.log('\n🏗️ Creating 20 Hirer Users...');
    for (let i = 0; i < HIRER_USERS.length; i++) {
      const hirer = HIRER_USERS[i];
      
      try {
        const userDoc = {
          firstName: hirer.firstName,
          lastName: hirer.lastName,
          email: hirer.email,
          phone: hirer.phone,
          password: hashedPassword,
          role: 'hirer',
          
          // Company information
          companyName: hirer.companyName,
          companyType: hirer.companyType,
          businessIndustry: hirer.businessIndustry,
          location: hirer.city,
          city: hirer.city,
          country: 'Ghana',
          
          bio: `Professional with ${hirer.companyName} specializing in ${hirer.businessIndustry}. Looking for skilled workers for various projects.`,
          
          // Verification status - ALREADY VERIFIED
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
          
          // Hirer stats
          totalHires: Math.floor(Math.random() * 15) + 5,
          activeProjects: Math.floor(Math.random() * 3) + 1,
          rating: 4.7,
          
          // Timestamps
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
          
          // Account status
          accountLocked: false,
          failedLoginAttempts: 0,
          tokenVersion: 0
        };

        await usersCollection.insertOne(userDoc);
        createdCount++;
        console.log(`   ✅ ${i + 1}/20 - ${hirer.firstName} ${hirer.lastName} (${hirer.companyName})`);
        
      } catch (error) {
        if (error.code === 11000) {
          console.log(`   ⚠️  ${i + 1}/20 - ${hirer.firstName} ${hirer.lastName} (already exists)`);
          skippedCount++;
        } else {
          console.log(`   ❌ ${i + 1}/20 - ${hirer.firstName} ${hirer.lastName} (error: ${error.message})`);
        }
      }
    }

    // Get final count
    const totalUsers = await usersCollection.countDocuments();

    console.log('\n🎉 USER CREATION COMPLETED!');
    console.log('============================');
    console.log(`✅ Successfully Created: ${createdCount} users`);
    console.log(`⚠️  Skipped (already exist): ${skippedCount} users`);
    console.log(`📊 Total Users in Database: ${totalUsers} users`);
    
    console.log('\n🔑 TEST CREDENTIALS:');
    console.log('====================');
    console.log('👷 **WORKER LOGIN:**');
    console.log(`Email: kwame.asante1@kelmah.test`);
    console.log(`Password: TestUser123!`);
    console.log('');
    console.log('🏗️ **HIRER LOGIN:**');
    console.log(`Email: samuel.osei@ghanaconstruction.com`);
    console.log(`Password: TestUser123!`);
    console.log('');
    console.log('✅ All users are pre-verified and ready to login!');
    console.log('🌐 Frontend URL: https://kelmah-frontend-mu.vercel.app/');

  } catch (error) {
    console.error('\n❌ Error creating users:', error.message);
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🔧 SSL/TLS Issue detected.');
      console.log('Your MongoDB connection might have certificate issues.');
      console.log('The users may still have been created successfully.');
    }
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  create40RealUsers().catch(console.error);
}

module.exports = { create40RealUsers };