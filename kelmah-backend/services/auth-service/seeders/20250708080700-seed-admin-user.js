"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bcrypt = require("bcryptjs");
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
    if (!adminPassword) throw new Error('ADMIN_DEFAULT_PASSWORD env var is required');
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          id: Sequelize.literal("uuid_generate_v4()"),
          firstName: "Kelmah",
          lastName: "Admin",
          email: "admin@kelmah.com",
          phone: null,
          password: passwordHash,
          role: "admin",
          isEmailVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", { email: "admin@kelmah.com" }, {});
  },
};
