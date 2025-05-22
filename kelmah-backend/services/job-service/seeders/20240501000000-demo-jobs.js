'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get or create test user IDs
    const testHirerIds = [
      uuidv4(), // Hirer 1
      uuidv4(), // Hirer 2
      uuidv4()  // Hirer 3
    ];

    // Demo jobs data
    const jobs = [
      // Web Development Jobs
      {
        id: uuidv4(),
        title: 'Develop Responsive E-commerce Website',
        description: 'Looking for an experienced web developer to build a responsive e-commerce website for a fashion brand. The website should have product listings, shopping cart, payment integration, and user account management.',
        hirerUserId: testHirerIds[0],
        status: 'open',
        category: 'Web Development',
        subCategory: 'E-commerce',
        skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Responsive Design'],
        budget: 5000.00,
        currency: 'GHS',
        paymentType: 'milestone',
        estimatedHours: 120,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        location: JSON.stringify({
          city: 'Accra',
          country: 'Ghana',
          remote: true
        }),
        jobType: 'remote',
        experience: 'intermediate',
        visibility: 'public',
        applicationCount: 0,
        hiredCount: 0,
        maxHires: 1,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'WordPress Blog Setup and Customization',
        description: 'Need a WordPress expert to set up a blog for a food business. The blog should have custom theme, recipe management, newsletter signup, and social media integration.',
        hirerUserId: testHirerIds[1],
        status: 'open',
        category: 'Web Development',
        subCategory: 'WordPress',
        skills: ['WordPress', 'PHP', 'CSS', 'Theme Development', 'Plugin Integration'],
        budget: 2500.00,
        currency: 'GHS',
        paymentType: 'fixed',
        estimatedHours: 40,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        location: JSON.stringify({
          city: 'Kumasi',
          country: 'Ghana',
          remote: true
        }),
        jobType: 'remote',
        experience: 'entry',
        visibility: 'public',
        applicationCount: 0,
        hiredCount: 0,
        maxHires: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Mobile App Development Jobs
      {
        id: uuidv4(),
        title: 'Delivery Service Mobile App Development',
        description: 'Looking for a mobile app developer to build a food delivery service app. The app should have features like restaurant listings, menu management, order tracking, payment processing, and delivery management.',
        hirerUserId: testHirerIds[2],
        status: 'open',
        category: 'Mobile Development',
        subCategory: 'Food Delivery',
        skills: ['React Native', 'Firebase', 'Google Maps API', 'Payment Gateway Integration'],
        budget: 8000.00,
        currency: 'GHS',
        paymentType: 'milestone',
        estimatedHours: 160,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        location: JSON.stringify({
          city: 'Accra',
          country: 'Ghana',
          remote: true
        }),
        jobType: 'remote',
        experience: 'expert',
        visibility: 'public',
        applicationCount: 0,
        hiredCount: 0,
        maxHires: 2,
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Graphic Design Jobs
      {
        id: uuidv4(),
        title: 'Logo and Brand Identity Design',
        description: 'Seeking a talented graphic designer to create a logo and brand identity for a new tech startup. The work includes logo design, color palette, typography, business cards, and basic brand guidelines.',
        hirerUserId: testHirerIds[0],
        status: 'open',
        category: 'Graphic Design',
        subCategory: 'Brand Identity',
        skills: ['Logo Design', 'Adobe Illustrator', 'Typography', 'Brand Guidelines'],
        budget: 1500.00,
        currency: 'GHS',
        paymentType: 'fixed',
        estimatedHours: 30,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        location: JSON.stringify({
          city: 'Tema',
          country: 'Ghana',
          remote: true
        }),
        jobType: 'remote',
        experience: 'intermediate',
        visibility: 'public',
        applicationCount: 0,
        hiredCount: 0,
        maxHires: 1,
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Content Writing Jobs
      {
        id: uuidv4(),
        title: 'Blog Content Writing for Real Estate Agency',
        description: 'Looking for a content writer to create engaging blog posts for a real estate agency. Topics will include home buying tips, investment advice, property market trends, and neighborhood guides in Ghana.',
        hirerUserId: testHirerIds[1],
        status: 'open',
        category: 'Content Writing',
        subCategory: 'Blog Writing',
        skills: ['Copywriting', 'SEO Knowledge', 'Research', 'Real Estate Knowledge'],
        budget: 1200.00,
        currency: 'GHS',
        paymentType: 'hourly',
        estimatedHours: 40,
        deadline: null,
        location: JSON.stringify({
          country: 'Ghana',
          remote: true
        }),
        jobType: 'remote',
        experience: 'entry',
        visibility: 'public',
        applicationCount: 0,
        hiredCount: 0,
        maxHires: 1,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert the jobs
    await queryInterface.bulkInsert('jobs', jobs, {});
    
    console.log(`Inserted ${jobs.length} demo jobs`);
    
    return Promise.resolve();
  },

  async down(queryInterface, Sequelize) {
    // Remove all the demo jobs
    await queryInterface.bulkDelete('jobs', null, {});
  }
}; 