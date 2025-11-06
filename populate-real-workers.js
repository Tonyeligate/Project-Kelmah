/**
 * Populate Real Worker Data Script
 * Updates existing worker users with realistic, varied profile data
 */

const mongoose = require('mongoose');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Sample worker data templates
const workerTemplates = [
  {
    profession: 'Master Carpenter',
    skills: ['Carpentry', 'Furniture Making', 'Wood Finishing', 'Cabinet Installation'],
    hourlyRate: 45,
    bio: 'Master carpenter with 12+ years specializing in custom furniture and cabinet work. Expert in both traditional and modern woodworking techniques.',
    yearsOfExperience: 12,
    rating: 4.8,
    totalJobsCompleted: 156,
    totalReviews: 78
  },
  {
    profession: 'Licensed Electrician',
    skills: ['Electrical Installation', 'Wiring', 'Circuit Design', 'Solar Panel Setup'],
    hourlyRate: 55,
    bio: 'Licensed electrician with extensive experience in residential and commercial electrical systems. Specialized in solar installations.',
    yearsOfExperience: 10,
    rating: 4.9,
    totalJobsCompleted: 203,
    totalReviews: 124
  },
  {
    profession: 'Expert Plumber',
    skills: ['Plumbing', 'Pipe Fitting', 'Drain Cleaning', 'Water Heater Installation'],
    hourlyRate: 50,
    bio: 'Experienced plumber handling all residential and commercial plumbing needs. Quick response time and quality workmanship guaranteed.',
    yearsOfExperience: 8,
    rating: 4.7,
    totalJobsCompleted: 189,
    totalReviews: 95
  },
  {
    profession: 'Professional Mason',
    skills: ['Masonry', 'Bricklaying', 'Concrete Work', 'Stone Setting'],
    hourlyRate: 40,
    bio: 'Professional mason with expertise in brick, block, and stone construction. Attention to detail and structural integrity.',
    yearsOfExperience: 15,
    rating: 4.6,
    totalJobsCompleted: 142,
    totalReviews: 67
  },
  {
    profession: 'Painting Specialist',
    skills: ['Interior Painting', 'Exterior Painting', 'Decorative Finishes', 'Drywall Repair'],
    hourlyRate: 35,
    bio: 'Professional painter specializing in interior and exterior residential painting. Clean work, on-time delivery, and quality finishes.',
    yearsOfExperience: 6,
    rating: 4.5,
    totalJobsCompleted: 98,
    totalReviews: 52
  },
  {
    profession: 'HVAC Technician',
    skills: ['HVAC', 'Air Conditioning', 'Heating Systems', 'Ventilation'],
    hourlyRate: 60,
    bio: 'Certified HVAC technician with experience in installation, maintenance, and repair of all climate control systems.',
    yearsOfExperience: 9,
    rating: 4.8,
    totalJobsCompleted: 167,
    totalReviews: 89
  },
  {
    profession: 'Roofing Expert',
    skills: ['Roofing', 'Roof Repair', 'Shingle Installation', 'Waterproofing'],
    hourlyRate: 48,
    bio: 'Expert roofer with specialization in residential and commercial roofing. Quality materials and weatherproof installations.',
    yearsOfExperience: 11,
    rating: 4.7,
    totalJobsCompleted: 134,
    totalReviews: 71
  },
  {
    profession: 'Welding Specialist',
    skills: ['Welding', 'Metal Fabrication', 'Steel Work', 'Gate Installation'],
    hourlyRate: 52,
    bio: 'Professional welder skilled in MIG, TIG, and arc welding. Custom metalwork and structural fabrication.',
    yearsOfExperience: 13,
    rating: 4.9,
    totalJobsCompleted: 178,
    totalReviews: 94
  },
  {
    profession: 'Tile & Flooring Expert',
    skills: ['Tiling', 'Floor Installation', 'Tile Design', 'Bathroom Renovation'],
    hourlyRate: 42,
    bio: 'Experienced tile setter specializing in ceramic, porcelain, and natural stone. Precision work and creative layouts.',
    yearsOfExperience: 7,
    rating: 4.6,
    totalJobsCompleted: 112,
    totalReviews: 58
  },
  {
    profession: 'Landscaping Professional',
    skills: ['Landscaping', 'Garden Design', 'Lawn Care', 'Tree Trimming'],
    hourlyRate: 38,
    bio: 'Professional landscaper creating beautiful outdoor spaces. From design to maintenance, full-service landscaping.',
    yearsOfExperience: 5,
    rating: 4.5,
    totalJobsCompleted: 87,
    totalReviews: 43
  },
  {
    profession: 'General Contractor',
    skills: ['Project Management', 'Construction', 'Renovation', 'Building Inspection'],
    hourlyRate: 65,
    bio: 'Licensed general contractor managing residential and commercial projects. Full-service construction and renovation.',
    yearsOfExperience: 18,
    rating: 4.9,
    totalJobsCompleted: 245,
    totalReviews: 156
  },
  {
    profession: 'Drywall Specialist',
    skills: ['Drywall Installation', 'Taping', 'Texturing', 'Ceiling Work'],
    hourlyRate: 36,
    bio: 'Expert in drywall installation and finishing. Smooth walls and professional texture application.',
    yearsOfExperience: 6,
    rating: 4.4,
    totalJobsCompleted: 92,
    totalReviews: 48
  }
];

const locations = ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi', 'Tema', 'Obuasi'];

async function populateWorkers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get direct access to users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find existing worker users
    const workers = await usersCollection.find({ role: 'worker' }).toArray();
    console.log(`📊 Found ${workers.length} worker users`);

    if (workers.length === 0) {
      console.log('⚠️  No existing worker users found. Please create worker users first.');
      await mongoose.connection.close();
      return;
    }

    // Update each worker with realistic data
    let updatedCount = 0;
    for (let i = 0; i < workers.length; i++) {
      const worker = workers[i];
      const template = workerTemplates[i % workerTemplates.length];
      const location = locations[i % locations.length];

      const updates = {
        profession: template.profession,
        skills: template.skills,
        hourlyRate: template.hourlyRate,
        currency: 'GHS',
        bio: template.bio,
        yearsOfExperience: template.yearsOfExperience,
        rating: template.rating,
        totalJobsCompleted: template.totalJobsCompleted,
        totalReviews: template.totalReviews,
        location: `${location}, Ghana`,
        availabilityStatus: 'available',
        isVerified: i % 3 === 0, // Every 3rd worker is verified
        updatedAt: new Date()
      };

      await usersCollection.updateOne(
        { _id: worker._id },
        { $set: updates }
      );

      updatedCount++;
      console.log(`✅ Updated ${worker.firstName} ${worker.lastName} -> ${template.profession}`);
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} workers with realistic data!`);

    // Show summary
    const verifiedCount = await usersCollection.countDocuments({ 
      role: 'worker', 
      isVerified: true 
    });
    
    console.log('\n📊 Worker Database Summary:');
    console.log(`   Total Workers: ${workers.length}`);
    console.log(`   Verified Workers: ${verifiedCount}`);
    console.log(`   Professions: ${new Set(workerTemplates.map(t => t.profession)).size} different types`);
    console.log(`   Hourly Rates: $35 - $65 GHS`);

  } catch (error) {
    console.error('❌ Error populating workers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the script
populateWorkers();
