const axios = require('axios');

// Simple axios instance with sane defaults and retry/backoff
function createHttpClient(options = {}) {
  const timeout = Number(process.env.HTTP_TIMEOUT_MS || options.timeout || 10000);
  const maxRetries = Number(process.env.HTTP_RETRY_COUNT || options.maxRetries || 2);
  const client = axios.create({
    timeout,
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
    validateStatus: (s) => s >= 200 && s < 500, // let caller decide on 4xx
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const cfg = error.config || {};
      cfg.__retryCount = cfg.__retryCount || 0;
      const shouldRetry = (
        !error.response || // network/timeouts
        (error.response.status >= 500 && error.response.status < 600)
      );
      if (shouldRetry && cfg.__retryCount < maxRetries) {
        cfg.__retryCount += 1;
        const backoffMs = Math.min(2000 * cfg.__retryCount, 4000);
        await new Promise((r) => setTimeout(r, backoffMs));
        return client(cfg);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

const defaultHttpClient = createHttpClient();

module.exports = { createHttpClient, http: defaultHttpClient };


