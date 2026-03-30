import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../modules/auth/services/authService';
import websocketService from '../services/websocketService';
import { APP_SOCKET_EVENTS } from '../services/socketEvents';
import { createFeatureLogger } from '../modules/common/utils/devLogger';

const websocketHookLogger = {
  warn: createFeatureLogger({ level: 'warn' }),
  error: createFeatureLogger({ level: 'error' }),
};

// Compatibility hook that now reuses websocketService singleton.
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(
    Boolean(websocketService.isConnected),
  );
  const [error, setError] = useState(null);
  const onMessageHandler = useRef(null);

  const emitMessage = useCallback((payload) => {
    if (!onMessageHandler.current) {
      return;
    }

    try {
      onMessageHandler.current({ data: JSON.stringify(payload) });
    } catch (handlerError) {
      websocketHookLogger.error('onmessage handler error:', handlerError);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      const token = authService.getToken();
      const user = authService.getCurrentUser();
      const userId = user?.id || user?._id || user?.userId || user?.sub;
      const userRole = user?.role || 'worker';

      if (!token || !userId) {
        const authError = new Error(
          'Missing authentication context for realtime connection',
        );
        setError(authError);
        return;
      }

      await websocketService.connect(userId, userRole, token);
      setIsConnected(Boolean(websocketService.isConnected));
      setError(null);
    } catch (connectionError) {
      websocketHookLogger.error('Socket connection failed:', connectionError);
      setError(connectionError);
    }
  }, []);

  useEffect(() => {
    connect();

    const listeners = {
      [APP_SOCKET_EVENTS.MESSAGE_NEW]: (data) =>
        emitMessage({ type: 'message', data }),
      [APP_SOCKET_EVENTS.GENERIC_NOTIFICATION]: (data) =>
        emitMessage({ type: 'notification', data }),
      [APP_SOCKET_EVENTS.SYSTEM_NOTIFICATION]: (data) =>
        emitMessage({ type: 'system_notification', data }),
      [APP_SOCKET_EVENTS.TYPING_INDICATOR]: (data) =>
        emitMessage({ type: 'typing_indicator', data }),
    };

    Object.entries(listeners).forEach(([eventName, handler]) => {
      websocketService.addEventListener(eventName, handler);
    });

    const connectionPoll = setInterval(() => {
      setIsConnected(Boolean(websocketService.isConnected));
    }, 1000);

    return () => {
      clearInterval(connectionPoll);
      Object.entries(listeners).forEach(([eventName, handler]) => {
        websocketService.removeEventListener(eventName, handler);
      });
    };
  }, [connect, emitMessage]);

  // API-compatible wrapper expected by legacy consumers.
  const ws = useRef({
    set onmessage(handler) {
      onMessageHandler.current = handler;
    },
    get onmessage() {
      return onMessageHandler.current;
    },
    close: () => {
      websocketService.disconnect();
      setIsConnected(false);
    },
  }).current;

  const sendMessage = useCallback((message) => {
    if (!websocketService.isConnected) {
      websocketHookLogger.warn('Socket not connected');
      return;
    }

    if (typeof message === 'string') {
      if (message === 'subscribe_audit_notifications') {
        websocketService.socket?.emit('audit:subscribe');
      } else if (message === 'unsubscribe_audit_notifications') {
        websocketService.socket?.emit('audit:unsubscribe');
      } else {
        websocketService.socket?.emit('client:event', { message });
      }
      return;
    }

    websocketService.socket?.emit('client:message', message);
  }, []);

  return {
    ws,
    isConnected,
    error,
    sendMessage,
    connect,
  };
};

export default useWebSocket;
