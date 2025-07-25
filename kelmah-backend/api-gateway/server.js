/**
 * API Gateway Server
 * Central entry point for all client requests
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const client = require('prom-client');

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 5000;

// MongoDB connection
const connectDB = async () => {
  try {
    // Use MongoDB Atlas free tier connection string
    const connectionString = 'mongodb+srv://kelmah-demo:kelmah-demo-password@cluster0.mongodb.net/kelmah?retryWrites=true&w=majority';
    
    // As a fallback, try to use local configuration if environment variables are set
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '27017';
    const dbName = process.env.DB_NAME || 'kelmah';
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    
    // Determine which connection string to use
    let dbConnectionString;
    if (process.env.MONGODB_URI) {
      // Use provided MongoDB URI if available
      dbConnectionString = process.env.MONGODB_URI;
    } else {
      // Use MongoDB memory server for development
      console.log('Using in-memory MongoDB for development');
      // Importing the mongodb-memory-server package
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      dbConnectionString = mongod.getUri();
    }
    
    console.log(`Connecting to MongoDB at: ${dbConnectionString.substring(0, 20)}...`);
    
    await mongoose.connect(dbConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected successfully`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Continuing without database connection. Some features may not work.');
  }
};

// Define User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['worker', 'hirer', 'admin'],
    default: 'worker'
  },
  skills: [String],
  rating: {
    type: Number,
    default: 0
  },
  profileImage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create User model
const User = mongoose.model('User', userSchema);

// Connect to database
connectDB();

// CORS middleware: whitelist frontend origins for cross-domain auth
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5173'
];
const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('dev'));

// Parse JSON requests - MUST be before any routes
app.use(express.json({ 
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
      console.log('Raw body:', req.rawBody);
    }
  }
}));

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  if (req.method === 'POST' && 
      (req.path.includes('/api/auth/login') || req.path.includes('/api/auth/register'))) {
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
  }
  next();
});

// Helper functions
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role
    }, 
    process.env.JWT_SECRET || 'kelmah-secret-key',
    { expiresIn: '1h' }
  );
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kelmah-secret-key');
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'API Gateway is running' });
});

// Replace custom auth handlers with proxy to auth-service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
app.all('/api/auth/*', async (req, res) => {
  try {
    const path = req.path.replace(/^\/api\/auth/, '');
    const url = `${AUTH_SERVICE_URL}/api/auth${path}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization })
      },
      params: req.query,
      data: req.body,
      withCredentials: true
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.get('/api/users/profile', authenticate, (req, res) => {
  res.status(200).json({
    id: req.user._id,
    name: `${req.user.firstName} ${req.user.lastName}`,
    email: req.user.email,
    role: req.user.role,
    skills: req.user.skills || [],
    createdAt: req.user.createdAt
  });
});

// Workers endpoints
app.get('/api/workers', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const filter = { role: 'worker' };
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { skills: regex }
      ];
    }
    const total = await User.countDocuments(filter);
    const workers = await User.find(filter).skip(skip).limit(limit);
    res.status(200).json({ success: true, data: workers, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error listing workers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/workers/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'worker') {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Worker reviews via monolith service
app.get('/api/workers/:id/reviews', authenticate, async (req, res) => {
  try {
    const url = `${MONOLITH_SERVICE_URL}/api/reviews/worker/${req.params.id}`;
    const response = await axios.get(url, { headers: { Authorization: req.headers.authorization } });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error fetching worker reviews:', error);
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: 'Server error' };
    res.status(status).json(data);
  }
});

// Worker availability (placeholder)
app.get('/api/workers/:id/availability', authenticate, (req, res) => {
  res.status(200).json({ success: true, availability: [] });
});

// Hirers endpoints
app.get('/api/hirers', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const filter = { role: 'hirer' };
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex }
      ];
    }
    const total = await User.countDocuments(filter);
    const hirers = await User.find(filter).skip(skip).limit(limit);
    res.status(200).json({ success: true, data: hirers, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error listing hirers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/hirers/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'hirer') {
      return res.status(404).json({ success: false, message: 'Hirer not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching hirer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kelmah Platform API Gateway',
    services: ['auth', 'user', 'job', 'messaging'],
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development'
  });
});

// Add worker skills and credentials endpoints

// Get worker credentials (skills and licenses)
app.get('/api/workers/me/credentials', authenticate, async (req, res) => {
  try {
    // Get the current worker from the authentication middleware
    const workerId = req.user._id;

    // Define sample skills data
    const basicSkills = [
      { id: '1', name: 'Plumbing', verified: req.user.skills?.includes('Plumbing') || false, level: 3 },
      { id: '2', name: 'Electrical', verified: req.user.skills?.includes('Electrical') || false, level: 4 },
      { id: '3', name: 'Carpentry', verified: req.user.skills?.includes('Carpentry') || false, level: 5 },
      { id: '4', name: 'Painting', verified: req.user.skills?.includes('Painting') || false, level: 3 },
      { id: '5', name: 'HVAC', verified: req.user.skills?.includes('HVAC') || false, level: 2 }
    ];

    // Define sample licenses data
    const licenses = [
      { id: '101', name: 'General Contractor License', issuer: 'State Board', expiry: '2025-12-31', verified: true },
      { id: '102', name: 'Electrical Certification', issuer: 'Trade Association', expiry: '2024-06-30', verified: true }
    ];

    // Return the credentials data
    res.json({
      skills: basicSkills,
      licenses: licenses
    });
  } catch (error) {
    console.error('Error fetching worker credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching credentials',
      error: error.message
    });
  }
});

// Add a new skill to worker profile
app.post('/api/workers/me/skills', authenticate, async (req, res) => {
  try {
    const { name, level } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }
    
    // Find user and update skills array
    const user = await User.findById(req.user._id);
    
    if (!user.skills) {
      user.skills = [];
    }
    
    if (!user.skills.includes(name)) {
      user.skills.push(name);
      await user.save();
    }
    
    res.json({
      success: true,
      skills: user.skills,
      message: 'Skill added successfully'
    });
    
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding skill',
      error: error.message
    });
  }
});

// Remove a skill from worker profile
app.delete('/api/workers/me/skills/:skillId', authenticate, async (req, res) => {
  try {
    const skillId = req.params.skillId;
    
    // Get the skill name from the ID
    const skillName = await getSkillNameById(skillId);
    
    if (!skillName) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }
    
    // Find user and update skills array
    const user = await User.findById(req.user._id);
    
    if (user.skills && user.skills.includes(skillName)) {
      user.skills = user.skills.filter(skill => skill !== skillName);
      await user.save();
    }
    
    res.json({
      success: true,
      skills: user.skills,
      message: 'Skill removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing skill:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing skill',
      error: error.message
    });
  }
});

// Helper function to get skill name by ID
async function getSkillNameById(skillId) {
  const skillMap = {
    '1': 'Plumbing',
    '2': 'Electrical',
    '3': 'Carpentry',
    '4': 'Painting',
    '5': 'HVAC'
  };
  
  return skillMap[skillId];
}

// Request skill verification
app.post('/api/workers/me/skills/:skillId/verify', authenticate, async (req, res) => {
  try {
    const skillId = req.params.skillId;
    const verificationData = req.body;
    
    // Get the skill name from the ID
    const skillName = await getSkillNameById(skillId);
    
    if (!skillName) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }
    
    // In a real implementation, this would store verification request data
    // and trigger a review process
    console.log(`Verification requested for skill: ${skillName}`);
    console.log('Verification data:', verificationData);
    
    // For demo purposes, automatically approve the verification
    // Find user and ensure the skill is in their profile
    const user = await User.findById(req.user._id);
    
    if (!user.skills.includes(skillName)) {
      user.skills.push(skillName);
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Skill verification request submitted successfully',
      status: 'pending'
    });
    
  } catch (error) {
    console.error('Error requesting skill verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting skill verification',
      error: error.message
    });
  }
});

// Get available skills list (for skill selection)
app.get('/api/workers/skills', async (req, res) => {
  try {
    // Sample list of skills available in the platform
    const availableSkills = [
      { id: '1', name: 'Plumbing', category: 'Construction' },
      { id: '2', name: 'Electrical', category: 'Construction' },
      { id: '3', name: 'Carpentry', category: 'Construction' },
      { id: '4', name: 'Painting', category: 'Construction' },
      { id: '5', name: 'HVAC', category: 'Construction' },
      { id: '6', name: 'Welding', category: 'Construction' },
      { id: '7', name: 'Roofing', category: 'Construction' },
      { id: '8', name: 'Flooring', category: 'Construction' },
      { id: '9', name: 'Landscaping', category: 'Outdoor' },
      { id: '10', name: 'Interior Design', category: 'Design' }
    ];
    
    res.json(availableSkills);
  } catch (error) {
    console.error('Error fetching available skills:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available skills',
      error: error.message
    });
  }
});

// Get worker portfolio projects
app.get('/api/workers/me/portfolio', authenticate, async (req, res) => {
  try {
    // For demo purposes, return sample portfolio projects
    const portfolioProjects = [
      {
        id: '1',
        title: 'Kitchen Renovation',
        description: 'Complete kitchen remodel including new cabinets, countertops, and appliances',
        imageUrl: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?q=80&w=500',
        skills: ['Carpentry', 'Plumbing', 'Electrical'],
        date: '2023-08-15',
        clientName: 'Johnson Family',
        testimonial: 'Excellent work, finished ahead of schedule!',
        rating: 4.9
      },
      {
        id: '2',
        title: 'Bathroom Remodel',
        description: 'Master bathroom renovation with custom tile work and fixtures',
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=500',
        skills: ['Plumbing', 'Tiling'],
        date: '2023-06-21',
        clientName: 'Sarah Williams',
        testimonial: 'Very professional and quality work',
        rating: 4.8
      },
      {
        id: '3',
        title: 'Deck Construction',
        description: 'Custom backyard deck with built-in seating and pergola',
        imageUrl: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?q=80&w=500',
        skills: ['Carpentry', 'Design'],
        date: '2023-04-10',
        clientName: 'Martinez Family',
        testimonial: 'Our deck is beautiful! Exactly what we wanted.',
        rating: 5.0
      }
    ];

    res.json(portfolioProjects);
  } catch (error) {
    console.error('Error fetching portfolio projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio projects',
      error: error.message
    });
  }
});

// Get worker availability status
app.get('/api/workers/me/availability', authenticate, async (req, res) => {
  try {
    // In a real implementation, this would fetch from the database
    // For demo purposes, return sample data
    
    const availability = {
      status: 'available', // One of: available, busy, unavailable
      availableFrom: '2023-11-15',
      availableUntil: '2023-12-30',
      availableHours: {
        monday: { morning: true, afternoon: true, evening: false },
        tuesday: { morning: true, afternoon: true, evening: false },
        wednesday: { morning: true, afternoon: true, evening: false },
        thursday: { morning: true, afternoon: true, evening: false },
        friday: { morning: true, afternoon: true, evening: false },
        saturday: { morning: false, afternoon: false, evening: false },
        sunday: { morning: false, afternoon: false, evening: false }
      },
      travelDistance: 25, // In miles or km
      lastUpdated: new Date().toISOString()
    };

    res.json(availability);
  } catch (error) {
    console.error('Error fetching availability status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching availability status',
      error: error.message
    });
  }
});

// Get available jobs for worker dashboard
app.get('/api/jobs', async (req, res) => {
  try {
    // Read query parameters
    const { status, nearby, limit } = req.query;
    
    // In a real implementation, this would query the database
    // For demo purposes, return sample data
    
    const jobs = [
      {
        id: '1',
        title: 'Bathroom Renovation',
        description: 'Need a full bathroom renovation including new tiles, toilet, sink, and shower installation.',
        location: 'Accra, Ghana',
        budget: { min: 3500, max: 5000, currency: 'GHS' },
        postedDate: '2023-11-05',
        deadline: '2023-11-20',
        status: 'open',
        skills: ['Plumbing', 'Tiling', 'Electrical'],
        hirerRating: 4.7,
        distance: 3.2
      },
      {
        id: '2',
        title: 'Kitchen Cabinet Installation',
        description: 'Looking for someone to install new kitchen cabinets and countertops.',
        location: 'Tema, Ghana',
        budget: { min: 2000, max: 3000, currency: 'GHS' },
        postedDate: '2023-11-07',
        deadline: '2023-11-25',
        status: 'open',
        skills: ['Carpentry', 'Installation'],
        hirerRating: 4.2,
        distance: 5.8
      },
      {
        id: '3',
        title: 'House Painting',
        description: 'Need interior and exterior painting for a 3-bedroom house.',
        location: 'East Legon, Accra',
        budget: { min: 1500, max: 2500, currency: 'GHS' },
        postedDate: '2023-11-08',
        deadline: '2023-11-30',
        status: 'open',
        skills: ['Painting'],
        hirerRating: 4.9,
        distance: 1.5
      }
    ];

    // Filter results based on query parameters if needed
    let filteredJobs = [...jobs];
    
    // Return the results
    res.json(filteredJobs.slice(0, limit || filteredJobs.length));
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
});

// Proxy messaging-service endpoints
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3003';

app.all('/api/messages/*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/api\/messages/, '');
    const url = `${MESSAGING_SERVICE_URL}/api/messages${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.token}`
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.all('/api/conversations/*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/api\/conversations/, '');
    const url = `${MESSAGING_SERVICE_URL}/api/conversations${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.token}`
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy payment-service endpoints
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';

app.all('/api/payments/*', authenticate, async (req, res) => {
  try {
    // Strip the /api/payments prefix and map to specific payment-service routes
    const rawPath = req.path.replace(/^\/api\/payments/, '');
    const targetPath = rawPath.replace(/^\/methods/, '/payment-methods');
    const url = `${PAYMENT_SERVICE_URL}/api${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.token}`
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy monolithic backend for notifications, profiles, search, and settings
const MONOLITH_SERVICE_URL = process.env.MONOLITH_SERVICE_URL || 'http://localhost:5000';

app.all('/notifications*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/notifications/, '');
    const url = `${MONOLITH_SERVICE_URL}/api/notifications${targetPath}`;
    const response = await axios({ method: req.method, url, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${req.token}` }, params: req.query, data: req.body });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.all('/profile*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/profile/, '');
    const url = `${MONOLITH_SERVICE_URL}/api/profile${targetPath}`;
    const response = await axios({ method: req.method, url, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${req.token}` }, params: req.query, data: req.body });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.all('/search*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/search/, '');
    const url = `${MONOLITH_SERVICE_URL}/api/search${targetPath}`;
    const response = await axios({ method: req.method, url, headers: { 'Content-Type': 'application/json' }, params: req.query, data: req.body });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.all('/settings*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/settings/, '');
    const url = `${MONOLITH_SERVICE_URL}/api/settings${targetPath}`;
    const response = await axios({ method: req.method, url, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${req.token}` }, params: req.query, data: req.body });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy monolithic backend for dashboard endpoints
app.all('/api/dashboard*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/api\/dashboard/, '');
    const url = `${MONOLITH_SERVICE_URL}/api/dashboard${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${req.token}` },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    message: 'Server error',
    error: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
