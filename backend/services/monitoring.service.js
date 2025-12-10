"use strict";
/**
 * 📊 MONITORING SERVICE - TypeScript Version
 * Servicio de Monitoreo del Sistema BGE
 * Monitoreo, métricas, alertas y health checks
 * Refactorizado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const os_1 = __importDefault(require("os"));
const pool = require('../data/database-access').pool;
const devLogger = require('../utils/devLogger');
// ============================================
// MONITORING SERVICE CLASS
// ============================================
class MonitoringService {
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
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const originalSend = res.send.bind(res);
            res.send = (body) => {
                const duration = Date.now() - startTime;
                this.recordRequest(req, res, duration);
                return originalSend(body);
            };
            next();
        };
    }
    recordRequest(req, res, duration) {
        this.metrics.requests.total++;
        if (res.statusCode >= 200 && res.statusCode < 400) {
            this.metrics.requests.success++;
        }
        else {
            this.metrics.requests.errors++;
        }
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
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
    recordError(error, req) {
        const errorRecord = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            endpoint: req ? `${req.method} ${req.path}` : null,
            userId: req?.user?.id || null
        };
        this.metrics.errors.push(errorRecord);
        if (this.metrics.errors.length > 100) {
            this.metrics.errors.shift();
        }
    }
    startMetricsCollection() {
        setInterval(() => this.collectSystemMetrics(), 300000);
        this.collectSystemMetrics();
    }
    collectSystemMetrics() {
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
    getSystemMetrics() {
        const cpus = os_1.default.cpus();
        const totalMemory = os_1.default.totalmem();
        const freeMemory = os_1.default.freemem();
        const usedMemory = totalMemory - freeMemory;
        let totalIdle = 0;
        let totalTick = 0;
        for (const cpu of cpus) {
            for (const type of Object.keys(cpu.times)) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        const cpuUsage = 1 - (totalIdle / totalTick);
        return {
            platform: os_1.default.platform(),
            arch: os_1.default.arch(),
            hostname: os_1.default.hostname(),
            uptime: os_1.default.uptime(),
            loadAverage: os_1.default.loadavg(),
            cpu: { count: cpus.length, model: cpus[0]?.model || 'unknown', usage: cpuUsage },
            memory: { total: totalMemory, used: usedMemory, free: freeMemory, usage: usedMemory / totalMemory },
            process: { pid: process.pid, uptime: process.uptime(), memoryUsage: process.memoryUsage(), nodeVersion: process.version }
        };
    }
    async healthCheck() {
        const checks = {
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
        }
        catch (error) {
            checks.checks.database = { status: 'unhealthy', error: error.message };
            checks.status = 'unhealthy';
        }
        const memUsage = 1 - (os_1.default.freemem() / os_1.default.totalmem());
        checks.checks.memory = { status: memUsage < this.alertConfig.memoryThreshold ? 'healthy' : 'degraded', usage: (memUsage * 100).toFixed(2) + '%' };
        const errorRate = this.metrics.requests.total > 0 ? this.metrics.requests.errors / this.metrics.requests.total : 0;
        checks.checks.errorRate = { status: errorRate < this.alertConfig.errorRateThreshold ? 'healthy' : 'degraded', rate: (errorRate * 100).toFixed(2) + '%' };
        return checks;
    }
    checkAlerts() {
        if (this.metrics.requests.total > 100) {
            const errorRate = this.metrics.requests.errors / this.metrics.requests.total;
            if (errorRate >= this.alertConfig.errorRateThreshold) {
                this.createAlert('high_error_rate', 'critical', { rate: errorRate, threshold: this.alertConfig.errorRateThreshold });
            }
        }
        if (this.metrics.performance.avgResponseTime > this.alertConfig.avgResponseTimeThreshold) {
            this.createAlert('slow_response_time', 'warning', { avgTime: this.metrics.performance.avgResponseTime, threshold: this.alertConfig.avgResponseTimeThreshold });
        }
        const memUsage = 1 - (os_1.default.freemem() / os_1.default.totalmem());
        if (memUsage >= this.alertConfig.memoryThreshold) {
            this.createAlert('high_memory_usage', 'warning', { usage: memUsage, threshold: this.alertConfig.memoryThreshold });
        }
    }
    createAlert(type, severity, data) {
        const recentAlert = this.activeAlerts.find(a => a.type === type && (Date.now() - new Date(a.timestamp).getTime()) < 300000);
        if (recentAlert)
            return;
        const alert = {
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
    getDashboard() {
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
    getTopEndpoints(limit = 10) {
        return Array.from(this.metrics.requests.byEndpoint.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([endpoint, count]) => ({ endpoint, count }));
    }
    getHistory(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.metricsHistory.filter(m => new Date(m.timestamp).getTime() > cutoff);
    }
    getRecentErrors(limit = 20) {
        return this.metrics.errors.slice(-limit).reverse();
    }
    acknowledgeAlert(alertId) {
        const alert = this.activeAlerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
            return true;
        }
        return false;
    }
    reset() {
        this.metrics = {
            requests: { total: 0, success: 0, errors: 0, byEndpoint: new Map(), byStatusCode: new Map() },
            performance: { avgResponseTime: 0, totalResponseTime: 0, requestCount: 0, slowRequests: 0 },
            errors: [],
            uptime: Date.now()
        };
        this.activeAlerts = [];
        this.metricsHistory = [];
    }
    getPrometheusMetrics() {
        const system = this.getSystemMetrics();
        let metrics = '';
        metrics += `# HELP bge_requests_total Total HTTP requests\n# TYPE bge_requests_total counter\nbge_requests_total ${this.metrics.requests.total}\n\n`;
        metrics += `# HELP bge_requests_errors_total Total HTTP errors\n# TYPE bge_requests_errors_total counter\nbge_requests_errors_total ${this.metrics.requests.errors}\n\n`;
        metrics += `# HELP bge_response_time_avg_ms Average response time\n# TYPE bge_response_time_avg_ms gauge\nbge_response_time_avg_ms ${this.metrics.performance.avgResponseTime.toFixed(2)}\n\n`;
        metrics += `# HELP bge_memory_usage_ratio Memory usage ratio\n# TYPE bge_memory_usage_ratio gauge\nbge_memory_usage_ratio ${system.memory.usage.toFixed(4)}\n`;
        return metrics;
    }
}
exports.MonitoringService = MonitoringService;
// ============================================
// EXPORTS
// ============================================
const monitoringService = new MonitoringService();
exports.default = monitoringService;
module.exports = monitoringService;
module.exports.MonitoringService = MonitoringService;
//# sourceMappingURL=monitoring.service.js.map