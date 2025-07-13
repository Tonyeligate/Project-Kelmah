/**
 * User Model (copied from user-service)
 * Defines the structure for user records in the auth-service scope so we don't rely
 * on sibling service code at runtime.  Uses bcryptjs and local config.
 */

const { DataTypes, Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const config = require("../config");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true, notEmpty: true },
      },
      phone: {
        type: DataTypes.STRING,
        unique: true,
        validate: { is: /^((\+\d{1,3}[- ]?)?\d{10})$/ },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [8, 100] },
      },
      role: {
        type: DataTypes.ENUM("admin", "hirer", "worker", "staff"),
        defaultValue: "worker",
        allowNull: false,
      },
      isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
      emailVerificationToken: { type: DataTypes.STRING },
      emailVerificationExpires: { type: DataTypes.DATE },
      // Token versioning for JWT invalidation
      tokenVersion: { type: DataTypes.INTEGER, defaultValue: 0 },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      lastLogin: { type: DataTypes.DATE },
      passwordResetToken: { type: DataTypes.STRING },
      passwordResetExpires: { type: DataTypes.DATE },
      deletedAt: { type: DataTypes.DATE },
    },
    {
      paranoid: true,
      getterMethods: {
        fullName() {
          return `${this.firstName} ${this.lastName}`;
        },
      },
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(
              user.password,
              config.bcrypt?.saltRounds || 10,
            );
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(
              user.password,
              config.bcrypt?.saltRounds || 10,
            );
          }
        },
      },
    },
  );

  // Instance methods
  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.generateVerificationToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.emailVerificationToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    return token;
  };

  User.prototype.generatePasswordResetToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    return token;
  };

  User.findByEmail = async function (email) {
    return this.findOne({ where: { email } });
  };

  User.findByVerificationToken = async function (token) {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    return this.findOne({
      where: {
        emailVerificationToken: hashed,
        emailVerificationExpires: { [Op.gt]: Date.now() },
      },
    });
  };

  User.findByPasswordResetToken = async function (token) {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    return this.findOne({
      where: {
        passwordResetToken: hashed,
        passwordResetExpires: { [Op.gt]: Date.now() },
      },
    });
  };

  return User;
}; 