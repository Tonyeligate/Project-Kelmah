/**
 * Secure Storage Utility
 * 
 * Provides secure, encrypted storage with automatic token management,
 * expiration handling, and security best practices.
 */

import CryptoJS from 'crypto-js';

// Security configuration
const STORAGE_CONFIG = {
  encryption: {
    algorithm: 'AES',
    keySize: 256,
    ivSize: 128,
    iterations: 1000,
  },
  security: {
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },
  keys: {
    TOKEN: 'kelmah_auth_token',
    REFRESH_TOKEN: 'kelmah_refresh_token',
    USER: 'kelmah_user_data',
    PREFERENCES: 'kelmah_user_preferences',
    CACHE: 'kelmah_cache_data',
  }
};

class SecureStorage {
  constructor() {
    this.secretKey = this.generateSecretKey();
    this.failedAttempts = 0;
    this.lockoutTime = null;
  }

  /**
   * Generate a secret key for encryption based on browser fingerprint
   */
  generateSecretKey() {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform
    ].join('|');
    
    return CryptoJS.SHA256(fingerprint + 'kelmah-secret-salt').toString();
  }

  /**
   * Encrypt data before storage
   */
  encrypt(data) {
    try {
      const salt = CryptoJS.lib.WordArray.random(128/8);
      const key = CryptoJS.PBKDF2(this.secretKey, salt, {
        keySize: STORAGE_CONFIG.encryption.keySize/32,
        iterations: STORAGE_CONFIG.encryption.iterations
      });

      const iv = CryptoJS.lib.WordArray.random(STORAGE_CONFIG.encryption.ivSize/8);
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, { 
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });

      return {
        salt: salt.toString(),
        iv: iv.toString(),
        data: encrypted.toString(),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('🔒 Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data from storage
   */
  decrypt(encryptedData) {
    try {
      if (this.isLockedOut()) {
        throw new Error('Storage is locked due to security policy');
      }

      const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
      const key = CryptoJS.PBKDF2(this.secretKey, salt, {
        keySize: STORAGE_CONFIG.encryption.keySize/32,
        iterations: STORAGE_CONFIG.encryption.iterations
      });

      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });

      const decryptedData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      this.failedAttempts = 0; // Reset on success
      return decryptedData;
    } catch (error) {
      this.failedAttempts++;
      if (this.failedAttempts >= STORAGE_CONFIG.security.maxFailedAttempts) {
        this.lockoutTime = Date.now() + STORAGE_CONFIG.security.lockoutDuration;
        console.warn('🔒 Storage locked due to repeated decryption failures');
      }
      console.error('🔒 Decryption failed:', error);
      return null;
    }
  }

  /**
   * Check if storage is locked out
   */
  isLockedOut() {
    if (this.lockoutTime && Date.now() < this.lockoutTime) {
      return true;
    } else if (this.lockoutTime && Date.now() >= this.lockoutTime) {
      this.lockoutTime = null;
      this.failedAttempts = 0;
    }
    return false;
  }

  /**
   * Securely store data
   */
  setItem(key, value, options = {}) {
    try {
      if (this.isLockedOut()) {
        throw new Error('Storage is locked due to security policy');
      }

      const dataToStore = {
        value,
        timestamp: Date.now(),
        expires: options.expires ? Date.now() + options.expires : null,
        secure: options.secure !== false
      };

      if (options.encrypt !== false) {
        const encrypted = this.encrypt(dataToStore);
        localStorage.setItem(key, JSON.stringify(encrypted));
      } else {
        localStorage.setItem(key, JSON.stringify(dataToStore));
      }

      return true;
    } catch (error) {
      console.error('🔒 Secure storage failed:', error);
      return false;
    }
  }

  /**
   * Securely retrieve data
   */
  getItem(key, options = {}) {
    try {
      if (this.isLockedOut()) {
        console.warn('🔒 Storage access denied - locked out');
        return null;
      }

      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsedData = JSON.parse(stored);
      
      let data;
      if (parsedData.salt && parsedData.iv) {
        // Encrypted data
        data = this.decrypt(parsedData);
        if (!data) return null;
      } else {
        // Unencrypted data
        data = parsedData;
      }

      // Check expiration
      if (data.expires && Date.now() > data.expires) {
        this.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('🔒 Secure retrieval failed:', error);
      return null;
    }
  }

  /**
   * Remove item securely
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('🔒 Secure removal failed:', error);
      return false;
    }
  }

  /**
   * Clear all secure storage
   */
  clear() {
    try {
      // Only clear Kelmah-specific keys
      const keys = Object.values(STORAGE_CONFIG.keys);
      keys.forEach(key => this.removeItem(key));
      return true;
    } catch (error) {
      console.error('🔒 Secure clear failed:', error);
      return false;
    }
  }

  /**
   * Get authentication token securely
   */
  getAuthToken() {
    return this.getItem(STORAGE_CONFIG.keys.TOKEN);
  }

  /**
   * Set authentication token securely
   */
  setAuthToken(token, options = {}) {
    return this.setItem(STORAGE_CONFIG.keys.TOKEN, token, {
      expires: options.expires || STORAGE_CONFIG.security.sessionTimeout,
      encrypt: true,
      ...options
    });
  }

  /**
   * Get refresh token securely
   */
  getRefreshToken() {
    return this.getItem(STORAGE_CONFIG.keys.REFRESH_TOKEN);
  }

  /**
   * Set refresh token securely
   */
  setRefreshToken(token, options = {}) {
    return this.setItem(STORAGE_CONFIG.keys.REFRESH_TOKEN, token, {
      encrypt: true,
      ...options
    });
  }

  /**
   * Get user data securely
   */
  getUserData() {
    return this.getItem(STORAGE_CONFIG.keys.USER);
  }

  /**
   * Set user data securely
   */
  setUserData(userData, options = {}) {
    return this.setItem(STORAGE_CONFIG.keys.USER, userData, {
      encrypt: true,
      ...options
    });
  }

  /**
   * Security audit - check for suspicious activity
   */
  securityAudit() {
    const audit = {
      timestamp: Date.now(),
      failedAttempts: this.failedAttempts,
      isLockedOut: this.isLockedOut(),
      storageIntegrity: this.checkStorageIntegrity(),
      recommendations: []
    };

    if (this.failedAttempts > 2) {
      audit.recommendations.push('Multiple decryption failures detected');
    }

    if (!audit.storageIntegrity) {
      audit.recommendations.push('Storage integrity compromised - consider re-authentication');
    }

    return audit;
  }

  /**
   * Check storage integrity
   */
  checkStorageIntegrity() {
    try {
      const testKey = 'kelmah_integrity_test';
      const testData = { test: 'integrity_check', timestamp: Date.now() };
      
      this.setItem(testKey, testData);
      const retrieved = this.getItem(testKey);
      this.removeItem(testKey);
      
      return retrieved && retrieved.test === testData.test;
    } catch (error) {
      console.error('🔒 Storage integrity check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();
export default secureStorage;