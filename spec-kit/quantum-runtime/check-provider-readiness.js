#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {
  PROVIDER_CONFIG,
  getProviderCredentials,
  getProviderEnvironmentKeys,
  isProviderConfigured,
} = require('./providers');
const { ENV_FILES } = require('./load-quantum-env');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const LOCAL_ENV_FILE = path.resolve(ROOT_DIR, '.env.quantum.local');

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const strict = args.has('--strict');

function maskSecret(value) {
  if (!value) {
    return '';
  }
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function buildProviderStatus(providerName) {
  const config = PROVIDER_CONFIG[providerName];
  const envKeys = getProviderEnvironmentKeys(providerName) || { endpointEnvs: [], tokenEnvs: [] };
  const credentials = getProviderCredentials(providerName) || { endpoint: '', token: '' };
  const requiresCredentials = envKeys.endpointEnvs.length > 0 || envKeys.tokenEnvs.length > 0;

  return {
    provider: providerName,
    configured: isProviderConfigured(providerName),
    requiresCredentials,
    endpointPresent: requiresCredentials ? Boolean(credentials.endpoint) : null,
    tokenPresent: requiresCredentials ? Boolean(credentials.token) : null,
    endpointEnvs: envKeys.endpointEnvs,
    tokenEnvs: envKeys.tokenEnvs,
    authHeader: config.authHeader || 'Authorization',
    endpointPreview: requiresCredentials ? (credentials.endpoint || '') : '',
    tokenPreview: requiresCredentials ? maskSecret(credentials.token) : '',
  };
}

function printHumanReport(report) {
  console.log('Quantum Provider Readiness');
  console.log('==========================');
  console.log(`Simulation mode: ${report.simulationEnabled ? 'enabled' : 'disabled'}`);
  console.log(`Env files checked (first to last): ${report.envFiles.join(', ')}`);
  console.log('');

  report.providers.forEach((provider) => {
    const endpointStatus = provider.endpointPresent === null
      ? 'n/a (no endpoint required)'
      : provider.endpointPresent
        ? 'yes'
        : 'no';
    const tokenStatus = provider.tokenPresent === null
      ? 'n/a (no token required)'
      : provider.tokenPresent
        ? 'yes'
        : 'no';

    console.log(`[${provider.configured ? 'READY' : 'MISSING'}] ${provider.provider}`);
    console.log(`  Endpoint vars: ${provider.endpointEnvs.length > 0 ? provider.endpointEnvs.join(' | ') : 'none'}`);
    console.log(`  Token vars: ${provider.tokenEnvs.length > 0 ? provider.tokenEnvs.join(' | ') : 'none'}`);
    console.log(`  Endpoint present: ${endpointStatus}`);
    console.log(`  Token present: ${tokenStatus}`);
    console.log(`  Auth header: ${provider.authHeader}`);
    if (provider.endpointPreview) {
      console.log(`  Endpoint value: ${provider.endpointPreview}`);
    }
    if (provider.tokenPreview) {
      console.log(`  Token value: ${provider.tokenPreview}`);
    }
    console.log('');
  });

  if (report.unconfiguredProviders.length) {
    console.log(`Unconfigured providers: ${report.unconfiguredProviders.join(', ')}`);
    if (fs.existsSync(LOCAL_ENV_FILE)) {
      console.log('Tip: fill missing values in .env.quantum.local.');
    } else {
      console.log('Tip: copy .env.quantum.example to .env.quantum.local and fill in values.');
    }
  } else {
    console.log('All providers are configured for live calls.');
  }
}

const providers = Object.keys(PROVIDER_CONFIG).map(buildProviderStatus);
const unconfiguredProviders = providers
  .filter((provider) => !provider.configured)
  .map((provider) => provider.provider);

const report = {
  simulationEnabled: String(process.env.QUANTUM_PROVIDER_SIMULATION || 'false').toLowerCase() === 'true',
  envFiles: ENV_FILES,
  providers,
  unconfiguredProviders,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printHumanReport(report);
}

if (strict && unconfiguredProviders.length > 0) {
  process.exitCode = 1;
}
