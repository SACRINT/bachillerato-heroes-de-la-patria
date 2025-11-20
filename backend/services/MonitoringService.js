/**
 * Servicio de Monitoreo del Sistema
 * BGE Héroes de la Patria
 * FASE 4 - Semana 31-32
 *
 * Monitoreo, métricas, alertas y health checks
 */

const os = require('os');
const pool = require('../data/database-access').pool;

class MonitoringService {
    constructor() {
        // Métricas del sistema
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

        // Configuración de alertas
        this.alertConfig = {
            errorRateThreshold: 0.05, // 5%
            avgResponseTimeThreshold: 1000, // 1 segundo
            memoryThreshold: 0.90, // 90%
            cpuThreshold: 0.80, // 80%
            diskThreshold: 0.85 // 85%
        };

        // Alertas activas
        this.activeAlerts = [];

        // Historial de métricas (últimas 24 horas, cada 5 min)
        this.metricsHistory = [];
        this.maxHistoryLength = 288; // 24h * 12 (cada 5 min)

        // Iniciar recolección de métricas
        this.startMetricsCollection();

        console.log('[MONITORING] Servicio de monitoreo inicializado');
    }

    /**
     * Middleware para tracking de requests
     */
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();

            // Interceptar respuesta
            const originalSend = res.send;
            res.send = (body) => {
                const duration = Date.now() - startTime;
                this.recordRequest(req, res, duration);
                return originalSend.call(res, body);
            };

