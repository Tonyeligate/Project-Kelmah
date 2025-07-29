// Map Service for Kelmah Professional Platform
class MapService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.mapData = {
      jobs: [],
      workers: [],
      analytics: {},
      categories: [],
      status: {},
    };
    this.subscribers = [];
    this.updateInterval = null;
  }

  // Initialize the map service
  async initialize() {
    try {
      await this.loadInitialData();
      this.startRealTimeUpdates();
      return true;
    } catch (error) {
      console.error('Failed to initialize map service:', error);
      return false;
    }
  }

  // Load initial map data
  async loadInitialData() {
    try {
      const [jobsResponse, workersResponse, analyticsResponse] = await Promise.all([
        this.fetchJobs(),
        this.fetchWorkers(),
        this.fetchAnalytics(),
      ]);

      this.mapData = {
        jobs: jobsResponse.data || [],
        workers: workersResponse.data || [],
        analytics: analyticsResponse.data || {},
        categories: this.generateCategories(),
        status: this.generateStatus(),
      };

      this.notifySubscribers();
    } catch (error) {
      console.error('Error loading initial map data:', error);
      // Fallback to mock data
      this.loadMockData();
    }
  }

  // Fetch jobs with location data
  async fetchJobs(filters = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/jobs/map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return { data: this.getMockJobs() };
    }
  }

  // Fetch workers with location data
  async fetchWorkers(filters = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/workers/map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching workers:', error);
      return { data: this.getMockWorkers() };
    }
  }

  // Fetch real-time analytics
  async fetchAnalytics() {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/map`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { data: this.getMockAnalytics() };
    }
  }

  // Get user's current location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  // Search for locations
  async searchLocations(query) {
    try {
      const response = await fetch(`${this.baseUrl}/api/locations/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching locations:', error);
      return { data: this.getMockLocations(query) };
    }
  }

  // Get nearby jobs/workers
  async getNearbyItems(type, location, radius = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/api/map/nearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          location,
          radius,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching nearby items:', error);
      return { data: type === 'jobs' ? this.getMockJobs() : this.getMockWorkers() };
    }
  }

  // Start real-time updates
  startRealTimeUpdates() {
    this.updateInterval = setInterval(async () => {
      try {
        const [jobsResponse, workersResponse, analyticsResponse] = await Promise.all([
          this.fetchJobs(),
          this.fetchWorkers(),
          this.fetchAnalytics(),
        ]);

        this.mapData = {
          ...this.mapData,
          jobs: jobsResponse.data || this.mapData.jobs,
          workers: workersResponse.data || this.mapData.workers,
          analytics: analyticsResponse.data || this.mapData.analytics,
        };

        this.notifySubscribers();
      } catch (error) {
        console.error('Error updating map data:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  // Stop real-time updates
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Subscribe to map data updates
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify subscribers of data updates
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.mapData);
      } catch (error) {
        console.error('Error in map data subscriber:', error);
      }
    });
  }

  // Get current map data
  getMapData() {
    return this.mapData;
  }

  // Load mock data for development
  loadMockData() {
    this.mapData = {
      jobs: this.getMockJobs(),
      workers: this.getMockWorkers(),
      analytics: this.getMockAnalytics(),
      categories: this.generateCategories(),
      status: this.generateStatus(),
    };
    this.notifySubscribers();
  }

  // Generate mock jobs
  getMockJobs() {
    return [
      {
        id: 'job-1',
        title: 'Catering Service',
        category: 'Food & Hospitality',
        location: { lat: 5.5600, lng: -0.2057, address: 'Accra, Ghana' },
        budget: '$500-800',
        urgency: 'high',
        status: 'active',
        posted: '2 hours ago',
        views: 45,
        applications: 12,
        client: { name: 'Event Pro Ghana', rating: 4.8, verified: true },
        skills: ['Cooking', 'Event Planning', 'Customer Service'],
        description: 'Professional catering service needed for corporate event',
      },
      {
        id: 'job-2',
        title: 'Electrical Installation',
        category: 'Electrical',
        location: { lat: 5.5700, lng: -0.2157, address: 'Kumasi, Ghana' },
        budget: '$300-500',
        urgency: 'medium',
        status: 'active',
        posted: '4 hours ago',
        views: 32,
        applications: 8,
        client: { name: 'Tech Solutions Ltd', rating: 4.6, verified: true },
        skills: ['Electrical Wiring', 'Safety Standards', 'Installation'],
        description: 'Complete electrical installation for new office building',
      },
      {
        id: 'job-3',
        title: 'Plumbing Repair',
        category: 'Plumbing',
        location: { lat: 5.5500, lng: -0.1957, address: 'Tema, Ghana' },
        budget: '$150-300',
        urgency: 'urgent',
        status: 'active',
        posted: '1 hour ago',
        views: 28,
        applications: 15,
        client: { name: 'HomeFix Services', rating: 4.9, verified: true },
        skills: ['Plumbing', 'Repair', 'Maintenance'],
        description: 'Emergency plumbing repair needed immediately',
      },
    ];
  }

  // Generate mock workers
  getMockWorkers() {
    return [
      {
        id: 'worker-1',
        name: 'Kwame Asante',
        category: 'Electrical',
        location: { lat: 5.5600, lng: -0.2057, address: 'Accra, Ghana' },
        rating: 4.8,
        hourlyRate: '$25-35',
        status: 'available',
        verified: true,
        skills: ['Electrical Wiring', 'Safety Standards', 'Installation'],
        completedJobs: 156,
        responseTime: '< 2 min',
        portfolio: ['Commercial Projects', 'Residential Wiring'],
        languages: ['English', 'Twi'],
        availability: 'Immediate',
      },
      {
        id: 'worker-2',
        name: 'Ama Osei',
        category: 'Catering',
        location: { lat: 5.5700, lng: -0.2157, address: 'Kumasi, Ghana' },
        rating: 4.9,
        hourlyRate: '$20-30',
        status: 'available',
        verified: true,
        skills: ['Cooking', 'Event Planning', 'Customer Service'],
        completedJobs: 89,
        responseTime: '< 5 min',
        portfolio: ['Weddings', 'Corporate Events', 'Private Parties'],
        languages: ['English', 'Twi', 'Ga'],
        availability: 'Next Week',
      },
    ];
  }

  // Generate mock analytics
  getMockAnalytics() {
    return {
      responseTime: { value: '< 2 min', trend: -5, color: '#4CAF50' },
      successRate: { value: '94%', trend: 2, color: '#2196F3' },
      avgRating: { value: '4.8', trend: 1, color: '#FFC107' },
      onlineNow: { value: '847', trend: 8, color: '#9C27B0' },
    };
  }

  // Generate categories
  generateCategories() {
    return [
      { name: 'Carpentry', count: 124, percentage: 124, color: '#FF9800' },
      { name: 'Electrical', count: 89, percentage: 89, color: '#FFC107' },
      { name: 'Plumbing', count: 67, percentage: 67, color: '#2196F3' },
      { name: 'Catering', count: 45, percentage: 45, color: '#4CAF50' },
      { name: 'Painting', count: 34, percentage: 34, color: '#9C27B0' },
    ];
  }

  // Generate status data
  generateStatus() {
    return {
      active: { count: 0, trend: 15, color: '#4CAF50' },
      verified: { count: 34, trend: 8, color: '#2196F3' },
      urgent: { count: 7, trend: -5, color: '#F44336' },
      topRated: { count: 0, trend: 12, color: '#FFC107' },
    };
  }

  // Get mock locations
  getMockLocations(query) {
    const locations = [
      'Accra, Ghana',
      'Kumasi, Ghana',
      'Tema, Ghana',
      'Cape Coast, Ghana',
      'Tamale, Ghana',
    ];
    
    return locations
      .filter(location => location.toLowerCase().includes(query.toLowerCase()))
      .map(location => ({ id: location, description: location }));
  }

  // Calculate distance between two points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  // Convert degrees to radians
  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Filter items by distance
  filterByDistance(items, center, maxDistance) {
    return items.filter(item => {
      const distance = this.calculateDistance(
        center.lat,
        center.lng,
        item.location.lat,
        item.location.lng
      );
      return distance <= maxDistance;
    });
  }

  // Cleanup resources
  destroy() {
    this.stopRealTimeUpdates();
    this.subscribers = [];
  }
}

// Create and export singleton instance
const mapService = new MapService();
export default mapService;
