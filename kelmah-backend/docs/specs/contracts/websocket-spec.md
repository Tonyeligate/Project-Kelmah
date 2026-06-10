# WebSocket Events Specification: Real-Time Job Collaboration

**Feature**: Real-Time Job Collaboration  
**Date**: 2025-01-11  
**Status**: Complete

## WebSocket Connection

### Connection URL
```
ws://localhost:3000/socket.io/?token={JWT_TOKEN}
wss://api.kelmah.com/socket.io/?token={JWT_TOKEN}
```

### Authentication
- JWT token passed as query parameter `token`
- Token validated on connection
- Invalid tokens result in connection rejection

### Room Management
- Users join rooms based on collaboration session: `collaboration-{sessionId}`
- Room membership managed automatically
- Users can only join rooms for sessions they're authorized to access

## Client → Server Events

### 1. Join Collaboration Session
**Event**: `join-session`  
**Description**: Join a collaboration session room

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string"
}
```

**Response**: `session-joined` event

### 2. Leave Collaboration Session
**Event**: `leave-session`  
**Description**: Leave a collaboration session room

**Payload**:
```json
{
  "sessionId": "uuid"
}
```

**Response**: `session-left` event

### 3. Start Editing
**Event**: `start-editing`  
**Description**: Indicate user is starting to edit content

**Payload**:
```json
{
  "sessionId": "uuid",
  "position": {
    "line": 0,
    "column": 0
  }
}
```

**Response**: `editing-started` event

### 4. Stop Editing
**Event**: `stop-editing`  
**Description**: Indicate user has stopped editing

**Payload**:
```json
{
  "sessionId": "uuid"
}
```

**Response**: `editing-stopped` event

### 5. Update Content
**Event**: `update-content`  
**Description**: Send content changes to other users

**Payload**:
```json
{
  "sessionId": "uuid",
  "operation": {
    "type": "insert" | "delete" | "retain",
    "position": 0,
    "content": "string",
    "length": 0
  },
  "clientId": "uuid",
  "timestamp": "2025-01-11T10:00:00Z"
}
```

**Response**: `content-updated` event

### 6. Update Cursor Position
**Event**: `update-cursor`  
**Description**: Update user's cursor position

**Payload**:
```json
{
  "sessionId": "uuid",
  "position": {
    "line": 0,
    "column": 0
  }
}
```

**Response**: `cursor-updated` event

### 7. Start Typing
**Event**: `start-typing`  
**Description**: Indicate user is typing

**Payload**:
```json
{
  "sessionId": "uuid"
}
```

**Response**: `typing-started` event

### 8. Stop Typing
**Event**: `stop-typing`  
**Description**: Indicate user has stopped typing

**Payload**:
```json
{
  "sessionId": "uuid"
}
```

**Response**: `typing-stopped` event

### 9. Add Comment
**Event**: `add-comment`  
**Description**: Add a new comment

**Payload**:
```json
{
  "sessionId": "uuid",
  "comment": {
    "content": "string",
    "position": {
      "line": 0,
      "column": 0,
      "range": {
        "start": 0,
        "end": 0
      }
    },
    "parentCommentId": "uuid" // optional for replies
  }
}
```

**Response**: `comment-added` event

### 10. Update Comment
**Event**: `update-comment`  
**Description**: Update an existing comment

**Payload**:
```json
{
  "sessionId": "uuid",
  "commentId": "uuid",
  "updates": {
    "content": "string",
    "status": "active" | "resolved" | "deleted"
  }
}
```

**Response**: `comment-updated` event

### 11. Resolve Comment
**Event**: `resolve-comment`  
**Description**: Resolve a comment

**Payload**:
```json
{
  "sessionId": "uuid",
  "commentId": "uuid"
}
```

**Response**: `comment-resolved` event

### 12. Request Version History
**Event**: `request-versions`  
**Description**: Request version history for session

**Payload**:
```json
{
  "sessionId": "uuid",
  "limit": 20,
  "offset": 0
}
```

**Response**: `versions-provided` event

### 13. Restore Version
**Event**: `restore-version`  
**Description**: Restore content to a specific version

**Payload**:
```json
{
  "sessionId": "uuid",
  "versionId": "uuid"
}
```

**Response**: `version-restored` event

## Server → Client Events

### 1. Session Joined
**Event**: `session-joined`  
**Description**: Confirmation that user joined session

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string",
  "session": {
    "id": "uuid",
    "jobId": "string",
    "hirerId": "string",
    "workerId": "string",
    "status": "active",
    "createdAt": "2025-01-11T10:00:00Z",
    "settings": {}
  }
}
```

### 2. Session Left
**Event**: `session-left`  
**Description**: Confirmation that user left session

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string"
}
```

### 3. User Joined
**Event**: `user-joined`  
**Description**: Another user joined the session

**Payload**:
```json
{
  "sessionId": "uuid",
  "user": {
    "id": "string",
    "name": "string",
    "role": "hirer" | "worker",
    "avatar": "string"
  }
}
```

### 4. User Left
**Event**: `user-left`  
**Description**: Another user left the session

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string"
}
```

### 5. Editing Started
**Event**: `editing-started`  
**Description**: User started editing

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string",
  "position": {
    "line": 0,
    "column": 0
  }
}
```

### 6. Editing Stopped
**Event**: `editing-stopped`  
**Description**: User stopped editing

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string"
}
```

