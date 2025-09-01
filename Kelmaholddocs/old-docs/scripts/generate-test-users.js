/**
 * Generate 20 Test Users for Kelmah Platform
 * Creates realistic worker profiles with complete data for testing
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'https://kelmah-auth-service.onrender.com';
const OUTPUT_FILE = path.join(__dirname, 'test-users-credentials.json');

// Ghana Cities and Regions (5 locations, 4 users each)
const GHANA_LOCATIONS = [
  { city: 'Accra', region: 'Greater Accra', state: 'Greater Accra Region' },
  { city: 'Kumasi', region: 'Ashanti', state: 'Ashanti Region' },
  { city: 'Tamale', region: 'Northern', state: 'Northern Region' },
  { city: 'Cape Coast', region: 'Central', state: 'Central Region' },
  { city: 'Sekondi-Takoradi', region: 'Western', state: 'Western Region' }
];

// Vocational Jobs with Skills (10 professions, 2 users each)
const VOCATIONAL_JOBS = [
  {
    profession: 'Plumber',
    skills: ['Pipe Installation', 'Leak Repair', 'Drainage Systems', 'Water Heater Installation'],
    certifications: ['Ghana Water Company License', 'Plumbing Trade Certificate'],
    tools: ['Pipe Wrench', 'Drain Snake', 'Pipe Cutter', 'Soldering Kit']
  },
  {
    profession: 'Electrician',
    skills: ['Wiring Installation', 'Circuit Repair', 'Electrical Panel Setup', 'LED Installation'],
    certifications: ['Ghana Electrical License', 'Safety Certification'],
    tools: ['Multimeter', 'Wire Strippers', 'Electrical Tester', 'Conduit Bender']
  },
  {
    profession: 'Carpenter',
    skills: ['Furniture Making', 'Roof Construction', 'Cabinet Installation', 'Wood Finishing'],
    certifications: ['Carpentry Trade Certificate', 'Wood Working Safety License'],
    tools: ['Circular Saw', 'Router', 'Chisel Set', 'Measuring Tools']
  },
  {
    profession: 'Mason',
    skills: ['Bricklaying', 'Concrete Work', 'Plastering', 'Stone Setting'],
    certifications: ['Masonry Trade Certificate', 'Construction Safety License'],
    tools: ['Trowel', 'Level', 'Mason Line', 'Concrete Mixer']
  },
  {
    profession: 'Painter',
    skills: ['Interior Painting', 'Exterior Painting', 'Wall Preparation', 'Color Consultation'],
    certifications: ['Painting Trade Certificate', 'Chemical Safety License'],
    tools: ['Paint Brushes', 'Rollers', 'Spray Gun', 'Color Samples']
  },
  {
    profession: 'Welder',
    skills: ['Arc Welding', 'Gas Welding', 'Metal Fabrication', 'Equipment Repair'],
    certifications: ['Welding Certification', 'Safety Training Certificate'],
    tools: ['Welding Machine', 'Protective Gear', 'Metal Grinder', 'Welding Rods']
  },
  {
    profession: 'Mechanic',
    skills: ['Engine Repair', 'Brake Service', 'Transmission Work', 'Diagnostic Testing'],
    certifications: ['Automotive Service License', 'Motor Vehicle Inspector License'],
    tools: ['Socket Set', 'Diagnostic Scanner', 'Jack Stands', 'Oil Change Equipment']
  },
  {
    profession: 'Tailor',
    skills: ['Custom Clothing', 'Alterations', 'Traditional Wear', 'Pattern Making'],
    certifications: ['Fashion Design Certificate', 'Tailoring Trade License'],
    tools: ['Sewing Machine', 'Pattern Paper', 'Measuring Tape', 'Fabric Scissors']
  },
  {
    profession: 'Hair Stylist',
    skills: ['Hair Cutting', 'Hair Styling', 'Coloring', 'Hair Treatments'],
    certifications: ['Cosmetology License', 'Hair Styling Certificate'],
    tools: ['Hair Clippers', 'Styling Tools', 'Hair Dryer', 'Coloring Kit']
  },
  {
    profession: 'Gardener',
    skills: ['Landscaping', 'Plant Care', 'Garden Design', 'Tree Pruning'],
    certifications: ['Landscaping Certificate', 'Plant Care License'],
    tools: ['Pruning Shears', 'Lawn Mower', 'Garden Hose', 'Fertilizer Spreader']
  }
];

// Common Ghanaian Names
const FIRST_NAMES = {
  male: ['Kwame', 'Kofi', 'Kwaku', 'Yaw', 'Fiifi', 'Kwesi', 'Kwadwo', 'Akwasi', 'Yaw', 'Kojo'],
  female: ['Akosua', 'Efua', 'Ama', 'Yaa', 'Adwoa', 'Afia', 'Akua', 'Esi', 'Abena', 'Adjoa']
};

const LAST_NAMES = [
  'Asante', 'Mensah', 'Osei', 'Adjei', 'Boateng', 'Owusu', 'Agyei', 'Darko', 'Antwi', 'Oppong',
  'Gyamfi', 'Acheampong', 'Addai', 'Wiredu', 'Frimpong', 'Nyarko', 'Bediako', 'Appiah', 'Danso', 'Ofori'
];

// Generate realistic user data
function generateUser(index) {
  const isEven = index % 2 === 0;
  const gender = isEven ? 'male' : 'female';
  const locationIndex = Math.floor(index / 4); // 4 users per location
  const professionIndex = Math.floor(index / 2); // 2 users per profession
  
  const firstName = FIRST_NAMES[gender][index % 10];
  const lastName = LAST_NAMES[index % 20];
  const location = GHANA_LOCATIONS[locationIndex];
  const profession = VOCATIONAL_JOBS[professionIndex];
  
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@kelmah.test`;
  const phone = `+233${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  
  return {
    // Basic Info
    firstName,
    lastName,
    email,
    phone,
    password: 'TestUser123!',
    role: 'worker',
    
    // Profile Info
    gender,
    bio: `Experienced ${profession.profession.toLowerCase()} with ${Math.floor(Math.random() * 10) + 2} years of experience in ${location.city}, Ghana. Specializing in ${profession.skills.slice(0, 2).join(' and ')}.`,
    dateOfBirth: new Date(1985 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    
    // Location
    address: `${Math.floor(Math.random() * 999) + 1} ${['Nkrumah', 'Independence', 'Liberation', 'Unity', 'Freedom'][Math.floor(Math.random() * 5)]} Street`,
    city: location.city,
    state: location.state,
    country: 'Ghana',
    postalCode: `GA-${Math.floor(Math.random() * 9000) + 1000}`,
    
    // Professional Info
    profession: profession.profession,
    skills: profession.skills,
    certifications: profession.certifications,
    tools: profession.tools,
    yearsExperience: Math.floor(Math.random() * 10) + 2,
    hourlyRate: Math.floor(Math.random() * 50) + 30, // GHS 30-80 per hour
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].slice(0, Math.floor(Math.random() * 3) + 4),
    
    // Ratings and Portfolio
    rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0 rating
    completedProjects: Math.floor(Math.random() * 50) + 10,
    portfolioImages: [
      `https://via.placeholder.com/400x300?text=${profession.profession}+Work+1`,
      `https://via.placeholder.com/400x300?text=${profession.profession}+Work+2`,
      `https://via.placeholder.com/400x300?text=${profession.profession}+Work+3`
    ]
  };
}

// API Client
class KelmahAPI {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async registerUser(userData) {
    try {
      const response = await this.client.post('/api/auth/register', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  async loginUser(email, password) {
    try {
      const response = await this.client.post('/api/auth/login', {
        email,
        password
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  async updateProfile(token, profileData) {
    try {
      const response = await this.client.put('/api/users/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  async addSkills(token, skills) {
    try {
      const response = await this.client.post('/api/users/me/skills', { skills }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }
}

// Main execution function
async function generateTestUsers() {
  console.log('🚀 Starting Test User Generation for Kelmah Platform\n');
  
  const api = new KelmahAPI(API_BASE_URL);
  const results = [];
  const loginCredentials = [];

  for (let i = 0; i < 20; i++) {
    const userData = generateUser(i);
    console.log(`\n📝 Creating user ${i + 1}/20: ${userData.firstName} ${userData.lastName} (${userData.profession} in ${userData.city})`);

    // 1. Register User
    console.log('   ➤ Registering user...');
    const registerResult = await api.registerUser(userData);
    
    if (!registerResult.success) {
      console.log(`   ❌ Registration failed: ${registerResult.error}`);
      results.push({
        ...userData,
        registrationStatus: 'failed',
        registrationError: registerResult.error
      });
      continue;
    }

    console.log('   ✅ User registered successfully');

    // Add login credentials
    loginCredentials.push({
      id: i + 1,
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      password: userData.password,
      profession: userData.profession,
      location: userData.city,
      loginUrl: 'https://kelmah-frontend-mu.vercel.app/login'
    });

    // 2. Login to get token (for future profile updates)
    console.log('   ➤ Logging in to get access token...');
    const loginResult = await api.loginUser(userData.email, userData.password);
    
    if (!loginResult.success) {
      console.log(`   ⚠️  Login failed (but registration succeeded): ${loginResult.error}`);
      results.push({
        ...userData,
        registrationStatus: 'success',
        loginStatus: 'failed',
        loginError: loginResult.error
      });
      continue;
    }

    console.log('   ✅ Login successful');

    results.push({
      ...userData,
      registrationStatus: 'success',
      loginStatus: 'success',
      token: loginResult.data.token
    });

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Save results
  const output = {
    summary: {
      totalUsers: 20,
      successfulRegistrations: results.filter(r => r.registrationStatus === 'success').length,
      successfulLogins: results.filter(r => r.loginStatus === 'success').length,
      generatedAt: new Date().toISOString()
    },
    loginCredentials,
    detailedResults: results,
    locations: GHANA_LOCATIONS,
    professions: VOCATIONAL_JOBS.map(p => p.profession)
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  
  console.log('\n🎉 Test User Generation Complete!');
  console.log(`📊 Summary:`);
  console.log(`   • Total Users: ${output.summary.totalUsers}`);
  console.log(`   • Successful Registrations: ${output.summary.successfulRegistrations}`);
  console.log(`   • Successful Logins: ${output.summary.successfulLogins}`);
  console.log(`\n📋 Login Credentials:`);
  console.log('   ┌─────────────────────────────────────────────────────────────────┐');
  console.log('   │                        LOGIN CREDENTIALS                        │');
  console.log('   ├─────────────────────────────────────────────────────────────────┤');
  
  loginCredentials.forEach((user, index) => {
    console.log(`   │ ${(index + 1).toString().padStart(2)}. ${user.name.padEnd(20)} │ ${user.profession.padEnd(12)} │ ${user.location.padEnd(10)} │`);
    console.log(`   │     Email: ${user.email.padEnd(35)} │`);
    console.log(`   │     Password: ${user.password.padEnd(31)} │`);
    if (index < loginCredentials.length - 1) {
      console.log('   ├─────────────────────────────────────────────────────────────────┤');
    }
  });
  
  console.log('   └─────────────────────────────────────────────────────────────────┘');
  console.log(`\n💾 Detailed results saved to: ${OUTPUT_FILE}`);
  console.log(`🌐 Login URL: https://kelmah-frontend-mu.vercel.app/login`);

  return output;
}

// Execute if run directly
if (require.main === module) {
  generateTestUsers().catch(console.error);
}

module.exports = { generateTestUsers, GHANA_LOCATIONS, VOCATIONAL_JOBS }; 