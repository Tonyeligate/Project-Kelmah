#!/usr/bin/env node

/**
 * ✅ VERIFY ALL 40 USERS
 * Tests login with all created users to find verified ones
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const AUTH_SERVICE_URL = 'https://kelmah-auth-service.onrender.com';

// All 40 users that exist in database
const ALL_USERS = [
  // Workers
  { email: 'kwame.asante1@kelmah.test', name: 'Kwame Asante', role: 'worker', profession: 'Plumber' },
  { email: 'efua.mensah@kelmah.test', name: 'Efua Mensah', role: 'worker', profession: 'Plumber' },
  { email: 'kwaku.osei@kelmah.test', name: 'Kwaku Osei', role: 'worker', profession: 'Electrician' },
  { email: 'yaa.adjei@kelmah.test', name: 'Yaa Adjei', role: 'worker', profession: 'Electrician' },
  { email: 'fiifi.boateng@kelmah.test', name: 'Fiifi Boateng', role: 'worker', profession: 'Carpenter' },
  { email: 'afia.owusu@kelmah.test', name: 'Afia Owusu', role: 'worker', profession: 'Carpenter' },
  { email: 'kwadwo.agyei@kelmah.test', name: 'Kwadwo Agyei', role: 'worker', profession: 'Mason' },
  { email: 'esi.darko@kelmah.test', name: 'Esi Darko', role: 'worker', profession: 'Mason' },
  { email: 'yaw.antwi@kelmah.test', name: 'Yaw Antwi', role: 'worker', profession: 'Painter' },
  { email: 'adjoa.oppong@kelmah.test', name: 'Adjoa Oppong', role: 'worker', profession: 'Painter' },
  { email: 'kwame.gyamfi@kelmah.test', name: 'Kwame Gyamfi', role: 'worker', profession: 'Welder' },
  { email: 'efua.acheampong@kelmah.test', name: 'Efua Acheampong', role: 'worker', profession: 'Welder' },
  { email: 'kwaku.addai@kelmah.test', name: 'Kwaku Addai', role: 'worker', profession: 'Mechanic' },
  { email: 'yaa.wiredu@kelmah.test', name: 'Yaa Wiredu', role: 'worker', profession: 'Mechanic' },
  { email: 'fiifi.frimpong@kelmah.test', name: 'Fiifi Frimpong', role: 'worker', profession: 'Tailor' },
  { email: 'afia.nyarko@kelmah.test', name: 'Afia Nyarko', role: 'worker', profession: 'Tailor' },
  { email: 'kwadwo.bediako@kelmah.test', name: 'Kwadwo Bediako', role: 'worker', profession: 'Hair Stylist' },
  { email: 'esi.appiah@kelmah.test', name: 'Esi Appiah', role: 'worker', profession: 'Hair Stylist' },
  { email: 'yaw.danso@kelmah.test', name: 'Yaw Danso', role: 'worker', profession: 'Gardener' },
  { email: 'adjoa.ofori@kelmah.test', name: 'Adjoa Ofori', role: 'worker', profession: 'Gardener' },

  // Hirers
  { email: 'samuel.osei@ghanaconstruction.com', name: 'Samuel Osei', role: 'hirer', company: 'Ghana Construction Ltd' },
  { email: 'akosua.mensah@goldstarbuilders.com', name: 'Akosua Mensah', role: 'hirer', company: 'Gold Star Builders' },
  { email: 'kwame.boateng@modernbuild.com', name: 'Kwame Boateng', role: 'hirer', company: 'Modern Build Ghana' },
  { email: 'ama.asante@reliableconstruct.com', name: 'Ama Asante', role: 'hirer', company: 'Reliable Construction Services' },
  { email: 'kofi.adjei@elmaconstruction.com', name: 'Kofi Adjei', role: 'hirer', company: 'Elma Construction Group' },
  { email: 'yaw.opoku@grandrealestate.com', name: 'Yaw Opoku', role: 'hirer', company: 'Grand Real Estate Development' },
  { email: 'abena.owusu@cityviewdevelopers.com', name: 'Abena Owusu', role: 'hirer', company: 'City View Developers' },
  { email: 'kwaku.darko@coastalproperties.com', name: 'Kwaku Darko', role: 'hirer', company: 'Coastal Properties Ltd' },
  { email: 'margaret.agyei@gmail.com', name: 'Margaret Agyei', role: 'hirer', company: 'Margaret\'s Properties' },
  { email: 'joseph.appiah@gmail.com', name: 'Joseph Appiah', role: 'hirer', company: 'Joe\'s Home Investments' },
  { email: 'grace.adomako@gmail.com', name: 'Grace Adomako', role: 'hirer', company: 'Grace Property Holdings' },
  { email: 'daniel.ofori@gmail.com', name: 'Daniel Ofori', role: 'hirer', company: 'Dan\'s Property Solutions' },
  { email: 'rebecca.boadu@palmgrovehotel.com', name: 'Rebecca Boadu', role: 'hirer', company: 'Palm Grove Hotel' },
  { email: 'charles.nkrumah@goldenlodge.com', name: 'Charles Nkrumah', role: 'hirer', company: 'Golden Lodge Resort' },
  { email: 'comfort.amponsah@beachviewhotel.com', name: 'Comfort Amponsah', role: 'hirer', company: 'Beach View Hotel' },
  { email: 'emmanuel.tetteh@maxvalue.com', name: 'Emmanuel Tetteh', role: 'hirer', company: 'Max Value Supermarket' },
  { email: 'vivian.asiedu@plazacentre.com', name: 'Vivian Asiedu', role: 'hirer', company: 'Plaza Shopping Centre' },
  { email: 'francis.hayford@citymarket.com', name: 'Francis Hayford', role: 'hirer', company: 'City Market Complex' },
  { email: 'sarah.kuffour@govgh.org', name: 'Sarah Kuffour', role: 'hirer', company: 'Ministry of Infrastructure' },
  { email: 'isaac.obeng@communitydev.org', name: 'Isaac Obeng', role: 'hirer', company: 'Community Development Foundation' }
];

async function verifyAllUsers() {
  console.log('✅ VERIFYING ALL 40 USERS IN DATABASE');
  console.log('=====================================');
  console.log('Testing login for all users to find verified ones...\n');

  const results = {
    verified: [],
    needsVerification: [],
    accountLocked: [],
    errors: []
  };

  for (let i = 0; i < ALL_USERS.length; i++) {
    const user = ALL_USERS[i];
    console.log(`🔄 Testing ${i + 1}/40: ${user.name} (${user.role})`);
    console.log(`   Email: ${user.email}`);

    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: user.email,
        password: 'TestUser123!'
      }, { timeout: 8000 });

      if (response.data.success || response.data.data?.token) {
        console.log(`   🎉 LOGIN SUCCESS! User is verified and ready!`);
        results.verified.push({
          ...user,
          token: response.data.data?.token || response.data.token,
          userData: response.data.data?.user || response.data.user
        });
      }

    } catch (error) {
      if (error.response?.status === 401) {
        if (error.response.data?.message?.includes('verify your email')) {
          console.log(`   📧 Needs email verification`);
          results.needsVerification.push(user);
        } else {
          console.log(`   ❌ Invalid credentials`);
          results.errors.push({ ...user, error: 'Invalid credentials' });
        }
      } else if (error.response?.status === 423) {
        console.log(`   🔒 Account locked (too many attempts)`);
        results.accountLocked.push(user);
      } else {
        console.log(`   ❓ Error: ${error.response?.data?.message || error.message}`);
        results.errors.push({ ...user, error: error.response?.data?.message || error.message });
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return results;
}

async function generateReport(results) {
  console.log('\n📊 VERIFICATION RESULTS SUMMARY');
  console.log('===============================');
  console.log(`✅ Verified & Ready: ${results.verified.length} users`);
  console.log(`📧 Need Email Verification: ${results.needsVerification.length} users`);
  console.log(`🔒 Account Locked: ${results.accountLocked.length} users`);
  console.log(`❌ Other Errors: ${results.errors.length} users`);

  if (results.verified.length > 0) {
    console.log('\n🎉 WORKING CREDENTIALS (VERIFIED USERS):');
    console.log('========================================');
    results.verified.forEach((user, index) => {
      const details = user.profession || user.company;
      console.log(`${index + 1}. ${user.name} (${user.role})`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: TestUser123!`);
      console.log(`   💼 ${user.role === 'worker' ? 'Profession' : 'Company'}: ${details}`);
      console.log('');
    });

    console.log('🚀 USE THESE CREDENTIALS TO LOGIN IMMEDIATELY!');
    console.log('==============================================');
    console.log('1. Go to: https://kelmah-frontend-mu.vercel.app/login');
    console.log(`2. Use any of the ${results.verified.length} verified emails above`);
    console.log('3. Password: TestUser123!');
    console.log('4. Login should work immediately!');
  }

  if (results.needsVerification.length > 0) {
    console.log(`\n📧 USERS NEEDING EMAIL VERIFICATION (${results.needsVerification.length}):`);
    console.log('=================================================');
    results.needsVerification.slice(0, 5).forEach(user => {
      console.log(`• ${user.email} (${user.name})`);
    });
    if (results.needsVerification.length > 5) {
      console.log(`... and ${results.needsVerification.length - 5} more`);
    }
    
    console.log('\n💡 TO VERIFY THESE USERS:');
    console.log('1. Check email for verification links, OR');
    console.log('2. Use MongoDB Atlas to set isEmailVerified: true');
  }

  if (results.accountLocked.length > 0) {
    console.log(`\n🔒 ACCOUNT LOCKED (${results.accountLocked.length}):`);
    console.log('Wait 30 minutes or reset in MongoDB');
  }

  // Save detailed report
  const reportFile = path.join(__dirname, '40-USERS-VERIFICATION-REPORT.json');
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: ALL_USERS.length,
      verified: results.verified.length,
      needsVerification: results.needsVerification.length,
      accountLocked: results.accountLocked.length,
      errors: results.errors.length
    },
    ...results
  }, null, 2));

  console.log(`\n💾 Detailed report saved to: ${reportFile}`);

  return results;
}

async function main() {
  console.log('🎯 COMPLETE 40-USER VERIFICATION TEST');
  console.log('=====================================');
  console.log('Testing all 40 users that exist in your database\n');

  try {
    const results = await verifyAllUsers();
    await generateReport(results);

    console.log('\n🎊 VERIFICATION COMPLETE!');
    console.log('=========================');
    
    if (results.verified.length > 0) {
      console.log(`✅ You have ${results.verified.length} users ready to login immediately!`);
      console.log('🚀 Your Kelmah platform is ready for testing!');
    } else {
      console.log('📧 All users need email verification or account unlocking');
      console.log('💡 Check your email or use MongoDB Atlas to verify users');
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifyAllUsers };