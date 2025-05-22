#!/bin/bash
# Script to rename service files to PascalCase naming convention

# Navigate to services directory
cd ../kelmah-frontend/src/services

# Rename files to PascalCase with Service suffix
# Only rename if the file doesn't already follow the convention

# Auth Service
if [ -f "authService.js" ] && [ ! -f "AuthService.js" ]; then
  mv authService.js AuthService.js
  echo "Renamed authService.js to AuthService.js"
fi

# Notification Service
if [ -f "notificationService.js" ] && [ ! -f "NotificationService.js" ]; then
  mv notificationService.js NotificationService.js
  echo "Renamed notificationService.js to NotificationService.js"
fi

# Messaging Service
if [ -f "messagingService.js" ] && [ ! -f "MessagingService.js" ]; then
  mv messagingService.js MessagingService.js
  echo "Renamed messagingService.js to MessagingService.js"
fi

# Milestone Service
if [ -f "milestoneService.js" ] && [ ! -f "MilestoneService.js" ]; then
  mv milestoneService.js MilestoneService.js
  echo "Renamed milestoneService.js to MilestoneService.js"
fi

# File Upload Service
if [ -f "fileUploadService.js" ] && [ ! -f "FileUploadService.js" ]; then
  mv fileUploadService.js FileUploadService.js
  echo "Renamed fileUploadService.js to FileUploadService.js"
fi

# Search Service
if [ -f "searchService.js" ] && [ ! -f "SearchService.js" ]; then
  mv searchService.js SearchService.js
  echo "Renamed searchService.js to SearchService.js"
fi

# Chat Service
if [ -f "chatService.js" ] && [ ! -f "ChatService.js" ]; then
  mv chatService.js ChatService.js
  echo "Renamed chatService.js to ChatService.js"
fi

# Dashboard Service
if [ -f "dashboardService.js" ] && [ ! -f "DashboardService.js" ]; then
  mv dashboardService.js DashboardService.js
  echo "Renamed dashboardService.js to DashboardService.js"
fi

# WebSocket
if [ -f "websocket.js" ] && [ ! -f "WebSocketService.js" ]; then
  mv websocket.js WebSocketService.js
  echo "Renamed websocket.js to WebSocketService.js"
fi

# API client
if [ -f "api.js" ] && [ ! -f "ApiService.js" ]; then
  # May want to keep api.js as-is since it's commonly used this way
  # Uncomment the following lines if you want to rename
  # mv api.js ApiService.js
  # echo "Renamed api.js to ApiService.js"
  echo "Left api.js as-is (common convention)"
fi

echo "Service files renamed successfully!" 