### 7. Content Updated
**Event**: `content-updated`  
**Description**: Content was updated by another user

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string",
  "operation": {
    "type": "insert" | "delete" | "retain",
    "position": 0,
    "content": "string",
    "length": 0
  },
  "clientId": "uuid",
  "timestamp": "2025-01-11T10:00:00Z",
  "version": 1
}
```

### 8. Cursor Updated
**Event**: `cursor-updated`  
**Description**: User's cursor position was updated

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string",
  "position": {
    "line": 0,
    "column": 0
  }
}
```

### 9. Typing Started
**Event**: `typing-started`  
**Description**: User started typing

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string"
}
```

### 10. Typing Stopped
**Event**: `typing-stopped`  
**Description**: User stopped typing

**Payload**:
```json
{
  "sessionId": "uuid",
  "userId": "string"
}
```

### 11. Comment Added
**Event**: `comment-added`  
**Description**: New comment was added

**Payload**:
```json
{
  "sessionId": "uuid",
  "comment": {
    "id": "uuid",
    "authorId": "string",
    "content": "string",
    "position": {
      "line": 0,
      "column": 0,
      "range": {
        "start": 0,
        "end": 0
      }
    },
    "parentCommentId": "uuid",
    "status": "active",
    "createdAt": "2025-01-11T10:00:00Z"
  }
}
```

### 12. Comment Updated
**Event**: `comment-updated`  
**Description**: Comment was updated

**Payload**:
```json
{
  "sessionId": "uuid",
  "commentId": "uuid",
  "updates": {
    "content": "string",
    "status": "active" | "resolved" | "deleted"
  },
  "updatedAt": "2025-01-11T10:00:00Z"
}
```

### 13. Comment Resolved
**Event**: `comment-resolved`  
**Description**: Comment was resolved

**Payload**:
```json
{
  "sessionId": "uuid",
  "commentId": "uuid",
  "resolvedBy": "string",
  "resolvedAt": "2025-01-11T10:00:00Z"
}
```

### 14. Versions Provided
**Event**: `versions-provided`  
**Description**: Version history was provided

**Payload**:
```json
{
  "sessionId": "uuid",
  "versions": [
    {
      "id": "uuid",
      "versionNumber": 1,
      "content": "string",
      "createdBy": "string",
      "createdAt": "2025-01-11T10:00:00Z",
      "changeType": "manual"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### 15. Version Restored
**Event**: `version-restored`  
**Description**: Content was restored to a specific version

**Payload**:
```json
{
  "sessionId": "uuid",
  "versionId": "uuid",
  "content": "string",
  "restoredBy": "string",
  "restoredAt": "2025-01-11T10:00:00Z"
}
```

### 16. Conflict Detected
**Event**: `conflict-detected`  
**Description**: A conflict was detected during content update

**Payload**:
```json
{
  "sessionId": "uuid",
  "conflict": {
    "id": "uuid",
    "operation1": {
      "userId": "string",
      "operation": {},
      "timestamp": "2025-01-11T10:00:00Z"
    },
    "operation2": {
      "userId": "string",
      "operation": {},
      "timestamp": "2025-01-11T10:00:00Z"
    },
    "resolved": false
  }
}
```

### 17. Conflict Resolved
**Event**: `conflict-resolved`  
**Description**: A conflict was automatically resolved

**Payload**:
```json
{
  "sessionId": "uuid",
  "conflictId": "uuid",
  "resolution": {
    "type": "automatic" | "manual",
    "resolvedBy": "string",
    "resolvedAt": "2025-01-11T10:00:00Z",
    "finalContent": "string"
  }
}
```

### 18. Session Status Changed
**Event**: `session-status-changed`  
**Description**: Session status was changed

**Payload**:
```json
{
  "sessionId": "uuid",
  "oldStatus": "active",
  "newStatus": "paused",
  "changedBy": "string",
  "changedAt": "2025-01-11T10:00:00Z"
}
```

### 19. Error
**Event**: `error`  
**Description**: An error occurred

**Payload**:
```json
{
  "code": "string",
  "message": "string",
  "details": {}
}
```

### 20. Heartbeat
**Event**: `heartbeat`  
**Description**: Server heartbeat to maintain connection

**Payload**:
```json
{
  "timestamp": "2025-01-11T10:00:00Z"
}
```

## Error Handling

### Connection Errors
- **Invalid Token**: Connection rejected with error event
- **Unauthorized Access**: Connection rejected for unauthorized sessions
- **Rate Limiting**: Connection throttled for excessive requests

### Event Errors
- **Invalid Payload**: Error event with validation details
- **Session Not Found**: Error event for invalid session references
- **Permission Denied**: Error event for unauthorized actions

### Reconnection Strategy
- **Automatic Reconnection**: Client attempts to reconnect on disconnect
- **State Recovery**: Client requests current state on reconnection
- **Conflict Resolution**: Server handles conflicts during reconnection

## Rate Limiting

### Per-User Limits
- **Content Updates**: 10 per second
- **Cursor Updates**: 5 per second
- **Typing Events**: 2 per second
- **Comment Operations**: 5 per minute

### Per-Session Limits
- **Concurrent Users**: 10 per session
- **Total Events**: 1000 per minute per session

## Security Considerations

### Authentication
- JWT token validation on connection
- Session-based authorization for room access
- User permission validation for all operations

### Data Validation
- All payloads validated against schemas
- Content sanitization for XSS prevention
- Rate limiting to prevent abuse

### Privacy
- Users only receive events for their sessions
- Sensitive data not exposed in events
- Audit logging for all operations

---

**WebSocket Specification Status**: Complete  
**Next Steps**: Proceed to quickstart guide and task generation
