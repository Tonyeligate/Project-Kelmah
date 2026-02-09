/**
 * Simple Audit Logger for Messaging Service
 * Logs important events for security and compliance
 */

class AuditLogger {
  constructor() {
    this.enabled = process.env.AUDIT_LOGGING_ENABLED !== 'false';
  }
  
  /**
   * Log audit event
   * @param {Object} event - Audit event data
   */
  async log(event) {
    if (!this.enabled) return;
    
    try {
      const auditEntry = {
        timestamp: event.timestamp || new Date().toISOString(),
        userId: event.userId || 'anonymous',
        action: event.action,
        details: event.details || {},
        ipAddress: event.ipAddress || 'unknown',
        userAgent: event.userAgent || 'unknown',
        sessionId: event.sessionId || null,
        requestId: event.requestId || null,
        severity: this.getSeverity(event.action),
        source: 'messaging-service'
      };
      
      // Log to console (can be extended to file/database)
      console.log('AUDIT:', JSON.stringify(auditEntry));
      
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }
  
  /**
   * Get severity level for action
   * @param {string} action - Action performed
   * @returns {string} Severity level
   */
  getSeverity(action) {
    const severityMap = {
      'MESSAGE_SENT': 'low',
      'USER_CONNECTED': 'medium',
      'USER_DISCONNECTED': 'medium',
      'TYPING_START': 'low',
      'TYPING_STOP': 'low',
      'READ_RECEIPT': 'low',
      'JOIN_CONVERSATION': 'medium',
      'LEAVE_CONVERSATION': 'medium'
    };
    
    return severityMap[action] || 'medium';
  }
}

// Export singleton instance
module.exports = new AuditLogger();