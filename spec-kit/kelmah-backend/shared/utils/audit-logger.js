/**
 * Audit Logger Utility
 * Centralized audit logging for security and compliance
 */

const fs = require('fs').promises;
const path = require('path');

class AuditLogger {
  constructor() {
    this.logDir = process.env.AUDIT_LOG_DIR || path.join(__dirname, '../../logs/audit');
    this.maxFileSize = parseInt(process.env.AUDIT_MAX_FILE_SIZE || '10485760'); // 10MB
    this.maxFiles = parseInt(process.env.AUDIT_MAX_FILES || '30');
    this.enabled = process.env.AUDIT_LOGGING_ENABLED !== 'false';
    
    this.initializeLogDirectory();
  }
  
  /**
   * Initialize log directory
   */
  async initializeLogDirectory() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }
  
  /**
   * Log audit event
   * @param {Object} event - Audit event data
   * @param {string} event.userId - User ID
   * @param {string} event.action - Action performed
   * @param {Object} event.details - Additional details
   * @param {string} event.ipAddress - IP address
   * @param {string} event.userAgent - User agent
   * @param {Date} event.timestamp - Custom timestamp (optional)
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
        source: 'kelmah-backend'
      };
      
      // Add to database if available
      await this.logToDatabase(auditEntry);
      
      // Add to file
      await this.logToFile(auditEntry);
      
      // Send to external systems if configured
      await this.logToExternalSystems(auditEntry);
      
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit logging failure shouldn't break the application
    }
  }
  
  /**
   * Log to database
   * @param {Object} auditEntry - Audit entry
   */
  async logToDatabase(auditEntry) {
    try {
      // TODO: Implement AuditLog model in shared/models if database logging needed
      // For now, skip database logging to maintain microservice boundaries
      console.log('Audit entry (DB logging disabled):', JSON.stringify(auditEntry, null, 2));
    } catch (error) {
      // Fallback to console if database logging fails
      console.log('Audit DB log failed, using console:', error.message);
    }
  }
  
  /**
   * Log to file
   * @param {Object} auditEntry - Audit entry
   */
  async logToFile(auditEntry) {
    const logFileName = `audit-${new Date().toISOString().split('T')[0]}.log`;
    const logFilePath = path.join(this.logDir, logFileName);
    
    const logLine = JSON.stringify(auditEntry) + '\n';
    
    try {
      // Check file size and rotate if necessary
      await this.rotateLogIfNeeded(logFilePath);
      
      // Append to log file
      await fs.appendFile(logFilePath, logLine, 'utf8');
    } catch (error) {
      console.error('File audit logging failed:', error);
    }
  }
  
  /**
   * Log to external systems (SIEM, monitoring, etc.)
   * @param {Object} auditEntry - Audit entry
   */
  async logToExternalSystems(auditEntry) {
    // Implement integrations with external systems
    // Examples: Splunk, ELK Stack, Datadog, etc.
    
    if (process.env.WEBHOOK_AUDIT_URL) {
      try {
        const axios = require('axios');
        await axios.post(process.env.WEBHOOK_AUDIT_URL, auditEntry, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WEBHOOK_AUDIT_TOKEN}`
          }
        });
      } catch (error) {
        console.error('Webhook audit logging failed:', error.message);
      }
    }
  }
  
  /**
   * Rotate log file if it exceeds max size
   * @param {string} logFilePath - Path to log file
   */
  async rotateLogIfNeeded(logFilePath) {
    try {
      const stats = await fs.stat(logFilePath);
      
      if (stats.size >= this.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = `${logFilePath}.${timestamp}`;
        
        await fs.rename(logFilePath, rotatedPath);
        
        // Clean up old files
        await this.cleanupOldLogs();
      }
    } catch (error) {
      // File doesn't exist yet, which is fine
      if (error.code !== 'ENOENT') {
        console.error('Log rotation error:', error);
      }
    }
  }
  
  /**
   * Clean up old log files
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.startsWith('audit-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          time: 0 // Will be populated below
        }));
      
      // Get file stats
      for (const file of logFiles) {
        try {
          const stats = await fs.stat(file.path);
          file.time = stats.mtime.getTime();
        } catch (error) {
          console.error(`Error getting stats for ${file.name}:`, error);
        }
      }
      
      // Sort by modification time (newest first)
      logFiles.sort((a, b) => b.time - a.time);
      
      // Remove files beyond the maximum count
      if (logFiles.length > this.maxFiles) {
        const filesToDelete = logFiles.slice(this.maxFiles);
        
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file.path);
            console.log(`Deleted old audit log: ${file.name}`);
          } catch (error) {
            console.error(`Error deleting ${file.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }
  
  /**
   * Get severity level for action
   * @param {string} action - Action performed
   * @returns {string} Severity level
   */
  getSeverity(action) {
    const severityMap = {
      // Critical actions
      'USER_DELETED': 'critical',
      'ADMIN_LOGIN': 'critical',
      'PASSWORD_RESET': 'critical',
      'ACCOUNT_LOCKED': 'critical',
      'PAYMENT_PROCESSED': 'critical',
      'CONTRACT_SIGNED': 'critical',
      
      // High severity
      'USER_LOGIN': 'high',
      'USER_LOGOUT': 'high',
      'PASSWORD_CHANGED': 'high',
      'EMAIL_VERIFIED': 'high',
      'TOKEN_REFRESH': 'high',
      'PAYMENT_INITIATED': 'high',
      
      // Medium severity
      'USER_CREATED': 'medium',
      'USER_UPDATED': 'medium',
      'PROFILE_UPDATED': 'medium',
      'JOB_POSTED': 'medium',
      'APPLICATION_SUBMITTED': 'medium',
      
      // Low severity
      'USER_VIEW': 'low',
      'SEARCH_PERFORMED': 'low',
      'MESSAGE_SENT': 'low',
      'NOTIFICATION_SENT': 'low'
    };
    
    return severityMap[action] || 'medium';
  }
  
  /**
   * Query audit logs
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Audit log entries
   */
  async query(filters = {}, options = {}) {
    try {
      // TODO: Implement AuditLog model in shared/models with MongoDB if database querying needed
      // For now, use file-based search to maintain microservice boundaries
      return await this.queryFromFiles(filters, options);
      
    } catch (error) {
      console.error('Audit log query error:', error);
      return [];
    }
  }
  
  /**
   * Query audit logs from files (fallback)
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Audit log entries
   */
  async queryFromFiles(filters = {}, options = {}) {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.startsWith('audit-') && file.endsWith('.log'))
        .sort()
        .reverse(); // Newest first
      
      const results = [];
      const limit = options.limit || 100;
      
      for (const file of logFiles) {
        if (results.length >= limit) break;
        
        const filePath = path.join(this.logDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line);
        
        for (const line of lines) {
          if (results.length >= limit) break;
          
          try {
            const entry = JSON.parse(line);
            
            // Apply filters
            if (filters.userId && entry.userId !== filters.userId) continue;
            if (filters.action && entry.action !== filters.action) continue;
            if (filters.ipAddress && entry.ipAddress !== filters.ipAddress) continue;
            if (filters.startDate && new Date(entry.timestamp) < new Date(filters.startDate)) continue;
            if (filters.endDate && new Date(entry.timestamp) > new Date(filters.endDate)) continue;
            
            results.push(entry);
          } catch (parseError) {
            console.error('Error parsing audit log line:', parseError);
          }
        }
      }
      
      return results.slice(options.offset || 0, (options.offset || 0) + limit);
      
    } catch (error) {
      console.error('File-based audit query error:', error);
      return [];
    }
  }
  
  /**
   * Get audit statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(filters = {}) {
    try {
      // TODO: Implement AuditLog model in shared/models with MongoDB if statistics needed
      // For now, return empty statistics to maintain microservice boundaries
      return { totalEvents: 0, byAction: {}, bySeverity: {} };
      
    } catch (error) {
      console.error('Audit statistics error:', error);
      return { totalEvents: 0, byAction: {}, bySeverity: {} };
    }
  }
}

// Export singleton instance
module.exports = new AuditLogger();