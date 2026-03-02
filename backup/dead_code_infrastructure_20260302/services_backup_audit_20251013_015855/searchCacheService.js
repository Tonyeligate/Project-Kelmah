/**
 * Advanced Search Result Caching Service
 * Optimized for Ghana's network conditions with intelligent caching strategies
 */

class SearchCacheService {
  constructor() {
    this.cacheName = 'kelmah-search-cache-v2';
    this.dbName = 'KelmahSearchDB';
    this.dbVersion = 2;
    this.storeName = 'searchResults';
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB cache limit
    this.defaultTTL = 24 * 60 * 60 * 1000; // 24 hours
    this.db = null;
    this.memoryCache = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;

    // Ghana-specific cache policies
    this.cachePolicies = {
      jobs: {
        ttl: 30 * 60 * 1000, // 30 minutes for jobs
        priority: 'high',
        preload: true,
      },
      workers: {
        ttl: 60 * 60 * 1000, // 1 hour for workers
        priority: 'high',
        preload: true,
      },
      locations: {
        ttl: 7 * 24 * 60 * 60 * 1000, // 1 week for locations
        priority: 'medium',
        preload: true,
      },
      categories: {
        ttl: 7 * 24 * 60 * 60 * 1000, // 1 week for categories
        priority: 'low',
        preload: false,
      },
      suggestions: {
        ttl: 6 * 60 * 60 * 1000, // 6 hours for suggestions
        priority: 'medium',
        preload: false,
      },
    };

    // Network condition adjustments
    this.networkOptimizations = {
      '2g': {
        cacheAggressive: true,
        ttlMultiplier: 2.0, // Keep cache longer on slow networks
        compressionLevel: 'high',
      },
      '3g': {
        cacheAggressive: true,
        ttlMultiplier: 1.5,
        compressionLevel: 'medium',
      },
      '4g': {
        cacheAggressive: false,
        ttlMultiplier: 1.0,
        compressionLevel: 'low',
      },
      wifi: {
        cacheAggressive: false,
        ttlMultiplier: 0.8, // Refresh more often on fast connections
        compressionLevel: 'none',
      },
    };

    this.init();
  }

