#!/usr/bin/env node
/**
 * Backfill User.locationCoordinates from legacy latitude/longitude fields in WorkerProfile
 * Usage: NODE_ENV=production MONGODB_URI=... USER_SQL_URL=... node scripts/backfill-user-geo.js
 */
const mongoose = require('mongoose');
const { Sequelize, DataTypes, Op } = require('sequelize');

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.USER_MONGO_URL;
  const sqlUrl = process.env.USER_SQL_URL || process.env.DATABASE_URL;
  if (!mongoUri || !sqlUrl) {
    console.error('Missing MONGODB_URI and/or USER_SQL_URL');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  const sequelize = new Sequelize(sqlUrl, { dialect: 'postgres', logging: false });
  const User = require('../models/User');
  const WorkerProfile = require('../models/WorkerProfile')(sequelize, DataTypes);

  const batch = 200;
  let updated = 0;
  let offset = 0;

  while (true) {
    const rows = await WorkerProfile.findAll({
      where: {
        isActive: true,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
      },
      limit: batch,
      offset,
      order: [['updatedAt', 'DESC']],
    });
    if (!rows.length) break;
    for (const w of rows) {
      const lat = Number(w.latitude);
      const lng = Number(w.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      await User.updateOne(
        { _id: w.userId },
        {
          $set: {
            locationCoordinates: { type: 'Point', coordinates: [lng, lat] },
            city: undefined,
          }
        },
        { upsert: false }
      );
      updated += 1;
    }
    offset += rows.length;
    console.log(`Processed ${offset} profiles, updated ~${updated}`);
  }
  console.log(`DONE. Updated ${updated} users with locationCoordinates.`);
  await sequelize.close();
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


