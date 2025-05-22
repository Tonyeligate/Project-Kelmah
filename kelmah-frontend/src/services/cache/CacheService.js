import localforage from 'localforage';

class CacheService {
  constructor() {
    this.store = localforage.createInstance({
      name: 'kelmaCache',
    });
    this.memoryCache = new Map();
  }

  async get(key, options = {}) {
    const { useMemory = true, ttl = 3600 } = options;

    // Check memory cache first
    if (useMemory && this.memoryCache.has(key)) {
      const { value, timestamp } = this.memoryCache.get(key);
      if (Date.now() - timestamp < ttl * 1000) {
        return value;
      }
      this.memoryCache.delete(key);
    }

    // Check persistent cache
    try {
      const cached = await this.store.getItem(key);
      if (cached && Date.now() - cached.timestamp < ttl * 1000) {
        if (useMemory) {
          this.memoryCache.set(key, cached);
        }
        return cached.value;
      }
      await this.store.removeItem(key);
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }
    return null;
  }

  async set(key, value, options = {}) {
    const { useMemory = true } = options;
    const cacheItem = {
      value,
      timestamp: Date.now(),
    };

    try {
      if (useMemory) {
        this.memoryCache.set(key, cacheItem);
      }
      await this.store.setItem(key, cacheItem);
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  async clear() {
    this.memoryCache.clear();
    await this.store.clear();
  }
}

export default new CacheService(); 