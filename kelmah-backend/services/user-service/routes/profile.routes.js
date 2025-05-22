const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const availabilityController = require('../controllers/availability.controller');
const skillsController = require('../controllers/skills.controller');

// Temporary authentication middleware
const authMiddleware = {
  authenticate: (req, res, next) => {
    // For development, just add a mock user to the request
    req.user = { id: req.params.userId || 'development-user-id' };
    next();
  }
};

// Mock profile data
const profileData = {
  profile: {
    id: 'profile-123',
    userId: 'user-123',
    bio: 'Experienced software engineer with a passion for building scalable web applications. Specializing in React, Node.js, and cloud technologies.',
    headline: 'Full Stack Developer | React | Node.js | AWS',
    phoneNumber: '+1 (555) 123-4567',
    hourlyRate: 85,
    availability: 'Full-Time',
    radius: 25,
    profilePictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070',
    isRemote: true,
    lastActive: '2025-03-25T15:30:45Z',
    completionPercentage: 85,
    rating: 4.8,
    visibility: 'Public',
    accountStatus: 'Active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2025-03-25T15:30:45Z',
    address: {
      id: 'address-123',
      street: '123 Tech Lane',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
      latitude: 37.7749,
      longitude: -122.4194
    },
    experiences: [
      {
        id: 'exp-1',
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        from: '2023-01-01T00:00:00Z',
        to: null,
        current: true,
        description: 'Led the frontend team in developing a modern React application with TypeScript. Implemented CI/CD pipelines and reduced build times by 40%.'
      },
      {
        id: 'exp-2',
        title: 'Full Stack Developer',
        company: 'InnovateTech',
        location: 'Austin, TX',
        from: '2020-03-15T00:00:00Z',
        to: '2022-12-31T00:00:00Z',
        current: false,
        description: 'Developed and maintained web applications using Node.js and React. Collaborated with design team to implement responsive UI components.'
      }
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of California, Berkeley',
        degree: 'Master of Science',
        fieldOfStudy: 'Computer Science',
        from: '2018-08-15T00:00:00Z',
        to: '2020-05-20T00:00:00Z',
        current: false,
        description: 'Focused on distributed systems and cloud computing.'
      },
      {
        id: 'edu-2',
        school: 'Stanford University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Engineering',
        from: '2014-08-15T00:00:00Z',
        to: '2018-05-20T00:00:00Z',
        current: false,
        description: 'Dean\'s List. Active member of the Robotics Club.'
      }
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        issueDate: '2024-01-15T00:00:00Z',
        expirationDate: '2027-01-15T00:00:00Z',
        credentialId: 'AWS-123456',
        credentialURL: 'https://aws.amazon.com/verification'
      },
      {
        id: 'cert-2',
        name: 'React Certification',
        issuer: 'Meta',
        issueDate: '2023-07-10T00:00:00Z',
        expirationDate: null,
        credentialId: 'META-789012',
        credentialURL: 'https://meta.com/certifications/verify'
      }
    ],
    portfolio: [
      {
        id: 'port-1',
        title: 'E-commerce Platform',
        description: 'Built a full-featured e-commerce platform with React, Node.js, and MongoDB. Implemented payment processing with Stripe and user authentication.',
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1170',
        projectUrl: 'https://github.com/johndoe/ecommerce',
        completionDate: '2024-02-15T00:00:00Z'
      },
      {
        id: 'port-2',
        title: 'Task Management App',
        description: 'Developed a collaborative task management application with real-time updates using Socket.io.',
        imageUrl: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?q=80&w=1032',
        projectUrl: 'https://github.com/johndoe/taskmanager',
        completionDate: '2023-11-10T00:00:00Z'
      }
    ],
    skills: [
      { id: 'skill-1', name: 'JavaScript', level: 'Expert', yearsOfExperience: 6, endorsements: 18 },
      { id: 'skill-2', name: 'React', level: 'Expert', yearsOfExperience: 5, endorsements: 15 },
      { id: 'skill-3', name: 'Node.js', level: 'Advanced', yearsOfExperience: 4, endorsements: 12 },
      { id: 'skill-4', name: 'TypeScript', level: 'Advanced', yearsOfExperience: 3, endorsements: 10 },
      { id: 'skill-5', name: 'AWS', level: 'Intermediate', yearsOfExperience: 3, endorsements: 8 },
      { id: 'skill-6', name: 'Docker', level: 'Intermediate', yearsOfExperience: 2, endorsements: 6 }
    ],
    availability: [
      { id: 'avail-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
      { id: 'avail-2', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
      { id: 'avail-3', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
      { id: 'avail-4', dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
      { id: 'avail-5', dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
      { id: 'avail-6', dayOfWeek: 6, startTime: '00:00', endTime: '00:00', isAvailable: false },
      { id: 'avail-7', dayOfWeek: 7, startTime: '00:00', endTime: '00:00', isAvailable: false }
    ],
    socialProfiles: [
      { id: 'social-1', platform: 'LinkedIn', url: 'https://linkedin.com/in/johndoe', username: 'johndoe' },
      { id: 'social-2', platform: 'GitHub', url: 'https://github.com/johndoe', username: 'johndoe' },
      { id: 'social-3', platform: 'Twitter', url: 'https://twitter.com/johndoe', username: 'johndoe' }
    ]
  }
};

// Get profile by ID or user ID
router.get('/:profileId?', (req, res) => {
  const { profileId } = req.params;
  
  // For simple mock, always return the same profile
  // In a real implementation, we would look up by ID
  
  res.status(200).json({
    success: true,
    data: {
      ...profileData.profile,
      id: profileId || profileData.profile.id
    }
  });
});

// Create or update a profile
router.post('/', authMiddleware.authenticate, (req, res) => {
  const { user } = req;
  const profileData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Profile created or updated successfully',
    data: {
      ...profileData,
      userId: user.id,
      id: 'new-profile-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete a profile
router.delete('/:userId', authMiddleware.authenticate, (req, res) => {
  const { userId } = req.params;
  const { user } = req;
  
  // Check if user has permission to delete
  if (user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to delete this profile'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Profile deleted successfully',
    deletedId: userId
  });
});

// EXPERIENCE ROUTES

// Add experience
router.post('/experience', authMiddleware.authenticate, (req, res) => {
  const experienceData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Experience added successfully',
    data: {
      ...experienceData,
      id: 'exp-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Update experience
router.put('/experience/:experienceId', authMiddleware.authenticate, (req, res) => {
  const { experienceId } = req.params;
  const experienceData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Experience updated successfully',
    data: {
      ...experienceData,
      id: experienceId,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete experience
router.delete('/experience/:experienceId', authMiddleware.authenticate, (req, res) => {
  const { experienceId } = req.params;
  
  res.status(200).json({
    success: true,
    message: 'Experience deleted successfully',
    deletedId: experienceId
  });
});

// EDUCATION ROUTES

// Add education
router.post('/education', authMiddleware.authenticate, (req, res) => {
  const educationData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Education added successfully',
    data: {
      ...educationData,
      id: 'edu-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Update education
router.put('/education/:educationId', authMiddleware.authenticate, (req, res) => {
  const { educationId } = req.params;
  const educationData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Education updated successfully',
    data: {
      ...educationData,
      id: educationId,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete education
router.delete('/education/:educationId', authMiddleware.authenticate, (req, res) => {
  const { educationId } = req.params;
  
  res.status(200).json({
    success: true,
    message: 'Education deleted successfully',
    deletedId: educationId
  });
});

// PORTFOLIO ROUTES

// Add portfolio item
router.post('/portfolio', authMiddleware.authenticate, (req, res) => {
  const portfolioData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Portfolio item added successfully',
    data: {
      ...portfolioData,
      id: 'port-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Update portfolio item
router.put('/portfolio/:portfolioId', authMiddleware.authenticate, (req, res) => {
  const { portfolioId } = req.params;
  const portfolioData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Portfolio item updated successfully',
    data: {
      ...portfolioData,
      id: portfolioId,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete portfolio item
router.delete('/portfolio/:portfolioId', authMiddleware.authenticate, (req, res) => {
  const { portfolioId } = req.params;
  
  res.status(200).json({
    success: true,
    message: 'Portfolio item deleted successfully',
    deletedId: portfolioId
  });
});

// SKILLS ROUTES

// Add skill to profile
router.post('/skills', authMiddleware.authenticate, (req, res) => {
  const skillData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Skill added to profile successfully',
    data: {
      ...skillData,
      id: 'skill-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Update skill
router.put('/skills/:skillId', authMiddleware.authenticate, (req, res) => {
  const { skillId } = req.params;
  const skillData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Skill updated successfully',
    data: {
      ...skillData,
      id: skillId,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete skill from profile
router.delete('/skills/:skillId', authMiddleware.authenticate, (req, res) => {
  const { skillId } = req.params;
  
  res.status(200).json({
    success: true,
    message: 'Skill removed from profile successfully',
    deletedId: skillId
  });
});

// AVAILABILITY ROUTES

// Update availability
router.put('/availability', authMiddleware.authenticate, (req, res) => {
  const availabilityData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Availability updated successfully',
    data: availabilityData.map(item => ({
      ...item,
      updatedAt: new Date().toISOString()
    }))
  });
});

// PREFERENCES ROUTES

// Update preferences
router.put('/preferences', authMiddleware.authenticate, (req, res) => {
  const preferencesData = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      ...preferencesData,
      updatedAt: new Date().toISOString()
    }
  });
});

module.exports = router; 