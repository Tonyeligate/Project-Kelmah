import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';

export function useRealTimeAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const connect = useCallback(async () => {
    try {
      const { io } = await import('socket.io-client');
      const socket = io('/socket.io', {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socket.on('connect', () => {
        setConnected(true);
        setError(null);
        // Join analytics room if needed
        socket.emit('analytics:subscribe');
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

      // Prefer explicit analytics events, fallback to generic
      const handle = (payload) => {
        try {
          if (payload?.data) setMetrics(payload.data);
          else setMetrics(payload);
        } catch (e) {
          console.error('Analytics payload error:', e);
        }
      };
      socket.on('analytics:metrics', handle);
      socket.on('metrics', handle);

      socket.on('error', (err) => {
        setError('Real-time analytics error');
        console.error('Socket analytics error:', err);
        enqueueSnackbar('Analytics connection error. Retrying...', { variant: 'error' });
      });

      return () => {
        socket.emit('analytics:unsubscribe');
        socket.disconnect();
      };
    } catch (e) {
      setError('Failed to establish real-time analytics connection');
      enqueueSnackbar('Connection failed. Retrying...', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    const cleanupPromise = connect();
    return () => {
      if (typeof cleanupPromise === 'function') cleanupPromise();
    };
  }, [connect]);

  return { metrics, connected, error };
}
