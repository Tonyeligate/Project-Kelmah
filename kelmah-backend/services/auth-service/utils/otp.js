const crypto = require('crypto');

module.exports = {
  generateOTP: () => crypto.randomInt(100000, 999999).toString(),
};
