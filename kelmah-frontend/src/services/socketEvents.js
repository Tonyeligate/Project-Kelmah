export const SOCKET_EVENTS = {
  CORE: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    RECONNECT: 'reconnect',
    RECONNECT_FAILED: 'reconnect_failed',
    ERROR: 'error',
  },
  MESSAGE: {
    NEW_MESSAGE: 'new_message',
    NEW_MESSAGE_ALT: 'new-message',
    RECEIVE_MESSAGE: 'receive_message',
    MESSAGE_STATUS: 'message-status',
    MESSAGE_DELIVERED: 'message_delivered',
    MESSAGE_READ: 'message_read',
    TYPING_INDICATOR: 'typing-indicator',
  },
  JOB: {
    JOB_NOTIFICATION: 'job-notification',
    JOB_APPLICATION: 'job-application',
    JOB_STATUS_UPDATE: 'job-status-update',
  },
  PAYMENT: {
    PAYMENT_NOTIFICATION: 'payment-notification',
    PAYMENT_STATUS_UPDATE: 'payment-status-update',
  },
  PRESENCE: {
    USER_ONLINE: 'user-online',
    USER_OFFLINE: 'user-offline',
    ONLINE_USERS: 'online-users',
  },
  SYSTEM: {
    NOTIFICATION: 'notification',
    SYSTEM_NOTIFICATION: 'system-notification',
    MAINTENANCE_NOTICE: 'maintenance-notice',
  },
  BID: {
    RECEIVED: 'bid:received',
    ACCEPTED: 'bid:accepted',
    REJECTED: 'bid:rejected',
    WITHDRAWN: 'bid:withdrawn',
    EXPIRED: 'bid:expired',
  },
};

export const APP_SOCKET_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_STATUS: 'message:status',
  TYPING_INDICATOR: 'typing:indicator',
  JOB_NOTIFICATION: 'job:notification',
  JOB_APPLICATION: 'job:application',
  JOB_STATUS: 'job:status',
  PAYMENT_NOTIFICATION: 'payment:notification',
  PAYMENT_STATUS: 'payment:status',
  SYSTEM_NOTIFICATION: 'system:notification',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USERS_ONLINE_LIST: 'users:online-list',
  GENERIC_NOTIFICATION: 'notification',
  BID_RECEIVED: 'bid:received',
  BID_ACCEPTED: 'bid:accepted',
  BID_REJECTED: 'bid:rejected',
  BID_WITHDRAWN: 'bid:withdrawn',
  BID_EXPIRED: 'bid:expired',
};

export const MESSAGE_DELIVERY_ALIASES = [
  SOCKET_EVENTS.MESSAGE.NEW_MESSAGE,
  SOCKET_EVENTS.MESSAGE.NEW_MESSAGE_ALT,
  SOCKET_EVENTS.MESSAGE.RECEIVE_MESSAGE,
];
