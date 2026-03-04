"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role: {
        type: Sequelize.ENUM("admin", "hirer", "worker", "staff"),
        allowNull: false,
        defaultValue: "worker",
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      emailVerificationToken: { type: Sequelize.STRING },
      emailVerificationExpires: { type: Sequelize.DATE },
      isPhoneVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      phoneVerificationToken: { type: Sequelize.STRING },
      phoneVerificationExpires: { type: Sequelize.DATE },
      passwordResetToken: { type: Sequelize.STRING },
      passwordResetExpires: { type: Sequelize.DATE },
      isTwoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      twoFactorSecret: { type: Sequelize.STRING },
      tokenVersion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLogin: { type: Sequelize.DATE },
      googleId: { type: Sequelize.STRING, unique: true },
      facebookId: { type: Sequelize.STRING, unique: true },
      linkedinId: { type: Sequelize.STRING, unique: true },
      dateOfBirth: { type: Sequelize.DATEONLY },
      gender: {
        type: Sequelize.ENUM("male", "female", "other", "prefer_not_to_say"),
        defaultValue: "prefer_not_to_say",
      },
      address: { type: Sequelize.STRING },
      city: { type: Sequelize.STRING },
      state: { type: Sequelize.STRING },
      country: { type: Sequelize.STRING, defaultValue: "Ghana" },
      countryCode: { type: Sequelize.STRING(2), defaultValue: "GH" },
      postalCode: { type: Sequelize.STRING },
      profilePicture: { type: Sequelize.STRING },
      bio: { type: Sequelize.TEXT },
      failedLoginAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Users_role";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Users_gender";',
    );
  },
};
