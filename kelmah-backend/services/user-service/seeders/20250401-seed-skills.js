'use strict';
const { v4: uuidv4 } = require('uuid');

/**
 * Seeder for populating the skills table with initial data
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Define skill categories
    const categories = {
      'web_development': 'Web Development',
      'mobile_development': 'Mobile Development',
      'design': 'Design',
      'data': 'Data Science & Analytics',
      'business': 'Business & Marketing',
      'writing': 'Writing & Translation',
      'admin': 'Administrative & Support',
      'agriculture': 'Agriculture & Farming',
      'construction': 'Construction & Building',
      'education': 'Education & Training',
      'healthcare': 'Healthcare & Medicine',
      'transportation': 'Transportation & Logistics'
    };
    
    // Create skills grouped by category
    const skills = [
      // Web Development
      { 
        id: uuidv4(), 
        name: 'html', 
        category: 'web_development',
        description: 'HTML (HyperText Markup Language) is the standard markup language for web pages.',
        icon: 'html5',
        isVerifiable: true,
        testAvailable: true,
        popularity: 80,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'css', 
        category: 'web_development',
        description: 'CSS (Cascading Style Sheets) is used for styling web documents.',
        icon: 'css3',
        isVerifiable: true,
        testAvailable: true,
        popularity: 75,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'javascript', 
        category: 'web_development',
        description: 'JavaScript is a programming language used to create interactive effects within web browsers.',
        icon: 'javascript',
        isVerifiable: true,
        testAvailable: true,
        popularity: 90,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'react', 
        category: 'web_development',
        description: 'React is a JavaScript library for building user interfaces.',
        icon: 'react',
        isVerifiable: true,
        testAvailable: true,
        popularity: 85,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'node.js', 
        category: 'web_development',
        description: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine.',
        icon: 'nodejs',
        isVerifiable: true,
        testAvailable: true,
        popularity: 78,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Mobile Development
      { 
        id: uuidv4(), 
        name: 'android', 
        category: 'mobile_development',
        description: 'Android is a mobile operating system developed by Google.',
        icon: 'android',
        isVerifiable: true,
        testAvailable: true,
        popularity: 70,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'ios', 
        category: 'mobile_development',
        description: 'iOS is a mobile operating system created by Apple Inc.',
        icon: 'apple',
        isVerifiable: true,
        testAvailable: true,
        popularity: 68,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'flutter', 
        category: 'mobile_development',
        description: 'Flutter is Google\'s UI toolkit for building natively compiled applications.',
        icon: 'flutter',
        isVerifiable: true,
        testAvailable: true,
        popularity: 65,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Design
      { 
        id: uuidv4(), 
        name: 'ui design', 
        category: 'design',
        description: 'UI Design focuses on anticipating user needs and creating interfaces that are easy to use.',
        icon: 'design',
        isVerifiable: true,
        testAvailable: false,
        popularity: 72,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'graphic design', 
        category: 'design',
        description: 'Graphic design is the craft of creating visual content to communicate messages.',
        icon: 'palette',
        isVerifiable: true,
        testAvailable: false,
        popularity: 68,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'logo design', 
        category: 'design',
        description: 'Logo design is the process of designing a logo that represents a brand or company.',
        icon: 'brush',
        isVerifiable: true,
        testAvailable: false,
        popularity: 60,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Data Science & Analytics
      { 
        id: uuidv4(), 
        name: 'python', 
        category: 'data',
        description: 'Python is an interpreted high-level programming language.',
        icon: 'python',
        isVerifiable: true,
        testAvailable: true,
        popularity: 88,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'data analysis', 
        category: 'data',
        description: 'Data analysis is the process of inspecting and modeling data to discover useful information.',
        icon: 'analytics',
        isVerifiable: true,
        testAvailable: true,
        popularity: 75,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'machine learning', 
        category: 'data',
        description: 'Machine learning is the study of computer algorithms that improve automatically through experience.',
        icon: 'machine_learning',
        isVerifiable: true,
        testAvailable: true,
        popularity: 82,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Business & Marketing
      { 
        id: uuidv4(), 
        name: 'digital marketing', 
        category: 'business',
        description: 'Digital marketing is the marketing of products or services using digital technologies.',
        icon: 'marketing',
        isVerifiable: true,
        testAvailable: false,
        popularity: 70,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'social media marketing', 
        category: 'business',
        description: 'Social media marketing is the use of social media platforms to promote a product or service.',
        icon: 'social_media',
        isVerifiable: true,
        testAvailable: false,
        popularity: 75,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Writing & Translation
      { 
        id: uuidv4(), 
        name: 'content writing', 
        category: 'writing',
        description: 'Content writing is the process of planning, writing and editing web content.',
        icon: 'edit',
        isVerifiable: true,
        testAvailable: false,
        popularity: 65,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'translation', 
        category: 'writing',
        description: 'Translation is the communication of the meaning of a source-language text into a target-language text.',
        icon: 'translate',
        isVerifiable: true,
        testAvailable: false,
        popularity: 60,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Local Ghanaian skills
      { 
        id: uuidv4(), 
        name: 'twi translation', 
        category: 'writing',
        description: 'Translation services for Twi, a dialect of the Akan language spoken in Ghana.',
        icon: 'translate',
        isVerifiable: true,
        testAvailable: false,
        popularity: 50,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'cocoa farming', 
        category: 'agriculture',
        description: 'Knowledge and skills related to cocoa cultivation, a major crop in Ghana.',
        icon: 'agriculture',
        isVerifiable: false,
        testAvailable: false,
        popularity: 45,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: uuidv4(), 
        name: 'kente weaving', 
        category: 'design',
        description: 'Traditional Ghanaian textile production through weaving.',
        icon: 'design',
        isVerifiable: false,
        testAvailable: false,
        popularity: 40,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert skills data
    await queryInterface.bulkInsert('skills', skills, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all seeded skills
    await queryInterface.bulkDelete('skills', null, {});
  }
}; 