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
declare class PerformanceService {
    private metrics;
    private thresholds;
    constructor();
    trackQuery(query: string, duration: number, rows?: number): QueryMetric;
    trackRequest(method: string, path: string, duration: number, statusCode: number): RequestMetric;
    captureMemorySnapshot(): MemorySnapshot;
    getSlowQueries(limit?: number): QueryMetric[];
    getSlowRequests(limit?: number): RequestMetric[];
    getStats(): PerformanceStats;
    detectBottlenecks(): Bottleneck[];
    getRecommendations(): Recommendation[];
    private average;
    private percentile;
    middleware(): (req: Request, res: Response, next: NextFunction) => void;
    reset(): void;
}
declare const performanceService: PerformanceService;
export { PerformanceService };
export default performanceService;
//# sourceMappingURL=performance.service.d.ts.map