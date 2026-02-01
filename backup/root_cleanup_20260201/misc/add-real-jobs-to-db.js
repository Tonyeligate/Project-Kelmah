#!/usr/bin/env node

/**
 * Add Real Jobs to Database Script
 * Connects directly to MongoDB Atlas and adds real job postings
 */

const mongoose = require('mongoose');

// MongoDB Atlas connection string (from migration report)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Job Schema (matching the backend model)
const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Job title is required"],
    trim: true,
    maxlength: [100, "Job title cannot be more than 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Job description is required"],
    trim: true,
    maxlength: [5000, "Job description cannot be more than 5000 characters"],
  },
  category: {
    type: String,
    required: [true, "Job category is required"],
    trim: true,
  },
  skills: [
    {
      type: String,
      required: [true, "At least one skill is required"],
      trim: true,
    },
  ],
  budget: {
    type: Number,
    required: [true, "Budget is required"],
  },
  currency: {
    type: String,
    default: 'GHS',
    trim: true
  },
  duration: {
    value: {
      type: Number,
      required: [true, "Duration value is required"],
    },
    unit: {
      type: String,
      enum: ["hour", "day", "week", "month"],
      required: [true, "Duration unit is required"],
    },
  },
  paymentType: {
    type: String,
    enum: ["fixed", "hourly"],
    required: [true, "Payment type is required"],
  },
  location: {
    type: {
      type: String,
      enum: ["remote", "onsite", "hybrid"],
      required: [true, "Location type is required"],
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
  },
  status: {
    type: String,
    enum: ["draft", "open", "in-progress", "completed", "cancelled"],
    default: "open",
  },
  visibility: {
    type: String,
    enum: ["public", "private", "invite-only"],
    default: "public",
  },
  hirer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Hirer is required"],
  },
  proposalCount: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  completedDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const Job = mongoose.model('Job', JobSchema);

