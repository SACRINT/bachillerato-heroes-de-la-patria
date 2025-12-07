/**
 * ⚡ PERFORMANCE SERVICE - TypeScript Version
 * Optimización y análisis de rendimiento
 *
 * Features:
 * - Query optimization
 * - Memory profiling
 * - Response time tracking
 * - Bottleneck detection
 * - Performance recommendations
 *
 * Refactorizado: 07 Diciembre 2025
 */

import { Request, Response, NextFunction } from 'express';
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface QueryMetric {
    query: string;
    duration: number;
    rows: number;
    timestamp: number;
    slow: boolean;
}

export interface RequestMetric {
    method: string;
    path: string;
    duration: number;
    statusCode: number;
    timestamp: number;
    slow: boolean;
}

export interface MemorySnapshot {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedPercent: string;
    timestamp: number;
}

export interface Metrics {
    queries: QueryMetric[];
    requests: RequestMetric[];
    memory: MemorySnapshot[];
}

export interface Thresholds {
    slowQuery: number;
    slowRequest: number;
    highMemory: number;
}

export interface Bottleneck {
    type: 'slow_query_pattern' | 'slow_endpoint' | 'high_memory';
    severity: 'high' | 'critical';
    description: string;
    pattern?: string;
    endpoint?: string;
    heapUsed?: number;
}

export interface Recommendation {
    priority: 'high' | 'critical' | 'medium';
    category: 'database' | 'api' | 'memory';
    action: string;
    details: string;
}

export interface PerformanceStats {
    queries: {
        total: number;
        slow: number;
        avgDuration: number;
        p95Duration: number;
        p99Duration: number;
    };
    requests: {
        total: number;
        slow: number;
        avgDuration: number;
        p95Duration: number;
        p99Duration: number;
    };
    memory: MemorySnapshot | null;
}

// ============================================
// PERFORMANCE SERVICE CLASS
// ============================================

class PerformanceService {
    private metrics: Metrics;
    private thresholds: Thresholds;

    constructor() {
        this.metrics = {
            queries: [],
            requests: [],
            memory: []
        };
        this.thresholds = {
            slowQuery: 100,      // ms
            slowRequest: 500,    // ms
            highMemory: 80       // % de heap
        };
    }

    // Tracking de queries
    trackQuery(query: string, duration: number, rows: number = 0): QueryMetric {
        const metric: QueryMetric = {
            query: query.substring(0, 200),
            duration,
            rows,
            timestamp: Date.now(),
            slow: duration > this.thresholds.slowQuery
        };

        this.metrics.queries.push(metric);

        // Mantener últimas 1000 queries
        if (this.metrics.queries.length > 1000) {
            this.metrics.queries.shift();
        }

        if (metric.slow) {
            devLogger.warn(`[PERFORMANCE] Query lenta (${duration}ms): ${query.substring(0, 100)}...`);
        }

        return metric;
    }

    // Tracking de requests HTTP
    trackRequest(method: string, path: string, duration: number, statusCode: number): RequestMetric {
        const metric: RequestMetric = {
            method,
            path,
            duration,
            statusCode,
            timestamp: Date.now(),
            slow: duration > this.thresholds.slowRequest
        };

        this.metrics.requests.push(metric);

        if (this.metrics.requests.length > 1000) {
            this.metrics.requests.shift();
        }

        if (metric.slow) {
            devLogger.warn(`[PERFORMANCE] Request lenta (${duration}ms): ${method} ${path}`);
        }

        return metric;
    }

    // Snapshot de memoria
    captureMemorySnapshot(): MemorySnapshot {
        const usage = process.memoryUsage();
        const heapUsedPercent = (usage.heapUsed / usage.heapTotal * 100).toFixed(2);

        const snapshot: MemorySnapshot = {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024),
            rss: Math.round(usage.rss / 1024 / 1024),
            heapUsedPercent,
            timestamp: Date.now()
        };

        this.metrics.memory.push(snapshot);

        if (this.metrics.memory.length > 100) {
            this.metrics.memory.shift();
        }

        if (parseFloat(heapUsedPercent) > this.thresholds.highMemory) {
            devLogger.warn(`[PERFORMANCE] Memoria alta: ${heapUsedPercent}% de heap usado`);
        }

