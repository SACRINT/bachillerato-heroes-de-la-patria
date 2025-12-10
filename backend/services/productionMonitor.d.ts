export = productionMonitor;
declare const productionMonitor: ProductionMonitor;
declare class ProductionMonitor {
    constructor(config?: {});
    config: {
        metricsInterval: any;
        healthCheckInterval: any;
        cpuThreshold: any;
        memoryThreshold: any;
        diskThreshold: any;
        errorRateThreshold: any;
        responseTimeThreshold: any;
        collectSystemMetrics: boolean;
        collectAppMetrics: boolean;
        healthChecksEnabled: boolean;
        alertingEnabled: boolean;
    };
    metrics: {
        system: {};
        application: {};
        health: {};
        uptime: {
            startTime: number;
            totalRequests: number;
            successfulRequests: number;
            failedRequests: number;
        };
    };
    metricsTimer: NodeJS.Timeout;
    healthCheckTimer: NodeJS.Timeout;
    alerts: any[];
    /**
     * START MONITORING
     */
    start(): void;
    /**
     * STOP MONITORING
     */
    stop(): void;
    /**
     * COLLECT ALL METRICS
     */
    collectMetrics(): Promise<void>;
    /**
     * COLLECT SYSTEM METRICS
     */
    collectSystemMetrics(): void;
    /**
     * COLLECT APPLICATION METRICS
     */
    collectApplicationMetrics(): Promise<void>;
    /**
     * GET DATABASE METRICS
     */
    getDatabaseMetrics(): Promise<{
        totalConnections: any;
        idleConnections: any;
        waitingConnections: any;
    } | {
        healthy: boolean;
        error: any;
    }>;
    /**
     * RUN HEALTH CHECKS
     */
    runHealthChecks(): Promise<{
        timestamp: number;
        overall: string;
        checks: {};
    }>;
    /**
     * CHECK DATABASE HEALTH
     */
    checkDatabaseHealth(): Promise<{
        status: string;
        latency: number;
        critical: boolean;
        error?: undefined;
    } | {
        status: string;
        error: any;
        critical: boolean;
        latency?: undefined;
    }>;
    /**
     * CHECK REDIS HEALTH
     */
    checkRedisHealth(): Promise<{
        status: string;
        critical: boolean;
    }>;
    /**
     * CHECK DISK SPACE
     */
    checkDiskSpace(): {
        status: string;
        usagePercent: string;
        critical: boolean;
    };
    /**
     * CHECK MEMORY
     */
    checkMemory(): {
        status: string;
        heapUsagePercent: string;
        critical: boolean;
    };
    /**
     * CHECK CPU
     */
    checkCPU(): {
        status: string;
        loadAverage: number;
        cpuCount: number;
        normalizedPercent: string;
        critical: boolean;
    };
    /**
     * CHECK THRESHOLDS AND ALERT
     */
    checkThresholds(): void;
    /**
     * RAISE ALERT
     */
    raiseAlert(type: any, message: any, data: any): void;
    /**
     * GET METRICS
     */
    getMetrics(): {
        system: {};
        application: {};
        health: {};
        uptime: {
            startTime: number;
            totalRequests: number;
            successfulRequests: number;
            failedRequests: number;
        };
    };
    /**
     * GET HEALTH STATUS
     */
    getHealth(): {};
    /**
     * GET ALERTS
     */
    getAlerts(): any[];
    /**
     * EXPORT PROMETHEUS METRICS
     */
    exportPrometheusMetrics(): string;
    /**
     * RECORD REQUEST
     */
    recordRequest(success?: boolean): void;
}
//# sourceMappingURL=productionMonitor.d.ts.map