// Simple polling worker that would fetch recent attachments and mark scan status
// This is a stub; plug your queue/scanner of choice

const mongoose = require('mongoose');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!uri) {
      console.warn('[virus-scan] no DB configured');
      return;
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const Message = require('../models/Message');
    const { scanS3Object } = require('../utils/virusScan');
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const messages = await Message.find({ createdAt: { $gt: since }, 'attachments.0': { $exists: true } }).limit(100);
    for (const m of messages) {
      let changed = false;
      for (const a of m.attachments || []) {
        if (a.virusScan?.status === 'pending' && a.s3Key) {
          const res = await scanS3Object(a.s3Key);
          a.virusScan = { status: res.status, scannedAt: new Date(), engine: res.engine, details: res.details };
          changed = true;
        }
      }
      if (changed) await m.save();
    }
    await mongoose.disconnect();
  } catch (e) {
    console.error('[virus-scan] worker error', e.message);
  }
}

if (require.main === module) run();

module.exports = { run };


