import { useCallback, useState, useEffect } from 'react';
import backgroundSyncService from '../services/backgroundSyncService';

/**
 * Custom hook for background sync functionality
 * Provides a clean interface for components to queue offline actions
 */
const useBackgroundSync = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    queueSize: 0,
    pending: 0,
    syncing: 0,
    failed: 0
  });

  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Update sync status
  const updateStatus = useCallback(() => {
    const status = backgroundSyncService.getSyncStatus();
    setSyncStatus(status);
  }, []);

  // Listen for sync events
  useEffect(() => {
    const handleSyncComplete = (event) => {
      const { results } = event.detail;
      console.log('🎉 Sync completed via hook:', results);
      updateStatus();
      setLastSyncTime(new Date());
    };

    const handleSyncFailed = (event) => {
      const { action, error } = event.detail;
      console.error('❌ Sync failed via hook:', action, error);
      updateStatus();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('backgroundSyncComplete', handleSyncComplete);
      window.addEventListener('backgroundSyncFailed', handleSyncFailed);
    }

    // Initial status update
    updateStatus();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('backgroundSyncComplete', handleSyncComplete);
        window.removeEventListener('backgroundSyncFailed', handleSyncFailed);
      }
    };
  }, [updateStatus]);

  /**
   * Queue a job application for background sync
   * @param {Object} jobApplication - Job application data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queueJobApplication = useCallback(async (jobApplication, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'job_application',
        jobApplication,
        {
          ...options,
          timeout: 30000, // 30 seconds for job applications
          userId: jobApplication.userId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue job application:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue an emergency request for background sync
   * @param {Object} emergencyData - Emergency request data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queueEmergencyRequest = useCallback(async (emergencyData, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'emergency_request',
        emergencyData,
        {
          ...options,
          timeout: 15000, // 15 seconds for emergencies
          userId: emergencyData.userId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue emergency request:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue a payment action for background sync
   * @param {Object} paymentData - Payment data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queuePaymentAction = useCallback(async (paymentData, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'payment_action',
        paymentData,
        {
          ...options,
          timeout: 45000, // 45 seconds for payments
          userId: paymentData.userId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue payment action:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue a contract signature for background sync
   * @param {Object} contractData - Contract signature data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queueContractSignature = useCallback(async (contractData, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'contract_signature',
        contractData,
        {
          ...options,
          timeout: 30000, // 30 seconds for signatures
          userId: contractData.userId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue contract signature:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue a message for background sync
   * @param {Object} messageData - Message data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queueMessage = useCallback(async (messageData, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'message_send',
        messageData,
        {
          ...options,
          timeout: 20000, // 20 seconds for messages
          userId: messageData.senderId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue message:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue a profile update for background sync
   * @param {Object} profileData - Profile update data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queueProfileUpdate = useCallback(async (profileData, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'profile_update',
        profileData,
        {
          ...options,
          timeout: 25000, // 25 seconds for profile updates
          userId: profileData.userId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue profile update:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue a review submission for background sync
   * @param {Object} reviewData - Review data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queueReviewSubmit = useCallback(async (reviewData, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'review_submit',
        reviewData,
        {
          ...options,
          timeout: 20000, // 20 seconds for reviews
          userId: reviewData.reviewerId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue review submission:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue a milestone update for background sync
   * @param {Object} milestoneData - Milestone update data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queueMilestoneUpdate = useCallback(async (milestoneData, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'milestone_update',
        milestoneData,
        {
          ...options,
          timeout: 25000, // 25 seconds for milestone updates
          userId: milestoneData.userId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue milestone update:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue a bookmark action for background sync
   * @param {Object} bookmarkData - Bookmark data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queueBookmarkAction = useCallback(async (bookmarkData, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'bookmark_action',
        bookmarkData,
        {
          ...options,
          timeout: 10000, // 10 seconds for bookmarks
          userId: bookmarkData.userId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue bookmark action:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue a search save for local storage (no network required)
   * @param {Object} searchData - Search data to save
   * @returns {Promise<string>} - Action ID
   */
  const queueSearchSave = useCallback(async (searchData) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'search_save',
        searchData,
        {
          timeout: 5000, // 5 seconds for local saves
          userId: searchData.userId
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue search save:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Queue analytics tracking (low priority)
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<string>} - Action ID
   */
  const queueAnalyticsTrack = useCallback(async (analyticsData) => {
    try {
      const actionId = await backgroundSyncService.queueAction(
        'analytics_track',
        analyticsData,
        {
          timeout: 5000, // 5 seconds for analytics
          userId: analyticsData.userId || 'anonymous'
        }
      );
      
      updateStatus();
      return actionId;
    } catch (error) {
      console.error('Failed to queue analytics:', error);
      // Don't throw for analytics failures
      return null;
    }
  }, [updateStatus]);

  /**
   * Queue a generic action for background sync
   * @param {string} actionType - Type of action
   * @param {Object} data - Action data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Action ID
   */
  const queueAction = useCallback(async (actionType, data, options = {}) => {
    try {
      const actionId = await backgroundSyncService.queueAction(actionType, data, options);
      updateStatus();
      return actionId;
    } catch (error) {
      console.error(`Failed to queue ${actionType}:`, error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Force sync all pending actions
   * @returns {Promise<void>}
   */
  const forceSyncAll = useCallback(async () => {
    try {
      await backgroundSyncService.forceSyncAll();
      updateStatus();
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Cancel a specific action
   * @param {string} actionId - ID of action to cancel
   * @returns {Promise<void>}
   */
  const cancelAction = useCallback(async (actionId) => {
    try {
      await backgroundSyncService.cancelAction(actionId);
      updateStatus();
    } catch (error) {
      console.error('Cancel action failed:', error);
      throw error;
    }
  }, [updateStatus]);

  /**
   * Get detailed sync statistics
   * @returns {Object} - Detailed sync stats
   */
  const getSyncStats = useCallback(() => {
    return backgroundSyncService.getSyncStatus();
  }, []);

  /**
   * Clear all completed actions from the queue
   * @returns {Promise<void>}
   */
  const cleanupCompleted = useCallback(async () => {
    try {
      await backgroundSyncService.cleanupCompletedActions();
      updateStatus();
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }, [updateStatus]);

  return {
    // Status information
    syncStatus,
    lastSyncTime,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    queueSize: syncStatus.queueSize,
    
    // High-priority action queueing
    queueJobApplication,
    queueEmergencyRequest,
    queuePaymentAction,
    queueContractSignature,
    
    // Medium-priority action queueing
    queueMessage,
    queueProfileUpdate,
    queueReviewSubmit,
    queueMilestoneUpdate,
    
    // Low-priority action queueing
    queueBookmarkAction,
    queueSearchSave,
    queueAnalyticsTrack,
    
    // Generic and utility functions
    queueAction,
    forceSyncAll,
    cancelAction,
    getSyncStats,
    cleanupCompleted,
    updateStatus
  };
};

export default useBackgroundSync;