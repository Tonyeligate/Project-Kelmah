const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const CONTRACT_MISMATCH_STATUSES = new Set([404, 405, 501]);

const parseRetryAfterMs = (error) => {
  const retryAfterHeader = error?.response?.headers?.['retry-after'];
  if (!retryAfterHeader) {
    return null;
  }

  const numericSeconds = Number(retryAfterHeader);
  if (Number.isFinite(numericSeconds) && numericSeconds >= 0) {
    return numericSeconds * 1000;
  }

  const parsedDate = Date.parse(retryAfterHeader);
  if (!Number.isNaN(parsedDate)) {
    return Math.max(0, parsedDate - Date.now());
  }

  return null;
};

const asPayload = (responseOrPayload) => {
  if (!responseOrPayload) {
    return null;
  }

  if (hasOwn(responseOrPayload, 'data')) {
    return responseOrPayload.data;
  }

  return responseOrPayload;
};

export const isEnvelopeFailure = (payload) =>
  Boolean(payload && typeof payload === 'object' && payload.success === false);

export const createApiEnvelopeError = (
  responseOrPayload,
  { defaultMessage = 'Request failed' } = {},
) => {
  const payload = asPayload(responseOrPayload);
  const error = new Error(
    payload?.error?.message || payload?.message || defaultMessage,
  );

  error.code = payload?.error?.code || payload?.code;
  error.details = payload?.error?.details || payload?.details;

  if (responseOrPayload?.status) {
    error.response = responseOrPayload;
    error.status = responseOrPayload.status;
  }

  return error;
};

export const isTimeoutError = (error) =>
  error?.code === 'ECONNABORTED' ||
  error?.name === 'TimeoutError' ||
  /timeout/i.test(error?.message || '');

export const isContractMismatchError = (error) => {
  const status = error?.response?.status || error?.status;
  const code = error?.code || error?.response?.data?.error?.code;
  return CONTRACT_MISMATCH_STATUSES.has(status) || code === 'API_CONTRACT_MISMATCH';
};

export const isRetryableError = (error) => {
  const status = error?.response?.status || error?.status;

  if (error?.isBackendSleeping || isTimeoutError(error)) {
    return true;
  }

  if (!error?.response && error?.request) {
    return true;
  }

  if (status === 429) {
    return true;
  }

  return status >= 500;
};

export const toUserMessage = (error, { fallback = 'Something went wrong. Please try again.' } = {}) => {
  if (error?.friendlyMessage) {
    return error.friendlyMessage;
  }

  if (isTimeoutError(error)) {
    return 'This request is taking longer than usual. Please check your connection and retry.';
  }

  if (error?.isBackendSleeping) {
    return 'The server is waking up. Please retry in a few seconds.';
  }

  if (isContractMismatchError(error)) {
    return 'A temporary service mismatch was detected. Please retry shortly.';
  }

  return error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || fallback;
};

export const normalizeApiError = (error, context = {}) => {
  const status = error?.response?.status || error?.status || null;
  const isTimeout = isTimeoutError(error);
  const isContractMismatch = isContractMismatchError(error);
  const retryable = isRetryableError(error);
  const retryAfterMs = parseRetryAfterMs(error) ?? (retryable ? 3000 : null);

  return {
    message: error?.message || 'Request failed',
    userMessage: toUserMessage(error),
    code: error?.code || error?.response?.data?.error?.code || error?.response?.data?.code || null,
    status,
    retryable,
    isTimeout,
    isContractMismatch,
    retryAfterMs,
    retryHint: retryable
      ? {
        suggestedDelayMs: retryAfterMs,
        strategy: status === 429 ? 'backoff' : 'retry-now',
      }
      : null,
    context,
  };
};

export const unwrapApiData = (
  responseOrPayload,
  { throwOnFailure = true, defaultValue = null } = {},
) => {
  const payload = asPayload(responseOrPayload);

  if (payload == null) {
    return defaultValue;
  }

  if (throwOnFailure && isEnvelopeFailure(payload)) {
    throw createApiEnvelopeError(payload);
  }

  if (payload && typeof payload === 'object' && hasOwn(payload, 'data')) {
    return payload.data;
  }

  return payload;
};

export const unwrapApiList = (
  responseOrPayload,
  {
    keys = [],
    defaultValue = [],
    throwOnFailure = true,
  } = {},
) => {
  const payload = unwrapApiData(responseOrPayload, {
    throwOnFailure,
    defaultValue,
  });

  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return defaultValue;
};
