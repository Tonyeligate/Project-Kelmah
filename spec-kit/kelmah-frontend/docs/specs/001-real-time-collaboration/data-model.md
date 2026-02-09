# Data Model: Real-Time Job Collaboration

**Feature**: Real-Time Job Collaboration  
**Date**: 2025-01-11  
**Status**: Complete

## Entity Definitions

### 1. CollaborationSession

**Purpose**: Represents an active collaboration session between hirer and worker on a specific job posting

**Attributes**:
- `id`: String (UUID) - Unique session identifier
- `jobId`: String (ObjectId) - Reference to job posting
- `hirerId`: String (ObjectId) - Reference to hirer user
- `workerId`: String (ObjectId) - Reference to worker user
- `status`: Enum - `active`, `paused`, `completed`, `cancelled`
- `createdAt`: Date - Session creation timestamp
- `updatedAt`: Date - Last activity timestamp
- `lastActivity`: Date - Last user interaction
- `settings`: Object - Collaboration preferences (auto-save, notifications, etc.)

**Relationships**:
- `belongsTo`: Job (one-to-one)
- `belongsTo`: User (hirer, one-to-one)
- `belongsTo`: User (worker, one-to-one)
- `hasMany`: CollaborationComment (one-to-many)
- `hasMany`: JobRequirementVersion (one-to-many)
- `hasMany`: UserPresence (one-to-many)

**Validation Rules**:
- `jobId` must reference existing job
- `hirerId` and `workerId` must be different users
- `status` must be one of defined enum values
- `createdAt` must be before `updatedAt`
- `lastActivity` must be within last 24 hours for active sessions

**State Transitions**:
- `created` → `active` (when first user joins)
- `active` → `paused` (when all users leave)
- `paused` → `active` (when user rejoins)
- `active` → `completed` (when collaboration is finished)
- `active` → `cancelled` (when collaboration is terminated)

### 2. JobRequirementVersion

**Purpose**: Represents a snapshot of job requirements at a specific point in time

**Attributes**:
- `id`: String (UUID) - Unique version identifier
- `sessionId`: String (UUID) - Reference to collaboration session
- `versionNumber`: Number - Sequential version number
- `content`: String - Full job requirements content
- `delta`: Object - Changes from previous version (for OT)
- `createdBy`: String (ObjectId) - User who created this version
- `createdAt`: Date - Version creation timestamp
- `changeType`: Enum - `manual`, `auto_save`, `conflict_resolution`
- `metadata`: Object - Additional version information

**Relationships**:
- `belongsTo`: CollaborationSession (many-to-one)
- `belongsTo`: User (createdBy, many-to-one)
- `hasMany`: ChangeEvent (one-to-many)

**Validation Rules**:
- `versionNumber` must be positive integer
- `content` must not be empty
- `createdBy` must reference existing user
- `createdAt` must be after session creation
- `delta` must be valid OT operation

**State Transitions**:
- `draft` → `saved` (when user saves changes)
- `saved` → `published` (when job is published)
- `published` → `archived` (when job is completed/cancelled)

### 3. CollaborationComment

**Purpose**: Represents a comment made by a user on a specific section of job requirements

**Attributes**:
- `id`: String (UUID) - Unique comment identifier
- `sessionId`: String (UUID) - Reference to collaboration session
- `authorId`: String (ObjectId) - User who wrote the comment
- `content`: String - Comment text content
- `position`: Object - Position in document (line, column, range)
- `parentCommentId`: String (UUID) - Reference to parent comment (for replies)
- `status`: Enum - `active`, `resolved`, `deleted`
- `createdAt`: Date - Comment creation timestamp
- `updatedAt`: Date - Last modification timestamp
- `resolvedAt`: Date - When comment was resolved
- `resolvedBy`: String (ObjectId) - User who resolved the comment

**Relationships**:
- `belongsTo`: CollaborationSession (many-to-one)
- `belongsTo`: User (author, many-to-one)
- `belongsTo`: User (resolvedBy, many-to-one)
- `belongsTo`: CollaborationComment (parent, self-referential)
- `hasMany`: CollaborationComment (replies, self-referential)

