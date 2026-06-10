// Migration: Convert legacy refresh tokens to secure hashed storage
// - Reads existing RefreshToken rows with `token`
// - Derives tokenHash and tokenId (jti) and stores into new fields
// - Optionally deletes raw token field (or keeps for fallback until cutover)

const mongoose = require('mongoose');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!uri) throw new Error('Missing DB URI');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const RefreshToken = require('../models/RefreshToken');
    const jwt = require('jsonwebtoken');
    const crypto = require('crypto');

    const legacy = await RefreshToken.collection.find({ token: { $exists: true } }).limit(1000).toArray();
    let migrated = 0;
    for (const row of legacy) {
      try {
        const parts = (row.token || '').split('.');
        if (parts.length !== 4) {
          // cannot migrate, revoke
          await RefreshToken.updateOne({ _id: row._id }, { $set: { isRevoked: true, revokedAt: new Date() } });
          continue;
        }
        const signed = parts.slice(0, 3).join('.');
        const raw = parts[3];
        const decoded = jwt.verify(signed, process.env.JWT_REFRESH_SECRET, {
          issuer: process.env.JWT_ISSUER || 'kelmah-auth-service',
          audience: process.env.JWT_AUDIENCE || 'kelmah-platform'
        });
        const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
        await RefreshToken.updateOne({ _id: row._id }, {
          $set: {
            tokenId: decoded.jti,
            tokenHash,
            version: row.version || decoded.version || 0,
          },
          $unset: { token: '' }
        });
        migrated += 1;
      } catch (e) {
        await RefreshToken.updateOne({ _id: row._id }, { $set: { isRevoked: true, revokedAt: new Date() } });
      }
    }
    console.log(`[migrate-refresh-tokens] migrated=${migrated} total=${legacy.length}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('[migrate-refresh-tokens] failed', e.message);
    process.exit(1);
  }
}

if (require.main === module) run();

module.exports = { run };


