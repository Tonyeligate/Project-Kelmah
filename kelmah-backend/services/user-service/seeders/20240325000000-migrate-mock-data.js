'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Mock data validation functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validateUsername = (username) => {
  const re = /^[a-zA-Z0-9_-]{3,20}$/;
  return re.test(username);
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Seed skills data
      const skillsData = [
        { id: uuidv4(), name: 'JavaScript', category: 'programming', popularity: 95, description: 'A high-level, interpreted programming language' },
        { id: uuidv4(), name: 'React', category: 'frontend', popularity: 90, description: 'A JavaScript library for building user interfaces' },
        { id: uuidv4(), name: 'Node.js', category: 'backend', popularity: 88, description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine' },
        { id: uuidv4(), name: 'Python', category: 'programming', popularity: 92, description: 'An interpreted high-level programming language' },
        { id: uuidv4(), name: 'AWS', category: 'cloud', popularity: 85, description: 'Cloud computing services provided by Amazon' }
      ].map(skill => ({
        ...skill,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await queryInterface.bulkInsert('Skills', skillsData, {});

      // Seed users data with validation
      const usersData = [
        {
          id: uuidv4(),
          username: 'johndoe',
          email: 'john@example.com',
          password: await bcrypt.hash('Password123!', 10),
          role: 'worker'
        },
        {
          id: uuidv4(),
          username: 'janedoe',
          email: 'jane@example.com',
          password: await bcrypt.hash('Password123!', 10),
          role: 'hirer'
        }
      ].filter(user => {
        const isValid = validateEmail(user.email) && validateUsername(user.username);
        if (!isValid) {
          console.warn(`Skipping invalid user data: ${user.email}`);
        }
        return isValid;
      }).map(user => ({
        ...user,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await queryInterface.bulkInsert('Users', usersData, {});

      // Create profiles for seeded users
      const profilesData = usersData.map(user => ({
        id: uuidv4(),
        userId: user.id,
        firstName: user.username.charAt(0).toUpperCase() + user.username.slice(1, -3),
        lastName: 'Doe',
        bio: `A ${user.role} on the Kelmah platform`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await queryInterface.bulkInsert('Profiles', profilesData, {});

      console.log('Mock data migration completed successfully');
    } catch (error) {
      console.error('Error migrating mock data:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove seeded data in reverse order to handle foreign key constraints
    await queryInterface.bulkDelete('Profiles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Skills', null, {});
  }
}; 