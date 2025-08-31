import { useState, useEffect, useCallback } from 'react';
import authService from '../modules/auth/services/authService';

export const useWebSocket = (
  url = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.websocketUrl) || 
        (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.ngrokUrl?.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')) || 
        (typeof window !== 'undefined' && window.location.origin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')) || 
        'ws://localhost:3005'),
) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    const token = authService.getToken();
    if (!token) {
      setError(new Error('No authentication token found'));
      return;
    }

    const ws = new WebSocket(`${url}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setSocket(ws);
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      setSocket(null);
      setIsConnected(false);

      // Attempt to reconnect after a delay
      setTimeout(connect, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError(error);
      setSocket(null);
      setIsConnected(false);
    };

    return ws;
  }, [url]);

  useEffect(() => {
    const ws = connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (message) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket is not open. Unable to send message.');
      }
    },
    [socket],
  );

  return {
    socket,
    isConnected,
    error,
    sendMessage,
    connect,
  };
};

// Add default export to fix import issue in useAuditNotifications.js
export default useWebSocket;
