import io from 'socket.io-client';
import store from '../store';
import {
  addNotification,
} from '../modules/notifications/services/notificationSlice';
import { WS_CONFIG } from '../config/environment';
import { API_ENDPOINTS } from '../config/services';
import { getWebSocketUrl } from './socketUrl';

/**
 * WebSocket service for real-time communication
 * Handles Socket.io connection, messaging, notifications, and live updates
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this._connecting = false; // Prevent multiple concurrent connections
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.pingInterval = null;
    this.messageQueue = [];
    this.subscriptions = new Set();
    this.eventListeners = new Map();
  }

  /**
   * Initialize WebSocket connection
   * @param {string} userId - User ID for authentication
   * @param {string} userRole - User role (worker, hirer, admin)
   * @param {string} token - Authentication token
   */
  async connect(userId, userRole, token) {
    try {
      // Prevent multiple concurrent connections
      if (this._connecting) return;
      this._connecting = true;

      // Disconnect existing connection
      if (this.socket) {
        this.disconnect();
      }

      // Get backend WebSocket URL from shared utility
      const wsUrl = await getWebSocketUrl();
      console.log('🔌 WebSocket Service connecting to backend:', wsUrl);

      // Create Socket.io connection to backend server
      this.socket = io(wsUrl, {
        auth: {
          token,
          userId,
          userRole,
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 3, // Reduced to prevent spam
        reconnectionDelay: 2000, // Increased delay
        reconnectionDelayMax: 5000,
      });

      this.setupEventListeners(userId, userRole);

      console.log('WebSocket connection initiated for user:', userId);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError(error);
      this._connecting = false;
    }
  }

  /**
   * Setup core event listeners
   */
  setupEventListeners(userId, userRole) {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this._connecting = false;

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

      // Dispatch connection success
      store.dispatch(
        addNotification({
          id: Date.now(),
          type: 'system',
          title: 'Connected',
          message: 'Real-time features activated',
          severity: 'success',
          autoHide: true,
        }),
      );
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this._connecting = false;
      this.stopPingMonitoring();

      store.dispatch(
        addNotification({
          id: Date.now(),
          type: 'system',
          title: 'Disconnected',
          message: 'Reconnecting to real-time services...',
          severity: 'warning',
          autoHide: true,
        }),
      );
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this._connecting = false;
      this.handleConnectionError(error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
      store.dispatch(
        addNotification({
          id: Date.now(),
          type: 'system',
          title: 'Reconnected',
          message: 'Real-time features restored',
          severity: 'success',
          autoHide: true,
        }),
      );
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed');
      store.dispatch(
        addNotification({
          id: Date.now(),
          type: 'system',
          title: 'Connection Failed',
          message: 'Unable to connect to real-time services',
          severity: 'error',
          autoHide: false,
        }),
      );
    });

    // Real-time message events
    this.socket.on('new-message', (data) => {
      this.handleNewMessage(data);
    });

    this.socket.on('message-status', (data) => {
      this.handleMessageStatus(data);
    });

    this.socket.on('typing-indicator', (data) => {
      this.handleTypingIndicator(data);
    });

    // Job notification events
    this.socket.on('job-notification', (data) => {
      this.handleJobNotification(data);
    });

    this.socket.on('job-application', (data) => {
      this.handleJobApplication(data);
    });

    this.socket.on('job-status-update', (data) => {
      this.handleJobStatusUpdate(data);
    });

    // Bid notification events (real-time)
    this.socket.on('bid:received', (data) => {
      this.triggerEvent('bid:received', data);
    });

    this.socket.on('bid:accepted', (data) => {
      this.triggerEvent('bid:accepted', data);
    });

    this.socket.on('bid:rejected', (data) => {
      this.triggerEvent('bid:rejected', data);
    });

    this.socket.on('bid:withdrawn', (data) => {
      this.triggerEvent('bid:withdrawn', data);
    });

    this.socket.on('bid:expired', (data) => {
      this.triggerEvent('bid:expired', data);
    });

    // Payment notification events
    this.socket.on('payment-notification', (data) => {
      this.handlePaymentNotification(data);
    });

    this.socket.on('payment-status-update', (data) => {
      this.handlePaymentStatusUpdate(data);
    });

    // User presence events (handled by MessageContext socket — no-op here)
    this.socket.on('user-online', (data) => {
      this.triggerEvent('user:online', data);
    });

    this.socket.on('user-offline', (data) => {
      this.triggerEvent('user:offline', data);
    });

    this.socket.on('online-users', (data) => {
      this.triggerEvent('users:online-list', data);
    });

    // System events
    this.socket.on('system-notification', (data) => {
      this.handleSystemNotification(data);
    });

    this.socket.on('maintenance-notice', (data) => {
      store.dispatch(
        addNotification({
          id: Date.now(),
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
    console.log('📨 New message received:', data);

    // Add to Redux store
    store.dispatch(
      addNotification({
        id: data.messageId,
        type: 'message',
        title: `New message from ${data.senderName}`,
        message:
          data.content.substring(0, 100) +
          (data.content.length > 100 ? '...' : ''),
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
    this.triggerEvent('message:new', data);

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
    console.log('📱 Message status update:', data);
    this.triggerEvent('message:status', data);
  }

  /**
   * Handle typing indicator
   */
  handleTypingIndicator(data) {
    this.triggerEvent('typing:indicator', data);
  }

  /**
   * Handle job notifications
   */
  handleJobNotification(data) {
    console.log('💼 Job notification:', data);

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
        id: Date.now(),
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

    this.triggerEvent('job:notification', data);
  }

  /**
   * Handle job application events
   */
  handleJobApplication(data) {
    console.log('📋 Job application event:', data);

    store.dispatch(
      addNotification({
        id: Date.now(),
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

    this.triggerEvent('job:application', data);
  }

  /**
   * Handle job status updates
   */
  handleJobStatusUpdate(data) {
    console.log('🔄 Job status update:', data);

    const statusMap = {
      accepted: { severity: 'success', icon: '✅' },
      rejected: { severity: 'error', icon: '❌' },
      completed: { severity: 'success', icon: '🎉' },
      cancelled: { severity: 'warning', icon: '⚠️' },
    };

    const config = statusMap[data.status] || { severity: 'info', icon: 'ℹ️' };

    store.dispatch(
      addNotification({
        id: Date.now(),
        type: 'job-status',
        title: `Job ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
        message: `${config.icon} ${data.message}`,
        severity: config.severity,
        autoHide: true,
        metadata: {
          jobId: data.jobId,
          status: data.status,
        },
      }),
    );

    this.triggerEvent('job:status', data);
  }

  /**
   * Handle payment notifications
   */
  handlePaymentNotification(data) {
    console.log('💰 Payment notification:', data);

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
        id: Date.now(),
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

    this.triggerEvent('payment:notification', data);
  }

  /**
   * Handle payment status updates
   */
  handlePaymentStatusUpdate(data) {
    console.log('💳 Payment status update:', data);
    this.triggerEvent('payment:status', data);
  }

  /**
   * Handle system notifications
   */
  handleSystemNotification(data) {
    console.log('🔔 System notification:', data);

    store.dispatch(
      addNotification({
        id: Date.now(),
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

    this.triggerEvent('system:notification', data);
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
    console.log('📤 Message queued:', event, data);
  }

  /**
   * Process queued messages
   */
  processMessageQueue() {
    console.log('📨 Processing', this.messageQueue.length, 'queued messages');

    this.messageQueue.forEach(({ event, data }) => {
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
          console.error('Event listener error:', error);
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
        const notification = new Notification(title, {
          body,
          icon: options.icon || '/assets/icons/kelmah-icon.png',
          tag: options.tag || `notification-${Date.now()}`,
          data: options.data || {},
          requireInteraction: false,
          silent: false,
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          if (options.data?.conversationId) {
            window.location.href = `/messages/${options.data.conversationId}`;
          } else if (options.data?.jobId) {
            window.location.href = `/jobs/${options.data.jobId}`;
          }
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('Browser notification error:', error);
      }
    }
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
    console.error(
      `WebSocket connection error (attempt ${this.reconnectAttempts}):`,
      error,
    );

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      store.dispatch(
        addNotification({
          id: Date.now(),
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
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket');
      this.stopPingMonitoring();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.subscriptions.clear();
      this.eventListeners.clear();
      this.messageQueue = [];
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
