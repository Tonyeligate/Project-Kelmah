#!/usr/bin/env node

const path = require('path');

function resolveWorkspaceModule(moduleName) {
  return require(require.resolve(moduleName, {
    paths: [
      __dirname,
      path.join(__dirname, 'kelmah-backend'),
      path.join(__dirname, 'kelmah-backend', 'services', 'auth-service'),
    ],
  }));
}

const mongoose = resolveWorkspaceModule('mongoose');
const bcrypt = resolveWorkspaceModule('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kelmah_db';

const BASELINE_GIFTY_USER = {
  email: 'giftyafisa@gmail.com',
  password: 'Vx7!Rk2#Lm9@Qa4',
  firstName: 'Gifty',
  lastName: 'Afisa',
  role: 'hirer',
  isEmailVerified: true,
  isActive: true,
  profileCompletion: 85,
};

const EXTRA_TEST_USERS = [
  {
    email: 'test.worker@kelmah.com',
    password: 'TestWorker123!',
    firstName: 'Test',
    lastName: 'Worker',
    role: 'worker',
    isEmailVerified: true,
    isActive: true,
    profileCompletion: 90,
  },
  {
    email: 'test.hirer@kelmah.com',
    password: 'TestHirer123!',
    firstName: 'Test',
    lastName: 'Hirer',
    role: 'hirer',
    isEmailVerified: true,
    isActive: true,
    profileCompletion: 75,
  },
];

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['hirer', 'worker', 'admin', 'super_admin'] },
  isEmailVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  profileCompletion: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: { type: Date, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  collection: 'users',
  strict: false,
});

const User = mongoose.models.GiftyTestUser || mongoose.model('GiftyTestUser', userSchema);

async function upsertUser(userData) {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const now = new Date();

  await User.updateOne(
    { email: userData.email },
    {
      $set: {
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isEmailVerified: userData.isEmailVerified,
        isActive: userData.isActive,
        profileCompletion: userData.profileCompletion,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        loginAttempts: 0,
        lockUntil: null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return User.findOne({ email: userData.email }).lean();
}

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);

    const giftyUser = await upsertUser(BASELINE_GIFTY_USER);
    const isPasswordValid = await bcrypt.compare(BASELINE_GIFTY_USER.password, giftyUser.password);

    console.log(`test_user_email=${giftyUser.email}`);
    console.log(`test_user_role=${giftyUser.role}`);
    console.log(`test_user_password_valid=${isPasswordValid}`);

    for (const userData of EXTRA_TEST_USERS) {
      const user = await upsertUser(userData);
      console.log(`extra_user_email=${user.email}`);
    }
  } catch (error) {
    console.error(`setup_error=${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  BASELINE_GIFTY_USER,
  EXTRA_TEST_USERS,
  main,
};