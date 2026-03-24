import io from 'socket.io-client';
import store from '../store';
import {
  addNotification,
} from '../modules/notifications/services/notificationSlice';
import { WS_CONFIG } from '../config/environment';
import { getWebSocketUrl } from './socketUrl';
import { isTokenValid } from '../modules/auth/utils/tokenUtils';
import {
  APP_SOCKET_EVENTS,
  MESSAGE_DELIVERY_ALIASES,
  MESSAGE_TYPING_ALIASES,
  SOCKET_EVENTS,
} from './socketEvents';
import {
  createDevLogger,
  createFeatureLogger,
} from '../modules/common/utils/devLogger';

/** Only log in development builds — prevents leaking metadata in production */
const devLog = createFeatureLogger({ flagName: 'VITE_DEBUG_WEBSOCKET' });
const devWarn = createDevLogger(import.meta.env.DEV, 'warn');
const devError = createDevLogger(import.meta.env.DEV, 'error');

const RECONNECT_ATTEMPTS = Math.max(
  3,
  Number(WS_CONFIG?.reconnectionAttempts) || 5,
);
const RECONNECT_DELAY = Math.max(
  500,
  Number(WS_CONFIG?.reconnectionDelay) || 1000,
);
const RECONNECT_DELAY_MAX = Math.min(RECONNECT_DELAY * 8, 30000);

/**
 * WebSocket service for real-time communication
 * Handles Socket.io connection, messaging, notifications, and live updates
 */
