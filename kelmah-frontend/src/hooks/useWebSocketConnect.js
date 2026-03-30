/**
 * useWebSocketConnect — Auto-connect/disconnect the websocketService singleton
 *
 * Place this hook once in <App /> so that the shared websocketService is
 * connected whenever the user is authenticated and disconnected on logout.
 * All feature hooks (useBidNotifications, etc.) that register listeners on
 * the singleton will automatically start receiving events once connected.
 */
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import websocketService from '../services/websocketService';
import { secureStorage } from '../utils/secureStorage';

const useWebSocketConnect = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const connectedRef = useRef(false);
  const sessionKeyRef = useRef(null);

  useEffect(() => {
    const userId = user?.id;
    const userRole = user?.role || 'worker';
    const nextSessionKey = userId ? `${userId}:${userRole}` : null;

    if (isAuthenticated && userId) {
      const token = secureStorage.getAuthToken();
      if (token) {
        const shouldReconnect =
          sessionKeyRef.current && sessionKeyRef.current !== nextSessionKey;

        if (shouldReconnect) {
          websocketService.disconnect();
          connectedRef.current = false;
        }

        if (!connectedRef.current || shouldReconnect) {
          connectedRef.current = true;
          sessionKeyRef.current = nextSessionKey;
          websocketService.connect(userId, userRole, token);
        }
      }
    }

    if (!isAuthenticated && connectedRef.current) {
      connectedRef.current = false;
      sessionKeyRef.current = null;
      websocketService.disconnect();
    }
  }, [isAuthenticated, user?.id, user?.role]);

  useEffect(() => {
    return () => {
      if (connectedRef.current) {
        connectedRef.current = false;
        sessionKeyRef.current = null;
        websocketService.disconnect();
      }
    };
  }, []);
};

export default useWebSocketConnect;
