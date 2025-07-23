// Define a minimal Notification model
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    'Notification',
    {
      // Define attributes here as needed
    },
    {
      timestamps: false
    }
  );
  return Notification;
};
