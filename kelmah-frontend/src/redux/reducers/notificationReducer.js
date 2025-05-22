import {
  FETCH_NOTIFICATIONS_REQUEST,
  FETCH_NOTIFICATIONS_SUCCESS,
  FETCH_NOTIFICATIONS_FAILURE,
  MARK_NOTIFICATION_READ_REQUEST,
  MARK_NOTIFICATION_READ_SUCCESS,
  MARK_NOTIFICATION_READ_FAILURE,
  FETCH_NOTIFICATION_PREFERENCES_REQUEST,
  FETCH_NOTIFICATION_PREFERENCES_SUCCESS,
  FETCH_NOTIFICATION_PREFERENCES_FAILURE,
  UPDATE_NOTIFICATION_PREFERENCES_REQUEST,
  UPDATE_NOTIFICATION_PREFERENCES_SUCCESS,
  UPDATE_NOTIFICATION_PREFERENCES_FAILURE,
  CLEAR_NOTIFICATIONS_REQUEST,
  CLEAR_NOTIFICATIONS_SUCCESS,
  CLEAR_NOTIFICATIONS_FAILURE,
  NEW_NOTIFICATION_RECEIVED,
  NOTIFICATION_COUNT_UPDATED
} from '../actions/notificationActions';

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
  
  // Notification preferences
  preferences: {},
  preferencesLoading: false,
  preferencesError: null,
  preferencesSaving: false,
  preferencesSaveError: null,
  
  // Clear notifications
  clearing: false,
  clearingError: null
};

export default function notificationReducer(state = initialState, action) {
  switch (action.type) {
    // Fetch notifications
    case FETCH_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case FETCH_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        items: action.payload.notifications || [],
        unreadCount: action.payload.unreadCount || 0
      };
    
    case FETCH_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    // Mark notification as read
    case MARK_NOTIFICATION_READ_REQUEST:
      return {
        ...state,
        items: state.items.map(notification => 
          notification.id === action.payload.notificationId
            ? { ...notification, markingRead: true }
            : notification
        )
      };
    
    case MARK_NOTIFICATION_READ_SUCCESS:
      return {
        ...state,
        items: state.items.map(notification => 
          notification.id === action.payload.notificationId
            ? { ...notification, read: true, markingRead: false }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    
    case MARK_NOTIFICATION_READ_FAILURE:
      return {
        ...state,
        items: state.items.map(notification => 
          notification.id === action.payload.notificationId
            ? { ...notification, markingRead: false, readError: action.payload.error }
            : notification
        )
      };
    
    // Fetch notification preferences
    case FETCH_NOTIFICATION_PREFERENCES_REQUEST:
      return {
        ...state,
        preferencesLoading: true,
        preferencesError: null
      };
    
    case FETCH_NOTIFICATION_PREFERENCES_SUCCESS:
      return {
        ...state,
        preferencesLoading: false,
        preferences: action.payload
      };
    
    case FETCH_NOTIFICATION_PREFERENCES_FAILURE:
      return {
        ...state,
        preferencesLoading: false,
        preferencesError: action.payload
      };
    
    // Update notification preferences
    case UPDATE_NOTIFICATION_PREFERENCES_REQUEST:
      return {
        ...state,
        preferencesSaving: true,
        preferencesSaveError: null
      };
    
    case UPDATE_NOTIFICATION_PREFERENCES_SUCCESS:
      return {
        ...state,
        preferencesSaving: false,
        preferences: action.payload
      };
    
    case UPDATE_NOTIFICATION_PREFERENCES_FAILURE:
      return {
        ...state,
        preferencesSaving: false,
        preferencesSaveError: action.payload
      };
    
    // Clear all notifications
    case CLEAR_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        clearing: true,
        clearingError: null
      };
    
    case CLEAR_NOTIFICATIONS_SUCCESS:
      if (action.payload.action === 'mark-read') {
        return {
          ...state,
          clearing: false,
          items: state.items.map(notification => ({ ...notification, read: true })),
          unreadCount: 0
        };
      } else {
        return {
          ...state,
          clearing: false,
          items: [],
          unreadCount: 0
        };
      }
    
    case CLEAR_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        clearing: false,
        clearingError: action.payload.error
      };
    
    // New notification received (real-time)
    case NEW_NOTIFICATION_RECEIVED:
      // Check if notification already exists
      const exists = state.items.some(n => n.id === action.payload.id);
      
      if (exists) {
        return state;
      }
      
      return {
        ...state,
        items: [action.payload, ...state.items],
        unreadCount: state.unreadCount + 1
      };
    
    // Update notification count (real-time)
    case NOTIFICATION_COUNT_UPDATED:
      return {
        ...state,
        unreadCount: action.payload
      };
    
    default:
      return state;
  }
} 