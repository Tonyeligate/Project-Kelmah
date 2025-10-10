/**
 * Background Sync Service for Offline Actions
 * Comprehensive offline action management optimized for Ghana's network conditions
 */

class BackgroundSyncService {
  constructor() {
    this.dbName = 'KelmahSyncDB';
    this.dbVersion = 1;
    this.storeName = 'pendingActions';
    this.db = null;
    this.syncQueue = new Map();
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.isSyncing = false;
    this.maxRetries = 5;
    this.retryDelays = [1000, 2000, 5000, 10000, 30000]; // Progressive delays in ms

    // Ghana-specific sync priorities
    this.actionPriorities = {
      // High priority - immediate business needs
      job_application: { priority: 1, critical: true, timeout: 30000 },
      emergency_request: { priority: 1, critical: true, timeout: 15000 },
      payment_action: { priority: 1, critical: true, timeout: 45000 },
      contract_signature: { priority: 1, critical: true, timeout: 30000 },

      // Medium priority - important but can wait
      message_send: { priority: 2, critical: false, timeout: 20000 },
      profile_update: { priority: 2, critical: false, timeout: 25000 },
      review_submit: { priority: 2, critical: false, timeout: 20000 },
      milestone_update: { priority: 2, critical: false, timeout: 25000 },

      // Low priority - can be delayed
      search_save: { priority: 3, critical: false, timeout: 15000 },
      bookmark_action: { priority: 3, critical: false, timeout: 10000 },
      notification_read: { priority: 3, critical: false, timeout: 10000 },
      analytics_track: { priority: 3, critical: false, timeout: 5000 },
    };

    // Sync strategies for different network conditions
    this.syncStrategies = {
      '2g': {
        batchSize: 1, // Sync one at a time
        concurrency: 1, // No parallel requests
        retryDelay: 5000, // Longer delays
        timeout: 60000, // Extended timeout
        priorityOnly: true, // Only high priority items
      },
      '3g': {
        batchSize: 3,
        concurrency: 2,
        retryDelay: 3000,
        timeout: 45000,
        priorityOnly: false,
      },
      '4g': {
        batchSize: 5,
        concurrency: 3,
        retryDelay: 2000,
        timeout: 30000,
        priorityOnly: false,
      },
      wifi: {
        batchSize: 10,
        concurrency: 5,
        retryDelay: 1000,
        timeout: 20000,
        priorityOnly: false,
      },
    };

    this.init();
  }

  /**
   * Initialize the background sync service
   */
  async init() {
    try {
      await this.initIndexedDB();
      await this.loadPendingActions();
      this.setupEventListeners();
      this.registerServiceWorkerSync();

      console.log('🔄 Background sync service initialized');

      // Start periodic sync check for Ghana's intermittent networks
      this.startPeriodicSync();
    } catch (error) {
      console.error('Background sync initialization failed:', error);
    }
  }

  /**
   * Initialize IndexedDB for persistent action queue
   */
  async initIndexedDB() {
    if (typeof indexedDB === 'undefined') {
      console.warn(
        'IndexedDB not available, background sync will use memory only',
      );
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes for efficient querying
          store.createIndex('actionType', 'actionType', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }

  /**
   * Setup event listeners for network and visibility changes
   */
  setupEventListeners() {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }

    // Network status changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - starting background sync...');
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Offline - queuing actions for sync...');
    });

