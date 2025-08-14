// Deprecated: This file now re-exports the single source of truth from `environment.js`
// to avoid duplication and drift between configuration modules.

export {
  APP_CONFIG,
  FEATURES,
  AUTH_CONFIG,
  UI_CONFIG,
  WS_CONFIG,
  PERFORMANCE_CONFIG,
  LOG_CONFIG,
  API_ENDPOINTS,
  SERVICES,
  API_BASE_URL,
  VALIDATION,
  ENV_INFO,
} from './environment';

// For backward compatibility with older imports
export { default } from './environment';