            next();
        };
    }

    /**
     * Registrar métricas de request
     */
    recordRequest(req, res, duration) {
        this.metrics.requests.total++;

        if (res.statusCode >= 200 && res.statusCode < 400) {
            this.metrics.requests.success++;
        } else {
            this.metrics.requests.errors++;
        }

        // Por endpoint
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        const endpointCount = this.metrics.requests.byEndpoint.get(endpoint) || 0;
        this.metrics.requests.byEndpoint.set(endpoint, endpointCount + 1);

        // Por status code
        const statusCount = this.metrics.requests.byStatusCode.get(res.statusCode) || 0;
        this.metrics.requests.byStatusCode.set(res.statusCode, statusCount + 1);

        // Performance
        this.metrics.performance.totalResponseTime += duration;
        this.metrics.performance.requestCount++;
        this.metrics.performance.avgResponseTime =
            this.metrics.performance.totalResponseTime / this.metrics.performance.requestCount;

        if (duration > 1000) {
            this.metrics.performance.slowRequests++;
        }

        // Verificar alertas
        this.checkAlerts();
    }

    /**
     * Registrar error
     */
    recordError(error, req = null) {
        const errorRecord = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            endpoint: req ? `${req.method} ${req.path}` : null,
            userId: req?.user?.id || null
        };

        this.metrics.errors.push(errorRecord);

        // Mantener solo últimos 100 errores
        if (this.metrics.errors.length > 100) {
            this.metrics.errors.shift();
        }
    }

    /**
     * Iniciar recolección periódica de métricas
     */
    startMetricsCollection() {
        // Cada 5 minutos
        setInterval(() => {
            this.collectSystemMetrics();
        }, 300000);

        // Recolectar inmediatamente
        this.collectSystemMetrics();
    }

    /**
     * Recolectar métricas del sistema
     */
    collectSystemMetrics() {
        const systemMetrics = {
            timestamp: new Date().toISOString(),
            system: this.getSystemMetrics(),
            application: {
                requests: { ...this.metrics.requests },
                performance: { ...this.metrics.performance },
                errorCount: this.metrics.errors.length
            }
        };

        // Convertir Maps a objetos para serialización
        systemMetrics.application.requests.byEndpoint = Object.fromEntries(
            this.metrics.requests.byEndpoint
        );
        systemMetrics.application.requests.byStatusCode = Object.fromEntries(
            this.metrics.requests.byStatusCode
        );

        this.metricsHistory.push(systemMetrics);

        // Limitar historial
        if (this.metricsHistory.length > this.maxHistoryLength) {
            this.metricsHistory.shift();
        }
    }

    /**
     * Obtener métricas del sistema operativo
     */
    getSystemMetrics() {
        const cpus = os.cpus();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        // Calcular uso de CPU
        let totalIdle = 0;
        let totalTick = 0;
        for (const cpu of cpus) {
            for (const type in cpu.times) {
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
            cpu: {
                count: cpus.length,
                model: cpus[0]?.model,
                usage: cpuUsage
            },
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usage: usedMemory / totalMemory
            },
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version
            }
        };
    }

    /**
     * Health check completo
     */
    async healthCheck() {
        const checks = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.metrics.uptime) / 1000),
            checks: {}
        };

        // Check de base de datos
        try {
            const dbStart = Date.now();
            await pool.query('SELECT 1');
            const dbDuration = Date.now() - dbStart;
            checks.checks.database = {
                status: dbDuration < 1000 ? 'healthy' : 'degraded',
                responseTime: dbDuration
            };
        } catch (error) {
            checks.checks.database = {
                status: 'unhealthy',
                error: error.message
            };
            checks.status = 'unhealthy';
        }

        // Check de memoria
        const memUsage = 1 - (os.freemem() / os.totalmem());
        checks.checks.memory = {
            status: memUsage < this.alertConfig.memoryThreshold ? 'healthy' : 'degraded',
            usage: (memUsage * 100).toFixed(2) + '%'
        };
        if (memUsage >= this.alertConfig.memoryThreshold) {
            checks.status = 'degraded';
        }

        // Check de error rate
        const errorRate = this.metrics.requests.total > 0
            ? this.metrics.requests.errors / this.metrics.requests.total
            : 0;
        checks.checks.errorRate = {
            status: errorRate < this.alertConfig.errorRateThreshold ? 'healthy' : 'degraded',
            rate: (errorRate * 100).toFixed(2) + '%'
        };
        if (errorRate >= this.alertConfig.errorRateThreshold) {
            checks.status = 'degraded';
        }

        // Check de response time
        checks.checks.responseTime = {
            status: this.metrics.performance.avgResponseTime < this.alertConfig.avgResponseTimeThreshold ? 'healthy' : 'degraded',
            avg: this.metrics.performance.avgResponseTime.toFixed(2) + 'ms'
        };

        return checks;
    }

    /**
     * Verificar y generar alertas
     */
    checkAlerts() {
        const now = new Date().toISOString();

        // Error rate
        if (this.metrics.requests.total > 100) {
            const errorRate = this.metrics.requests.errors / this.metrics.requests.total;
            if (errorRate >= this.alertConfig.errorRateThreshold) {
                this.createAlert('high_error_rate', 'critical', {
                    rate: errorRate,
                    threshold: this.alertConfig.errorRateThreshold
                });
            }
        }

        // Response time
        if (this.metrics.performance.avgResponseTime > this.alertConfig.avgResponseTimeThreshold) {
            this.createAlert('slow_response_time', 'warning', {
                avgTime: this.metrics.performance.avgResponseTime,
                threshold: this.alertConfig.avgResponseTimeThreshold
            });
        }

        // Memory
        const memUsage = 1 - (os.freemem() / os.totalmem());
        if (memUsage >= this.alertConfig.memoryThreshold) {
            this.createAlert('high_memory_usage', 'warning', {
                usage: memUsage,
                threshold: this.alertConfig.memoryThreshold
            });
        }
    }

    /**
     * Crear alerta
     */
    createAlert(type, severity, data) {
        // Evitar duplicados en los últimos 5 minutos
        const recentAlert = this.activeAlerts.find(
            a => a.type === type && (Date.now() - new Date(a.timestamp).getTime()) < 300000
        );

        if (recentAlert) return;

        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity,
            data,
            timestamp: new Date().toISOString(),
            acknowledged: false
        };

        this.activeAlerts.push(alert);
        console.warn(`[MONITORING ALERT] ${severity.toUpperCase()}: ${type}`, data);

        // Mantener solo últimas 50 alertas
        if (this.activeAlerts.length > 50) {
            this.activeAlerts.shift();
        }

        return alert;
    }

    /**
     * Obtener dashboard de métricas
     */
    getDashboard() {
        const system = this.getSystemMetrics();
        const errorRate = this.metrics.requests.total > 0
            ? this.metrics.requests.errors / this.metrics.requests.total
            : 0;

        return {
            overview: {
                status: errorRate < 0.05 ? 'healthy' : 'degraded',
                uptime: Math.floor((Date.now() - this.metrics.uptime) / 1000),
                requests: this.metrics.requests.total,
                errorRate: (errorRate * 100).toFixed(2) + '%'
            },
            requests: {
                total: this.metrics.requests.total,
                success: this.metrics.requests.success,
                errors: this.metrics.requests.errors,
                topEndpoints: this.getTopEndpoints(10)
            },
            performance: {
                avgResponseTime: this.metrics.performance.avgResponseTime.toFixed(2) + 'ms',
                slowRequests: this.metrics.performance.slowRequests
            },
            system: {
                cpu: (system.cpu.usage * 100).toFixed(2) + '%',
                memory: (system.memory.usage * 100).toFixed(2) + '%',
                loadAverage: system.loadAverage,
                processMemory: system.process.memoryUsage
            },
            alerts: {
                active: this.activeAlerts.filter(a => !a.acknowledged).length,
                recent: this.activeAlerts.slice(-10)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Obtener top endpoints por requests
     */
    getTopEndpoints(limit = 10) {
        return Array.from(this.metrics.requests.byEndpoint.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([endpoint, count]) => ({ endpoint, count }));
    }

    /**
     * Obtener historial de métricas
     */
    getHistory(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.metricsHistory.filter(
            m => new Date(m.timestamp).getTime() > cutoff
        );
    }

    /**
     * Obtener errores recientes
     */
    getRecentErrors(limit = 20) {
        return this.metrics.errors.slice(-limit).reverse();
    }

    /**
     * Reconocer alerta
     */
    acknowledgeAlert(alertId) {
        const alert = this.activeAlerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    /**
     * Resetear métricas
     */
    reset() {
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
        this.activeAlerts = [];
        this.metricsHistory = [];
    }

    /**
     * Exportar métricas en formato Prometheus
     */
    getPrometheusMetrics() {
        const system = this.getSystemMetrics();

        let metrics = '';

        // Request metrics
        metrics += `# HELP bge_requests_total Total HTTP requests\n`;
        metrics += `# TYPE bge_requests_total counter\n`;
        metrics += `bge_requests_total ${this.metrics.requests.total}\n\n`;

        metrics += `# HELP bge_requests_errors_total Total HTTP errors\n`;
        metrics += `# TYPE bge_requests_errors_total counter\n`;
        metrics += `bge_requests_errors_total ${this.metrics.requests.errors}\n\n`;

        // Performance
        metrics += `# HELP bge_response_time_avg_ms Average response time\n`;
        metrics += `# TYPE bge_response_time_avg_ms gauge\n`;
        metrics += `bge_response_time_avg_ms ${this.metrics.performance.avgResponseTime.toFixed(2)}\n\n`;

        metrics += `# HELP bge_slow_requests_total Total slow requests\n`;
        metrics += `# TYPE bge_slow_requests_total counter\n`;
        metrics += `bge_slow_requests_total ${this.metrics.performance.slowRequests}\n\n`;

        // System
        metrics += `# HELP bge_memory_usage_ratio Memory usage ratio\n`;
        metrics += `# TYPE bge_memory_usage_ratio gauge\n`;
        metrics += `bge_memory_usage_ratio ${system.memory.usage.toFixed(4)}\n\n`;

        metrics += `# HELP bge_cpu_usage_ratio CPU usage ratio\n`;
        metrics += `# TYPE bge_cpu_usage_ratio gauge\n`;
        metrics += `bge_cpu_usage_ratio ${system.cpu.usage.toFixed(4)}\n\n`;

        metrics += `# HELP bge_uptime_seconds Application uptime in seconds\n`;
        metrics += `# TYPE bge_uptime_seconds counter\n`;
        metrics += `bge_uptime_seconds ${Math.floor((Date.now() - this.metrics.uptime) / 1000)}\n\n`;

        // Alerts
        metrics += `# HELP bge_active_alerts Active alerts count\n`;
        metrics += `# TYPE bge_active_alerts gauge\n`;
        metrics += `bge_active_alerts ${this.activeAlerts.filter(a => !a.acknowledged).length}\n\n`;

        return metrics;
    }
}

module.exports = new MonitoringService();