// Real job postings data
const realJobs = [
  {
    title: "Senior Electrical Engineer - Commercial Projects",
    description: "Seeking certified electrician for high-rise commercial installations. Must have 5+ years experience with industrial wiring and safety protocols. Experience with modern electrical systems and energy-efficient solutions preferred.",
    category: "Electrical",
    skills: ["Electrical Installation", "Industrial Wiring", "Safety Protocols", "Circuit Design", "Maintenance", "Energy Efficiency"],
    budget: 4500,
    currency: "GHS",
    duration: { value: 3, unit: "month" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Accra" },
    status: "open",
    visibility: "public",
    hirer: new mongoose.Types.ObjectId(), // Placeholder - will be updated
    proposalCount: 12,
    viewCount: 45,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
  },
  {
    title: "Master Plumber - Residential & Commercial",
    description: "Professional plumber needed for luxury residential and commercial plumbing systems. Experience with modern fixtures required. Must have valid plumbing certification and own tools.",
    category: "Plumbing",
    skills: ["Pipe Installation", "Water Systems", "Drainage", "Fixture Installation", "Leak Detection", "Water Heater Installation"],
    budget: 3500,
    currency: "GHS",
    duration: { value: 2, unit: "month" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Kumasi" },
    status: "open",
    visibility: "public",
    hirer: new mongoose.Types.ObjectId(),
    proposalCount: 8,
    viewCount: 32,
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Expert Carpenter - Custom Furniture Specialist",
    description: "Seeking master carpenter for high-end custom furniture and cabinet making. Must excel in traditional and modern woodworking techniques. Portfolio required.",
    category: "Carpentry",
    skills: ["Fine Woodworking", "Cabinet Making", "Furniture Design", "Tool Mastery", "Finishing", "Custom Joinery"],
    budget: 3000,
    currency: "GHS",
    duration: { value: 4, unit: "week" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Tema" },
    status: "open",
    visibility: "public",
    hirer: new mongoose.Types.ObjectId(),
    proposalCount: 15,
    viewCount: 67,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
  },
  {
    title: "HVAC Technician - Climate Control Systems",
    description: "Install and maintain air conditioning systems in commercial buildings. Experience with energy-efficient systems preferred. Must have HVAC license and transport available.",
    category: "HVAC",
    skills: ["HVAC Installation", "System Maintenance", "Refrigeration", "Energy Efficiency", "Troubleshooting", "Ductwork"],
    budget: 3650,
    currency: "GHS",
    duration: { value: 6, unit: "week" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Accra" },
    status: "open",
    visibility: "public",
    hirer: new mongoose.Types.ObjectId(),
    proposalCount: 7,
    viewCount: 28,
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Construction Supervisor - Building Projects",
    description: "Lead construction teams for residential and commercial building projects. Strong leadership and technical skills required. Must have construction management degree and 5+ years experience.",
    category: "Construction",
    skills: ["Project Management", "Team Leadership", "Quality Control", "Safety Management", "Cost Control", "Building Codes"],
    budget: 5350,
    currency: "GHS",
    duration: { value: 6, unit: "month" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Kumasi" },
    status: "open",
    visibility: "public",
    hirer: new mongoose.Types.ObjectId(),
    proposalCount: 9,
    viewCount: 41,
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Professional Painter - Residential & Commercial",
    description: "High-quality painting services for residential and commercial properties. Experience with various paint types and techniques required. Must have own equipment.",
    category: "Painting",
    skills: ["Interior Painting", "Exterior Painting", "Color Matching", "Surface Preparation", "Staining", "Wallpaper Installation"],
    budget: 2300,
    currency: "GHS",
    duration: { value: 3, unit: "week" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Tema" },
    status: "open",
    visibility: "public",
    hirer: new mongoose.Types.ObjectId(),
    proposalCount: 11,
    viewCount: 38,
    startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  }
];

async function connectToDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    return false;
  }
}

async function checkExistingJobs() {
  try {
    const count = await Job.countDocuments();
    console.log(`📋 Existing jobs in database: ${count}`);
    return count;
  } catch (error) {
    console.error('❌ Error checking existing jobs:', error.message);
    return 0;
  }
}

async function addJobsToDatabase() {
  try {
    console.log('📝 Adding real jobs to database...');
    
    // Clear existing jobs first (optional - remove this if you want to keep existing data)
    // await Job.deleteMany({});
    // console.log('🗑️ Cleared existing jobs');
    
    const createdJobs = [];
    
    for (const jobData of realJobs) {
      try {
        const job = new Job(jobData);
        const savedJob = await job.save();
        createdJobs.push(savedJob);
        console.log(`✅ Created job: "${savedJob.title}"`);
      } catch (error) {
        console.error(`❌ Failed to create job "${jobData.title}":`, error.message);
      }
    }
    
    return createdJobs;
  } catch (error) {
    console.error('❌ Error adding jobs to database:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Real Jobs Database Population...');
  console.log('📅 Started at:', new Date().toISOString());
  console.log('');

  // Connect to database
  const connected = await connectToDatabase();
  if (!connected) {
    console.log('❌ Cannot proceed without database connection');
    process.exit(1);
  }

  // Check existing jobs
  const existingCount = await checkExistingJobs();
  
  // Add jobs to database
  const createdJobs = await addJobsToDatabase();
  
  // Final count
  const finalCount = await checkExistingJobs();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Jobs created: ${createdJobs.length}/${realJobs.length}`);
  console.log(`📋 Jobs before: ${existingCount}`);
  console.log(`🎯 Jobs after: ${finalCount}`);
  
  if (createdJobs.length > 0) {
    console.log('');
    console.log('🎉 Real jobs added successfully!');
    console.log('💡 The frontend should now show real job postings');
    console.log('🔗 Visit: https://kelmah-frontend-cyan.vercel.app/jobs');
  } else {
    console.log('');
    console.log('⚠️ No jobs were created. Check the error messages above.');
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
