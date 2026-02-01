/**
 * Verify Test Users and Complete Their Profiles
 * Bypasses email verification and adds complete profile data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'https://kelmah-auth-service.onrender.com';
const INPUT_FILE = path.join(__dirname, 'test-users-credentials.json');
const OUTPUT_FILE = path.join(__dirname, 'verified-users-data.json');

// Load test users data
const testUsersData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

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

  async verifyEmail(token) {
    try {
      const response = await this.client.get(`/api/auth/verify/${token}`);
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

  async getUserProfile(token) {
    try {
      const response = await this.client.get('/api/users/profile', {
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

  // Alternative: Direct database update (if we have access)
  async forceVerifyUser(email) {
    try {
      // This would require backend endpoint for admin actions
      const response = await this.client.post('/api/admin/verify-user', {
        email
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

// Generate portfolio data for each profession
function generatePortfolioData(user) {
  const portfolioProjects = [];
  const numProjects = Math.floor(Math.random() * 5) + 3; // 3-7 projects

  for (let i = 0; i < numProjects; i++) {
    const project = {
      id: `${user.profession.toLowerCase()}_project_${i + 1}`,
      title: generateProjectTitle(user.profession, i),
      description: generateProjectDescription(user.profession, i),
      completedDate: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      duration: `${Math.floor(Math.random() * 30) + 1} days`,
      cost: Math.floor(Math.random() * 5000) + 1000, // GHS 1000-6000
      location: user.city,
      images: [
        `https://via.placeholder.com/600x400?text=${user.profession}+Project+${i + 1}+Before`,
        `https://via.placeholder.com/600x400?text=${user.profession}+Project+${i + 1}+After`
      ],
      clientRating: (Math.random() * 1.5 + 3.5).toFixed(1),
      skills_used: user.skills.slice(0, Math.floor(Math.random() * user.skills.length) + 1)
    };
    portfolioProjects.push(project);
  }

  return portfolioProjects;
}

function generateProjectTitle(profession, index) {
  const projectTypes = {
    'Plumber': [
      'Complete Bathroom Renovation',
      'Kitchen Sink Installation',
      'Water Heater Replacement',
      'Drain Cleaning Service',
      'Pipe Repair and Replacement'
    ],
    'Electrician': [
      'House Rewiring Project',
      'LED Lighting Installation',
      'Electrical Panel Upgrade',
      'Solar Panel Setup',
      'Security System Installation'
    ],
    'Carpenter': [
      'Custom Kitchen Cabinets',
      'Wooden Deck Construction',
      'Furniture Restoration',
      'Built-in Wardrobe',
      'Hardwood Floor Installation'
    ],
    'Mason': [
      'Residential Wall Construction',
      'Driveway Paving',
      'Stone Garden Wall',
      'Concrete Foundation',
      'Brick Chimney Repair'
    ],
    'Painter': [
      'Exterior House Painting',
      'Interior Room Makeover',
      'Commercial Building Paint',
      'Decorative Wall Art',
      'Fence Painting Service'
    ],
    'Welder': [
      'Metal Gate Fabrication',
      'Steel Staircase Construction',
      'Car Exhaust Repair',
      'Metal Furniture Creation',
      'Industrial Equipment Repair'
    ],
    'Mechanic': [
      'Engine Overhaul Service',
      'Brake System Replacement',
      'Transmission Repair',
      'Air Conditioning Fix',
      'Vehicle Inspection Service'
    ],
    'Tailor': [
      'Wedding Dress Creation',
      'Business Suit Tailoring',
      'Traditional Kente Wear',
      'School Uniform Production',
      'Fabric Alteration Service'
    ],
    'Hair Stylist': [
      'Bridal Hair Styling',
      'Hair Color Transformation',
      'Dreadlock Installation',
      'Hair Treatment Service',
      'Special Event Styling'
    ],
    'Gardener': [
      'Landscape Garden Design',
      'Lawn Maintenance Service',
      'Tree Pruning Project',
      'Flower Bed Installation',
      'Garden Irrigation Setup'
    ]
  };

  const titles = projectTypes[profession] || ['Custom Project'];
  return titles[index % titles.length];
}

function generateProjectDescription(profession, index) {
  const descriptions = {
    'Plumber': [
      'Complete renovation of family bathroom including new fixtures, modern piping, and leak-proof installation.',
      'Professional kitchen sink installation with garbage disposal and water filtration system.',
      'Replacement of old water heater with energy-efficient unit including warranty and maintenance.',
      'Emergency drain cleaning service for blocked pipes with long-term prevention solution.',
      'Full pipe repair and replacement for aging plumbing system in residential property.'
    ],
    'Electrician': [
      'Complete house rewiring project ensuring safety standards and modern electrical code compliance.',
      'Installation of energy-efficient LED lighting system throughout residential property.',
      'Upgrade of electrical panel to handle modern appliances and improve electrical safety.',
      'Professional solar panel installation with battery backup and grid connection.',
      'Complete security system installation including cameras, alarms, and monitoring equipment.'
    ],
    'Carpenter': [
      'Custom-designed kitchen cabinets using quality hardwood with modern hardware and finishes.',
      'Construction of outdoor wooden deck with weatherproofing and safety railings.',
      'Professional furniture restoration preserving original character while improving functionality.',
      'Built-in wardrobe design maximizing space efficiency with custom storage solutions.',
      'Hardwood floor installation with professional finishing and long-term durability guarantee.'
    ],
    'Mason': [
      'Construction of residential walls using quality materials and ensuring structural integrity.',
      'Driveway paving project with proper drainage and long-lasting concrete mixture.',
      'Decorative stone garden wall enhancing property aesthetics and providing privacy.',
      'Concrete foundation work for new construction ensuring stability and waterproofing.',
      'Brick chimney repair restoring functionality and improving home safety.'
    ],
    'Painter': [
      'Exterior house painting using weather-resistant paint with proper surface preparation.',
      'Interior room makeover with color consultation and premium paint application.',
      'Commercial building painting project completed on schedule with minimal business disruption.',
      'Creative decorative wall art adding personality and value to residential space.',
      'Professional fence painting service using durable paint suitable for outdoor conditions.'
    ],
    'Welder': [
      'Custom metal gate fabrication with artistic design and security features.',
      'Steel staircase construction ensuring safety standards and aesthetic appeal.',
      'Car exhaust system repair using quality materials and professional welding techniques.',
      'Custom metal furniture creation combining functionality with modern design.',
      'Industrial equipment repair ensuring operational efficiency and safety compliance.'
    ],
    'Mechanic': [
      'Complete engine overhaul service restoring vehicle performance and reliability.',
      'Brake system replacement ensuring vehicle safety and optimal stopping performance.',
      'Transmission repair using quality parts and professional diagnostic equipment.',
      'Air conditioning system repair providing comfortable driving experience.',
      'Comprehensive vehicle inspection service ensuring roadworthiness and safety.'
    ],
    'Tailor': [
      'Custom wedding dress creation with intricate beadwork and perfect fit guarantee.',
      'Professional business suit tailoring using premium fabrics and precise measurements.',
      'Traditional Kente wear creation honoring cultural heritage with modern styling.',
      'School uniform production meeting institutional requirements and durability standards.',
      'Professional fabric alteration service ensuring perfect fit and style improvement.'
    ],
    'Hair Stylist': [
      'Bridal hair styling service creating elegant looks for special day perfection.',
      'Complete hair color transformation using professional products and techniques.',
      'Professional dreadlock installation with proper care and maintenance guidance.',
      'Hair treatment service restoring health and shine to damaged hair.',
      'Special event styling creating unique looks for memorable occasions.'
    ],
    'Gardener': [
      'Complete landscape garden design incorporating native plants and sustainable practices.',
      'Professional lawn maintenance service ensuring healthy grass and weed control.',
      'Tree pruning project improving tree health and property safety.',
      'Flower bed installation with seasonal planning and soil improvement.',
      'Garden irrigation setup ensuring efficient water usage and plant health.'
    ]
  };

  const professionDesc = descriptions[profession] || ['Professional service completed to high standards.'];
  return professionDesc[index % professionDesc.length];
}

// Main execution function
async function verifyAndCompleteProfiles() {
  console.log('🔧 Starting Profile Completion for Test Users\n');
  
  const api = new KelmahAPI(API_BASE_URL);
  const results = [];
  const completedUsers = [];

  for (let i = 0; i < testUsersData.loginCredentials.length; i++) {
    const user = testUsersData.loginCredentials[i];
    const fullUserData = testUsersData.detailedResults[i];
    
    console.log(`\n🔧 Processing user ${i + 1}/20: ${user.name} (${user.profession})`);

    // Try to login first (in case they're already verified)
    console.log('   ➤ Attempting login...');
    let loginResult = await api.loginUser(user.email, user.password);
    
    if (!loginResult.success) {
      console.log(`   ⚠️  Login failed: ${loginResult.error}`);
      
      // For now, we'll skip email verification since we don't have access to the verification tokens
      // In a real scenario, you would either:
      // 1. Have admin access to mark users as verified
      // 2. Use the verification tokens from the email service
      // 3. Temporarily disable email verification for test users
      
      results.push({
        ...user,
        status: 'verification_required',
        error: 'Email verification required - cannot complete profile'
      });
      continue;
    }

    console.log('   ✅ Login successful');
    const token = loginResult.data.token;

    // Get current profile
    console.log('   ➤ Fetching current profile...');
    const profileResult = await api.getUserProfile(token);
    
    if (!profileResult.success) {
      console.log(`   ❌ Failed to fetch profile: ${profileResult.error}`);
      results.push({
        ...user,
        status: 'profile_fetch_failed',
        error: profileResult.error
      });
      continue;
    }

    // Generate complete profile data
    const portfolioProjects = generatePortfolioData(fullUserData);
    
    const completeProfile = {
      bio: fullUserData.bio,
      dateOfBirth: fullUserData.dateOfBirth,
      gender: fullUserData.gender,
      address: fullUserData.address,
      city: fullUserData.city,
      state: fullUserData.state,
      country: fullUserData.country,
      postalCode: fullUserData.postalCode,
      skills: fullUserData.skills,
      profession: fullUserData.profession,
      yearsExperience: fullUserData.yearsExperience,
      hourlyRate: fullUserData.hourlyRate,
      availability: fullUserData.availability,
      certifications: fullUserData.certifications,
      tools: fullUserData.tools,
      portfolioProjects: portfolioProjects
    };

    // Update profile
    console.log('   ➤ Updating profile with complete data...');
    const updateResult = await api.updateProfile(token, completeProfile);
    
    if (!updateResult.success) {
      console.log(`   ⚠️  Profile update failed: ${updateResult.error}`);
      results.push({
        ...user,
        status: 'profile_update_failed',
        error: updateResult.error,
        token: token
      });
      continue;
    }

    console.log('   ✅ Profile updated successfully');

    const completedUser = {
      ...user,
      ...completeProfile,
      portfolioProjects: portfolioProjects,
      status: 'completed',
      token: token,
      profileUrl: `https://kelmah-frontend-mu.vercel.app/profile/${user.id}`,
      completedAt: new Date().toISOString()
    };

    completedUsers.push(completedUser);
    results.push(completedUser);

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Save results
  const output = {
    summary: {
      totalUsers: testUsersData.loginCredentials.length,
      completedProfiles: completedUsers.length,
      verificationRequired: results.filter(r => r.status === 'verification_required').length,
      errors: results.filter(r => r.status && r.status.includes('failed')).length,
      processedAt: new Date().toISOString()
    },
    completedUsers,
    allResults: results,
    originalData: testUsersData
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  
  console.log('\n🎉 Profile Completion Process Finished!');
  console.log(`📊 Summary:`);
  console.log(`   • Total Users: ${output.summary.totalUsers}`);
  console.log(`   • Completed Profiles: ${output.summary.completedProfiles}`);
  console.log(`   • Verification Required: ${output.summary.verificationRequired}`);
  console.log(`   • Errors: ${output.summary.errors}`);
  
  if (completedUsers.length > 0) {
    console.log(`\n✅ Successfully Completed Users:`);
    completedUsers.forEach(user => {
      console.log(`   • ${user.name} (${user.profession}) - ${user.city}`);
    });
  }

  console.log(`\n💾 Results saved to: ${OUTPUT_FILE}`);
  
  return output;
}

// Execute if run directly
if (require.main === module) {
  verifyAndCompleteProfiles().catch(console.error);
}

module.exports = { verifyAndCompleteProfiles }; 