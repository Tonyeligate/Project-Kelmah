# PowerShell script to create NotificationContext
Write-Host "Setting up NotificationContext..." -ForegroundColor Green

# Define paths
$targetPath = "kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx"

# Create directory if needed
$targetDir = Split-Path $targetPath -Parent
if (-not (Test-Path $targetDir)) {
    New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
    Write-Host "Created directory: $targetDir" -ForegroundColor Green
}

# Check if file already exists
if (-not (Test-Path $targetPath)) {
    # Content for the NotificationContext.jsx file
    $notificationContextContent = @"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectNotifications, markAsRead, removeNotification } from '../services/notificationSlice';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const dispatch = useDispatch();
  const storeNotifications = useSelector(selectNotifications);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync notifications from the store
  useEffect(() => {
    if (storeNotifications) {
      setNotifications(storeNotifications);
      setUnreadCount(storeNotifications.filter(notification => !notification.read).length);
    }
  }, [storeNotifications]);

  // Mark a notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    dispatch(markAsRead(notificationId));
  }, [dispatch]);

  // Remove a notification
  const dismissNotification = useCallback((notificationId) => {
    dispatch(removeNotification(notificationId));
  }, [dispatch]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    notifications.forEach(notification => {
      if (!notification.read) {
        dispatch(markAsRead(notification.id));
      }
    });
  }, [dispatch, notifications]);

  // Provide context value
  const contextValue = {
    notifications,
    unreadCount,
    markNotificationAsRead,
    dismissNotification,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
"@

    # Write to target file
    Set-Content -Path $targetPath -Value $notificationContextContent
    Write-Host "Created NotificationContext.jsx at $targetPath" -ForegroundColor Green
} else {
    Write-Host "NotificationContext.jsx already exists at $targetPath" -ForegroundColor Yellow
}

Write-Host "NotificationContext setup completed!" -ForegroundColor Green 