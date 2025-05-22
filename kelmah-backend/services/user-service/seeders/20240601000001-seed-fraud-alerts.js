'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get some admin users for resolving alerts
    const adminUsers = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE role = 'admin' LIMIT 2;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Get some regular users to attach alerts to
    const regularUsers = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE role IN ('worker', 'hirer') LIMIT 10;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (!regularUsers.length) {
      console.log('No regular users found for seeding fraud alerts');
      return;
    }
    
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const categories = ['payment', 'login', 'profile', 'behavior'];
    const riskLevels = ['low', 'medium', 'high'];
    const descriptions = {
      payment: [
        'Suspicious large transaction attempted',
        'Multiple rapid transactions detected',
        'Payment from unusual location',
        'Transaction with mismatched billing information'
      ],
      login: [
        'Login attempt from unusual location',
        'Multiple failed login attempts',
        'Login from known proxy service',
        'Login with unusual device characteristics'
      ],
      profile: [
        'Suspicious profile changes detected',
        'Multiple profile updates in short period',
        'Verification document anomalies detected',
        'Suspicious email change'
      ],
      behavior: [
        'Unusual browsing pattern detected',
        'Potential scraping behavior',
        'Unusual activity timing',
        'Rapid action sequence detected'
      ]
    };
    
    // Generate 30 random alerts - 20 pending, 10 resolved
    const alerts = [];
    
    // Pending alerts
    for (let i = 0; i < 20; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const userId = regularUsers[Math.floor(Math.random() * regularUsers.length)].id;
      
      const descriptionList = descriptions[category];
      const description = descriptionList[Math.floor(Math.random() * descriptionList.length)];
      
      // Random date within the last two weeks
      const detectedAt = new Date(twoWeeksAgo);
      detectedAt.setDate(detectedAt.getDate() + Math.floor(Math.random() * 14));
      
      const alert = {
        id: uuidv4(),
        userId,
        category,
        riskLevel,
        description,
        detectedAt,
        status: 'pending',
        resolution: null,
        resolvedAt: null,
        resolvedBy: null,
        metadata: JSON.stringify({
          ipAddress: '192.168.1.' + Math.floor(Math.random() * 254),
          deviceInfo: {
            browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)],
            os: ['Windows', 'macOS', 'Linux'][Math.floor(Math.random() * 3)],
            deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)]
          }
        }),
        createdAt: detectedAt,
        updatedAt: detectedAt
      };
      
      alerts.push(alert);
    }
    
    // Resolved alerts
    if (adminUsers.length) {
      for (let i = 0; i < 10; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        const userId = regularUsers[Math.floor(Math.random() * regularUsers.length)].id;
        const adminId = adminUsers[Math.floor(Math.random() * adminUsers.length)].id;
        
        const descriptionList = descriptions[category];
        const description = descriptionList[Math.floor(Math.random() * descriptionList.length)];
        
        // Random detected date within the last 3-4 weeks
        const detectedAt = new Date(twoWeeksAgo);
        detectedAt.setDate(detectedAt.getDate() - 7 - Math.floor(Math.random() * 7));
        
        // Random resolved date (after detection, before now)
        const resolvedAt = new Date(detectedAt);
        resolvedAt.setHours(resolvedAt.getHours() + Math.floor(Math.random() * 48));
        
        const resolution = ['ignore', 'flag', 'block'][Math.floor(Math.random() * 3)];
        
        const alert = {
          id: uuidv4(),
          userId,
          category,
          riskLevel,
          description,
          detectedAt,
          status: 'resolved',
          resolution,
          resolvedAt,
          resolvedBy: adminId,
          metadata: JSON.stringify({
            ipAddress: '192.168.1.' + Math.floor(Math.random() * 254),
            deviceInfo: {
              browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)],
              os: ['Windows', 'macOS', 'Linux'][Math.floor(Math.random() * 3)],
              deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)]
            }
          }),
          createdAt: detectedAt,
          updatedAt: resolvedAt
        };
        
        alerts.push(alert);
      }
    }
    
    if (alerts.length) {
      await queryInterface.bulkInsert('fraud_alerts', alerts);
      console.log(`Seeded ${alerts.length} fraud alerts`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('fraud_alerts', null, {});
  }
};