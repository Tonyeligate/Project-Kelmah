import { notificationService } from '../../services/notificationService';

// Action Types
export const FETCH_NOTIFICATIONS_REQUEST = 'FETCH_NOTIFICATIONS_REQUEST';
export const FETCH_NOTIFICATIONS_SUCCESS = 'FETCH_NOTIFICATIONS_SUCCESS';
export const FETCH_NOTIFICATIONS_FAILURE = 'FETCH_NOTIFICATIONS_FAILURE';

export const MARK_NOTIFICATION_READ_REQUEST = 'MARK_NOTIFICATION_READ_REQUEST';
export const MARK_NOTIFICATION_READ_SUCCESS = 'MARK_NOTIFICATION_READ_SUCCESS';
export const MARK_NOTIFICATION_READ_FAILURE = 'MARK_NOTIFICATION_READ_FAILURE';

export const FETCH_NOTIFICATION_PREFERENCES_REQUEST = 'FETCH_NOTIFICATION_PREFERENCES_REQUEST';
export const FETCH_NOTIFICATION_PREFERENCES_SUCCESS = 'FETCH_NOTIFICATION_PREFERENCES_SUCCESS';
export const FETCH_NOTIFICATION_PREFERENCES_FAILURE = 'FETCH_NOTIFICATION_PREFERENCES_FAILURE';

export const UPDATE_NOTIFICATION_PREFERENCES_REQUEST = 'UPDATE_NOTIFICATION_PREFERENCES_REQUEST';
export const UPDATE_NOTIFICATION_PREFERENCES_SUCCESS = 'UPDATE_NOTIFICATION_PREFERENCES_SUCCESS';
export const UPDATE_NOTIFICATION_PREFERENCES_FAILURE = 'UPDATE_NOTIFICATION_PREFERENCES_FAILURE';

export const CLEAR_NOTIFICATIONS_REQUEST = 'CLEAR_NOTIFICATIONS_REQUEST';
export const CLEAR_NOTIFICATIONS_SUCCESS = 'CLEAR_NOTIFICATIONS_SUCCESS';
export const CLEAR_NOTIFICATIONS_FAILURE = 'CLEAR_NOTIFICATIONS_FAILURE';

export const NEW_NOTIFICATION_RECEIVED = 'NEW_NOTIFICATION_RECEIVED';
export const NOTIFICATION_COUNT_UPDATED = 'NOTIFICATION_COUNT_UPDATED';

// Action Creators

// Fetch notifications
export const fetchNotifications = () => async (dispatch) => {
  dispatch({ type: FETCH_NOTIFICATIONS_REQUEST });
  
  try {
    const data = await notificationService.getNotifications();
    dispatch({
      type: FETCH_NOTIFICATIONS_SUCCESS,
      payload: data
    });
    return data;
  } catch (error) {
    dispatch({
      type: FETCH_NOTIFICATIONS_FAILURE,
      payload: error.message || 'Failed to fetch notifications'
    });
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = (notificationId) => async (dispatch) => {
  dispatch({ 
    type: MARK_NOTIFICATION_READ_REQUEST,
    payload: { notificationId }
  });
  
  try {
    await notificationService.markAsRead(notificationId);
    dispatch({
      type: MARK_NOTIFICATION_READ_SUCCESS,
      payload: { notificationId }
    });
  } catch (error) {
    dispatch({
      type: MARK_NOTIFICATION_READ_FAILURE,
      payload: {
        notificationId,
        error: error.message || 'Failed to mark notification as read'
      }
    });
  }
};

// Fetch notification preferences
export const fetchNotificationPreferences = () => async (dispatch) => {
  dispatch({ type: FETCH_NOTIFICATION_PREFERENCES_REQUEST });
  
  try {
    const preferences = await notificationService.getPreferences();
    dispatch({
      type: FETCH_NOTIFICATION_PREFERENCES_SUCCESS,
      payload: preferences
    });
    return preferences;
  } catch (error) {
    dispatch({
      type: FETCH_NOTIFICATION_PREFERENCES_FAILURE,
      payload: error.message || 'Failed to fetch notification preferences'
    });
    throw error;
  }
};

// Update notification preferences
export const updateNotificationPreferences = (preferences) => async (dispatch) => {
  dispatch({ 
    type: UPDATE_NOTIFICATION_PREFERENCES_REQUEST,
    payload: preferences
  });
  
  try {
    const updatedPreferences = await notificationService.updatePreferences(preferences);
    dispatch({
      type: UPDATE_NOTIFICATION_PREFERENCES_SUCCESS,
      payload: updatedPreferences
    });
    return updatedPreferences;
  } catch (error) {
    dispatch({
      type: UPDATE_NOTIFICATION_PREFERENCES_FAILURE,
      payload: error.message || 'Failed to update notification preferences'
    });
    throw error;
  }
};

// Clear all notifications or mark all as read
export const clearAllNotifications = (action = 'delete') => async (dispatch) => {
  dispatch({ 
    type: CLEAR_NOTIFICATIONS_REQUEST,
    payload: { action }
  });
  
  try {
    if (action === 'mark-read') {
      await notificationService.markAllAsRead();
    } else {
      await notificationService.clearAllNotifications();
    }
    
    dispatch({
      type: CLEAR_NOTIFICATIONS_SUCCESS,
      payload: { action }
    });
  } catch (error) {
    dispatch({
      type: CLEAR_NOTIFICATIONS_FAILURE,
      payload: {
        action,
        error: error.message || 'Failed to clear notifications'
      }
    });
  }
};

// Handle real-time notification received
export const handleNewNotification = (notification) => ({
  type: NEW_NOTIFICATION_RECEIVED,
  payload: notification
});

// Update notification count
export const updateNotificationCount = (count) => ({
  type: NOTIFICATION_COUNT_UPDATED,
  payload: count
}); 