**Validation Rules**:
- `content` must not be empty and max 1000 characters
- `position` must be valid document position
- `authorId` must reference existing user
- `parentCommentId` must reference existing comment if provided
- `resolvedAt` must be after `createdAt` if status is resolved

**State Transitions**:
- `draft` → `active` (when comment is posted)
- `active` → `resolved` (when comment is addressed)
- `active` → `deleted` (when comment is removed)
- `resolved` → `active` (when comment is reopened)

### 4. UserPresence

**Purpose**: Represents the current status of a user in a collaboration session

**Attributes**:
- `id`: String (UUID) - Unique presence identifier
- `sessionId`: String (UUID) - Reference to collaboration session
- `userId`: String (ObjectId) - Reference to user
- `status`: Enum - `online`, `editing`, `idle`, `offline`
- `currentPosition`: Object - Current cursor position in document
- `lastSeen`: Date - Last activity timestamp
- `isTyping`: Boolean - Whether user is currently typing
- `typingSince`: Date - When typing started
- `deviceInfo`: Object - Client device information

**Relationships**:
- `belongsTo`: CollaborationSession (many-to-one)
- `belongsTo`: User (many-to-one)

**Validation Rules**:
- `userId` must reference existing user
- `status` must be one of defined enum values
- `lastSeen` must be recent (within 5 minutes for online status)
- `typingSince` must be before `lastSeen` if `isTyping` is true

**State Transitions**:
- `offline` → `online` (when user connects)
- `online` → `editing` (when user starts editing)
- `editing` → `idle` (when user stops editing)
- `idle` → `offline` (when user disconnects)

### 5. ChangeEvent

**Purpose**: Represents a specific change made to job requirements with full attribution

**Attributes**:
- `id`: String (UUID) - Unique event identifier
- `sessionId`: String (UUID) - Reference to collaboration session
- `versionId`: String (UUID) - Reference to job requirement version
- `userId`: String (ObjectId) - User who made the change
- `operation`: Object - OT operation details (type, position, content)
- `timestamp`: Date - When change occurred
- `clientId`: String - Client session identifier
- `conflictResolved`: Boolean - Whether this change resolved a conflict
- `metadata`: Object - Additional change information

**Relationships**:
- `belongsTo`: CollaborationSession (many-to-one)
- `belongsTo`: JobRequirementVersion (many-to-one)
- `belongsTo`: User (many-to-one)

**Validation Rules**:
- `userId` must reference existing user
- `operation` must be valid OT operation
- `timestamp` must be recent (within last hour)
- `clientId` must be valid UUID

## Database Schema

### MongoDB Collections

#### collaboration_sessions
```javascript
{
  _id: ObjectId,
  id: String (UUID, unique),
  jobId: ObjectId (ref: 'jobs'),
  hirerId: ObjectId (ref: 'users'),
  workerId: ObjectId (ref: 'users'),
  status: String (enum),
  createdAt: Date,
  updatedAt: Date,
  lastActivity: Date,
  settings: Object
}
```

#### job_requirement_versions
```javascript
{
  _id: ObjectId,
  id: String (UUID, unique),
  sessionId: String (UUID, ref: 'collaboration_sessions.id'),
  versionNumber: Number,
  content: String,
  delta: Object,
  createdBy: ObjectId (ref: 'users'),
  createdAt: Date,
  changeType: String (enum),
  metadata: Object
}
```

#### collaboration_comments
```javascript
{
  _id: ObjectId,
  id: String (UUID, unique),
  sessionId: String (UUID, ref: 'collaboration_sessions.id'),
  authorId: ObjectId (ref: 'users'),
  content: String,
  position: Object,
  parentCommentId: String (UUID, ref: 'collaboration_comments.id'),
  status: String (enum),
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date,
  resolvedBy: ObjectId (ref: 'users')
}
```

#### user_presence
```javascript
{
  _id: ObjectId,
  id: String (UUID, unique),
  sessionId: String (UUID, ref: 'collaboration_sessions.id'),
  userId: ObjectId (ref: 'users'),
  status: String (enum),
  currentPosition: Object,
  lastSeen: Date,
  isTyping: Boolean,
  typingSince: Date,
  deviceInfo: Object
}
```

