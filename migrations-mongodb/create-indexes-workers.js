#!/usr/bin/env node
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const Workers = mongoose.connection.collection('workerprofiles');
  await Workers.createIndex({ 'skills.skillName': 1 });
  await Workers.createIndex({ rating: -1 });
  await Workers.createIndex({ isActive: 1 });
  await Workers.createIndex({ availabilityStatus: 1 });
  console.log('Indexes ensured on workerprofiles.');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });


