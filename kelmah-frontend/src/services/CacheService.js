class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttl = new Map(); // Time to live
        // Add automatic cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanExpired(), 5 * 60 * 1000); // Cleanup every 5 minutes
    }

    // Set cache with optional TTL (time to live in seconds)
    set(key, value, ttlSeconds = 3600) {
        try {
            this.cache.set(key, value);
            this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    // Get cached value if not expired
    get(key) {
        try {
            if (!this.cache.has(key)) {
                return null;
            }

            const expiryTime = this.ttl.get(key);
            if (Date.now() > expiryTime) {
                this.delete(key);
                return null;
            }

            return this.cache.get(key);
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    // Delete cache entry
    delete(key) {
        try {
            this.cache.delete(key);
            this.ttl.delete(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    // Clear all cache
    clear() {
        try {
            this.cache.clear();
            this.ttl.clear();
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }

    // Clean expired entries
    cleanExpired() {
        try {
            const now = Date.now();
            let cleanedCount = 0;
            
            for (const [key, expiryTime] of this.ttl.entries()) {
                if (now > expiryTime) {
                    this.delete(key);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                console.debug(`Cleaned ${cleanedCount} expired cache entries`);
            }
            
            return cleanedCount;
        } catch (error) {
            console.error('Cache cleanup error:', error);
            return 0;
        }
    }

    // Destroy the service (useful for cleanup)
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

// Export a singleton instance
export default new CacheService(); 