  /**
   * Initialize the caching service
   */
  async init() {
    try {
      await this.initIndexedDB();
      await this.cleanExpiredEntries();
      await this.preloadCriticalData();

      // Listen for network changes
      this.setupNetworkListener();

      console.log('🗄️ Search cache service initialized');
    } catch (error) {
      console.error('Cache service initialization failed:', error);
    }
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  async initIndexedDB() {
    if (typeof indexedDB === 'undefined') {
      console.warn(
        'IndexedDB not available, search cache will use memory only',
      );
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create or upgrade the object store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'cacheKey',
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  /**
   * Generate cache key for search parameters
   */
  generateCacheKey(type, params) {
    const normalizedParams = this.normalizeParams(params);
    const paramString = JSON.stringify(normalizedParams);
    const hash = this.simpleHash(paramString);
    return `${type}_${hash}`;
  }

  /**
   * Normalize search parameters for consistent caching
   */
  normalizeParams(params) {
    const normalized = { ...params };

    // Normalize location
    if (normalized.location) {
      normalized.location = normalized.location.toLowerCase().trim();
    }

    // Normalize search query
    if (normalized.query || normalized.search) {
      const query = (normalized.query || normalized.search)
        .toLowerCase()
        .trim();
      normalized.search = query;
      delete normalized.query;
    }

    // Sort arrays for consistent keys
    if (normalized.skills && Array.isArray(normalized.skills)) {
      normalized.skills = normalized.skills.sort();
    }

    if (normalized.categories && Array.isArray(normalized.categories)) {
      normalized.categories = normalized.categories.sort();
    }

    // Remove pagination for broader cache hits
    delete normalized.page;
    delete normalized.offset;

    return normalized;
  }

  /**
   * Simple hash function for cache keys
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached search results
   */
  async getCached(type, params) {
    try {
      const cacheKey = this.generateCacheKey(type, params);

      // Try memory cache first (fastest)
      const memoryResult = this.memoryCache.get(cacheKey);
      if (memoryResult && !this.isExpired(memoryResult)) {
        this.cacheHits++;
        console.log(`💾 Memory cache hit: ${type}`);
        return memoryResult.data;
      }

      // Try IndexedDB cache
      const dbResult = await this.getFromIndexedDB(cacheKey);
      if (dbResult && !this.isExpired(dbResult)) {
        // Update memory cache
        this.memoryCache.set(cacheKey, dbResult);
        this.cacheHits++;
        console.log(`💽 DB cache hit: ${type}`);
        return dbResult.data;
      }

      this.cacheMisses++;
      console.log(`❌ Cache miss: ${type}`);
      return null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Store search results in cache
   */
  async setCached(type, params, data, customTTL = null) {
    try {
      const cacheKey = this.generateCacheKey(type, params);
      const policy = this.cachePolicies[type] || {};
      const networkType = this.detectNetworkType();
      const networkOpt =
        this.networkOptimizations[networkType] ||
        this.networkOptimizations['4g'];

      // Calculate TTL with network adjustments
      const baseTTL = customTTL || policy.ttl || this.defaultTTL;
      const adjustedTTL = baseTTL * networkOpt.ttlMultiplier;

      const cacheEntry = {
        cacheKey,
        type,
        data: this.compressData(data, networkOpt.compressionLevel),
        timestamp: Date.now(),
        expiresAt: Date.now() + adjustedTTL,
        ttl: adjustedTTL,
        params: this.normalizeParams(params),
        networkType,
        size: this.estimateSize(data),
      };

      // Store in memory cache
      this.memoryCache.set(cacheKey, cacheEntry);

      // Store in IndexedDB for persistence
      await this.saveToIndexedDB(cacheEntry);

      // Clean up if cache is getting too large
      await this.enforceStorageLimit();

      console.log(
        `💾 Cached ${type} results (${cacheEntry.size} bytes, TTL: ${Math.round(adjustedTTL / 1000 / 60)} min)`,
      );
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  /**
   * Get data from IndexedDB
   */
  async getFromIndexedDB(cacheKey) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          result.data = this.decompressData(result.data);
        }
        resolve(result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save data to IndexedDB
   */
  async saveToIndexedDB(cacheEntry) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(cacheEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(cacheEntry) {
    return Date.now() > cacheEntry.expiresAt;
  }

  /**
   * Clean expired entries from cache
   */
  async cleanExpiredEntries() {
    try {
      // Clean memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
        }
      }

      // Clean IndexedDB cache
      if (!this.db) return;

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(Date.now());

      const request = index.openCursor(range);
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`🧹 Cleaned ${deletedCount} expired cache entries`);
          }
        }
      };
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Enforce storage size limits
   */
  async enforceStorageLimit() {
    try {
      const usage = await this.getCacheUsage();

      if (usage.totalSize > this.maxCacheSize) {
        console.log(
          `📦 Cache size limit exceeded (${usage.totalSize} bytes), cleaning...`,
        );

        // Remove oldest low-priority entries first
        await this.evictLowPriorityEntries();

        // If still over limit, remove oldest entries
        const newUsage = await this.getCacheUsage();
        if (newUsage.totalSize > this.maxCacheSize) {
          await this.evictOldestEntries();
        }
      }
    } catch (error) {
      console.error('Storage limit enforcement error:', error);
    }
  }

  /**
   * Get cache usage statistics
   */
  async getCacheUsage() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve({ totalSize: 0, entryCount: 0 });
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result;
        const totalSize = entries.reduce(
          (sum, entry) => sum + (entry.size || 0),
          0,
        );

        resolve({
          totalSize,
          entryCount: entries.length,
          entries,
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Evict low-priority cache entries
   */
  async evictLowPriorityEntries() {
    const usage = await this.getCacheUsage();
    const lowPriorityTypes = Object.keys(this.cachePolicies).filter(
      (type) => this.cachePolicies[type].priority === 'low',
    );

    for (const entry of usage.entries) {
      if (lowPriorityTypes.includes(entry.type)) {
        await this.removeFromCache(entry.cacheKey);
      }
    }
  }

  /**
   * Evict oldest cache entries
   */
  async evictOldestEntries() {
    const usage = await this.getCacheUsage();
    const sortedEntries = usage.entries
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, Math.floor(usage.entryCount * 0.3)); // Remove oldest 30%

    for (const entry of sortedEntries) {
      await this.removeFromCache(entry.cacheKey);
    }
  }

  /**
   * Remove specific entry from cache
   */
  async removeFromCache(cacheKey) {
    // Remove from memory cache
    this.memoryCache.delete(cacheKey);

    // Remove from IndexedDB
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(cacheKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Preload critical data for Ghana market
   */
  async preloadCriticalData() {
    try {
      console.log(
        '🚀 Preloading critical search data disabled: no mock generation',
      );
    } catch (error) {
      console.error('Preload error:', error);
    }
  }

  /**
   * Generate mock search results for preloading
   */
  generateMockSearchResults(category, location) {
    // Removed mock result generation; return empty structure to avoid polluting cache
    return { results: [], total: 0, cached: false, generatedAt: Date.now() };
  }

  /**
   * Detect network connection type
   */
  detectNetworkType() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;

      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return '2g';
        case '3g':
          return '3g';
        case '4g':
          return '4g';
        default:
          return 'wifi';
      }
    }

    return '4g'; // Default assumption
  }

  /**
   * Setup network change listener
   */
  setupNetworkListener() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        const networkType = this.detectNetworkType();
        console.log(`📶 Network changed to: ${networkType}`);

        // Adjust cache behavior based on network
        this.adjustCacheForNetwork(networkType);
      });
    }

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Back online - warming cache...');
        this.warmCacheOnReconnect();
      });

      window.addEventListener('offline', () => {
        console.log('📴 Offline - relying on cache...');
      });
    }
  }

  /**
   * Adjust cache behavior for network conditions
   */
  adjustCacheForNetwork(networkType) {
    const optimization = this.networkOptimizations[networkType];

    if (optimization.cacheAggressive) {
      // Extend TTL for all cached items
      for (const [key, entry] of this.memoryCache.entries()) {
        entry.expiresAt = Date.now() + entry.ttl * optimization.ttlMultiplier;
      }
    }
  }

  /**
   * Warm cache when reconnecting
   */
  async warmCacheOnReconnect() {
    // Refresh high-priority cached items
    const highPriorityTypes = Object.keys(this.cachePolicies).filter(
      (type) => this.cachePolicies[type].priority === 'high',
    );

    // This would trigger background refresh of critical data
    console.log('♨️ Warming cache for:', highPriorityTypes);
  }

  /**
   * Compress data based on network conditions
   */
  compressData(data, level) {
    if (level === 'none') return data;

    try {
      const jsonString = JSON.stringify(data);

      // Simple compression - in production, use a proper compression library
      if (level === 'high') {
        // Remove extra whitespace and compress
        return JSON.parse(jsonString);
      }

      return data;
    } catch (error) {
      console.warn('Data compression failed:', error);
      return data;
    }
  }

  /**
   * Decompress cached data
   */
  decompressData(data) {
    // Simple decompression - reverse of compression logic
    return data;
  }

  /**
   * Estimate data size in bytes
   */
  estimateSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    const hitRate =
      this.cacheHits + this.cacheMisses > 0
        ? (
            (this.cacheHits / (this.cacheHits + this.cacheMisses)) *
            100
          ).toFixed(1)
        : 0;

    return {
      hitRate: `${hitRate}%`,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      memoryEntries: this.memoryCache.size,
      networkType: this.detectNetworkType(),
    };
  }

  /**
   * Clear all cache data
   */
  async clearAll() {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear IndexedDB cache
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await store.clear();
      }

      console.log('🗑️ All cache data cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Invalidate cache for specific type
   */
  async invalidateType(type) {
    try {
      // Remove from memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.type === type) {
          this.memoryCache.delete(key);
        }
      }

      // Remove from IndexedDB
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('type');
        const range = IDBKeyRange.only(type);

        const request = index.openCursor(range);
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      }

      console.log(`🗑️ Invalidated cache for type: ${type}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

// Export singleton instance
export default new SearchCacheService();
