export = performanceMonitor;
declare const performanceMonitor: PerformanceMonitor;
declare class PerformanceMonitor {
    constructor(config?: {});
    config: {
        slowRequestThreshold: any;
        errorAlertThreshold: any;
        memoryAlertThreshold: any;
        metricsRetention: any;
        aggregationInterval: any;
        alertingEnabled: boolean;
        detailedMetrics: boolean;
    };
    requests: any[];
    slowRequests: any[];
    errors: any[];
    metricsHistory: any[];
    currentWindow: {
        startTime: number;
        requests: number;
        errors: number;
        totalLatency: number;
        latencies: any[];
        endpoints: Map<any, any>;
        statusCodes: Map<any, any>;
    };
    systemMetrics: {
        memoryUsage: any[];
        cpuUsage: any[];
    };
    /**
     * INITIALIZE MONITOR
     */
    init(): void;
    /**
     * START REQUEST TRACKING
     */
    startRequest(req: any): {
        id: string;
        method: any;
        path: any;
        endpoint: string;
        startTime: number;
        startMemory: number;
        userAgent: any;
        ip: any;
        userId: any;
    };
    /**
     * END REQUEST TRACKING
     */
    endRequest(metric: any, statusCode: any, error?: any): any;
    /**
     * AGGREGATE METRICS (called every interval)
     */
    aggregateMetrics(): void;
    /**
     * TRACK SYSTEM METRICS
     */
    trackSystemMetrics(): void;
    /**
     * CHECK ALERTS
     */
    checkAlerts(): void;
    /**
     * GET CURRENT METRICS
     */
    getMetrics(): {
        current: {
            requests: number;
            errors: number;
            errorRate: string;
            avgLatency: string;
        };
        latest: any;
        system: {
            memory: {
                heapUsed: string;
                heapTotal: string;
                rss: string;
            };
            uptime: string;
        };
        slowRequests: {
            endpoint: any;
            latency: string;
            timestamp: string;
        }[];
        recentErrors: {
            endpoint: any;
            statusCode: any;
            latency: string;
            timestamp: string;
        }[];
        history: any[];
    };
    /**
     * GET DETAILED METRICS FOR ENDPOINT
     */
    getEndpointMetrics(endpoint: any): {
        endpoint: any;
        count: number;
        errors: number;
        errorRate: string;
        avgLatency: string;
        p50: string;
        p95: string;
        p99: string;
        maxLatency: string;
        minLatency: string;
    };
    /**
     * CALCULATE PERCENTILE
     */
    calculatePercentile(values: any, percentile: any): any;
    /**
     * GET CLIENT IP
     */
    getClientIP(req: any): any;
    /**
     * GENERATE UNIQUE ID
     */
    generateId(): string;
    /**
     * RESET METRICS
     */
    reset(): void;
}
//# sourceMappingURL=performanceMonitor.d.ts.map