    // Page visibility changes (important for mobile)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isOnline) {
          this.triggerSync();
        }
      });
    }

    // App focus/blur events
    window.addEventListener('focus', () => {
      if (this.isOnline) {
        this.triggerSync();
      }
    });
  }

  /**
   * Register service worker background sync
   */
  async registerServiceWorkerSync() {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return; // Not in browser environment
    }

    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Register sync event for when network becomes available
        await registration.sync.register('background-sync');

        console.log('📡 Service Worker background sync registered');

        // Listen for sync events from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SYNC_COMPLETE') {
            this.handleSyncComplete(event.data.results);
          }
        });
      } catch (error) {
        console.warn('Service Worker sync registration failed:', error);
      }
    }
  }

  /**
   * Queue an action for background sync
   */
  async queueAction(actionType, data, options = {}) {
    try {
      const priority =
        this.actionPriorities[actionType] ||
        this.actionPriorities['analytics_track'];

      const action = {
        actionType,
        data,
        priority: priority.priority,
        critical: priority.critical,
        timeout: options.timeout || priority.timeout,
        timestamp: Date.now(),
        userId: options.userId || this.getCurrentUserId(),
        status: 'pending',
        retryCount: 0,
        maxRetries: options.maxRetries || this.maxRetries,
        metadata: {
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          networkType: this.getNetworkType(),
          location: options.location,
          deviceId: this.getDeviceId(),
        },
      };

      // Store in IndexedDB for persistence
      const id = await this.saveActionToDB(action);
      action.id = id;

      // Add to memory queue
      this.syncQueue.set(id, action);

      console.log(`📝 Queued ${actionType} for background sync (ID: ${id})`);

      // Try immediate sync if online
      if (this.isOnline) {
        setTimeout(() => this.triggerSync(), 100);
      }

      return id;
    } catch (error) {
      console.error('Failed to queue action:', error);
      throw error;
    }
  }

  /**
   * Trigger background sync process
   */
  async triggerSync() {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;

    try {
      console.log('🔄 Starting background sync...');

      const pendingActions = await this.getPendingActions();

      if (pendingActions.length === 0) {
        console.log('✅ No pending actions to sync');
        return;
      }

      const networkType = this.getNetworkType();
      const strategy =
        this.syncStrategies[networkType] || this.syncStrategies['4g'];

      console.log(
        `📶 Syncing ${pendingActions.length} actions on ${networkType} network`,
      );

      // Filter actions based on network strategy
      let actionsToSync = strategy.priorityOnly
        ? pendingActions.filter((action) => action.priority === 1)
        : pendingActions;

      // Sort by priority and timestamp
      actionsToSync.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower number = higher priority
        }
        return a.timestamp - b.timestamp; // Older first
      });

      // Process in batches with concurrency control
      await this.processSyncBatches(actionsToSync, strategy);

      console.log('✅ Background sync completed');
    } catch (error) {
      console.error('Background sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process sync actions in batches
   */
  async processSyncBatches(actions, strategy) {
    const batches = this.createBatches(actions, strategy.batchSize);

    for (const batch of batches) {
      if (!this.isOnline) {
        console.log('📴 Went offline during sync, stopping...');
        break;
      }

      // Process batch with concurrency control
      const promises = batch.map((action) =>
        this.limitConcurrency(
          () => this.syncAction(action),
          strategy.concurrency,
        ),
      );

      const results = await Promise.allSettled(promises);

      // Handle results
      results.forEach((result, index) => {
        const action = batch[index];
        if (result.status === 'fulfilled') {
          console.log(`✅ Synced ${action.actionType} (ID: ${action.id})`);
        } else {
          console.error(
            `❌ Failed to sync ${action.actionType}:`,
            result.reason,
          );
        }
      });

      // Small delay between batches for network breathing room
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, strategy.retryDelay),
        );
      }
    }
  }

  /**
   * Sync individual action
   */
  async syncAction(action) {
    try {
      // Update status to syncing
      action.status = 'syncing';
      await this.updateActionInDB(action);

      // Perform the actual sync based on action type
      const result = await this.performSyncAction(action);

      // Mark as completed
      action.status = 'completed';
      action.completedAt = Date.now();
      action.result = result;

      await this.updateActionInDB(action);
      this.syncQueue.delete(action.id);

      // Notify about successful sync
      this.notifyActionComplete(action, result);

      return result;
    } catch (error) {
      console.error(`Sync failed for ${action.actionType}:`, error);

      action.retryCount++;
      action.lastError = error.message;
      action.lastRetryAt = Date.now();

      if (action.retryCount >= action.maxRetries) {
        action.status = 'failed';
        await this.updateActionInDB(action);
        this.syncQueue.delete(action.id);

        // Notify about permanent failure
        this.notifyActionFailed(action, error);
      } else {
        action.status = 'pending';
        const delay =
          this.retryDelays[
            Math.min(action.retryCount - 1, this.retryDelays.length - 1)
          ];

        setTimeout(() => {
          if (this.isOnline) {
            this.syncAction(action);
          }
        }, delay);

        await this.updateActionInDB(action);
      }

      throw error;
    }
  }

  /**
   * Perform the actual sync action based on type
   */
  async performSyncAction(action) {
    const { actionType, data, timeout } = action;

    // Create timeout promise for Ghana's unreliable networks
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sync timeout')), timeout);
    });

    const syncPromise = this.executeSyncAction(actionType, data);

    // Race between sync and timeout
    return Promise.race([syncPromise, timeoutPromise]);
  }

  /**
   * Execute specific sync actions
   */
  async executeSyncAction(actionType, data) {
    const apiBase = process.env.REACT_APP_API_URL || '/api';

    switch (actionType) {
      case 'job_application':
        return this.syncJobApplication(data);

      case 'emergency_request':
        return this.syncEmergencyRequest(data);

      case 'payment_action':
        return this.syncPaymentAction(data);

      case 'contract_signature':
        return this.syncContractSignature(data);

      case 'message_send':
        return this.syncMessage(data);

      case 'profile_update':
        return this.syncProfileUpdate(data);

      case 'review_submit':
        return this.syncReviewSubmit(data);

      case 'milestone_update':
        return this.syncMilestoneUpdate(data);

      case 'search_save':
        return this.syncSearchSave(data);

      case 'bookmark_action':
        return this.syncBookmarkAction(data);

      case 'notification_read':
        return this.syncNotificationRead(data);

      case 'analytics_track':
        return this.syncAnalyticsTrack(data);

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Specific sync action implementations
   */
  async syncJobApplication(data) {
    const response = await fetch('/api/jobs/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Job application sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  async syncEmergencyRequest(data) {
    const response = await fetch('/api/emergency/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Emergency request sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  async syncPaymentAction(data) {
    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Payment action sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  async syncContractSignature(data) {
    const response = await fetch('/api/contracts/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Contract signature sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  async syncMessage(data) {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Message sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  async syncProfileUpdate(data) {
    const response = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Profile update sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  async syncReviewSubmit(data) {
    const response = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Review submit sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  async syncMilestoneUpdate(data) {
    const response = await fetch('/api/milestones/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Milestone update sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  async syncSearchSave(data) {
    // Local storage for search saves - no network required
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    searches.push(data);
    localStorage.setItem('savedSearches', JSON.stringify(searches));
    return { success: true, local: true };
  }

  async syncBookmarkAction(data) {
    const response = await fetch('/api/bookmarks/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Bookmark action sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  async syncNotificationRead(data) {
    try {
      // data may contain { id } or { ids: [] }
      const token =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('token')
          : null;
      const baseHeaders = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      const headers = token
        ? { ...baseHeaders, Authorization: `Bearer ${token}` }
        : baseHeaders;

      if (Array.isArray(data?.ids) && data.ids.length > 0) {
        // Bulk mark all as read when many ids are queued
        const resp = await fetch('/api/notifications/read/all', {
          method: 'PATCH',
          headers,
        });
        if (!resp.ok)
          throw new Error(`Notification bulk read failed: ${resp.statusText}`);
        return resp.json();
      }

      const id = data?.id || data?.notificationId;
      if (!id) {
        // Nothing to do
        return { success: true, skipped: true };
      }

      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers,
      });
      if (!response.ok) {
        throw new Error(
          `Notification read sync failed: ${response.statusText}`,
        );
      }
      return response.json();
    } catch (err) {
      console.warn('Notification read sync soft-failed:', err?.message || err);
      // Do not block other sync actions
      return { success: false, reason: 'deferred' };
    }
  }

  async syncAnalyticsTrack(data) {
    // Analytics can be batched and sent with minimal priority
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Analytics failures shouldn't be critical
      console.warn('Analytics sync failed, but continuing...');
      return { success: false, reason: 'non-critical' };
    }

    return response.json();
  }

  /**
   * Helper methods for database operations
   */
  async saveActionToDB(action) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(action);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateActionInDB(action) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingActions() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async loadPendingActions() {
    try {
      const actions = await this.getPendingActions();
      actions.forEach((action) => {
        this.syncQueue.set(action.id, action);
      });

      console.log(`📂 Loaded ${actions.length} pending actions from storage`);
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  }

  /**
   * Utility methods
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async limitConcurrency(fn, maxConcurrency) {
    // Simple concurrency limiting - in production, use a proper semaphore
    return fn();
  }

  getNetworkType() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;

      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return '2g';
        case '3g':
          return '3g';
        case '4g':
          return '4g';
        default:
          return 'wifi';
      }
    }

    return '4g'; // Default assumption
  }

  getCurrentUserId() {
    // Get from auth service or localStorage
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('userId') || 'anonymous';
    }
    return 'anonymous';
  }

  getDeviceId() {
    if (typeof localStorage === 'undefined') {
      return 'device_unknown';
    }

    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  notifyActionComplete(action, result) {
    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('backgroundSyncComplete', {
          detail: { action, result },
        }),
      );
    }
  }

  notifyActionFailed(action, error) {
    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('backgroundSyncFailed', {
          detail: { action, error },
        }),
      );
    }
  }

  handleSyncComplete(results) {
    console.log('📱 Service Worker sync completed:', results);
  }

  /**
   * Start periodic sync for Ghana's intermittent networks
   */
  startPeriodicSync() {
    // Check every 30 seconds when app is active
    setInterval(() => {
      if (!document.hidden && this.isOnline && !this.isSyncing) {
        const pendingCount = this.syncQueue.size;
        if (pendingCount > 0) {
          console.log(
            `⏰ Periodic sync check: ${pendingCount} actions pending`,
          );
          this.triggerSync();
        }
      }
    }, 30000);
  }

  /**
   * Get sync status and statistics
   */
  getSyncStatus() {
    const pending = Array.from(this.syncQueue.values()).filter(
      (a) => a.status === 'pending',
    );
    const syncing = Array.from(this.syncQueue.values()).filter(
      (a) => a.status === 'syncing',
    );
    const failed = Array.from(this.syncQueue.values()).filter(
      (a) => a.status === 'failed',
    );

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      networkType: this.getNetworkType(),
      queueSize: this.syncQueue.size,
      pending: pending.length,
      syncing: syncing.length,
      failed: failed.length,
      nextSync: this.isSyncing ? 'in progress' : 'on network available',
    };
  }

  /**
   * Clear completed and failed actions
   */
  async cleanupCompletedActions() {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Remove completed actions older than 24 hours
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoff);

      const request = index.openCursor(range);
      let cleanedCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const action = cursor.value;
          if (action.status === 'completed' || action.status === 'failed') {
            cursor.delete();
            this.syncQueue.delete(action.id);
            cleanedCount++;
          }
          cursor.continue();
        } else {
          if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} completed sync actions`);
          }
        }
      };
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Force sync all pending actions (for manual retry)
   */
  async forceSyncAll() {
    if (!this.isOnline) {
      throw new Error('Cannot force sync while offline');
    }

    console.log('🔄 Force syncing all pending actions...');
    await this.triggerSync();
  }

  /**
   * Cancel specific action
   */
  async cancelAction(actionId) {
    const action = this.syncQueue.get(actionId);
    if (!action) {
      throw new Error('Action not found');
    }

    if (action.status === 'syncing') {
      throw new Error('Cannot cancel action currently syncing');
    }

    action.status = 'cancelled';
    await this.updateActionInDB(action);
    this.syncQueue.delete(actionId);

    console.log(`❌ Cancelled action ${actionId}`);
  }
}

// Export singleton instance
export default new BackgroundSyncService();
