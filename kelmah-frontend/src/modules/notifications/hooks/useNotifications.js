import { useContext } from 'react';
import NotificationContext from '../contexts/NotificationContext';

/**
 * Custom hook to provide access to the notification context
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

export default useNotifications; 
