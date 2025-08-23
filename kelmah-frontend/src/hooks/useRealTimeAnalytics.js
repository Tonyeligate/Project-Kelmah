import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';

const WS_URL = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.ngrokUrl?.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')) || 
              (typeof window !== 'undefined' && window.location.origin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')) || 
              'ws://localhost:3005';

export function useRealTimeAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setConnected(true);
        setError(null);

        // Start heartbeat
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        ws.onclose = () => {
          setConnected(false);
          clearInterval(heartbeat);
          // Attempt to reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'initial':
            case 'metrics':
              setMetrics(data.data);
              break;
            case 'error':
              enqueueSnackbar(data.message, { variant: 'error' });
              break;
            case 'pong':
              // Heartbeat response
              break;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        setError('WebSocket connection error');
        enqueueSnackbar('Connection error. Retrying...', { variant: 'error' });
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      setError('Failed to establish WebSocket connection');
      enqueueSnackbar('Connection failed. Retrying...', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return {
    metrics,
    connected,
    error,
  };
}
