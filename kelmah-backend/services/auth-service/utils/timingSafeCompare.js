const crypto = require('crypto');

function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const key = Buffer.alloc(32, 0);
  const hashA = crypto.createHmac('sha256', key).update(a).digest();
  const hashB = crypto.createHmac('sha256', key).update(b).digest();

  return crypto.timingSafeEqual(hashA, hashB);
}

module.exports = timingSafeCompare;