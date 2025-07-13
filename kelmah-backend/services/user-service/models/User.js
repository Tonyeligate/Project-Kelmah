/**
 * User Model
 * Defines the structure for user records in the database
 */

const { DataTypes, Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const config = require("../../../src/config");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Basic Info
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },

      phone: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          is: /^(\+\d{1,3}[- ]?)?\d{10}$/,
        },
      },

      // Authentication
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [8, 100],
        },
      },

      // User Role
      role: {
        type: DataTypes.ENUM("admin", "hirer", "worker", "staff"),
        defaultValue: "worker",
        allowNull: false,
      },

      // Email Verification
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      emailVerificationToken: {
        type: DataTypes.STRING,
      },

      emailVerificationExpires: {
        type: DataTypes.DATE,
      },

      // Phone Verification
      isPhoneVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      phoneVerificationToken: {
        type: DataTypes.STRING,
      },

      phoneVerificationExpires: {
        type: DataTypes.DATE,
      },

      // Password Reset
      passwordResetToken: {
        type: DataTypes.STRING,
      },

      passwordResetExpires: {
        type: DataTypes.DATE,
      },

      // Two-Factor Auth
      isTwoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      twoFactorSecret: {
        type: DataTypes.STRING,
      },

      // Token management
      tokenVersion: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      // Account Status
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      lastLogin: {
        type: DataTypes.DATE,
      },

      // OAuth Integration
      googleId: {
        type: DataTypes.STRING,
        unique: true,
      },

      facebookId: {
        type: DataTypes.STRING,
        unique: true,
      },

      linkedinId: {
        type: DataTypes.STRING,
        unique: true,
      },

      // Personal Info
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        validate: {
          isDate: true,
        },
      },

      gender: {
        type: DataTypes.ENUM("male", "female", "other", "prefer_not_to_say"),
        defaultValue: "prefer_not_to_say",
      },

      // Address Info
      address: {
        type: DataTypes.STRING,
      },

      city: {
        type: DataTypes.STRING,
      },

      state: {
        type: DataTypes.STRING,
      },

      country: {
        type: DataTypes.STRING,
        defaultValue: "Ghana",
      },

      countryCode: {
        type: DataTypes.STRING(2),
        defaultValue: "GH",
      },

      postalCode: {
        type: DataTypes.STRING,
      },

      // Profile
      profilePicture: {
        type: DataTypes.STRING,
      },

      bio: {
        type: DataTypes.TEXT,
      },

      // Account Security
      failedLoginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      accountLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      accountLockedUntil: {
        type: DataTypes.DATE,
      },

      // Deletion
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      paranoid: true,

      // Define virtual fields
      getterMethods: {
        fullName() {
          return `${this.firstName} ${this.lastName}`;
        },
      },

      // Define hooks
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(
              user.password,
              config.bcrypt.saltRounds,
            );
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(
              user.password,
              config.bcrypt.saltRounds,
            );
          }
        },
      },
    },
  );

  // Instance method to check password
  User.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  // Instance method to generate verification token
  User.prototype.generateVerificationToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.emailVerificationToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token;
  };

  // Instance method to generate password reset token
  User.prototype.generatePasswordResetToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    return token;
  };

  // Instance method to increment token version (used for invalidating all existing tokens)
  User.prototype.incrementTokenVersion = async function () {
    this.tokenVersion += 1;
    await this.save();
  };

  // Class method to find user by email
  User.findByEmail = async function (email) {
    return await this.findOne({ where: { email } });
  };

  // Class method to find user by verification token
  User.findByVerificationToken = async function (token) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    return await this.findOne({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { [Op.gt]: Date.now() },
      },
    });
  };

  // Class method to find user by password reset token
  User.findByPasswordResetToken = async function (token) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    return await this.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: Date.now() },
      },
    });
  };

  return User;
};
