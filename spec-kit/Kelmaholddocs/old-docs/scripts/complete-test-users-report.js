/**
 * Complete Test Users Report Generator
 * Creates a comprehensive report with all user data, profiles, and credentials
 */

const fs = require('fs');
const path = require('path');

// Ghana Cities and Regions (5 locations, 4 users each)
const GHANA_LOCATIONS = [
  { city: 'Accra', region: 'Greater Accra', state: 'Greater Accra Region' },
  { city: 'Kumasi', region: 'Ashanti', state: 'Ashanti Region' },
  { city: 'Tamale', region: 'Northern', state: 'Northern Region' },
  { city: 'Cape Coast', region: 'Central', state: 'Central Region' },
  { city: 'Sekondi-Takoradi', region: 'Western', state: 'Western Region' }
];

// Vocational Jobs with Complete Information (10 professions, 2 users each)
const VOCATIONAL_JOBS = [
  {
    profession: 'Plumber',
    skills: ['Pipe Installation', 'Leak Repair', 'Drainage Systems', 'Water Heater Installation', 'Bathroom Fitting'],
    certifications: ['Ghana Water Company License', 'Plumbing Trade Certificate', 'Safety Training Certificate'],
    tools: ['Pipe Wrench', 'Drain Snake', 'Pipe Cutter', 'Soldering Kit', 'Pressure Tester'],
    avgHourlyRate: 45,
    description: 'Professional plumbing services including installation, repair, and maintenance'
  },
  {
    profession: 'Electrician',
    skills: ['Wiring Installation', 'Circuit Repair', 'Electrical Panel Setup', 'LED Installation', 'Solar Installation'],
    certifications: ['Ghana Electrical License', 'Safety Certification', 'Solar Panel Installation Certificate'],
    tools: ['Multimeter', 'Wire Strippers', 'Electrical Tester', 'Conduit Bender', 'Voltage Detector'],
    avgHourlyRate: 50,
    description: 'Expert electrical services for residential and commercial properties'
  },
  {
    profession: 'Carpenter',
    skills: ['Furniture Making', 'Roof Construction', 'Cabinet Installation', 'Wood Finishing', 'Custom Joinery'],
    certifications: ['Carpentry Trade Certificate', 'Wood Working Safety License', 'Furniture Design Certificate'],
    tools: ['Circular Saw', 'Router', 'Chisel Set', 'Measuring Tools', 'Wood Planer'],
    avgHourlyRate: 40,
    description: 'Skilled carpentry and woodworking for custom furniture and construction'
  },
  {
    profession: 'Mason',
    skills: ['Bricklaying', 'Concrete Work', 'Plastering', 'Stone Setting', 'Foundation Work'],
    certifications: ['Masonry Trade Certificate', 'Construction Safety License', 'Concrete Specialist Certificate'],
    tools: ['Trowel', 'Level', 'Mason Line', 'Concrete Mixer', 'Stone Chisel'],
    avgHourlyRate: 42,
    description: 'Professional masonry services for construction and renovation projects'
  },
  {
    profession: 'Painter',
    skills: ['Interior Painting', 'Exterior Painting', 'Wall Preparation', 'Color Consultation', 'Decorative Painting'],
    certifications: ['Painting Trade Certificate', 'Chemical Safety License', 'Color Theory Certificate'],
    tools: ['Paint Brushes', 'Rollers', 'Spray Gun', 'Color Samples', 'Drop Cloths'],
    avgHourlyRate: 35,
    description: 'Professional painting services with color consultation and quality finishes'
  },
  {
    profession: 'Welder',
    skills: ['Arc Welding', 'Gas Welding', 'Metal Fabrication', 'Equipment Repair', 'Structural Welding'],
    certifications: ['Welding Certification', 'Safety Training Certificate', 'Metal Fabrication License'],
    tools: ['Welding Machine', 'Protective Gear', 'Metal Grinder', 'Welding Rods', 'Plasma Cutter'],
    avgHourlyRate: 55,
    description: 'Expert welding and metal fabrication for industrial and residential projects'
  },
  {
    profession: 'Mechanic',
    skills: ['Engine Repair', 'Brake Service', 'Transmission Work', 'Diagnostic Testing', 'Electrical Systems'],
    certifications: ['Automotive Service License', 'Motor Vehicle Inspector License', 'Diesel Engine Certificate'],
    tools: ['Socket Set', 'Diagnostic Scanner', 'Jack Stands', 'Oil Change Equipment', 'Torque Wrench'],
    avgHourlyRate: 48,
    description: 'Complete automotive repair and maintenance services for all vehicle types'
  },
  {
    profession: 'Tailor',
    skills: ['Custom Clothing', 'Alterations', 'Traditional Wear', 'Pattern Making', 'Embroidery'],
    certifications: ['Fashion Design Certificate', 'Tailoring Trade License', 'Traditional Wear Specialist'],
    tools: ['Sewing Machine', 'Pattern Paper', 'Measuring Tape', 'Fabric Scissors', 'Overlock Machine'],
    avgHourlyRate: 30,
    description: 'Custom tailoring and fashion design with traditional and modern styles'
  },
  {
    profession: 'Hair Stylist',
    skills: ['Hair Cutting', 'Hair Styling', 'Coloring', 'Hair Treatments', 'Braiding'],
    certifications: ['Cosmetology License', 'Hair Styling Certificate', 'Chemical Treatment License'],
    tools: ['Hair Clippers', 'Styling Tools', 'Hair Dryer', 'Coloring Kit', 'Braiding Accessories'],
    avgHourlyRate: 25,
    description: 'Professional hair styling and beauty services for all hair types'
  },
  {
    profession: 'Gardener',
    skills: ['Landscaping', 'Plant Care', 'Garden Design', 'Tree Pruning', 'Irrigation Systems'],
    certifications: ['Landscaping Certificate', 'Plant Care License', 'Irrigation Specialist Certificate'],
    tools: ['Pruning Shears', 'Lawn Mower', 'Garden Hose', 'Fertilizer Spreader', 'Hedge Trimmer'],
    avgHourlyRate: 28,
    description: 'Complete landscaping and garden maintenance services for beautiful outdoor spaces'
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

// Generate portfolio projects for each user
function generatePortfolioProjects(profession, userName, city) {
  const projectTemplates = {
    'Plumber': [
      'Complete Bathroom Renovation at Residential Property',
      'Kitchen Plumbing Installation and Repair',
      'Water Heater Replacement Service',
      'Emergency Drain Cleaning and Repair',
      'New Construction Plumbing Installation'
    ],
    'Electrician': [
      'Full House Rewiring Project',
      'Solar Panel Installation System',
      'LED Lighting Upgrade Service',
      'Electrical Panel Modernization',
      'Commercial Building Electrical Work'
    ],
    'Carpenter': [
      'Custom Kitchen Cabinet Creation',
      'Hardwood Flooring Installation',
      'Built-in Wardrobe Construction',
      'Outdoor Deck and Pergola Build',
      'Furniture Restoration Project'
    ],
    'Mason': [
      'Residential Foundation Construction',
      'Decorative Stone Wall Installation',
      'Driveway and Walkway Paving',
      'Brick Fireplace Construction',
      'Retaining Wall and Landscaping'
    ],
    'Painter': [
      'Exterior House Painting Project',
      'Interior Room Color Transformation',
      'Commercial Building Paint Job',
      'Decorative Wall Mural Creation',
      'Fence and Gate Painting Service'
    ],
    'Welder': [
      'Custom Metal Gate Fabrication',
      'Steel Staircase Construction',
      'Industrial Equipment Repair',
      'Decorative Iron Work Creation',
      'Automotive Exhaust System Repair'
    ],
    'Mechanic': [
      'Complete Engine Overhaul Service',
      'Transmission Rebuild Project',
      'Brake System Replacement',
      'Air Conditioning System Repair',
      'Vehicle Electrical Diagnostics'
    ],
    'Tailor': [
      'Wedding Dress Design and Creation',
      'Traditional Kente Wear Production',
      'Business Suit Tailoring Service',
      'School Uniform Manufacturing',
      'Fashion Alteration and Repair'
    ],
    'Hair Stylist': [
      'Bridal Hair and Makeup Service',
      'Hair Color Transformation',
      'Traditional Braiding Service',
      'Hair Treatment and Restoration',
      'Special Event Styling'
    ],
    'Gardener': [
      'Complete Landscape Garden Design',
      'Lawn Installation and Maintenance',
      'Tree Pruning and Care Service',
      'Garden Irrigation System Setup',
      'Flower Bed Design and Planting'
    ]
  };

  const templates = projectTemplates[profession] || ['Professional Service Project'];
  const projects = [];
  
  for (let i = 0; i < Math.min(3, templates.length); i++) {
    projects.push({
      id: `${profession.toLowerCase()}_${i + 1}`,
      title: templates[i],
      description: `Professional ${profession.toLowerCase()} service completed in ${city} by ${userName}. High-quality workmanship with customer satisfaction guarantee.`,
      completedDate: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      duration: `${Math.floor(Math.random() * 14) + 1} days`,
      cost: Math.floor(Math.random() * 4000) + 1000,
      clientRating: (Math.random() * 1.5 + 3.5).toFixed(1),
      images: [
        `https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300`,
        `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300`
      ]
    });
  }
  
  return projects;
}

// Generate complete user profile
function generateCompleteUser(index) {
  const isEven = index % 2 === 0;
  const gender = isEven ? 'male' : 'female';
  const locationIndex = Math.floor(index / 4);
  const professionIndex = Math.floor(index / 2);
  
  const firstName = FIRST_NAMES[gender][index % 10];
  const lastName = LAST_NAMES[index % 20];
  const location = GHANA_LOCATIONS[locationIndex];
  const jobData = VOCATIONAL_JOBS[professionIndex];
  
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@kelmah.test`;
  const phone = `+233${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  const userName = `${firstName} ${lastName}`;
  
  const yearsExperience = Math.floor(Math.random() * 10) + 2;
  
  return {
    // User ID and Basic Info
    id: index + 1,
    firstName,
    lastName,
    fullName: userName,
    email,
    phone,
    password: 'TestUser123!',
    role: 'worker',
    
    // Personal Information
    gender,
    dateOfBirth: new Date(1985 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    profilePicture: `https://images.unsplash.com/photo-${1500000000000 + index}?w=200&h=200&fit=crop&crop=face`,
    
    // Contact & Location
    address: `${Math.floor(Math.random() * 999) + 1} ${['Nkrumah', 'Independence', 'Liberation', 'Unity', 'Freedom'][Math.floor(Math.random() * 5)]} Street`,
    city: location.city,
    region: location.region,
    state: location.state,
    country: 'Ghana',
    postalCode: `GA-${Math.floor(Math.random() * 9000) + 1000}`,
    
    // Professional Information
    profession: jobData.profession,
    bio: `Experienced ${jobData.profession.toLowerCase()} with ${yearsExperience} years of experience in ${location.city}, Ghana. Specializing in ${jobData.skills.slice(0, 2).join(' and ')}. ${jobData.description}`,
    skills: jobData.skills,
    certifications: jobData.certifications,
    tools: jobData.tools,
    yearsExperience,
    
    // Rates and Availability
    hourlyRate: jobData.avgHourlyRate + Math.floor(Math.random() * 20) - 10, // ±10 GHS variation
    currency: 'GHS',
    availability: {
      status: 'available',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].slice(0, Math.floor(Math.random() * 3) + 4),
      workingHours: {
        start: '08:00',
        end: '17:00'
      }
    },
    
    // Performance Metrics
    rating: (Math.random() * 1.5 + 3.5).toFixed(1),
    totalReviews: Math.floor(Math.random() * 50) + 10,
    completedProjects: Math.floor(Math.random() * 30) + 5,
    responseTime: `${Math.floor(Math.random() * 4) + 1} hours`,
    completionRate: (Math.random() * 15 + 85).toFixed(1) + '%',
    
    // Portfolio
    portfolioProjects: generatePortfolioProjects(jobData.profession, userName, location.city),
    
    // Account Status
    isEmailVerified: false,
    accountStatus: 'pending_verification',
    joinDate: new Date().toISOString().split('T')[0],
    
    // Login Information
    loginCredentials: {
      email,
      password: 'TestUser123!',
      loginUrl: 'https://kelmah-frontend-mu.vercel.app/login',
      status: 'requires_email_verification'
    }
  };
}

// Generate the complete report
function generateCompleteReport() {
  console.log('📋 Generating Complete Test Users Report...\n');
  
  const users = [];
  
  for (let i = 0; i < 20; i++) {
    users.push(generateCompleteUser(i));
  }
  
  const report = {
    metadata: {
      title: 'Kelmah Platform - Test Users Database',
      description: '20 Realistic test users for the Kelmah vocational platform with complete profiles',
      generatedAt: new Date().toISOString(),
      totalUsers: users.length,
      locations: GHANA_LOCATIONS.length,
      professions: VOCATIONAL_JOBS.length
    },
    
    summary: {
      byLocation: GHANA_LOCATIONS.map(loc => ({
        location: `${loc.city}, ${loc.region}`,
        userCount: users.filter(u => u.city === loc.city).length,
        users: users.filter(u => u.city === loc.city).map(u => ({
          name: u.fullName,
          profession: u.profession,
          email: u.email
        }))
      })),
      
      byProfession: VOCATIONAL_JOBS.map(job => ({
        profession: job.profession,
        userCount: users.filter(u => u.profession === job.profession).length,
        avgHourlyRate: job.avgHourlyRate,
        users: users.filter(u => u.profession === job.profession).map(u => ({
          name: u.fullName,
          location: u.city,
          email: u.email,
          hourlyRate: u.hourlyRate
        }))
      }))
    },
    
    loginCredentials: users.map(u => u.loginCredentials),
    
    completeUsers: users,
    
    instructions: {
      usage: 'These test users can be used for testing the Kelmah platform',
      verification: 'Users need email verification before they can log in',
      adminAccess: 'Use admin endpoints to bypass verification for testing',
      profiles: 'Each user has complete profile data including skills, portfolio, and certifications'
    }
  };
  
  return report;
}

// Main execution
function main() {
  const report = generateCompleteReport();
  
  // Save to file
  const outputFile = path.join(__dirname, 'complete-test-users-report.json');
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('🎉 Complete Test Users Report Generated!\n');
  
  console.log('📊 Summary:');
  console.log(`   • Total Users: ${report.metadata.totalUsers}`);
  console.log(`   • Locations: ${report.metadata.locations} Ghana cities`);
  console.log(`   • Professions: ${report.metadata.professions} vocational jobs`);
  
  console.log('\n🌍 Users by Location:');
  report.summary.byLocation.forEach(loc => {
    console.log(`   • ${loc.location}: ${loc.userCount} users`);
  });
  
  console.log('\n👨‍💼 Users by Profession:');
  report.summary.byProfession.forEach(prof => {
    console.log(`   • ${prof.profession}: ${prof.userCount} users (avg. GHS ${prof.avgHourlyRate}/hour)`);
  });
  
  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('   ┌─────────────────────────────────────────────────────────────────┐');
  console.log('   │                        TEST USER LOGINS                         │');
  console.log('   ├─────────────────────────────────────────────────────────────────┤');
  
  report.loginCredentials.forEach((cred, index) => {
    const user = report.completeUsers[index];
    console.log(`   │ ${(index + 1).toString().padStart(2)}. ${user.fullName.padEnd(20)} │ ${user.profession.padEnd(12)} │ ${user.city.padEnd(8)} │`);
    console.log(`   │     Email: ${cred.email.padEnd(35)} │`);
    console.log(`   │     Password: ${cred.password.padEnd(31)} │`);
    if (index < report.loginCredentials.length - 1) {
      console.log('   ├─────────────────────────────────────────────────────────────────┤');
    }
  });
  
  console.log('   └─────────────────────────────────────────────────────────────────┘');
  
  console.log(`\n💾 Complete report saved to: ${outputFile}`);
  console.log(`🌐 Login URL: https://kelmah-frontend-mu.vercel.app/login`);
  console.log(`\n⚠️  Note: Users require email verification before login. Use admin endpoints to bypass for testing.`);
  
  return report;
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { 
  generateCompleteReport, 
  GHANA_LOCATIONS, 
  VOCATIONAL_JOBS,
  generateCompleteUser
}; 