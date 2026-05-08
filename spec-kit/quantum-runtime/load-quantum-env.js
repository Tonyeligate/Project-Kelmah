const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const ENV_FILES = Object.freeze([
  '.env.quantum.local',
  '.env.quantum',
  '.env.local',
  '.env',
]);

let initialized = false;

function initializeQuantumProviderEnv() {
  if (initialized) {
    return;
  }
  initialized = true;

  let dotenv;
  try {
    dotenv = require('dotenv');
  } catch (_) {
    return;
  }

  ENV_FILES.forEach((fileName) => {
    const filePath = path.resolve(ROOT_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return;
    }

    dotenv.config({
      path: filePath,
      override: false,
      quiet: true,
    });
  });
}

module.exports = {
  ENV_FILES,
  initializeQuantumProviderEnv,
};
