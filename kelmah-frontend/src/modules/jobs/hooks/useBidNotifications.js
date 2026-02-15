/**
 * useBidNotifications — Real-time bid notification hook
 *
 * Listens for Socket.IO events related to the bidding system and
 * returns notification state for UI display.
 *
 * Socket events handled:
 *   - 'bid:received'    → Hirer notified when a worker places a bid on their job
 *   - 'bid:accepted'    → Worker notified when their bid is accepted
 *   - 'bid:rejected'    → Worker notified when their bid is rejected
 *   - 'bid:withdrawn'   → Hirer notified when a bidder withdraws
 *   - 'bid:expired'     → Worker notified when their bid expires
 *
 * DATA FLOW:
 *   Backend bid controller → socket.emit('bid:*') → messaging service
 *     → websocketService listener → useBidNotifications state update → UI toast
 *
 * NOTE: Backend Socket.IO events for bids not yet wired — this hook is ready
 *       and will work once the backend emits these events.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../../../services/websocketService';

const BID_EVENTS = [
  'bid:received',
  'bid:accepted',
  'bid:rejected',
  'bid:withdrawn',
  'bid:expired',
];

const createNotification = (event, data) => {
  const id = `${event}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date();

  switch (event) {
    case 'bid:received':
      return {
        id,
        type: 'bid',
        severity: 'info',
        title: 'New bid received',
        message: `${data.workerName || 'A worker'} placed a bid of GH₵${(data.bidAmount || 0).toLocaleString()} on "${data.jobTitle || 'your job'}"`,
        link: data.jobId ? `/hirer/jobs/${data.jobId}/bids` : null,
        timestamp,
        read: false,
      };

    case 'bid:accepted':
      return {
        id,
        type: 'bid',
        severity: 'success',
        title: 'Bid accepted!',
        message: `Your bid of GH₵${(data.bidAmount || 0).toLocaleString()} on "${data.jobTitle || 'a job'}" has been accepted`,
        link: data.jobId ? `/jobs/${data.jobId}` : null,
        timestamp,
        read: false,
      };

    case 'bid:rejected':
      return {
        id,
        type: 'bid',
        severity: 'warning',
        title: 'Bid not accepted',
        message: `Your bid on "${data.jobTitle || 'a job'}" was not accepted${data.reason ? `: ${data.reason}` : ''}`,
        link: '/worker/bids',
        timestamp,
        read: false,
      };

    case 'bid:withdrawn':
      return {
        id,
        type: 'bid',
        severity: 'info',
        title: 'Bid withdrawn',
        message: `${data.workerName || 'A bidder'} withdrew their bid on "${data.jobTitle || 'your job'}"`,
        link: data.jobId ? `/hirer/jobs/${data.jobId}/bids` : null,
        timestamp,
        read: false,
      };

    case 'bid:expired':
      return {
        id,
        type: 'bid',
        severity: 'default',
        title: 'Bid expired',
        message: `Your bid on "${data.jobTitle || 'a job'}" has expired`,
        link: '/worker/bids',
        timestamp,
        read: false,
      };

    default:
      return null;
  }
};

/**
 * Hook for real-time bid notifications
 * @param {Object} options
 * @param {number} options.maxNotifications - Max notifications to keep in state (default: 20)
 * @param {boolean} options.enabled - Whether to listen for events (default: true)
 * @returns {{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll, latestNotification }}
 */
const useBidNotifications = ({ maxNotifications = 20, enabled = true } = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [latestNotification, setLatestNotification] = useState(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const handleBidEvent = useCallback((event) => (data) => {
    if (!enabledRef.current) return;
    const notification = createNotification(event, data || {});
    if (!notification) return;

    setLatestNotification(notification);
    setNotifications((prev) => {
      const updated = [notification, ...prev];
      return updated.slice(0, maxNotifications);
    });
  }, [maxNotifications]);

  useEffect(() => {
    if (!enabled) return;

    const handlers = {};
    BID_EVENTS.forEach((event) => {
      handlers[event] = handleBidEvent(event);
      websocketService.addEventListener(event, handlers[event]);
    });

    return () => {
      BID_EVENTS.forEach((event) => {
        if (handlers[event]) {
          websocketService.removeEventListener(event, handlers[event]);
        }
      });
    };
  }, [enabled, handleBidEvent]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setLatestNotification(null);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    latestNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};

export default useBidNotifications;
export { BID_EVENTS };
