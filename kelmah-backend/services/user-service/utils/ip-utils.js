const axios = require('axios');
const config = require('../config');

/**
 * IP Info cache to reduce API calls
 * Key: IP address, Value: { data, timestamp }
 */
const ipInfoCache = new Map();

/**
 * Cache expiration time (24 hours in milliseconds)
 */
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Get geolocation and additional information about an IP address
 * @param {string} ip - IP address to lookup
 * @returns {Promise<Object>} IP information including location, ISP, and proxy detection
 */
async function getIpInfo(ip) {
  try {
    // Validate IP address
    if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
      return {
        country: null,
        city: null,
        isp: null,
        proxy: false,
        vpn: false,
        tor: false
      };
    }
    
    // Check cache first
    const now = Date.now();
    if (ipInfoCache.has(ip)) {
      const cachedData = ipInfoCache.get(ip);
      if (now - cachedData.timestamp < CACHE_EXPIRATION) {
        return cachedData.data;
      }
      // Cache expired, remove it
      ipInfoCache.delete(ip);
    }
    
    // If IP info service is not configured, return default values
    if (!config.IP_INFO_SERVICE_ENABLED) {
      return {
        country: null,
        city: null,
        isp: null,
        proxy: false,
        vpn: false,
        tor: false
      };
    }
    
    // Use IP info service based on configuration
    let ipData;
    
    // Use appropriate service based on configuration
    switch (config.IP_INFO_SERVICE) {
      case 'ipstack':
        ipData = await getIpStackInfo(ip);
        break;
      case 'ipinfo':
        ipData = await getIpInfoIoData(ip);
        break;
      case 'ipapi':
        ipData = await getIpApiData(ip);
        break;
      default:
        // Default fallback to free service
        ipData = await getIpApiData(ip);
    }
    
    // Cache the result
    ipInfoCache.set(ip, {
      data: ipData,
      timestamp: now
    });
    
    return ipData;
  } catch (error) {
    console.error('Error getting IP info:', error);
    
    // Return default values in case of error
    return {
      country: null,
      city: null,
      isp: null,
      proxy: false,
      vpn: false,
      tor: false
    };
  }
}

/**
 * Get IP information from IPStack API
 * @param {string} ip - IP address
 * @returns {Promise<Object>} Formatted IP information
 */
async function getIpStackInfo(ip) {
  try {
    const response = await axios.get(`${config.IPSTACK_API_URL}/${ip}`, {
      params: {
        access_key: config.IPSTACK_API_KEY,
        security: 1
      }
    });
    
    const data = response.data;
    
    return {
      country: data.country_name,
      city: data.city,
      isp: null, // IPStack doesn't provide ISP info in the free tier
      proxy: data.security && data.security.proxy,
      vpn: data.security && data.security.vpn,
      tor: data.security && data.security.tor
    };
  } catch (error) {
    console.error('IPStack API error:', error);
    throw error;
  }
}

/**
 * Get IP information from IPInfo.io API
 * @param {string} ip - IP address
 * @returns {Promise<Object>} Formatted IP information
 */
async function getIpInfoIoData(ip) {
  try {
    const response = await axios.get(`${config.IPINFO_API_URL}/${ip}`, {
      params: {
        token: config.IPINFO_API_TOKEN
      }
    });
    
    const data = response.data;
    
    return {
      country: data.country,
      city: data.city,
      isp: data.org,
      proxy: data.privacy && data.privacy.proxy,
      vpn: data.privacy && data.privacy.vpn,
      tor: data.privacy && data.privacy.tor
    };
  } catch (error) {
    console.error('IPInfo.io API error:', error);
    throw error;
  }
}

/**
 * Get IP information from IP-API.com (free service)
 * @param {string} ip - IP address
 * @returns {Promise<Object>} Formatted IP information
 */
async function getIpApiData(ip) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: {
        fields: 'status,message,country,city,isp,proxy,hosting'
      }
    });
    
    const data = response.data;
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'IP-API request failed');
    }
    
    return {
      country: data.country,
      city: data.city,
      isp: data.isp,
      proxy: data.proxy,
      vpn: data.proxy, // IP-API doesn't distinguish between proxy and VPN
      tor: false // IP-API doesn't provide Tor exit node info in the free tier
    };
  } catch (error) {
    console.error('IP-API error:', error);
    throw error;
  }
}

/**
 * Clear expired entries from the IP info cache
 */
function cleanupIpInfoCache() {
  const now = Date.now();
  ipInfoCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_EXPIRATION) {
      ipInfoCache.delete(key);
    }
  });
}

// Clean up the cache periodically (every hour)
setInterval(cleanupIpInfoCache, 60 * 60 * 1000);

module.exports = {
  getIpInfo
};