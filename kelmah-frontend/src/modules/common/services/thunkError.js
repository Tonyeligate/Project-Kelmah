import { normalizeApiError } from '../../../services/responseNormalizer';

export const toThunkErrorPayload = (
  error,
  fallbackMessage = 'Request failed',
) => {
  const normalized = normalizeApiError(error || new Error(fallbackMessage));
  return {
    message: normalized.userMessage || normalized.message || fallbackMessage,
    technicalMessage: normalized.message || fallbackMessage,
    code: normalized.code || null,
    status: normalized.status || null,
    retryable: Boolean(normalized.retryable),
    retryAfterMs: normalized.retryAfterMs ?? null,
  };
};

export const getThunkErrorMessage = (
  errorPayload,
  fallbackMessage = 'Request failed',
) => {
  if (!errorPayload) {
    return fallbackMessage;
  }

  if (typeof errorPayload === 'string') {
    return errorPayload;
  }

  return (
    errorPayload.message || errorPayload.technicalMessage || fallbackMessage
  );
};
