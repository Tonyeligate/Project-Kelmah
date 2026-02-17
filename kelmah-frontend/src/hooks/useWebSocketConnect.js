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

  useEffect(() => {
    if (isAuthenticated && user?.id && !connectedRef.current) {
      const token = secureStorage.getAuthToken();
      if (token) {
        connectedRef.current = true;
        websocketService.connect(user.id, user.role || 'worker', token);
      }
    }

    if (!isAuthenticated && connectedRef.current) {
      connectedRef.current = false;
      websocketService.disconnect();
    }

    return () => {
      // Cleanup on unmount (app teardown)
      if (connectedRef.current) {
        connectedRef.current = false;
        websocketService.disconnect();
      }
    };
  }, [isAuthenticated, user?.id, user?.role]);
};

export default useWebSocketConnect;
