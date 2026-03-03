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

    // Initialize storage with error recovery
    this.initializeStorage();

    // MED-26 FIX: Store interval reference so it can be cleared
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredData();
      },
      60 * 60 * 1000,
    ); // Every hour
  }

  /**
   * Clean up resources (call on app teardown)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Initialize storage with error recovery
   */
  initializeStorage() {
    try {
      // Try to access storage to detect corruption early
      this.cleanupExpiredData();
    } catch (error) {
      console.warn(
        'Storage initialization failed, performing recovery:',
        error.message,
      );
      this.performStorageRecovery();
    }
  }

  /**
   * Recover from storage corruption
   */
  performStorageRecovery() {
    try {
      console.log('Performing storage recovery...');

      // Clear all Kelmah-related localStorage keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('kelmah') ||
            key.includes('auth') ||
            key.includes('token'))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (removeError) {
          console.warn(
            'Failed to remove key during recovery:',
            key,
            removeError,
          );
        }
      });

      // Regenerate encryption key
      this.encryptionKey = this.generateEncryptionKey();

      console.log('Storage recovery completed');
      return true;
    } catch (error) {
      console.error('Storage recovery failed:', error);
      return false;
    }
  }

  /**
   * Generate encryption key based on browser fingerprint + persistent secret
   */
  generateEncryptionKey() {
    const secret = this.getOrCreatePersistentSecret();
    // Only use stable properties — avoid volatile ones (screen size, timezone, platform)
    // that change when switching monitors, traveling, or on modern browsers
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      secret,
    ].join('|');

    return CryptoJS.SHA256(fingerprint).toString();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const sessionId =
      'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('session_id', sessionId);
    return sessionId;
  }

  /**
   * Get or create a persistent secret.
   *
   * SECURITY NOTE: This secret is stored client-side and provides DATA OBFUSCATION
   * only — not true encryption-at-rest security. Any XSS attack can read both the
   * ciphertext and this key. Real token protection relies on CSP, HttpOnly cookies,
   * and short-lived tokens enforced server-side.
   *
   * The secret is stored in localStorage (not sessionStorage) so that multiple
   * tabs can decrypt the same encrypted auth data. Using sessionStorage caused a
   * critical P0 bug: each tab generated a different key, making it impossible to
   * decrypt the shared localStorage auth tokens from a second tab.
   */
  getOrCreatePersistentSecret() {
    try {
      const keyName = 'kelmah_encryption_secret';
      // Use localStorage so ALL tabs share the same encryption key.
      // This is required because encrypted data lives in localStorage.
      let secret = localStorage.getItem(keyName);
      if (!secret) {
        // Migrate from sessionStorage if the key was previously stored there
        const legacy = sessionStorage.getItem(keyName);
        if (legacy) {
          secret = legacy;
          localStorage.setItem(keyName, secret);
          sessionStorage.removeItem(keyName); // clean up old location
        } else {
          secret = 'ksec_' + CryptoJS.lib.WordArray.random(32).toString();
          localStorage.setItem(keyName, secret);
        }
      }
      return secret;
    } catch (error) {
      console.warn(
        'localStorage unavailable, using session-scoped secret:',
        error?.message || error,
      );
      // Fallback to sessionStorage if localStorage is blocked
      return sessionStorage.getItem('session_id') || this.generateSessionId();
    }
  }

  /**
   * Encrypt data
   */
  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(
        jsonString,
        this.encryptionKey,
      ).toString();
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
      if (!encryptedData || encryptedData.trim() === '') {
        console.warn('Empty or null encrypted data provided');
        return null;
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonString || jsonString.trim() === '') {
        console.warn(
          'Decryption resulted in empty string - possibly wrong key or corrupted data',
        );
        return null;
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.warn(
        'Decryption failed, clearing corrupted storage:',
        error.message,
      );
      // Clear the corrupted data immediately
      try {
        localStorage.removeItem(this.storageKey);
      } catch (clearError) {
        console.error('Failed to clear corrupted storage:', clearError);
      }
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
        _version: '1.0',
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
  setItem(key, value, ttl = this.maxAge) {
    const currentData = this.getSecureData();
    currentData[key] = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    return this.setSecureData(currentData);
  }

  /**
   * Get a specific key from secure storage
   */
  getItem(key, maxAge) {
    const data = this.getSecureData();
    const item = data[key];

    if (!item) {
      return null;
    }
    const storedTtl = typeof item.ttl === 'number' ? item.ttl : this.maxAge;
    const effectiveTtl =
      maxAge === undefined
        ? storedTtl
        : Math.min(storedTtl, maxAge ?? storedTtl);

    // Check if item has expired
    if (
      effectiveTtl !== Infinity &&
      Date.now() - item.timestamp > effectiveTtl
    ) {
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
   * Clear all secure data.
   * CRIT-09 FIX: Only clear stored data, NOT the encryption key.
   * Removing the key breaks other tabs that still have data encrypted with it.
   * Use BroadcastChannel to notify other tabs of the logout.
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      // CRIT-09: Do NOT remove encryption key — other tabs may still need it
      // localStorage.removeItem('kelmah_encryption_secret');  // REMOVED
      sessionStorage.removeItem('session_id');

      // Notify other tabs about the logout via BroadcastChannel
      try {
        const channel = new BroadcastChannel('kelmah_auth');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      } catch (_) { /* BroadcastChannel not supported in older browsers */ }

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

      Object.keys(data).forEach((key) => {
        if (key.startsWith('_')) return; // Skip metadata

        const item = data[key];
        const storedTtl =
          item && typeof item.ttl === 'number' ? item.ttl : this.maxAge;
        if (
          item &&
          item.timestamp &&
          storedTtl !== Infinity &&
          Date.now() - item.timestamp > storedTtl
        ) {
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
      keys: Object.keys(data).filter((key) => !key.startsWith('_')),
      totalItems: Object.keys(data).filter((key) => !key.startsWith('_'))
        .length,
      lastUpdated: data._timestamp,
      version: data._version,
      isSecureContext: this.isSecureContext(),
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