        return snapshot;
    }

    // Análisis de queries lentas
    getSlowQueries(limit: number = 20): QueryMetric[] {
        return this.metrics.queries
            .filter(q => q.slow)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }

    // Análisis de requests lentas
    getSlowRequests(limit: number = 20): RequestMetric[] {
        return this.metrics.requests
            .filter(r => r.slow)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }

    // Estadísticas generales
    getStats(): PerformanceStats {
        const queryDurations = this.metrics.queries.map(q => q.duration);
        const requestDurations = this.metrics.requests.map(r => r.duration);

        return {
            queries: {
                total: this.metrics.queries.length,
                slow: this.metrics.queries.filter(q => q.slow).length,
                avgDuration: this.average(queryDurations),
                p95Duration: this.percentile(queryDurations, 95),
                p99Duration: this.percentile(queryDurations, 99)
            },
            requests: {
                total: this.metrics.requests.length,
                slow: this.metrics.requests.filter(r => r.slow).length,
                avgDuration: this.average(requestDurations),
                p95Duration: this.percentile(requestDurations, 95),
                p99Duration: this.percentile(requestDurations, 99)
            },
            memory: this.metrics.memory.length > 0
                ? this.metrics.memory[this.metrics.memory.length - 1]
                : null
        };
    }

    // Detectar cuellos de botella
    detectBottlenecks(): Bottleneck[] {
        const bottlenecks: Bottleneck[] = [];

        // Queries lentas frecuentes
        const slowQueryPatterns: Record<string, number> = {};
        for (const query of this.getSlowQueries(100)) {
            const pattern = query.query.substring(0, 50);
            slowQueryPatterns[pattern] = (slowQueryPatterns[pattern] || 0) + 1;
        }

        for (const [pattern, count] of Object.entries(slowQueryPatterns)) {
            if (count >= 5) {
                bottlenecks.push({
                    type: 'slow_query_pattern',
                    severity: 'high',
                    description: `Query pattern ejecutada ${count} veces lentamente`,
                    pattern
                });
            }
        }

        // Endpoints lentos
        const slowEndpoints: Record<string, number> = {};
        for (const request of this.getSlowRequests(100)) {
            const key = `${request.method} ${request.path}`;
            slowEndpoints[key] = (slowEndpoints[key] || 0) + 1;
        }

        for (const [endpoint, count] of Object.entries(slowEndpoints)) {
            if (count >= 5) {
                bottlenecks.push({
                    type: 'slow_endpoint',
                    severity: 'high',
                    description: `Endpoint con ${count} requests lentas`,
                    endpoint
                });
            }
        }

        // Memoria alta
        const latestMemory = this.metrics.memory[this.metrics.memory.length - 1];
        if (latestMemory && parseFloat(latestMemory.heapUsedPercent) > this.thresholds.highMemory) {
            bottlenecks.push({
                type: 'high_memory',
                severity: 'critical',
                description: `Uso de memoria: ${latestMemory.heapUsedPercent}%`,
                heapUsed: latestMemory.heapUsed
            });
        }

        return bottlenecks;
    }

    // Recomendaciones de optimización
    getRecommendations(): Recommendation[] {
        const recommendations: Recommendation[] = [];
        const bottlenecks = this.detectBottlenecks();

        for (const bottleneck of bottlenecks) {
            if (bottleneck.type === 'slow_query_pattern') {
                recommendations.push({
                    priority: 'high',
                    category: 'database',
                    action: 'Agregar índice o optimizar query',
                    details: bottleneck.pattern || ''
                });
            }

            if (bottleneck.type === 'slow_endpoint') {
                recommendations.push({
                    priority: 'high',
                    category: 'api',
                    action: 'Implementar caching o optimizar lógica',
                    details: bottleneck.endpoint || ''
                });
            }

            if (bottleneck.type === 'high_memory') {
                recommendations.push({
                    priority: 'critical',
                    category: 'memory',
                    action: 'Revisar memory leaks y reducir buffering',
                    details: `${bottleneck.heapUsed}MB usado`
                });
            }
        }

        return recommendations;
    }

    // Helpers matemáticos
    private average(arr: number[]): number {
        if (arr.length === 0) return 0;
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }

    private percentile(arr: number[], p: number): number {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    // Middleware para Express
    middleware(): (req: Request, res: Response, next: NextFunction) => void {
        return (req: Request, res: Response, next: NextFunction) => {
            const start = Date.now();

            res.on('finish', () => {
                const duration = Date.now() - start;
                this.trackRequest(req.method, req.path, duration, res.statusCode);
            });

            next();
        };
    }

    reset(): void {
        this.metrics = {
            queries: [],
            requests: [],
            memory: []
        };
    }
}

// ============================================
// EXPORTS
// ============================================

const performanceService = new PerformanceService();

export { PerformanceService };
export default performanceService;

module.exports = performanceService;
module.exports.PerformanceService = PerformanceService;
