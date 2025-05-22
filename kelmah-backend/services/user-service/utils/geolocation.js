/**
 * Utility functions for geolocation calculations
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {number} lat1 Latitude of first point in decimal degrees
 * @param {number} lon1 Longitude of first point in decimal degrees
 * @param {number} lat2 Latitude of second point in decimal degrees
 * @param {number} lon2 Longitude of second point in decimal degrees
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Convert latitude and longitude from degrees to radians
  const radLat1 = (Math.PI * lat1) / 180;
  const radLon1 = (Math.PI * lon1) / 180;
  const radLat2 = (Math.PI * lat2) / 180;
  const radLon2 = (Math.PI * lon2) / 180;

  // Haversine formula
  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;
  
  return distance;
};

/**
 * Get coordinates for a given address using geocoding service
 * This is a placeholder that should be integrated with a geocoding service
 * like Google Maps, Mapbox, or OpenStreetMap Nominatim
 * 
 * @param {string} address The address to geocode
 * @returns {Promise<{latitude: number, longitude: number}>} The coordinates
 */
const geocodeAddress = async (address) => {
  // This should be implemented with a real geocoding service
  throw new Error('Geocoding service not implemented');
};

/**
 * Get the bounding box for a circle defined by center and radius
 * 
 * @param {number} centerLat Center latitude in decimal degrees
 * @param {number} centerLon Center longitude in decimal degrees
 * @param {number} radiusKm Radius in kilometers
 * @returns {{minLat: number, maxLat: number, minLon: number, maxLon: number}} Bounding box
 */
const getBoundingBox = (centerLat, centerLon, radiusKm) => {
  // Convert radius from kilometers to degrees
  // Rough approximation for small distances
  const latChange = radiusKm / 111.32; // 1 degree latitude ~= 111.32 km
  const lonChange = radiusKm / (111.32 * Math.cos((Math.PI * centerLat) / 180));
  
  return {
    minLat: centerLat - latChange,
    maxLat: centerLat + latChange,
    minLon: centerLon - lonChange,
    maxLon: centerLon + lonChange
  };
};

/**
 * Check if a location is within a specified radius of a central point
 * 
 * @param {number} centerLat Center latitude in decimal degrees
 * @param {number} centerLon Center longitude in decimal degrees
 * @param {number} pointLat Point latitude in decimal degrees
 * @param {number} pointLon Point longitude in decimal degrees
 * @param {number} radiusKm Radius in kilometers
 * @returns {boolean} True if the point is within the radius
 */
const isLocationWithinRadius = (centerLat, centerLon, pointLat, pointLon, radiusKm) => {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
};

module.exports = {
  calculateDistance,
  geocodeAddress,
  getBoundingBox,
  isLocationWithinRadius
}; 