#!/usr/bin/env node
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { execFileSync } = require('child_process');
const { User } = require('../shared/models');

const ROOT_DIR = path.resolve(__dirname, '..');
[
  path.join(ROOT_DIR, '.env'),
  path.join(ROOT_DIR, 'services', 'user-service', '.env'),
  path.join(ROOT_DIR, 'api-gateway', '.env'),
].forEach((envPath) => dotenv.config({ path: envPath, override: false }));

const mongoUri = process.env.MONGODB_URI || process.env.USER_MONGO_URI || process.env.MONGO_URI;

const parseSrvConnectionString = (uri) => {
  const parsed = new URL(uri);
  return {
    username: decodeURIComponent(parsed.username || ''),
    password: decodeURIComponent(parsed.password || ''),
    host: parsed.hostname,
    database: parsed.pathname.replace(/^\//, '') || 'kelmah_platform',
    params: parsed.searchParams,
  };
};

const buildDirectMongoUriFromSrv = (uri) => {
  const { username, password, host, database, params } = parseSrvConnectionString(uri);
  const srvOutput = execFileSync('nslookup', ['-type=SRV', `_mongodb._tcp.${host}`], { encoding: 'utf8' });
  const txtOutput = execFileSync('nslookup', ['-type=TXT', host], { encoding: 'utf8' });
  const hosts = Array.from(new Set(srvOutput.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.toLowerCase().startsWith('svr hostname')).map((line) => line.split('=').pop().trim())));
  const txtMatch = txtOutput.match(/"([^"]+)"/);
  const merged = new URLSearchParams(txtMatch?.[1] || 'authSource=admin');
  params.forEach((v, k) => merged.set(k, v));
  merged.set('tls', 'true');
  return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hosts.join(',')}/${database}?${merged.toString()}`;
};

(async () => {
  try {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 });
    } catch (error) {
      const direct = buildDirectMongoUriFromSrv(mongoUri);
      await mongoose.connect(direct, { serverSelectionTimeoutMS: 30000 });
    }

    const users = await User.find({ isActive: { $ne: false } })
      .select('firstName lastName email role profession skills specializations location bio profilePictureMetadata')
      .sort({ role: 1, createdAt: 1 })
      .lean();

    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