let _notifIdCounter = 0;
/** Generate a unique notification ID that won't collide within the same millisecond */
const uniqueNotifId = () => `${Date.now()}-${++_notifIdCounter}`;
const navigateWithinApp = (targetPath) => {
  if (typeof window === 'undefined' || !targetPath) {
    return false;
  }

  try {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentPath === targetPath) {
      return true;
    }

    if (window.history && typeof window.history.pushState === 'function') {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this._connecting = false; // Prevent multiple concurrent connections
    this._hasConnectedOnce = false; // Suppress redundant connect toasts
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.pingInterval = null;
    this.messageQueue = [];
    this.subscriptions = new Set();
    this.eventListeners = new Map();
    this.lastAuthContext = null;
    this.manualDisconnect = false;
    this.networkHandlersBound = false;
    this.reconnectCooldownUntil = 0;
    this.onWindowOffline = this.onWindowOffline.bind(this);
    this.onWindowOnline = this.onWindowOnline.bind(this);
  }

  /**
   * Initialize WebSocket connection
   * @param {string} userId - User ID for authentication
   * @param {string} userRole - User role (worker, hirer, admin)
   * @param {string} token - Authentication token
   */
  async connect(userId, userRole, token) {
    try {
      this.manualDisconnect = false;

      if (!token || !isTokenValid(token)) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:tokenExpired'));
        }
        return;
      }

      this.lastAuthContext = {
        userId,
        userRole,
        token,
      };

      this.bindNetworkLifecycleHandlers();

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        this.reconnectCooldownUntil = Date.now() + 2000;
        devWarn('WebSocket connect deferred because browser is offline');
        return;
      }

      // Prevent multiple concurrent connections
      if (this._connecting) return;
      this._connecting = true;

      // Disconnect existing connection
      if (this.socket) {
        this.disconnect();
      }

      // Get backend WebSocket URL from shared utility
      const wsUrl = await getWebSocketUrl();
      devLog('🔌 WebSocket Service connecting to backend:', wsUrl);

      // Create Socket.io connection to backend server
      this.socket = io(wsUrl, {
        auth: {
          token,
          userId,
          userRole,
        },
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        upgrade: true,
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY,
        reconnectionDelayMax: RECONNECT_DELAY_MAX,
        randomizationFactor: 0.5,
      });

      this.setupEventListeners(userId, userRole);

      devLog('WebSocket connection initiated for user:', userId);
    } catch (error) {
      devError('WebSocket connection error:', error);
      this.handleConnectionError(error);
      this._connecting = false;
    }
  }

  /**
   * Setup core event listeners
   */
  setupEventListeners(userId, userRole) {
    // Connection events
    this.socket.on(SOCKET_EVENTS.CORE.CONNECT, () => {
      devLog('✅ WebSocket connected:', this.socket.id);
      const wasConnectedBefore = this._hasConnectedOnce;
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this._connecting = false;
      this._hasConnectedOnce = true;

      // Join user-specific room
      this.socket.emit('join-room', {
        userId,
        userRole,
        timestamp: new Date().toISOString(),
      });

      // Process queued messages
      this.processMessageQueue();

      // Start ping monitoring
      this.startPingMonitoring();

      // Only show toast on first connect — skip on reconnects to avoid spam
      if (!wasConnectedBefore) {
        store.dispatch(
          addNotification({
            id: uniqueNotifId(),
            type: 'system',
            title: 'Connected',
            message: 'Real-time features activated',
            severity: 'success',
            autoHide: true,
          }),
        );
      }
    });

    this.socket.on(SOCKET_EVENTS.CORE.DISCONNECT, (reason) => {
      devLog('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this._connecting = false;
      this.stopPingMonitoring();

      // Only warn if intentional server disconnect, not transient reconnects
      if (reason === 'io server disconnect' || reason === 'transport close') {
        store.dispatch(
          addNotification({
            id: uniqueNotifId(),
            type: 'system',
            title: 'Disconnected',
            message: 'Reconnecting to real-time services...',
            severity: 'warning',
            autoHide: true,
          }),
        );
      }
    });

    this.socket.on(SOCKET_EVENTS.CORE.CONNECT_ERROR, (error) => {
      devError('WebSocket connection error:', error);
      this._connecting = false;
      this.handleConnectionError(error);
    });

    this.socket.on(SOCKET_EVENTS.CORE.RECONNECT, (attemptNumber) => {
      devLog('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
      // Silent reconnect — no toast to avoid spam; devLog is sufficient
    });

    this.socket.on(SOCKET_EVENTS.CORE.RECONNECT_FAILED, () => {
      devError('❌ WebSocket reconnection failed');
      store.dispatch(
        addNotification({
          id: uniqueNotifId(),
          type: 'system',
          title: 'Connection Failed',
          message: 'Unable to connect to real-time services',
          severity: 'error',
          autoHide: false,
        }),
      );
    });

    // Real-time message events
    MESSAGE_DELIVERY_ALIASES.forEach((eventName) => {
      this.socket.on(eventName, (data) => {
        this.handleNewMessage(data);
      });
    });

    this.socket.on(SOCKET_EVENTS.MESSAGE.MESSAGE_STATUS, (data) => {
      this.handleMessageStatus(data);
    });
    this.socket.on(SOCKET_EVENTS.MESSAGE.MESSAGE_DELIVERED, (data) => {
      this.handleMessageStatus({ ...data, status: 'delivered' });
    });
    this.socket.on(SOCKET_EVENTS.MESSAGE.MESSAGE_READ, (data) => {
      this.handleMessageStatus({ ...data, status: 'read' });
    });
    this.socket.on(SOCKET_EVENTS.MESSAGE.MESSAGES_READ, (data) => {
      this.handleMessageStatus({ ...data, status: 'read' });
    });

    MESSAGE_TYPING_ALIASES.forEach((eventName) => {
      this.socket.on(eventName, (data) => {
        this.handleTypingIndicator(data);
      });
    });

    this.socket.on(SOCKET_EVENTS.PRESENCE.USER_ONLINE, (data) => {
      this.triggerEvent(APP_SOCKET_EVENTS.USER_ONLINE, data);
    });

    this.socket.on(SOCKET_EVENTS.PRESENCE.USER_OFFLINE, (data) => {
      this.triggerEvent(APP_SOCKET_EVENTS.USER_OFFLINE, data);
    });

    this.socket.on(SOCKET_EVENTS.PRESENCE.ONLINE_USERS, (data) => {
      this.triggerEvent(APP_SOCKET_EVENTS.USERS_ONLINE_LIST, data);
    });

    // Legacy aliases used by messaging context payloads
    this.socket.on('user_status_changed', (data) => {
      if (data?.status === 'offline') {
        this.triggerEvent(APP_SOCKET_EVENTS.USER_OFFLINE, data);
        return;
      }
      this.triggerEvent(APP_SOCKET_EVENTS.USER_ONLINE, data);
    });

    this.socket.on(SOCKET_EVENTS.CORE.CONNECTED, (data) => {
      this.triggerEvent(APP_SOCKET_EVENTS.GENERIC_NOTIFICATION, {
        type: SOCKET_EVENTS.CORE.CONNECTED,
        data,
      });
    });

    // Job notification events
    this.socket.on(SOCKET_EVENTS.JOB.JOB_NOTIFICATION, (data) => {
      this.handleJobNotification(data);
    });

    this.socket.on(SOCKET_EVENTS.JOB.JOB_APPLICATION, (data) => {
      this.handleJobApplication(data);
    });

    this.socket.on(SOCKET_EVENTS.JOB.JOB_STATUS_UPDATE, (data) => {
      this.handleJobStatusUpdate(data);
    });

    // Bid notification events (real-time)
    this.socket.on(SOCKET_EVENTS.BID.RECEIVED, (data) => {
      this.triggerEvent(APP_SOCKET_EVENTS.BID_RECEIVED, data);
    });

    this.socket.on(SOCKET_EVENTS.BID.ACCEPTED, (data) => {
      this.triggerEvent(APP_SOCKET_EVENTS.BID_ACCEPTED, data);
    });

    this.socket.on(SOCKET_EVENTS.BID.REJECTED, (data) => {
      this.triggerEvent(APP_SOCKET_EVENTS.BID_REJECTED, data);
    });

    this.socket.on(SOCKET_EVENTS.BID.WITHDRAWN, (data) => {
      this.triggerEvent(APP_SOCKET_EVENTS.BID_WITHDRAWN, data);
    });

    this.socket.on(SOCKET_EVENTS.BID.EXPIRED, (data) => {
      this.triggerEvent(APP_SOCKET_EVENTS.BID_EXPIRED, data);
    });

    // Payment notification events
    this.socket.on(SOCKET_EVENTS.PAYMENT.PAYMENT_NOTIFICATION, (data) => {
      this.handlePaymentNotification(data);
    });

    this.socket.on(SOCKET_EVENTS.PAYMENT.PAYMENT_STATUS_UPDATE, (data) => {
      this.handlePaymentStatusUpdate(data);
    });

    // System events
    this.socket.on(SOCKET_EVENTS.SYSTEM.NOTIFICATION, (data) => {
      this.handleSystemNotification(data);
      this.triggerEvent(APP_SOCKET_EVENTS.GENERIC_NOTIFICATION, data);
    });

    this.socket.on(SOCKET_EVENTS.SYSTEM.SYSTEM_NOTIFICATION, (data) => {
      this.handleSystemNotification(data);
    });

    this.socket.on(SOCKET_EVENTS.SYSTEM.MAINTENANCE_NOTICE, (data) => {
      store.dispatch(
        addNotification({
          id: uniqueNotifId(),
          type: 'system',
          title: 'Maintenance Notice',
          message: data.message,
          severity: 'info',
          autoHide: false,
          actions: data.actions,
        }),
      );
    });
  }

  /**
   * Handle new message
   */
  handleNewMessage(data) {
    devLog('📨 New message received:', data);

    // Add to Redux store
    store.dispatch(
      addNotification({
        id: data.messageId,
        type: 'message',
        title: `New message from ${data.senderName}`,
        message:
          (data.content || '').substring(0, 100) +
          ((data.content || '').length > 100 ? '...' : ''),
        severity: 'info',
        autoHide: true,
        metadata: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          timestamp: data.timestamp,
        },
      }),
    );

    // Trigger custom event listeners
    this.triggerEvent(APP_SOCKET_EVENTS.MESSAGE_NEW, data);

    // Browser notification if permission granted
    this.showBrowserNotification('New Message', data.content, {
      icon: '/assets/icons/message-icon.png',
      tag: `message-${data.messageId}`,
      data: { conversationId: data.conversationId },
    });
  }

  /**
   * Handle message status update
   */
  handleMessageStatus(data) {
    devLog('📱 Message status update:', data);
    this.triggerEvent(APP_SOCKET_EVENTS.MESSAGE_STATUS, data);
  }

  /**
   * Handle typing indicator
   */
  handleTypingIndicator(data) {
    this.triggerEvent(APP_SOCKET_EVENTS.TYPING_INDICATOR, data);
  }

  /**
   * Handle job notifications
   */
  handleJobNotification(data) {
    devLog('💼 Job notification:', data);

    const notificationMap = {
      'new-job': {
        title: 'New Job Available',
        severity: 'info',
        icon: '/assets/icons/job-icon.png',
      },
      'job-match': {
        title: 'Perfect Job Match!',
        severity: 'success',
        icon: '/assets/icons/match-icon.png',
      },
      'job-deadline': {
        title: 'Job Deadline Reminder',
        severity: 'warning',
        icon: '/assets/icons/deadline-icon.png',
      },
    };

    const config = notificationMap[data.type] || {
      title: 'Job Update',
      severity: 'info',
      icon: '/assets/icons/job-icon.png',
    };

    store.dispatch(
      addNotification({
        id: uniqueNotifId(),
        type: 'job',
        title: config.title,
        message: data.message,
        severity: config.severity,
        autoHide: true,
        metadata: {
          jobId: data.jobId,
          jobTitle: data.jobTitle,
          clientName: data.clientName,
        },
      }),
    );

    this.showBrowserNotification(config.title, data.message, {
      icon: config.icon,
      tag: `job-${data.jobId}`,
      data: { jobId: data.jobId },
    });

    this.triggerEvent(APP_SOCKET_EVENTS.JOB_NOTIFICATION, data);
  }

  /**
   * Handle job application events
   */
  handleJobApplication(data) {
    devLog('📋 Job application event:', data);

    store.dispatch(
      addNotification({
        id: uniqueNotifId(),
        type: 'job-application',
        title:
          data.type === 'new-application'
            ? 'New Job Application'
            : 'Application Update',
        message: data.message,
        severity: 'info',
        autoHide: true,
        metadata: {
          applicationId: data.applicationId,
          jobId: data.jobId,
          applicantName: data.applicantName,
        },
      }),
    );

    this.triggerEvent(APP_SOCKET_EVENTS.JOB_APPLICATION, data);
  }

  /**
   * Handle job status updates
   */
  handleJobStatusUpdate(data) {
    devLog('🔄 Job status update:', data);

    const statusMap = {
      accepted: { severity: 'success', icon: '✅' },
      rejected: { severity: 'error', icon: '❌' },
      completed: { severity: 'success', icon: '🎉' },
      cancelled: { severity: 'warning', icon: '⚠️' },
    };

    const config = statusMap[data.status] || { severity: 'info', icon: 'ℹ️' };

    const statusLabel = data.status
      ? data.status.charAt(0).toUpperCase() + data.status.slice(1)
      : 'Updated';

    store.dispatch(
      addNotification({
        id: uniqueNotifId(),
        type: 'job-status',
        title: `Job ${statusLabel}`,
        message: `${config.icon} ${data.message || 'Status changed'}`,
        severity: config.severity,
        autoHide: true,
        metadata: {
          jobId: data.jobId,
          status: data.status,
        },
      }),
    );

    this.triggerEvent(APP_SOCKET_EVENTS.JOB_STATUS, data);
  }

  /**
   * Handle payment notifications
   */
  handlePaymentNotification(data) {
    devLog('💰 Payment notification:', data);

    const paymentMap = {
      'payment-received': {
        title: 'Payment Received',
        severity: 'success',
        icon: '💚',
      },
      'payment-sent': {
        title: 'Payment Sent',
        severity: 'info',
        icon: '💙',
      },
      'payment-failed': {
        title: 'Payment Failed',
        severity: 'error',
        icon: '❌',
      },
    };

    const config = paymentMap[data.type] || {
      title: 'Payment Update',
      severity: 'info',
      icon: '💰',
    };

    store.dispatch(
      addNotification({
        id: uniqueNotifId(),
        type: 'payment',
        title: config.title,
        message: `${config.icon} ${data.message}`,
        severity: config.severity,
        autoHide: data.type !== 'payment-failed',
        metadata: {
          transactionId: data.transactionId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        },
      }),
    );

    this.showBrowserNotification(config.title, data.message, {
      icon: '/assets/icons/payment-icon.png',
      tag: `payment-${data.transactionId}`,
      data: { transactionId: data.transactionId },
    });

    this.triggerEvent(APP_SOCKET_EVENTS.PAYMENT_NOTIFICATION, data);
  }

  /**
   * Handle payment status updates
   */
  handlePaymentStatusUpdate(data) {
    devLog('💳 Payment status update:', data);
    this.triggerEvent(APP_SOCKET_EVENTS.PAYMENT_STATUS, data);
  }

  /**
   * Handle system notifications
   */
  handleSystemNotification(data) {
    devLog('🔔 System notification:', data);

    store.dispatch(
      addNotification({
        id: uniqueNotifId(),
        type: 'system',
        title: data.title,
        message: data.message,
        severity: data.severity || 'info',
        autoHide: data.autoHide !== false,
        metadata: data.metadata,
      }),
    );

    if (data.browserNotification) {
      this.showBrowserNotification(data.title, data.message);
    }

    this.triggerEvent(APP_SOCKET_EVENTS.SYSTEM_NOTIFICATION, data);
  }

  /**
   * Send message
   */
  sendMessage(conversationId, content, attachments = []) {
    if (!this.isConnected) {
      this.queueMessage('send-message', {
        conversationId,
        content,
        attachments,
      });
      return;
    }

    this.socket.emit('send-message', {
      conversationId,
      content,
      attachments,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId, isTyping) {
    if (!this.isConnected) return;

    this.socket.emit('typing-indicator', {
      conversationId,
      isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId, conversationId) {
    if (!this.isConnected) {
      this.queueMessage('mark-read', { messageId, conversationId });
      return;
    }

    this.socket.emit('mark-message-read', {
      messageId,
      conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to job updates
   */
  subscribeToJobUpdates(jobId) {
    if (!this.isConnected) return;

    this.socket.emit('subscribe-job', { jobId });
    this.subscriptions.add(`job:${jobId}`);
  }

  /**
   * Unsubscribe from job updates
   */
  unsubscribeFromJobUpdates(jobId) {
    if (!this.isConnected) return;

    this.socket.emit('unsubscribe-job', { jobId });
    this.subscriptions.delete(`job:${jobId}`);
  }

  /**
   * Subscribe to payment updates
   */
  subscribeToPaymentUpdates(transactionId) {
    if (!this.isConnected) return;

    this.socket.emit('subscribe-payment', { transactionId });
    this.subscriptions.add(`payment:${transactionId}`);
  }

  /**
   * Queue message for later sending
   */
  queueMessage(event, data) {
    this.messageQueue.push({ event, data, timestamp: Date.now() });
    devLog('📤 Message queued:', event, data);
  }

  /**
   * Process queued messages (drops messages older than 30 seconds)
   */
  processMessageQueue() {
    const now = Date.now();
    const STALE_MS = 30_000;
    const fresh = this.messageQueue.filter((m) => now - m.timestamp < STALE_MS);
    const stale = this.messageQueue.length - fresh.length;
    if (stale > 0) {
      devLog(`🗑️ Dropped ${stale} stale queued messages`);
    }
    devLog('📨 Processing', fresh.length, 'queued messages');

    fresh.forEach(({ event, data }) => {
      this.socket.emit(event, data);
    });

    this.messageQueue = [];
  }

  /**
   * Start ping monitoring
   */
  startPingMonitoring() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping monitoring
   */
  stopPingMonitoring() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  /**
   * Trigger custom event
   */
  triggerEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          devError('Event listener error:', error);
        }
      });
    }
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notifOptions = {
          body,
          icon: options.icon || '/assets/icons/kelmah-icon.png',
          tag: options.tag || `notification-${Date.now()}`,
          data: options.data || {},
          requireInteraction: false,
          silent: false,
          ...options,
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, notifOptions);
          }).catch(() => {
            this._fallbackNotification(title, notifOptions);
          });
        } else {
          this._fallbackNotification(title, notifOptions);
        }
      } catch (error) {
        devError('Browser notification error:', error);
      }
    }
  }

  _fallbackNotification(title, options) {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      if (options.data?.conversationId) {
        const conversationPath = `/messages?conversation=${encodeURIComponent(
          String(options.data.conversationId),
        )}`;
        navigateWithinApp(conversationPath);
      } else if (options.data?.jobId) {
        const jobPath = `/jobs/${options.data.jobId}`;
        navigateWithinApp(jobPath);
      }
      notification.close();
    };
    setTimeout(() => notification.close(), 5000);
  }

  /**
   * Request notification permission
   */
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return Notification.requestPermission();
    }
    return Promise.resolve(Notification.permission);
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(error) {
    this.reconnectAttempts++;
    const baseDelay = Math.min(RECONNECT_DELAY * 2 ** this.reconnectAttempts, RECONNECT_DELAY_MAX);
    this.reconnectCooldownUntil = Date.now() + baseDelay;
    devError(
      `WebSocket connection error (attempt ${this.reconnectAttempts}):`,
      error,
    );

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      store.dispatch(
        addNotification({
          id: uniqueNotifId(),
          type: 'system',
          title: 'Connection Failed',
          message:
            'Unable to establish real-time connection. Some features may be limited.',
          severity: 'error',
          autoHide: false,
        }),
      );
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions),
      queuedMessages: this.messageQueue.length,
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.manualDisconnect = true;
    this.unbindNetworkLifecycleHandlers();
    if (this.socket) {
      devLog('🔌 Disconnecting WebSocket');
      this.stopPingMonitoring();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.subscriptions.clear();
      this.eventListeners.clear();
      this.messageQueue = [];
    }
  }

  bindNetworkLifecycleHandlers() {
    if (this.networkHandlersBound || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('offline', this.onWindowOffline);
    window.addEventListener('online', this.onWindowOnline);
    this.networkHandlersBound = true;
  }

  unbindNetworkLifecycleHandlers() {
    if (!this.networkHandlersBound || typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('offline', this.onWindowOffline);
    window.removeEventListener('online', this.onWindowOnline);
    this.networkHandlersBound = false;
  }

  onWindowOffline() {
    this.reconnectCooldownUntil = Date.now() + 2000;
    if (this.socket && this.isConnected) {
      this.socket.disconnect();
    }
    this.isConnected = false;
    this._connecting = false;
  }

  onWindowOnline() {
    if (this.manualDisconnect || this.isConnected || this._connecting) {
      return;
    }

    if (Date.now() < this.reconnectCooldownUntil) {
      return;
    }

    const auth = this.lastAuthContext;
    if (!auth?.userId || !auth?.token) {
      return;
    }

    this.connect(auth.userId, auth.userRole, auth.token);
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
