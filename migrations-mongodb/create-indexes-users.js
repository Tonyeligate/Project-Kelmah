#!/usr/bin/env node
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const User = mongoose.connection.collection('users');
  await User.createIndex({ email: 1 }, { unique: true });
  await User.createIndex({ role: 1 });
  await User.createIndex({ isActive: 1 });
  await User.createIndex({ createdAt: 1 });
  await User.createIndex({ locationCoordinates: '2dsphere' });
  console.log('Indexes ensured on users.');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });


