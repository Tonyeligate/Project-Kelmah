#!/usr/bin/env node

/**
 * 🔧 WORKER PROFILE ENHANCEMENT SCRIPT
 * Enhances existing 20 verified worker users with complete portfolio data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://kelmah-auth-service.onrender.com';
const VERIFIED_USERS_FILE = path.join(__dirname, 'verified-users-final.json');
const OUTPUT_FILE = path.join(__dirname, 'enhanced-worker-profiles.json');

// Load verified users
const verifiedUsers = JSON.parse(fs.readFileSync(VERIFIED_USERS_FILE, 'utf8'));

// Enhanced portfolio data for each profession
const generatePortfolioProjects = (user) => {
  const projectTemplates = {
    'Plumber': [
      {
        title: 'Complete Bathroom Renovation - East Legon',
        description: 'Full bathroom renovation including new piping, modern fixtures, and waterproof installation for a 3-bedroom house.',
        category: 'Bathroom Renovation',
        completedDate: '2024-01-15',
        duration: '5 days',
        cost: 4500,
        location: 'East Legon, Accra',
        clientName: 'Mr. Kwame Asante',
        clientRating: 4.9,
        skillsUsed: ['Pipe Installation', 'Leak Repair', 'Fixture Installation'],
        toolsUsed: ['Pipe Wrench', 'Soldering Kit', 'Drain Snake'],
        images: [
          'https://via.placeholder.com/600x400?text=Bathroom+Before',
          'https://via.placeholder.com/600x400?text=Bathroom+After'
        ]
      },
      {
        title: 'Kitchen Sink and Disposal Installation',
        description: 'Professional installation of double-basin kitchen sink with garbage disposal system and water filtration.',
        category: 'Kitchen Plumbing',
        completedDate: '2024-02-20',
        duration: '2 days',
        cost: 2200,
        location: 'Tema, Greater Accra',
        clientName: 'Mrs. Ama Osei',
        clientRating: 4.8,
        skillsUsed: ['Pipe Installation', 'Fixture Installation', 'Water Systems'],
        toolsUsed: ['Pipe Wrench', 'Tube Cutter', 'Level'],
        images: [
          'https://via.placeholder.com/600x400?text=Kitchen+Sink+Installation'
        ]
      }
    ],
    'Electrician': [
      {
        title: 'Complete House Rewiring - Airport Residential',
        description: 'Full electrical rewiring for a 4-bedroom house including modern circuit breakers, LED lighting, and safety upgrades.',
        category: 'Residential Wiring',
        completedDate: '2024-01-10',
        duration: '7 days',
        cost: 8500,
        location: 'Airport Residential, Accra',
        clientName: 'Dr. Kofi Mensah',
        clientRating: 5.0,
        skillsUsed: ['Wiring Installation', 'Circuit Design', 'Safety Systems'],
        toolsUsed: ['Multimeter', 'Wire Strippers', 'Conduit Bender'],
        images: [
          'https://via.placeholder.com/600x400?text=Electrical+Panel+Before',
          'https://via.placeholder.com/600x400?text=Modern+Electrical+Panel'
        ]
      }
    ],
    'Carpenter': [
      {
        title: 'Custom Kitchen Cabinets - Luxury Home',
        description: 'Design and installation of custom mahogany kitchen cabinets with soft-close hardware and granite countertop support.',
        category: 'Kitchen Renovation',
        completedDate: '2024-01-25',
        duration: '10 days',
        cost: 12000,
        location: 'East Legon, Accra',
        clientName: 'Mr. Joseph Appiah',
        clientRating: 4.9,
        skillsUsed: ['Cabinet Making', 'Wood Finishing', 'Hardware Installation'],
        toolsUsed: ['Router', 'Table Saw', 'Finishing Sanders'],
        images: [
          'https://via.placeholder.com/600x400?text=Custom+Kitchen+Cabinets'
        ]
      }
    ]
    // Add more professions as needed
  };

  const profession = user.profession;
  const templates = projectTemplates[profession] || projectTemplates['Plumber'];
  
  return templates.map((template, index) => ({
    ...template,
    id: `${profession.toLowerCase()}_${user.id}_${index + 1}`,
    workerId: user.id
  }));
};

// Generate work history
const generateWorkHistory = (user) => {
  return [
    {
      id: `work_${user.id}_1`,
      jobTitle: `Senior ${user.profession}`,
      company: `${user.location} Construction Services`,
      startDate: '2020-01-01',
      endDate: '2023-12-31',
      description: `Lead ${user.profession.toLowerCase()} responsible for residential and commercial projects.`,
      achievements: [
        'Completed 50+ successful projects',
        'Maintained 98% client satisfaction rate',
        'Trained 5 junior workers'
      ]
    },
    {
      id: `work_${user.id}_2`,
      jobTitle: `${user.profession} Contractor`,
      company: 'Freelance',
      startDate: '2024-01-01',
      endDate: null, // Current
      description: 'Independent contractor providing specialized services to residential and commercial clients.',
      achievements: [
        'Built strong client base through referrals',
        'Expanded service offerings',
        'Maintained 5-star rating average'
      ]
    }
  ];
};

// Generate certifications
const generateCertifications = (user) => {
  const certificationsByProfession = {
    'Plumber': [
      {
        name: 'Ghana Water Company Certified Plumber',
        issuer: 'Ghana Water Company Limited',
        issueDate: '2020-06-15',
        expiryDate: '2025-06-15',
        credentialId: 'GWC-PLB-2020-' + user.id,
        verified: true
      },
      {
        name: 'Advanced Plumbing Systems Certificate',
        issuer: 'Accra Technical University',
        issueDate: '2021-03-20',
        expiryDate: null,
        credentialId: 'ATU-APS-2021-' + user.id,
        verified: true
      }
    ],
    'Electrician': [
      {
        name: 'Ghana Electrical License',
        issuer: 'Energy Commission of Ghana',
        issueDate: '2019-09-10',
        expiryDate: '2024-09-10',
        credentialId: 'ECG-ELC-2019-' + user.id,
        verified: true
      },
      {
        name: 'Solar Installation Certification',
        issuer: 'Ghana Solar Industry Association',
        issueDate: '2022-05-15',
        expiryDate: '2027-05-15',
        credentialId: 'GSIA-SOL-2022-' + user.id,
        verified: true
      }
    ],
    'Carpenter': [
      {
        name: 'Master Carpenter Certification',
        issuer: 'Ghana Institute of Carpenters',
        issueDate: '2020-11-30',
        expiryDate: null,
        credentialId: 'GIC-MC-2020-' + user.id,
        verified: true
      }
    ]
  };

  return certificationsByProfession[user.profession] || certificationsByProfession['Plumber'];
};

async function enhanceWorkerProfiles() {
  console.log('🔧 ENHANCING WORKER PROFILES WITH COMPLETE DATA');
  console.log('=============================================');

  const results = [];
  const successfulEnhancements = [];

  for (let i = 0; i < verifiedUsers.workingUsers.length; i++) {
    const user = verifiedUsers.workingUsers[i];
    
    console.log(`\n🔄 Enhancing profile ${i + 1}/20: ${user.name}`);
    console.log(`   Profession: ${user.profession}`);
    console.log(`   Location: ${user.location}`);

    try {
      // Generate enhanced profile data
      const portfolioProjects = generatePortfolioProjects(user);
      const workHistory = generateWorkHistory(user);
      const certifications = generateCertifications(user);

      const enhancedProfile = {
        // Basic user info from verified users
        ...user,
        
        // Enhanced portfolio
        portfolioProjects,
        
        // Work history
        workHistory,
        
        // Certifications
        certifications,
        
        // Additional professional details
        professionalSummary: `Experienced ${user.profession.toLowerCase()} with ${Math.floor(Math.random() * 5) + 5} years of expertise in ${user.location}. Specializing in high-quality residential and commercial projects with a focus on customer satisfaction and timely delivery.`,
        
        // Availability and rates
        availability: {
          weekdays: true,
          weekends: true,
          evenings: false,
          emergencyCallouts: true,
          vacationMode: false
        },
        
        // Service areas
        serviceAreas: [user.location, 'Greater Accra Region', 'Surrounding Areas'],
        
        // Professional stats
        stats: {
          totalProjects: Math.floor(Math.random() * 30) + 20,
          repeatClients: Math.floor(Math.random() * 10) + 5,
          onTimeCompletion: 98,
          clientSatisfaction: 4.8,
          responseTime: '< 2 hours'
        },
        
        // Enhancement metadata
        enhancementDate: new Date().toISOString(),
        profileCompleteness: 100
      };

      // In a real implementation, you would update the user profile via API
      // For now, we'll just store the enhanced data
      
      successfulEnhancements.push(enhancedProfile);
      results.push({
        userId: user.id,
        status: 'enhanced_successfully',
        enhancedProfile
      });
      
      console.log(`   ✅ Profile enhanced successfully`);
      console.log(`   📊 Added ${portfolioProjects.length} portfolio projects`);
      console.log(`   📜 Added ${certifications.length} certifications`);

    } catch (error) {
      const result = {
        userId: user.id,
        status: 'enhancement_failed',
        error: error.message
      };

      results.push(result);
      console.log(`   ❌ Enhancement failed: ${error.message}`);
    }

    // Add delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save enhanced profiles
  const output = {
    summary: {
      totalUsers: verifiedUsers.workingUsers.length,
      successfulEnhancements: successfulEnhancements.length,
      failures: results.filter(r => r.status === 'enhancement_failed').length,
      processedAt: new Date().toISOString()
    },
    enhancedWorkerProfiles: successfulEnhancements,
    allResults: results,
    originalVerifiedUsers: verifiedUsers
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log('\n🎉 WORKER PROFILE ENHANCEMENT COMPLETED!');
  console.log(`📊 Summary:`);
  console.log(`   • Total Users: ${output.summary.totalUsers}`);
  console.log(`   • Successfully Enhanced: ${output.summary.successfulEnhancements}`);
  console.log(`   • Failed: ${output.summary.failures}`);
  console.log(`\n💾 Enhanced profiles saved to: ${OUTPUT_FILE}`);

  if (successfulEnhancements.length > 0) {
    console.log(`\n✅ Enhanced Worker Profiles:`);
    successfulEnhancements.forEach(user => {
      console.log(`   • ${user.name} (${user.profession}) - ${user.portfolioProjects.length} projects, ${user.certifications.length} certs`);
    });
  }

  return output;
}

if (require.main === module) {
  enhanceWorkerProfiles().catch(console.error);
}

module.exports = { enhanceWorkerProfiles };