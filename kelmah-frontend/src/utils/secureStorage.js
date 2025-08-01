/**
 * Secure Storage Utility
 * 
 * Provides secure client-side storage for sensitive data like tokens
 * with encryption, automatic cleanup, and security best practices.
 */

import CryptoJS from 'crypto-js';

class SecureStorage {
  constructor() {
    this.storageKey = 'kelmah_secure_data';
    this.encryptionKey = this.generateEncryptionKey();
    this.maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Initialize storage cleanup
    this.cleanupExpiredData();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Generate encryption key based on browser fingerprint
   */
  generateEncryptionKey() {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform,
      // Add session-specific component for extra security
      sessionStorage.getItem('session_id') || this.generateSessionId()
    ].join('|');

    return CryptoJS.SHA256(fingerprint).toString();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('session_id', sessionId);
    return sessionId;
  }

  /**
   * Encrypt data
   */
  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Get all secure data
   */
  getSecureData() {
    try {
      const encryptedData = localStorage.getItem(this.storageKey);
      if (!encryptedData) {
        return {};
      }

      const decryptedData = this.decrypt(encryptedData);
      if (!decryptedData) {
        // Clear corrupted data
        this.clear();
        return {};
      }

      return decryptedData;
    } catch (error) {
      console.error('Failed to get secure data:', error);
      this.clear();
      return {};
    }
  }

  /**
   * Set secure data
   */
  setSecureData(data) {
    try {
      const dataWithTimestamp = {
        ...data,
        _timestamp: Date.now(),
        _version: '1.0'
      };

      const encrypted = this.encrypt(dataWithTimestamp);
      if (encrypted) {
        localStorage.setItem(this.storageKey, encrypted);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to set secure data:', error);
      return false;
    }
  }

  /**
   * Set a specific key in secure storage
   */
  setItem(key, value) {
    const currentData = this.getSecureData();
    currentData[key] = {
      value,
      timestamp: Date.now()
    };
    return this.setSecureData(currentData);
  }

  /**
   * Get a specific key from secure storage
   */
  getItem(key, maxAge = this.maxAge) {
    const data = this.getSecureData();
    const item = data[key];

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > maxAge) {
      this.removeItem(key);
      return null;
    }

    return item.value;
  }

  /**
   * Remove a specific key from secure storage
   */
  removeItem(key) {
    const currentData = this.getSecureData();
    delete currentData[key];
    return this.setSecureData(currentData);
  }

  /**
   * Clear all secure data
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem('session_id');
      return true;
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      return false;
    }
  }

  /**
   * Clean up expired data
   */
  cleanupExpiredData() {
    try {
      const data = this.getSecureData();
      let hasChanges = false;

      Object.keys(data).forEach(key => {
        if (key.startsWith('_')) return; // Skip metadata

        const item = data[key];
        if (item && item.timestamp && Date.now() - item.timestamp > this.maxAge) {
          delete data[key];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.setSecureData(data);
      }
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  // Auth-specific methods
  setAuthToken(token) {
    return this.setItem('auth_token', token);
  }

  getAuthToken() {
    return this.getItem('auth_token', 2 * 60 * 60 * 1000); // 2 hours for auth token
  }

  setRefreshToken(token) {
    return this.setItem('refresh_token', token, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  getRefreshToken() {
    return this.getItem('refresh_token', 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  setUserData(userData) {
    return this.setItem('user_data', userData);
  }

  getUserData() {
    return this.getItem('user_data');
  }

  // Security methods
  isSecureContext() {
    return window.isSecureContext || location.protocol === 'https:';
  }

  getStorageInfo() {
    const data = this.getSecureData();
    return {
      keys: Object.keys(data).filter(key => !key.startsWith('_')),
      totalItems: Object.keys(data).filter(key => !key.startsWith('_')).length,
      lastUpdated: data._timestamp,
      version: data._version,
      isSecureContext: this.isSecureContext()
    };
  }

  // Validation methods
  validateData() {
    try {
      const data = this.getSecureData();
      
      // Check if data structure is valid
      if (typeof data !== 'object') {
        return false;
      }

      // Check if we can decrypt and re-encrypt
      const testKey = 'validation_test';
      const testValue = { test: true, timestamp: Date.now() };
      
      this.setItem(testKey, testValue);
      const retrieved = this.getItem(testKey);
      this.removeItem(testKey);

      return retrieved && retrieved.test === true;
    } catch (error) {
      console.error('Storage validation failed:', error);
      return false;
    }
  }

  // Migration methods (for future use)
  migrate(fromVersion, toVersion) {
    console.log(`Migrating secure storage from ${fromVersion} to ${toVersion}`);
    // Future migration logic here
  }
}

// Create singleton instance
const secureStorage = new SecureStorage();

// Validate storage on initialization
if (!secureStorage.validateData()) {
  console.warn('Secure storage validation failed, clearing data');
  secureStorage.clear();
}

export { secureStorage };
export default secureStorage;