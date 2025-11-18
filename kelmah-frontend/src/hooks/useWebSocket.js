import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../modules/auth/services/authService';
import { io } from 'socket.io-client';

// Socket.IO based WebSocket compatibility hook
export const useWebSocket = () => {
  const [ioSocket, setIoSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const onMessageHandler = useRef(null);

  const connect = useCallback(async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setError(new Error('No authentication token found'));
        return;
      }

      // Get backend WebSocket URL from runtime config
      let wsUrl = 'https://kelmah-api-gateway-kubd.onrender.com'; // Production fallback
      try {
        const response = await fetch('/runtime-config.json');
        if (response.ok) {
          const config = await response.json();
          wsUrl =
            config.websocketUrl || config.ngrokUrl || config.API_URL || wsUrl;
          console.log('📡 WebSocket connecting to backend:', wsUrl);
        }
      } catch (configError) {
        console.warn(
          '⚠️ Failed to load runtime config, using fallback:',
          wsUrl,
        );
      }

      // Connect to backend server - Socket.IO handles /socket.io path automatically
      const socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socket.on('connect', () => {
        setIoSocket(socket);
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      // Generic adapter: map common events to a single onmessage(JSON)
      const emitMessage = (payload) => {
        if (onMessageHandler.current) {
          try {
            onMessageHandler.current({ data: JSON.stringify(payload) });
          } catch (e) {
            console.error('onmessage handler error:', e);
          }
        }
      };

      // Audit-related events compatibility
      socket.on('audit_notification', (data) =>
        emitMessage({ type: 'audit_notification', data }),
      );
      socket.on('audit_subscription_success', (data) =>
        emitMessage({ type: 'audit_subscription_success', data }),
      );

      // Generic message passthrough if server emits 'message'
      socket.on('message', (data) => emitMessage({ type: 'message', data }));

      // Notifications passthrough
      socket.on('notification', (data) =>
        emitMessage({ type: 'notification', data }),
      );

      return socket;
    } catch (e) {
      console.error('Socket.IO connection failed:', e);
      setError(e);
    }
  }, []);

  useEffect(() => {
    let active;
    connect().then((s) => (active = s));
    return () => {
      if (active) active.disconnect();
    };
  }, [connect]);

  // API compatible wrapper expected by existing consumers
  const ws = useRef({
    set onmessage(handler) {
      onMessageHandler.current = handler;
    },
    get onmessage() {
      return onMessageHandler.current;
    },
    close: () => {
      if (ioSocket) ioSocket.disconnect();
    },
  }).current;

  const sendMessage = useCallback(
    (message) => {
      if (!ioSocket) return console.warn('Socket not connected');
      // Support string shorthand used by useAuditNotifications
      if (typeof message === 'string') {
        if (message === 'subscribe_audit_notifications')
          ioSocket.emit('audit:subscribe');
        else if (message === 'unsubscribe_audit_notifications')
          ioSocket.emit('audit:unsubscribe');
        else ioSocket.emit('client:event', { message });
        return;
      }
      // Object messages emitted on a generic channel
      ioSocket.emit('client:message', message);
    },
    [ioSocket],
  );

  return {
    ws,
    isConnected,
    error,
    sendMessage,
    connect,
  };
};

export default useWebSocket;
