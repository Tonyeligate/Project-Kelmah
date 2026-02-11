import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

/**
 * Checks if an axios error indicates the backend is sleeping (Render free tier).
 * @param {Error} error - The caught error
 * @returns {boolean}
 */
export function isBackendSleeping(error) {
  if (error?.isBackendSleeping) return true;
  const status = error?.response?.status;
  return status === 502 || status === 503 || status === 504;
}

/**
 * Returns a user-friendly message for sleeping backend errors.
 * Falls back to the original error message for non-sleeping errors.
 * @param {Error} error
 * @returns {string}
 */
export function getFriendlyErrorMessage(error) {
  if (isBackendSleeping(error)) {
    return (
      error.friendlyMessage ||
      'The server is waking up — please try again in 15-30 seconds.'
    );
  }
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

/**
 * A banner component to show when the backend is sleeping.
 * Usage: {backendSleeping && <BackendSleepingBanner onRetry={retryFn} />}
 */
export function BackendSleepingBanner({ onRetry }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity="info"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : null
        }
      >
        <AlertTitle>Server is waking up</AlertTitle>
        Our servers spin down when idle to save resources. This usually takes
        15–30 seconds. Please wait a moment and try again.
      </Alert>
    </Box>
  );
}
