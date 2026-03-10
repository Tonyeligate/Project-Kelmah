/**
 * Secure Storage Utility
 *
 * Provides secure client-side storage for sensitive data like tokens
 * with encryption, automatic cleanup, and security best practices.
 */

import CryptoJS from 'crypto-js';

const AUTH_TOKEN_TTL = 2 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;
const SHOULD_START_CLEANUP_INTERVAL =
  typeof process === 'undefined' || process.env.NODE_ENV !== 'test';

class SecureStorage {
  constructor() {
    this.storageKey = 'kelmah_secure_data';
    this.sessionStorageKey = 'kelmah_secure_session_data';
    this.encryptionKey = this.generateEncryptionKey();
    this.maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Initialize storage with error recovery
    this.initializeStorage();

    // MED-26 FIX: Store interval reference so it can be cleared
    this.cleanupInterval = null;
    if (SHOULD_START_CLEANUP_INTERVAL) {
      this.cleanupInterval = setInterval(
        () => {
          this.cleanupExpiredData();
        },
        60 * 60 * 1000,
      ); // Every hour
    }
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
      if (import.meta.env.DEV) console.warn(
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
      if (import.meta.env.DEV) console.log('Performing storage recovery...');

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
          if (import.meta.env.DEV) console.warn(
            'Failed to remove key during recovery:',
            key,
            removeError,
          );
        }
      });

      // Regenerate encryption key
      this.encryptionKey = this.generateEncryptionKey();

      if (import.meta.env.DEV) console.log('Storage recovery completed');
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Storage recovery failed:', error);
      return false;
    }
  }

  /**
   * Generate encryption key based on browser fingerprint + persistent secret
   */
  generateEncryptionKey() {
    const secret = this.getOrCreatePersistentSecret();
    // Use ONLY the persistent secret for key derivation.
    // Volatile browser properties (userAgent, language) change on updates/locale
    // switches, silently breaking decryption of stored tokens.
    return CryptoJS.SHA256(secret).toString();
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
      if (import.meta.env.DEV) console.warn(
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
      if (import.meta.env.DEV) console.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData) {
    try {
      if (!encryptedData || encryptedData.trim() === '') {
        if (import.meta.env.DEV) console.warn('Empty or null encrypted data provided');
        return null;
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonString || jsonString.trim() === '') {
        if (import.meta.env.DEV) console.warn(
          'Decryption resulted in empty string - possibly wrong key or corrupted data',
        );
        return null;
      }

      return JSON.parse(jsonString);
    } catch (error) {
      if (import.meta.env.DEV) console.warn(
        'Decryption failed, clearing corrupted storage:',
        error.message,
      );
      // Clear the corrupted data immediately
      try {
        localStorage.removeItem(this.storageKey);
      } catch (clearError) {
        if (import.meta.env.DEV) console.error('Failed to clear corrupted storage:', clearError);
      }
      return null;
    }
  }

  /**
   * Get all secure data
   */
  getSecureData() {
    const sessionData = this.getScopedSecureData(false);
    const persistentData = this.getScopedSecureData(true);

    return {
      ...persistentData,
      ...sessionData,
    };
  }

  getScopedStorage(persistent = true) {
    return persistent ? localStorage : sessionStorage;
  }

  getScopedStorageKey(persistent = true) {
    return persistent ? this.storageKey : this.sessionStorageKey;
  }

  getScopedSecureData(persistent = true) {
    try {
      const storage = this.getScopedStorage(persistent);
      const encryptedData = storage.getItem(this.getScopedStorageKey(persistent));
      if (!encryptedData) {
        return {};
      }

      const decryptedData = this.decrypt(encryptedData);
      if (!decryptedData) {
        storage.removeItem(this.getScopedStorageKey(persistent));
        return {};
      }

      return decryptedData;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to get secure data:', error);
      this.clear();
      return {};
    }
  }

  /**
   * Set secure data
   */
  setSecureData(data, persistent = true) {
    try {
      const dataWithTimestamp = {
        ...data,
        _timestamp: Date.now(),
        _version: '1.0',
      };

      const encrypted = this.encrypt(dataWithTimestamp);
      if (encrypted) {
        this.getScopedStorage(persistent).setItem(
          this.getScopedStorageKey(persistent),
          encrypted,
        );
        return true;
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to set secure data:', error);
      return false;
    }
  }

  /**
   * Set a specific key in secure storage
   */
  hasItemInScope(key, persistent = true) {
    const data = this.getScopedSecureData(persistent);
    return Boolean(data[key]);
  }

  getPreferredScopeForKey(key) {
    if (this.hasItemInScope(key, false)) {
      return false;
    }

    if (this.hasItemInScope(key, true)) {
      return true;
    }

    return true;
  }

  removeItemFromScope(key, persistent = true) {
    const currentData = this.getScopedSecureData(persistent);
    if (!currentData[key]) {
      return false;
    }

    delete currentData[key];
    this.setSecureData(currentData, persistent);
    return true;
  }

  setItem(key, value, ttl = this.maxAge, options = {}) {
    const persistent =
      typeof options.persistent === 'boolean'
        ? options.persistent
        : this.getPreferredScopeForKey(key);
    const currentData = this.getScopedSecureData(persistent);
    this.removeItemFromScope(key, !persistent);
    currentData[key] = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    return this.setSecureData(currentData, persistent);
  }

  /**
   * Get a specific key from secure storage
   */
  getItem(key, maxAge) {
    const readItem = (persistent) => {
      const data = this.getScopedSecureData(persistent);
      const item = data[key];

      if (!item) {
        return null;
      }

      const storedTtl = typeof item.ttl === 'number' ? item.ttl : this.maxAge;
      const effectiveTtl =
        maxAge === undefined
          ? storedTtl
          : Math.min(storedTtl, maxAge ?? storedTtl);

      if (
        effectiveTtl !== Infinity &&
        Date.now() - item.timestamp > effectiveTtl
      ) {
        this.removeItemFromScope(key, persistent);
        return null;
      }

      return item.value;
    };

    const sessionValue = readItem(false);
    if (sessionValue !== null) {
      return sessionValue;
    }

    return readItem(true);
  }

  /**
   * Remove a specific key from secure storage
   */
  removeItem(key) {
    [false, true].forEach((persistent) => {
      this.removeItemFromScope(key, persistent);
    });

    return true;
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
      sessionStorage.removeItem(this.sessionStorageKey);
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
      if (import.meta.env.DEV) console.error('Failed to clear secure storage:', error);
      return false;
    }
  }

  /**
   * Clean up expired data
   */
  cleanupExpiredData() {
    try {
      [false, true].forEach((persistent) => {
        const data = this.getScopedSecureData(persistent);
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
          this.setSecureData(data, persistent);
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to cleanup expired data:', error);
    }
  }

  // Auth-specific methods
  setAuthToken(token, options = {}) {
    return this.setItem('auth_token', token, AUTH_TOKEN_TTL, options);
  }

  getAuthToken() {
    return this.getItem('auth_token', AUTH_TOKEN_TTL);
  }

  setRefreshToken(token, options = {}) {
    return this.setItem('refresh_token', token, REFRESH_TOKEN_TTL, options);
  }

  getRefreshToken() {
    return this.getItem('refresh_token', REFRESH_TOKEN_TTL);
  }

  setUserData(userData, options = {}) {
    return this.setItem('user_data', userData, this.maxAge, options);
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
      if (import.meta.env.DEV) console.error('Storage validation failed:', error);
      return false;
    }
  }

  // Migration methods (for future use)
  migrate(fromVersion, toVersion) {
    if (import.meta.env.DEV) console.log(`Migrating secure storage from ${fromVersion} to ${toVersion}`);
    // Future migration logic here
  }
}

// Create singleton instance
const secureStorage = new SecureStorage();

// Validate storage on initialization
if (!secureStorage.validateData()) {
  if (import.meta.env.DEV) console.warn('Secure storage validation failed, clearing data');
  secureStorage.clear();
}

export { secureStorage };
export default secureStorage;