#### change_events
```javascript
{
  _id: ObjectId,
  id: String (UUID, unique),
  sessionId: String (UUID, ref: 'collaboration_sessions.id'),
  versionId: String (UUID, ref: 'job_requirement_versions.id'),
  userId: ObjectId (ref: 'users'),
  operation: Object,
  timestamp: Date,
  clientId: String,
  conflictResolved: Boolean,
  metadata: Object
}
```

### Redis Keys

#### Session State
- `collaboration:session:{sessionId}:state` - Current collaboration state
- `collaboration:session:{sessionId}:users` - Active users in session
- `collaboration:session:{sessionId}:presence` - User presence information

#### Version Cache
- `collaboration:version:{sessionId}:latest` - Latest version content
- `collaboration:version:{sessionId}:recent` - Recent versions (last 10)

#### Real-time State
- `collaboration:typing:{sessionId}` - Users currently typing
- `collaboration:cursor:{sessionId}:{userId}` - User cursor positions

## Indexes

### MongoDB Indexes

#### collaboration_sessions
- `{ jobId: 1 }` - Find sessions by job
- `{ hirerId: 1, status: 1 }` - Find active sessions by hirer
- `{ workerId: 1, status: 1 }` - Find active sessions by worker
- `{ lastActivity: 1 }` - Find stale sessions for cleanup

#### job_requirement_versions
- `{ sessionId: 1, versionNumber: 1 }` - Find versions by session
- `{ createdBy: 1, createdAt: -1 }` - Find versions by user
- `{ createdAt: -1 }` - Find recent versions

#### collaboration_comments
- `{ sessionId: 1, createdAt: -1 }` - Find comments by session
- `{ authorId: 1, status: 1 }` - Find comments by author
- `{ parentCommentId: 1 }` - Find comment replies

#### user_presence
- `{ sessionId: 1, status: 1 }` - Find active users in session
- `{ userId: 1, lastSeen: -1 }` - Find user activity

#### change_events
- `{ sessionId: 1, timestamp: -1 }` - Find events by session
- `{ userId: 1, timestamp: -1 }` - Find events by user

## Data Validation

### Mongoose Schemas

```javascript
// CollaborationSession Schema
const collaborationSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  hirerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  settings: { type: Object, default: {} }
});

// JobRequirementVersion Schema
const jobRequirementVersionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true },
  versionNumber: { type: Number, required: true, min: 1 },
  content: { type: String, required: true, minlength: 1 },
  delta: { type: Object, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  changeType: { 
    type: String, 
    enum: ['manual', 'auto_save', 'conflict_resolution'],
    default: 'manual'
  },
  metadata: { type: Object, default: {} }
});
```

## Data Relationships

### Entity Relationship Diagram

```
CollaborationSession (1) ── (1) Job
CollaborationSession (1) ── (1) User (hirer)
CollaborationSession (1) ── (1) User (worker)
CollaborationSession (1) ── (0..*) JobRequirementVersion
CollaborationSession (1) ── (0..*) CollaborationComment
CollaborationSession (1) ── (0..*) UserPresence
JobRequirementVersion (1) ── (0..*) ChangeEvent
CollaborationComment (1) ── (0..*) CollaborationComment (replies)
User (1) ── (0..*) CollaborationComment (author)
User (1) ── (0..*) UserPresence
User (1) ── (0..*) ChangeEvent
```

## Data Migration Strategy

### Initial Data Setup
1. Create collaboration service database
2. Set up MongoDB collections with indexes
3. Configure Redis for real-time state
4. Migrate existing job data if needed

### Version History Migration
1. Create initial snapshots for existing jobs
2. Set up delta storage for future changes
3. Configure version retention policies
4. Test data integrity and performance

### Data Cleanup
1. Archive completed collaboration sessions
2. Remove old version history (30+ days)
3. Clean up stale presence data
4. Optimize database performance

---

**Data Model Status**: Complete  
**Next Steps**: Proceed to contract generation and API design
