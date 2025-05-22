/**
 * Device Utility
 * Handles device management and tracking
 */

const UAParser = require('ua-parser-js');
const { AppError } = require('./app-error');
const logger = require('./logger');
const tokenUtil = require('./token');

class DeviceUtil {
  /**
   * Parse user agent string
   * @param {string} userAgent - User agent string
   * @returns {Object} Parsed device information
   */
  parseUserAgent(userAgent) {
    try {
      // If userAgent is undefined or null, return default values
      if (!userAgent) {
        logger.warn('User agent string is undefined or null');
        return {
          browser: { name: 'Unknown' },
          os: { name: 'Unknown' },
          device: { type: 'unknown' }
        };
      }
      
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      return {
        browser: {
          name: result.browser.name,
          version: result.browser.version,
          major: result.browser.major
        },
        os: {
          name: result.os.name,
          version: result.os.version
        },
        device: {
          type: result.device.type || 'desktop',
          vendor: result.device.vendor,
          model: result.device.model
        },
        cpu: {
          architecture: result.cpu.architecture
        },
        engine: {
          name: result.engine.name,
          version: result.engine.version
        }
      };
    } catch (error) {
      logger.error(`Failed to parse user agent: ${error.message}`);
      return {
        browser: { name: 'Unknown' },
        os: { name: 'Unknown' },
        device: { type: 'unknown' }
      };
    }
  }

  /**
   * Generate device fingerprint
   * @param {Object} deviceInfo - Device information
   * @returns {string} Device fingerprint
   */
  generateFingerprint(deviceInfo) {
    return tokenUtil.generateDeviceFingerprint(deviceInfo);
  }

  /**
   * Format device name
   * @param {Object} deviceInfo - Device information
   * @returns {string} Formatted device name
   */
  formatDeviceName(deviceInfo) {
    // Handle null or undefined deviceInfo
    if (!deviceInfo) {
      return 'Unknown Device';
    }
    
    // Safely destructure with defaults
    const browser = deviceInfo.browser || {};
    const os = deviceInfo.os || {};
    const device = deviceInfo.device || {};
    
    const parts = [];

    if (device.type === 'mobile') {
      if (device.vendor && device.model) {
        parts.push(`${device.vendor} ${device.model}`);
      } else {
        parts.push('Mobile Device');
      }
    } else {
      if (os.name) {
        parts.push(os.name);
      }
      if (browser.name) {
        parts.push(browser.name);
      }
    }

    return parts.join(' on ') || 'Unknown Device';
  }

  /**
   * Check if device is suspicious
   * @param {Object} deviceInfo - Device information
   * @returns {boolean} Whether device is suspicious
   */
  isSuspicious(deviceInfo) {
    // Handle null or undefined deviceInfo
    if (!deviceInfo) {
      return true; // No device info is suspicious
    }
    
    // Safely destructure with defaults
    const browser = deviceInfo.browser || {};
    const os = deviceInfo.os || {};
    const device = deviceInfo.device || {};

    // Check for known bot/crawler browsers
    const suspiciousBrowsers = ['HeadlessChrome', 'PhantomJS', 'Selenium'];
    if (browser.name && suspiciousBrowsers.includes(browser.name)) {
      return true;
    }

    // Check for missing or generic information
    if (!browser.name || !os.name || !device.type) {
      return true;
    }

    // Check for suspicious device types
    if (device.type === 'unknown' || device.type === 'bot') {
      return true;
    }

    return false;
  }

  /**
   * Check if device is trusted
   * @param {Object} deviceInfo - Device information
   * @param {Object} userDevices - User's trusted devices
   * @returns {boolean} Whether device is trusted
   */
  isTrusted(deviceInfo, userDevices) {
    // Early exit for missing data
    if (!deviceInfo || !userDevices || !Array.isArray(userDevices)) {
      return false;
    }
    
    const fingerprint = this.generateFingerprint(deviceInfo);
    return userDevices.some(device => device && device.fingerprint === fingerprint);
  }

  /**
   * Get device location from IP
   * @param {string} ip - IP address
   * @returns {Promise<Object>} Location information
   */
  async getLocationFromIP(ip) {
    try {
      // In production, you would use a geolocation service
      // This is a placeholder that returns mock data
      return {
        country: 'US',
        region: 'CA',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: 'America/Los_Angeles'
      };
    } catch (error) {
      logger.error(`Failed to get location from IP: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if device location is suspicious
   * @param {Object} location - Location information
   * @param {Object} userLocations - User's previous locations
   * @returns {boolean} Whether location is suspicious
   */
  isLocationSuspicious(location, userLocations) {
    // Exit early if no location or no previous locations
    if (!location || !userLocations || !userLocations.length) {
      return false;
    }

    // Get the most recent location
    const lastLocation = userLocations[userLocations.length - 1];
    
    // Verify lastLocation has all needed properties
    if (!lastLocation || 
        !lastLocation.timestamp || 
        typeof lastLocation.latitude !== 'number' || 
        typeof lastLocation.longitude !== 'number') {
      return false;
    }
    
    // Verify current location has coordinates
    if (typeof location.latitude !== 'number' || 
        typeof location.longitude !== 'number') {
      return false;
    }

    // Now safely calculate time difference and distance
    const timeDiff = Date.now() - lastLocation.timestamp;
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      lastLocation.latitude,
      lastLocation.longitude
    );

    // If distance is too large for the time difference
    if (timeDiff < 3600000 && distance > 1000) { // 1000km in 1 hour
      return true;
    }

    return false;
  }

  /**
   * Calculate distance between two points
   * @param {number} lat1 - First latitude
   * @param {number} lon1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lon2 - Second longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees
   * @returns {number} Radians
   */
  toRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Format device information for display
   * @param {Object} deviceInfo - Device information
   * @returns {string} Formatted device information
   */
  formatDeviceInfo(deviceInfo) {
    // Handle null or undefined deviceInfo
    if (!deviceInfo) {
      return 'Unknown Device';
    }
    
    // Safely destructure with defaults
    const browser = deviceInfo.browser || {};
    const os = deviceInfo.os || {};
    const device = deviceInfo.device || {};
    
    const parts = [];

    if (device.type === 'mobile') {
      if (device.vendor && device.model) {
        parts.push(`${device.vendor} ${device.model}`);
      }
    }

    if (os.name) {
      parts.push(os.name);
    }

    if (browser.name) {
      parts.push(browser.name);
    }

    return parts.join(' | ') || 'Unknown Device';
  }
}

module.exports = new DeviceUtil(); 