import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useWebSocket from './useWebSocket';
import { useSnackbar } from 'notistack';

const useAuditNotifications = () => {
  const { ws, isConnected, sendMessage } = useWebSocket();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const handleNotification = useCallback(
    (notification) => {
      const { type, data } = notification;

      let message = '';
      let variant = 'info';

      switch (type) {
        case 'audit_alert':
          const { severity, message: alertMessage } = data.alert;
          message = alertMessage;
          variant =
            severity === 'high'
              ? 'error'
              : severity === 'medium'
                ? 'warning'
                : 'info';
          break;

        case 'compliance_report':
          const { title } = data.report;
          message = `New compliance report: ${title}`;
          variant = 'info';
          break;

        case 'anomaly_alert':
          const anomalyCount = data.anomalies.length;
          message = `Detected ${anomalyCount} new anomalies`;
          variant = 'warning';
          break;

        default:
          return;
      }

      enqueueSnackbar(message, {
        variant,
        autoHideDuration: 6000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    },
    [enqueueSnackbar],
  );

  useEffect(() => {
    if (!ws || !isConnected) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'audit_notification') {
          handleNotification(data.data);
        } else if (data.type === 'audit_subscription_success') {
          setIsSubscribed(true);
          enqueueSnackbar('Successfully subscribed to audit notifications', {
            variant: 'success',
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, isConnected, handleNotification, enqueueSnackbar]);

  const subscribe = useCallback(() => {
    if (!isConnected) return;
    sendMessage('subscribe_audit_notifications');
  }, [isConnected, sendMessage]);

  const unsubscribe = useCallback(() => {
    if (!isConnected) return;
    sendMessage('unsubscribe_audit_notifications');
    setIsSubscribed(false);
  }, [isConnected, sendMessage]);

  // Auto-subscribe if user has appropriate roles
  useEffect(() => {
    if (
      isConnected &&
      user &&
      // Support both user.role (string) and user.roles (array)
      ((typeof user.role === 'string' &&
        ['admin', 'auditor', 'security_auditor', 'compliance_officer'].includes(user.role)) ||
       (Array.isArray(user.roles) &&
        user.roles.some((role) =>
          ['admin', 'auditor', 'security_auditor', 'compliance_officer'].includes(role)
        )))
    ) {
      subscribe();
    }
  }, [isConnected, user, subscribe]);

  return {
    isConnected,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
};

export default useAuditNotifications;
