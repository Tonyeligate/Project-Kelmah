import { useEffect, useRef } from 'react';

export const useVisibilityPolling = ({
  callback,
  enabled = true,
  intervalMs,
  maxIntervalMs,
  backoffMultiplier = 2,
  pauseWhenHidden = true,
  shouldPause,
  immediate = true,
  resumeImmediately = true,
}) => {
  const callbackRef = useRef(callback);
  const shouldPauseRef = useRef(shouldPause);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);
  const failureCountRef = useRef(0);
  const disposedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
    shouldPauseRef.current = shouldPause;
  }, [callback, shouldPause]);

  useEffect(() => {
    disposedRef.current = false;

    if (!enabled || !intervalMs || intervalMs <= 0) {
      return () => {
        disposedRef.current = true;
      };
    }

    const safeMaxIntervalMs = Math.max(
      maxIntervalMs || intervalMs * 8,
      intervalMs,
    );

    const clearScheduledPoll = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleNextPoll = (delayMs) => {
      clearScheduledPoll();
      if (disposedRef.current) {
        return;
      }
      timerRef.current = setTimeout(() => {
        executePoll('timer');
      }, delayMs);
    };

    const getDelayForFailure = () => {
      if (failureCountRef.current <= 0) {
        return intervalMs;
      }
      return Math.min(
        intervalMs * Math.pow(backoffMultiplier, failureCountRef.current),
        safeMaxIntervalMs,
      );
    };

    const executePoll = async (trigger) => {
      if (disposedRef.current || !enabled) {
        return;
      }

      if (
        pauseWhenHidden &&
        typeof document !== 'undefined' &&
        document.hidden
      ) {
        clearScheduledPoll();
        return;
      }

      if (
        typeof shouldPauseRef.current === 'function' &&
        shouldPauseRef.current()
      ) {
        scheduleNextPoll(intervalMs);
        return;
      }

      if (inFlightRef.current) {
        scheduleNextPoll(intervalMs);
        return;
      }

      inFlightRef.current = true;
      try {
        await callbackRef.current?.({
          trigger,
          failureCount: failureCountRef.current,
        });
        failureCountRef.current = 0;
      } catch {
        failureCountRef.current += 1;
      } finally {
        inFlightRef.current = false;

        if (!disposedRef.current && enabled) {
          scheduleNextPoll(getDelayForFailure());
        }
      }
    };

    const handleVisibilityChange = () => {
      if (!pauseWhenHidden || typeof document === 'undefined') {
        return;
      }

      if (document.hidden) {
        clearScheduledPoll();
        return;
      }

      if (resumeImmediately) {
        executePoll('visible');
        return;
      }

      scheduleNextPoll(intervalMs);
    };

    if (pauseWhenHidden && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (immediate) {
      executePoll('mount');
    } else {
      scheduleNextPoll(intervalMs);
    }

    return () => {
      disposedRef.current = true;
      clearScheduledPoll();
      if (pauseWhenHidden && typeof document !== 'undefined') {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
      }
    };
  }, [
    backoffMultiplier,
    enabled,
    immediate,
    intervalMs,
    maxIntervalMs,
    pauseWhenHidden,
    resumeImmediately,
  ]);
};
