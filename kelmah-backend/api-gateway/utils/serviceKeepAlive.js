const axios = require('axios');
const { detectEnvironment } = require('./serviceDiscovery');

const DEFAULT_INTERVAL_MS = parseInt(process.env.RENDER_KEEP_ALIVE_INTERVAL_MS, 10) || (8 * 60 * 1000);
const DEFAULT_TIMEOUT_MS = parseInt(process.env.RENDER_KEEP_ALIVE_TIMEOUT_MS, 10) || 20000;
const DEFAULT_RETRY_ATTEMPTS = Math.max(parseInt(process.env.RENDER_KEEP_ALIVE_RETRY_COUNT, 10) || 3, 1);
const DEFAULT_RETRY_DELAY_MS = parseInt(process.env.RENDER_KEEP_ALIVE_RETRY_DELAY_MS, 10) || 15000;
const DEFAULT_ENDPOINTS = ['/health', '/health/live', '/health/ready', '/api/health', '/'];
const USER_AGENT = 'Kelmah-API-Gateway-Render-KeepAlive/1.0';

let intervalId = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const splitCsv = (value) =>
  String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const getEndpointsForService = (serviceName) => {
  const serviceKey = `${serviceName?.toUpperCase?.() || ''}_KEEP_ALIVE_ENDPOINTS`;
  const serviceEndpoints = splitCsv(process.env[serviceKey]);
  if (serviceEndpoints.length > 0) {
    return serviceEndpoints;
  }

  const globalEndpoints = splitCsv(process.env.RENDER_KEEP_ALIVE_ENDPOINTS);
  if (globalEndpoints.length > 0) {
    return globalEndpoints;
  }

  return DEFAULT_ENDPOINTS;
};

const joinUrl = (baseUrl, endpoint) => {
  const normalizedBase = String(baseUrl).replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
};

const boolFromEnv = (value) => {
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const shouldRunKeepAlive = () => {
  if (boolFromEnv(process.env.DISABLE_RENDER_KEEP_ALIVE)) {
    return false;
  }

  const environment = detectEnvironment();
  if (environment === 'production') {
    return true;
  }

  return boolFromEnv(process.env.FORCE_RENDER_KEEP_ALIVE);
};

const tryPing = async (baseUrl, endpoint, headers) => {
  const url = joinUrl(baseUrl, endpoint);

  try {
    const response = await axios.get(url, {
      timeout: DEFAULT_TIMEOUT_MS,
      headers,
      validateStatus: (status) => status >= 200 && status < 500
    });

    return {
      ok: response.status < 500,
      status: response.status,
      url
    };
  } catch (error) {
    const status = error?.response?.status;
    return {
      ok: false,
      status,
      error: error?.code || error?.message || 'Unknown error',
      url
    };
  }
};

const probeServiceOnce = async (serviceName, baseUrl, headers, endpoints, logger) => {
  let lastFailure = null;

  for (const endpoint of endpoints) {
    const result = await tryPing(baseUrl, endpoint, headers);
    if (result.ok) {
      return {
        ok: true,
        endpoint,
        status: result.status
      };
    }

    lastFailure = { ...result, endpoint };
    logger?.debug?.(`Keep-alive miss for ${serviceName} (${endpoint})`, {
      url: result.url,
      status: result.status,
      error: result.error
    });
  }

  return { ok: false, failure: lastFailure };
};

const pingService = async (serviceName, baseUrl, logger) => {
  if (typeof baseUrl !== 'string' || !/^https?:\/\//i.test(baseUrl)) {
    return false;
  }

  const headers = {
    'User-Agent': USER_AGENT,
    'ngrok-skip-browser-warning': 'true'
  };

  const endpoints = getEndpointsForService(serviceName);
  let attempt = 0;
  let lastFailure = null;

  while (attempt < DEFAULT_RETRY_ATTEMPTS) {
    attempt += 1;
    const result = await probeServiceOnce(serviceName, baseUrl, headers, endpoints, logger);

    if (result.ok) {
      const logPayload = {
        endpoint: result.endpoint,
        status: result.status,
        attempt
      };
      if (attempt === 1) {
        logger?.debug?.(`Keep-alive OK for ${serviceName}`, logPayload);
      } else {
        logger?.info?.(`Keep-alive recovered for ${serviceName}`, logPayload);
      }
      return true;
    }

    lastFailure = result.failure;

    if (attempt < DEFAULT_RETRY_ATTEMPTS) {
      logger?.warn?.(`Keep-alive attempt ${attempt} failed for ${serviceName}`, {
        baseUrl,
        endpoint: lastFailure?.endpoint,
        status: lastFailure?.status,
        error: lastFailure?.error,
        retryInMs: DEFAULT_RETRY_DELAY_MS
      });
      await sleep(DEFAULT_RETRY_DELAY_MS);
    }
  }

  logger?.error?.(`Keep-alive ping failed for ${serviceName} after ${DEFAULT_RETRY_ATTEMPTS} attempt(s)`, {
    baseUrl,
    endpoint: lastFailure?.endpoint,
    status: lastFailure?.status,
    error: lastFailure?.error
  });
  return false;
};

const createKeepAliveManager = ({ getServices, logger }) => {
  const runTick = async () => {
    if (!shouldRunKeepAlive()) {
      return;
    }

    const services = typeof getServices === 'function' ? getServices() : null;
    if (!services || typeof services !== 'object') {
      return;
    }

    const serviceEntries = Object.entries(services).filter(([, value]) => typeof value === 'string');
    if (serviceEntries.length === 0) {
      return;
    }

    let okCount = 0;

    await Promise.all(
      serviceEntries.map(async ([serviceName, baseUrl]) => {
        const ok = await pingService(serviceName, baseUrl, logger);
        if (ok) {
          okCount += 1;
        }
      })
    );

    const total = serviceEntries.length;
    logger?.debug?.(`Keep-alive tick complete (${okCount}/${total} services responded).`);
  };

  const start = () => {
    if (intervalId) {
      return true;
    }

    if (!shouldRunKeepAlive()) {
      logger?.info?.('Render keep-alive scheduler disabled (environment flag).');
      return false;
    }

    logger?.info?.(`Render keep-alive scheduler enabled (interval ${(DEFAULT_INTERVAL_MS / 60000).toFixed(1)} minutes).`);

    intervalId = setInterval(() => {
      runTick().catch((error) => {
        logger?.warn?.('Keep-alive tick encountered an error', { error: error?.message });
      });
    }, DEFAULT_INTERVAL_MS);

    runTick().catch((error) => {
      logger?.warn?.('Initial keep-alive tick encountered an error', { error: error?.message });
    });

    return true;
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      logger?.info?.('Render keep-alive scheduler stopped.');
    }
  };

  return {
    start,
    stop,
    runOnce: runTick
  };
};

module.exports = {
  createKeepAliveManager,
  shouldRunKeepAlive
};
