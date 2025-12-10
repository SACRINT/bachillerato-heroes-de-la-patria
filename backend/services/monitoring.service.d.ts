/**
 * 📊 MONITORING SERVICE - TypeScript Version
 * Servicio de Monitoreo del Sistema BGE
 * Monitoreo, métricas, alertas y health checks
 * Refactorizado: 07 Diciembre 2025
 */
import { Request, Response, NextFunction } from 'express';
export interface RequestMetrics {
    total: number;
    success: number;
    errors: number;
    byEndpoint: Map<string, number>;
    byStatusCode: Map<string, number>;
}
export interface PerformanceMetrics {
    avgResponseTime: number;
    totalResponseTime: number;
    requestCount: number;
    slowRequests: number;
}
export interface ErrorRecord {
    timestamp: string;
    message: string;
    stack?: string;
    endpoint: string | null;
    userId: number | null;
}
export interface AlertConfig {
    errorRateThreshold: number;
    avgResponseTimeThreshold: number;
    memoryThreshold: number;
    cpuThreshold: number;
    diskThreshold: number;
}
export interface Alert {
    id: string;
    type: string;
    severity: 'warning' | 'critical';
    data: Record<string, any>;
    timestamp: string;
    acknowledged: boolean;
    acknowledgedAt?: string;
}
export interface SystemMetrics {
    platform: string;
    arch: string;
    hostname: string;
    uptime: number;
    loadAverage: number[];
    cpu: {
        count: number;
        model: string;
        usage: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        usage: number;
    };
    process: {
        pid: number;
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        nodeVersion: string;
    };
}
export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: Record<string, {
        status: string;
        responseTime?: number;
        usage?: string;
        rate?: string;
        error?: string;
    }>;
}
declare class MonitoringService {
    private metrics;
    private alertConfig;
    private activeAlerts;
    private metricsHistory;
    private maxHistoryLength;
    constructor();
    middleware(): (req: Request, res: Response, next: NextFunction) => void;
    recordRequest(req: Request, res: Response, duration: number): void;
    recordError(error: Error, req?: Request): void;
    private startMetricsCollection;
    private collectSystemMetrics;
    getSystemMetrics(): SystemMetrics;
    healthCheck(): Promise<HealthCheckResult>;
    private checkAlerts;
    private createAlert;
    getDashboard(): any;
    getTopEndpoints(limit?: number): Array<{
        endpoint: string;
        count: number;
    }>;
    getHistory(hours?: number): any[];
    getRecentErrors(limit?: number): ErrorRecord[];
    acknowledgeAlert(alertId: string): boolean;
    reset(): void;
    getPrometheusMetrics(): string;
}
declare const monitoringService: MonitoringService;
export { MonitoringService };
export default monitoringService;
//# sourceMappingURL=monitoring.service.d.ts.map