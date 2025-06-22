/**
 * Device Utility
 * Provides helper functions for working with user-agent strings and IP-based location.
 * NOTE: For production you would likely pull a real geo-IP database/service and
 * implement more sophisticated anomaly detection.
 */

const UAParser = require('ua-parser-js');

/**
 * Parse the user-agent string into a structured object.
 * @param {string} ua
 * @returns {Object}
 */
exports.parseUserAgent = (ua = '') => {
  try {
    const parser = new UAParser(ua);
    return parser.getResult();
  } catch (err) {
    return {};
  }
};

/**
 * Return a formatted, human-readable description of the device.
 */
exports.formatDeviceInfo = (parsedUA = {}) => {
  if (!parsedUA || typeof parsedUA !== 'object') return 'Unknown device';
  const { device = {}, browser = {}, os = {} } = parsedUA;
  const dev = device.model || device.type || 'Device';
  const br = browser.name || 'Browser';
  const osv = os.name ? `${os.name} ${os.version || ''}`.trim() : '';
  return `${dev} • ${br}${osv ? ` • ${osv}` : ''}`;
};

/**
 * Convert parser result to a concise name suitable for saving in DB.
 */
exports.formatDeviceName = (parsedUA = {}) => {
  if (!parsedUA || typeof parsedUA !== 'object') return 'Unknown';
  const { device = {}, browser = {} } = parsedUA;
  return `${device.model || device.type || 'Device'}-${browser.name || 'Browser'}`;
};

/**
 * Very naive suspicious-device detector – flags if no device info could be parsed.
 */
exports.isSuspicious = (parsedUA = {}) => {
  return !parsedUA || Object.keys(parsedUA).length === 0;
};

/**
 * Fetch basic geo-location details from ipinfo.io (or return null on failure).
 */
exports.getLocationFromIP = async (ip) => {
  try {
    if (!ip) return null;
    const res = await fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN || ''}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      country: data.country || null,
      city: data.city || null,
      region: data.region || null,
    };
  } catch (e) {
    return null;
  }
};

/**
 * Simple comparison – returns true if the country differs from all previous.
 */
exports.isLocationSuspicious = (current = {}, previousLocations = []) => {
  if (!current || !current.country) return false;
  return !previousLocations.some((loc) => loc.country === current.country);
}; 