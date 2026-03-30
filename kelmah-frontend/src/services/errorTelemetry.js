import {
  isContractMismatchError,
  normalizeApiError,
} from './responseNormalizer';
import { devWarn } from '../modules/common/utils/devLogger';

const MAX_BUFFER_SIZE = 50;
const CONTRACT_EVENT_NAME = 'kelmah:contract-mismatch';
const RECOVERABLE_EVENT_NAME = 'kelmah:recoverable-api-error';

const appendToWindowBuffer = (key, entry) => {
  if (typeof window === 'undefined') {
    return;
  }

  const current = Array.isArray(window[key]) ? window[key] : [];
  current.push(entry);

  if (current.length > MAX_BUFFER_SIZE) {
    current.splice(0, current.length - MAX_BUFFER_SIZE);
  }

  window[key] = current;
};

const emitWindowEvent = (name, detail) => {
  if (
    typeof window === 'undefined' ||
    typeof window.dispatchEvent !== 'function'
  ) {
    return;
  }

  window.dispatchEvent(new CustomEvent(name, { detail }));
};

export const captureContractMismatch = (error, context = {}) => {
  if (!isContractMismatchError(error)) {
    return null;
  }

  const payload = {
    ...normalizeApiError(error, context),
    endpoint: error?.config?.url || context?.endpoint || null,
    method: error?.config?.method || context?.method || null,
    timestamp: new Date().toISOString(),
  };

  appendToWindowBuffer('__kelmahContractMismatchEvents', payload);
  emitWindowEvent(CONTRACT_EVENT_NAME, payload);

  devWarn('[ContractMismatch]', payload);

  return payload;
};

export const captureRecoverableApiError = (error, context = {}) => {
  const payload = {
    ...normalizeApiError(error, context),
    endpoint: error?.config?.url || context?.endpoint || null,
    method: error?.config?.method || context?.method || null,
    fallbackUsed: Boolean(context?.fallbackUsed),
    suppressUi: Boolean(context?.suppressUi),
    timestamp: new Date().toISOString(),
  };

  appendToWindowBuffer('__kelmahRecoverableApiEvents', payload);
  emitWindowEvent(RECOVERABLE_EVENT_NAME, payload);

  devWarn('[RecoverableApiError]', payload);

  return payload;
};

export const telemetryEvents = {
  CONTRACT_EVENT_NAME,
  RECOVERABLE_EVENT_NAME,
};
