const express = require('express');
const router = express.Router();

// Temporary authentication middleware
const authMiddleware = {
  authenticate: (req, res, next) => {
    // For development, just add a mock user to the request
    req.user = { id: req.params.userId || 'development-user-id' };
    next();
  }
};

// Mock skill data
const mockSkills = [
  { id: 'skill-1', name: 'JavaScript', category: 'programming', popularity: 95, description: 'A high-level, interpreted programming language' },
  { id: 'skill-2', name: 'React', category: 'frontend', popularity: 90, description: 'A JavaScript library for building user interfaces' },
  { id: 'skill-3', name: 'Node.js', category: 'backend', popularity: 88, description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine' },
  { id: 'skill-4', name: 'Python', category: 'programming', popularity: 92, description: 'An interpreted high-level programming language' },
  { id: 'skill-5', name: 'AWS', category: 'cloud', popularity: 85, description: 'Cloud computing services provided by Amazon' },
  { id: 'skill-6', name: 'Docker', category: 'devops', popularity: 80, description: 'A platform for developing, shipping, and running applications' },
  { id: 'skill-7', name: 'Kubernetes', category: 'devops', popularity: 75, description: 'An open-source system for automating deployment, scaling, and management of containerized applications' },
  { id: 'skill-8', name: 'SQL', category: 'database', popularity: 87, description: 'A domain-specific language used for managing data in relational databases' },
  { id: 'skill-9', name: 'MongoDB', category: 'database', popularity: 78, description: 'A source-available cross-platform document-oriented database program' },
  { id: 'skill-10', name: 'TypeScript', category: 'programming', popularity: 85, description: 'A strict syntactical superset of JavaScript with optional static typing' },
  { id: 'skill-11', name: 'Vue.js', category: 'frontend', popularity: 82, description: 'An open-source model–view–viewmodel front end JavaScript framework' },
  { id: 'skill-12', name: 'Angular', category: 'frontend', popularity: 81, description: 'A TypeScript-based open-source web application framework' },
  { id: 'skill-13', name: 'Express.js', category: 'backend', popularity: 86, description: 'A minimal and flexible Node.js web application framework' },
  { id: 'skill-14', name: 'GraphQL', category: 'api', popularity: 79, description: 'An open-source data query and manipulation language for APIs' },
  { id: 'skill-15', name: 'Django', category: 'backend', popularity: 76, description: 'A high-level Python web framework' },
  { id: 'skill-16', name: 'Ruby on Rails', category: 'backend', popularity: 74, description: 'A server-side web application framework written in Ruby' },
  { id: 'skill-17', name: 'Java', category: 'programming', popularity: 83, description: 'A class-based, object-oriented programming language' },
  { id: 'skill-18', name: 'C#', category: 'programming', popularity: 80, description: 'A general-purpose, multi-paradigm programming language' },
  { id: 'skill-19', name: 'PHP', category: 'backend', popularity: 72, description: 'A general-purpose scripting language suited to web development' },
  { id: 'skill-20', name: 'Swift', category: 'mobile', popularity: 77, description: 'A general-purpose, multi-paradigm, compiled programming language' }
];

// Get all skills
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || mockSkills.length;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search ? req.query.search.toLowerCase() : '';
  
  let filteredSkills = mockSkills;
  
  if (search) {
    filteredSkills = mockSkills.filter(skill => 
      skill.name.toLowerCase().includes(search) || 
      skill.description.toLowerCase().includes(search)
    );
  }
  
  const paginatedSkills = filteredSkills.slice(offset, offset + limit);
  
  res.status(200).json({
    success: true,
    count: filteredSkills.length,
    data: paginatedSkills
  });
});

// Get skills by category
router.get('/categories/:category', (req, res) => {
  const { category } = req.params;
  const filteredSkills = mockSkills.filter(skill => 
    skill.category.toLowerCase() === category.toLowerCase()
  );
  
  res.status(200).json({
    success: true,
    count: filteredSkills.length,
    category,
    data: filteredSkills
  });
});

// Get popular skills
router.get('/popular', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const sortedSkills = [...mockSkills].sort((a, b) => b.popularity - a.popularity);
  const popularSkills = sortedSkills.slice(0, limit);
  
  res.status(200).json({
    success: true,
    count: popularSkills.length,
    data: popularSkills
  });
});

// Get skill by ID
router.get('/:skillId', (req, res) => {
  const { skillId } = req.params;
  const skill = mockSkills.find(s => s.id === skillId);
  
  if (!skill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: skill
  });
});

// Create a new skill (admin only)
router.post('/', authMiddleware.authenticate, (req, res) => {
  const skillData = req.body;
  
  // Generate a unique ID
  const newSkill = {
    ...skillData,
    id: `skill-${Date.now()}`,
    popularity: skillData.popularity || 50
  };
  
  res.status(201).json({
    success: true,
    message: 'Skill created successfully',
    data: newSkill
  });
});

// Update a skill (admin only)
router.put('/:skillId', authMiddleware.authenticate, (req, res) => {
  const { skillId } = req.params;
  const skillData = req.body;
  const existingSkill = mockSkills.find(s => s.id === skillId);
  
  if (!existingSkill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found'
    });
  }
  
  const updatedSkill = {
    ...existingSkill,
    ...skillData,
    id: skillId // Ensure ID doesn't change
  };
  
  res.status(200).json({
    success: true,
    message: 'Skill updated successfully',
    data: updatedSkill
  });
});

// Delete a skill (admin only)
router.delete('/:skillId', authMiddleware.authenticate, (req, res) => {
  const { skillId } = req.params;
  const existingSkill = mockSkills.find(s => s.id === skillId);
  
  if (!existingSkill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Skill deleted successfully',
    deletedId: skillId
  });
});

module.exports = router; 