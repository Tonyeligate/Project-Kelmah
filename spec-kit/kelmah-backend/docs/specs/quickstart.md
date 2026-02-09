# Quickstart Guide: Real-Time Job Collaboration

**Feature**: Real-Time Job Collaboration  
**Date**: 2025-01-11  
**Status**: Complete

## Overview

This quickstart guide demonstrates how to use the real-time collaboration feature for job requirements editing. The feature allows hirers and workers to collaborate on job postings in real-time with live editing, commenting, and version history.

## Prerequisites

- Kelmah platform running with collaboration service
- Valid JWT authentication token
- WebSocket support in client application
- Socket.IO client library

## Getting Started

### 1. Create a Collaboration Session

**API Endpoint**: `POST /api/collaboration/sessions`

**Request**:
```bash
curl -X POST "https://api.kelmah.com/api/collaboration/sessions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job_123",
    "workerId": "worker_456",
    "settings": {
      "autoSave": true,
      "notifications": true
    }
  }'
```

**Response**:
```json
{
  "id": "session_789",
  "jobId": "job_123",
  "hirerId": "hirer_123",
  "workerId": "worker_456",
  "status": "active",
  "createdAt": "2025-01-11T10:00:00Z",
  "updatedAt": "2025-01-11T10:00:00Z",
  "lastActivity": "2025-01-11T10:00:00Z",
  "settings": {
    "autoSave": true,
    "notifications": true
  }
}
```

### 2. Connect to WebSocket

**JavaScript Client**:
```javascript
import io from 'socket.io-client';

const socket = io('https://api.kelmah.com', {
  query: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Join collaboration session
socket.emit('join-session', {
  sessionId: 'session_789',
  userId: 'user_123'
});

// Listen for session events
socket.on('session-joined', (data) => {
  console.log('Joined session:', data);
});

socket.on('user-joined', (data) => {
  console.log('User joined:', data.user);
});

socket.on('content-updated', (data) => {
  console.log('Content updated:', data);
});
```

### 3. Start Real-Time Editing

**Start Editing**:
```javascript
// Indicate user is starting to edit
socket.emit('start-editing', {
  sessionId: 'session_789',
  position: { line: 0, column: 0 }
});

// Listen for editing events
socket.on('editing-started', (data) => {
  console.log('User started editing:', data.userId);
});
```

**Send Content Updates**:
```javascript
// Send content changes
socket.emit('update-content', {
  sessionId: 'session_789',
  operation: {
    type: 'insert',
    position: 10,
    content: 'New text',
    length: 9
  },
  clientId: 'client_123',
  timestamp: new Date().toISOString()
});

// Listen for content updates from other users
socket.on('content-updated', (data) => {
  // Apply the operation to your editor
  applyOperation(data.operation);
});
```

### 4. Add Comments

**Add a Comment**:
```javascript
socket.emit('add-comment', {
  sessionId: 'session_789',
  comment: {
    content: 'This section needs more detail',
    position: {
      line: 5,
      column: 0,
      range: {
        start: 50,
        end: 100
      }
    }
  }
});

// Listen for new comments
socket.on('comment-added', (data) => {
  console.log('New comment:', data.comment);
});
```

**Reply to a Comment**:
```javascript
socket.emit('add-comment', {
  sessionId: 'session_789',
  comment: {
    content: 'I agree, let me add more details',
    position: {
      line: 5,
      column: 0,
      range: {
        start: 50,
        end: 100
      }
    },
    parentCommentId: 'comment_123'
  }
});
```

### 5. Manage Version History

**Request Version History**:
```javascript
socket.emit('request-versions', {
  sessionId: 'session_789',
  limit: 10,
  offset: 0
});

// Listen for version history
socket.on('versions-provided', (data) => {
  console.log('Version history:', data.versions);
});
```

**Restore a Version**:
```javascript
socket.emit('restore-version', {
  sessionId: 'session_789',
  versionId: 'version_456'
});

// Listen for version restoration
socket.on('version-restored', (data) => {
  console.log('Version restored:', data);
});
```

## Complete Example

Here's a complete example of a collaboration client:

