/**
 * 📊 PERFORMANCE MONITOR - SEMANA 26
 * Sistema de Application Performance Monitoring (APM)
 *
 * Features:
 * - Request latency tracking (p50, p95, p99)
 * - Throughput measurement (requests/second)
 * - Error rate monitoring
 * - Memory usage tracking
 * - CPU usage tracking (approximation)
 * - Slow endpoint detection (>500ms)
 * - Real-time metrics dashboard
 * - Historical data with time windows
 * - Alerting capabilities
 * - Portable y modular
 *
 * Uso:
 * ```javascript
 * const performanceMonitor = require('./services/performanceMonitor');
 *
 * // Track request
 * const metric = performanceMonitor.startRequest(req);
 * // ... handle request ...
 * performanceMonitor.endRequest(metric, res.statusCode);
 *
 * // Get metrics
 * const metrics = performanceMonitor.getMetrics();
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger');

class PerformanceMonitor {
    constructor(config = {}) {
        this.config = {
            // Thresholds
            slowRequestThreshold: config.slowRequestThreshold || 500,     // ms
            errorAlertThreshold: config.errorAlertThreshold || 5,         // %
            memoryAlertThreshold: config.memoryAlertThreshold || 512 * 1024 * 1024, // 512MB

            // Time windows
            metricsRetention: config.metricsRetention || 60 * 60 * 1000,  // 1 hour
            aggregationInterval: config.aggregationInterval || 60 * 1000,  // 1 minute

            // Features
            alertingEnabled: config.alertingEnabled !== false,
            detailedMetrics: config.detailedMetrics !== false,

            ...config
        };

        // Request tracking
        this.requests = [];
        this.slowRequests = [];
        this.errors = [];

        // Aggregated metrics by time window
        this.metricsHistory = [];

        // Current window metrics
        this.currentWindow = {
            startTime: Date.now(),
            requests: 0,
            errors: 0,
            totalLatency: 0,
            latencies: [],
            endpoints: new Map(),
            statusCodes: new Map()
        };

        // System metrics
        this.systemMetrics = {
            memoryUsage: [],
            cpuUsage: []
        };

        // Initialize
        this.init();

        devLogger.log('PERF-MONITOR', '📊 Performance Monitor initialized');
    }

    /**
     * INITIALIZE MONITOR
     */
    init() {
        // Agregar al final del 'ticked' event loop para no bloq, this.config.aggregationInterval);

        // Track system metrics cada 10 segundos
        setInterval(() => this.trackSystemMetrics(), 10 * 1000);

        devLogger.log('PERF-MONITOR', `✅ Monitoring started (aggregation: ${this.config.aggregationInterval}ms)`);
    }

    /**
     * START REQUEST TRACKING
     */
    startRequest(req) {
        const metric = {
            id: this.generateId(),
            method: req.method,
            path: req.path || req.url,
            endpoint: `${req.method} ${req.path || req.url}`,
            startTime: Date.now(),
            startMemory: process.memoryUsage().heapUsed,
            userAgent: req.headers['user-agent'] || 'unknown',
            ip: this.getClientIP(req),
            userId: req.user ? req.user.id : null
        };

        this.requests.push(metric);

        return metric;
    }

    /**
     * END REQUEST TRACKING
     */
    endRequest(metric, statusCode, error = null) {
        const endTime = Date.now();
        const latency = endTime - metric.startTime;

        // Update metric
        metric.endTime = endTime;
        metric.latency = latency;
        metric.statusCode = statusCode;
        metric.error = error;
        metric.memoryDelta = process.memoryUsage().heapUsed - metric.startMemory;

        // Track in current window
        this.currentWindow.requests++;
        this.currentWindow.totalLatency += latency;
        this.currentWindow.latencies.push(latency);

        // Track endpoint
        const endpointStats = this.currentWindow.endpoints.get(metric.endpoint) || {
            count: 0,
            totalLatency: 0,
            errors: 0,
            latencies: []
        };

        endpointStats.count++;
        endpointStats.totalLatency += latency;
        endpointStats.latencies.push(latency);

        if (statusCode >= 400) {
            endpointStats.errors++;
        }

        this.currentWindow.endpoints.set(metric.endpoint, endpointStats);

        // Track status code
        const statusCount = this.currentWindow.statusCodes.get(statusCode) || 0;
        this.currentWindow.statusCodes.set(statusCode, statusCount + 1);

        // Track errors
        if (statusCode >= 400) {
            this.currentWindow.errors++;
            this.errors.push({
                ...metric,
                timestamp: endTime
            });
        }

        // Track slow requests
        if (latency > this.config.slowRequestThreshold) {
            this.slowRequests.push({
                ...metric,
                timestamp: endTime
            });

            devLogger.warn('PERF-MONITOR', `🐢 Slow request detected: ${metric.endpoint} (${latency}ms)`);
        }

        // Alert if error rate too high
        if (this.config.alertingEnabled) {
            this.checkAlerts();
        }

        return metric;
    }

    /**
     * AGGREGATE METRICS (called every interval)
     */
    aggregateMetrics() {
        const now = Date.now();
        const windowDuration = now - this.currentWindow.startTime;

        if (this.currentWindow.requests === 0) {
            return; // No requests in this window
        }

        // Calculate aggregated metrics
        const aggregated = {
            timestamp: now,
            window: windowDuration,

            // Request metrics
            requests: this.currentWindow.requests,
            errors: this.currentWindow.errors,
            errorRate: (this.currentWindow.errors / this.currentWindow.requests * 100).toFixed(2),

            // Latency metrics
            avgLatency: (this.currentWindow.totalLatency / this.currentWindow.requests).toFixed(2),
            p50: this.calculatePercentile(this.currentWindow.latencies, 50),
            p95: this.calculatePercentile(this.currentWindow.latencies, 95),
            p99: this.calculatePercentile(this.currentWindow.latencies, 99),
            maxLatency: Math.max(...this.currentWindow.latencies),
            minLatency: Math.min(...this.currentWindow.latencies),

            // Throughput
            throughput: (this.currentWindow.requests / (windowDuration / 1000)).toFixed(2), // req/s

            // Top endpoints
            endpoints: Array.from(this.currentWindow.endpoints.entries())
                .map(([endpoint, stats]) => ({
                    endpoint,
                    count: stats.count,
                    avgLatency: (stats.totalLatency / stats.count).toFixed(2),
                    errorRate: (stats.errors / stats.count * 100).toFixed(2)
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),

            // Status codes
            statusCodes: Object.fromEntries(this.currentWindow.statusCodes)
        };

        // Add to history
        this.metricsHistory.push(aggregated);

        // Cleanup old history
        const cutoffTime = now - this.config.metricsRetention;
        this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoffTime);

        // Reset current window
        this.currentWindow = {
            startTime: now,
            requests: 0,
            errors: 0,
            totalLatency: 0,
            latencies: [],
            endpoints: new Map(),
            statusCodes: new Map()
        };

        devLogger.log('PERF-MONITOR', `📊 Metrics aggregated: ${aggregated.requests} reqs, avg ${aggregated.avgLatency}ms`);
    }

    /**
     * TRACK SYSTEM METRICS
     */
    trackSystemMetrics() {
        const now = Date.now();
        const memUsage = process.memoryUsage();

        // Memory metrics
        this.systemMetrics.memoryUsage.push({
            timestamp: now,
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            rss: memUsage.rss,
            external: memUsage.external
        });

        // CPU metrics (approximation using process.cpuUsage())
        const cpuUsage = process.cpuUsage();
        this.systemMetrics.cpuUsage.push({
            timestamp: now,
            user: cpuUsage.user,
            system: cpuUsage.system
        });

        // Cleanup old metrics
        const cutoffTime = now - this.config.metricsRetention;
        this.systemMetrics.memoryUsage = this.systemMetrics.memoryUsage.filter(m => m.timestamp > cutoffTime);
        this.systemMetrics.cpuUsage = this.systemMetrics.cpuUsage.filter(m => m.timestamp > cutoffTime);
    }

    /**
     * CHECK ALERTS
     */
    checkAlerts() {
        const errorRate = this.currentWindow.errors / this.currentWindow.requests * 100;

        // Alert on high error rate
        if (errorRate > this.config.errorAlertThreshold) {
            devLogger.error('PERF-MONITOR', `🚨 HIGH ERROR RATE: ${errorRate.toFixed(2)}%`);
            // TODO: Send email/slack alert
        }

        // Alert on high memory usage
        const memUsed = process.memoryUsage().heapUsed;
        if (memUsed > this.config.memoryAlertThreshold) {
            devLogger.error('PERF-MONITOR', `🚨 HIGH MEMORY USAGE: ${(memUsed / 1024 / 1024).toFixed(2)} MB`);
            // TODO: Send email/slack alert
        }
    }

    /**
     * GET CURRENT METRICS
     */
    getMetrics() {
        const now = Date.now();
        const latestHistory = this.metricsHistory[this.metricsHistory.length - 1];

        // System metrics
        const latestMemory = this.systemMetrics.memoryUsage[this.systemMetrics.memoryUsage.length - 1];

        return {
            // Current window
            current: {
                requests: this.currentWindow.requests,
                errors: this.currentWindow.errors,
                errorRate: this.currentWindow.requests > 0
                    ? (this.currentWindow.errors / this.currentWindow.requests * 100).toFixed(2) + '%'
                    : '0%',
                avgLatency: this.currentWindow.requests > 0
                    ? (this.currentWindow.totalLatency / this.currentWindow.requests).toFixed(2) + 'ms'
                    : '0ms'
            },

            // Latest aggregated metrics
            latest: latestHistory || null,

            // System metrics
            system: {
                memory: latestMemory ? {
                    heapUsed: `${(latestMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                    heapTotal: `${(latestMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                    rss: `${(latestMemory.rss / 1024 / 1024).toFixed(2)} MB`
                } : null,
                uptime: `${(process.uptime() / 60).toFixed(2)} minutes`
            },

            // Slow requests (last 10)
            slowRequests: this.slowRequests.slice(-10).map(req => ({
                endpoint: req.endpoint,
                latency: `${req.latency}ms`,
                timestamp: new Date(req.timestamp).toISOString()
            })),

            // Recent errors (last 10)
            recentErrors: this.errors.slice(-10).map(err => ({
                endpoint: err.endpoint,
                statusCode: err.statusCode,
                latency: `${err.latency}ms`,
                timestamp: new Date(err.timestamp).toISOString()
            })),

            // Historical data (last 10 windows)
            history: this.metricsHistory.slice(-10)
        };
    }

    /**
     * GET DETAILED METRICS FOR ENDPOINT
     */
    getEndpointMetrics(endpoint) {
        // Filter requests for this endpoint
        const endpointRequests = this.requests.filter(r =>
            r.endpoint === endpoint && r.latency !== undefined
        );

        if (endpointRequests.length === 0) {
            return null;
        }

        const latencies = endpointRequests.map(r => r.latency);
        const errors = endpointRequests.filter(r => r.statusCode >= 400).length;

        return {
            endpoint,
            count: endpointRequests.length,
            errors,
            errorRate: (errors / endpointRequests.length * 100).toFixed(2) + '%',
            avgLatency: (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) + 'ms',
            p50: this.calculatePercentile(latencies, 50) + 'ms',
            p95: this.calculatePercentile(latencies, 95) + 'ms',
            p99: this.calculatePercentile(latencies, 99) + 'ms',
            maxLatency: Math.max(...latencies) + 'ms',
            minLatency: Math.min(...latencies) + 'ms'
        };
    }

    /**
     * CALCULATE PERCENTILE
     */
    calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;

        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;

        return sorted[index];
    }

    /**
     * GET CLIENT IP
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               'unknown';
    }

    /**
     * GENERATE UNIQUE ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * RESET METRICS
     */
    reset() {
        this.requests = [];
        this.slowRequests = [];
        this.errors = [];
        this.metricsHistory = [];
        this.currentWindow = {
            startTime: Date.now(),
            requests: 0,
            errors: 0,
            totalLatency: 0,
            latencies: [],
            endpoints: new Map(),
            statusCodes: new Map()
        };

        devLogger.log('PERF-MONITOR', '🔄 Metrics reset');
    }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
