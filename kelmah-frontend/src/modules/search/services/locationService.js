import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/location';

/**
 * Service for location-based search and geolocation features
 */
const locationService = {
  /**
   * Get popular job locations in Ghana
   * @returns {Promise<Object>} - Popular locations with job counts
   */
  getPopularLocations: async () => {
    try {
      const response = await userServiceClient.get(`${API_URL}/popular`);
      return response.data;
    } catch (error) {
      // Fallback with Ghana-specific mock data
      console.warn('Popular locations API not available, using mock data');
      return {
        data: [
          {
            name: 'Accra',
            region: 'Greater Accra Region',
            type: 'capital',
            jobs: 245,
            coordinates: [5.6037, -0.1870],
            growth: '+12%'
          },
          {
            name: 'Kumasi',
            region: 'Ashanti Region',
            type: 'capital',
            jobs: 156,
            coordinates: [6.6885, -1.6244],
            growth: '+8%'
          },
          {
            name: 'Sekondi-Takoradi',
            region: 'Western Region',
            type: 'capital',
            jobs: 98,
            coordinates: [4.9344, -1.7569],
            growth: '+15%'
          },
          {
            name: 'Tema',
            region: 'Greater Accra Region',
            type: 'city',
            jobs: 89,
            coordinates: [5.6698, 0.0166],
            growth: '+18%'
          },
          {
            name: 'East Legon',
            region: 'Greater Accra Region',
            type: 'suburb',
            jobs: 78,
            coordinates: [5.6504, -0.1615],
            growth: '+22%'
          },
          {
            name: 'Tamale',
            region: 'Northern Region',
            type: 'capital',
            jobs: 67,
            coordinates: [9.4034, -0.8424],
            growth: '+10%'
          }
        ]
      };
    }
  },

  /**
   * Get nearby locations based on coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Search radius in kilometers
   * @returns {Promise<Object>} - Nearby locations
   */
  getNearbyLocations: async (lat, lng, radius = 10) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/nearby`, {
        params: { lat, lng, radius }
      });
      return response.data;
    } catch (error) {
      console.warn('Nearby locations API not available, using mock data');
      
      // Generate mock nearby locations based on major Ghana cities
      const mockLocations = [
        {
          name: 'Madina',
          region: 'Greater Accra Region',
          type: 'suburb',
          jobs: 45,
          coordinates: [5.6819, -0.1676],
          distance: 3.2
        },
        {
          name: 'Airport City',
          region: 'Greater Accra Region',
          type: 'district',
          jobs: 34,
          coordinates: [5.6054, -0.1699],
          distance: 5.8
        },
        {
          name: 'Spintex',
          region: 'Greater Accra Region',
          type: 'area',
          jobs: 56,
          coordinates: [5.6234, -0.1234],
          distance: 7.1
        },
        {
          name: 'Achimota',
          region: 'Greater Accra Region',
          type: 'suburb',
          jobs: 29,
          coordinates: [5.6037, -0.2318],
          distance: 8.5
        }
      ].filter(location => location.distance <= radius);

      return { data: mockLocations };
    }
  },

  /**
   * Search locations by query
   * @param {string} query - Search query
   * @returns {Promise<Object>} - Search results
   */
  searchLocations: async (query) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.warn('Location search API not available, using mock data');
      
      // Mock search results for Ghana locations
      const ghanaLocations = [
        {
          name: 'Accra',
          region: 'Greater Accra Region',
          type: 'capital',
          jobs: 245,
          coordinates: [5.6037, -0.1870]
        },
        {
          name: 'Kumasi',
          region: 'Ashanti Region',
          type: 'capital',
          jobs: 156,
          coordinates: [6.6885, -1.6244]
        },
        {
          name: 'Tema',
          region: 'Greater Accra Region',
          type: 'city',
          jobs: 89,
          coordinates: [5.6698, 0.0166]
        },
        {
          name: 'East Legon',
          region: 'Greater Accra Region',
          type: 'suburb',
          jobs: 78,
          coordinates: [5.6504, -0.1615]
        }
      ];

      const filteredResults = ghanaLocations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.region.toLowerCase().includes(query.toLowerCase())
      );

      return { data: filteredResults };
    }
  },

  /**
   * Reverse geocode coordinates to get address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Address information
   */
  reverseGeocode: async (lat, lng) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/reverse-geocode`, {
        params: { lat, lng }
      });
      return response.data;
    } catch (error) {
      console.warn('Reverse geocoding API not available, using mock data');
      
      // Mock reverse geocoding for Ghana locations
      let closestLocation = 'Unknown Location, Ghana';
      let region = 'Ghana';
      let city = 'Unknown';

      // Simple distance calculation to find closest major city
      const majorCities = [
        { name: 'Accra', region: 'Greater Accra Region', lat: 5.6037, lng: -0.1870 },
        { name: 'Kumasi', region: 'Ashanti Region', lat: 6.6885, lng: -1.6244 },
        { name: 'Tema', region: 'Greater Accra Region', lat: 5.6698, lng: 0.0166 },
        { name: 'Cape Coast', region: 'Central Region', lat: 5.1340, lng: -1.2811 },
        { name: 'Tamale', region: 'Northern Region', lat: 9.4034, lng: -0.8424 }
      ];

      let minDistance = Infinity;
      let closestCity = majorCities[0];

      majorCities.forEach(city => {
        const distance = Math.sqrt(
          Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestCity = city;
        }
      });

      return {
        data: {
          address: `Near ${closestCity.name}, ${closestCity.region}`,
          city: closestCity.name,
          region: closestCity.region,
          country: 'Ghana'
        }
      };
    }
  },

  /**
   * Get user's recent location searches
   * @returns {Promise<Object>} - Recent searches
   */
  getRecentSearches: async () => {
    try {
      const response = await userServiceClient.get(`${API_URL}/recent-searches`);
      return response.data;
    } catch (error) {
      console.warn('Recent searches API not available, using mock data');
      
      // Get from localStorage as fallback
      const recentSearches = JSON.parse(localStorage.getItem('recentLocationSearches') || '[]');
      
      return { data: recentSearches };
    }
  },

  /**
   * Save a location search to recent searches
   * @param {Object} location - Location data
   * @returns {Promise<Object>} - Save confirmation
   */
  saveRecentSearch: async (location) => {
    try {
      const response = await userServiceClient.post(`${API_URL}/recent-searches`, location);
      return response.data;
    } catch (error) {
      console.warn('Save recent search API not available, using localStorage');
      
      // Fallback to localStorage
      const recentSearches = JSON.parse(localStorage.getItem('recentLocationSearches') || '[]');
      
      // Remove if already exists
      const filtered = recentSearches.filter(item => item.name !== location.name);
      
      // Add to beginning
      filtered.unshift({
        ...location,
        searchedAt: new Date().toISOString()
      });
      
      // Keep only last 10
      const limited = filtered.slice(0, 10);
      
      localStorage.setItem('recentLocationSearches', JSON.stringify(limited));
      
      return { data: { success: true } };
    }
  },

  /**
   * Get location-based job statistics
   * @param {string} locationName - Location name
   * @returns {Promise<Object>} - Location job statistics
   */
  getLocationStats: async (locationName) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/stats/${locationName}`);
      return response.data;
    } catch (error) {
      console.warn('Location stats API not available, using mock data');
      
      return {
        data: {
          totalJobs: 245,
          activeJobs: 89,
          avgSalary: 3500,
          topCategories: [
            { name: 'Plumbing', count: 67, growth: '+15%' },
            { name: 'Electrical', count: 52, growth: '+22%' },
            { name: 'Carpentry', count: 43, growth: '+8%' },
            { name: 'Painting', count: 34, growth: '+12%' },
            { name: 'HVAC', count: 26, growth: '+35%' }
          ],
          demandTrends: {
            high: ['Emergency Repairs', 'Commercial Work', 'Residential Installation'],
            medium: ['Maintenance', 'Renovation', 'Landscaping'],
            low: ['Seasonal Work', 'Part-time Jobs']
          },
          transportAccess: {
            publicTransport: true,
            majorRoads: ['N1 Highway', 'Spintex Road', 'East Legon Road'],
            nearestAirport: 'Kotoka International Airport (15km)'
          },
          costOfLiving: 'Medium-High',
          businessEnvironment: 'Very Active'
        }
      };
    }
  },

  /**
   * Get travel time and distance between locations
   * @param {Array} origin - Origin coordinates [lat, lng]
   * @param {Array} destination - Destination coordinates [lat, lng]
   * @returns {Promise<Object>} - Travel information
   */
  getTravelInfo: async (origin, destination) => {
    try {
      const response = await userServiceClient.post(`${API_URL}/travel-info`, {
        origin,
        destination
      });
      return response.data;
    } catch (error) {
      console.warn('Travel info API not available, using mock data');
      
      // Simple distance calculation (Haversine formula approximation)
      const [lat1, lng1] = origin;
      const [lat2, lng2] = destination;
      
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Mock travel time (assuming average speed of 40 km/h in Ghana cities)
      const travelTime = Math.round((distance / 40) * 60); // in minutes
      
      return {
        data: {
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          duration: travelTime,
          durationText: travelTime < 60 ? `${travelTime} min` : `${Math.floor(travelTime/60)}h ${travelTime%60}min`,
          distanceText: `${Math.round(distance * 10) / 10} km`,
          transportOptions: [
            {
              mode: 'driving',
              duration: travelTime,
              cost: Math.round(distance * 2), // ₵2 per km estimate
              description: 'By car or taxi'
            },
            {
              mode: 'transit',
              duration: Math.round(travelTime * 1.5),
              cost: Math.round(distance * 0.8), // ₵0.8 per km for public transport
              description: 'Public transport (tro-tro, bus)'
            }
          ]
        }
      };
    }
  },

  /**
   * Get Ghana-specific location suggestions
   * @param {string} query - Partial location query
   * @returns {Promise<Object>} - Location suggestions
   */
  getLocationSuggestions: async (query) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/suggestions`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.warn('Location suggestions API not available, using mock data');
      
      const ghanaAreas = [
        // Greater Accra
        'Accra', 'Tema', 'Kasoa', 'Madina', 'East Legon', 'Airport City', 'Spintex',
        'Dansoman', 'Achimota', 'Adenta', 'Ashaiman', 'Labadi', 'Osu', 'Labone',
        
        // Ashanti
        'Kumasi', 'Obuasi', 'Ejisu', 'Mampong', 'Bekwai', 'Konongo',
        
        // Western
        'Sekondi-Takoradi', 'Tarkwa', 'Axim', 'Half Assini',
        
        // Central
        'Cape Coast', 'Elmina', 'Winneba', 'Swedru',
        
        // Northern
        'Tamale', 'Yendi', 'Savelugu',
        
        // Other
        'Ho', 'Koforidua', 'Sunyani', 'Wa', 'Bolgatanga'
      ];

      const suggestions = ghanaAreas
        .filter(area => area.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
        .map(area => ({
          name: area,
          type: 'suggestion',
          popularity: Math.floor(Math.random() * 100) + 1
        }));

      return { data: suggestions };
    }
  }
};

export default locationService;