```javascript
class CollaborationClient {
  constructor(token, sessionId) {
    this.token = token;
    this.sessionId = sessionId;
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    this.socket = io('https://api.kelmah.com', {
      query: { token: this.token }
    });

    this.socket.on('connect', () => {
      console.log('Connected to collaboration service');
      this.isConnected = true;
      this.joinSession();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from collaboration service');
      this.isConnected = false;
    });

    this.setupEventListeners();
  }

  joinSession() {
    this.socket.emit('join-session', {
      sessionId: this.sessionId,
      userId: this.getCurrentUserId()
    });
  }

  setupEventListeners() {
    // Session events
    this.socket.on('session-joined', (data) => {
      console.log('Joined session:', data);
    });

    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data.user);
      this.showUserPresence(data.user);
    });

    this.socket.on('user-left', (data) => {
      console.log('User left:', data.userId);
      this.hideUserPresence(data.userId);
    });

    // Content events
    this.socket.on('content-updated', (data) => {
      this.applyContentUpdate(data.operation);
    });

    this.socket.on('editing-started', (data) => {
      this.showUserEditing(data.userId, data.position);
    });

    this.socket.on('editing-stopped', (data) => {
      this.hideUserEditing(data.userId);
    });

    // Comment events
    this.socket.on('comment-added', (data) => {
      this.showComment(data.comment);
    });

    this.socket.on('comment-updated', (data) => {
      this.updateComment(data.commentId, data.updates);
    });

    // Error handling
    this.socket.on('error', (data) => {
      console.error('Collaboration error:', data);
      this.handleError(data);
    });
  }

  startEditing(position) {
    this.socket.emit('start-editing', {
      sessionId: this.sessionId,
      position: position
    });
  }

  stopEditing() {
    this.socket.emit('stop-editing', {
      sessionId: this.sessionId
    });
  }

  updateContent(operation) {
    this.socket.emit('update-content', {
      sessionId: this.sessionId,
      operation: operation,
      clientId: this.getClientId(),
      timestamp: new Date().toISOString()
    });
  }

  addComment(content, position) {
    this.socket.emit('add-comment', {
      sessionId: this.sessionId,
      comment: {
        content: content,
        position: position
      }
    });
  }

  updateCursor(position) {
    this.socket.emit('update-cursor', {
      sessionId: this.sessionId,
      position: position
    });
  }

  // Helper methods
  getCurrentUserId() {
    // Get current user ID from authentication
    return localStorage.getItem('userId');
  }

  getClientId() {
    // Generate or retrieve client ID
    return localStorage.getItem('clientId') || this.generateClientId();
  }

  generateClientId() {
    const clientId = 'client_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('clientId', clientId);
    return clientId;
  }

  applyContentUpdate(operation) {
    // Apply operation to your editor
    console.log('Applying operation:', operation);
  }

  showUserPresence(user) {
    // Show user presence indicator
    console.log('Showing user presence:', user);
  }

  hideUserPresence(userId) {
    // Hide user presence indicator
    console.log('Hiding user presence:', userId);
  }

  showUserEditing(userId, position) {
    // Show user editing indicator
    console.log('User editing:', userId, position);
  }

  hideUserEditing(userId) {
    // Hide user editing indicator
    console.log('User stopped editing:', userId);
  }

  showComment(comment) {
    // Show comment in UI
    console.log('Showing comment:', comment);
  }

  updateComment(commentId, updates) {
    // Update comment in UI
    console.log('Updating comment:', commentId, updates);
  }

  handleError(error) {
    // Handle collaboration errors
    console.error('Handling error:', error);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage
const client = new CollaborationClient('your-jwt-token', 'session_789');
client.connect();

// Start editing
client.startEditing({ line: 0, column: 0 });

// Update content
client.updateContent({
  type: 'insert',
  position: 10,
  content: 'New text',
  length: 9
});

// Add comment
client.addComment('This needs more detail', {
  line: 5,
  column: 0,
  range: { start: 50, end: 100 }
});
```

## Testing Scenarios

### 1. Basic Collaboration
1. Create a collaboration session
2. Have two users join the session
3. One user starts editing
4. Other user sees editing indicator
5. User makes content changes
6. Other user sees changes in real-time

### 2. Comment System
1. User adds a comment to specific text
2. Other user sees the comment
3. User replies to the comment
4. Comment thread is maintained
5. User resolves the comment

### 3. Version History
1. Make several content changes
2. Request version history
3. Restore to previous version
4. Verify content is restored
5. Check that new version is created

### 4. Conflict Resolution
1. Two users edit same section simultaneously
2. Verify conflict is detected
3. Check that conflict is resolved automatically
4. Verify both users see final result

### 5. Connection Recovery
1. User disconnects during editing
2. User reconnects
3. Verify session state is restored
4. Check that changes are synchronized

## Error Handling

### Common Errors

**Invalid Session**:
```json
{
  "error": "SESSION_NOT_FOUND",
  "message": "Collaboration session not found",
  "details": {
    "sessionId": "session_789"
  }
}
```

**Permission Denied**:
```json
{
  "error": "PERMISSION_DENIED",
  "message": "User not authorized for this session",
  "details": {
    "userId": "user_123",
    "sessionId": "session_789"
  }
}
```

**Rate Limited**:
```json
{
  "error": "RATE_LIMITED",
  "message": "Too many requests",
  "details": {
    "retryAfter": 60
  }
}
```

### Error Recovery

1. **Connection Lost**: Automatically attempt reconnection
2. **Session Expired**: Request new session or refresh token
3. **Permission Denied**: Check user authorization
4. **Rate Limited**: Implement exponential backoff

## Performance Considerations

### Optimization Tips

1. **Batch Operations**: Group multiple changes into single updates
2. **Debounce Updates**: Limit frequency of cursor/typing updates
3. **Lazy Loading**: Load version history on demand
4. **Connection Pooling**: Reuse WebSocket connections

### Monitoring

1. **Latency**: Monitor real-time update latency
2. **Throughput**: Track events per second
3. **Errors**: Monitor error rates and types
4. **Connections**: Track active connections and sessions

---

**Quickstart Status**: Complete  
**Next Steps**: Proceed to task generation and implementation
