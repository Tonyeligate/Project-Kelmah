/**
 * Dynamic module importer
 * This file handles dynamic imports for modules that need to be loaded conditionally
 */

import mockWorkersApi from './services/mockWorkersApi';
import workersApi from './services/workersApi';

// Store for lazily resolved modules
let moduleCache = {};

/**
 * Dynamically loads and caches the workers API based on mock mode
 * @param {boolean} useMock - Whether to use mock mode
 * @returns {Promise<Object>} - The workers API module
 */
export const loadWorkersApi = async (useMock = true) => {
  const cacheKey = useMock ? 'mock-workers' : 'real-workers';

  // Return from cache if already loaded
  if (moduleCache[cacheKey]) {
    return moduleCache[cacheKey];
  }

  try {
    const module = useMock ? mockWorkersApi : workersApi;

    // Cache the module
    moduleCache[cacheKey] = module;
    return module;
  } catch (error) {
    console.error(`Failed to load workers API (mock: ${useMock}):`, error);
    throw error;
  }
};

/**
 * Initialize and get the workers API
 * @param {boolean} useMock - Whether to use mock mode
 * @returns {Promise<Object>} - The initialized workers API
 */
export const initializeWorkersApi = async (useMock = true) => {
  const api = await loadWorkersApi(useMock);
  return api;
};
