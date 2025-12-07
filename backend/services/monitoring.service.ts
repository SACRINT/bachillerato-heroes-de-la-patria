/**
 * 📊 MONITORING SERVICE - TypeScript Version
 * Servicio de Monitoreo del Sistema BGE
 * Monitoreo, métricas, alertas y health checks
 * Refactorizado: 07 Diciembre 2025
 */

import os from 'os';
import { Request, Response, NextFunction } from 'express';
const pool = require('../data/database-access').pool;
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

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
    cpu: { count: number; model: string; usage: number };
    memory: { total: number; used: number; free: number; usage: number };
    process: { pid: number; uptime: number; memoryUsage: NodeJS.MemoryUsage; nodeVersion: string };
}

export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: Record<string, { status: string; responseTime?: number; usage?: string; rate?: string; error?: string }>;
}

// ============================================
// MONITORING SERVICE CLASS
// ============================================

class MonitoringService {
    private metrics: {
        requests: RequestMetrics;
        performance: PerformanceMetrics;
        errors: ErrorRecord[];
        uptime: number;
    };
    private alertConfig: AlertConfig;
    private activeAlerts: Alert[];
    private metricsHistory: any[];
    private maxHistoryLength: number;

    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                byEndpoint: new Map(),
                byStatusCode: new Map()
            },
            performance: {
                avgResponseTime: 0,
                totalResponseTime: 0,
                requestCount: 0,
                slowRequests: 0
            },
            errors: [],
            uptime: Date.now()
        };

        this.alertConfig = {
            errorRateThreshold: 0.05,
            avgResponseTimeThreshold: 1000,
            memoryThreshold: 0.90,
            cpuThreshold: 0.80,
            diskThreshold: 0.85
        };

        this.activeAlerts = [];
        this.metricsHistory = [];
        this.maxHistoryLength = 288;

        this.startMetricsCollection();
        devLogger.log('[MONITORING] Servicio de monitoreo inicializado');
    }

    middleware(): (req: Request, res: Response, next: NextFunction) => void {
        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = Date.now();
            const originalSend = res.send.bind(res);

            res.send = (body: any) => {
                const duration = Date.now() - startTime;
                this.recordRequest(req, res, duration);
                return originalSend(body);
            };

            next();
        };
    }

    recordRequest(req: Request, res: Response, duration: number): void {
        this.metrics.requests.total++;

        if (res.statusCode >= 200 && res.statusCode < 400) {
            this.metrics.requests.success++;
        } else {
            this.metrics.requests.errors++;
        }

        const endpoint = `${req.method} ${(req as any).route?.path || req.path}`;
        const endpointCount = this.metrics.requests.byEndpoint.get(endpoint) || 0;
        this.metrics.requests.byEndpoint.set(endpoint, endpointCount + 1);

        const statusCount = this.metrics.requests.byStatusCode.get(String(res.statusCode)) || 0;
        this.metrics.requests.byStatusCode.set(String(res.statusCode), statusCount + 1);

        this.metrics.performance.totalResponseTime += duration;
        this.metrics.performance.requestCount++;
        this.metrics.performance.avgResponseTime =
            this.metrics.performance.totalResponseTime / this.metrics.performance.requestCount;

        if (duration > 1000) {
            this.metrics.performance.slowRequests++;
        }

        this.checkAlerts();
    }

    recordError(error: Error, req?: Request): void {
        const errorRecord: ErrorRecord = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            endpoint: req ? `${req.method} ${req.path}` : null,
            userId: (req as any)?.user?.id || null
        };

        this.metrics.errors.push(errorRecord);

        if (this.metrics.errors.length > 100) {
            this.metrics.errors.shift();
        }
    }

    private startMetricsCollection(): void {
        setInterval(() => this.collectSystemMetrics(), 300000);
        this.collectSystemMetrics();
    }

    private collectSystemMetrics(): void {
        const systemMetrics = {
            timestamp: new Date().toISOString(),
            system: this.getSystemMetrics(),
            application: {
                requests: {
                    ...this.metrics.requests,
                    byEndpoint: Object.fromEntries(this.metrics.requests.byEndpoint),
                    byStatusCode: Object.fromEntries(this.metrics.requests.byStatusCode)
                },
                performance: { ...this.metrics.performance },
                errorCount: this.metrics.errors.length
            }
        };

        this.metricsHistory.push(systemMetrics);

        if (this.metricsHistory.length > this.maxHistoryLength) {
            this.metricsHistory.shift();
        }
    }

    getSystemMetrics(): SystemMetrics {
        const cpus = os.cpus();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        let totalIdle = 0;
        let totalTick = 0;
        for (const cpu of cpus) {
            for (const type of Object.keys(cpu.times) as (keyof typeof cpu.times)[]) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        const cpuUsage = 1 - (totalIdle / totalTick);

        return {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            uptime: os.uptime(),
            loadAverage: os.loadavg(),
            cpu: { count: cpus.length, model: cpus[0]?.model || 'unknown', usage: cpuUsage },
            memory: { total: totalMemory, used: usedMemory, free: freeMemory, usage: usedMemory / totalMemory },
            process: { pid: process.pid, uptime: process.uptime(), memoryUsage: process.memoryUsage(), nodeVersion: process.version }
        };
    }

    async healthCheck(): Promise<HealthCheckResult> {
        const checks: HealthCheckResult = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.metrics.uptime) / 1000),
            checks: {}
        };

        try {
            const dbStart = Date.now();
            await pool.query('SELECT 1');
            const dbDuration = Date.now() - dbStart;
            checks.checks.database = { status: dbDuration < 1000 ? 'healthy' : 'degraded', responseTime: dbDuration };
        } catch (error: any) {
            checks.checks.database = { status: 'unhealthy', error: error.message };
            checks.status = 'unhealthy';
        }

        const memUsage = 1 - (os.freemem() / os.totalmem());
        checks.checks.memory = { status: memUsage < this.alertConfig.memoryThreshold ? 'healthy' : 'degraded', usage: (memUsage * 100).toFixed(2) + '%' };

        const errorRate = this.metrics.requests.total > 0 ? this.metrics.requests.errors / this.metrics.requests.total : 0;
        checks.checks.errorRate = { status: errorRate < this.alertConfig.errorRateThreshold ? 'healthy' : 'degraded', rate: (errorRate * 100).toFixed(2) + '%' };

        return checks;
    }

    private checkAlerts(): void {
        if (this.metrics.requests.total > 100) {
            const errorRate = this.metrics.requests.errors / this.metrics.requests.total;
            if (errorRate >= this.alertConfig.errorRateThreshold) {
                this.createAlert('high_error_rate', 'critical', { rate: errorRate, threshold: this.alertConfig.errorRateThreshold });
            }
        }

        if (this.metrics.performance.avgResponseTime > this.alertConfig.avgResponseTimeThreshold) {
            this.createAlert('slow_response_time', 'warning', { avgTime: this.metrics.performance.avgResponseTime, threshold: this.alertConfig.avgResponseTimeThreshold });
        }

        const memUsage = 1 - (os.freemem() / os.totalmem());
        if (memUsage >= this.alertConfig.memoryThreshold) {
            this.createAlert('high_memory_usage', 'warning', { usage: memUsage, threshold: this.alertConfig.memoryThreshold });
        }
    }

    private createAlert(type: string, severity: 'warning' | 'critical', data: Record<string, any>): Alert | undefined {
        const recentAlert = this.activeAlerts.find(a => a.type === type && (Date.now() - new Date(a.timestamp).getTime()) < 300000);
        if (recentAlert) return;

        const alert: Alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity,
            data,
            timestamp: new Date().toISOString(),
            acknowledged: false
        };

        this.activeAlerts.push(alert);
        devLogger.warn(`[MONITORING ALERT] ${severity.toUpperCase()}: ${type}`, data);

        if (this.activeAlerts.length > 50) {
            this.activeAlerts.shift();
        }

        return alert;
    }

    getDashboard(): any {
        const system = this.getSystemMetrics();
        const errorRate = this.metrics.requests.total > 0 ? this.metrics.requests.errors / this.metrics.requests.total : 0;

        return {
            overview: { status: errorRate < 0.05 ? 'healthy' : 'degraded', uptime: Math.floor((Date.now() - this.metrics.uptime) / 1000), requests: this.metrics.requests.total, errorRate: (errorRate * 100).toFixed(2) + '%' },
            requests: { total: this.metrics.requests.total, success: this.metrics.requests.success, errors: this.metrics.requests.errors, topEndpoints: this.getTopEndpoints(10) },
            performance: { avgResponseTime: this.metrics.performance.avgResponseTime.toFixed(2) + 'ms', slowRequests: this.metrics.performance.slowRequests },
            system: { cpu: (system.cpu.usage * 100).toFixed(2) + '%', memory: (system.memory.usage * 100).toFixed(2) + '%', loadAverage: system.loadAverage },
            alerts: { active: this.activeAlerts.filter(a => !a.acknowledged).length, recent: this.activeAlerts.slice(-10) },
            timestamp: new Date().toISOString()
        };
    }

    getTopEndpoints(limit: number = 10): Array<{ endpoint: string; count: number }> {
        return Array.from(this.metrics.requests.byEndpoint.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([endpoint, count]) => ({ endpoint, count }));
    }

    getHistory(hours: number = 24): any[] {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.metricsHistory.filter(m => new Date(m.timestamp).getTime() > cutoff);
    }

    getRecentErrors(limit: number = 20): ErrorRecord[] {
        return this.metrics.errors.slice(-limit).reverse();
    }

    acknowledgeAlert(alertId: string): boolean {
        const alert = this.activeAlerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    reset(): void {
        this.metrics = {
            requests: { total: 0, success: 0, errors: 0, byEndpoint: new Map(), byStatusCode: new Map() },
            performance: { avgResponseTime: 0, totalResponseTime: 0, requestCount: 0, slowRequests: 0 },
            errors: [],
            uptime: Date.now()
        };
        this.activeAlerts = [];
        this.metricsHistory = [];
    }

    getPrometheusMetrics(): string {
        const system = this.getSystemMetrics();
        let metrics = '';
        metrics += `# HELP bge_requests_total Total HTTP requests\n# TYPE bge_requests_total counter\nbge_requests_total ${this.metrics.requests.total}\n\n`;
        metrics += `# HELP bge_requests_errors_total Total HTTP errors\n# TYPE bge_requests_errors_total counter\nbge_requests_errors_total ${this.metrics.requests.errors}\n\n`;
        metrics += `# HELP bge_response_time_avg_ms Average response time\n# TYPE bge_response_time_avg_ms gauge\nbge_response_time_avg_ms ${this.metrics.performance.avgResponseTime.toFixed(2)}\n\n`;
        metrics += `# HELP bge_memory_usage_ratio Memory usage ratio\n# TYPE bge_memory_usage_ratio gauge\nbge_memory_usage_ratio ${system.memory.usage.toFixed(4)}\n`;
        return metrics;
    }
}

// ============================================
// EXPORTS
// ============================================

const monitoringService = new MonitoringService();

export { MonitoringService };
export default monitoringService;

module.exports = monitoringService;
module.exports.MonitoringService = MonitoringService;
