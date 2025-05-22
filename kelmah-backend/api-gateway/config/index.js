require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  REVIEW_SERVICE_URL: process.env.REVIEW_SERVICE_URL || "http://localhost:5006",
};
