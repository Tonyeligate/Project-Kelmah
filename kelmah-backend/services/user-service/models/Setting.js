// Define a minimal Setting model
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Setting = sequelize.define(
    'Setting',
    {
      // Define attributes here as needed
    },
    {
      timestamps: false
    }
  );
  return Setting;
};
