/**
 * Shared Models Index - MongoDB/Mongoose Only
 * Centralized model exports for CROSS-SERVICE models only
 * 
 * ⚠️ BEST PRACTICE: Only models used by MULTIPLE services should be here
 * Service-specific models belong in their respective service directories
 */

const User = require('./User');
const Job = require('./Job');
const Application = require('./Application');

// ❌ REMOVED: Portfolio (only user-service) - moved to user-service/models/
// ❌ REMOVED: Conversation (only messaging-service) - should move to messaging-service/models/
// ❌ REMOVED: Message (only messaging-service) - should move to messaging-service/models/
// ❌ REMOVED: Notification (only messaging-service) - should move to messaging-service/models/
// ❌ REMOVED: SavedJob (only job-service) - should move to job-service/models/
// ❌ REMOVED: RefreshToken (only auth-service) - should move to auth-service/models/

// Export only cross-service models
module.exports = {
  User,        // ✅ Used by: auth, user, job, messaging, review, payment
  Job,         // ✅ Used by: job, review, payment
  Application  // ✅ Used by: job, review, payment
};