// For frontend use, use ES Module syntax
class PerformanceService {
    constructor() {
        this.metrics = new Map();
        this.isNode = typeof window === 'undefined';
    }

    now() {
        return this.isNode ? process.hrtime() : performance.now();
    }

    trackApiCall(endpoint, startTime) {
        const duration = this.isNode 
            ? this.getNodeDuration(startTime)
            : performance.now() - startTime;

        if (!this.metrics.has(endpoint)) {
            this.metrics.set(endpoint, {
                count: 0,
                totalDuration: 0,
                avgDuration: 0
            });
        }

        const metric = this.metrics.get(endpoint);
        metric.count++;
        metric.totalDuration += duration;
        metric.avgDuration = metric.totalDuration / metric.count;
    }

    trackError(endpoint, error) {
        console.error('API Error:', {
            endpoint,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    getNodeDuration(startTime) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        return seconds * 1000 + nanoseconds / 1000000;
    }

    getMetrics() {
        return Array.from(this.metrics.entries()).map(([path, metrics]) => ({
            path,
            ...metrics
        }));
    }

    clearMetrics() {
        this.metrics.clear();
    }
}

// Create a default instance
const performanceService = new PerformanceService();

// Export the default instance
export default performanceService;

// Also export the class if needed
export { PerformanceService }; 