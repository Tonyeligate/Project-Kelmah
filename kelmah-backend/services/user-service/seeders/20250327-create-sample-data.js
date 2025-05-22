'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create a test user if not exists
    const testUserId = uuidv4();
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE email = 'testworker@kelmah.com' LIMIT 1;`
    );
    
    let userId = testUserId;
    if (users[0].length > 0) {
      userId = users[0][0].id;
    } else {
      await queryInterface.bulkInsert('Users', [{
        id: testUserId,
        email: 'testworker@kelmah.com',
        username: 'testworker',
        password: '$2a$10$LR8Vg3QZcVnlN/Zyx0MBP.TgG9inxlKBzAT1oQJJZdd4ptIBF4pYS', // hashed 'Password123!'
        firstName: 'Test',
        lastName: 'Worker',
        role: 'worker',
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
      userId = testUserId;
    }

    // Create a profile for the test user
    const profiles = await queryInterface.sequelize.query(
      `SELECT id FROM "Profiles" WHERE "userId" = '${userId}' LIMIT 1;`
    );
    
    let profileId;
    if (profiles[0].length > 0) {
      profileId = profiles[0][0].id;
    } else {
      const newProfileId = uuidv4();
      await queryInterface.bulkInsert('Profiles', [{
        id: newProfileId,
        userId: userId,
        title: 'Experienced Carpenter',
        bio: 'I am an experienced carpenter with over 5 years of experience in residential construction. Skilled in framing, trim work, and cabinet installation.',
        hourlyRate: 35.00,
        availability: JSON.stringify({
          monday: { available: true, hours: '08:00-17:00' },
          tuesday: { available: true, hours: '08:00-17:00' },
          wednesday: { available: true, hours: '08:00-17:00' },
          thursday: { available: true, hours: '08:00-17:00' },
          friday: { available: true, hours: '08:00-17:00' },
          saturday: { available: false, hours: '' },
          sunday: { available: false, hours: '' }
        }),
        location: JSON.stringify({
          address: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'USA',
          latitude: 34.0522,
          longitude: -118.2437
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
      profileId = newProfileId;
    }

    // Create skills
    const skills = [
      { id: uuidv4(), name: 'Carpentry', category: 'Construction', description: 'Woodworking and structural building', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Plumbing', category: 'Construction', description: 'Installation and repair of water systems', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Electrical', category: 'Construction', description: 'Installation and repair of electrical systems', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Painting', category: 'Construction', description: 'Interior and exterior painting', createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Landscaping', category: 'Outdoor', description: 'Garden and yard maintenance', createdAt: new Date(), updatedAt: new Date() }
    ];

    // Check if skills already exist
    for (const skill of skills) {
      const existingSkill = await queryInterface.sequelize.query(
        `SELECT id FROM "Skills" WHERE name = '${skill.name}' LIMIT 1;`
      );
      
      if (existingSkill[0].length === 0) {
        await queryInterface.bulkInsert('Skills', [skill]);
      }
    }

    // Get all skill IDs
    const allSkills = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Skills" LIMIT 10;`
    );
    
    const skillIds = allSkills[0].map(s => s.id);
    
    // Create profile_skills associations
    for (let i = 0; i < Math.min(skillIds.length, 5); i++) {
      const existingProfileSkill = await queryInterface.sequelize.query(
        `SELECT id FROM "ProfileSkills" WHERE "profileId" = '${profileId}' AND "skillId" = '${skillIds[i]}' LIMIT 1;`
      );
      
      if (existingProfileSkill[0].length === 0) {
        await queryInterface.bulkInsert('ProfileSkills', [{
          id: uuidv4(),
          profileId: profileId,
          skillId: skillIds[i],
          level: ['Beginner', 'Intermediate', 'Advanced', 'Expert'][Math.floor(Math.random() * 4)],
          yearsExperience: Math.floor(Math.random() * 10) + 1,
          endorsements: Math.floor(Math.random() * 20),
          createdAt: new Date(),
          updatedAt: new Date()
        }]);
      }
    }

    // Create job applications
    const statuses = ['pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected'];
    const companies = ['ABC Construction', 'XYZ Building Services', 'Metro Renovations', 'City Builders', 'Quality Home Repairs'];
    const jobTitles = ['Carpenter', 'Construction Worker', 'Handyman', 'Renovation Specialist', 'Cabinet Maker'];
    
    for (let i = 0; i < 10; i++) {
      const jobId = uuidv4();
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
      
      await queryInterface.bulkInsert('job_applications', [{
        id: uuidv4(),
        workerId: userId,
        jobId: jobId,
        jobTitle: jobTitle,
        companyName: company,
        coverLetter: `I am interested in the ${jobTitle} position at ${company}.`,
        proposedRate: 35.00 + Math.floor(Math.random() * 20),
        status: status,
        interviewDate: status === 'interview' || status === 'accepted' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
        feedbackFromHirer: status === 'rejected' ? 'We decided to go with a candidate with more experience.' : null,
        appliedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }

    // Create skill assessments
    const assessmentStatuses = ['pending', 'in_progress', 'completed', 'expired', 'failed'];
    
    for (let i = 0; i < Math.min(skillIds.length, 5); i++) {
      const status = assessmentStatuses[Math.floor(Math.random() * assessmentStatuses.length)];
      const skillName = allSkills[0][i].name;
      
      await queryInterface.bulkInsert('skill_assessments', [{
        id: uuidv4(),
        workerId: userId,
        skillId: skillIds[i],
        skillName: skillName,
        status: status,
        score: status === 'completed' ? Math.floor(Math.random() * 41) + 60 : null, // 60-100
        percentile: status === 'completed' ? Math.floor(Math.random() * 81) + 20 : null, // 20-100
        certificateId: status === 'completed' ? `CERT-${uuidv4().substring(0, 8).toUpperCase()}` : null,
        certificateUrl: status === 'completed' ? `https://kelmah.com/certificates/${uuidv4()}` : null,
        hasCertificate: status === 'completed',
        scheduledDate: status === 'pending' ? new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000) : null,
        completedDate: status === 'completed' ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null,
        expiryDate: status === 'completed' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        attempt: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the seeded data
    // We're using raw queries to delete only our test data without affecting other data
    await queryInterface.sequelize.query(`DELETE FROM "skill_assessments" WHERE "workerId" IN (SELECT id FROM "Users" WHERE email = 'testworker@kelmah.com');`);
    await queryInterface.sequelize.query(`DELETE FROM "job_applications" WHERE "workerId" IN (SELECT id FROM "Users" WHERE email = 'testworker@kelmah.com');`);
    await queryInterface.sequelize.query(`DELETE FROM "ProfileSkills" WHERE "profileId" IN (SELECT id FROM "Profiles" WHERE "userId" IN (SELECT id FROM "Users" WHERE email = 'testworker@kelmah.com'));`);
    await queryInterface.sequelize.query(`DELETE FROM "Profiles" WHERE "userId" IN (SELECT id FROM "Users" WHERE email = 'testworker@kelmah.com');`);
    await queryInterface.sequelize.query(`DELETE FROM "Users" WHERE email = 'testworker@kelmah.com';`);
  }
}; 