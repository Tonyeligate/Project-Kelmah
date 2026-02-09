"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash("Admin@123", 10);
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
