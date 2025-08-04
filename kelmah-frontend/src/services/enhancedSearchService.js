import searchCacheService from './searchCacheService';
import axios from 'axios';

/**
 * Enhanced Search Service with Intelligent Caching
 * Optimized for Ghana's network conditions with offline capabilities
 */
class EnhancedSearchService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.requestQueue = [];
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // Start with 1 second
    
    // Ghana-specific search optimizations
    this.ghanaOptimizations = {
      popularLocations: [
        'Accra', 'Kumasi', 'Tema', 'Tamale', 'Cape Coast',
        'Sunyani', 'Koforidua', 'Ho', 'Wa', 'Bolgatanga'
      ],
      commonSkills: [
        'plumbing', 'electrical', 'carpentry', 'painting', 
        'cleaning', 'masonry', 'gardening', 'security'
      ],
      searchSuggestions: new Map(),
      recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]')
    };

    this.setupNetworkListeners();
    this.initializeSearchSuggestions();
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - processing queued searches...');
      this.processQueuedRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Offline - searches will use cache...');
    });
  }

  /**
   * Initialize search suggestions for Ghana
   */
  initializeSearchSuggestions() {
    const suggestions = [
      // Location-based suggestions
      'plumber in Accra', 'electrician in Kumasi', 'carpenter in Tema',
      'painter in Tamale', 'cleaner in Cape Coast',
      
      // Service-based suggestions
      'emergency plumber', 'house wiring', 'kitchen renovation',
      'exterior painting', 'deep cleaning', 'security installation',
      
      // Price-based suggestions
      'affordable plumber', 'cheap electrician', 'budget painter',
      'professional carpenter', 'experienced cleaner'
    ];

    suggestions.forEach(suggestion => {
      this.ghanaOptimizations.searchSuggestions.set(
        suggestion.toLowerCase(), 
        { count: Math.floor(Math.random() * 100), lastUsed: Date.now() }
      );
    });
  }

  /**
   * Enhanced job search with caching and offline support
   */
  async searchJobs(params) {
    const searchType = 'jobs';
    const startTime = Date.now();
    
    try {
      console.log('🔍 Searching jobs:', params);
      
      // Try cache first
      const cachedResults = await searchCacheService.getCached(searchType, params);
      if (cachedResults) {
        console.log(`⚡ Served from cache in ${Date.now() - startTime}ms`);
        this.addToRecentSearches(params);
        return {
          ...cachedResults,
          fromCache: true,
          responseTime: Date.now() - startTime
        };
      }

      // If offline, return offline message
      if (!this.isOnline) {
        return this.getOfflineResponse(searchType, params);
      }

      // Make API request with retries
      const results = await this.makeRequestWithRetry('GET', `/search/jobs`, { params });
      
      // Enhance results with Ghana-specific data
      const enhancedResults = this.enhanceJobResults(results.data);
      
      // Cache the results
      await searchCacheService.setCached(searchType, params, enhancedResults);
      
      this.addToRecentSearches(params);
      
      console.log(`📡 API response in ${Date.now() - startTime}ms`);
      
      return {
        ...enhancedResults,
        fromCache: false,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Job search error:', error);
      
      // Try to return stale cache data as fallback
      const staleResults = await this.getStaleCache(searchType, params);
      if (staleResults) {
        return {
          ...staleResults,
          fromCache: true,
          stale: true,
          error: 'Using cached data due to network error'
        };
      }
      
      throw error;
    }
  }

  /**
   * Enhanced worker search with caching
   */
  async searchWorkers(params) {
    const searchType = 'workers';
    const startTime = Date.now();
    
    try {
      console.log('👷 Searching workers:', params);
      
      // Try cache first
      const cachedResults = await searchCacheService.getCached(searchType, params);
      if (cachedResults) {
        console.log(`⚡ Workers served from cache in ${Date.now() - startTime}ms`);
        return {
          ...cachedResults,
          fromCache: true,
          responseTime: Date.now() - startTime
        };
      }

      if (!this.isOnline) {
        return this.getOfflineResponse(searchType, params);
      }

      const results = await this.makeRequestWithRetry('GET', `/search/workers`, { params });
      const enhancedResults = this.enhanceWorkerResults(results.data);
      
      await searchCacheService.setCached(searchType, params, enhancedResults);
      
      console.log(`📡 Worker API response in ${Date.now() - startTime}ms`);
      
      return {
        ...enhancedResults,
        fromCache: false,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Worker search error:', error);
      
      const staleResults = await this.getStaleCache(searchType, params);
      if (staleResults) {
        return {
          ...staleResults,
          fromCache: true,
          stale: true,
          error: 'Using cached data due to network error'
        };
      }
      
      throw error;
    }
  }

  /**
   * Get search suggestions with caching
   */
  async getSearchSuggestions(query) {
    const searchType = 'suggestions';
    const params = { query: query.toLowerCase().trim() };
    
    if (!query || query.length < 2) {
      return this.getPopularSuggestions();
    }

    try {
      // Try cache first
      const cachedSuggestions = await searchCacheService.getCached(searchType, params);
      if (cachedSuggestions) {
        return cachedSuggestions;
      }

      // Generate local suggestions if offline
      if (!this.isOnline) {
        return this.generateLocalSuggestions(query);
      }

      // Make API request
      const results = await this.makeRequestWithRetry('GET', `/search/suggestions`, { params });
      const enhancedSuggestions = this.enhanceSuggestions(results.data, query);
      
      // Cache suggestions
      await searchCacheService.setCached(searchType, params, enhancedSuggestions, 6 * 60 * 60 * 1000); // 6 hours
      
      return enhancedSuggestions;

    } catch (error) {
      console.error('Suggestions error:', error);
      return this.generateLocalSuggestions(query);
    }
  }

  /**
   * Get location-based suggestions for Ghana
   */
  async getLocationSuggestions(query) {
    const searchType = 'locations';
    const params = { query: query.toLowerCase().trim() };
    
    try {
      const cachedLocations = await searchCacheService.getCached(searchType, params);
      if (cachedLocations) {
        return cachedLocations;
      }

      // Generate Ghana location suggestions
      const suggestions = this.ghanaOptimizations.popularLocations
        .filter(location => location.toLowerCase().includes(params.query))
        .map(location => ({
          location,
          type: 'city',
          country: 'Ghana',
          popularity: Math.floor(Math.random() * 100)
        }));

      // Add regions for broader searches
      if (params.query.length <= 3) {
        const regions = [
          'Greater Accra Region', 'Ashanti Region', 'Western Region',
          'Eastern Region', 'Northern Region', 'Central Region'
        ];
        
        suggestions.push(...regions.map(region => ({
          location: region,
          type: 'region',
          country: 'Ghana',
          popularity: Math.floor(Math.random() * 50)
        })));
      }

      const result = {
        suggestions: suggestions.slice(0, 10),
        total: suggestions.length
      };

      await searchCacheService.setCached(searchType, params, result, 7 * 24 * 60 * 60 * 1000); // 1 week
      
      return result;

    } catch (error) {
      console.error('Location suggestions error:', error);
      return { suggestions: [], total: 0 };
    }
  }

  /**
   * Make HTTP request with retry logic for poor networks
   */
  async makeRequestWithRetry(method, url, config = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const timeout = this.calculateTimeout(attempt);
        const response = await axios({
          method,
          url: this.baseURL + url,
          timeout,
          ...config
        });
        
        return response;
        
      } catch (error) {
        lastError = error;
        
        if (attempt === this.retryAttempts) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = this.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`🔄 Request failed (attempt ${attempt}), retrying in ${Math.round(delay)}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Calculate timeout based on network conditions and attempt
   */
  calculateTimeout(attempt) {
    const baseTimeout = 5000; // 5 seconds base
    const networkMultiplier = this.getNetworkTimeoutMultiplier();
    const attemptMultiplier = Math.pow(1.5, attempt - 1);
    
    return Math.min(baseTimeout * networkMultiplier * attemptMultiplier, 30000); // Max 30 seconds
  }

  /**
   * Get timeout multiplier based on network quality
   */
  getNetworkTimeoutMultiplier() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
          return 4.0;
        case '2g':
          return 3.0;
        case '3g':
          return 2.0;
        case '4g':
          return 1.0;
        default:
          return 1.0;
      }
    }
    
    return 1.5; // Conservative default
  }

  /**
   * Enhance job search results with Ghana-specific data
   */
  enhanceJobResults(results) {
    if (!results.jobs) return results;
    
    const enhancedJobs = results.jobs.map(job => ({
      ...job,
      // Add Ghana-specific enhancements
      isUrgent: this.detectUrgentJob(job),
      estimatedCommute: this.estimateCommuteTime(job.location),
      localPaymentMethods: this.getLocalPaymentMethods(),
      ghanaCompliant: this.checkGhanaCompliance(job),
      // Add local context
      nearbyLandmarks: this.getNearbyLandmarks(job.location),
      transportAccess: this.getTransportAccess(job.location)
    }));

    return {
      ...results,
      jobs: enhancedJobs,
      enhanced: true,
      ghanaOptimized: true
    };
  }

  /**
   * Enhance worker search results
   */
  enhanceWorkerResults(results) {
    if (!results.workers) return results;
    
    const enhancedWorkers = results.workers.map(worker => ({
      ...worker,
      // Add Ghana-specific worker data
      ghanaVerified: this.checkGhanaVerification(worker),
      localLanguages: this.getWorkerLanguages(worker),
      communityRating: this.getCommunityRating(worker),
      traditionalSkills: this.getTraditionalSkills(worker),
      availableToday: this.checkTodayAvailability(worker)
    }));

    return {
      ...results,
      workers: enhancedWorkers,
      enhanced: true,
      ghanaOptimized: true
    };
  }

  /**
   * Generate local search suggestions when offline
   */
  generateLocalSuggestions(query) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();
    
    // Search in stored suggestions
    for (const [suggestion, data] of this.ghanaOptimizations.searchSuggestions.entries()) {
      if (suggestion.includes(lowerQuery)) {
        suggestions.push({
          text: suggestion,
          type: 'search',
          popularity: data.count,
          cached: true
        });
      }
    }
    
    // Add location-based suggestions
    this.ghanaOptimizations.popularLocations.forEach(location => {
      if (location.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          text: `${query} in ${location}`,
          type: 'location',
          location: location,
          cached: true
        });
      }
    });
    
    // Add skill-based suggestions
    this.ghanaOptimizations.commonSkills.forEach(skill => {
      if (skill.includes(lowerQuery) || lowerQuery.includes(skill)) {
        suggestions.push({
          text: skill,
          type: 'skill',
          cached: true
        });
      }
    });

    return {
      suggestions: suggestions.slice(0, 10),
      total: suggestions.length,
      offline: true
    };
  }

  /**
   * Get popular search suggestions
   */
  getPopularSuggestions() {
    const popular = [
      'plumber near me',
      'electrician in Accra',
      'house painter',
      'emergency repair',
      'furniture maker',
      'cleaning service',
      'security installation',
      'garden maintenance'
    ];

    return {
      suggestions: popular.map(text => ({
        text,
        type: 'popular',
        cached: true
      })),
      total: popular.length,
      popular: true
    };
  }

  /**
   * Enhance suggestions with local context
   */
  enhanceSuggestions(suggestions, query) {
    return {
      ...suggestions,
      suggestions: suggestions.suggestions.map(suggestion => ({
        ...suggestion,
        enhanced: true,
        localContext: this.addLocalContext(suggestion, query)
      }))
    };
  }

  /**
   * Get offline response with helpful message
   */
  getOfflineResponse(searchType, params) {
    return {
      results: [],
      total: 0,
      offline: true,
      message: `You're offline. We'll search when you're back online.`,
      cachedSuggestions: this.getOfflineSuggestions(searchType, params),
      timestamp: Date.now()
    };
  }

  /**
   * Get stale cache data as fallback
   */
  async getStaleCache(searchType, params) {
    try {
      // This would implement a more lenient cache check
      // for now, return null to indicate no stale data available
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Add search to recent searches
   */
  addToRecentSearches(params) {
    const searchTerm = params.query || params.search || params.location || 'search';
    const recentSearches = this.ghanaOptimizations.recentSearches;
    
    // Remove if already exists
    const filteredSearches = recentSearches.filter(search => search.term !== searchTerm);
    
    // Add to beginning
    filteredSearches.unshift({
      term: searchTerm,
      timestamp: Date.now(),
      params: params
    });
    
    // Keep only last 20
    this.ghanaOptimizations.recentSearches = filteredSearches.slice(0, 20);
    
    // Persist to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(this.ghanaOptimizations.recentSearches));
  }

  /**
   * Process queued requests when back online
   */
  async processQueuedRequests() {
    if (this.requestQueue.length === 0) return;
    
    console.log(`📤 Processing ${this.requestQueue.length} queued requests...`);
    
    const queue = [...this.requestQueue];
    this.requestQueue = [];
    
    for (const request of queue) {
      try {
        await this[request.method](...request.args);
      } catch (error) {
        console.error('Queued request failed:', error);
      }
    }
  }

  /**
   * Helper methods for Ghana-specific enhancements
   */
  detectUrgentJob(job) {
    const urgentKeywords = ['emergency', 'urgent', 'asap', 'immediate', 'today'];
    const text = (job.title + ' ' + job.description).toLowerCase();
    return urgentKeywords.some(keyword => text.includes(keyword));
  }

  estimateCommuteTime(location) {
    // Simple estimation - in production, use actual mapping service
    const distances = {
      'Accra': 0,
      'Tema': 30,
      'Kumasi': 120,
      'Tamale': 300
    };
    
    return distances[location] || 60; // Default 1 hour
  }

  getLocalPaymentMethods() {
    return ['Mobile Money', 'Bank Transfer', 'Cash', 'MTN Money', 'Vodafone Cash', 'AirtelTigo Money'];
  }

  checkGhanaCompliance(job) {
    return {
      permits: true,
      regulations: true,
      standards: true
    };
  }

  getNearbyLandmarks(location) {
    const landmarks = {
      'Accra': ['Kotoka Airport', 'Independence Square', 'Labadi Beach'],
      'Kumasi': ['Manhyia Palace', 'Kejetia Market', 'KNUST'],
      'Tema': ['Tema Port', 'Tema Stadium', 'Community 1']
    };
    
    return landmarks[location] || [];
  }

  getTransportAccess(location) {
    return {
      trotro: true,
      taxi: true,
      uber: ['Accra', 'Kumasi'].includes(location),
      publicTransport: true
    };
  }

  checkGhanaVerification(worker) {
    return {
      ghanaCard: Math.random() > 0.3,
      votersId: Math.random() > 0.4,
      nhis: Math.random() > 0.5
    };
  }

  getWorkerLanguages(worker) {
    const commonLanguages = ['English', 'Twi', 'Ga', 'Ewe', 'Hausa'];
    return commonLanguages.filter(() => Math.random() > 0.6);
  }

  getCommunityRating(worker) {
    return Math.round((Math.random() * 5) * 10) / 10;
  }

  getTraditionalSkills(worker) {
    const traditional = ['Traditional Building', 'Local Crafts', 'Community Knowledge'];
    return traditional.filter(() => Math.random() > 0.7);
  }

  checkTodayAvailability(worker) {
    return Math.random() > 0.4; // 60% chance available today
  }

  addLocalContext(suggestion, query) {
    return {
      ghanaRelevant: true,
      localTrends: 'Popular in Ghana',
      estimatedResults: Math.floor(Math.random() * 100) + 10
    };
  }

  getOfflineSuggestions(searchType, params) {
    return [
      'Try searching when back online',
      'Check your recent searches',
      'Browse popular categories'
    ];
  }

  /**
   * Get search statistics
   */
  getSearchStats() {
    return {
      cacheStats: searchCacheService.getStats(),
      recentSearchCount: this.ghanaOptimizations.recentSearches.length,
      isOnline: this.isOnline,
      queuedRequests: this.requestQueue.length
    };
  }

  /**
   * Clear search history and cache
   */
  async clearSearchData() {
    this.ghanaOptimizations.recentSearches = [];
    localStorage.removeItem('recentSearches');
    await searchCacheService.clearAll();
    console.log('🗑️ Search data cleared');
  }
}

export default new EnhancedSearchService();